================================================================================
TASK: PIPE-005 - Convex batch upsert push module
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

**Problem:** Scored and classified routes produced by the Python pipeline need to reach the Convex backend (curated_routes table). No push mechanism exists. Without this module, the pipeline produces results that sit on disk and never reach the database — making every upstream task (ingestion, scoring, classification) useless in production.

**Why it matters:** This is the final stage of the Epic 1 pipeline. Every route processed by PIPE-002, PIPE-007, and PIPE-008 must be upserted into Convex via the admin HTTP endpoint (POST /api/ingest-routes, defined in PRD §API Design). The module must handle batching (Convex HTTP actions have payload limits), authentication (deploy key via env var), and partial batch failure with retry — so a single 503 does not abort an entire 184-route seed run.

**Current state:** No `pipeline/sync/convex_push.py` file exists. The admin endpoint `POST /api/ingest-routes` is defined in CONVEX-003 (Convex task) which can be developed in parallel; this task develops against a mock. The `CURATION_DEPLOY_KEY` environment variable is referenced in the PRD and will be present in `.env.local` (covered by `.gitignore`).

**Desired state:** `pipeline/sync/convex_push.py` exports a `push_routes(routes, base_url, deploy_key, batch_size=50) -> PushSummary` function that sends routes in batches of `batch_size` via authenticated HTTP POST, retries failed batches once, aggregates results into a `PushSummary` dataclass, and raises `ConfigurationError` on missing credentials. All HTTP calls in tests are mocked — no real network calls in the test suite.

> NOTE: The Convex admin endpoint URL and request/response schema are defined in PRD `.spec/prds/curation/09-technical-requirements.md` §API Design (Internal, POST /api/ingest-routes). Implementer MUST read that section before writing the push logic. The response schema is `{ created: number, updated: number, errors: string[] }`.

> NOTE: `CURATION_DEPLOY_KEY` must be loaded from the environment using `python-dotenv`. The `.env.local` file is already covered by `.gitignore` (confirmed: `.env*.local` entry present). Do NOT hardcode any key value. If the key is absent, raise `ConfigurationError` with a human-readable message — do not let the first HTTP call fail with a 401.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: push_routes batches 120 routes into 3 HTTP calls of 50/50/20
  GIVEN: a list of 120 Route objects and batch_size=50
  WHEN: `push_routes(routes, base_url, deploy_key, batch_size=50)` is called
  THEN: the underlying HTTP client is called exactly 3 times, with batch sizes of 50, 50, and 20 respectively, and each request includes `Authorization: Bearer {deploy_key}` header

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sync/test_convex_push.py
  TEST_FUNCTION: test_push_routes_batches_120_routes_into_three_calls

AC-2: push_routes aggregates inserted and updated counts across batches
  GIVEN: 3 batches where batch 1 returns {created:30, updated:20, errors:[]}, batch 2 returns {created:25, updated:25, errors:[]}, batch 3 returns {created:10, updated:10, errors:[]}
  WHEN: `push_routes` processes all batches
  THEN: the returned `PushSummary` has `sent=120`, `inserted=65`, `updated=55`, `failed=0`, and `errors=[]`

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sync/test_convex_push.py
  TEST_FUNCTION: test_push_routes_aggregates_inserted_and_updated_counts

AC-3: push_routes retries a failing batch once before logging error and continuing
  GIVEN: a batch that returns HTTP 503 on the first attempt but succeeds on the second attempt
  WHEN: `push_routes` processes that batch
  THEN: the batch is retried exactly once, and the second attempt's response is recorded in PushSummary normally

  Also:
  GIVEN: a batch that returns HTTP 503 on both attempts
  WHEN: `push_routes` processes that batch
  THEN: the batch is retried exactly once, the error is appended to `PushSummary.errors`, `PushSummary.failed` is incremented by the batch size, and the pipeline continues to the next batch (does not raise)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sync/test_convex_push.py
  TEST_FUNCTION: test_push_routes_retries_batch_once_on_503

AC-4: push_routes raises ConfigurationError when deploy_key is empty or None
  GIVEN: `deploy_key` is an empty string or None
  WHEN: `push_routes(routes, base_url, deploy_key="")` is called
  THEN: a `ConfigurationError` is raised immediately with a clear message — no HTTP request is made

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: scripts/curation/tests/sync/test_convex_push.py
  TEST_FUNCTION: test_push_routes_raises_configuration_error_on_missing_deploy_key

Quality Criteria:
- [ ] All 4 tests pass
- [ ] All HTTP calls in tests are mocked — zero real network requests
- [ ] Lint passes with zero errors
- [ ] ConfigurationError is raised, not silently swallowed
- [ ] RED evidence before each implementation phase

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | push_routes calls HTTP POST exactly 3 times when given 120 routes and batch_size=50 | AC-1 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_batches_120_routes_into_three_calls -v` | [ ] TRUE  [ ] FALSE |
| 2 | each HTTP call includes Authorization: Bearer header with the deploy_key value | AC-1 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_batches_120_routes_into_three_calls -v` | [ ] TRUE  [ ] FALSE |
| 3 | PushSummary.inserted equals sum of created counts across all batches | AC-2 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_aggregates_inserted_and_updated_counts -v` | [ ] TRUE  [ ] FALSE |
| 4 | PushSummary.updated equals sum of updated counts across all batches | AC-2 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_aggregates_inserted_and_updated_counts -v` | [ ] TRUE  [ ] FALSE |
| 5 | a batch that returns 503 is retried exactly once before being counted in PushSummary.failed | AC-3 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_retries_batch_once_on_503 -v` | [ ] TRUE  [ ] FALSE |
| 6 | push_routes continues processing remaining batches after a permanently-failing batch | AC-3 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_retries_batch_once_on_503 -v` | [ ] TRUE  [ ] FALSE |
| 7 | push_routes raises ConfigurationError when deploy_key is empty string | AC-4 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_raises_configuration_error_on_missing_deploy_key -v` | [ ] TRUE  [ ] FALSE |
| 8 | no HTTP request is made when ConfigurationError is raised | AC-4 | `python -m pytest tests/sync/test_convex_push.py::test_push_routes_raises_configuration_error_on_missing_deploy_key -v` | [ ] TRUE  [ ] FALSE |

TC-1: batch count and auth header
  Statement: push_routes makes exactly 3 HTTP POST calls with bearer auth when given 120 routes and batch_size=50
  Maps To: AC-1
  Verify: `python -m pytest tests/sync/test_convex_push.py::test_push_routes_batches_120_routes_into_three_calls -v`
  Status: [ ] TRUE  [ ] FALSE

TC-2: PushSummary aggregation
  Statement: PushSummary.inserted and PushSummary.updated correctly sum created/updated counts across all batches
  Maps To: AC-2
  Verify: `python -m pytest tests/sync/test_convex_push.py::test_push_routes_aggregates_inserted_and_updated_counts -v`
  Status: [ ] TRUE  [ ] FALSE

TC-3: retry once then continue
  Statement: push_routes retries a 503 batch exactly once; permanent failure appends to errors and increments failed without stopping the pipeline
  Maps To: AC-3
  Verify: `python -m pytest tests/sync/test_convex_push.py::test_push_routes_retries_batch_once_on_503 -v`
  Status: [ ] TRUE  [ ] FALSE

TC-4: ConfigurationError on missing key
  Statement: push_routes raises ConfigurationError immediately when deploy_key is empty or None — no HTTP requests made
  Maps To: AC-4
  Verify: `python -m pytest tests/sync/test_convex_push.py::test_push_routes_raises_configuration_error_on_missing_deploy_key -v`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `.spec/prds/curation/09-technical-requirements.md`
   - Section: API Design — Internal (POST /api/ingest-routes)
   - Focus: Request schema `{ routes: CuratedRoute[] }`, response schema `{ created: number, updated: number, errors: string[] }`, auth header format (Bearer token). MUST read before writing HTTP serialization.

2. `scripts/curation/pipeline/models.py`
   - Lines: ALL
   - Focus: `Route` dataclass field names (snake_case in Python). The push module must serialize these to the JSON key names expected by the Convex endpoint (camelCase). Implementer must decide and document the field name mapping strategy.

3. `.spec/prds/curation/tasks/epic-1-backend-seed-pipeline/PIPE-001.md`
   - Section: CODE PATTERN (Reference)
   - Focus: Route field name decision — PIPE-001 spec discusses the camelCase vs snake_case naming question. Read the NOTES section of that task for the current decision.

4. `.spec/prds/curation/09-technical-requirements.md`
   - Section: Convex: curated_routes lean tier schema (the TypeScript schema)
   - Focus: Exact camelCase field names expected by Convex (routeId, centroidLat, compositeScore, etc.) — these are the JSON keys in the POST body

5. `scripts/curation/requirements.txt`
   - Lines: ALL
   - Focus: Verify `requests` is listed as a runtime dep (added in PIPE-001); verify `responses` is in requirements-dev.txt (needed for HTTP mocking in tests)

6. `.spec/prds/curation/tasks/epic-1-backend-seed-pipeline/CONVEX-003.md` (if it exists)
   - Lines: ALL (if present)
   - Focus: Exact endpoint path and response schema — PIPE-005 can be developed against mocks if CONVEX-003 is incomplete

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- scripts/curation/pipeline/sync/convex_push.py (NEW)
- scripts/curation/tests/sync/__init__.py (NEW)
- scripts/curation/tests/sync/test_convex_push.py (NEW)

WRITE-PROHIBITED:
- scripts/curation/pipeline/models.py — Route dataclass is PIPE-001, do not modify
- scripts/curation/pipeline/sources/fhwa.py — ingestion is PIPE-002
- scripts/curation/pipeline/scoring/composite.py — scoring is PIPE-007
- scripts/curation/pipeline/classification/archetype.py — classification is PIPE-008
- scripts/curation/.env.local or any credential file
- Any file not explicitly listed above

MUST:
- [ ] Function signature: `def push_routes(routes: list[Route], base_url: str, deploy_key: str, batch_size: int = 50) -> PushSummary`
- [ ] `PushSummary` must be a `@dataclass` with fields: `sent: int`, `inserted: int`, `updated: int`, `failed: int`, `errors: list[str]`
- [ ] `ConfigurationError` must be a named exception class defined in convex_push.py
- [ ] Use `requests` library for HTTP — not `urllib`, not `httpx`
- [ ] Use `responses` library (or `unittest.mock`) for HTTP mocking in tests — zero real network calls
- [ ] Retry exactly once on HTTP 5xx response — no more, no less
- [ ] Append error description to `PushSummary.errors` on permanent batch failure — do not raise
- [ ] Load `CURATION_DEPLOY_KEY` documentation comment explains `.env.local` is the source
- [ ] Serialize Route fields to camelCase JSON keys matching Convex schema (see READING LIST §2-4 for mapping)

MUST NOT:
- [ ] Make real HTTP calls in any test
- [ ] Retry on 4xx errors (401, 403, 404 are not retryable — fail fast)
- [ ] Swallow ConfigurationError — it must propagate to the caller
- [ ] Commit or reference any actual deploy key value
- [ ] Use async/await — synchronous requests only for Phase 1
- [ ] Write implementation before the test for that AC fails

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

```python
# scripts/curation/pipeline/sync/convex_push.py
# Pattern: requests + dataclass result, retry-once on 5xx, ConfigurationError on missing key
# Source: PRD §API Design Internal (09-technical-requirements.md) — READ BEFORE IMPLEMENTING

from __future__ import annotations
import logging
from dataclasses import dataclass, field
from typing import Any
import requests
from scripts.curation.pipeline.models import Route

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when required configuration (e.g., deploy key) is missing."""


@dataclass
class PushSummary:
    """Aggregate result of a push_routes() call across all batches."""
    sent: int = 0
    inserted: int = 0
    updated: int = 0
    failed: int = 0
    errors: list[str] = field(default_factory=list)


def _route_to_dict(route: Route) -> dict[str, Any]:
    """
    Serialize a Route dataclass to the JSON dict expected by POST /api/ingest-routes.

    Field mapping: Python snake_case → Convex camelCase.
    Source: curated_routes lean tier schema in 09-technical-requirements.md.
    """
    return {
        "routeId":         route.route_id,
        "name":            route.name,
        "state":           route.state,
        "source":          route.source,
        "centroidLat":     route.centroid_lat,
        "centroidLng":     route.centroid_lng,
        "lengthMiles":     route.length_miles,
        "compositeScore":  route.composite_score if route.composite_score is not None else 0.0,
        # ... remaining fields mapped similarly
        # Implementer: add all fields from the PRD lean tier schema
    }


def _push_batch(
    session: requests.Session,
    url: str,
    headers: dict,
    batch: list[Route],
) -> dict[str, Any]:
    """
    POST one batch to the Convex ingest endpoint.
    Returns the parsed JSON response body.
    Raises requests.HTTPError on non-2xx that is not retried.
    """
    payload = {"routes": [_route_to_dict(r) for r in batch]}
    resp = session.post(url, json=payload, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()


def push_routes(
    routes: list[Route],
    base_url: str,
    deploy_key: str,
    batch_size: int = 50,
) -> PushSummary:
    """
    Push scored + classified routes to Convex in batches.

    Batches routes into groups of `batch_size`, POSTs each batch to
    {base_url}/api/ingest-routes with Bearer auth, retries once on 5xx,
    and aggregates results into a PushSummary.

    Raises:
        ConfigurationError: if deploy_key is empty or None.

    Source: PRD §API Design Internal (POST /api/ingest-routes) in
            09-technical-requirements.md
    """
    if not deploy_key:
        raise ConfigurationError(
            "CURATION_DEPLOY_KEY is not set. "
            "Add it to .env.local (see 09-technical-requirements.md §API Design)."
        )

    url = f"{base_url.rstrip('/')}/api/ingest-routes"
    headers = {
        "Authorization": f"Bearer {deploy_key}",
        "Content-Type": "application/json",
    }
    summary = PushSummary(sent=len(routes))

    with requests.Session() as session:
        for i in range(0, len(routes), batch_size):
            batch = routes[i: i + batch_size]
            try:
                result = _push_batch(session, url, headers, batch)
            except requests.HTTPError as exc:
                if exc.response is not None and exc.response.status_code >= 500:
                    # Retry once on 5xx
                    logger.warning("Batch %d: 5xx on first attempt, retrying once", i)
                    try:
                        result = _push_batch(session, url, headers, batch)
                    except requests.HTTPError as retry_exc:
                        msg = f"Batch {i}-{i + len(batch)}: permanent failure — {retry_exc}"
                        logger.error(msg)
                        summary.failed += len(batch)
                        summary.errors.append(msg)
                        continue
                else:
                    raise  # 4xx errors are not retried — re-raise immediately
            summary.inserted += result.get("created", 0)
            summary.updated  += result.get("updated", 0)
            if result.get("errors"):
                summary.errors.extend(result["errors"])

    return summary
```

```python
# scripts/curation/tests/sync/test_convex_push.py
# Pattern: responses library for HTTP mocking, no real network calls

import pytest
import responses as responses_mock
from dataclasses import dataclass
from scripts.curation.pipeline.models import Route
from scripts.curation.pipeline.sync.convex_push import (
    push_routes, PushSummary, ConfigurationError
)

BASE_URL = "https://fake-convex.convex.site"
DEPLOY_KEY = "test-key-abc123"

def _make_route(n: int) -> Route:
    return Route(
        route_id=f"fhwa-route-{n:04d}",
        name=f"Route {n}",
        state="TN",
        source="fhwa",
        centroid_lat=35.0 + n * 0.01,
        centroid_lng=-84.0,
    )

def _make_routes(count: int) -> list[Route]:
    return [_make_route(i) for i in range(count)]


@responses_mock.activate
def test_push_routes_batches_120_routes_into_three_calls():
    # GIVEN: 120 routes and mocked endpoint
    routes = _make_routes(120)
    for _ in range(3):
        responses_mock.add(
            responses_mock.POST,
            f"{BASE_URL}/api/ingest-routes",
            json={"created": 40, "updated": 10, "errors": []},
            status=200,
        )
    # WHEN: push_routes called with batch_size=50
    summary = push_routes(routes, BASE_URL, DEPLOY_KEY, batch_size=50)
    # THEN: exactly 3 HTTP calls were made
    assert len(responses_mock.calls) == 3
    # AND: Authorization header present on each call
    for call in responses_mock.calls:
        assert call.request.headers["Authorization"] == f"Bearer {DEPLOY_KEY}"
```

> NOTE: The `responses` library must be listed in `requirements-dev.txt` (added in PIPE-001). Verify it is present before writing tests. If `responses` is missing from requirements-dev.txt, add it — that edit is allowed within the WRITE-ALLOWED scope of PIPE-001's `requirements-dev.txt`. If PIPE-001 has already been completed and merged, open a separate minor fix task; do NOT silently proceed without it.

> NOTE: Field name serialization in `_route_to_dict()`: The `Route` dataclass (PIPE-001) uses snake_case. The Convex endpoint expects camelCase matching the TypeScript schema. The push module owns this translation. Implementer must map ALL fields from the lean tier schema, not just the ones shown in the code pattern above. Read `09-technical-requirements.md §curated_routes` for the full field list.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: general-purpose

## BEFORE WRITING ANY CODE:
  READ: `09-technical-requirements.md` §API Design — POST /api/ingest-routes (request schema, response schema, auth)
  READ: `scripts/curation/pipeline/models.py` — Route field names (snake_case)
  READ: `09-technical-requirements.md` §Convex: curated_routes (camelCase field names for JSON serialization)
  VERIFY: `responses` library is in `requirements-dev.txt`

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, PRD endpoint schema, Route field names
  WRITE: ONE test function for this AC in test_convex_push.py
  CREATE: Empty `scripts/curation/pipeline/sync/convex_push.py` if not yet present (to avoid ImportError masking RED)
  RUN: `cd scripts/curation && python -m pytest tests/sync/test_convex_push.py -v`
  VERIFY: Test FAILS with AssertionError (not ImportError — empty module is fine for RED)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  MUST: Show actual test failure output
  MUST NOT: Write any push_routes() implementation yet
  MUST: All HTTP calls mocked — no requests.get to real endpoints

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ: Failing test, AC definition, endpoint schema
  WRITE: MINIMAL implementation in convex_push.py to pass that test
  RUN: `cd scripts/curation && python -m pytest tests/sync/test_convex_push.py -v`
  VERIFY: Test PASSES
  RETURN: { phase: "GREEN", files_changed, test_output }

  MUST: Implement actual batching / retry / error logic, not trivial stubs
  MUST NOT: Add features beyond the current AC

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ: Implementation just written
  WRITE: Improved code if needed (extract helpers, improve error messages, clean constants)
  RUN: `cd scripts/curation && python -m pytest tests/sync/ -v`
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
  RUN: `cd scripts/curation && python -m pytest tests/sync/test_convex_push.py -v`
  EXPECT: Exit code != 0, failure for the new test function
  IF PASS: Reject "Vanity test — passes without implementation"
  IF IMPORT ERROR: Reject "Test has import error, not valid RED — ensure empty convex_push.py exists"
  IF REAL NETWORK CALL: Reject "Test makes real HTTP requests — all HTTP must be mocked"

AFTER GREEN PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/sync/test_convex_push.py -v`
  EXPECT: Exit code 0, all tests written so far pass

AFTER REFACTOR PHASE:
  RUN: `cd scripts/curation && python -m pytest tests/sync/ -v`
  EXPECT: Exit code 0, all tests still pass
  ALSO RUN: `cd scripts/curation && python -m pytest tests/ -v`
  EXPECT: No regressions in other test modules

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: general-purpose
**Rationale**: HTTP batch push with retry logic using the `requests` library. No specialized Convex client knowledge required — the Convex endpoint is a plain HTTP action with a Bearer token. No Python-specialist agent exists in the LaneShadow agent roster (convex-implementer handles TypeScript only). general-purpose is the correct assignment.

**Review Agent**: feature-dev:code-reviewer
**Rationale**: Review should verify that HTTP mocking is complete (no real network calls in tests), that the retry logic fires exactly once on 5xx (not on 4xx), that ConfigurationError propagates correctly, and that the field name mapping in `_route_to_dict()` covers all Convex schema fields.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard agent-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: FEATURE (DEV)
- File Patterns: pipeline/sync/convex_push.py, tests/sync/test_convex_push.py
- Implementation: general-purpose — HTTP client, retry, serialization
- Review: feature-dev:code-reviewer — validates mock completeness, retry logic, field mapping

**Override**: If manual agent assignment is needed, specify agents in task labels

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All Tests Pass
  Command: `cd scripts/curation && python -m pytest tests/sync/test_convex_push.py -v`
  Expected: Exit 0, all 4 tests pass

Gate 2: Each AC Has Test
  Verify: test_convex_push.py contains one test function per AC (4 functions)

Gate 3: No Real Network Calls
  Verify (reviewer check): all tests use `@responses.activate` decorator or `unittest.mock.patch('requests.Session')` — no test makes actual HTTP requests

Gate 4: Retry Logic Correct
  Verify (reviewer check): retry fires exactly once on 5xx; 4xx errors re-raise without retry

Gate 5: ConfigurationError Defined
  Command: `python -c "from scripts.curation.pipeline.sync.convex_push import ConfigurationError; print('OK')"`
  Expected: Exit 0

Gate 6: Lint
  Command: `python -m py_compile scripts/curation/pipeline/sync/convex_push.py`
  Expected: Exit 0

Gate 7: Scope Compliance
  Command: `git diff --name-only`
  Expected: Only convex_push.py, tests/sync/__init__.py, tests/sync/test_convex_push.py

--------------------------------------------------------------------------------
REVIEW CRITERIA (for feature-dev:code-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] One test per acceptance criterion
- [ ] Tests verify observable behavior (call count, PushSummary fields, exception type)
- [ ] RED evidence before each implementation
- [ ] Zero real HTTP calls in any test — all mocked

Code Quality:
- [ ] push_routes() is synchronous — no async/await
- [ ] requests.Session used (connection reuse) — not standalone requests.post()
- [ ] ConfigurationError defined as a named class inheriting from Exception
- [ ] PushSummary is a @dataclass with correct field types
- [ ] Retry logic is explicit: attempt once, catch 5xx, retry once, then log + continue

Domain-Specific:
- [ ] _route_to_dict() maps ALL Route fields to Convex camelCase schema field names
- [ ] Authorization header is `Bearer {deploy_key}` — not `Token`, not `Basic`
- [ ] Endpoint path is `/api/ingest-routes` (not `/admin/curation/routes` — verify against PRD §API Design)
- [ ] 4xx errors (401, 403) are NOT retried — they re-raise immediately
- [ ] PushSummary.sent equals len(routes) regardless of batch failures
- [ ] PushSummary.failed counts routes in permanently-failed batches (not batch count)

Security:
- [ ] deploy_key never logged — confirm no logger.debug(deploy_key) or similar
- [ ] No credential hardcoded anywhere in the module
- [ ] ConfigurationError message does not reveal the key value

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- PIPE-001 — needs Route dataclass and `pipeline/sync/` package scaffold
- PIPE-007 — hard dependency: the push module is most useful with scored routes; integration test relies on routes having score fields populated

Blocks:
- (none — this is the final stage of the Epic 1 pipeline; Epic 2+ tasks consume data already in Convex)

Integration Dependency (soft):
- CONVEX-003 — defines the actual HTTP endpoint. PIPE-005 can be implemented and tested fully against mocks before CONVEX-003 is complete. Integration testing against the real endpoint requires CONVEX-003 to be deployed.

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] PIPE-001 complete — Route dataclass exists at pipeline/models.py, `pipeline/sync/` package scaffold exists
- [ ] PIPE-007 complete — scored Route objects available for integration testing
- [ ] `responses` library in requirements-dev.txt (added by PIPE-001; verify before starting)
- [ ] PRD §API Design (POST /api/ingest-routes) reviewed

Can Execute In Parallel With: PIPE-002 (FHWA ingestion), PIPE-008 (archetype classifier), CONVEX-003 (Convex endpoint implementation — develop against mocks)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- **Endpoint path ambiguity**: The task description in this spec file uses `/admin/curation/routes`. The PRD `09-technical-requirements.md` §API Design defines the endpoint as `POST /api/ingest-routes`. The PRD is authoritative. Implementer must verify the correct path by reading the PRD section directly — do not use the path from this spec's task description if it conflicts with the PRD.

- **`responses` vs `unittest.mock`**: Either mocking approach is acceptable for tests. The `responses` library (`@responses.activate`) is simpler for HTTP-specific assertions (URL, method, call count). `unittest.mock.patch` is stdlib and avoids an extra dependency. Check which is in requirements-dev.txt and use that. If neither is present, add `responses` to requirements-dev.txt (that file is WRITE-ALLOWED for this task's test setup context — but prefer to fix it in a targeted follow-up rather than silently mutating a PIPE-001 file).

- **`_route_to_dict()` completeness**: The code pattern above shows only a partial field mapping. The full mapping must cover ALL fields in the curated_routes lean tier schema. Fields that are None on the Route object should either be omitted from the JSON or passed as null — the PRD defines which fields are required vs optional in the endpoint payload. Read the schema carefully.

- **Batch size and payload limits**: The Convex HTTP action payload limit is not explicitly documented in the PRD. 50 routes per batch is the specified default. Each lean-tier route is ~300 bytes on disk; 50 routes ≈ 15KB JSON — well within typical limits. Do not change the default batch_size without a PRD reference.

- **Authentication**: The deploy key is the `CURATION_DEPLOY_KEY` from `.env.local`. The module should NOT call `load_dotenv()` internally — that is the caller's responsibility (pipeline orchestrator). The module receives `deploy_key` as a parameter. Loading from env is done at the CLI/orchestrator level, not inside the library function.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================
