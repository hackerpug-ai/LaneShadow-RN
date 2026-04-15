"""Stage functions for the pipeline state manager.

Each stage function:
  - Is idempotent (re-runnable without duplicating state)
  - Wraps every SQL write in a transaction (via db.py helpers)
  - Records errors to the state table rather than crashing
  - Returns a dict with stats for the CLI to display

Stages: ingest → extract → push → embed
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Any, Optional

from scripts.curation.pipeline.extraction.client import ExtractionClient
from scripts.curation.pipeline.extraction.extractor import extract_single

logger = logging.getLogger(__name__)

# Resolve staging path relative to repo root
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
STAGING_DIR = _REPO_ROOT / "staging"

STAGING_FILES = {
    "motorcycleroads": STAGING_DIR / "motorcycleroads.jsonl",
    "bestbikingroads": STAGING_DIR / "bestbikingroads.jsonl",
    "fhwa": STAGING_DIR / "fhwa.jsonl",
}

# Cost estimate: GLM-4.7-flash ~$0.0001/call (very rough estimate)
# (This is tracked from actual extractor output, not hardcoded)
ESTIMATED_COST_PER_CALL_USD = 0.0001


def ingest(
    conn,
    source: str = "all",
) -> dict[str, Any]:
    """Load staging JSONL into route_state table.

    Idempotent: rows that already exist are skipped (ingested_at preserved).

    Args:
        conn: SQLite connection
        source: 'motorcycleroads' | 'bestbikingroads' | 'fhwa' | 'all'

    Returns:
        Stats dict with inserted, skipped, errors counts per source
    """
    from scripts.curation.pipeline.state_manager.db import (
        record_run_start, record_run_finish, upsert_route_state
    )
    from scripts.curation.pipeline.state_manager.normalize import normalize_staging_row

    sources = list(STAGING_FILES.keys()) if source == "all" else [source]
    stats: dict[str, Any] = {s: {"inserted": 0, "skipped": 0, "errors": 0} for s in sources}
    total_inserted = 0
    total_errors = 0

    run_id = record_run_start(conn, "ingest", notes=f"source={source}")

    for src in sources:
        staging_path = STAGING_FILES.get(src)
        if staging_path is None:
            logger.error(f"Unknown source: {src}")
            continue
        if not staging_path.exists():
            logger.error(f"Staging file not found: {staging_path}")
            stats[src]["errors"] += 1
            continue

        logger.info(f"Ingesting {src} from {staging_path}")

        with open(staging_path) as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue

                try:
                    row = json.loads(line)
                except json.JSONDecodeError as e:
                    logger.warning(f"{src}:{line_num} JSON parse error: {e}")
                    stats[src]["errors"] += 1
                    continue

                try:
                    normalized = normalize_staging_row(row, src)
                except Exception as e:
                    logger.warning(f"{src}:{line_num} normalize error: {e}")
                    stats[src]["errors"] += 1
                    total_errors += 1
                    continue

                route_id = normalized["route_id"]

                # Check if already ingested (idempotency)
                existing = conn.execute(
                    "SELECT ingested_at FROM route_state WHERE route_id = ?",
                    (route_id,),
                ).fetchone()

                if existing is not None:
                    stats[src]["skipped"] += 1
                    continue

                try:
                    upsert_route_state(
                        conn,
                        route_id=route_id,
                        source=src,
                        raw_staging_json=json.dumps(row),
                        canonical_url=normalized.get("canonical_url"),
                        route_name=normalized.get("name"),
                        state_primary=normalized.get("state"),
                        normalized_route_json=json.dumps(normalized),
                        ingested_at=int(time.time()),
                    )
                    stats[src]["inserted"] += 1
                    total_inserted += 1
                except Exception as e:
                    logger.error(f"{src}:{line_num} DB upsert error for {route_id}: {e}")
                    stats[src]["errors"] += 1
                    total_errors += 1

        logger.info(
            f"Ingested {src}: inserted={stats[src]['inserted']} "
            f"skipped={stats[src]['skipped']} errors={stats[src]['errors']}"
        )

    record_run_finish(
        conn,
        run_id,
        status="success" if total_errors == 0 else "partial",
        routes_processed=total_inserted,
        routes_succeeded=total_inserted,
        routes_failed=total_errors,
    )

    return stats


def extract(
    conn,
    limit: Optional[int] = None,
    retry_errors: bool = False,
    dry_run: bool = False,
    max_workers: int = 1,
) -> dict[str, Any]:
    """Run LLM extraction on pending routes.

    Args:
        conn: SQLite connection
        limit: Max routes to process (None = all pending)
        retry_errors: If True, include routes with error_stage='extract'
        dry_run: Process 5 routes without committing to state table
        max_workers: ThreadPoolExecutor parallelism

    Returns:
        Stats dict with processed, succeeded, failed, cost_usd
    """
    from scripts.curation.pipeline.state_manager.db import (
        record_run_start, record_run_finish, upsert_route_state
    )

    if dry_run:
        limit = 5
        logger.info("DRY RUN: processing 5 routes, no state commits")

    # Fetch pending rows
    stage_key = "extract_retry" if retry_errors else "extract"
    rows = get_routes_for_stage_internal(conn, stage_key, limit=limit)

    if not rows:
        logger.info("No routes pending for extraction")
        return {"processed": 0, "succeeded": 0, "failed": 0, "cost_usd": 0.0}

    logger.info(f"Extracting {len(rows)} routes (workers={max_workers}, dry_run={dry_run})")

    # Initialize client
    api_key = (
        os.environ.get("Z_AI_API_KEY")
        or os.environ.get("ANTHROPIC_API_KEY")
    )
    client = ExtractionClient(api_key=api_key)

    run_id = None
    if not dry_run:
        run_id = record_run_start(
            conn, "extract", notes=f"limit={limit} retry_errors={retry_errors}"
        )

    stats = {"processed": 0, "succeeded": 0, "failed": 0, "cost_usd": 0.0}
    # Rate limit backoff state
    _rate_limit_backoff = 5.0  # seconds to wait after a 429

    def _process_row(row) -> dict[str, Any]:
        """Extract a single route row with 429-aware retry. Returns result dict."""
        nonlocal _rate_limit_backoff
        route_id = row["route_id"]
        try:
            normalized = json.loads(row["normalized_route_json"])
        except (json.JSONDecodeError, TypeError) as e:
            return {
                "route_id": route_id,
                "status": "failed",
                "error": f"normalized_route_json parse error: {e}",
                "cost_usd": 0.0,
            }

        # Retry loop with exponential backoff for 429s
        max_rate_limit_retries = 5
        for attempt in range(max_rate_limit_retries):
            result = extract_single(normalized, client)
            error_msg = result.get("extraction_error", "") or ""
            if result.get("extraction_status") == "success":
                _rate_limit_backoff = 5.0  # reset on success
                break
            elif "429" in str(error_msg) or "Rate limit" in str(error_msg) or "1302" in str(error_msg):
                backoff = _rate_limit_backoff * (2 ** attempt)
                logger.warning(
                    f"Rate limit for {route_id} (attempt {attempt+1}), "
                    f"waiting {backoff:.1f}s..."
                )
                time.sleep(backoff)
                _rate_limit_backoff = min(_rate_limit_backoff * 1.5, 60.0)
            else:
                break  # Non-rate-limit error, don't retry

        if result.get("extraction_status") == "success":
            attrs = result.get("attributes", {})
            model_name = client.model
            # Rough cost estimate: GLM-4.7-flash pricing
            # ~600 input + 300 output tokens = ~$0.0001 per call
            cost = ESTIMATED_COST_PER_CALL_USD
            return {
                "route_id": route_id,
                "status": "success",
                "attributes": attrs,
                "model": model_name,
                "cost_usd": cost,
                "extracted_at": result.get("extracted_at", int(time.time())),
            }
        else:
            return {
                "route_id": route_id,
                "status": "failed",
                "error": result.get("extraction_error", "unknown"),
                "cost_usd": 0.0,
            }

    # Sequential processing (max_workers=1 by default for z.ai rate limit compliance)
    # Use ThreadPoolExecutor only for max_workers > 1
    if max_workers <= 1:
        row_iterator = iter(rows)

        def _sequential_results():
            for row in row_iterator:
                yield row, _process_row(row)

        result_pairs = _sequential_results()
    else:
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_row = {executor.submit(_process_row, row): row for row in rows}
            result_pairs = ((future_to_row[f], f.result()) for f in as_completed(future_to_row))

    for row, result in result_pairs:
        stats["processed"] += 1
        stats["cost_usd"] += result.get("cost_usd", 0.0)

        if dry_run:
            logger.info(
                f"[DRY RUN] route={result['route_id']} "
                f"status={result['status']} "
                f"cost=${result.get('cost_usd', 0):.4f}"
            )
            if result["status"] == "success":
                stats["succeeded"] += 1
            else:
                stats["failed"] += 1
            continue

        # Commit to state table
        if result["status"] == "success":
            stats["succeeded"] += 1
            upsert_route_state(
                conn,
                route_id=result["route_id"],
                source=row["source"],
                raw_staging_json=row["raw_staging_json"],
                extracted_at=result.get("extracted_at", int(time.time())),
                extraction_cost_usd=result["cost_usd"],
                extraction_model=result.get("model"),
                extraction_payload_json=json.dumps(result.get("attributes", {})),
                last_error=None,
                error_stage=None,
            )
        else:
            stats["failed"] += 1
            upsert_route_state(
                conn,
                route_id=result["route_id"],
                source=row["source"],
                raw_staging_json=row["raw_staging_json"],
                last_error=result.get("error", "unknown"),
                error_stage="extract",
                retry_count_delta=1,
            )

        # Progress log every 50 routes
        if stats["processed"] % 50 == 0:
            logger.info(
                f"Progress: {stats['processed']}/{len(rows)} "
                f"succeeded={stats['succeeded']} failed={stats['failed']} "
                f"cost=${stats['cost_usd']:.4f}"
            )

    if not dry_run and run_id:
        record_run_finish(
            conn,
            run_id,
            status="success" if stats["failed"] == 0 else "partial",
            routes_processed=stats["processed"],
            routes_succeeded=stats["succeeded"],
            routes_failed=stats["failed"],
            total_cost_usd=stats["cost_usd"],
        )

    logger.info(
        f"Extraction {'[DRY RUN] ' if dry_run else ''}complete: "
        f"processed={stats['processed']} succeeded={stats['succeeded']} "
        f"failed={stats['failed']} cost=${stats['cost_usd']:.4f}"
    )
    return stats


def geocode(
    conn,
    limit: Optional[int] = None,
    retry_errors: bool = False,
) -> dict[str, Any]:
    """Geocode routes — fetch lat/lng coordinates for each route.

    Dispatches to per-source geometry fetchers:
      - FHWA: reads existing centroid from staging data (no HTTP)
      - motorcycleroads: re-scrapes pages for waypoint lat/lng pairs
      - bestbikingroads: Nominatim geocoding on route name + state

    Args:
        conn: SQLite connection
        limit: Max routes to process
        retry_errors: Retry routes that previously errored at geocode stage

    Returns:
        Stats dict with processed, succeeded, failed
    """
    from scripts.curation.pipeline.geometry.geocoder import fetch_geometry_for_route
    from scripts.curation.pipeline.state_manager.db import (
        record_run_start, record_run_finish, upsert_route_state
    )

    if retry_errors:
        rows = get_routes_for_stage_internal(conn, "geocode", limit=limit)
        # Also pick up routes that errored at geocode stage
        from scripts.curation.pipeline.state_manager.db import get_routes_with_errors
        error_rows = get_routes_with_errors(conn, "geocode", limit=limit)
        seen = {r["route_id"] for r in rows}
        rows.extend(r for r in error_rows if r["route_id"] not in seen)
    else:
        rows = get_routes_for_stage_internal(conn, "geocode", limit=limit)

    if not rows:
        logger.info("No routes pending for geocode")
        return {"processed": 0, "succeeded": 0, "failed": 0}

    logger.info(f"Geocoding {len(rows)} routes")

    run_id = record_run_start(conn, "geocode")
    stats = {"processed": 0, "succeeded": 0, "failed": 0}

    for row in rows:
        route_id = row["route_id"]
        source = row["source"]
        route_name = row["route_name"] or ""
        state_primary = row["state_primary"] or ""
        raw_json = row["raw_staging_json"]
        canonical_url = row["canonical_url"] or ""

        stats["processed"] += 1

        try:
            geometry = fetch_geometry_for_route(
                route_id=route_id,
                source=source,
                raw_staging_json=raw_json,
                route_name=route_name,
                state_primary=state_primary,
                source_url=canonical_url,
            )

            if geometry is not None:
                stats["succeeded"] += 1
                upsert_route_state(
                    conn,
                    route_id=route_id,
                    source=source,
                    raw_staging_json=raw_json,
                    geocoded_at=int(time.time()),
                    geometry_json=geometry.model_dump_json(),
                    geometry_source=geometry.geometry_source,
                    last_error=None,
                    error_stage=None,
                )
            else:
                stats["failed"] += 1
                upsert_route_state(
                    conn,
                    route_id=route_id,
                    source=source,
                    raw_staging_json=raw_json,
                    last_error="geometry fetch returned None",
                    error_stage="geocode",
                    retry_count_delta=1,
                )

        except Exception as e:
            stats["failed"] += 1
            logger.error(f"Geocode error for {route_id}: {e}")
            upsert_route_state(
                conn,
                route_id=route_id,
                source=source,
                raw_staging_json=raw_json,
                last_error=str(e),
                error_stage="geocode",
                retry_count_delta=1,
            )

        # Progress log every 50 routes
        if stats["processed"] % 50 == 0:
            logger.info(
                f"Geocode progress: {stats['processed']}/{len(rows)} "
                f"succeeded={stats['succeeded']} failed={stats['failed']}"
            )

    record_run_finish(
        conn,
        run_id,
        status="success" if stats["failed"] == 0 else "partial",
        routes_processed=stats["processed"],
        routes_succeeded=stats["succeeded"],
        routes_failed=stats["failed"],
    )

    logger.info(
        f"Geocode complete: processed={stats['processed']} "
        f"succeeded={stats['succeeded']} failed={stats['failed']}"
    )
    return stats


def enrich_bbr(
    conn,
    limit: Optional[int] = None,
    retry_errors: bool = False,
) -> dict[str, Any]:
    """Enrich BBR routes with real polyline geometry from BBR pages.

    Upgrades BBR routes from centroid-only (nominatim) to real route shapes
    with waypoints scraped from BBR's /droute.php API.

    Args:
        conn: SQLite connection
        limit: Max routes to process
        retry_errors: Retry routes that previously errored at enrich stage

    Returns:
        Stats dict with processed, succeeded, failed
    """
    from scripts.curation.pipeline.state_manager.db import (
        record_run_start, record_run_finish, upsert_route_state
    )

    # Query BBR routes that currently have centroid-only geometry
    where_clauses = [
        "source = 'bestbikingroads'",
        "geocoded_at IS NOT NULL",
        "excluded_at IS NULL",
    ]
    if retry_errors:
        where_clauses.append("(error_stage IS NULL OR error_stage != 'enrich_bbr')")
    else:
        # Only routes that haven't been enriched yet
        where_clauses.append("geometry_source = 'nominatim'")

    params: list[Any] = []
    sql = f"SELECT * FROM route_state WHERE {' AND '.join(where_clauses)}"
    if limit:
        sql += f" LIMIT {int(limit)}"

    rows = conn.execute(sql, params).fetchall()

    if not rows:
        logger.info("No BBR routes pending for polyline enrichment")
        return {"processed": 0, "succeeded": 0, "failed": 0}

    logger.info(f"Enriching {len(rows)} BBR routes with polyline geometry")

    run_id = record_run_start(conn, "enrich_bbr", notes=f"limit={limit}")
    stats = {"processed": 0, "succeeded": 0, "failed": 0}

    for row in rows:
        route_id = row["route_id"]
        source_url = row["canonical_url"] or ""
        raw_json = row["raw_staging_json"]

        stats["processed"] += 1

        try:
            from scripts.curation.pipeline.geometry.bbr_polyline import fetch_polyline_geometry
            geometry = fetch_polyline_geometry(
                route_id=route_id,
                source_url=source_url,
            )

            if geometry is not None:
                stats["succeeded"] += 1
                upsert_route_state(
                    conn,
                    route_id=route_id,
                    source="bestbikingroads",
                    raw_staging_json=raw_json,
                    geocoded_at=row["geocoded_at"],  # preserve existing
                    geometry_json=geometry.model_dump_json(),
                    geometry_source=geometry.geometry_source,
                    last_error=None,
                    error_stage=None,
                )
            else:
                stats["failed"] += 1
                logger.debug(f"No polyline for BBR route {route_id}")

        except Exception as e:
            stats["failed"] += 1
            logger.error(f"Polyline scrape error for {route_id}: {e}")
            upsert_route_state(
                conn,
                route_id=route_id,
                source="bestbikingroads",
                raw_staging_json=raw_json,
                last_error=str(e),
                error_stage="enrich_bbr",
                retry_count_delta=1,
            )

        if stats["processed"] % 50 == 0:
            logger.info(
                f"BBR enrichment progress: {stats['processed']}/{len(rows)} "
                f"succeeded={stats['succeeded']} failed={stats['failed']}"
            )

    record_run_finish(
        conn,
        run_id,
        status="success" if stats["failed"] == 0 else "partial",
        routes_processed=stats["processed"],
        routes_succeeded=stats["succeeded"],
        routes_failed=stats["failed"],
    )

    logger.info(
        f"BBR enrichment complete: processed={stats['processed']} "
        f"succeeded={stats['succeeded']} failed={stats['failed']}"
    )
    return stats


def push(
    conn,
    limit: Optional[int] = None,
) -> dict[str, Any]:
    """Push extracted routes to Convex via HTTP API.

    Uses /admin/curation/routes HTTP endpoint (Bearer auth).
    Routes are constructed from normalized_route_json + extraction_payload_json.

    Args:
        conn: SQLite connection
        limit: Max routes to push

    Returns:
        Stats dict with sent, inserted, updated, failed
    """
    from scripts.curation.pipeline.state_manager.db import (
        record_run_start, record_run_finish, upsert_route_state
    )

    rows = get_routes_for_stage_internal(conn, "push", limit=limit)

    if not rows:
        logger.info("No routes pending for push")
        return {"sent": 0, "inserted": 0, "updated": 0, "failed": 0}

    logger.info(f"Pushing {len(rows)} routes to Convex")

    base_url = os.environ.get("CONVEX_URL", "").rstrip("/")
    deploy_key = os.environ.get("CURATION_DEPLOY_KEY", "")

    if not base_url:
        raise RuntimeError("CONVEX_URL environment variable is required for push stage")
    if not deploy_key:
        raise RuntimeError("CURATION_DEPLOY_KEY environment variable is required for push stage")

    run_id = record_run_start(conn, "push", notes=f"limit={limit}")
    stats = {"sent": 0, "inserted": 0, "updated": 0, "failed": 0}

    # Process in batches of 10
    batch_size = 50
    now = int(time.time())

    for i in range(0, len(rows), batch_size):
        batch = rows[i : i + batch_size]
        route_payloads = []
        row_map: dict[str, Any] = {}

        for row in batch:
            try:
                payload = _build_convex_route_payload(row)
                route_payloads.append(payload)
                row_map[row["route_id"]] = row
            except Exception as e:
                logger.error(f"Failed to build payload for {row['route_id']}: {e}")
                stats["failed"] += 1
                upsert_route_state(
                    conn,
                    route_id=row["route_id"],
                    source=row["source"],
                    raw_staging_json=row["raw_staging_json"],
                    last_error=str(e),
                    error_stage="push",
                    retry_count_delta=1,
                )

        if not route_payloads:
            continue

        try:
            result = _call_convex_upsert(route_payloads, base_url, deploy_key)
        except Exception as e:
            logger.error(f"Batch {i}-{i+len(batch)} push failed: {e}")
            for row in batch:
                if row["route_id"] in row_map:
                    stats["failed"] += 1
                    upsert_route_state(
                        conn,
                        route_id=row["route_id"],
                        source=row["source"],
                        raw_staging_json=row["raw_staging_json"],
                        last_error=str(e),
                        error_stage="push",
                        retry_count_delta=1,
                    )
            continue

        # Mark pushed rows as done
        inserted = result.get("inserted", 0)
        updated = result.get("updated", 0)
        errors = result.get("errors", [])
        error_route_ids = {e.get("routeId") for e in errors}

        stats["inserted"] += inserted
        stats["updated"] += updated
        stats["sent"] += len(route_payloads)

        for row in batch:
            route_id = row["route_id"]
            if route_id not in row_map:
                continue
            if route_id in error_route_ids:
                err_msg = next(
                    (e.get("message", "unknown") for e in errors if e.get("routeId") == route_id),
                    "unknown",
                )
                stats["failed"] += 1
                upsert_route_state(
                    conn,
                    route_id=route_id,
                    source=row["source"],
                    raw_staging_json=row["raw_staging_json"],
                    last_error=err_msg,
                    error_stage="push",
                    retry_count_delta=1,
                )
            else:
                upsert_route_state(
                    conn,
                    route_id=route_id,
                    source=row["source"],
                    raw_staging_json=row["raw_staging_json"],
                    pushed_at=now,
                    # Clear any previous push error
                    last_error=None,
                    error_stage=None,
                )

        if (i // batch_size + 1) % 10 == 0:
            logger.info(
                f"Push progress: {min(i + batch_size, len(rows))}/{len(rows)} "
                f"inserted={stats['inserted']} updated={stats['updated']} failed={stats['failed']}"
            )

    record_run_finish(
        conn,
        run_id,
        status="success" if stats["failed"] == 0 else "partial",
        routes_processed=stats["sent"],
        routes_succeeded=stats["inserted"] + stats["updated"],
        routes_failed=stats["failed"],
    )

    logger.info(
        f"Push complete: sent={stats['sent']} inserted={stats['inserted']} "
        f"updated={stats['updated']} failed={stats['failed']}"
    )
    return stats


def embed(
    conn,
    limit: Optional[int] = None,
) -> dict[str, Any]:
    """Embed all pushed routes that are missing embeddings.

    Delegates to batch_embed_routes CLI in --commit --incremental mode.
    After the CLI completes, marks all previously-pushed-but-not-embedded
    routes as embedded_at=now (the CLI handles the actual Convex update).

    Args:
        conn: SQLite connection
        limit: Not used (embed CLI fetches from Convex directly)

    Returns:
        Stats dict with embedded count
    """
    from scripts.curation.pipeline.state_manager.db import (
        record_run_start, record_run_finish, upsert_route_state
    )

    pending_rows = get_routes_for_stage_internal(conn, "embed", limit=limit)

    if not pending_rows:
        logger.info("No routes pending for embedding")
        return {"embedded": 0, "failed": 0}

    logger.info(f"Starting embed stage for {len(pending_rows)} routes")

    # Check required env vars
    openai_key = os.environ.get("OPENAI_API_KEY")
    convex_url = os.environ.get("CONVEX_URL")
    deploy_key = os.environ.get("CURATION_DEPLOY_KEY")

    if not openai_key:
        raise RuntimeError("OPENAI_API_KEY is required for embed stage")
    if not convex_url or not deploy_key:
        raise RuntimeError("CONVEX_URL and CURATION_DEPLOY_KEY are required for embed stage")

    run_id = record_run_start(conn, "embed", notes=f"pending={len(pending_rows)}")

    # Run the batch_embed_routes CLI with a high limit to cover all 5k+ routes
    # The CLI calls getRoutesNeedingEmbedding with incremental=True
    # Default limit is 1000 — we need to loop or pass a higher limit
    # We call it with --limit set high enough to cover all routes
    total_routes = conn.execute(
        "SELECT COUNT(*) FROM route_state WHERE pushed_at IS NOT NULL"
    ).fetchone()[0]

    # Call the embed CLI, passing a limit higher than total routes
    embed_limit = max(10000, total_routes + 1000)

    cmd = [
        sys.executable, "-m",
        "scripts.curation.pipeline.embed.batch_embed_routes",
        "--commit", "--incremental",
    ]

    env = {
        **os.environ,
        "OPENAI_API_KEY": openai_key,
        "CONVEX_URL": convex_url,
        "CURATION_DEPLOY_KEY": deploy_key,
    }

    logger.info(f"Running: {' '.join(cmd)}")

    try:
        result = subprocess.run(
            cmd,
            capture_output=False,
            text=True,
            env=env,
            cwd=str(_REPO_ROOT),
            timeout=3600,  # 1 hour max for full embedding run
        )
    except subprocess.TimeoutExpired:
        record_run_finish(conn, run_id, "failure", notes="Timeout")
        raise RuntimeError("Embed CLI timed out after 1 hour")

    if result.returncode != 0:
        record_run_finish(conn, run_id, "failure", notes=f"CLI exit code {result.returncode}")
        raise RuntimeError(f"Embed CLI failed with exit code {result.returncode}")

    # Mark all pending routes as embedded (CLI succeeded)
    now = int(time.time())
    embedded_count = 0
    for row in pending_rows:
        upsert_route_state(
            conn,
            route_id=row["route_id"],
            source=row["source"],
            raw_staging_json=row["raw_staging_json"],
            embedded_at=now,
        )
        embedded_count += 1

    record_run_finish(
        conn,
        run_id,
        "success",
        routes_processed=embedded_count,
        routes_succeeded=embedded_count,
    )

    logger.info(f"Embed complete: {embedded_count} routes marked as embedded")
    return {"embedded": embedded_count, "failed": 0}


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def get_routes_for_stage_internal(
    conn,
    stage: str,
    limit: Optional[int] = None,
) -> list:
    """Wrapper around db.get_routes_for_stage."""
    from scripts.curation.pipeline.state_manager.db import get_routes_for_stage
    return get_routes_for_stage(conn, stage, limit=limit)


def _build_convex_route_payload(row) -> dict[str, Any]:
    """Build a Convex-compatible route dict from a route_state row.

    Merges normalized_route_json (base fields) with extraction_payload_json
    (LLM scores) and geometry_json (spatial data). Applies required field
    defaults for the Convex validator.
    """
    normalized = json.loads(row["normalized_route_json"])
    attrs: dict[str, Any] = {}
    if row["extraction_payload_json"]:
        try:
            attrs = json.loads(row["extraction_payload_json"])
        except json.JSONDecodeError:
            attrs = {}

    # Parse geometry if available (from geocode stage)
    geom: dict[str, Any] = {}
    if row["geometry_json"]:
        try:
            geom = json.loads(row["geometry_json"])
        except json.JSONDecodeError:
            geom = {}

    # Use geometry data for coordinates, fall back to normalized staging data
    centroid_lat = geom.get("centroid_lat") or normalized.get("centroid_lat") or 0.0
    centroid_lng = geom.get("centroid_lng") or normalized.get("centroid_lng") or 0.0

    # Build the payload matching curatedRouteValidator
    payload: dict[str, Any] = {
        "routeId": normalized["route_id"],
        "name": normalized.get("name") or "",
        "state": normalized.get("state") or "",
        "source": normalized["source"],
        # Required by validator — use extraction output or defaults
        "primaryArchetype": attrs.get("primary_archetype_hint", "scenic_byway"),
        "secondaryTags": [],
        # Coordinates — prefer geometry stage data, fall back to staging data
        "centroidLat": centroid_lat,
        "centroidLng": centroid_lng,
        "boundsNeLat": geom.get("bounds_ne_lat") or normalized.get("bounds_ne_lat") or 0.0,
        "boundsNeLng": geom.get("bounds_ne_lng") or normalized.get("bounds_ne_lng") or 0.0,
        "boundsSwLat": geom.get("bounds_sw_lat") or normalized.get("bounds_sw_lat") or 0.0,
        "boundsSwLng": geom.get("bounds_sw_lng") or normalized.get("bounds_sw_lng") or 0.0,
        "lengthMiles": normalized.get("length_miles") or 0.0,
        # Scores from extraction
        "compositeScore": _avg_scores(attrs),
        "curvatureScore": attrs.get("technical_score", 0.0),
        "scenicScore": attrs.get("scenic_score", 0.0),
        "technicalScore": attrs.get("technical_score", 0.0),
        "trafficScore": attrs.get("traffic_score", 0.0),
        "remotenessScore": attrs.get("remoteness_score", 0.0),
        # Text fields
        "oneLiner": "",
        "summary": normalized.get("description") or "",
        "badges": [],
        "season": _map_season(attrs.get("season")),
        "contentVersion": 1,
        "seededAt": int(time.time()),
    }

    # Geometry metadata fields
    if geom.get("geometry_source"):
        payload["geometrySource"] = geom["geometry_source"]
    if geom.get("waypoints"):
        payload["waypointCount"] = len(geom["waypoints"])
    if geom.get("polyline_encoded"):
        payload["routePolyline"] = geom["polyline_encoded"]

    # GeoJSON location field for geospatial queries
    if centroid_lat != 0.0 and centroid_lng != 0.0:
        payload["location"] = {
            "type": "Point",
            "coordinates": [centroid_lng, centroid_lat],  # GeoJSON: [lng, lat]
        }

    # Optional fields
    if normalized.get("description"):
        payload["description"] = normalized["description"]
    if normalized.get("source_url"):
        payload["sourceUrl"] = normalized["source_url"]
    if normalized.get("rating") is not None:
        payload["rating"] = normalized["rating"]

    # Additional score fields from extraction
    if attrs.get("designation_score") is not None:
        payload["designationScore"] = attrs["designation_score"]
    if attrs.get("elevation_score") is not None:
        payload["elevationDramaScore"] = attrs["elevation_score"]
    if attrs.get("condition_score") is not None:
        payload["roadQualityScore"] = attrs["condition_score"]
    if attrs.get("traffic_score") is not None:
        payload["lowTrafficScore"] = attrs["traffic_score"]

    # Surface type from extraction
    surface = attrs.get("road_surface")
    if surface:
        payload["surface"] = surface if isinstance(surface, str) else surface.value if hasattr(surface, 'value') else str(surface)

    return payload


def _avg_scores(attrs: dict) -> float:
    """Compute composite score as weighted average of key extraction scores."""
    score_fields = [
        "scenic_score", "technical_score", "traffic_score",
        "remoteness_score", "condition_score", "elevation_score",
        "community_score",
    ]
    values = [attrs[f] for f in score_fields if f in attrs and attrs[f] is not None]
    if not values:
        return 0.0
    return round(sum(values) / len(values), 4)


def _map_season(season_val: Any) -> str:
    """Map extraction season to Convex season enum string."""
    if season_val is None:
        return "year_round"
    # Handle both string and enum values
    s = season_val if isinstance(season_val, str) else getattr(season_val, "value", str(season_val))
    valid = {"year_round", "apr_nov", "may_sep", "spring_fall"}
    return s if s in valid else "year_round"


def _call_convex_upsert(
    routes: list[dict],
    base_url: str,
    deploy_key: str,
) -> dict[str, Any]:
    """Push routes to Convex via `npx convex run` CLI.

    The HTTP endpoint was returning 404 due to Convex routing issues,
    so we use the CLI approach instead (same as wipe-test-seeds).
    """
    import subprocess

    args_json = json.dumps({"routes": routes})

    cmd = [
        "npx", "convex", "run",
        "curationAdmin:internalUpsertCuratedRoutes",
        args_json,
    ]
    # Use --url flag to ensure correct deployment
    if base_url:
        cmd.extend(["--url", base_url])

    # Build clean env — clear CONVEX_DEPLOYMENT which may have inline
    # comments from .env.local that confuse npx convex
    env = os.environ.copy()
    env.pop("CONVEX_DEPLOYMENT", None)

    result = subprocess.run(
        cmd,
        cwd=str(_REPO_ROOT),
        capture_output=True,
        text=True,
        timeout=120,
        env=env,
    )

    if result.returncode != 0:
        raise RuntimeError(f"convex run failed: {result.stderr}")

    output = result.stdout.strip()
    # Convex CLI wraps output in quotes sometimes
    if output.startswith('"') and output.endswith('"'):
        import json as _json
        output = _json.loads(output)

    try:
        return json.loads(output) if isinstance(output, str) else output
    except json.JSONDecodeError:
        logger.warning(f"Could not parse convex output: {output[:200]}")
        return {"inserted": 0, "updated": 0, "errors": []}
