# US-029: Add swipe-to-delete gesture on route cards

## Status: COMPLETED

## Changes Made

### New Files
- `app/(app)/(tabs)/__tests__/saved-routes.swipe.test.ts` - 5 tests covering all acceptance criteria

### Modified Files
- `app/(app)/(tabs)/saved-routes.components.tsx` - Added `SwipeableRouteCard` wrapper component
- `app/(app)/(tabs)/saved-routes.tsx` - Wrapped cards in SwipeableRouteCard, added delete dialog + soft-delete + undo toast flow
- `app/(app)/(tabs)/saved-routes.test.ts` - Added missing mocks for new dependencies (gesture-handler, notifier, delete-route-dialog)
- `app/(app)/(tabs)/__tests__/saved-routes.filter.test.ts` - Added missing mocks for new dependencies

### Implementation Details
- `SwipeableRouteCard` uses `Swipeable` from react-native-gesture-handler
- `renderRightActions` shows red delete area with trash-can-outline icon
- Tapping delete area or completing full swipe opens `DeleteRouteDialog`
- After confirmation: `useSoftDeleteRoute` + undo toast via `Notifier` (same flow as US-028)
- Only one card can be swiped open at a time (previous one closes on new open)
- All colors use semantic tokens: `danger.default` for background, `onSecondary.default` for icon

### Acceptance Criteria Verification
| AC | Description | Status |
|----|-------------|--------|
| 1 | Swipe left reveals red delete area with trash icon | PASS |
| 2 | Complete swipe/tap opens delete confirmation dialog | PASS |
| 3 | Confirm triggers soft-delete + undo toast | PASS |
| 4 | Partial swipe snaps back (Swipeable built-in) | PASS (built-in behavior) |
| 5 | Semantic tokens for delete area styling | PASS |

### Test Results
```
Test Suites: 3 passed, 3 total
Tests:       34 passed, 34 total (5 new swipe + 10 filter + 19 screen)
```
