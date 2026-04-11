================================================================================
TASK: PIPE-007 - Composite scoring engine
================================================================================

TASK_TYPE: FEATURE
STATUS: Backlog
TDD_PHASE: RED
CURRENT_AC: AC-1
PRIORITY: P0
EFFORT: M
TYPE: DEV
ITERATION: 1

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** Routes ingested from any source need objective, multi-dimensional quality scores to enable ranked discovery. Without scoring, routes cannot be sorted by composite quality, filtered by archetype suitability, or prioritized in the Convex lean tier.

**Why it matters:** The composite score is the single most important field for the discovery experience — it is the primary `ORDER BY` field in every SQL discovery query. It must be deterministic and reproducible. PRD principle AD-6 explicitly states: "Scoring is deterministic code, never LLM output." This task implements that principle.

**Current state:** No scoring module exists. `EnrichedRoute` dataclass has score fields (`composite_score`, `curvature_score`, `scenic_score`, `technical_score`, `traffic_score`, `remoteness_score`) all defaulting to 0.0 (from PIPE-001). No formula has been implemented.

**Desired state:** `pipeline/scoring/composite.py` exports a `compute_scores(route: Route) -> dict` function that returns all 6 scores clamped to [0.0, 1.0]. The composite score is the weighted sum of the 5 component scores per PRD S9-TRD-4 formula. The function is a pure function — same input always produces the same output. Missing optional route fields produce sensible score defaults rather than exceptions.

NOTE: Exact scoring weights and lookup-table values are specified in PRD S9-TRD-4 (`.spec/prds/curation/10-trd-detail.md`, Section 4) and the architecture diagram in `09-technical-requirements.md`. The implementer MUST read those sections before writing any scoring logic. The weights documented in the TRD (curvature ~25%, scenery ~15%, traffic ~15%, condition ~10%, elevation ~10%, designation ~10%, community ~10%, remoteness ~5%) are approximate — the TRD Section 4.2 contains the authoritative formula.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: compute_scores returns all 6 scores in [0.0, 1.0] for a fully-populated Route
  GIVEN: a Route with all scoring-relevant fields populated (curvature data, scenic designation, surface, elevation, etc.)
  WHEN: `compute_scores(route)` is called
  THEN: it returns a dict with keys: curvature_score, scenic_score, technical_score, traffic_score, remoteness_score, composite_score, and every value is a float in [0.0, 1.0] inclusive

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/scoring/test_composite.py
  TEST_FUNCTION: test_compute_scores_returns_all_six_scores_in_range

AC-2: composite_score equals weighted sum of component scores
  GIVEN: a Route where the 5 component scores are known or predictable from input
  WHEN: `compute_scores(route)` is called
  THEN: the composite_score value equals the weighted sum of the 5 component scores using the weights from PRD S9-TRD-4, within floating-point tolerance (1e-6)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/scoring/test_composite.py
  TEST_FUNCTION: test_composite_score_equals_weighted_sum_of_components

AC-3: compute_scores is deterministic — same input yields same output
  GIVEN: a Route instance
  WHEN: `compute_scores(route)` is called twice with the same route
  THEN: both calls return identical dicts — no randomness, no side effects, no global mutable state

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/scoring/test_composite.py
  TEST_FUNCTION: test_compute_scores_is_deterministic

AC-4: compute_scores handles Routes with missing optional fields gracefully
  GIVEN: a Route with only required fields (route_id, name, state, source, centroid_lat, centroid_lng) — no length_miles, no elevation data, no curvature attributes
  WHEN: `compute_scores(route)` is called
  THEN: no exception is raised, all 6 score keys are present in the returned dict, and each value is a float in [0.0, 1.0]

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/scoring/test_composite.py
  TEST_FUNCTION: test_compute_scores_handles_missing_optional_fields

Quality Criteria:
- [ ] All 4 tests pass
- [ ] Lint passes with zero errors
- [ ] No unhandled exceptions on any Route input
- [ ] RED evidence before each implementation phase

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | compute_scores returns a dict with exactly 6 score keys when given a fully-populated Route | AC-1 | `python -m pytest tests/scoring/test_composite.py::test_compute_scores_returns_all_six_scores_in_range -v` | [ ] TRUE  [ ] FALSE |
| 2 | all 6 values returned by compute_scores are floats in [0.0, 1.0] inclusive | AC-1 | `python -m pytest tests/scoring/test_composite.py::test_compute_scores_returns_all_six_scores_in_range -v` | [ ] TRUE  [ ] FALSE |
| 3 | composite_score equals the weighted sum of component scores within 1e-6 tolerance | AC-2 | `python -m pytest tests/scoring/test_composite.py::test_composite_score_equals_weighted_sum_of_components -v` | [ ] TRUE  [ ] FALSE |
| 4 | calling compute_scores twice with the same Route returns identical results | AC-3 | `python -m pytest tests/scoring/test_composite.py::test_compute_scores_is_deterministic -v` | [ ] TRUE  [ ] FALSE |
| 5 | compute_scores does not raise when Route has only required fields set | AC-4 | `python -m pytest tests/scoring/test_composite.py::test_compute_scores_handles_missing_optional_fields -v` | [ ] TRUE  [ ] FALSE |
| 6 | compute_scores returns all 6 score keys even when Route has only required fields | AC-4 | `python -m pytest tests/scoring/test_composite.py::test_compute_scores_handles_missing_optional_fields -v` | [ ] TRUE  [ ] FALSE |

TC-1: six scores in range
  Statement: compute_scores returns a dict with 6 keys (curvature_score, scenic_score, technical_score, traffic_score, remoteness_score, composite_score) each with a float value in [0.0, 1.0]
  Maps To: AC-1
  Verify: `python -m pytest tests/scoring/test_composite.py::test_compute_scores_returns_all_six_scores_in_range -v`
  Status: [ ] TRUE  [ ] FALSE

TC-2: weighted sum formula
  Statement: composite_score equals weighted sum of 5 component scores per PRD S9-TRD-4 weights within floating-point tolerance
  Maps To: AC-2
  Verify: `python -m pytest tests/scoring/test_composite.py::test_composite_score_equals_weighted_sum_of_components -v`
  Status: [ ] TRUE  [ ] FALSE

TC-3: deterministic
  Statement: same Route input produces identical score dict on repeated calls to compute_scores
  Maps To: AC-3
  Verify: `python -m pytest tests/scoring/test_composite.py::test_compute_scores_is_deterministic -v`
  Status: [ ] TRUE  [ ] FALSE

TC-4: graceful on minimal Route
  Statement: compute_scores does not raise and returns all 6 score keys when Route has only required fields
  Maps To: AC-4
  Verify: `python -m pytest tests/scoring/test_composite.py::test_compute_scores_handles_missing_optional_fields -v`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `.spec/prds/curation/10-trd-detail.md`
   - Section: 4. Deterministic Scoring Engine (§4.1 Lookup Tables, §4.2 Composite Score Formula)
   - Focus: Authoritative formula and lookup tables — MUST read before writing any scoring logic

2. `.spec/prds/curation/09-technical-requirements.md`
   - Section: Architecture Diagram (Scoring Engine box with weight percentages)
   - Focus: Weight distribution reference — curvature ~25%, scenery ~15%, traffic ~15%, condition ~10%, elevation ~10%, designation ~10%, community ~10%, remoteness ~5%

3. `.spec/prds/curation/09-technical-requirements.md`
   - Section: System Components — Scoring Engine
   - Focus: "Deterministic composite formula combining LLM-extracted attributes and geometric features. Weights are fit against editorial ground truth."

4. `scripts/curation/pipeline/models.py`
   - Lines: ALL
   - Focus: Route and EnrichedRoute dataclass fields — compute_scores takes a Route, must not assume EnrichedRoute

5. `.spec/prds/curation/03-functional-groups.md`
   - Section: QUALITY — Quality Scoring
   - Focus: curvature, elevation, composite weights as described for the quality scoring functional group

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/scoring/composite.py (NEW)
- scripts/curation/tests/scoring/__init__.py (NEW)
- scripts/curation/tests/scoring/test_composite.py (NEW)

WRITE-PROHIBITED:
- scripts/curation/pipeline/models.py — Route dataclass is PIPE-001, do not modify
- scripts/curation/pipeline/sources/fhwa.py — ingestion is PIPE-002
- scripts/curation/pipeline/classification/archetype.py — classification is PIPE-008
- scripts/curation/pipeline/sync/convex_push.py — push module is PIPE-005
- Any file not explicitly listed above

MUST:
- [ ] Function signature: `def compute_scores(route: Route) -> dict[str, float]`
- [ ] Return dict must have exactly these 6 keys: `curvature_score`, `scenic_score`, `technical_score`, `traffic_score`, `remoteness_score`, `composite_score`
- [ ] All returned values must be clamped to [0.0, 1.0] — use `min(1.0, max(0.0, value))`
- [ ] composite_score = weighted sum of the 5 component scores (not an independent formula)
- [ ] Weights must be sourced from PRD S9-TRD-4 — not invented
- [ ] Function is pure — no I/O, no global state mutation, no randomness
- [ ] Missing optional Route fields produce a neutral/default score component, not an exception

MUST NOT:
- [ ] Call any external API, file system, or network in compute_scores
- [ ] Use any LLM or ML model in scoring — this is deterministic code (PRD principle AD-6)
- [ ] Modify the Route dataclass to add scoring fields — scores are returned in a dict
- [ ] Return scores outside [0.0, 1.0] range
- [ ] Write implementation before the test for that AC fails

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```python
# scripts/curation/pipeline/scoring/composite.py
# Pattern: pure function, lookup tables, clamp to [0.0, 1.0]
# Source: PRD S9-TRD-4 (10-trd-detail.md §4.1, §4.2) — READ THAT SECTION FIRST

from __future__ import annotations
from scripts.curation.pipeline.models import Route

# --- Lookup tables from PRD S9-TRD-4 ---
# These are the authoritative values from the TRD.
# Implementer: verify these against 10-trd-detail.md §4.1 before using.
CURVINESS_SCORE = {
    "straight": 0.0, "mild": 0.2, "moderate": 0.5, "twisty": 0.8, "very_twisty": 1.0
}
SCENERY_QUALITY_SCORE = {
    "unremarkable": 0.0, "pleasant": 0.3, "beautiful": 0.7, "spectacular": 1.0
}
TRAFFIC_SCORE = {
    "low": 1.0, "moderate": 0.5, "high": 0.1   # inverted — 1.0 = low traffic
}
CONDITION_SCORE = {
    "poor": 0.0, "fair": 0.4, "good": 0.7, "excellent": 1.0
}

# --- Composite weights from PRD S9-TRD-4 ---
# Implementer: verify these against 10-trd-detail.md §4.2.
WEIGHTS = {
    "curvature": 0.25,
    "scenery": 0.15,
    "traffic": 0.15,
    "technical": 0.10,
    "remoteness": 0.05,
    # remaining weight allocated to elevation/designation/community
    # in a future enhancement — for Phase 1, distribute proportionally
}

def _clamp(value: float) -> float:
    return min(1.0, max(0.0, value))

def compute_scores(route: Route) -> dict[str, float]:
    """
    Compute all 6 quality scores for a Route.

    Pure function — deterministic, no I/O, no side effects.
    Missing optional fields produce neutral (0.5 or 0.0) defaults.

    Returns a dict with keys:
      curvature_score, scenic_score, technical_score,
      traffic_score, remoteness_score, composite_score
    All values are floats clamped to [0.0, 1.0].

    Source: PRD S9-TRD-4 (10-trd-detail.md §4.1 and §4.2)
    """
    # Component scores — each derived from route attributes
    # Implementer: fill in actual derivation from PRD lookup tables
    curvature_score = _clamp(0.0)   # TODO: derive from route curvature attributes
    scenic_score    = _clamp(0.0)   # TODO: derive from elevation + parkland + fhwa designation
    technical_score = _clamp(0.0)   # TODO: derive from curvature + grade + surface
    traffic_score   = _clamp(0.0)   # TODO: derive from road classification + population density
    remoteness_score = _clamp(0.0)  # TODO: derive from distance to urban centers

    composite_score = _clamp(
        WEIGHTS["curvature"]  * curvature_score
        + WEIGHTS["scenery"]  * scenic_score
        + WEIGHTS["traffic"]  * traffic_score
        + WEIGHTS["technical"] * technical_score
        + WEIGHTS["remoteness"] * remoteness_score
        # Phase 1: remaining weight terms will be added after Phase 2 enrichment
    )

    return {
        "curvature_score":  curvature_score,
        "scenic_score":     scenic_score,
        "technical_score":  technical_score,
        "traffic_score":    traffic_score,
        "remoteness_score": remoteness_score,
        "composite_score":  composite_score,
    }
```

```python
# scripts/curation/tests/scoring/test_composite.py

import pytest
from scripts.curation.pipeline.models import Route
from scripts.curation.pipeline.scoring.composite import compute_scores, WEIGHTS

def _make_full_route(**kwargs) -> Route:
    defaults = dict(
        route_id="test-001", name="Test Road", state="TN",
        source="fhwa", centroid_lat=35.5, centroid_lng=-84.0,
        length_miles=25.0,
    )
    defaults.update(kwargs)
    return Route(**defaults)

def test_compute_scores_returns_all_six_scores_in_range():
    # GIVEN: a fully-populated Route
    route = _make_full_route()
    # WHEN: compute_scores is called
    scores = compute_scores(route)
    # THEN: all 6 keys present, all values in [0.0, 1.0]
    expected_keys = {
        "curvature_score", "scenic_score", "technical_score",
        "traffic_score", "remoteness_score", "composite_score"
    }
    assert set(scores.keys()) == expected_keys
    for key, val in scores.items():
        assert 0.0 <= val <= 1.0, f"{key}={val} out of range"
```

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: general-purpose

## BEFORE WRITING ANY CODE:
  READ: `.spec/prds/curation/10-trd-detail.md` §4.1 and §4.2 in full
  READ: `09-technical-requirements.md` architecture diagram (Scoring Engine box)
  UNDERSTAND: the 8 scoring dimensions, lookup tables, and composite formula

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, PRD scoring formula, models.py Route fields
  WRITE: ONE test function for this AC in test_composite.py
  RUN: `cd scripts/curation && python -m pytest tests/scoring/test_composite.py -v`
  VERIFY: Test FAILS (ImportError from missing composite.py is not valid RED — create empty file first)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  MUST: Show actual test failure output (AssertionError, not ImportError)
  MUST NOT: Write any compute_scores implementation yet

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ: Failing test, AC definition, PRD scoring formula
  WRITE: MINIMAL implementation in composite.py to pass that test
  RUN: `cd scripts/curation && python -m pytest tests/scoring/test_composite.py -v`
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  MUST: Implement the actual PRD formula, not a trivial pass (e.g., returning 0.5 for everything)
  MUST NOT: Add features beyond the current AC

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ: Implementation just written
  WRITE: Improved code if needed (extract helpers, clean up magic numbers, add docstrings)
  RUN: `cd scripts/curation && python -m pytest tests/scoring/ -v`
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
  RUN: `cd scripts/curation && python -m pytest tests/scoring/test_composite.py -v`
  EXPECT: Exit code != 0, failure for the new test
  IF PASS: Reject "Vanity test — passes without implementation"
  IF IMPORT ERROR: Reject "Test has import error, not valid RED — fix imports first"

AFTER GREEN PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/scoring/test_composite.py -v`
  EXPECT: Exit code 0, all tests written so far pass

AFTER REFACTOR PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/scoring/ -v`
  EXPECT: Exit code 0, all tests still pass
  ALSO RUN: `cd scripts/curation && python -m pytest tests/ -v`
  EXPECT: No regressions in other test modules

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: general-purpose
**Rationale**: Deterministic Python math using stdlib only. PRD specifies the formula. No specialized framework knowledge required — the challenge is reading the PRD carefully and translating the formula correctly.

**Review Agent**: feature-dev:code-reviewer
**Rationale**: Review should verify that scoring weights match PRD S9-TRD-4 exactly, that clamp logic is correct, that composite_score is a weighted sum of components (not an independent formula), and that no LLM or external call is made.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard agent-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: FEATURE (DEV)
- File Patterns: pipeline/scoring/composite.py, tests/scoring/test_composite.py
- Implementation: general-purpose — deterministic math, no framework
- Review: feature-dev:code-reviewer — validates formula correctness and PRD compliance

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All Tests Pass
  Command: `cd scripts/curation && python -m pytest tests/scoring/test_composite.py -v`
  Expected: Exit 0, all 4 tests pass

Gate 2: Each AC Has Test
  Verify: test_composite.py contains one test function per AC (4 functions)

Gate 3: Formula Correctness
  Verify: composite_score weights in composite.py match PRD S9-TRD-4 §4.2 (reviewer checks manually)

Gate 4: Determinism Check
  Command: Run `compute_scores` on the same Route 100 times in a loop and assert all results identical
  Expected: Zero variance

Gate 5: Lint
  Command: `python -m py_compile scripts/curation/pipeline/scoring/composite.py`
  Expected: Exit 0

Gate 6: Scope Compliance
  Command: `git diff --name-only`
  Expected: Only composite.py, tests/scoring/__init__.py, tests/scoring/test_composite.py

--------------------------------------------------------------------------------
REVIEW CRITERIA (for feature-dev:code-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] One test per acceptance criterion
- [ ] Tests verify observable behavior (score values, dict keys) not internals
- [ ] RED evidence before each implementation
- [ ] AC-2 test verifies weighted sum arithmetic, not just range

Code Quality:
- [ ] compute_scores is a pure function — no I/O, no global mutation
- [ ] _clamp helper used consistently — no unclamped score values
- [ ] Weights defined as named constants, not inline magic numbers
- [ ] Missing optional fields handled gracefully (try/except or .get() with defaults)

Domain-Specific:
- [ ] Scoring weights match PRD S9-TRD-4 §4.2 formula
- [ ] Lookup tables match PRD S9-TRD-4 §4.1 (CURVINESS_SCORE etc.)
- [ ] composite_score is the weighted sum of the 5 component scores — no separate formula
- [ ] traffic_score is inverted (1.0 = low traffic, 0.0 = high traffic) per PRD
- [ ] All 6 return keys present: curvature_score, scenic_score, technical_score, traffic_score, remoteness_score, composite_score

Security:
- [ ] No external API calls in compute_scores
- [ ] No file I/O in compute_scores

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- PIPE-001 — needs Route dataclass and package scaffold

Blocks:
- PIPE-008 — archetype classifier uses scored routes (requires composite_score and component scores)
- PIPE-005 — push module sends scored routes; integration test needs a route with scores

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] PIPE-001 complete — Route dataclass exists at pipeline/models.py
- [ ] PRD S9-TRD-4 reviewed — implementer must understand scoring formula before starting

Can Execute In Parallel With: PIPE-002 (FHWA ingestion does not depend on scoring)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- The exact composite score formula is in `.spec/prds/curation/10-trd-detail.md` §4.2. The architecture diagram in `09-technical-requirements.md` shows approximate weights (curvature ~25%, scenery ~15%, traffic ~15%, etc.) but the TRD §4.2 is authoritative. Implementer must read BOTH before writing code.
- For Phase 1 (seed data from FHWA CSV only), many scoring inputs will not be available (OSM curvature geometry, elevation profiles, FHWA designation lookup). The scoring engine should handle missing inputs gracefully and produce reasonable defaults. A FHWA-designated route with no curvature data should not score 0.0 — it should score at the neutral midpoint for unknown fields.
- Scores will be recalculated after Phase 2 (web scraping) and Phase 3 (LLM extraction) when richer attributes become available. This is expected — the data model supports version-bumping via contentVersion.
- The calibration step (PRD AD-12) is a Phase 3 gate — it fits weights against editorial ground truth. For Phase 1, use the TRD §4.2 formula as-is. Do not implement calibration in this task.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
