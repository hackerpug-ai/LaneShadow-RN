================================================================================
TASK: PIPE-002 - FHWA CSV ingestion module
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

**Problem:** Phase 1 seed data requires parsing 184 routes from the FHWA National Scenic Byways CSV (data.gov). No ingestion module exists yet. Without this module, there is no route data to score, classify, or push to Convex.

**Why it matters:** FHWA is the highest-quality, legally-clean seed source — 184 officially designated scenic byways with consistent geographic and classification data. This is the first data flowing through the pipeline and validates that the Route dataclass, scoring engine, and push module all work end-to-end.

**Current state:** No `pipeline/sources/fhwa.py` file exists. The `Route` dataclass exists (PIPE-001). No CSV parsing logic has been written.

**Desired state:** `pipeline/sources/fhwa.py` exports a `parse_fhwa_csv(path: str) -> list[Route]` function that reads the FHWA CSV, maps rows to `Route` instances with `source="fhwa"`, skips malformed rows with a logged warning, and returns exactly 184 Route objects for the real dataset. A test fixture CSV (3-5 rows) exists for unit tests.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: parse_fhwa_csv returns Route objects with required fields
  GIVEN: a valid FHWA CSV file at a known path
  WHEN: `parse_fhwa_csv(path)` is called
  THEN: it returns a list of Route objects where each Route has route_id, name, state, centroid_lat, centroid_lng, length_miles populated, and source equals "fhwa"

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sources/test_fhwa.py
  TEST_FUNCTION: test_parse_fhwa_csv_returns_route_objects_with_required_fields

AC-2: parse_fhwa_csv returns exactly 184 routes for the full dataset
  GIVEN: the full FHWA National Scenic Byways CSV (184 data rows)
  WHEN: `parse_fhwa_csv(path)` is called
  THEN: the returned list has exactly 184 Route objects, all with source="fhwa"

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sources/test_fhwa.py
  TEST_FUNCTION: test_parse_fhwa_csv_returns_184_routes_for_full_dataset

AC-3: parse_fhwa_csv skips rows with missing required fields
  GIVEN: a CSV where one row is missing a required field (e.g., empty name or lat)
  WHEN: `parse_fhwa_csv(path)` is called
  THEN: the malformed row is skipped (not raised as an exception), a warning is logged, and the returned list contains only the valid rows

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sources/test_fhwa.py
  TEST_FUNCTION: test_parse_fhwa_csv_skips_rows_with_missing_required_fields

AC-4: parse_fhwa_csv skips rows with unparseable lat/lng
  GIVEN: a CSV where one row has a non-numeric value in the lat or lng column
  WHEN: `parse_fhwa_csv(path)` is called
  THEN: that row is skipped with a logged warning, no ValueError is raised, and valid rows are still returned

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sources/test_fhwa.py
  TEST_FUNCTION: test_parse_fhwa_csv_skips_rows_with_unparseable_lat_lng

Quality Criteria:
- [ ] All 4 tests pass
- [ ] Lint passes with zero errors
- [ ] No unhandled exceptions on malformed input
- [ ] RED evidence in comments before each implementation

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | parse_fhwa_csv returns a list of Route objects with source="fhwa" when given a valid CSV | AC-1 | `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_returns_route_objects_with_required_fields -v` | [ ] TRUE  [ ] FALSE |
| 2 | each Route from parse_fhwa_csv has non-empty route_id, name, state, and numeric centroid_lat/lng | AC-1 | `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_returns_route_objects_with_required_fields -v` | [ ] TRUE  [ ] FALSE |
| 3 | parse_fhwa_csv returns exactly 184 items when given the full FHWA dataset | AC-2 | `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_returns_184_routes_for_full_dataset -v` | [ ] TRUE  [ ] FALSE |
| 4 | parse_fhwa_csv does not raise on a row with empty name field — it skips that row | AC-3 | `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_skips_rows_with_missing_required_fields -v` | [ ] TRUE  [ ] FALSE |
| 5 | parse_fhwa_csv does not raise on a row where lat is "N/A" — it skips that row | AC-4 | `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_skips_rows_with_unparseable_lat_lng -v` | [ ] TRUE  [ ] FALSE |

TC-1: Route fields populated from CSV
  Statement: parse_fhwa_csv returns Route objects with all required fields populated from CSV columns when given a valid sample file
  Maps To: AC-1
  Verify: `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_returns_route_objects_with_required_fields -v`
  Status: [ ] TRUE  [ ] FALSE

TC-2: 184-route count
  Statement: parse_fhwa_csv returns exactly 184 Route objects when given the full FHWA CSV file
  Maps To: AC-2
  Verify: `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_returns_184_routes_for_full_dataset -v`
  Status: [ ] TRUE  [ ] FALSE

TC-3: missing field skip
  Statement: parse_fhwa_csv skips malformed rows without raising an exception and continues parsing
  Maps To: AC-3
  Verify: `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_skips_rows_with_missing_required_fields -v`
  Status: [ ] TRUE  [ ] FALSE

TC-4: bad lat/lng skip
  Statement: parse_fhwa_csv skips rows with non-numeric lat/lng without raising ValueError
  Maps To: AC-4
  Verify: `python -m pytest tests/sources/test_fhwa.py::test_parse_fhwa_csv_skips_rows_with_unparseable_lat_lng -v`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `scripts/curation/pipeline/models.py`
   - Lines: ALL
   - Focus: Route dataclass field names and types — parse_fhwa_csv must return Route instances

2. `scripts/curation/tests/conftest.py`
   - Lines: ALL
   - Focus: sample_route fixture pattern for reuse in test setup

3. `.spec/prds/curation/09-technical-requirements.md`
   - Section: Data Schema — curated_routes (lean tier)
   - Focus: route_id, centroid_lat, centroid_lng, length_miles, state, source field definitions and types

4. `.spec/prds/curation/10-trd-detail.md`
   - Section: 3.3 FHWA Scenic Designation
   - Focus: CSV source description — 184 designated roads, classification types, join by road name + state

5. `.spec/prds/curation/03-functional-groups.md`
   - Section: INGEST — Route Ingestion
   - Focus: FHWA is a direct data.gov CSV download (no scraping); every row needs a source field

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/sources/fhwa.py (NEW)
- scripts/curation/tests/sources/__init__.py (NEW)
- scripts/curation/tests/sources/test_fhwa.py (NEW)
- scripts/curation/tests/fixtures/fhwa_sample.csv (NEW)

WRITE-PROHIBITED:
- scripts/curation/pipeline/models.py — Route dataclass is PIPE-001, do not modify
- scripts/curation/pipeline/scoring/composite.py — this is PIPE-007
- scripts/curation/pipeline/classification/archetype.py — this is PIPE-008
- scripts/curation/pipeline/sync/convex_push.py — this is PIPE-005
- Any file not explicitly listed above

MUST:
- [ ] Use stdlib `csv` module — no pandas
- [ ] Use stdlib `logging` for skip warnings — not print statements
- [ ] Function signature: `def parse_fhwa_csv(path: str) -> list[Route]`
- [ ] Route objects have `source="fhwa"` set on every returned instance
- [ ] route_id is derived deterministically from the CSV row (e.g., slug of name + state)
- [ ] Fixture CSV at `tests/fixtures/fhwa_sample.csv` must have 3-5 rows with realistic data matching actual FHWA column names
- [ ] One test function per AC

MUST NOT:
- [ ] Use pandas for CSV parsing
- [ ] Raise unhandled exceptions on malformed rows
- [ ] Use random or UUID-based route_id (must be deterministic for upsert idempotency)
- [ ] Write implementation code before the test for that AC fails (TDD order)
- [ ] Add features beyond AC requirements (no batch loading, no async, no caching)

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```python
# scripts/curation/pipeline/sources/fhwa.py
# Pattern: stdlib csv + logging, defensive row parsing, deterministic route_id

import csv
import logging
import re
from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)

def _make_route_id(name: str, state: str) -> str:
    """Deterministic slug from name + state. Used as stable upsert key."""
    slug = re.sub(r"[^a-z0-9]+", "-", (name + "-" + state).lower()).strip("-")
    return f"fhwa-{slug}"

def parse_fhwa_csv(path: str) -> list[Route]:
    """
    Parse FHWA National Scenic Byways CSV into Route instances.

    Skips rows with missing required fields or unparseable coordinates,
    logging a warning for each skipped row.

    Returns a list of Route objects with source="fhwa".
    """
    routes = []
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            try:
                name = row.get("RouteName", "").strip()
                state = row.get("State", "").strip()
                if not name or not state:
                    logger.warning("Row %d: missing name or state — skipping", i)
                    continue
                centroid_lat = float(row["CentroidLat"])
                centroid_lng = float(row["CentroidLng"])
            except (KeyError, ValueError) as e:
                logger.warning("Row %d: parse error (%s) — skipping", i, e)
                continue
            routes.append(Route(
                route_id=_make_route_id(name, state),
                name=name,
                state=state,
                source="fhwa",
                centroid_lat=centroid_lat,
                centroid_lng=centroid_lng,
                length_miles=_safe_float(row.get("LengthMiles")),
            ))
    return routes

def _safe_float(value: str | None) -> float | None:
    """Return float or None without raising."""
    try:
        return float(value) if value and value.strip() else None
    except (ValueError, TypeError):
        return None
```

```python
# scripts/curation/tests/sources/test_fhwa.py
# Pattern: pytest with fixture CSV file

import pytest
from pathlib import Path
from scripts.curation.pipeline.sources.fhwa import parse_fhwa_csv

FIXTURES_DIR = Path(__file__).parent.parent / "fixtures"

def test_parse_fhwa_csv_returns_route_objects_with_required_fields():
    # GIVEN: a valid FHWA sample CSV
    path = str(FIXTURES_DIR / "fhwa_sample.csv")
    # WHEN: parse_fhwa_csv is called
    routes = parse_fhwa_csv(path)
    # THEN: returns Route objects with required fields and source="fhwa"
    assert len(routes) > 0
    for route in routes:
        assert route.source == "fhwa"
        assert route.route_id
        assert route.name
        assert route.state
        assert isinstance(route.centroid_lat, float)
        assert isinstance(route.centroid_lng, float)
```

Note on fixture CSV: `tests/fixtures/fhwa_sample.csv` must use the same column headers as the real FHWA data.gov CSV. Research the actual column names before writing the fixture. The headers above (RouteName, State, CentroidLat, CentroidLng, LengthMiles) are illustrative — verify against the real file.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: general-purpose

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, pipeline/models.py for Route fields, PRD data schema
  WRITE: ONE test that exercises GIVEN-WHEN-THEN for this AC
  ALSO WRITE: tests/fixtures/fhwa_sample.csv (needed for AC-1/AC-3/AC-4 tests)
  RUN: `cd scripts/curation && python -m pytest tests/sources/test_fhwa.py -v`
  VERIFY: Test FAILS (not errors — ImportError is not a valid RED, fix imports first)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  MUST: Show actual test failure output
  MUST NOT: Write ANY implementation code yet

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ: Failing test, AC definition, fhwa_sample.csv column names
  WRITE: MINIMAL implementation in fhwa.py to pass that test
  RUN: `cd scripts/curation && python -m pytest tests/sources/test_fhwa.py -v`
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  MUST: Only write enough code to pass the current AC's test
  MUST NOT: Implement AC-2 full-dataset test logic during AC-1 GREEN phase

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ: Implementation just written
  WRITE: Improved code if needed (e.g., extract helper, improve error message)
  RUN: `cd scripts/curation && python -m pytest tests/sources/ -v`
  VERIFY: All tests still pass
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

  MUST: Keep tests green
  MUST NOT: Add new behavior

### NOTE on AC-2 (full dataset test):
  AC-2 requires the actual 184-row FHWA CSV. If the file is not present locally at a known path (e.g., `scripts/curation/data/raw/fhwa_byways.csv`), implement the test to skip if the file is absent using `pytest.mark.skipif` or `pytest.importorskip` pattern, and document the path where the real file should be placed.

## AFTER ALL ACS COMPLETE:
  Orchestrator dispatches feature-dev:code-reviewer

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

After each agent phase, orchestrator MUST verify independently:

AFTER RED PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/sources/test_fhwa.py -v`
  EXPECT: Exit code != 0, test failure for the new test function
  IF PASS: Reject "Vanity test — passes without implementation"
  IF ERROR (syntax/import): Reject "Test has error, not valid RED"

AFTER GREEN PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/sources/test_fhwa.py -v`
  EXPECT: Exit code 0, all tests written so far pass

AFTER REFACTOR PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/sources/ -v`
  EXPECT: Exit code 0, all tests still pass

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: general-purpose
**Rationale**: Stdlib CSV parsing and dataclass mapping. No framework-specific knowledge required beyond Python stdlib and the project's Route dataclass.

**Review Agent**: feature-dev:code-reviewer
**Rationale**: Review should verify correct column-name mapping to Route fields, deterministic route_id generation, and that error handling is defensive without being silent.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard agent-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: FEATURE (DEV)
- File Patterns: pipeline/sources/fhwa.py, tests/sources/test_fhwa.py
- Implementation: general-purpose — stdlib CSV parsing, no specialized framework
- Review: feature-dev:code-reviewer — validates field mapping and error handling

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All Tests Pass
  Command: `cd scripts/curation && python -m pytest tests/sources/test_fhwa.py -v`
  Expected: Exit 0, all 4 tests pass (AC-2 may be skipped if real CSV not present)

Gate 2: Each AC Has Test
  Verify: test_fhwa.py contains one test function per AC

Gate 3: RED Phase Evidence
  Required: Each test must have been written before its implementation (document in commit messages or comments)

Gate 4: Lint
  Command: `python -m py_compile scripts/curation/pipeline/sources/fhwa.py`
  Expected: Exit 0

Gate 5: Scope Compliance
  Command: `git diff --name-only`
  Expected: Only fhwa.py, tests/sources/__init__.py, tests/sources/test_fhwa.py, tests/fixtures/fhwa_sample.csv

--------------------------------------------------------------------------------
REVIEW CRITERIA (for feature-dev:code-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] One test per acceptance criterion
- [ ] Tests verify behavior via returned Route list, not implementation internals
- [ ] RED evidence in commit history or inline comments
- [ ] Minimal implementation — no features beyond AC requirements

Code Quality:
- [ ] Uses stdlib csv.DictReader — not pandas
- [ ] Uses stdlib logging — not print()
- [ ] route_id is deterministic (same CSV row → same ID every run)
- [ ] _safe_float helper covers None, empty string, and non-numeric strings

Domain-Specific:
- [ ] source field is exactly "fhwa" on all returned Route instances
- [ ] Fixture CSV has ≥ 3 rows with realistic FHWA field names and values
- [ ] AC-2 test handles missing real dataset gracefully (skip marker or explicit path documentation)
- [ ] No unhandled exception on any malformed row input

Security:
- [ ] No file path injection risk (path is trusted input from pipeline orchestrator)
- [ ] No credential exposure

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
- No hard downstream dependency, but PIPE-007 (scoring) and PIPE-005 (push) are tested against Route objects that FHWA ingestion produces

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] PIPE-001 complete — Route dataclass exists at pipeline/models.py
- [ ] FHWA CSV column names verified (download from data.gov and inspect headers)

Can Execute In Parallel With: PIPE-007 (scoring engine does not depend on FHWA)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- The real FHWA National Scenic Byways CSV is available at: https://catalog.data.gov/dataset?tags=scenic-byways — download and inspect column names before writing the fixture CSV. The column names used in this spec (RouteName, State, CentroidLat, CentroidLng, LengthMiles) are illustrative. The real CSV may use different headers.
- AC-2 (exactly 184 routes) requires the real CSV. If working offline or the file is not yet downloaded, implement the test with `pytest.mark.skipif(not Path(FHWA_CSV_PATH).exists(), reason="real FHWA CSV not present")` and document the expected path in the test file.
- route_id must be deterministic and stable across re-runs because it is used as the Convex upsert key. A simple slug (name + state) is sufficient for Phase 1. Do not use UUID or random.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
