"""Tests for INF-007: Convex Push Serialization for Semantic Matching Fields.

Tests cover AC-1 through AC-10 for the _route_to_dict() serializer updates.
"""

import pytest

from scripts.curation.pipeline.models import Route, EnrichedRoute
from scripts.curation.pipeline.sync.convex_push import (
    _route_to_dict,
    DEFAULT_BATCH_SIZE,
)


class TestSemanticFieldSerialization:
    """Test serialization of semantic matching fields (AC-1, AC-2, AC-3, AC-10)."""

    def test_embedding_serialized_as_searchEmbedding(self):
        """AC-1: Route.embedding serializes to searchEmbedding (CRITICAL RENAME)."""
        route = Route(
            route_id="test-1",
            name="Test Route",
            state="CA",
            source="editorial",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )
        route.embedding = [0.1] * 1536

        result = _route_to_dict(route)

        assert "searchEmbedding" in result
        assert result["searchEmbedding"] == [0.1] * 1536
        assert len(result["searchEmbedding"]) == 1536

    def test_candidate_identifiers_serialized(self):
        """AC-2: Route.candidate_identifiers serializes to candidateIdentifiers."""
        route = Route(
            route_id="test-2",
            name="Tail of the Dragon",
            state="TN",
            source="motorcycleroads",
            centroid_lat=35.5,
            centroid_lng=-83.9,
            length_miles=11.0,
            bounds_ne_lat=35.6,
            bounds_ne_lng=-83.8,
            bounds_sw_lat=35.4,
            bounds_sw_lng=-84.0,
        )
        route.candidate_identifiers = [
            "Tail of the Dragon",
            "The Dragon",
            "Deals Gap",
            "US-129",
        ]

        result = _route_to_dict(route)

        assert "candidateIdentifiers" in result
        assert result["candidateIdentifiers"] == [
            "Tail of the Dragon",
            "The Dragon",
            "Deals Gap",
            "US-129",
        ]

    def test_llm_reconciliation_log_serialized(self):
        """AC-3: Route.llm_reconciliation_log serializes to llmReconciliationLog."""
        route = Route(
            route_id="test-3",
            name="Test Route",
            state="CA",
            source="editorial",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )
        route.llm_reconciliation_log = [
            {
                "run_id": "run-abc123",
                "reconciled_at": "2026-04-14T10:00:00Z",
                "conflicts_resolved": 3,
                "notes": "Merged duplicate identifiers",
            }
        ]

        result = _route_to_dict(route)

        assert "llmReconciliationLog" in result
        assert result["llmReconciliationLog"] == [
            {
                "run_id": "run-abc123",
                "reconciled_at": "2026-04-14T10:00:00Z",
                "conflicts_resolved": 3,
                "notes": "Merged duplicate identifiers",
            }
        ]

    def test_no_legacy_fields_serialized(self):
        """AC-10: Legacy fields (mergedAt, mergeCount, fieldProvenance) are NOT serialized."""
        route = Route(
            route_id="test-10",
            name="Test Route",
            state="CA",
            source="editorial",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )

        result = _route_to_dict(route)

        # These legacy fields should NOT be in the output
        assert "mergedAt" not in result
        assert "mergeCount" not in result
        assert "fieldProvenance" not in result


class TestEnrichmentFieldSerialization:
    """Test serialization of enrichment output fields (AC-4)."""

    def test_enrichment_fields_serialized(self):
        """AC-4: Enrichment fields serialize with correct camelCase mapping."""
        route = Route(
            route_id="test-4",
            name="Test Route",
            state="CA",
            source="fhwa",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )
        route.description = "A scenic coastal ride with stunning ocean views"
        route.rating = 4.5
        route.designation = "National Scenic Byway"
        route.source_url = "https://example.com/route"
        route.source_refs = ["ref1", "ref2"]
        route.highway_number = "CA-1"
        route.elevation_gain_m = 450
        route.surface = "paved"
        route.aadt = 2000
        route.aadt_median = 1800.0
        route.aadt_max = 2500
        route.pavement_iri = 1.2
        route.mention_frequency = 42.0

        result = _route_to_dict(route)

        assert result["description"] == "A scenic coastal ride with stunning ocean views"
        assert result["rating"] == 4.5
        assert result["designation"] == "National Scenic Byway"
        assert result["sourceUrl"] == "https://example.com/route"
        assert result["sourceRefs"] == ["ref1", "ref2"]
        assert result["highwayNumber"] == "CA-1"
        assert result["elevationGainM"] == 450
        assert result["surface"] == "paved"
        assert result["aadt"] == 2000
        assert result["aadtMedian"] == 1800.0
        assert result["aadtMax"] == 2500
        assert result["pavementIri"] == 1.2
        assert result["mentionFrequency"] == 42.0


class TestScoringFieldSerialization:
    """Test serialization of scoring fields on EnrichedRoute (AC-5)."""

    def test_scoring_fields_serialized(self):
        """AC-5: EnrichedRoute scoring fields serialize correctly."""
        route = EnrichedRoute(
            route_id="test-5",
            name="Test Route",
            state="CA",
            source="editorial",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
            composite_score=8.5,
            curvature_score=9.0,
        )
        route.mention_frequency_score = 0.85
        route.designation_score = 0.9
        route.elevation_drama_score = 0.75
        route.road_quality_score = 0.8
        route.low_traffic_score = 0.7
        route.weather_suitability = 0.95
        route.best_months = ["May", "Jun", "Sep", "Oct"]
        route.source_count = 5
        route.quality_tier = "premium"

        result = _route_to_dict(route)

        assert result["mentionFrequencyScore"] == 0.85
        assert result["designationScore"] == 0.9
        assert result["elevationDramaScore"] == 0.75
        assert result["roadQualityScore"] == 0.8
        assert result["lowTrafficScore"] == 0.7
        assert result["weatherSuitability"] == 0.95
        assert result["bestMonths"] == ["May", "Jun", "Sep", "Oct"]
        assert result["sourceCount"] == 5
        assert result["qualityTier"] == "premium"


class TestNoneAndEmptyValueHandling:
    """Test that None and empty values are omitted (AC-6)."""

    def test_none_values_omitted(self):
        """AC-6: None values are omitted from serialization."""
        route = Route(
            route_id="test-6",
            name="Test Route",
            state="CA",
            source="editorial",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )
        # Set some fields to None explicitly
        route.search_text = None
        route.match_confidence = None
        route.embedding = None
        route.description = None
        route.rating = None

        result = _route_to_dict(route)

        # These should not be in the output when None
        assert "searchText" not in result
        assert "matchConfidence" not in result
        assert "searchEmbedding" not in result
        assert "description" not in result
        assert "rating" not in result

    def test_empty_lists_omitted(self):
        """AC-6: Empty lists are omitted from serialization."""
        route = Route(
            route_id="test-6b",
            name="Test Route",
            state="CA",
            source="editorial",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )
        # These are empty by default, but verify they're not serialized
        result = _route_to_dict(route)

        assert "candidateIdentifiers" not in result
        assert "sourceRefs" not in result
        assert "llmReconciliationLog" not in result


class TestBackwardCompatibility:
    """Test backward compatibility with existing Route objects (AC-7)."""

    def test_backward_compatibility_old_route(self):
        """AC-7: Old Route objects without new fields still serialize correctly."""
        route = Route(
            route_id="test-7",
            name="Legacy Route",
            state="CA",
            source="fhwa",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )
        # Don't set any of the new fields - they should default to None/empty

        result = _route_to_dict(route)

        # Core fields should still be present
        assert result["routeId"] == "test-7"
        assert result["name"] == "Legacy Route"
        assert result["state"] == "CA"
        assert result["source"] == "fhwa"
        assert result["centroidLat"] == 37.5
        assert result["centroidLng"] == -122.3

        # New fields should not be present when not set
        assert "searchEmbedding" not in result
        assert "candidateIdentifiers" not in result
        assert "searchText" not in result


class TestBatchSizeConfiguration:
    """Test batch size constant (AC-8)."""

    def test_default_batch_size_constant(self):
        """AC-8: DEFAULT_BATCH_SIZE is defined and equals 10."""
        assert DEFAULT_BATCH_SIZE == 10

    def test_batch_size_used_in_push_routes(self):
        """AC-8: push_routes() uses DEFAULT_BATCH_SIZE when batch_size not provided."""
        from scripts.curation.pipeline.sync.convex_push import push_routes
        import inspect

        sig = inspect.signature(push_routes)
        batch_size_param = sig.parameters["batch_size"]

        # Check that the default value is DEFAULT_BATCH_SIZE
        assert batch_size_param.default == DEFAULT_BATCH_SIZE


class TestEndpointUnchanged:
    """Test that the endpoint URL is unchanged (AC-9)."""

    def test_endpoint_unchanged(self):
        """AC-9: Endpoint URL remains /api/ingest-routes."""
        from scripts.curation.pipeline.sync.convex_push import push_routes
        import inspect

        source = inspect.getsource(push_routes)

        # Verify the endpoint path is still /api/ingest-routes
        assert "/api/ingest-routes" in source

        # Verify it's constructed correctly with base_url
        assert "base_url" in source and "api/ingest-routes" in source


class TestAllSemanticFieldsTogether:
    """Integration test with all semantic fields set."""

    def test_all_semantic_fields_together(self):
        """Test that all semantic fields serialize correctly together."""
        route = Route(
            route_id="test-all",
            name="Comprehensive Test Route",
            state="CA",
            source="editorial",
            centroid_lat=37.5,
            centroid_lng=-122.3,
            length_miles=10.0,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.0,
            bounds_sw_lng=-122.6,
        )
        # Set all semantic fields
        route.embedding = [0.1] * 1536
        route.search_text = "Tail of the Dragon Deals Gap US-129 Tennessee"
        route.candidate_identifiers = [
            "Tail of the Dragon",
            "The Dragon",
            "Deals Gap",
        ]
        route.match_confidence = 0.92
        route.llm_reconciliation_log = [
            {
                "run_id": "run-123",
                "reconciled_at": "2026-04-14T10:00:00Z",
                "conflicts_resolved": 2,
                "notes": "High confidence match",
            }
        ]

        # Set enrichment fields
        route.description = "A legendary motorcycle road"
        route.rating = 5.0
        route.designation = "Motorcyclist's Paradise"
        route.highway_number = "US-129"
        route.elevation_gain_m = 300
        route.surface = "paved"
        route.mention_frequency = 100.0

        result = _route_to_dict(route)

        # Verify all semantic fields
        assert result["searchEmbedding"] == [0.1] * 1536
        assert result["searchText"] == "Tail of the Dragon Deals Gap US-129 Tennessee"
        assert result["candidateIdentifiers"] == [
            "Tail of the Dragon",
            "The Dragon",
            "Deals Gap",
        ]
        assert result["matchConfidence"] == 0.92
        assert result["llmReconciliationLog"] == [
            {
                "run_id": "run-123",
                "reconciled_at": "2026-04-14T10:00:00Z",
                "conflicts_resolved": 2,
                "notes": "High confidence match",
            }
        ]

        # Verify enrichment fields
        assert result["description"] == "A legendary motorcycle road"
        assert result["rating"] == 5.0
        assert result["designation"] == "Motorcyclist's Paradise"
        assert result["highwayNumber"] == "US-129"
        assert result["elevationGainM"] == 300
        assert result["surface"] == "paved"
        assert result["mentionFrequency"] == 100.0
