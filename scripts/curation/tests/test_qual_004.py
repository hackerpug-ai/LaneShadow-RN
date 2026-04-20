"""Tests for QUAL-004 coverage validation report."""

from __future__ import annotations

import json
from pathlib import Path

from scripts.curation.pipeline.models import EnrichedRoute
from scripts.curation.pipeline.quality.coverage_report import (
    generate_coverage_report,
    write_coverage_report,
)


class TestStateCoverage:
    """State-level coverage gap detection."""

    def test_state_gap_detection(self) -> None:
        """AC-1: states with fewer than 10 routes are flagged as gaps."""
        routes = [
            *[_route(f"ca-{idx}", state="California") for idx in range(12)],
            *[_route(f"nv-{idx}", state="Nevada") for idx in range(8)],
            *[_route(f"or-{idx}", state="Oregon") for idx in range(15)],
        ]

        report = generate_coverage_report(routes)

        assert report.state_coverage["Nevada"]["is_gap"] is True
        assert report.state_coverage["California"]["is_gap"] is False
        assert report.state_coverage["Oregon"]["is_gap"] is False
        assert "Nevada" in report.coverage_gaps["states"]

        gaps_section = _extract_markdown_section(report.markdown, "Coverage Gaps")
        assert "Nevada" in gaps_section
        assert "California" not in gaps_section
        assert "Oregon" not in gaps_section


class TestArchetypeCoverage:
    """Tiered archetype threshold detection."""

    def test_common_archetype_threshold(self) -> None:
        """AC-2: common archetypes require at least 50 routes."""
        routes = [
            *[_route(f"tw-{idx}", archetype="twisties") for idx in range(45)],
            *[_route(f"mt-{idx}", archetype="mountain") for idx in range(60)],
            *[_route(f"co-{idx}", archetype="coastal") for idx in range(30)],
            *[_route(f"sb-{idx}", archetype="scenic_byway") for idx in range(55)],
        ]

        report = generate_coverage_report(routes)

        assert report.archetype_coverage["twisties"]["is_gap"] is True
        assert report.archetype_coverage["coastal"]["is_gap"] is True
        assert report.archetype_coverage["mountain"]["is_gap"] is False
        assert report.archetype_coverage["scenic_byway"]["is_gap"] is False

    def test_niche_archetype_threshold(self) -> None:
        """AC-3: niche archetypes require at least 20 routes."""
        routes = [
            *[_route(f"ad-{idx}", archetype="adventure") for idx in range(15)],
            *[_route(f"de-{idx}", archetype="desert") for idx in range(25)],
        ]

        report = generate_coverage_report(routes)

        assert report.archetype_coverage["adventure"]["is_gap"] is True
        assert report.archetype_coverage["desert"]["is_gap"] is False


class TestHistogram:
    """Composite-score histogram and anomaly detection."""

    def test_bucket_counts(self) -> None:
        """AC-4: histogram buckets capture expected route counts."""
        scores = [
            0.2,
            1.0,
            1.9,
            2.0,
            2.3,
            2.8,
            3.2,
            3.9,
            4.0,
            4.2,
            4.7,
            5.1,
            5.6,
            5.9,
            6.0,
            6.5,
            7.4,
            7.9,
            8.0,
            10.0,
        ]
        routes = [_route(f"score-{idx}", score=score) for idx, score in enumerate(scores)]

        report = generate_coverage_report(routes)

        assert report.histogram == {
            "0-2": 3,
            "2-4": 5,
            "4-6": 6,
            "6-8": 4,
            "8-10": 2,
        }

        bars = _histogram_bar_lengths(report.histogram_chart)
        assert bars["4-6"] > bars["6-8"]
        assert bars["0-2"] > bars["8-10"]

    def test_distribution_anomaly_flag(self) -> None:
        """AC-5: flag when any histogram bucket exceeds 30% of routes."""
        scores = [
            0.3,
            1.1,
            2.2,
            3.3,
            6.1,
            6.7,
            7.2,
            8.5,
            8.9,
            9.6,
            4.0,
            4.1,
            4.2,
            4.3,
            4.4,
            4.5,
            4.6,
            4.7,
            6.3,
            8.2,
        ]
        routes = [_route(f"anomaly-{idx}", score=score) for idx, score in enumerate(scores)]

        report = generate_coverage_report(routes)

        assert report.distribution_anomaly is True
        assert report.distribution_anomaly_bucket == "4-6"
        assert report.distribution_anomaly_percent == 40.0

        summary_section = _extract_markdown_section(report.markdown, "Summary")
        assert "4-6" in summary_section
        assert "40.0%" in summary_section


class TestOutputArtifacts:
    """Markdown + JSON output artifact generation."""

    def test_dual_output_files(self, tmp_path: Path) -> None:
        """AC-6: write dated markdown, latest symlink, and JSON sidecar."""
        routes = [_route(f"route-{idx}", state="Utah", archetype="desert", score=6.1) for idx in range(5)]

        write_coverage_report(routes, output_dir=tmp_path, date="2026-04-18")

        dated_report = tmp_path / "coverage-report-2026-04-18.md"
        latest_report = tmp_path / "coverage-report.md"
        sidecar = tmp_path / "coverage-report.json"

        assert dated_report.exists()
        markdown = dated_report.read_text(encoding="utf-8")
        assert "| State | Count | Gap |" in markdown
        assert "| --- | ---: | ---: |" in markdown

        assert latest_report.is_symlink()
        assert latest_report.resolve() == dated_report.resolve()

        assert sidecar.exists()
        payload = json.loads(sidecar.read_text(encoding="utf-8"))
        assert set(payload) == {
            "generated_at",
            "state_coverage",
            "archetype_coverage",
            "histogram",
            "coverage_gaps",
            "distribution_anomaly",
        }


def _route(
    route_id: str,
    *,
    state: str = "Tennessee",
    archetype: str = "scenic_byway",
    score: float = 5.0,
) -> EnrichedRoute:
    return EnrichedRoute(
        route_id=route_id,
        name=f"Route {route_id}",
        state=state,
        source="fhwa",
        centroid_lat=35.5,
        centroid_lng=-84.0,
        primary_archetype=archetype,
        composite_score=score,
    )


def _extract_markdown_section(markdown: str, section_name: str) -> str:
    marker = f"## {section_name}"
    start = markdown.find(marker)
    assert start >= 0

    section = markdown[start + len(marker) :]
    next_header = section.find("\n## ")
    if next_header >= 0:
        section = section[:next_header]
    return section


def _histogram_bar_lengths(chart: str) -> dict[str, int]:
    lengths: dict[str, int] = {}
    for line in chart.splitlines():
        if ": " not in line:
            continue
        label, bar = line.split(": ", maxsplit=1)
        lengths[label] = bar.count("#")
    return lengths
