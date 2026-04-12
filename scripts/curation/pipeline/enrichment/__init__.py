"""Geometric enrichment module for the curation pipeline.

This module provides OpenStreetMap integration and curvature scoring
for motorcycle routes. Curvature is computed deterministically from
bearing changes between consecutive geometry points.

Key components:
- OSMClient: Overpass API client with rate limiting and caching
- compute_curvature_score: Deterministic curvature scoring (0-100)
- FileCache: Persistent file-based cache for OSM responses
"""

from .cache import FileCache
from .curvature import compute_curvature_score
from .osm_client import OSMClient

__all__ = ["FileCache", "OSMClient", "compute_curvature_score"]
