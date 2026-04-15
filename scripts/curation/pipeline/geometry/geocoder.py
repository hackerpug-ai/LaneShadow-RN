"""Geometry orchestrator — dispatches to per-source fetchers.

Provides a single entry point for the geocode pipeline stage.
Handles FHWA (existing data), motorcycleroads (page scraping),
and bestbikingroads (Nominatim geocoding).
"""

from __future__ import annotations

import json
import logging
from typing import Any, Optional

from scripts.curation.pipeline.geometry.models import RouteGeometry

logger = logging.getLogger(__name__)


def fetch_geometry_for_route(
    route_id: str,
    source: str,
    raw_staging_json: str,
    route_name: str = "",
    state_primary: str = "",
    source_url: str = "",
) -> Optional[RouteGeometry]:
    """Fetch geometry for a single route, dispatching by source.

    Args:
        route_id: Pipeline route ID
        source: Data source ("motorcycleroads", "bestbikingroads", "fhwa")
        raw_staging_json: Raw staging JSON string from route_state table
        route_name: Route name (for logging / geocoding)
        state_primary: State name (for geocoding)
        source_url: Source page URL (for re-scraping)

    Returns:
        RouteGeometry or None on failure
    """
    try:
        staging = json.loads(raw_staging_json) if isinstance(raw_staging_json, str) else raw_staging_json
    except json.JSONDecodeError:
        logger.warning(f"Could not parse staging JSON for {route_id}")
        staging = {}

    if source == "fhwa":
        return _fetch_fhwa(route_id, staging)
    elif source == "motorcycleroads":
        from scripts.curation.pipeline.geometry.motorcycleroads import fetch_geometry as mr_fetch
        url = source_url or staging.get("canonical_url") or staging.get("source_url", "")
        if not url:
            logger.warning(f"No source URL for MR route {route_id}")
            return None
        return mr_fetch(route_id=route_id, source_url=url, route_name=route_name)
    elif source == "bestbikingroads":
        from scripts.curation.pipeline.geometry.bestbikingroads import fetch_geometry as bbr_fetch
        url = source_url or staging.get("canonical_url") or staging.get("source_url", "")
        return bbr_fetch(
            route_id=route_id,
            source_url=url,
            route_name=route_name,
            state=state_primary,
        )
    else:
        logger.warning(f"Unknown source for geometry fetch: {source}")
        return None


def _fetch_fhwa(route_id: str, staging: dict[str, Any]) -> Optional[RouteGeometry]:
    """Extract geometry from existing FHWA staging data (no HTTP needed)."""
    lat = staging.get("centroid_lat")
    lng = staging.get("centroid_lng")

    if lat is None or lng is None:
        logger.warning(f"FHWA route {route_id} missing centroid coordinates")
        return None

    geometry = RouteGeometry(
        route_id=route_id,
        source="fhwa",
        centroid_lat=float(lat),
        centroid_lng=float(lng),
        geometry_source="fhwa_existing",
    )

    # Populate bounds if available
    geometry.compute_centroid_from_existing(
        centroid_lat=float(lat),
        centroid_lng=float(lng),
        bounds_ne_lat=staging.get("bounds_ne_lat"),
        bounds_ne_lng=staging.get("bounds_ne_lng"),
        bounds_sw_lat=staging.get("bounds_sw_lat"),
        bounds_sw_lng=staging.get("bounds_sw_lng"),
    )

    return geometry
