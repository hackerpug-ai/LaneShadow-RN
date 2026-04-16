# Epic 7: Quality Infrastructure — Coverage & Data Quality Reports

**Sequence:** 7 / 12
**Priority:** P1
**Status:** Backlog
**Estimated Effort:** 330 minutes (~5.5 hours)

---

## Overview

Add two quality reporting artifacts on top of the deduped, tier-classified catalog: (1) a coverage validation report showing state × archetype × score distributions with gap flags, and (2) a post-pipeline data quality report showing completeness, source overlap, extraction success rate, dedup merge rate, quality floor exclusion rate, plus delta reporting against the previous run. The data quality report has a CI exit code that gates the "push to production Convex" decision.

**Theme:** Run the coverage + data quality reports and get actionable quality signals. No more blind pipeline pushes — every run has a report with go/no-go.

**PRD Reference:** [S5.3, S5.4](../../05-uc-qual.md) — UC-QUAL-03, UC-QUAL-04

---

## Human Test Steps

After both tasks are complete, an administrator should be able to:

1. **Run coverage report** — Execute `python -m scripts.curation.pipeline.quality.coverage_report`. Verify it produces `coverage_report.json` and `coverage_report.md`.
2. **Inspect state breakdown** — Open markdown report. Verify it lists every US state with route count, average composite score, archetype distribution. Flag states with < 10 routes as "coverage gap".
3. **Verify tiered archetype thresholds** — Confirm common archetypes (`twisties`, `mountain`, `coastal`, `scenic_byway`) flag at < 50 routes. Niche archetypes (`adventure`, `desert`) flag at < 20 routes.
4. **Inspect score distribution histogram** — Verify histogram buckets (0-2, 2-4, 4-6, 6-8, 8-10). Verify anomaly flag if > 30% in a single bucket.
5. **Review coverage gaps** — Spot-check: Is Hawaii flagged as a gap? Is desert archetype under-populated? Note any unexpected gaps for manual follow-up.
6. **Run data quality report** — Execute `python -m scripts.curation.pipeline.quality.data_quality_report`. Verify it produces `data_quality_report.json` and `data_quality_report.md`.
7. **Inspect quality metrics** — Verify report shows: completeness %, source overlap %, extraction success rate, dedup merge rate, quality floor exclusion rate. All percentages should be populated and sensible.
8. **Verify delta reporting** — Run pipeline a second time with a small change. Run the report again. Verify it compares against the previous run and flags metrics deviating more than 10% as anomalies.
9. **Verify CI gating** — Run report with a simulated anomaly (e.g., inject a run where dedup merge rate drops by 50%). Verify script exits with code 1. Run with normal data — exits with code 0.
10. **Integrate into CI** — (Optional) Add the report as a GitHub Actions step and verify it blocks a simulated regression PR.
11. **Push to dev Convex with report gate** — Run full pipeline → reports → Convex push only if report exit code 0. Verify the workflow.

12. **Execute the Curation Review Protocol** — Run [`../CURATION-REVIEW-PROTOCOL.md`](../CURATION-REVIEW-PROTOCOL.md) end-to-end. Applicable steps NOW INCLUDE: 10 (coverage report) and 11 (data quality report) for the first time. Full steps: 1, 2, 3, 4, 6, 7, 8, 10, 11, 12. **Diff against Epic 6 baseline — catalog size stable (same dedup logic). Review coverage gaps (which states are underrepresented?). Review data quality report for anomaly flags. Verify the report IS the canonical go/no-go signal.** Write `review.md` with verdict PASS.

All 12 verifications must pass.

---

## Acceptance Criteria (Epic-Level)

- [ ] `scripts/curation/pipeline/quality/coverage_report.py` implemented
- [ ] Coverage report produces state × archetype × score histograms
- [ ] Coverage report flags states with < 10 routes as "coverage gap"
- [ ] Coverage report uses tiered archetype thresholds (common 50, niche 20)
- [ ] Coverage report flags > 30% single-bucket distribution as anomaly
- [ ] Coverage report outputs JSON + markdown
- [ ] `scripts/curation/pipeline/quality/data_quality_report.py` implemented
- [ ] Data quality report shows all 5 metrics (completeness, overlap, extraction, dedup, floor)
- [ ] Delta reporting against previous run
- [ ] 10% deviation flagged as anomaly
- [ ] Exit code 0 (clean) / 1 (anomaly) for CI gating
- [ ] Both reports can be run post-pipeline as final quality check
- [ ] Full pipeline with reports gating Convex push works end-to-end

---

## PRD Sections Covered

- **S5.3** — UC-QUAL-03 Generate Coverage Validation Report
- **S5.4** — UC-QUAL-04 Generate Post-Pipeline Data Quality Report

---

## Tasks (2 stubs)

| ID | Title | Type | Agent | Priority | Effort | Est. Min | Depends On | Blocks |
|----|-------|------|-------|----------|--------|----------|------------|--------|
| QUAL-006 | Coverage Report Generator | FEATURE | python-implement | P1 | M | 180 | QUAL-002 | INF-004 |
| QUAL-007 | Data Quality Report with CI Gate | FEATURE | python-implement | P1 | M | 150 | QUAL-002 | INF-004 |

**Total Tasks:** 2
**Total Estimated Effort:** 330 minutes (~5.5 hours)
**Parallelization:** Both can run in parallel — independent reports

---

## Dependencies

**Blocks:**
- Epic 12: Orchestrator & E2E (reports are pipeline stages)

**Depends On:**
- Epic 06: Quality Infrastructure — Dedup & Floor (reports need deduped, tiered catalog). **NOTE**: Epic 06 QUAL-002 (LLM Arbitration) must complete before these reports run — reports consume the reconciled catalog.

---

## Definition of Done

- [ ] Both task files written and merged
- [ ] Both tasks moved to `Done`
- [ ] Both reports run successfully on the post-Epic 6 catalog
- [ ] Coverage gaps identified for manual review
- [ ] Data quality report correctly flags anomalies vs clean runs
- [ ] CI exit codes verified (0 clean, 1 anomaly)
- [ ] Full pipeline end-to-end test passes with report gating
- [ ] Curation Review Protocol executed with PASS verdict
- [ ] `review.md` + coverage + data quality reports committed
- [ ] User has approved proceeding to Epic 8

---

## Notes

- Coverage report is for PIPELINE OPERATORS — not consumer-facing
- Data quality report is the SINGLE ARTIFACT used to decide "push to production" — treat it as the canonical go/no-go signal
- Delta reporting needs a stable "previous run" artifact — consider storing historical reports in a `reports/history/` directory
- The 10% deviation threshold is conservative — tune after first few runs
- Anomaly flags should be INFORMATIONAL — they don't block unless exit code is explicitly checked in CI
- Consider adding Slack/webhook notification for anomaly flags in a future epic
