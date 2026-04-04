# Integrate AgentMessageOverlay with auto-dismiss and pin

> Task ID: US-016
> Type: FEATURE
> Priority: P0
> Estimate: 90 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST

- Integrate AgentMessageOverlay into HomeMapScreen
- Implement `useMessageOverlay` hook: show on new system message, auto-dismiss after 5s or map tap, pin on overlay tap, swipe-up dismiss (PanResponder `dy < -30`)
- Position overlay at top-left of map area
- Entry animation: translateY -20 to 0, opacity 0 to 1, 300ms
- Exit animation: 200ms fade
- Use 92% opacity surface background

### NEVER

- Block route polylines with overlay position
- Dismiss overlay when user is interacting with route cards
- Show overlay for rider messages — only system/agent messages

### STRICTLY

- Use `useSemanticTheme()` for all color tokens — no hardcoded colors
- Use React Native's `PanResponder` for swipe detection, not third-party gesture libraries

## SPECIFICATION

**Objective:** When the agent responds with route results or conversational messages, display a temporary overlay card on the map. The overlay auto-dismisses after 5 seconds, can be pinned by tapping, and can be swiped away. Route attachment cards are visible within the overlay in compact format.

**Success looks like:** After planning completes, an overlay smoothly animates in at top-left showing the agent's response with route cards. After 5 seconds it fades out. If the rider taps it, it stays. If they swipe up, it dismisses immediately.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Planning completes with route results | Agent response is received | Overlay appears with entry animation (translateY -20→0, opacity 0→1, 300ms) | Visual: overlay animates in smoothly |
| 2 | Overlay is visible and not pinned | 5 seconds elapse | Overlay auto-dismisses with 200ms fade | Visual: overlay fades after 5s |
| 3 | Overlay is visible | Rider taps the overlay | Overlay becomes pinned (does not auto-dismiss) | Visual: overlay persists past 5s after tap |
| 4 | Overlay is visible | Rider swipes up (dy < -30) | Overlay dismisses immediately | Visual: overlay disappears on swipe |
| 5 | Agent response includes route attachments | Overlay is shown | Route attachment cards visible inline in compact format | Visual: route cards appear within overlay |
| 6 | Overlay is visible | Rider taps the map (not the overlay) | Overlay dismisses | Visual: map tap dismisses overlay |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Overlay appears with animation after planning completes | AC-1 | Manual: complete planning, observe animation | TODO |
| 2 | Overlay auto-dismisses after 5 seconds when not pinned | AC-2 | Manual: wait 5s, verify fade | TODO |
| 3 | Tapping overlay pins it (prevents auto-dismiss) | AC-3 | Manual: tap overlay, wait >5s | TODO |
| 4 | Swiping up dismisses overlay immediately | AC-4 | Manual: swipe up on overlay | TODO |
| 5 | Route attachment cards visible within overlay | AC-5 | Manual: verify cards in overlay | TODO |
| 6 | Map tap dismisses overlay | AC-6 | Manual: tap map area outside overlay | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `hooks/use-message-overlay.ts` (NEW)
- `app/(app)/(tabs)/index.tsx` (MODIFY)

### WRITE-PROHIBITED

- `components/sheets/plan-ride-sheet.tsx` (preserve existing)
- `convex/` (no backend changes)

## DESIGN

### References

- 08-technical-ui.md §2 — AgentMessageOverlay component spec
- 04-uc-agentic.md UC-AG-08 — Wireframe and acceptance criteria
- 04-uc-agentic.md UC-AG-08 wireframe — Top-left positioning, compact route cards

### Code Pattern

```typescript
// hooks/use-message-overlay.ts
export function useMessageOverlay() {
  const [visible, setVisible] = useState(false)
  const [pinned, setPinned] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const show = useCallback(() => {
    setVisible(true)
    setPinned(false)
    timerRef.current = setTimeout(() => {
      if (!pinned) setVisible(false)
    }, 5000)
  }, [])

  const pin = useCallback(() => {
    setPinned(true)
    clearTimeout(timerRef.current)
  }, [])

  const dismiss = useCallback(() => {
    setVisible(false)
    setPinned(false)
    clearTimeout(timerRef.current)
  }, [])

  return { visible, pinned, show, pin, dismiss }
}
```

### Anti-pattern (DO NOT)

- Do not use `Animated.timing` with `useNativeDriver: false` for translateY — use native driver
- Do not position overlay at center or bottom — must be top-left to avoid blocking polylines
- Do not use `setTimeout` chains for animation sequencing — use `Animated.sequence` or `Animated.parallel`

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure (system messages must be flowing)
- AgentMessageOverlay component should be created as part of this task or exist from Epic 2

## NOTES

- The overlay is a presentation layer over the map — it does not affect routing state
- All messages are always accessible in expanded chat view regardless of overlay state
- The 92% opacity ensures readability while keeping the map contextually visible
