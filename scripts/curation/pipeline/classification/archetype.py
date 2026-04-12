"""Archetype classifier for routes (PIPE-008).

Decision tree classification — deterministic, no ML.
Source: PRD S9-TRD-5 (10-trd-detail.md §5)
"""

from __future__ import annotations

from dataclasses import replace

from scripts.curation.pipeline.models import Route, EnrichedRoute

# Valid archetype literals — matches Convex curated_routes.primaryArchetype union
ARCHETYPES = frozenset({
    "twisties",
    "mountain",
    "coastal",
    "adventure",
    "scenic_byway",
    "desert",
})

# Coastal US states — used as a proxy for coastal proximity in Phase 1
# Phase 2 will use actual geographic distance to coastline
COASTAL_STATES = frozenset({
    "CA", "OR", "WA", "ME", "NH", "MA", "RI", "CT", "NY", "NJ",
    "DE", "MD", "VA", "NC", "SC", "GA", "FL", "AL", "MS", "LA", "TX",
    "AK", "HI",
})


def classify(route: Route, scores: dict[str, float]) -> EnrichedRoute:
    """Classify a scored Route into one of 6 archetypes.

    Pure function — returns a new EnrichedRoute with primary_archetype and secondary_tags set.
    Input Route is not mutated.

    Rule priority order from PRD S9-TRD-5:
      1. adventure (surface or BDR source overrides everything)
      2. coastal   (coastal proximity + scenic designation)
      3. mountain  (high elevation gain)
      4. twisties  (high curvature score)
      5. scenic_byway (FHWA designation — default for most Phase 1 routes)
      6. desert    (low curvature, remote, arid — implicit fallback after scenic_byway)

    Falls back to "scenic_byway" when no specific rule fires.

    Source: PRD S9-TRD-5 (10-trd-detail.md §5)

    Args:
        route: A Route instance to classify
        scores: Dict of score names to float values in [0.0, 1.0]

    Returns:
        A new EnrichedRoute instance with primary_archetype and secondary_tags set
    """
    curvature = scores.get("curvature_score", 0.0)
    remoteness = scores.get("remoteness_score", 0.0)
    secondary: list[str] = []

    # Build an EnrichedRoute from the input Route
    # This preserves all Route fields and adds classification fields
    enriched = EnrichedRoute(
        route_id=route.route_id,
        name=route.name,
        state=route.state,
        source=route.source,
        centroid_lat=route.centroid_lat,
        centroid_lng=route.centroid_lng,
        length_miles=route.length_miles,
        bounds_ne_lat=route.bounds_ne_lat,
        bounds_ne_lng=route.bounds_ne_lng,
        bounds_sw_lat=route.bounds_sw_lat,
        bounds_sw_lng=route.bounds_sw_lng,
    )

    # Rule 1: adventure — surface material or BDR source overrides all other rules
    # Phase 2: uncomment when surface field is available
    # if route.surface in ("gravel", "dirt", "mixed") or route.source == "bdr":
    #     return replace(enriched, primary_archetype="adventure", secondary_tags=secondary)

    # Rule 2: coastal — coastal state + scenic designation proxy
    if route.state in COASTAL_STATES and route.source == "fhwa":
        secondary = ["scenic", "designated"]
        return replace(enriched, primary_archetype="coastal", secondary_tags=secondary)

    # Rule 3: mountain — high elevation gain (requires elevation data from Phase 2)
    # Phase 2: uncomment when elevation_gain_m field is available
    # if getattr(route, "elevation_gain_m", None) and route.elevation_gain_m > 1200:
    #     return replace(enriched, primary_archetype="mountain", secondary_tags=secondary)

    # Rule 4: twisties — high curvature score
    if curvature >= 0.8:
        secondary = ["technical"]
        if curvature >= 0.9:
            secondary.append("legendary")
        return replace(enriched, primary_archetype="twisties", secondary_tags=secondary)

    # Rule 5: scenic_byway — FHWA designated routes default here
    if route.source == "fhwa":
        return replace(enriched, primary_archetype="scenic_byway", secondary_tags=secondary)

    # Rule 6: desert / default fallback
    if remoteness >= 0.6:
        return replace(enriched, primary_archetype="desert", secondary_tags=secondary)

    # Final fallback — should cover all remaining cases
    return replace(enriched, primary_archetype="scenic_byway", secondary_tags=secondary)
