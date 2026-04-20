"""Tests for QUAL-001 semantic deduplication engine."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
import responses

from scripts.curation.pipeline.dedup.semantic_deduplicator import (
    SemanticDeduplicator,
    main,
)
from scripts.curation.pipeline.models import Route


@pytest.fixture
def output_paths(tmp_path: Path) -> tuple[Path, Path]:
    arbitration_path = tmp_path / "arbitration_queue.json"
    calibration_path = tmp_path / "dedup_calibration_set.json"
    return arbitration_path, calibration_path


def _route(route_id: str, name: str, source: str, *, state: str = "TN", highway_number: str = "US-129") -> Route:
    route = Route(
        route_id=route_id,
        name=name,
        state=state,
        source=source,
        centroid_lat=35.5,
        centroid_lng=-83.5,
        highway_number=highway_number,
        description=f"Description for {name}",
        candidate_identifiers=[name, highway_number],
    )
    route.embedding = [0.0] * 1536
    return route


def _mock_candidate_response(
    route_id: str,
    neighbors: list[dict[str, object]],
) -> dict[str, object]:
    return {
        "status": "success",
        "value": {
            "result": [
                {
                    "routeId": item["routeId"],
                    "cosineSimilarity": item["cosineSimilarity"],
                    "name": item.get("name", "Unknown"),
                    "state": item.get("state", "TN"),
                    "candidateIdentifiers": item.get("candidateIdentifiers", []),
                }
                for item in neighbors
            ],
            "forRoute": route_id,
        },
    }


@responses.activate
def test_auto_merge_above_threshold(output_paths: tuple[Path, Path]) -> None:
    """AC-1: cosine > 0.92 auto-merges and writes audit log."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"
    routes = [
        _route("route-a", "Cherohala Skyway", "BBR"),
        _route("route-b", "Cherohala Skyway TN", "FHWA"),
    ]

    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding",
        json=_mock_candidate_response(
            "route-a",
            [
                {
                    "routeId": "route-b",
                    "cosineSimilarity": 0.95,
                    "name": "Cherohala Skyway TN",
                    "state": "TN",
                    "candidateIdentifiers": ["Cherohala", "TN-165"],
                }
            ],
        ),
        status=200,
    )
    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding",
        json=_mock_candidate_response("route-b", []),
        status=200,
    )
    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:addRouteMatch",
        json={"status": "success", "value": "match-doc-id"},
        status=200,
    )

    deduplicator = SemanticDeduplicator(
        base_url=base_url,
        deploy_key="test-key",
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
        run_id="run-qual-001",
    )

    ledger = deduplicator.run(routes)

    assert ledger.auto_merged == 1
    assert "route-a" in deduplicator.merged_route_ids
    assert len(routes[1].llm_reconciliation_log) == 1
    entry = routes[1].llm_reconciliation_log[0]
    assert entry["runId"] == "run-qual-001"
    assert entry["conflictsResolved"] == 1

    add_match_calls = [
        call for call in responses.calls if call.request.url.endswith("semanticSearch:addRouteMatch")
    ]
    assert len(add_match_calls) == 1

    request_payload = json.loads(add_match_calls[0].request.body.decode("utf-8"))
    args = request_payload["args"]
    assert args["cosineSimilarity"] == 0.95
    assert args["matchConfidence"] == "high"
    assert args["isArbitrated"] is False


@responses.activate
def test_arbitration_queue_mid_range(output_paths: tuple[Path, Path]) -> None:
    """AC-2: cosine in [0.75, 0.92] queues arbitration and does not merge."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"
    routes = [
        _route("route-a", "Blue Ridge South", "motorcycleroads"),
        _route("route-b", "Blue Ridge South Alt", "BBR"),
    ]

    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding",
        json=_mock_candidate_response(
            "route-a",
            [
                {
                    "routeId": "route-b",
                    "cosineSimilarity": 0.83,
                    "name": "Blue Ridge South Alt",
                    "state": "NC",
                    "candidateIdentifiers": ["BRP South"],
                }
            ],
        ),
        status=200,
    )
    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding",
        json=_mock_candidate_response("route-b", []),
        status=200,
    )

    deduplicator = SemanticDeduplicator(
        base_url=base_url,
        deploy_key="test-key",
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
        run_id="run-qual-001",
    )

    ledger = deduplicator.run(routes)

    assert ledger.queued_arbitration == 1
    assert arbitration_path.exists()

    queue = json.loads(arbitration_path.read_text())
    assert len(queue) == 1
    assert queue[0]["routeId_a"] == "route-a"
    assert queue[0]["routeId_b"] == "route-b"
    assert queue[0]["cosineSimilarity"] == 0.83

    add_match_calls = [
        call for call in responses.calls if call.request.url.endswith("semanticSearch:addRouteMatch")
    ]
    assert add_match_calls == []
    assert routes[0].llm_reconciliation_log == []
    assert routes[1].llm_reconciliation_log == []


def test_threshold_boundary_at_092() -> None:
    """AC-3: 0.92 is arbitration, 0.921 is auto-merge."""
    deduplicator = SemanticDeduplicator(
        base_url="https://example.convex.site",
        deploy_key="test-key",
    )

    assert deduplicator._classify_pair(0.92) == "arbitration"
    assert deduplicator._classify_pair(0.921) == "auto-merge"


@responses.activate
def test_source_priority_fhwa_over_bbr(output_paths: tuple[Path, Path]) -> None:
    """AC-4: FHWA outranks BBR in merge winner selection."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"
    route_a = _route("route-a", "Dragon Legacy", "BBR")
    route_b = _route("route-b", "Dragon Official", "FHWA")

    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:addRouteMatch",
        json={"status": "success", "value": "match-doc-id"},
        status=200,
    )

    deduplicator = SemanticDeduplicator(
        base_url=base_url,
        deploy_key="test-key",
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
        run_id="run-qual-001",
    )

    winner, loser, reasoning = deduplicator._merge_routes(route_a, route_b)

    assert winner.route_id == "route-b"
    assert loser.route_id == "route-a"
    assert "source_priority" in reasoning


@responses.activate
def test_calibration_set_emitted(output_paths: tuple[Path, Path]) -> None:
    """AC-5: calibration set contains expected positive/negative pairs."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"
    routes = [
        _route("r1", "Route 1", "FHWA"),
        _route("r2", "Route 2", "BBR"),
        _route("r3", "Route 3", "Scenic Byways"),
        _route("r4", "Route 4", "motorcycleroads"),
        _route("r5", "Route 5", "Rider Mag"),
        _route("r6", "Route 6", "BBR"),
        _route("r7", "Route 7", "FHWA"),
        _route("r8", "Route 8", "curvature_discovery"),
        _route("r9", "Route 9", "FHWA"),
        _route("r10", "Route 10", "BBR"),
    ]

    # Expected call order after merges: r1, r3, r5, r7, r9, r10.
    response_sequence = [
        _mock_candidate_response(
            "r1",
            [
                {"routeId": "r2", "cosineSimilarity": 0.95},
                {"routeId": "r9", "cosineSimilarity": 0.70},
            ],
        ),
        _mock_candidate_response(
            "r3",
            [
                {"routeId": "r4", "cosineSimilarity": 0.93},
                {"routeId": "r10", "cosineSimilarity": 0.65},
            ],
        ),
        _mock_candidate_response(
            "r5",
            [
                {"routeId": "r6", "cosineSimilarity": 0.96},
                {"routeId": "r9", "cosineSimilarity": 0.69},
            ],
        ),
        _mock_candidate_response(
            "r7",
            [
                {"routeId": "r8", "cosineSimilarity": 0.94},
                {"routeId": "r10", "cosineSimilarity": 0.72},
            ],
        ),
        _mock_candidate_response("r9", []),
        _mock_candidate_response("r10", []),
    ]

    for payload in response_sequence:
        responses.add(
            responses.POST,
            f"{base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding",
            json=payload,
            status=200,
        )

    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:addRouteMatch",
        json={"status": "success", "value": "match-doc-id"},
        status=200,
    )
    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:addRouteMatch",
        json={"status": "success", "value": "match-doc-id"},
        status=200,
    )
    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:addRouteMatch",
        json={"status": "success", "value": "match-doc-id"},
        status=200,
    )
    responses.add(
        responses.POST,
        f"{base_url}/api/run/semanticSearch:addRouteMatch",
        json={"status": "success", "value": "match-doc-id"},
        status=200,
    )

    deduplicator = SemanticDeduplicator(
        base_url=base_url,
        deploy_key="test-key",
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
        run_id="run-qual-001",
    )

    deduplicator.run(routes)
    deduplicator.emit_calibration_set()

    assert calibration_path.exists()
    payload = json.loads(calibration_path.read_text())
    assert len(payload["positives"]) == 4
    assert len(payload["negatives"]) == 4


@responses.activate
def test_runtime_budget_warning(output_paths: tuple[Path, Path], caplog: pytest.LogCaptureFixture, monkeypatch: pytest.MonkeyPatch) -> None:
    """AC-6: main emits runtime budget warning when elapsed time exceeds 15 minutes."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"
    routes = [_route(f"r{i}", f"Route {i}", "FHWA") for i in range(100)]

    for route in routes:
        responses.add(
            responses.POST,
            f"{base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding",
            json=_mock_candidate_response(route.route_id, []),
            status=200,
        )

    monkeypatch.setattr(
        "scripts.curation.pipeline.dedup.semantic_deduplicator.fetch_all_routes",
        lambda *_args, **_kwargs: routes,
    )

    caplog.set_level("WARNING")
    time_points = [0.0, 1.0, 2.0, 901.0]
    monkeypatch.setattr(
        "scripts.curation.pipeline.dedup.semantic_deduplicator.time.monotonic",
        lambda: time_points.pop(0),
    )

    exit_code = main(
        argv=["--base-url", base_url, "--deploy-key", "test-key"],
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
    )

    assert exit_code == 0
    assert "runtime budget exceeded" in caplog.text
