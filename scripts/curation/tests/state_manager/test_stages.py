"""Tests for stages.py — state transitions and error handling.

Uses mock ExtractionClient and mock push_routes. Tests the function-under-test
(ingest, extract, push) directly — not the mocks themselves.
"""

from __future__ import annotations

import json
import time
from pathlib import Path
from typing import Any
from unittest.mock import MagicMock, patch

import pytest

from scripts.curation.pipeline.state_manager.db import (
    get_connection,
    get_routes_for_stage,
    init_db,
    upsert_route_state,
)
from scripts.curation.pipeline.state_manager.stages import ingest


@pytest.fixture
def tmp_db(tmp_path: Path):
    db_path = tmp_path / "test_stages.db"
    init_db(db_path)
    conn = get_connection(db_path)
    yield conn
    conn.close()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_mock_extract_result(route_id: str, success: bool = True) -> dict[str, Any]:
    if success:
        return {
            "route_id": route_id,
            "extraction_status": "success",
            "attributes": {
                "scenic_score": 0.8,
                "technical_score": 0.7,
                "traffic_score": 0.6,
                "remoteness_score": 0.5,
                "condition_score": 0.9,
                "elevation_score": 0.4,
                "designation_score": 0.3,
                "community_score": 0.7,
                "season": "apr_nov",
                "road_surface": "paved",
                "primary_archetype_hint": "twisties",
                "reasoning": "Test reasoning",
            },
            "extracted_at": int(time.time()),
            "latency_ms": 200.0,
        }
    else:
        return {
            "route_id": route_id,
            "extraction_status": "failed",
            "extraction_error": "API timeout",
            "extracted_at": int(time.time()),
            "latency_ms": 5000.0,
        }


# ---------------------------------------------------------------------------
# Ingest tests
# ---------------------------------------------------------------------------

class TestIngestStage:
    def test_ingest_from_real_fhwa_file(self, tmp_db):
        """Ingest FHWA staging file (real file, no mock needed)."""
        repo_root = Path(__file__).resolve().parent.parent.parent.parent.parent
        fhwa_path = repo_root / "staging" / "fhwa.jsonl"
        if not fhwa_path.exists():
            pytest.skip(f"Staging file not found: {fhwa_path}")

        # Patch STAGING_FILES to only use fhwa
        import scripts.curation.pipeline.state_manager.stages as stages_mod
        original = stages_mod.STAGING_FILES.copy()
        stages_mod.STAGING_FILES = {"fhwa": fhwa_path}

        try:
            stats = ingest(tmp_db, source="fhwa")
        finally:
            stages_mod.STAGING_FILES = original

        assert stats["fhwa"]["inserted"] > 0
        assert stats["fhwa"]["errors"] == 0

    def test_ingest_idempotent(self, tmp_db):
        """Running ingest twice does not duplicate rows."""
        repo_root = Path(__file__).resolve().parent.parent.parent.parent.parent
        fhwa_path = repo_root / "staging" / "fhwa.jsonl"
        if not fhwa_path.exists():
            pytest.skip(f"Staging file not found: {fhwa_path}")

        import scripts.curation.pipeline.state_manager.stages as stages_mod
        original = stages_mod.STAGING_FILES.copy()
        stages_mod.STAGING_FILES = {"fhwa": fhwa_path}

        try:
            stats1 = ingest(tmp_db, source="fhwa")
            count_after_first = tmp_db.execute("SELECT COUNT(*) FROM route_state").fetchone()[0]

            stats2 = ingest(tmp_db, source="fhwa")
            count_after_second = tmp_db.execute("SELECT COUNT(*) FROM route_state").fetchone()[0]
        finally:
            stages_mod.STAGING_FILES = original

        assert count_after_first == count_after_second
        assert stats2["fhwa"]["skipped"] == stats1["fhwa"]["inserted"]

    def test_ingest_missing_file_records_error(self, tmp_db, tmp_path):
        """Missing staging file should record error and not crash."""
        import scripts.curation.pipeline.state_manager.stages as stages_mod
        original = stages_mod.STAGING_FILES.copy()
        missing_path = tmp_path / "does_not_exist.jsonl"
        stages_mod.STAGING_FILES = {"fhwa": missing_path}

        try:
            stats = ingest(tmp_db, source="fhwa")
        finally:
            stages_mod.STAGING_FILES = original

        assert stats["fhwa"]["errors"] >= 1
        assert stats["fhwa"]["inserted"] == 0

    def test_ingest_produces_normalized_json(self, tmp_db):
        """Every ingested row must have normalized_route_json."""
        repo_root = Path(__file__).resolve().parent.parent.parent.parent.parent
        fhwa_path = repo_root / "staging" / "fhwa.jsonl"
        if not fhwa_path.exists():
            pytest.skip(f"Staging file not found: {fhwa_path}")

        import scripts.curation.pipeline.state_manager.stages as stages_mod
        original = stages_mod.STAGING_FILES.copy()
        stages_mod.STAGING_FILES = {"fhwa": fhwa_path}

        try:
            ingest(tmp_db, source="fhwa")
        finally:
            stages_mod.STAGING_FILES = original

        rows = tmp_db.execute(
            "SELECT normalized_route_json FROM route_state WHERE source = 'fhwa'"
        ).fetchall()
        for row in rows:
            assert row["normalized_route_json"] is not None
            norm = json.loads(row["normalized_route_json"])
            assert "route_id" in norm
            assert "name" in norm


# ---------------------------------------------------------------------------
# Extract stage tests (mocked ExtractionClient)
# ---------------------------------------------------------------------------

class TestExtractStage:
    def _seed_route(self, conn, route_id: str, source: str = "fhwa"):
        """Insert a pre-ingested route ready for extraction."""
        now = int(time.time())
        normalized = {
            "route_id": route_id,
            "name": f"Route {route_id}",
            "state": "Tennessee",
            "source": source,
            "description": "A winding mountain road with great views.",
            "length_miles": 22.0,
            "centroid_lat": 35.5,
            "centroid_lng": -84.0,
            "canonical_url": f"https://example.com/{route_id}",
            "source_url": f"https://example.com/{route_id}",
            "rating": 4.5,
        }
        upsert_route_state(
            conn,
            route_id=route_id,
            source=source,
            raw_staging_json=json.dumps({"route_id": route_id}),
            normalized_route_json=json.dumps(normalized),
            ingested_at=now,
        )

    def test_extract_success_sets_extracted_at(self, tmp_db):
        """Successful extraction sets extracted_at and extraction_payload_json."""
        self._seed_route(tmp_db, "fhwa:dragon")

        with (
            patch("scripts.curation.pipeline.state_manager.stages.ExtractionClient") as mock_client_cls,
            patch("scripts.curation.pipeline.state_manager.stages.extract_single") as mock_extract,
        ):
            mock_instance = MagicMock()
            mock_instance.model = "glm-4.7-flash-mock"
            mock_client_cls.return_value = mock_instance
            mock_extract.return_value = _make_mock_extract_result("fhwa:dragon", success=True)

            from scripts.curation.pipeline.state_manager.stages import extract
            stats = extract(tmp_db, limit=1)

        assert stats["succeeded"] == 1
        assert stats["failed"] == 0

        row = tmp_db.execute(
            "SELECT extracted_at, extraction_payload_json, extraction_model FROM route_state WHERE route_id = ?",
            ("fhwa:dragon",),
        ).fetchone()
        assert row["extracted_at"] is not None
        assert row["extraction_payload_json"] is not None
        payload = json.loads(row["extraction_payload_json"])
        assert "scenic_score" in payload

    def test_extract_failure_sets_error_stage(self, tmp_db):
        """Failed extraction sets error_stage='extract' and last_error."""
        self._seed_route(tmp_db, "fhwa:fail-route")

        with (
            patch("scripts.curation.pipeline.state_manager.stages.ExtractionClient") as mock_client_cls,
            patch("scripts.curation.pipeline.state_manager.stages.extract_single") as mock_extract,
        ):
            mock_client_cls.return_value = MagicMock()
            mock_extract.return_value = _make_mock_extract_result("fhwa:fail-route", success=False)

            from scripts.curation.pipeline.state_manager.stages import extract
            stats = extract(tmp_db, limit=1)

        assert stats["failed"] == 1

        row = tmp_db.execute(
            "SELECT error_stage, last_error, retry_count FROM route_state WHERE route_id = ?",
            ("fhwa:fail-route",),
        ).fetchone()
        assert row["error_stage"] == "extract"
        assert row["last_error"] is not None
        assert row["retry_count"] == 1

    def test_extract_dry_run_no_state_change(self, tmp_db):
        """Dry-run mode must not write to state table."""
        self._seed_route(tmp_db, "fhwa:dry-test")

        with (
            patch("scripts.curation.pipeline.state_manager.stages.ExtractionClient") as mock_client_cls,
            patch("scripts.curation.pipeline.state_manager.stages.extract_single") as mock_extract,
        ):
            mock_client_cls.return_value = MagicMock()
            mock_extract.return_value = _make_mock_extract_result("fhwa:dry-test", success=True)

            from scripts.curation.pipeline.state_manager.stages import extract
            stats = extract(tmp_db, dry_run=True)

        # State should be unchanged
        row = tmp_db.execute(
            "SELECT extracted_at FROM route_state WHERE route_id = ?", ("fhwa:dry-test",)
        ).fetchone()
        assert row["extracted_at"] is None

    def test_extract_skips_already_extracted(self, tmp_db):
        """Routes with extracted_at set must be skipped."""
        now = int(time.time())
        self._seed_route(tmp_db, "fhwa:already-done")
        upsert_route_state(
            tmp_db,
            route_id="fhwa:already-done",
            source="fhwa",
            raw_staging_json=json.dumps({}),
            extracted_at=now,
        )

        with (
            patch("scripts.curation.pipeline.state_manager.stages.ExtractionClient") as mock_client_cls,
            patch("scripts.curation.pipeline.state_manager.stages.extract_single") as mock_extract,
        ):
            mock_client_cls.return_value = MagicMock()
            mock_extract.return_value = _make_mock_extract_result("fhwa:already-done")

            from scripts.curation.pipeline.state_manager.stages import extract
            stats = extract(tmp_db, limit=10)

        mock_extract.assert_not_called()
        assert stats["processed"] == 0


# ---------------------------------------------------------------------------
# Push stage tests (mocked HTTP calls)
# ---------------------------------------------------------------------------

class TestPushStage:
    def _seed_extracted_route(self, conn, route_id: str, source: str = "fhwa"):
        """Insert a route with extraction complete, ready for push."""
        now = int(time.time())
        normalized = {
            "route_id": route_id,
            "name": f"Route {route_id}",
            "state": "Tennessee",
            "source": source,
            "description": "Test description",
            "length_miles": 20.0,
            "centroid_lat": 35.5,
            "centroid_lng": -84.0,
            "canonical_url": f"https://example.com/{route_id}",
            "source_url": f"https://example.com/{route_id}",
            "rating": 4.0,
            "bounds_ne_lat": None,
            "bounds_ne_lng": None,
            "bounds_sw_lat": None,
            "bounds_sw_lng": None,
        }
        attrs = {
            "scenic_score": 0.8,
            "technical_score": 0.7,
            "traffic_score": 0.6,
            "remoteness_score": 0.5,
            "condition_score": 0.9,
            "elevation_score": 0.4,
            "designation_score": 0.3,
            "community_score": 0.7,
            "season": "apr_nov",
            "road_surface": "paved",
            "primary_archetype_hint": "twisties",
        }
        upsert_route_state(
            conn,
            route_id=route_id,
            source=source,
            raw_staging_json=json.dumps({"route_id": route_id}),
            normalized_route_json=json.dumps(normalized),
            ingested_at=now,
            extracted_at=now,
            extraction_model="glm-4.7-flash",
            extraction_cost_usd=0.0001,
            extraction_payload_json=json.dumps(attrs),
        )

    def test_push_success_sets_pushed_at(self, tmp_db, monkeypatch):
        """Successful push sets pushed_at on the row."""
        self._seed_extracted_route(tmp_db, "fhwa:push-test")

        monkeypatch.setenv("CONVEX_URL", "https://example.convex.cloud")
        monkeypatch.setenv("CURATION_DEPLOY_KEY", "test-key")

        with patch(
            "scripts.curation.pipeline.state_manager.stages._call_convex_upsert"
        ) as mock_call:
            mock_call.return_value = {"inserted": 1, "updated": 0, "skipped": 0, "errors": []}

            from scripts.curation.pipeline.state_manager.stages import push
            stats = push(tmp_db, limit=10)

        assert stats["inserted"] == 1
        assert stats["failed"] == 0

        row = tmp_db.execute(
            "SELECT pushed_at FROM route_state WHERE route_id = ?", ("fhwa:push-test",)
        ).fetchone()
        assert row["pushed_at"] is not None

    def test_push_failure_sets_error_stage(self, tmp_db, monkeypatch):
        """Failed push sets error_stage='push'."""
        self._seed_extracted_route(tmp_db, "fhwa:push-fail")

        monkeypatch.setenv("CONVEX_URL", "https://example.convex.cloud")
        monkeypatch.setenv("CURATION_DEPLOY_KEY", "test-key")

        with patch(
            "scripts.curation.pipeline.state_manager.stages._call_convex_upsert"
        ) as mock_call:
            mock_call.side_effect = RuntimeError("HTTP 500")

            from scripts.curation.pipeline.state_manager.stages import push
            stats = push(tmp_db, limit=10)

        assert stats["failed"] >= 1

        row = tmp_db.execute(
            "SELECT error_stage, pushed_at FROM route_state WHERE route_id = ?",
            ("fhwa:push-fail",),
        ).fetchone()
        assert row["pushed_at"] is None
        assert row["error_stage"] == "push"

    def test_push_skips_already_pushed(self, tmp_db, monkeypatch):
        """Routes already pushed must not be re-pushed."""
        now = int(time.time())
        self._seed_extracted_route(tmp_db, "fhwa:already-pushed")
        upsert_route_state(
            tmp_db,
            route_id="fhwa:already-pushed",
            source="fhwa",
            raw_staging_json=json.dumps({}),
            pushed_at=now,
        )

        monkeypatch.setenv("CONVEX_URL", "https://example.convex.cloud")
        monkeypatch.setenv("CURATION_DEPLOY_KEY", "test-key")

        with patch(
            "scripts.curation.pipeline.state_manager.stages._call_convex_upsert"
        ) as mock_call:
            mock_call.return_value = {"inserted": 0, "updated": 0, "errors": []}

            from scripts.curation.pipeline.state_manager.stages import push
            stats = push(tmp_db, limit=10)

        mock_call.assert_not_called()
        assert stats["sent"] == 0

    def test_push_missing_env_raises(self, tmp_db, monkeypatch):
        """Missing CONVEX_URL must raise RuntimeError."""
        monkeypatch.delenv("CONVEX_URL", raising=False)
        monkeypatch.delenv("CURATION_DEPLOY_KEY", raising=False)

        self._seed_extracted_route(tmp_db, "fhwa:env-missing")

        from scripts.curation.pipeline.state_manager.stages import push
        with pytest.raises(RuntimeError, match="CONVEX_URL"):
            push(tmp_db)
