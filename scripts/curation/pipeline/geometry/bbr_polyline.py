"""BestBikingRoads.com polyline scraper.

Fetches real route shapes (encoded Google polylines) from BBR route pages.

Two-step headless HTTP process:
  1. Fetch route page HTML → extract droute hash code from inline JS
  2. Call /droute.php?code={hash} → JSON with encoded polyline + start/end coords
  3. Decode Google encoded polyline → waypoints

No Playwright/browser needed — pure HTTP requests.

Rate limit: 2 req/s (each route = 2 HTTP calls).
"""

from __future__ import annotations

import logging
import re
import time
from typing import Optional

import httpx

from scripts.curation.pipeline.geometry.models import RouteGeometry, RouteWaypoint

logger = logging.getLogger(__name__)

_BBR_BASE = "https://www.bestbikingroads.com"
_DROUTE_RE = re.compile(r"/droute\.php\?code=([a-zA-Z0-9]+)")

# Rate limiting
_MIN_INTERVAL = 0.5  # 2 req/s
_last_request_time: float = 0.0

_MAX_WAYPOINTS = 50  # Downsample target

_HEADERS_PAGE = {
    "User-Agent": "LaneShadowCuration/1.0 (+https://laneshadow.com)",
    "Accept": "text/html",
}

_HEADERS_API = {
    "User-Agent": "LaneShadowCuration/1.0 (+https://laneshadow.com)",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
}


def _rate_limit() -> None:
    """Enforce 2 req/s rate limit."""
    global _last_request_time
    elapsed = time.monotonic() - _last_request_time
    if elapsed < _MIN_INTERVAL:
        time.sleep(_MIN_INTERVAL - elapsed)


def decode_polyline(encoded: str) -> list[tuple[float, float]]:
    """Decode a Google encoded polyline string into (lat, lng) pairs.

    Algorithm: process 5-bit chunks with sign bits, accumulate lat/lng deltas.
    """
    points: list[tuple[float, float]] = []
    index = lat = lng = 0

    while index < len(encoded):
        # Decode latitude delta
        result = shift = 0
        while True:
            if index >= len(encoded):
                return points
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if result & 1 else result >> 1
        lat += dlat

        # Decode longitude delta
        result = shift = 0
        while True:
            if index >= len(encoded):
                return points
            b = ord(encoded[index]) - 63
            index += 1
            result |= (b & 0x1F) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if result & 1 else result >> 1
        lng += dlng

        points.append((lat / 1e5, lng / 1e5))

    return points


def downsample_waypoints(
    points: list[tuple[float, float]],
    max_points: int = _MAX_WAYPOINTS,
) -> list[tuple[float, float]]:
    """Downsample waypoints to max_points, preserving first and last."""
    if len(points) <= max_points:
        return points

    step = (len(points) - 1) / (max_points - 1)
    result = [points[0]]
    for i in range(1, max_points - 1):
        idx = round(i * step)
        result.append(points[idx])
    result.append(points[-1])
    return result


def extract_droute_code(page_html: str) -> Optional[str]:
    """Extract /droute.php?code=XXX hash from page HTML."""
    m = _DROUTE_RE.search(page_html)
    return m.group(1) if m else None


def _fetch_with_retry(url: str, headers: dict, max_retries: int = 3) -> Optional[httpx.Response]:
    """Fetch URL with retry and rate limiting."""
    for attempt in range(max_retries):
        _rate_limit()
        try:
            resp = httpx.get(url, headers=headers, timeout=15, follow_redirects=True)
            global _last_request_time
            _last_request_time = time.monotonic()

            if resp.status_code == 429:
                backoff = min(10.0 * (2 ** attempt), 60.0)
                logger.warning(f"BBR 429 for {url}, backing off {backoff:.0f}s")
                time.sleep(backoff)
                continue

            resp.raise_for_status()
            return resp

        except (httpx.HTTPError, httpx.TimeoutException) as e:
            logger.warning(f"BBR fetch attempt {attempt+1}/{max_retries} failed for {url}: {e}")
            if attempt < max_retries - 1:
                time.sleep(5.0 * (attempt + 1))

    return None


def fetch_polyline_geometry(
    route_id: str,
    source_url: str,
) -> Optional[RouteGeometry]:
    """Fetch real route shape from BBR via encoded polyline.

    Two-step process:
      1. Fetch route page HTML → extract droute hash code
      2. Call /droute.php?code={hash} → decode polyline → RouteGeometry

    Args:
        route_id: Pipeline route ID
        source_url: BBR route page URL

    Returns:
        RouteGeometry with waypoints, or None on failure
    """
    if not source_url:
        logger.warning(f"No source URL for BBR route {route_id}")
        return None

    # Step 1: Fetch page HTML, extract droute code
    page_resp = _fetch_with_retry(source_url, _HEADERS_PAGE)
    if page_resp is None:
        logger.warning(f"Failed to fetch BBR page for {route_id}: {source_url}")
        return None

    droute_code = extract_droute_code(page_resp.text)
    if not droute_code:
        logger.debug(f"No droute code found on page for {route_id}")
        return None

    # Step 2: Call droute API
    api_url = f"{_BBR_BASE}/droute.php?code={droute_code}"
    api_headers = {**_HEADERS_API, "Referer": source_url}
    api_resp = _fetch_with_retry(api_url, api_headers)
    if api_resp is None or not api_resp.text:
        logger.warning(f"Empty droute response for {route_id} (code={droute_code})")
        return None

    try:
        data = api_resp.json()
        if isinstance(data, list):
            if not data:
                logger.warning(f"Empty droute array for {route_id}")
                return None
            data = data[0]
    except Exception as e:
        logger.warning(f"Failed to parse droute JSON for {route_id}: {e}")
        return None

    polyline_str = data.get("polyline", "")
    if not polyline_str:
        logger.debug(f"No polyline in droute response for {route_id}")
        return None

    # Step 3: Decode polyline
    points = decode_polyline(polyline_str)
    if not points:
        logger.warning(f"Polyline decoded to 0 points for {route_id}")
        return None

    # Downsample for storage efficiency
    points = downsample_waypoints(points)

    # Build RouteGeometry
    waypoints = [
        RouteWaypoint(lat=lat, lng=lng, order=i)
        for i, (lat, lng) in enumerate(points)
    ]

    geometry = RouteGeometry(
        route_id=route_id,
        source="bestbikingroads",
        waypoints=waypoints,
        polyline_encoded=polyline_str,
        geometry_source="scraped_bbr",
    )
    geometry.compute_bounds()

    logger.debug(
        f"BBR polyline scraped {route_id}: {len(waypoints)} waypoints "
        f"centroid=({geometry.centroid_lat:.4f}, {geometry.centroid_lng:.4f})"
    )

    return geometry
