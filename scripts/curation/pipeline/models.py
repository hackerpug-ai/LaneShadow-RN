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

    # ========================================================================
    # Semantic matching fields (Epic 3 — INF-002)
    # ========================================================================
    candidate_identifiers: list[str] = field(default_factory=list)
    # e.g. ["Tail of the Dragon", "The Dragon", "Deals Gap", "US-129"]

    search_text: Optional[str] = None
    # Concatenated string used to generate the embedding (built by INF-004)

    embedding: Optional[list[float]] = None
    # 1536-dim vector from text-embedding-3-small. None until INF-004 backfill

    match_confidence: Optional[float] = None
    # 0.0-1.0, confidence from most recent LLM match decision

    llm_reconciliation_log: list[dict] = field(default_factory=list)
    # List of reconciliation decision records:
    # [{"run_id": str, "reconciled_at": str, "conflicts_resolved": int, "notes": str}, ...]

    # ========================================================================
    # Enrichment output fields (populated by Epic 9/10 LLM pipeline)
    # ========================================================================
    description: Optional[str] = None
    rating: Optional[float] = None                 # 0.0-5.0
    designation: Optional[str] = None              # "National Scenic Byway", "State Route", etc.
    source_url: Optional[str] = None
    source_refs: list[str] = field(default_factory=list)
    highway_number: Optional[str] = None           # "US-129", "SR-28"
    elevation_gain_m: Optional[float] = None
    surface: Optional[str] = None                  # paved|gravel|dirt|mixed
    aadt: Optional[int] = None                     # annual average daily traffic
    aadt_median: Optional[float] = None
    aadt_max: Optional[float] = None
    pavement_iri: Optional[float] = None           # pavement roughness index
    mention_frequency: Optional[float] = None      # count of community mentions


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

    # ========================================================================
    # Derived scoring fields (Epic 3 — INF-002)
    # ========================================================================
    mention_frequency_score: Optional[float] = None
    designation_score: Optional[float] = None
    elevation_drama_score: Optional[float] = None
    road_quality_score: Optional[float] = None
    low_traffic_score: Optional[float] = None
    weather_suitability: Optional[float] = None
    best_months: list[str] = field(default_factory=list)  # e.g. ["May", "Jun", "Sep", "Oct"]
    source_count: Optional[int] = None
    quality_tier: Optional[str] = None              # premium|standard|minimal


@dataclass
class LLMExtractionArtifact:
    """Record of a single LLM extraction run for a community post."""
    artifact_id: str                    # uuid4
    post_id: str                        # upstream post identifier
    post_url: str
    source: str                         # "reddit", "advrider", "rider_magazine", etc.
    raw_text: str                       # the post text sent to the LLM
    extraction_schema_version: int      # EXTRACTION_SCHEMA_VERSION from schema.py
    extraction_model: str               # "claude-haiku-4-5-20251001", etc.
    extraction_cost: float              # USD
    extracted_at: str                   # ISO timestamp
    payload: dict = field(default_factory=dict)  # serialized PostExtraction.model_dump()
    extraction_confidence: Optional[float] = None


@dataclass
class RouteMatch:
    """Audit record for a (post → route) match decision made via vector search + LLM rerank."""
    match_id: str                       # uuid4
    post_id: str
    route_id: str
    match_confidence: float             # 0.0-1.0 from LLM rerank
    match_reasoning: str                # LLM's stated reason for the match
    cosine_similarity: float            # 0.0-1.0 from vector search
    rerank_model: str                   # "claude-haiku-4-5-20251001"
    rerank_cost: float                  # USD
    matched_at: str                     # ISO timestamp
    is_arbitrated: bool = False         # True if this match required LLM arbitration (mid-confidence)
    arbitration_notes: Optional[str] = None


@dataclass
class CommunityWaypointMention:
    """A waypoint mention extracted from a community post.

    Produced by PostExtraction v3 waypoint_mentions field and consumed
    by waypoint reconciliation logic to match against the waypoints database.
    """
    post_id: str                        # ID of the post this mention came from
    waypoint_name: str                  # Name or identifier of the waypoint
    category_hint: str                  # "viewpoint" | "gas_station" | "food" | "lodging" | "other"
    confidence: float                   # 0.0-1.0, LLM's confidence in this mention
    context: str                        # Surrounding text that led to this identification
    extracted_at: str                   # ISO timestamp of when this was extracted


# Re-export PostExtraction from extraction/schema.py for convenience
# Note: INF-005 owns the Pydantic PostExtraction definition. This re-export makes it
# available from the models module for downstream consumers.
from scripts.curation.pipeline.extraction.schema import PostExtraction  # noqa: E402
