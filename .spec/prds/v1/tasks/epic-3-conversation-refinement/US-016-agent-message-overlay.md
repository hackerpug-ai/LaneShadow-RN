# Add pin/dismiss gestures to transient message overlay

> Task ID: US-016
> Status: ✅ Completed
> Completed: 2026-04-06T16:53:55Z
> Commit: a7217859248d9d64789c1d4e84af90a423ac5e2c
> Reviewer: orchestrator-verified via diff
> Type: FEATURE
> Priority: P0
> Estimate: 60 minutes
> Assignee: ui-developer
> Refined: 2026-04-06 — scoped down; transient overlay partially exists

## CRITICAL CONSTRAINTS

### MUST

- Add pin-on-tap behavior to the existing transient transcript overlay (tap transcript → cancel auto-dismiss timer)
- Add swipe-up dismiss (PanResponder `dy < -30`) to dismiss transcript overlay
- Add map-tap dismiss (tapping map area outside transcript dismisses it)
- Maintain existing auto-dismiss timer (transient mode already auto-hides)

### NEVER

- Block route polylines with overlay position
- Dismiss overlay when user is interacting with route cards
- Show overlay for rider messages — only system/agent messages trigger transient display
- Import or wire the orphaned `components/ui/agent-message-overlay.tsx` — use the active `ChatTranscript` + transient visibility system

### STRICTLY

- Use `useSemanticTheme()` for all color tokens — no hardcoded colors
- Use React Native's `PanResponder` for swipe detection, not third-party gesture libraries
- Build on the EXISTING transient visibility pattern (`transientVisible`, `armTransientTimer`, `chatOpacity`/`scrimOpacity`)

## SPECIFICATION

**Objective:** HomeMapScreen already has a transient overlay pattern: when an agent message arrives, `ChatTranscript` shows transiently over the map and auto-dismisses via `armTransientTimer`. This task adds three missing gestures: pin (tap to keep visible), swipe-up dismiss, and map-tap dismiss.

**What already exists:**
- `transientVisible` state + `armTransientTimer` in HomeMapScreen — shows transcript on new message, auto-hides
- `chatOpacity`/`scrimOpacity` animated values for cross-fade over map
- `cycleTranscript` function for toggling visibility modes

**What's missing:**
- Pin gesture: tapping the transcript should cancel the auto-dismiss timer and keep it visible
- Swipe-up dismiss: swiping up on the transcript should dismiss it immediately
- Map-tap dismiss: tapping the map (not the transcript) should dismiss a visible overlay

**Success looks like:** After planning completes, the transcript shows transiently over the map. After 5s it fades. If the rider taps it, it pins (stays visible). If they swipe up, it dismisses immediately. Tapping the map also dismisses it.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Transcript is showing transiently (auto-dismiss armed) | Rider taps the transcript | Auto-dismiss timer is cancelled, transcript stays visible | Manual: tap transcript, wait >5s, still visible |
| 2 | Transcript is visible (pinned or transient) | Rider swipes up (dy < -30) | Transcript dismisses immediately | Manual: swipe up, transcript gone |
| 3 | Transcript is visible (pinned or transient) | Rider taps the map (not the transcript) | Transcript dismisses | Manual: tap map area, transcript dismissed |
| 4 | Agent sends a response | New system message arrives | Transcript appears transiently (existing behavior preserved) | Manual: send message, see overlay appear |
| 5 | Transcript is visible with route cards | Rider interacts with a route card | Transcript does NOT dismiss during interaction | Manual: tap route card, verify no dismiss |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Tapping transcript cancels auto-dismiss timer | AC-1 | Manual: tap, wait >5s | TODO |
| 2 | Swipe up (dy < -30) dismisses transcript immediately | AC-2 | Manual: swipe up | TODO |
| 3 | Map tap dismisses transcript | AC-3 | Manual: tap map | TODO |
| 4 | Existing transient display still works | AC-4 | Manual: send message, see overlay | TODO |
| 5 | Route card interaction doesn't trigger dismiss | AC-5 | Manual: interact with card | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `app/(app)/(tabs)/index.tsx` (MODIFY — add gesture handlers to existing transient system)
- `hooks/use-message-overlay.ts` (NEW — optional extraction of gesture logic into hook)

### WRITE-PROHIBITED

- `components/ui/agent-message-overlay.tsx` (orphaned — do not use or modify)
- `components/sheets/plan-ride-sheet.tsx` (preserve existing)
- `convex/` (no backend changes)

## DESIGN

### References

- 04-uc-agentic.md UC-AG-08 — View temporary AI message overlay on map
- Existing: `armTransientTimer` and `transientVisible` in `app/(app)/(tabs)/index.tsx`

### Code Pattern

```typescript
// Optional: extract into hooks/use-message-overlay.ts
export function useMessageOverlay(transientVisible: boolean) {
  const [pinned, setPinned] = useState(false)
  const timerRef = useRef<NodeJS.Timeout>()

  const pin = useCallback(() => {
    setPinned(true)
    clearTimeout(timerRef.current)
  }, [])

  const dismiss = useCallback(() => {
    setPinned(false)
    // Trigger existing hide animation
  }, [])

  // PanResponder for swipe detection
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => dy < -10,
      onPanResponderRelease: (_, { dy }) => {
        if (dy < -30) dismiss()
      },
    })
  ).current

  return { pinned, pin, dismiss, panResponder }
}
```

### Anti-pattern (DO NOT)

- Do not import `components/ui/agent-message-overlay.tsx` — it's orphaned with stale prop contracts
- Do not replace the existing transient visibility system — extend it with gestures
- Do not use `Animated.timing` with `useNativeDriver: false` for gestures

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- US-015: Session reuse must work so follow-up messages trigger transient overlay correctly
- Existing: `transientVisible` + `armTransientTimer` pattern in HomeMapScreen

## NOTES

- This task is scoped down from the original 90min to 60min because the transient overlay already exists
- The orphaned `AgentMessageOverlay` component will be cleaned up in US-019
- Pin state should reset when a new transient display is triggered
