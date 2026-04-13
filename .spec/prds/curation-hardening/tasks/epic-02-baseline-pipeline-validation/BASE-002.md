================================================================================
TASK: BASE-002 - Community scrapers validation — MotorcycleRoads + BestBikingRoads
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
TDD_PHASE: RED
CURRENT_AC: AC-1
PRIORITY: P0
EFFORT: S
TYPE: PROCESS
ITERATION: 1

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Verify robots.txt compliance is active by checking scraper logs for `RobotsChecker` invocations — do not assume it works without log confirmation.
MUST: Verify MotorcycleRoads JSONL has more than 50 routes and BestBikingRoads JSONL has between 10,000 and 20,000 routes before recording PASS.
MUST: Record both counts, the staging file paths, and a note on robots.txt/rate-limit behavior in `baseline-report.md`.
MUST: Run MotorcycleRoads before BestBikingRoads (MR is faster; BBR is a long-running scrape — start BBR only after MR passes).
NEVER: Bypass the rate limiter or robots.txt enforcer — scraping without rate limiting violates the sites' terms and will be caught by the base scraper class.
NEVER: Run both scrapers fully in parallel from the same IP — sequential execution is required for rate-limit compliance.
NEVER: Push scraped routes to Convex — this task ends at JSONL on disk.
STRICTLY: Limit writes to `staging/motorcycleroads.jsonl`, `staging/bestbikingroads.jsonl` (runtime output, not committed), and the community scrapers section in `baseline-report.md`.
STRICTLY: Document any scraper crash or unexpected low count as PASS WITH ISSUES rather than fabricating a PASS — escalate to user if BBR count falls below 1,000.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Execute the two existing community scrapers (`motorcycleroads.py` and `bestbikingroads.py`) against live sites, verify their output counts fall within expected ranges, confirm robots.txt compliance and rate-limit behavior are active in the logs, and record results in `baseline-report.md`.

**Success looks like:** `staging/motorcycleroads.jsonl` exists with more than 50 routes; `staging/bestbikingroads.jsonl` exists with 10,000–20,000 routes; both scrapers exited 0; scraper logs show `RobotsChecker` and rate-limit behavior; `baseline-report.md` community scrapers section is written with exact counts and log excerpts.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** Both community scrapers (`motorcycleroads.py`, `bestbikingroads.py`) have `__main__` blocks and should be runnable as-is, but they have never been executed end-to-end against live sites as part of an Epic 2 baseline run. The BBR scraper in particular is the source of ~98.8% of the catalog per the curation-hardening PRD — if it crashes or produces wildly different counts than the ~17k expected, the entire baseline assumption collapses.

**Why it matters:** BestBikingRoads is the catalog's cornerstone source. Epic 2 must prove that (a) BBR still scrapes successfully, (b) rate limits are respected, and (c) the count is in the expected 10k–20k band so dedup (Epic 6) and quality floor (Epic 6) can be planned against a real baseline. MotorcycleRoads is a smaller source but its robots.txt behavior is the canary for the scraper base class.

**Current state:** `BaseScraper` enforces robots.txt via `RobotsChecker` and applies a rate limit per instance. `motorcycleroads.py` and `bestbikingroads.py` inherit from `BaseScraper` and already have `if __name__ == "__main__":` blocks that call `asyncio.run(main())`. Expected runtimes: MR ~1–3 minutes; BBR ~30–60 minutes depending on throttle.

**Desired state:** Both scrapers have been run to completion at least once in the current environment, their counts are recorded in `baseline-report.md`, and log excerpts confirming robots.txt compliance and rate-limit behavior are attached.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: MotorcycleRoads scraper runs and produces >50 routes
  GIVEN: Network access to motorcycleroads.com is available and the scraper's robots.txt enforcer and rate limiter are active
  WHEN: `python -m scripts.curation.pipeline.sources.motorcycleroads` is executed
  THEN: staging/motorcycleroads.jsonl is written with more than 50 routes; the module exits 0; logs show rate-limit sleep events

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_motorcycleroads_scraper
  VERIFY: `python -m scripts.curation.pipeline.sources.motorcycleroads && MR_COUNT=$(wc -l < staging/motorcycleroads.jsonl | tr -d ' ') && python -c "assert int('$MR_COUNT') > 50, f'MR count $MR_COUNT <= 50'" && echo "MR PASS: $MR_COUNT routes"`

AC-2: BestBikingRoads scraper runs and produces 10k-20k routes
  GIVEN: Network access to bestbikingroads.com is available and the scraper's robots.txt enforcer and rate limiter are active
  WHEN: `python -m scripts.curation.pipeline.sources.bestbikingroads` is executed
  THEN: staging/bestbikingroads.jsonl is written with between 10,000 and 20,000 routes; the module exits 0

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_bestbikingroads_scraper
  VERIFY: `python -m scripts.curation.pipeline.sources.bestbikingroads && BBR_COUNT=$(wc -l < staging/bestbikingroads.jsonl | tr -d ' ') && python -c "assert 10000 <= int('$BBR_COUNT') <= 20000, f'BBR count $BBR_COUNT out of 10k-20k range'" && echo "BBR PASS: $BBR_COUNT routes"`

AC-3: Counts recorded in baseline-report.md
  GIVEN: Both scrapers passed ACs 1-2
  WHEN: baseline-report.md is inspected
  THEN: it contains a community scrapers section with exact counts for both MR and BBR and notes on robots.txt compliance

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — self-referential)
  TEST_FUNCTION: verify_community_section_in_report
  VERIFY: `grep -q 'motorcycleroads' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'bestbikingroads' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo 'baseline-report community section PASS'`

Quality Criteria:
- [ ] Both scrapers executed without manual intervention
- [ ] robots.txt and rate-limit behavior confirmed in logs (excerpt pasted into baseline-report.md)
- [ ] Counts recorded with absolute numbers, not percentages

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `python -m scripts.curation.pipeline.sources.motorcycleroads` exits 0 and writes staging/motorcycleroads.jsonl with more than 50 lines | AC-1 | `python -m scripts.curation.pipeline.sources.motorcycleroads && python -c "assert $(wc -l < staging/motorcycleroads.jsonl \| tr -d ' ') > 50"` | [ ] TRUE [ ] FALSE |
| 2 | `python -m scripts.curation.pipeline.sources.bestbikingroads` exits 0 and writes staging/bestbikingroads.jsonl with 10,000-20,000 lines | AC-2 | `python -m scripts.curation.pipeline.sources.bestbikingroads && BBR=$(wc -l < staging/bestbikingroads.jsonl \| tr -d ' ') && python -c "assert 10000 <= int('$BBR') <= 20000"` | [ ] TRUE [ ] FALSE |
| 3 | baseline-report.md contains the string 'motorcycleroads' in its community scrapers section | AC-3 | `grep -q 'motorcycleroads' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |
| 4 | baseline-report.md contains the string 'bestbikingroads' in its community scrapers section | AC-3 | `grep -q 'bestbikingroads' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/sources/motorcycleroads.py
   - Lines: 1-45 and the tail `__main__` block
   - Focus: `BaseScraper` inheritance, `RobotsChecker` usage, `__main__` structure — confirm output JSONL path and `asyncio.run(main())` entry point

2. scripts/curation/pipeline/sources/bestbikingroads.py
   - Lines: 1-40 and the tail `__main__` block
   - Focus: `BaseScraper` inheritance, output JSONL path, pagination approach — confirm BBR is runnable without additional flags

3. scripts/curation/pipeline/sources/base_scraper.py
   - Lines: ALL
   - Focus: Rate-limit implementation, robots.txt enforcer log messages — these are what you grep for in `baseline-report.md` to prove compliance

4. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md
   - Lines: 27-28
   - Focus: Human test steps 2-3 — expected counts MR >50, BBR ~17k

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md (APPEND — community scrapers section)

WRITE-PROHIBITED:
- scripts/curation/pipeline/sources/motorcycleroads.py — already has `__main__`, do NOT modify
- scripts/curation/pipeline/sources/bestbikingroads.py — already has `__main__`, do NOT modify
- scripts/curation/pipeline/sources/base_scraper.py — do NOT touch the base class
- staging/** — runtime output, not committed to git
- scripts/curation/pipeline/extraction/** — BASE-003 territory
- convex/** — Epic 3+ territory

MUST:
- [ ] Run MR before BBR (faster, canary)
- [ ] Capture rate-limit log excerpts in baseline-report.md
- [ ] Include both exact counts (not ranges) in the report

MUST NOT:
- [ ] Run scrapers concurrently from the same process
- [ ] Commit staging JSONL files
- [ ] Modify any scraper class

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: driving two pre-built runnable scraper modules and collecting their outputs for validation. No code changes needed — both modules are already runnable; validation is pure run-and-verify.

```bash
# Run scrapers sequentially (MR first, BBR second — rate limit compliance)
python -m scripts.curation.pipeline.sources.motorcycleroads
MR_COUNT=$(wc -l < staging/motorcycleroads.jsonl | tr -d ' ')
echo "MotorcycleRoads: $MR_COUNT routes"

python -m scripts.curation.pipeline.sources.bestbikingroads
BBR_COUNT=$(wc -l < staging/bestbikingroads.jsonl | tr -d ' ')
echo "BestBikingRoads: $BBR_COUNT routes"

# Assert both counts in expected ranges
python -c "assert int('$MR_COUNT') > 50 and 10000 <= int('$BBR_COUNT') <= 20000"
```

**Pattern source:** `.spec/prds/curation-hardening/tasks/CURATION-REVIEW-PROTOCOL.md` Step 1 verification methodology.

**Anti-pattern:** Do NOT run both scrapers concurrently from the same process — the rate limiter is per-instance and concurrent runs will violate site rate limits. Do NOT modify the scraper classes to increase concurrency. Do NOT skip the MR → BBR ordering.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## EXECUTION (no test code — INFRA validation)

### Step 1: Run MotorcycleRoads (AC-1)
  DO: `python -m scripts.curation.pipeline.sources.motorcycleroads`
  CAPTURE: stdout, stderr, exit code, wc -l of staging/motorcycleroads.jsonl
  GREP: logs for `RobotsChecker` and rate-limit sleep messages — paste excerpts into baseline-report.md

### Step 2: Run BestBikingRoads (AC-2)
  DO: `python -m scripts.curation.pipeline.sources.bestbikingroads` (long-running, ~30-60min)
  CAPTURE: stdout, stderr, exit code, wc -l of staging/bestbikingroads.jsonl
  VERIFY: BBR_COUNT in [10000, 20000]

### Step 3: Write baseline-report.md section (AC-3)
  WRITE: Community scrapers section with both counts, log excerpts, and a note on rate-limit compliance
  VERIFY: grep confirms both 'motorcycleroads' and 'bestbikingroads' present

## AFTER ALL ACs COMPLETE:
  Orchestrator re-runs the VERIFY commands and confirms all 4 boolean statements are TRUE.

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER AC-1 (MR run):
  RUN: the AC-1 VERIFY command
  EXPECT: "MR PASS: N routes" with N > 50

AFTER AC-2 (BBR run):
  RUN: the AC-2 VERIFY command
  EXPECT: "BBR PASS: N routes" with N in [10000, 20000]
  IF FAIL (count out of range): Investigate — may be a rate-limit drop, site structure change, or Boy Scout opportunity. Do NOT widen the range.

AFTER AC-3 (report section):
  RUN: the AC-3 VERIFY command
  EXPECT: "baseline-report community section PASS"

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Python scraper runtime validation; python-implement owns `scripts/curation/pipeline/sources/`. No code changes needed in the scrapers themselves.

**Review Agent:** python-review
**Rationale:** Confirms no scraper modifications were made and baseline-report.md correctly documents the results.

**Assignment Date:** 2026-04-12

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: MR scraper exits 0
  Command: `python -m scripts.curation.pipeline.sources.motorcycleroads`
  Expected: Exit code 0

Gate 2: MR count > 50
  Command: `MR=$(wc -l < staging/motorcycleroads.jsonl | tr -d ' ') && python -c "assert int('$MR') > 50" && echo PASS`
  Expected: PASS

Gate 3: BBR scraper exits 0
  Command: `python -m scripts.curation.pipeline.sources.bestbikingroads`
  Expected: Exit code 0

Gate 4: BBR count in range
  Command: `BBR=$(wc -l < staging/bestbikingroads.jsonl | tr -d ' ') && python -c "assert 10000 <= int('$BBR') <= 20000" && echo PASS`
  Expected: PASS

Gate 5: Scope Compliance
  Command: `git diff --name-only`
  Expected: Only baseline-report.md modified (no scraper source files)

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA adaptation):
- [ ] Both ACs produced PASS output recorded in baseline-report.md
- [ ] Log excerpts prove robots.txt and rate-limit active

Code Quality:
- [ ] No modifications to scraper modules
- [ ] No staging files committed

Domain-Specific:
- [ ] BBR count in [10000, 20000] — flag if near edges for Epic 6 dedup planning
- [ ] MR count documented for dedup overlap analysis in Epic 6

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- VAL-004 — Convex dev deployment gate (epic-level dependency)

Blocks:
- BASE-008 — Curation Review Protocol step 1 requires community scraper counts for `source_counts.json`

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] VAL-004 — Convex dev deployment validated (REQUIRED)
- [ ] Network access to motorcycleroads.com and bestbikingroads.com

Can Execute In Parallel With: BASE-001 (FHWA — no shared files)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- BBR is the single longest scrape in Epic 2 (~30-60 minutes). Budget accordingly.
- If BBR count comes in below 10,000, investigate the scraper before widening the range — the site may have changed structure, in which case a Boy Scout fix to the scraper logic is required.
- MotorcycleRoads is the canary for the `BaseScraper` robots.txt enforcer — if MR fails robots.txt, BBR will likely fail too.
- This task was extracted from the archived BASE-001.md (the 240-minute single task) during the Epic 2 decomposition on 2026-04-12.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
