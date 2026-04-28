================================================================================
TASK: AUTH-S03-T01 - Backend additions — db.users.getCurrentUser public query
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Completed
PRIORITY:   P1
EFFORT:     XS
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      pnpm --dir server test
  typecheck: pnpm --dir server exec tsc --noEmit
  lint:      pnpm exec biome check server/

PROGRESS: 4/4 AC · complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Deploy db.users.getCurrentUser query and optional limit arg on db.sessionMessages.list to Convex dev.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use ctx.auth.getUserIdentity() to retrieve Clerk user ID
- MUST return null when user is not authenticated (not throw)
- MUST NOT expose sensitive fields (password reset tokens, etc.)
- STRICTLY follow existing query patterns in server/convex/users/ and server/convex/sessionMessages/
- NEVER commit generated files to git without running typecheck first

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] getCurrentUser query exists in server/convex/db/users.ts and returns user document or null
- [x] sessionMessages.list accepts optional limit arg with default 50
- [x] Deployed to Convex dev: pnpm --dir server run convex:dev -- --once succeeds
- [x] pnpm --dir server exec tsc --noEmit passes
- [x] Only SCOPE.writeAllowed files modified (git diff --name-only)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: getCurrentUser query returns authenticated user [PRIMARY]
  GIVEN: A user is authenticated via Clerk JWT
  WHEN:  Client calls db.users.getCurrentUser query
  THEN:  Query returns the user's document from the users table

  TDD_STATE:     none
  TEST_FILE:     server/convex/users.test.ts
  TEST_FUNCTION: test_getCurrentUser_returnsUserWhenAuthenticated

AC-2: getCurrentUser returns null when unauthenticated
  GIVEN: No user is authenticated (no valid Clerk JWT)
  WHEN:  Client calls db.users.getCurrentUser query
  THEN:  Query returns null without throwing

  TDD_STATE:     none
  TEST_FILE:     server/convex/users.test.ts
  TEST_FUNCTION: test_getCurrentUser_returnsNullWhenUnauthenticated

AC-3: sessionMessages.list accepts optional limit arg
  GIVEN: The db.sessionMessages.list query exists
  WHEN:  Client calls query with or without limit arg
  THEN:  Query respects limit if provided, otherwise uses default of 50

  TDD_STATE:     none
  TEST_FILE:     server/convex/sessionMessages.test.ts
  TEST_FUNCTION: test_listSessionMessages_respectsOptionalLimitArg

AC-4: Deployed to Convex dev environment
  GIVEN: Local Convex dev server is running
  WHEN:  Developer runs pnpm --dir server run convex:deploy -- dev
  THEN:  Functions deploy successfully and are queryable

  TDD_STATE:     none
  TEST_FILE:     null
  TEST_FUNCTION: null

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- server/convex/db/users.ts (MODIFY)
- server/convex/db/users.test.ts (MODIFY)
- server/convex/db/sessionMessages.ts (MODIFY)
- server/convex/db/__tests__/session/session.messages.test.ts (MODIFY)

writeProhibited:
- server/convex/auth.config.ts — Clerk JWT issuer already configured
- server/convex/_generated/ — generated files, run codegen instead

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Read existing query patterns in server/convex/users/ before implementing
- Use Convex's ctx.auth.getUserIdentity() for auth token extraction
- Run typecheck before committing changes

⚠️ Ask First:
- If Clerk JWT issuer is not already configured in server/convex/auth.config.ts
- If existing user table schema lacks expected fields

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- server/convex/db/users.ts (MODIFY): Public query returning authenticated user or null
- server/convex/db/sessionMessages.ts (MODIFY): Add optional limit arg with default 50

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ: Current AC definition, existing tests, code patterns
  WRITE: ONE test that exercises GIVEN-WHEN-THEN
  RUN: pnpm --dir server test -- {test_file}
  VERIFY: Test FAILS (not errors — fails)
  Never: Write ANY implementation code in RED phase.

### GREEN PHASE
  READ: Failing test, AC definition, code patterns
  WRITE: MINIMAL code to make test pass
  RUN: pnpm --dir server test -- {test_file}
  VERIFY: Test PASSES
  Never: Add features beyond the current AC.

### REFACTOR PHASE
  READ: Implementation just written
  WRITE: Improved code (if needed)
  RUN: pnpm --dir server test
  VERIFY: Tests still pass
  Never: Introduce new behavior in REFACTOR.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. server/convex/auth.config.ts [PRIMARY PATTERN]
   - Lines: 1-50
   - Focus: Clerk JWT issuer configuration

2. server/convex/users/
   - Focus: Existing query patterns for user table

3. server/convex/sessionMessages/
   - Focus: Existing list query to add limit arg

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test
  Verify: Test file contains one test per AC.

Gate 3: All tests pass
  Command: pnpm --dir server test
  Expected: Exit 0.

Gate 4: Type check
  Command: pnpm --dir server exec tsc --noEmit
  Expected: Exit 0.

Gate 5: Lint
  Command: pnpm exec biome check server/
  Expected: Exit 0.

Gate 6: Convex dev run once
  Command: pnpm --dir server run convex:dev -- --once
  Expected: Exit 0.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None
Blocks: AUTH-S03-T02, AUTH-S03-T03, AUTH-S03-T04

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "AUTH-S03-T01",
  "requirements": [
    {"id": "AC-1", "type": "acceptance", "description": "Query returns the user's document from the users table", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance", "description": "Query returns null without throwing", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance", "description": "Query respects limit if provided, otherwise uses default of 50", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance", "description": "Functions deploy successfully and are queryable", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test", "description": "getCurrentUser query returns user document when authenticated with valid Clerk JWT", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test", "description": "getCurrentUser query returns null when called without authentication", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test", "description": "sessionMessages.list query accepts optional limit argument with default value 50", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test", "description": "TypeScript compilation succeeds without errors", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
