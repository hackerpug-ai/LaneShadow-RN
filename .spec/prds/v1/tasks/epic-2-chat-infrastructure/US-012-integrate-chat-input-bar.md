# Integrate ChatInputBar into HomeMapScreen

> Task ID: US-012
> Type: FEATURE
> Priority: P0
> Estimate: 240 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST
- Replace `useReducer(planningReducer)` with `useRideFlow()`
- Replace `DescribeRideBar` + `NlpInputSheet` with `ChatInput` (always visible at bottom of map)
- Wire `useChatPlanning` and `useChatSession` hooks
- Show suggestion chips when idle, progress indicator when planning
- Add `RouteAttachmentCard` rendering for route options in chat
- Add multi-route polyline rendering with `useRouteComparison`
- `PlanRideSheet` remains accessible via manual mode

### NEVER
- Break existing wind overlay functionality
- Break existing map controls (zoom, tilt, location)
- Break existing saved-routes tab
- Remove or modify `PlanRideSheet` — it stays as manual mode fallback

### STRICTLY
- ChatInput must be always visible at bottom of map in all states
- Route polylines must support tapping to highlight/select

## SPECIFICATION

**Objective:** Wire the chat infrastructure into the main HomeMapScreen, creating the primary conversational planning experience where users type natural language and see route polylines on the map.

**Success looks like:** Chat input bar visible at bottom of map. Typing a ride request triggers planning, shows progress, and renders 2-3 route polylines on the map with attachment cards. Tapping a route card highlights the corresponding polyline.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | App opens | HomeMapScreen loads | Chat input bar visible at bottom of map | Visual inspection |
| 2 | State is IDLE | Chat input focused | Suggestion chips displayed above input | Visual inspection |
| 3 | User types and sends message | Planning starts | Progress indicator shows phase updates | Visual inspection |
| 4 | Planning completes | Routes returned | 2-3 polylines rendered on map | Visual inspection |
| 5 | Route results shown | RouteAttachmentCards displayed | Cards show route names | Visual inspection |
| 6 | User taps a route card | Card selected | Corresponding polyline highlighted | Visual inspection |
| 7 | Wind overlay active | Chat used for planning | Wind overlay still works | Visual inspection |
| 8 | Manual mode accessed | PlanRideSheet opened | Sheet works as before | Visual inspection |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | ChatInput renders at bottom of map | AC-1 | Visual inspection | [ ] TRUE [ ] FALSE |
| 2 | Suggestion chips appear in IDLE state | AC-2 | Visual inspection | [ ] TRUE [ ] FALSE |
| 3 | Planning progress shows phase updates | AC-3 | Visual inspection | [ ] TRUE [ ] FALSE |
| 4 | 2-3 route polylines render on map | AC-4 | Visual inspection | [ ] TRUE [ ] FALSE |
| 5 | Route cards highlight corresponding polylines on tap | AC-6 | Visual inspection | [ ] TRUE [ ] FALSE |
| 6 | Wind overlay still functions | AC-7 | Visual inspection | [ ] TRUE [ ] FALSE |
| 7 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `app/(app)/(tabs)/index.tsx` (MODIFY — replace reducer, add chat UI)
- `hooks/use-route-comparison.ts` (NEW)
- `hooks/use-chat-session.ts` (NEW)
- `components/chat/` (NEW — ChatInput, RouteAttachmentCard, SuggestionChips, PlanningProgressIndicator)

### WRITE-PROHIBITED
- `components/sheets/plan-ride-sheet.tsx`
- `components/map/wind-overlay*.tsx`

## DESIGN

### References
- PRD UC-AG-01 — First Conversational Ride Plan
- PRD 09-technical-client.md §1-4
- `app/(app)/(tabs)/index.tsx` — current HomeMapScreen implementation

### Code Pattern
```typescript
// In HomeMapScreen
const [flowState, dispatch] = useRideFlow();
const { sendPlanningMessage, cancel } = useChatPlanning(dispatch);
const { messages } = useChatSession(flowState.sessionId);
const { polylines, selectRoute } = useRouteComparison(flowState);

return (
  <>
    <MapView>
      {polylines.map(p => <RoutePolyline key={p.id} ... />)}
      <WindOverlay ... />
    </MapView>
    <ChatInput
      onSend={sendPlanningMessage}
      onCancel={cancel}
      state={flowState}
      suggestions={IDLE_SUGGESTIONS}
    />
  </>
);
```

### Anti-pattern (DO NOT)
- Do not put chat state management in the component — use the hooks
- Do not render a scrollable chat history in this epic — just input + latest response
- Do not remove PlanRideSheet — keep as accessible fallback

## CODING STANDARDS
- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES
- US-010: useRideFlow state machine hook
- US-011: useChatPlanning hook

## NOTES
- This is the largest UI task in Epic 2 — it wires together all the hooks and components
- The chat history scrollview comes in Epic 3 — this epic only shows input bar + latest route results
- Suggestion chips content: "2-hour loop", "scenic coastal", "avoid highways", "quick commute"
