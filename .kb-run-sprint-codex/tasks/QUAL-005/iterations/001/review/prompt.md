# Reviewer Task — First Run

You are the **REVIEWER** for task **QUAL-005**, iteration 1 (first check).

You are a **python-reviewer**. Your sole responsibility is adversarially validating Python implementations. You do NOT modify files.

## Your Task

Review the iteration 1 implementation for **QUAL-005: Data Quality Report with CI Gating**.

### Acceptance Criteria

- AC-1: Happy-path: all metrics within threshold — exit 0, PASS verdict
- AC-2: Anomaly path: metric deviates > 10% — exit 1, FAIL verdict
- AC-3: No prior run — delta shows 'n/a', no anomalies raised, exit 0
- AC-4: All five metrics present in Metrics table and JSON sidecar
- AC-5: JSON sidecar conforms to exact machine-parseable schema
- AC-6: CLI entry point exits with correct process exit code (subprocess-level assertion)

### Diff (main → codex/QUAL-005)

```diff
diff --git a/scripts/curation/pipeline/quality/data_quality_report.py b/scripts/curation/pipeline/quality/data_quality_report.py
new file mode 100644
index 00000000..a0e69856
--- /dev/null
+++ b/scripts/curation/pipeline/quality/data_quality_report.py
@@ -0,0 +1,280 @@
+"""Data quality report builder for pipeline CI gating.
+
+Compares current run metrics against the previous run snapshot and flags anomalies
+when `abs((current - previous) / previous) > 0.10`.
+
+If there is no previous snapshot or a previous metric value is `0.0`, delta is
+reported as ``"n/a"`` to avoid division-by-zero and no anomaly is raised for that
+metric.
+"""
+
+from __future__ import annotations
+
+import argparse
+import json
+import sys
+from dataclasses import dataclass
+from datetime import UTC, datetime
+from pathlib import Path
+from typing import Any
+from uuid import uuid4
+
+ANOMALY_THRESHOLD = 0.10
+REQUIRED_METRICS = [
+    "completeness_pct",
+    "source_overlap_pct",
+    "extraction_success_rate",
+    "dedup_merge_rate",
+    "quality_floor_exclusion_rate",
+]
+
+PROJECT_ROOT = Path(__file__).resolve().parents[4]
+DEFAULT_OUTPUT_DIR = PROJECT_ROOT / "baseline"
+DEFAULT_PRIOR_RUN_PATH = DEFAULT_OUTPUT_DIR / "data-quality-report.json"
+
+
+@dataclass(frozen=True)
+class DataQualityReport:
+    verdict: str
+    exit_code: int
+    run_id: str
+    timestamp: str
+    metrics: list[dict[str, Any]]
+    violations: list[str]
+    markdown: str
+
+
+def run_data_quality_report(
+    metrics: dict[str, float],
+    *,
+    prior_run_path: str | Path,
+    run_id: str | None = None,
+    timestamp: datetime | None = None,
+) -> DataQualityReport:
+    current_metrics = _normalize_metrics(metrics)
+    prior_metrics = _load_prior_metrics(prior_run_path)
+    metric_rows: list[dict[str, Any]] = []
+    violations: list[str] = []
+    for metric_name in REQUIRED_METRICS:
+        current_value = current_metrics[metric_name]
+        previous_value = prior_metrics.get(metric_name)
+        delta: float | str
+        passed = True
+        if previous_value is None or previous_value == 0.0:
+            delta = "n/a"
+        else:
+            delta = (current_value - previous_value) / previous_value
+            if abs(delta) > ANOMALY_THRESHOLD:
+                passed = False
+                violations.append(metric_name)
+        metric_rows.append({
+            "name": metric_name,
+            "current": current_value,
+            "previous": previous_value,
+            "delta": delta,
+            "threshold": ANOMALY_THRESHOLD,
+            "passed": passed,
+        })
+    has_anomaly = len(violations) > 0
+    verdict = "FAIL" if has_anomaly else "PASS"
+    exit_code = 1 if has_anomaly else 0
+    report_timestamp = (timestamp or datetime.now(UTC)).replace(microsecond=0).isoformat()
+    report_run_id = run_id or f"dq-{uuid4().hex[:12]}"
+    markdown = _render_markdown(
+        verdict=verdict, exit_code=exit_code, metrics=metric_rows,
+        violations=violations, run_id=report_run_id, report_timestamp=report_timestamp,
+    )
+    return DataQualityReport(
+        verdict=verdict, exit_code=exit_code, run_id=report_run_id,
+        timestamp=report_timestamp, metrics=metric_rows,
+        violations=violations, markdown=markdown,
+    )
+
+
+def write_data_quality_report(report: DataQualityReport, *, output_dir: str | Path) -> tuple[Path, Path]:
+    output_path = Path(output_dir)
+    output_path.mkdir(parents=True, exist_ok=True)
+    markdown_path = output_path / "data-quality-report.md"
+    json_path = output_path / "data-quality-report.json"
+    markdown_path.write_text(report.markdown, encoding="utf-8")
+    payload = {
+        "verdict": report.verdict, "exit_code": report.exit_code,
+        "run_id": report.run_id, "timestamp": report.timestamp,
+        "metrics": report.metrics, "violations": report.violations,
+    }
+    json_path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
+    return markdown_path, json_path
+
+
+def load_metrics_from_json(path: str | Path) -> dict[str, float]:
+    metrics_path = Path(path)
+    payload = json.loads(metrics_path.read_text(encoding="utf-8"))
+    if not isinstance(payload, dict):
+        raise ValueError("Metrics JSON must be an object with metric names as keys.")
+    return _normalize_metrics(payload)
+
+
+def _load_prior_metrics(path: str | Path) -> dict[str, float | None]:
+    prior_path = Path(path)
+    if not prior_path.exists():
+        return {name: None for name in REQUIRED_METRICS}
+    payload = json.loads(prior_path.read_text(encoding="utf-8"))
+    metric_entries = payload.get("metrics")
+    if not isinstance(metric_entries, list):
+        return {name: None for name in REQUIRED_METRICS}
+    by_name: dict[str, float | None] = {}
+    for item in metric_entries:
+        if not isinstance(item, dict):
+            continue
+        name = item.get("name")
+        if name in REQUIRED_METRICS:
+            try:
+                by_name[str(name)] = float(item.get("current"))
+            except (TypeError, ValueError):
+                by_name[str(name)] = None
+    return {name: by_name.get(name) for name in REQUIRED_METRICS}
+
+
+def _normalize_metrics(metrics: dict[str, Any]) -> dict[str, float]:
+    normalized: dict[str, float] = {}
+    for metric_name in REQUIRED_METRICS:
+        if metric_name not in metrics:
+            raise ValueError(f"Missing required metric: {metric_name}")
+        try:
+            normalized[metric_name] = float(metrics[metric_name])
+        except (TypeError, ValueError) as exc:
+            raise ValueError(f"Invalid numeric value for metric: {metric_name}") from exc
+    return normalized
+
+
+def _render_markdown(*, verdict, exit_code, metrics, violations, run_id, report_timestamp) -> str:
+    lines = [
+        "# Data Quality Report", "",
+        "## Verdict",
+        f"**Verdict:** {verdict} (exit {exit_code})", "",
+        "## Metrics",
+        "| Metric | Current | Previous | Delta | Threshold | Passed |",
+        "| --- | ---: | ---: | ---: | ---: | ---: |",
+    ]
+    for metric in metrics:
+        previous_value = "null" if metric["previous"] is None else f"{metric['previous']:.6f}"
+        delta_value = metric["delta"]
+        if delta_value == "n/a":
+            delta_text = "n/a"
+        else:
+            delta_text = f"{delta_value * 100:.2f}%"
+        lines.append(
+            "| {name} | {current:.6f} | {previous} | {delta} | {threshold:.2%} | {passed} |".format(
+                name=metric["name"], current=metric["current"], previous=previous_value,
+                delta=delta_text, threshold=metric["threshold"],
+                passed="yes" if metric["passed"] else "no",
+            )
+        )
+    lines.append("")
+    lines.append("## Anomalies")
+    if violations:
+        lines.extend(f"- {name}" for name in violations)
+    else:
+        lines.append("- None")
+    lines.extend(["", "## Footer",
+        f"- Run ID: {run_id}", f"- Timestamp: {report_timestamp}",
+    ])
+    return "\n".join(lines) + "\n"
+
+
+def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
+    parser = argparse.ArgumentParser(description="Generate data quality report with anomaly gating.")
+    parser.add_argument("--metrics-json", required=True, help="Path to current metrics JSON file.")
+    parser.add_argument("--prior-run-json", default=str(DEFAULT_PRIOR_RUN_PATH))
+    parser.add_argument("--output-dir", default=str(DEFAULT_OUTPUT_DIR))
+    parser.add_argument("--run-id", default=None)
+    return parser.parse_args(argv)
+
+
+def _build_report_from_args(args: argparse.Namespace) -> DataQualityReport:
+    metrics = load_metrics_from_json(args.metrics_json)
+    report = run_data_quality_report(metrics, prior_run_path=args.prior_run_json, run_id=args.run_id)
+    write_data_quality_report(report, output_dir=args.output_dir)
+    return report
+
+
+def main(argv: list[str] | None = None) -> int:
+    args = parse_args(argv)
+    report = _build_report_from_args(args)
+    return report.exit_code
+
+
+if __name__ == "__main__":
+    cli_args = parse_args()
+    cli_report = _build_report_from_args(cli_args)
+    sys.exit(cli_report.exit_code)
```

```diff
diff --git a/scripts/curation/tests/test_qual_005.py b/scripts/curation/tests/test_qual_005.py
new file mode 100644
index 00000000..30601b45
--- /dev/null
+++ b/scripts/curation/tests/test_qual_005.py
@@ -0,0 +1,214 @@
+"""Tests for QUAL-005 data quality report CI gating."""
+(full test file with 6 tests: test_happy_path_all_pass, test_anomaly_triggers_fail,
+ test_no_prior_run_no_anomaly, test_all_five_metrics_present, test_json_sidecar_schema,
+ TestCLIExitCode::test_subprocess_exit_codes)
```

### Test Output

```
tests/test_qual_005.py::TestDataQualityReport::test_happy_path_all_pass PASSED
tests/test_qual_005.py::TestDataQualityReport::test_anomaly_triggers_fail PASSED
tests/test_qual_005.py::TestDataQualityReport::test_no_prior_run_no_anomaly PASSED
tests/test_qual_005.py::TestDataQualityReport::test_all_five_metrics_present PASSED
tests/test_qual_005.py::TestDataQualityReport::test_json_sidecar_schema PASSED
tests/test_qual_005.py::TestCLIExitCode::test_subprocess_exit_codes PASSED
============================== 6 passed in 0.27s ==============================
```

---

## Review Focus

1. Does `_render_markdown` produce the correct section order: Verdict -> Metrics -> Anomalies -> Footer?
2. Is the Verdict line a standalone bold line `**Verdict:** PASS (exit 0)` / `**Verdict:** FAIL (exit 1)` that is grep-able?
3. Does `run_data_quality_report` correctly compute the delta formula `abs((current - previous) / previous) > 0.10`?
4. Is the ZeroDivisionError guard present when `previous == 0.0`?
5. Does the JSON sidecar conform to the exact schema: `{ verdict, exit_code, run_id, timestamp, metrics: [{name, current, previous, delta, threshold, passed}], violations: [] }`?
6. Does the CLI entry point call `sys.exit(report.exit_code)` as the final statement?
7. Do all 6 tests cover their respective ACs with meaningful assertions?
8. Any stubs, anti-patterns, or quality issues?

## Verdict Criteria

APPROVED if:
- All 6 ACs fully pass with evidence
- Section order is correct
- Verdict line is grep-able
- Delta formula is correct
- ZeroDivisionError guard present
- JSON schema conforms
- sys.exit used in CLI
- No CRITICAL/HIGH findings

NEEDS_FIXES if:
- Any AC is PARTIAL or FAIL
- Missing ZeroDivisionError guard
- Wrong section order
- Verdict line not grep-able
- JSON schema non-conformant
- sys.exit missing or swallowed

## Response Format

Single JSON object matching **ReviewerResponse** schema. First char `{`, last char `}`. No markdown fences.

```json
{
  "type": "object",
  "required": ["verdict", "verdict_confidence", "iteration", "worktree_path", "worktree_branch", "validation_passed", "self_heal_count", "test_criteria_all_true", "test_criteria", "verification", "acceptance_criteria", "stub_findings", "task_file_updated", "notebook_entries", "summary"],
  "properties": {
    "verdict": {"enum": ["APPROVED", "NEEDS_FIXES"]},
    "verdict_confidence": {"enum": ["HIGH", "MEDIUM", "LOW"]},
    "iteration": {"type": "integer"},
    "worktree_path": {"type": "string"},
    "worktree_branch": {"type": "string"},
    "validation_passed": {"type": "boolean"},
    "self_heal_count": {"type": "integer"},
    "test_criteria_all_true": {"type": "boolean"},
    "test_criteria": {"type": "array"},
    "verification": {"type": "object"},
    "acceptance_criteria": {"type": "array", "items": {"properties": {"id": {"type": "string"}, "verdict": {"enum": ["PASS", "FAIL", "PARTIAL"]}, "evidence": {"type": "string"}, "notes": {"type": "string"}}}},
    "stub_findings": {"type": "array"},
    "task_file_updated": {"type": "boolean"},
    "notebook_entries": {"type": "array", "minItems": 1},
    "summary": {"type": "string", "minLength": 20}
  }
}
```
