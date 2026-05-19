# FIX-S08-CVX-T02 — Convex: skip planning row for conversational responses (lazy init)

> **Task ID:** FIX-S08-CVX-T02 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** convex-implementer · **Estimate:** 60 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P1 · **Effort:** S
> **PRD Refs:** UC-CHAT-02, red-hat review 2026-05-19 finding F11

## Background

Red-hat review found that `server/convex/actions/agent/sendMessage.ts:451-455` creates a `kind='planning'` row UNCONDITIONALLY for every agent invocation via `planningEmitter.init()` at line 455. When the orchestrator replies conversationally (greeting, clarification, off-topic) without calling any tools, the row is still created at `status='streaming', phase='parsing'` and then `planningEmitter.done()` (line 609) finalizes it. The iOS client sees `.parsing → .finalizing` flicker on greetings.

Fix: convert `planningEmitter` to lazy initialization — defer `createPendingAssistantMessage` until the FIRST tool event fires (`toolPending` / `toolComplete` / `agentComplete`). If `done()` is reached without any events, do nothing. This preserves the planning row as a signal of *actual* planning activity.

## Critical Constraints

**MUST:**
- Move `init()` execution from explicit construction-time call to a lazy `ensureInit()` invocation inside `toolPending`, `toolComplete`, `agentComplete`, and `updateThinking` (the existing `ensureInit` private method is already structured for this — just remove the eager `init()` call from `sendMessage.ts`)
- `done()` must remain a no-op when `messageId === null` (already implemented at `planningEvents.ts:218-221`)
- Preserve all existing tests in `planningIntegration.test.ts` that DO call tools — they must still see a planning row
- Add a test verifying that an agent invocation with zero tool events produces zero `kind='planning'` rows in the message list

**NEVER:**
- Create the planning row from `updateThinking` BEFORE any tool event — thinking text without tool calls is still conversational; keep lazy-init gated to actual tool/agent events
- Touch iOS code

**STRICTLY:**
- The fix must not regress the case where an error throws between `init()` and the first tool event — verify that `finalizeFail` in `sendMessage.ts` handles a null planning row gracefully

## Specification

**Objective:** Eliminate the spurious `kind='planning'` row created when the agent replies conversationally without calling tools.

**Success State:** A unit test invoking the agent with a prompt that triggers a direct text response (no tool calls) results in zero rows of `kind='planning'` in `session_messages`. The existing planning-flow integration tests still pass.

## Acceptance Criteria

### AC-1 — Eager `init()` call removed from sendMessage.ts
**GIVEN** `server/convex/actions/agent/sendMessage.ts`
**WHEN** the file is grep'd for `planningEmitter.init()`
**THEN** zero direct call sites exist; the only references are within `planningEvents.ts` `ensureInit()` private helper
**Verify:** `grep -n "planningEmitter.init()" server/convex/actions/agent/sendMessage.ts` returns nothing

### AC-2 — Conversational invocation creates no planning row
**GIVEN** a test invocation of `sendMessage` with a prompt that the agent answers directly (mocked to return text without tool calls)
**WHEN** the action completes
**THEN** zero `kind='planning'` rows exist in `session_messages` for that session
**Verify:** `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "no planning row for conversational reply"`

### AC-3 — Tool-invoking flow still creates the row
**GIVEN** a test invocation of `sendMessage` with a prompt that triggers `routing_agent` and `geocode`
**WHEN** the action completes
**THEN** exactly one `kind='planning'` row exists with `status='complete'` and a non-empty `content.events` array
**Verify:** `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "planning row created on tool call"` (existing test, must still pass)

### AC-4 — Error path handles null planning row
**GIVEN** a test where the agent throws between construction and first tool event
**WHEN** `finalizeFail` runs
**THEN** no Convex error is logged; no orphan planning row is created
**Verify:** `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "lazy init handles error before first tool"`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | `planningEmitter.init()` is not called directly from sendMessage.ts | AC-1 | edge |
| TC-2 | Conversational reply produces zero planning rows | AC-2 | edge |
| TC-3 | Tool-invoking reply produces exactly one planning row | AC-3 | happy_path |
| TC-4 | Error before first tool event does not create orphan row | AC-4 | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `server/convex/actions/agent/sendMessage.ts` | 450-475, 605-615 | Eager init call + done() call sites |
| `server/convex/actions/agent/lib/planningEvents.ts` | 70-90, 218-240 | `ensureInit` + `done` |
| `server/convex/actions/agent/__tests__/planningIntegration.test.ts` | all | Existing tests to preserve + new tests to add |

## Guardrails

**Write-Allowed:**
- `server/convex/actions/agent/sendMessage.ts` (MODIFY — remove eager init call)
- `server/convex/actions/agent/lib/planningEvents.ts` (MODIFY only if `ensureInit` needs an order tweak)
- `server/convex/actions/agent/__tests__/planningIntegration.test.ts` (MODIFY — add new tests)

**Write-Prohibited:**
- `ios/**`, `android/**`, `react-native/**`
- Convex schema (`server/convex/schema.ts`)

## Design

**References:** red-hat review 2026-05-19 finding F11

**Pattern:** Existing `ensureInit` private method on `PlanningEventEmitter` — it's already lazy; the constructor's eager `init()` call is the only thing forcing eager creation

**Anti-Pattern:** Creating a state record for an event that never occurred (semantic stub)

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -n "planningEmitter.init()" server/convex/actions/agent/sendMessage.ts` |
| AC-2 | `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "no planning row for conversational reply"` |
| AC-3 | `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "planning row created on tool call"` |
| AC-4 | `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "lazy init handles error before first tool"` |
| typecheck | `pnpm server:codegen && pnpm --filter @laneshadow/server type-check` |

## Agent Assignment

**Agent:** convex-implementer
**Rationale:** Minimal backend mutation; one call-site removal + tests.

## Coding Standards

- `brain/docs/coding-standards/typescript.md`
- `server/convex/CLAUDE.md`

## Dependencies

**Depends on:** —
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Eager planningEmitter.init() removed from sendMessage.ts", "verify": "grep -n 'planningEmitter.init()' server/convex/actions/agent/sendMessage.ts returns empty", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Conversational reply produces zero planning rows", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'no planning row for conversational reply'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Tool-invoking reply produces exactly one planning row", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'planning row created on tool call'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Error before first tool event does not create orphan row", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'lazy init handles error before first tool'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "planningEmitter.init() not called directly from sendMessage.ts", "verify": "grep -n 'planningEmitter.init()' server/convex/actions/agent/sendMessage.ts", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Zero planning rows for conversational reply", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'no planning row for conversational reply'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "One planning row for tool-invoking reply", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'planning row created on tool call'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Error before first tool does not orphan row", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'lazy init handles error before first tool'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" }
  ]
}
-->
