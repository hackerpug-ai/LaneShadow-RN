"""Shared pytest fixtures for the curation pipeline test suite."""

import sys
from pathlib import Path

import pytest

# Support two invocation patterns:
#   1. From repo root:      PYTHONPATH=$(pwd) pytest scripts/curation/tests/...
#   2. From scripts/curation: pytest tests/...
# In case 1, 'pipeline' is not directly importable — only 'scripts.curation.pipeline' is.
# Add scripts/curation to sys.path so 'from pipeline.models import ...' works in both cases.
_scripts_curation = str(Path(__file__).resolve().parent.parent)
if _scripts_curation not in sys.path:
    sys.path.insert(0, _scripts_curation)

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
