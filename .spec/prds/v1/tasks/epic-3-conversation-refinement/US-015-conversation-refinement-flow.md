# Enable conversation refinement via state machine handlers

> Task ID: US-015
> Status: ✅ Completed
> Completed: 2026-04-06T16:43:53Z
> Commit: fc942c94f6316a8bc4a6f633c51321e4b79b115d
> Reviewer: feature-dev:code-reviewer (orchestrator-verified via diff)
> Type: FEATURE
> Priority: P0
> Estimate: 45 minutes
> Assignee: ui-developer
> Refined: 2026-04-06 — rewritten to match actual agent architecture; session reuse already works at app level

## CRITICAL CONSTRAINTS

### MUST

- Add `SEND_MESSAGE` handler to `ROUTE_RESULTS` and `ROUTE_DETAILS` phases in `useRideFlow` state machine
- When new route attachments arrive in an existing session, replace active map polylines while preserving chat history
- Complete refinement flow within 12 seconds end-to-end

### NEVER

- Drop previous route attachments from chat history when new routes arrive
- Break the existing initial planning flow while adding refinement support
- Modify any Convex backend code — the backend already supports multi-turn refinement

### STRICTLY

- The agent handles refinement detection natively through conversation context — do NOT add client-side refinement detection logic

## SPECIFICATION

**Objective:** Enable riders to send follow-up messages while viewing route results. Currently, `SEND_MESSAGE` is silently dropped in `ROUTE_RESULTS` and `ROUTE_DETAILS` phases (falls through default case). The backend already handles multi-turn refinement — the only gap is the state machine not accepting user input in these phases.

**What already works:**
- Session reuse at the app level (`activeChatSessionId` memo persists across messages)
- Backend receives full message history + route context via `buildInSessionRouteBlock()`
- Agent is instructed to handle refinements ("call planRoute again with updated preferences")

**What's broken:** The `useRideFlow` state machine has no `SEND_MESSAGE` handler in `ROUTE_RESULTS` (line ~322) or `ROUTE_DETAILS` (line ~370) phases. Follow-up messages are silently dropped.

**Success looks like:** A rider sees routes, types "actually avoid Highway 1", the state machine transitions to PLANNING, and updated routes appear within 12 seconds.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Ride flow is in ROUTE_RESULTS phase | Rider sends a follow-up message | State machine transitions to PLANNING with existing sessionId | Code review: SEND_MESSAGE handler in ROUTE_RESULTS |
| 2 | Ride flow is in ROUTE_DETAILS phase | Rider sends a follow-up message | State machine transitions to PLANNING with existing sessionId | Code review: SEND_MESSAGE handler in ROUTE_DETAILS |
| 3 | Routes displayed, rider sends refinement | System processes the refinement | New routes replace active polylines, prior route cards preserved in history | Manual: send follow-up, observe map + history |
| 4 | Rider sends a refinement message | System processes | Updated routes generated within 12s | Manual: time from send to route display |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | ROUTE_RESULTS handles SEND_MESSAGE → PLANNING transition | AC-1 | Code review: state machine | TODO |
| 2 | ROUTE_DETAILS handles SEND_MESSAGE → PLANNING transition | AC-2 | Code review: state machine | TODO |
| 3 | New routes replace active polylines, history preserved | AC-3 | Manual: refinement flow | TODO |
| 4 | System responds to refinement within 12 seconds | AC-4 | Manual: timing | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `hooks/use-ride-flow.ts` (MODIFY — add SEND_MESSAGE to ROUTE_RESULTS/ROUTE_DETAILS)

### WRITE-PROHIBITED

- `hooks/use-chat-planning.ts` (session reuse already works at app level)
- `convex/` (backend is complete)
- `components/ui/chat-transcript.tsx` (rendering is fine)

## DESIGN

### Code Pattern

```typescript
// In useRideFlow — add SEND_MESSAGE to route phases
case 'ROUTE_RESULTS':
case 'ROUTE_DETAILS':
  switch (action.type) {
    case 'SEND_MESSAGE':
      // Transition to PLANNING but KEEP the existing sessionId
      return { ...state, phase: 'PLANNING' }
    // ... existing handlers
  }
```

### Anti-pattern (DO NOT)

- Do not add `isRefinement` detection logic — the agent handles this natively
- Do not create separate "refine" and "plan" code paths
- Do not modify `useChatPlanning` — session reuse already works at app level

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure

## NOTES

- Session reuse was originally identified as a bug but is actually working correctly at the app level via `activeChatSessionId` memo in HomeMapScreen
- The backend agent receives full message history and route context — refinement is architecturally supported
- This is a small but critical fix — without it, follow-up messages during route viewing are silently dropped
