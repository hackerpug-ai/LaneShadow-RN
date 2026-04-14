"""
Extraction schema for LLM-driven community post analysis.

Version 2 (Epic 3 — INF-005):
- Adds PostExtraction: canonical structured output for a single LLM extraction call.
- Replaces the per-attribute rapidfuzz extraction plan with a single LLM call returning
  a PostExtraction instance.
- Preserves RouteAttributes for backward compatibility with v1 data.
- Adds CACHE_POLICY for (post_id, schema_version) caching.

Cost model (reference only, not enforced here):
- Claude Haiku 4.5: ~$0.001 per extraction (600 input + 300 output tokens typical)
- 100k posts -> ~$100 one-time for full backfill (Epic 9/10 budget)
"""

from __future__ import annotations

from datetime import datetime, timezone
from enum import Enum
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Season(str, Enum):
    """Recommended riding season for a route."""

    YEAR_ROUND = "year_round"
    APR_NOV = "apr_nov"
    MAY_SEP = "may_sep"
    SPRING_FALL = "spring_fall"


class RoadSurface(str, Enum):
    """Road surface type for a route."""

    PAVED = "paved"
    GRAVEL = "gravel"
    DIRT = "dirt"
    MIXED = "mixed"


EXTRACTION_SCHEMA_VERSION: int = 2

DEFAULT_EXTRACTION_MODEL: str = "claude-haiku-4-5-20251001"

CACHE_POLICY: dict = {
    "key_format": "{post_id}|{extraction_schema_version}",
    "ttl_seconds": 30 * 24 * 60 * 60,
    "invalidate_on_version_bump": True,
}


class RouteAttributes(BaseModel):
    """Structured attributes extracted from route description text.

    This is the output schema for LLM extraction. Claude Haiku analyzes
    route descriptions and produces these attributes via Instructor.

    Pipeline Principle P1: LLM does text -> structure only, never ranking.
    Pipeline Principle P4: All extraction at temperature=0.
    Pipeline Principle P5: Pydantic validates between LLM and downstream code.
    """

    # Chain-of-thought reasoning MUST come first (improves extraction quality)
    reasoning: str = Field(
        description="Step-by-step reasoning about the route's characteristics before scoring."
    )

    # Scores (0.0 - 1.0)
    scenic_score: float = Field(
        ge=0.0, le=1.0, description="Visual scenery quality (0.0 = plain, 1.0 = spectacular)"
    )
    technical_score: float = Field(
        ge=0.0, le=1.0, description="Technical riding challenge (0.0 = easy, 1.0 = expert)"
    )
    traffic_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Low traffic (1.0 = empty road, 0.0 = heavy traffic)",
    )
    remoteness_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Distance from urban areas (0.0 = urban, 1.0 = wilderness)",
    )
    condition_score: float = Field(
        ge=0.0, le=1.0, description="Road surface condition (0.0 = poor, 1.0 = pristine)"
    )
    elevation_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Elevation gain/variety (0.0 = flat, 1.0 = dramatic elevation changes)",
    )
    designation_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Official scenic/byway designation (0.0 = none, 1.0 = national scenic byway)",
    )
    community_score: float = Field(
        ge=0.0,
        le=1.0,
        description="Community/rider popularity (0.0 = unknown, 1.0 = legendary)",
    )

    # Categorical attributes
    season: Season = Field(description="Recommended riding season")
    road_surface: RoadSurface = Field(description="Road surface type")

    # Archetype classification
    primary_archetype_hint: Literal[
        "twisties", "mountain", "coastal", "adventure", "scenic_byway", "desert"
    ] = Field(description="Primary ride archetype suggestion")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "reasoning": "This route is a mountain pass with 318 curves in 11 miles. "
                "The road is in excellent condition with minimal traffic. "
                "It's famous among sport bike riders for its technical challenge.",
                "scenic_score": 0.8,
                "technical_score": 0.95,
                "traffic_score": 0.6,
                "remoteness_score": 0.4,
                "condition_score": 0.9,
                "elevation_score": 0.7,
                "designation_score": 0.0,
                "community_score": 0.95,
                "season": "apr_nov",
                "road_surface": "paved",
                "primary_archetype_hint": "twisties",
            }
        }
    )


# ============================================================================
# V2: PostExtraction — canonical LLM output contract
# ============================================================================


class PostExtraction(BaseModel):
    """
    Structured output from a single LLM call over a community post.

    Produced once per raw post (Epic 9 ingestion) and stored in Convex
    route_posts_raw.payload. Downstream matching, enrichment, and reconciliation
    read from this shape.
    """

    # Identifier mentions
    road_name_mentions: list[str] = Field(
        default_factory=list,
        description="Road/route names extracted from the post, including nicknames. "
                    "Examples: ['Tail of the Dragon', 'The Dragon', 'Deals Gap']",
    )
    highway_refs: list[str] = Field(
        default_factory=list,
        description="Highway number references normalized to a canonical form. "
                    "Examples: ['US-129', 'I-40', 'SR-28']",
    )
    state_refs: list[str] = Field(
        default_factory=list,
        description="State references (two-letter codes or full names). Examples: ['TN', 'Tennessee']",
    )
    landmark_refs: list[str] = Field(
        default_factory=list,
        description="Nearby landmarks, towns, rivers, or geographic anchors. "
                    "Examples: ['Chattanooga', 'Great Smoky Mountains', 'Fontana Dam']",
    )

    # Sentiment & aspects
    sentiment: Literal["positive", "neutral", "negative"] = Field(
        ...,
        description="Overall sentiment of the post toward the road(s) mentioned",
    )
    aspect_scores: dict[str, float] = Field(
        default_factory=dict,
        description="Per-aspect scores in the range [0.0, 1.0]. "
                    "Known aspects: curvature, scenery, traffic, surface_quality, elevation_drama. "
                    "Unknown aspects are allowed but will be ignored by scoring.",
    )
    attributes: dict[str, bool] = Field(
        default_factory=dict,
        description="Boolean attribute flags. "
                    "Known attributes: has_gas, has_food, wet_weather_ok, beginner_friendly, "
                    "requires_adv_bike, closed_in_winter.",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Caveats or warnings the post raised (construction, closures, hazards, etc.)",
    )

    # Extraction metadata
    extraction_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Model-reported confidence in the extraction (0.0 = guess, 1.0 = high confidence)",
    )
    extraction_model: str = Field(
        ..., description="Model identifier, e.g. 'claude-haiku-4-5-20251001'"
    )
    extraction_cost: float = Field(
        ..., ge=0.0, description="USD cost of this extraction call (input + output tokens)"
    )
    extracted_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="Timestamp of the extraction call",
    )
    extraction_schema_version: int = Field(
        default=EXTRACTION_SCHEMA_VERSION,
        description="Schema version the extractor was told to produce",
    )

    model_config = ConfigDict(extra="forbid")  # strict — reject unknown fields


def is_v1_extraction(payload: dict) -> bool:
    """Return True if the payload looks like v1 RouteAttributes (not v2 PostExtraction)."""
    return "curvature_score" in payload and "road_name_mentions" not in payload
