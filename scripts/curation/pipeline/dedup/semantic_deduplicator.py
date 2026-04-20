"""Semantic deduplication engine for curated routes (QUAL-001)."""

from __future__ import annotations

import argparse
import json
import logging
import time
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from uuid import uuid4

import requests
from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)


@dataclass
class DedupCostLedger:
    """Execution and decision summary for a deduplication run."""

    total_routes: int = 0
    auto_merged: int = 0
    queued_arbitration: int = 0
    separated: int = 0
    wall_seconds: float = 0.0
    started_at: str = ""
    finished_at: str = ""
    errors: list[str] = field(default_factory=list)


class SemanticDeduplicator:
    """Deduplicate curated routes using semantic similarity thresholds."""

    MERGE_THRESHOLD = 0.92
    ARBITRATION_FLOOR = 0.75
    CALIBRATION_MIN_POSITIVES = 50
    CALIBRATION_MIN_NEGATIVES = 50
    SOURCE_PRIORITY = {
        "fhwa": 6,
        "scenic byways": 5,
        "rider mag": 4,
        "motorcycleroads": 3,
        "bbr": 2,
        "curvature_discovery": 1,
    }

    def __init__(
        self,
        *,
        base_url: str,
        deploy_key: str,
        arbitration_output_path: Path | str = Path("scripts/curation/data/arbitration/arbitration_queue.json"),
        calibration_output_path: Path | str = Path("scripts/curation/data/calibration/dedup_calibration_set.json"),
        run_id: str | None = None,
        timeout_seconds: int = 30,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.deploy_key = deploy_key
        self.timeout_seconds = timeout_seconds
        self.run_id = run_id or f"dedup-{uuid4()}"
        self.arbitration_output_path = Path(arbitration_output_path)
        self.calibration_output_path = Path(calibration_output_path)

        self.cost_ledger = DedupCostLedger(started_at=_utc_now_iso())
        self.merged_route_ids: set[str] = set()
        self.arbitration_queue: list[dict[str, Any]] = []
        self._calibration_positives: list[dict[str, Any]] = []
        self._calibration_negatives: list[dict[str, Any]] = []

    def run(self, routes: list[Route]) -> DedupCostLedger:
        """Process all routes and classify candidate pairs for merge/arbitration/separate."""
        started = time.monotonic()
        self.cost_ledger.total_routes = len(routes)

        route_by_id = {route.route_id: route for route in routes}
        seen_pairs: set[tuple[str, str]] = set()

        for route in routes:
            if route.route_id in self.merged_route_ids:
                continue

            candidates = self._fetch_candidates(route)
            for candidate in candidates:
                candidate_id = str(candidate.get("routeId", ""))
                if not candidate_id or candidate_id == route.route_id:
                    continue
                if candidate_id in self.merged_route_ids:
                    continue

                pair_key = tuple(sorted((route.route_id, candidate_id)))
                if pair_key in seen_pairs:
                    continue
                seen_pairs.add(pair_key)

                cosine = float(candidate.get("cosineSimilarity", 0.0))
                classification = self._classify_pair(cosine)

                peer = route_by_id.get(candidate_id)
                if peer is None:
                    continue

                pair_record = {
                    "routeId_a": route.route_id,
                    "routeId_b": peer.route_id,
                    "cosineSimilarity": cosine,
                    "name_a": route.name,
                    "name_b": peer.name,
                    "state_a": route.state,
                    "state_b": peer.state,
                    "highway_a": route.highway_number,
                    "highway_b": peer.highway_number,
                    "description_a": route.description,
                    "description_b": peer.description,
                    "candidate_identifiers_a": route.candidate_identifiers,
                    "candidate_identifiers_b": peer.candidate_identifiers,
                }

                if classification == "auto-merge":
                    winner, loser, reasoning = self._merge_routes(route, peer)
                    self._write_route_match(
                        winner_route_id=winner.route_id,
                        cosine_similarity=cosine,
                        match_reasoning=reasoning,
                        is_arbitrated=False,
                        arbitration_notes=None,
                    )
                    self._append_reconciliation_entry(winner)
                    self.merged_route_ids.add(loser.route_id)
                    self.cost_ledger.auto_merged += 1
                    self._calibration_positives.append(
                        {**pair_record, "label": "duplicate", "label_source": "auto_cosine"}
                    )
                elif classification == "arbitration":
                    self.arbitration_queue.append(pair_record)
                    self.cost_ledger.queued_arbitration += 1
                else:
                    self.cost_ledger.separated += 1
                    self._calibration_negatives.append(
                        {**pair_record, "label": "non-duplicate", "label_source": "auto_cosine"}
                    )

        self._write_arbitration_queue()
        self.cost_ledger.finished_at = _utc_now_iso()
        self.cost_ledger.wall_seconds = time.monotonic() - started
        return self.cost_ledger

    def _fetch_candidates(self, route: Route) -> list[dict[str, Any]]:
        """Fetch top-10 nearest neighbors for a route via INF-006."""
        url = f"{self.base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding"

        embedding = route.embedding if route.embedding is not None else [0.0] * 1536
        payload = {
            "args": {
                "embedding": embedding,
                "limit": 10,
                "stateFilter": route.state,
            }
        }
        headers = {
            "Authorization": f"Bearer {self.deploy_key}",
            "Content-Type": "application/json",
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()
        body = response.json()

        value = body.get("value")
        if isinstance(value, dict):
            result = value.get("result")
            if isinstance(result, list):
                return [item for item in result if isinstance(item, dict)]
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
        return []

    def _classify_pair(self, cosine: float) -> str:
        """Classify route pair by cosine similarity."""
        if cosine > self.MERGE_THRESHOLD:
            return "auto-merge"
        if self.ARBITRATION_FLOOR <= cosine <= self.MERGE_THRESHOLD:
            return "arbitration"
        return "separate"

    def _merge_routes(self, route_a: Route, route_b: Route) -> tuple[Route, Route, str]:
        """Choose winner by source priority and return merge reasoning."""
        rank_a = self.SOURCE_PRIORITY.get(route_a.source.lower(), 0)
        rank_b = self.SOURCE_PRIORITY.get(route_b.source.lower(), 0)
        if rank_b > rank_a:
            winner, loser = route_b, route_a
        else:
            winner, loser = route_a, route_b

        reasoning = (
            f"source_priority: winner={winner.source}({self.SOURCE_PRIORITY.get(winner.source.lower(), 0)}) "
            f"loser={loser.source}({self.SOURCE_PRIORITY.get(loser.source.lower(), 0)})"
        )
        return winner, loser, reasoning

    def emit_calibration_set(self) -> None:
        """Write calibration dataset for threshold tuning."""
        meets_minimum = (
            len(self._calibration_positives) >= self.CALIBRATION_MIN_POSITIVES
            and len(self._calibration_negatives) >= self.CALIBRATION_MIN_NEGATIVES
        )
        if not meets_minimum:
            logger.warning(
                "calibration set below minimum: %d/%d positives, %d/%d negatives",
                len(self._calibration_positives),
                self.CALIBRATION_MIN_POSITIVES,
                len(self._calibration_negatives),
                self.CALIBRATION_MIN_NEGATIVES,
            )
        payload = {
            "runId": self.run_id,
            "generatedAt": _utc_now_iso(),
            "metadata": {
                "min_positives": self.CALIBRATION_MIN_POSITIVES,
                "min_negatives": self.CALIBRATION_MIN_NEGATIVES,
                "meets_minimum": meets_minimum,
            },
            "positives": self._calibration_positives,
            "negatives": self._calibration_negatives,
        }
        self.calibration_output_path.parent.mkdir(parents=True, exist_ok=True)
        self.calibration_output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def _write_arbitration_queue(self) -> None:
        self.arbitration_output_path.parent.mkdir(parents=True, exist_ok=True)
        self.arbitration_output_path.write_text(json.dumps(self.arbitration_queue, indent=2), encoding="utf-8")

    def _write_route_match(
        self,
        *,
        winner_route_id: str,
        cosine_similarity: float,
        match_reasoning: str,
        is_arbitrated: bool,
        arbitration_notes: str | None,
    ) -> None:
        """Write route match audit row using INF-006 addRouteMatch."""
        url = f"{self.base_url}/api/run/semanticSearch:addRouteMatch"
        headers = {
            "Authorization": f"Bearer {self.deploy_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "args": {
                "matchId": str(uuid4()),
                "postId": f"dedup:{self.run_id}",
                "routeId": winner_route_id,
                "matchConfidence": "high",
                "cosineSimilarity": cosine_similarity,
                "matchReasoning": match_reasoning,
                "rerankModel": "semantic-threshold",
                "rerankCost": 0.0,
                "matchedAt": int(time.time() * 1000),
                "isArbitrated": is_arbitrated,
                "arbitrationNotes": arbitration_notes,
            }
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=self.timeout_seconds,
        )
        response.raise_for_status()

    def _append_reconciliation_entry(self, winner: Route) -> None:
        winner.llm_reconciliation_log.append(
            {
                "runId": self.run_id,
                "reconciledAt": _utc_now_iso(),
                "conflictsResolved": 1,
                "notes": "source_priority semantic dedup merge",
            }
        )


def fetch_all_routes(base_url: str, deploy_key: str, limit: int | None = None) -> list[Route]:
    """Fetch curated routes for deduplication.

    Returns an empty list when no fetch adapter is configured.
    """
    _ = (base_url, deploy_key, limit)
    return []


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run semantic deduplication")
    parser.add_argument("--base-url", required=True, help="Convex deployment URL")
    parser.add_argument("--deploy-key", required=True, help="Convex deploy key")
    parser.add_argument("--limit", type=int, default=None, help="Optional route limit")
    return parser.parse_args(argv)


def main(
    argv: list[str] | None = None,
    *,
    arbitration_output_path: Path | str = Path("scripts/curation/data/arbitration/arbitration_queue.json"),
    calibration_output_path: Path | str = Path("scripts/curation/data/calibration/dedup_calibration_set.json"),
) -> int:
    logging.basicConfig(level=logging.INFO)
    args = parse_args(argv)

    started = time.monotonic()
    routes = fetch_all_routes(args.base_url, args.deploy_key, args.limit)

    deduplicator = SemanticDeduplicator(
        base_url=args.base_url,
        deploy_key=args.deploy_key,
        arbitration_output_path=arbitration_output_path,
        calibration_output_path=calibration_output_path,
    )
    deduplicator.run(routes)
    deduplicator.emit_calibration_set()

    elapsed = time.monotonic() - started
    if elapsed > 900:
        logger.warning("runtime budget exceeded: %.1fs > 900s", elapsed)

    return 0


def _utc_now_iso() -> str:
    return datetime.now(UTC).isoformat()


if __name__ == "__main__":
    raise SystemExit(main())
