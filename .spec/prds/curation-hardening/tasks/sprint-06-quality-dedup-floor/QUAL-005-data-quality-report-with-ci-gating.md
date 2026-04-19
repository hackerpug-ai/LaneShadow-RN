# QUAL-005: Data Quality Report with CI Gating

**Task ID:** QUAL-005
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P1
**Effort:** M
**Estimate:** 180 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-04
**Depends on:** QUAL-004  |  **Blocks:** Sprint-12

---

## GOAL

Produce a post-pipeline markdown report and machine-parseable JSON sidecar that compares current pipeline metrics against the previous run, flags any metric deviating more than 10% as an anomaly, and exits non-zero to block Sprint-12 orchestration when anomalies are present.

## DELIVERABLE

- scripts/curation/pipeline/quality/data_quality_report.py (NEW): report builder + CLI entry point; computes 5 core metrics, diffs against prior run snapshot, emits markdown + JSON sidecar, exits 0 (PASS) or 1 (anomaly FAIL)
- scripts/curation/tests/test_qual_005.py (NEW): pytest suite covering all ACs including subprocess exit-code assertions
- baseline/data-quality-report.md (NEW at runtime): markdown report with grep-able Verdict line
- baseline/data-quality-report.json (NEW at runtime): JSON sidecar conforming to the machine-parseable schema

## DONE WHEN

- [ ] data_quality_report.py computes all five metrics: completeness %, source overlap %, extraction success rate, dedup merge rate, quality floor exclusion rate
- [ ] When a prior baseline/data-quality-report.json exists, delta column shows signed absolute value and percentage; when no prior run exists, delta shows 'n/a'
- [ ] Any metric deviating > 10% from previous run triggers anomaly flag; report exits with code 1 and Verdict line reads **Verdict:** FAIL (exit 1)
- [ ] When all metrics are within threshold, script exits 0 and Verdict line reads **Verdict:** PASS (exit 0)
- [ ] Markdown section order is: Verdict -> Metrics -> Anomalies -> Footer
- [ ] Verdict line is a standalone bold line at the top of the report, grep-able as `**Verdict:**`
- [ ] JSON sidecar conforms exactly to schema: { verdict, exit_code, run_id, timestamp, metrics: [{name, current, previous, delta, threshold, passed}], violations: [] }
- [ ] cd scripts/curation && python -m pytest tests/test_qual_005.py -v passes (exit 0)
- [ ] Only write-allowed files are modified (scope check via git diff --name-only)

## OUT OF SCOPE

- Coverage gap analysis by state or archetype (owned by QUAL-004)
- Dedup or floor-filter execution (owned by QUAL-001/002/003)
- Alerting, email, or Slack notification on anomaly — exit code is the only signal
- Purging or rotating old report files — the script always overwrites baseline/data-quality-report.md and .json
- Defining what constitutes a 'good' threshold beyond the 10% deviation rule specified in UC-QUAL-04

## CRITICAL CONSTRAINTS

**MUST:**
- The script's process exit code IS the CI gate: exit 0 on PASS, exit 1 on any anomaly — no exceptions
- The Verdict line must be exactly `**Verdict:** PASS (exit 0)` or `**Verdict:** FAIL (exit 1)` as a standalone bold line at the very top of the Verdict section so CI log scrapers can grep for it
- JSON sidecar must conform to the exact schema: { verdict, exit_code, run_id, timestamp, metrics: [{name, current, previous, delta, threshold, passed}], violations: [] }
- Delta comparison must read the prior run from baseline/data-quality-report.json; if file is absent, all delta values are the string 'n/a' and no anomalies are raised
- All five metrics must appear in the Metrics table: completeness %, source overlap %, extraction success rate, dedup merge rate, quality floor exclusion rate

**NEVER:**
- Never swallow the exit code — always call sys.exit(report.exit_code) as the final statement of the CLI entry point
- Never write to server/convex/** or any Convex schema file
- Never modify scripts/curation/pipeline/dedup/** or floor_filter.py
- Never issue real HTTP requests in tests — mock all Convex reads via unittest.mock or responses library
- Never bury the Verdict in narrative prose — it must be a standalone grep-able bold line

**STRICTLY:**
- Markdown section order is non-negotiable: Verdict -> Metrics -> Anomalies -> Footer
- The 10% deviation threshold is applied as abs((current - previous) / previous) > 0.10 — document this formula in a module-level docstring
- run_id in JSON sidecar must be a stable deterministic identifier (e.g., ISO timestamp string) present in both the markdown header and the JSON root

## SPECIFICATION

**Objective:** Build a CLI-invocable Python module that reads pipeline metric inputs (or derives them from curated_routes and route_matches), computes five quality metrics, loads the previous run's JSON sidecar for delta comparison, emits a markdown report with a grep-able Verdict line and a machine-parseable JSON sidecar, and exits with a process code of 0 (PASS) or 1 (FAIL) so CI orchestration for Sprint-12 can gate on its result.

**Success state:** After a pipeline run, a CI step invokes `python -m pipeline.quality.data_quality_report`; if all metrics are within 10% of the previous run the step passes (exit 0); if any metric deviates more than 10%, the step fails (exit 1) and the Verdict line in baseline/data-quality-report.md reads `**Verdict:** FAIL (exit 1)`. A developer can diff the JSON sidecars between two runs to see exactly which metrics moved and by how much. Sprint-12's orchestrator checks this exit code before proceeding.

## ACCEPTANCE CRITERIA (TDD Beads)

Each AC is a RED → GREEN → REFACTOR micro-cycle. Orchestrator advances through ACs sequentially.

### AC-1: Happy-path: all metrics within threshold — exit 0, PASS verdict

**GIVEN:** A fixture set of pipeline metrics where all five values are within 5% of a prior-run JSON snapshot loaded from a tmp_path fixture file
**WHEN:** run_data_quality_report(metrics, prior_run_path=snapshot_path) is called
**THEN:** report.verdict == 'PASS', report.exit_code == 0, report.violations == [], and the emitted markdown Verdict section contains exactly the line '**Verdict:** PASS (exit 0)'

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_005.py::TestDataQualityReport::test_happy_path_all_pass -v`
- **Test file:** `scripts/curation/tests/test_qual_005.py`
- **Test function:** `TestDataQualityReport::test_happy_path_all_pass`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-2: Anomaly path: metric deviates > 10% — exit 1, FAIL verdict

**GIVEN:** A fixture set where completeness % is 0.72 in the current run and 0.90 in the prior snapshot (delta = -20%, exceeding the 10% threshold)
**WHEN:** run_data_quality_report(metrics, prior_run_path=snapshot_path) is called
**THEN:** report.verdict == 'FAIL', report.exit_code == 1, report.violations contains an entry referencing 'completeness', and the markdown Verdict section reads '**Verdict:** FAIL (exit 1)'

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_005.py::TestDataQualityReport::test_anomaly_triggers_fail -v`
- **Test file:** `scripts/curation/tests/test_qual_005.py`
- **Test function:** `TestDataQualityReport::test_anomaly_triggers_fail`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-3: No prior run — delta shows 'n/a', no anomalies raised, exit 0

**GIVEN:** A fixture set of pipeline metrics and prior_run_path pointing to a non-existent file
**WHEN:** run_data_quality_report(metrics, prior_run_path=missing_path) is called
**THEN:** report.exit_code == 0, report.violations == [], every entry in report.metrics has delta == 'n/a', and the JSON sidecar metrics array shows previous == null for all entries

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_005.py::TestDataQualityReport::test_no_prior_run_no_anomaly -v`
- **Test file:** `scripts/curation/tests/test_qual_005.py`
- **Test function:** `TestDataQualityReport::test_no_prior_run_no_anomaly`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-4: All five metrics present in Metrics table and JSON sidecar

**GIVEN:** Any fixture metric set with valid values for all five metrics
**WHEN:** run_data_quality_report(metrics, prior_run_path=any_path) is called
**THEN:** report.metrics contains exactly five entries with names: 'completeness_pct', 'source_overlap_pct', 'extraction_success_rate', 'dedup_merge_rate', 'quality_floor_exclusion_rate'; the markdown Metrics table contains all five rows; the JSON sidecar metrics array has exactly five objects each with keys: name, current, previous, delta, threshold, passed

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_005.py::TestDataQualityReport::test_all_five_metrics_present -v`
- **Test file:** `scripts/curation/tests/test_qual_005.py`
- **Test function:** `TestDataQualityReport::test_all_five_metrics_present`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-5: JSON sidecar conforms to exact machine-parseable schema

**GIVEN:** A fixture metric set with one anomaly and a valid prior-run snapshot
**WHEN:** write_data_quality_report(report, output_dir=tmp_path) is called
**THEN:** tmp_path/data-quality-report.json is valid JSON; parsed object has top-level keys: verdict (str), exit_code (int), run_id (str), timestamp (str), metrics (list), violations (list); each metrics entry has keys: name, current, previous, delta, threshold, passed; violations list contains the anomalous metric name

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_005.py::TestDataQualityReport::test_json_sidecar_schema -v`
- **Test file:** `scripts/curation/tests/test_qual_005.py`
- **Test function:** `TestDataQualityReport::test_json_sidecar_schema`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-6: CLI entry point exits with correct process exit code (subprocess-level assertion)

**GIVEN:** The module invoked via subprocess as `python -m pipeline.quality.data_quality_report` with fixture data injected via environment variable or temp config pointing to a passing metric set, then re-invoked with an anomaly metric set
**WHEN:** subprocess.run([sys.executable, '-m', 'pipeline.quality.data_quality_report', ...]) is called for both passing and failing fixtures
**THEN:** returncode == 0 for the passing fixture; returncode == 1 for the anomaly fixture — verified at the OS process level, not just the Python return value

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_005.py::TestCLIExitCode::test_subprocess_exit_codes -v`
- **Test file:** `scripts/curation/tests/test_qual_005.py`
- **Test function:** `TestCLIExitCode::test_subprocess_exit_codes`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

## TEST CRITERIA

Boolean statements that map 1:1 to acceptance criteria. No conditional language.

1. When all metrics are within 10% of prior run, report.exit_code == 0 and report.verdict == 'PASS'
2. When any metric deviates more than 10% from prior run, report.exit_code == 1 and report.violations is non-empty
3. When no prior run JSON exists, all delta values are the string 'n/a' and exit_code == 0
4. report.metrics contains exactly five entries with the canonical metric names; JSON sidecar conforms to the specified schema with all required keys
5. subprocess.run(...).returncode == 0 for passing fixture and == 1 for anomaly fixture at OS process level

## READING LIST

- `scripts/curation/pipeline/embed/batch_embed_routes.py` (lines: ALL) — CLI pattern with argparse and sys.exit() to replicate for the module entry point
- `scripts/curation/pipeline/models.py` (lines: ALL) — Route and related dataclass fields needed to derive metrics from curated_routes
- `scripts/curation/tests/test_inf004_embed.py` (lines: ALL) — subprocess and MagicMock test patterns in use in this suite
- `.spec/prds/curation-hardening/05-uc-qual.md` (lines: ALL) — UC-QUAL-04 metric definitions, threshold rules, and CI gate specification
- `baseline/data-quality-report.json` (lines: ALL) — Prior run snapshot schema (written by this module; read by subsequent runs for delta comparison)

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/quality/data_quality_report.py
- scripts/curation/tests/test_qual_005.py
- baseline/data-quality-report.md
- baseline/data-quality-report.json

### WRITE-PROHIBITED
- server/convex/**
- scripts/curation/pipeline/dedup/**
- scripts/curation/pipeline/quality/floor_filter.py
- scripts/curation/pipeline/quality/coverage_report.py
- react-native/**
- Any file not explicitly listed in write_allowed

## DESIGN

**References:**
- SPRINT.md
- .spec/prds/curation-hardening/05-uc-qual.md#UC-QUAL-04

**Interaction notes:**
- Section order is non-negotiable: Verdict (top) -> Metrics -> Anomalies -> Footer
- Verdict MUST be a standalone bold line `**Verdict:** PASS (exit 0)` — grep-able for CI
- Threshold violations flagged with checkmark/warning/cross symbols in Status column
- Delta column shows sign + absolute + optional percentage
- JSON sidecar (data-quality-report.json) carries machine-parseable: { verdict, exit_code, run_id, timestamp, metrics: [{name, current, previous, delta, threshold, passed}], violations: [] }
- Run ID in both header and JSON
- If no prior run, delta column shows 'n/a'
- Section ordering: Verdict (PASS/FAIL + exit code) -> Metrics -> Anomalies -> Footer
- Verdict MUST be standalone bold line `**Verdict:** PASS (exit 0)` — grep-able for CI
- Threshold violations flagged with checkmark/warning/cross markers in Status column
- Delta column shows sign (+/-) + absolute + optional percentage
- JSON sidecar schema: { verdict, exit_code, run_id, timestamp, metrics[], violations[] }
- Run ID in both markdown header and JSON root

**Pattern (reference):**

```python
class DataQualityReportBuilder:
    THRESHOLD = 0.10  # abs((current - prior) / prior) > THRESHOLD => anomaly

    def compute(self) -> DataQualityReport:
        rows = []
        violations = []
        for name, current in self.metrics.as_dict().items():
            previous = self.prior.metric_value(name) if self.prior else None
            delta = self._delta(current, previous)
            passed = delta == 'n/a' or abs(delta['ratio']) <= self.THRESHOLD
            if not passed:
                violations.append(name)
            rows.append(MetricRow(name=name, current=current, previous=previous,
                                   delta=delta, threshold=self.THRESHOLD, passed=passed))
        exit_code = 1 if violations else 0
        return DataQualityReport(verdict='PASS' if exit_code == 0 else 'FAIL',
                                  exit_code=exit_code, run_id=datetime.utcnow().isoformat(),
                                  timestamp=datetime.utcnow().isoformat(),
                                  metrics=rows, violations=violations)

if __name__ == '__main__':
    prior = load_prior_report(BASELINE_DIR / 'data-quality-report.json')
    report = DataQualityReportBuilder(collect_metrics(), prior).compute()
    write_data_quality_report(report, BASELINE_DIR)
    sys.exit(report.exit_code)
```

**Pattern source:** `scripts/curation/pipeline/embed/batch_embed_routes.py`

**Anti-pattern:** Don't bury the verdict in narrative prose — CI log scrapers need a grep-able bold line. Don't catch SystemExit or swallow sys.exit() — the exit code IS the CI gate and must propagate to the OS process.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| All Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_005.py -v` | Exit 0, all 6 test functions collected and passed |
| Full Suite No Regression | `cd scripts/curation && python -m pytest tests/ -v` | Exit 0, no previously-passing tests broken |
| Report Artifact Exists | `test -f baseline/data-quality-report.md && test -f baseline/data-quality-report.json` | Exit 0 (both files present after a dry-run invocation against fixture data) |
| CI Exit Code — PASS scenario | `cd scripts/curation && python -m pipeline.quality.data_quality_report --fixture pass && echo EXIT_PASS \|\| echo EXIT_FAIL` | EXIT_PASS (process returns 0 when all metrics within threshold) |
| CI Exit Code — FAIL scenario | `cd scripts/curation && python -m pipeline.quality.data_quality_report --fixture anomaly; echo "RC=$?"` | RC=1 (process returns 1 when any metric deviates > 10%) |
| Scope Compliance | `git diff --name-only` | Only files in write_allowed list are modified |

## AGENT INSTRUCTIONS

Follow strict RED -> GREEN -> REFACTOR per AC. Write each test in test_qual_005.py first and confirm it fails before writing production code. The subprocess exit-code test (AC-6) must use subprocess.run with check=False and assert on returncode directly — do not use pytest.raises(SystemExit). Provide a --fixture {pass|anomaly} CLI argument to allow test-time injection of synthetic metrics without requiring real Convex reads; this makes the subprocess test hermetic. Mock any Convex HTTP calls via unittest.mock.patch for unit tests. The delta formula is abs((current - previous) / previous) > 0.10 — document this in a module-level docstring. The 'n/a' case occurs when previous is None (no prior run file); return the string 'n/a' for delta in that case, not 0.0. After all tests are green, run the full test suite, confirm no regressions, then commit.

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Generates a comprehensive post-pipeline QA report with delta comparison and a process exit code that functions as a CI gate. Pure Python; requires subprocess-testable exit codes, JSON sidecar schema conformance, and TDD with mocked Convex reads.

**Review agent:** `python-review`
**Rationale:** Domain-specific reviewer for Python curation pipeline — validates TDD evidence, scope compliance, and anti-pattern adherence with fresh context.

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** QUAL-004

## NOTES

- The JSON sidecar is both an output artifact for human review AND the prior-run snapshot read by the next invocation — the module overwrites baseline/data-quality-report.json on every run, so the file always reflects the most recent execution.
- Sprint-12 orchestration gates on this script's exit code; any change to exit-code semantics requires Sprint-12 to be notified — document in DECISIONS.md if the threshold or metric set changes.
- The delta formula divides by previous; guard against ZeroDivisionError when previous == 0.0 by treating it as 'n/a' (no meaningful percent change from zero).
- run_id should be a UTC ISO-8601 timestamp string generated once at report-compute time and reused in both the markdown header and the JSON root — not regenerated separately for each.
