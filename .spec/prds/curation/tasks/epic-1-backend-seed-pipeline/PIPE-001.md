================================================================================
TASK: PIPE-001 - Python pipeline project setup + directory scaffold
================================================================================

TASK_TYPE: INFRA
STATUS: Backlog
TDD_PHASE: N/A
CURRENT_AC: N/A
PRIORITY: P0
EFFORT: S
TYPE: INFRA
ITERATION: 1

--------------------------------------------------------------------------------
BACKGROUND
--------------------------------------------------------------------------------

**Problem:** No Python project structure exists for the curation pipeline. All downstream PIPE tasks (FHWA ingestion, scoring engine, archetype classifier, Convex push) require an established package layout, shared dataclasses, and a working test runner before any implementation can start.

**Why it matters:** Without a proper `src/`-style package scaffold, every subsequent Python task would need to invent its own import paths and configuration conventions. A consistent project structure ensures tests are discoverable, imports are clean, and the pipeline can be run as a module from the repo root.

**Current state:** No `scripts/curation/` directory exists. No `pyproject.toml`, no `__init__.py` files, no shared dataclasses, no test configuration.

**Desired state:** A complete Python project scaffold under `scripts/curation/` that follows packaging best practices. A `Route` dataclass and `EnrichedRoute` dataclass exist in `pipeline/models.py` matching the PRD lean-tier field names. `python -m pytest --collect-only` succeeds from the `scripts/curation/` directory. All downstream PIPE tasks can immediately begin writing code without any scaffolding work.

--------------------------------------------------------------------------------
IMPLEMENTATION STEPS
--------------------------------------------------------------------------------

This is an INFRA task. No TDD beads. Follow these steps in order:

### Step 1: Create directory tree

Create all directories and empty `__init__.py` files:

```
scripts/curation/__init__.py
scripts/curation/pipeline/__init__.py
scripts/curation/pipeline/sources/__init__.py
scripts/curation/pipeline/scoring/__init__.py
scripts/curation/pipeline/classification/__init__.py
scripts/curation/pipeline/sync/__init__.py
scripts/curation/tests/__init__.py
```

### Step 2: Create pyproject.toml

At `scripts/curation/pyproject.toml`. Pin dependencies. Use `[project.optional-dependencies]` to separate dev deps.

Required fields:
- `name = "laneshadow-curation"`
- `python = ">=3.11"`
- Core deps: `requests`, `python-dotenv`
- Dev deps: `pytest`, `pytest-cov`, `responses` (for mocking HTTP in PIPE-005)

Prefer stdlib `csv` over `pandas` for CSV parsing — `pandas` is NOT a required dependency.

### Step 3: Create requirements.txt and requirements-dev.txt

- `requirements.txt` — production deps only (requests, python-dotenv)
- `requirements-dev.txt` — dev deps (pytest, pytest-cov, responses) plus `-r requirements.txt`

### Step 4: Create pipeline/models.py

Define two dataclasses:

`Route` — represents a raw or partially-enriched route from any source. Fields match the PRD lean-tier schema (camelCase in Convex; use snake_case Python equivalents). Required fields for seed pipeline:
- `route_id: str`
- `name: str`
- `state: str`
- `source: str`  (one of: "fhwa", "motorcycleroads", "bestbikingroads", "bdr", "editorial")
- `centroid_lat: float`
- `centroid_lng: float`
- `length_miles: float | None = None`
- `bounds_ne_lat: float | None = None`
- `bounds_ne_lng: float | None = None`
- `bounds_sw_lat: float | None = None`
- `bounds_sw_lng: float | None = None`

`EnrichedRoute` — extends Route with computed scoring and classification fields:
- All fields from Route (via inheritance or composition — either is acceptable)
- `composite_score: float = 0.0`
- `curvature_score: float = 0.0`
- `scenic_score: float = 0.0`
- `technical_score: float = 0.0`
- `traffic_score: float = 0.0`
- `remoteness_score: float = 0.0`
- `primary_archetype: str = ""`
- `secondary_tags: list[str] = field(default_factory=list)`
- `one_liner: str = ""`
- `summary: str = ""`
- `badges: list[str] = field(default_factory=list)`
- `season: str = "year_round"`
- `content_version: int = 1`
- `enrichment_version: int | None = None`

Use `@dataclass` from stdlib — no Pydantic needed here.

### Step 5: Create tests/conftest.py

Provide shared pytest fixtures:
- `sample_route()` — returns a minimal valid `Route` instance for use in tests
- `sample_enriched_route()` — returns a minimal valid `EnrichedRoute` instance

### Step 6: Create README.md

At `scripts/curation/README.md`. Include:
- Pipeline overview (one paragraph)
- Directory structure listing
- Install instructions: `pip install -r requirements-dev.txt`
- Run tests: `cd scripts/curation && python -m pytest`
- Run full pipeline (placeholder): `python -m pipeline.main` (note: main.py is a future task)

--------------------------------------------------------------------------------
VERIFICATION CHECKLIST
--------------------------------------------------------------------------------

- [ ] `cd scripts/curation && python -m pytest --collect-only` exits 0 with no errors
- [ ] `python -c "from scripts.curation.pipeline.models import Route, EnrichedRoute"` runs without ImportError (run from repo root)
- [ ] `python -c "from scripts.curation.pipeline.models import Route; r = Route(route_id='x', name='Test', state='TN', source='fhwa', centroid_lat=35.0, centroid_lng=-84.0); print(r)"` prints a Route repr
- [ ] `scripts/curation/pyproject.toml` exists and is valid TOML
- [ ] `scripts/curation/requirements.txt` and `scripts/curation/requirements-dev.txt` exist
- [ ] All `__init__.py` files listed in Step 1 exist (may be empty)
- [ ] `scripts/curation/tests/conftest.py` exports `sample_route` and `sample_enriched_route` fixtures
- [ ] `scripts/curation/README.md` exists with run instructions

Quality Criteria:
- [ ] No implementation code in this task (models.py is schema-only — no business logic)
- [ ] No unnecessary dependencies (prefer stdlib)
- [ ] pyproject.toml follows PEP 517/518 conventions
- [ ] README.md is accurate and complete

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To | Verify | Status |
|---|-------------------|---------|--------|--------|
| 1 | `python -m pytest --collect-only` exits 0 from scripts/curation directory | scaffold | `cd scripts/curation && python -m pytest --collect-only` | [ ] TRUE  [ ] FALSE |
| 2 | Route dataclass imports cleanly from repo root | models.py | `python -c "from scripts.curation.pipeline.models import Route"` | [ ] TRUE  [ ] FALSE |
| 3 | EnrichedRoute dataclass imports cleanly from repo root | models.py | `python -c "from scripts.curation.pipeline.models import EnrichedRoute"` | [ ] TRUE  [ ] FALSE |
| 4 | Route can be instantiated with required fields only | models.py | see verification command in Step 4 above | [ ] TRUE  [ ] FALSE |
| 5 | pyproject.toml is parseable TOML | pyproject.toml | `python -c "import tomllib; tomllib.load(open('scripts/curation/pyproject.toml','rb'))"` | [ ] TRUE  [ ] FALSE |

TC-1: pytest collection succeeds
  Statement: `python -m pytest --collect-only` exits 0 from scripts/curation with zero errors (no tests yet)
  Maps To: scaffold
  Verify: `cd scripts/curation && python -m pytest --collect-only`
  Status: [ ] TRUE  [ ] FALSE

TC-2: Route import clean
  Statement: Route and EnrichedRoute dataclasses import without error from repo root
  Maps To: models.py
  Verify: `python -c "from scripts.curation.pipeline.models import Route, EnrichedRoute"`
  Status: [ ] TRUE  [ ] FALSE

TC-3: conftest fixtures present
  Statement: conftest.py exports sample_route and sample_enriched_route pytest fixtures
  Maps To: tests/conftest.py
  Verify: `cd scripts/curation && python -m pytest --collect-only --verbose`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `.spec/prds/curation/10-trd-detail.md`
   - Lines: 95-133 (Section 1.2 Directory Structure)
   - Focus: Canonical directory layout from TRD — note that the TRD uses `push/` but this task uses `sync/` (more general name); otherwise follow TRD layout

2. `.spec/prds/curation/09-technical-requirements.md`
   - Sections: Data Schema — curated_routes (lean tier)
   - Focus: All field names and types for the Route dataclass. Python uses snake_case equivalents.

3. `.spec/prds/curation/09-technical-requirements.md`
   - Section: External Dependencies (Python pipeline)
   - Focus: Which libraries are in scope — use as checklist for pyproject.toml

4. `.spec/prds/curation/01-scope.md`
   - Section: Phase 1: Seed Data Pipeline
   - Focus: Understand which modules are needed for Phase 1 scope

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pyproject.toml (NEW)
- scripts/curation/requirements.txt (NEW)
- scripts/curation/requirements-dev.txt (NEW)
- scripts/curation/__init__.py (NEW)
- scripts/curation/pipeline/__init__.py (NEW)
- scripts/curation/pipeline/sources/__init__.py (NEW)
- scripts/curation/pipeline/scoring/__init__.py (NEW)
- scripts/curation/pipeline/classification/__init__.py (NEW)
- scripts/curation/pipeline/sync/__init__.py (NEW)
- scripts/curation/pipeline/models.py (NEW)
- scripts/curation/tests/__init__.py (NEW)
- scripts/curation/tests/conftest.py (NEW)
- scripts/curation/README.md (NEW)

WRITE-PROHIBITED:
- scripts/curation/pipeline/sources/fhwa.py — this is PIPE-002
- scripts/curation/pipeline/scoring/composite.py — this is PIPE-007
- scripts/curation/pipeline/classification/archetype.py — this is PIPE-008
- scripts/curation/pipeline/sync/convex_push.py — this is PIPE-005
- scripts/curation/pipeline/main.py — not in scope for this task
- Any file not explicitly listed above
- Any file outside scripts/curation/

MUST:
- [ ] Use stdlib `dataclasses` for Route and EnrichedRoute — not Pydantic
- [ ] Use stdlib `csv` in models (no pandas import in models.py)
- [ ] Field names in models.py use snake_case (Python convention)
- [ ] pyproject.toml names the package `laneshadow-curation`
- [ ] requirements-dev.txt includes `responses` library (needed for PIPE-005 mocked HTTP)
- [ ] All `__init__.py` files may be empty — that is acceptable

MUST NOT:
- [ ] Write any business logic in models.py (no parsing, no scoring — just dataclasses)
- [ ] Add dependencies not justified by Phase 1 scope
- [ ] Create files not in the WRITE-ALLOWED list
- [ ] Use `pandas` as a required (non-dev) dependency

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```python
# scripts/curation/pipeline/models.py
# Pattern: stdlib dataclass with explicit field defaults for optional values

from dataclasses import dataclass, field
from typing import Optional

@dataclass
class Route:
    """Raw route record from any ingestion source."""
    route_id: str
    name: str
    state: str
    source: str  # "fhwa" | "motorcycleroads" | "bestbikingroads" | "bdr" | "editorial"
    centroid_lat: float
    centroid_lng: float
    length_miles: Optional[float] = None
    bounds_ne_lat: Optional[float] = None
    bounds_ne_lng: Optional[float] = None
    bounds_sw_lat: Optional[float] = None
    bounds_sw_lng: Optional[float] = None

@dataclass
class EnrichedRoute(Route):
    """Route with computed scores and classification fields."""
    composite_score: float = 0.0
    curvature_score: float = 0.0
    scenic_score: float = 0.0
    technical_score: float = 0.0
    traffic_score: float = 0.0
    remoteness_score: float = 0.0
    primary_archetype: str = ""
    secondary_tags: list[str] = field(default_factory=list)
    one_liner: str = ""
    summary: str = ""
    badges: list[str] = field(default_factory=list)
    season: str = "year_round"
    content_version: int = 1
    enrichment_version: Optional[int] = None
```

```toml
# scripts/curation/pyproject.toml
[project]
name = "laneshadow-curation"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = [
    "requests>=2.31",
    "python-dotenv>=1.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0",
    "pytest-cov>=5.0",
    "responses>=0.25",
]

[tool.pytest.ini_options]
testpaths = ["tests"]
```

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (Implementation Steps)
--------------------------------------------------------------------------------

AGENT: general-purpose

## EXECUTION ORDER

### Phase 1: Directories + __init__.py files
  CREATE: all directories listed in Step 1
  CREATE: all empty __init__.py files
  VERIFY: directory tree matches spec

### Phase 2: Configuration files
  CREATE: pyproject.toml per Step 2
  CREATE: requirements.txt and requirements-dev.txt per Step 3
  VERIFY: `python -c "import tomllib; tomllib.load(open('scripts/curation/pyproject.toml','rb'))"` exits 0

### Phase 3: Models
  CREATE: pipeline/models.py per Step 4
  VERIFY: `python -c "from scripts.curation.pipeline.models import Route, EnrichedRoute"` exits 0

### Phase 4: Test infrastructure
  CREATE: tests/conftest.py per Step 5
  VERIFY: `cd scripts/curation && python -m pytest --collect-only` exits 0

### Phase 5: README
  CREATE: README.md per Step 6

## AFTER ALL STEPS:
  RUN: full VERIFICATION CHECKLIST
  RETURN: { phase: "COMPLETE", files_created: [...], verification_output: "..." }

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

After agent completion, orchestrator MUST verify independently:

SCAFFOLD VERIFICATION:
  RUN: `cd scripts/curation && python -m pytest --collect-only`
  EXPECT: Exit code 0, zero errors
  IF FAIL: Return to agent with error output

IMPORT VERIFICATION:
  RUN: `python -c "from scripts.curation.pipeline.models import Route, EnrichedRoute; print('OK')"`
  EXPECT: Prints "OK", exit code 0
  IF FAIL: Return to agent with ImportError output

STRUCTURE VERIFICATION:
  RUN: `git diff --name-only`
  EXPECT: Only files in the WRITE-ALLOWED list above

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: general-purpose
**Rationale**: Pure scaffolding task — creates directories, config files, and dataclass definitions. No specialized framework knowledge required. Any competent Python agent can complete this.

**Review Agent**: feature-dev:code-reviewer
**Rationale**: Review should verify pyproject.toml correctness, dataclass field alignment with PRD schema, and that no business logic snuck into models.py.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard agent-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: INFRA
- File Patterns: pyproject.toml, __init__.py, dataclasses
- Implementation: general-purpose — no framework-specific knowledge required
- Review: feature-dev:code-reviewer — validates structure and PRD alignment

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: Directory Structure
  Command: `ls scripts/curation/pipeline/` and `ls scripts/curation/tests/`
  Expected: All subdirectories and __init__.py files present

Gate 2: pytest Collection
  Command: `cd scripts/curation && python -m pytest --collect-only`
  Expected: Exit 0, no errors

Gate 3: Route Import
  Command: `python -c "from scripts.curation.pipeline.models import Route, EnrichedRoute; print('OK')"`
  Expected: Exit 0, prints "OK"

Gate 4: pyproject.toml Valid
  Command: `python -c "import tomllib; tomllib.load(open('scripts/curation/pyproject.toml','rb')); print('OK')"`
  Expected: Exit 0, prints "OK"

Gate 5: Scope Compliance
  Command: `git diff --name-only`
  Expected: Only files listed in WRITE-ALLOWED

--------------------------------------------------------------------------------
REVIEW CRITERIA (for feature-dev:code-reviewer)
--------------------------------------------------------------------------------

Code Quality:
- [ ] pyproject.toml follows PEP 517/518 — has `[project]` table, `requires-python`, `dependencies`
- [ ] requirements.txt and requirements-dev.txt are consistent with pyproject.toml
- [ ] No unnecessary dependencies added

Domain-Specific:
- [ ] Route field names are snake_case equivalents of PRD camelCase lean-tier fields
- [ ] All required Route fields (route_id, name, state, source, centroid_lat, centroid_lng) are non-optional
- [ ] EnrichedRoute score fields default to 0.0, list fields default to empty list (not None)
- [ ] models.py has zero business logic — dataclass definitions only
- [ ] conftest.py provides sample_route and sample_enriched_route fixtures

Security:
- [ ] No credential exposure in any committed file
- [ ] .env or secrets are not referenced in any non-.env file without os.environ / dotenv

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- (none — this is the first Python pipeline task)

Blocks:
- PIPE-002 — needs package scaffold and Route dataclass
- PIPE-007 — needs package scaffold and Route dataclass
- PIPE-008 — needs PIPE-001 and PIPE-007
- PIPE-005 — needs package scaffold and Route dataclass

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] Python 3.11+ installed in dev environment
- [ ] PRD lean-tier schema reviewed (09-technical-requirements.md)

Can Execute In Parallel With: CONVEX-001, CONVEX-002, CONVEX-008

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- The TRD (10-trd-detail.md §1.2) uses `push/` as the sync directory name. This task uses `sync/` instead — it is a more general name that accommodates future sync directions (Convex → local, local → Convex). This is an intentional deviation from the TRD draft.
- The `scripts/curation/` directory is a Python package importable from the repo root as `scripts.curation.*`. This requires the repo root to be on `PYTHONPATH` or for tests to be run via `python -m pytest` from within `scripts/curation/`.
- Do NOT add a `scripts/__init__.py` or `scripts/curation/__init__.py` that could conflict with other scripts in the repo. Keep `__init__.py` files scoped to the curation subpackage only.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
