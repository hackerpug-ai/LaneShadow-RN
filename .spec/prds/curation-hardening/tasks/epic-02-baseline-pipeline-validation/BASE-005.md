================================================================================
TASK: BASE-005 - Archetype classification validation + Boy Scout __main__ for classification/archetype.py
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

MUST: Add a `__main__` block to `classification/archetype.py` (Boy Scout fix, committed separately) that reads a scored JSONL/JSON file, calls `classify()` on each Route+scores pair, and writes EnrichedRoute objects to an output file.
MUST: Verify every classified route has `primary_archetype` set to exactly one of: `twisties`, `mountain`, `coastal`, `adventure`, `scenic_byway`, `desert` — any other value is a bug requiring a Boy Scout fix before recording PASS.
MUST: Write archetype distribution counts to `.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json` as a dict mapping archetype name to integer count.
MUST: Note the Phase 1 classification reality in `baseline-report.md` — because `curvature_score=0.5` and most routes are FHWA source with coastal states, the expected distribution in Phase 1 is predominantly `coastal` and `scenic_byway`. This is a known Phase 1 limitation, not a bug.
NEVER: Modify the `ARCHETYPES` frozenset or classification rules in `archetype.py` — this task is validation only.
NEVER: Classify routes not present in `baseline/scores.json` from BASE-004.
NEVER: Expect all 6 archetypes to appear in a 20-route FHWA sample — the FHWA corpus skews heavily coastal/scenic_byway in Phase 1.
STRICTLY: Validate that `primary_archetype` is in the `ARCHETYPES` frozenset for every record — assert rather than assume.
STRICTLY: Write `archetype_counts.json` as a JSON object (dict), not a list.

--------------------------------------------------------------------------------
SPECIFICATION
--------------------------------------------------------------------------------

**Objective:** Add a minimal `__main__` block to `classification/archetype.py` so it can be run as `python -m scripts.curation.pipeline.classification.archetype`, run it on the 20 scored routes from `baseline/scores.json` + `staging/fhwa.jsonl`, verify every route has a valid `primary_archetype`, capture the archetype distribution in `baseline/archetype_counts.json`, and append the classification section to `baseline-report.md`.

**Success looks like:** `baseline/archetype_counts.json` is a JSON object with at least one non-zero archetype count; every classified route has `primary_archetype` in the 6-value frozenset; `secondary_tags` is a list (may be empty); `baseline-report.md` classification section notes the distribution and the Phase 1 coastal/scenic_byway dominance; Boy Scout `__main__` fix committed separately.

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** `classification/archetype.py` has a `classify(route, scores) -> EnrichedRoute` function but no `__main__` block. As with the other pipeline stages, Epic 2 needs a runnable entry point to validate archetype assignment against real data.

**Why it matters:** The archetype classifier is the deterministic finishing stage — it maps routes into one of 6 buckets that drive the mobile app's discovery filters. If Phase 1 produces skewed distributions (e.g., 100% coastal because `curvature_score` is always 0.5), that's a known limitation to document — but any route with an *invalid* archetype (not in the 6-value set) is a bug that must be fixed inline.

**Current state:** `ARCHETYPES = frozenset({"twisties", "mountain", "coastal", "adventure", "scenic_byway", "desert"})`. `classify(route: Route, scores: dict) -> EnrichedRoute` takes a Route and the output of `compute_scores()` and returns an EnrichedRoute with `primary_archetype` and `secondary_tags`. The classification rules are deterministic — Phase 1 favors `coastal` / `scenic_byway` heavily because curvature and elevation scores are neutral 0.5.

**Desired state:** `classification/archetype.py` has a `__main__` block with `--routes`, `--scores`, `--out`, `--count` argparse flags. The block joins Route objects (from `staging/fhwa.jsonl`) with score dicts (from `baseline/scores.json`) by `route_id`, calls `classify()` on each pair, counts the archetype distribution with `collections.Counter`, and writes the count dict to `--out`. Running `python -m scripts.curation.pipeline.classification.archetype --routes staging/fhwa.jsonl --scores .spec/.../baseline/scores.json --out .spec/.../baseline/archetype_counts.json --count 20` produces a JSON dict mapping archetype names to integer counts.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Classification module runnable as python -m
  GIVEN: classification/archetype.py has a __main__ block (Boy Scout fix, committed separately), baseline/scores.json exists from BASE-004, and staging/fhwa.jsonl exists from BASE-001
  WHEN: `python -m scripts.curation.pipeline.classification.archetype --routes staging/fhwa.jsonl --scores .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json --count 20` is executed
  THEN: the module exits 0 and baseline/archetype_counts.json is written as a JSON object

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_classification_runnable
  VERIFY: `python -m scripts.curation.pipeline.classification.archetype --routes staging/fhwa.jsonl --scores .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json --count 20 && python -c "import json; d=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json')); assert isinstance(d,dict); print('archetype_counts written PASS')"`

AC-2: All primary_archetype values are valid
  GIVEN: the classification run from AC-1 completed (EnrichedRoute results available)
  WHEN: primary_archetype field is checked on every classified route
  THEN: every value is exactly one of: twisties, mountain, coastal, adventure, scenic_byway, desert; no nulls or empty strings

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md)
  TEST_FUNCTION: verify_archetype_values_valid
  VERIFY: `python -c "import json; valid={'twisties','mountain','coastal','adventure','scenic_byway','desert'}; counts=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json')); bad=[k for k in counts if k not in valid]; assert not bad, f'Invalid archetypes: {bad}'; print('archetype validity PASS')"`

AC-3: Archetype distribution recorded in baseline-report.md
  GIVEN: baseline/archetype_counts.json passed AC-2
  WHEN: baseline-report.md classification section is inspected
  THEN: it contains archetype counts and a note about Phase 1 coastal/scenic_byway dominance

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: (validation recorded in baseline-report.md — self-referential)
  TEST_FUNCTION: verify_classification_section_in_report
  VERIFY: `grep -q 'archetype' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -qE 'scenic_byway|coastal' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo 'archetype section in report PASS'`

Quality Criteria:
- [ ] All archetype keys in the 6-value set
- [ ] Phase 1 skew noted (not a bug)
- [ ] archetype_counts.json is a valid JSON dict

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | `python -m scripts.curation.pipeline.classification.archetype` exits 0 and writes baseline/archetype_counts.json as a dict | AC-1 | `python -m scripts.curation.pipeline.classification.archetype --routes staging/fhwa.jsonl --scores .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json --count 20 && python -c "import json; assert isinstance(json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json')),dict)"` | [ ] TRUE [ ] FALSE |
| 2 | Every key in baseline/archetype_counts.json is one of the 6 valid archetypes | AC-2 | `python -c "import json; valid={'twisties','mountain','coastal','adventure','scenic_byway','desert'}; d=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json')); assert all(k in valid for k in d), f'Invalid keys: {[k for k in d if k not in valid]}'"` | [ ] TRUE [ ] FALSE |
| 3 | baseline-report.md classification section mentions 'archetype' and at least one of 'scenic_byway' or 'coastal' | AC-3 | `grep -q 'archetype' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && grep -qE 'scenic_byway\|coastal' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md` | [ ] TRUE [ ] FALSE |

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/classification/archetype.py
   - Lines: ALL
   - Focus: `classify()` signature (takes Route + `dict[str, float]`, returns EnrichedRoute), `ARCHETYPES` frozenset, Phase 1 rule logic — design `__main__` around `classify(Route, scores_dict)`

2. scripts/curation/pipeline/models.py
   - Lines: 31-53
   - Focus: `EnrichedRoute` dataclass fields — understand what `classify()` returns; use `dataclasses.asdict()` or attribute access to count archetypes

3. .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/EPIC.md
   - Lines: 31
   - Focus: Human test step 6 — verify 1-of-6 archetypes, distribution captured

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/classification/archetype.py (MODIFY — add `__main__` block only, Boy Scout fix, commit separately)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json (NEW — archetype distribution dict)
- .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md (APPEND — classification section)

WRITE-PROHIBITED:
- scripts/curation/pipeline/classification/archetype.py `ARCHETYPES` frozenset or rule logic — do NOT modify classification rules
- scripts/curation/pipeline/scoring/** — BASE-004 territory
- scripts/curation/pipeline/sync/** — BASE-007 territory
- baseline/scores.json — read-only input from BASE-004

MUST:
- [ ] Join Route objects with score dicts by `route_id` (not by list index)
- [ ] Validate every `primary_archetype` is in ARCHETYPES before writing
- [ ] Note Phase 1 neutrality in baseline-report.md

MUST NOT:
- [ ] Modify classification rules
- [ ] Force all 6 archetypes to appear

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Pattern: adding a `__main__` block that joins two inputs (Route JSONL + scores JSON array) by key, invokes a pure classifier function, and writes a distribution count dict.

```python
if __name__ == "__main__":
    import sys
    import json
    import argparse
    import dataclasses
    import logging
    from pathlib import Path
    from collections import Counter
    from scripts.curation.pipeline.models import Route

    logging.basicConfig(level=logging.INFO)
    p = argparse.ArgumentParser()
    p.add_argument("--routes", required=True, help="Input JSONL of Route records")
    p.add_argument("--scores", required=True, help="Input JSON array of scored routes")
    p.add_argument("--out", required=True, help="Output JSON dict of archetype counts")
    p.add_argument("--count", type=int, default=None)
    args = p.parse_args()

    routes = [Route(**json.loads(l)) for l in open(args.routes)]
    scores_list = json.load(open(args.scores))
    scores_by_id = {s["route_id"]: s for s in scores_list}
    if args.count:
        routes = routes[: args.count]

    enriched = [classify(r, scores_by_id.get(r.route_id, {})) for r in routes]
    dist = Counter(e.primary_archetype for e in enriched)

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w") as f:
        json.dump(dict(dist), f, indent=2)

    print(f"Classified {len(enriched)} routes: {dict(dist)}")
```

**Pattern source:** `classify()` signature in `scripts/curation/pipeline/classification/archetype.py`; `Counter` is the idiomatic way to compute distribution from an iterable.

**Anti-pattern:** Do NOT look up scores by list index — routes from `staging/fhwa.jsonl` and scores in `scores.json` may be in different orders; always join by `route_id`. Do NOT modify the classification rules to force all 6 archetypes to appear — the Phase 1 skew is expected.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: python-implement

## EXECUTION

### Step 1: Boy Scout __main__ fix
  READ: `classification/archetype.py` — confirm `classify()` signature and `ARCHETYPES` frozenset
  WRITE: Append the `__main__` block per the CODE PATTERN section
  COMMIT: Separate commit with rationale "Add __main__ for Epic 2 baseline archetype validation (Boy Scout)"

### Step 2: Run classification (AC-1, AC-2)
  DO: Run the command from AC-1's VERIFY
  CAPTURE: baseline/archetype_counts.json content

### Step 3: Record in baseline-report.md (AC-3)
  WRITE: Classification section with distribution dict + Phase 1 skew note
  VERIFY: grep confirms 'archetype' and 'scenic_byway|coastal' present

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER AC-1:
  RUN: the AC-1 VERIFY command
  EXPECT: "archetype_counts written PASS"

AFTER AC-2:
  RUN: the AC-2 VERIFY command
  EXPECT: "archetype validity PASS"
  IF FAIL: An invalid archetype key is a Phase 1 classifier bug — investigate, may require Boy Scout fix to `classify()` output

AFTER AC-3:
  RUN: the AC-3 VERIFY command
  EXPECT: "archetype section in report PASS"

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent:** python-implement
**Rationale:** Pure Python classifier validation; python-implement owns `scripts/curation/pipeline/classification/`.

**Review Agent:** python-review
**Rationale:** Verifies no ARCHETYPES modifications, join-by-id (not index), Counter usage.

**Assignment Date:** 2026-04-12

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Classification exits 0 and writes archetype_counts.json
  Command: `python -m scripts.curation.pipeline.classification.archetype --routes staging/fhwa.jsonl --scores .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/scores.json --out .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json --count 20 && echo PASS`
  Expected: PASS

Gate 2: All archetype keys are valid
  Command: `python -c "import json; valid={'twisties','mountain','coastal','adventure','scenic_byway','desert'}; d=json.load(open('.spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline/archetype_counts.json')); assert all(k in valid for k in d); print('PASS')"`
  Expected: PASS

Gate 3: archetype section in baseline-report.md
  Command: `grep -q 'archetype' .spec/prds/curation-hardening/tasks/epic-02-baseline-pipeline-validation/baseline-report.md && echo PASS`
  Expected: PASS

--------------------------------------------------------------------------------
REVIEW CRITERIA (for python-review)
--------------------------------------------------------------------------------

TDD Quality (INFRA adaptation):
- [ ] All 3 ACs verified via VERIFY commands
- [ ] Boy Scout `__main__` in separate commit

Code Quality:
- [ ] Join by `route_id` (not list index)
- [ ] `collections.Counter` used
- [ ] No ARCHETYPES modifications

Domain-Specific:
- [ ] Phase 1 skew documented in baseline-report.md
- [ ] archetype_counts.json is a valid JSON dict

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- BASE-004 — needs `baseline/scores.json` to join with Routes by `route_id`

Blocks:
- BASE-008 — Curation Review Protocol step 8 verifies classification

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] BASE-004 complete (baseline/scores.json exists)
- [ ] BASE-001 complete (staging/fhwa.jsonl exists)

Can Execute In Parallel With: BASE-007 (Convex push dry-run — uses scores.json but different pipeline stage)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- Phase 1 archetype distribution is expected to be heavily `coastal` / `scenic_byway` because curvature/elevation scores are neutral. Document this in baseline-report.md as a known limitation, not a bug.
- Epic 8 will improve archetype diversity by adding OSM curvature, HPMS AADT, and NWS weather signals that drive `mountain` / `adventure` / `desert` classifications.
- This task was extracted from the archived BASE-001.md (the 240-minute single task) during the Epic 2 decomposition on 2026-04-12.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
