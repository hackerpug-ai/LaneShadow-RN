"""MotorcycleRoads.com geometry fetcher.

Extracts waypoint coordinates from route detail pages. Two sources:
1. custom_map.qlid JSON array in <script> tag (preferred — all waypoints in one parse)
2. DOM div.route-point + span.Latitude/Longitude structure (fallback)

No extra HTTP requests needed — waypoints are embedded in the page HTML.
"""

from __future__ import annotations

import json
import logging
import random
import re
import time
from typing import Optional

import httpx

from scripts.curation.pipeline.geometry.models import RouteGeometry, RouteWaypoint

logger = logging.getLogger(__name__)

# Rate limiting (matching scraper discipline)
MIN_DELAY = 2.0
MAX_DELAY = 4.0

USER_AGENTS = [
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
]

_ua_cycle = 0
_last_request_time: float = 0.0


def _next_ua() -> str:
    global _ua_cycle
    ua = USER_AGENTS[_ua_cycle % len(USER_AGENTS)]
    _ua_cycle += 1
    return ua


def _rate_limit() -> None:
    """Enforce rate limiting between requests."""
    global _last_request_time
    elapsed = time.monotonic() - _last_request_time
    delay = random.uniform(MIN_DELAY, MAX_DELAY)
    if elapsed < delay:
        time.sleep(delay - elapsed)


def _extract_qlid_waypoints(html: str) -> list[RouteWaypoint]:
    """Extract waypoints from custom_map.qlid JSON in script tag.

    The page contains a Drupal settings JSON blob with:
    "custom_map":{"qlid":[{"lat":"31.3295459","lon":"-85.83815"}, ...]}
    """
    # Find the custom_map qlid array
    match = re.search(r'"qlid"\s*:\s*(\[[^\]]+\])', html)
    if not match:
        return []

    try:
        points = json.loads(match.group(1))
    except json.JSONDecodeError:
        return []

    waypoints = []
    for i, pt in enumerate(points):
        lat = float(pt.get("lat", 0))
        lng = float(pt.get("lon", 0))
        if lat != 0 or lng != 0:
            waypoints.append(RouteWaypoint(lat=lat, lng=lng, order=i))

    return waypoints


def _extract_dom_waypoints(html: str) -> list[RouteWaypoint]:
    """Extract waypoints from DOM structure as fallback.

    Structure:
      <div class="route-point">Start point</div>
      ... <span>Latitude </span>31.3295459</p>
          <span>Longitude </span>-85.83815</p>
      <div class="route-point">Way point 1</div>
      ...
    """
    waypoints = []

    # Split by route-point divs
    sections = re.split(r'<div class="route-point">', html)
    for section in sections[1:]:  # Skip content before first route-point
        # Extract point name
        name_match = re.match(r'([^<]+)', section.strip())
        name = name_match.group(1).strip() if name_match else None

        # Extract latitude and longitude from this section
        lat_match = re.search(r'<span>Latitude\s*</span>([0-9.\-]+)', section)
        lng_match = re.search(r'<span>Longitude\s*</span>([0-9.\-]+)', section)

        if lat_match and lng_match:
            lat = float(lat_match.group(1))
            lng = float(lng_match.group(1))
            waypoints.append(RouteWaypoint(
                lat=lat, lng=lng, order=len(waypoints), name=name,
            ))

    return waypoints


def fetch_geometry(
    route_id: str,
    source_url: str,
    route_name: str = "",
) -> Optional[RouteGeometry]:
    """Fetch route geometry from a MotorcycleRoads.com page.

    Args:
        route_id: Pipeline route ID
        source_url: URL of the route detail page
        route_name: Route name for logging

    Returns:
        RouteGeometry with waypoints, or None on failure
    """
    _rate_limit()

    try:
        response = httpx.get(
            source_url,
            headers={"User-Agent": _next_ua()},
            timeout=30,
            follow_redirects=True,
        )
        _last_request_time = time.monotonic()
        response.raise_for_status()
        html = response.text
    except (httpx.HTTPError, httpx.TimeoutException) as e:
        logger.warning(f"Failed to fetch MR page for {route_id}: {e}")
        return None

    # Try qlid JSON first (cleaner, has all points)
    waypoints = _extract_qlid_waypoints(html)

    # Fallback to DOM parsing
    if not waypoints:
        waypoints = _extract_dom_waypoints(html)

    if not waypoints:
        logger.warning(f"No waypoints found for {route_id} at {source_url}")
        return None

    geometry = RouteGeometry(
        route_id=route_id,
        source="motorcycleroads",
        waypoints=waypoints,
        geometry_source="scraped",
    )
    geometry.compute_bounds()

    logger.debug(
        f"MR geometry for {route_id}: {len(waypoints)} waypoints, "
        f"centroid=({geometry.centroid_lat:.4f}, {geometry.centroid_lng:.4f})"
    )

    return geometry
