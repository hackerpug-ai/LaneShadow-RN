# Implement useSessionHistory and integrate SessionSidebar

> Task ID: US-020
> Type: FEATURE
> Priority: P0
> Estimate: 90 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST

- Build `useSessionHistory` hook with always-active query (no skip) to list all sessions
- Integrate `SessionSidebar` and `SessionCard` into HomeMapScreen
- Slide-out triggered by left swipe (PanResponder `dx > 30` from `x < 20`) or hamburger icon
- Show title, date, route count per session card
- Tap session card to resume session (restore routes on map)
- Close sidebar to return to previous view

### NEVER

- Use conditional skip for session history query — it should always be active
- Block the map entirely when sidebar is open — map should be partially visible
- Fetch full message history for every session in the sidebar list — only fetch on resume

### STRICTLY

- Session list sorted newest first by `updatedAt`
- Use `PanResponder` for left-edge swipe detection — not third-party gesture libraries
- Use `useSemanticTheme()` for all color tokens

## SPECIFICATION

**Objective:** Build the session history sidebar that slides in from the left, showing all planning sessions with auto-generated titles, dates, and route counts. Tapping a session resumes it with routes restored on the map.

**Success looks like:** Rider swipes from the left edge (or taps hamburger). A sidebar slides in showing "Coastal Loop — Today — 2 routes" and "Mountain Climber — Yesterday — 3 routes". Tapping "Coastal Loop" closes the sidebar and restores those routes on the map.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Rider has multiple planning sessions | Rider opens sidebar | All sessions shown, newest first | Visual: sessions listed by date |
| 2 | Session card shows metadata | Rider views sidebar | Each card shows title, date, route count | Visual: verify card content |
| 3 | Rider taps a session card | Session is selected | Session resumes with routes restored on map | Visual: routes appear, sidebar closes |
| 4 | Sessions were created in previous app launches | Rider opens sidebar | All previous sessions are listed | Visual: sessions persist across launches |
| 5 | Rider is at left edge of screen | Rider swipes right (dx > 30) | Sidebar slides in | Visual: swipe opens sidebar |
| 6 | Sidebar is open | Rider taps close or swipes left | Sidebar closes, returns to previous view | Visual: sidebar dismisses |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Sidebar shows all sessions newest first | AC-1 | Manual: create sessions, verify order | TODO |
| 2 | Session cards display title, date, route count | AC-2 | Manual: verify card metadata | TODO |
| 3 | Tapping session resumes it with routes on map | AC-3 | Manual: tap session, verify map routes | TODO |
| 4 | Sessions persist across app launches | AC-4 | Manual: close app, reopen, check sidebar | TODO |
| 5 | Left edge swipe opens sidebar | AC-5 | Manual: swipe from left edge | TODO |
| 6 | Sidebar close returns to previous view | AC-6 | Manual: close sidebar, verify state | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `hooks/use-session-history.ts` (NEW)
- `app/(app)/(tabs)/index.tsx` (MODIFY)

### WRITE-PROHIBITED

- `convex/db/planningSessions.ts` (backend — use existing API)
- `convex/schema.ts` (backend — do not modify schema)

## DESIGN

### References

- 04-uc-agentic.md UC-AG-09 — Session Sidebar wireframe
- 08-technical-ui.md §State Machine — SESSION_HISTORY state
- 09-technical-client.md §1.3 — `isSidebarOpen` state field

### Code Pattern

```typescript
// hooks/use-session-history.ts
export function useSessionHistory() {
  // Always-active query — no skip
  const sessions = useQuery(api.db.planningSessions.list, {})

  return {
    sessions: sessions ?? [],
    isLoading: sessions === undefined,
  }
}

// SessionCard component
function SessionCard({ session, onTap }: { session: PlanningSession; onTap: () => void }) {
  const { colors } = useSemanticTheme()
  return (
    <Pressable onPress={onTap}>
      <Text style={{ color: colors.onSurface }}>{session.title}</Text>
      <Text style={{ color: colors.onSurfaceVariant }}>
        {formatDate(session.updatedAt)} • {session.routeCount} routes
      </Text>
    </Pressable>
  )
}
```

### Anti-pattern (DO NOT)

- Do not load full message history for every session in sidebar — only title, date, count
- Do not use `Animated.View` with `position: 'absolute'` for sidebar — use proper slide-in animation
- Do not hardcode width — sidebar should be ~80% of screen width

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure (useRideFlow with SESSION_HISTORY state)
- US-019: useChatSession hook (for `loadSession` function)
- Convex backend: `planningSessions.list` query must exist and return title, date, route count

## NOTES

- The sidebar UX follows the ChatGPT threads pattern — familiar to most users
- Session titles are auto-generated from the first message in the session (backend responsibility)
- The hamburger icon should be in the top-left of the map screen header area
- Route count per session may require a lightweight aggregation — check if `planningSessions.list` returns this or if it needs client-side computation
