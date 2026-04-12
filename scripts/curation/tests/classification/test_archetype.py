"""Tests for archetype classifier (PIPE-008)."""

import pytest
from dataclasses import replace

from scripts.curation.pipeline.models import Route, EnrichedRoute
from scripts.curation.pipeline.classification.archetype import classify


def _make_route(**kwargs) -> Route:
    """Create a test Route with defaults."""
    defaults = dict(
        route_id="test-001",
        name="Test Road",
        state="TN",
        source="fhwa",
        centroid_lat=35.5,
        centroid_lng=-84.0,
    )
    defaults.update(kwargs)
    return Route(**defaults)


def _minimal_scores(**overrides) -> dict:
    """Create minimal scores dict for testing."""
    base = {
        "curvature_score": 0.3,
        "scenic_score": 0.5,
        "technical_score": 0.3,
        "traffic_score": 0.5,
        "remoteness_score": 0.3,
        "composite_score": 0.4,
    }
    base.update(overrides)
    return base


def test_classify_assigns_twisties_for_high_curvature_route():
    """AC-1: classify assigns 'twisties' to a high-curvature, low-elevation route.

    GIVEN: a scored Route where curvature_score is high (>=0.8) and
           elevation characteristics do not indicate mountain archetype
    WHEN: classify(route, scores) is called
    THEN: the returned Route has primary_archetype == "twisties"
    """
    # GIVEN: a Route with curvature_score >= 0.8, no coastal or adventure signals
    route = _make_route(state="TN", source="fhwa")
    scores = _minimal_scores(curvature_score=0.85)

    # WHEN: classify is called
    result = classify(route, scores)

    # THEN: primary_archetype is "twisties"
    assert result.primary_archetype == "twisties"

    # AND: input Route is not mutated (new EnrichedRoute instance returned)
    assert isinstance(result, EnrichedRoute)
    assert route is not result  # Different instances


def test_classify_assigns_coastal_for_coastal_proximity_route():
    """AC-2: classify assigns 'coastal' to a route with high coastal proximity and FHWA designation.

    GIVEN: a scored Route with source="fhwa" and state indicating a coastal state,
           and scenic_score elevated from scenic designation
    WHEN: classify(route, scores) is called
    THEN: the returned Route has primary_archetype == "coastal"
    """
    # GIVEN: a coastal FHWA route
    route = _make_route(state="CA", source="fhwa")
    scores = _minimal_scores(scenic_score=0.8)

    # WHEN: classify is called
    result = classify(route, scores)

    # THEN: primary_archetype is "coastal"
    assert result.primary_archetype == "coastal"
    assert isinstance(result, EnrichedRoute)


def test_classify_is_deterministic():
    """AC-3: classify is deterministic — same input produces same output on repeated calls.

    GIVEN: a scored Route instance and its scores dict
    WHEN: classify(route, scores) is called twice with identical arguments
    THEN: both calls return a Route with identical primary_archetype and identical secondary_tags
    """
    # GIVEN: a route and scores
    route = _make_route(state="TN", source="fhwa")
    scores = _minimal_scores(curvature_score=0.85)

    # WHEN: classify is called twice
    result1 = classify(route, scores)
    result2 = classify(route, scores)

    # THEN: both calls return identical classification
    assert result1.primary_archetype == result2.primary_archetype
    assert result1.secondary_tags == result2.secondary_tags


def test_classify_falls_back_to_scenic_byway_when_no_rule_matches():
    """AC-4: classify falls back to 'scenic_byway' when no specific archetype rule matches.

    GIVEN: a scored Route where no archetype rule applies (moderate curvature,
           no coastal proximity, low elevation, paved surface, no BDR designation)
    WHEN: classify(route, scores) is called
    THEN: the returned Route has primary_archetype == 'scenic_byway' (the default fallback)
    """
    # GIVEN: a route that matches no specific archetype rule
    # - Moderate curvature (not twisties)
    # - Non-coastal state
    # - FHWA source (triggers scenic_byway default)
    route = _make_route(state="TN", source="fhwa")
    scores = _minimal_scores(curvature_score=0.5, remoteness_score=0.3)

    # WHEN: classify is called
    result = classify(route, scores)

    # THEN: primary_archetype is "scenic_byway" (the fallback)
    assert result.primary_archetype == "scenic_byway"
    assert isinstance(result, EnrichedRoute)
