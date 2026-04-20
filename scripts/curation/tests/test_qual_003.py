"""Tests for QUAL-003 quality floor filtering."""

from __future__ import annotations

import json
from pathlib import Path

from scripts.curation.pipeline.quality.floor_filter import FloorFilter


def _base_route(route_id: str, **overrides: object) -> dict[str, object]:
    route: dict[str, object] = {
        "routeId": route_id,
        "description": "Short",
        "community_rating": None,
        "designation": None,
        "curvatureScore": None,
        "source": "BBR",
        "sourceRefs": [],
    }
    route.update(overrides)
    return route


def test_all_fields_present_yields_premium() -> None:
    """AC-1: All four completeness fields return premium tier."""
    route = _base_route(
        "route-1",
        description="x" * 101,
        community_rating=4.5,
        designation="US Scenic Byways",
        curvatureScore=1.8,
        source="BBR",
    )

    floor_filter = FloorFilter(base_url="https://example.convex.site", deploy_key="test-key")

    assert floor_filter._compute_tier(route) == "premium"


def test_one_field_present_yields_standard() -> None:
    """AC-2: At least one completeness field returns standard tier."""
    route = _base_route(
        "route-2",
        description="Short",
        community_rating=None,
        designation=None,
        curvatureScore=1.2,
    )

    floor_filter = FloorFilter(base_url="https://example.convex.site", deploy_key="test-key")

    assert floor_filter._compute_tier(route) == "standard"


def test_no_fields_yields_minimal() -> None:
    """AC-3: No completeness fields returns minimal for non-government source."""
    route = _base_route(
        "route-3",
        description="Short",
        community_rating=None,
        designation=None,
        curvatureScore=None,
        source="curvature_discovery",
    )

    floor_filter = FloorFilter(base_url="https://example.convex.site", deploy_key="test-key")

    assert floor_filter._compute_tier(route) == "minimal"


def test_government_source_allowlist_prevents_minimal() -> None:
    """AC-4: Government source allowlist upgrades minimal to standard."""
    route = _base_route(
        "route-4",
        description="Short",
        community_rating=None,
        designation=None,
        curvatureScore=None,
        sourceRefs=["FHWA"],
    )

    floor_filter = FloorFilter(base_url="https://example.convex.site", deploy_key="test-key")

    assert floor_filter._compute_tier(route) == "standard"


def test_tier_distribution_report_written(tmp_path: Path, monkeypatch) -> None:
    """AC-5: run() writes tier distribution report and updates every route."""
    report_path = tmp_path / "quality_floor_report.json"
    routes = [
        _base_route(
            "premium-1",
            description="x" * 101,
            community_rating=4.7,
            designation="US Scenic Byways",
            curvatureScore=1.3,
        ),
        _base_route(
            "premium-2",
            description="y" * 120,
            community_rating=4.2,
            designation="National Scenic Byway",
            curvatureScore=1.6,
        ),
        _base_route("standard-1", curvatureScore=0.8),
        _base_route("standard-2", community_rating=4.0),
        _base_route("standard-3", sourceRefs=["Scenic Byways"]),
        _base_route("minimal-1"),
    ]

    floor_filter = FloorFilter(
        base_url="https://example.convex.site",
        deploy_key="test-key",
        report_output_path=report_path,
    )

    updates: list[tuple[str, str]] = []

    def _capture_update(route_id: str, quality_tier: str) -> None:
        updates.append((route_id, quality_tier))

    monkeypatch.setattr(floor_filter, "_write_quality_tier_to_convex", _capture_update)

    result = floor_filter.run(routes=routes)

    assert result == {"premium": 2, "standard": 3, "minimal": 1, "total": 6}
    assert report_path.exists()
    assert json.loads(report_path.read_text(encoding="utf-8")) == {
        "premium": 2,
        "standard": 3,
        "minimal": 1,
        "total": 6,
    }
    assert len(updates) == 6
    assert {route_id for route_id, _ in updates} == {
        "premium-1",
        "premium-2",
        "standard-1",
        "standard-2",
        "standard-3",
        "minimal-1",
    }


def test_empty_and_zero_treated_as_not_present() -> None:
    """AC-6: Empty strings and zero values are treated as not present."""
    route = _base_route(
        "route-6",
        description="",
        community_rating=0,
        designation="",
        curvatureScore=0,
        source="BBR",
    )

    floor_filter = FloorFilter(base_url="https://example.convex.site", deploy_key="test-key")

    assert floor_filter._compute_tier(route) == "minimal"
