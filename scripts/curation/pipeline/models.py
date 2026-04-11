"""Data models for the curation pipeline.

Uses stdlib dataclasses only — no Pydantic dependency required.
Field names follow Python snake_case convention (equivalents of PRD camelCase).
"""

from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Route:
    """Raw route record from any ingestion source.

    Fields match the PRD lean-tier schema (camelCase in Convex, snake_case in Python).
    Required fields are the minimum needed to identify and locate a route.
    Optional fields are populated when available from the source.
    """
    route_id: str
    name: str
    state: str
    source: str  # "fhwa" | "motorcycleroads" | "bestbikingroads" | "bdr" | "editorial"
    centroid_lat: float
    centroid_lng: float
    length_miles: Optional[float] = None
    bounds_ne_lat: Optional[float] = None
    bounds_ne_lng: Optional[float] = None
    bounds_sw_lat: Optional[float] = None
    bounds_sw_lng: Optional[float] = None


@dataclass
class EnrichedRoute(Route):
    """Route with computed scores and classification fields.

    Extends Route with scoring and classification outputs from the pipeline.
    All score fields default to 0.0, list fields default to empty lists.
    """
    composite_score: float = 0.0
    curvature_score: float = 0.0
    scenic_score: float = 0.0
    technical_score: float = 0.0
    traffic_score: float = 0.0
    remoteness_score: float = 0.0
    primary_archetype: str = ""
    secondary_tags: list[str] = field(default_factory=list)
    one_liner: str = ""
    summary: str = ""
    badges: list[str] = field(default_factory=list)
    season: str = "year_round"
    content_version: int = 1
    enrichment_version: Optional[int] = None
