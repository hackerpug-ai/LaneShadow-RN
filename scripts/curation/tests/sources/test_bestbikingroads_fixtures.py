"""Phase 4 contract tests for BestBikingRoads fixture parsing.

Tests that the BBR parse logic correctly extracts fields from real HTML
fixtures downloaded in Phase 2, using selectors defined in Phase 3.

BBR-specific contracts:
- route_name extracted from div.col-xs-12.col-sm-9 h1 (NOT from MR's #route_title)
- state_primary derived from URL slug (TRAP-01 defense: never from listing-page context)
- states_all is a list containing at least state_primary title-cased
- rating extracted from header div text as (N.NN) — NOT from inline JS
- description is first review paragraph (required: false)
- distance_km from "NNN kms" in page text (required: false)
- Framework special-casing for 'rating', 'description', 'distance_mi' uses MR logic;
  BBR glue overrides these with BBR-specific extraction after parse_with_selectors

Crawl Plan Protocol: Phase 4 — DRY-RUN PARSE
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any

import pytest
import yaml
from bs4 import BeautifulSoup

from scripts.curation.pipeline.sources.crawl_plan import (
    SchemaViolation,
    load_selectors,
    parse_with_selectors,
)

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

# test file: scripts/curation/tests/sources/test_bestbikingroads_fixtures.py
# parent*5 reaches repo root: LaneShadow/
_REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
FIXTURES_BASE = _REPO_ROOT / "fixtures" / "bestbikingroads"
SELECTORS_PATH = (
    _REPO_ROOT
    / ".spec"
    / "prds"
    / "curation-hardening"
    / "crawl-plans"
    / "bestbikingroads"
    / "selectors.yaml"
)

# ---------------------------------------------------------------------------
# BBR-specific extraction helpers (mirrors bestbikingroads.py glue logic)
# ---------------------------------------------------------------------------


def _bbr_extract_rating(soup: Any) -> float | None:
    """Extract rating from header div text as (N.NN)."""
    header_div = soup.select_one("div.col-xs-12.col-sm-9.m-0.p-4.white-background")
    if not header_div:
        return None
    header_text = header_div.get_text()
    m = re.search(r"\((\d+\.?\d*)\)", header_text)
    if m:
        try:
            rating = float(m.group(1))
            if 0.0 <= rating <= 5.0:
                return rating
        except ValueError:
            pass
    return None


def _bbr_extract_description(soup: Any) -> str | None:
    """Extract first review paragraph as approximate description."""
    elem = soup.select_one("div.col.p-4.m-0.white-background p")
    if elem:
        text = elem.get_text(strip=True)
        return text if text else None
    return None


def _bbr_extract_distance_km(soup: Any) -> int | None:
    """Extract distance in km from page text."""
    full_text = soup.get_text()
    m = re.search(r"(\d+)\s*kms", full_text)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            pass
    return None


def _state_primary_from_url(url: str) -> str:
    """Extract state_primary slug from a BBR route detail URL."""
    m = re.search(r"/motorcycle-roads/united-states/([a-z-]+)/ride/", url)
    if m:
        return m.group(1)
    raise ValueError(f"Could not extract state from BBR URL: {url}")


def parse_bbr_fixture(html: str, url: str) -> dict:
    """Parse a BBR PT-03 fixture using the selectors + BBR-specific extraction.

    This mirrors the logic in bestbikingroads.py's parse_route_detail():
    1. Use parse_with_selectors for route_name, state_primary, states_all.
    2. Override rating, description, distance_km with BBR-specific extraction.
    """
    sel = load_selectors(str(SELECTORS_PATH))
    state_primary = _state_primary_from_url(url)

    record = parse_with_selectors(
        html=html,
        selector_map=sel,
        page_type="PT-03-route-detail",
        url=url,
        url_derived_fields={
            "state_primary": state_primary,
            "source_url": url,
        },
    )

    # BBR-specific field overrides (framework uses MR-specific logic for these)
    soup = BeautifulSoup(html, "html.parser")
    record["rating"] = _bbr_extract_rating(soup)
    record["description"] = _bbr_extract_description(soup)
    record["distance_km"] = _bbr_extract_distance_km(soup)

    return record


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


# ---------------------------------------------------------------------------
# PT-03 fixture tests
# ---------------------------------------------------------------------------

PT03_FIXTURES = [
    "tail-of-the-dragon.html",
    "million-dollar-highway.html",
    "beartooth-highway.html",
    "pacific-coast-hwy.html",
    "coronado-trail.html",
]

PT03_EXPECTED = {
    "tail-of-the-dragon.html": {
        "route_name_contains": "Tail of The Dragon",
        "state": "north-carolina",
        "states_all_contains": "North Carolina",
        "rating_min": 4.0,
    },
    "million-dollar-highway.html": {
        "route_name_contains": "Million Dollar Highway",
        "state": "colorado",
        "states_all_contains": "Colorado",
        "rating_min": 4.0,
    },
    "beartooth-highway.html": {
        "route_name_contains": "Beartooth",
        "state": "montana",
        "states_all_contains": "Montana",
        "rating_min": 4.5,
    },
    "pacific-coast-hwy.html": {
        "route_name_contains": "Pacific Coast",
        "state": "california",
        "states_all_contains": "California",
        "rating_min": 4.0,
    },
    "coronado-trail.html": {
        "route_name_contains": "Coronado",
        "state": "arizona",
        "states_all_contains": "Arizona",
        "rating_min": 4.5,
    },
}


@pytest.mark.parametrize("filename", PT03_FIXTURES)
def test_pt03_route_name_populated(filename: str) -> None:
    """route_name must be non-empty for every PT-03 fixture."""
    html = _load_fixture_html("PT-03-route-detail", filename)
    url = _url_from_manifest("PT-03-route-detail", filename)
    record = parse_bbr_fixture(html, url)

    assert record.get("route_name"), f"{filename}: route_name is empty or missing"
    assert len(record["route_name"]) > 3, f"{filename}: route_name too short"


@pytest.mark.parametrize("filename", PT03_FIXTURES)
def test_pt03_route_name_expected_text(filename: str) -> None:
    """route_name must contain the expected landmark text."""
    html = _load_fixture_html("PT-03-route-detail", filename)
    url = _url_from_manifest("PT-03-route-detail", filename)
    record = parse_bbr_fixture(html, url)

    expected_substr = PT03_EXPECTED[filename]["route_name_contains"]
    assert expected_substr.lower() in record["route_name"].lower(), (
        f"{filename}: route_name '{record['route_name']}' does not contain '{expected_substr}'"
    )


@pytest.mark.parametrize("filename", PT03_FIXTURES)
def test_pt03_state_primary_correct(filename: str) -> None:
    """state_primary must match the URL-derived state slug (TRAP-01 defense)."""
    html = _load_fixture_html("PT-03-route-detail", filename)
    url = _url_from_manifest("PT-03-route-detail", filename)
    record = parse_bbr_fixture(html, url)

    expected_state = PT03_EXPECTED[filename]["state"]
    assert record.get("state_primary") == expected_state, (
        f"{filename}: expected state_primary={expected_state!r}, got {record.get('state_primary')!r}"
    )


@pytest.mark.parametrize("filename", PT03_FIXTURES)
def test_pt03_states_all_is_list_with_primary(filename: str) -> None:
    """states_all must be a non-empty list containing the primary state title-cased."""
    html = _load_fixture_html("PT-03-route-detail", filename)
    url = _url_from_manifest("PT-03-route-detail", filename)
    record = parse_bbr_fixture(html, url)

    states_all = record.get("states_all", [])
    assert isinstance(states_all, list), f"{filename}: states_all is not a list"
    assert len(states_all) >= 1, f"{filename}: states_all is empty"

    expected_state = PT03_EXPECTED[filename]["states_all_contains"]
    assert expected_state in states_all, (
        f"{filename}: expected {expected_state!r} in states_all={states_all!r}"
    )


@pytest.mark.parametrize("filename", PT03_FIXTURES)
def test_pt03_rating_is_float_in_bounds(filename: str) -> None:
    """rating must be a float in [0.0, 5.0] for all landmark fixtures."""
    html = _load_fixture_html("PT-03-route-detail", filename)
    url = _url_from_manifest("PT-03-route-detail", filename)
    record = parse_bbr_fixture(html, url)

    rating = record.get("rating")
    # All landmark fixtures have ratings from many reviews
    assert rating is not None, f"{filename}: rating is None (all landmark fixtures should have a rating)"
    assert isinstance(rating, float), f"{filename}: rating is not float: {type(rating)}"
    assert 0.0 <= rating <= 5.0, f"{filename}: rating {rating} out of bounds [0.0, 5.0]"

    expected_min = PT03_EXPECTED[filename]["rating_min"]
    assert rating >= expected_min, (
        f"{filename}: rating {rating} below expected minimum {expected_min}"
    )


@pytest.mark.parametrize("filename", PT03_FIXTURES)
def test_pt03_source_url_matches_input(filename: str) -> None:
    """source_url must equal the fixture's URL."""
    html = _load_fixture_html("PT-03-route-detail", filename)
    url = _url_from_manifest("PT-03-route-detail", filename)
    record = parse_bbr_fixture(html, url)

    assert record.get("source_url") == url, (
        f"{filename}: source_url {record.get('source_url')!r} != {url!r}"
    )


@pytest.mark.parametrize("filename", PT03_FIXTURES)
def test_pt03_distance_km_is_positive_int(filename: str) -> None:
    """distance_km must be a positive integer for landmark fixtures."""
    html = _load_fixture_html("PT-03-route-detail", filename)
    url = _url_from_manifest("PT-03-route-detail", filename)
    record = parse_bbr_fixture(html, url)

    distance = record.get("distance_km")
    # All landmark fixtures have distance info
    assert distance is not None, f"{filename}: distance_km is None"
    assert isinstance(distance, int), f"{filename}: distance_km is not int: {type(distance)}"
    assert distance > 0, f"{filename}: distance_km is not positive: {distance}"


def test_pt03_schema_violation_on_missing_name() -> None:
    """Parser must raise SchemaViolation if route_name is missing (fail-closed).

    Uses minimal HTML with no h1 element so the selector returns None.
    """
    # Minimal HTML that has no h1 — route_name selector will return None
    minimal_html = """<html><body>
    <div class="col-xs-12 col-sm-9 m-0 p-4 white-background">
        <p>Some content but no h1</p>
    </div>
    </body></html>"""

    sel = load_selectors(str(SELECTORS_PATH))
    url = "https://www.bestbikingroads.com/motorcycle-roads/united-states/north-carolina/ride/test-route"
    state_primary = "north-carolina"

    with pytest.raises(SchemaViolation) as exc_info:
        parse_with_selectors(
            html=minimal_html,
            selector_map=sel,
            page_type="PT-03-route-detail",
            url=url,
            url_derived_fields={
                "state_primary": state_primary,
                "source_url": url,
            },
        )

    assert exc_info.value.field == "route_name", (
        f"Expected SchemaViolation for route_name, got {exc_info.value.field}"
    )


# ---------------------------------------------------------------------------
# PT-01 and PT-02 fixture smoke tests (index pages)
# ---------------------------------------------------------------------------

PT01_FIXTURES = ["tennessee.html", "california.html", "alabama.html"]
PT02_FIXTURES = [
    "tennessee-lake-obion-weakley.html",
    "california-monterey-san-benito.html",
    "alabama-madison-jackson-marshall.html",
]


@pytest.mark.parametrize("filename", PT01_FIXTURES)
def test_pt01_has_ride_links(filename: str) -> None:
    """PT-01 state listing pages must contain at least 30 /ride/ links."""
    html = _load_fixture_html("PT-01-state-listing", filename)
    soup = BeautifulSoup(html, "html.parser")

    state = filename.replace(".html", "")
    ride_links = [
        a["href"]
        for a in soup.find_all("a", href=True)
        if f"/united-states/{state}/ride/" in a["href"]
        or (
            "/motorcycle-roads/united-states/" in a["href"]
            and "/ride/" in a["href"]
        )
    ]
    assert len(ride_links) >= 30, (
        f"{filename}: expected ≥30 ride links, got {len(ride_links)}"
    )


@pytest.mark.parametrize("filename", PT01_FIXTURES)
def test_pt01_has_cluster_links(filename: str) -> None:
    """PT-01 state listing pages must contain cluster /rides/ links (TRAP-02 evidence)."""
    html = _load_fixture_html("PT-01-state-listing", filename)
    soup = BeautifulSoup(html, "html.parser")

    cluster_links = [
        a["href"]
        for a in soup.find_all("a", href=True)
        if "/rides/" in a["href"] and "/united-states/" in a["href"]
    ]
    assert len(cluster_links) >= 2, (
        f"{filename}: expected ≥2 cluster links, got {len(cluster_links)}. "
        "Cluster links are required for Phase 1 to meet AC-3 [3500, 5500] inventory range."
    )


@pytest.mark.parametrize("filename", PT02_FIXTURES)
def test_pt02_has_ride_links(filename: str) -> None:
    """PT-02 cluster index pages must contain at least 10 /ride/ links."""
    html = _load_fixture_html("PT-02-cluster-index", filename)
    soup = BeautifulSoup(html, "html.parser")

    ride_links = [
        a["href"]
        for a in soup.find_all("a", href=True)
        if "/ride/" in a["href"] and "/united-states/" in a["href"]
    ]
    assert len(ride_links) >= 10, (
        f"{filename}: expected ≥10 ride links in cluster page, got {len(ride_links)}"
    )


# ---------------------------------------------------------------------------
# Manifest integrity
# ---------------------------------------------------------------------------


def test_manifest_has_all_fixture_files() -> None:
    """Every file referenced in the manifest must exist on disk."""
    manifest = _load_manifest()
    for pt, items in manifest.items():
        assert len(items) >= 3, f"Page type {pt} has fewer than 3 fixtures: {len(items)}"
        for item in items:
            fpath = FIXTURES_BASE / pt / item["file"]
            assert fpath.exists(), f"Fixture file missing: {fpath}"
            assert fpath.stat().st_size > 1000, f"Fixture file suspiciously small: {fpath}"


def test_manifest_pt03_has_required_expected_keys() -> None:
    """PT-03 manifest entries must have route_name and state in expected."""
    manifest = _load_manifest()
    pt03_items = manifest.get("PT-03-route-detail", [])
    assert len(pt03_items) >= 5, f"Expected ≥5 PT-03 fixtures, got {len(pt03_items)}"
    for item in pt03_items:
        assert "expected" in item, f"Manifest item missing 'expected': {item['file']}"
        assert "route_name" in item["expected"], (
            f"Manifest item missing expected.route_name: {item['file']}"
        )
        assert "state" in item["expected"], (
            f"Manifest item missing expected.state: {item['file']}"
        )
