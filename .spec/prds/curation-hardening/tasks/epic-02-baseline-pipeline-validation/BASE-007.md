================================================================================
TASK: BASE-007 - Convex push dry-run validation + Boy Scout --dry-run flag for sync/convex_push.py
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

MUST: Add both a `dry_run: bool = False` kwarg to `push_routes()` AND a `--dry-run` CLI flag to a new `__main__` block in `convex_push.py` (single Boy Scout fix commit). When `dry_run=True`, the function MUST serialize all route dicts and log them but MUST NOT call `_push_batch()` or make any HTTP requests.
MUST: Add a `__main__` block to `convex_push.py` that reads a JSON scores file, reconstructs EnrichedRoute objects, calls `push_routes()` with `dry_run=True` by default, and exits 0 if serialization succeeds without type errors.
MUST: Verify that `_route_to_dict()` produces valid JSON-serializable dicts for all 20 routes from `baseline/scores.json` — any `TypeError` or `ValueError` is a bug requiring a Boy Scout fix before recording PASS.
MUST: Record in `baseline-report.md`: the dry-run result (exit code, route count serialized, any type errors), the Convex endpoint URL used (dev deployment from VAL-004), and the deploy key environment variable name (`CURATION_DEPLOY_KEY`).
NEVER: Push routes to the production Convex deployment — `dry_run=True` MUST gate all HTTP calls.
NEVER: Commit a deploy key or API key to any file — read `CURATION_DEPLOY_KEY` and `CONVEX_URL` from environment variables only.
NEVER: Call `_push_batch()` when `dry_run=True` — the dry-run path must short-circuit before any HTTP is attempted.
STRICTLY: Use EnrichedRoute objects as the push input, not plain Route objects — reconstruct from `scores.json` with all score fields populated so that `_route_to_dict()` exercises the enriched-field path.
STRICTLY: Test with `--dry-run` flag only in this task — no live Convex write, even to the dev deployment.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Add a `dry_run: bool = False` kwarg to `push_routes()` and a `__main__` block with `--dry-run` CLI flag to `convex_push.py` (single Boy Scout fix commit), run it on the 20 scored routes from `baseline/scores.json` with `--dry-run`, verify all routes serialize without `TypeError`/`ValidationError` and the module exits 0, and record the dry-run results in `baseline-report.md`.

**Success looks like:** `convex_push.py` has a `__main__` block and `push_routes()` accepts `dry_run=True`; `python -m scripts.curation.pipeline.sync.convex_push --input baseline/scores.json --dry-run` exits 0; all 20 routes serialize to valid JSON dicts without errors; no HTTP request is made to Convex; `baseline-report.md` push section documents exit code 0 and route count serialized.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** `convex_push.py` has a `push_routes()` function that makes HTTP POSTs to the Convex ingest endpoint, but there is no way to run it without making a live network call — there is no `--dry-run` flag and no `__main__` block. Epic 2's human test step 8 requires a dry-run mode, so this is a required Boy Scout fix.

**Why it matters:** Pushing routes to any Convex deployment in Epic 2 is forbidden — the baseline validation must prove serialization works without touching any real data. Without a dry-run gate, we can't validate serialization in isolation. Additionally, Epic 3 will extend `_route_to_dict()` to include new fields (location, source_refs, quality_tier, etc.) — having a `--dry-run` mode makes future schema evolution safer.

**Current state:** `push_routes(routes, base_url, deploy_key, batch_size=50) -> PushSummary`. The function loops over routes, calls `_route_to_dict()` on each, batches them, and POSTs to `{base_url}/api/ingest-routes`. `ConfigurationError` is raised if `deploy_key` is empty. `PushSummary` dataclass has `sent`, `inserted`, `failed` counters. `_route_to_dict()` uses `hasattr(route, 'composite_score')` to activate the enriched-field path — so reconstructing `EnrichedRoute` objects from `baseline/scores.json` exercises more of the serialization logic than plain Routes.

**Desired state:** `push_routes()` accepts `dry_run: bool = False`. When `dry_run=True`, it serializes every route via `_route_to_dict()`, calls `json.dumps()` on each to prove JSON-serializability, logs the count, and returns a `PushSummary` with `sent=len(routes)` — without calling `_push_batch()`. A new `__main__` block parses `--input`, `--dry-run`, `--base-url`, `--deploy-key` args (defaulting to env vars for the last two and `dry_run=True` by default for safety), reconstructs EnrichedRoute objects from `scores.json`, and calls `push_routes()`.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: push_routes() accepts dry_run kwarg and skips HTTP when True
  GIVEN: convex_push.py has been modified (Boy Scout fix, committed separately) to add dry_run: bool = False to push_routes() and a __main__ block with --dry-run flag
  WHEN: inspect.signature(push_routes) is checked
  THEN: no ImportError or AttributeError; 'dry_run' is present in push_routes() parameter list

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_dry_run_param
  VERIFY: `python -c "from scripts.curation.pipeline.sync.convex_push import push_routes; import inspect; sig=inspect.signature(push_routes); assert 'dry_run' in sig.parameters, f'dry_run not in {list(sig.parameters)}'; print('dry_run param PASS')"`

AC-2: Dry-run exits 0 and serializes all 20 routes without errors
  GIVEN: baseline/scores.json exists from BASE-004 and CONVEX_URL + CURATION_DEPLOY_KEY are set in the environment (or dummy values for dry-run mode)
  WHEN: `python -m scripts.curation.pipeline.sync.convex_push --input .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --dry-run` is executed
  THEN: the module exits 0; logs show 'DRY RUN: N routes serialized successfully'; no TypeError or ValidationError appears in stderr

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_dry_run_serialization
  VERIFY: `python -m scripts.curation.pipeline.sync.convex_push --input .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --dry-run 2>&1 | tee /tmp/push_dryrun.log && grep -qi 'dry run\|dry-run' /tmp/push_dryrun.log && ! grep -qi 'TypeError\|ValidationError\|traceback' /tmp/push_dryrun.log && echo 'dry-run serialization PASS'`

AC-3: No HTTP requests made during dry-run
  GIVEN: the dry-run from AC-2 completed
  WHEN: the output logs from the dry-run are inspected for Convex endpoint calls
  THEN: no log message references the Convex ingest endpoint URL; no POST to convex.site or convex.cloud domains

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_no_http_in_dryrun
  VERIFY: `python -m scripts.curation.pipeline.sync.convex_push --input .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --dry-run 2>&1 | grep -qi 'POST\|ingest-routes\|requests.post' && echo 'UNEXPECTED HTTP call' && exit 1 || echo 'no HTTP PASS'`

AC-4: Dry-run result recorded in baseline-report.md
  GIVEN: ACs 1-3 passed
  WHEN: baseline-report.md push section is inspected
  THEN: it contains 'dry-run' and the environment variable name CURATION_DEPLOY_KEY

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — self-referential)
  TEST_FUNCTION: verify_push_section_in_report
  VERIFY: `grep -qi 'dry.run\|dry run' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'CURATION_DEPLOY_KEY' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo 'push section in report PASS'`

Quality Criteria:
- [ ] `dry_run` kwarg and `--dry-run` flag added in single Boy Scout commit
- [ ] Zero HTTP calls during dry-run
- [ ] All 20 routes serialize without errors

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `push_routes()` has a `dry_run` parameter in its signature | AC-1 | `python -c "from scripts.curation.pipeline.sync.convex_push import push_routes; import inspect; assert 'dry_run' in inspect.signature(push_routes).parameters"` | [ ] TRUE [ ] FALSE |
| 2 | `python -m scripts.curation.pipeline.sync.convex_push --input baseline/scores.json --dry-run` exits 0 without TypeError or ValidationError | AC-2 | `python -m scripts.curation.pipeline.sync.convex_push --input .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --dry-run 2>&1 \| grep -qi 'traceback\|TypeError\|ValidationError' && exit 1 \|\| echo PASS` | [ ] TRUE [ ] FALSE |
| 3 | Dry-run produces no POST calls to any Convex endpoint | AC-3 | `python -m scripts.curation.pipeline.sync.convex_push --input .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --dry-run 2>&1 \| grep -qi 'POST\|ingest-routes' && echo UNEXPECTED && exit 1 \|\| echo PASS` | [ ] TRUE [ ] FALSE |
| 4 | baseline-report.md push section contains 'dry-run' and 'CURATION_DEPLOY_KEY' | AC-4 | `grep -qi 'dry.run' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'CURATION_DEPLOY_KEY' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/sync/convex_push.py
   - Lines: ALL
   - Focus: `push_routes()` signature (routes, base_url, deploy_key, batch_size) — must add `dry_run: bool = False` kwarg; `_push_batch()` is the HTTP call to gate; `_route_to_dict()` serializes Route/EnrichedRoute — this is what dry-run validates

2. scripts/curation/pipeline/models.py
   - Lines: 31-53
   - Focus: `EnrichedRoute` fields — `_route_to_dict()` checks `hasattr(route, 'composite_score')` to activate enriched fields; reconstruct `EnrichedRoute` from `scores.json`

3. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md
   - Lines: 33
   - Focus: Human test step 8 — dry-run only, no production push, verify no TypeError/ValidationError

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/sync/convex_push.py (MODIFY — add `dry_run` kwarg to `push_routes()` AND add `__main__` block; single Boy Scout fix commit)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md (APPEND — Convex push dry-run section)

WRITE-PROHIBITED:
- convex/** — do NOT modify Convex schema or mutations in this task
- scripts/curation/pipeline/scoring/** — BASE-004 territory
- scripts/curation/pipeline/classification/** — BASE-005 territory
- baseline/scores.json — read-only input from BASE-004; do NOT overwrite

MUST:
- [ ] Add `dry_run` kwarg AND `__main__` in same commit
- [ ] Gate `_push_batch()` behind `if not dry_run:`
- [ ] Reconstruct `EnrichedRoute` objects (not plain `Route`)

MUST NOT:
- [ ] Make any HTTP POST during this task
- [ ] Commit deploy keys or API keys
- [ ] Bypass `ConfigurationError` for empty deploy_key

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: adding a `dry_run` gate to an existing HTTP-calling function and wrapping it in a `__main__` block that defaults to dry-run mode for safety.

```python
# Modification to push_routes() signature:
def push_routes(
    routes: list[Route],
    base_url: str,
    deploy_key: str,
    batch_size: int = 50,
    dry_run: bool = False,
) -> PushSummary:
    if not deploy_key:
        raise ConfigurationError("CURATION_DEPLOY_KEY is not set.")

    if dry_run:
        logger.info(f"DRY RUN: serializing {len(routes)} routes (no HTTP)")
        payloads = [_route_to_dict(r) for r in routes]
        import json as _json
        for p in payloads:
            _json.dumps(p)  # raises TypeError if not serializable
        logger.info(f"DRY RUN: {len(payloads)} routes serialized successfully")
        return PushSummary(sent=len(routes))

    # ... rest of existing function unchanged ...

# __main__ block (add at bottom):
if __name__ == "__main__":
    import sys
    import json
    import argparse
    import os
    import logging
    from pathlib import Path
    from scripts.curation.pipeline.models import EnrichedRoute

    logging.basicConfig(level=logging.INFO)
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="JSON array of scored routes")
    p.add_argument("--dry-run", action="store_true", default=True)
    p.add_argument("--base-url", default=os.environ.get("CONVEX_URL", "http://localhost:3000"))
    p.add_argument("--deploy-key", default=os.environ.get("CURATION_DEPLOY_KEY", "dry-run-key"))
    args = p.parse_args()

    data = json.load(open(args.input))
    # Filter to valid EnrichedRoute fields to avoid TypeError from extra keys
    routes = [EnrichedRoute(**d) for d in data]
    summary = push_routes(routes, args.base_url, args.deploy_key, dry_run=args.dry_run)
    print(f"Push summary: sent={summary.sent} inserted={summary.inserted} failed={summary.failed}")
```

**Pattern source:** `_push_batch()` in `scripts/curation/pipeline/sync/convex_push.py` — `dry_run` gates this call; `PushSummary.sent` tracks serialized count.

**Anti-pattern:** Do NOT remove the `ConfigurationError` check for `deploy_key` — even dry_run mode requires a non-empty deploy_key string (use the env var default `'dry-run-key'` rather than bypassing the check). Do NOT call `json.dumps()` on the full `PushSummary` — only on individual route dicts.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## EXECUTION

### Step 1: Boy Scout fix (dry_run kwarg + __main__)
  READ: `convex_push.py` fully — understand `push_routes()`, `_push_batch()`, `_route_to_dict()` flow
  WRITE: Both the `dry_run` kwarg gate AND the `__main__` block in a single file edit
  COMMIT: Single commit with rationale "Add dry_run kwarg + __main__ for Epic 2 baseline push validation (Boy Scout)"

### Step 2: Verify signature (AC-1)
  DO: Run the AC-1 VERIFY command

### Step 3: Run dry-run (AC-2, AC-3)
  PREREQ: `CONVEX_URL` and `CURATION_DEPLOY_KEY` can be dummy env vars in dry-run mode
  DO: Run the AC-2 VERIFY command, capture output to /tmp/push_dryrun.log

### Step 4: Record in baseline-report.md (AC-4)
  WRITE: Push section with dry-run result, route count, env var names
  VERIFY: grep for 'dry-run' and 'CURATION_DEPLOY_KEY'

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER AC-1:
  RUN: the AC-1 VERIFY command
  EXPECT: "dry_run param PASS"

AFTER AC-2:
  RUN: the AC-2 VERIFY command
  EXPECT: "dry-run serialization PASS"
  IF FAIL (TypeError/ValidationError): `_route_to_dict()` has a schema bug — Boy Scout fix required to handle the specific field

AFTER AC-3:
  RUN: the AC-3 VERIFY command
  EXPECT: "no HTTP PASS"
  IF FAIL: `dry_run` gate is not properly placed — re-inspect the `push_routes()` modification

AFTER AC-4:
  RUN: the AC-4 VERIFY command
  EXPECT: "push section in report PASS"

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Python HTTP client modification + dry-run gate; python-implement owns `scripts/curation/pipeline/sync/`.

**Review Agent:** python-review
**Rationale:** Critical security review — verifies `dry_run` truly prevents HTTP, no deploy key leakage, `ConfigurationError` still raised for missing key.

**Assignment Date:** 2026-04-12

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: dry_run param in push_routes signature
  Command: `python -c "from scripts.curation.pipeline.sync.convex_push import push_routes; import inspect; assert 'dry_run' in inspect.signature(push_routes).parameters; print('PASS')"`
  Expected: PASS

Gate 2: dry-run exits 0 no TypeError
  Command: `python -m scripts.curation.pipeline.sync.convex_push --input .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --dry-run 2>&1 | tee /tmp/dryrun.log; grep -qi 'TypeError\|traceback' /tmp/dryrun.log && exit 1 || echo PASS`
  Expected: PASS

Gate 3: No HTTP POST in dry-run logs
  Command: `cat /tmp/dryrun.log | grep -qi 'POST\|ingest-routes' && echo FAIL || echo PASS`
  Expected: PASS

Gate 4: ConfigurationError still raised for empty deploy_key
  Command: `python -c "from scripts.curation.pipeline.sync.convex_push import push_routes, ConfigurationError; try: push_routes([], 'http://x', '', dry_run=True); print('FAIL'); exit(1)\nexcept ConfigurationError: print('PASS')"`
  Expected: PASS

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA adaptation):
- [ ] All 4 ACs verified
- [ ] Single Boy Scout commit contains both `dry_run` kwarg and `__main__`

Code Quality:
- [ ] `dry_run` kwarg default is `False` (safe-by-default; dry-run is opt-in from the function API)
- [ ] `--dry-run` CLI flag default is `True` (safe-by-default from the CLI)
- [ ] `ConfigurationError` still raised when deploy_key is empty
- [ ] `_push_batch()` gated behind `if not dry_run:`

Security:
- [ ] No deploy key or API key in any committed file
- [ ] `CURATION_DEPLOY_KEY` read from environment
- [ ] Dry-run cannot leak payloads to logs at INFO level without redaction

Domain-Specific:
- [ ] `EnrichedRoute` reconstruction covers the enriched-field path in `_route_to_dict()`
- [ ] No modifications to `_route_to_dict()` or `_push_batch()` in this task

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- BASE-004 — needs `baseline/scores.json` to reconstruct EnrichedRoute objects
- VAL-004 — Convex dev deployment reachable (for the env vars, though dry-run won't hit it)

Blocks:
- BASE-008 — Curation Review Protocol step 12 verifies push dry-run

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] BASE-004 complete (baseline/scores.json exists)
- [ ] VAL-004 complete (dev Convex deployment + env vars set)

Can Execute In Parallel With: BASE-005 (archetype classification — uses same scores.json but different pipeline stage)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- `--dry-run` defaults to `True` in the CLI as a safety measure — live push requires explicit `--no-dry-run` which is NOT implemented in this task. Epic 3 may add the explicit opt-out flag.
- This task is the single largest source of future risk if done wrong: the dry-run gate must be airtight or future epics will accidentally write to production.
- This task was extracted from the archived BASE-001.md (the 240-minute single task) during the Epic 2 decomposition on 2026-04-12.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
