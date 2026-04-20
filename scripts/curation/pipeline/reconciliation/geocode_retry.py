"""Retry geocoding failed routes with improved search terms from Jina research.

Uses better Nominatim queries discovered via web search to geocode the 19
routes that failed in the initial pass.

Usage:
    python -m scripts.curation.pipeline.reconciliation.geocode_retry [--dry-run]
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

import httpx

REPO_ROOT = Path(__file__).resolve().parents[4]
RESULTS_PATH = Path(__file__).parent / "geocode_results.json"

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "LaneShadowCuration/1.0 (laneshadow.com)"
_MIN_INTERVAL = 1.1
_last_time: float = 0.0

# Improved queries from Jina research — keyed by route_id
IMPROVED_QUERIES: dict[str, list[str]] = {
    "rider-mag-02-jasper-disaster-loop": [
        "Highway 7, Jasper, Arkansas",
        "Arkansas Scenic 7 Byway, Jasper, Arkansas",
    ],
    "rider-mag-03-pig-trail-scenic-byway": [
        "Arkansas Highway 23, Ozark, Arkansas",
        "Pig Trail, Arkansas Highway 23",
    ],
    "rider-mag-06-arizona-routes-89-89a": [
        "US Highway 89, Sedona, Arizona",
        "Arizona State Route 89A, Flagstaff, Arizona",
    ],
    "rider-mag-08-serpent-to-the-sea": [
        "California State Route 36, Platina, California",
        "SR 36, Trinity County, California",
    ],
    "rider-mag-12-georgia-triangle": [
        "Wolf Pen Gap Road, Suches, Georgia",
        "Georgia State Route 60, Suches, Georgia",
    ],
    "rider-mag-15-kentucky-coal-route": [
        "US Route 23, Pikeville, Kentucky",
        "Country Music Highway, Kentucky",
    ],
    "rider-mag-16-red-river-gorge-scenic-byway": [
        "Red River Gorge, Slade, Kentucky",
        "Natural Bridge State Park, Slade, Kentucky",
    ],
    "rider-mag-22-great-river-road-national-scenic-byway": [
        "Great River Road, Minnesota",
        "Mississippi River Parkway, Wisconsin",
    ],
    "rider-mag-25-north-carolina-route-28": [
        "NC Highway 28, Bryson City, North Carolina",
        "North Carolina Route 28, Fontana Dam",
    ],
    "rider-mag-29-enchanted-circle-scenic-byway": [
        "Enchanted Circle, Taos, New Mexico",
        "SR 522, Questa, New Mexico",
    ],
    "rider-mag-30-great-continental-divide-route": [
        "Continental Divide, Colorado",
        "Great Continental Divide, New Mexico",
    ],
    "rider-mag-31-u-s-route-50-in-nevada": [
        "US Highway 50, Eureka, Nevada",
        "Loneliest Road in America, Nevada",
    ],
    "rider-mag-32-upper-delaware-scenic-byway": [
        "NY Route 97, Hancock, New York",
        "Upper Delaware Scenic River, New York",
    ],
    "rider-mag-34-mount-hood-scenic-byway": [
        "Mount Hood, Oregon",
        "Mount Hood National Forest, Oregon",
    ],
    "rider-mag-38-tail-of-the-dragon": [
        "US 129, Deals Gap, North Carolina",
        "Tail of the Dragon, Deals Gap, Tennessee",
    ],
    "rider-mag-44-back-of-the-dragon": [
        "Virginia Route 16, Tazewell, Virginia",
        "Back of the Dragon, Marion, Virginia",
    ],
    "rider-mag-46-north-cascades-scenic-highway": [
        "Washington State Route 20, Sedro-Woolley, Washington",
        "North Cascades Highway, SR 20, Washington",
    ],
    "rider-mag-47-door-county-coastal-byway": [
        "Door County, Sturgeon Bay, Wisconsin",
        "Door County Coastal Byway, Wisconsin",
    ],
    "rider-mag-49-u-s-route-33-in-west-virginia": [
        "US Route 33, Elkins, West Virginia",
        "US 33, Seneca Rocks, West Virginia",
    ],
}


def _rate_limit() -> None:
    global _last_time
    elapsed = time.monotonic() - _last_time
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)


def _geocode(query: str) -> Optional[tuple[float, float]]:
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


def run_convex_patch_coords(base_url: str, updates: list[dict]) -> dict:
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


def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Retry geocoding with improved queries")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--base-url", default=None)
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    with open(RESULTS_PATH) as f:
        results = json.load(f)

    failed = results["failed"]
    if not failed:
        print("No failed routes to retry.")
        return 0

    # Build lookup: route_id -> failed entry
    failed_by_id = {f["route_id"]: f for f in failed}

    base_url = args.base_url or os.environ.get("EXPO_PUBLIC_CONVEX_URL", "")

    print(f"\n=== Geocode Retry Plan ===")
    print(f"  Failed routes: {len(failed)}")
    print(f"  With improved queries: {len(IMPROVED_QUERIES)}")
    print()

    geocoded = []
    still_failed = []

    for i, entry in enumerate(failed):
        route_id = entry["route_id"]
        name = entry["name"]
        state = entry["state"]

        queries = IMPROVED_QUERIES.get(route_id, [])

        print(f"  [{i+1}/{len(failed)}] {name} ({state})")

        if not queries:
            print(f"       No improved queries available")
            still_failed.append(entry)
            continue

        if args.dry_run:
            for q in queries:
                print(f"       Would try: {q}")
            continue

        coords = None
        for q in queries:
            print(f"       Trying: {q}")
            coords = _geocode(q)
            if coords:
                lat, lng = coords
                print(f"       Result: {lat:.4f}, {lng:.4f}")
                geocoded.append({
                    "route_id": route_id,
                    "name": name,
                    "state": state,
                    "lat": lat,
                    "lng": lng,
                    "query": q,
                })
                break

        if not coords:
            print(f"       Result: NO MATCH")
            still_failed.append(entry)

    print(f"\n=== Retry Results ===")
    print(f"  Newly geocoded: {len(geocoded)}")
    print(f"  Still failed:   {len(still_failed)}")

    if still_failed:
        print("\n  Still failed routes:")
        for f in still_failed:
            print(f"    {f['name']} ({f['state']})")

    if args.dry_run:
        print("\n[DRY RUN — no changes made]")
        return 0

    # Patch newly geocoded routes into Convex
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

        print(f"\nPatching {len(coord_updates)} newly geocoded routes...")
        result = run_convex_patch_coords(base_url, coord_updates)
        print(f"  Patch result: {result}")

    # Update geocode_results.json
    results["geocoded"].extend(geocoded)
    results["failed"] = still_failed

    with open(RESULTS_PATH, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nUpdated results saved to {RESULTS_PATH}")

    print("\nGeocode retry complete!")
    return 0


if __name__ == "__main__":
    sys.exit(main())
