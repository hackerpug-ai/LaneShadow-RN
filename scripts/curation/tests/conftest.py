"""Shared pytest fixtures for the curation pipeline test suite."""

import pytest

from pipeline.models import Route, EnrichedRoute


@pytest.fixture
def sample_route() -> Route:
    """Return a minimal valid Route instance for testing.

    Uses FHWA source as a representative example.
    Centered on Tennessee (mid-state coordinates).
    """
    return Route(
        route_id="fhwa-tn-001",
        name="The Dragon",
        state="TN",
        source="fhwa",
        centroid_lat=35.5,
        centroid_lng=-84.0,
    )


@pytest.fixture
def sample_enriched_route() -> EnrichedRoute:
    """Return a minimal valid EnrichedRoute instance for testing.

    Includes default scoring values (all zeros) and classification fields.
    """
    return EnrichedRoute(
        route_id="fhwa-tn-001",
        name="The Dragon",
        state="TN",
        source="fhwa",
        centroid_lat=35.5,
        centroid_lng=-84.0,
    )
