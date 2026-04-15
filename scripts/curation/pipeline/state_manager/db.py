"""SQLite schema, connection helpers, and CRUD for pipeline state.

Schema version: 1
Location: .pipeline-state/curation.db (relative to repo root)

Every SQL write is wrapped in a transaction. All reads use explicit column
selection. No silent None fallbacks — callers handle missing rows.
"""

from __future__ import annotations

import json
import logging
import sqlite3
import time
import uuid
from pathlib import Path
from typing import Any, Optional

logger = logging.getLogger(__name__)

# Resolve DB path relative to repo root (two levels up from this file)
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
DB_PATH = _REPO_ROOT / ".pipeline-state" / "curation.db"

DDL = """
CREATE TABLE IF NOT EXISTS route_state (
  route_id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  canonical_url TEXT,
  route_name TEXT,
  state_primary TEXT,
  raw_staging_json TEXT NOT NULL,
  normalized_route_json TEXT,

  ingested_at INTEGER NOT NULL,
  extracted_at INTEGER,
  pushed_at INTEGER,
  embedded_at INTEGER,
  geocoded_at INTEGER,
  geometry_json TEXT,
  geometry_source TEXT,

  last_error TEXT,
  error_stage TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,

  extraction_cost_usd REAL,
  extraction_model TEXT,
  extraction_payload_json TEXT,
  convex_doc_id TEXT,

  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stage
  ON route_state(extracted_at, pushed_at, embedded_at);

CREATE INDEX IF NOT EXISTS idx_source
  ON route_state(source);

CREATE INDEX IF NOT EXISTS idx_error_stage
  ON route_state(error_stage);

CREATE TABLE IF NOT EXISTS pipeline_runs (
  run_id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  finished_at INTEGER,
  status TEXT,
  routes_processed INTEGER DEFAULT 0,
  routes_succeeded INTEGER DEFAULT 0,
  routes_failed INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0.0,
  notes TEXT
);
"""


def init_db(db_path: Path = DB_PATH) -> None:
    """Create DB directory + tables if they do not exist.

    Also runs idempotent migrations for schema additions.
    """
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(str(db_path)) as conn:
        conn.executescript(DDL)
        conn.commit()

        # Migration: add geocode columns (idempotent)
        _migrate_add_columns(conn)

    logger.info(f"DB initialized at {db_path}")


def _migrate_add_columns(conn: sqlite3.Connection) -> None:
    """Add new columns if they don't exist (ALTER TABLE is idempotent with IF NOT EXISTS)."""
    migrations = [
        ("geocoded_at", "INTEGER"),
        ("geometry_json", "TEXT"),
        ("geometry_source", "TEXT"),
        ("quality_tier", "TEXT"),
        ("quality_score", "REAL"),
        ("quality_flags_json", "TEXT"),
        ("quality_graded_at", "INTEGER"),
        ("excluded_at", "INTEGER"),
    ]
    for col_name, col_type in migrations:
        try:
            conn.execute(f"ALTER TABLE route_state ADD COLUMN {col_name} {col_type}")
        except sqlite3.OperationalError:
            pass  # Column already exists
    conn.commit()


def get_connection(db_path: Path = DB_PATH) -> sqlite3.Connection:
    """Return a sqlite3 connection with row_factory set to Row."""
    conn = sqlite3.connect(str(db_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


def upsert_route_state(
    conn: sqlite3.Connection,
    route_id: str,
    source: str,
    raw_staging_json: str,
    *,
    canonical_url: Optional[str] = None,
    route_name: Optional[str] = None,
    state_primary: Optional[str] = None,
    normalized_route_json: Optional[str] = None,
    ingested_at: Optional[int] = None,
    extracted_at: Optional[int] = None,
    pushed_at: Optional[int] = None,
    embedded_at: Optional[int] = None,
    geocoded_at: Optional[int] = None,
    geometry_json: Optional[str] = None,
    geometry_source: Optional[str] = None,
    last_error: Optional[str] = None,
    error_stage: Optional[str] = None,
    retry_count_delta: int = 0,
    extraction_cost_usd: Optional[float] = None,
    extraction_model: Optional[str] = None,
    extraction_payload_json: Optional[str] = None,
    convex_doc_id: Optional[str] = None,
    quality_tier: Optional[str] = None,
    quality_score: Optional[float] = None,
    quality_flags_json: Optional[str] = None,
    quality_graded_at: Optional[int] = None,
    excluded_at: Optional[int] = None,
) -> None:
    """Insert or update a route_state row.

    On conflict (same route_id), merges only the non-None supplied fields.
    ingested_at is only set on initial insert if the row does not already
    have one (idempotency).
    """
    now = int(time.time())
    if ingested_at is None:
        ingested_at_val = now
    else:
        ingested_at_val = ingested_at

    with conn:
        # Try insert first
        existing = conn.execute(
            "SELECT route_id, ingested_at, retry_count FROM route_state WHERE route_id = ?",
            (route_id,),
        ).fetchone()

        if existing is None:
            conn.execute(
                """
                INSERT INTO route_state (
                    route_id, source, canonical_url, route_name, state_primary,
                    raw_staging_json, normalized_route_json,
                    ingested_at, extracted_at, pushed_at, embedded_at,
                    geocoded_at, geometry_json, geometry_source,
                    last_error, error_stage, retry_count,
                    extraction_cost_usd, extraction_model, extraction_payload_json,
                    convex_doc_id, updated_at
                ) VALUES (
                    ?,?,?,?,?, ?,?, ?,?,?,?, ?,?,?, ?,?,0, ?,?,?, ?,?
                )
                """,
                (
                    route_id, source, canonical_url, route_name, state_primary,
                    raw_staging_json, normalized_route_json,
                    ingested_at_val, extracted_at, pushed_at, embedded_at,
                    geocoded_at, geometry_json, geometry_source,
                    last_error, error_stage,
                    extraction_cost_usd, extraction_model, extraction_payload_json,
                    convex_doc_id, now,
                ),
            )
        else:
            # Build partial update — only touch non-None fields
            updates: list[tuple[str, Any]] = [("updated_at", now)]

            # Always keep original ingested_at (idempotency)
            # Only update normalized_route_json if re-ingesting
            if normalized_route_json is not None:
                updates.append(("normalized_route_json", normalized_route_json))
            if canonical_url is not None:
                updates.append(("canonical_url", canonical_url))
            if route_name is not None:
                updates.append(("route_name", route_name))
            if state_primary is not None:
                updates.append(("state_primary", state_primary))
            if extracted_at is not None:
                updates.append(("extracted_at", extracted_at))
            if pushed_at is not None:
                updates.append(("pushed_at", pushed_at))
            if embedded_at is not None:
                updates.append(("embedded_at", embedded_at))
            if geocoded_at is not None:
                updates.append(("geocoded_at", geocoded_at))
            if geometry_json is not None:
                updates.append(("geometry_json", geometry_json))
            if geometry_source is not None:
                updates.append(("geometry_source", geometry_source))
            if last_error is not None:
                updates.append(("last_error", last_error))
                updates.append(("error_stage", error_stage))
            if extraction_cost_usd is not None:
                updates.append(("extraction_cost_usd", extraction_cost_usd))
            if extraction_model is not None:
                updates.append(("extraction_model", extraction_model))
            if extraction_payload_json is not None:
                updates.append(("extraction_payload_json", extraction_payload_json))
            if convex_doc_id is not None:
                updates.append(("convex_doc_id", convex_doc_id))
            if quality_tier is not None:
                updates.append(("quality_tier", quality_tier))
            if quality_score is not None:
                updates.append(("quality_score", quality_score))
            if quality_flags_json is not None:
                updates.append(("quality_flags_json", quality_flags_json))
            if quality_graded_at is not None:
                updates.append(("quality_graded_at", quality_graded_at))
            if excluded_at is not None:
                updates.append(("excluded_at", excluded_at))
            if retry_count_delta != 0:
                updates.append(
                    ("retry_count", existing["retry_count"] + retry_count_delta)
                )

            set_clause = ", ".join(f"{col} = ?" for col, _ in updates)
            values = [v for _, v in updates]
            values.append(route_id)

            conn.execute(
                f"UPDATE route_state SET {set_clause} WHERE route_id = ?",
                values,
            )


def get_routes_for_stage(
    conn: sqlite3.Connection,
    stage: str,
    limit: Optional[int] = None,
    source: Optional[str] = None,
) -> list[sqlite3.Row]:
    """Return rows that are pending for a given stage.

    stage values:
        'extract' -> extracted_at IS NULL AND ingested_at IS NOT NULL
        'push'    -> extracted_at IS NOT NULL AND pushed_at IS NULL AND error_stage != 'extract'
        'embed'   -> pushed_at IS NOT NULL AND embedded_at IS NULL
    """
    where_clauses: list[str] = []
    params: list[Any] = []

    # Always exclude soft-deleted routes
    where_clauses.append("excluded_at IS NULL")

    if stage == "extract":
        where_clauses.append("extracted_at IS NULL")
        where_clauses.append("ingested_at IS NOT NULL")
        # Don't retry extract errors by default — caller uses --retry-errors
        where_clauses.append("(error_stage IS NULL OR error_stage != 'extract')")
    elif stage == "extract_retry":
        where_clauses.append("error_stage = 'extract'")
    elif stage == "push":
        where_clauses.append("extracted_at IS NOT NULL")
        where_clauses.append("pushed_at IS NULL")
        where_clauses.append("(error_stage IS NULL OR error_stage != 'push')")
    elif stage == "embed":
        where_clauses.append("pushed_at IS NOT NULL")
        where_clauses.append("embedded_at IS NULL")
    elif stage == "geocode":
        where_clauses.append("ingested_at IS NOT NULL")
        where_clauses.append("geocoded_at IS NULL")
        where_clauses.append("(error_stage IS NULL OR error_stage != 'geocode')")
    else:
        raise ValueError(f"Unknown stage: {stage!r}")

    if source:
        where_clauses.append("source = ?")
        params.append(source)

    sql = f"SELECT * FROM route_state WHERE {' AND '.join(where_clauses)}"
    if limit:
        sql += f" LIMIT {int(limit)}"

    return conn.execute(sql, params).fetchall()


def get_routes_with_errors(
    conn: sqlite3.Connection,
    error_stage: str,
    limit: Optional[int] = None,
) -> list[sqlite3.Row]:
    """Return routes that errored at a specific stage."""
    sql = "SELECT * FROM route_state WHERE error_stage = ?"
    params: list[Any] = [error_stage]
    if limit:
        sql += f" LIMIT {int(limit)}"
    return conn.execute(sql, params).fetchall()


def clear_error_for_retry(
    conn: sqlite3.Connection,
    route_id: str,
) -> None:
    """Clear error state so a route will be retried on next run."""
    with conn:
        conn.execute(
            "UPDATE route_state SET last_error = NULL, error_stage = NULL, updated_at = ? WHERE route_id = ?",
            (int(time.time()), route_id),
        )


def record_run_start(
    conn: sqlite3.Connection,
    stage: str,
    notes: Optional[str] = None,
) -> str:
    """Insert a pipeline_runs row and return the run_id."""
    run_id = str(uuid.uuid4())
    now = int(time.time())
    with conn:
        conn.execute(
            """
            INSERT INTO pipeline_runs (run_id, stage, started_at, status, notes)
            VALUES (?, ?, ?, 'running', ?)
            """,
            (run_id, stage, now, notes),
        )
    logger.info(f"Run started: {run_id} ({stage})")
    return run_id


def record_run_finish(
    conn: sqlite3.Connection,
    run_id: str,
    status: str,
    routes_processed: int = 0,
    routes_succeeded: int = 0,
    routes_failed: int = 0,
    total_cost_usd: float = 0.0,
    notes: Optional[str] = None,
) -> None:
    """Update pipeline_runs row with final status."""
    now = int(time.time())
    with conn:
        conn.execute(
            """
            UPDATE pipeline_runs
            SET finished_at=?, status=?, routes_processed=?, routes_succeeded=?,
                routes_failed=?, total_cost_usd=?, notes=?
            WHERE run_id=?
            """,
            (
                now, status, routes_processed, routes_succeeded,
                routes_failed, total_cost_usd,
                notes, run_id,
            ),
        )
    logger.info(
        f"Run finished: {run_id} status={status} "
        f"processed={routes_processed} succeeded={routes_succeeded} failed={routes_failed} "
        f"cost=${total_cost_usd:.4f}"
    )


def get_status_summary(conn: sqlite3.Connection) -> dict[str, Any]:
    """Return count breakdowns per source and stage for status display."""
    rows = conn.execute(
        """
        SELECT
            source,
            COUNT(*) AS total,
            SUM(CASE WHEN ingested_at IS NOT NULL THEN 1 ELSE 0 END) AS ingested,
            SUM(CASE WHEN extracted_at IS NOT NULL THEN 1 ELSE 0 END) AS extracted,
            SUM(CASE WHEN pushed_at IS NOT NULL THEN 1 ELSE 0 END) AS pushed,
            SUM(CASE WHEN embedded_at IS NOT NULL THEN 1 ELSE 0 END) AS embedded,
            SUM(CASE WHEN error_stage IS NOT NULL THEN 1 ELSE 0 END) AS errors,
            SUM(CASE WHEN excluded_at IS NOT NULL THEN 1 ELSE 0 END) AS excluded,
            SUM(COALESCE(extraction_cost_usd, 0.0)) AS cost
        FROM route_state
        GROUP BY source
        """
    ).fetchall()

    totals = conn.execute(
        """
        SELECT
            COUNT(*) AS total,
            SUM(CASE WHEN ingested_at IS NOT NULL THEN 1 ELSE 0 END) AS ingested,
            SUM(CASE WHEN extracted_at IS NOT NULL THEN 1 ELSE 0 END) AS extracted,
            SUM(CASE WHEN pushed_at IS NOT NULL THEN 1 ELSE 0 END) AS pushed,
            SUM(CASE WHEN embedded_at IS NOT NULL THEN 1 ELSE 0 END) AS embedded,
            SUM(CASE WHEN error_stage IS NOT NULL THEN 1 ELSE 0 END) AS errors,
            SUM(CASE WHEN excluded_at IS NOT NULL THEN 1 ELSE 0 END) AS excluded,
            SUM(COALESCE(extraction_cost_usd, 0.0)) AS cost
        FROM route_state
        """
    ).fetchone()

    error_breakdown = conn.execute(
        """
        SELECT error_stage, COUNT(*) AS cnt
        FROM route_state
        WHERE error_stage IS NOT NULL
        GROUP BY error_stage
        """
    ).fetchall()

    return {
        "by_source": [dict(r) for r in rows],
        "totals": dict(totals) if totals else {},
        "error_breakdown": [dict(r) for r in error_breakdown],
    }


def reset_stage(
    conn: sqlite3.Connection,
    stage: str,
    source: Optional[str] = None,
) -> int:
    """Clear stage timestamp for all matching rows to force re-run.

    Returns number of rows updated.
    """
    col_map = {
        "ingest": "ingested_at",
        "extract": "extracted_at",
        "geocode": "geocoded_at",
        "push": "pushed_at",
        "embed": "embedded_at",
    }
    if stage not in col_map:
        raise ValueError(f"Unknown stage for reset: {stage!r}. Valid: {list(col_map)}")

    col = col_map[stage]
    now = int(time.time())
    params: list[Any] = [now]
    sql = f"UPDATE route_state SET {col} = NULL, updated_at = ?"
    if source:
        sql += " WHERE source = ?"
        params.append(source)
    with conn:
        cursor = conn.execute(sql, params)
    return cursor.rowcount
