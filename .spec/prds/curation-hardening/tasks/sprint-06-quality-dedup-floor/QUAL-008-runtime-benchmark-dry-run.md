# QUAL-008: Runtime Benchmark — Full Catalog Dry Run

**Task ID:** QUAL-008
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P1
**Effort:** S
**Estimate:** 30 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-01
**Depends on:** QUAL-006  |  **Blocks:** Sprint-7

---

## GOAL

Add a `--dry-run` mode to `semantic_deduplicator.py` that fetches real routes from Convex but skips all write operations (no `addRouteMatch`, no `llmReconciliationLog`, no file writes). This produces a real runtime measurement against the full 5,608-route catalog without side effects, proving whether the 15-minute budget is realistic.

## BACKGROUND

The red-hat review (2026-04-20) found that QUAL-001's runtime budget warning (`if elapsed > 900`) is structurally correct but was never tested against real data — `fetch_all_routes()` returned an empty list (now fixed by QUAL-006). Without a dry-run mode, the only way to measure full-catalog runtime is to run the real pipeline, which writes to Convex and produces side effects. A dry-run mode lets us benchmark safely.

## DELIVERABLE

- scripts/curation/pipeline/dedup/semantic_deduplicator.py (MODIFY): add `--dry-run` CLI flag and skip-writes logic
- scripts/curation/tests/test_qual_008.py (NEW): tests for dry-run mode

## DONE WHEN

- [ ] `--dry-run` CLI flag is accepted by `parse_args()`
- [ ] In dry-run mode: `fetch_all_routes()` is called (real fetch via QUAL-006)
- [ ] In dry-run mode: `_fetch_candidates()` is called (real Convex HTTP call)
- [ ] In dry-run mode: `addRouteMatch` HTTP calls are skipped (no writes to Convex)
- [ ] In dry-run mode: reconciliation log entries are skipped
- [ ] In dry-run mode: arbitration queue and calibration set files are NOT written
- [ ] Dry-run logs the same classification counts (auto-merge / arbitration / separated) as a real run
- [ ] `cd scripts/curation && python -m pytest tests/test_qual_008.py -v` passes
- [ ] Only WRITE-ALLOWED files modified

## OUT OF SCOPE

- Actually running against production Convex (that's the human test step, not an automated task)
- Performance optimization — if the benchmark shows > 15 minutes, that's a separate task
- Changes to classification logic — dry-run must produce identical counts

## CRITICAL CONSTRAINTS

**MUST:**
- Add `--dry-run` boolean flag to `parse_args()` (default: False)
- Pass `dry_run` flag through `main()` to `SemanticDeduplicator.__init__`
- Skip ALL HTTP POST calls to `addRouteMatch` when `dry_run=True`
- Skip ALL file writes (arbitration queue, calibration set) when `dry_run=True`
- Still call `fetch_all_routes()` and `_fetch_candidates()` — these are reads, not writes
- Log classification counts identically to a real run
- Log `"DRY RUN — no writes performed"` at INFO level at the start of a dry run

**NEVER:**
- Skip the fetch operations — the whole point is to measure real I/O latency
- Change the classification logic between dry-run and real modes
- Write any file or make any POST mutation in dry-run mode

**STRICTLY:**
- The dry-run elapsed time must be measured by the same wall-clock timer in `main()` — if it exceeds 900s, the same WARNING is logged

## SPECIFICATION

**Objective:** Add a side-effect-free dry-run mode to the semantic deduplicator for runtime benchmarking.

**Success state:** `python -m pipeline.dedup.semantic_deduplicator --base-url $URL --deploy-key $KEY --dry-run` fetches all routes, classifies all pairs, logs counts and elapsed time, and exits 0 without writing anything.

## ACCEPTANCE CRITERIA (TDD Beads)

### 1: Dry-run flag accepted

**GIVEN:** CLI args `["--base-url", "http://x", "--deploy-key", "k", "--dry-run"]`
**WHEN:** `parse_args()` is called
**THEN:** `args.dry_run` is `True`

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_008.py::test_dry_run_flag_accepted -v`

### 2: No writes in dry-run mode

**GIVEN:** A dedup run with 3 auto-merge pairs and `dry_run=True`
**WHEN:** `SemanticDeduplicator.run()` processes the pairs
**THEN:** No HTTP POST is made to `addRouteMatch`; no files are written; classification counts are still logged in the ledger

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_008.py::test_no_writes_in_dry_run -v`

### 3: Reads still happen in dry-run mode

**GIVEN:** A dedup run with `dry_run=True` and 5 routes in the mock catalog
**WHEN:** `run()` processes each route
**THEN:** `_fetch_candidates()` is called for each route (HTTP reads happen); classification counts match a non-dry run with the same input

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_008.py::test_reads_still_happen_dry_run -v`

### 4: Existing tests unbroken

**GIVEN:** All existing QUAL-001 tests
**WHEN:** The test suite is run
**THEN:** All tests pass without modification (default is `dry_run=False`)

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_001.py -v`

## TEST CRITERIA

1. `--dry-run` flag sets `args.dry_run = True`; absent flag defaults to `False`
2. No HTTP POST to `addRouteMatch` when `dry_run=True`
3. No file writes (arbitration, calibration) when `dry_run=True`
4. `_fetch_candidates()` is still called (reads happen) when `dry_run=True`
5. Classification counts in `DedupLedger` are identical between dry-run and real run with same input
6. `"DRY RUN"` appears in log output when dry-run is active
7. Existing test_qual_001.py tests pass unchanged

## READING LIST

- `scripts/curation/pipeline/dedup/semantic_deduplicator.py` (lines: 278-311) — `parse_args()` and `main()` to modify
- `scripts/curation/pipeline/dedup/semantic_deduplicator.py` (lines: 80-144) — `run()` method to add dry-run guards
- `scripts/curation/tests/test_qual_001.py` — existing tests that must still pass

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/dedup/semantic_deduplicator.py (MODIFY)
- scripts/curation/tests/test_qual_008.py (NEW)

### WRITE-PROHIBITED
- scripts/curation/tests/test_qual_001.py — must still pass without modification
- scripts/curation/pipeline/dedup/llm_arbitrator.py — different module
- server/convex/** — backend schema is frozen

## DESIGN

**Pattern:** Guard writes with a boolean flag passed through the constructor.

```python
class SemanticDeduplicator:
    def __init__(self, ..., dry_run: bool = False):
        self.dry_run = dry_run
        if dry_run:
            logger.info("DRY RUN — no writes performed")

    def run(self, routes):
        # ... classification logic unchanged ...
        if classification == "auto-merge" and not self.dry_run:
            self._write_route_match(winner, loser, cosine, reasoning)
            self._append_reconciliation_entry(winner)
        # counts always update:
        self.cost_ledger.auto_merged += 1

    def _write_arbitration_queue(self):
        if self.dry_run:
            return
        # ... existing write logic ...

    def emit_calibration_set(self):
        if self.dry_run:
            logger.info("DRY RUN — skipping calibration set write")
            return
        # ... existing write logic ...
```

**Anti-pattern:** Do NOT wrap the entire `run()` method in a `if not dry_run` block — the classification and counting logic must execute in both modes. Only write operations are guarded.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| New Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_008.py -v` | Exit 0 |
| Existing Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_001.py -v` | Exit 0 |
| Full Suite Pass | `cd scripts/curation && python -m pytest tests/test_qual_*.py -v` | Exit 0 |
| Scope Compliance | `git diff --name-only` | Only WRITE-ALLOWED files modified |

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Same module as QUAL-001/006, same domain.

**Review agent:** `python-review`

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** QUAL-006 (needs real `fetch_all_routes` to benchmark)

**Blocks:** Sprint-7 (E2E run needs validated runtime)

## NOTES

- The full-catalog runtime benchmark itself is a human test step (SPRINT.md step 2), not an automated gate. This task adds the mechanism; the human runs it.
- If the benchmark shows > 15 minutes, the follow-up is optimization (e.g., batch candidate fetching, parallel processing). That would be a separate task in Sprint-7.
