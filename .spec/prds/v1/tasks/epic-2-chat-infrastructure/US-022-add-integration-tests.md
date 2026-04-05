# Add Integration Tests for Chat-to-Route Flow

> Status: ✅ Completed (2026-04-05)
> Verified: Integration tests exist, no placeholder tests found
> Created: 2026-04-04
> Source: Red-Hat Review (Test Theatre)

> Task ID: US-022
> Type: TESTING
> Priority: P1
> Estimate: 180 minutes
> Assignee: react-native-ui-implementer, convex-implementer

## CRITICAL CONSTRAINTS

### MUST
- Add integration test for full ChatInput → backend → polyline flow
- Remove vanity tests (`expect(true).toBe(true)`)
- Test real backend integration, not mock dispatches
- Verify route options actually appear in UI

### NEVER
- Write tests that only verify mock function calls
- Leave placeholder tests in production code

### STRICTLY
- Tests must verify end-to-end behavior, not implementation details

## SPECIFICATION

**Objective:** Replace "test theatre" (tests that verify mocks instead of real behavior) with actual integration tests. Current tests pass but feature doesn't work because they verify stubbed implementation.

**Success looks like:** Integration test sends message through ChatInput, verifies backend call, and confirms route options appear. No mock-based tests.

## ACCEPTANCE CRITERIA

| # | Given | When | Then | Verify |
|---|-------|------|------|--------|
| 1 | Integration test run | User sends message | Real backend called | Test passes |
| 2 | Backend returns routes | Response received | UI shows route options | Test passes |
| 3 | Backend errors | Error response | UI shows error message | Test passes |
| 4 | All vanity tests removed | Code review | No `expect(true).toBe(true)` | Manual review |

## TEST CRITERIA

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| 1 | Integration test covers full flow | AC-1 | Test file exists and passes | [ ] TRUE [ ] FALSE |
| 2 | Real backend action called | AC-1 | No mocks for sendMessage | [ ] TRUE [ ] FALSE |
| 3 | Route options verified in UI | AC-2 | Test checks for polylines | [ ] TRUE [ ] FALSE |
| 4 | Error UI tested | AC-3 | Test verifies error display | [ ] TRUE [ ] FALSE |
| 5 | No vanity tests remain | AC-4 | Code review passes | [ ] TRUE [ ] FALSE |

## GUARDRAILS

### WRITE-ALLOWED
- `hooks/__tests__/use-chat-planning.integration.test.ts` (NEW)
- `app/(app)/(tabs)/__tests__/chat-flow.integration.test.tsx` (NEW)
- `convex/actions/agent/__tests__/sendMessage.integration.test.ts` (NEW)
- `hooks/use-chat-planning.test.ts` (MODIFY - remove mocks)
- `convex/actions/agent/__tests__/planRide.test.ts` (MODIFY - remove placeholders)

### WRITE-PROHIBITED
- No new tests that only verify dispatch calls
- No tests that mock the backend entirely

## DESIGN

### References
- Red-Hat Review Report: "Test Theatre"
- US-011: useChatPlanning hook
- US-013: sendMessage action

### Integration Test Pattern
```typescript
// hooks/__tests__/use-chat-planning.integration.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useChatPlanning } from '../use-chat-planning'

describe('useChatPlanning - Integration', () => {
  it('sends message to backend and receives routes', async () => {
    // Arrange
    const { result } = renderHook(() => useChatPlanning(mockDispatch))

    // Act - REAL BACKEND CALL
    await result.current.sendPlanningMessage('scenic ride to Santa Cruz')

    // Assert - REAL RESULT
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: 'PLANNING_SUCCESS',
        payload: {
          planId: expect.any(String),
          options: expect.arrayContaining([
            expect.objectContaining({
              name: expect.any(String),
              polyline: expect.any(Array),
            })
          ])
        }
      })
    })
  })

  it('handles backend errors', async () => {
    // Test error flow with REAL backend
    // ...
  })
})
```

### Full Flow Test
```typescript
// app/(app)/(tabs)/__tests__/chat-flow.integration.test.tsx
describe('Chat to Route Flow - Integration', () => {
  it('complete flow from input to polylines', async () => {
    const { getByPlaceholderText, getByText } = render(<HomeMapScreen />)

    // Type message
    const input = getByPlaceholderText('Where would you like to ride?')
    fireEvent.changeText(input, 'scenic ride to Santa Cruz')

    // Tap send
    const sendButton = getByLabelText('Send message')
    fireEvent.press(sendButton)

    // Wait for REAL backend response
    await waitFor(() => {
      expect(getByText('Coastal Cruiser')).toBeTruthy()
      expect(getByText('Highway Speedster')).toBeTruthy()
    }, { timeout: 15000 })

    // Verify polylines rendered
    const polylines = getAllByTestId('route-polyline')
    expect(polylines.length).toBeGreaterThanOrEqual(2)
  })
})
```

### Anti-pattern (DO NOT)
- Do not use mockDispatch and only verify it was called
- Do not use `expect(true).toBe(true)` placeholders
- Do not test implementation details (internal function calls)

## CODING STANDARDS
- **brain/docs/testing-standards**: Integration over unit tests
- **brain/docs/e2e-testing-rules**: Real backend integration

## DEPENDENCIES
- US-011: useChatPlanning hook
- US-012: ChatInputBar integration
- US-013: sendMessage action

## NOTES
- Current test at `planRide.test.ts:159-167` has `expect(true).toBe(true) // Placeholder`
- Tests in `use-chat-planning.test.ts` verify mock dispatch, not real backend
- This is "test theatre" — tests pass but feature doesn't work
- Integration tests must verify REAL behavior: ChatInput → sendMessage → routes → UI
