"""QUAL-008: Test --dry-run flag for side-effect-free benchmarking."""

import json

import pytest
import responses
from scripts.curation.pipeline.dedup.semantic_deduplicator import SemanticDeduplicator, parse_args
from scripts.curation.pipeline.models import Route


@pytest.fixture
def mock_routes():
    """Create mock routes for testing."""
    route1 = Route(
        route_id="route-1",
        name="Test Route 1",
        state="CA",
        source="scenic byways",
        centroid_lat=37.7749,
        centroid_lng=-122.4194,
        highway_number="1",
        description="A scenic route",
        candidate_identifiers=["ca-1"],
        embedding=[0.1] * 1536,
        llm_reconciliation_log=[],
    )
    route2 = Route(
        route_id="route-2",
        name="Test Route 2",
        state="CA",
        source="rider mag",
        centroid_lat=37.7749,
        centroid_lng=-122.4194,
        highway_number="1",
        description="Another scenic route",
        candidate_identifiers=["ca-1-alt"],
        embedding=[0.1] * 1536,
        llm_reconciliation_log=[],
    )
    return [route1, route2]


def test_dry_run_cli_flag():
    """AC4: Verify --dry-run flag sets dry_run=True."""
    args = parse_args(["--base-url", "https://test.com", "--deploy-key", "key", "--dry-run"])
    assert args.dry_run is True


def test_dry_run_skips_route_match(mock_routes):
    """AC1: Verify dry_run=True skips HTTP POST to addRouteMatch."""
    with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
        # Mock the candidate search endpoint (read operation - should be called)
        rsps.add(
            responses.POST,
            "https://test.com/api/run/semanticSearch:findCandidateRoutesByEmbedding",
            json={
                "value": {
                    "result": [
                        {
                            "routeId": "route-2",
                            "cosineSimilarity": 0.95,  # Above merge threshold
                        }
                    ]
                }
            },
            status=200,
        )

        # Mock the addRouteMatch endpoint (write operation - should NOT be called in dry-run)
        rsps.add(
            responses.POST,
            "https://test.com/api/run/semanticSearch:addRouteMatch",
            json={"value": None},
            status=200,
        )

        # Run with dry_run=True
        deduplicator = SemanticDeduplicator(
            base_url="https://test.com",
            deploy_key="test-key",
            dry_run=True,
        )
        deduplicator.run(mock_routes)

        # Verify candidate search was called (read operation)
        assert len(rsps.calls) == 1
        assert "findCandidateRoutesByEmbedding" in rsps.calls[0].request.url

        # Verify addRouteMatch was NOT called (write operation skipped)
        assert not any("addRouteMatch" in call.request.url for call in rsps.calls)


def test_dry_run_skips_arbitration_write(tmp_path, mock_routes):
    """AC2: Verify arbitration queue file is NOT written when dry_run=True."""
    arbitration_path = tmp_path / "arbitration_queue.json"

    with responses.RequestsMock() as rsps:
        # Mock candidate search with cosine in arbitration range
        rsps.add(
            responses.POST,
            "https://test.com/api/run/semanticSearch:findCandidateRoutesByEmbedding",
            json={
                "value": {
                    "result": [
                        {
                            "routeId": "route-2",
                            "cosineSimilarity": 0.85,  # In arbitration range
                        }
                    ]
                }
            },
            status=200,
        )

        # Run with dry_run=True
        deduplicator = SemanticDeduplicator(
            base_url="https://test.com",
            deploy_key="test-key",
            arbitration_output_path=arbitration_path,
            dry_run=True,
        )
        deduplicator.run(mock_routes)

        # Verify arbitration queue file was NOT created
        assert not arbitration_path.exists()

        # Verify queue was populated in memory (dry-run only skips writes)
        assert len(deduplicator.arbitration_queue) == 1


def test_dry_run_skips_calibration_write(tmp_path, mock_routes):
    """AC3: Verify calibration file is NOT written when dry_run=True."""
    calibration_path = tmp_path / "calibration_set.json"

    with responses.RequestsMock() as rsps:
        # Mock candidate search with high similarity (creates positive)
        rsps.add(
            responses.POST,
            "https://test.com/api/run/semanticSearch:findCandidateRoutesByEmbedding",
            json={
                "value": {
                    "result": [
                        {
                            "routeId": "route-2",
                            "cosineSimilarity": 0.95,  # Above merge threshold
                        }
                    ]
                }
            },
            status=200,
        )

        # Run with dry_run=True
        deduplicator = SemanticDeduplicator(
            base_url="https://test.com",
            deploy_key="test-key",
            calibration_output_path=calibration_path,
            dry_run=True,
        )
        deduplicator.run(mock_routes)
        deduplicator.emit_calibration_set()

        # Verify calibration file was NOT created
        assert not calibration_path.exists()

        # Verify calibration data was populated in memory
        assert len(deduplicator._calibration_positives) == 1


def test_dry_run_false_performs_writes(tmp_path, mock_routes):
    """Verify dry_run=False (default) performs all writes."""
    arbitration_path = tmp_path / "arbitration_queue.json"
    calibration_path = tmp_path / "calibration_set.json"

    with responses.RequestsMock() as rsps:
        # Mock candidate search with high similarity
        rsps.add(
            responses.POST,
            "https://test.com/api/run/semanticSearch:findCandidateRoutesByEmbedding",
            json={
                "value": {
                    "result": [
                        {
                            "routeId": "route-2",
                            "cosineSimilarity": 0.95,
                        }
                    ]
                }
            },
            status=200,
        )

        # Mock addRouteMatch endpoint
        rsps.add(
            responses.POST,
            "https://test.com/api/run/semanticSearch:addRouteMatch",
            json={"value": None},
            status=200,
        )

        # Run with dry_run=False (default)
        deduplicator = SemanticDeduplicator(
            base_url="https://test.com",
            deploy_key="test-key",
            arbitration_output_path=arbitration_path,
            calibration_output_path=calibration_path,
            dry_run=False,
        )
        deduplicator.run(mock_routes)
        deduplicator.emit_calibration_set()

        # Verify writes occurred
        # 1. addRouteMatch HTTP call was made
        assert any("addRouteMatch" in call.request.url for call in rsps.calls)

        # 2. Calibration file was written (positives from auto-merge)
        assert calibration_path.exists()
        calibration_data = json.loads(calibration_path.read_text())
        assert len(calibration_data["positives"]) == 1
