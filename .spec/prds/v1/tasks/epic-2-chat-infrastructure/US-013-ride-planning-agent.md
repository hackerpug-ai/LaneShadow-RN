# Implement ridePlanningAgent with pi core and sendMessage action

> Status: COMPLETE (2026-04-04)

> Task ID: US-013
> Type: FEATURE
> Priority: P0
> Estimate: 240 minutes
> Assignee: pi-agent-implementer

## CRITICAL CONSTRAINTS

### MUST
- Create `ridePlanningAgent.ts` with 5 tools: planRoute, refineRoute, fetchWeather, saveRoute, searchFavorites
- Create `sendMessage.ts` as the single client entry point action
- Agent personality: concise, 2nd person, 1-2 sentences per response
- `planRoute` checks rate limit before calling orchestrator
- All errors converted to conversational messages (no raw error objects to client)
- Response persisted as system message via `addSystemMessage`

### NEVER
- Let the agent make deterministic decisions (state transitions, data persistence)
- Let the agent access the database directly — all DB access through tools
- Expose agent internals (tool names, error stack traces) to the rider

### STRICTLY
- Agent is probabilistic — all guaranteed actions (saving, state transitions) happen in deterministic orchestrator code
- Single `sendMessage` action is the only public entry point for clients

## SPECIFICATION

**Objective:** Create the agentic conversational interface for ride planning using pi core, with a `sendMessage` action that accepts rider text and returns a system response with optional route attachments.

**Success looks like:** A rider sends "scenic 2-hour ride to Santa Cruz" and receives 2-3 route options with names and descriptions. Refinements like "avoid Highway 1" trigger updated routes. Errors produce helpful conversational messages.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | First message in session | sendMessage called with ride request | planRoute tool called, routes returned | Integration test |
| 2 | Existing routes in session | "avoid Highway 1" sent | refineRoute tool called, updated routes | Integration test |
| 3 | Route generation fails | Error occurs in orchestrator | Conversational error message returned | Integration test |
| 4 | Rate limit exceeded | planRoute attempted | Upsell message returned conversationally | Integration test |
| 5 | Routes returned | Response persisted | System message with route attachment in DB | Integration test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | First message triggers planRoute and returns routes | AC-1 | Integration test passes | [ ] TRUE [ ] FALSE |
| 2 | Refinement request triggers refineRoute | AC-2 | Integration test passes | [ ] TRUE [ ] FALSE |
| 3 | Route generation failure produces conversational error | AC-3 | Integration test passes | [ ] TRUE [ ] FALSE |
| 4 | Rate limit produces upsell message | AC-4 | Integration test passes | [ ] TRUE [ ] FALSE |
| 5 | Response persisted as system message with attachments | AC-5 | Integration test passes | [ ] TRUE [ ] FALSE |
| 6 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `convex/actions/agent/ridePlanningAgent.ts` (NEW)
- `convex/actions/agent/sendMessage.ts` (NEW)
- `convex/actions/agent/__tests__/ridePlanningAgent.test.ts` (NEW)
- `convex/actions/agent/__tests__/sendMessage.test.ts` (NEW)

### WRITE-PROHIBITED
- `convex/actions/agent/planRide.ts` (existing orchestrator entry point)
- `convex/actions/agent/lib/planRideOrchestrator.ts` (deterministic pipeline)

## DESIGN

### References
- PRD UC-AG-01, UC-AG-02, UC-AG-06, UC-AG-07, UC-AG-11
- PRD 07-technical-backend.md §3 — Agent Architecture
- `convex/actions/agent/planRide.ts` — existing orchestrator to call from planRoute tool

### Code Pattern
```typescript
// sendMessage.ts — single entry point
'use node';
export const sendMessage = action({
  args: { sessionId: v.id('planning_sessions'), content: v.string() },
  handler: async (ctx, args) => {
    // 1. Validate session ownership
    // 2. Persist rider message
    // 3. Run agent with session context
    // 4. Persist system response (deterministic)
    // 5. Return response to client
  },
});

// ridePlanningAgent.ts — agent definition
const ridePlanningAgent = createAgent({
  model: openai(AI_MODEL),
  system: `You are a motorcycle ride planning assistant. Be concise — 1-2 sentences. Use 2nd person ("your ride", "you'll see").`,
  tools: { planRoute, refineRoute, fetchWeather, saveRoute, searchFavorites },
});
```

### Anti-pattern (DO NOT)
- Do not let the agent decide when to persist data — orchestrator code does this deterministically
- Do not expose tool names or internal errors to the rider
- Do not use the agent for state machine transitions

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
- US-006: Planning session CRUD (session validation)
- US-007: Session messages CRUD (message persistence)
- US-009: parseNaturalLanguageInput (input parsing tool)

## NOTES
- The agent is the probabilistic layer; the orchestrator (`planRideOrchestrator`) is the deterministic layer
- Rate limit check happens BEFORE calling the orchestrator — fail fast
- Agent personality should feel like a knowledgeable riding buddy, not a formal assistant
