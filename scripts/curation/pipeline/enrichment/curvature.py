"""Deterministic curvature scoring from route geometry.

Computes curvature score (0-100) based on bearing changes between
consecutive points in a route's geometry. Higher scores indicate
more twisty roads.

This is pure geometry computation - no LLM usage (P1 requirement).
"""

import logging
import math
from typing import Optional

logger = logging.getLogger(__name__)


def compute_bearing(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Compute bearing from point 1 to point 2 in degrees.

    Uses the haversine formula to calculate the initial bearing
    (forward azimuth) from point 1 to point 2.

    Args:
        lat1: Latitude of first point in decimal degrees
        lng1: Longitude of first point in decimal degrees
        lat2: Latitude of second point in decimal degrees
        lng2: Longitude of second point in decimal degrees

    Returns:
        Bearing in degrees [0, 360), where 0 = North, 90 = East, 180 = South, 270 = West
    """
    d_lng = math.radians(lng2 - lng1)
    lat1_r = math.radians(lat1)
    lat2_r = math.radians(lat2)

    x = math.sin(d_lng) * math.cos(lat2_r)
    y = math.cos(lat1_r) * math.sin(lat2_r) - math.sin(lat1_r) * math.cos(lat2_r) * math.cos(d_lng)

    bearing = math.degrees(math.atan2(x, y))
    return (bearing + 360) % 360


def compute_curvature_score(geometry: list[tuple[float, float]]) -> Optional[float]:
    """Compute curvature score (0-100) from bearing changes.

    The score measures how twisty a road is by computing the average
    bearing change between consecutive segments. Higher scores indicate
    more twisty roads.

    Score interpretation:
        - 0 = perfectly straight road
        - 100 = maximum twistiness (avg 45+ degree bearing changes)

    The algorithm is deterministic: same geometry always produces
    the same score. No random operations or LLM usage.

    Args:
        geometry: List of (lat, lng) coordinate tuples representing the route

    Returns:
        Curvature score from 0-100, or None if geometry has < 3 points
    """
    if len(geometry) < 3:
        logger.debug(f"Geometry has only {len(geometry)} points, cannot compute curvature")
        return None

    total_bearing_change = 0.0
    num_segments = len(geometry) - 2

    # Compute bearing change for each triplet of points
    for i in range(num_segments):
        lat1, lng1 = geometry[i]
        lat2, lng2 = geometry[i + 1]
        lat3, lng3 = geometry[i + 2]

        # Bearing from point 1 to 2
        b1 = compute_bearing(lat1, lng1, lat2, lng2)
        # Bearing from point 2 to 3
        b2 = compute_bearing(lat2, lng2, lat3, lng3)

        # Compute the smallest angle between the two bearings
        change = abs(b2 - b1)
        if change > 180:
            change = 360 - change  # Normalize to [0, 180]

        total_bearing_change += change

    # Normalize: average bearing change per segment
    avg_change = total_bearing_change / num_segments

    # Scale to 0-100: 0 deg avg = 0, 45+ deg avg = 100
    # This means a road with 45-degree average turns scores 100/100
    score = min(100.0, (avg_change / 45.0) * 100.0)

    logger.debug(f"Curvature score: {score:.1f} (avg bearing change: {avg_change:.1f}°)")
    return round(score, 1)
