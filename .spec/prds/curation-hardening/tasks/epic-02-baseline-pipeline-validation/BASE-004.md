================================================================================
TASK: BASE-004 - Composite scoring validation + Boy Scout __main__ for scoring/composite.py
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

MUST: Add a `__main__` block to `scoring/composite.py` (Boy Scout fix, committed separately) that reads a JSONL file of Route objects, calls `compute_scores()` on each, and writes a scored JSONL to a specified output path.
MUST: Capture the `WEIGHTS` dict from `scoring/composite.py` verbatim in `baseline-report.md` — the exact current values (curviness: 0.25, scenery: 0.15, traffic: 0.15, condition: 0.10, osm_curvature: 0.15, elevation_drama: 0.10, fhwa_designation: 0.05, community_rating: 0.05) are a critical baseline reference for Sprint 8 (SCO-001).
MUST: Write scored output to `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json` as a JSON array of dicts with `route_id` + all score fields — this is BASE-005 and BASE-007's input.
MUST: Verify every `composite_score` value is a float in [0.0, 1.0] — Phase 1 returns neutral 0.5 across all dimensions, so `composite_score` should be deterministically 0.5 × weighted_sum; assert no NaN or None.
NEVER: Modify `WEIGHTS` values — this is a baseline capture; `WEIGHTS` are changed only in Sprint 8 (SCO-001).
NEVER: Run extraction or push to Convex in this task.
NEVER: Call `compute_scores()` with a mock or stub Route — use real Route objects deserialized from `staging/fhwa.jsonl`.
STRICTLY: Use `Route(**json.loads(line))` to reconstruct Route objects from the JSONL input, then pass Route instances to `compute_scores()`.
STRICTLY: Write `scores.json` as a JSON array (list of dicts), not JSONL, so it can be loaded with `json.load()` in BASE-005.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Add a minimal `__main__` block to `scoring/composite.py` so it can be run as `python -m scripts.curation.pipeline.scoring.composite`, run it on the 20 routes from `baseline/catalog.jsonl` (re-reading the originating Route objects from `staging/fhwa.jsonl`), verify all scores are floats in [0.0, 1.0], capture the `WEIGHTS` dict verbatim in `baseline-report.md`, and write the scored results to `baseline/scores.json`.

**Success looks like:** `baseline/scores.json` is a JSON array with 20 objects; each object has `route_id`, `composite_score`, `curvature_score`, `scenic_score`, `technical_score`, `traffic_score`, `remoteness_score` all as floats in [0.0, 1.0]; `baseline-report.md` scoring section contains the `WEIGHTS` dict verbatim; Boy Scout `__main__` fix committed separately.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** `scoring/composite.py` contains the `WEIGHTS` dict and a `compute_scores()` function but no `__main__` block. The `WEIGHTS` dict is the most important configuration artifact in the entire curation pipeline — Sprint 8 (SCO-001) will realign these weights based on research, and every downstream epic depends on understanding the baseline weights. Without a runnable entry point, there's no mechanism to both execute scoring and capture the weights in one step.

**Why it matters:** The current `WEIGHTS` are divergent from the research formula per the curation-hardening PRD overview. Sprint 8 will realign them (e.g., community_rating 5%→15%, add mention_frequency at 10%, reduce curviness). Before that realignment, Epic 2 must capture the baseline verbatim so Sprint 8's diff report has a reference point. This task is the single authoritative source for "what were the weights at baseline?"

**Current state:** `WEIGHTS = {"curviness": 0.25, "scenery": 0.15, "traffic": 0.15, "condition": 0.10, "osm_curvature": 0.15, "elevation_drama": 0.10, "fhwa_designation": 0.05, "community_rating": 0.05}`. `compute_scores(route: Route) -> dict[str, float]` returns a dict of score dimensions keyed by name. Phase 1 returns neutral 0.5 across all dimensions because most fields are not yet populated (no OSM curvature, no community ratings, etc.) — so `composite_score` is deterministic and predictable.

**Desired state:** `scoring/composite.py` has a `__main__` block with `--input`, `--out`, `--count` argparse flags. The block reads Route JSONL, calls `compute_scores()` on each, packages results with `route_id` and `name`, and writes a JSON array to the output. Running `python -m scripts.curation.pipeline.scoring.composite --input staging/fhwa.jsonl --out .spec/.../baseline/scores.json --count 20` produces a 20-element JSON array and the `WEIGHTS` dict is logged (and captured in `baseline-report.md`).

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Scoring module runnable as python -m
  GIVEN: scoring/composite.py has a __main__ block (Boy Scout fix, committed separately) and staging/fhwa.jsonl exists from BASE-001
  WHEN: `python -m scripts.curation.pipeline.scoring.composite --input staging/fhwa.jsonl --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --count 20` is executed
  THEN: the module exits 0 and baseline/scores.json is written with a 20-element JSON array

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_scoring_runnable
  VERIFY: `python -m scripts.curation.pipeline.scoring.composite --input staging/fhwa.jsonl --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --count 20 && python -c "import json; data=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json')); assert len(data)==20, f'Expected 20, got {len(data)}'; print('scoring module PASS')"`

AC-2: All score dimensions are floats in [0.0, 1.0]
  GIVEN: baseline/scores.json exists from AC-1
  WHEN: all 20 score records are checked for type and range
  THEN: composite_score, curvature_score, scenic_score, technical_score, traffic_score, remoteness_score are all floats in [0.0, 1.0] with no nulls or NaNs

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_score_ranges
  VERIFY: `python -c "import json, math; data=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json')); score_keys=['composite_score','curvature_score','scenic_score','technical_score','traffic_score','remoteness_score']; bad=[(i,k) for i,r in enumerate(data) for k in score_keys if not isinstance(r.get(k),(int,float)) or not (0.0<=r[k]<=1.0) or (isinstance(r.get(k),float) and math.isnan(r[k]))]; assert not bad, f'Bad scores: {bad}'; print('score range PASS')"`

AC-3: WEIGHTS dict captured verbatim in baseline-report.md
  GIVEN: baseline/scores.json passed AC-2
  WHEN: baseline-report.md scoring section is inspected
  THEN: it contains the WEIGHTS dict with all 8 keys (curviness, scenery, traffic, condition, osm_curvature, elevation_drama, fhwa_designation, community_rating) and their float values

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — self-referential)
  TEST_FUNCTION: verify_weights_captured
  VERIFY: `grep -q 'curviness' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'osm_curvature' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'community_rating' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo 'WEIGHTS in report PASS'`

Quality Criteria:
- [ ] WEIGHTS captured verbatim (all 8 key:value pairs)
- [ ] No WEIGHTS modifications
- [ ] Deterministic Phase 1 scores documented (neutral 0.5 across dimensions)

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `python -m scripts.curation.pipeline.scoring.composite` exits 0 and writes baseline/scores.json with exactly 20 elements | AC-1 | `python -m scripts.curation.pipeline.scoring.composite --input staging/fhwa.jsonl --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --count 20 && python -c "import json; assert len(json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json')))==20"` | [ ] TRUE [ ] FALSE |
| 2 | Every record in baseline/scores.json has composite_score as a float in [0.0, 1.0] with no NaN | AC-2 | `python -c "import json, math; data=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json')); assert all(isinstance(r['composite_score'],(int,float)) and 0<=r['composite_score']<=1 and not math.isnan(r['composite_score']) for r in data)"` | [ ] TRUE [ ] FALSE |
| 3 | baseline-report.md scoring section contains 'curviness' (first WEIGHTS key) | AC-3 | `grep -q 'curviness' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |
| 4 | baseline-report.md scoring section contains 'osm_curvature' and 'community_rating' (last 2 WEIGHTS keys) | AC-3 | `grep -q 'osm_curvature' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'community_rating' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/scoring/composite.py
   - Lines: ALL
   - Focus: `WEIGHTS` dict (verbatim values to capture), `compute_scores()` signature (takes Route, returns `dict[str, float]`) — design `__main__` around this

2. scripts/curation/pipeline/models.py
   - Lines: ALL
   - Focus: `Route` and `EnrichedRoute` field names — `__main__` must reconstruct Route from JSONL using `Route(**d)` after `json.loads()`

3. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md
   - Lines: 30
   - Focus: Human test step 5 — composite_score floats in expected range, WEIGHTS captured

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/scoring/composite.py (MODIFY — add `__main__` block only, Boy Scout fix, commit separately)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json (NEW — 20-element JSON array)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md (APPEND — scoring section with WEIGHTS verbatim)

WRITE-PROHIBITED:
- scripts/curation/pipeline/scoring/composite.py `WEIGHTS` values — do NOT change any weight value
- scripts/curation/pipeline/classification/** — BASE-005 territory
- scripts/curation/pipeline/sync/** — BASE-007 territory
- scripts/curation/pipeline/extraction/** — BASE-003 territory

MUST:
- [ ] Reconstruct Route objects via `Route(**d)` from JSONL
- [ ] Capture WEIGHTS verbatim in baseline-report.md
- [ ] Write scores.json as a JSON array (not JSONL)

MUST NOT:
- [ ] Modify WEIGHTS values
- [ ] Mock or stub Route instances

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: adding a `__main__` block that wraps a pure scoring function, reconstructs dataclass instances from JSONL, and emits a JSON array of scored results.

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
    p.add_argument("--out", required=True, help="Output JSON array of scored routes")
    p.add_argument("--count", type=int, default=None, help="Optional cap on routes")
    args = p.parse_args()

    routes = [Route(**json.loads(l)) for l in open(args.input)]
    if args.count:
        routes = routes[: args.count]

    logging.info(f"WEIGHTS: {WEIGHTS}")

    results = []
    for r in routes:
        scores = compute_scores(r)
        results.append({"route_id": r.route_id, "name": r.name, **scores})

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Scored {len(results)} routes -> {out}")
```

**Pattern source:** `compute_scores()` signature in `scripts/curation/pipeline/scoring/composite.py`; `Route(**d)` reconstruction pattern is standard for stdlib dataclasses.

**Anti-pattern:** Do NOT import `EnrichedRoute` and set scores on it in this task — `compute_scores()` returns a plain dict; store that dict plus `route_id`/`name` in `scores.json`. Do NOT modify `WEIGHTS`. Do NOT write JSONL format — use `json.dump()` of an array for compatibility with BASE-005's `json.load()`.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## EXECUTION

### Step 1: Boy Scout __main__ fix
  READ: `scoring/composite.py` — confirm `compute_scores()` signature and `WEIGHTS` location
  WRITE: Append the `__main__` block per the CODE PATTERN section
  COMMIT: Separate commit with rationale "Add __main__ for Epic 2 baseline scoring validation (Boy Scout)"

### Step 2: Run scoring (AC-1, AC-2)
  DO: Run the command from AC-1's VERIFY
  CAPTURE: baseline/scores.json content; confirm 20 elements; check all score fields

### Step 3: Record WEIGHTS in baseline-report.md (AC-3)
  WRITE: Scoring section with the full WEIGHTS dict verbatim + a note that Phase 1 scores are neutral 0.5
  VERIFY: All three AC-3 grep commands pass

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER AC-1:
  RUN: the AC-1 VERIFY command
  EXPECT: "scoring module PASS"

AFTER AC-2:
  RUN: the AC-2 VERIFY command
  EXPECT: "score range PASS"
  IF FAIL: Phase 1 scores should be deterministic — any NaN is a bug in `compute_scores()` requiring a Boy Scout fix

AFTER AC-3:
  RUN: the AC-3 VERIFY command
  EXPECT: "WEIGHTS in report PASS"

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Pure Python scoring function validation; python-implement owns `scripts/curation/pipeline/scoring/`.

**Review Agent:** python-review
**Rationale:** Verifies no WEIGHTS modifications, Pattern compliance, JSON array output format.

**Assignment Date:** 2026-04-12

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Scoring exits 0 and writes 20-element JSON array
  Command: `python -m scripts.curation.pipeline.scoring.composite --input staging/fhwa.jsonl --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --count 20 && python -c "import json; assert len(json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json')))==20" && echo PASS`
  Expected: PASS

Gate 2: composite_score in [0,1] for all records
  Command: `python -c "import json, math; data=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json')); assert all(0<=r['composite_score']<=1 and not math.isnan(r['composite_score']) for r in data); print('PASS')"`
  Expected: PASS

Gate 3: WEIGHTS keys in baseline-report.md
  Command: `grep -q 'curviness' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -q 'osm_curvature' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo PASS`
  Expected: PASS

Gate 4: WEIGHTS not modified (composite.py diff clean on WEIGHTS lines)
  Command: `git diff HEAD~2 -- scripts/curation/pipeline/scoring/composite.py | grep -E '^[+-].*WEIGHTS' && echo UNEXPECTED || echo PASS`
  Expected: PASS

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA adaptation):
- [ ] All 3 ACs verified via VERIFY commands
- [ ] Boy Scout `__main__` in separate commit

Code Quality:
- [ ] `Route(**d)` reconstruction is correct
- [ ] argparse with `--input`, `--out`, `--count`
- [ ] JSON array output (not JSONL)
- [ ] `Path.mkdir(parents=True, exist_ok=True)` used

Domain-Specific:
- [ ] WEIGHTS dict unchanged (critical for Sprint 8)
- [ ] WEIGHTS verbatim in baseline-report.md
- [ ] Phase 1 neutrality note in the report (composite ≈ 0.5 for most routes)

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- BASE-003 — needs the extracted routes (baseline/catalog.jsonl) though composite scoring operates on Route objects from staging/fhwa.jsonl; semantic dependency is that extraction-then-scoring is the pipeline order

Blocks:
- BASE-005 — archetype classification needs the scores dict keyed by route_id
- BASE-007 — Convex push dry-run serializes scored routes
- BASE-008 — Curation Review Protocol step 7 verifies scoring

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] BASE-003 complete (baseline/catalog.jsonl exists) — sequential dependency
- [ ] staging/fhwa.jsonl exists (from BASE-001)

Can Execute In Parallel With: (none — sequential after BASE-003)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- The `WEIGHTS` capture is the single most important artifact this task produces. Sprint 8 (SCO-001) will diff against it.
- Phase 1 scoring returns neutral 0.5 across most dimensions — `composite_score` will be predictable. Document this in baseline-report.md so it's not confused for a bug.
- This task was extracted from the archived BASE-001.md (the 240-minute single task) during the Epic 2 decomposition on 2026-04-12.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
