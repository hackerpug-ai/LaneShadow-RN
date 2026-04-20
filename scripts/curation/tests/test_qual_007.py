"""Tests for QUAL-007 calibration minimum enforcement and label source."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
import responses
from scripts.curation.pipeline.dedup.semantic_deduplicator import SemanticDeduplicator
from scripts.curation.pipeline.models import Route


@pytest.fixture
def output_paths(tmp_path: Path) -> tuple[Path, Path]:
    arbitration_path = tmp_path / "arbitration_queue.json"
    calibration_path = tmp_path / "dedup_calibration_set.json"
    return arbitration_path, calibration_path


def _route(route_id: str, *, source: str = "FHWA", state: str = "TN", highway_number: str = "US-129") -> Route:
    route = Route(
        route_id=route_id,
        name=f"Route {route_id}",
        state=state,
        source=source,
        centroid_lat=35.5,
        centroid_lng=-83.5,
        highway_number=highway_number,
        description=f"Description for {route_id}",
        candidate_identifiers=[route_id, highway_number],
    )
    route.embedding = [0.0] * 1536
    return route


def _mock_candidate_response(route_id: str, neighbors: list[dict[str, object]]) -> dict[str, object]:
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


def _build_routes_and_search_responses(
    *, positives: int, negatives: int
) -> tuple[list[Route], list[dict[str, object]]]:
    routes: list[Route] = []
    search_responses: list[dict[str, object]] = []

    for idx in range(1, positives + 1):
        route_a = f"p{idx}a"
        route_b = f"p{idx}b"
        routes.append(_route(route_a, source="BBR"))
        routes.append(_route(route_b, source="FHWA"))
        search_responses.append(
            _mock_candidate_response(route_a, [{"routeId": route_b, "cosineSimilarity": 0.95}])
        )

    for idx in range(1, negatives + 1):
        route_a = f"n{idx}a"
        route_b = f"n{idx}b"
        routes.append(_route(route_a, source="FHWA"))
        routes.append(_route(route_b, source="BBR"))
        search_responses.append(
            _mock_candidate_response(route_a, [{"routeId": route_b, "cosineSimilarity": 0.70}])
        )
        search_responses.append(_mock_candidate_response(route_b, []))

    return routes, search_responses


def _register_responses(
    *,
    base_url: str,
    search_responses: list[dict[str, object]],
    add_match_calls: int,
) -> None:
    for payload in search_responses:
        responses.add(
            responses.POST,
            f"{base_url}/api/run/semanticSearch:findCandidateRoutesByEmbedding",
            json=payload,
            status=200,
        )

    for _ in range(add_match_calls):
        responses.add(
            responses.POST,
            f"{base_url}/api/run/semanticSearch:addRouteMatch",
            json={"status": "success", "value": "match-doc-id"},
            status=200,
        )


@responses.activate
def test_label_source_in_entries(output_paths: tuple[Path, Path]) -> None:
    """AC1: auto-merged positives include label_source=auto_cosine."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"

    routes, search_responses = _build_routes_and_search_responses(positives=2, negatives=0)
    _register_responses(base_url=base_url, search_responses=search_responses, add_match_calls=2)

    deduplicator = SemanticDeduplicator(
        base_url=base_url,
        deploy_key="test-key",
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
        run_id="run-qual-007-label-source",
    )

    deduplicator.run(routes)
    deduplicator.emit_calibration_set()

    payload = json.loads(calibration_path.read_text())
    assert len(payload["positives"]) == 2
    assert all(entry["label"] == "duplicate" for entry in payload["positives"])
    assert all(entry["label_source"] == "auto_cosine" for entry in payload["positives"])


@responses.activate
def test_warning_on_below_minimum(
    output_paths: tuple[Path, Path], caplog: pytest.LogCaptureFixture
) -> None:
    """AC2: below-minimum calibration set logs warning and still writes file."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"

    routes, search_responses = _build_routes_and_search_responses(positives=10, negatives=8)
    _register_responses(base_url=base_url, search_responses=search_responses, add_match_calls=10)

    deduplicator = SemanticDeduplicator(
        base_url=base_url,
        deploy_key="test-key",
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
        run_id="run-qual-007-below-minimum",
    )

    caplog.set_level("WARNING")
    deduplicator.run(routes)
    deduplicator.emit_calibration_set()

    assert calibration_path.exists()
    payload = json.loads(calibration_path.read_text())
    assert len(payload["positives"]) == 10
    assert len(payload["negatives"]) == 8
    assert payload["metadata"]["meets_minimum"] is False
    assert "calibration set below minimum" in caplog.text


@responses.activate
def test_metadata_meets_minimum(output_paths: tuple[Path, Path], caplog: pytest.LogCaptureFixture) -> None:
    """AC3: meets_minimum is true at/above thresholds and no warning is emitted."""
    arbitration_path, calibration_path = output_paths
    base_url = "https://example.convex.site"

    routes, search_responses = _build_routes_and_search_responses(positives=60, negatives=55)
    _register_responses(base_url=base_url, search_responses=search_responses, add_match_calls=60)

    deduplicator = SemanticDeduplicator(
        base_url=base_url,
        deploy_key="test-key",
        arbitration_output_path=arbitration_path,
        calibration_output_path=calibration_path,
        run_id="run-qual-007-meets-minimum",
    )

    caplog.set_level("WARNING")
    deduplicator.run(routes)
    deduplicator.emit_calibration_set()

    assert calibration_path.exists()
    payload = json.loads(calibration_path.read_text())
    assert len(payload["positives"]) == 60
    assert len(payload["negatives"]) == 55
    assert payload["metadata"]["min_positives"] == 50
    assert payload["metadata"]["min_negatives"] == 50
    assert payload["metadata"]["meets_minimum"] is True
    assert "calibration set below minimum" not in caplog.text
