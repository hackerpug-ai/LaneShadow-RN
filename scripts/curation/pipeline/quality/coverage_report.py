"""Coverage report builder for curated route quality validation.

Produces a dated markdown artifact and JSON sidecar highlighting:
- state-level coverage gaps
- archetype-level coverage gaps with tiered thresholds
- composite score distribution histogram and anomaly flags
"""

from __future__ import annotations

import argparse
import json
from collections import Counter
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any

from scripts.curation.pipeline.models import EnrichedRoute, Route

COMMON_ARCHETYPES = {"twisties", "mountain", "coastal", "scenic_byway"}
NICHE_ARCHETYPES = {"adventure", "desert"}
STATE_MINIMUM_COUNT = 10
COMMON_ARCHETYPE_MINIMUM_COUNT = 50
NICHE_ARCHETYPE_MINIMUM_COUNT = 20
ANOMALY_THRESHOLD = 0.30
HISTOGRAM_BUCKETS: list[tuple[str, float, float]] = [
    ("0-2", 0.0, 2.0),
    ("2-4", 2.0, 4.0),
    ("4-6", 4.0, 6.0),
    ("6-8", 6.0, 8.0),
    ("8-10", 8.0, 10.0),
]


@dataclass(frozen=True)
class CoverageReport:
    """Structured representation of catalog coverage health."""

    generated_at: str
    state_coverage: dict[str, dict[str, Any]]
    archetype_coverage: dict[str, dict[str, Any]]
    histogram: dict[str, int]
    coverage_gaps: dict[str, list[str]]
    distribution_anomaly: bool
    markdown: str
    histogram_chart: str
    distribution_anomaly_bucket: str | None = None
    distribution_anomaly_percent: float = 0.0


def generate_coverage_report(
    routes: Sequence[Route],
    *,
    generated_at: datetime | None = None,
) -> CoverageReport:
    """Generate a coverage report from in-memory route records."""
    timestamp = (generated_at or datetime.now(UTC)).replace(microsecond=0).isoformat()

    state_coverage = _compute_state_coverage(routes)
    archetype_coverage = _compute_archetype_coverage(routes)
    histogram = _compute_histogram(routes)
    histogram_chart = _render_histogram_chart(histogram)

    state_gaps = [state for state, item in state_coverage.items() if item["is_gap"]]
    archetype_gaps = [archetype for archetype, item in archetype_coverage.items() if item["is_gap"]]

    anomaly, anomaly_bucket, anomaly_percent = _compute_distribution_anomaly(histogram, len(routes))

    coverage_gaps = {
        "states": state_gaps,
        "archetypes": archetype_gaps,
    }

    markdown = _render_markdown(
        generated_at=timestamp,
        total_routes=len(routes),
        state_coverage=state_coverage,
        archetype_coverage=archetype_coverage,
        histogram=histogram,
        coverage_gaps=coverage_gaps,
        histogram_chart=histogram_chart,
        distribution_anomaly=anomaly,
        anomaly_bucket=anomaly_bucket,
        anomaly_percent=anomaly_percent,
    )

    return CoverageReport(
        generated_at=timestamp,
        state_coverage=state_coverage,
        archetype_coverage=archetype_coverage,
        histogram=histogram,
        coverage_gaps=coverage_gaps,
        distribution_anomaly=anomaly,
        distribution_anomaly_bucket=anomaly_bucket,
        distribution_anomaly_percent=anomaly_percent,
        markdown=markdown,
        histogram_chart=histogram_chart,
    )


def write_coverage_report(
    routes: Sequence[Route],
    *,
    output_dir: str | Path,
    date: str | None = None,
) -> CoverageReport:
    """Write dated markdown + latest symlink + JSON sidecar to output_dir."""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    report_date = date or date_today_iso()
    report = generate_coverage_report(routes)

    dated_report_path = output_path / f"coverage-report-{report_date}.md"
    latest_report_path = output_path / "coverage-report.md"
    json_sidecar_path = output_path / "coverage-report.json"

    dated_report_path.write_text(report.markdown, encoding="utf-8")

    if latest_report_path.exists() or latest_report_path.is_symlink():
        latest_report_path.unlink()
    latest_report_path.symlink_to(dated_report_path.name)

    payload = {
        "generated_at": report.generated_at,
        "state_coverage": report.state_coverage,
        "archetype_coverage": report.archetype_coverage,
        "histogram": report.histogram,
        "coverage_gaps": report.coverage_gaps,
        "distribution_anomaly": report.distribution_anomaly,
    }
    json_sidecar_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    return report


def load_routes_from_file(path: str | Path) -> list[EnrichedRoute]:
    """Load routes from JSON or JSONL into EnrichedRoute records.

    This loader is permissive for ad-hoc curation artifacts and uses sensible
    defaults when optional fields are absent.
    """
    file_path = Path(path)
    if not file_path.exists():
        raise FileNotFoundError(f"Route input file not found: {file_path}")

    if file_path.suffix.lower() == ".jsonl":
        records = [json.loads(line) for line in file_path.read_text(encoding="utf-8").splitlines() if line.strip()]
    else:
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        if isinstance(payload, list):
            records = payload
        elif isinstance(payload, dict) and "routes" in payload and isinstance(payload["routes"], list):
            records = payload["routes"]
        else:
            raise ValueError("Unsupported JSON shape; expected list or {'routes': [...]}.")

    return [_coerce_route(item, index=index) for index, item in enumerate(records)]


def date_today_iso() -> str:
    """Return today's date in YYYY-MM-DD format."""
    return date.today().isoformat()


def _coerce_route(record: dict[str, Any], *, index: int) -> EnrichedRoute:
    route_id = str(record.get("route_id") or record.get("routeId") or f"route-{index}")
    name = str(record.get("name") or route_id)
    state = str(record.get("state") or "Unknown")
    source = str(record.get("source") or "unknown")

    archetype = (
        record.get("primary_archetype")
        or record.get("primaryArchetype")
        or record.get("primary_archetype_hint")
        or record.get("archetype")
        or ""
    )
    score = record.get("composite_score")
    if score is None:
        score = record.get("compositeScore")
    if score is None:
        score = 0.0

    return EnrichedRoute(
        route_id=route_id,
        name=name,
        state=state,
        source=source,
        centroid_lat=float(record.get("centroid_lat") or record.get("centroidLat") or 0.0),
        centroid_lng=float(record.get("centroid_lng") or record.get("centroidLng") or 0.0),
        composite_score=float(score),
        primary_archetype=str(archetype).strip(),
    )


def _compute_state_coverage(routes: Sequence[Route]) -> dict[str, dict[str, Any]]:
    counts: Counter[str] = Counter()
    for route in routes:
        state = str(getattr(route, "state", "") or "Unknown").strip() or "Unknown"
        counts[state] += 1

    return {
        state: {
            "count": count,
            "threshold": STATE_MINIMUM_COUNT,
            "is_gap": count < STATE_MINIMUM_COUNT,
        }
        for state, count in sorted(counts.items(), key=lambda item: item[0].lower())
    }


def _compute_archetype_coverage(routes: Sequence[Route]) -> dict[str, dict[str, Any]]:
    counts: Counter[str] = Counter(
        {archetype: 0 for archetype in sorted(COMMON_ARCHETYPES | NICHE_ARCHETYPES)}
    )
    for route in routes:
        archetype = _extract_archetype(route)
        if archetype:
            counts[archetype] += 1

    result: dict[str, dict[str, Any]] = {}
    for archetype, count in sorted(counts.items(), key=lambda item: item[0].lower()):
        tier = "common" if archetype in COMMON_ARCHETYPES else "niche"
        threshold = COMMON_ARCHETYPE_MINIMUM_COUNT if tier == "common" else NICHE_ARCHETYPE_MINIMUM_COUNT
        result[archetype] = {
            "count": count,
            "threshold": threshold,
            "tier": tier,
            "is_gap": count < threshold,
        }
    return result


def _compute_histogram(routes: Sequence[Route]) -> dict[str, int]:
    histogram = {label: 0 for label, _lower, _upper in HISTOGRAM_BUCKETS}

    for route in routes:
        score = _extract_score(route)
        label = _bucket_for_score(score)
        histogram[label] += 1

    return histogram


def _compute_distribution_anomaly(
    histogram: dict[str, int],
    total_routes: int,
) -> tuple[bool, str | None, float]:
    if total_routes <= 0:
        return False, None, 0.0

    highest_share = 0.0
    anomaly_bucket: str | None = None

    for label in histogram.keys():
        share = histogram[label] / total_routes
        if share > ANOMALY_THRESHOLD and share > highest_share:
            highest_share = share
            anomaly_bucket = label

    if anomaly_bucket is None:
        return False, None, 0.0

    return True, anomaly_bucket, round(highest_share * 100, 1)


def _render_histogram_chart(histogram: dict[str, int], width: int = 24) -> str:
    max_count = max(histogram.values(), default=0)
    lines: list[str] = []

    for label in [bucket for bucket, _lower, _upper in HISTOGRAM_BUCKETS]:
        count = histogram[label]
        if count == 0 or max_count == 0:
            bar = ""
        else:
            bar_length = max(1, round((count / max_count) * width))
            bar = "#" * bar_length
        lines.append(f"{label}: {bar}")

    return "\n".join(lines)


def _render_markdown(
    *,
    generated_at: str,
    total_routes: int,
    state_coverage: dict[str, dict[str, Any]],
    archetype_coverage: dict[str, dict[str, Any]],
    histogram: dict[str, int],
    coverage_gaps: dict[str, list[str]],
    histogram_chart: str,
    distribution_anomaly: bool,
    anomaly_bucket: str | None,
    anomaly_percent: float,
) -> str:
    summary_lines = [
        "## Summary",
        f"- Generated at: {generated_at}",
        f"- Total routes analyzed: {total_routes}",
        f"- State gaps (< {STATE_MINIMUM_COUNT} routes): {len(coverage_gaps['states'])}",
        f"- Archetype gaps (tiered thresholds): {len(coverage_gaps['archetypes'])}",
    ]
    if distribution_anomaly and anomaly_bucket:
        summary_lines.append(
            f"- Distribution anomaly: bucket `{anomaly_bucket}` contains {anomaly_percent:.1f}% of routes (>30%)."
        )
    else:
        summary_lines.append("- Distribution anomaly: none detected.")

    state_rows = [
        "| State | Count | Gap |",
        "| --- | ---: | ---: |",
    ]
    for state, metrics in state_coverage.items():
        state_rows.append(f"| {state} | {metrics['count']} | {'Yes' if metrics['is_gap'] else 'No'} |")

    archetype_rows = [
        "| Archetype | Tier | Count | Threshold | Gap |",
        "| --- | --- | ---: | ---: | ---: |",
    ]
    for archetype, metrics in archetype_coverage.items():
        archetype_rows.append(
            "| "
            f"{archetype} | {metrics['tier']} | {metrics['count']} | {metrics['threshold']} | "
            f"{'Yes' if metrics['is_gap'] else 'No'} |"
        )

    histogram_rows = [
        "| Bucket | Count | Share | Bar |",
        "| --- | ---: | ---: | --- |",
    ]
    for label, _lower, _upper in HISTOGRAM_BUCKETS:
        count = histogram[label]
        share = (count / total_routes * 100.0) if total_routes else 0.0
        bar = histogram_chart.splitlines()[[b[0] for b in HISTOGRAM_BUCKETS].index(label)].split(": ", maxsplit=1)[1]
        histogram_rows.append(f"| {label} | {count} | {share:.1f}% | `{bar}` |")

    coverage_lines = ["## Coverage Gaps"]
    state_gaps = coverage_gaps["states"]
    archetype_gaps = coverage_gaps["archetypes"]

    if state_gaps:
        coverage_lines.append("### States")
        for state in state_gaps:
            coverage_lines.append(f"- {state}")
    else:
        coverage_lines.append("### States")
        coverage_lines.append("- None")

    if archetype_gaps:
        coverage_lines.append("### Archetypes")
        for archetype in archetype_gaps:
            coverage_lines.append(f"- {archetype}")
    else:
        coverage_lines.append("### Archetypes")
        coverage_lines.append("- None")

    sections = [
        "# LaneShadow Coverage Report",
        *summary_lines,
        "## State Coverage",
        *state_rows,
        "## Archetype Coverage",
        *archetype_rows,
        "## Composite Score Histogram",
        "```text",
        histogram_chart,
        "```",
        *histogram_rows,
        *coverage_lines,
    ]

    return "\n".join(sections) + "\n"


def _extract_archetype(route: Route) -> str:
    for field_name in ("primary_archetype", "archetype"):
        value = getattr(route, field_name, None)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _extract_score(route: Route) -> float:
    score = getattr(route, "composite_score", 0.0)
    if score in (None, ""):
        return 0.0
    return float(score)


def _bucket_for_score(score: float) -> str:
    if score < 2.0:
        return "0-2"
    if score < 4.0:
        return "2-4"
    if score < 6.0:
        return "4-6"
    if score < 8.0:
        return "6-8"
    return "8-10"


def _parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate catalog coverage report artifacts.")
    parser.add_argument("--input", required=True, help="Path to curated routes JSON or JSONL file.")
    parser.add_argument(
        "--output-dir",
        default=str(Path(__file__).resolve().parents[4] / "baseline"),
        help="Output directory for coverage report artifacts.",
    )
    parser.add_argument("--date", default=None, help="Override report date (YYYY-MM-DD).")
    return parser.parse_args(list(argv) if argv is not None else None)


def main(argv: Iterable[str] | None = None) -> int:
    args = _parse_args(argv)
    routes = load_routes_from_file(args.input)
    write_coverage_report(routes, output_dir=args.output_dir, date=args.date)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
