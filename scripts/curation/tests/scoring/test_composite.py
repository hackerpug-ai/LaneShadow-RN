"""Tests for composite scoring engine (PIPE-007)."""

import pytest
from scripts.curation.pipeline.models import Route


def _make_full_route(**kwargs) -> Route:
    """Helper to create a Route with all fields populated."""
    defaults = dict(
        route_id="test-001",
        name="Test Road",
        state="TN",
        source="fhwa",
        centroid_lat=35.5,
        centroid_lng=-84.0,
        length_miles=25.0,
        bounds_ne_lat=36.0,
        bounds_ne_lng=-83.0,
        bounds_sw_lat=35.0,
        bounds_sw_lng=-85.0,
    )
    defaults.update(kwargs)
    return Route(**defaults)


def test_compute_scores_returns_all_six_scores_in_range():
    """AC-1: compute_scores returns all 6 scores in [0.0, 1.0] for a fully-populated Route."""
    # GIVEN: a fully-populated Route
    route = _make_full_route()

    # WHEN: compute_scores is called
    from scripts.curation.pipeline.scoring.composite import compute_scores

    scores = compute_scores(route)

    # THEN: all 6 keys present, all values in [0.0, 1.0]
    expected_keys = {
        "curvature_score",
        "scenic_score",
        "technical_score",
        "traffic_score",
        "remoteness_score",
        "composite_score",
    }
    assert set(scores.keys()) == expected_keys
    for key, val in scores.items():
        assert isinstance(val, float), f"{key}={val} is not a float"
        assert 0.0 <= val <= 1.0, f"{key}={val} out of range [0.0, 1.0]"


def test_composite_score_equals_weighted_sum_of_components():
    """AC-2: composite_score equals weighted sum of component scores."""
    # GIVEN: a fully-populated Route
    route = _make_full_route()

    # WHEN: compute_scores is called
    from scripts.curation.pipeline.scoring.composite import compute_scores, WEIGHTS

    scores = compute_scores(route)

    # THEN: composite_score equals the weighted sum of component scores
    # Using the weights from PRD S9-TRD-4
    expected_composite = (
        WEIGHTS["curviness"] * scores["curvature_score"]
        + WEIGHTS["scenery"] * scores["scenic_score"]
        + WEIGHTS["traffic"] * scores["traffic_score"]
        + WEIGHTS["condition"] * scores["technical_score"]
        + WEIGHTS["osm_curvature"] * scores["curvature_score"]
        + WEIGHTS["elevation_drama"] * scores["technical_score"]
        + WEIGHTS["fhwa_designation"] * scores["scenic_score"]
        + WEIGHTS["community_rating"] * scores["remoteness_score"]
    )

    # Allow for floating-point rounding errors
    assert abs(scores["composite_score"] - expected_composite) < 1e-6, (
        f"composite_score {scores['composite_score']} != "
        f"weighted sum {expected_composite}"
    )


def test_compute_scores_is_deterministic():
    """AC-3: compute_scores is deterministic — same input yields same output."""
    # GIVEN: a Route instance
    route = _make_full_route()

    # WHEN: compute_scores is called twice with the same route
    from scripts.curation.pipeline.scoring.composite import compute_scores

    scores1 = compute_scores(route)
    scores2 = compute_scores(route)

    # THEN: both calls return identical dicts
    assert scores1 == scores2, "compute_scores is not deterministic"

    # Verify each score value is identical
    for key in scores1:
        assert scores1[key] == scores2[key], f"{key} differs between calls"


def test_compute_scores_handles_missing_optional_fields():
    """AC-4: compute_scores handles Routes with missing optional fields gracefully."""
    # GIVEN: a Route with only required fields
    route = Route(
        route_id="minimal-001",
        name="Minimal Road",
        state="CA",
        source="fhwa",
        centroid_lat=37.5,
        centroid_lng=-119.5,
        # No optional fields like length_miles, bounds, etc.
    )

    # WHEN: compute_scores is called
    from scripts.curation.pipeline.scoring.composite import compute_scores

    # THEN: no exception is raised, all 6 score keys are present
    scores = compute_scores(route)

    expected_keys = {
        "curvature_score",
        "scenic_score",
        "technical_score",
        "traffic_score",
        "remoteness_score",
        "composite_score",
    }
    assert set(scores.keys()) == expected_keys

    # AND: each value is a float in [0.0, 1.0]
    for key, val in scores.items():
        assert isinstance(val, float), f"{key}={val} is not a float"
        assert 0.0 <= val <= 1.0, f"{key}={val} out of range [0.0, 1.0]"
