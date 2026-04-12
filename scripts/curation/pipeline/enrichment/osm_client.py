"""OpenStreetMap client for fetching route geometry.

Uses the Overpass API to query OSM for highway ways near a location.
Implements rate limiting (1 req/sec per Overpass policy) and
file-based caching to avoid redundant API calls.
"""

import asyncio
import logging
import time
from pathlib import Path
from typing import Any, Optional

import httpx

from .cache import FileCache
from .curvature import compute_curvature_score

logger = logging.getLogger(__name__)


class OSMClient:
    """Client for OpenStreetMap Overpass API.

    Fetches highway geometry near a location and computes curvature scores.
    Implements rate limiting and file-based caching.
    """

    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    RATE_LIMIT_SECONDS = 1.0  # Overpass policy: max 1 req/sec

    def __init__(self, cache_dir: Optional[Path] = None):
        """Initialize the OSM client.

        Args:
            cache_dir: Directory for caching OSM responses. Defaults to .cache/osm
        """
        if cache_dir is None:
            cache_dir = Path(".cache/osm")
        self.cache = FileCache(cache_dir)
        self.last_request_time = 0.0
        logger.debug(f"Initialized OSM client with cache at {cache_dir}")

    def fetch_highway_geometry(
        self,
        lat: float,
        lng: float,
        radius_m: int = 2000,
        route_id: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """Fetch highway ways near a point from Overpass API.

        Args:
            lat: Latitude of center point
            lng: Longitude of center point
            radius_m: Search radius in meters (default: 2000)
            route_id: Optional route ID for cache key construction

        Returns:
            List of OSM way elements with geometry, or empty list if none found

        Raises:
            httpx.HTTPError: If the API request fails
        """
        # Build cache key
        cache_key = f"osm_{lat:.4f}_{lng:.4f}_{radius_m}"
        if route_id:
            cache_key = f"{route_id}_{cache_key}"

        # Check cache
        cached = self.cache.get(cache_key)
        if cached is not None:
            logger.debug(f"Using cached OSM response for {cache_key}")
            return cached

        # Rate limit enforcement
        elapsed = time.monotonic() - self.last_request_time
        if elapsed < self.RATE_LIMIT_SECONDS:
            wait_time = self.RATE_LIMIT_SECONDS - elapsed
            logger.debug(f"Rate limiting: waiting {wait_time:.2f}s")
            time.sleep(wait_time)

        # Build Overpass QL query
        query = f"""
        [out:json][timeout:25];
        way["highway"](around:{radius_m},{lat},{lng});
        out geom;
        """

        # Make request
        logger.debug(f"Querying Overpass API for {lat:.4f},{lng:.4f} radius={radius_m}m")
        try:
            response = httpx.post(
                self.OVERPASS_URL,
                data={"data": query},
                timeout=30,
            )
            response.raise_for_status()
        except httpx.HTTPError as e:
            logger.error(f"Overpass API request failed: {e}")
            raise

        self.last_request_time = time.monotonic()

        # Parse response
        data = response.json()
        elements = data.get("elements", [])

        if not elements:
            logger.warning(f"No OSM geometry found for {lat:.4f},{lng:.4f} radius={radius_m}m")
        else:
            logger.debug(f"Retrieved {len(elements)} ways from Overpass API")

        # Cache the response
        self.cache.set(cache_key, elements)

        return elements

    def compute_curvature_for_route(
        self,
        lat: float,
        lng: float,
        radius_m: int = 2000,
        route_id: Optional[str] = None,
    ) -> Optional[float]:
        """Compute curvature score for a route location.

        Fetches OSM geometry near the given location and computes
        the curvature score from the most relevant way.

        Args:
            lat: Latitude of center point
            lng: Longitude of center point
            radius_m: Search radius in meters (default: 2000)
            route_id: Optional route ID for cache key construction

        Returns:
            Curvature score (0-100), or None if geometry unavailable
        """
        try:
            elements = self.fetch_highway_geometry(lat, lng, radius_m, route_id)
        except httpx.HTTPError as e:
            logger.error(f"Failed to fetch OSM geometry for route {route_id}: {e}")
            return None

        if not elements:
            logger.warning(f"No OSM geometry found for route {route_id}")
            return None

        # Extract geometry from the most relevant way
        # For now, use the longest way (most nodes) as a heuristic
        best_way = max(elements, key=lambda e: len(e.get("nodes", [])), default=None)
        if not best_way:
            logger.warning(f"No valid way found in OSM response for route {route_id}")
            return None

        # Extract geometry points
        geometry = best_way.get("geometry", [])
        if not geometry:
            logger.warning(f"Way {best_way.get('id')} has no geometry for route {route_id}")
            return None

        # Convert to list of (lat, lng) tuples
        points = [(node["lat"], node["lon"]) for node in geometry]

        # Compute curvature score
        score = compute_curvature_score(points)
        if score is None:
            logger.warning(f"Could not compute curvature for route {route_id}")
            return None

        logger.info(f"Computed curvature {score} for route {route_id} (way {best_way.get('id')})")
        return score
