================================================================================
TASK: PIPE-008 - Archetype classifier
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
TDD_PHASE: RED
CURRENT_AC: AC-1
PRIORITY: P1
EFFORT: M
TYPE: DEV
ITERATION: 1

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** Routes that have been scored by the composite scoring engine (PIPE-007) have no semantic category — they are numeric scores without a human-readable ride type label. Discovery UI filters require a `primary_archetype` field on every route record, and Convex schema requires `primaryArchetype` to be one of 6 known literals. Without classification, routes cannot be filtered by ride type in any discovery query.

**Why it matters:** `primaryArchetype` is one of the most important discovery filters for riders ("show me twisties in Tennessee"). It drives Convex indexes and all archetype-filter SQL queries on the local discovery.db. Per PRD principle AD-6 and the system component description, the archetype classifier is explicitly "deterministic — no LLM involvement." A rule-based decision tree is required. Classification must be reproducible.

**Current state:** No `pipeline/classification/archetype.py` file exists. `Route` dataclass has `primary_archetype: str` and `secondary_tags: list[str]` fields (from PIPE-001, defaulting to `""` and `[]`). The scoring engine (PIPE-007) produces `curvature_score`, `scenic_score`, `technical_score`, `traffic_score`, and `remoteness_score` in a scores dict. No classification logic has been written.

**Desired state:** `pipeline/classification/archetype.py` exports a `classify(route: Route, scores: dict[str, float]) -> Route` function that assigns `primary_archetype` to one of the 6 PRD literals and populates `secondary_tags` with up to 3 string tags. The function is deterministic, pure, and falls back to `"scenic_byway"` when no specific archetype matches. The route returned is a new dataclass instance with the classification fields set — the input is not mutated.

> NOTE: Classification rules are defined in PRD `.spec/prds/curation/10-trd-detail.md` §5 (Archetype Classifier). Implementer MUST read that section in full before writing any rule logic. The decision tree in §5 is the authoritative source. The 6 valid archetype literals are: `twisties`, `mountain`, `coastal`, `adventure`, `scenic_byway`, `desert`.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: classify assigns "twisties" to a high-curvature, low-elevation route
  GIVEN: a scored Route where curvature_score is high (>=0.8) and elevation characteristics do not indicate mountain archetype
  WHEN: `classify(route, scores)` is called
  THEN: the returned Route has `primary_archetype == "twisties"`

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/classification/test_archetype.py
  TEST_FUNCTION: test_classify_assigns_twisties_for_high_curvature_route

AC-2: classify assigns "coastal" to a route with high coastal proximity and FHWA designation
  GIVEN: a scored Route with `source="fhwa"` and `state` indicating a coastal state, and scenic_score elevated from scenic designation
  WHEN: `classify(route, scores)` is called
  THEN: the returned Route has `primary_archetype == "coastal"`

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/classification/test_archetype.py
  TEST_FUNCTION: test_classify_assigns_coastal_for_coastal_proximity_route

AC-3: classify is deterministic — same input produces same output on repeated calls
  GIVEN: a scored Route instance and its scores dict
  WHEN: `classify(route, scores)` is called twice with identical arguments
  THEN: both calls return a Route with identical `primary_archetype` and identical `secondary_tags`

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/classification/test_archetype.py
  TEST_FUNCTION: test_classify_is_deterministic

AC-4: classify falls back to "scenic_byway" when no specific archetype rule matches
  GIVEN: a scored Route where no archetype rule applies (moderate curvature, no coastal proximity, low elevation, paved surface, no BDR designation)
  WHEN: `classify(route, scores)` is called
  THEN: the returned Route has `primary_archetype == "scenic_byway"` (the default fallback)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/classification/test_archetype.py
  TEST_FUNCTION: test_classify_falls_back_to_scenic_byway_when_no_rule_matches

Quality Criteria:
- [ ] All 4 tests pass
- [ ] Lint passes with zero errors
- [ ] No unhandled exceptions on any valid Route + scores input
- [ ] RED evidence before each implementation phase

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | classify returns a Route with primary_archetype="twisties" when curvature_score >= 0.8 and no mountain/adventure signal | AC-1 | `python -m pytest tests/classification/test_archetype.py::test_classify_assigns_twisties_for_high_curvature_route -v` | [ ] TRUE  [ ] FALSE |
| 2 | the Route returned by classify is a new instance — original Route is not mutated | AC-1 | `python -m pytest tests/classification/test_archetype.py::test_classify_assigns_twisties_for_high_curvature_route -v` | [ ] TRUE  [ ] FALSE |
| 3 | classify returns primary_archetype="coastal" for a route with coastal proximity signal | AC-2 | `python -m pytest tests/classification/test_archetype.py::test_classify_assigns_coastal_for_coastal_proximity_route -v` | [ ] TRUE  [ ] FALSE |
| 4 | calling classify twice with the same route and scores returns identical primary_archetype | AC-3 | `python -m pytest tests/classification/test_archetype.py::test_classify_is_deterministic -v` | [ ] TRUE  [ ] FALSE |
| 5 | calling classify twice with the same route and scores returns identical secondary_tags | AC-3 | `python -m pytest tests/classification/test_archetype.py::test_classify_is_deterministic -v` | [ ] TRUE  [ ] FALSE |
| 6 | classify returns primary_archetype="scenic_byway" when route matches no specific archetype rule | AC-4 | `python -m pytest tests/classification/test_archetype.py::test_classify_falls_back_to_scenic_byway_when_no_rule_matches -v` | [ ] TRUE  [ ] FALSE |

TC-1: twisties archetype assigned
  Statement: classify returns a Route with primary_archetype="twisties" when curvature_score is >= 0.8 and no surface or elevation signal overrides to adventure or mountain
  Maps To: AC-1
  Verify: `python -m pytest tests/classification/test_archetype.py::test_classify_assigns_twisties_for_high_curvature_route -v`
  Status: [ ] TRUE  [ ] FALSE

TC-2: coastal archetype assigned
  Statement: classify returns primary_archetype="coastal" for a Route with coastal geographic or designation signal
  Maps To: AC-2
  Verify: `python -m pytest tests/classification/test_archetype.py::test_classify_assigns_coastal_for_coastal_proximity_route -v`
  Status: [ ] TRUE  [ ] FALSE

TC-3: determinism verified
  Statement: classify produces identical primary_archetype and secondary_tags on two calls with the same inputs — no randomness or side effects
  Maps To: AC-3
  Verify: `python -m pytest tests/classification/test_archetype.py::test_classify_is_deterministic -v`
  Status: [ ] TRUE  [ ] FALSE

TC-4: scenic_byway fallback
  Statement: classify returns primary_archetype="scenic_byway" when no rule fires — this is the explicit default, not an unhandled case
  Maps To: AC-4
  Verify: `python -m pytest tests/classification/test_archetype.py::test_classify_falls_back_to_scenic_byway_when_no_rule_matches -v`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `.spec/prds/curation/10-trd-detail.md`
   - Section: 5. Archetype Classifier (decision tree, rule ordering, archetype literals)
   - Focus: AUTHORITATIVE decision tree — all rule conditions, priority order, and the `scenic_byway` fallback. Read this first, before writing any code.

2. `.spec/prds/curation/09-technical-requirements.md`
   - Section: System Components — Archetype Classifier
   - Focus: "Decision tree mapping features to ride archetypes. Deterministic — no LLM involvement (violates P1)." Confirms the constraint.

3. `.spec/prds/curation/09-technical-requirements.md`
   - Section: Convex: curated_routes lean tier schema
   - Focus: `primaryArchetype` union of 6 literals and `secondaryTags: string[]` — these are the exact field values the classifier must produce

4. `scripts/curation/pipeline/models.py`
   - Lines: ALL
   - Focus: `Route.primary_archetype` and `Route.secondary_tags` field types and defaults; `Route.source` for BDR detection

5. `scripts/curation/pipeline/scoring/composite.py`
   - Lines: ALL
   - Focus: Score key names returned by `compute_scores` — classifier receives the same dict as its `scores` parameter

6. `.spec/prds/curation/03-functional-groups.md`
   - Section: QUALITY — Quality Scoring
   - Focus: "Archetypes: twisties, mountain_epic, coastal, adventure, scenic_byway, desert" — note the PRD uses `mountain_epic` in one place but the schema uses `mountain`; the Convex schema literal `mountain` is authoritative

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/classification/archetype.py (NEW)
- scripts/curation/tests/classification/__init__.py (NEW)
- scripts/curation/tests/classification/test_archetype.py (NEW)

WRITE-PROHIBITED:
- scripts/curation/pipeline/models.py — Route dataclass is PIPE-001, do not modify
- scripts/curation/pipeline/scoring/composite.py — scoring is PIPE-007, do not modify
- scripts/curation/pipeline/sources/fhwa.py — ingestion is PIPE-002
- scripts/curation/pipeline/sync/convex_push.py — push module is PIPE-005
- Any file not explicitly listed above

MUST:
- [ ] Function signature: `def classify(route: Route, scores: dict[str, float]) -> Route`
- [ ] Return a new Route instance — do NOT mutate the input route
- [ ] `primary_archetype` must be one of exactly 6 string literals: `"twisties"`, `"mountain"`, `"coastal"`, `"adventure"`, `"scenic_byway"`, `"desert"`
- [ ] `secondary_tags` must be a list of up to 3 strings (empty list is acceptable)
- [ ] Fallback to `"scenic_byway"` when no rule fires — never return an empty or None archetype
- [ ] Decision tree rule order must match PRD §5 — adventure first, then coastal, then mountain, then twisties, then scenic_byway, then desert
- [ ] Function is pure — no I/O, no global state mutation, no randomness

MUST NOT:
- [ ] Use any LLM or ML model — decision tree only (PRD AD-6, P1)
- [ ] Return an archetype string not in the 6-literal set above
- [ ] Mutate the input Route object
- [ ] Call any external API, file system, or network
- [ ] Write implementation before the test for that AC fails

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```python
# scripts/curation/pipeline/classification/archetype.py
# Pattern: pure function, decision tree, no mutation, dataclasses.replace for new instance
# Source: PRD S9-TRD-5 (10-trd-detail.md §5) — READ THAT SECTION FIRST

from __future__ import annotations
from dataclasses import replace
from scripts.curation.pipeline.models import Route

# Valid archetype literals — matches Convex curated_routes.primaryArchetype union
ARCHETYPES = frozenset({
    "twisties", "mountain", "coastal", "adventure", "scenic_byway", "desert"
})

# Coastal US states — used as a proxy for coastal proximity in Phase 1
# Phase 2 will use actual geographic distance to coastline
COASTAL_STATES = frozenset({
    "CA", "OR", "WA", "ME", "NH", "MA", "RI", "CT", "NY", "NJ",
    "DE", "MD", "VA", "NC", "SC", "GA", "FL", "AL", "MS", "LA", "TX",
    "AK", "HI"
})

def classify(route: Route, scores: dict[str, float]) -> Route:
    """
    Classify a scored Route into one of 6 archetypes.

    Pure function — returns a new Route with primary_archetype and secondary_tags set.
    Input Route is not mutated.

    Rule priority order from PRD S9-TRD-5:
      1. adventure (surface or BDR source overrides everything)
      2. coastal   (coastal proximity + scenic designation)
      3. mountain  (high elevation gain)
      4. twisties  (high curvature score)
      5. scenic_byway (FHWA designation — default for most Phase 1 routes)
      6. desert    (low curvature, remote, arid — implicit fallback after scenic_byway)

    Falls back to "scenic_byway" when no specific rule fires.

    Source: PRD S9-TRD-5 (10-trd-detail.md §5)
    """
    curvature = scores.get("curvature_score", 0.0)
    remoteness = scores.get("remoteness_score", 0.0)
    secondary: list[str] = []

    # Rule 1: adventure — surface material or BDR source overrides all other rules
    # Implementer: fill in actual condition from PRD §5 and Route field names
    # if route.surface in ("gravel", "dirt", "mixed") or route.source == "bdr":
    #     return replace(route, primary_archetype="adventure", secondary_tags=secondary)

    # Rule 2: coastal — coastal state + scenic designation proxy
    if route.state in COASTAL_STATES and route.source == "fhwa":
        secondary = ["scenic", "designated"]
        return replace(route, primary_archetype="coastal", secondary_tags=secondary)

    # Rule 3: mountain — high elevation gain (requires elevation data from Phase 2)
    # Implementer: add elevation_gain_m field check once PIPE-007 enriches elevation
    # if getattr(route, "elevation_gain_m", None) and route.elevation_gain_m > 1200:
    #     return replace(route, primary_archetype="mountain", secondary_tags=secondary)

    # Rule 4: twisties — high curvature score
    if curvature >= 0.8:
        secondary = ["technical"]
        if curvature >= 0.9:
            secondary.append("legendary")
        return replace(route, primary_archetype="twisties", secondary_tags=secondary)

    # Rule 5: scenic_byway — FHWA designated routes default here
    if route.source == "fhwa":
        return replace(route, primary_archetype="scenic_byway", secondary_tags=secondary)

    # Rule 6: desert / default fallback
    if remoteness >= 0.6:
        return replace(route, primary_archetype="desert", secondary_tags=secondary)

    # Final fallback — should cover all remaining cases
    return replace(route, primary_archetype="scenic_byway", secondary_tags=secondary)
```

```python
# scripts/curation/tests/classification/test_archetype.py
# Pattern: one test per AC, Route construction helpers, no mocking needed

import pytest
from dataclasses import replace
from scripts.curation.pipeline.models import Route
from scripts.curation.pipeline.classification.archetype import classify

def _make_route(**kwargs) -> Route:
    defaults = dict(
        route_id="test-001", name="Test Road", state="TN",
        source="fhwa", centroid_lat=35.5, centroid_lng=-84.0,
    )
    defaults.update(kwargs)
    return Route(**defaults)

def _minimal_scores(**overrides) -> dict:
    base = {
        "curvature_score": 0.3,
        "scenic_score": 0.5,
        "technical_score": 0.3,
        "traffic_score": 0.5,
        "remoteness_score": 0.3,
        "composite_score": 0.4,
    }
    base.update(overrides)
    return base

def test_classify_assigns_twisties_for_high_curvature_route():
    # GIVEN: a Route with curvature_score >= 0.8, no coastal or adventure signals
    route = _make_route(state="TN", source="fhwa")
    scores = _minimal_scores(curvature_score=0.85)
    # WHEN: classify is called
    result = classify(route, scores)
    # THEN: primary_archetype is "twisties"
    assert result.primary_archetype == "twisties"
    # AND: input Route is not mutated
    assert route.primary_archetype != "twisties" or route is not result
```

> NOTE: The `Route` dataclass as written in PIPE-001 uses snake_case field names (`primary_archetype`, `secondary_tags`). The Convex schema uses camelCase (`primaryArchetype`, `secondaryTags`). PIPE-005 is responsible for the serialization mapping. The classifier works with Python snake_case names.

> NOTE: The TRD §5 decision tree references `surface` as a Route field (for adventure classification). PIPE-001's `Route` dataclass does not currently include a `surface` field — it is only available after Phase 2/3 LLM extraction. For Phase 1 (FHWA seed data), the adventure rule that depends on surface should be present in the code as a commented-out condition with a `# Phase 2` annotation, not silently omitted.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: general-purpose

## BEFORE WRITING ANY CODE:
  READ: `.spec/prds/curation/10-trd-detail.md` §5 (Archetype Classifier) in full
  READ: `scripts/curation/pipeline/models.py` — Route field names (snake_case)
  READ: `scripts/curation/pipeline/scoring/composite.py` — score dict key names
  CONFIRM: The 6 valid archetype literals from the PRD schema

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, PRD §5 decision tree, Route field names
  WRITE: ONE test function for this AC in test_archetype.py
  CREATE: Empty `scripts/curation/pipeline/classification/archetype.py` if not yet present (to avoid ImportError masking RED)
  RUN: `cd scripts/curation && python -m pytest tests/classification/test_archetype.py -v`
  VERIFY: Test FAILS with AssertionError (not ImportError — empty module is fine for RED)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  MUST: Show actual test failure output
  MUST NOT: Write any classify() implementation yet

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ: Failing test, AC definition, PRD §5 decision tree
  WRITE: MINIMAL rule(s) in classify() to pass that test
  RUN: `cd scripts/curation && python -m pytest tests/classification/test_archetype.py -v`
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  MUST: Implement actual PRD decision tree rules, not trivial hardcoding
  MUST NOT: Add rules for future ACs while implementing the current one

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ: Implementation just written
  WRITE: Improved code if needed (extract helpers, clean up conditions, add docstrings)
  RUN: `cd scripts/curation && python -m pytest tests/classification/ -v`
  VERIFY: All tests still pass
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

  MUST: Keep tests green
  MUST NOT: Add new behavior

## AFTER ALL ACS COMPLETE:
  Orchestrator dispatches feature-dev:code-reviewer

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

After each agent phase, orchestrator MUST verify independently:

AFTER RED PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/classification/test_archetype.py -v`
  EXPECT: Exit code != 0, failure for the new test function
  IF PASS: Reject "Vanity test — passes without implementation"
  IF IMPORT ERROR: Reject "Test has import error, not valid RED — ensure empty archetype.py exists"

AFTER GREEN PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/classification/test_archetype.py -v`
  EXPECT: Exit code 0, all tests written so far pass

AFTER REFACTOR PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/classification/ -v`
  EXPECT: Exit code 0, all tests still pass
  ALSO RUN: `cd scripts/curation && python -m pytest tests/ -v`
  EXPECT: No regressions in scoring or ingestion test modules

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: general-purpose
**Rationale**: Decision tree classification using pure Python conditionals. No specialized framework knowledge required. The challenge is reading the PRD §5 decision tree carefully and translating rule priority correctly. No Python-specialist agent exists in the LaneShadow agent roster; general-purpose is the correct assignment for Python FEATURE tasks.

**Review Agent**: feature-dev:code-reviewer
**Rationale**: Review should verify that rule priority order matches PRD §5 exactly (adventure before coastal before mountain before twisties), that the fallback is `"scenic_byway"` (not `None` or `""`), that the input Route is not mutated, and that all 6 archetype literals are spelled correctly to match the Convex schema union.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard agent-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: FEATURE (DEV)
- File Patterns: pipeline/classification/archetype.py, tests/classification/test_archetype.py
- Implementation: general-purpose — rule-based decision tree, stdlib only
- Review: feature-dev:code-reviewer — validates rule order, literal correctness, no mutation

**Override**: If manual agent assignment is needed, specify agents in task labels

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All Tests Pass
  Command: `cd scripts/curation && python -m pytest tests/classification/test_archetype.py -v`
  Expected: Exit 0, all 4 tests pass

Gate 2: Each AC Has Test
  Verify: test_archetype.py contains one test function per AC (4 functions)

Gate 3: RED Phase Evidence
  Required: Each test written before its classify() rule was implemented (commit history or inline comments)

Gate 4: Archetype Literals Correct
  Verify (reviewer check): all `primary_archetype` values returned by classify() are in the exact set {"twisties", "mountain", "coastal", "adventure", "scenic_byway", "desert"}

Gate 5: No Mutation
  Verify (reviewer check): classify() uses `dataclasses.replace()` or equivalent — input Route object fields unchanged after call

Gate 6: Lint
  Command: `python -m py_compile scripts/curation/pipeline/classification/archetype.py`
  Expected: Exit 0

Gate 7: Scope Compliance
  Command: `git diff --name-only`
  Expected: Only archetype.py, tests/classification/__init__.py, tests/classification/test_archetype.py

--------------------------------------------------------------------------------
REVIEW CRITERIA (for feature-dev:code-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] One test per acceptance criterion
- [ ] Tests verify observable output (primary_archetype string, secondary_tags list) not internals
- [ ] RED evidence before each implementation
- [ ] AC-3 determinism test makes two calls and compares both archetype and secondary_tags

Code Quality:
- [ ] classify() is a pure function — no I/O, no global mutation, no randomness
- [ ] Uses `dataclasses.replace()` to produce new Route — input is not mutated
- [ ] Constants (COASTAL_STATES, ARCHETYPES) are defined at module level, not inside the function
- [ ] Phase 2 rules (surface, elevation_gain_m) are present as commented-out conditions with `# Phase 2` annotation

Domain-Specific:
- [ ] Rule priority order matches PRD §5: adventure > coastal > mountain > twisties > scenic_byway > desert
- [ ] Fallback is exactly `"scenic_byway"` — not None, not "", not "desert"
- [ ] All 6 archetype strings are lowercase with underscore separators (e.g., `scenic_byway`, not `ScenicByway`)
- [ ] `secondary_tags` is always a list (empty list acceptable, never None)
- [ ] Adventure rule fires on `source == "bdr"` or gravel/dirt/mixed surface (Phase 2 surface check is noted/commented)
- [ ] `mountain` archetype literal used, NOT `mountain_epic` (one PRD section uses mountain_epic but Convex schema is authoritative)

Security:
- [ ] No external API calls in classify()
- [ ] No file I/O in classify()

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- PIPE-001 — needs Route dataclass and `pipeline/classification/` package scaffold
- PIPE-007 — consume scores dict produced by compute_scores(); archetype rules reference curvature_score and remoteness_score

Blocks:
- PIPE-005 — push module sends classified routes; integration testing benefits from having a valid primary_archetype on pushed records

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] PIPE-001 complete — Route dataclass exists at pipeline/models.py
- [ ] PIPE-007 complete — compute_scores() exists and returns dict with known key names
- [ ] PRD §5 Archetype Classifier reviewed — implementer must understand decision tree before starting

Can Execute In Parallel With: PIPE-002 (FHWA ingestion), PIPE-005 (push module can be developed with mock scored routes)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- **`mountain` vs `mountain_epic` literal**: The QUALITY functional group description in `03-functional-groups.md` uses `mountain_epic`, but the Convex curated_routes schema (the authoritative source) uses `mountain`. The Convex schema union is `"twisties" | "mountain" | "coastal" | "adventure" | "scenic_byway" | "desert"`. Use `"mountain"` — never `"mountain_epic"`.

- **Phase 1 limitation — surface field**: The TRD §5 decision tree uses `surface in ("gravel","dirt","mixed")` as the first condition for the adventure archetype. The Phase 1 `Route` dataclass (PIPE-001) does not include a `surface` field — surface is only available after Phase 2/3 LLM extraction. For Phase 1, the adventure rule should check `route.source == "bdr"` as a proxy and leave the surface condition as a commented-out `# Phase 2` block. This keeps the rule order correct and makes the Phase 2 enhancement obvious to the next implementer.

- **Phase 1 limitation — elevation field**: The mountain archetype rule requires `elevation_gain_m > 1200`. This field is only available after Phase 2/3 enrichment. Similar to the surface field, add it as a commented-out condition with a `# Phase 2` annotation.

- **coastal proxy for Phase 1**: Without actual geographic coastline distance data, use `COASTAL_STATES` set membership as a proxy. This is a Phase 1 approximation only. Phase 2 geometric enrichment (elevation.py) will replace this with actual coastal distance.

- **Input immutability**: The `Route` dataclass is a standard Python `@dataclass` (not frozen). The classifier MUST use `dataclasses.replace(route, ...)` to return a new instance — do not set fields directly (`route.primary_archetype = "twisties"` is wrong and would mutate the caller's object).

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
