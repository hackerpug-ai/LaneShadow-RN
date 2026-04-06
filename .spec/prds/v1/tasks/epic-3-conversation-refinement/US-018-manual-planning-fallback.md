# Wire manual planning mode fallback from chat input

> Task ID: US-018
> Status: ✅ Completed
> Completed: 2026-04-06T16:43:16Z
> Commit: 2577dae36706e4744a2b741d85638c6f7fe1ee49
> Reviewer: feature-dev:code-reviewer (orchestrator-verified via diff)
> Type: FEATURE
> Priority: P1
> Estimate: 60 minutes
> Assignee: ui-developer
> Refined: 2026-04-06 — updated component references to match production code

## CRITICAL CONSTRAINTS

### MUST

- Add manual mode icon to the production `ChatInput` component (in `components/chat/chat-input.tsx`)
- Connect manual mode icon to open PlanRideSheet
- Carry over routing preferences (avoid highways, scenic bias) from chat conversation into PlanRideSheet
- Preserve session history when returning from manual mode to chat

### NEVER

- Modify `components/sheets/plan-ride-sheet.tsx` — use existing component as-is
- Destroy the active session when switching to manual mode
- Lose chat messages when toggling between manual and chat modes
- Reference `components/ui/chat-input-bar.tsx` — that's an orphaned design prototype

### STRICTLY

- Add the manual mode icon to the PRODUCTION `ChatInput` component (`components/chat/chat-input.tsx`)
- Preferences must flow one-way: chat conversation → PlanRideSheet (not bidirectional sync)

## SPECIFICATION

**Objective:** Some riders prefer the traditional pin-drop workflow. Add a manual mode icon to the production ChatInput component and connect it to open the existing PlanRideSheet, carrying over any routing preferences the rider has expressed in the chat conversation.

**What already exists:**
- `PlanRideSheet` component — fully built, accepts preferences
- `ChatInput` component (`components/chat/chat-input.tsx`) — production input, used in HomeMapScreen and ChatScreen
- Session messages in Convex — can be scanned for preference keywords

**What's missing:**
- Manual mode icon in the production `ChatInput` component
- `onManualModePress` callback wiring in HomeMapScreen
- Preference extraction logic (scan session messages for known keywords like "avoid highways", "scenic")
- PlanRideSheet integration in HomeMapScreen with carried-over preferences

**Success looks like:** Rider has been chatting about a ride with "avoid highways" preference. They tap the manual mode icon in ChatInput. PlanRideSheet opens with "avoid highways" pre-selected. They can plan manually, then close the sheet and return to their chat session intact.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Chat input is visible | Rider taps manual mode icon | Existing PlanRideSheet opens | Visual: PlanRideSheet appears |
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

- `components/chat/chat-input.tsx` (MODIFY — add manual mode icon)
- `app/(app)/(tabs)/index.tsx` (MODIFY — wire onManualModePress, preference extraction)

### WRITE-PROHIBITED

- `components/sheets/plan-ride-sheet.tsx` (preserve existing — do not modify)
- `components/ui/chat-input-bar.tsx` (orphaned — do not use)
- `convex/` (no backend changes)

## DESIGN

### References

- 04-uc-agentic.md UC-AG-05 — Switch to manual planning mode
- Existing: `ChatInput` in `components/chat/chat-input.tsx`
- Existing: `PlanRideSheet` in `components/sheets/plan-ride-sheet.tsx`

### Code Pattern

```typescript
// In HomeMapScreen — wire manual mode
const handleManualMode = () => {
  // Extract preferences from session messages
  const preferences = extractPreferencesFromMessages(transcriptMessages)
  setPlanRideSheetVisible(true)
  setPlanRidePreferences(preferences)
}

// Simple keyword extraction from messages
function extractPreferencesFromMessages(messages: ChatMessage[]) {
  const allText = messages
    .filter(m => m.role === 'rider')
    .map(m => m.content.toLowerCase())
    .join(' ')

  return {
    avoidHighways: allText.includes('avoid highway'),
    scenic: allText.includes('scenic'),
    // ... other known preference keywords
  }
}
```

### Anti-pattern (DO NOT)

- Do not create a new manual planning component — reuse existing PlanRideSheet
- Do not sync preferences bidirectionally between chat and manual mode
- Do not clear the chat session when entering manual mode
- Do not reference `ChatInputBar` from `components/ui/` — use production `ChatInput`

## CODING STANDARDS

- **brain/docs/coding-standards**: TypeScript strict, composition patterns

## DEPENDENCIES

- Epic 2: Chat Infrastructure (ChatInput component must exist)
- `PlanRideSheet` component must already exist and accept preferences as props

## NOTES

- This is the lowest priority task in Epic 3 (P1 vs P0 for the others)
- Preference extraction is a simple mapping: look for known keywords in rider messages
- The manual mode icon should be subtle — a small icon in the input bar, not a prominent button
- If PlanRideSheet does not accept preferences as props, a small adapter may be needed in `index.tsx`
