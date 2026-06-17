================================================================================
TASK: CHAT-S04-R17 - Emit auth-error-taxonomy.json fixture (R03 AC-7 completion)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     XS
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      cd server && pnpm test -- auth-error-taxonomy
  typecheck: pnpm type-check:native
  build:     pnpm --dir server run convex:dev -- --once

PROGRESS: 0/3 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`convex/__fixtures__/auth-error-taxonomy.json` exists and enumerates every ERROR_CODES value with `{ code, description, mobile_mapping_target }` so iOS (R13) and Android (R14) mapper tasks have a machine-readable contract.

--------------------------------------------------------------------------------
SOURCE
--------------------------------------------------------------------------------

Finding RF-07 from red-hat round-2 review (2026-05-03T21:43:36Z):
- R03 was merged with AC-1 through AC-6 passing, but AC-7 (fixture emission) was not completed
- The fixture file `convex/__fixtures__/auth-error-taxonomy.json` does not exist
- R13 (iOS mapper) and R14 (Android mapper) are blocked until this fixture exists

This is the remaining work from R03 AC-7, scoped into its own task for clean execution.

--------------------------------------------------------------------------------
CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST create `convex/__fixtures__/auth-error-taxonomy.json`
- MUST enumerate every ERROR_CODES value from `convex/errors.ts`
- Each entry MUST have: `{ code: string, description: string, mobile_mapping_target: string }`
- UNAUTHENTICATED → `Unauthenticated`, FORBIDDEN → `Forbidden` (matching mobile sealed class / enum names)
- MUST include a validation test that fails if a new ERROR_CODE is added without updating the fixture
- NEVER hardcode mobile mapping targets that don't match actual mobile enum/sealed class names

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] auth-error-taxonomy.json exists with all ERROR_CODES entries (AC-1)
- [ ] Validation test passes (AC-2)
- [ ] UNAUTHENTICATED maps to Unauthenticated, FORBIDDEN maps to Forbidden (AC-3)
- [ ] `cd server && pnpm test -- auth-error-taxonomy` passes

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Fixture file exists with all ERROR_CODES entries
  GIVEN: convex/errors.ts defines ERROR_CODES
  WHEN:  auth-error-taxonomy.json is read
  THEN:  It contains one entry per ERROR_CODES key with non-empty code, description, and mobile_mapping_target

AC-2: Validation test passes
  GIVEN: A new ERROR_CODES entry is added to errors.ts
  WHEN:  The validation test runs
  THEN:  It fails if the fixture is missing the new entry (catches drift)

AC-3: Mobile mapping targets match mobile code
  GIVEN: iOS has LaneShadowError.unauthenticated / .forbidden; Android has Unauthenticated / Forbidden
  WHEN:  Fixture entries are read
  THEN:  UNAUTHENTICATED.mobile_mapping_target === "Unauthenticated" and FORBIDDEN.mobile_mapping_target === "Forbidden"

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- convex/__fixtures__/auth-error-taxonomy.json (CREATE)
- convex/__fixtures__/auth-error-taxonomy.test.ts (CREATE)

writeProhibited:
- convex/errors.ts — already merged in R03
- convex/guards.ts — already merged in R03
- ios/** + android/** — mobile mappers are R13/R14

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: CHAT-S04-R03 (merged — ERROR_CODES with UNAUTHENTICATED + FORBIDDEN)
Blocks:     CHAT-S04-R13 (iOS mapper consumes fixture), CHAT-S04-R14 (Android mapper consumes fixture)

================================================================================
