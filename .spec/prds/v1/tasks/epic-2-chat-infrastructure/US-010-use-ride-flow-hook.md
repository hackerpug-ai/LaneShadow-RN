# Implement useRideFlow 6-state machine hook

> Status: COMPLETE (2026-04-04)

> Task ID: US-010
> Type: FEATURE
> Priority: P0
> Estimate: 150 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST
- Implement all 6 states: IDLE, PLANNING, ROUTE_RESULTS, ROUTE_DETAILS, SESSION_HISTORY, NAVIGATION_EXPORT
- Define all `RideFlowAction` union types with proper payloads
- Implement state transition guards (e.g., NAVIGATION_EXPORT rejected when selectedRouteId is null)
- Be a drop-in replacement for the existing `planningReducer`
- Pure state machine — no UI rendering, no side effects

### NEVER
- Include any UI rendering logic in this hook
- Make API calls or trigger side effects from state transitions
- Allow invalid state transitions (enforce guards)

### STRICTLY
- All state transitions must be explicit — no implicit state changes
- Every action must be handled in every state (either transition or no-op with guard)

## SPECIFICATION

**Objective:** Create a pure state machine hook that manages the entire ride planning flow, replacing the existing `planningReducer` with a richer 6-state model that supports conversational planning.

**Success looks like:** A `useRideFlow()` hook that returns `[state, dispatch]` where state includes the current flow state, selected route, route options, and session data. All transitions are guarded and type-safe.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | State is IDLE | SEND_MESSAGE dispatched with content | Transitions to PLANNING | Unit test |
| 2 | State is PLANNING | PLANNING_SUCCESS dispatched | Transitions to ROUTE_RESULTS | Unit test |
| 3 | State is ROUTE_RESULTS | NAVIGATE_EXPORT dispatched, selectedRouteId is null | Transition rejected (guard) | Unit test |
| 4 | Any state | NEW_SESSION dispatched | Resets all state to IDLE | Unit test |
| 5 | State is IDLE | LOAD_SESSION dispatched | Populates routeOptions from attachment | Unit test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | IDLE -> PLANNING on SEND_MESSAGE with content | AC-1 | Unit test passes | [ ] TRUE [ ] FALSE |
| 2 | PLANNING -> ROUTE_RESULTS on PLANNING_SUCCESS | AC-2 | Unit test passes | [ ] TRUE [ ] FALSE |
| 3 | NAVIGATION_EXPORT rejected when selectedRouteId null | AC-3 | Unit test passes | [ ] TRUE [ ] FALSE |
| 4 | NEW_SESSION resets all state to IDLE | AC-4 | Unit test passes | [ ] TRUE [ ] FALSE |
| 5 | LOAD_SESSION populates routeOptions from attachment | AC-5 | Unit test passes | [ ] TRUE [ ] FALSE |
| 6 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `hooks/use-ride-flow.ts` (NEW)
- `hooks/__tests__/use-ride-flow.test.ts` (NEW)

### WRITE-PROHIBITED
- `app/(app)/(tabs)/index.tsx` (integration is a separate task — US-012)

## DESIGN

### References
- PRD 09-technical-client.md §1.1-1.6 (state machine definition)
- PRD UC-AG-01, UC-AG-02, UC-AG-03

### Code Pattern
```typescript
type RideFlowState = 
  | { phase: 'IDLE'; sessionId: string | null }
  | { phase: 'PLANNING'; sessionId: string; planId: string | null; currentPhase: string }
  | { phase: 'ROUTE_RESULTS'; sessionId: string; routeOptions: RouteOption[]; selectedRouteId: string | null }
  | { phase: 'ROUTE_DETAILS'; sessionId: string; selectedRouteId: string }
  | { phase: 'SESSION_HISTORY'; }
  | { phase: 'NAVIGATION_EXPORT'; sessionId: string; selectedRouteId: string };

type RideFlowAction = 
  | { type: 'SEND_MESSAGE'; content: string }
  | { type: 'PLANNING_SUCCESS'; routeOptions: RouteOption[] }
  | { type: 'SELECT_ROUTE'; routeId: string }
  // ... etc
```

### Anti-pattern (DO NOT)
- Do not mix UI concerns into the state machine
- Do not make the reducer async — it must be synchronous
- Do not store derived data in state — compute it from the primary state

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
No task dependencies.

## NOTES
- This hook replaces the existing `planningReducer` — study `app/(app)/(tabs)/index.tsx` to understand the current state shape
- The hook should be testable in isolation without React rendering
