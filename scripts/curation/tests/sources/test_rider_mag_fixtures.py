"""Fixture contract tests for Rider Magazine crawl-plan artifacts."""

from __future__ import annotations

from pathlib import Path

import yaml

from scripts.curation.pipeline.sources.rider_mag import parse_route_section_html

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
FIXTURES_DIR = REPO_ROOT / "fixtures" / "rider_mag"
SECTION_DIR = FIXTURES_DIR / "PT-01-route-section"
MANIFEST_PATH = FIXTURES_DIR / "fixtures.manifest.yaml"
SELECTORS_PATH = (
    REPO_ROOT
    / ".spec"
    / "prds"
    / "curation-hardening"
    / "crawl-plans"
    / "rider_mag"
    / "selectors.yaml"
)


def test_rider_mag_fixtures_cover_required_fields() -> None:
    with MANIFEST_PATH.open("r", encoding="utf-8") as handle:
        manifest = yaml.safe_load(handle)
    with SELECTORS_PATH.open("r", encoding="utf-8") as handle:
        selectors = yaml.safe_load(handle)["PT-01-route-section"]

    source_article = manifest["source_article"]
    fixture_rows = manifest["PT-01-route-section"]
    required_fields = [name for name, spec in selectors.items() if spec["required"]]

    assert source_article["expected"]["route_count"] == 50
    assert source_article["expected"]["source_rank_kind"] == "alphabetical_by_state_order"
    assert len(fixture_rows) == 5

    for fixture in fixture_rows:
        html = (SECTION_DIR / fixture["file"]).read_text(encoding="utf-8")
        record = parse_route_section_html(html, source_article["url"])

        for field in required_fields:
            assert field in record, f"{fixture['file']}: missing {field}"
            assert record[field] not in (None, "", []), f"{fixture['file']}: empty {field}"

        expected = fixture["expected"]
        assert record["route_name"] == expected["route_name"]
        assert record["state_text"] == expected["state_text"]
        assert record["states_all"] == expected["states_all"]
        assert record["source_rank"] == expected["source_rank"]
        assert record["related_url"] == expected["related_url"]
        assert expected["description_excerpt"] in record["description"]
