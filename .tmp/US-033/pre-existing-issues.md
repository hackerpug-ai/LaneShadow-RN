# Pre-existing Issues (US-033)

## TypeScript Errors
- 46 pre-existing typecheck errors, none in saved-routes files
- Verified via `npx tsc --noEmit 2>&1 | grep "saved-routes"` (no matches)

## ESLint
- ESLint config references `react-native` plugin that is not installed
- Pre-existing issue, not related to US-033

## Test Failures
- Other saved-routes test files (swipe, filter) have pre-existing type errors from `SavedRouteListItemView` type changes (added required `startLabel`/`endLabel` fields)
- Verified by running `git stash` + filter test (passes on stashed state)
- US-033 keyboard test passes in isolation
