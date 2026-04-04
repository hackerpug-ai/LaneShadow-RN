# Improve Error Handling and Add Error UI

> Status: PENDING
> Created: 2026-04-04
> Source: Red-Hat Review (Error Handling Gaps)

> Task ID: US-019
> Type: FEATURE
> Priority: P1
> Estimate: 120 minutes
> Assignee: react-native-ui-implementer, frontend-designer

## CRITICAL CONSTRAINTS

### MUST
- Map specific error codes to conversational messages in backend
- Add error message display UI component for PLANNING_ERROR state
- Show errors as chat bubbles or inline alerts
- Distinguish between timeout, rate limit, parse failure, generation failure

### NEVER
- Show generic "try again" message for all error types
- Display raw error objects or stack traces to users
- Use modal dialogs for errors (must be conversational)

### STRICTLY
- All error types must produce helpful, actionable chat messages

## SPECIFICATION

**Objective:** Add specific error messages for each error type and create UI to display errors to users. Current implementation converts all errors to generic "I'm having trouble right now" message, and PLANNING_ERROR state has no UI rendering.

**Success looks like:** When an error occurs, users see a specific, helpful message like "You've used all 5 monthly plans" or "I couldn't understand that location" instead of generic error text.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Rate limit exceeded | Error occurs | Upsell message shown in chat | Integration test |
| 2 | Parse timeout | Error occurs | "I couldn't understand that" message shown | Integration test |
| 3 | Route generation fails | Error occurs | "Route generation failed" message shown | Integration test |
| 4 | PLANNING_ERROR dispatched | State updated | Error component renders | Visual test |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Rate limit produces upsell message | AC-1 | Integration test passes | [ ] TRUE [ ] FALSE |
| 2 | Parse timeout produces specific message | AC-2 | Integration test passes | [ ] TRUE [ ] FALSE |
| 3 | Generation failure produces specific message | AC-3 | Integration test passes | [ ] TRUE [ ] FALSE |
| 4 | Error UI renders for PLANNING_ERROR | AC-4 | Visual test passes | [ ] TRUE [ ] FALSE |
| 5 | TypeScript compilation succeeds | All | `pnpm typecheck` exits 0 | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED (Backend)
- `convex/actions/agent/sendMessage.ts` (MODIFY - error mapping)
- `convex/actions/agent/ridePlanningAgent.ts` (MODIFY - error messages)

### WRITE-ALLOWED (Frontend)
- `hooks/use-chat-planning.ts` (MODIFY - error handling)
- `components/chat/error-message.tsx` (NEW)
- `components/chat/chat-input.tsx` (MODIFY - render error)

### WRITE-PROHIBITED
- No modal dialogs for errors
- No raw error exposure to UI

## DESIGN

### References
- Red-Hat Review Report: "Generic Error Messages" and "No Error State UI"
- US-013: Conversational error handling requirement
- US-014: Rate limiting error messages

### Backend Pattern
```typescript
// In sendMessage.ts - specific error mapping
const ERROR_MESSAGES = {
  [ERROR_CODES.PLAN_LIMIT_EXCEEDED]: "You've used all 5 monthly plans. Upgrade to Premium for unlimited planning!",
  [ERROR_CODES.AGENTIC_PARSE_FAILED]: "I couldn't understand that location. Try 'scenic ride to Santa Cruz' instead.",
  [ERROR_CODES.ROUTE_GENERATION_FAILED]: "I couldn't generate a route for that request. Try a different destination.",
  NETWORK_TIMEOUT: "Request timed out. Please try again.",
}

// Map error codes to messages
const errorMessage = ERROR_MESSAGES[error.code] || "I'm having trouble right now. Could you try again?"
```

### Frontend Pattern
```typescript
// New component: components/chat/error-message.tsx
export function ErrorMessage({ message }: { message: string }) {
  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorIcon}>⚠️</Text>
      <Text style={styles.errorText}>{message}</Text>
    </View>
  )
}

// In chat-input.tsx - render error in chat flow
{flowState.phase === 'error' && (
  <ErrorMessage message={flowState.errorMessage} />
)}
```

### Anti-pattern (DO NOT)
- Do not use Alert.alert() or modal dialogs
- Do not show technical error details
- Do not use the same message for all error types

## CODING STANDARDS
- **brain/docs/coding-standards**: User-friendly error messages
- Semantic theme tokens for error styling

## DEPENDENCIES
- US-011: useChatPlanning hook (error dispatch)
- US-013: sendMessage action (error handling)
- US-014: Rate limiting

## NOTES
- Backend currently has generic error at `sendMessage.ts:96-103`
- Frontend dispatches PLANNING_ERROR at `use-chat-planning.ts:221-224` but no UI renders it
- Errors should feel conversational, like a riding buddy giving feedback
- Error component should match chat bubble styling for consistency
