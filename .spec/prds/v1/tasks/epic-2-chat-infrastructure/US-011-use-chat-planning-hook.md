# Implement useChatPlanning hook

> Status: COMPLETE (2026-04-04)

> Task ID: US-011
> Type: FEATURE
> Priority: P0
> Estimate: 120 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST
- Send rider message, call `parseNaturalLanguageInput`, call `createPlan`, subscribe to plan status for phase updates
- Create system message with route attachments on completion
- Support time-based phase fallback (2s/phase) if `getPlanStatus` is unavailable
- Track `AbortController` for cancellation

### NEVER
- Call backend directly without going through the state machine dispatch
- Block the UI thread during planning
- Ignore cancellation — must abort in-flight requests

### STRICTLY
- All backend calls must be cancellable via AbortController

## SPECIFICATION

**Objective:** Create a hook that orchestrates the chat-to-planning flow: sending messages, parsing input, triggering route planning, tracking progress phases, and handling completion/errors.

**Success looks like:** `sendPlanningMessage(text)` triggers the full planning pipeline, dispatches state machine actions at each phase, and results in route options appearing in the UI. Cancel aborts cleanly.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | User types a message | sendPlanningMessage called | Dispatches SEND_MESSAGE + calls backend | Unit test |
| 2 | Planning in progress | Phase updates received | PlanningProgressIndicator updates | Unit test |
| 3 | Planning succeeds | Routes returned | RECEIVE_SYSTEM_MESSAGE + SHOW_OVERLAY + PLANNING_SUCCESS dispatched | Unit test |
| 4 | Planning in progress | cancel() called | AbortController aborts, state resets | Unit test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | sendPlanningMessage dispatches SEND_MESSAGE and calls backend | AC-1 | Unit test passes | [ ] TRUE [ ] FALSE |
| 2 | Phase updates drive progress indicator state | AC-2 | Unit test passes | [ ] TRUE [ ] FALSE |
| 3 | Successful completion dispatches correct action sequence | AC-3 | Unit test passes | [ ] TRUE [ ] FALSE |
| 4 | cancel() aborts in-flight requests cleanly | AC-4 | Unit test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `hooks/use-chat-planning.ts` (NEW)
- `hooks/__tests__/use-chat-planning.test.ts` (NEW)

### WRITE-PROHIBITED
- `app/(app)/(tabs)/index.tsx` (integration is US-012)
- `convex/actions/agent/` (backend is separate tasks)

## DESIGN

### References
- PRD 09-technical-client.md §2.4, §4.1, §4.2
- `hooks/use-ride-flow.ts` (US-010) — state machine it dispatches to

### Code Pattern
```typescript
export function useChatPlanning(dispatch: Dispatch<RideFlowAction>) {
  const abortRef = useRef<AbortController | null>(null);
  
  const sendPlanningMessage = useCallback(async (text: string) => {
    abortRef.current = new AbortController();
    dispatch({ type: 'SEND_MESSAGE', content: text });
    
    // 1. parseNaturalLanguageInput
    // 2. createPlan
    // 3. Subscribe to phase updates
    // 4. On completion, dispatch PLANNING_SUCCESS
  }, [dispatch]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  return { sendPlanningMessage, cancel };
}
```

### Anti-pattern (DO NOT)
- Do not poll for plan status — subscribe to Convex reactive queries
- Do not swallow errors — convert to state machine error actions

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
- US-010: useRideFlow state machine hook (dispatch target)

## NOTES
- Time-based phase fallback (2s/phase) is a UX safeguard when real-time status is unavailable
- The hook should be composable with useChatSession for message persistence
