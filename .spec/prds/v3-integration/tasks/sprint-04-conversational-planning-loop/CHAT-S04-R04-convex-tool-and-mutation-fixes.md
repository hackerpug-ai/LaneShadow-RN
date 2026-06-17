================================================================================
TASK: CHAT-S04-R04 - Remove fetchWeather LLM tool stub + fix updateSessionTitle ownership bug
================================================================================

TASK_TYPE:  BUGFIX
STATUS:     Done
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=convex-implementer | reviewer=convex-reviewer

RUNTIME_COMMANDS:
  test:      cd server && pnpm test
  typecheck: pnpm type-check:native
  lint:      pnpm exec biome check --no-errors-on-unmatched convex/actions/agent/ convex/db/planningSessions.ts
  build:     pnpm --dir server run convex:dev -- --once

PROGRESS: 0/6 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`fetchWeather` is no longer exposed to the LLM as a callable tool (enrichment pipeline owns weather server-side); `updateSessionTitle` correctly verifies ownership using the session doc's `clerkUserId` so agent-driven title patches succeed.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST remove `fetchWeather` from the LLM tool registration in `convex/actions/agent/`
- MUST update the `TOOL_TO_CARD_KIND` comment in `sendMessage.ts` to reflect removal
- MUST fix `updateSessionTitle` in `planningSessions.ts:278-294` to read the session doc first and pass the doc's actual `clerkUserId` to `updateSessionTitleHandler` (NOT the empty string `''`)
- MUST preserve `internalMutation` status of `updateSessionTitle`
- NEVER re-implement fetchWeather as a real tool (scope is removal — enrichment pipeline owns weather)
- NEVER convert `updateSessionTitle` to a public mutation
- NEVER skip ownership verification — fix the wrong arg, don't remove the check
- STRICTLY after removal, no code path may register fetchWeather as a callable LLM tool — verify by grep
- STRICTLY after fix, `updateSessionTitle` must succeed for the session's actual owner and reject (`SESSION_NOT_FOUND`) when no doc found

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] fetchWeather removed from agent tool registry (AC-1 PRIMARY)
- [ ] TOOL_TO_CARD_KIND comment updated (AC-2)
- [ ] Repo grep confirms no remaining fetchWeather tool registration (AC-3)
- [ ] updateSessionTitle reads session doc and uses real clerkUserId (AC-4)
- [ ] updateSessionTitle successfully patches title for valid session (AC-5)
- [ ] updateSessionTitle throws SESSION_NOT_FOUND for unknown sessionId (AC-6)
- [ ] `cd server && pnpm test` passes
- [ ] No remaining `clerkUserId: ''` literal in planningSessions.ts

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: fetchWeather removed from agent tool registry [PRIMARY]
  GIVEN: The agent runtime is initialized
  WHEN:  The available tools list is enumerated
  THEN:  `fetchWeather` is not present in the tool registry / schema; LLM cannot call it

  TDD_STATE:     none
  TEST_FILE:     convex/actions/agent/agents/orchestrator.test.ts
  TEST_FUNCTION: fetchWeather is not exposed as a callable tool

AC-2: TOOL_TO_CARD_KIND comment updated
  GIVEN: convex/actions/agent/sendMessage.ts is read
  WHEN:  The TOOL_TO_CARD_KIND map and its preceding comment are inspected
  THEN:  The comment no longer references `fetchWeather` as a placeholder stub; the comment accurately describes only remaining exclusions

  TDD_STATE:     none
  TEST_FILE:     convex/actions/agent/sendMessage.ts
  TEST_FUNCTION: code review — biome confirms file shape

AC-3: Repo grep confirms no remaining fetchWeather tool registration
  GIVEN: The repo source is searched
  WHEN:  `grep -rn 'fetchWeather' convex/actions/agent/` is run
  THEN:  No matches remain that register fetchWeather as a tool

  TDD_STATE:     none
  TEST_FILE:     n/a (shell grep)
  TEST_FUNCTION: grep verification

AC-4: updateSessionTitle reads session doc and uses real clerkUserId
  GIVEN: convex/db/planningSessions.ts updateSessionTitle wrapper is read
  WHEN:  The handler is inspected
  THEN:  It reads the session doc via `ctx.db.get(args.sessionId)`, passes `doc.clerkUserId` (not `''`) to `updateSessionTitleHandler`, and throws `ERROR_CODES.SESSION_NOT_FOUND` if the doc is null

  TDD_STATE:     none
  TEST_FILE:     convex/db/planningSessions.test.ts
  TEST_FUNCTION: updateSessionTitle uses session's actual clerkUserId

AC-5: updateSessionTitle successfully patches title for valid session
  GIVEN: A planning_session exists with clerkUserId='userA' and title='Original'
  WHEN:  An internal caller invokes `internal.db.planningSessions.updateSessionTitle({ sessionId, title: 'New Title' })`
  THEN:  The session doc is patched: `title === 'New Title'` and `updatedAt` is updated; no error thrown

  TDD_STATE:     none
  TEST_FILE:     convex/db/planningSessions.test.ts
  TEST_FUNCTION: updateSessionTitle patches title successfully

AC-6: updateSessionTitle throws SESSION_NOT_FOUND for unknown sessionId
  GIVEN: No planning_session exists for the given sessionId
  WHEN:  An internal caller invokes `updateSessionTitle({ sessionId: <stale>, title: 'X' })`
  THEN:  It throws ConvexError with the SESSION_NOT_FOUND error code

  TDD_STATE:     none
  TEST_FILE:     convex/db/planningSessions.test.ts
  TEST_FUNCTION: updateSessionTitle throws SESSION_NOT_FOUND for unknown session

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Type |
|-----|-----------|---------|------|
| TC-1 | Vitest: introspect tool list returned by agent's getAvailableTools; assert array does NOT contain 'fetchWeather' | AC-1 | happy_path |
| TC-2 | Static check: comment in sendMessage.ts no longer references fetchWeather as 'placeholder stub' | AC-2 | happy_path |
| TC-3 | Shell grep: `name: 'fetchWeather'` does not appear in convex/actions/agent/ tool definitions | AC-3 | happy_path |
| TC-4 | Static check: read planningSessions.ts updateSessionTitle handler; confirm reads doc, passes doc.clerkUserId, throws SESSION_NOT_FOUND when null | AC-4 | happy_path |
| TC-5 | convex-test: insert session userA title 'Original'; call updateSessionTitle; assert title patched and updatedAt > original | AC-5 | happy_path |
| TC-6 | convex-test: call updateSessionTitle with non-existent sessionId; catch ConvexError; assert SESSION_NOT_FOUND | AC-6 | edge_case |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- convex/actions/agent/sendMessage.ts (MODIFY — update TOOL_TO_CARD_KIND comment)
- convex/actions/agent/agents/orchestrator.ts (MODIFY — remove fetchWeather from tool registration)
- convex/actions/agent/tools/** (MODIFY OR DELETE — remove fetchWeather tool definition file if it exists)
- convex/db/planningSessions.ts (MODIFY — fix updateSessionTitle wrapper)
- convex/db/planningSessions.test.ts (MODIFY OR CREATE — add tests AC-4..AC-6)
- convex/actions/agent/agents/orchestrator.test.ts (CREATE OR MODIFY — assert fetchWeather absent)

writeProhibited:
- convex/_generated/** — auto-generated
- Implementing fetchWeather with real data — explicitly out of scope
- ios/** + android/** — mobile callers out of scope
- convex/guards.ts — reserved for CHAT-S04-R03
- convex/errors.ts — reserved for CHAT-S04-R03
- Other agent tools (planRoute, compileSketch, etc.)

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `ctx.db.get` to fetch session doc before operating on it
- Throw structured ConvexError with ERROR_CODES.SESSION_NOT_FOUND
- Audit `runMutation` call sites if updateSessionTitle was previously throwing silently

⚠️ Ask First:
- Removing other agent tools beyond fetchWeather
- Re-implementing fetchWeather (out of scope per recommendation)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- convex/actions/agent/* (MODIFY): remove fetchWeather tool registration
- convex/db/planningSessions.ts (MODIFY): fix updateSessionTitle ownership bug
- convex/db/planningSessions.test.ts (MODIFY/CREATE): tests AC-4..AC-6
- convex/actions/agent/agents/orchestrator.test.ts (CREATE/MODIFY): tool list assertion

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
- READ: AC, current handler at planningSessions.ts:278-294 + sendMessage.ts:19-28
- WRITE: ONE test exercising GIVEN-WHEN-THEN
- RUN: `cd server && pnpm test -- <suite>`
- VERIFY: Test FAILS

### GREEN PHASE
- WRITE: minimal fix
- RUN: `cd server && pnpm test -- <suite>`
- VERIFY: Test PASSES

### REFACTOR PHASE
- READ: full file
- RUN: full suite
- VERIFY: still green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. convex/actions/agent/sendMessage.ts [PRIMARY PATTERN]
   - Lines: 1-60
   - Focus: TOOL_TO_CARD_KIND mapping + comment block calling out fetchWeather as placeholder stub

2. convex/actions/agent/agents/orchestrator.ts
   - Lines: 1-100
   - Focus: Tool availability dispatcher — locate where fetchWeather is registered

3. convex/db/planningSessions.ts
   - Lines: 147-294
   - Focus: updateSessionTitleHandler (147-161) + updateSessionTitle wrapper (278-294) — bug at line 290

4. convex/errors.ts
   - Lines: 1-29
   - Focus: SESSION_NOT_FOUND code reuse

5. .spec/reviews/red-hat-sprint-04-2026-05-03T14-19-50Z.md
   - Lines: F-11 + F-12 sections
   - Focus: Root cause descriptions

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase evidence
  Required: TDD_STATE values show each test went red before green.

Gate 2: Each AC has a test (or grep verification)
  Verify: Test file contains one test per AC (AC-3 may use shell grep gate).

Gate 3: All Vitest tests pass
  Command: cd server && pnpm test
  Expected: Exit 0; new updateSessionTitle + tool-list tests visible.

Gate 4: Convex build clean
  Command: pnpm --dir server run convex:dev -- --once
  Expected: Exit 0.

Gate 5: Typecheck clean
  Command: pnpm type-check:native
  Expected: Exit 0.

Gate 6: Biome lint clean
  Command: pnpm exec biome check --no-errors-on-unmatched convex/actions/agent/ convex/db/planningSessions.ts
  Expected: Exit 0.

Gate 7: fetchWeather tool no longer registered
  Command: test -z "$(grep -rn \"name: 'fetchWeather'\" convex/actions/agent/ 2>/dev/null)"
  Expected: Exit 0 (no matches).

Gate 8: No remaining `clerkUserId: ''` literal in planningSessions.ts
  Command: test -z "$(grep -n \"clerkUserId: ''\" convex/db/planningSessions.ts)"
  Expected: Exit 0 (zero matches).

Gate 9: Scope compliance
  Command: git diff --name-only
  Expected: Only SCOPE.writeAllowed files modified.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none)
Blocks:     (none — independent fix)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "CHAT-S04-R04",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN agent runtime initialized WHEN tool list enumerated THEN fetchWeather not present", "verify": "cd server && pnpm test -- agent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN sendMessage.ts read WHEN TOOL_TO_CARD_KIND comment inspected THEN no longer references fetchWeather as placeholder stub", "verify": "pnpm exec biome check --no-errors-on-unmatched convex/actions/agent/sendMessage.ts", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN repo searched WHEN grep for fetchWeather tool registration THEN no matches in tool defs", "verify": "test -z \"$(grep -rn \\\"name: 'fetchWeather'\\\" convex/actions/agent/ 2>/dev/null)\"", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN planningSessions.ts updateSessionTitle WHEN inspected THEN reads doc, uses doc.clerkUserId, throws SESSION_NOT_FOUND when null", "verify": "cd server && pnpm test -- planningSessions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN session userA title 'Original' WHEN updateSessionTitle invoked with new title THEN doc title patched and updatedAt updated; no error", "verify": "cd server && pnpm test -- planningSessions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN no session exists for sessionId WHEN updateSessionTitle called THEN throws ConvexError SESSION_NOT_FOUND", "verify": "cd server && pnpm test -- planningSessions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-1", "type": "test_criterion", "description": "Tool list does not contain 'fetchWeather'", "maps_to_ac": "AC-1", "verify": "cd server && pnpm test -- agent", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-2", "type": "test_criterion", "description": "Comment in sendMessage.ts updated post-removal", "maps_to_ac": "AC-2", "verify": "pnpm exec biome check --no-errors-on-unmatched convex/actions/agent/sendMessage.ts", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-3", "type": "test_criterion", "description": "Grep finds no fetchWeather tool definition", "maps_to_ac": "AC-3", "verify": "test -z \"$(grep -rn \\\"name: 'fetchWeather'\\\" convex/actions/agent/ 2>/dev/null)\"", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-4", "type": "test_criterion", "description": "updateSessionTitle reads doc + uses doc.clerkUserId", "maps_to_ac": "AC-4", "verify": "cd server && pnpm test -- planningSessions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-5", "type": "test_criterion", "description": "updateSessionTitle patches title for valid session", "maps_to_ac": "AC-5", "verify": "cd server && pnpm test -- planningSessions", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "TC-6", "type": "test_criterion", "description": "updateSessionTitle throws SESSION_NOT_FOUND for unknown id", "maps_to_ac": "AC-6", "verify": "cd server && pnpm test -- planningSessions", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
