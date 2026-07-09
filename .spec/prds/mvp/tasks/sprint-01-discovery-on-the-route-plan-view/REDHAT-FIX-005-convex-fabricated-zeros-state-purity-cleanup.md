# REDHAT-FIX-005: M-1 (elevated) + H-3 + M-2 + M-3 — guard fabricated curated stats, fix centerPoint fallback, harden state-purity test, and clean up route_plans test rows

**Sprint:** [SPRINT.md](./SPRINT.md)
**Type:** FEATURE · **Status:** ⬜ Backlog · **Priority:** P0 · **Effort:** M · **Estimate:** 120 min
**Agent:** convex-implementer
**Proposed By:** convex-planner
**TDD Mode:** red_first · **RED/GREEN Required:** yes
**Agent rationale:** Closes the cycle-2 elevated M-1 (same fabricated-zero anti-pattern as the original CRITICAL distanceMeters bug), M-3 centerPoint sentinel, H-3 state-purity limitation, and M-2 test-row cleanup. convex-implementer owns `discoverCuratedRoutes.ts` and the route_plans mutation surface and can prove all four against live Convex dev.

> **Source:** [red-hat-sprint-01-discovery-2026-07-03T18-53-01Z.md](../../../reviews/red-hat-sprint-01-discovery-2026-07-03T18-53-01Z.md) — cycle-1 re-review findings M-1 (elevated), H-3, M-2, M-3.

## Outcome

Curated discovery options no longer fabricate `durationSeconds`/`legsCount`; best-sort without a center persists the first route's centroid instead of `{0,0}`; the state write-back purity test either samples raw rows or documents the idempotent-normalization limitation; and the scores integration test deletes the `route_plans` rows it creates on dev.

## Specification

**Part A — M-1 fabricated zeros (PRIMARY):** At `convex/actions/agent/tools/discoverCuratedRoutes.ts:155-156`, the lines read `durationSeconds: 0,` and `legsCount: 0,`. When curated routes carry no duration/legs data, the hardcoded `0` fabricates a real zero — the SAME anti-pattern as the original CRITICAL `distanceMeters: 0` bug (REDHAT-FIX-001). FIX: mirror the `!= null` guard philosophy — set both to `undefined` so the option omits them rather than presenting a misleading real 0. The scores block at lines 164-173 is ALREADY correct — do NOT touch it.

**Part B — M-3 centerPoint guard:** At `convex/actions/agent/tools/discoverCuratedRoutes.ts:120`, the line reads `const centerPoint = args.intent.center || { lat: 0, lng: 0 }`. For best-sort discovery (no center provided), the `|| { lat: 0, lng: 0 }` fallback persists a misleading Atlantic-Ocean origin into the `route_plans` row's `planInput`. FIX: when `args.intent.center` is absent, fall back to the first returned route's centroid (a real coordinate) instead of `{0,0}`. Read `convex/db/routePlans.ts` (`createForAgentInternal`) and `shared/models/saved-routes.ts` (planInput validators) to confirm what the mutation accepts.

**Part C — H-3 state purity test improvement:** The test at `convex/__tests__/listCuratedRoutes.state.integration.test.ts:63-95` compares `buildRouteCard` OUTPUT before/after exercising the state gate. If `normalizeState` is idempotent, a write-back could be masked by the re-normalization. Improve by EITHER (a) adding a raw-row sample via an internal query that BYPASSES `buildRouteCard` entirely (stronger), OR (b) adding a clear comment documenting the idempotent-normalization limitation + noting the Convex query guarantee (read-path only — no mutation API on a query) is the real guard. Determine feasibility by reading what internal queries exist on `curated_routes`.

**Part D — M-2 route_plans cleanup:** `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` creates `route_plans` rows (line ~150) via live discovery but has NO `afterEach` cleanup — rows accumulate on dev across runs. Add `afterEach` (or `afterAll`) cleanup that deletes the created rows, scoped to the test's `clerkUserId` prefix. Read the route_plans mutations to find the delete API (e.g. `deleteForAgentInternal`); if none exists, add an internal test-only delete mutation in `convex/db/routePlans.ts`.

## Critical Constraints

- **MUST** mirror REDHAT-FIX-001's guard pattern: use explicit `undefined` when `durationSeconds`/`legsCount` are absent, never a fabricated `0`.
- **NEVER** touch the scores block at `discoverCuratedRoutes.ts:164-173` — it is already correct.
- **NEVER** modify `convex/curatedRoutes.ts`, `convex/util/archetypeMap.ts`, `convex/util/dataNormalization.ts`, or `convex/schema.ts`.
- **MUST NOT** persist `{lat:0,lng:0}` as the `planInput` start/end for best-sort discovery without a center.
- **MUST** run integration assertions against live Convex dev data; the fabricated-zero bug only manifests against the real flat-field contract.
- **PRIMARY AC MUST** observe `durationSeconds === undefined` and `legsCount === undefined`; observing `0` is the fabricated start signature and a fakeable pass.

## Acceptance Criteria

### AC-1: curated options omit durationSeconds and legsCount (undefined, never fabricated 0)
*(PRIMARY)*
- **GIVEN** the seeded live Convex dev catalog and a best-sort `discoverCuratedRoutes` call
- **WHEN** the tool builds options and persists the `route_plans` row
- **THEN** `option.stats.durationSeconds` and `option.stats.legsCount` are `undefined` (the values are absent for curated routes), not the fabricated real `0`
- **Test tier:** `integration` · **Service:** live Convex dev (discoverCuratedRoutes → listCuratedRoutes → route_plans options)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t omitCuratedStatsFabricatedZeros`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: `option.stats.durationSeconds === undefined`; `option.stats.legsCount === undefined`
  - must NOT observe: `option.stats.durationSeconds === 0`; `option.stats.legsCount === 0`
  - negative control (would fail if): `discoverCuratedRoutes.ts:155-156` still hardcode `0`; `undefined` fields are coerced to `0` by the builder or validator; `listCuratedRoutes` is mocked and returns fabricated defaults

### AC-2: best-sort without a center uses the first route centroid, not {0,0}
- **GIVEN** a best-sort intent with no `center`
- **WHEN** `discoverCuratedRoutes` persists a `route_plans` row
- **THEN** `planInput.start`/`end` coordinates equal the first returned route's centroid, NOT the Atlantic-Ocean sentinel `{lat:0,lng:0}`; nearest-sort discovery with a real center continues to work unchanged
- **Test tier:** `integration` · **Service:** live Convex dev (best-sort vs nearest-sort planInput coordinates)
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t centerPointFallsBackToRouteCentroid`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: best-sort `planInput.start.lat` is the first route's `centroidLat` (a real value, e.g. ~35.x in a North Carolina sample); best-sort `planInput.start.lng` is the first route's `centroidLng` (a real non-zero value); nearest-sort with a supplied center persists that center unchanged
  - must NOT observe: `planInput.start.lat === 0`; `planInput.start.lng === 0`; nearest-sort center is overwritten by the route centroid
  - negative control (would fail if): line 120 still uses `args.intent.center || { lat: 0, lng: 0 }`; best-sort discovery throws because `planInput` requires coordinates; nearest-sort lat/lng serialization is altered

### AC-3: state write-back purity test documents or eliminates the idempotent-normalization limitation
- **GIVEN** the state write-back purity test at `listCuratedRoutes.state.integration.test.ts:63-95` compares `buildRouteCard` outputs
- **WHEN** REDHAT-FIX-005 is applied
- **THEN** the test documents (or eliminates) the idempotent-normalization limitation: it either uses a raw `curated_routes` row sample that bypasses `buildRouteCard`, OR adds a clear comment stating that normalization could mask a write-back and that the Convex read-path-only guarantee is the real guard
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts && grep -qE 'idempotent|read-path' convex/__tests__/listCuratedRoutes.state.integration.test.ts`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: the state purity test is updated with a comment or raw-row bypass; the test still passes and still proves zero state mutations
  - must NOT observe: a raw-row internal query is added to `convex/curatedRoutes.ts` (write-prohibited); the test is weakened or assertions removed
  - negative control (would fail if): `normalizeState` is silently updated to write back to `curated_routes` and the card-output comparison masks it; the comment incorrectly asserts the card comparison is sufficient without qualification; `buildRouteCard` is modified to mutate rows

### AC-4: scores integration test cleans up its route_plans rows
- **GIVEN** `discoverCuratedRoutes.scores.integration.test.ts` creates `route_plans` rows on live dev via `runLiveDiscoverySmoke`
- **WHEN** each test or describe block completes
- **THEN** the created rows are deleted so dev does not accumulate red-hat test artifacts across runs
- **Test tier:** `integration` · **Service:** live Convex dev
- **Verify:** `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts`
- **Scenario** (start `seeded_geospatial_index`):
  - must observe: `afterEach`/`afterAll` deletes `route_plans` rows created by the test; the cleanup mutation is internal and scoped to the test `clerkUserId` prefix; tests pass
  - must NOT observe: leftover `route_plans` rows with `clerkUserId` matching the test prefix after the run; cleanup deletes unrelated rows or production data
  - negative control (would fail if): no cleanup hook is added; the delete mutation lacks a `clerkUserId` filter; cleanup runs before assertions and deletes evidence

## Test Criteria

| ID | Statement | Maps to | Verify |
|----|-----------|---------|--------|
| TC-1 | Integration: best-sort curated options omit `durationSeconds` and `legsCount` (`undefined`), never fabricated `0`. | AC-1 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t omitCuratedStatsFabricatedZeros` |
| TC-2 | Integration + code: best-sort without a center uses the first route centroid; nearest-sort with a center is unchanged; line 120 no longer falls back to `{0,0}`. | AC-2 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t centerPointFallsBackToRouteCentroid` |
| TC-3 | Code review: the state write-back purity test is updated with either a raw-row bypass or a comment explaining idempotent-normalization + Convex read-only guarantee. | AC-3 | `pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts && grep -qE 'idempotent\|read-path' convex/__tests__/listCuratedRoutes.state.integration.test.ts` |
| TC-4 | Integration hygiene: the scores test suite deletes its created `route_plans` rows after each test/all. | AC-4 | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` |
| TC-5 | Scope check: only write-allowed files changed; scores block (164-173) and write-prohibited files untouched. | AC-1 | `git diff --name-only && git diff -- convex/actions/agent/tools/discoverCuratedRoutes.ts` |

## Reading List

- `convex/actions/agent/tools/discoverCuratedRoutes.ts` (115-190) — PRIMARY: line 120 centerPoint fallback; lines 155-156 fabricated `durationSeconds`/`legsCount`; the scores block at 164-173 must remain untouched.
- `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts` (1-323) — existing live discovery + mock nearest-sort tests; insert M-1 assertions here and add `afterEach` cleanup for created `route_plans` rows.
- `convex/__tests__/listCuratedRoutes.state.integration.test.ts` (56-96) — H-3 target: state write-back purity test that compares `buildRouteCard` output before/after.
- `convex/db/routePlans.ts` (createForAgentInternal + delete surface) — the mutation contract `planInput` must satisfy and the absent delete mutation that M-2 cleanup may need to add.
- `convex/curatedRoutes.ts` (36-60, 125-146, 302-306) — READ-ONLY reference: the flat return validator, `buildRouteCard` normalization, and `listCuratedRoutesInternal` used by the state test.
- `shared/models/saved-routes.ts` (75-103) — READ-ONLY reference: `routeStop` and `planInput` validators require `lat`/`lng`, which is why the centerPoint fallback cannot simply be omitted.

## Guardrails

- WRITE-ALLOWED: `convex/actions/agent/tools/discoverCuratedRoutes.ts (MODIFY — line 120 for M-3 fallback; lines 155-156 for M-1 zero guard)`
- WRITE-ALLOWED: `convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts (MODIFY — add M-1 assertions + route_plans cleanup)`
- WRITE-ALLOWED: `convex/__tests__/listCuratedRoutes.state.integration.test.ts (MODIFY — H-3 comment/raw-query)`
- WRITE-ALLOWED: `convex/db/routePlans.ts (NEW internal test-only delete mutation if needed for M-2 cleanup)`
- WRITE-PROHIBITED: `convex/curatedRoutes.ts` — the query already returns correct flat 0–1 scores
- WRITE-PROHIBITED: `convex/util/archetypeMap.ts`, `convex/util/dataNormalization.ts`, `convex/schema.ts`
- WRITE-PROHIBITED: `convex/actions/agent/tools/discoverCuratedRoutes.ts` lines 164-173 (the scores block — already correct)
- WRITE-PROHIBITED: Any file not listed above

## Design

- ref: `convex/actions/agent/tools/discoverCuratedRoutes.ts:151` (the REDHAT-FIX-001 distanceMeters guard — the pattern to mirror)
- ref: `.spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/REDHAT-FIX-001-data-008b-distance-meters-bug-and-scores-integration-test.md`
- pattern: Guard absent optional values with explicit `undefined` instead of falsy coercion; use a meaningful fallback (first-route centroid) instead of a sentinel coordinate.
- anti-pattern: `durationSeconds: 0,` / `legsCount: 0,` and `args.intent.center || { lat: 0, lng: 0 }`.

## Verification Gates

| Gate | Command |
|------|---------|
| test | `pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts convex/__tests__/listCuratedRoutes.state.integration.test.ts` |
| typecheck | `pnpm type-check` |
| lint | `pnpm exec biome check convex/actions/agent/tools/discoverCuratedRoutes.ts convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts convex/__tests__/listCuratedRoutes.state.integration.test.ts convex/db/routePlans.ts` |
| convex dev | `pnpm convex:dev -- --once` |
| scope | `git diff --name-only ⊆ write_allowed` |

## Coding Standards

- Use `field != null ? <real value> : undefined` for all optional numeric fields.
- Never fabricate a real `0` or `{lat:0,lng:0}` sentinel when data is absent.
- For test cleanup, add a clearly named internal mutation and call it from `afterEach` or `afterAll`, scoped by the test `clerkUserId` prefix.
- Preserve the existing scores block; any change there is out of scope.

## Dependencies

- Depends on: REDHAT-FIX-001 (the distanceMeters guard whose pattern this mirrors)
- Blocks: (none)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "version": "1",
  "task_id": "REDHAT-FIX-005",
  "tdd_mode": "red_first",
  "verification_policy": {
    "requires_tests": true,
    "requires_red_evidence": true,
    "requires_seeded_evidence": true
  },
  "fixtures": {
    "seeded_geospatial_index": {
      "description": "Live Convex dev deployment containing the 5,654-row curated catalog with real compositeScore/*Score values and rows with/without distanceMi, plus existing route_plans helpers",
      "seed_method": "migration_fixture",
      "records": [
        "curated_routes rows with real centroidLat/centroidLng",
        "curated_routes rows with and without distanceMi so best/nearest sorts are both testable",
        "existing internal queries/mutations getPlanByIdInternal, listCuratedRoutesInternal, createForAgentInternal"
      ]
    }
  },
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "primary": true,
      "description": "GIVEN the seeded live Convex dev catalog and a best-sort discoverCuratedRoutes call WHEN the tool builds options and persists the route_plans row THEN option.stats.durationSeconds and option.stats.legsCount are undefined (the values are absent for curated routes), not the fabricated real 0.",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t omitCuratedStatsFabricatedZeros",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["option.stats.durationSeconds === undefined", "option.stats.legsCount === undefined"],
        "must_not_observe": ["option.stats.durationSeconds === 0", "option.stats.legsCount === 0"],
        "negative_control": { "would_fail_if": ["discoverCuratedRoutes.ts:155-156 still hardcode 0", "undefined fields are coerced to 0 by the builder or validator", "listCuratedRoutes is mocked and returns fabricated defaults"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["run runLiveDiscoverySmoke with best-sort, state='North Carolina', archetypes=['scenic']", "load the created route_plans row via getPlanByIdInternal", "read options[0].stats"] }, "end_state": { "must_observe": ["options[0].stats.durationSeconds is undefined", "options[0].stats.legsCount is undefined"], "must_not_observe": ["options[0].stats.durationSeconds === 0", "options[0].stats.legsCount === 0"] } }]
      }
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN a best-sort intent with no center WHEN discoverCuratedRoutes persists a route_plans row THEN planInput.start/end coordinates equal the first returned route's centroid, NOT the Atlantic-Ocean sentinel {lat:0,lng:0}; nearest-sort discovery with a real center continues to work unchanged.",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t centerPointFallsBackToRouteCentroid",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["best-sort planInput.start.lat is the first route's centroidLat (a real value, e.g. ~35.x in a North Carolina sample)", "best-sort planInput.start.lng is the first route's centroidLng (a real non-zero value)", "nearest-sort with a supplied center persists that center unchanged"],
        "must_not_observe": ["planInput.start.lat === 0", "planInput.start.lng === 0", "nearest-sort center is overwritten by the route centroid"],
        "negative_control": { "would_fail_if": ["line 120 still uses args.intent.center || { lat: 0, lng: 0 }", "best-sort discovery throws because planInput requires coordinates", "nearest-sort lat/lng serialization is altered"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["run best-sort discovery without a center", "run nearest-sort discovery with center={lat:35.5,lng:-82.0}", "load both route_plans rows and compare planInput.start coordinates"] }, "end_state": { "must_observe": ["best-sort planInput.start.lat equals the first returned route's centroidLat", "best-sort planInput.start.lat is not 0", "nearest-sort planInput.start.lat equals the supplied center lat"], "must_not_observe": ["best-sort planInput.start.lat === 0", "best-sort planInput.start.lng === 0"] } }]
      }
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN the state write-back purity test at listCuratedRoutes.state.integration.test.ts:63-95 compares buildRouteCard outputs WHEN REDHAT-FIX-005 is applied THEN the test documents (or eliminates) the idempotent-normalization limitation: it either uses a raw curated_routes row sample that bypasses buildRouteCard, or adds a clear comment stating that normalization could mask a write-back and that the Convex read-path-only guarantee is the real guard.",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts && grep -qE 'idempotent|read-path' convex/__tests__/listCuratedRoutes.state.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["the state purity test is updated with a comment or raw-row bypass", "the test still passes and still proves zero state mutations"],
        "must_not_observe": ["a raw-row internal query is added to convex/curatedRoutes.ts (write-prohibited)", "the test is weakened or assertions removed"],
        "negative_control": { "would_fail_if": ["normalizeState is silently updated to write back to curated_routes and the card-output comparison masks it", "the comment incorrectly asserts the card comparison is sufficient without qualification", "buildRouteCard is modified to mutate rows"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["read listCuratedRoutes.state.integration.test.ts", "add a raw-row internal query in a write-allowed module OR add a clarifying comment", "run the state integration test"] }, "end_state": { "must_observe": ["test passes and file contains the required comment/raw-query"], "must_not_observe": ["convex/curatedRoutes.ts modified"] } }]
      }
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "primary": false,
      "description": "GIVEN discoverCuratedRoutes.scores.integration.test.ts creates route_plans rows on live dev via runLiveDiscoverySmoke WHEN each test or describe block completes THEN the created rows are deleted so dev does not accumulate red-hat test artifacts across runs.",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": null,
      "scenario": {
        "start_ref": "seeded_geospatial_index",
        "tier": "visible",
        "test_tier": "integration",
        "verification_service": "live Convex dev",
        "must_observe": ["afterEach/all deletes route_plans rows created by the test", "the cleanup mutation is internal and scoped to the test clerkUserId prefix", "tests pass"],
        "must_not_observe": ["leftover route_plans rows with clerkUserId matching the test prefix after the test run", "cleanup deletes unrelated rows or production data"],
        "negative_control": { "would_fail_if": ["no cleanup hook is added", "the delete mutation lacks a clerkUserId filter", "cleanup runs before assertions and deletes evidence"] },
        "evidence": { "artifact_type": "stdout", "required_capture": true },
        "cases": [{ "start_ref": "seeded_geospatial_index", "action": { "actor": "api_client", "steps": ["run the scores integration test suite", "query route_plans for rows whose clerkUserId starts with the test prefix", "confirm count is zero after teardown"] }, "end_state": { "must_observe": ["scores tests pass", "zero leftover test route_plans rows"], "must_not_observe": ["accumulated route_plans rows from this or prior runs"] } }]
      }
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Integration: best-sort curated options omit durationSeconds and legsCount (undefined), never fabricated 0.",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t omitCuratedStatsFabricatedZeros",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Integration + code: best-sort without a center uses the first route centroid; nearest-sort with a center is unchanged; line 120 no longer falls back to {0,0}.",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts -t centerPointFallsBackToRouteCentroid",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Code review: the state write-back purity test is updated with either a raw-row bypass or a comment explaining idempotent-normalization + Convex read-only guarantee.",
      "verify": "pnpm test convex/__tests__/listCuratedRoutes.state.integration.test.ts && grep -qE 'idempotent|read-path' convex/__tests__/listCuratedRoutes.state.integration.test.ts",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Integration hygiene: the scores test suite deletes its created route_plans rows after each test/all.",
      "verify": "pnpm test convex/actions/agent/tools/__tests__/discoverCuratedRoutes.scores.integration.test.ts",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Scope check: only write-allowed files changed; scores block (164-173) and write-prohibited files untouched.",
      "verify": "git diff --name-only && git diff -- convex/actions/agent/tools/discoverCuratedRoutes.ts",
      "maps_to_ac": "AC-1"
    }
  ]
}
-->
