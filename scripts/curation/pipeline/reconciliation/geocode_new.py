"""Geocode unmatched rider_mag routes via Nominatim.

For each "new" route in match_report.json, geocodes the route name + state
via Nominatim to get real centroid coordinates. Then updates the Convex
documents with the real coordinates.

Usage:
    python -m scripts.curation.pipeline.reconciliation.geocode_new [--dry-run] [--limit N]
"""

from __future__ import annotations

import json
import logging
import os
import subprocess
import sys
import time
from pathlib import Path
from typing import Optional
from urllib.parse import quote_plus

import httpx

REPO_ROOT = Path(__file__).resolve().parents[4]
REPORT_PATH = Path(__file__).parent / "match_report.json"
STAGING_PATH = REPO_ROOT / "staging" / "rider_mag.jsonl"

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "LaneShadowCuration/1.0 (laneshadow.com)"
_MIN_INTERVAL = 1.1
_last_time: float = 0.0


def _rate_limit() -> None:
    global _last_time
    elapsed = time.monotonic() - _last_time
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)


def _geocode(query: str) -> Optional[tuple[float, float]]:
    """Geocode a query via Nominatim. Returns (lat, lng) or None."""
    global _last_time
    _rate_limit()

    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "us,ca",
    }

    try:
        response = httpx.get(
            NOMINATIM_URL,
            params=params,
            headers={"User-Agent": NOMINATIM_USER_AGENT},
            timeout=15,
        )
        _last_time = time.monotonic()
        response.raise_for_status()
        results = response.json()

        if results:
            return (float(results[0]["lat"]), float(results[0]["lon"]))
        return None

    except Exception as e:
        logger.warning(f"Geocode error for '{query}': {e}")
        return None


def _build_geocode_query(name: str, state: str) -> str:
    """Build a Nominatim query from route name and state."""
    # Take the first state for multi-state routes
    primary_state = state.split("/")[0].strip() if state else ""
    return f"{name}, {primary_state}, USA"


def run_convex_upsert(base_url: str, routes: list[dict]) -> dict:
    """Push routes to Convex via npx convex run."""
    args_json = json.dumps({"routes": routes})

    cmd = [
        "npx", "convex", "run",
        "curationAdmin:internalUpsertCuratedRoutes",
        args_json,
    ]
    if base_url:
        cmd.extend(["--url", base_url])

    env = os.environ.copy()
    env.pop("CONVEX_DEPLOYMENT", None)

    result = subprocess.run(
        cmd,
        cwd=str(REPO_ROOT / "server"),
        capture_output=True,
        text=True,
        timeout=120,
        env=env,
    )
    if result.returncode != 0:
        raise RuntimeError(f"convex run failed: {result.stderr}")

    output = result.stdout.strip()
    if output.startswith('"') and output.endswith('"'):
        output = json.loads(output)

    return json.loads(output) if isinstance(output, str) else output


def run_convex_patch_coords(base_url: str, updates: list[dict]) -> dict:
    """Patch centroid coordinates into existing routes via temporary mutation."""
    convex_dir = REPO_ROOT / "server" / "convex"
    patch_file = convex_dir / "admin_patch_coords.ts"

    mutation_code = """\
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const patchCoordinates = mutation({
  args: {
    updates: v.array(v.object({
      routeId: v.string(),
      centroidLat: v.number(),
      centroidLng: v.number(),
      boundsNeLat: v.number(),
      boundsNeLng: v.number(),
      boundsSwLat: v.number(),
      boundsSwLng: v.number(),
      location: v.optional(v.object({
        type: v.literal("Point"),
        coordinates: v.array(v.number()),
      })),
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
        await ctx.db.patch(existing._id, u);
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

        logger.info("Deploying coordinate patch mutation...")
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
        cmd = ["npx", "convex", "run", "admin_patch_coords:patchCoordinates", args_json]
        if base_url:
            cmd.extend(["--url", base_url])

        logger.info(f"Patching {len(updates)} routes with coordinates...")
        result = subprocess.run(
            cmd,
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        if result.returncode != 0:
            raise RuntimeError(f"Patch failed: {result.stderr[:300]}")

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
        logger.info("Cleaning up coordinate patch mutation...")
        subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )


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


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Geocode unmatched rider_mag routes")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done")
    parser.add_argument("--limit", type=int, default=None, help="Max routes to geocode")
    parser.add_argument("--base-url", default=None, help="Convex deployment URL")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    if not REPORT_PATH.exists():
        print(f"Match report not found: {REPORT_PATH}")
        print("Run match_rider_mag.py first.")
        return 1

    with open(REPORT_PATH) as f:
        report = json.load(f)

    new_routes = report.get("new", [])
    if not new_routes:
        print("No new routes to geocode.")
        return 0

    if args.limit:
        new_routes = new_routes[:args.limit]

    base_url = args.base_url or os.environ.get("EXPO_PUBLIC_CONVEX_URL", "")
    staging_routes = load_staging_routes()

    print(f"\n=== Geocode Plan ===")
    print(f"  Routes to geocode: {len(new_routes)}")
    print()

    geocoded = []
    failed = []

    for i, entry in enumerate(new_routes):
        route_id = entry["route_id"]
        name = entry["name"]
        state = entry["state"]

        staging = staging_routes.get(route_id, {})
        query = _build_geocode_query(name, state)

        print(f"  [{i+1}/{len(new_routes)}] {name} ({state})")
        print(f"       Query: {query}")

        if args.dry_run:
            continue

        coords = _geocode(query)
        if coords:
            lat, lng = coords
            print(f"       Result: {lat:.4f}, {lng:.4f}")
            geocoded.append({
                "route_id": route_id,
                "name": name,
                "state": state,
                "lat": lat,
                "lng": lng,
            })
        else:
            print(f"       Result: NO MATCH")
            failed.append({"route_id": route_id, "name": name, "state": state})

    print(f"\n=== Geocode Results ===")
    print(f"  Geocoded: {len(geocoded)}")
    print(f"  Failed:   {len(failed)}")

    if failed:
        print("\n  Failed routes:")
        for f in failed:
            print(f"    {f['name']} ({f['state']})")

    if args.dry_run:
        print("\n[DRY RUN — no changes made]")
        return 0

    # Patch coordinates into existing Convex documents
    if geocoded:
        coord_updates = []
        for g in geocoded:
            coord_updates.append({
                "routeId": g["route_id"],
                "centroidLat": g["lat"],
                "centroidLng": g["lng"],
                "boundsNeLat": g["lat"],
                "boundsNeLng": g["lng"],
                "boundsSwLat": g["lat"],
                "boundsSwLng": g["lng"],
                "location": {
                    "type": "Point",
                    "coordinates": [g["lng"], g["lat"]],
                },
            })

        print(f"\nPatching {len(coord_updates)} routes with real coordinates...")
        result = run_convex_patch_coords(base_url, coord_updates)
        print(f"  Patch result: {result}")

    # Save geocode results for reference
    results_path = Path(__file__).parent / "geocode_results.json"
    with open(results_path, "w") as f:
        json.dump({"geocoded": geocoded, "failed": failed}, f, indent=2)
    print(f"\nResults saved to {results_path}")

    print("\nGeocode complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
