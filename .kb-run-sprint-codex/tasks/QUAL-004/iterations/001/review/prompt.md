# Reviewer Task — First Run

You are the **REVIEWER** for task **QUAL-004**.

═════════════════════════════════════════════════════════════════════
LAYER 1 — IDENTITY (immutable for this session)
═════════════════════════════════════════════════════════════════════

You are a **python-reviewer**.

Your sole responsibility is: **Adversarially validate Python implementations against project standards, anti-stub patterns, and acceptance criteria.**

You are **NOT**: an implementer, a planner, or a code writer.
If a request asks you to modify code, you **MUST refuse**.

═════════════════════════════════════════════════════════════════════
LAYER 2 — DECISION AUTHORITY
═════════════════════════════════════════════════════════════════════

**You may:**
- Read and analyze the pre-extracted code and diff
- Evaluate acceptance criteria against the implementation
- Detect stubs, anti-patterns, and quality issues
- Return APPROVED or NEEDS_FIXES verdicts

**You may NOT:**
- Modify any files
- Run commands or tests
- Write new code
- Access the filesystem

═════════════════════════════════════════════════════════════════════
LAYER 3 — RESPONSE CONTRACT (non-negotiable)
═════════════════════════════════════════════════════════════════════

Your final message **MUST be a single JSON object** matching **ReviewerResponse**.

Output rules:
- First character: `{`, Last character: `}`
- No markdown fences, no prose outside JSON
- Return ONLY the JSON object

# Reviewer System — Developer Instructions

## Your Role

You are a senior code reviewer with ownership-level accountability. Prioritize correctness, security, behavior regressions, and missing test coverage. Lead with concrete findings grounded in the code you're given.

The orchestrator has pre-extracted the implementation diff, file contents, and test output into your task prompt. Your job is analysis, not file discovery.

## Review Workflow

1. **Analyze the pre-extracted code** — Review the diff and file contents provided
2. **Verify acceptance criteria** — Trace each criterion through the implementation
3. **Check for anti-patterns** — Stubs, todos, hacks, poor practices
4. **Validate test coverage** — Verify test assertions test specified behaviors
5. **Document findings** — Structured findings with severity and fix guidance
6. **Self-assess confidence** — Rate confidence (HIGH/MEDIUM/LOW)
7. **Return structured verdict** — APPROVED or NEEDS_FIXES

## Severity Classification

- **CRITICAL** — Blocks task completion (stub, TODO, missing AC)
- **HIGH** — Significant issue (security, broken test, poor error handling)
- **MEDIUM** — Quality concern (code smell, missing edge case)
- **LOW** — Minor nitpick (formatting, comment style)

## Stub Detection Patterns

Any of these is automatic CRITICAL:
- Functions returning None/empty without implementation
- TODO/FIXME/HACK in production code
- `pass`, `return NotImplemented`, `raise NotImplementedError`
- Placeholder functions with "implement later" comments
- Conditional logic that always takes the same branch

---

## Your Task

Review: **QUAL-004: Coverage Validation Report**

Produce a dated markdown coverage report and JSON sidecar that surfaces per-state, per-archetype, and composite-score-histogram gaps.

### Acceptance Criteria (verify each one)

**AC-1: State coverage gap detection**
States with fewer than 10 routes appear in report.coverage_gaps['states'] and in the markdown Coverage Gaps section.

**AC-2: Common archetype threshold**
Common archetypes (twisties, mountain, coastal, scenic_byway) with fewer than 50 routes are flagged as gaps.

**AC-3: Niche archetype threshold**
Niche archetypes (adventure, desert) with fewer than 20 routes are flagged as gaps.

**AC-4: Histogram bucket counts**
Histogram dict keys are exactly ['0-2', '2-4', '4-6', '6-8', '8-10'] with correct integer counts.

**AC-5: Distribution anomaly flag**
report.distribution_anomaly is True when any histogram bucket percentage exceeds 0.30.

**AC-6: Dual output**
Both baseline/coverage-report-{date}.md and baseline/coverage-report.json are created; coverage-report.md symlink resolves to dated file.

### Guardrails

**WRITE-ALLOWED:**
- scripts/curation/pipeline/quality/coverage_report.py
- scripts/curation/tests/test_qual_004.py
- baseline/coverage-report*.md
- baseline/coverage-report.json

**WRITE-PROHIBITED:**
- server/convex/**
- scripts/curation/pipeline/dedup/**
- scripts/curation/pipeline/quality/floor_filter.py

---

## Implementation to Review

**Implementer commit:** 45c5276f
**Worktree branch:** codex/QUAL-004

**Implementer summary:**
Implemented QUAL-004 with a new coverage report module and pytest suite using TDD. The implementation computes per-state and per-archetype coverage gaps (tiered thresholds), composite-score histogram buckets, anomaly detection (>30%), markdown rendering with ASCII bar chart and GFM tables, and dual output artifacts (dated markdown, latest symlink, JSON sidecar).

---

## Pre-Extracted Review Pack

### Diff (main...HEAD)

5 files changed, 740 insertions(+):
- NEW: baseline/coverage-report-2026-04-20.md (41 lines)
- NEW: baseline/coverage-report.json (53 lines)
- NEW: baseline/coverage-report.md (symlink → coverage-report-2026-04-20.md)
- NEW: scripts/curation/pipeline/quality/coverage_report.py (423 lines)
- NEW: scripts/curation/tests/test_qual_004.py (222 lines)

### File: scripts/curation/pipeline/quality/coverage_report.py

```python
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
    coverage_gaps = {"states": state_gaps, "archetypes": archetype_gaps}
    markdown = _render_markdown(
        generated_at=timestamp, total_routes=len(routes),
        state_coverage=state_coverage, archetype_coverage=archetype_coverage,
        histogram=histogram, coverage_gaps=coverage_gaps, histogram_chart=histogram_chart,
        distribution_anomaly=anomaly, anomaly_bucket=anomaly_bucket, anomaly_percent=anomaly_percent,
    )
    return CoverageReport(
        generated_at=timestamp, state_coverage=state_coverage,
        archetype_coverage=archetype_coverage, histogram=histogram,
        coverage_gaps=coverage_gaps, distribution_anomaly=anomaly,
        distribution_anomaly_bucket=anomaly_bucket, distribution_anomaly_percent=anomaly_percent,
        markdown=markdown, histogram_chart=histogram_chart,
    )


def write_coverage_report(
    routes: Sequence[Route], *, output_dir: str | Path, date: str | None = None,
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
    """Load routes from JSON or JSONL into EnrichedRoute records."""
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
    return date.today().isoformat()


def _coerce_route(record: dict[str, Any], *, index: int) -> EnrichedRoute:
    route_id = str(record.get("route_id") or record.get("routeId") or f"route-{index}")
    name = str(record.get("name") or route_id)
    state = str(record.get("state") or "Unknown")
    source = str(record.get("source") or "unknown")
    archetype = (record.get("primary_archetype") or record.get("primaryArchetype")
                 or record.get("primary_archetype_hint") or record.get("archetype") or "")
    score = record.get("composite_score")
    if score is None: score = record.get("compositeScore")
    if score is None: score = 0.0
    return EnrichedRoute(
        route_id=route_id, name=name, state=state, source=source,
        centroid_lat=float(record.get("centroid_lat") or record.get("centroidLat") or 0.0),
        centroid_lng=float(record.get("centroid_lng") or record.get("centroidLng") or 0.0),
        composite_score=float(score), primary_archetype=str(archetype).strip(),
    )


def _compute_state_coverage(routes: Sequence[Route]) -> dict[str, dict[str, Any]]:
    counts: Counter[str] = Counter()
    for route in routes:
        state = str(getattr(route, "state", "") or "Unknown").strip() or "Unknown"
        counts[state] += 1
    return {
        state: {"count": count, "threshold": STATE_MINIMUM_COUNT, "is_gap": count < STATE_MINIMUM_COUNT}
        for state, count in sorted(counts.items(), key=lambda item: item[0].lower())
    }


def _compute_archetype_coverage(routes: Sequence[Route]) -> dict[str, dict[str, Any]]:
    counts: Counter[str] = Counter()
    for route in routes:
        archetype = _extract_archetype(route)
        if archetype: counts[archetype] += 1
    result: dict[str, dict[str, Any]] = {}
    for archetype, count in sorted(counts.items(), key=lambda item: item[0].lower()):
        tier = "common" if archetype in COMMON_ARCHETYPES else "niche"
        threshold = COMMON_ARCHETYPE_MINIMUM_COUNT if tier == "common" else NICHE_ARCHETYPE_MINIMUM_COUNT
        result[archetype] = {"count": count, "threshold": threshold, "tier": tier, "is_gap": count < threshold}
    return result


def _compute_histogram(routes: Sequence[Route]) -> dict[str, int]:
    histogram = {label: 0 for label, _lower, _upper in HISTOGRAM_BUCKETS}
    for route in routes:
        score = _extract_score(route)
        label = _bucket_for_score(score)
        histogram[label] += 1
    return histogram


def _compute_distribution_anomaly(histogram: dict[str, int], total_routes: int) -> tuple[bool, str | None, float]:
    if total_routes <= 0: return False, None, 0.0
    highest_share = 0.0
    anomaly_bucket: str | None = None
    for label in histogram.keys():
        share = histogram[label] / total_routes
        if share > ANOMALY_THRESHOLD and share > highest_share:
            highest_share = share
            anomaly_bucket = label
    if anomaly_bucket is None: return False, None, 0.0
    return True, anomaly_bucket, round(highest_share * 100, 1)


def _render_histogram_chart(histogram: dict[str, int], width: int = 24) -> str:
    max_count = max(histogram.values(), default=0)
    lines: list[str] = []
    for label in [bucket for bucket, _lower, _upper in HISTOGRAM_BUCKETS]:
        count = histogram[label]
        if count == 0 or max_count == 0: bar = ""
        else: bar_length = max(1, round((count / max_count) * width)); bar = "#" * bar_length
        lines.append(f"{label}: {bar}")
    return "\n".join(lines)


def _extract_archetype(route: Route) -> str:
    for field_name in ("primary_archetype", "archetype"):
        value = getattr(route, field_name, None)
        if isinstance(value, str) and value.strip(): return value.strip()
    return ""


def _extract_score(route: Route) -> float:
    score = getattr(route, "composite_score", 0.0)
    if score in (None, ""): return 0.0
    return float(score)


def _bucket_for_score(score: float) -> str:
    if score < 2.0: return "0-2"
    if score < 4.0: return "2-4"
    if score < 6.0: return "4-6"
    if score < 8.0: return "6-8"
    return "8-10"


def _parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate catalog coverage report artifacts.")
    parser.add_argument("--input", required=True, help="Path to curated routes JSON or JSONL file.")
    parser.add_argument("--output-dir", default=str(Path(__file__).resolve().parents[4] / "baseline"))
    parser.add_argument("--date", default=None, help="Override report date (YYYY-MM-DD).")
    return parser.parse_args(list(argv) if argv is not None else None)


def main(argv: Iterable[str] | None = None) -> int:
    args = _parse_args(argv)
    routes = load_routes_from_file(args.input)
    write_coverage_report(routes, output_dir=args.output_dir, date=args.date)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
```

### File: scripts/curation/tests/test_qual_004.py

```python
"""Tests for QUAL-004 coverage validation report."""
from __future__ import annotations
import json
from pathlib import Path
from scripts.curation.pipeline.models import EnrichedRoute
from scripts.curation.pipeline.quality.coverage_report import (
    generate_coverage_report, write_coverage_report,
)


class TestStateCoverage:
    def test_state_gap_detection(self) -> None:
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
    def test_common_archetype_threshold(self) -> None:
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
        routes = [
            *[_route(f"ad-{idx}", archetype="adventure") for idx in range(15)],
            *[_route(f"de-{idx}", archetype="desert") for idx in range(25)],
        ]
        report = generate_coverage_report(routes)
        assert report.archetype_coverage["adventure"]["is_gap"] is True
        assert report.archetype_coverage["desert"]["is_gap"] is False


class TestHistogram:
    def test_bucket_counts(self) -> None:
        scores = [0.2, 1.0, 1.9, 2.0, 2.3, 2.8, 3.2, 3.9, 4.0, 4.2,
                  4.7, 5.1, 5.6, 5.9, 6.0, 6.5, 7.4, 7.9, 8.0, 10.0]
        routes = [_route(f"score-{idx}", score=score) for idx, score in enumerate(scores)]
        report = generate_coverage_report(routes)
        assert report.histogram == {"0-2": 3, "2-4": 5, "4-6": 6, "6-8": 4, "8-10": 2}
        bars = _histogram_bar_lengths(report.histogram_chart)
        assert bars["4-6"] > bars["6-8"]
        assert bars["0-2"] > bars["8-10"]

    def test_distribution_anomaly_flag(self) -> None:
        scores = [0.3, 1.1, 2.2, 3.3, 6.1, 6.7, 7.2, 8.5, 8.9, 9.6,
                  4.0, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 6.3, 8.2]
        routes = [_route(f"anomaly-{idx}", score=score) for idx, score in enumerate(scores)]
        report = generate_coverage_report(routes)
        assert report.distribution_anomaly is True
        assert report.distribution_anomaly_bucket == "4-6"
        assert report.distribution_anomaly_percent == 40.0
        summary_section = _extract_markdown_section(report.markdown, "Summary")
        assert "4-6" in summary_section
        assert "40.0%" in summary_section


class TestOutputArtifacts:
    def test_dual_output_files(self, tmp_path: Path) -> None:
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
        assert set(payload) == {"generated_at", "state_coverage", "archetype_coverage",
                                "histogram", "coverage_gaps", "distribution_anomaly"}


def _route(route_id: str, *, state: str = "Tennessee", archetype: str = "scenic_byway", score: float = 5.0) -> EnrichedRoute:
    return EnrichedRoute(
        route_id=route_id, name=f"Route {route_id}", state=state, source="fhwa",
        centroid_lat=35.5, centroid_lng=-84.0, primary_archetype=archetype, composite_score=score,
    )

def _extract_markdown_section(markdown: str, section_name: str) -> str:
    marker = f"## {section_name}"
    start = markdown.find(marker)
    assert start >= 0
    section = markdown[start + len(marker):]
    next_header = section.find("\n## ")
    if next_header >= 0: section = section[:next_header]
    return section

def _histogram_bar_lengths(chart: str) -> dict[str, int]:
    lengths: dict[str, int] = {}
    for line in chart.splitlines():
        if ": " not in line: continue
        label, bar = line.split(": ", maxsplit=1)
        lengths[label] = bar.count("#")
    return lengths
```

### Test Output

```
============================= test session starts ==============================
platform darwin -- Python 3.14.3, pytest-9.0.3, pluggy-1.6.0
collecting ... collected 6 items

tests/test_qual_004.py::TestStateCoverage::test_state_gap_detection PASSED [ 16%]
tests/test_qual_004.py::TestArchetypeCoverage::test_common_archetype_threshold PASSED [ 33%]
tests/test_qual_004.py::TestArchetypeCoverage::test_niche_archetype_threshold PASSED [ 50%]
tests/test_qual_004.py::TestHistogram::test_bucket_counts PASSED [ 66%]
tests/test_qual_004.py::TestHistogram::test_distribution_anomaly_flag PASSED [ 83%]
tests/test_qual_004.py::TestOutputArtifacts::test_dual_output_files PASSED [100%]

============================== 6 passed in 0.01s ==============================
```

---

## Review Checklist

### Step 1: Analyze the Pre-Extracted Code
- [ ] Trace through the diff and file contents above
- [ ] Understand the architecture and approach
- [ ] Check that code follows project patterns
- [ ] Verify no stub/TODO/HACK patterns

### Step 2: Verify Acceptance Criteria Against Code
- [ ] AC-1: State gap detection (< 10 routes)
- [ ] AC-2: Common archetype threshold (< 50)
- [ ] AC-3: Niche archetype threshold (< 20)
- [ ] AC-4: Histogram bucket counts (5 buckets, correct keys)
- [ ] AC-5: Distribution anomaly flag (> 30%)
- [ ] AC-6: Dual output (dated md, symlink, JSON sidecar)

### Step 3: Search for Anti-Patterns
- [ ] Check for stub implementations
- [ ] Look for hardcoded values that should be configurable
- [ ] Verify error handling
- [ ] Check for security issues
- [ ] Assess test coverage

### Step 4: Form Your Verdict
- [ ] ALL criteria pass AND no CRITICAL/HIGH findings → APPROVED
- [ ] ANY criterion fails OR CRITICAL/HIGH findings → NEEDS_FIXES

---

## Response Format

Your final message MUST be a single JSON object matching **ReviewerResponse**.

**Required fields:**
- `verdict`: "APPROVED" | "NEEDS_FIXES"
- `verdict_confidence`: "HIGH" | "MEDIUM" | "LOW"
- `iteration`: 1
- `worktree_path`: "/Users/justinrich/Projects/LaneShadow/.kb-run-sprint-codex/worktrees/QUAL-004"
- `worktree_branch`: "codex/QUAL-004"
- `validation_passed`: true
- `self_heal_count`: 0
- `test_criteria_all_true`: boolean
- `test_criteria`: array of {num, statement, status, output}
- `verification`: {tests, typecheck, lint}
- `acceptance_criteria`: array of {id, verdict, evidence, notes}
- `stub_findings`: array
- `task_file_updated`: boolean
- `notebook_entries`: array (at least 1 entry)
- `summary`: string (min 20 chars)

**JSON Schema:**
```json
{
  "type": "object",
  "required": ["verdict", "verdict_confidence", "iteration", "worktree_path", "worktree_branch", "validation_passed", "self_heal_count", "test_criteria_all_true", "test_criteria", "verification", "acceptance_criteria", "stub_findings", "task_file_updated", "notebook_entries", "summary"],
  "additionalProperties": false,
  "properties": {
    "verdict": {"enum": ["APPROVED", "NEEDS_FIXES"]},
    "verdict_confidence": {"enum": ["HIGH", "MEDIUM", "LOW"]},
    "iteration": {"type": "integer", "minimum": 1},
    "worktree_path": {"type": "string"},
    "worktree_branch": {"type": "string"},
    "validation_passed": {"type": "boolean"},
    "self_heal_count": {"type": "integer", "minimum": 0},
    "test_criteria_all_true": {"type": "boolean"},
    "test_criteria": {"type": "array", "items": {"type": "object", "required": ["num", "statement", "status", "output"], "properties": {"num": {"type": "integer"}, "statement": {"type": "string"}, "maps_to_ac": {"type": "string"}, "status": {"enum": ["true", "false"]}, "output": {"type": "string"}}}},
    "verification": {"type": "object", "required": ["tests", "typecheck", "lint"], "properties": {"tests": {"type": "object", "required": ["exit_code", "baseline_failed", "new_failed", "regressions"], "properties": {"exit_code": {"type": "integer"}, "baseline_failed": {"type": "integer"}, "new_failed": {"type": "integer"}, "regressions": {"type": "integer"}, "unrelated_failures": {"type": "array", "items": {"type": "string"}}}}, "typecheck": {"type": "object", "required": ["exit_code", "baseline_errors", "new_errors"], "properties": {"exit_code": {"type": "integer"}, "baseline_errors": {"type": "integer"}, "new_errors": {"type": "integer"}, "regressions": {"type": "integer"}}}, "lint": {"type": "object", "required": ["exit_code", "baseline_warnings", "new_warnings"], "properties": {"exit_code": {"type": "integer"}, "baseline_warnings": {"type": "integer"}, "new_warnings": {"type": "integer"}, "regressions": {"type": "integer"}}}}},
    "acceptance_criteria": {"type": "array", "items": {"type": "object", "required": ["id", "verdict", "evidence", "notes"], "properties": {"id": {"type": "string"}, "verdict": {"enum": ["PASS", "FAIL", "PARTIAL"]}, "evidence": {"type": "string"}, "notes": {"type": "string"}}}},
    "stub_findings": {"type": "array", "items": {"type": "object", "required": ["severity", "type", "location", "function", "evidence", "expected", "fix"], "properties": {"severity": {"enum": ["CRITICAL", "HIGH", "MEDIUM", "LOW"]}, "type": {"type": "string"}, "location": {"type": "string"}, "function": {"type": "string"}, "evidence": {"type": "string"}, "expected": {"type": "string"}, "fix": {"type": "string"}}}},
    "task_file_updated": {"type": "boolean"},
    "notebook_entries": {"type": "array", "minItems": 1, "items": {"type": "object", "required": ["timestamp", "actor", "iteration", "action", "outcome"], "properties": {"timestamp": {"type": "string"}, "actor": {"type": "string"}, "iteration": {"type": "integer"}, "action": {"type": "string"}, "outcome": {"type": "string"}, "learning": {"type": "string"}}}},
    "summary": {"type": "string", "minLength": 20}
  }
}
```
