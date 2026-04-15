"""Tests for db.py — schema creation, upsert idempotency, stage queries."""

from __future__ import annotations

import json
import time
from pathlib import Path

import pytest

from scripts.curation.pipeline.state_manager.db import (
    get_connection,
    get_routes_for_stage,
    get_status_summary,
    init_db,
    record_run_finish,
    record_run_start,
    reset_stage,
    upsert_route_state,
)


@pytest.fixture
def tmp_db(tmp_path: Path):
    """Create an isolated DB in a temp directory."""
    db_path = tmp_path / "test.db"
    init_db(db_path)
    conn = get_connection(db_path)
    yield conn
    conn.close()


def _insert_route(conn, route_id: str, source: str = "fhwa", **kwargs):
    """Helper: insert a minimal route_state row."""
    upsert_route_state(
        conn,
        route_id=route_id,
        source=source,
        raw_staging_json=json.dumps({"route_id": route_id}),
        **kwargs,
    )


class TestSchemaCreation:
    def test_tables_exist(self, tmp_db):
        tables = {
            row[0]
            for row in tmp_db.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()
        }
        assert "route_state" in tables
        assert "pipeline_runs" in tables

    def test_indexes_exist(self, tmp_db):
        indexes = {
            row[0]
            for row in tmp_db.execute(
                "SELECT name FROM sqlite_master WHERE type='index'"
            ).fetchall()
        }
        assert "idx_stage" in indexes
        assert "idx_source" in indexes
        assert "idx_error_stage" in indexes

    def test_double_init_is_idempotent(self, tmp_path):
        """Calling init_db twice should not raise or duplicate tables."""
        db_path = tmp_path / "double.db"
        init_db(db_path)
        init_db(db_path)  # should not raise
        conn = get_connection(db_path)
        count = conn.execute("SELECT COUNT(*) FROM route_state").fetchone()[0]
        assert count == 0
        conn.close()


class TestUpsertIdempotency:
    def test_insert_creates_row(self, tmp_db):
        _insert_route(tmp_db, "fhwa:test-1")
        row = tmp_db.execute(
            "SELECT route_id FROM route_state WHERE route_id = ?", ("fhwa:test-1",)
        ).fetchone()
        assert row is not None

    def test_double_insert_skipped(self, tmp_db):
        _insert_route(tmp_db, "fhwa:test-2", route_name="Route A")
        _insert_route(tmp_db, "fhwa:test-2", route_name="Route B")  # should update name

        row = tmp_db.execute(
            "SELECT route_name FROM route_state WHERE route_id = ?", ("fhwa:test-2",)
        ).fetchone()
        # The second call updates route_name because it's provided
        assert row["route_name"] == "Route B"

    def test_ingested_at_preserved_on_re_upsert(self, tmp_db):
        """ingested_at from first insert must not be overwritten on second call."""
        first_time = int(time.time()) - 100
        _insert_route(tmp_db, "fhwa:ts-test", ingested_at=first_time)

        # Second call without ingested_at — should not change ingested_at
        upsert_route_state(
            tmp_db,
            route_id="fhwa:ts-test",
            source="fhwa",
            raw_staging_json=json.dumps({}),
            route_name="Updated",
        )

        row = tmp_db.execute(
            "SELECT ingested_at FROM route_state WHERE route_id = ?", ("fhwa:ts-test",)
        ).fetchone()
        assert row["ingested_at"] == first_time

    def test_extracted_at_update(self, tmp_db):
        _insert_route(tmp_db, "mr:extract-test")
        now = int(time.time())
        upsert_route_state(
            tmp_db,
            route_id="mr:extract-test",
            source="motorcycleroads",
            raw_staging_json=json.dumps({}),
            extracted_at=now,
            extraction_model="glm-4.7-flash",
            extraction_cost_usd=0.0001,
            extraction_payload_json=json.dumps({"scenic_score": 0.8}),
        )

        row = tmp_db.execute(
            "SELECT extracted_at, extraction_model FROM route_state WHERE route_id = ?",
            ("mr:extract-test",),
        ).fetchone()
        assert row["extracted_at"] == now
        assert row["extraction_model"] == "glm-4.7-flash"

    def test_error_fields_set(self, tmp_db):
        _insert_route(tmp_db, "mr:error-test")
        upsert_route_state(
            tmp_db,
            route_id="mr:error-test",
            source="motorcycleroads",
            raw_staging_json=json.dumps({}),
            last_error="Connection timeout",
            error_stage="extract",
            retry_count_delta=1,
        )

        row = tmp_db.execute(
            "SELECT last_error, error_stage, retry_count FROM route_state WHERE route_id = ?",
            ("mr:error-test",),
        ).fetchone()
        assert row["last_error"] == "Connection timeout"
        assert row["error_stage"] == "extract"
        assert row["retry_count"] == 1


class TestStageQueries:
    def test_extract_stage_returns_pending(self, tmp_db):
        _insert_route(tmp_db, "fhwa:pending-1", ingested_at=int(time.time()))
        _insert_route(
            tmp_db, "fhwa:done-1", ingested_at=int(time.time()), extracted_at=int(time.time())
        )

        pending = get_routes_for_stage(tmp_db, "extract")
        ids = [r["route_id"] for r in pending]
        assert "fhwa:pending-1" in ids
        assert "fhwa:done-1" not in ids

    def test_push_stage_requires_extracted(self, tmp_db):
        now = int(time.time())
        _insert_route(tmp_db, "fhwa:extracted-1", ingested_at=now, extracted_at=now)
        _insert_route(tmp_db, "fhwa:not-extracted", ingested_at=now)

        pending = get_routes_for_stage(tmp_db, "push")
        ids = [r["route_id"] for r in pending]
        assert "fhwa:extracted-1" in ids
        assert "fhwa:not-extracted" not in ids

    def test_embed_stage_requires_pushed(self, tmp_db):
        now = int(time.time())
        _insert_route(
            tmp_db, "fhwa:pushed-1", ingested_at=now, extracted_at=now, pushed_at=now
        )
        _insert_route(
            tmp_db, "fhwa:not-pushed", ingested_at=now, extracted_at=now
        )

        pending = get_routes_for_stage(tmp_db, "embed")
        ids = [r["route_id"] for r in pending]
        assert "fhwa:pushed-1" in ids
        assert "fhwa:not-pushed" not in ids

    def test_limit_respected(self, tmp_db):
        now = int(time.time())
        for i in range(10):
            _insert_route(tmp_db, f"fhwa:limit-{i}", ingested_at=now)

        pending = get_routes_for_stage(tmp_db, "extract", limit=3)
        assert len(pending) == 3

    def test_extract_skips_error_routes(self, tmp_db):
        now = int(time.time())
        _insert_route(tmp_db, "fhwa:clean", ingested_at=now)
        upsert_route_state(
            tmp_db,
            route_id="fhwa:errored",
            source="fhwa",
            raw_staging_json=json.dumps({}),
            ingested_at=now,
            last_error="boom",
            error_stage="extract",
        )

        pending = get_routes_for_stage(tmp_db, "extract")
        ids = [r["route_id"] for r in pending]
        assert "fhwa:clean" in ids
        assert "fhwa:errored" not in ids


class TestStatusSummary:
    def test_summary_structure(self, tmp_db):
        now = int(time.time())
        _insert_route(tmp_db, "fhwa:s1", source="fhwa", ingested_at=now, extracted_at=now)
        _insert_route(tmp_db, "mr:s1", source="motorcycleroads", ingested_at=now)

        summary = get_status_summary(tmp_db)
        assert "by_source" in summary
        assert "totals" in summary
        sources = {r["source"] for r in summary["by_source"]}
        assert "fhwa" in sources
        assert "motorcycleroads" in sources


class TestPipelineRuns:
    def test_run_lifecycle(self, tmp_db):
        run_id = record_run_start(tmp_db, "extract", notes="test run")
        assert run_id

        row = tmp_db.execute(
            "SELECT status FROM pipeline_runs WHERE run_id = ?", (run_id,)
        ).fetchone()
        assert row["status"] == "running"

        record_run_finish(
            tmp_db, run_id, "success", routes_processed=10, routes_succeeded=9, routes_failed=1
        )

        row = tmp_db.execute(
            "SELECT status, routes_processed FROM pipeline_runs WHERE run_id = ?", (run_id,)
        ).fetchone()
        assert row["status"] == "success"
        assert row["routes_processed"] == 10


class TestResetStage:
    def test_reset_clears_timestamp(self, tmp_db):
        now = int(time.time())
        _insert_route(tmp_db, "fhwa:reset-1", ingested_at=now, extracted_at=now)

        count = reset_stage(tmp_db, "extract")
        assert count >= 1

        row = tmp_db.execute(
            "SELECT extracted_at FROM route_state WHERE route_id = ?", ("fhwa:reset-1",)
        ).fetchone()
        assert row["extracted_at"] is None

    def test_reset_source_filter(self, tmp_db):
        now = int(time.time())
        _insert_route(tmp_db, "fhwa:r1", source="fhwa", ingested_at=now, extracted_at=now)
        _insert_route(tmp_db, "mr:r1", source="motorcycleroads", ingested_at=now, extracted_at=now)

        count = reset_stage(tmp_db, "extract", source="fhwa")
        assert count == 1

        fhwa_row = tmp_db.execute(
            "SELECT extracted_at FROM route_state WHERE route_id = ?", ("fhwa:r1",)
        ).fetchone()
        mr_row = tmp_db.execute(
            "SELECT extracted_at FROM route_state WHERE route_id = ?", ("mr:r1",)
        ).fetchone()
        assert fhwa_row["extracted_at"] is None
        assert mr_row["extracted_at"] is not None

    def test_reset_invalid_stage_raises(self, tmp_db):
        with pytest.raises(ValueError, match="Unknown stage"):
            reset_stage(tmp_db, "bogus_stage")
