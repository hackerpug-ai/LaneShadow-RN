# QUAL-006: Implement fetch_all_routes Convex Bridge

**Task ID:** QUAL-006
**Sprint:** [sprint-06 — Quality Infrastructure (Semantic Dedup & Floor)](SPRINT.md)
**Assigned To:** python-implement
**Reviewer:** python-review
**Review Mode:** SINGLE
**Status:** Backlog
**Priority:** P0
**Effort:** S
**Estimate:** 60 min
**Type:** FEATURE
**PRD Refs:** UC-QUAL-01
**Depends on:** QUAL-001  |  **Blocks:** Sprint-7 end-to-end run

---

## GOAL

Replace the explicit stub `fetch_all_routes()` in `semantic_deduplicator.py` with a real Convex HTTP fetch that paginates through all curated routes, using the existing `convex_fetch.py` pattern.

## DELIVERABLE

- scripts/curation/pipeline/dedup/semantic_deduplicator.py (MODIFY): replace stub `fetch_all_routes()` with real implementation
- scripts/curation/tests/test_qual_006.py (NEW): tests for the fetch function

## DONE WHEN

- [ ] `fetch_all_routes()` calls Convex HTTP endpoint to retrieve all curated routes with pagination
- [ ] Function uses the same auth pattern as `convex_fetch.py` (Bearer token via deploy_key)
- [ ] Paginated responses (Convex `cursor`/`isDone` pattern) are fully consumed
- [ ] Route documents are converted to `Route` dataclass via `_dict_to_route` from `convex_fetch.py`
- [ ] `--limit` flag is respected (caps total routes returned)
- [ ] Empty catalog returns `[]` (not an error)
- [ ] `cd scripts/curation && python -m pytest tests/test_qual_006.py -v` passes
- [ ] Only WRITE-ALLOWED files modified

## OUT OF SCOPE

- Changes to `convex_fetch.py` — that module is stable; reuse its `_dict_to_route` helper
- Changes to the Convex schema or server-side functions
- Changes to `SemanticDeduplicator` class itself — only the free function `fetch_all_routes()` changes
- Full-catalog runtime benchmarking (that's QUAL-008)

## CRITICAL CONSTRAINTS

**MUST:**
- Reuse `_dict_to_route` from `scripts/curation/pipeline/sync/convex_fetch.py` for document-to-Route conversion
- Use `requests.post` with Convex HTTP API format: `{base_url}/api/run/{function_name}` with `{"args": {...}}` body
- Handle paginated Convex responses: `value.page` + `value.continueCursor` + `value.isDone`
- Respect the `--limit` parameter by breaking the pagination loop once enough routes are collected
- Raise `ConfigurationError` if `deploy_key` is empty (matching `convex_fetch.py` behavior)

**NEVER:**
- Use `npx convex run` subprocess calls — the deduplicator already uses HTTP POST for `_fetch_candidates`; keep `fetch_all_routes` consistent
- Import or modify `convex_fetch.fetch_routes_needing_embedding` — that function calls a different Convex endpoint (`semanticSearch:getRoutesNeedingEmbedding`)
- Change the function signature — `main()` at line 296 calls `fetch_all_routes(args.base_url, args.deploy_key, args.limit)`

**STRICTLY:**
- The Convex function to call is `curationAdmin:getAllCuratedRoutes` — this returns all routes with their embeddings populated. If this function does not exist in the Convex deployment, use `semanticSearch:getRoutesNeedingEmbedding` with `incremental=false` as a fallback (this returns all routes regardless of embedding status).

## SPECIFICATION

**Objective:** Replace the stub `fetch_all_routes()` with a real HTTP client that retrieves the full curated route catalog from Convex.

**Success state:** Calling `python -m pipeline.dedup.semantic_deduplicator --base-url $URL --deploy-key $KEY` fetches all 5,608 routes and begins deduplication processing.

## ACCEPTANCE CRITERIA (TDD Beads)

### 1: Real HTTP call replaces stub

**GIVEN:** A Convex deployment with 5 routes accessible via `curationAdmin:getAllCuratedRoutes`
**WHEN:** `fetch_all_routes(base_url, deploy_key)` is called
**THEN:** An HTTP POST is made to `{base_url}/api/run/curationAdmin:getAllCuratedRoutes`; the response is parsed; 5 `Route` objects are returned

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_006.py::test_fetch_all_routes_makes_http_call -v`
- **Test file:** `scripts/curation/tests/test_qual_006.py`
- **Test function:** `test_fetch_all_routes_makes_http_call`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 2: Pagination consumes all pages

**GIVEN:** A Convex deployment returning 3 pages of routes (2 routes, 2 routes, 1 route) with `continueCursor` and `isDone=false/isDone=true`
**WHEN:** `fetch_all_routes(base_url, deploy_key)` is called
**THEN:** 3 HTTP POST requests are made; all 5 routes are collected and returned

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_006.py::test_fetch_all_routes_paginates -v`
- **Test file:** `scripts/curation/tests/test_qual_006.py`
- **Test function:** `test_fetch_all_routes_paginates`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 3: Limit parameter caps results

**GIVEN:** A Convex deployment with 100 routes
**WHEN:** `fetch_all_routes(base_url, deploy_key, limit=10)` is called
**THEN:** At most 10 routes are returned; pagination stops early

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_006.py::test_fetch_all_routes_respects_limit -v`
- **Test file:** `scripts/curation/tests/test_qual_006.py`
- **Test function:** `test_fetch_all_routes_respects_limit`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

### 4: Missing deploy key raises ConfigurationError

**GIVEN:** An empty or None deploy_key
**WHEN:** `fetch_all_routes(base_url, "")` is called
**THEN:** `ConfigurationError` is raised with a message mentioning CURATION_DEPLOY_KEY

- **Verify:** `cd scripts/curation && python -m pytest tests/test_qual_006.py::test_fetch_all_routes_missing_key_raises -v`
- **Test file:** `scripts/curation/tests/test_qual_006.py`
- **Test function:** `test_fetch_all_routes_missing_key_raises`
- **TDD state:** [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR

## TEST CRITERIA

1. `fetch_all_routes` makes at least one HTTP POST request when called with valid credentials
2. Paginated responses (page + continueCursor + isDone) are fully consumed until isDone=true
3. The `limit` parameter causes the function to return at most `limit` routes
4. Empty or None deploy_key raises `ConfigurationError`
5. Empty catalog (0 routes in Convex) returns `[]` without error
6. Each Convex route document is converted via `_dict_to_route` from `convex_fetch.py`

## READING LIST

- `scripts/curation/pipeline/sync/convex_fetch.py` (lines: 22-47, 50-141) — `_dict_to_route` helper and `fetch_routes_needing_embedding` pattern to follow
- `scripts/curation/pipeline/quality/floor_filter.py` (lines: 105-149) — `_fetch_reconciled_routes` pagination pattern for Convex cursor-based responses
- `scripts/curation/pipeline/dedup/semantic_deduplicator.py` (lines: 269-275) — the stub to replace
- `scripts/curation/pipeline/dedup/semantic_deduplicator.py` (lines: 146-177) — existing `_fetch_candidates` HTTP pattern in the same file

## GUARDRAILS

### WRITE-ALLOWED
- scripts/curation/pipeline/dedup/semantic_deduplicator.py (MODIFY)
- scripts/curation/tests/test_qual_006.py (NEW)

### WRITE-PROHIBITED
- scripts/curation/pipeline/sync/convex_fetch.py — stable module, do not modify
- scripts/curation/pipeline/models.py — Route dataclass is frozen
- scripts/curation/tests/test_qual_001.py — existing tests must still pass after changes
- convex/** — backend schema is frozen

## DESIGN

**References:**
- SPRINT.md (sprint-06-quality-dedup-floor/SPRINT.md)
- QUAL-001 task (QUAL-001-semantic-deduplication-engine.md)

**Pattern (from floor_filter.py:105-149):**

```python
def _fetch_reconciled_routes(self) -> list[dict[str, Any]]:
    url = f"{self.base_url}/api/run/curationAdmin:getReconciledRoutesPage"
    routes: list[dict[str, Any]] = []
    cursor: str | None = None
    while True:
        payload = {"args": {"cursor": cursor, "numItems": 1000}}
        response = requests.post(url, headers=headers, json=payload, timeout=self.timeout_seconds)
        response.raise_for_status()
        body = response.json()
        value = body.get("value")
        if isinstance(value, dict):
            page = value.get("page")
            if isinstance(page, list):
                routes.extend(item for item in page if isinstance(item, dict))
                is_done = bool(value.get("isDone", True))
                cursor = value.get("continueCursor")
                if is_done or cursor is None:
                    break
                continue
            # fallback: result-wrapped
            result = value.get("result")
            if isinstance(result, list):
                routes.extend(item for item in result if isinstance(item, dict))
            break
        break
    return routes
```

**Pattern source:** `scripts/curation/pipeline/quality/floor_filter.py:105-149`

**Anti-pattern:** Do NOT use `npx convex run` subprocess — the embedding batch runner uses this pattern but it's slower and adds node dependency overhead. The HTTP POST pattern in `_fetch_candidates` and `floor_filter` is the established convention for this module.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| New Tests Pass | `cd scripts/curation && python -m pytest tests/test_qual_006.py -v` | Exit 0 |
| Existing Tests Still Pass | `cd scripts/curation && python -m pytest tests/test_qual_001.py -v` | Exit 0 |
| Scope Compliance | `git diff --name-only` | Only WRITE-ALLOWED files modified |
| Ruff Lint | `cd scripts/curation && ruff check pipeline/dedup/semantic_deduplicator.py` | No errors |

## AGENT INSTRUCTIONS

Per AC: RED (write pytest with mocked Convex HTTP responses via `responses` library — register POST URL for the Convex endpoint with paginated fixture JSON) -> GREEN (implement minimal `fetch_all_routes` to make each AC pass) -> REFACTOR (extract shared pagination helper if needed). Do not commit until all 4 ACs are GREEN and existing test_qual_001.py still passes.

## AGENT ASSIGNMENT

**Implementation agent:** `python-implement`
**Rationale:** Pure Python — HTTP client, pagination, dataclass conversion. Same domain as QUAL-001.

**Review agent:** `python-review`
**Rationale:** Same reviewer as original QUAL-001 for continuity.

## CODING STANDARDS

- `brain/docs/kanban/TASK-TEMPLATE.md (v5.0)`
- `brain/docs/TDD-METHODOLOGY.md`

## DEPENDENCIES

**Depends on:** QUAL-001 (code exists to modify)

**Blocks:** QUAL-008 (runtime benchmark needs real fetch), Sprint 7 E2E run

## NOTES

- The stub was intentional from the codex agent's first pass — the core dedup logic was implemented and tested with monkeypatched routes, and `fetch_all_routes` was left as a known integration point. This task only fills that gap.
- Import `_dict_to_route` from `scripts.curation.pipeline.sync.convex_fetch` — it already handles camelCase-to-snake_case conversion for Route fields including `searchEmbedding`.
