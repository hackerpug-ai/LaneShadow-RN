"""LLM extraction layer for route attributes.

Uses Claude Haiku via Anthropic API with Instructor for structured output.
All extraction runs at temperature=0 with Pydantic validation (Pipeline Principles P4, P5).
"""

from pipeline.extraction.schema import (
    RouteAttributes,
    Season,
    RoadSurface,
    EXTRACTION_SCHEMA_VERSION,
)
from pipeline.extraction.client import ExtractionClient
from pipeline.extraction.extractor import extract_batch, extract_single

__all__ = [
    "RouteAttributes",
    "Season",
    "RoadSurface",
    "EXTRACTION_SCHEMA_VERSION",
    "ExtractionClient",
    "extract_batch",
    "extract_single",
]
