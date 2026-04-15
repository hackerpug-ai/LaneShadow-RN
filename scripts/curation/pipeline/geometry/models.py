"""Geometry data models for route enrichment.

RouteWaypoint: A single lat/lng point along a route.
RouteGeometry: Full geometry record for a route (waypoints, bbox, polyline).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel, Field


class RouteWaypoint(BaseModel):
    """A single waypoint along a route with lat/lng coordinates."""

    lat: float = Field(ge=-90.0, le=90.0)
    lng: float = Field(ge=-180.0, le=180.0)
    order: int = Field(ge=0, description="Sequence order (0 = start)")
    name: Optional[str] = Field(default=None, description="Waypoint label (e.g. 'Start', 'End')")


class RouteGeometry(BaseModel):
    """Complete geometry record for a route.

    Produced by per-source geometry fetchers and consumed by the push stage
    to populate Convex route documents with spatial data.
    """

    route_id: str
    source: str
    waypoints: list[RouteWaypoint] = Field(default_factory=list)
    polyline_encoded: Optional[str] = Field(
        default=None,
        description="Encoded polyline string for map rendering",
    )
    centroid_lat: float = Field(default=0.0, ge=-90.0, le=90.0)
    centroid_lng: float = Field(default=0.0, ge=-180.0, le=180.0)
    bounds_ne_lat: float = Field(default=0.0, ge=-90.0, le=90.0)
    bounds_ne_lng: float = Field(default=0.0, ge=-180.0, le=180.0)
    bounds_sw_lat: float = Field(default=0.0, ge=-90.0, le=90.0)
    bounds_sw_lng: float = Field(default=0.0, ge=-180.0, le=180.0)
    geometry_source: str = Field(
        description="How geometry was obtained: 'scraped', 'nominatim', 'fhwa_existing', 'osrm'",
    )
    fetched_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
    )

    def compute_bounds(self) -> None:
        """Compute centroid and bounding box from waypoints."""
        if not self.waypoints:
            return

        lats = [w.lat for w in self.waypoints]
        lngs = [w.lng for w in self.waypoints]

        self.centroid_lat = sum(lats) / len(lats)
        self.centroid_lng = sum(lngs) / len(lngs)
        self.bounds_ne_lat = max(lats)
        self.bounds_ne_lng = max(lngs)
        self.bounds_sw_lat = min(lats)
        self.bounds_sw_lng = min(lngs)

    def compute_centroid_from_existing(
        self,
        centroid_lat: float,
        centroid_lng: float,
        bounds_ne_lat: float | None = None,
        bounds_ne_lng: float | None = None,
        bounds_sw_lat: float | None = None,
        bounds_sw_lng: float | None = None,
    ) -> None:
        """Set centroid and bounds from pre-existing coordinate data (FHWA)."""
        self.centroid_lat = centroid_lat
        self.centroid_lng = centroid_lng
        self.bounds_ne_lat = bounds_ne_lat or centroid_lat
        self.bounds_ne_lng = bounds_ne_lng or centroid_lng
        self.bounds_sw_lat = bounds_sw_lat or centroid_lat
        self.bounds_sw_lng = bounds_sw_lng or centroid_lng
