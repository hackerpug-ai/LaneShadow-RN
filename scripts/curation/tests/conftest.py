"""Shared pytest fixtures for the curation pipeline test suite."""

import sys
from pathlib import Path

import pytest

# Add project root to Python path for imports
project_root = Path(__file__).parent.parent.parent.parent
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

# Use absolute imports to support all invocation patterns:
#   1. From repo root:      PYTHONPATH=$(pwd) pytest scripts/curation/tests/...
#   2. From scripts/curation: pytest tests/...
# Absolute imports work in both cases without sys.path manipulation.
from scripts.curation.pipeline.models import Route, EnrichedRoute


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
