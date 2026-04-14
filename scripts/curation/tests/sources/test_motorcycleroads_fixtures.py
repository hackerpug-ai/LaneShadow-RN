"""Phase 4 contract tests for MotorcycleRoads fixture parsing.

Tests that the framework parser correctly extracts fields from real HTML
fixtures downloaded in Phase 2, using selectors defined in Phase 3.

Key contracts:
- route_name is non-empty for all PT-03 fixtures (required field)
- state_primary is the URL slug (URL-derived required field)
- states_all is a list of proper state names containing all expected states
- Natchez Trace Parkway fixture asserts multi-state: AL + MS + TN all present
- rating is a float when present on the fixture page
- distance_mi is an int when present

Crawl Plan Protocol: Phase 4 — DRY-RUN PARSE
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pytest
import yaml

# Dual PYTHONPATH: use absolute imports
from scripts.curation.pipeline.sources.crawl_plan import (
    SchemaViolation,
    load_selectors,
    parse_with_selectors,
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# test file: scripts/curation/tests/sources/test_motorcycleroads_fixtures.py
# parent*5 reaches repo root: LaneShadow/
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
FIXTURES_BASE = _REPO_ROOT / "fixtures" / "motorcycleroads"
SELECTORS_PATH = (
    _REPO_ROOT
    / ".spec"
    / "prds"
    / "curation-hardening"
    / "crawl-plans"
    / "motorcycleroads"
    / "selectors.yaml"
)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _load_fixture_html(pt: str, filename: str) -> str:
    """Load fixture HTML for a given page type and filename."""
    path = FIXTURES_BASE / pt / filename
    return path.read_text(encoding="utf-8")


def _load_manifest() -> dict[str, list[dict]]:
    """Load fixtures.manifest.yaml."""
    manifest_path = FIXTURES_BASE / "fixtures.manifest.yaml"
    with open(manifest_path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def _url_from_manifest(pt: str, filename: str) -> str:
    """Look up the source URL for a fixture file from the manifest."""
    manifest = _load_manifest()
    for item in manifest.get(pt, []):
        if item["file"] == filename:
            return item["url"]
    raise KeyError(f"Fixture not found in manifest: {pt}/{filename}")


def _state_primary_from_url(url: str) -> str:
    """Extract state_primary slug from a route detail URL."""
    m = re.search(r"/motorcycle-roads/([a-z-]+)/", url)
    if m:
        return m.group(1)
    return ""


# ---------------------------------------------------------------------------
# Fixtures (pytest)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def selector_map():
    """Load the MR selectors.yaml once for all tests in this module."""
    return load_selectors(str(SELECTORS_PATH))


@pytest.fixture(scope="module")
def manifest():
    """Load the fixtures manifest once for all tests."""
    return _load_manifest()


# ---------------------------------------------------------------------------
# PT-03 route detail parametrized tests
# ---------------------------------------------------------------------------

PT03_FIXTURES = [
    "natchez_trace.html",
    "tail_of_the_dragon.html",
    "pacific_coast.html",
    "blue_ridge_parkway.html",
    "beartooth_pass.html",
]


@pytest.fixture(
    params=PT03_FIXTURES,
    ids=[f.replace(".html", "") for f in PT03_FIXTURES],
)
def pt03_record(request, selector_map, manifest):
    """Parse each PT-03 fixture and return (record, expected) tuple."""
    filename = request.param
    url = _url_from_manifest("PT-03", filename)
    state_primary = _state_primary_from_url(url)
    html = _load_fixture_html("PT-03", filename)

    record = parse_with_selectors(
        html=html,
        selector_map=selector_map,
        page_type="PT-03-route-detail",
        url=url,
        url_derived_fields={"state_primary": state_primary},
    )

    # Find expected values from manifest
    expected = {}
    for item in manifest.get("PT-03", []):
        if item["file"] == filename:
            expected = item.get("expected", {})
            break

    return record, expected, filename


class TestPT03RequiredFields:
    """Required fields must be non-null for every PT-03 fixture."""

    def test_route_name_nonempty(self, pt03_record: tuple) -> None:
        """route_name must be a non-empty string for all route detail pages."""
        record, expected, filename = pt03_record
        assert record.get("route_name"), (
            f"route_name is empty/null for fixture {filename}"
        )
        assert isinstance(record["route_name"], str)

    def test_route_name_matches_expected(self, pt03_record: tuple) -> None:
        """route_name should match the expected value in the manifest."""
        record, expected, filename = pt03_record
        if "route_name" not in expected:
            pytest.skip("No expected route_name in manifest")
        assert record["route_name"] == expected["route_name"], (
            f"route_name mismatch for {filename}: "
            f"got {record['route_name']!r}, expected {expected['route_name']!r}"
        )

    def test_state_primary_nonempty(self, pt03_record: tuple) -> None:
        """state_primary must be the URL slug (non-empty string)."""
        record, expected, filename = pt03_record
        assert record.get("state_primary"), (
            f"state_primary is empty/null for fixture {filename}"
        )
        assert isinstance(record["state_primary"], str)

    def test_state_primary_is_url_derived(self, pt03_record: tuple) -> None:
        """state_primary must equal the URL path slug."""
        record, expected, filename = pt03_record
        if "state_primary" not in expected:
            pytest.skip("No expected state_primary in manifest")
        assert record["state_primary"] == expected["state_primary"], (
            f"state_primary mismatch for {filename}: "
            f"got {record['state_primary']!r}, expected {expected['state_primary']!r}"
        )


class TestPT03StatesAll:
    """states_all must be a list and contain all expected states."""

    def test_states_all_is_list(self, pt03_record: tuple) -> None:
        """states_all must be a list (not a string or None)."""
        record, expected, filename = pt03_record
        assert isinstance(record.get("states_all"), list), (
            f"states_all is not a list for fixture {filename}: "
            f"got {type(record.get('states_all'))}"
        )

    def test_states_all_nonempty(self, pt03_record: tuple) -> None:
        """states_all must contain at least one state."""
        record, expected, filename = pt03_record
        assert record["states_all"], (
            f"states_all is empty for fixture {filename}"
        )

    def test_expected_states_all_present(self, pt03_record: tuple) -> None:
        """All expected states must be in states_all (list membership check)."""
        record, expected, filename = pt03_record
        if "states_all" not in expected:
            pytest.skip("No expected states_all in manifest")
        for state in expected["states_all"]:
            assert state in record["states_all"], (
                f"Expected state '{state}' not found in states_all={record['states_all']} "
                f"for fixture {filename}"
            )


class TestNatchezTraceMultiState:
    """Critical multi-state test for Natchez Trace Parkway.

    This fixture is the definitive test that states_all correctly captures
    the multi-state nature of the Natchez Trace (AL + MS + TN).
    """

    @pytest.fixture(scope="class")
    def natchez_record(self, selector_map: Any) -> dict:
        """Parse the Natchez Trace fixture."""
        url = "https://www.motorcycleroads.com/motorcycle-roads/alabama/natchez-trace-parkway"
        html = _load_fixture_html("PT-03", "natchez_trace.html")
        record = parse_with_selectors(
            html=html,
            selector_map=selector_map,
            page_type="PT-03-route-detail",
            url=url,
            url_derived_fields={"state_primary": "alabama"},
        )
        return record

    def test_state_primary_is_alabama(self, natchez_record: dict) -> None:
        """Natchez Trace state_primary must be 'alabama' (from URL)."""
        assert natchez_record["state_primary"] == "alabama"

    def test_alabama_in_states_all(self, natchez_record: dict) -> None:
        """Alabama must be in states_all for Natchez Trace."""
        assert "Alabama" in natchez_record["states_all"], (
            f"Alabama missing from states_all={natchez_record['states_all']}"
        )

    def test_mississippi_in_states_all(self, natchez_record: dict) -> None:
        """Mississippi must be in states_all for Natchez Trace."""
        assert "Mississippi" in natchez_record["states_all"], (
            f"Mississippi missing from states_all={natchez_record['states_all']}"
        )

    def test_tennessee_in_states_all(self, natchez_record: dict) -> None:
        """Tennessee must be in states_all for Natchez Trace."""
        assert "Tennessee" in natchez_record["states_all"], (
            f"Tennessee missing from states_all={natchez_record['states_all']}"
        )

    def test_route_name(self, natchez_record: dict) -> None:
        """Natchez Trace route_name must match expected value."""
        assert natchez_record["route_name"] == "Natchez Trace Parkway"

    def test_rating(self, natchez_record: dict) -> None:
        """Natchez Trace rating must be 4.23."""
        assert natchez_record.get("rating") == pytest.approx(4.23, abs=0.01)

    def test_distance_mi(self, natchez_record: dict) -> None:
        """Natchez Trace distance_mi must be 400."""
        assert natchez_record.get("distance_mi") == 400


class TestPT03OptionalFields:
    """Optional fields should be extracted correctly when present."""

    def test_rating_is_float_or_none(self, pt03_record: tuple) -> None:
        """rating must be a float (when present) or None."""
        record, expected, filename = pt03_record
        rating = record.get("rating")
        assert rating is None or isinstance(rating, float), (
            f"rating is not float or None for {filename}: {type(rating)}"
        )

    def test_rating_matches_expected(self, pt03_record: tuple) -> None:
        """rating should match the expected value in the manifest."""
        record, expected, filename = pt03_record
        if "rating" not in expected:
            pytest.skip("No expected rating in manifest")
        assert record.get("rating") == pytest.approx(expected["rating"], abs=0.01), (
            f"rating mismatch for {filename}: "
            f"got {record.get('rating')}, expected {expected['rating']}"
        )

    def test_distance_mi_is_int_or_none(self, pt03_record: tuple) -> None:
        """distance_mi must be an int (when present) or None."""
        record, expected, filename = pt03_record
        dist = record.get("distance_mi")
        assert dist is None or isinstance(dist, int), (
            f"distance_mi is not int or None for {filename}: {type(dist)}"
        )

    def test_description_is_str_or_none(self, pt03_record: tuple) -> None:
        """description must be a str (when present) or None."""
        record, expected, filename = pt03_record
        desc = record.get("description")
        assert desc is None or isinstance(desc, str), (
            f"description is not str or None for {filename}: {type(desc)}"
        )


# ---------------------------------------------------------------------------
# Known landmark routes (explicit assertions)
# ---------------------------------------------------------------------------

class TestLandmarkRoutes:
    """Spot-check specific landmark routes for correct state assignment."""

    @pytest.fixture(scope="class")
    def beartooth_record(self, selector_map: Any) -> dict:
        """Parse the Beartooth Pass fixture."""
        url = "https://www.motorcycleroads.com/motorcycle-roads/montana/beartooth-pass"
        html = _load_fixture_html("PT-03", "beartooth_pass.html")
        return parse_with_selectors(
            html=html, selector_map=selector_map, page_type="PT-03-route-detail",
            url=url, url_derived_fields={"state_primary": "montana"},
        )

    @pytest.fixture(scope="class")
    def blue_ridge_record(self, selector_map: Any) -> dict:
        """Parse the Blue Ridge Parkway fixture."""
        url = "https://www.motorcycleroads.com/motorcycle-roads/virginia/blue-ridge-parkway"
        html = _load_fixture_html("PT-03", "blue_ridge_parkway.html")
        return parse_with_selectors(
            html=html, selector_map=selector_map, page_type="PT-03-route-detail",
            url=url, url_derived_fields={"state_primary": "virginia"},
        )

    def test_beartooth_state_primary(self, beartooth_record: dict) -> None:
        """Beartooth Pass state_primary must be 'montana' (not Wyoming)."""
        assert beartooth_record["state_primary"] == "montana"

    def test_beartooth_wyoming_in_states_all(self, beartooth_record: dict) -> None:
        """Beartooth Pass must have Wyoming in states_all."""
        assert "Wyoming" in beartooth_record["states_all"], (
            f"Wyoming missing: states_all={beartooth_record['states_all']}"
        )

    def test_beartooth_rating(self, beartooth_record: dict) -> None:
        """Beartooth Pass rating is 4.91."""
        assert beartooth_record.get("rating") == pytest.approx(4.91, abs=0.01)

    def test_blue_ridge_state_primary(self, blue_ridge_record: dict) -> None:
        """Blue Ridge Parkway state_primary must be 'virginia' (not Alabama — guards the Epic 2 bug)."""
        assert blue_ridge_record["state_primary"] == "virginia", (
            "EPIC 2 BUG GUARD: Blue Ridge Parkway was incorrectly stamped as Alabama. "
            f"Got state_primary={blue_ridge_record['state_primary']!r}"
        )

    def test_blue_ridge_north_carolina_in_states_all(self, blue_ridge_record: dict) -> None:
        """Blue Ridge Parkway must include North Carolina in states_all."""
        assert "North Carolina" in blue_ridge_record["states_all"], (
            f"North Carolina missing: states_all={blue_ridge_record['states_all']}"
        )

    def test_blue_ridge_not_alabama(self, blue_ridge_record: dict) -> None:
        """Blue Ridge Parkway state_primary must NOT be 'alabama' (Epic 2 regression guard)."""
        assert blue_ridge_record["state_primary"] != "alabama", (
            "REGRESSION: Blue Ridge Parkway is stamped as Alabama — this is the Epic 2 bug."
        )


# ---------------------------------------------------------------------------
# Selectors.yaml integrity
# ---------------------------------------------------------------------------

class TestSelectorsYaml:
    """Verify selectors.yaml satisfies AC-5 constraints."""

    @pytest.fixture(scope="class")
    def sel_data(self) -> dict:
        """Load the raw selectors YAML data."""
        with open(SELECTORS_PATH, "r", encoding="utf-8") as f:
            return yaml.safe_load(f)

    def test_pt03_required_fields_have_full_yield(self, sel_data: dict) -> None:
        """All required fields in PT-03 must have fixture_yield N/N (100%)."""
        fields = sel_data.get("PT-03-route-detail", {})
        for fname, fdef in fields.items():
            if fdef.get("required"):
                yield_str = fdef.get("fixture_yield", "0/0")
                n, d = map(int, yield_str.split("/"))
                assert n == d and n > 0, (
                    f"PT-03-route-detail/{fname} is required but fixture_yield={yield_str}"
                )

    def test_all_page_types_present(self, sel_data: dict) -> None:
        """selectors.yaml must define PT-01, PT-02, and PT-03."""
        assert "PT-01-us-listing" in sel_data
        assert "PT-02-state-listing" in sel_data
        assert "PT-03-route-detail" in sel_data

    def test_state_primary_is_url_derived(self, sel_data: dict) -> None:
        """state_primary must be declared as url_regex derived."""
        fdef = sel_data.get("PT-03-route-detail", {}).get("state_primary", {})
        assert fdef.get("derived") == "url_regex", (
            "state_primary must use derived: url_regex"
        )
