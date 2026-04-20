"""Tests for QUAL-002 LLM arbitration batch runner."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import responses
from scripts.curation.pipeline.dedup.llm_arbitrator import LLMArbitrator
from scripts.curation.pipeline.models import Route

ANTHROPIC_PATCH_TARGET = "scripts.curation.pipeline.dedup.llm_arbitrator.anthropic.Anthropic"


class _FakeAnthropicResponse:
    def __init__(self, *, text: str, input_tokens: int, output_tokens: int) -> None:
        self.content = [type("TextBlock", (), {"text": text})()]
        self.usage = type(
            "Usage",
            (),
            {"input_tokens": input_tokens, "output_tokens": output_tokens},
        )()


class _FakeMessages:
    def __init__(self, responses_to_return: list[_FakeAnthropicResponse]) -> None:
        self._responses = list(responses_to_return)
        self.calls: list[dict[str, Any]] = []

    def create(self, **kwargs: Any) -> _FakeAnthropicResponse:
        self.calls.append(kwargs)
        return self._responses.pop(0)


class _FakeAnthropicClient:
    def __init__(self, responses_to_return: list[_FakeAnthropicResponse]) -> None:
        self.messages = _FakeMessages(responses_to_return)


def _route(route_id: str, source: str) -> Route:
    return Route(
        route_id=route_id,
        name=f"Route {route_id}",
        state="TN",
        source=source,
        centroid_lat=35.5,
        centroid_lng=-83.5,
        description=f"Description for {route_id}",
        highway_number="US-129",
        candidate_identifiers=[f"Route {route_id}", "US-129"],
    )


def _queue_item() -> dict[str, Any]:
    return {
        "routeId_a": "route-a",
        "routeId_b": "route-b",
        "cosineSimilarity": 0.85,
        "name_a": "Cherohala Skyway",
        "name_b": "Cherohala Skyway Tennessee",
        "state_a": "TN",
        "state_b": "TN",
        "highway_a": "TN-165",
        "highway_b": "US-129",
        "description_a": "Scenic mountain corridor",
        "description_b": "Popular motorcycle route",
        "candidate_identifiers_a": ["Cherohala", "TN-165"],
        "candidate_identifiers_b": ["The Dragon", "US-129"],
        "source_a": "BBR",
        "source_b": "FHWA",
    }


@responses.activate
def test_yes_decision_merges_and_writes_route_match(tmp_path: Path, monkeypatch) -> None:
    """AC-1: YES decision writes route match and reconciliation log entry."""
    queue_path = tmp_path / "arbitration_queue.json"
    queue_path.write_text(json.dumps([_queue_item()]), encoding="utf-8")

    ledger_path = tmp_path / "arbitration_cost_ledger.jsonl"
    error_path = tmp_path / "arbitration_error_queue.jsonl"

    fake_client = _FakeAnthropicClient(
        [
            _FakeAnthropicResponse(
                text='{"decision":"YES","reasoning":"Names and state align as same road."}',
                input_tokens=100,
                output_tokens=25,
            )
        ]
    )

    monkeypatch.setattr(ANTHROPIC_PATCH_TARGET, lambda api_key: fake_client)

    base_url = "https://example.convex.site"
    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:addRouteMatch",
        json={"status": "success", "value": "match-id"},
        status=200,
    )

    routes_by_id = {
        "route-a": _route("route-a", "BBR"),
        "route-b": _route("route-b", "FHWA"),
    }

    arbitrator = LLMArbitrator(
        base_url=base_url,
        deploy_key="test-key",
        anthropic_api_key="test-anthropic-key",
        arbitration_queue_path=queue_path,
        arbitration_cost_ledger_path=ledger_path,
        arbitration_error_queue_path=error_path,
        run_id="run-qual-002",
    )

    arbitrator.run(routes_by_id=routes_by_id)

    add_match_calls = [
        call for call in responses.calls if call.request.url.endswith("semanticSearch:addRouteMatch")
    ]
    assert len(add_match_calls) == 1

    request_payload = json.loads(add_match_calls[0].request.body.decode("utf-8"))
    args = request_payload["args"]
    assert args["isArbitrated"] is True
    assert "same road" in args["arbitrationNotes"]
    assert args["rerankModel"] == "claude-haiku-4-5-20251001"

    winner_log = routes_by_id["route-b"].llm_reconciliation_log
    assert len(winner_log) == 1
    assert winner_log[0]["conflictsResolved"] == 1


@responses.activate
def test_no_decision_leaves_routes_unmerged(tmp_path: Path, monkeypatch) -> None:
    """AC-2: NO decision does not write route match and leaves logs unchanged."""
    queue_path = tmp_path / "arbitration_queue.json"
    queue_path.write_text(json.dumps([_queue_item()]), encoding="utf-8")

    fake_client = _FakeAnthropicClient(
        [
            _FakeAnthropicResponse(
                text='{"decision":"NO","reasoning":"Different route names imply distinct roads."}',
                input_tokens=90,
                output_tokens=20,
            )
        ]
    )
    monkeypatch.setattr(ANTHROPIC_PATCH_TARGET, lambda api_key: fake_client)

    routes_by_id = {
        "route-a": _route("route-a", "BBR"),
        "route-b": _route("route-b", "FHWA"),
    }

    arbitrator = LLMArbitrator(
        base_url="https://example.convex.site",
        deploy_key="test-key",
        anthropic_api_key="test-anthropic-key",
        arbitration_queue_path=queue_path,
        arbitration_cost_ledger_path=tmp_path / "arbitration_cost_ledger.jsonl",
        arbitration_error_queue_path=tmp_path / "arbitration_error_queue.jsonl",
        run_id="run-qual-002",
    )

    arbitrator.run(routes_by_id=routes_by_id)

    add_match_calls = [
        call for call in responses.calls if call.request.url.endswith("semanticSearch:addRouteMatch")
    ]
    assert add_match_calls == []
    assert routes_by_id["route-a"].llm_reconciliation_log == []
    assert routes_by_id["route-b"].llm_reconciliation_log == []


def test_empty_queue_exits_cleanly(tmp_path: Path, monkeypatch) -> None:
    """AC-3: Empty queue should skip LLM calls and record zero cost."""
    queue_path = tmp_path / "arbitration_queue.json"
    queue_path.write_text("[]", encoding="utf-8")

    fake_client = _FakeAnthropicClient([])
    monkeypatch.setattr(ANTHROPIC_PATCH_TARGET, lambda api_key: fake_client)

    ledger_path = tmp_path / "arbitration_cost_ledger.jsonl"

    arbitrator = LLMArbitrator(
        base_url="https://example.convex.site",
        deploy_key="test-key",
        anthropic_api_key="test-anthropic-key",
        arbitration_queue_path=queue_path,
        arbitration_cost_ledger_path=ledger_path,
        arbitration_error_queue_path=tmp_path / "arbitration_error_queue.jsonl",
        run_id="run-qual-002",
    )

    ledger = arbitrator.run(routes_by_id={})

    assert ledger.pairs_processed == 0
    assert ledger.cost_usd == 0.0
    assert fake_client.messages.calls == []

    lines = ledger_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    entry = json.loads(lines[0])
    assert entry["pairsProcessed"] == 0
    assert entry["costUSD"] == 0.0


@responses.activate
def test_uncertain_decision_routed_to_error_queue(tmp_path: Path, monkeypatch) -> None:
    """AC-4: UNCERTAIN decision appends pair to arbitration error queue JSONL."""
    queue_path = tmp_path / "arbitration_queue.json"
    queue_path.write_text(json.dumps([_queue_item()]), encoding="utf-8")

    error_path = tmp_path / "arbitration_error_queue.jsonl"

    fake_client = _FakeAnthropicClient(
        [
            _FakeAnthropicResponse(
                text='{"decision":"UNCERTAIN","reasoning":"Insufficient overlap in identifiers."}',
                input_tokens=110,
                output_tokens=30,
            )
        ]
    )
    monkeypatch.setattr(ANTHROPIC_PATCH_TARGET, lambda api_key: fake_client)

    arbitrator = LLMArbitrator(
        base_url="https://example.convex.site",
        deploy_key="test-key",
        anthropic_api_key="test-anthropic-key",
        arbitration_queue_path=queue_path,
        arbitration_cost_ledger_path=tmp_path / "arbitration_cost_ledger.jsonl",
        arbitration_error_queue_path=error_path,
        run_id="run-qual-002",
    )

    arbitrator.run(routes_by_id={
        "route-a": _route("route-a", "BBR"),
        "route-b": _route("route-b", "FHWA"),
    })

    add_match_calls = [
        call for call in responses.calls if call.request.url.endswith("semanticSearch:addRouteMatch")
    ]
    assert add_match_calls == []

    lines = error_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    error_entry = json.loads(lines[0])
    assert error_entry["decision"] == "UNCERTAIN"
    assert error_entry["pair"]["routeId_a"] == "route-a"


def test_per_batch_cost_logged(tmp_path: Path, monkeypatch) -> None:
    """AC-5: Batch ledger writes aggregate tokens and non-zero cost."""
    queue_path = tmp_path / "arbitration_queue.json"
    queue_path.write_text(json.dumps([_queue_item(), _queue_item(), _queue_item()]), encoding="utf-8")

    fake_client = _FakeAnthropicClient(
        [
            _FakeAnthropicResponse(
                text='{"decision":"NO","reasoning":"Not duplicate."}',
                input_tokens=100,
                output_tokens=30,
            ),
            _FakeAnthropicResponse(
                text='{"decision":"NO","reasoning":"Not duplicate."}',
                input_tokens=100,
                output_tokens=30,
            ),
            _FakeAnthropicResponse(
                text='{"decision":"NO","reasoning":"Not duplicate."}',
                input_tokens=100,
                output_tokens=30,
            ),
        ]
    )
    monkeypatch.setattr(ANTHROPIC_PATCH_TARGET, lambda api_key: fake_client)

    ledger_path = tmp_path / "arbitration_cost_ledger.jsonl"

    arbitrator = LLMArbitrator(
        base_url="https://example.convex.site",
        deploy_key="test-key",
        anthropic_api_key="test-anthropic-key",
        arbitration_queue_path=queue_path,
        arbitration_cost_ledger_path=ledger_path,
        arbitration_error_queue_path=tmp_path / "arbitration_error_queue.jsonl",
        run_id="run-qual-002",
    )

    arbitrator.run(routes_by_id={})

    lines = ledger_path.read_text(encoding="utf-8").strip().splitlines()
    assert len(lines) == 1
    entry = json.loads(lines[0])
    assert entry["pairsProcessed"] == 3
    assert entry["inputTokens"] == 300
    assert entry["outputTokens"] == 90
    assert entry["costUSD"] > 0.0
