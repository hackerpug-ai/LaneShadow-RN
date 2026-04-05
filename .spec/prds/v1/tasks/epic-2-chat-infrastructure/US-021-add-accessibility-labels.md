# Add Accessibility Labels and Screen Reader Support

> Status: ✅ Completed (2026-04-05)
> Verified: Comprehensive accessibility labels, hints, and live regions implemented
> Created: 2026-04-04
> Source: Red-Hat Review (Accessibility Gaps)

> Task ID: US-021
> Type: FEATURE
> Priority: P1
> Estimate: 60 minutes
> Assignee: react-native-ui-implementer

## CRITICAL CONSTRAINTS

### MUST
- Add `accessibilityLabel` to all interactive elements
- Add `accessibilityHint` where action isn't obvious from label
- Add `accessibilityLiveRegion="polite"` to PlanningProgress component
- Ensure all chat interactions are screen reader friendly

### NEVER
- Leave buttons or inputs without accessibility labels
- Use visual-only feedback for important state changes

### STRICTLY
- WCAG 2.1 AA compliance for interactive elements
- Screen reader announcements for phase updates

## SPECIFICATION

**Objective:** Add missing accessibility labels and screen reader support to chat components. Current implementation lacks accessibilityLabel on TextInput and no screen reader announcements for planning phases.

**Success looks like:** Screen reader users can navigate chat interface, hear planning phase updates, and understand all interactive elements.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Screen reader active | TextInput focused | "Chat input field" announced | Accessibility test |
| 2 | Send button focused | Screen reader active | "Send message" announced | Accessibility test |
| 3 | Planning phase changes | Phase updates | Screen reader announces new phase | Accessibility test |
| 4 | Route card focused | Screen reader active | Card content and hint announced | Accessibility test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | TextInput has accessibilityLabel | AC-1 | Code review passes | [ ] TRUE [ ] FALSE |
| 2 | Buttons have accessibilityLabel and hint | AC-2 | Code review passes | [ ] TRUE [ ] FALSE |
| 3 | PlanningProgress has accessibilityLiveRegion | AC-3 | Code review passes | [ ] TRUE [ ] FALSE |
| 4 | Route cards have accessibilityLabel and hint | AC-4 | Code review passes | [ ] TRUE [ ] FALSE |
| 5 | Screen reader navigation works | All | iOS/Android accessibility test | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `components/chat/chat-input.tsx` (MODIFY - add labels)
- `components/chat/planning-progress.tsx` (MODIFY - add live region)
- `components/chat/route-attachment-card.tsx` (MODIFY - add labels/hints)

### WRITE-PROHIBITED
- No visual/behavior changes
- No breaking API changes

## DESIGN

### References
- Red-Hat Review Report: "Accessibility Gaps"
- WCAG 2.1 AA Guidelines
- React Native Accessibility API

### Pattern 1: TextInput Label
```typescript
// In chat-input.tsx:188-203
<TextInput
  accessibilityLabel="Chat input field"
  accessibilityHint="Type your ride request and tap send"
  placeholder="Where would you like to ride?"
  // ...
/>
```

### Pattern 2: Button Labels and Hints
```typescript
// Send button
<TouchableOpacity
  accessibilityLabel="Send message"
  accessibilityHint="Sends your ride request to the planning assistant"
  accessibilityRole="button"
  onPress={handleSend}
>
  <SendIcon />
</TouchableOpacity>
```

### Pattern 3: Live Region for Phase Updates
```typescript
// In planning-progress.tsx
<View
  accessibilityLiveRegion="polite"
  accessibilityLabel={`Planning phase: ${phase}`}
>
  <Text>{phaseLabel}</Text>
</View>
```

### Pattern 4: Route Card Labels
```typescript
// In route-attachment-card.tsx
<TouchableOpacity
  accessibilityLabel={`Route: ${route.name}`}
  accessibilityHint="Double tap to view route details and highlight on map"
  accessibilityRole="button"
  onPress={() => onSelect(route.id)}
>
  {/* card content */}
</TouchableOpacity>
```

### Anti-pattern (DO NOT)
- Do not use placeholder as accessibilityLabel (it's not read on iOS)
- Do not skip accessibilityHint for non-obvious actions
- Do not forget accessibilityRole for interactive elements

## CODING STANDARDS
- **brain/docs/coding-standards**: Accessibility-first development
- WCAG 2.1 AA compliance

## DEPENDENCIES
- US-012: ChatInputBar integration

## NOTES
- TextInput at `chat-input.tsx:188-203` lacks accessibilityLabel
- PlanningProgress at `chat-input.tsx:32-63` has no accessibilityLiveRegion
- Route cards at `route-attachment-card.tsx:77-100` lack accessibilityHint
- These gaps make the app unusable for screen reader users
- Accessibility is a requirement for production deployment
