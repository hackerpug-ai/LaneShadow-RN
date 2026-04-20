"""CLI entrypoint for the curation pipeline state manager.

Usage:
    python -m scripts.curation.pipeline.state_manager <command> [options]

Subcommands:
    status          Print per-stage counts and cumulative cost
    ingest          Load staging JSONL into state table
    extract         Run LLM extraction on pending routes
    push            Push extracted routes to Convex
    embed           Embed all pushed routes
    quality-report  Write markdown quality report
    wipe-test-seeds Delete editorial test seeds from Convex
    reset           Clear stage timestamps for re-run
"""

from __future__ import annotations

import argparse
import logging
import os
import subprocess
import sys
from pathlib import Path

_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent

logger = logging.getLogger(__name__)


def _load_dotenv() -> None:
    """Load .env.local if present (minimal implementation)."""
    env_path = _REPO_ROOT / ".env.local"
    if not env_path.exists():
        return
    with open(env_path) as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                key, _, val = line.partition("=")
                key = key.strip()
                val = val.strip()
                if key and (key not in os.environ or not os.environ[key]):
                    os.environ[key] = val


def _get_conn():
    """Return initialized DB connection."""
    from scripts.curation.pipeline.state_manager.db import DB_PATH, init_db, get_connection
    init_db(DB_PATH)
    return get_connection(DB_PATH)


def cmd_status(args: argparse.Namespace) -> int:
    """Print per-stage counts and cumulative cost."""
    from scripts.curation.pipeline.state_manager.db import get_status_summary

    conn = _get_conn()
    summary = get_status_summary(conn)
    conn.close()

    print("\n=== Pipeline Status ===\n")

    by_source = summary.get("by_source", [])
    if not by_source:
        print("No routes in state table yet. Run 'ingest --source all' first.")
        return 0

    # Header
    print(f"{'Source':<20} {'Total':>7} {'Ingested':>10} {'Extracted':>11} {'Pushed':>8} {'Embedded':>9} {'Errors':>8} {'Excluded':>10} {'Cost':>10}")
    print("-" * 100)
    for row in by_source:
        print(
            f"{row['source']:<20} {row['total']:>7} {row['ingested']:>10} "
            f"{row['extracted']:>11} {row['pushed']:>8} {row['embedded']:>9} "
            f"{row['errors']:>8} {row.get('excluded', 0):>10} ${row['cost']:>9.4f}"
        )

    totals = summary.get("totals", {})
    if totals:
        print("-" * 100)
        print(
            f"{'TOTAL':<20} {totals.get('total', 0):>7} {totals.get('ingested', 0):>10} "
            f"{totals.get('extracted', 0):>11} {totals.get('pushed', 0):>8} "
            f"{totals.get('embedded', 0):>9} {totals.get('errors', 0):>8} "
            f"{totals.get('excluded', 0):>10} "
            f"${totals.get('cost', 0):>9.4f}"
        )

    errors = summary.get("error_breakdown", [])
    if errors:
        print("\n=== Errors by Stage ===")
        for e in errors:
            print(f"  {e['error_stage']}: {e['cnt']} routes")

    print()
    return 0


def cmd_ingest(args: argparse.Namespace) -> int:
    """Load staging JSONL into state table."""
    from scripts.curation.pipeline.state_manager.stages import ingest

    conn = _get_conn()
    try:
        stats = ingest(conn, source=args.source)
    finally:
        conn.close()

    print("\n=== Ingest Results ===")
    for src, s in stats.items():
        print(f"  {src}: inserted={s['inserted']} skipped={s['skipped']} errors={s['errors']}")
    print()
    return 0


def cmd_extract(args: argparse.Namespace) -> int:
    """Run LLM extraction on pending routes."""
    from scripts.curation.pipeline.state_manager.stages import extract

    conn = _get_conn()
    try:
        stats = extract(
            conn,
            limit=args.limit,
            retry_errors=args.retry_errors,
            dry_run=args.dry_run,
        )
    finally:
        conn.close()

    print("\n=== Extract Results ===")
    print(f"  processed={stats['processed']}")
    print(f"  succeeded={stats['succeeded']}")
    print(f"  failed={stats['failed']}")
    print(f"  cost=${stats['cost_usd']:.4f}")
    if args.dry_run:
        print("  [DRY RUN — no state changes committed]")
    print()
    return 0


def cmd_push(args: argparse.Namespace) -> int:
    """Push extracted routes to Convex."""
    from scripts.curation.pipeline.state_manager.stages import push

    conn = _get_conn()
    try:
        stats = push(conn, limit=args.limit)
    finally:
        conn.close()

    print("\n=== Push Results ===")
    print(f"  sent={stats['sent']}")
    print(f"  inserted={stats['inserted']}")
    print(f"  updated={stats['updated']}")
    print(f"  failed={stats['failed']}")
    print()
    return 0


def cmd_geocode(args: argparse.Namespace) -> int:
    """Geocode routes — fetch lat/lng coordinates."""
    from scripts.curation.pipeline.state_manager.stages import geocode

    conn = _get_conn()
    try:
        stats = geocode(conn, limit=args.limit, retry_errors=args.retry_errors)
    finally:
        conn.close()

    print("\n=== Geocode Results ===")
    print(f"  processed={stats['processed']}")
    print(f"  succeeded={stats['succeeded']}")
    print(f"  failed={stats['failed']}")
    print()
    return 0


def cmd_enrich_bbr(args: argparse.Namespace) -> int:
    """Enrich BBR routes with real polyline geometry."""
    from scripts.curation.pipeline.state_manager.stages import enrich_bbr

    conn = _get_conn()
    try:
        stats = enrich_bbr(conn, limit=args.limit, retry_errors=args.retry_errors)
    finally:
        conn.close()

    print("\n=== BBR Polyline Enrichment Results ===")
    print(f"  processed={stats['processed']}")
    print(f"  succeeded={stats['succeeded']}")
    print(f"  failed={stats['failed']}")
    print()
    return 0


def cmd_embed(args: argparse.Namespace) -> int:
    """Embed all pushed routes."""
    from scripts.curation.pipeline.state_manager.stages import embed

    conn = _get_conn()
    try:
        stats = embed(conn, limit=args.limit)
    finally:
        conn.close()

    print("\n=== Embed Results ===")
    print(f"  embedded={stats['embedded']}")
    print(f"  failed={stats['failed']}")
    print()
    return 0


def cmd_grade(args: argparse.Namespace) -> int:
    """Grade route quality (tier + flags)."""
    from scripts.curation.pipeline.state_manager.grading import grade_all

    conn = _get_conn()
    try:
        stats = grade_all(
            conn,
            source=args.source,
            tier_filter=args.tier_filter,
        )
    finally:
        conn.close()

    print("\n=== Quality Grading Results ===")
    print(f"  Total graded: {stats['total']}")
    print(f"  HIGH:   {stats['HIGH']}")
    print(f"  MEDIUM: {stats['MEDIUM']}")
    print(f"  LOW:    {stats['LOW']}")
    print(f"  UNUSABLE: {stats['UNUSABLE']}")
    print(f"  Flagged: {stats['flagged_count']}")

    if stats["flagged_routes"]:
        print(f"\n  Top flagged routes (showing {min(len(stats['flagged_routes']), 20)}):")
        for r in stats["flagged_routes"][:20]:
            print(f"    [{r['tier']}] {r['route_id']}: {r['name'] or '(unnamed)'} — flags={r['flags']}")

    print()
    return 0


def cmd_exclude(args: argparse.Namespace) -> int:
    """Soft-exclude routes by quality tier."""
    import time as _time
    from scripts.curation.pipeline.state_manager.db import upsert_route_state

    conn = _get_conn()
    try:
        where_clauses = ["quality_tier = ?"]
        params: list[str] = [args.tier]
        if args.source:
            where_clauses.append("source = ?")
            params.append(args.source)
        where_clauses.append("excluded_at IS NULL")

        sql = f"SELECT route_id, source, route_name, raw_staging_json FROM route_state WHERE {' AND '.join(where_clauses)}"
        rows = conn.execute(sql, params).fetchall()

        if not rows:
            print(f"\nNo {args.tier} routes to exclude.")
            return 0

        if args.dry_run:
            print(f"\nWould exclude {len(rows)} {args.tier} routes:")
            for r in rows[:20]:
                print(f"  {r['route_id']}: {r['route_name'] or '(unnamed)'}")
            if len(rows) > 20:
                print(f"  ... and {len(rows) - 20} more")
            return 0

        now = int(_time.time())
        for row in rows:
            upsert_route_state(
                conn,
                route_id=row["route_id"],
                source=row["source"],
                raw_staging_json=row["raw_staging_json"],
                excluded_at=now,
            )

        print(f"\nExcluded {len(rows)} {args.tier} routes (set excluded_at={now})")
    finally:
        conn.close()
    return 0


def cmd_quality_report(args: argparse.Namespace) -> int:
    """Write markdown quality report."""
    from scripts.curation.pipeline.state_manager.quality import generate_quality_report, REPORT_PATH

    conn = _get_conn()
    try:
        report = generate_quality_report(conn)
    finally:
        conn.close()

    print(f"\nQuality report written to: {REPORT_PATH}")
    # Print summary section
    lines = report.split("\n")
    summary_lines = lines[:40]
    print("\n".join(summary_lines))
    if len(lines) > 40:
        print(f"... ({len(lines) - 40} more lines — see full report)")
    print()
    return 0


def cmd_wipe_test_seeds(args: argparse.Namespace) -> int:
    """Delete editorial test seeds from Convex.

    Creates a throwaway admin mutation, runs it, verifies deletion,
    then deletes the mutation file and re-deploys.
    """
    from scripts.curation.pipeline.state_manager.db import record_run_start, record_run_finish

    convex_dir = _REPO_ROOT / "convex"
    admin_file = convex_dir / "admin_wipe_seeds.ts"

    mutation_code = """\
import { mutation } from "./_generated/server";
export const wipeTestSeeds = mutation({
  args: {},
  handler: async (ctx) => {
    const seeds = await ctx.db.query("curated_routes").filter(
      q => q.eq(q.field("source"), "editorial")
    ).collect();
    let count = 0;
    for (const seed of seeds) {
      await ctx.db.delete(seed._id);
      count++;
    }
    return { deleted: count };
  },
});
"""

    conn = _get_conn()
    run_id = record_run_start(conn, "wipe-seeds")

    try:
        # Step 1: Write the throwaway mutation
        print("Writing admin_wipe_seeds.ts...")
        admin_file.write_text(mutation_code)

        # Step 2: Deploy once to register the mutation
        print("Deploying (npx convex dev --once)...")
        result = subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(_REPO_ROOT),
            capture_output=False,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(f"convex dev --once failed with exit code {result.returncode}")

        # Step 3: Run the mutation
        print("Running wipeTestSeeds mutation...")
        result = subprocess.run(
            ["npx", "convex", "run", "admin_wipe_seeds:wipeTestSeeds"],
            cwd=str(_REPO_ROOT),
            capture_output=True,
            text=True,
            timeout=60,
        )
        if result.returncode != 0:
            raise RuntimeError(f"wipeTestSeeds mutation failed: {result.stderr}")

        import json as _json
        output = result.stdout.strip()
        try:
            resp = _json.loads(output)
            deleted = resp.get("deleted", 0)
            print(f"Deleted {deleted} editorial test seeds from Convex.")
        except _json.JSONDecodeError:
            print(f"Mutation output: {output}")
            deleted = 0

        # Step 4: Delete the throwaway file
        print("Removing admin_wipe_seeds.ts...")
        admin_file.unlink(missing_ok=True)

        # Step 5: Re-deploy to remove the mutation from deployment
        print("Re-deploying to remove wipeTestSeeds from deployment...")
        result = subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(_REPO_ROOT),
            capture_output=False,
            text=True,
            timeout=120,
        )
        if result.returncode != 0:
            raise RuntimeError(
                f"Final convex dev --once failed with exit code {result.returncode}. "
                f"admin_wipe_seeds.ts has been deleted but re-deploy failed. "
                "Re-run 'npx convex dev --once' manually."
            )

        print("Wipe-test-seeds complete.")
        record_run_finish(conn, run_id, "success", routes_processed=deleted, routes_succeeded=deleted)

    except Exception as e:
        # Ensure throwaway file is cleaned up even on error
        if admin_file.exists():
            admin_file.unlink(missing_ok=True)
            print(f"Cleaned up admin_wipe_seeds.ts after error: {e}")
        record_run_finish(conn, run_id, "failure", notes=str(e))
        print(f"ERROR: {e}", file=sys.stderr)
        return 1
    finally:
        conn.close()

    return 0


def cmd_reset(args: argparse.Namespace) -> int:
    """Clear stage timestamps for re-run."""
    from scripts.curation.pipeline.state_manager.db import reset_stage

    conn = _get_conn()
    try:
        count = reset_stage(conn, stage=args.stage, source=args.source)
    finally:
        conn.close()

    source_str = f" (source={args.source})" if args.source else ""
    print(f"Reset {count} routes for stage={args.stage}{source_str}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    """Build the argument parser."""
    parser = argparse.ArgumentParser(
        prog="python -m scripts.curation.pipeline.state_manager",
        description="Curation pipeline state manager",
    )
    parser.add_argument(
        "--verbose", "-v", action="store_true", help="Enable debug logging"
    )

    sub = parser.add_subparsers(dest="command", required=True)

    # status
    sub.add_parser("status", help="Print per-stage counts and cost")

    # ingest
    p_ingest = sub.add_parser("ingest", help="Load staging JSONL into state table")
    p_ingest.add_argument(
        "--source",
        choices=["motorcycleroads", "bestbikingroads", "fhwa", "scenic_byways", "rider_mag", "all"],
        default="all",
        help="Source to ingest (default: all)",
    )

    # extract
    p_extract = sub.add_parser("extract", help="Run LLM extraction on pending routes")
    p_extract.add_argument("--limit", type=int, default=None, help="Max routes to process")
    p_extract.add_argument(
        "--retry-errors",
        action="store_true",
        help="Retry routes that previously errored in extraction",
    )
    p_extract.add_argument(
        "--dry-run",
        action="store_true",
        help="Process 5 routes without committing to state table",
    )

    # push
    p_push = sub.add_parser("push", help="Push extracted routes to Convex")
    p_push.add_argument("--limit", type=int, default=None, help="Max routes to push")

    # geocode
    p_geocode = sub.add_parser("geocode", help="Fetch lat/lng coordinates for routes")
    p_geocode.add_argument("--limit", type=int, default=None, help="Max routes to geocode")
    p_geocode.add_argument(
        "--retry-errors",
        action="store_true",
        help="Retry routes that previously errored at geocode stage",
    )

    # embed
    p_embed = sub.add_parser("embed", help="Embed all pushed routes")
    p_embed.add_argument("--limit", type=int, default=None, help="Max routes to embed")

    # enrich-bbr
    p_enrich = sub.add_parser("enrich-bbr", help="Enrich BBR routes with polyline geometry")
    p_enrich.add_argument("--limit", type=int, default=None, help="Max routes to enrich")
    p_enrich.add_argument(
        "--retry-errors",
        action="store_true",
        help="Retry routes that previously errored during enrichment",
    )

    # grade
    p_grade = sub.add_parser("grade", help="Grade route quality (tier + flags)")
    p_grade.add_argument("--source", default=None, help="Limit to a specific source")
    p_grade.add_argument(
        "--tier-filter",
        choices=["HIGH", "MEDIUM", "LOW", "UNUSABLE"],
        default=None,
        help="Show only flagged routes matching this tier",
    )

    # quality-report
    sub.add_parser("quality-report", help="Write markdown quality report")

    # exclude
    p_exclude = sub.add_parser("exclude", help="Soft-exclude routes by quality tier")
    p_exclude.add_argument(
        "--tier",
        choices=["UNUSABLE", "LOW"],
        required=True,
        help="Quality tier to exclude",
    )
    p_exclude.add_argument("--source", default=None, help="Limit to a specific source")
    p_exclude.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be excluded without making changes",
    )

    # wipe-test-seeds
    sub.add_parser("wipe-test-seeds", help="Delete editorial test seeds from Convex")

    # reset
    p_reset = sub.add_parser("reset", help="Clear stage timestamps for re-run")
    p_reset.add_argument(
        "--stage",
        choices=["ingest", "extract", "geocode", "push", "embed"],
        required=True,
        help="Stage to reset",
    )
    p_reset.add_argument("--source", default=None, help="Limit to a specific source")

    return parser


COMMAND_MAP = {
    "status": cmd_status,
    "ingest": cmd_ingest,
    "extract": cmd_extract,
    "geocode": cmd_geocode,
    "grade": cmd_grade,
    "push": cmd_push,
    "embed": cmd_embed,
    "enrich-bbr": cmd_enrich_bbr,
    "exclude": cmd_exclude,
    "quality-report": cmd_quality_report,
    "wipe-test-seeds": cmd_wipe_test_seeds,
    "reset": cmd_reset,
}


def main(argv: list[str] | None = None) -> int:
    """Main entrypoint for the CLI."""
    _load_dotenv()

    parser = build_parser()
    args = parser.parse_args(argv)

    level = logging.DEBUG if args.verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        datefmt="%H:%M:%S",
    )

    handler = COMMAND_MAP.get(args.command)
    if handler is None:
        print(f"Unknown command: {args.command}", file=sys.stderr)
        return 1

    return handler(args)


if __name__ == "__main__":
    sys.exit(main())
