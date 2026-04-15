"""Tests for normalize.py — normalize fixtures from all 3 sources."""

from __future__ import annotations

import pytest

from scripts.curation.pipeline.state_manager.normalize import normalize_staging_row


# ---------------------------------------------------------------------------
# Fixture data matching the actual staging file shapes
# ---------------------------------------------------------------------------

SAMPLE_MOTORCYCLEROADS = {
    "route_name": "AL 27 to SR 27 to AL 95",
    "state_primary": "alabama",
    "states_all": ["Alabama"],
    "rating": 4.55,
    "distance_mi": 69,
    "description": "Heading North out of Enterprise take AL 27 up to Ozark...",
    "source_url": "https://www.motorcycleroads.com/motorcycle-roads/alabama/al-27-to-sr-27-to-al-95",
    "canonical_url": "https://www.motorcycleroads.com/motorcycle-roads/alabama/al-27-to-sr-27-to-al-95",
    "page_type": "PT-03-route-detail",
    "scraped_at": 1776153837,
}

SAMPLE_BESTBIKINGROADS = {
    "route_name": "117 / 48 : Hammondville (AL) - Summerville (GA)",
    "state_primary": "alabama",
    "states_all": ["Alabama"],
    "rating": 3.0,
    "description": None,
    "distance_km": 34,
    "source_url": "https://www.bestbikingroads.com/motorcycle-roads/united-states/alabama/ride/117-48-hammondville-al-summerville-ga",
    "source": "bestbikingroads",
    "canonical_url": "https://www.bestbikingroads.com/motorcycle-roads/united-states/alabama/ride/117-48-hammondville-al-summerville-ga",
    "page_type": "PT-03-route-detail",
    "scraped_at": 1776165313,
}

SAMPLE_FHWA = {
    "route_id": "fhwa-a1a-ocean-shore-scenic-highway-florida",
    "name": "A1A Ocean Shore Scenic Highway",
    "state": "Florida",
    "source": "fhwa",
    "centroid_lat": 29.472546,
    "centroid_lng": -81.123682,
    "length_miles": 6.8,
    "bounds_ne_lat": None,
    "bounds_ne_lng": None,
    "bounds_sw_lat": None,
    "bounds_sw_lng": None,
}

REQUIRED_KEYS = {
    "route_id", "name", "state", "source",
    "description", "length_miles",
    "centroid_lat", "centroid_lng",
    "canonical_url", "source_url", "rating",
}


class TestNormalizeMotorcycleRoads:
    def test_output_has_required_keys(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert REQUIRED_KEYS.issubset(result.keys()), f"Missing keys: {REQUIRED_KEYS - result.keys()}"

    def test_source_set_correctly(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert result["source"] == "motorcycleroads"

    def test_name_mapped(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert result["name"] == "AL 27 to SR 27 to AL 95"

    def test_state_title_case(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert result["state"] == "Alabama"

    def test_distance_mi_becomes_length_miles(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert result["length_miles"] == 69.0

    def test_route_id_derived_from_url(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert result["route_id"].startswith("motorcycleroads:")
        assert "al-27-to-sr-27-to-al-95" in result["route_id"]

    def test_centroid_is_none(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert result["centroid_lat"] is None
        assert result["centroid_lng"] is None

    def test_rating_preserved(self):
        result = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert result["rating"] == 4.55

    def test_idempotent_same_input_same_output(self):
        r1 = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        r2 = normalize_staging_row(SAMPLE_MOTORCYCLEROADS, "motorcycleroads")
        assert r1["route_id"] == r2["route_id"]


class TestNormalizeBestBikingRoads:
    def test_output_has_required_keys(self):
        result = normalize_staging_row(SAMPLE_BESTBIKINGROADS, "bestbikingroads")
        assert REQUIRED_KEYS.issubset(result.keys())

    def test_source_set_correctly(self):
        result = normalize_staging_row(SAMPLE_BESTBIKINGROADS, "bestbikingroads")
        assert result["source"] == "bestbikingroads"

    def test_km_converted_to_miles(self):
        result = normalize_staging_row(SAMPLE_BESTBIKINGROADS, "bestbikingroads")
        # 34 km * 0.621371 = ~21.13 miles
        assert result["length_miles"] is not None
        assert abs(result["length_miles"] - 21.13) < 0.1

    def test_null_description_allowed(self):
        result = normalize_staging_row(SAMPLE_BESTBIKINGROADS, "bestbikingroads")
        assert result["description"] is None

    def test_route_id_from_url(self):
        result = normalize_staging_row(SAMPLE_BESTBIKINGROADS, "bestbikingroads")
        assert result["route_id"].startswith("bestbikingroads:")

    def test_no_distance_mi_field(self):
        """bestbikingroads has distance_km not distance_mi — should still convert."""
        row = {**SAMPLE_BESTBIKINGROADS}
        del row["distance_km"]
        row["distance_km"] = 50
        result = normalize_staging_row(row, "bestbikingroads")
        assert result["length_miles"] is not None
        assert abs(result["length_miles"] - 31.07) < 0.1


class TestNormalizeFhwa:
    def test_output_has_required_keys(self):
        result = normalize_staging_row(SAMPLE_FHWA, "fhwa")
        assert REQUIRED_KEYS.issubset(result.keys())

    def test_route_id_preserved(self):
        result = normalize_staging_row(SAMPLE_FHWA, "fhwa")
        assert result["route_id"] == "fhwa-a1a-ocean-shore-scenic-highway-florida"

    def test_coords_preserved(self):
        result = normalize_staging_row(SAMPLE_FHWA, "fhwa")
        assert result["centroid_lat"] == 29.472546
        assert result["centroid_lng"] == -81.123682

    def test_state_preserved(self):
        result = normalize_staging_row(SAMPLE_FHWA, "fhwa")
        assert result["state"] == "Florida"

    def test_length_miles_preserved(self):
        result = normalize_staging_row(SAMPLE_FHWA, "fhwa")
        assert result["length_miles"] == 6.8

    def test_missing_route_id_raises(self):
        bad_row = {**SAMPLE_FHWA}
        del bad_row["route_id"]
        with pytest.raises(ValueError, match="missing route_id"):
            normalize_staging_row(bad_row, "fhwa")


class TestNormalizeEdgeCases:
    def test_unknown_source_raises(self):
        with pytest.raises(ValueError, match="Unknown source"):
            normalize_staging_row({}, "unknown_source")

    def test_state_various_casings(self):
        for state_val in ["TENNESSEE", "tennessee", "Tennessee"]:
            row = {**SAMPLE_MOTORCYCLEROADS, "state_primary": state_val}
            result = normalize_staging_row(row, "motorcycleroads")
            assert result["state"] == "Tennessee"

    def test_missing_distance_gives_none(self):
        row = {**SAMPLE_MOTORCYCLEROADS}
        del row["distance_mi"]
        result = normalize_staging_row(row, "motorcycleroads")
        assert result["length_miles"] is None

    def test_fallback_route_id_when_no_url(self):
        row = {**SAMPLE_MOTORCYCLEROADS, "canonical_url": None, "source_url": None}
        result = normalize_staging_row(row, "motorcycleroads")
        assert result["route_id"].startswith("motorcycleroads:")
        assert len(result["route_id"]) > len("motorcycleroads:")

    def test_two_different_urls_produce_different_ids(self):
        row1 = {**SAMPLE_MOTORCYCLEROADS, "canonical_url": "https://example.com/route-a"}
        row2 = {**SAMPLE_MOTORCYCLEROADS, "canonical_url": "https://example.com/route-b"}
        r1 = normalize_staging_row(row1, "motorcycleroads")
        r2 = normalize_staging_row(row2, "motorcycleroads")
        assert r1["route_id"] != r2["route_id"]
