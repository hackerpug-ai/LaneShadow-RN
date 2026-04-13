"""
scripts/curation/data_prep/fetch_fhwa.py

One-shot script to fetch the DOT US Scenic Byways layer and write
data/fhwa_byways.csv for Epic 2 BASE-001 baseline validation.

Run from project root:
    python -m scripts.curation.data_prep.fetch_fhwa

See .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/DECISIONS.md
for the rationale behind Option 1 (accept 645-route superset).
"""
from __future__ import annotations

import csv
import logging
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

import httpx
from pyproj import Geod
from shapely.geometry import MultiLineString, shape
from shapely.ops import unary_union

LAYER_URL = (
    "https://geo.dot.gov/server/rest/services/"
    "US_Scenic_Byways/MapServer/107/query"
)
STATE_LAYER_URL = (
    "https://geo.dot.gov/server/rest/services/"
    "US_Scenic_Byways/MapServer/110/query"
)
OUTPUT_PATH = Path("data/fhwa_byways.csv")
EXPECTED_MIN = 580
EXPECTED_MAX = 710

_GEOD = Geod(ellps="WGS84")
_log = logging.getLogger("fetch_fhwa")


def fetch_layer_geojson(url: str) -> dict[str, Any]:
    """GET the ArcGIS layer as GeoJSON. Returns the parsed FeatureCollection."""
    params = {
        "where": "1=1",
        "outFields": "*",
        "returnGeometry": "true",
        "f": "geojson",
    }
    _log.info(f"fetching {url}")
    r = httpx.get(url, params=params, timeout=60.0)
    r.raise_for_status()
    return r.json()


def merge_segments_by_name(fc: dict) -> dict[str, dict]:
    """
    Merge multi-segment features by Trail_Name. Returns
    {name: {geom: shapely.MultiLineString, admin_org: str}}.
    """
    groups: dict[str, list] = defaultdict(list)
    admin: dict[str, str] = {}
    for feat in fc.get("features", []):
        props = feat.get("properties", {})
        name = (props.get("Trail_Name") or "").strip()
        if not name:
            continue
        geom = shape(feat["geometry"]) if feat.get("geometry") else None
        if geom is None or geom.is_empty:
            continue
        groups[name].append(geom)
        admin.setdefault(name, (props.get("Admin_Org") or "").strip())
    merged: dict[str, dict] = {}
    for name, geoms in groups.items():
        if len(geoms) == 1:
            g = geoms[0]
        else:
            g = unary_union(geoms)
        merged[name] = {"geom": g, "admin_org": admin[name]}
    return merged


def build_state_index(fc: dict) -> list[tuple[Any, str]]:
    """Return [(prepared_geometry, state_name), ...] from layer 110."""
    # The state boundary layer may have fields like STATE_NAME; inspect at runtime.
    out = []
    for feat in fc.get("features", []):
        props = feat.get("properties", {})
        name = props.get("STATE_NAME") or props.get("NAME") or props.get("State") or ""
        if not name:
            continue
        geom = shape(feat["geometry"]) if feat.get("geometry") else None
        if geom is None or geom.is_empty:
            continue
        out.append((geom, name.strip()))
    return out


def resolve_states(geom, state_index) -> str:
    """Return alphabetically-sorted joined state names for any state polygons that intersect."""
    hits = sorted({name for poly, name in state_index if geom.intersects(poly)})
    return " / ".join(hits) if hits else ""


def geodesic_length_miles(geom) -> float:
    """Geodesic length of a (Multi)LineString in miles, rounded to 1 dp."""
    if geom is None or geom.is_empty:
        return 0.0
    total_m = 0.0
    lines = [geom] if geom.geom_type == "LineString" else list(geom.geoms)
    for line in lines:
        coords = list(line.coords)
        for (lng1, lat1), (lng2, lat2) in zip(coords, coords[1:]):
            _, _, d = _GEOD.inv(lng1, lat1, lng2, lat2)
            total_m += d
    return round(total_m / 1609.344, 1)


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(message)s")

    _log.info("step 1/4: fetch layer 107 (scenic byways)")
    fc = fetch_layer_geojson(LAYER_URL)
    _log.info(f"  received {len(fc.get('features', []))} features")

    _log.info("step 2/4: fetch layer 110 (state boundaries)")
    states_fc = fetch_layer_geojson(STATE_LAYER_URL)
    state_index = build_state_index(states_fc)
    _log.info(f"  built state index with {len(state_index)} polygons")

    _log.info("step 3/4: merge multi-segment features by Trail_Name")
    merged = merge_segments_by_name(fc)
    _log.info(f"  merged into {len(merged)} distinct routes")

    if not (EXPECTED_MIN <= len(merged) <= EXPECTED_MAX):
        _log.error(
            f"route count {len(merged)} outside tolerance {EXPECTED_MIN}-{EXPECTED_MAX}"
        )
        _log.error("DOT may have updated the layer; update DECISIONS.md before widening.")
        return 2

    _log.info("step 4/4: derive CSV rows")
    rows = []
    missing_state = 0
    for name in sorted(merged.keys()):
        item = merged[name]
        geom = item["geom"]
        state = resolve_states(geom, state_index)
        if not state:
            missing_state += 1
        c = geom.centroid
        rows.append(
            {
                "RouteName": name,
                "State": state,
                "CentroidLat": f"{c.y:.6f}",
                "CentroidLng": f"{c.x:.6f}",
                "LengthMiles": geodesic_length_miles(geom),
                "AgencyTags": item["admin_org"],
            }
        )

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.DictWriter(
            f,
            fieldnames=["RouteName", "State", "CentroidLat", "CentroidLng",
                        "LengthMiles", "AgencyTags"],
            quoting=csv.QUOTE_MINIMAL,
        )
        writer.writeheader()
        writer.writerows(rows)

    # Summary
    tag_counts: Counter[str] = Counter()
    for r in rows:
        tags = {t.strip() for t in r["AgencyTags"].split(",") if t.strip()}
        for t in tags:
            tag_counts[t] += 1
    _log.info("")
    _log.info(f"wrote {len(rows)} rows to {OUTPUT_PATH}")
    _log.info(f"agency tag breakdown: {dict(tag_counts)}")
    lengths = [r["LengthMiles"] for r in rows if r["LengthMiles"]]
    if lengths:
        _log.info(f"length range: {min(lengths)} - {max(lengths)} miles")
    if missing_state:
        _log.warning(f"{missing_state} rows missing state resolution (left blank)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
