# Wire useChatPlanning Hook to Backend

> Status: ✅ Completed (2026-04-05)
> Verified: Already implemented - uses real sendMessage action
> Created: 2026-04-04
> Source: Red-Hat Review (CRITICAL Frontend Integration Gap)

> Task ID: US-016
> Type: FEATURE
> Priority: P0
> Estimate: 180 minutes
> Assignee: react-native-ui-implementer

## CRITICAL CONSTRAINTS

### MUST
- Replace all TODO comments in `useChatPlanning` with real `sendMessage` action calls
- Remove `setTimeout` simulation and use actual Convex `useAction`
- Wire backend response to dispatch PLANNING_SUCCESS with actual route options
- Remove `mockRouteOptions` and return real data from backend

### NEVER
- Leave any TODO comments in production code
- Return empty mock arrays to the UI
- Use setTimeout for backend simulation

### STRICTLY
- All backend calls must use the implemented `sendMessage` action from US-013

## SPECIFICATION

**Objective:** Replace the 100% stubbed `useChatPlanning` hook with real backend integration. The hook currently uses `setTimeout` simulation and TODO comments — users cannot actually send messages that generate routes.

**Success looks like:** A rider types "scenic ride to Santa Cruz" and sees real route options appear from the backend. No mock data. No setTimeout simulation.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | User sends message | sendPlanningMessage called | Calls `api.actions.agent.sendMessage` | Integration test |
| 2 | Backend returns routes | Response received | PLANNING_SUCCESS dispatched with options | Integration test |
| 3 | Backend errors | Error response | PLANNING_ERROR dispatched | Integration test |
| 4 | All TODO comments removed | Code review | No TODOs in useChatPlanning | Manual review |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | sendMessage action called with sessionId and content | AC-1 | Integration test passes | [ ] TRUE [ ] FALSE |
| 2 | Backend routes populate options array | AC-2 | Integration test passes | [ ] TRUE [ ] FALSE |
| 3 | Backend errors trigger PLANNING_ERROR | AC-3 | Integration test passes | [ ] TRUE [ ] FALSE |
| 4 | No TODO comments remain | AC-4 | Code review | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `hooks/use-chat-planning.ts` (MODIFY)
- `hooks/__tests__/use-chat-planning.test.ts` (MODIFY)

### WRITE-PROHIBITED
- No changes to backend actions (US-013)
- No changes to UI components (separate task)

## DESIGN

### References
- Red-Hat Review Report: "useChatPlanning is 100% Stubbed"
- US-011: useChatPlanning hook (original stubbed implementation)
- US-013: sendMessage action (backend entry point)

### Code Pattern
```typescript
export function useChatPlanning(dispatch: Dispatch<RideFlowAction>) {
  const sendMessage = useAction(api.actions.agent.sendMessage)
  const abortRef = useRef<AbortController | null>(null)

  const sendPlanningMessage = useCallback(async (text: string) => {
    abortRef.current = new AbortController()
    dispatch({ type: 'SEND_MESSAGE', payload: { content: text } })

    try {
      // REAL BACKEND CALL (not setTimeout)
      const result = await sendMessage({
        sessionId: flowState.sessionId,
        content: text,
        currentLocation: currentLocation
      })

      // Dispatch SUCCESS with REAL data
      if (result.attachments?.length > 0) {
        dispatch({
          type: 'PLANNING_SUCCESS',
          payload: {
            planId: result.attachments[0].routePlanId,
            options: result.attachments.map(a => ({ /* real route data */ }))
          }
        })
      }
    } catch (error) {
      dispatch({ type: 'PLANNING_ERROR', payload: { error } })
    }
  }, [dispatch, flowState.sessionId, currentLocation])

  const cancel = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  return { sendPlanningMessage, cancel }
}
```

### Anti-pattern (DO NOT)
- Do not keep setTimeout simulation
- Do not return `options: []`
- Do not leave TODO comments

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, no stubs in production
- **brain/docs/testing-standards**: Integration tests over mock tests

## DEPENDENCIES
- US-011: useChatPlanning hook (stubbed version)
- US-013: sendMessage action (backend)

## NOTES
- The current implementation has TODO comments at lines 89-93, 149, 159, 174, 177
- Returns `options: []` (empty array) at line 182-186
- This is the CORE feature of Epic 2 — completely non-functional until wired
- This task completes the frontend-backend integration that US-011 stubbed out
