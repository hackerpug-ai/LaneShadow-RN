================================================================================
TASK: BASE-001 - FHWA source validation + Boy Scout __main__ entry point
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

MUST: Add a `__main__` block to `scripts/curation/pipeline/sources/fhwa.py` (Boy Scout fix) that accepts an optional CSV path argument, calls `parse_fhwa_csv()`, writes `staging/fhwa.jsonl`, and prints the route count — commit this fix separately with the rationale "Epic 2 baseline validation required runnable entry point — Boy Scout fix".
MUST: Verify the output JSONL contains between 165 and 203 route records (±10% of expected 184) before recording PASS.
MUST: Record the file path, exact line count, and a sample record (first route) in `baseline-report.md` before marking this task done.
MUST: Use `json.dumps(dataclasses.asdict(r))` to serialize `Route` dataclass instances — `Route` is a stdlib dataclass, not a Pydantic model.
NEVER: Push routes to any Convex deployment — this task is ingestion-only.
NEVER: Restructure or refactor `parse_fhwa_csv()` — the Boy Scout fix is `__main__` only.
NEVER: Run extraction, scoring, or classification — those are BASE-003 through BASE-005 territory.
STRICTLY: Limit writes to `scripts/curation/pipeline/sources/fhwa.py` (`__main__` only) and `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md`.
STRICTLY: Import `json` and `dataclasses` at the top of the `__main__` block — do not modify existing module-level imports.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Add a minimal `__main__` block to `fhwa.py` so it can be executed as a module (`python -m scripts.curation.pipeline.sources.fhwa`), run it against live FHWA data, verify the route count is within ±10% of 184, and record the result in `baseline-report.md` as the first entry in the Epic 2 baseline.

**Success looks like:** `staging/fhwa.jsonl` exists with 165–203 lines; each line is valid JSON with non-null `name`, `state`, `centroid_lat`, `centroid_lng`; the module exits 0; `baseline-report.md` contains the FHWA section with exact count, file path, and a sample record; the Boy Scout `__main__` fix is committed separately before the baseline-report commit.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** `scripts/curation/pipeline/sources/fhwa.py` has a `parse_fhwa_csv(path)` function but no `__main__` block, so it cannot be run as `python -m`. The existing BASE-001 (now archived) assumed it was runnable. Without a runnable entry point, the FHWA ingestion stage of the curation pipeline has never been executed end-to-end.

**Why it matters:** Epic 2 exists to prove the baseline curation pipeline works before hardening is layered on top. FHWA is the first and smallest source — if it cannot be run, all subsequent pipeline stages inherit the ambiguity. A ~15-line Boy Scout `__main__` fix unblocks the entire baseline run.

**Current state:** `fhwa.py` has `parse_fhwa_csv(path: str) -> list[Route]` as the public API. `Route` is a stdlib `@dataclass` defined in `scripts/curation/pipeline/models.py`. There is no CLI entry point, no JSONL writer, and no staging path convention documented in code. `motorcycleroads.py` (sibling module) has a working `__main__` block that can be used as a reference.

**Desired state:** `fhwa.py` has a `__main__` block that reads an optional CSV path, calls `parse_fhwa_csv()`, writes the results to `staging/fhwa.jsonl` as JSONL (one `json.dumps(dataclasses.asdict(r))` per line), and prints a route count summary. Running `python -m scripts.curation.pipeline.sources.fhwa` exits 0 and produces a staging file with 165–203 routes, and the result is documented in `baseline-report.md`.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

Each AC is a RED → GREEN → REFACTOR micro-cycle.
Orchestrator advances through ACs sequentially.

AC-1: FHWA module runnable as python -m
  GIVEN: fhwa.py has been given a __main__ block via Boy Scout fix (committed separately) and a FHWA byways CSV is accessible
  WHEN: `python -m scripts.curation.pipeline.sources.fhwa` is executed from the project root
  THEN: staging/fhwa.jsonl is written, the module exits 0, and the terminal prints 'FHWA: N routes' where N is a positive integer

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — no unit test)
  TEST_FUNCTION: verify_fhwa_module_runnable
  VERIFY: `python -m scripts.curation.pipeline.sources.fhwa && test -f staging/fhwa.jsonl && echo 'FHWA module runnable PASS'`

AC-2: Route count within ±10% of 184
  GIVEN: staging/fhwa.jsonl exists from AC-1
  WHEN: the line count of staging/fhwa.jsonl is checked
  THEN: the count is between 165 and 203 inclusive

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_fhwa_count_range
  VERIFY: `COUNT=$(wc -l < staging/fhwa.jsonl | tr -d ' ') && python -c "assert 165 <= int('$COUNT') <= 203, f'FHWA count $COUNT out of range 165-203'" && echo "FHWA count $COUNT PASS"`

AC-3: Each record has required fields
  GIVEN: staging/fhwa.jsonl exists from AC-1
  WHEN: all records in the JSONL are parsed
  THEN: every record has non-null name, state, centroid_lat, centroid_lng, and route_id fields

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_fhwa_record_fields
  VERIFY: `python -c "import json; records=[json.loads(l) for l in open('staging/fhwa.jsonl')]; required=['name','state','centroid_lat','centroid_lng','route_id']; bad=[i for i,r in enumerate(records) if any(not r.get(f) for f in required)]; assert not bad, f'Records missing fields at indices: {bad}'; print('FHWA fields PASS')"`

AC-4: Result recorded in baseline-report.md
  GIVEN: staging/fhwa.jsonl passed ACs 1-3
  WHEN: baseline-report.md is inspected
  THEN: it contains a FHWA section with the exact route count and staging file path

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — self-referential)
  TEST_FUNCTION: verify_baseline_report_fhwa_section
  VERIFY: `grep -q 'fhwa' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'staging/fhwa.jsonl' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo 'baseline-report FHWA section PASS'`

Quality Criteria:
- [ ] All 4 ACs verified via their VERIFY commands
- [ ] Boy Scout __main__ fix committed separately (before the baseline-report commit) with the rationale in the message
- [ ] baseline-report.md has a FHWA section with count, file path, and first-record sample

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `python -m scripts.curation.pipeline.sources.fhwa` exits 0 and writes staging/fhwa.jsonl | AC-1 | `python -m scripts.curation.pipeline.sources.fhwa && test -f staging/fhwa.jsonl` | [ ] TRUE [ ] FALSE |
| 2 | staging/fhwa.jsonl contains between 165 and 203 lines when parsed | AC-2 | `COUNT=$(wc -l < staging/fhwa.jsonl \| tr -d ' ') && python -c "assert 165 <= int('$COUNT') <= 203"` | [ ] TRUE [ ] FALSE |
| 3 | Every record in staging/fhwa.jsonl has non-null name, state, centroid_lat, centroid_lng, and route_id | AC-3 | `python -c "import json; records=[json.loads(l) for l in open('staging/fhwa.jsonl')]; assert all(r.get('name') and r.get('state') and r.get('centroid_lat') and r.get('centroid_lng') and r.get('route_id') for r in records)"` | [ ] TRUE [ ] FALSE |
| 4 | baseline-report.md contains a FHWA section with the route count and staging/fhwa.jsonl path | AC-4 | `grep -q 'fhwa' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'staging/fhwa.jsonl' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/sources/fhwa.py
   - Lines: ALL
   - Focus: `parse_fhwa_csv()` signature, return type (`list[Route]`), `Route` import — understand what to serialize in `__main__`

2. scripts/curation/pipeline/models.py
   - Lines: 1-30
   - Focus: `Route` dataclass fields — needed for JSON serialization via `dataclasses.asdict()`

3. scripts/curation/pipeline/sources/motorcycleroads.py
   - Lines: Tail of file (look for `if __name__ == "__main__":`)
   - Focus: Reference `__main__` pattern — FHWA is synchronous so simpler (no `asyncio.run`)

4. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md
   - Lines: ALL
   - Focus: Human test step 1 — expected count ~184, staging JSONL path convention

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/sources/fhwa.py (MODIFY — add `__main__` block only, Boy Scout fix, commit separately)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md (NEW — create with FHWA section)

WRITE-PROHIBITED:
- staging/** — staging/fhwa.jsonl is runtime output, not committed to git
- scripts/curation/pipeline/extraction/** — BASE-003 territory
- scripts/curation/pipeline/scoring/** — BASE-004 territory
- scripts/curation/pipeline/sync/** — BASE-007 territory
- convex/** — Epic 3+ territory

MUST:
- [ ] Commit the Boy Scout `__main__` fix separately from the baseline-report commit (two distinct commits)
- [ ] Record exact route count, file path, and first record in baseline-report.md
- [ ] Use `dataclasses.asdict(r)` (not `r.__dict__`) for serialization

MUST NOT:
- [ ] Modify `parse_fhwa_csv()` signature or internals
- [ ] Add arguments beyond an optional CSV path
- [ ] Wrap in `asyncio.run()` — FHWA parsing is synchronous
- [ ] Commit staging/fhwa.jsonl to git

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: adding a minimal `__main__` block to a synchronous parser module. The block imports what it needs, defaults the input path, calls the existing function, serializes dataclass results to JSONL, and prints a summary.

```python
if __name__ == "__main__":
    import sys
    import json
    import dataclasses
    import logging
    from pathlib import Path

    logging.basicConfig(level=logging.INFO)
    csv_path = sys.argv[1] if len(sys.argv) > 1 else "data/fhwa_byways.csv"
    routes = parse_fhwa_csv(csv_path)

    out = Path("staging/fhwa.jsonl")
    out.parent.mkdir(exist_ok=True)
    with open(out, "w") as f:
        for r in routes:
            f.write(json.dumps(dataclasses.asdict(r)) + "\n")
    print(f"FHWA: {len(routes)} routes -> {out}")
```

**Pattern source:** `scripts/curation/pipeline/sources/motorcycleroads.py` `__main__` block (structure reference; MR is async, FHWA is sync). `Route` is a stdlib dataclass so use `dataclasses.asdict()`, not `.dict()` or `.model_dump()`.

**Anti-pattern:** Do NOT call `route.__dict__` directly on dataclasses — use `dataclasses.asdict()`. Do NOT add arguments to `parse_fhwa_csv()`. Do NOT wrap in `asyncio.run()` — FHWA parsing is synchronous.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## FOR EACH ACCEPTANCE CRITERION:

This is an INFRA validation task — the "tests" are the VERIFY commands, not traditional unit tests. Treat each AC as an execute-and-verify step:

### EXECUTE (equivalent to GREEN)
  READ: The AC's GIVEN-WHEN-THEN and VERIFY command
  DO: Run the required setup (e.g., commit Boy Scout __main__ fix) then execute the VERIFY command
  CAPTURE: stdout, stderr, exit code, and any file counts or samples needed for baseline-report.md
  RETURN: { ac: N, status: "PASS"|"FAIL", output: "...", files_created: [...] }

### VERIFY (equivalent to REFACTOR)
  READ: The captured output
  WRITE: The corresponding section in baseline-report.md with the data points required by the AC
  CONFIRM: Re-run the VERIFY command from a clean shell to prove idempotency
  RETURN: { ac: N, baseline_report_section_added: true }

## AFTER ALL ACs COMPLETE:
  Orchestrator runs the full VERIFY command suite once more and confirms all 4 PASS.

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

After each AC, orchestrator MUST verify independently:

AFTER AC-1 (module runnable):
  RUN: `python -m scripts.curation.pipeline.sources.fhwa && test -f staging/fhwa.jsonl`
  EXPECT: Exit 0, staging/fhwa.jsonl exists
  IF FAIL: Return to agent — likely missing or broken `__main__` block

AFTER AC-2 (count range):
  RUN: `COUNT=$(wc -l < staging/fhwa.jsonl | tr -d ' ') && python -c "assert 165 <= int('$COUNT') <= 203"`
  EXPECT: Exit 0
  IF FAIL: FHWA CSV may have changed upstream — investigate, do NOT widen the range without user approval

AFTER AC-3 (field completeness):
  RUN: the AC-3 VERIFY command
  EXPECT: Exit 0
  IF FAIL: `parse_fhwa_csv()` may be dropping rows — Boy Scout fix required

AFTER AC-4 (baseline-report section):
  RUN: the AC-4 VERIFY command
  EXPECT: Exit 0
  IF FAIL: baseline-report.md missing content — agent must append before marking task done

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Python pipeline validation work — python-implement owns `scripts/curation/pipeline/` per the project's agent pairing rules. The Boy Scout `__main__` fix is a pure Python addition, no Convex or frontend involvement.

**Review Agent:** python-review
**Rationale:** Validates the Boy Scout fix follows PEP standards, uses `dataclasses.asdict()` correctly, does not regress `parse_fhwa_csv()`.

**Assignment Date:** 2026-04-12

**Agent Pairing:** This task follows standard agent-reviewer pairing per brain/docs/kanban/agent-assignment.md.

**Assignment Logic:**
- Task Type: INFRA (validation)
- File Patterns: `scripts/curation/pipeline/sources/fhwa.py`, `.spec/prds/curation-hardening/tasks/epic-02-**/baseline-report.md`
- Implementation: python-implement (Python pipeline work)
- Review: python-review (Python code quality + standards)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: FHWA module exits 0
  Command: `python -m scripts.curation.pipeline.sources.fhwa`
  Expected: Exit code 0

Gate 2: FHWA count in range
  Command: `COUNT=$(wc -l < staging/fhwa.jsonl | tr -d ' ') && python -c "assert 165 <= int('$COUNT') <= 203, f'count $COUNT out of range'" && echo PASS`
  Expected: PASS

Gate 3: Required fields present
  Command: `python -c "import json; recs=[json.loads(l) for l in open('staging/fhwa.jsonl')]; assert all(r.get('name') and r.get('state') for r in recs); print('fields OK')"`
  Expected: fields OK

Gate 4: baseline-report.md has FHWA section
  Command: `grep -q 'staging/fhwa.jsonl' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo PASS`
  Expected: PASS

Gate 5: Boy Scout fix committed separately
  Command: `git log --oneline -5 scripts/curation/pipeline/sources/fhwa.py | head -1`
  Expected: Commit message references "Boy Scout" or "__main__"

Gate 6: Scope Compliance
  Command: `git diff --name-only HEAD~2..HEAD`
  Expected: Only files in WRITE-ALLOWED list

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA adaptation):
- [ ] All 4 ACs have PASS verification command output recorded
- [ ] Boy Scout fix is in a separate commit with clear rationale
- [ ] baseline-report.md is comprehensive and grep-able

Code Quality:
- [ ] `__main__` block uses `dataclasses.asdict()` correctly
- [ ] No changes to `parse_fhwa_csv()` function body
- [ ] Imports inside `__main__` block are minimal and local
- [ ] `Path.mkdir(exist_ok=True)` used instead of raw `os.makedirs()` with try/except

Domain-Specific:
- [ ] staging/fhwa.jsonl is NOT committed to git (runtime output)
- [ ] First-record sample in baseline-report.md is a real FHWA route (not fabricated)

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- VAL-004 — Convex dev deployment (not strictly needed for FHWA standalone, but BASE-008's review protocol step 12 requires it; VAL-004 is the gating epic dependency)

Blocks:
- BASE-003 — Haiku extraction requires staging/fhwa.jsonl as the source of the 20-route sample
- BASE-006 — OSM enrichment uses FHWA route centroids for the 10-route test
- BASE-008 — Curation Review Protocol step 1 verifies FHWA ingestion

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] VAL-004 — Convex dev deployment validated (REQUIRED)
- [ ] FHWA CSV is accessible at a known local path (verify before starting; document the path in baseline-report.md)

Can Execute In Parallel With: BASE-002 (community scrapers — no shared files)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- This task was extracted from the archived BASE-001.md (the 240-minute single task) during the Epic 2 decomposition on 2026-04-12. The archived file is preserved at `BASE-001.md.archived` for historical reference.
- The Boy Scout `__main__` fix is intentionally minimal — it wraps `parse_fhwa_csv()` without modifying it. Future epics may add a more sophisticated CLI (argparse flags, output path override, etc.), but that is out of scope for baseline validation.
- The ±10% tolerance on the 184-route expected count accommodates upstream CSV changes. If the actual count falls outside 165–203, investigate before widening the range — FHWA publishes updates and the data may have legitimately changed.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
