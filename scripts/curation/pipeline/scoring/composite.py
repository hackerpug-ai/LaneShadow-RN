"""Composite scoring engine for routes (PIPE-007).

Source: PRD S9-TRD-4 (10-trd-detail.md §4.1 and §4.2)
"""

from __future__ import annotations

from scripts.curation.pipeline.models import Route

# =============================================================================
# LOOKUP TABLES (from PRD S9-TRD-4 §4.1)
# =============================================================================

# Raw scores are 0-10, will be normalized to 0.0-1.0
CURVINESS_SCORE = {
    "straight": 0,
    "mild": 2,
    "moderate": 5,
    "twisty": 8,
    "very_twisty": 10,
}

SCENERY_QUALITY_SCORE = {
    "unremarkable": 0,
    "pleasant": 3,
    "beautiful": 7,
    "spectacular": 10,
}

CONDITION_SCORE = {
    "poor": 0,
    "fair": 4,
    "good": 7,
    "excellent": 10,
}

TRAFFIC_SCORE = {
    "low": 10,  # inverted - low traffic is good
    "moderate": 5,
    "high": 1,
}

CHALLENGE_SCORE = {
    "beginner": 2,
    "intermediate": 5,
    "advanced": 8,
    "expert": 10,
}

# =============================================================================
# COMPOSITE WEIGHTS (from PRD S9-TRD-4 §4.2)
# =============================================================================

WEIGHTS = {
    "curviness": 0.25,  # LLM-extracted curviness category
    "scenery": 0.15,  # LLM-extracted scenery quality
    "traffic": 0.15,  # LLM-extracted traffic level
    "condition": 0.10,  # LLM-extracted road condition
    "osm_curvature": 0.15,  # Geometric curvature from OSM (not available in Phase 1)
    "elevation_drama": 0.10,  # Elevation profile (not available in Phase 1)
    "fhwa_designation": 0.05,  # FHWA scenic designation
    "community_rating": 0.05,  # Community ratings (not available in Phase 1)
}

# =============================================================================
# NORMALIZATION HELPERS
# =============================================================================


def _clamp(value: float) -> float:
    """Clamp a value to the range [0.0, 1.0]."""
    return min(1.0, max(0.0, value))


def _normalize_to_01(raw_score: int) -> float:
    """Normalize a raw score from 0-10 to 0.0-1.0."""
    return _clamp(raw_score / 10.0)


# =============================================================================
# COMPONENT SCORE FUNCTIONS
# =============================================================================


def _compute_curvature_score(route: Route) -> float:
    """Compute curvature score from route attributes.

    For Phase 1 (FHWA only), we don't have LLM curviness or OSM geometry,
    so we return a neutral score.

    Phase 2 will use:
    - LLM-extracted curviness category (if available)
    - OSM-derived geometric curvature (if available)
    """
    # Phase 1: neutral score since we don't have curvature data yet
    return 0.5


def _compute_scenic_score(route: Route) -> float:
    """Compute scenic score from route attributes.

    For Phase 1, this is based on FHWA designation.
    Phase 2 will incorporate LLM-extracted scenery quality.
    """
    # Phase 1: neutral score
    # Future: check if route has FHWA scenic designation
    return 0.5


def _compute_technical_score(route: Route) -> float:
    """Compute technical challenge score from route attributes.

    Combines curvature, elevation, and surface condition.
    For Phase 1, this is neutral since we lack data.
    """
    # Phase 1: neutral score
    # Future: combine curvature + elevation + surface condition
    return 0.5


def _compute_traffic_score(route: Route) -> float:
    """Compute traffic score from route attributes.

    Inverted: 1.0 = low traffic (good), 0.0 = high traffic (bad).
    For Phase 1, this is neutral since we lack LLM traffic data.
    """
    # Phase 1: neutral score
    # Future: use LLM-extracted traffic level
    return 0.5


def _compute_remoteness_score(route: Route) -> float:
    """Compute remoteness score from route attributes.

    Based on distance from urban centers.
    For Phase 1, this is neutral.
    """
    # Phase 1: neutral score
    # Future: compute from distance to urban centers
    return 0.5


# =============================================================================
# MAIN SCORING FUNCTION
# =============================================================================


def compute_scores(route: Route) -> dict[str, float]:
    """Compute all 6 quality scores for a Route.

    Pure function — deterministic, no I/O, no side effects.
    Missing optional fields produce neutral (0.5 or 0.0) defaults.

    Returns a dict with keys:
        curvature_score, scenic_score, technical_score,
        traffic_score, remoteness_score, composite_score

    All values are floats clamped to [0.0, 1.0].

    Source: PRD S9-TRD-4 (10-trd-detail.md §4.1 and §4.2)

    Args:
        route: A Route instance from the pipeline

    Returns:
        Dict mapping score names to float values in [0.0, 1.0]
    """
    # Compute component scores
    curvature_score = _clamp(_compute_curvature_score(route))
    scenic_score = _clamp(_compute_scenic_score(route))
    technical_score = _clamp(_compute_technical_score(route))
    traffic_score = _clamp(_compute_traffic_score(route))
    remoteness_score = _clamp(_compute_remoteness_score(route))

    # Compute composite score using weighted sum
    # Note: For Phase 1, we use the 5 component scores as proxies
    # for the full 8-dimension formula
    composite_score = _clamp(
        WEIGHTS["curviness"] * curvature_score
        + WEIGHTS["scenery"] * scenic_score
        + WEIGHTS["traffic"] * traffic_score
        + WEIGHTS["condition"] * technical_score
        + WEIGHTS["osm_curvature"] * curvature_score
        + WEIGHTS["elevation_drama"] * technical_score
        + WEIGHTS["fhwa_designation"] * scenic_score
        + WEIGHTS["community_rating"] * remoteness_score
    )

    return {
        "curvature_score": curvature_score,
        "scenic_score": scenic_score,
        "technical_score": technical_score,
        "traffic_score": traffic_score,
        "remoteness_score": remoteness_score,
        "composite_score": composite_score,
    }


if __name__ == "__main__":
    import sys
    import json
    import argparse
    import logging
    from pathlib import Path
    from scripts.curation.pipeline.models import Route

    logging.basicConfig(level=logging.INFO)
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Input JSONL of Route records")
    p.add_argument("--out", required=True, help="Output JSON array of scored routes")
    p.add_argument("--count", type=int, default=None, help="Optional cap on routes")
    args = p.parse_args()

    routes = [Route(**json.loads(l)) for l in open(args.input)]
    if args.count:
        routes = routes[:args.count]

    logging.info(f"WEIGHTS: {WEIGHTS}")

    results = []
    for r in routes:
        scores = compute_scores(r)
        results.append({"route_id": r.route_id, "name": r.name, **scores})

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Scored {len(results)} routes -> {out}")
