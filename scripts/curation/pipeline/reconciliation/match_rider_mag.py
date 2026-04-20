"""Match Rider Magazine routes against existing Convex routes for dedup.

Reads all routes from Convex dev, loads rider_mag staging data,
and matches using fuzzy name + state comparison (difflib >= 0.85).

Outputs a match report:
  - matched: routes that exist in another source (enrich existing)
  - new: routes not found (geocode + insert fresh)
  - uncertain: partial matches needing human review

Usage:
    python -m scripts.curation.pipeline.reconciliation.match_rider_mag [--report-only] [--threshold 0.85]
"""

from __future__ import annotations

import difflib
import json
import logging
import os
import re
import sqlite3
import subprocess
import sys
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[4]
STAGING_PATH = REPO_ROOT / "staging" / "rider_mag.jsonl"

logger = logging.getLogger(__name__)


# ---------------------------------------------------------------------------
# Slugify helper — normalize route names for comparison
# ---------------------------------------------------------------------------

def _slugify(name: str) -> str:
    """Normalize a route name to a comparable slug."""
    s = name.lower().strip()
    # Remove common prefixes/suffixes
    for prefix in ("the ", "scenic ", "historic ", "national scenic byway",
                    "national scenic byway: ", "scenic byway: ",
                    "scenic highway: ", "scenic drive: "):
        if s.startswith(prefix):
            s = s[len(prefix):]
    for suffix in (" scenic byway", " scenic highway", " scenic drive",
                    " national scenic byway", " scenic route",
                    " byway", " highway", " drive", " route",
                    " parkway", " road"):
        if s.endswith(suffix) and len(s) > len(suffix) + 3:
            s = s[: -len(suffix)]
    # Strip non-alphanumeric
    s = re.sub(r"[^a-z0-9\s]", "", s)
    s = re.sub(r"\s+", " ", s).strip()
    return s


def _normalize_state(state: str) -> set[str]:
    """Extract state tokens from a possibly multi-state string."""
    # "Montana" → {"montana"}
    # "Mississippi / Alabama / Tennessee" → {"mississippi", "alabama", "tennessee"}
    tokens = re.split(r"[/,;]+", state.lower())
    return {t.strip() for t in tokens if t.strip()}


# ---------------------------------------------------------------------------
# Fetch routes from Convex
# ---------------------------------------------------------------------------

def fetch_convex_routes(base_url: str | None = None) -> list[dict]:
    """Fetch all non-rider_mag routes from Convex via one-off query.

    Uses the Convex MCP one-off query approach, falling back to npx convex run.
    """
    routes = []
    # We'll use a simple approach: run a query that returns routeId, name, state, source
    # via npx convex run with a temporary query function

    # Load from cached file if available (from MCP query)
    cached = Path(os.environ.get("CONVEX_CACHE_PATH", ""))
    if cached.exists():
        logger.info(f"Loading cached Convex data from {cached}")
        with open(cached) as f:
            wrapper = json.load(f)
        text = wrapper[0]["text"]
        data = json.loads(text)
        routes = data["result"]
        logger.info(f"Loaded {len(routes)} routes from cache")

    if not routes:
        # Fallback: use the existing MCP data file
        mcp_cache = Path.home() / ".claude" / "projects" / "-Users-justinrich-Projects-LaneShadow"
        for f in sorted(mcp_cache.glob("*/tool-results/mcp-convex-runOneoffQuery-*.txt"), reverse=True):
            try:
                with open(f) as fh:
                    wrapper = json.load(fh)
                text = wrapper[0]["text"]
                data = json.loads(text)
                batch = data["result"]
                routes.extend(batch)
                logger.info(f"Loaded {len(batch)} routes from {f.name}")
                break
            except Exception as e:
                logger.warning(f"Could not parse {f}: {e}")
                continue

    return routes


def fetch_convex_routes_via_cli(base_url: str) -> list[dict]:
    """Fetch all non-rider_mag routes from Convex using cached MCP data.

    Falls back to deploying a temporary query function if no cache is available.
    The cached MCP data covers the first 1000 routes (all current non-BBR routes).
    """
    # Try cached MCP data first
    mcp_cache = Path.home() / ".claude" / "projects" / "-Users-justinrich-Projects-LaneShadow"
    for f in sorted(mcp_cache.glob("*/tool-results/mcp-convex-runOneoffQuery-*.txt"), reverse=True):
        try:
            with open(f) as fh:
                wrapper = json.load(fh)
            text = wrapper[0]["text"]
            data = json.loads(text)
            routes = data["result"]
            non_rider = [r for r in routes if r.get("source") != "rider_mag"]
            if len(non_rider) >= 900:  # Reasonable threshold
                logger.info(f"Using cached MCP data: {len(non_rider)} non-rider_mag routes")
                return non_rider
        except Exception as e:
            logger.warning(f"Could not parse cached data from {f.name}: {e}")
            continue

    # Fallback: deploy temporary query
    convex_dir = REPO_ROOT / "server" / "convex"
    query_file = convex_dir / "reconciliation_query.ts"

    query_code = """\
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getRoutesPage = query({
  args: { numItems: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const numItems = args.numItems ?? 999;
    const page = await ctx.db.query("curated_routes")
      .order("asc")
      .paginate(null, { numItems });
    return page.page.map(r => ({
      _id: r._id,
      routeId: r.routeId,
      name: r.name,
      state: r.state,
      source: r.source,
      centroidLat: r.centroidLat,
      centroidLng: r.centroidLng,
    }));
  },
});
"""
    try:
        query_file.write_text(query_code)

        env = os.environ.copy()
        env.pop("CONVEX_DEPLOYMENT", None)

        logger.info("Deploying reconciliation query...")
        result = subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        if result.returncode != 0:
            logger.warning(f"Deploy failed: {result.stderr[:300]}")
            return []

        args_json = json.dumps({"numItems": 999})
        cmd = ["npx", "convex", "run", "reconciliation_query:getRoutesPage", args_json]
        if base_url:
            cmd.extend(["--url", base_url])

        logger.info("Fetching routes from Convex...")
        result = subprocess.run(
            cmd,
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
        if result.returncode != 0:
            logger.warning(f"Query failed: {result.stderr[:300]}")
            return []

        output = result.stdout.strip()
        if output.startswith('"') and output.endswith('"'):
            output = json.loads(output)

        routes = json.loads(output) if isinstance(output, str) else output
        non_rider = [r for r in routes if r.get("source") != "rider_mag"]
        logger.info(f"Fetched {len(non_rider)} non-rider_mag routes from Convex")
        return non_rider

    finally:
        query_file.unlink(missing_ok=True)
        env = os.environ.copy()
        env.pop("CONVEX_DEPLOYMENT", None)
        logger.info("Cleaning up reconciliation query...")
        subprocess.run(
            ["npx", "convex", "dev", "--once"],
            cwd=str(REPO_ROOT / "server"),
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )


# ---------------------------------------------------------------------------
# Load rider_mag staging data
# ---------------------------------------------------------------------------

def load_rider_mag_routes() -> list[dict]:
    """Load rider_mag routes from staging JSONL."""
    routes = []
    if not STAGING_PATH.exists():
        logger.error(f"Staging file not found: {STAGING_PATH}")
        return routes

    with open(STAGING_PATH) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            route = json.loads(line)
            routes.append(route)

    logger.info(f"Loaded {len(routes)} rider_mag routes from staging")
    return routes


# ---------------------------------------------------------------------------
# Matching logic
# ---------------------------------------------------------------------------

def match_routes(
    rider_routes: list[dict],
    existing_routes: list[dict],
    threshold: float = 0.85,
) -> dict[str, list[dict]]:
    """Match rider_mag routes against existing routes.

    Returns dict with keys:
      - matched: list of {rider_route, existing_route, confidence, method}
      - new: list of {rider_route}
      - uncertain: list of {rider_route, candidates: [{existing, confidence}]}
    """
    # Index existing routes by state tokens for fast lookup
    existing_by_state: dict[str, list[dict]] = {}
    for r in existing_routes:
        if r.get("source") == "rider_mag":
            continue  # Don't match against other rider_mag routes
        states = _normalize_state(r.get("state", ""))
        for st in states:
            existing_by_state.setdefault(st, []).append(r)

    # Also build a slug index for all existing routes
    existing_slugs: dict[str, dict] = {}
    for r in existing_routes:
        if r.get("source") == "rider_mag":
            continue
        name = r.get("name", "")
        if name:
            slug = _slugify(name)
            existing_slugs[slug] = r

    matched = []
    new_routes = []
    uncertain = []

    for rm_route in rider_routes:
        rm_name = rm_route.get("name", "")
        rm_state = rm_route.get("state", "")
        rm_slug = _slugify(rm_name)
        rm_states = _normalize_state(rm_state)

        best_match = None
        best_confidence = 0.0
        best_method = ""
        candidates = []

        # Strategy 1: Exact slug match
        if rm_slug in existing_slugs:
            existing = existing_slugs[rm_slug]
            # Verify state overlap
            ex_states = _normalize_state(existing.get("state", ""))
            if rm_states & ex_states or not rm_states or not ex_states:
                best_match = existing
                best_confidence = 0.98
                best_method = "exact_slug"

        # Strategy 2: Fuzzy match within same state
        if not best_match:
            candidates_in_state = []
            for st in rm_states:
                candidates_in_state.extend(existing_by_state.get(st, []))

            # Deduplicate
            seen_ids = set()
            unique_candidates = []
            for c in candidates_in_state:
                cid = c.get("routeId", "")
                if cid not in seen_ids:
                    seen_ids.add(cid)
                    unique_candidates.append(c)

            for candidate in unique_candidates:
                ex_name = candidate.get("name", "")
                ex_slug = _slugify(ex_name)

                # Compare slugs
                slug_ratio = difflib.SequenceMatcher(None, rm_slug, ex_slug).ratio()
                name_ratio = difflib.SequenceMatcher(None, rm_name.lower(), ex_name.lower()).ratio()
                confidence = max(slug_ratio, name_ratio)

                if confidence >= threshold:
                    candidates.append({
                        "existing": candidate,
                        "confidence": round(confidence, 3),
                    })

                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match = candidate
                    best_method = f"fuzzy(slug={slug_ratio:.2f},name={name_ratio:.2f})"

        # Strategy 3: Fuzzy match across ALL routes (no state filter)
        if not best_match or best_confidence < threshold:
            for slug, existing in existing_slugs.items():
                slug_ratio = difflib.SequenceMatcher(None, rm_slug, slug).ratio()
                if slug_ratio >= 0.90:  # Higher threshold for cross-state
                    ex_states = _normalize_state(existing.get("state", ""))
                    # Require at least partial state overlap for cross-state matches
                    if rm_states & ex_states:
                        if slug_ratio > best_confidence:
                            best_confidence = slug_ratio
                            best_match = existing
                            best_method = f"cross_state(slug={slug_ratio:.2f})"

        if best_match and best_confidence >= threshold:
            matched.append({
                "rider_route": rm_route,
                "existing_route": best_match,
                "confidence": round(best_confidence, 3),
                "method": best_method,
            })
        elif candidates:
            uncertain.append({
                "rider_route": rm_route,
                "candidates": sorted(candidates, key=lambda x: -x["confidence"])[:3],
            })
        else:
            new_routes.append({"rider_route": rm_route})

    return {
        "matched": matched,
        "new": new_routes,
        "uncertain": uncertain,
    }


# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------

def print_report(results: dict[str, list[dict]]) -> None:
    """Print a human-readable match report."""
    matched = results["matched"]
    new = results["new"]
    uncertain = results["uncertain"]

    print(f"\n{'='*60}")
    print("RIDER MAGAZINE DEDUP MATCH REPORT")
    print(f"{'='*60}")
    print(f"  Matched (enrich existing):  {len(matched)}")
    print(f"  New (geocode + insert):     {len(new)}")
    print(f"  Uncertain (needs review):   {len(uncertain)}")
    print()

    if matched:
        print(f"--- MATCHED ({len(matched)}) ---")
        for m in sorted(matched, key=lambda x: -x["confidence"]):
            rm = m["rider_route"]
            ex = m["existing_route"]
            print(f"  [{m['confidence']:.2f}] {rm['name']} ({rm.get('state','')})")
            print(f"         -> {ex.get('name','')} [{ex.get('source','')}] ({ex.get('routeId','')})")
            print(f"         method: {m['method']}")
        print()

    if uncertain:
        print(f"--- UNCERTAIN ({len(uncertain)}) ---")
        for u in uncertain:
            rm = u["rider_route"]
            print(f"  {rm['name']} ({rm.get('state','')})")
            for c in u["candidates"]:
                ex = c["existing"]
                print(f"    ? [{c['confidence']:.2f}] {ex.get('name','')} [{ex.get('source','')}]")
        print()

    if new:
        print(f"--- NEW ({len(new)}) ---")
        for n in new:
            rm = n["rider_route"]
            print(f"  {rm['name']} ({rm.get('state','')})")
        print()


def save_report(results: dict[str, list[dict]], output_path: Path) -> None:
    """Save match results as JSON for downstream consumption."""
    # Convert to serializable format
    output = {
        "matched": [],
        "new": [],
        "uncertain": [],
        "summary": {
            "matched_count": len(results["matched"]),
            "new_count": len(results["new"]),
            "uncertain_count": len(results["uncertain"]),
        },
    }

    for m in results["matched"]:
        output["matched"].append({
            "rider_route_id": m["rider_route"].get("route_id", ""),
            "rider_name": m["rider_route"].get("name", ""),
            "rider_state": m["rider_route"].get("state", ""),
            "existing_route_id": m["existing_route"].get("routeId", ""),
            "existing_name": m["existing_route"].get("name", ""),
            "existing_source": m["existing_route"].get("source", ""),
            "confidence": m["confidence"],
            "method": m["method"],
        })

    for n in results["new"]:
        output["new"].append({
            "route_id": n["rider_route"].get("route_id", ""),
            "name": n["rider_route"].get("name", ""),
            "state": n["rider_route"].get("state", ""),
        })

    for u in results["uncertain"]:
        output["uncertain"].append({
            "rider_route_id": u["rider_route"].get("route_id", ""),
            "rider_name": u["rider_route"].get("name", ""),
            "rider_state": u["rider_route"].get("state", ""),
            "candidates": [
                {
                    "existing_route_id": c["existing"].get("routeId", ""),
                    "existing_name": c["existing"].get("name", ""),
                    "existing_source": c["existing"].get("source", ""),
                    "confidence": c["confidence"],
                }
                for c in u["candidates"]
            ],
        })

    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
    logger.info(f"Report saved to {output_path}")


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main() -> int:
    import argparse

    parser = argparse.ArgumentParser(description="Match rider_mag routes against existing Convex routes")
    parser.add_argument("--report-only", action="store_true", help="Only print report, don't save JSON")
    parser.add_argument("--threshold", type=float, default=0.85, help="Match confidence threshold (default: 0.85)")
    parser.add_argument("--base-url", default=None, help="Convex deployment URL")
    parser.add_argument("--output", default=str(REPO_ROOT / "scripts" / "curation" / "pipeline" / "reconciliation" / "match_report.json"),
                        help="Output JSON path")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")

    # 1. Load rider_mag routes
    rider_routes = load_rider_mag_routes()
    if not rider_routes:
        print("No rider_mag routes found in staging. Exiting.")
        return 1

    # 2. Fetch existing routes from Convex
    base_url = args.base_url or os.environ.get("EXPO_PUBLIC_CONVEX_URL", "")
    existing_routes = fetch_convex_routes_via_cli(base_url)

    if not existing_routes:
        print("Could not fetch existing routes from Convex. Exiting.")
        return 1

    # Filter to non-rider_mag routes
    non_rider = [r for r in existing_routes if r.get("source") != "rider_mag"]
    print(f"\nExisting routes: {len(existing_routes)} total, {len(non_rider)} non-rider_mag")

    # 3. Match
    results = match_routes(rider_routes, non_rider, threshold=args.threshold)

    # 4. Report
    print_report(results)

    if not args.report_only:
        save_report(results, Path(args.output))

    return 0


if __name__ == "__main__":
    sys.exit(main())
