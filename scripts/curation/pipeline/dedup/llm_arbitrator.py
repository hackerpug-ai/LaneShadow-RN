"""LLM arbitration batch runner for semantic dedup queue (QUAL-002)."""

from __future__ import annotations

import argparse
import json
import logging
import time
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

import requests

try:
    import anthropic
except ImportError:  # pragma: no cover - exercised only when dependency missing
    class _MissingAnthropicModule:
        class Anthropic:  # type: ignore[no-redef]
            def __init__(self, *_args: Any, **_kwargs: Any) -> None:
                raise ImportError("anthropic package is required for LLM arbitration")

    anthropic = _MissingAnthropicModule()  # type: ignore[assignment]

from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)


@dataclass
class ArbitrationCostLedger:
    """Execution and cost summary for one arbitration batch run."""

    run_id: str
    model: str
    pairs_processed: int = 0
    input_tokens: int = 0
    output_tokens: int = 0
    cost_usd: float = 0.0
    started_at: str = ""
    finished_at: str = ""
    wall_seconds: float = 0.0


class LLMArbitrator:
    """Consume arbitration queue and write LLM-confirmed route matches."""

    MODEL = "claude-haiku-4-5-20251001"
    SOURCE_PRIORITY = {
        "fhwa": 6,
        "scenic byways": 5,
        "rider mag": 4,
        "motorcycleroads": 3,
        "bbr": 2,
        "curvature discovery": 1,
        "curvature_discovery": 1,
    }

    def __init__(
        self,
        *,
        base_url: str,
        deploy_key: str,
        anthropic_api_key: str,
        arbitration_queue_path: Path | str = Path("scripts/curation/data/arbitration/arbitration_queue.json"),
        arbitration_cost_ledger_path: Path | str = Path(
            "scripts/curation/data/ledger/arbitration_cost_ledger.jsonl"
        ),
        arbitration_error_queue_path: Path | str = Path(
            "scripts/curation/data/arbitration/arbitration_error_queue.jsonl"
        ),
        run_id: str | None = None,
        timeout_seconds: int = 30,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.deploy_key = deploy_key
        self.timeout_seconds = timeout_seconds
        self.run_id = run_id or f"arbitration-{uuid4()}"
        self.arbitration_queue_path = Path(arbitration_queue_path)
        self.arbitration_cost_ledger_path = Path(arbitration_cost_ledger_path)
        self.arbitration_error_queue_path = Path(arbitration_error_queue_path)
        self.client = anthropic.Anthropic(api_key=anthropic_api_key)
        self.cost_ledger = ArbitrationCostLedger(
            run_id=self.run_id,
            model=self.MODEL,
            started_at=_utc_now_iso(),
        )

    def run(self, *, routes_by_id: dict[str, Route] | None = None) -> ArbitrationCostLedger:
        """Process each arbitration pair with LLM-backed same-road decisioning."""
        started = time.monotonic()
        routes_by_id = routes_by_id or {}
        queue = self._load_arbitration_queue()

        for pair in queue:
            self.cost_ledger.pairs_processed += 1
            prompt = self._build_prompt(pair)
            decision, reasoning, input_tokens, output_tokens = self._arbitrate_pair(prompt)

            self.cost_ledger.input_tokens += input_tokens
            self.cost_ledger.output_tokens += output_tokens

            pair_cost = self._calculate_cost_usd(input_tokens=input_tokens, output_tokens=output_tokens)
            if decision == "YES":
                winner_route_id, loser_route_id, merge_reasoning = self._merge_routes(pair, routes_by_id)
                match_reasoning = f"{merge_reasoning}; llm_decision=YES"
                self._write_route_match(
                    winner_route_id=winner_route_id,
                    cosine_similarity=float(pair.get("cosineSimilarity", 0.0)),
                    match_reasoning=match_reasoning,
                    arbitration_notes=reasoning,
                    rerank_cost=pair_cost,
                )
                self._append_reconciliation_entry(
                    routes_by_id=routes_by_id,
                    winner_route_id=winner_route_id,
                    loser_route_id=loser_route_id,
                    notes=reasoning,
                )
            elif decision == "UNCERTAIN":
                self._append_error_queue(pair=pair, decision=decision, reasoning=reasoning)

        self.cost_ledger.cost_usd = self._calculate_cost_usd(
            input_tokens=self.cost_ledger.input_tokens,
            output_tokens=self.cost_ledger.output_tokens,
        )
        self.cost_ledger.finished_at = _utc_now_iso()
        self.cost_ledger.wall_seconds = time.monotonic() - started
        self._append_cost_ledger()
        return self.cost_ledger

    def _load_arbitration_queue(self) -> list[dict[str, Any]]:
        if not self.arbitration_queue_path.exists():
            return []
        raw = self.arbitration_queue_path.read_text(encoding="utf-8").strip()
        if not raw:
            return []

        parsed = json.loads(raw)
        if isinstance(parsed, list):
            return [item for item in parsed if isinstance(item, dict)]
        return []

    def _build_prompt(self, pair: dict[str, Any]) -> str:
        """Build same-road arbitration prompt with route metadata for both candidates."""
        return (
            "You are adjudicating whether two route records represent the same physical road. "
            "Respond ONLY as strict JSON with keys decision and reasoning. "
            "decision must be one of YES, NO, UNCERTAIN.\n\n"
            "Route A:\n"
            f"- name: {pair.get('name_a', '')}\n"
            f"- state: {pair.get('state_a', '')}\n"
            f"- highway: {pair.get('highway_a', '')}\n"
            f"- description: {pair.get('description_a', '')}\n"
            f"- candidate_identifiers: {json.dumps(pair.get('candidate_identifiers_a', []))}\n\n"
            "Route B:\n"
            f"- name: {pair.get('name_b', '')}\n"
            f"- state: {pair.get('state_b', '')}\n"
            f"- highway: {pair.get('highway_b', '')}\n"
            f"- description: {pair.get('description_b', '')}\n"
            f"- candidate_identifiers: {json.dumps(pair.get('candidate_identifiers_b', []))}\n\n"
            f"Cosine similarity: {pair.get('cosineSimilarity', 0.0)}\n"
        )

    def _arbitrate_pair(self, prompt: str) -> tuple[str, str, int, int]:
        response = self.client.messages.create(
            model=self.MODEL,
            temperature=0,
            max_tokens=256,
            messages=[{"role": "user", "content": prompt}],
        )

        content = getattr(response, "content", [])
        response_text = ""
        if isinstance(content, list):
            chunks: list[str] = []
            for block in content:
                text = getattr(block, "text", None)
                if isinstance(text, str):
                    chunks.append(text)
            response_text = "\n".join(chunks)

        decision, reasoning = self._parse_decision(response_text)

        usage = getattr(response, "usage", None)
        input_tokens = int(getattr(usage, "input_tokens", 0) or 0)
        output_tokens = int(getattr(usage, "output_tokens", 0) or 0)

        return decision, reasoning, input_tokens, output_tokens

    def _parse_decision(self, raw_response: str) -> tuple[str, str]:
        """Parse LLM output to normalized decision + reasoning."""
        candidate = raw_response.strip()
        if not candidate:
            return "UNCERTAIN", "Empty LLM response"

        try:
            payload = json.loads(candidate)
            if isinstance(payload, dict):
                raw_decision = str(payload.get("decision", "UNCERTAIN")).upper()
                reasoning = str(payload.get("reasoning", "")).strip() or candidate
                if raw_decision in {"YES", "NO", "UNCERTAIN"}:
                    return raw_decision, reasoning
        except json.JSONDecodeError:
            pass

        normalized = candidate.upper()
        if normalized.startswith("YES"):
            return "YES", candidate
        if normalized.startswith("NO"):
            return "NO", candidate
        return "UNCERTAIN", candidate

    def _merge_routes(
        self,
        pair: dict[str, Any],
        routes_by_id: dict[str, Route],
    ) -> tuple[str, str, str]:
        """Choose winner by source priority (higher rank wins)."""
        route_id_a = str(pair.get("routeId_a", ""))
        route_id_b = str(pair.get("routeId_b", ""))

        source_a = self._resolve_source(pair=pair, route_id=route_id_a, key_name="source_a", routes_by_id=routes_by_id)
        source_b = self._resolve_source(pair=pair, route_id=route_id_b, key_name="source_b", routes_by_id=routes_by_id)

        rank_a = self.SOURCE_PRIORITY.get(self._normalize_source(source_a), 0)
        rank_b = self.SOURCE_PRIORITY.get(self._normalize_source(source_b), 0)

        if rank_b > rank_a:
            winner_route_id, loser_route_id = route_id_b, route_id_a
            winner_source, loser_source = source_b, source_a
            winner_rank, loser_rank = rank_b, rank_a
        else:
            winner_route_id, loser_route_id = route_id_a, route_id_b
            winner_source, loser_source = source_a, source_b
            winner_rank, loser_rank = rank_a, rank_b

        reasoning = (
            f"source_priority: winner={winner_source}({winner_rank}) "
            f"loser={loser_source}({loser_rank})"
        )
        return winner_route_id, loser_route_id, reasoning

    def _resolve_source(
        self,
        *,
        pair: dict[str, Any],
        route_id: str,
        key_name: str,
        routes_by_id: dict[str, Route],
    ) -> str:
        source_from_pair = str(pair.get(key_name, "")).strip()
        if source_from_pair:
            return source_from_pair
        route = routes_by_id.get(route_id)
        return route.source if route is not None else "unknown"

    def _normalize_source(self, source: str) -> str:
        return source.strip().lower().replace("_", " ")

    def _write_route_match(
        self,
        *,
        winner_route_id: str,
        cosine_similarity: float,
        match_reasoning: str,
        arbitration_notes: str,
        rerank_cost: float,
    ) -> None:
        url = f"{self.base_url}/api/run/semanticSearch:addRouteMatch"
        headers = {
            "Authorization": f"Bearer {self.deploy_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "args": {
                "matchId": str(uuid4()),
                "postId": f"arbitration:{self.run_id}",
                "routeId": winner_route_id,
                "matchConfidence": "high",
                "cosineSimilarity": cosine_similarity,
                "matchReasoning": match_reasoning,
                "rerankModel": self.MODEL,
                "rerankCost": rerank_cost,
                "matchedAt": int(time.time() * 1000),
                "isArbitrated": True,
                "arbitrationNotes": arbitration_notes,
            }
        }

        response = requests.post(url, headers=headers, json=payload, timeout=self.timeout_seconds)
        response.raise_for_status()

    def _append_reconciliation_entry(
        self,
        *,
        routes_by_id: dict[str, Route],
        winner_route_id: str,
        loser_route_id: str,
        notes: str,
    ) -> None:
        winner = routes_by_id.get(winner_route_id)
        if winner is None:
            return

        winner.llm_reconciliation_log.append(
            {
                "runId": self.run_id,
                "reconciledAt": _utc_now_iso(),
                "conflictsResolved": 1,
                "loserRouteId": loser_route_id,
                "notes": notes,
            }
        )

    def _append_error_queue(self, *, pair: dict[str, Any], decision: str, reasoning: str) -> None:
        record = {
            "runId": self.run_id,
            "recordedAt": _utc_now_iso(),
            "decision": decision,
            "reasoning": reasoning,
            "pair": pair,
        }
        self.arbitration_error_queue_path.parent.mkdir(parents=True, exist_ok=True)
        with self.arbitration_error_queue_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record) + "\n")

    def _append_cost_ledger(self) -> None:
        self.arbitration_cost_ledger_path.parent.mkdir(parents=True, exist_ok=True)
        entry = {
            "runId": self.cost_ledger.run_id,
            "model": self.cost_ledger.model,
            "pairsProcessed": self.cost_ledger.pairs_processed,
            "inputTokens": self.cost_ledger.input_tokens,
            "outputTokens": self.cost_ledger.output_tokens,
            "costUSD": self.cost_ledger.cost_usd,
            "startedAt": self.cost_ledger.started_at,
            "finishedAt": self.cost_ledger.finished_at,
            "wallSeconds": self.cost_ledger.wall_seconds,
        }
        with self.arbitration_cost_ledger_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry) + "\n")

    def _calculate_cost_usd(self, *, input_tokens: int, output_tokens: int) -> float:
        return (input_tokens * 0.00000025) + (output_tokens * 0.00000125)


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run LLM arbitration over dedup queue")
    parser.add_argument("--base-url", required=True, help="Convex deployment URL")
    parser.add_argument("--deploy-key", required=True, help="Convex deploy key")
    parser.add_argument("--anthropic-api-key", required=True, help="Anthropic API key")
    parser.add_argument(
        "--arbitration-queue-path",
        default="scripts/curation/data/arbitration/arbitration_queue.json",
        help="Path to QUAL-001 arbitration queue JSON",
    )
    parser.add_argument(
        "--cost-ledger-path",
        default="scripts/curation/data/ledger/arbitration_cost_ledger.jsonl",
        help="Path to append arbitration cost ledger JSONL",
    )
    parser.add_argument(
        "--error-queue-path",
        default="scripts/curation/data/arbitration/arbitration_error_queue.jsonl",
        help="Path to append arbitration error queue JSONL",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    logging.basicConfig(level=logging.INFO)
    args = parse_args(argv)

    arbitrator = LLMArbitrator(
        base_url=args.base_url,
        deploy_key=args.deploy_key,
        anthropic_api_key=args.anthropic_api_key,
        arbitration_queue_path=args.arbitration_queue_path,
        arbitration_cost_ledger_path=args.cost_ledger_path,
        arbitration_error_queue_path=args.error_queue_path,
    )
    ledger = arbitrator.run()
    logger.info("LLM arbitration complete: %s", asdict(ledger))
    return 0


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()  # noqa: UP017


if __name__ == "__main__":
    raise SystemExit(main())
