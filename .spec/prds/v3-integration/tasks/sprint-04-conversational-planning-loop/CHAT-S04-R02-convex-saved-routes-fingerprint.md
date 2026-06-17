================================================================================
TASK: CHAT-S04-R02 - Implement db.savedRoutes.getRouteIndexFingerprint query
================================================================================

TASK_TYPE:  FEATURE
STATUS:     REOPENED (round-3 RF-22)
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      cd server && pnpm test -- savedRoutes
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched convex/db/savedRoutes.ts
  build:     pnpm --dir server run convex:dev -- --once

PROGRESS: 4/6 AC · RF-22: composite index architecturally broken — routeIndex is nested object, query uses old 2-field index + in-memory .find()

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

iOS subscription `db/savedRoutes:getRouteIndexFingerprint` returns `{ isSaved, savedRouteId? }` scoped to the authenticated user via composite index, so RouteDetailsScreen save badge resolves on mount instead of throwing.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST define a public `query` named `getRouteIndexFingerprint` in `convex/db/savedRoutes.ts` accepting `{ routeIndex: v.string() }`
- MUST call `requireIdentity(ctx)` and use the returned `clerkUserId` to scope the lookup
- MUST add a composite index `by_ownerType_ownerId_routeIndex` on `saved_routes` in `convex/schema.ts` (fields: `['ownerType', 'ownerId', 'routeIndex']`)
- MUST return `v.object({ isSaved: v.boolean(), savedRouteId: v.optional(v.id('saved_routes')) })`
- MUST treat soft-deleted rows (`deletedAt` set) as NOT saved
- NEVER use `.filter()` to scan all saved_routes
- NEVER return another user's savedRouteId even if the routeIndex matches
- STRICTLY match iOS subscription tag: wire path `db/savedRoutes:getRouteIndexFingerprint`
- STRICTLY composite index ordering MUST be `['ownerType','ownerId','routeIndex']` to support equality on all three

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Returns `{ isSaved: false }` for unknown fingerprint (AC-1 PRIMARY)
- [ ] Returns `{ isSaved: true, savedRouteId }` for owner's saved fingerprint (AC-2)
- [ ] Cross-user isolation enforced (AC-3)
- [ ] Soft-deleted routes treated as not saved (AC-4)
- [ ] Index-backed lookup via composite index (AC-5)
- [ ] Explicit returns validator (no `v.any()`) (AC-6)
- [ ] `cd server && pnpm test` passes + Convex build clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Returns false for unknown fingerprint [PRIMARY]
  GIVEN: Authenticated user has no saved_routes matching `routeIndex='deadbeef'`
  WHEN:  They call `api.db.savedRoutes.getRouteIndexFingerprint({ routeIndex: 'deadbeef' })`
  THEN:  Return value is `{ isSaved: false }` with `savedRouteId` absent

  TDD_STATE:     none
  TEST_FILE:     convex/db/savedRoutes.test.ts
  TEST_FUNCTION: getRouteIndexFingerprint returns isSaved:false for unknown fingerprint

AC-2: Returns true with savedRouteId for owner's saved fingerprint
  GIVEN: Authenticated user has a saved_route with routeIndex='abc123' and deletedAt undefined
  WHEN:  They call `getRouteIndexFingerprint({ routeIndex: 'abc123' })`
  THEN:  Return value is `{ isSaved: true, savedRouteId: <Id<'saved_routes'>> }`

  TDD_STATE:     none
  TEST_FILE:     convex/db/savedRoutes.test.ts
  TEST_FUNCTION: getRouteIndexFingerprint returns isSaved:true with id for owned saved route

AC-3: Cross-user isolation
  GIVEN: User A has saved_route with routeIndex='shared123'; user B is authenticated and has no saved routes
  WHEN:  User B calls `getRouteIndexFingerprint({ routeIndex: 'shared123' })`
  THEN:  Return value is `{ isSaved: false }` — user B never sees user A's id

  TDD_STATE:     none
  TEST_FILE:     convex/db/savedRoutes.test.ts
  TEST_FUNCTION: getRouteIndexFingerprint isolates by clerkUserId

AC-4: Soft-deleted routes treated as not saved
  GIVEN: Authenticated user has a saved_route with routeIndex='ghost42' and deletedAt set to a timestamp
  WHEN:  They call `getRouteIndexFingerprint({ routeIndex: 'ghost42' })`
  THEN:  Return value is `{ isSaved: false }`

  TDD_STATE:     none
  TEST_FILE:     convex/db/savedRoutes.test.ts
  TEST_FUNCTION: getRouteIndexFingerprint excludes soft-deleted rows

AC-5: Index-backed lookup via new composite index
  GIVEN: schema.ts defines `saved_routes` with index `by_ownerType_ownerId_routeIndex` on `['ownerType','ownerId','routeIndex']`
  WHEN:  The handler is implemented
  THEN:  It uses `.withIndex('by_ownerType_ownerId_routeIndex', q => q.eq('ownerType', OWNER_TYPE.USER).eq('ownerId', clerkUserId).eq('routeIndex', args.routeIndex))` and never `.filter()` on routeIndex

  TDD_STATE:     none
  TEST_FILE:     convex/db/savedRoutes.ts
  TEST_FUNCTION: code review — convex build registers index

AC-6: Explicit returns validator
  GIVEN: The new query is exported
  WHEN:  Convex codegen runs
  THEN:  The returns validator is `v.object({ isSaved: v.boolean(), savedRouteId: v.optional(v.id('saved_routes')) })` — no `v.any()`

  TDD_STATE:     none
  TEST_FILE:     convex/db/savedRoutes.ts
  TEST_FUNCTION: code review — biome confirms shape

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Auth user A with empty table; call → expect `{ isSaved: false }` | AC-1 | edge_case |
| TC-2 | Insert owned non-deleted row; call → expect `{ isSaved: true, savedRouteId }` | AC-2 | happy_path |
| TC-3 | Insert user A's row; call as user B → expect `{ isSaved: false }` | AC-3 | security |
| TC-4 | Insert owned soft-deleted row; call → expect `{ isSaved: false }` | AC-4 | edge_case |
| TC-5 | Convex build registers new index + query; handler uses withIndex | AC-5 | happy_path |
| TC-6 | Returns validator is explicit `v.object` with `isSaved` + optional `savedRouteId` | AC-6 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- convex/db/savedRoutes.ts (MODIFY — add `getRouteIndexFingerprint` public query)
- convex/schema.ts (MODIFY — add composite index `by_ownerType_ownerId_routeIndex`)
- convex/db/savedRoutes.test.ts (CREATE OR MODIFY — add tests for AC-1..AC-6)

writeProhibited:
- convex/_generated/** — auto-generated
- server/models/saved-routes.ts — validator changes out of scope (no new fields)
- convex/guards.ts — reserved for CHAT-S04-R03
- ios/** + android/** — mobile callers out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use composite-index `withIndex` for lookup
- Filter out soft-deleted rows (`deletedAt !== undefined`)
- Use explicit validators
- Scope by `clerkUserId` from `requireIdentity`

⚠️ Ask First:
- Adding fields to `saved_routes` schema (no schema field changes — only an index)
- Returning multiple matches if duplicates exist (return first or none — pick one)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- convex/db/savedRoutes.ts (MODIFY): public `getRouteIndexFingerprint` query
- convex/schema.ts (MODIFY): composite index `by_ownerType_ownerId_routeIndex`
- convex/db/savedRoutes.test.ts (CREATE OR MODIFY): convex-test coverage AC-1..AC-6

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, existing pattern at savedRoutes.ts:230-269 (listByOwner)
- WRITE: ONE convex-test exercising GIVEN-WHEN-THEN
- RUN: `cd server && pnpm test -- savedRoutes`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal handler + schema index
- RUN: `cd server && pnpm test -- savedRoutes`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: implementation
- RUN: full server suite + convex build
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. convex/db/savedRoutes.ts [PRIMARY PATTERN]
   - Lines: 230-269 (listByOwner)
   - Focus: Existing patterns: `isOwnedByViewer`, `OWNER_TYPE.USER`, `requireIdentity`, `shouldExcludeFromList` for soft-delete handling

2. convex/schema.ts
   - Lines: 52-55
   - Focus: Existing `saved_routes` index `by_ownerType_and_ownerId` — extend with new composite for routeIndex

3. server/models/saved-routes.ts
   - Lines: 1-100
   - Focus: `routeIndexValidator` + `OWNER_TYPE` constants

4. ios/LaneShadow/Services/ConvexClient+LaneShadow.swift
   - Lines: 1-30
   - Focus: iOS subscription wire path — ensure server export name matches

5. android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt
   - Lines: 1-300
   - Focus: Confirm whether Android also subscribes; if so, ensure shape parity

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All Vitest tests pass
  Command: cd server && pnpm test -- savedRoutes
  Expected: Exit 0; new getRouteIndexFingerprint tests visible.

Gate 4: Convex build clean — new index + query registered
  Command: pnpm --dir server run convex:dev -- --once
  Expected: Exit 0; no schema warnings.

Gate 5: Typecheck clean
  Command: pnpm type-check:native
  Expected: Exit 0.

Gate 6: Biome lint clean
  Command: pnpm exec biome check --no-errors-on-unmatched convex/db/savedRoutes.ts convex/db/savedRoutes.test.ts convex/schema.ts
  Expected: Exit 0.

Gate 7: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     CHAT-S04-R08 (iOS XCUITest E2E), CHAT-S04-R12 (Android instrumented E2E)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R02",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN authenticated user with no matching saved_routes WHEN they call getRouteIndexFingerprint THEN result is { isSaved: false }", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN owner has saved_route routeIndex='abc123' not deleted WHEN they call getRouteIndexFingerprint THEN result is { isSaved: true, savedRouteId }", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN user A owns route with routeIndex='shared123' WHEN user B calls getRouteIndexFingerprint THEN result is { isSaved: false }", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN owner has soft-deleted saved_route WHEN they call getRouteIndexFingerprint THEN result is { isSaved: false }", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN composite index by_ownerType_ownerId_routeIndex WHEN handler runs THEN it uses withIndex (not filter)", "verify": "pnpm --dir server run convex:dev -- --once", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN query exported WHEN codegen runs THEN returns validator is explicit v.object (no v.any())", "verify": "pnpm exec biome check --no-errors-on-unmatched convex/db/savedRoutes.ts", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Auth user A with empty table; call → expect { isSaved: false }", "maps_to_ac": "AC-1", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Insert owned non-deleted row; call → expect { isSaved: true, savedRouteId }", "maps_to_ac": "AC-2", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Insert user A's row; call as user B → expect { isSaved: false }", "maps_to_ac": "AC-3", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "Insert owned soft-deleted row; call → expect { isSaved: false }", "maps_to_ac": "AC-4", "verify": "cd server && pnpm test -- savedRoutes", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Convex build registers new index + query; handler uses withIndex", "maps_to_ac": "AC-5", "verify": "pnpm --dir server run convex:dev -- --once", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Returns validator is explicit v.object", "maps_to_ac": "AC-6", "verify": "pnpm exec biome check --no-errors-on-unmatched convex/db/savedRoutes.ts", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
