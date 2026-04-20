================================================================================
TASK: SRC-006 - Rider Magazine 50 Best Roads Fixture Data + Test Verification
================================================================================

TASK_TYPE:  FEATURE
STATUS:     ✅ Completed
COMPLETED:  2026-04-20
COMMIT:     0554f177c2df58369f560ab29ef51b0686b13b65
REVIEWER:   feature-dev:code-reviewer
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=python-implement

RUNTIME_COMMANDS:
  test:      python3 -m pytest scripts/curation/tests/sources/test_rider_mag.py -v

PROGRESS: none

--------------------------------------------------------------------------------
OUTCOME (1 sentence, ≤30 words — observable success)
--------------------------------------------------------------------------------

Rider Magazine article HTML fixture exists and both test_rider_mag.py tests pass with 50 routes.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- MUST fetch real article HTML from https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/
- MUST create fixtures/rider_mag/fixtures.manifest.yaml with source_article.url entry
- MUST ensure HTML has h2 headings matching HEADING_RE pattern ({rank}. {name} ({state} / {dist} miles):)
- NEVER modify scripts/curation/pipeline/sources/rider_mag.py (implementation is complete)
- STRICTLY validate exactly 50 routes are parsed from the article

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] fixtures/rider_mag/source_article.html exists with full article content
- [x] fixtures/rider_mag/fixtures.manifest.yaml exists with source_article.url
- [x] python3 -m pytest scripts/curation/tests/sources/test_rider_mag.py passes (2/2)
- [x] staging/rider_mag.jsonl generated with exactly 50 routes
- [x] Only fixtures/rider_mag/ files modified (git diff --name-only)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: Article HTML Fixture Created and Tests Pass [PRIMARY]
  GIVEN: rider_mag.py implementation exists and is complete (301 lines)
  WHEN:  Fixture HTML file is created at fixtures/rider_mag/source_article.html
  THEN:  pytest test_rider_mag.py passes both tests with exit code 0

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_rider_mag.py
  TEST_FUNCTION: test_rider_mag_ingest_emits_exactly_fifty_records

AC-2: All 50 Routes Extracted with Ground Truth Metadata
  GIVEN: Fixture HTML contains article with 50 route sections
  WHEN:  rider_mag.py parses the HTML
  THEN:  Each route has ground_truth=true, ground_truth_source=rider_magazine_50_best, editorial_rank, source_rank

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_rider_mag.py
  TEST_FUNCTION: test_rider_mag_records_include_ground_truth_metadata

AC-3: Route Sections Match urls.jsonl Inventory
  GIVEN: urls.jsonl contains 50 entries with source_rank 1-50
  WHEN:  rider_mag.py parses article and cross-validates with inventory
  THEN:  All 50 ranks match and routes are sorted by editorial_rank ascending

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_rider_mag.py
  TEST_FUNCTION: test_rider_mag_ingest_emits_exactly_fifty_records

AC-4: Error Case - Missing Source Article HTML
  GIVEN: fixtures/rider_mag/source_article.html does not exist
  WHEN:  rider_mag.py attempts to load the article
  THEN:  FileNotFoundError is raised

  TDD_STATE:     none
  TEST_FILE:     scripts/curation/tests/sources/test_rider_mag.py
  TEST_FUNCTION: (implicit - current test failure proves this)

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- fixtures/rider_mag/source_article.html (NEW)
- fixtures/rider_mag/fixtures.manifest.yaml (NEW)

writeProhibited:
- scripts/curation/pipeline/sources/rider_mag.py — Implementation is complete
- .spec/prds/curation-hardening/crawl-plans/rider_mag/ — Crawl plan is frozen
- Any file not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Fetch article HTML from live Rider Magazine URL
- Validate HTML structure against HEADING_RE pattern before saving
- Run tests after creating fixture files
  (≤5 items)

⚠️ Ask First:
- Modifying test files to accommodate HTML structure differences
  (≤5 items)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- fixtures/rider_mag/source_article.html (NEW): Full Rider Magazine article HTML
- fixtures/rider_mag/fixtures.manifest.yaml (NEW): Manifest with source_article.url

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   Current AC definition, rider_mag.py parsing logic, HEADING_RE pattern
  WRITE:  Not applicable — tests already exist, just need fixture data
  RUN:    python3 -m pytest scripts/curation/tests/sources/test_rider_mag.py -v
  VERIFY: Tests FAIL with FileNotFoundError (fixture data missing)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ:   rider_mag.py parsing code, HEADING_RE, selectors.yaml, urls.jsonl
  WRITE:  Create fixture HTML and manifest files
  RUN:    python3 -m pytest scripts/curation/tests/sources/test_rider_mag.py -v
  VERIFY: Tests PASS
  RETURN: { phase: "GREEN", files_changed, test_output }

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ:   Implementation just written
  WRITE:  Improved code (if needed)
  RUN:    python3 -m pytest scripts/curation/tests/sources/test_rider_mag.py -v
  VERIFY: Tests still pass
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

## AFTER ALL ACs COMPLETE:
  Orchestrator dispatches the domain-specific reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. scripts/curation/pipeline/sources/rider_mag.py [PRIMARY PATTERN]
   - Lines: 1-301
   - Focus: HEADING_RE pattern, parse_route_section_html, _load_source_article, parse_source_article

2. scripts/curation/tests/sources/test_rider_mag.py
   - Lines: 1-76
   - Focus: Test assertions — 50 routes, ground_truth metadata, specific route checks (Route 66)

3. .spec/prds/curation-hardening/crawl-plans/rider_mag/urls.jsonl
   - Lines: 1-50
   - Focus: Expected 50 route entries with source_rank, route_name, state_raw

4. .spec/prds/curation-hardening/crawl-plans/rider_mag/selectors.yaml
   - Lines: 1-43
   - Focus: HTML selectors for heading, description, related link extraction

5. .spec/prds/curation-hardening/crawl-plans/rider_mag/crawl-report.md
   - Focus: Site structure and crawl strategy context

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first — fail fast)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: Tests fail with FileNotFoundError for missing fixtures.

Gate 2: Fixture HTML exists
  Command: ls -la fixtures/rider_mag/source_article.html
  Expected: File exists with size > 0.

Gate 3: All tests pass
  Command: python3 -m pytest scripts/curation/tests/sources/test_rider_mag.py -v
  Expected: Exit 0, 2 passed.

Gate 4: Exactly 50 routes in staging
  Command: wc -l staging/rider_mag.jsonl
  Expected: 50 lines.

Gate 5: Scope compliance
  Command: git diff --name-only
  Expected: Only fixtures/rider_mag/ files modified.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- Adding geographic coordinate resolution (centroid_lat/centroid_lng remain 0.0 — geocoding is a separate pipeline stage)
- Modifying rider_mag.py to handle alternative HTML structures
- Adding new acceptance criteria beyond what existing tests cover

--------------------------------------------------------------------------------
CONTEXT (read if unclear)
--------------------------------------------------------------------------------

**Current state:** rider_mag.py (301 lines) and test_rider_mag.py (2 tests) are written. Crawl plan (urls.jsonl with 50 entries, selectors.yaml) exists.

**Gap:** The fixtures/rider_mag/ directory does not exist — no source_article.html and no manifest.yaml. Tests fail with FileNotFoundError.

**Key HTML structure:** h2 headings must match HEADING_RE: `^{rank}\.\s*{route_name}\s*\({state_text}\s*/\s*{distance_miles}\s*miles\):?$`. Each section has a description paragraph and a "Related:" link. Route 14 is "Route 66" spanning 6 states (Illinois, Missouri, Oklahoma, Texas, New Mexico, Arizona, California).

--------------------------------------------------------------------------------
REVIEW (for code-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5, evidence-gate-backed):
- Both tests pass (exit 0)
- Fixture HTML is real article content, not fabricated
- Manifest YAML is valid with source_article.url
- No modifications to rider_mag.py
- Only fixtures/rider_mag/ files in git diff

Should verify (≤5, judgment):
- Article HTML produces exactly 50 parseable h2 headings
- Multi-state routes (e.g., Route 66) are handled correctly
- Routes sorted by editorial_rank match expected ordering

Verdict: [APPROVED | NEEDS_FIXES]

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     (none)
Parallel:   SRC-001 (independent — safe to run concurrently)

================================================================================
