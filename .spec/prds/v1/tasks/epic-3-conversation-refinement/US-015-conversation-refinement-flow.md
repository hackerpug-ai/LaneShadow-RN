# Implement conversation refinement flow in useChatPlanning

> Task ID: US-015
> Type: FEATURE
> Priority: P0
> Estimate: 120 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST

- Pass `previousMessages` to `parseNaturalLanguageInput` for conversation context
- When `isRefinement=true`, new routes replace active routes on map while previous routes remain in chat history
- Support preference changes ("avoid highways"), stop additions ("add Big Sur"), and constraint modifications ("make it shorter", "under 1 hour")
- Complete refinement flow within 12 seconds end-to-end

### NEVER

- Start a new session for refinements — stay in current session context
- Drop previous route attachments from chat history when new routes arrive
- Break the existing initial planning flow while adding refinement support

### STRICTLY

- Follow the Convex conditional query pattern: `useQuery(api, sessionId ? { sessionId } : 'skip')`
- Use the existing `parseNaturalLanguageInput` action interface — do not create a separate refinement endpoint

## SPECIFICATION

**Objective:** Enable riders to refine existing route results through follow-up messages in the same chat session. The agent interprets follow-up messages in context of the active session and routes, then generates updated alternatives that replace active map routes while preserving history.

**Success looks like:** A rider can say "scenic 2-hour ride to Santa Cruz, avoid highways", see routes, then say "actually avoid Highway 1" and get updated routes within 12 seconds — all without leaving the map view.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Routes are displayed on map from initial planning | Rider sends a follow-up message | New routes replace active polylines on map | New routes replace active polylines when `isRefinement=true` |
| 2 | Rider has sent refinement and received updated routes | Rider expands chat history | Previous route attachment cards are visible when scrolled up | Previous route cards remain visible in chat history |
| 3 | Rider sends a refinement message | System processes the refinement | Updated routes are generated and displayed | System responds to refinement within 12 seconds |
| 4 | Active session has multiple messages | Refinement is sent | `previousMessages` array is passed to `parseNaturalLanguageInput` | Verify `previousMessages` includes session context |
| 5 | Rider sends preference change ("avoid highways") | Agent processes refinement | Routes reflect the preference change | Routes exclude highway segments |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | New routes replace active polylines when `isRefinement=true` | AC-1 | Manual: send follow-up, observe map update | TODO |
| 2 | Previous route cards remain visible in chat history when scrolled up | AC-2 | Manual: expand chat, scroll up after refinement | TODO |
| 3 | System responds to refinement within 12 seconds | AC-3 | Manual: time from send to route display | TODO |
| 4 | `previousMessages` is passed to `parseNaturalLanguageInput` on refinement | AC-4 | Code review: inspect hook implementation | TODO |
| 5 | Preference changes are reflected in updated routes | AC-5 | Manual: say "avoid highways", verify no highway segments | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `hooks/use-chat-planning.ts` (MODIFY)

### WRITE-PROHIBITED

- `convex/actions/agent/tools/parseNaturalLanguageInput.ts` (backend — do not modify)
- `convex/actions/agent/lib/planRideOrchestrator.ts` (backend — do not modify)

## DESIGN

### References

- 09-technical-client.md §4.2 — Chat planning hook architecture
- 04-uc-agentic.md UC-AG-07 — Refine routes through follow-up messages
- 08-technical-ui.md §State Machine — ROUTE_RESULTS → PLANNING transition on refinement

### Code Pattern

```typescript
// In useChatPlanning hook — refinement detection
const sendMessage = async (text: string) => {
  const hasActiveRoutes = state.routeOptions !== null
  const previousMessages = messages.map(m => ({ role: m.role, content: m.text }))

  const result = await parseNaturalLanguageInput({
    text,
    sessionId: activeSessionId,
    previousMessages: hasActiveRoutes ? previousMessages : undefined,
    currentLocation,
    departureTime,
  })

  if (result.isRefinement) {
    // Replace active routes on map, preserve history
    dispatch({ type: 'SET_ROUTE_OPTIONS', payload: newRouteOptions })
  }
}
```

### Anti-pattern (DO NOT)

- Do not create separate "refine" and "plan" code paths — use the single `parseNaturalLanguageInput` call with `isRefinement` response to branch behavior
- Do not clear chat history when replacing map routes
- Do not use `useEffect` for state syncing — read from Convex queries directly

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure (ChatInput, useChatPlanning hook must exist)
- `parseNaturalLanguageInput` action must accept `previousMessages` parameter

## NOTES

- The `isRefinement` flag comes from the backend response, not from client-side detection
- Planning phase indicators should show during refinement just like initial planning
- The 12-second SLA applies to refinements, same as initial planning
