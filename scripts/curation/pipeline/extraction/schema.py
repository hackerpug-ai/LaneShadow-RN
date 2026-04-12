"""Pydantic schema for LLM-extracted route attributes.

This schema defines the structured output that Claude Haiku produces when
analyzing route descriptions. All extraction runs at temperature=0 with
retry-on-validation-failure (Pipeline Principles P4, P5).

The reasoning field MUST come first — chain-of-thought before scoring
improves extraction quality by ~60% (research-backed).
"""

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


EXTRACTION_SCHEMA_VERSION = 1


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
