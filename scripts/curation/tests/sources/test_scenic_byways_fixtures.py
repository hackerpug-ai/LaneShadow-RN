"""Fixture contract tests for Scenic Byways crawl-plan artifacts."""

from __future__ import annotations

import json
from pathlib import Path

import yaml

REPO_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
FIXTURES_DIR = REPO_ROOT / "fixtures" / "scenic_byways" / "PT-01-feature-json"
MANIFEST_PATH = REPO_ROOT / "fixtures" / "scenic_byways" / "fixtures.manifest.yaml"
SELECTORS_PATH = (
    REPO_ROOT
    / ".spec"
    / "prds"
    / "curation-hardening"
    / "crawl-plans"
    / "scenic_byways"
    / "selectors.yaml"
)


def test_scenic_byways_fixtures_cover_required_fields() -> None:
    with MANIFEST_PATH.open("r", encoding="utf-8") as handle:
        manifest = yaml.safe_load(handle)
    with SELECTORS_PATH.open("r", encoding="utf-8") as handle:
        selectors = yaml.safe_load(handle)["PT-01-feature-json"]

    required_fields = [name for name, spec in selectors.items() if spec["required"]]
    fixtures = manifest["PT-01-feature-json"]

    assert len(fixtures) == 3

    for fixture in fixtures:
        path = FIXTURES_DIR / fixture["file"]
        record = json.loads(path.read_text(encoding="utf-8"))

        for field in required_fields:
            assert field in record, f"{fixture['file']}: missing {field}"
            value = record[field]
            assert value not in (None, "", []), f"{fixture['file']}: empty {field}"

        expected = fixture["expected"]
        assert record["name"] == expected["route_name"]
        assert record["state"] == expected["state"]
        assert record["designation"] == expected["designation"]
        assert record["source_label"] == expected["source_label"]
