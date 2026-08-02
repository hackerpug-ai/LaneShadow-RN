# REDHAT-FIX-02 — Bounded/paginated whole-catalog classifyCatalog enumeration with durable checkpointing and completion coverage (UC-VER-03)
> Status: ⬜ Pending

| Field | Value |
|-------|-------|
| TASK_ID | REDHAT-FIX-02 |
| SPRINT | [Sprint 04 — Trust pipeline](./SPRINT.md) |
| TASK_TYPE | FEATURE |
| AGENT | implementer=`convex-implementer` · reviewer=`convex-reviewer` |
| ESTIMATE | 120 min |
| EFFORT | M |
| PRIORITY | P0 |
| STATUS | Backlog |
| PROPOSED_BY | `convex-planner` |
| TDD_MODE | `red_first` |
| RED_GREEN_REQUIRED | yes |
| CAPABILITIES | CAP-GEO-03 |
| DEPENDS_ON | — |
| BLOCKS | REDHAT-FIX-01 |

RUNTIME_COMMANDS:
- test: `npx vitest run convex/__tests__/REDHATFIX02-*.integration.test.ts`
- typecheck: `npx tsc --noEmit -p convex/tsconfig.json`
- lint: `pnpm exec biome check`

> **Command note:** `pnpm test` maps to bare `vitest` (watch mode) and HANGS in an agent shell — always use `npx vitest run`. vitest has no `--grep`; the single-test filter is `-t '<name>'`.

## OUTCOME

Whole-catalog classification with no `routeIds` visits every catalog route exactly once across bounded, indexed pages, stores a rideWorthiness verdict per route, and leaves a durable `classifier_runs` checkpoint whose `classifiedCount+failedCount` equals `totalRoutes` on completion — resumable after interruption.

## ⚠️ RE-VERIFICATION: STILL UNRESOLVED (fresh red-hat review, 2026-07-20T18:51:10Z; re-checked against HEAD `b2499228`)

This task's OUTCOME above (durable `classifier_runs` checkpoint) has **not** been delivered. No `classifier_runs` table, `runId`, or cursor field exists anywhere in `convex/schema.ts`, `convex/actions/rideWorthinessClassifier.ts`, or `convex/curatedGeometry.ts`. `classifyCatalog` starts `cursor = null` on every invocation (`rideWorthinessClassifier.ts:356`) and iterates every page inside a single action via a `while (!isDone)` loop (`:359-389`), so an interrupted run has zero durable progress, restarts from the beginning, and cannot prove complete coverage. No `REDHATFIX02-*.integration.test.ts` files exist.

**Additional required AC (regression proof against current source):**

### AC-R1 [Regression] — Catalog classification persists a durable, resumable checkpoint

**Requirement:** GIVEN ~120 eligible unclassified routes and a bounded page size WHEN the catalog classification entrypoint runs one page THEN a durable `classifier_runs` row exists with a non-null persisted cursor and a status that is not yet `'complete'`; WHEN the run is later resumed THEN it continues from the persisted cursor without re-classifying already-covered routes.

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classify entrypoint + `classifier_runs` store + scheduler)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-run-checkpoint.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: no `classifier_runs` row is written (unchanged single-action loop, `rideWorthinessClassifier.ts:359-389`); the cursor is always null (a stub); the action classifies the whole catalog in one pass with no scheduled continuation; resume restarts at `cursor=null` and re-classifies covered routes
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — seed 120 unclassified routes; invoke the classify entrypoint for one bounded page; query `classifier_runs`; capture a page-1 route's `classifiedAt`; resume the run to completion; re-query that route's `classifiedAt`
  - MUST_OBSERVE: `classifier_runs` row exists with non-null cursor and status != 'complete' after the first page; the page-1 route's `classifiedAt` is unchanged after resume; `classifier_runs.classified == 120` and `remainingUnclassified == 0` at final completion
  - MUST_NOT_OBSERVE: no `classifier_runs` row after the first page; the page-1 route re-classified (its `classifiedAt` changed) on resume; the run reports `complete` while `remainingUnclassified > 0`

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

**MUST**
- MUST read convex/_generated/ai/guidelines.md before implementation
- MUST enumerate every `curated_routes` row via an indexed paginated query (`db.query(...).paginate`) — never a single unbounded `.collect()` over the whole table
- MUST persist a durable checkpoint row (cursor + coverage totals) between action invocations so an interrupted run resumes without reclassifying completed routes
- MUST report `classifiedCount` + `failedCount` + `totalRoutes` so completion coverage over the whole catalog is observable evidence

**NEVER**
- NEVER return `{classified:0,failed:0,results:[]}` as a silent no-op when `routeIds` is omitted (the current line-264 behavior)
- NEVER require the caller to pass every routeId to achieve whole-catalog coverage
- NEVER load the entire catalog into one query result or one action invocation
- NEVER classify a route twice across a resumed run

**STRICTLY**
- STRICTLY additive schema change only — add a new `classifier_runs` checkpoint table; do not mutate existing table shapes non-additively
- STRICTLY page continuation is server-driven (`scheduler.runAfter` of an internalAction), not caller-driven

## DONE WHEN

- AC-1 [Whole-catalog classification with no routeIds achieves complete coverage] [PRIMARY]: Every route in a 5-route, 3-page catalog ends with a stored verdict and `classifiedCount+failedCount == totalRoutes == 5`
- AC-2 [Durable checkpoint resumes from cursor without reclassifying]: Resuming from a page-1 checkpoint classifies only the remaining routes without re-touching already-classified ones
- AC-3 [Per-invocation pagination is bounded]: A single `classifyCatalogPage` invocation processes at most `pageSize` routes and schedules a continuation
- AC-4 [classifyCatalog no longer silently no-ops on empty routeIds]: Calling with no `routeIds` creates a real `classifier_runs` row reflecting the catalog size
- Every behavioral AC scenario passes `validate_scenario` (exit 0); RED-against-start recorded before GREEN; seeded-value EVIDENCE artifact captured
- `npx tsc --noEmit -p convex/tsconfig.json` → 0 errors + `pnpm exec biome check` clean + `pnpm convex:dev --once` clean
- NO-REGRESSION: `pnpm type-check` reports zero new errors vs. a baseline captured at task start
- Only SCOPE.writeAllowed files modified (`git diff --name-only`)

## SPECIFICATION

**Objective:** Replace the caller-ID-dependent silent no-op in `classifyCatalog` with a server-driven, bounded, indexed-paginated enumeration of the entire `curated_routes` catalog that durably checkpoints its cursor and coverage totals and is resumable after interruption.

**Success state:** Calling whole-catalog classification with no `routeIds` visits every catalog route exactly once across bounded pages, stores a rideWorthiness verdict per route, and leaves a durable `classifier_runs` row whose `classifiedCount+failedCount` equals `totalRoutes` on completion.

## FIXTURES (shared seed data — referenced by scenario `start_ref`)

- `multi-page-catalog` (seed_method: `public_api`): 5 curated_routes seeded with no rideWorthiness verdict, so a small pageSize (2) forces 3 pages and pagination/continuation is exercised end-to-end
    - routeId: `test:catalog-cov-1`..`test:catalog-cov-5`, rideWorthiness undefined — seeded via new helper `seedUnclassifiedCatalogRoutes` in `convex/curatedGeometryTestSupport.ts`
- `catalog-classifier-cassette` (seed_method: `recorded_external`): z.ai GLM-5.2 classifier request/response pairs recorded ONCE from the real provider for the 5 seeded routes, replayed byte-exact so enumeration/coverage is deterministic without mocking the LLM (mirrors S4-T1 AC-5)
    - cassette: `convex/__tests__/fixtures/REDHATFIX02-catalog-classifier.cassette.json`
- `partial-run-checkpoint` (seed_method: `public_api`): A `classifier_runs` row left after page 1 completed (cursor past the first 2 routes, classifiedCount=2)
    - `classifier_runs` doc: `{ runId, status:'running', cursor: <after page 1>, pageSize:2, totalRoutes:5, classifiedCount:2, failedCount:0 }` — new helper `seedClassifierCheckpoint`

## ACCEPTANCE CRITERIA (TDD beads — RED → GREEN → REFACTOR per AC)

### AC-1 [PRIMARY] — Whole-catalog classification with no routeIds achieves complete coverage

**Requirement:** GIVEN a catalog of 5 unclassified curated_routes spanning >1 page (pageSize=2) and a caller that passes NO routeIds WHEN whole-catalog classification is started and run to completion via server-driven page continuation THEN every one of the 5 routes has a stored rideWorthiness verdict and the final classifier_runs row reports classifiedCount+failedCount == totalRoutes == 5 with status 'complete'

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment + z.ai GLM-5.2 (recorded cassette)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-whole-catalog-coverage.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: `classifyCatalog` returns a stub `{classified:0,failed:0}` for omitted routeIds; only the first page is classified and routes 3-5 keep an undefined rideWorthiness; the LLM boundary is mocked instead of replayed from the recorded cassette
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `multi-page-catalog`
  - ACTION: Seed 5 unclassified catalog routes; start whole-catalog classification with NO routeIds (pageSize=2, cassette replay enabled); drive all scheduled continuation pages to completion; query every seeded route's rideWorthiness and the classifier_runs row
  - MUST_OBSERVE: `classifier_runs.totalRoutes == 5`; `classifier_runs.classifiedCount + classifier_runs.failedCount == 5`; `classifier_runs.status == 'complete'`
  - MUST_NOT_OBSERVE: any of the 5 routes with rideWorthiness undefined after completion (empty); `classifier_runs.classifiedCount == 0`

### AC-2 — Durable checkpoint resumes from cursor without reclassifying

**Requirement:** GIVEN a classifier_runs checkpoint whose cursor is past page 1 (routes 1-2 already classified, classifiedCount=2) WHEN classification resumes for the same runId THEN it continues from the stored cursor, classifies only routes 3-5, and finishes with classifiedCount+failedCount==5 while routes 1-2 are not classified a second time

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real classifier_runs cursor)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-checkpoint-resume.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: resume restarts enumeration from the beginning (a stub cursor) and re-classifies routes 1-2; the cursor is not persisted (empty) and resume double-counts
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `partial-run-checkpoint`
  - ACTION: Seed multi-page-catalog and a partial-run-checkpoint after page 1; capture the classifiedAt timestamps of routes 1-2 before resume; resume classification for the checkpoint runId to completion; re-query routes 1-2 classifiedAt and the final checkpoint totals
  - MUST_OBSERVE: classifiedAt(route1) after resume == classifiedAt(route1) before resume; final classifier_runs.classifiedCount + failedCount == 5
  - MUST_NOT_OBSERVE: classifiedCount+failedCount != 5 (partial coverage); route1 classifiedAt reset to empty/null on resume

### AC-3 — Per-invocation pagination is bounded

**Requirement:** GIVEN a catalog larger than one page (5 routes, pageSize=2) WHEN a single classifyCatalogPage invocation runs THEN it processes at most pageSize (2) routes, sets a continuation cursor, and schedules the next page rather than draining the whole catalog in one invocation

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment (real paginate boundary)
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-page-bounded.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: a single invocation classifies all 5 routes via an unbounded/mocked full-collect scan; no continuation cursor is written (empty) after the first page
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `multi-page-catalog`
  - ACTION: Seed 5 unclassified routes (pageSize=2); invoke exactly ONE classifyCatalogPage for a fresh runId; inspect the checkpoint after the single page
  - MUST_OBSERVE: classified count after one page == 2; classifier_runs.isDone == false
  - MUST_NOT_OBSERVE: classified count after one page == 5; classifier_runs.cursor is empty while routes remain

### AC-4 — classifyCatalog no longer silently no-ops on empty routeIds

**Requirement:** GIVEN classifyCatalog invoked with no routeIds (omitted or empty array) WHEN the action runs THEN it initiates whole-catalog enumeration and returns a runId/coverage plan reflecting the real catalog size — never {classified:0,failed:0,results:[]} with zero work

- TEST_TIER: `integration` · VERIFICATION_SERVICE: Convex dev deployment
- FLOW_REF: UC-VER-03
- VERIFY: `npx vitest run convex/__tests__/REDHATFIX02-no-silent-noop.integration.test.ts`

SCENARIO (validated by `tools/validate-scenario/validate_scenario.py` — exit 0):
- NEGATIVE_CONTROL — would fail if: classifyCatalog with no routeIds returns a static stub {classified:0,failed:0,results:[]}; no classifier_runs row is created (absent)
- EVIDENCE: `db_query` (required_capture: true)
- CASE 1 — start_ref `multi-page-catalog`
  - ACTION: Seed 5 unclassified routes; call whole-catalog classification with NO routeIds argument; inspect the returned runId and the created classifier_runs row
  - MUST_OBSERVE: classifier_runs.totalRoutes == 5
  - MUST_NOT_OBSERVE: totalRoutes == 0 while the catalog holds 5 rows; no classifier_runs row created (absent)

## TEST CRITERIA

| TC | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Whole-catalog classification with no routeIds stores a verdict on all 5 seeded routes | AC-1 | `npx vitest run convex/__tests__/REDHATFIX02-whole-catalog-coverage.integration.test.ts -t 'TC-1'` |
| TC-2 | classifier_runs classifiedCount plus failedCount equals totalRoutes on completion | AC-1 | `npx vitest run convex/__tests__/REDHATFIX02-whole-catalog-coverage.integration.test.ts -t 'TC-2'` |
| TC-3 | Resume from a page-1 checkpoint leaves routes 1-2 classifiedAt unchanged | AC-2 | `npx vitest run convex/__tests__/REDHATFIX02-checkpoint-resume.integration.test.ts -t 'TC-3'` |
| TC-4 | Resume produces final classifiedCount plus failedCount equal to 5 with no double count | AC-2 | `npx vitest run convex/__tests__/REDHATFIX02-checkpoint-resume.integration.test.ts -t 'TC-4'` |
| TC-5 | A single classifyCatalogPage invocation classifies at most pageSize (2) routes | AC-3 | `npx vitest run convex/__tests__/REDHATFIX02-page-bounded.integration.test.ts -t 'TC-5'` |
| TC-6 | classifyCatalog with no routeIds creates a classifier_runs row with totalRoutes equal to 5 | AC-4 | `npx vitest run convex/__tests__/REDHATFIX02-no-silent-noop.integration.test.ts -t 'TC-6'` |

## SCOPE (file-level write permissions)

**writeAllowed:**
- convex/actions/rideWorthinessClassifier.ts (MODIFY) — replace silent no-op with paginated enumeration + coverage return
- convex/classifierCheckpoint.ts (NEW) — classifier_runs checkpoint queries/mutations + page driver internalAction
- convex/schema.ts (MODIFY, ADDITIVE ONLY) — add classifier_runs table with by_runId and by_status indexes
- convex/curatedGeometryTestSupport.ts (MODIFY) — add seedUnclassifiedCatalogRoutes + seedClassifierCheckpoint helpers
- convex/__tests__/REDHATFIX02-*.integration.test.ts (NEW)
- convex/__tests__/fixtures/REDHATFIX02-catalog-classifier.cassette.json (NEW) — recorded ONCE from z.ai GLM-5.2

**writeProhibited:**
- Non-additive edits to existing schema tables
- Editing the z.ai cassette values by hand — re-record by deleting the file
- Adding a filter()-based full scan instead of an indexed paginate
- Touching couchVerdict.ts / couchSampleAssembler.ts — owned by REDHAT-FIX-03/10
- Removing classifyCatalogInternal (it is the internal enumeration seam)

## READING LIST

- `convex/actions/rideWorthinessClassifier.ts` (255-302) — classifyCatalog silent no-op (`ids ?? []` then early return) and classifyCatalogInternal — the enumeration seam to build on
- `convex/actions/rideWorthinessClassifier.ts` (41-60) — ClassifyRouteResult / ClassifyCatalogResult return types to extend with coverage totals + runId
- `convex/schema.ts` (187-208) — curated_routes indexes available for a stable paginated enumeration
- `convex/curatedGeometryHygiene.ts` (1-40) — existing paginate + checkpoint sweep pattern in this codebase to mirror
- `convex/curatedGeometry.ts` (1-40) — scheduler.runAfter continuation pattern already used for catalog sweeps
- `brain/docs/CONVEX-RULES.md` (1-60) — no-filter/withIndex + paginate rules; internalAction for pipeline jobs

## CODE PATTERN

- Pattern: Server-driven bounded pagination — an operator/public entry creates a classifier_runs checkpoint (totalRoutes computed), then an internalAction classifies one bounded page via `db.query(...).paginate`, updates the checkpoint cursor + coverage counters, and `scheduler.runAfter` continues until `isDone`
- Pattern source: `convex/curatedGeometryHygiene.ts` (paginate + checkpoint sweep) and `convex/curatedGeometry.ts` (scheduler continuation)
- Anti-pattern: `ids = routeIds ?? []; if (ids.length===0) return {classified:0,failed:0,results:[]}` — caller-ID-dependent silent no-op with no enumeration/coverage (`rideWorthinessClassifier.ts:263-266`)

## VERIFICATION GATES

- test: `npx vitest run convex/__tests__/REDHATFIX02-*.integration.test.ts` → Exit 0
- typecheck (in-scope): `npx tsc --noEmit -p convex/tsconfig.json` → Exit 0
- typecheck (no-regression): `pnpm type-check 2>&1 | grep -c 'error TS'` → no greater than baseline
- lint: `pnpm exec biome check` → Exit 0
- convex build: `pnpm convex:dev --once` → Exit 0
- scenario validator → Exit 0, zero CRITICAL/HIGH:

```bash
python3 -c "import re,sys;print(re.search(r'<!-- REQUIREMENT-CONTRACT v1 -->\n<!--\n(.*?)\n-->',open(sys.argv[1]).read(),re.S).group(1))" \
  .spec/prds/route-agent-quality/tasks/sprint-04-trust-pipeline/REDHAT-FIX-02-*.md \
  | python3 ~/Projects/brain/tools/validate-scenario/validate_scenario.py; echo "EXIT:$?"
```

## AGENT ASSIGNMENT

- Agent: `convex-implementer` — Convex backend implementation; paginated action + additive checkpoint table
- Reviewer: `convex-reviewer`

## EVIDENCE GATES

- RED phase: each behavioral AC's test went red before green
- Integration coverage: PRIMARY AC is `integration` against the real Convex dev deployment + a recorded z.ai cassette
- Scenario un-fakeable: `validate_scenario` exit 0 on every behavioral AC; captured EVIDENCE shows the seeded MUST_OBSERVE value

## DEPENDENCIES

- Depends on: —
- Blocks: REDHAT-FIX-01

## CODING STANDARDS

- convex/_generated/ai/guidelines.md
- brain/docs/TESTING-HIERARCHY.md
- brain/docs/CODING-STANDARDS.md
- brain/docs/CONVEX-RULES.md

<details>
<summary>▸ Full agent specification (TASK-TEMPLATE v5.2 — machine-readable requirement contract)</summary>

<!-- REQUIREMENT-CONTRACT v1
-->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-02",
  "tdd_mode": "red_first",
  "verification_policy": { "requires_tests": true, "requires_red_evidence": true, "requires_seeded_evidence": true },
  "fixtures": {
    "multi-page-catalog": { "description": "5 curated_routes seeded with no rideWorthiness verdict, small pageSize forces 3 pages.", "seed_method": "public_api", "records": ["routeId: 'test:catalog-cov-1'..'test:catalog-cov-5', rideWorthiness undefined"] },
    "catalog-classifier-cassette": { "description": "z.ai GLM-5.2 classifier request/response pairs recorded once, replayed byte-exact.", "seed_method": "recorded_external", "records": ["cassette: convex/__tests__/fixtures/REDHATFIX02-catalog-classifier.cassette.json"] },
    "partial-run-checkpoint": { "description": "classifier_runs row left after page 1 completed.", "seed_method": "public_api", "records": ["classifier_runs doc: cursor after page 1, classifiedCount=2, totalRoutes=5"] }
  },
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "primary": true, "description": "Whole-catalog classification with no routeIds achieves complete coverage", "verify": "npx vitest run convex/__tests__/REDHATFIX02-whole-catalog-coverage.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment + z.ai GLM-5.2 (recorded cassette)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["classifyCatalog returns a stub {classified:0,failed:0} for omitted routeIds", "only the first page is classified and routes 3-5 keep an undefined rideWorthiness", "the LLM boundary is mocked instead of replayed from the recorded cassette"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "multi-page-catalog", "action": { "actor": "api_client", "steps": ["Seed 5 unclassified catalog routes", "Start whole-catalog classification with NO routeIds", "Drive all scheduled continuation pages to completion", "Query every seeded route's rideWorthiness and the classifier_runs row"] },
          "end_state": { "must_observe": ["classifier_runs.totalRoutes == 5", "classifier_runs.classifiedCount + classifier_runs.failedCount == 5", "classifier_runs.status == 'complete'"], "must_not_observe": ["any of the 5 routes with rideWorthiness undefined after completion (empty)", "classifier_runs.classifiedCount == 0"] } } ] } },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Durable checkpoint resumes from cursor without reclassifying", "verify": "npx vitest run convex/__tests__/REDHATFIX02-checkpoint-resume.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classifier_runs cursor)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["resume restarts enumeration from the beginning (a stub cursor) and re-classifies routes 1-2", "the cursor is not persisted (empty) and resume double-counts"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "partial-run-checkpoint", "action": { "actor": "api_client", "steps": ["Seed multi-page-catalog and a partial-run-checkpoint after page 1", "Capture the classifiedAt timestamps of routes 1-2 before resume", "Resume classification for the checkpoint runId to completion", "Re-query routes 1-2 classifiedAt and the final checkpoint totals"] },
          "end_state": { "must_observe": ["classifiedAt(route1) after resume == classifiedAt(route1) before resume", "final classifier_runs.classifiedCount + failedCount == 5"], "must_not_observe": ["classifiedCount+failedCount != 5 (partial coverage)", "route1 classifiedAt reset to empty/null on resume"] } } ] } },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Per-invocation pagination is bounded", "verify": "npx vitest run convex/__tests__/REDHATFIX02-page-bounded.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real paginate boundary)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["a single invocation classifies all 5 routes via an unbounded/mocked full-collect scan", "no continuation cursor is written (empty) after the first page"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "multi-page-catalog", "action": { "actor": "api_client", "steps": ["Seed 5 unclassified routes (pageSize=2)", "Invoke exactly ONE classifyCatalogPage for a fresh runId", "Inspect the checkpoint after the single page"] },
          "end_state": { "must_observe": ["classified count after one page == 2", "classifier_runs.isDone == false"], "must_not_observe": ["classified count after one page == 5", "classifier_runs.cursor is empty while routes remain"] } } ] } },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "classifyCatalog no longer silently no-ops on empty routeIds", "verify": "npx vitest run convex/__tests__/REDHATFIX02-no-silent-noop.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment", "topology": "single-node",
        "negative_control": { "would_fail_if": ["classifyCatalog with no routeIds returns a static stub {classified:0,failed:0,results:[]}", "no classifier_runs row is created (absent)"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "multi-page-catalog", "action": { "actor": "api_client", "steps": ["Seed 5 unclassified routes", "Call whole-catalog classification with NO routeIds argument", "Inspect the returned runId and the created classifier_runs row"] },
          "end_state": { "must_observe": ["classifier_runs.totalRoutes == 5"], "must_not_observe": ["totalRoutes == 0 while the catalog holds 5 rows", "no classifier_runs row created (absent)"] } } ] } },
    { "id": "TC-1", "type": "test_criterion", "description": "Whole-catalog classification stores a verdict on all 5 seeded routes", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX02-whole-catalog-coverage.integration.test.ts -t 'TC-1'" },
    { "id": "TC-2", "type": "test_criterion", "description": "classifiedCount+failedCount==totalRoutes on completion", "maps_to_ac": "AC-1", "verify": "npx vitest run convex/__tests__/REDHATFIX02-whole-catalog-coverage.integration.test.ts -t 'TC-2'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Resume leaves routes 1-2 classifiedAt unchanged", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX02-checkpoint-resume.integration.test.ts -t 'TC-3'" },
    { "id": "TC-4", "type": "test_criterion", "description": "Resume final classifiedCount+failedCount==5 with no double count", "maps_to_ac": "AC-2", "verify": "npx vitest run convex/__tests__/REDHATFIX02-checkpoint-resume.integration.test.ts -t 'TC-4'" },
    { "id": "TC-5", "type": "test_criterion", "description": "Single classifyCatalogPage classifies at most pageSize (2) routes", "maps_to_ac": "AC-3", "verify": "npx vitest run convex/__tests__/REDHATFIX02-page-bounded.integration.test.ts -t 'TC-5'" },
    { "id": "TC-6", "type": "test_criterion", "description": "classifyCatalog with no routeIds creates classifier_runs with totalRoutes==5", "maps_to_ac": "AC-4", "verify": "npx vitest run convex/__tests__/REDHATFIX02-no-silent-noop.integration.test.ts -t 'TC-6'" },
    { "id": "AC-R1", "type": "acceptance_criterion", "primary": false, "description": "Catalog classification persists a durable, resumable checkpoint via classifier_runs (regression proof added 2026-07-20 fresh review)", "verify": "npx vitest run convex/__tests__/REDHATFIX02-run-checkpoint.integration.test.ts",
      "scenario": { "tier": "visible", "test_tier": "integration", "verification_service": "Convex dev deployment (real classify entrypoint + classifier_runs store + scheduler)", "topology": "single-node",
        "negative_control": { "would_fail_if": ["no classifier_runs row is written (unchanged single-action loop, rideWorthinessClassifier.ts:359-389)", "the cursor is always null (a stub)", "the action classifies the whole catalog in one pass with no scheduled continuation", "resume restarts at cursor=null and re-classifies covered routes"] },
        "evidence": { "artifact_type": "db_query", "required_capture": true },
        "cases": [ { "start_ref": "catalog-multi-page", "action": { "actor": "api_client", "steps": ["Seed 120 unclassified routes", "Invoke the classify entrypoint for one bounded page", "Query classifier_runs", "Capture a page-1 route's classifiedAt", "Resume the run to completion", "Re-query that route's classifiedAt"] },
          "end_state": { "must_observe": ["classifier_runs row exists with non-null cursor and status != 'complete' after the first page", "the page-1 route's classifiedAt is unchanged after resume", "classifier_runs.classified == 120 and remainingUnclassified == 0 at final completion"], "must_not_observe": ["no classifier_runs row after the first page", "the page-1 route re-classified on resume", "the run reports complete while remainingUnclassified > 0"] } } ] } },
    { "id": "TC-R1", "type": "test_criterion", "description": "classifier_runs persists a non-null cursor after one bounded page and resumes without re-classifying covered routes", "maps_to_ac": "AC-R1", "verify": "npx vitest run convex/__tests__/REDHATFIX02-run-checkpoint.integration.test.ts -t 'TC-R1'" }
  ]
}
-->

</details>
