================================================================================
TASK: SRC-001 - Scenic Byways GIS Fixture Data + Test Verification
================================================================================

TASK_TYPE:  FEATURE
STATUS:     ✅ Completed
COMPLETED:  2026-04-20
COMMIT:     d81cd8f79c6ff6ffbb9897231f1b90b6951b3f6b
REVIEWER:   feature-dev:code-reviewer
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=python-implement

RUNTIME_COMMANDS:
  test:      python3 -m pytest scripts/curation/tests/sources/test_scenic_byways.py -v

PROGRESS: none

--------------------------------------------------------------------------------
OUTCOME (1 sentence, ≤30 words — observable success)
--------------------------------------------------------------------------------

All 3 Scenic Byways fixture JSON files exist and both test_scenic_byways.py tests pass.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- MUST fetch real fixture JSON from live FHWA byway pages (byway IDs 2059, 2282, 2487)
- MUST create fixtures/scenic_byways/fixtures.manifest.yaml with PT-01-feature-json entries
- MUST ensure each fixture JSON has keys: name, state, designation, description, location.coordinates ([lng, lat]), source_url, source_label
- NEVER modify scripts/curation/pipeline/sources/scenic_byways.py (implementation is complete)
- STRICTLY place fixtures in fixtures/scenic_byways/PT-01-feature-json/{fixture_file}

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] fixtures/scenic_byways/PT-01-feature-json/ contains 3 JSON files (coronado-trail.json, cherohala-skyway.json, connecticut-river-byway.json)
- [x] fixtures/scenic_byways/fixtures.manifest.yaml exists with valid PT-01-feature-json entries
- [x] python3 -m pytest scripts/curation/tests/sources/test_scenic_byways.py passes (2/2)
- [x] staging/scenic_byways.jsonl generated with 3 routes
- [x] Only fixtures/ files modified (git diff --name-only)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: All Fixtures Created and Tests Pass [PRIMARY]
  GIVEN: scenic_byways.py implementation exists and is complete
  WHEN:  Fixture JSON files are created for all 3 byways in fixtures/scenic_byways/PT-01-feature-json/
  THEN:  pytest test_scenic_byways.py passes both tests with exit code 0

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_scenic_byways.py
  TEST_FUNCTION: test_scenic_byways_ingest_emits_required_metadata

AC-2: FHWA Overlap Reconciliation Works
  GIVEN: Fixture JSON files exist with coordinates for Coronado Trail Scenic Byway
  WHEN:  Pipeline reconciles fixture data against data/fhwa_byways.csv baseline
  THEN:  Coronado Trail gets fhwa- route_id and GIS geometry replaces FHWA centroid

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_scenic_byways.py
  TEST_FUNCTION: test_scenic_byways_prefers_gis_geometry_on_fhwa_overlap

AC-3: Fixture JSON Contains All Required Fields
  GIVEN: Fixture JSON files are fetched from live FHWA byway pages
  WHEN:  scenic_byways.py extracts features using selectors.yaml
  THEN:  Each route has name, state, designation, description, location, source_url, source_label

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_scenic_byways.py
  TEST_FUNCTION: test_scenic_byways_ingest_emits_required_metadata

AC-4: Error Case - Missing Fixture File
  GIVEN: urls.jsonl references a fixture_file that does not exist on disk
  WHEN:  scenic_byways.py attempts to resolve the fixture path
  THEN:  FileNotFoundError is raised (Python cannot open missing file)

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_scenic_byways.py
  TEST_FUNCTION: (implicit - existing test covers this via happy path)

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- fixtures/scenic_byways/PT-01-feature-json/coronado-trail.json (NEW)
- fixtures/scenic_byways/PT-01-feature-json/cherohala-skyway.json (NEW)
- fixtures/scenic_byways/PT-01-feature-json/connecticut-river-byway.json (NEW)
- fixtures/scenic_byways/fixtures.manifest.yaml (NEW)

writeProhibited:
- scripts/curation/pipeline/sources/scenic_byways.py — Implementation is complete
- data/fhwa_byways.csv — Baseline data, do not modify
- .spec/prds/curation-hardening/crawl-plans/scenic_byways/ — Crawl plan is frozen
- Any file not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Fetch fixture data from FHWA byway pages via HTTP
- Validate fixture JSON structure matches selectors.yaml expectations
- Run tests after creating each fixture file
  (≤5 items)

⚠️ Ask First:
- Modifying test files to accommodate fixture structure differences
  (≤5 items)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- fixtures/scenic_byways/PT-01-feature-json/coronado-trail.json (NEW): FHWA byway 2059 fixture
- fixtures/scenic_byways/PT-01-feature-json/cherohala-skyway.json (NEW): FHWA byway 2282 fixture
- fixtures/scenic_byways/PT-01-feature-json/connecticut-river-byway.json (NEW): FHWA byway 2487 fixture
- fixtures/scenic_byways/fixtures.manifest.yaml (NEW): Manifest mapping URLs to fixture files

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   Current AC definition, scenic_byways.py fixture loading, selectors.yaml
  WRITE:  Not applicable — tests already exist, just need fixture data
  RUN:    python3 -m pytest scripts/curation/tests/sources/test_scenic_byways.py -v
  VERIFY: Tests FAIL with FileNotFoundError (fixture data missing)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ:   scenic_byways.py fixture loading code, urls.jsonl, selectors.yaml
  WRITE:  Create fixture JSON files with proper structure
  RUN:    python3 -m pytest scripts/curation/tests/sources/test_scenic_byways.py -v
  VERIFY: Tests PASS
  RETURN: { phase: "GREEN", files_changed, test_output }

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ:   Implementation just written
  WRITE:  Improved code (if needed)
  RUN:    python3 -m pytest scripts/curation/tests/sources/test_scenic_byways.py -v
  VERIFY: Tests still pass
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

## AFTER ALL ACs COMPLETE:
  Orchestrator dispatches the domain-specific reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/sources/scenic_byways.py [PRIMARY PATTERN]
   - Lines: 1-230
   - Focus: Fixture loading (_load_manifest, _resolve_fixture_path), extraction, FHWA reconciliation

2. scripts/curation/tests/sources/test_scenic_byways.py
   - Lines: 1-74
   - Focus: Test assertions — required fields, FHWA overlap verification

3. .spec/prds/curation-hardening/crawl-plans/scenic_byways/urls.jsonl
   - Lines: 1-3
   - Focus: Byway IDs (2059, 2282, 2487) and fixture_file mappings

4. .spec/prds/curation-hardening/crawl-plans/scenic_byways/selectors.yaml
   - Lines: 1-37
   - Focus: Required JSON fields and their JSONPath selectors

5. data/fhwa_byways.csv
   - Lines: 1-10
   - Focus: FHWA baseline CSV structure for reconciliation matching

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first — fail fast)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: Tests fail with FileNotFoundError for missing fixtures.

Gate 2: Fixture files exist
  Command: ls fixtures/scenic_byways/PT-01-feature-json/
  Expected: 3 JSON files listed.

Gate 3: All tests pass
  Command: python3 -m pytest scripts/curation/tests/sources/test_scenic_byways.py -v
  Expected: Exit 0, 2 passed.

Gate 4: Scope compliance
  Command: git diff --name-only
  Expected: Only fixtures/scenic_byways/ files modified.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Expanding fixture set beyond 3 routes (full 799-route dataset is production scope)
- Modifying scenic_byways.py to handle additional data fields
- Adding new acceptance criteria beyond what existing tests cover

--------------------------------------------------------------------------------
CONTEXT (read if unclear)
--------------------------------------------------------------------------------

**Current state:** scenic_byways.py (230 lines) and test_scenic_byways.py (2 tests) are written. Crawl plan (urls.jsonl, selectors.yaml) exists. data/fhwa_byways.csv exists.

**Gap:** The fixtures/ directory is completely empty — no fixture JSON files and no manifest.yaml exist. Tests fail with FileNotFoundError.

--------------------------------------------------------------------------------
REVIEW (for code-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5, evidence-gate-backed):
- Both tests pass (exit 0)
- 3 fixture JSON files exist with required keys
- Manifest YAML is valid and references correct fixture files
- No modifications to scenic_byways.py
- Only fixtures/ files in git diff

Should verify (≤5, judgment):
- Fixture data is realistic (fetched from real FHWA pages, not fabricated)
- location.coordinates follow GeoJSON [lng, lat] order
- Coronado Trail fixture matches fhwa_byways.csv entry for overlap test

Verdict: [APPROVED | NEEDS_FIXES]

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     (none)
Parallel:   SRC-006 (independent — safe to run concurrently)

================================================================================
