"""
Unit tests for INF-005: PostExtraction v2 schema.

Tests AC-1 through AC-8 as defined in the task specification.
"""

import pytest
from datetime import datetime, timezone
from pydantic import ValidationError

from pipeline.extraction.schema import (
    PostExtraction,
    RouteAttributes,
    EXTRACTION_SCHEMA_VERSION,
    CACHE_POLICY,
    DEFAULT_EXTRACTION_MODEL,
    is_v1_extraction,
    Season,
    RoadSurface,
)


class TestAC1_SchemaVersionBumped:
    """AC-1: Schema version bumped to 2"""

    def test_schema_version_is_2(self):
        """GIVEN: EXTRACTION_SCHEMA_VERSION = 2 in schema.py
        WHEN: I increment the version constant to 3
        THEN: EXTRACTION_SCHEMA_VERSION == 3 and module docstring documents v3 changes
        """
        assert EXTRACTION_SCHEMA_VERSION == 3

    def test_module_docstring_documents_v2(self):
        """Verify the module docstring mentions v2 changes."""
        from pipeline.extraction import schema

        docstring = schema.__doc__
        assert docstring is not None
        assert "Version 2" in docstring
        assert "INF-005" in docstring
        assert "PostExtraction" in docstring


class TestAC2_PostExtractionFieldsDefined:
    """AC-2: PostExtraction BaseModel defined with all required fields"""

    def test_post_extraction_has_all_required_fields(self):
        """GIVEN: Need a structured LLM output contract
        WHEN: I define PostExtraction as a Pydantic v2 BaseModel
        THEN: It has road_name_mentions, highway_refs, state_refs, landmark_refs,
              sentiment, aspect_scores, attributes, warnings, waypoint_mentions,
              waypoint_category_hints, extraction_confidence, extraction_model,
              extraction_cost, extracted_at, extraction_schema_version fields
        """
        required_fields = {
            "road_name_mentions",
            "highway_refs",
            "state_refs",
            "landmark_refs",
            "sentiment",
            "aspect_scores",
            "attributes",
            "warnings",
            "waypoint_mentions",
            "waypoint_category_hints",
            "extraction_confidence",
            "extraction_model",
            "extraction_cost",
            "extracted_at",
            "extraction_schema_version",
        }

        actual_fields = set(PostExtraction.model_fields.keys())
        assert required_fields == actual_fields

    def test_post_extraction_is_pydantic_basemodel(self):
        """Verify PostExtraction is a Pydantic v2 BaseModel."""
        from pydantic import BaseModel

        assert issubclass(PostExtraction, BaseModel)

    def test_post_extraction_field_defaults(self):
        """Verify default values for optional fields."""
        # Create with minimal required fields
        extraction = PostExtraction(
            sentiment="positive",
            extraction_confidence=0.9,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.001,
        )

        assert extraction.road_name_mentions == []
        assert extraction.highway_refs == []
        assert extraction.state_refs == []
        assert extraction.landmark_refs == []
        assert extraction.aspect_scores == {}
        assert extraction.attributes == {}
        assert extraction.warnings == []
        assert extraction.extraction_schema_version == EXTRACTION_SCHEMA_VERSION
        assert isinstance(extraction.extracted_at, datetime)


class TestAC3_SentimentLiteralValidation:
    """AC-3: sentiment field uses Literal type (strict enum enforcement)"""

    def test_sentiment_accepts_valid_values(self):
        """GIVEN: sentiment must be one of positive/neutral/negative
        WHEN: I validate a PostExtraction with valid sentiment values
        THEN: Pydantic accepts all three allowed values
        """
        for sentiment_value in ["positive", "neutral", "negative"]:
            extraction = PostExtraction(
                sentiment=sentiment_value,
                extraction_confidence=0.5,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
            )
            assert extraction.sentiment == sentiment_value

    def test_sentiment_rejects_invalid_values(self):
        """GIVEN: sentiment must be one of positive/neutral/negative
        WHEN: I validate a PostExtraction with sentiment="great"
        THEN: Pydantic raises ValidationError; only the three allowed values are accepted
        """
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="great",
                extraction_confidence=0.5,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
            )

        errors = exc_info.value.errors()
        assert len(errors) == 1
        assert errors[0]["loc"] == ("sentiment",)
        assert errors[0]["type"] == "literal_error"

    def test_sentiment_is_required(self):
        """Verify sentiment is a required field."""
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                extraction_confidence=0.5,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
            )

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("sentiment",) for e in errors)


class TestAC4_PostExtractionJSONRoundtrip:
    """AC-4: PostExtraction round-trips through JSON cleanly"""

    def test_post_extraction_json_roundtrip(self):
        """GIVEN: A PostExtraction instance with all fields populated
        WHEN: I call model_dump_json() then model_validate_json()
        THEN: The resulting instance is equal to the original (by field values)
        """
        original = PostExtraction(
            road_name_mentions=["Tail of the Dragon", "The Dragon"],
            highway_refs=["US-129", "I-40"],
            state_refs=["TN", "North Carolina"],
            landmark_refs=["Chattanooga", "Great Smoky Mountains"],
            sentiment="positive",
            aspect_scores={"curvature": 0.95, "scenery": 0.8},
            attributes={"has_gas": True, "beginner_friendly": False},
            warnings=["Construction on weekends", "Watch for deer"],
            extraction_confidence=0.92,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.00125,
            extracted_at=datetime(2026, 4, 14, 12, 0, 0, tzinfo=timezone.utc),
            extraction_schema_version=2,
        )

        json_str = original.model_dump_json()
        restored = PostExtraction.model_validate_json(json_str)

        assert restored.road_name_mentions == original.road_name_mentions
        assert restored.highway_refs == original.highway_refs
        assert restored.state_refs == original.state_refs
        assert restored.landmark_refs == original.landmark_refs
        assert restored.sentiment == original.sentiment
        assert restored.aspect_scores == original.aspect_scores
        assert restored.attributes == original.attributes
        assert restored.warnings == original.warnings
        assert restored.extraction_confidence == original.extraction_confidence
        assert restored.extraction_model == original.extraction_model
        assert restored.extraction_cost == original.extraction_cost
        assert restored.extracted_at == original.extracted_at
        assert restored.extraction_schema_version == original.extraction_schema_version

    def test_post_extraction_roundtrip_with_defaults(self):
        """Test round-trip with minimal fields (using defaults)."""
        original = PostExtraction(
            sentiment="neutral",
            extraction_confidence=0.75,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.0008,
        )

        json_str = original.model_dump_json()
        restored = PostExtraction.model_validate_json(json_str)

        assert restored.sentiment == original.sentiment
        assert restored.road_name_mentions == []
        assert restored.aspect_scores == {}


class TestAC5_V1RouteAttributesPreserved:
    """AC-5: RouteAttributes (v1) is preserved for backward compatibility"""

    def test_v1_route_attributes_still_importable(self):
        """GIVEN: Existing v1 data with `curvature_score`, `scenic_score`, etc.
        WHEN: I parse it with RouteAttributes.model_validate_json()
        THEN: Parsing succeeds; RouteAttributes is still importable from schema.py
        """
        # Verify RouteAttributes is importable
        from pipeline.extraction.schema import RouteAttributes

        # Sample v1 JSON
        v1_json = """{
            "reasoning": "Test reasoning",
            "scenic_score": 0.8,
            "technical_score": 0.9,
            "traffic_score": 0.6,
            "remoteness_score": 0.4,
            "condition_score": 0.7,
            "elevation_score": 0.5,
            "designation_score": 0.0,
            "community_score": 0.8,
            "season": "apr_nov",
            "road_surface": "paved",
            "primary_archetype_hint": "twisties"
        }"""

        attrs = RouteAttributes.model_validate_json(v1_json)

        assert attrs.scenic_score == 0.8
        assert attrs.technical_score == 0.9
        assert attrs.season == Season.APR_NOV
        assert attrs.road_surface == RoadSurface.PAVED

    def test_v1_enums_preserved(self):
        """Verify Season and RoadSurface enums are unchanged."""
        assert Season.YEAR_ROUND.value == "year_round"
        assert Season.APR_NOV.value == "apr_nov"
        assert Season.MAY_SEP.value == "may_sep"
        assert Season.SPRING_FALL.value == "spring_fall"

        assert RoadSurface.PAVED.value == "paved"
        assert RoadSurface.GRAVEL.value == "gravel"
        assert RoadSurface.DIRT.value == "dirt"
        assert RoadSurface.MIXED.value == "mixed"

    def test_is_v1_extraction_helper(self):
        """Test the is_v1_extraction helper function."""
        v1_payload = {
            "curvature_score": 0.8,
            "scenic_score": 0.7,
            "reasoning": "Test",
        }
        v2_payload = {
            "road_name_mentions": ["Tail of the Dragon"],
            "sentiment": "positive",
            "extraction_confidence": 0.9,
            "extraction_model": "claude-haiku-4-5-20251001",
            "extraction_cost": 0.001,
        }

        assert is_v1_extraction(v1_payload) is True
        assert is_v1_extraction(v2_payload) is False


class TestAC6_CachePolicyConstant:
    """AC-6: CACHE_POLICY constant is defined"""

    def test_cache_policy_constant_defined(self):
        """GIVEN: Need a documented caching contract for extraction artifacts
        WHEN: I add CACHE_POLICY as a module-level constant
        THEN: `scripts.curation.pipeline.extraction.schema.CACHE_POLICY` is a dict
              with key_format, ttl_seconds, invalidate_on_version_bump
        """
        assert isinstance(CACHE_POLICY, dict)
        assert "key_format" in CACHE_POLICY
        assert "ttl_seconds" in CACHE_POLICY
        assert "invalidate_on_version_bump" in CACHE_POLICY

    def test_cache_policy_values(self):
        """Verify CACHE_POLICY has correct values."""
        assert CACHE_POLICY["key_format"] == "{post_id}|{extraction_schema_version}"
        assert CACHE_POLICY["ttl_seconds"] == 30 * 24 * 60 * 60  # 30 days
        assert CACHE_POLICY["invalidate_on_version_bump"] is True

    def test_default_extraction_model_defined(self):
        """Verify DEFAULT_EXTRACTION_MODEL constant is defined."""
        assert DEFAULT_EXTRACTION_MODEL == "claude-haiku-4-5-20251001"


class TestAC7_ExtractionConfidenceBounds:
    """AC-7: extraction_confidence is constrained to [0.0, 1.0]"""

    def test_extraction_confidence_accepts_valid_range(self):
        """GIVEN: extraction_confidence must be a probability
        WHEN: I construct PostExtraction with valid confidence values
        THEN: Pydantic accepts values in [0.0, 1.0]
        """
        for confidence in [0.0, 0.5, 1.0]:
            extraction = PostExtraction(
                sentiment="positive",
                extraction_confidence=confidence,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
            )
            assert extraction.extraction_confidence == confidence

    def test_extraction_confidence_rejects_above_1(self):
        """GIVEN: extraction_confidence must be a probability
        WHEN: I try to construct PostExtraction with extraction_confidence=1.5
        THEN: Pydantic raises ValidationError (ge/le constraint violation)
        """
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="positive",
                extraction_confidence=1.5,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
            )

        errors = exc_info.value.errors()
        assert any(
            e["loc"] == ("extraction_confidence",) for e in errors
        ), f"Expected error on extraction_confidence, got: {errors}"

    def test_extraction_confidence_rejects_below_0(self):
        """Verify extraction_confidence rejects negative values."""
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="positive",
                extraction_confidence=-0.1,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
            )

        errors = exc_info.value.errors()
        assert any(
            e["loc"] == ("extraction_confidence",) for e in errors
        ), f"Expected error on extraction_confidence, got: {errors}"

    def test_extraction_confidence_is_required(self):
        """Verify extraction_confidence is required."""
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="positive",
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
            )

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("extraction_confidence",) for e in errors)


class TestAC8_PostExtractionReexport:
    """AC-8: PostExtraction is re-exportable from models.py"""

    def test_post_extraction_reexport_from_models(self):
        """GIVEN: INF-002 defines `from pipeline.extraction.schema import PostExtraction`
        WHEN: I import it from models.py
        THEN: `from pipeline.models import PostExtraction` succeeds
        """
        from pipeline.models import PostExtraction as ReexportedPostExtraction
        from pipeline.extraction.schema import PostExtraction as OriginalPostExtraction

        # Verify it's the same class
        assert ReexportedPostExtraction is OriginalPostExtraction

        # Verify it works
        extraction = ReexportedPostExtraction(
            sentiment="positive",
            extraction_confidence=0.9,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.001,
        )
        assert extraction.sentiment == "positive"


class TestAdditionalConstraints:
    """Additional tests for constraints mentioned in the spec."""

    def test_extraction_cost_non_negative(self):
        """Verify extraction_cost has ge=0.0 constraint."""
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="positive",
                extraction_confidence=0.9,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=-0.001,
            )

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("extraction_cost",) for e in errors)

    def test_extraction_cost_is_required(self):
        """Verify extraction_cost is required."""
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="positive",
                extraction_confidence=0.9,
                extraction_model="claude-haiku-4-5-20251001",
            )

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("extraction_cost",) for e in errors)

    def test_extraction_model_is_required(self):
        """Verify extraction_model is required."""
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="positive",
                extraction_confidence=0.9,
                extraction_cost=0.001,
            )

        errors = exc_info.value.errors()
        assert any(e["loc"] == ("extraction_model",) for e in errors)

    def test_model_config_extra_forbid(self):
        """Verify model_config has extra='forbid' to reject unknown fields."""
        with pytest.raises(ValidationError) as exc_info:
            PostExtraction(
                sentiment="positive",
                extraction_confidence=0.9,
                extraction_model="claude-haiku-4-5-20251001",
                extraction_cost=0.001,
                unknown_field="should_fail",  # This should cause validation error
            )

        errors = exc_info.value.errors()
        # Pydantic v2 with extra='forbid' raises an error
        assert len(errors) >= 1

    def test_no_rapidfuzz_import(self):
        """Verify rapidfuzz is not imported in schema.py (spec constraint)."""
        import pipeline.extraction.schema as schema_module

        import sys

        schema_file = schema_module.__file__
        with open(schema_file, "r") as f:
            content = f.read()

        # Check that rapidfuzz is not actually imported (only mentioned in docstrings)
        # Look for import statements, not docstring mentions
        lines = content.split("\n")
        import_lines = [l for l in lines if l.strip().startswith("import ") or l.strip().startswith("from ")]
        for line in import_lines:
            assert "rapidfuzz" not in line.lower(), f"Found rapidfuzz import: {line}"

    def test_pydantic_v2_patterns(self):
        """Verify Pydantic v2 patterns are used (not v1)."""
        # Check that model_config is used (v2 pattern)
        assert hasattr(PostExtraction, "model_config")
        assert PostExtraction.model_config.get("extra") == "forbid"

        # Check that Field() is used with description (v2 pattern)
        field = PostExtraction.model_fields["sentiment"]
        assert field.description is not None

    def test_sentiment_literal_type(self):
        """Verify sentiment uses Literal type (not str or Enum)."""
        from typing import get_args

        field = PostExtraction.model_fields["sentiment"]
        # The annotation should be a Literal
        assert hasattr(field.annotation, "__origin__")
        assert field.annotation.__origin__.__name__ == "Literal"

    def test_aspect_scores_optional(self):
        """Verify aspect_scores is optional (default dict)."""
        extraction = PostExtraction(
            sentiment="positive",
            extraction_confidence=0.9,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.001,
        )
        assert extraction.aspect_scores == {}

    def test_attributes_optional(self):
        """Verify attributes is optional (default dict)."""
        extraction = PostExtraction(
            sentiment="positive",
            extraction_confidence=0.9,
            extraction_model="claude-haiku-4-5-20251001",
            extraction_cost=0.001,
        )
        assert extraction.attributes == {}
