"""Quality grading for curated routes.

Deterministic geometry + data quality checks. No LLM needed.
Each route gets a tier (HIGH/MEDIUM/LOW/UNUSABLE) and a list of flags.

Usage:
    python -m scripts.curation.pipeline.state_manager grade
    python -m scripts.curation.pipeline.state_manager grade --source bestbikingroads
    python -m scripts.curation.pipeline.state_manager grade --tier-filter UNUSABLE
"""

from __future__ import annotations

import json
import logging
import re
import sqlite3
import time
from typing import Any, Optional

logger = logging.getLogger(__name__)

# US + Canada + Hawaii lat/lng bounds for sanity checks
_LAT_MIN, _LAT_MAX = 18.0, 72.0
_LNG_MIN, _LNG_MAX = -170.0, -52.0

# Junk name patterns (1-2 chars, or single word with no meaning)
_JUNK_NAME_RE = re.compile(r"^.{0,2}$|^\d+$|^[a-z]$")
_JUNK_NAMES = {"met", "h", "the", "a", "an", "1", "2", "test", "unknown", "n/a"}


def grade_route(
    route_id: str,
    route_name: str,
    state_primary: str,
    geometry_json: Optional[str],
    extraction_payload_json: Optional[str],
    normalized_route_json: Optional[str],
    source: str,
) -> tuple[str, float, list[str]]:
    """Grade a single route. Returns (tier, score, flags).

    tier: HIGH | MEDIUM | LOW | UNUSABLE
    score: 0.0-1.0 composite quality score
    flags: list of issue identifiers
    """
    flags: list[str] = []
    score_components: list[float] = []

    # Parse geometry
    geom: dict[str, Any] = {}
    if geometry_json:
        try:
            geom = json.loads(geometry_json)
        except json.JSONDecodeError:
            flags.append("invalid_geometry_json")

    centroid_lat = geom.get("centroid_lat", 0.0)
    centroid_lng = geom.get("centroid_lng", 0.0)
    waypoints = geom.get("waypoints", [])
    waypoint_count = len(waypoints)
    geometry_source = geom.get("geometry_source", "")

    # Parse extraction
    attrs: dict[str, Any] = {}
    if extraction_payload_json:
        try:
            attrs = json.loads(extraction_payload_json)
        except json.JSONDecodeError:
            flags.append("invalid_extraction_json")

    # Parse normalized data for description
    norm: dict[str, Any] = {}
    if normalized_route_json:
        try:
            norm = json.loads(normalized_route_json)
        except json.JSONDecodeError:
            pass

    description = norm.get("description") or attrs.get("reasoning") or ""

    # -----------------------------------------------------------------------
    # Check 1: Junk name
    # -----------------------------------------------------------------------
    clean_name = (route_name or "").strip().lower()
    if not clean_name or _JUNK_NAME_RE.match(clean_name) or clean_name in _JUNK_NAMES:
        flags.append("junk_name")
        score_components.append(0.0)
    else:
        score_components.append(1.0)

    # -----------------------------------------------------------------------
    # Check 2: Centroid validity
    # -----------------------------------------------------------------------
    if centroid_lat == 0.0 and centroid_lng == 0.0:
        flags.append("zero_centroid")
        score_components.append(0.0)
    elif not (_LAT_MIN <= centroid_lat <= _LAT_MAX and _LNG_MIN <= centroid_lng <= _LNG_MAX):
        flags.append("centroid_out_of_bounds")
        score_components.append(0.0)
    else:
        score_components.append(1.0)

    # -----------------------------------------------------------------------
    # Check 3: Waypoint / geometry quality
    # -----------------------------------------------------------------------
    if waypoint_count == 0 and not geom:
        flags.append("no_geometry")
        score_components.append(0.0)
    elif waypoint_count <= 1:
        flags.append("centroid_only")
        score_components.append(0.5)
    elif waypoint_count >= 2:
        # More waypoints = higher quality
        wp_score = min(1.0, waypoint_count / 5.0)
        score_components.append(wp_score)

    # -----------------------------------------------------------------------
    # Check 4: Description quality
    # -----------------------------------------------------------------------
    if not description or len(description.strip()) < 20:
        flags.append("empty_description")
        score_components.append(0.2)
    elif len(description.strip()) < 50:
        flags.append("short_description")
        score_components.append(0.6)
    else:
        score_components.append(1.0)

    # -----------------------------------------------------------------------
    # Check 5: Extraction completeness
    # -----------------------------------------------------------------------
    if not attrs:
        flags.append("no_extraction")
        score_components.append(0.0)
    else:
        score_fields = [
            "scenic_score", "technical_score", "traffic_score",
            "remoteness_score", "condition_score", "elevation_score",
        ]
        filled = sum(1 for f in score_fields if attrs.get(f) is not None)
        if filled < 3:
            flags.append("incomplete_scores")
            score_components.append(0.3)
        else:
            score_components.append(1.0)

    # -----------------------------------------------------------------------
    # Check 6: Geometry source bonus/penalty
    # -----------------------------------------------------------------------
    if geometry_source == "scraped":
        score_components.append(1.0)  # Real waypoints from page scraping
    elif geometry_source == "fhwa_existing":
        score_components.append(0.8)  # Reliable centroid from official data
    elif geometry_source == "nominatim":
        flags.append("geocoded_not_scraped")
        score_components.append(0.5)  # Centroid only from geocoding
    else:
        score_components.append(0.0)

    # -----------------------------------------------------------------------
    # Compute composite score
    # -----------------------------------------------------------------------
    if score_components:
        composite = sum(score_components) / len(score_components)
    else:
        composite = 0.0

    composite = round(composite, 4)

    # -----------------------------------------------------------------------
    # Determine tier
    # -----------------------------------------------------------------------
    if "junk_name" in flags or "zero_centroid" in flags or "centroid_out_of_bounds" in flags:
        tier = "UNUSABLE"
    elif "no_geometry" in flags:
        tier = "LOW"
    elif "centroid_only" in flags:
        tier = "MEDIUM"
    else:
        tier = "HIGH"

    return tier, composite, flags


def grade_all(
    conn: sqlite3.Connection,
    source: Optional[str] = None,
    tier_filter: Optional[str] = None,
) -> dict[str, Any]:
    """Grade all geocoded+extracted routes, write quality_* columns.

    Returns stats: {total, HIGH, MEDIUM, LOW, UNUSABLE, flagged_routes}
    """
    from scripts.curation.pipeline.state_manager.db import upsert_route_state

    where_clauses = ["extracted_at IS NOT NULL"]
    params: list[Any] = []
    if source:
        where_clauses.append("source = ?")
        params.append(source)

    sql = f"SELECT * FROM route_state WHERE {' AND '.join(where_clauses)}"
    rows = conn.execute(sql, params).fetchall()

    logger.info(f"Grading {len(rows)} routes...")

    tier_counts = {"HIGH": 0, "MEDIUM": 0, "LOW": 0, "UNUSABLE": 0}
    flagged_routes: list[dict[str, Any]] = []
    now = int(time.time())

    for row in rows:
        tier, score, flags = grade_route(
            route_id=row["route_id"],
            route_name=row["route_name"] or "",
            state_primary=row["state_primary"] or "",
            geometry_json=row["geometry_json"],
            extraction_payload_json=row["extraction_payload_json"],
            normalized_route_json=row["normalized_route_json"],
            source=row["source"],
        )

        tier_counts[tier] += 1

        upsert_route_state(
            conn,
            route_id=row["route_id"],
            source=row["source"],
            raw_staging_json=row["raw_staging_json"],
            quality_tier=tier,
            quality_score=score,
            quality_flags_json=json.dumps(flags) if flags else None,
            quality_graded_at=now,
        )

        if flags:
            flagged_routes.append({
                "route_id": row["route_id"],
                "name": row["route_name"],
                "source": row["source"],
                "tier": tier,
                "score": score,
                "flags": flags,
            })

    # Apply tier filter for display
    if tier_filter:
        flagged_routes = [r for r in flagged_routes if r["tier"] == tier_filter]

    stats = {
        "total": len(rows),
        **tier_counts,
        "flagged_count": len(flagged_routes),
        "flagged_routes": flagged_routes[:50],  # Limit for display
    }

    logger.info(
        f"Grading complete: HIGH={tier_counts['HIGH']} MEDIUM={tier_counts['MEDIUM']} "
        f"LOW={tier_counts['LOW']} UNUSABLE={tier_counts['UNUSABLE']} "
        f"flagged={len(flagged_routes)}"
    )

    return stats
