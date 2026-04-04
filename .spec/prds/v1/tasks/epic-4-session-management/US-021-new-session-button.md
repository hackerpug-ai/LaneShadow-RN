# Wire NewSessionButton and session clearing logic

> Task ID: US-021
> Type: FEATURE
> Priority: P0
> Estimate: 45 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST

- Integrate NewSessionButton into map screen header
- On tap: clear map polylines, reset chat input, create new session via `useChatSession.createSession`
- Wire `NEW_SESSION` action through `useRideFlow` dispatch

### NEVER

- Delete the previous session when creating a new one — previous session persists in history
- Leave stale route polylines on map after new session
- Reset the session sidebar state — it should still show the previous session in history

### STRICTLY

- Use single dispatch of `NEW_SESSION` action — reducer handles all clearing logic
- Button position: top-left area of map screen header (per UC-AG-01 wireframe)

## SPECIFICATION

**Objective:** Wire the New Session button that allows riders to start a fresh planning conversation. Tapping it clears the map, resets chat, and creates a new backend session — ready for a new ride plan.

**Success looks like:** Rider has routes on the map from a previous plan. They tap "+ New Session". The map clears, the chat input empties, and they can immediately start planning a new ride. The previous session is still accessible in the sidebar.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Routes are displayed on map | Rider taps New Session button | Map clears of all route polylines | Visual: map shows no routes |
| 2 | Chat has messages from current session | Rider taps New Session button | Chat input resets, messages clear from active view | Visual: clean chat state |
| 3 | Rider taps New Session button | New session is created | Backend creates new session record | Debug: verify Convex mutation fired |
| 4 | Previous session existed | Rider creates new session and opens sidebar | Previous session still listed in sidebar | Visual: sidebar shows both sessions |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | New Session clears map polylines | AC-1 | Manual: tap button, verify empty map | TODO |
| 2 | Chat input resets on new session | AC-2 | Manual: tap button, verify clean input | TODO |
| 3 | New session created in backend | AC-3 | Manual: tap button, check sidebar for new entry | TODO |
| 4 | Previous session preserved in history | AC-4 | Manual: create new session, open sidebar, verify old session listed | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `app/(app)/(tabs)/index.tsx` (MODIFY)

### WRITE-PROHIBITED

- `convex/db/planningSessions.ts` (backend — use existing API)
- `components/sheets/plan-ride-sheet.tsx` (preserve existing)

## DESIGN

### References

- 04-uc-agentic.md UC-AG-01 wireframe — "+ Session" button position
- 04-uc-agentic.md UC-AG-09 — New Session behavior
- 09-technical-client.md §1.1 — IDLE state after new session

### Code Pattern

```typescript
// In HomeMapScreen
const handleNewSession = async () => {
  dispatch({ type: 'NEW_SESSION' })
  await createSession()
}

// In useRideFlow reducer
case 'NEW_SESSION':
  return {
    ...initialState,
    flowState: 'IDLE',
    // activeSessionId will be set by SET_ACTIVE_SESSION from createSession
  }
```

### Anti-pattern (DO NOT)

- Do not dispatch multiple actions (CLEAR_MAP, RESET_CHAT, etc.) — use single NEW_SESSION action
- Do not delete the previous session — it must persist for history
- Do not navigate away from the map screen — new session stays on map

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- US-019: useChatSession hook (provides `createSession`)
- Epic 2: Chat Infrastructure (useRideFlow with NEW_SESSION action)

## NOTES

- This is the simplest task in Epic 4 (45 min) — mostly wiring existing pieces together
- The NEW_SESSION reducer action resets to initial state while preserving user identity
- The button should use the same icon/style as shown in the UC-AG-01 wireframe: "[+ Session]"
- Consider adding haptic feedback on tap for tactile confirmation
