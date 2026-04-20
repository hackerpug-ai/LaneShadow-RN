"""QUAL-008: Test --dry-run flag for side-effect-free benchmarking."""

import json
import logging

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


def _mock_candidate_search(rsps, cosine=0.95):
    """Add mock for findCandidateRoutesByEmbedding."""
    rsps.add(
        responses.POST,
        "https://test.com/api/run/semanticSearch:findCandidateRoutesByEmbedding",
        json={
            "value": {
                "result": [
                    {
                        "routeId": "route-2",
                        "cosineSimilarity": cosine,
                    }
                ]
            }
        },
        status=200,
    )


def _mock_add_route_match(rsps):
    """Add mock for addRouteMatch."""
    rsps.add(
        responses.POST,
        "https://test.com/api/run/semanticSearch:addRouteMatch",
        json={"value": None},
        status=200,
    )


# ── Test criteria #1: flag accepted, default False ──


def test_dry_run_flag_accepted():
    """--dry-run sets args.dry_run=True; absent defaults to False."""
    args = parse_args(["--base-url", "https://test.com", "--deploy-key", "key", "--dry-run"])
    assert args.dry_run is True

    args_default = parse_args(["--base-url", "https://test.com", "--deploy-key", "key"])
    assert args_default.dry_run is False


# ── Test criteria #2 + #3: no writes, reads still happen ──


def test_no_writes_in_dry_run(tmp_path, mock_routes):
    """AC2: dry_run=True skips all writes — addRouteMatch, arbitration file, calibration file."""
    arbitration_path = tmp_path / "arbitration_queue.json"
    calibration_path = tmp_path / "calibration_set.json"

    with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
        _mock_candidate_search(rsps, cosine=0.95)
        _mock_add_route_match(rsps)

        dedup = SemanticDeduplicator(
            base_url="https://test.com",
            deploy_key="test-key",
            arbitration_output_path=arbitration_path,
            calibration_output_path=calibration_path,
            dry_run=True,
        )
        dedup.run(mock_routes)
        dedup.emit_calibration_set()

        # No addRouteMatch HTTP call
        assert not any("addRouteMatch" in c.request.url for c in rsps.calls)
        # No file writes
        assert not arbitration_path.exists()
        assert not calibration_path.exists()
        # No reconciliation log mutation
        assert all(len(r.llm_reconciliation_log) == 0 for r in mock_routes)


def test_reads_still_happen_dry_run(mock_routes):
    """AC3: _fetch_candidates() is called in dry-run (reads happen)."""
    with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
        _mock_candidate_search(rsps, cosine=0.85)

        dedup = SemanticDeduplicator(
            base_url="https://test.com",
            deploy_key="test-key",
            dry_run=True,
        )
        dedup.run(mock_routes)

        # Candidate search was called (read operation)
        assert any("findCandidateRoutesByEmbedding" in c.request.url for c in rsps.calls)


# ── Test criteria #5: classification counts identical ──


def test_classification_counts_identical(mock_routes):
    """Dry-run and real run produce identical classification counts."""
    counts = {}
    for dry_run in (True, False):
        # Reset reconciliation logs between runs
        for r in mock_routes:
            r.llm_reconciliation_log = []

        with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
            _mock_candidate_search(rsps, cosine=0.95)
            if not dry_run:
                _mock_add_route_match(rsps)

            dedup = SemanticDeduplicator(
                base_url="https://test.com",
                deploy_key="test-key",
                dry_run=dry_run,
            )
            ledger = dedup.run(mock_routes)
            counts[dry_run] = {
                "auto_merged": ledger.auto_merged,
                "queued_arbitration": ledger.queued_arbitration,
                "separated": ledger.separated,
                "total_routes": ledger.total_routes,
            }

    assert counts[True] == counts[False]


# ── Test criteria #6: DRY RUN in log output ──


def test_dry_run_log_message(mock_routes, caplog):
    """'DRY RUN' appears in log output when dry-run is active."""
    with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
        _mock_candidate_search(rsps, cosine=0.85)

        with caplog.at_level(logging.INFO):
            dedup = SemanticDeduplicator(
                base_url="https://test.com",
                deploy_key="test-key",
                dry_run=True,
            )
            dedup.run(mock_routes)

    assert "DRY RUN" in caplog.text


# ── Test criteria #7: existing tests unbroken (verified by test_qual_001.py) ──


def test_dry_run_false_performs_writes(tmp_path, mock_routes):
    """dry_run=False (default) performs all writes — verifies backwards compatibility."""
    arbitration_path = tmp_path / "arbitration_queue.json"
    calibration_path = tmp_path / "calibration_set.json"

    with responses.RequestsMock(assert_all_requests_are_fired=False) as rsps:
        _mock_candidate_search(rsps, cosine=0.95)
        _mock_add_route_match(rsps)

        dedup = SemanticDeduplicator(
            base_url="https://test.com",
            deploy_key="test-key",
            arbitration_output_path=arbitration_path,
            calibration_output_path=calibration_path,
            dry_run=False,
        )
        dedup.run(mock_routes)
        dedup.emit_calibration_set()

        # addRouteMatch was called
        assert any("addRouteMatch" in c.request.url for c in rsps.calls)
        # Calibration file written
        assert calibration_path.exists()
        calibration_data = json.loads(calibration_path.read_text())
        assert len(calibration_data["positives"]) == 1
        # Reconciliation log was mutated
        assert any(len(r.llm_reconciliation_log) > 0 for r in mock_routes)
