# QUAL-004: Coverage Validation Report

**Task ID:** QUAL-004
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P1
**Effort:** M
**Estimate:** 180 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-03
**Depends on:** QUAL-003  |  **Blocks:** Sprint-7, QUAL-005

---

## GOAL

Produce a dated markdown coverage report and JSON sidecar that surfaces per-state, per-archetype, and composite-score-histogram gaps so curators know exactly where the catalog is thin.

## DELIVERABLE

- scripts/curation/pipeline/quality/coverage_report.py (NEW): report builder module — reads curated_routes, computes gap tables, histogram, emits baseline/coverage-report-{YYYY-MM-DD}.md and baseline/coverage-report.json
- scripts/curation/tests/test_qual_004.py (NEW): pytest suite covering all ACs via in-memory Route fixtures
- baseline/coverage-report-{YYYY-MM-DD}.md (NEW at runtime): dated markdown artifact
- baseline/coverage-report.md (NEW at runtime): symlink to latest dated report
- baseline/coverage-report.json (NEW at runtime): structured JSON sidecar

## DONE WHEN

- [ ] coverage_report.py accepts a list of Route dataclass instances and emits both markdown and JSON to baseline/
- [ ] Per-state table lists route count; states with < 10 routes are in the Coverage Gaps section
- [ ] Per-archetype table applies tiered thresholds: common archetypes (twisties, mountain, coastal, scenic_byway) flagged at < 50; niche archetypes (adventure, desert) flagged at < 20
- [ ] Composite-score histogram covers five buckets: 0-2, 2-4, 4-6, 6-8, 8-10; distribution anomaly flag fires when any bucket holds > 30% of routes
- [ ] Markdown section order: Summary -> Per-state table -> Per-archetype table -> Score histogram -> Coverage Gaps
- [ ] Histogram rendered as ASCII bar chart with no external image dependencies
- [ ] Dated file baseline/coverage-report-{YYYY-MM-DD}.md exists; baseline/coverage-report.md symlink points to it
- [ ] cd scripts/curation && python -m pytest tests/test_qual_004.py -v passes (exit 0)
- [ ] Only write-allowed files are modified (scope check via git diff --name-only)

## OUT OF SCOPE

- Writing routes back to Convex or mutating any curated_routes document
- Dedup or floor-filter logic (owned by QUAL-001/002/003)
- HTML or image-based report rendering
- Scheduling or cron setup for recurring report runs
- Any CI exit-code gating (that is QUAL-005's responsibility)

## CRITICAL CONSTRAINTS

**MUST:**
- Render the histogram as an ASCII bar chart — no PNG, SVG, or external image references
- Emit both .md and .json to baseline/ at repo root, not inside scripts/curation/
- Create the coverage-report.md symlink pointing to the latest dated file
- Apply tiered archetype thresholds exactly as specified: common < 50, niche < 20
- All tests must use in-memory Route fixture lists; zero real Convex HTTP calls

**NEVER:**
- Never write to convex/** or any Convex schema file
- Never modify scripts/curation/pipeline/dedup/** or floor_filter.py
- Never embed external images or base64 blobs in the markdown output
- Never hardcode today's date — derive it from datetime.date.today() at runtime
- Never issue HTTP requests in tests — mock via unittest.mock or responses library

**STRICTLY:**
- Section order in markdown is non-negotiable: Summary -> Per-state -> Per-archetype -> Histogram -> Coverage Gaps
- GFM pipe tables must right-align numeric columns with ---:
- Coverage Gaps section lists only items below threshold — do not repeat passing items there

## SPECIFICATION

**Objective:** Build a standalone Python module that ingests a list of curated Route objects, computes coverage statistics, and writes a dated GFM markdown report plus a JSON sidecar to baseline/. The report must be fully readable in a git diff, use ASCII art for the histogram, and flag gaps using the tiered archetype thresholds defined in UC-QUAL-03.

**Success state:** A curator can run `python -m pipeline.quality.coverage_report` after QUAL-003 completes, open baseline/coverage-report.md in any markdown viewer, immediately see which states and archetypes are below threshold, and confirm the histogram shows no bucket holding more than 30% of routes — or see a clear anomaly warning if one does. The JSON sidecar carries the same data for downstream automation.

## ACCEPTANCE CRITERIA (TDD Beads)

Each AC is a RED → GREEN → REFACTOR micro-cycle. Orchestrator advances through ACs sequentially.

### AC-1: State coverage gap detection

**GIVEN:** A fixture list containing 12 routes in 'California', 8 routes in 'Nevada', and 15 routes in 'Oregon'
**WHEN:** generate_coverage_report(routes) is called
**THEN:** The returned report object marks 'Nevada' as a coverage gap (< 10 routes) and does NOT mark 'California' or 'Oregon' as gaps; the Coverage Gaps section of the emitted markdown contains 'Nevada' and excludes the other two states

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_004.py::TestStateCoverage::test_state_gap_detection -v`
- **Test file:** `scripts/curation/tests/test_qual_004.py`
- **Test function:** `TestStateCoverage::test_state_gap_detection`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-2: Tiered archetype threshold — common archetypes

**GIVEN:** A fixture list containing 45 routes with archetype 'twisties', 60 routes with archetype 'mountain', 30 routes with archetype 'coastal', and 55 routes with archetype 'scenic_byway'
**WHEN:** generate_coverage_report(routes) is called
**THEN:** 'twisties' (45 < 50) and 'coastal' (30 < 50) are flagged as gaps; 'mountain' and 'scenic_byway' are not; the Coverage Gaps section lists both gap archetypes

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_004.py::TestArchetypeCoverage::test_common_archetype_threshold -v`
- **Test file:** `scripts/curation/tests/test_qual_004.py`
- **Test function:** `TestArchetypeCoverage::test_common_archetype_threshold`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-3: Tiered archetype threshold — niche archetypes

**GIVEN:** A fixture list containing 15 routes with archetype 'adventure' and 25 routes with archetype 'desert'
**WHEN:** generate_coverage_report(routes) is called
**THEN:** 'adventure' (15 < 20) is flagged as a gap; 'desert' (25 >= 20) is not flagged; the threshold applied for niche archetypes is 20, not 50

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_004.py::TestArchetypeCoverage::test_niche_archetype_threshold -v`
- **Test file:** `scripts/curation/tests/test_qual_004.py`
- **Test function:** `TestArchetypeCoverage::test_niche_archetype_threshold`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-4: Composite-score histogram bucket counts

**GIVEN:** A fixture list of 20 routes with composite_score values distributed across all five buckets: 3 in [0,2), 5 in [2,4), 6 in [4,6), 4 in [6,8), 2 in [8,10]
**WHEN:** generate_coverage_report(routes) is called
**THEN:** The report's histogram field contains exactly {'0-2': 3, '2-4': 5, '4-6': 6, '6-8': 4, '8-10': 2}; the markdown ASCII bar chart renders all five buckets with bar lengths proportional to count

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_004.py::TestHistogram::test_bucket_counts -v`
- **Test file:** `scripts/curation/tests/test_qual_004.py`
- **Test function:** `TestHistogram::test_bucket_counts`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-5: Distribution anomaly flag when one bucket exceeds 30%

**GIVEN:** A fixture list of 20 routes where 8 routes (40%) have composite_score in [4,6)
**WHEN:** generate_coverage_report(routes) is called
**THEN:** report.distribution_anomaly is True; the Summary section of the markdown contains a line flagging that bucket '4-6' holds 40% of routes (> 30% threshold)

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_004.py::TestHistogram::test_distribution_anomaly_flag -v`
- **Test file:** `scripts/curation/tests/test_qual_004.py`
- **Test function:** `TestHistogram::test_distribution_anomaly_flag`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### AC-6: Dual output — markdown file and JSON sidecar written to baseline/

**GIVEN:** A minimal fixture list of 5 routes and a tmp_path for output
**WHEN:** write_coverage_report(routes, output_dir=tmp_path, date='2026-04-18') is called
**THEN:** tmp_path/coverage-report-2026-04-18.md exists and contains GFM pipe tables with right-aligned numeric columns; tmp_path/coverage-report.md is a symlink to coverage-report-2026-04-18.md; tmp_path/coverage-report.json exists, is valid JSON, and contains keys: generated_at, state_coverage, archetype_coverage, histogram, coverage_gaps, distribution_anomaly

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_004.py::TestOutputArtifacts::test_dual_output_files -v`
- **Test file:** `scripts/curation/tests/test_qual_004.py`
- **Test function:** `TestOutputArtifacts::test_dual_output_files`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

## TEST CRITERIA

Boolean statements that map 1:1 to acceptance criteria. No conditional language.

1. States with fewer than 10 routes are present in report.coverage_gaps['states'] and in the markdown Coverage Gaps section
2. Common archetypes (twisties, mountain, coastal, scenic_byway) with fewer than 50 routes are flagged as gaps; niche archetypes (adventure, desert) with fewer than 20 routes are flagged as gaps
3. Histogram dict keys are exactly ['0-2', '2-4', '4-6', '6-8', '8-10'] with correct integer counts summing to total route count
4. report.distribution_anomaly is True when any histogram bucket percentage exceeds 0.30, False otherwise
5. Both baseline/coverage-report-{date}.md and baseline/coverage-report.json are created; coverage-report.md symlink resolves to the dated file

## READING LIST

- `scripts/curation/pipeline/embed/batch_embed_routes.py` (lines: ALL) — CLI module pattern to replicate for argument parsing and output path handling
- `scripts/curation/pipeline/models.py` (lines: ALL) — Route dataclass fields: state, archetype, composite_score, qualityTier, description, sourceRefs
- `scripts/curation/tests/test_inf004_embed.py` (lines: ALL) — MagicMock and fixture patterns used in this test suite
- `.spec/prds/curation-hardening/05-uc-qual.md` (lines: ALL) — UC-QUAL-03 acceptance criteria source and threshold definitions
- `scripts/curation/tests/conftest.py` (lines: ALL) — Shared fixtures and pytest configuration

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/quality/coverage_report.py
- scripts/curation/tests/test_qual_004.py
- baseline/coverage-report*.md
- baseline/coverage-report.json

### WRITE-PROHIBITED
- convex/**
- scripts/curation/pipeline/dedup/**
- scripts/curation/pipeline/quality/floor_filter.py
- scripts/curation/pipeline/quality/data_quality_report.py
- react-native/**
- Any file not explicitly listed in write_allowed

## DESIGN

**References:**
- SPRINT.md
- .spec/prds/curation-hardening/tasks/epic-03-foundation-models-schema/EPIC.md
- .spec/prds/curation-hardening/05-uc-qual.md#UC-QUAL-03

**Interaction notes:**
- Section order is non-negotiable: Summary -> Per-state table -> Per-archetype table -> Score histogram -> Coverage Gaps
- GFM pipe tables; numeric columns right-aligned with ---:
- Histogram rendered as ASCII bar chart (no external image deps, git-friendly)
- Summary rendered as bullet list (grep-able)
- Filename: coverage-report-{YYYY-MM-DD}.md with coverage-report.md symlink to latest
- Coverage Gaps section only lists states/archetypes below threshold — passing items must not appear there
- Section ordering: Summary -> Per-state table -> Per-archetype table -> Score distribution histogram -> Gap callouts
- Tables use GFM pipe syntax; numeric cells right-aligned with ---:
- Summary uses bullet list (not prose) so key numbers are grep-able
- Gap callouts section lists ONLY states/archetypes below threshold

**Pattern (reference):**

```python
class CoverageReportBuilder:
    def __init__(self, routes: list[Route]) -> None:
        self.routes = routes

    def compute(self) -> CoverageReport:
        state_counts = Counter(r.state for r in self.routes)
        archetype_counts = Counter(r.archetype for r in self.routes)
        histogram = self._bucket_scores()
        gaps = self._detect_gaps(state_counts, archetype_counts)
        anomaly = any(v / len(self.routes) > 0.30 for v in histogram.values())
        return CoverageReport(
            state_coverage=dict(state_counts),
            archetype_coverage=dict(archetype_counts),
            histogram=histogram,
            coverage_gaps=gaps,
            distribution_anomaly=anomaly,
        )
```

**Pattern source:** `scripts/curation/pipeline/embed/batch_embed_routes.py`

**Anti-pattern:** Don't embed PNG / external images in markdown — report must be git-diff friendly. Don't include passing archetypes or states in the Coverage Gaps section — only items below threshold belong there.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| All Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_004.py -v` | Exit 0, all 6 test functions collected and passed |
| Full Suite No Regression | `cd scripts/curation && python -m pytest tests/ -v` | Exit 0, no previously-passing tests broken |
| Report Artifact Exists | `test -f baseline/coverage-report.md && test -f baseline/coverage-report.json` | Exit 0 (both files present after a dry-run invocation against fixture data) |
| Scope Compliance | `git diff --name-only` | Only files in write_allowed list are modified |

## AGENT INSTRUCTIONS

Follow strict RED -> GREEN -> REFACTOR per AC. Write each test in test_qual_004.py first and confirm it fails before writing any production code. Use in-memory Route fixture lists — never instantiate real Convex HTTP calls; patch any fetch helpers via unittest.mock.patch. The CoverageReportBuilder.write() method accepts an output_dir: Path argument so tests can pass pytest's tmp_path fixture instead of writing to the real baseline/ directory. Implement COMMON_ARCHETYPES and NICHE_ARCHETYPES as module-level frozensets so threshold logic is testable in isolation. Histogram bucket boundaries are half-open [low, high) except the last bucket [8, 10] which is closed. After all tests are green, run the full test suite to confirm no regressions, then commit.

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Generates a data-analysis report over curated_routes; pure Python with no mobile/backend surface area. Requires pytest TDD, markdown generation, and JSON serialization matching existing pipeline patterns.

**Review agent:** `python-review`
**Rationale:** Domain-specific reviewer for Python curation pipeline — validates TDD evidence, scope compliance, and anti-pattern adherence with fresh context.

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** QUAL-003

## NOTES

- The symlink creation must use os.symlink or Path.symlink_to — not a file copy — so baseline/coverage-report.md always points at the newest dated file without duplicating content.
- ASCII bar chart width should be capped at 40 characters max bar length to stay readable in 80-column terminals and GitHub PR diffs.
- The JSON sidecar key names must be stable across runs (no auto-generated keys) because QUAL-005 will parse it for delta reporting.
- datetime.date.today() must be called at report-write time, not at module import time, to avoid stale dates in long-running pipelines.
