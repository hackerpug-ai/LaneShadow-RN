================================================================================
TASK: BASE-006 - OSM enrichment validation + Boy Scout __main__ for enrichment/osm_client.py
================================================================================

TASK_TYPE: INFRA
STATUS: Done
TDD_PHASE: GREEN
CURRENT_AC: complete
PRIORITY: P0
EFFORT: S
TYPE: PROCESS
ITERATION: 1

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

MUST: Add a `__main__` block to `enrichment/osm_client.py` (Boy Scout fix, committed separately) that reads a JSONL file of routes, calls `compute_curvature_for_route()` on each, and reports curvature scores or None per route.
MUST: Run the 10-route sample TWICE and verify cache hit behavior on the second run — `.cache/osm/` files must exist after the first run and the second run must not log any new Overpass API requests.
MUST: Respect `RATE_LIMIT_SECONDS=1.0` — do NOT reduce the sleep or bypass the rate limiter.
MUST: Record in `baseline-report.md`: per-route curvature results (or None), first-run vs second-run request count, and cache hit rate on the second run.
NEVER: Hit the Overpass API with more than 10 routes in this validation task — both to respect rate limits and to keep runtime manageable.
NEVER: Clear the `.cache/osm/` directory between the first and second run — cache persistence is what this task is testing.
NEVER: Use the production Convex deployment or run extraction/scoring in this task.
STRICTLY: Use the 10 routes with the highest-quality centroid coordinates from `staging/fhwa.jsonl` — prefer routes with both `centroid_lat` and `centroid_lng` non-null.
STRICTLY: Set `cache_dir` to `.cache/osm` relative to the project root in the `__main__` block so cache files accumulate in a consistent location.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Add a minimal `__main__` block to `enrichment/osm_client.py`, run it on a 10-route sample from `staging/fhwa.jsonl` twice, verify OSM geometry lookups succeed (or gracefully return None) and that the FileCache delivers 100% cache hits on the second run with no new Overpass API calls, and record results in `baseline-report.md`.

**Success looks like:** First run: 10 Overpass API calls made; `.cache/osm/` contains 10 cache files; per-route curvature scores (or None for no geometry) logged. Second run: 0 new Overpass API calls; all 10 results served from cache; `baseline-report.md` OSM section documents first/second run request counts and cache hit rate = 100%.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** `enrichment/osm_client.py` has an `OSMClient` class that wraps the Overpass API with `httpx` and a `FileCache` backend, but no `__main__` block. Before Epic 2 can close, the OSM enrichment stage needs to be proven end-to-end — both that the Overpass lookups succeed and that the cache layer works (critical for controlling runtime in later epics).

**Why it matters:** Epic 4 (SRC-004) will run the adamfranco/curvature pre-compute pipeline on US OSM PBF data; Sprint 8 will add HPMS AADT enrichment. Both require the OSM/cache infrastructure to be proven. Epic 2's OSM validation is the canary — if the cache layer silently fails, future epics will burn Overpass API quota unnecessarily.

**Current state:** `OSMClient(cache_dir: Path)` has `compute_curvature_for_route(lat, lng, radius_m=5000, route_id=None) -> Optional[float]` as the primary method. The FileCache stores responses as JSON files keyed by a deterministic hash of the lat/lng/radius. Cache hits log "Using cached OSM response"; cache misses log "Querying Overpass API". `RATE_LIMIT_SECONDS=1.0` between live calls.

**Desired state:** `enrichment/osm_client.py` has a `__main__` block with `--input`, `--count`, `--cache-dir` argparse flags. The block reads Route objects, calls `compute_curvature_for_route()` on each centroid, logs each result, and prints a summary. Running the same command twice produces identical output, with the second run showing only cache hits (no live API calls).

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: OSM client module runnable as python -m (first run)
  GIVEN: enrichment/osm_client.py has a __main__ block (Boy Scout fix, committed separately), staging/fhwa.jsonl exists from BASE-001, and network access to overpass-api.de is available
  WHEN: `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm` is executed for the FIRST time
  THEN: the module exits 0; compute_curvature_for_route() is called 10 times; logs show Overpass API requests; .cache/osm/ directory contains at least 10 JSON cache files

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_osm_first_run
  VERIFY: `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm && CACHE_COUNT=$(ls .cache/osm/*.json 2>/dev/null | wc -l | tr -d ' ') && python -c "assert int('$CACHE_COUNT') >= 10, f'Expected 10 cache files, got $CACHE_COUNT'" && echo 'OSM first run PASS'`

AC-2: Second run achieves 100% cache hit rate
  GIVEN: First run from AC-1 has populated .cache/osm/ with 10+ cache files
  WHEN: `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm` is executed for the SECOND time
  THEN: the module exits 0; logs show 'Using cached OSM response' for all 10 routes; logs show NO 'Querying Overpass API' messages; results are identical to first run

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_osm_cache_hits
  VERIFY: `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm 2>&1 | tee /tmp/osm_second_run.log; grep -c 'cached OSM' /tmp/osm_second_run.log | python -c "import sys; n=int(sys.stdin.read().strip()); assert n >= 10, f'Expected >=10 cache hits, got {n}'" && ! grep -q 'Querying Overpass' /tmp/osm_second_run.log && echo 'OSM cache hit PASS'`

AC-3: Results recorded in baseline-report.md
  GIVEN: Both runs from ACs 1-2 completed
  WHEN: baseline-report.md OSM section is inspected
  THEN: it documents the first-run Overpass request count, the second-run cache hit count, and per-route curvature scores or None

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — self-referential)
  TEST_FUNCTION: verify_osm_section_in_report
  VERIFY: `grep -qi 'osm\|overpass' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'cache' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo 'OSM section in report PASS'`

Quality Criteria:
- [ ] Two sequential runs executed (do not clear cache between)
- [ ] Second run shows 0 live API calls
- [ ] Per-route curvature results documented (even if None)

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `python -m scripts.curation.pipeline.enrichment.osm_client` exits 0 and writes at least 10 cache files to .cache/osm/ on first run | AC-1 | `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm && python -c "import os; assert len([f for f in os.listdir('.cache/osm') if f.endswith('.json')]) >= 10"` | [ ] TRUE [ ] FALSE |
| 2 | Second run produces zero Overpass API requests (all responses served from FileCache) | AC-2 | `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm 2>&1 \| grep -c 'Querying Overpass' \| python -c "import sys; assert int(sys.stdin.read().strip())==0, 'Second run made live API calls'"` | [ ] TRUE [ ] FALSE |
| 3 | baseline-report.md OSM section references 'cache' and either 'overpass' or 'OSM' | AC-3 | `grep -qi 'osm\|overpass' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'cache' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/enrichment/osm_client.py
   - Lines: ALL
   - Focus: `OSMClient.compute_curvature_for_route()` signature (lat, lng, radius_m, route_id → Optional[float]); cache hit/miss log messages ('Using cached OSM response' vs 'Querying Overpass API'); `RATE_LIMIT_SECONDS=1.0`

2. scripts/curation/pipeline/enrichment/cache.py
   - Lines: ALL
   - Focus: `FileCache.get()` returns None on miss, data on hit; `FileCache.set()` writes JSON to `cache_dir`; understand the cache file naming convention

3. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md
   - Lines: 32
   - Focus: Human test step 7 — OSM enrichment, 10 routes, surface/smoothness/curvature populated, cache 100% on second run

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/enrichment/osm_client.py (MODIFY — add `__main__` block only, Boy Scout fix, commit separately)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md (APPEND — OSM enrichment section)
- .cache/osm/ (runtime cache files — NOT committed to git; add to .gitignore if not already present)

WRITE-PROHIBITED:
- scripts/curation/pipeline/enrichment/cache.py — do NOT modify FileCache internals
- scripts/curation/pipeline/enrichment/curvature.py — do NOT modify curvature computation
- scripts/curation/pipeline/scoring/** — BASE-004 territory
- baseline/catalog.jsonl — BASE-003 output; do NOT overwrite

MUST:
- [ ] Preserve `.cache/osm/` between runs
- [ ] Use `compute_curvature_for_route()` (not lower-level `fetch_highway_geometry()`)
- [ ] Respect `RATE_LIMIT_SECONDS=1.0`

MUST NOT:
- [ ] Clear or delete the cache between runs
- [ ] Run on more than 10 routes

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: adding a `__main__` block that wraps an API client with a cache, runs it on a 10-route sample, and reports per-route results.

```python
if __name__ == "__main__":
    import sys
    import json
    import argparse
    import logging
    from pathlib import Path
    from scripts.curation.pipeline.models import Route

    logging.basicConfig(level=logging.INFO)
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, help="Input JSONL of Route records")
    p.add_argument("--count", type=int, default=10)
    p.add_argument("--cache-dir", default=".cache/osm")
    args = p.parse_args()

    routes = [Route(**json.loads(l)) for l in open(args.input)][: args.count]
    client = OSMClient(cache_dir=Path(args.cache_dir))

    results = []
    for r in routes:
        score = client.compute_curvature_for_route(r.centroid_lat, r.centroid_lng, route_id=r.route_id)
        results.append({"route_id": r.route_id, "curvature_score": score})
        logging.info(f"{r.route_id}: curvature={score}")

    hits = sum(1 for res in results if res["curvature_score"] is not None)
    print(f"OSM enrichment: {len(results)} routes, {hits} with curvature scores")
```

**Pattern source:** `OSMClient.compute_curvature_for_route()` in `scripts/curation/pipeline/enrichment/osm_client.py`; `FileCache` log messages `Using cached OSM response` (hit) vs `Querying Overpass API` (miss).

**Anti-pattern:** Do NOT call `fetch_highway_geometry()` directly in the `__main__` block — use the higher-level `compute_curvature_for_route()` which handles the geometry parsing and returns `Optional[float]`. Do NOT clear the cache between first and second run.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## EXECUTION

### Step 1: Boy Scout __main__ fix
  READ: `enrichment/osm_client.py` fully to confirm `OSMClient.__init__(cache_dir)` and `compute_curvature_for_route()` signatures
  WRITE: Append the `__main__` block per the CODE PATTERN section
  COMMIT: Separate commit with rationale "Add __main__ for Epic 2 baseline OSM enrichment (Boy Scout)"

### Step 2: First run (AC-1)
  DO: Run the command from AC-1's VERIFY
  CAPTURE: stdout, count of `.cache/osm/*.json` files after run

### Step 3: Second run (AC-2)
  DO: Run the same command again (do NOT clear cache)
  CAPTURE: stdout/stderr to /tmp/osm_second_run.log
  VERIFY: grep for 'cached OSM' finds >=10 matches; grep for 'Querying Overpass' finds 0 matches

### Step 4: Record in baseline-report.md (AC-3)
  WRITE: OSM section with first-run request count, second-run cache hit count, per-route curvature results
  VERIFY: grep confirms 'osm' and 'cache' present

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER AC-1:
  RUN: the AC-1 VERIFY command
  EXPECT: "OSM first run PASS"
  IF FAIL: Overpass API may be rate-limiting or down — retry after 60s, do NOT increase request rate

AFTER AC-2:
  RUN: the AC-2 VERIFY command
  EXPECT: "OSM cache hit PASS"
  IF FAIL: FileCache is broken — Boy Scout fix to `cache.py` required (escalate before modifying)

AFTER AC-3:
  RUN: the AC-3 VERIFY command
  EXPECT: "OSM section in report PASS"

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Python + httpx wrapper + disk cache validation; python-implement owns `scripts/curation/pipeline/enrichment/`.

**Review Agent:** python-review
**Rationale:** Verifies rate limit respected, cache persistence, no live API calls on second run.

**Assignment Date:** 2026-04-12

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: OSM first run exits 0
  Command: `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm`
  Expected: Exit code 0

Gate 2: 10+ cache files written
  Command: `python -c "import os; n=len([f for f in os.listdir('.cache/osm') if f.endswith('.json')]); assert n >= 10, f'Expected >=10 cache files, got {n}'; print(f'PASS: {n} cache files')"`
  Expected: PASS: N cache files (N >= 10)

Gate 3: Second run zero live API calls
  Command: `python -m scripts.curation.pipeline.enrichment.osm_client --input staging/fhwa.jsonl --count 10 --cache-dir .cache/osm 2>&1 | grep -c 'Querying Overpass' | python -c "import sys; n=int(sys.stdin.read().strip()); assert n==0, f'{n} live calls on second run'; print('PASS: 0 live calls')"`
  Expected: PASS: 0 live calls

Gate 4: baseline-report.md OSM section present
  Command: `grep -q 'osm\|overpass' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'cache' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo PASS`
  Expected: PASS

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA adaptation):
- [ ] All 3 ACs verified
- [ ] Two sequential runs confirmed
- [ ] Boy Scout `__main__` in separate commit

Code Quality:
- [ ] Uses `compute_curvature_for_route()` not lower-level methods
- [ ] argparse with `--input`, `--count`, `--cache-dir`
- [ ] `Path()` used for cache_dir, not string

Domain-Specific:
- [ ] `.cache/osm/` in .gitignore (not committed)
- [ ] Rate limit not bypassed
- [ ] Second run truly makes 0 live API calls

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- BASE-001 — needs `staging/fhwa.jsonl` for FHWA centroid sampling

Blocks:
- BASE-008 — Curation Review Protocol step 2 verifies OSM enrichment

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] BASE-001 complete (staging/fhwa.jsonl exists)
- [ ] Network access to overpass-api.de
- [ ] `.gitignore` includes `.cache/` (add if not present)

Can Execute In Parallel With: BASE-003 (Haiku extraction — uses different infrastructure)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- First-run runtime: ~15s (10 routes × 1s rate limit + API response time).
- Second-run runtime: near-instant (all cache hits).
- If Overpass API is rate-limiting or down, wait 60s and retry — do NOT increase the request rate to compensate.
- This task was extracted from the archived BASE-001.md (the 240-minute single task) during the Epic 2 decomposition on 2026-04-12.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
