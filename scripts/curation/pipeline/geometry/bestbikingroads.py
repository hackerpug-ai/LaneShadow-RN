"""BestBikingRoads.com geometry fetcher.

Uses Nominatim (OSM) geocoding to resolve route names to centroid coordinates.
BBR pages load maps via JavaScript and have GPX downloads behind auth-like flows,
so geocoding by route name + state is the most reliable approach.

Rate limit: 1 req/s for Nominatim (OSM usage policy).
"""

from __future__ import annotations

import logging
import time
from typing import Optional
from urllib.parse import quote_plus

import httpx

from scripts.curation.pipeline.geometry.models import RouteGeometry, RouteWaypoint

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_USER_AGENT = "LaneShadowCuration/1.0 (laneshadow.com)"

# Nominatim policy: max 1 req/s
_MIN_NOMINATIM_INTERVAL = 1.1
_last_nominatim_time: float = 0.0


def _nominatim_rate_limit() -> None:
    """Enforce Nominatim 1 req/s rate limit."""
    global _last_nominatim_time
    elapsed = time.monotonic() - _last_nominatim_time
    if elapsed < _MIN_NOMINATIM_INTERVAL:
        time.sleep(_MIN_NOMINATIM_INTERVAL - elapsed)


def _geocode_nominatim(query: str) -> Optional[tuple[float, float]]:
    """Geocode a query string via Nominatim.

    Returns (lat, lng) or None if no result.
    """
    global _last_nominatim_time
    _nominatim_rate_limit()

    params = {
        "q": query,
        "format": "json",
        "limit": 1,
        "countrycodes": "us,ca",  # US + Canada (BBR has some Canadian routes)
    }

    try:
        response = httpx.get(
            NOMINATIM_URL,
            params=params,
            headers={"User-Agent": NOMINATIM_USER_AGENT},
            timeout=15,
        )
        _last_nominatim_time = time.monotonic()
        response.raise_for_status()
        results = response.json()

        if results:
            lat = float(results[0]["lat"])
            lng = float(results[0]["lon"])
            return (lat, lng)

        return None

    except (httpx.HTTPError, httpx.TimeoutException, KeyError, ValueError) as e:
        logger.warning(f"Nominatim geocoding failed for '{query}': {e}")
        return None


def _build_geocode_query(route_name: str, state: str) -> str:
    """Build a Nominatim query from route name and state.

    Tries to extract meaningful location keywords from the route name.
    Examples:
        "Ogden to Salt Lake back roads" -> "Ogden to Salt Lake, Utah, USA"
        "Route 66 - Seligman to Kingman" -> "Seligman to Kingman, Arizona, USA"
        "Blue Ridge Parkway" -> "Blue Ridge Parkway, North Carolina, USA"
    """
    # Clean up the route name for geocoding
    clean_name = route_name.strip()
    if not clean_name:
        return f"{state}, USA"

    return f"{clean_name}, {state}, USA"


def fetch_geometry(
    route_id: str,
    source_url: str,
    route_name: str = "",
    state: str = "",
) -> Optional[RouteGeometry]:
    """Fetch route geometry via Nominatim geocoding.

    Args:
        route_id: Pipeline route ID
        source_url: Source URL (unused for BBR, kept for interface consistency)
        route_name: Route name for geocoding
        state: State name for geocoding

    Returns:
        RouteGeometry with centroid, or None on failure
    """
    query = _build_geocode_query(route_name, state)
    result = _geocode_nominatim(query)

    if result is None:
        # Fallback: try just the state
        logger.debug(f"Route name geocode failed for {route_id}, trying state only")
        result = _geocode_nominatim(f"{state}, USA")

    if result is None:
        logger.warning(f"Geocoding failed for {route_id}: '{query}'")
        return None

    lat, lng = result
    geometry = RouteGeometry(
        route_id=route_id,
        source="bestbikingroads",
        waypoints=[RouteWaypoint(lat=lat, lng=lng, order=0, name="Centroid")],
        centroid_lat=lat,
        centroid_lng=lng,
        bounds_ne_lat=lat,
        bounds_ne_lng=lng,
        bounds_sw_lat=lat,
        bounds_sw_lng=lng,
        geometry_source="nominatim",
    )

    logger.debug(
        f"BBR geocoded {route_id}: ({lat:.4f}, {lng:.4f}) from '{query}'"
    )

    return geometry
