================================================================================
TASK: CHAT-S04-R18 - Add explicit return validators to high-traffic Convex queries
================================================================================

TASK_TYPE:  REFACTOR
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     XS
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      cd server && pnpm test -- routePlans && pnpm test -- sessionMessages
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched convex/
  build:     pnpm --dir server run convex:dev -- --once

PROGRESS: 0/2 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Replace `v.any()` return validators on `routePlans.getPlanById` and `sessionMessages.list` with explicit shape validators so backend shape changes break consumers at the type boundary instead of silently.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace `returns: v.any()` with explicit `v.object({...})` on both queries
- MUST match the actual document shapes returned by these queries (inspect existing tests or Convex dashboard)
- NEVER break existing mobile consumers — the validator must be a superset of what iOS/Android actually read
- STRICTLY these are the two highest-traffic mobile subscriptions — any shape mismatch breaks the app silently

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `routePlans.getPlanById` has explicit returns validator (AC-1 PRIMARY)
- [ ] `sessionMessages.list` has explicit returns validator (AC-2)
- [ ] cd server && pnpm test passes
- [ ] Convex build clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: routePlans.getPlanById returns validator is explicit [PRIMARY]
  GIVEN: `convex/db/routePlans.ts` is loaded
  WHEN:  The `getPlanById` query's `returns` field is inspected
  THEN:  It is `v.object({...})` with explicit field validators (no `v.any()`) matching the routePlans document shape

  TDD_STATE:     none
  TEST_FILE:     convex/db/routePlans.test.ts
  TEST_FUNCTION: getPlanById_returns_validator_is_explicit

AC-2: sessionMessages.list returns validator is explicit
  GIVEN: `convex/db/sessionMessages.ts` is loaded
  WHEN:  The `list` query's `returns` field is inspected
  THEN:  It is `v.array(v.object({...}))` with explicit field validators (no `v.any()`) matching the sessionMessages document shape

  TDD_STATE:     none
  TEST_FILE:     convex/db/sessionMessages.test.ts
  TEST_FUNCTION: list_returns_validator_is_explicit

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Unit test asserts getPlanById returns validator is v.object with no v.any() | AC-1 | happy_path |
| TC-2 | Unit test asserts sessionMessages.list returns validator is v.array(v.object) with no v.any() | AC-2 | happy_path |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- convex/db/routePlans.ts (MODIFY — replace v.any() returns)
- convex/db/sessionMessages.ts (MODIFY — replace v.any() returns)
- convex/db/routePlans.test.ts (MODIFY — add validator assertion)
- convex/db/sessionMessages.test.ts (MODIFY — add validator assertion)

writeProhibited:
- convex/_generated/** — auto-generated
- ios/** + android/** — mobile consumers out of scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use explicit v.object with field validators matching document shape
- Run full test suite to catch any consumer breakage
- Check Convex codegen to ensure the new validators are accepted

⚠️ Ask First:
- Adding new fields to the validator that don't exist in the document yet

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- convex/db/routePlans.ts (MODIFY): explicit returns validator on getPlanById
- convex/db/sessionMessages.ts (MODIFY): explicit returns validator on list
- convex/db/routePlans.test.ts (MODIFY): validator assertion test
- convex/db/sessionMessages.test.ts (MODIFY): validator assertion test

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

### RED PHASE
- READ: AC, current getPlanById and list query definitions
- WRITE: ONE test asserting returns validator is not v.any()
- RUN: cd server && pnpm test -- routePlans && pnpm test -- sessionMessages
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: explicit return validators
- RUN: cd server && pnpm test
- VERIFY: Test PASSES

### REFACTOR PHASE
- RUN: pnpm --dir server run convex:dev -- --once
- VERIFY: Convex accepts the new validators

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. convex/db/routePlans.ts [PRIMARY]
   - Lines: ~285 (getPlanById)
   - Focus: current returns: v.any() and the document shape it actually returns

2. convex/db/sessionMessages.ts
   - Lines: ~412 (list)
   - Focus: current returns: v.any() and the document shape it actually returns

3. convex/schema.ts
   - Lines: routePlans and sessionMessages table definitions
   - Focus: Document shape source of truth

4. .spec/reviews/red-hat-sprint-04-round3-2026-05-03T22-15-00Z.md
   - Lines: RF-29
   - Focus: Finding that flagged this gap

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: No v.any() remains on either query
  Command: grep -n "v.any()" convex/db/routePlans.ts convex/db/sessionMessages.ts
  Expected: Empty output.

Gate 3: All Vitest tests pass
  Command: cd server && pnpm test
  Expected: Exit 0.

Gate 4: Convex build clean
  Command: pnpm --dir server run convex:dev -- --once
  Expected: Exit 0.

Gate 5: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     Sprint closure (type safety on highest-traffic subscriptions)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R18",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "routePlans.getPlanById has explicit returns validator (no v.any())", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "sessionMessages.list has explicit returns validator (no v.any())", "verify": "cd server && pnpm test -- sessionMessages", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Unit test asserts getPlanById returns validator is explicit", "maps_to_ac": "AC-1", "verify": "cd server && pnpm test -- routePlans", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Unit test asserts sessionMessages.list returns validator is explicit", "maps_to_ac": "AC-2", "verify": "cd server && pnpm test -- sessionMessages", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
