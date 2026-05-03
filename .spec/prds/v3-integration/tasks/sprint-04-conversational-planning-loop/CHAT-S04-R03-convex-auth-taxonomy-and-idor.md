================================================================================
TASK: CHAT-S04-R03 - Align auth error taxonomy + close IDOR on getActiveRoutePlansForSession
================================================================================

TASK_TYPE:  BUGFIX
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      cd server && pnpm test
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched server/convex/errors.ts server/convex/guards.ts server/convex/db/routePlans.ts
  build:     pnpm --dir server run convex:dev -- --once

PROGRESS: 0/7 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`requireIdentity` throws structured ConvexError with code `UNAUTHENTICATED`; `getActiveRoutePlansForSession` requires auth + verifies session ownership; mobile error mappers receive a recognizable code so the sign-out flow fires.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST add `UNAUTHENTICATED: 'UNAUTHENTICATED'` and `FORBIDDEN: 'FORBIDDEN'` to `ERROR_CODES` in `server/convex/errors.ts`
- MUST update `requireIdentity()` in `server/convex/guards.ts` to throw `new ConvexError({ code: ERROR_CODES.UNAUTHENTICATED, message: 'Authentication required' })` — structured object, not freeform string
- MUST add `await requireIdentity(ctx)` to `getActiveRoutePlansForSession` in `server/convex/db/routePlans.ts:586` and verify the session's `clerkUserId` matches the caller — throw structured ConvexError with code `FORBIDDEN` otherwise
- MUST produce a JSON fixture file `server/convex/__fixtures__/auth-error-taxonomy.json` enumerating each error code + the expected `data.code` shape mobile mappers should match
- MUST keep all existing `requireIdentity` callers compiling and passing
- NEVER throw plain `new Error(...)` for auth failures (must be ConvexError with structured data)
- NEVER skip the IDOR fix on `getActiveRoutePlansForSession`
- STRICTLY all auth failures from `guards.ts` MUST throw `ConvexError({ code, message })` — never freeform strings
- STRICTLY fixture JSON MUST be machine-readable so mobile teams can codegen mapper tables

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] ERROR_CODES extended with UNAUTHENTICATED + FORBIDDEN (AC-1 PRIMARY)
- [ ] requireIdentity throws structured UNAUTHENTICATED (AC-2)
- [ ] getActiveRoutePlansForSession requires authentication (AC-3)
- [ ] getActiveRoutePlansForSession rejects cross-user sessionId (IDOR closed) (AC-4)
- [ ] Owner happy path still works (AC-5)
- [ ] No regression in existing requireIdentity callers (AC-6)
- [ ] Auth error taxonomy fixture emitted (AC-7)
- [ ] `cd server && pnpm test` passes
- [ ] No legacy freeform `'Authentication required'` string remains in throws

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: ERROR_CODES extended with UNAUTHENTICATED and FORBIDDEN [PRIMARY]
  GIVEN: errors.ts is read after the change
  WHEN:  ERROR_CODES is inspected
  THEN:  It contains entries `UNAUTHENTICATED: 'UNAUTHENTICATED'` and `FORBIDDEN: 'FORBIDDEN'`; ErrorCode union type includes both

  TDD_STATE:     none
  TEST_FILE:     server/convex/errors.test.ts
  TEST_FUNCTION: ERROR_CODES exposes UNAUTHENTICATED and FORBIDDEN

AC-2: requireIdentity throws structured UNAUTHENTICATED
  GIVEN: A query/mutation calls `requireIdentity(ctx)` with no authenticated identity
  WHEN:  The call resolves
  THEN:  It throws `ConvexError` whose `error.data.code === 'UNAUTHENTICATED'` and `error.data.message` is human-readable

  TDD_STATE:     none
  TEST_FILE:     server/convex/guards.test.ts
  TEST_FUNCTION: requireIdentity throws ConvexError with structured code UNAUTHENTICATED

AC-3: getActiveRoutePlansForSession requires authentication
  GIVEN: An unauthenticated client calls `api.db.routePlans.getActiveRoutePlansForSession({ sessionId })`
  WHEN:  The query handler runs
  THEN:  It throws ConvexError with `data.code === 'UNAUTHENTICATED'` (no rows returned)

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routePlans.test.ts
  TEST_FUNCTION: getActiveRoutePlansForSession rejects unauthenticated callers

AC-4: getActiveRoutePlansForSession rejects cross-user sessionId (IDOR closed)
  GIVEN: User A owns planning_session S1 with active route plans; user B is authenticated
  WHEN:  User B calls `getActiveRoutePlansForSession({ sessionId: S1 })`
  THEN:  It throws ConvexError with `data.code === 'FORBIDDEN'` — no rows leak to user B

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routePlans.test.ts
  TEST_FUNCTION: getActiveRoutePlansForSession rejects cross-user sessionId with FORBIDDEN

AC-5: Owner happy path still works
  GIVEN: User A is authenticated and owns planning_session S1 with two route plans (one pending, one running)
  WHEN:  User A calls `getActiveRoutePlansForSession({ sessionId: S1 })`
  THEN:  It returns `[{ _id, status: 'pending' }, { _id, status: 'running' }]`

  TDD_STATE:     none
  TEST_FILE:     server/convex/db/routePlans.test.ts
  TEST_FUNCTION: getActiveRoutePlansForSession returns owner's active plans

AC-6: No regression in existing requireIdentity callers
  GIVEN: All existing queries/mutations using requireIdentity (savedRoutes, planningSessions, sessionMessages, etc.)
  WHEN:  Full Vitest suite runs
  THEN:  All previously-passing tests still pass; any test asserting on freeform `'Authentication required'` string is updated to assert on structured `data.code`

  TDD_STATE:     none
  TEST_FILE:     server/**/*.test.ts
  TEST_FUNCTION: full suite regression

AC-7: Auth error taxonomy fixture emitted
  GIVEN: Mobile teams need to align their mapper tables
  WHEN:  The repo is built
  THEN:  `server/convex/__fixtures__/auth-error-taxonomy.json` exists and lists every ERROR_CODES value with: `{ code, description, mobile_mapping_target }`; UNAUTHENTICATED entry maps to `Unauthenticated`, FORBIDDEN to `Forbidden`

  TDD_STATE:     none
  TEST_FILE:     server/convex/__fixtures__/auth-error-taxonomy.test.ts
  TEST_FUNCTION: fixture JSON is valid and covers every ERROR_CODES entry

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Import ERROR_CODES; assert UNAUTHENTICATED === 'UNAUTHENTICATED' and FORBIDDEN === 'FORBIDDEN' | AC-1 | happy_path |
| TC-2 | Invoke wrapper that calls requireIdentity without auth; await; catch ConvexError; assert err.data.code === 'UNAUTHENTICATED' | AC-2 | happy_path |
| TC-3 | Call getActiveRoutePlansForSession with no identity; assert ConvexError with data.code === 'UNAUTHENTICATED' | AC-3 | security |
| TC-4 | Insert planning_session for user A + 2 route plans; auth as user B; call getActiveRoutePlansForSession({A's}); assert ConvexError with data.code === 'FORBIDDEN' | AC-4 | security |
| TC-5 | Insert session for user A + 1 pending + 1 running plan; auth as A; call → expect 2 rows with statuses | AC-5 | happy_path |
| TC-6 | Full server test suite passes after refactor; legacy assertions updated | AC-6 | regression |
| TC-7 | Read fixture; assert every ERROR_CODES key has entry with non-empty description + mobile_mapping_target | AC-7 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- server/convex/errors.ts (MODIFY — add UNAUTHENTICATED + FORBIDDEN)
- server/convex/guards.ts (MODIFY — refactor requireIdentity + ensureSession + requireSession to structured ConvexError)
- server/convex/db/routePlans.ts (MODIFY — add requireIdentity + session ownership to getActiveRoutePlansForSession)
- server/convex/guards.test.ts (CREATE OR MODIFY — assert structured error shape)
- server/convex/errors.test.ts (CREATE OR MODIFY — assert new codes)
- server/convex/db/routePlans.test.ts (MODIFY — add IDOR + auth tests)
- server/convex/__fixtures__/auth-error-taxonomy.json (CREATE — fixture for mobile teams)
- server/convex/__fixtures__/auth-error-taxonomy.test.ts (CREATE — validate fixture)
- server/convex/db/savedRoutes.test.ts (MODIFY — update legacy `'Authentication required'` assertions if any)
- server/convex/db/planningSessions.test.ts (MODIFY — same)
- server/convex/db/sessionMessages.test.ts (MODIFY — same)

writeProhibited:
- server/convex/_generated/** — auto-generated
- ios/LaneShadow/Services/LaneShadowErrorMapping.swift — mobile mapper alignment is CHAT-S04-R13
- android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt — mobile mapper alignment is CHAT-S04-R14
- server/convex/schema.ts — no schema changes required
- Any file outside server/convex/

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `new ConvexError({ code, message })` for all auth/authz errors
- Update tests asserting freeform strings to assert on `error.data.code`
- Verify session ownership before returning rows in any query touching `sessionId`

⚠️ Ask First:
- Renaming or removing existing ERROR_CODES values
- Changing throw vs return semantics in any other guard

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- server/convex/errors.ts (MODIFY): add UNAUTHENTICATED + FORBIDDEN to ERROR_CODES
- server/convex/guards.ts (MODIFY): refactor to structured ConvexError throws
- server/convex/db/routePlans.ts (MODIFY): close IDOR on getActiveRoutePlansForSession
- server/convex/__fixtures__/auth-error-taxonomy.json (NEW): mobile mapper alignment contract
- server/convex/__fixtures__/auth-error-taxonomy.test.ts (NEW): fixture validation

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, existing patterns
- WRITE: ONE convex-test exercising GIVEN-WHEN-THEN
- RUN: `cd server && pnpm test -- <suite>`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal handler / refactor
- RUN: `cd server && pnpm test -- <suite>`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: implementation
- RUN: full server suite
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. server/convex/guards.ts [PRIMARY PATTERN]
   - Lines: 1-83
   - Focus: requireIdentity, ensureSession, requireSession — convert all to structured ConvexError

2. server/convex/errors.ts
   - Lines: 1-29
   - Focus: Add UNAUTHENTICATED + FORBIDDEN; preserve existing ERROR_CODES order

3. server/convex/db/routePlans.ts
   - Lines: 560-610
   - Focus: getActiveRoutePlansForSession — add requireIdentity + session ownership check

4. server/convex/db/planningSessions.ts
   - Lines: 119-129
   - Focus: getSessionByIdHandler ownership pattern — reuse for session-id ownership in routePlans

5. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-04 + F-09 sections
   - Focus: Root cause + impact (Android sign-out flow + IDOR)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All Vitest tests pass
  Command: cd server && pnpm test
  Expected: Exit 0; new IDOR + structured-error tests visible.

Gate 4: Convex build clean
  Command: pnpm --dir server run convex:dev -- --once
  Expected: Exit 0.

Gate 5: Typecheck clean
  Command: pnpm type-check:native
  Expected: Exit 0.

Gate 6: Biome lint clean
  Command: pnpm exec biome check --no-errors-on-unmatched server/convex/errors.ts server/convex/guards.ts server/convex/db/routePlans.ts
  Expected: Exit 0.

Gate 7: No legacy freeform 'Authentication required' string remains in throws
  Command: grep -rn "ConvexError('Authentication required')" server/convex/ || true
  Expected: Empty output (zero matches).

Gate 8: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     CHAT-S04-R12 (Android instrumented E2E gate step 8 needs structured UNAUTHENTICATED), CHAT-S04-R13 (iOS mapper consumes fixture), CHAT-S04-R14 (Android mapper consumes fixture)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R03",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN errors.ts after change WHEN ERROR_CODES inspected THEN UNAUTHENTICATED and FORBIDDEN entries exist", "verify": "cd server && pnpm test -- errors", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN call to requireIdentity without identity WHEN it resolves THEN throws ConvexError with data.code === 'UNAUTHENTICATED'", "verify": "cd server && pnpm test -- guards", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN unauthenticated call to getActiveRoutePlansForSession WHEN handler runs THEN throws ConvexError data.code === 'UNAUTHENTICATED'", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN user A owns session S1 WHEN user B calls getActiveRoutePlansForSession({S1}) THEN throws ConvexError data.code === 'FORBIDDEN'", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN owner with 2 active plans WHEN they call getActiveRoutePlansForSession THEN returns array of 2 with statuses", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN existing requireIdentity callers WHEN full suite runs THEN no regression; freeform-string assertions updated to data.code", "verify": "cd server && pnpm test", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN mobile mapper alignment need WHEN repo built THEN __fixtures__/auth-error-taxonomy.json enumerates every ERROR_CODES with mobile_mapping_target", "verify": "cd server && pnpm test -- auth-error-taxonomy", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Assert ERROR_CODES.UNAUTHENTICATED and ERROR_CODES.FORBIDDEN string values", "maps_to_ac": "AC-1", "verify": "cd server && pnpm test -- errors", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "requireIdentity without auth throws ConvexError with data.code UNAUTHENTICATED", "maps_to_ac": "AC-2", "verify": "cd server && pnpm test -- guards", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "getActiveRoutePlansForSession unauth → ConvexError UNAUTHENTICATED", "maps_to_ac": "AC-3", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "getActiveRoutePlansForSession cross-user → ConvexError FORBIDDEN (IDOR closed)", "maps_to_ac": "AC-4", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "Owner 2 active plans → returns 2 rows with statuses", "maps_to_ac": "AC-5", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "Full suite regression; legacy assertions updated", "maps_to_ac": "AC-6", "verify": "cd server && pnpm test", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-7", "type": "test_criterion", "description": "Fixture JSON valid + covers all codes with mobile_mapping_target", "maps_to_ac": "AC-7", "verify": "cd server && pnpm test -- auth-error-taxonomy", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
