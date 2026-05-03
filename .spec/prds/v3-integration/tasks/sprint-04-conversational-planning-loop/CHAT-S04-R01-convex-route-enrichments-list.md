================================================================================
TASK: CHAT-S04-R01 - Implement db.routeEnrichments.list reactive query
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      cd server && pnpm test -- routeEnrichments
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched server/convex/db/routeEnrichments.ts
  build:     pnpm --dir server run convex:dev -- --once

PROGRESS: 5/5 AC · merged to main (commit 90013515)

CLOSED_BY: red-hat round-2 review 2026-05-03T21:43:36Z — all 5 ACs verified PASS by convex-reviewer

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS subscription `db/routeEnrichments:list` returns chronologically-ordered hourly forecast entries plus enrichment status, gated to the route plan's owner, re-emitting on enrichment row updates.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST define a public `query` named `list` in `server/convex/db/routeEnrichments.ts` accepting `{ routePlanId: v.id('route_plans') }`
- MUST call `requireIdentity(ctx)` and verify the parent route_plan's `clerkUserId` matches the caller before returning data
- MUST use `withIndex('by_routePlanId', ...)` — never `.filter()` on a full table scan
- MUST return `{ entries: HourlyForecast[], status: 'pending' | 'completed' | 'failed' | 'cancelled' }` with explicit `v.object({...})` returns validator (no `v.any()`)
- MUST sort entries chronologically (ascending by `forecastTime`) before returning
- NEVER use `v.any()` in the returns validator
- NEVER bypass `requireIdentity` or rely on a downstream check
- STRICTLY match the iOS subscription tag: server export name `list` so the wire path is `db/routeEnrichments:list`

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Public `list` query exists with correct shape contract (AC-1 PRIMARY)
- [ ] Cross-user requests are rejected (AC-2)
- [ ] Entries returned in chronological ascending order (AC-3)
- [ ] Reactive — query re-emits on enrichment row patch (AC-4)
- [ ] Index-backed lookup (no table scan) (AC-5)
- [ ] `cd server && pnpm test` passes + `pnpm --dir server run convex:dev -- --once` clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Public list query exists with correct shape contract [PRIMARY]
  GIVEN: A planner has imported `api` from `_generated`
  WHEN:  They call `api.db.routeEnrichments.list({ routePlanId })` as the route plan owner
  THEN:  The query returns `{ entries: HourlyForecast[], status: RouteEnrichmentStatus }` matching the explicit returns validator (no `v.any()`)

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routeEnrichments.test.ts
  TEST_FUNCTION: list returns shape contract { entries, status } with explicit validator

AC-2: Cross-user requests are rejected (ownership)
  GIVEN: User A owns route plan RP1 and User B is authenticated
  WHEN:  User B calls `api.db.routeEnrichments.list({ routePlanId: RP1 })`
  THEN:  The query returns an empty `entries` array with `status: 'pending'` (or throws structured ConvexError) — User B never sees User A's enrichment data

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routeEnrichments.test.ts
  TEST_FUNCTION: list rejects cross-user reads

AC-3: Entries returned in chronological (ascending) order
  GIVEN: An enrichment row exists with hourly weather entries created in non-chronological order
  WHEN:  The owner calls `api.db.routeEnrichments.list({ routePlanId })`
  THEN:  Returned `entries[i].forecastTime` is strictly non-decreasing

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routeEnrichments.test.ts
  TEST_FUNCTION: list returns entries sorted chronologically

AC-4: Reactivity — query re-emits on enrichment row patch
  GIVEN: An owner has subscribed to `list({ routePlanId })` and the enrichment row is in PENDING status
  WHEN:  An internal mutation patches the same enrichment row to COMPLETED with new entries
  THEN:  The convex-test subscription harness observes a new emission with `status: 'completed'` and the patched entries

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routeEnrichments.test.ts
  TEST_FUNCTION: list re-emits when enrichment row is updated

AC-5: Index-backed lookup (no table scan)
  GIVEN: The route_enrichments table is indexed by `by_routePlanId`
  WHEN:  The query implementation is read
  THEN:  It uses `.withIndex('by_routePlanId', q => q.eq('routePlanId', args.routePlanId))` and never `.filter()` on routePlanId

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routeEnrichments.ts
  TEST_FUNCTION: code review — biome check confirms file shape

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | convex-test inserts route_plan owned by user A and enrichment with 3 unsorted entries; list call returns entries.length===3, status==='pending', entries non-decreasing | AC-1 | happy_path |
| TC-2 | convex-test inserts route_plan owned by user A; auth as B; list returns empty entries (or throws structured ConvexError) | AC-2 | edge_case |
| TC-3 | Entries inserted [t+2h, t+0h, t+1h]; list returns [t+0h, t+1h, t+2h] | AC-3 | edge_case |
| TC-4 | Subscribe with PENDING; patch row to COMPLETED; assert subscription receives second emission with status:'completed' | AC-4 | happy_path |
| TC-5 | Static check: list handler uses withIndex('by_routePlanId') and returns validator is v.object (not v.any()) | AC-5 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- server/convex/db/routeEnrichments.ts (MODIFY — add `list` query export + ownership helper)
- server/convex/db/routeEnrichments.test.ts (CREATE OR MODIFY — add tests for AC-1..AC-5)

writeProhibited:
- server/convex/_generated/** — auto-generated; will be regenerated by convex:dev
- server/convex/schema.ts — no schema changes required; existing `by_routePlanId` index suffices
- server/convex/guards.ts — reserved for CHAT-S04-R03
- ios/** + android/** — mobile callers out of scope
- Any file outside server/convex/db/routeEnrichments.* and the explicit list above

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `withIndex` for table lookups
- Validate args with explicit `v.*` validators
- Use `requireIdentity` + parent-doc ownership pattern
- Sort entries before returning

⚠️ Ask First:
- Adding a new index to schema.ts (only if `by_routePlanId` truly missing)
- Throwing vs returning empty on cross-user — pick one and document in the AC

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- server/convex/db/routeEnrichments.ts (MODIFY): add public `list` query handler
- server/convex/db/routeEnrichments.test.ts (NEW): convex-test coverage for AC-1..AC-5

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, existing patterns at routeEnrichments.ts:395 (getByRoutePlanId)
- WRITE: ONE convex-test exercising GIVEN-WHEN-THEN
- RUN: `cd server && pnpm test -- routeEnrichments`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal handler code to pass
- RUN: `cd server && pnpm test -- routeEnrichments`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: implementation; tighten validators / sorting / index usage
- RUN: full server suite + `pnpm --dir server run convex:dev -- --once`
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. server/convex/db/routeEnrichments.ts [PRIMARY PATTERN]
   - Lines: 1-429
   - Focus: Existing `getByRoutePlanId` (line 395) — model `list` after this; reuse `findByRoutePlanIdHandler`

2. server/convex/db/routePlans.ts
   - Lines: 560-610
   - Focus: Pattern for ownership check via parent doc lookup before exposing route-plan-scoped data

3. server/convex/guards.ts
   - Lines: 14-25
   - Focus: `requireIdentity` signature returning `{ clerkUserId, tokenIdentifier }`

4. server/models/route-enrichments.ts
   - Lines: 1-200
   - Focus: `RouteEnrichment` type + `RouteEnrichmentStatus` enum + hourly forecast shape

5. ios/LaneShadow/Services/ConvexClient+LaneShadow.swift
   - Lines: 1-30
   - Focus: iOS subscription tag — wire path expected (`db/routeEnrichments:list`)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All Vitest tests pass (including new tests)
  Command: cd server && pnpm test -- routeEnrichments
  Expected: Exit 0; new list tests visible.

Gate 4: Convex build clean
  Command: pnpm --dir server run convex:dev -- --once
  Expected: Exit 0; `db/routeEnrichments:list` registered as public query.

Gate 5: Typecheck clean
  Command: pnpm type-check:native
  Expected: Exit 0.

Gate 6: Biome lint clean
  Command: pnpm exec biome check --no-errors-on-unmatched server/convex/db/routeEnrichments.ts server/convex/db/routeEnrichments.test.ts
  Expected: Exit 0.

Gate 7: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none — independent)
Blocks:     CHAT-S04-R05 (iOS RouteDetails viewState live wiring), CHAT-S04-R08 (iOS XCUITest E2E), CHAT-S04-R12 (Android instrumented E2E)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R01",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN a planner has imported api WHEN they call api.db.routeEnrichments.list({routePlanId}) as owner THEN it returns {entries: HourlyForecast[], status: RouteEnrichmentStatus} with explicit returns validator (no v.any())", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN user A owns RP1 and user B authenticated WHEN user B calls list({routePlanId: RP1}) THEN user B never sees user A's enrichment data (empty result or structured error)", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN enrichment row with non-chronological entries WHEN owner calls list THEN returned entries[i].forecastTime is non-decreasing", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN owner subscribed to list with PENDING WHEN enrichment row patched to COMPLETED THEN subscription re-emits with status:'completed' and patched entries", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN route_enrichments has by_routePlanId index WHEN list handler is read THEN it uses withIndex (not filter)", "verify": "pnpm exec biome check --no-errors-on-unmatched server/convex/db/routeEnrichments.ts", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Insert plan + 3 unsorted entries → list returns sorted entries with status 'pending'", "maps_to_ac": "AC-1", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Cross-user list call returns empty / throws structured error", "maps_to_ac": "AC-2", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Insert entries [t+2h, t+0h, t+1h]; list returns [t+0h, t+1h, t+2h]", "maps_to_ac": "AC-3", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Subscribe with PENDING; patch to COMPLETED; observe second emission with completed status", "maps_to_ac": "AC-4", "verify": "cd server && pnpm test -- routeEnrichments", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Static check: list uses withIndex('by_routePlanId') and returns validator is explicit v.object", "maps_to_ac": "AC-5", "verify": "pnpm exec biome check --no-errors-on-unmatched server/convex/db/routeEnrichments.ts", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
