# Wire manual planning mode fallback from chat input

> Task ID: US-018
> Type: FEATURE
> Priority: P1
> Estimate: 60 minutes
> Assignee: ui-developer

## CRITICAL CONSTRAINTS

### MUST

- Connect manual mode icon in ChatInputBar to open PlanRideSheet
- Carry over routing preferences (avoid highways, scenic bias) from chat conversation into PlanRideSheet
- Preserve session history when returning from manual mode to chat

### NEVER

- Modify `components/sheets/plan-ride-sheet.tsx` — use existing component as-is
- Destroy the active session when switching to manual mode
- Lose chat messages when toggling between manual and chat modes

### STRICTLY

- Wire the manual mode icon that already exists in the ChatInputBar design
- Preferences must flow one-way: chat conversation → PlanRideSheet (not bidirectional sync)

## SPECIFICATION

**Objective:** Some riders prefer the traditional pin-drop workflow. Connect the manual mode icon in the chat input bar to open the existing PlanRideSheet, carrying over any routing preferences the rider has expressed in the chat conversation.

**Success looks like:** Rider has been chatting about a ride with "avoid highways" preference. They tap the manual mode icon. PlanRideSheet opens with "avoid highways" pre-selected. They can plan manually, then close the sheet and return to their chat session intact.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Chat input bar is visible | Rider taps manual mode icon | Existing PlanRideSheet opens | Visual: PlanRideSheet appears |
| 2 | Rider has expressed "avoid highways" in chat | Rider opens manual mode | PlanRideSheet shows "avoid highways" pre-selected | Visual: preference toggle is on |
| 3 | Rider has an active chat session | Rider opens and closes manual mode | Session history is preserved, chat messages intact | Visual: messages still present after return |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Manual mode icon opens existing PlanRideSheet | AC-1 | Manual: tap icon, verify sheet | TODO |
| 2 | Preferences from chat carry over to PlanRideSheet | AC-2 | Manual: say "avoid highways" in chat, open manual, check toggle | TODO |
| 3 | Session preserved on return from manual mode | AC-3 | Manual: open/close manual mode, verify chat intact | TODO |

## GUARDRAILS

### WRITE-ALLOWED

- `app/(app)/(tabs)/index.tsx` (MODIFY)

### WRITE-PROHIBITED

- `components/sheets/plan-ride-sheet.tsx` (preserve existing — do not modify)
- `convex/` (no backend changes)

## DESIGN

### References

- 04-uc-agentic.md UC-AG-05 — Switch to manual planning mode
- 04-uc-agentic.md UC-AG-01 wireframe — Manual mode icon in chat input bar
- 08-technical-ui.md §State Machine — Manual mode as fallback from chat

### Code Pattern

```typescript
// In HomeMapScreen — wire manual mode
const handleManualMode = () => {
  // Extract preferences from chat session context
  const preferences = extractPreferencesFromSession(messages)
  // Open PlanRideSheet with carried-over preferences
  setPlanRideSheetVisible(true)
  setPlanRidePreferences(preferences)
}
```

### Anti-pattern (DO NOT)

- Do not create a new manual planning component — reuse existing PlanRideSheet
- Do not sync preferences bidirectionally between chat and manual mode
- Do not clear the chat session when entering manual mode

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure (ChatInputBar with manual mode icon)
- `PlanRideSheet` component must already exist and accept preferences as props

## NOTES

- This is the lowest priority task in Epic 3 (P1 vs P0 for the others)
- Preference extraction is a simple mapping: look for known keywords in session messages
- The manual mode icon should already be part of the ChatInputBar design from Epic 2
- If PlanRideSheet does not accept preferences as props, a small adapter may be needed in `index.tsx`
