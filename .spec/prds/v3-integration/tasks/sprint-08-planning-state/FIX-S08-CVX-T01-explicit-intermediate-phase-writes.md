# FIX-S08-CVX-T01 — Convex: explicit intermediate phase writes on tool events

> **Task ID:** FIX-S08-CVX-T01 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** convex-implementer · **Estimate:** 90 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** M
> **PRD Refs:** UC-CHAT-02, red-hat review 2026-05-19 findings F1/F2/F3/F4

## Background

Red-hat review 2026-05-19 (`.spec/reviews/red-hat-20260519T024631Z-planning-state.md`) identified the root cause of the user-reported bug ("I see the card, but the state doesn't change"): the `planning` row's `phase` field is only ever written to `PARSING` (at creation, `server/convex/db/sessionMessages.ts:217`) and `FINALIZING` (at completion, `sessionMessages.ts:246`). The intermediate values `SEARCHING`, `DRAFTING`, `ENRICHING` come only via `derivePlanningPhase` recomputation inside `updatePlanningContent`. That derive reads `message.thinkingSteps` first — but `thinkingSteps` is only written to `thinking_card` rows, never to the `planning` row. The fallback to content-event derivation works only when the LLM calls a sub-agent. For conversational responses or fast tool sequences, the phase observably stays at `parsing` then snaps to `finalizing`.

Additionally, `ENRICHING_TOOL_NAMES` at `server/models/session-messages.ts:107` contains `'fetchWeather'` — no backend tool emits that name. The real weather tool is `getRouteWeather`. Same in `iOS` (handled by FIX-S08-IOS-T01).

The chosen fix path (red-hat report Option C) is to write intermediate phase values to the `phase` field as tool events fire, independent of `thinkingSteps` derivation. The `PlanningEventEmitter` already mediates every tool event; this task wires phase writes into that emitter so the row's `phase` field reliably reflects pipeline progression.

## Critical Constraints

**MUST:**
- Patch `server/models/session-messages.ts` `ENRICHING_TOOL_NAMES` to replace `'fetchWeather'` with `'getRouteWeather'` (the real tool name registered in `server/convex/actions/agent/tools/getRouteWeather.ts`)
- In `server/convex/actions/agent/lib/planningEvents.ts`, after each `toolPending` and `toolComplete` event, compute the corresponding `PlanningPhase` using `derivePlanningPhaseFromToolName` and pass it to `updatePlanningContent` so the patch sets `phase` explicitly per-event (do not rely solely on `derivePlanningPhase` reading the content blob)
- After `agentComplete` for the routing/orchestrator sub-agent, ensure the phase is `FINALIZING`
- Preserve the existing content-event JSON shape; this task adds phase writes, it does NOT change the event payload contract

**NEVER:**
- Write phase values from human-readable text or status-line strings
- Bypass `updatePlanningContent` or introduce a parallel phase mutation — keep the patch site single
- Touch iOS code (`PlanningPhase.swift` is owned by FIX-S08-IOS-T01)
- Add new tool names that the agent registry doesn't actually emit

**STRICTLY:**
- The phase write must be idempotent — replaying an event must not move phase backward (e.g., once `DRAFTING` is observed, a stale `SEARCHING` tool_pending must not overwrite it)
- Phase progression MUST be monotone: PARSING → SEARCHING → DRAFTING → ENRICHING → FINALIZING

## Specification

**Objective:** Make the `planning` row's `phase` field a reliable, monotone source of truth for pipeline progression that iOS can trust without scanning `thinkingSteps` or content events.

**Success State:** Running an end-to-end planning request on a real Convex dev deployment produces a `session_messages` row of `kind='planning'` whose `phase` field transitions through `parsing → searching → drafting → enriching → finalizing` as tool events fire — observable via Convex dashboard or `mcp__convex__data` query of the planning row at each tick.

## Acceptance Criteria

### AC-1 — Tool-name mapping is corrected
**GIVEN** `server/models/session-messages.ts`
**WHEN** `ENRICHING_TOOL_NAMES` is inspected
**THEN** it contains `'getRouteWeather'` and does NOT contain `'fetchWeather'`
**Verify:** `grep -E "ENRICHING_TOOL_NAMES" -A 6 server/models/session-messages.ts | grep -E "'fetchWeather'|'getRouteWeather'"`

### AC-2 — Each tool event writes phase explicitly
**GIVEN** `PlanningEventEmitter` with a mock `runMutation`
**WHEN** `toolPending('geocode', 'routing')` is called
**THEN** the mock receives a call to `updatePlanningContent` whose patch includes `phase: 'searching'`
**AND WHEN** `toolPending('createRouteSketch', 'routing')` is called next
**THEN** the patch includes `phase: 'drafting'`
**AND WHEN** `agentComplete('routing', ...)` is called next
**THEN** the patch includes `phase: 'finalizing'`
**Verify:** `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "explicit phase writes"`

### AC-3 — Phase progression is monotone
**GIVEN** a `PlanningEventEmitter` that has already advanced to `'drafting'`
**WHEN** a stale `toolPending('geocode', 'routing')` event fires (out of order)
**THEN** the patch's `phase` value is `'drafting'` (the higher value), not `'searching'`
**Verify:** `pnpm --filter @laneshadow/server test -- planningEvents.test.ts -t "monotone phase"`

### AC-4 — End-to-end real planning run progresses through phases
**GIVEN** a real Convex dev deployment and a real iOS Simulator build
**WHEN** the rider sends "Plan a scenic 2-hour ride starting from San Francisco"
**THEN** querying the planning row via `mcp__convex__data --table session_messages --filter kind=planning` shows `phase` advancing through at least three intermediate values between `'parsing'` and `'finalizing'` over the run's duration
**Verify:** Run planning request, then `mcp__convex__data --table session_messages` between event ticks; record observations to `.tmp/FIX-S08-CVX-T01/ac-4-trace.json`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | `ENRICHING_TOOL_NAMES` contains `'getRouteWeather'` and not `'fetchWeather'` | AC-1 | edge |
| TC-2 | `toolPending('geocode', 'routing')` patch includes `phase: 'searching'` | AC-2 | happy_path |
| TC-3 | `toolPending('createRouteSketch', 'routing')` patch includes `phase: 'drafting'` | AC-2 | happy_path |
| TC-4 | `agentComplete('routing', ...)` patch includes `phase: 'finalizing'` | AC-2 | happy_path |
| TC-5 | Stale `toolPending('geocode', ...)` after `drafting` keeps `phase: 'drafting'` | AC-3 | edge |
| TC-6 | Live Convex run produces ≥3 intermediate phase values | AC-4 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `server/convex/actions/agent/lib/planningEvents.ts` | all | Emitter to patch — add phase writes in `toolPending`, `toolComplete`, `agentComplete` |
| `server/convex/db/sessionMessages.ts` | 217, 246, 401-470, 660-680 | `updatePlanningContent` patch site; existing PARSING/FINALIZING writes |
| `server/models/session-messages.ts` | 90-180 | `derivePlanningPhase*`, `*_TOOL_NAMES` sets, phase derivation contract |
| `server/convex/actions/agent/sendMessage.ts` | 450-475 | Where emitter is wired into `onSubToolPending/Complete/AgentComplete` |
| `server/convex/actions/agent/tools/getRouteWeather.ts` | 1-40 | Real tool name registration — confirm `getRouteWeather` is the correct ID |

## Guardrails

**Write-Allowed:**
- `server/convex/actions/agent/lib/planningEvents.ts` (MODIFY — add phase patch arg)
- `server/convex/db/sessionMessages.ts` (MODIFY — extend `updatePlanningContent` to accept optional `phase` arg with monotone-merge logic)
- `server/models/session-messages.ts` (MODIFY — fix `ENRICHING_TOOL_NAMES`)
- `server/convex/actions/agent/__tests__/planningIntegration.test.ts` (MODIFY — add explicit-phase-writes test)
- `server/models/__tests__/session-messages-planning-phase.test.ts` (MODIFY — add monotone-phase test)

**Write-Prohibited:**
- `ios/**`, `android/**`, `react-native/**`
- Any tool handler under `server/convex/actions/agent/tools/` (this task is signal-only, no tool changes)
- `server/convex/schema.ts` — phase field already exists on `session_messages`

## Design

**References:** `.spec/reviews/red-hat-20260519T024631Z-planning-state.md` Option C; UC-CHAT-02 phase-progression contract

**Pattern:** `server/convex/db/sessionMessages.ts:660-680` — existing `updatePlanningContent` patch site that derives phase from content; extend with an explicit-phase merge step

**Anti-Pattern:** Writing phase from human-readable strings (status lines) or from message content text; bypassing `updatePlanningContent` with a separate phase-only mutation

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -E "ENRICHING_TOOL_NAMES" -A 6 server/models/session-messages.ts` |
| AC-2 | `pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t "explicit phase writes"` |
| AC-3 | `pnpm --filter @laneshadow/server test -- planningEvents.test.ts -t "monotone phase"` |
| AC-4 | live trace recorded to `.tmp/FIX-S08-CVX-T01/ac-4-trace.json` |
| typecheck | `pnpm server:codegen && pnpm --filter @laneshadow/server type-check` |

## Agent Assignment

**Agent:** convex-implementer
**Rationale:** Pure Convex backend mutation + model file edit; TDD against existing planning integration tests.

## Coding Standards

- `brain/docs/coding-standards/typescript.md`
- `server/convex/CLAUDE.md`
- `server/convex/actions/agent/CLAUDE.md` (one agent, one task)

## Dependencies

**Depends on:** — (no upstream task)
**Blocks:** FIX-S08-IOS-T01 (iOS simplification depends on backend writing reliable phase values)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "ENRICHING_TOOL_NAMES contains 'getRouteWeather' and not 'fetchWeather'", "verify": "grep -E 'ENRICHING_TOOL_NAMES' -A 6 server/models/session-messages.ts", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN PlanningEventEmitter WHEN toolPending/agentComplete fire THEN updatePlanningContent receives explicit phase arg in patch", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'explicit phase writes'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Phase progression is monotone; stale events do not move phase backward", "verify": "pnpm --filter @laneshadow/server test -- planningEvents.test.ts -t 'monotone phase'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Live planning run shows >=3 intermediate phase values between parsing and finalizing", "verify": "live trace recorded to .tmp/FIX-S08-CVX-T01/ac-4-trace.json", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "ENRICHING_TOOL_NAMES contains getRouteWeather and not fetchWeather", "verify": "grep -E 'ENRICHING_TOOL_NAMES' -A 6 server/models/session-messages.ts", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "toolPending('geocode','routing') patch includes phase 'searching'", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'explicit phase writes'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "toolPending('createRouteSketch','routing') patch includes phase 'drafting'", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'explicit phase writes'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-4", "type": "test_criterion", "description": "agentComplete('routing',...) patch includes phase 'finalizing'", "verify": "pnpm --filter @laneshadow/server test -- planningIntegration.test.ts -t 'explicit phase writes'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-5", "type": "test_criterion", "description": "Stale toolPending after drafting keeps phase 'drafting'", "verify": "pnpm --filter @laneshadow/server test -- planningEvents.test.ts -t 'monotone phase'", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-6", "type": "test_criterion", "description": "Live Convex run produces >=3 intermediate phase values", "verify": "live trace recorded to .tmp/FIX-S08-CVX-T01/ac-4-trace.json", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" }
  ]
}
-->
