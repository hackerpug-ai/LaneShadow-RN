"""Backfill editorial metadata from rider_mag into matched existing routes.

For each matched route in match_report.json, updates the existing Convex
document with rider_mag's unique fields:
  - editorialRank, groundTruth, groundTruthSource, groundTruthProvider
  - sourceCollection, sourceCollectionTitle, sourceRefs
  - sourceRank, sourceRankKind, sourceLabel, sourceUrl
  - candidateIdentifiers, descriptiveSummary

Then deletes the duplicate rider_mag route from Convex.

Usage:
    python -m scripts.curation.pipeline.reconciliation.backfill [--dry-run]
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[4]
REPORT_PATH = Path(__file__).parent / "match_report.json"
STAGING_PATH = REPO_ROOT / "staging" / "rider_mag.jsonl"

logger = logging.getLogger(__name__)


def load_staging_routes() -> dict[str, dict]:
    """Load rider_mag routes indexed by route_id."""
    routes = {}
    with open(STAGING_PATH) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            route = json.loads(line)
            routes[route["route_id"]] = route
    return routes


def build_backfill_payload(staging_route: dict) -> dict:
    """Extract rider_mag editorial fields from staging route for backfill."""
    return {
        "editorialRank": staging_route.get("editorial_rank"),
        "groundTruth": True,
        "groundTruthSource": staging_route.get("ground_truth_source", "rider_magazine_50_best"),
        "groundTruthProvider": staging_route.get("ground_truth_provider", "rider_mag"),
        "sourceCollection": staging_route.get("source_collection"),
        "sourceCollectionTitle": staging_route.get("source_collection_title"),
        "sourceRank": staging_route.get("editorial_rank"),
        "sourceRankKind": staging_route.get("source_rank_kind", "alphabetical_by_state_order"),
        "sourceLabel": staging_route.get("source_label", "Rider Magazine"),
        "sourceUrl": staging_route.get("source_url"),
        "sourceRefs": staging_route.get("source_refs", []),
        "candidateIdentifiers": staging_route.get("candidate_identifiers", []),
        "descriptiveSummary": staging_route.get("description"),
    }


def run_convex_patch(base_url: str, updates: list[dict]) -> dict:
    """Patch editorial metadata into existing routes via temporary mutation.

    Creates a temporary mutation that patches specific fields by routeId,
    avoiding the full curatedRouteValidator requirement.
    """
    convex_dir = REPO_ROOT / "server" / "convex"
    patch_file = convex_dir / "admin_patch_editorial.ts"

    mutation_code = """\
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const patchEditorialMetadata = mutation({
  args: {
    updates: v.array(v.object({
      routeId: v.string(),
      editorialRank: v.optional(v.number()),
      groundTruth: v.optional(v.boolean()),
      groundTruthSource: v.optional(v.string()),
      groundTruthProvider: v.optional(v.string()),
      sourceCollection: v.optional(v.string()),
      sourceCollectionTitle: v.optional(v.string()),
      sourceRank: v.optional(v.number()),
      sourceRankKind: v.optional(v.string()),
      sourceLabel: v.optional(v.string()),
      sourceUrl: v.optional(v.string()),
      sourceRefs: v.optional(v.array(v.string())),
      candidateIdentifiers: v.optional(v.array(v.string())),
      descriptiveSummary: v.optional(v.string()),
    })),
  },
  handler: async (ctx, { updates }) => {
    let updated = 0;
    const errors: string[] = [];
    for (const u of updates) {
      const existing = await ctx.db
        .query("curated_routes")
        .withIndex("by_routeId", (q) => q.eq("routeId", u.routeId))
        .first();
      if (existing) {
        const patch: Record<string, any> = {};
        for (const [k, v] of Object.entries(u)) {
          if (k !== "routeId" && v !== undefined) {
            patch[k] = v;
          }
        }
        await ctx.db.patch(existing._id, patch);
        updated++;
      } else {
        errors.push(`Route not found: ${u.routeId}`);
      }
    }
    return { updated, errors };
  },
});
"""
    try:
        patch_file.write_text(mutation_code)

        env = os.environ.copy()
        env.pop("CONVEX_DEPLOYMENT", None)

        logger.info("Deploying editorial patch mutation...")
        result = subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Deploy failed: {result.stderr[:300]}")

        args_json = json.dumps({"updates": updates})
        cmd = ["npx", "convex", "run", "admin_patch_editorial:patchEditorialMetadata", args_json]
        if base_url:
            cmd.extend(["--url", base_url])

        logger.info(f"Patching {len(updates)} routes with editorial metadata...")
        result = subprocess.run(
            cmd,
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Patch mutation failed: {result.stderr[:300]}")

        output = result.stdout.strip()
        if output.startswith('"') and output.endswith('"'):
            output = json.loads(output)

        resp = json.loads(output) if isinstance(output, str) else output
        logger.info(f"Patch result: {resp}")
        return resp

    finally:
        patch_file.unlink(missing_ok=True)
        env = os.environ.copy()
        env.pop("CONVEX_DEPLOYMENT", None)
        logger.info("Cleaning up patch mutation...")
        subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )


def run_convex_delete(base_url: str, route_ids: list[str]) -> None:
    """Delete duplicate rider_mag routes from Convex.

    Creates a temporary admin mutation to delete by routeId.
    """
    convex_dir = REPO_ROOT / "server" / "convex"
    admin_file = convex_dir / "admin_delete_matched.ts"

    mutation_code = """\
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteByRouteIds = mutation({
  args: { routeIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    let deleted = 0;
    for (const routeId of args.routeIds) {
      const existing = await ctx.db
        .query("curated_routes")
        .withIndex("by_routeId", q => q.eq("routeId", routeId))
        .first();
      if (existing) {
        await ctx.db.delete(existing._id);
        deleted++;
      }
    }
    return { deleted };
  },
});
"""
    try:
        admin_file.write_text(mutation_code)

        env = os.environ.copy()
        env.pop("CONVEX_DEPLOYMENT", None)

        logger.info("Deploying delete mutation...")
        result = subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Deploy failed: {result.stderr[:300]}")

        args_json = json.dumps({"routeIds": route_ids})
        cmd = ["npx", "convex", "run", "admin_delete_matched:deleteByRouteIds", args_json]
        if base_url:
            cmd.extend(["--url", base_url])

        logger.info(f"Deleting {len(route_ids)} matched rider_mag routes...")
        result = subprocess.run(
            cmd,
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=60,
            env=env,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Delete failed: {result.stderr[:300]}")

        output = result.stdout.strip()
        if output.startswith('"') and output.endswith('"'):
            output = json.loads(output)
        resp = json.loads(output) if isinstance(output, str) else output
        logger.info(f"Deleted {resp.get('deleted', 0)} routes")

    finally:
        admin_file.unlink(missing_ok=True)
        env = os.environ.copy()
        env.pop("CONVEX_DEPLOYMENT", None)
        subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Backfill editorial metadata for matched rider_mag routes")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument("--base-url", default=None, help="Convex deployment URL")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    if not REPORT_PATH.exists():
        print(f"Match report not found: {REPORT_PATH}")
        print("Run match_rider_mag.py first.")
        return 1

    with open(REPORT_PATH) as f:
        report = json.load(f)

    matched = report.get("matched", [])
    if not matched:
        print("No matched routes to backfill.")
        return 0

    base_url = args.base_url or os.environ.get("EXPO_PUBLIC_CONVEX_URL", "")

    # Load staging data for editorial fields
    staging_routes = load_staging_routes()

    # Build patch payloads — only editorial fields, keyed by existing routeId
    patch_updates = []
    rider_ids_to_delete = []

    for m in matched:
        rider_route_id = m["rider_route_id"]
        existing_route_id = m["existing_route_id"]

        staging = staging_routes.get(rider_route_id)
        if not staging:
            logger.warning(f"Staging route not found: {rider_route_id}")
            continue

        backfill = build_backfill_payload(staging)
        backfill["routeId"] = existing_route_id  # Target the existing route

        patch_updates.append(backfill)
        rider_ids_to_delete.append(rider_route_id)

    print(f"\n=== Backfill Plan ===")
    print(f"  Routes to enrich: {len(patch_updates)}")
    print(f"  Duplicate rider_mag routes to delete: {len(rider_ids_to_delete)}")

    for i, (m, u) in enumerate(zip(matched, patch_updates)):
        print(f"\n  [{i+1}] {m['rider_name']} -> {m['existing_name']} [{m['existing_source']}]")
        print(f"       Adding: editorialRank={u.get('editorialRank')}, groundTruth=True")
        print(f"       Deleting rider_mag route: {m['rider_route_id']}")

    if args.dry_run:
        print("\n[DRY RUN — no changes made]")
        return 0

    # Step 1: Backfill metadata into existing routes via patch mutation
    print(f"\nBackfilling editorial metadata...")
    result = run_convex_patch(base_url, patch_updates)
    print(f"  Patch result: {result}")

    # Step 2: Delete duplicate rider_mag routes
    print(f"\nDeleting duplicate rider_mag routes...")
    run_convex_delete(base_url, rider_ids_to_delete)

    print("\nBackfill complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
