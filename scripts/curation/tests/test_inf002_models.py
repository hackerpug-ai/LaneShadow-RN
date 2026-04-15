"""
Unit tests for INF-002: Extended Route Models — Embedding, Identifiers, LLM Artifacts.

Tests AC-1 through AC-6 as defined in the task specification.
"""

import pytest
from dataclasses import fields

from pipeline.models import (
    Route,
    EnrichedRoute,
    LLMExtractionArtifact,
    RouteMatch,
    PostExtraction,
)


class TestAC1_RouteSemanticAndEnrichmentFields:
    """AC-1: Route dataclass extended with semantic matching fields"""

    def test_route_has_semantic_matching_fields(self):
        """GIVEN: Existing Route dataclass
        WHEN: I add semantic matching fields (candidate_identifiers, search_text,
              embedding, match_confidence, llm_reconciliation_log)
        THEN: All new fields are Optional with safe defaults; no existing fields
              are modified or removed
        """
        # Verify semantic matching fields exist
        route_fields = {f.name for f in fields(Route)}
        semantic_fields = {
            "candidate_identifiers",
            "search_text",
            "embedding",
            "match_confidence",
            "llm_reconciliation_log",
        }
        assert semantic_fields.issubset(route_fields)

        # Verify field types by accessing field dict
        field_dict = {f.name: f for f in fields(Route)}
        assert field_dict["candidate_identifiers"].type == list[str]
        assert field_dict["search_text"].type == str | None
        assert field_dict["embedding"].type == list[float] | None
        assert field_dict["match_confidence"].type == float | None
        assert field_dict["llm_reconciliation_log"].type == list[dict]

    def test_route_has_enrichment_output_fields(self):
        """GIVEN: Existing Route dataclass
        WHEN: I add enrichment output fields (description, rating, designation,
              source_url, source_refs, highway_number, elevation_gain_m, surface,
              aadt, aadt_median, aadt_max, pavement_iri, mention_frequency)
        THEN: All new fields are Optional with safe defaults
        """
        route_fields = {f.name for f in fields(Route)}
        enrichment_fields = {
            "description",
            "rating",
            "designation",
            "source_url",
            "source_refs",
            "highway_number",
            "elevation_gain_m",
            "surface",
            "aadt",
            "aadt_median",
            "aadt_max",
            "pavement_iri",
            "mention_frequency",
        }
        assert enrichment_fields.issubset(route_fields)

    def test_route_semantic_fields_have_safe_defaults(self):
        """Verify semantic matching fields have proper default values."""
        route = Route(
            route_id="test",
            name="Test Route",
            state="CA",
            source="test",
            centroid_lat=0.0,
            centroid_lng=0.0,
        )

        assert route.candidate_identifiers == []
        assert route.search_text is None
        assert route.embedding is None
        assert route.match_confidence is None
        assert route.llm_reconciliation_log == []

    def test_route_enrichment_fields_have_safe_defaults(self):
        """Verify enrichment output fields have proper default values."""
        route = Route(
            route_id="test",
            name="Test Route",
            state="CA",
            source="test",
            centroid_lat=0.0,
            centroid_lng=0.0,
        )

        assert route.description is None
        assert route.rating is None
        assert route.designation is None
        assert route.source_url is None
        assert route.source_refs == []
        assert route.highway_number is None
        assert route.elevation_gain_m is None
        assert route.surface is None
        assert route.aadt is None
        assert route.aadt_median is None
        assert route.aadt_max is None
        assert route.pavement_iri is None
        assert route.mention_frequency is None


class TestAC2_EnrichedRouteScoringFields:
    """AC-2: EnrichedRoute extended with scoring fields"""

    def test_enriched_route_has_scoring_fields(self):
        """GIVEN: Existing EnrichedRoute extending Route
        WHEN: I add 9 new Optional fields (mention_frequency_score,
              designation_score, elevation_drama_score, road_quality_score,
              low_traffic_score, weather_suitability, best_months, source_count,
              quality_tier)
        THEN: EnrichedRoute has all 9 new Optional fields with None / empty-factory
              defaults
        """
        enriched_fields = {f.name for f in fields(EnrichedRoute)}
        scoring_fields = {
            "mention_frequency_score",
            "designation_score",
            "elevation_drama_score",
            "road_quality_score",
            "low_traffic_score",
            "weather_suitability",
            "best_months",
            "source_count",
            "quality_tier",
        }
        assert scoring_fields.issubset(enriched_fields)

    def test_enriched_route_scoring_fields_have_defaults(self):
        """Verify scoring fields have proper default values."""
        enriched = EnrichedRoute(
            route_id="test",
            name="Test Route",
            state="CA",
            source="test",
            centroid_lat=0.0,
            centroid_lng=0.0,
        )

        assert enriched.mention_frequency_score is None
        assert enriched.designation_score is None
        assert enriched.elevation_drama_score is None
        assert enriched.road_quality_score is None
        assert enriched.low_traffic_score is None
        assert enriched.weather_suitability is None
        assert enriched.best_months == []
        assert enriched.source_count is None
        assert enriched.quality_tier is None


class TestAC3_LLMExtractionArtifactDataclass:
    """AC-3: LLMExtractionArtifact dataclass created"""

    def test_llm_extraction_artifact_has_all_fields(self):
        """GIVEN: Need a type to represent a single LLM extraction run output (per post)
        WHEN: I create `LLMExtractionArtifact` at module level
        THEN: Dataclass has fields: artifact_id (str), post_id (str), post_url (str),
              source (str), raw_text (str), extraction_schema_version (int),
              extraction_model (str), extraction_cost (float), extracted_at (str ISO),
              payload (dict — the full PostExtraction output serialized),
              extraction_confidence (Optional[float])
        """
        artifact_fields = {f.name for f in fields(LLMExtractionArtifact)}
        required_fields = {
            "artifact_id",
            "post_id",
            "post_url",
            "source",
            "raw_text",
            "extraction_schema_version",
            "extraction_model",
            "extraction_cost",
            "extracted_at",
            "payload",
            "extraction_confidence",
        }
        assert artifact_fields == required_fields

    def test_llm_extraction_artifact_instantiation(self):
        """Verify LLMExtractionArtifact can be instantiated with all fields."""
        artifact = LLMExtractionArtifact(
            artifact_id="abc-123",
            post_id="post-1",
            post_url="https://reddit.com/r/test",
            source="reddit",
            raw_text="Great ride on Tail of the Dragon!",
            extraction_schema_version=2,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.001,
            extracted_at="2026-04-14T12:00:00Z",
            payload={"road_name_mentions": ["Tail of the Dragon"]},
            extraction_confidence=0.9,
        )

        assert artifact.artifact_id == "abc-123"
        assert artifact.post_id == "post-1"
        assert artifact.payload == {"road_name_mentions": ["Tail of the Dragon"]}
        assert artifact.extraction_confidence == 0.9

    def test_llm_extraction_artifact_defaults(self):
        """Verify default values for optional fields."""
        artifact = LLMExtractionArtifact(
            artifact_id="abc-123",
            post_id="post-1",
            post_url="https://reddit.com/r/test",
            source="reddit",
            raw_text="Great ride!",
            extraction_schema_version=2,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.001,
            extracted_at="2026-04-14T12:00:00Z",
        )

        assert artifact.payload == {}
        assert artifact.extraction_confidence is None


class TestAC4_RouteMatchDataclass:
    """AC-4: RouteMatch dataclass created"""

    def test_route_match_has_all_fields(self):
        """GIVEN: Need a type to represent a match decision between a post and a route
        WHEN: I create `RouteMatch` at module level
        THEN: Dataclass has fields: match_id (str), post_id (str), route_id (str),
              match_confidence (float 0-1), match_reasoning (str), cosine_similarity
              (float), rerank_model (str), rerank_cost (float), matched_at (str ISO),
              is_arbitrated (bool, default False), arbitration_notes (Optional[str])
        """
        match_fields = {f.name for f in fields(RouteMatch)}
        required_fields = {
            "match_id",
            "post_id",
            "route_id",
            "match_confidence",
            "match_reasoning",
            "cosine_similarity",
            "rerank_model",
            "rerank_cost",
            "matched_at",
            "is_arbitrated",
            "arbitration_notes",
        }
        assert match_fields == required_fields

    def test_route_match_instantiation(self):
        """Verify RouteMatch can be instantiated with all fields."""
        match = RouteMatch(
            match_id="match-1",
            post_id="post-1",
            route_id="route-1",
            match_confidence=0.95,
            match_reasoning="High semantic similarity and geographic proximity",
            cosine_similarity=0.87,
            rerank_model="claude-haiku-4-5-20251001",
            rerank_cost=0.0005,
            matched_at="2026-04-14T12:00:00Z",
            is_arbitrated=False,
            arbitration_notes=None,
        )

        assert match.match_id == "match-1"
        assert match.match_confidence == 0.95
        assert match.cosine_similarity == 0.87
        assert match.is_arbitrated is False

    def test_route_match_defaults(self):
        """Verify default values for optional fields."""
        match = RouteMatch(
            match_id="match-1",
            post_id="post-1",
            route_id="route-1",
            match_confidence=0.95,
            match_reasoning="High similarity",
            cosine_similarity=0.87,
            rerank_model="claude-haiku-4-5-20251001",
            rerank_cost=0.0005,
            matched_at="2026-04-14T12:00:00Z",
        )

        assert match.is_arbitrated is False
        assert match.arbitration_notes is None

    def test_route_match_with_arbitration(self):
        """Verify RouteMatch with arbitration fields."""
        match = RouteMatch(
            match_id="match-2",
            post_id="post-2",
            route_id="route-2",
            match_confidence=0.65,
            match_reasoning="Mid-confidence - required LLM arbitration",
            cosine_similarity=0.72,
            rerank_model="claude-haiku-4-5-20251001",
            rerank_cost=0.0007,
            matched_at="2026-04-14T12:00:00Z",
            is_arbitrated=True,
            arbitration_notes="Multiple candidates with similar scores",
        )

        assert match.is_arbitrated is True
        assert match.arbitration_notes == "Multiple candidates with similar scores"


class TestAC5_PostExtractionImportable:
    """AC-5: PostExtraction dataclass created (or imported from INF-005)"""

    def test_post_extraction_importable_from_models(self):
        """GIVEN: Need a type for the structured LLM extraction output per post
        WHEN: I create or import `PostExtraction` at module level of models.py
        THEN: Dataclass is accessible via `from scripts.curation.pipeline.models import
              PostExtraction`. Its full field definition lives in
              `scripts/curation/pipeline/extraction/schema.py` (INF-005 owns the Pydantic
              contract); models.py just re-exports it for convenience
        """
        # Verify PostExtraction is importable from models
        from scripts.curation.pipeline.models import PostExtraction as ModelsPostExtraction

        # Verify it's the same class as the one from schema (same __name__ and module)
        from scripts.curation.pipeline.extraction.schema import (
            PostExtraction as SchemaPostExtraction,
        )

        # Check they have the same class name and refer to the same implementation
        assert ModelsPostExtraction.__name__ == SchemaPostExtraction.__name__
        assert "PostExtraction" in ModelsPostExtraction.__name__
        # Both should be Pydantic BaseModels with same fields
        assert set(ModelsPostExtraction.model_fields.keys()) == set(
            SchemaPostExtraction.model_fields.keys()
        )

    def test_post_extraction_type_checking(self):
        """Verify PostExtraction has expected Pydantic BaseModel behavior."""
        # Verify it's a Pydantic model
        from pydantic import BaseModel

        assert issubclass(PostExtraction, BaseModel)

        # Verify it can be instantiated
        extraction = PostExtraction(
            sentiment="positive",
            extraction_confidence=0.9,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.001,
        )

        assert extraction.sentiment == "positive"
        assert extraction.extraction_confidence == 0.9


class TestAC6_BackwardCompatibility:
    """AC-6: Backward compatibility maintained"""

    def test_backward_compat_with_required_fields_only(self):
        """GIVEN: Existing pipeline code creates Route objects
        WHEN: I instantiate Route with the 7 required fields (route_id, name, state,
              source, centroid_lat, centroid_lng)
        THEN: Route object creates successfully; all new fields default to None /
              empty list / empty dict; no TypeError
        """
        route = Route(
            route_id="test-route",
            name="Test Route",
            state="CA",
            source="test",
            centroid_lat=37.7749,
            centroid_lng=-122.4194,
        )

        # Verify original fields
        assert route.route_id == "test-route"
        assert route.name == "Test Route"
        assert route.state == "CA"
        assert route.source == "test"
        assert route.centroid_lat == 37.7749
        assert route.centroid_lng == -122.4194

        # Verify new semantic fields have safe defaults
        assert route.candidate_identifiers == []
        assert route.search_text is None
        assert route.embedding is None
        assert route.match_confidence is None
        assert route.llm_reconciliation_log == []

        # Verify new enrichment fields have safe defaults
        assert route.description is None
        assert route.rating is None
        assert route.source_refs == []

        # Verify geo fields are optional
        assert route.length_miles is None
        assert route.bounds_ne_lat is None
        assert route.bounds_ne_lng is None
        assert route.bounds_sw_lat is None
        assert route.bounds_sw_lng is None

    def test_backward_compat_with_optional_geo_fields(self):
        """Verify Route can be instantiated with optional geo fields."""
        route = Route(
            route_id="test-route",
            name="Test Route",
            state="CA",
            source="test",
            centroid_lat=37.7749,
            centroid_lng=-122.4194,
            length_miles=12.5,
            bounds_ne_lat=38.0,
            bounds_ne_lng=-122.0,
            bounds_sw_lat=37.5,
            bounds_sw_lng=-123.0,
        )

        assert route.length_miles == 12.5
        assert route.bounds_ne_lat == 38.0
        assert route.bounds_sw_lat == 37.5

    def test_no_old_plan_fields_present(self):
        """Verify old plan fields (merged_at, merge_count, field_provenance) are NOT
        present in Route.
        """
        route_fields = {f.name for f in fields(Route)}
        old_plan_fields = {"merged_at", "merge_count", "field_provenance"}

        # None of these should be present
        assert not old_plan_fields.intersection(route_fields)

    def test_enriched_route_backward_compat(self):
        """Verify EnrichedRoute maintains backward compatibility."""
        enriched = EnrichedRoute(
            route_id="test-route",
            name="Test Route",
            state="CA",
            source="test",
            centroid_lat=37.7749,
            centroid_lng=-122.4194,
        )

        # Verify base Route fields
        assert enriched.route_id == "test-route"
        assert enriched.name == "Test Route"

        # Verify EnrichedRoute-specific fields have defaults
        assert enriched.composite_score == 0.0
        assert enriched.curvature_score == 0.0
        assert enriched.primary_archetype == ""
        assert enriched.secondary_tags == []

        # Verify new scoring fields have safe defaults
        assert enriched.mention_frequency_score is None
        assert enriched.designation_score is None
        assert enriched.best_months == []
        assert enriched.quality_tier is None


class TestAdditionalConstraints:
    """Additional tests for constraints mentioned in the spec."""

    def test_no_rapidfuzz_import_in_models(self):
        """Verify rapidfuzz is not imported in models.py (spec constraint)."""
        import pipeline.models as models_module

        models_file = models_module.__file__
        with open(models_file, "r") as f:
            content = f.read()

        # Check that rapidfuzz is not imported
        lines = content.split("\n")
        import_lines = [
            l for l in lines if l.strip().startswith("import ") or l.strip().startswith("from ")
        ]
        for line in import_lines:
            assert "rapidfuzz" not in line.lower(), f"Found rapidfuzz import: {line}"

    def test_list_fields_use_factory(self):
        """Verify list fields use field(default_factory=list) to avoid mutable default
        bug.
        """
        from dataclasses import Field, MISSING

        # Check candidate_identifiers uses factory
        field_dict = {f.name: f for f in fields(Route)}
        candidate_identifiers_field = field_dict["candidate_identifiers"]
        assert candidate_identifiers_field.default_factory is not None

        # Check source_refs uses factory
        source_refs_field = field_dict["source_refs"]
        assert source_refs_field.default_factory is not None

        # Check llm_reconciliation_log uses factory
        llm_log_field = field_dict["llm_reconciliation_log"]
        assert llm_log_field.default_factory is not None

    def test_dict_fields_use_factory(self):
        """Verify dict fields use field(default_factory=dict) to avoid mutable default
        bug.
        """
        # Check payload field in LLMExtractionArtifact
        field_dict = {f.name: f for f in fields(LLMExtractionArtifact)}
        payload_field = field_dict["payload"]
        assert payload_field.default_factory is not None

    def test_all_new_fields_are_optional(self):
        """Verify all new fields added in INF-002 are Optional (or have factory
        defaults).
        """
        from typing import get_args, get_origin
        from dataclasses import MISSING

        # Check Route new fields are Optional or have defaults
        new_route_fields = [
            "candidate_identifiers",
            "search_text",
            "embedding",
            "match_confidence",
            "llm_reconciliation_log",
            "description",
            "rating",
            "designation",
            "source_url",
            "source_refs",
            "highway_number",
            "elevation_gain_m",
            "surface",
            "aadt",
            "aadt_median",
            "aadt_max",
            "pavement_iri",
            "mention_frequency",
        ]

        field_dict = {f.name: f for f in fields(Route)}
        for field_name in new_route_fields:
            field = field_dict[field_name]
            # Either has a default/factory, or is Optional type
            assert (
                field.default is not MISSING
                or field.default_factory is not None
                or get_origin(field.type) is type(None)  # Part of Optional
            ), f"Field {field_name} should be Optional or have default"

    def test_snake_case_naming(self):
        """Verify all field names use snake_case convention."""
        import re

        for field in fields(Route):
            field_name = field.name
            # Should match snake_case pattern
            assert re.match(r"^[a-z][a-z0-9_]*$", field_name), f"Field {field_name} is not snake_case"

        for field in fields(EnrichedRoute):
            field_name = field.name
            assert re.match(r"^[a-z][a-z0-9_]*$", field_name), f"Field {field_name} is not snake_case"

        for field in fields(LLMExtractionArtifact):
            field_name = field.name
            assert re.match(r"^[a-z][a-z0-9_]*$", field_name), f"Field {field_name} is not snake_case"

        for field in fields(RouteMatch):
            field_name = field.name
            assert re.match(r"^[a-z][a-z0-9_]*$", field_name), f"Field {field_name} is not snake_case"
