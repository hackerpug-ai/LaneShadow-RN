================================================================================
TASK: CONVEX-003 - Admin HTTP endpoints for route/enrichment ingestion
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

**Problem:** The Python seed pipeline has no authenticated endpoint to push curated routes and enrichments into Convex. Without ingest HTTP handlers, seed data cannot reach the curated_routes and curated_route_enrichments tables, which blocks the entire curation feed from functioning.

**Why it matters:** The curation feature depends on an external Python pipeline (PIPE-*) that discovers, scores, and enriches routes, then ships them to Convex. The HTTP surface is the single integration point between the pipeline and the Convex backend. It must be authenticated (deploy-key bearer), idempotent (upsert by routeId), and return a structured result so the pipeline can log per-batch outcomes.

**Current state:** convex/http.ts contains httpRouter() with existing routes for `/osm/importNodes`, `/osm/importWays`, and `/clerk-webhooks`. No curation routes exist. No internal upsert mutations exist for curation tables. CONVEX-002 has just registered the tables and CONVEX-008 has provisioned `CURATION_DEPLOY_KEY`.

**Desired state:** Two new HTTP endpoints under `/admin/curation/` accept POST with a `CuratedRoute[]` or `CuratedRouteEnrichment[]` body, authenticate via `Authorization: Bearer <CURATION_DEPLOY_KEY>`, dispatch to internal mutations that upsert by `routeId`, and return `{inserted, updated, skipped, errors}`. A new `convex/curationAdmin.ts` file exports the internal mutations.

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Happy-path routes ingest returns insert count
  GIVEN: a valid `Authorization: Bearer <CURATION_DEPLOY_KEY>` header and a JSON body `{routes: [validRoute1, validRoute2]}` where neither routeId exists in curated_routes
  WHEN: the client POSTs to `/admin/curation/routes`
  THEN: the response status is 200, the body is `{inserted: 2, updated: 0, skipped: 0, errors: []}`, and `ctx.db.query('curated_routes').withIndex(...).collect()` returns both documents

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/curationAdmin.test.ts
  TEST_FUNCTION: test_post_routes_happy_path_inserts

AC-2: Auth rejection on missing/wrong bearer
  GIVEN: a request with no `Authorization` header OR a header whose bearer token does not equal `process.env.CURATION_DEPLOY_KEY`
  WHEN: the client POSTs to `/admin/curation/routes` with an otherwise-valid body
  THEN: the response status is 401, the body is `{error: "unauthorized"}`, and no documents are written to curated_routes

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/curationAdmin.test.ts
  TEST_FUNCTION: test_post_routes_rejects_bad_bearer

AC-3: Validation error on malformed body
  GIVEN: a valid bearer header and a JSON body missing a required field (e.g., `routes: [{routeId: "x"}]` with no `name`, `source`, etc.)
  WHEN: the client POSTs to `/admin/curation/routes`
  THEN: the response status is 400 and the body is `{error: "invalid_body", detail: "<message identifying the offending field>"}`, and no documents are written

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/curationAdmin.test.ts
  TEST_FUNCTION: test_post_routes_rejects_malformed_body

AC-4: Idempotent upsert on repeat POST
  GIVEN: a first successful POST of `{routes: [routeA, routeB]}` has completed
  WHEN: the same client POSTs the identical body again with the same bearer
  THEN: the response status is 200 and the body is `{inserted: 0, updated: 2, skipped: 0, errors: []}`; the documents in curated_routes still have exactly 2 rows (no duplicates)

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/curationAdmin.test.ts
  TEST_FUNCTION: test_post_routes_idempotent_upsert

AC-5: Happy-path enrichments ingest upserts by routeId
  GIVEN: a valid bearer header and a JSON body `{enrichments: [validEnrichment1]}` where the routeId matches an existing row in curated_route_enrichments
  WHEN: the client POSTs to `/admin/curation/enrichments`
  THEN: the response status is 200, the body is `{inserted: 0, updated: 1, skipped: 0, errors: []}`, and the corresponding curated_route_enrichments document reflects the patched fields

  TDD_STATE: [ ] RED  [ ] VERIFY_RED  [ ] GREEN  [ ] VERIFY_GREEN  [ ] REFACTOR
  TEST_FILE: convex/__tests__/curationAdmin.test.ts
  TEST_FUNCTION: test_post_enrichments_happy_path_upserts

Quality Criteria:
- [ ] All tests pass (one test per AC minimum)
- [ ] Lint passes with zero errors
- [ ] Type check passes (`npx tsc -p convex/tsconfig.json --noEmit`)
- [ ] `npx convex dev --once` exits 0 after adding handlers
- [ ] No `filter()` usage — upsert lookups use `withIndex('by_routeId', ...)`
- [ ] RED evidence captured in task comments

--------------------------------------------------------------------------------
TEST CRITERIA (Boolean Verification)
--------------------------------------------------------------------------------

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | POST /admin/curation/routes with valid bearer + 2 new routes returns 200 `{inserted: 2, updated: 0, skipped: 0, errors: []}` | AC-1 | `npx vitest run convex/__tests__/curationAdmin.test.ts` | [ ] TRUE [ ] FALSE |
| 2 | POST /admin/curation/routes with missing Authorization header returns 401 `{error: "unauthorized"}` and writes zero documents | AC-2 | `npx vitest run convex/__tests__/curationAdmin.test.ts` | [ ] TRUE [ ] FALSE |
| 3 | POST /admin/curation/routes with a wrong bearer value returns 401 `{error: "unauthorized"}` | AC-2 | `npx vitest run convex/__tests__/curationAdmin.test.ts` | [ ] TRUE [ ] FALSE |
| 4 | POST /admin/curation/routes with a body missing a required field returns 400 `{error: "invalid_body", detail: ...}` | AC-3 | `npx vitest run convex/__tests__/curationAdmin.test.ts` | [ ] TRUE [ ] FALSE |
| 5 | Second POST of identical routes returns 200 `{inserted: 0, updated: 2, skipped: 0, errors: []}` and curated_routes still has 2 rows | AC-4 | `npx vitest run convex/__tests__/curationAdmin.test.ts` | [ ] TRUE [ ] FALSE |
| 6 | POST /admin/curation/enrichments with valid bearer and an existing routeId returns 200 `{inserted: 0, updated: 1, ...}` and patches the stored document | AC-5 | `npx vitest run convex/__tests__/curationAdmin.test.ts` | [ ] TRUE [ ] FALSE |
| 7 | HTTP handler returns 500 with `{error: "configuration_error"}` if `process.env.CURATION_DEPLOY_KEY` is unset | AC-2 (defensive) | `npx vitest run convex/__tests__/curationAdmin.test.ts` | [ ] TRUE [ ] FALSE |

TC-1: Happy-path routes ingest
  Statement: POST `/admin/curation/routes` with valid bearer and 2 new CuratedRoute objects returns 200 and inserts both rows
  Maps To: AC-1
  Verify: `npx vitest run convex/__tests__/curationAdmin.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-2: Unauthorized rejection
  Statement: POST `/admin/curation/routes` without a valid bearer returns 401 and writes nothing
  Maps To: AC-2
  Verify: `npx vitest run convex/__tests__/curationAdmin.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-3: Validation rejection
  Statement: POST `/admin/curation/routes` with a malformed body returns 400 with a diagnostic `detail` field
  Maps To: AC-3
  Verify: `npx vitest run convex/__tests__/curationAdmin.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-4: Idempotent upsert
  Statement: Repeated POSTs of the same routes produce no duplicates and increment only the `updated` counter after the first call
  Maps To: AC-4
  Verify: `npx vitest run convex/__tests__/curationAdmin.test.ts`
  Status: [ ] TRUE  [ ] FALSE

TC-5: Enrichments happy-path upsert
  Statement: POST `/admin/curation/enrichments` with an existing routeId patches the stored enrichment document and returns 200 with updated=1
  Maps To: AC-5
  Verify: `npx vitest run convex/__tests__/curationAdmin.test.ts`
  Status: [ ] TRUE  [ ] FALSE

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. convex/http.ts
   - Lines: 1-40
   - Focus: Existing `httpRouter()` + `http.route({ path, method, handler: httpAction(...) })` pattern, specifically the `/osm/importNodes` handler as a structural reference for JSON body + `ctx.runMutation(internal.x.y, args)` dispatch.

2. convex/schema.ts
   - Lines: The block added by CONVEX-002 registering `curated_routes`, `curated_route_enrichments`, and `route_feedback`
   - Focus: Confirm index names (`by_routeId`) that the upsert mutations must query via `withIndex`

3. models/curated-routes.ts
   - Lines: ALL
   - Focus: `curatedRouteValidator` shape — used to validate incoming HTTP body (or wrap in `v.object({routes: v.array(curatedRouteValidator)})` for the mutation args)

4. models/curated-route-enrichments.ts
   - Lines: ALL
   - Focus: `curatedRouteEnrichmentValidator` shape — used for enrichment ingest mutation args

5. brain/docs/CONVEX-RULES.md
   - Sections: HTTP actions, internal mutations, no filter(), validator-first
   - Focus: Correct separation of `httpAction` (runs fetch-style handler) vs `internalMutation` (does DB writes via `ctx.runMutation`)

6. brain/docs/CONVEX-TESTING.md
   - Sections: `convex-test` vitest harness
   - Focus: How to exercise HTTP routes via `t.fetch(...)` or by calling the internal mutation directly in tests

7. .spec/prds/curation/09-technical-requirements.md
   - Sections: S9-TRD-7 Convex Backend, S9-API Design
   - Focus: Response shape expectation `{inserted, updated, skipped, errors}` and auth model

--------------------------------------------------------------------------------
GUARDRAILS
--------------------------------------------------------------------------------

WRITE-ALLOWED (explicit file list):
- convex/http.ts
- convex/curationAdmin.ts (NEW)
- convex/__tests__/curationAdmin.test.ts (NEW)

WRITE-PROHIBITED:
- convex/schema.ts — frozen by CONVEX-002
- models/curated-routes.ts — frozen by CONVEX-001
- models/curated-route-enrichments.ts — frozen by CONVEX-001
- models/route-feedback.ts — out of scope (feedback ingest is a later task)
- Any file not explicitly listed above

MUST:
- [ ] Authenticate both endpoints via `Authorization: Bearer ${process.env.CURATION_DEPLOY_KEY}` (constant-time or simple string compare is acceptable for this use)
- [ ] Return 500 `{error: "configuration_error"}` if `process.env.CURATION_DEPLOY_KEY` is undefined
- [ ] Validate body shape via the committed validators OR wrap them in `v.object({routes: v.array(curatedRouteValidator)})` at the internal mutation boundary
- [ ] Upsert by `routeId` using `ctx.db.query('curated_routes').withIndex('by_routeId', q => q.eq('routeId', r.routeId)).first()` — NO `filter()`
- [ ] Put DB writes in internal mutations in `convex/curationAdmin.ts`; the `httpAction` handlers only parse, authenticate, and dispatch via `ctx.runMutation(internal.curationAdmin.X, ...)`
- [ ] Response shape is exactly `{inserted: number, updated: number, skipped: number, errors: Array<{routeId: string, message: string}>}`
- [ ] Unit tests exercise each AC with the convex-test harness

MUST NOT:
- [ ] Use `filter()` at query time for upsert lookups
- [ ] Put DB writes inside the `httpAction` handler directly — always go through an internal mutation
- [ ] Hard-code the deploy key
- [ ] Leak the bearer value into error responses or logs
- [ ] Accept arbitrary admin operations beyond the two documented endpoints
- [ ] Skip RED phase

--------------------------------------------------------------------------------
CODE PATTERN (Reference)
--------------------------------------------------------------------------------

Source: `convex/http.ts` lines 7-24 (existing `/osm/importNodes` handler) and CONVEX-RULES internal-mutation pattern.

```typescript
// convex/http.ts — add near existing osm routes
http.route({
  path: '/admin/curation/routes',
  method: 'POST',
  handler: httpAction(async (ctx, req) => {
    const deployKey = process.env.CURATION_DEPLOY_KEY
    if (!deployKey) {
      return new Response(JSON.stringify({ error: 'configuration_error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('authorization') ?? ''
    const expected = `Bearer ${deployKey}`
    if (authHeader !== expected) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let parsed: { routes: unknown }
    try {
      parsed = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'invalid_body', detail: 'not json' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    try {
      const result = await ctx.runMutation(
        internal.curationAdmin.internalUpsertCuratedRoutes,
        { routes: (parsed as any).routes }
      )
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    } catch (err: any) {
      return new Response(
        JSON.stringify({ error: 'invalid_body', detail: err?.message ?? 'validation failed' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }
  }),
})
```

```typescript
// convex/curationAdmin.ts (NEW)
import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { curatedRouteValidator } from '../models/curated-routes'
import { curatedRouteEnrichmentValidator } from '../models/curated-route-enrichments'

export const internalUpsertCuratedRoutes = internalMutation({
  args: { routes: v.array(curatedRouteValidator) },
  handler: async (ctx, { routes }) => {
    let inserted = 0, updated = 0, skipped = 0
    const errors: Array<{ routeId: string; message: string }> = []
    for (const r of routes) {
      try {
        const existing = await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', q => q.eq('routeId', r.routeId))
          .first()
        if (existing) {
          await ctx.db.patch(existing._id, r)
          updated++
        } else {
          await ctx.db.insert('curated_routes', r)
          inserted++
        }
      } catch (e: any) {
        errors.push({ routeId: (r as any)?.routeId ?? '<unknown>', message: e?.message ?? 'unknown' })
        skipped++
      }
    }
    return { inserted, updated, skipped, errors }
  },
})

export const internalUpsertCuratedRouteEnrichments = internalMutation({
  args: { enrichments: v.array(curatedRouteEnrichmentValidator) },
  handler: async (ctx, { enrichments }) => {
    // same upsert pattern, table: curated_route_enrichments, index: by_routeId
  },
})
```

NOTE: `curated_routes` does not have a `by_routeId` index in CONVEX-002's minimal set. Either (a) add a `by_routeId` index in this task's schema edit — but schema.ts is WRITE-PROHIBITED — OR (b) open a follow-up to CONVEX-002 to add it before CONVEX-003 starts. Reviewer should flag this during task readiness check. See NOTES.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

AGENT: convex-implementer

## FOR EACH ACCEPTANCE CRITERION (AC-1..AC-5):

### RED PHASE
  READ: Current AC, convex/http.ts pattern, brain/docs/CONVEX-TESTING.md
  WRITE: ONE test in convex/__tests__/curationAdmin.test.ts exercising the AC via convex-test harness
  RUN: npx vitest run convex/__tests__/curationAdmin.test.ts --reporter=verbose
  VERIFY: Test FAILS (handler does not exist / returns wrong shape / wrong status)
  RETURN: { phase: "RED", test_file, test_function, failure_output }

  MUST: Show actual failure output
  MUST NOT: Add handler or internal mutation code yet

### GREEN PHASE (after orchestrator VERIFY_RED passes)
  READ: Failing test, http.ts pattern, curationAdmin.ts (if partial)
  WRITE: Minimal handler + internal mutation code to satisfy the current AC
  RUN: npx vitest run convex/__tests__/curationAdmin.test.ts --reporter=verbose
  VERIFY: The current AC's test PASSES; prior ACs still pass
  RETURN: { phase: "GREEN", files_changed, test_output }

  MUST: Only implement the behavior required by the current AC
  MUST NOT: Pre-implement feedback endpoints, admin operations beyond scope, or extra indexes

### REFACTOR PHASE (after orchestrator VERIFY_GREEN passes)
  READ: Current http.ts + curationAdmin.ts state
  WRITE: Extract shared auth helper / shared upsert helper if duplication warrants
  RUN: npx vitest run convex/__tests__/ --reporter=verbose && npx convex dev --once
  VERIFY: All tests still pass and schema push clean
  RETURN: { phase: "REFACTOR", files_changed, still_passing }

## AFTER ALL ACs COMPLETE:
  Orchestrator dispatches convex-reviewer

--------------------------------------------------------------------------------
ORCHESTRATOR VERIFICATION PROTOCOL
--------------------------------------------------------------------------------

AFTER RED PHASE (each AC):
  RUN: npx vitest run convex/__tests__/curationAdmin.test.ts --reporter=verbose
  EXPECT: Exit code != 0, failure attributable to new test
  IF PASS: Reject "Vanity test — endpoint already behaves correctly without implementation"
  IF ERROR: Reject "Test has syntax/import error, not a valid failure"

AFTER GREEN PHASE (each AC):
  RUN: npx vitest run convex/__tests__/curationAdmin.test.ts --reporter=verbose
  EXPECT: Exit code 0, current + prior AC tests pass
  IF FAIL: Return to agent with failure output

AFTER REFACTOR PHASE:
  RUN: npx vitest run convex/__tests__/ --reporter=verbose
  EXPECT: Exit 0
  RUN: npx convex dev --once
  EXPECT: Exit 0
  RUN: grep -nE 'filter\(' convex/curationAdmin.ts convex/http.ts
  EXPECT: No matches in curation code paths

--------------------------------------------------------------------------------
AGENT ASSIGNMENT
--------------------------------------------------------------------------------

**Implementation Agent**: convex-implementer
**Rationale**: Task creates Convex HTTP actions and internal mutations using the project's httpRouter pattern. convex-implementer knows httpAction vs internalMutation separation, the validator-first argument style, and the `withIndex` upsert idiom.

**Review Agent**: convex-reviewer
**Rationale**: Review must verify no `filter()` usage, correct separation of HTTP vs mutation layers, correct auth handling, and response-shape contract compliance with the Python pipeline's expectations.

**Assignment Date**: 2026-04-11

**Agent Pairing**: Standard implementer-reviewer pairing per brain/docs/kanban/agent-assignment.md

**Assignment Logic**:
- Task Type: FEATURE (DEV)
- File Patterns: convex/http.ts, convex/curationAdmin.ts, convex/__tests__/*.ts
- Implementation: convex-implementer
- Review: convex-reviewer

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: All Tests Pass
  Command: npx vitest run convex/__tests__/curationAdmin.test.ts --reporter=verbose
  Expected: Exit 0, 5+ tests (one per AC minimum)

Gate 2: Each AC Has Test
  Verify: curationAdmin.test.ts contains tests mapped to AC-1 through AC-5

Gate 3: RED Phase Evidence
  Required: Task comments show each test failed before implementation landed

Gate 4: Schema Push Clean
  Command: npx convex dev --once
  Expected: Exit 0

Gate 5: Type Check
  Command: npx tsc -p convex/tsconfig.json --noEmit
  Expected: Exit 0

Gate 6: Lint
  Command: npx eslint convex/http.ts convex/curationAdmin.ts convex/__tests__/curationAdmin.test.ts
  Expected: Exit 0

Gate 7: No filter() Usage
  Command: grep -nE 'filter\(' convex/curationAdmin.ts convex/http.ts
  Expected: No matches inside curation handlers (existing osm routes are out of scope)

Gate 8: Scope Compliance
  Command: git diff --name-only main...HEAD
  Expected: Only convex/http.ts, convex/curationAdmin.ts, convex/__tests__/curationAdmin.test.ts (plus convex/_generated/** regenerated)

Gate 9: Secret Not Leaked
  Command: git grep -nE 'CURATION_DEPLOY_KEY=[0-9a-f]'
  Expected: No matches

--------------------------------------------------------------------------------
REVIEW CRITERIA (for convex-reviewer)
--------------------------------------------------------------------------------

TDD Quality:
- [ ] One test per AC-1..AC-5 mapped explicitly
- [ ] Tests exercise behavior through convex-test harness (status + body + DB state), not internal implementation
- [ ] RED evidence captured before GREEN
- [ ] Minimal implementation — no unrelated admin operations added

Code Quality:
- [ ] `httpAction` handlers contain only parsing, auth, and dispatch; all DB writes in `internalMutation` in curationAdmin.ts
- [ ] Upsert lookups use `withIndex('by_routeId', ...)` — no `filter()`
- [ ] Response shape is exactly `{inserted, updated, skipped, errors}`
- [ ] Error paths set correct HTTP status (401/400/500)

Domain-Specific:
- [ ] Endpoints paths: `/admin/curation/routes`, `/admin/curation/enrichments`
- [ ] Auth header: `Authorization: Bearer ${CURATION_DEPLOY_KEY}`
- [ ] Missing env var returns 500 `configuration_error`
- [ ] Idempotent upsert by `routeId` — second POST produces zero inserts
- [ ] Enrichment handler patches existing rows by matching `routeId`
- [ ] Reviewer confirms canonical variable name with CONVEX-008 (deploy_key vs ingest_key)
- [ ] Reviewer confirms `by_routeId` index exists on `curated_routes` — if not, task is NOT READY; escalate to CONVEX-002 amendment

Security:
- [ ] Bearer comparison is simple string equality against env var (acceptable here)
- [ ] The deploy key is never echoed in any response body or log
- [ ] No credential exposure in error messages
- [ ] Body parse errors do not reveal internal stack traces

Review Verdict: [ ] APPROVED   [ ] NEEDS_FIXES

Feedback (required if NEEDS_FIXES):
```
[Reviewer documents specific, actionable issues here]
```

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends On:
- CONVEX-002 — curation tables must exist in the schema
- CONVEX-008 — `CURATION_DEPLOY_KEY` must be provisioned in the Convex deployment

Blocks:
- PIPE-* — Python pipeline ingest tasks consume these endpoints
- Any later curation feed query tasks that assume seed data is present

--------------------------------------------------------------------------------
TASK READINESS
--------------------------------------------------------------------------------

Prerequisites:
- [ ] CONVEX-002 merged to main (curation tables registered)
- [ ] CONVEX-008 merged / env var verified via `npx convex env list`
- [ ] `curated_routes` has a `by_routeId` index (see NOTES — may require CONVEX-002 amendment)
- [ ] `curated_route_enrichments.by_routeId` index exists (already in CONVEX-002 scope)

Can Execute In Parallel With: PIPE-001 (as long as PIPE-001 does not require live ingest)

--------------------------------------------------------------------------------
NOTES
--------------------------------------------------------------------------------

- **Endpoint path reconciliation**: This task uses `/admin/curation/routes` and `/admin/curation/enrichments` per the user task spec. The PRD S9 API Design section references `/api/ingest-routes` as a variant, and `.spec/prds/curation/convex-api-design.md` uses `/api/curation/ingest`. All three exist in project documentation. The `/admin/` prefix was chosen because it communicates the admin-only, deploy-key-authenticated nature of the surface, distinct from user-facing `/api/*` routes. Reviewer should confirm this choice or flag a documentation follow-up to unify the naming.
- **Auth header reconciliation**: This task uses the standard `Authorization: Bearer <token>` header per the user task spec. `convex-api-design.md` proposes a custom `x-curation-ingest-key` header. Standard Bearer semantics are preferred here for clarity, tooling compatibility, and so the Python pipeline can use any HTTP client without custom header configuration. Same reviewer follow-up applies.
- **Variable-name reconciliation**: CONVEX-008 canonicalises `CURATION_DEPLOY_KEY`; `convex-api-design.md` uses `CURATION_INGEST_KEY`. This task follows CONVEX-008. If a later decision prefers `INGEST_KEY`, a single follow-up task should rename across CONVEX-008, CONVEX-003, Python pipeline, and design docs.
- **`by_routeId` index on curated_routes**: CONVEX-002's minimal index set does NOT include `by_routeId` on `curated_routes`. The upsert logic in this task REQUIRES such an index to avoid `filter()` scans. The implementing agent MUST verify this index exists before starting AC-1. If it does not, STOP and open a CONVEX-002 amendment to add `by_routeId` on ["routeId"] before proceeding — do not add the index from this task's scope (schema.ts is WRITE-PROHIBITED here).
- Feedback ingest (route_feedback) is intentionally NOT in this task's scope; it is a future user-facing endpoint with different auth (Clerk user, not deploy key).
- The `skipped` counter in the response is present to future-proof the protocol for cases like dry-run mode or partial batch failures, even if it is always 0 in this iteration.

--------------------------------------------------------------------------------
APPROVAL
--------------------------------------------------------------------------------

Approved By: [pending]
Date: [pending]

================================================================================