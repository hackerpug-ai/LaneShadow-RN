# Pre-existing Issues (US-039)

## Typecheck
- `components/map/route-polyline.test.tsx` line 109: syntax errors (pre-existing, unrelated)

## Lint
- ESLint config references `react-native` plugin that is not installed (pre-existing)

## Tests
- `saved-routes.keyboard.test.ts`: US-033 test expects `keyboardShouldPersistTaps="handled"` but feature not yet implemented (TDD test-first, in progress by another agent)
- `saved-routes.test.ts`: US-030 tests expect Pressable wrapper in SavedRouteCard but feature not yet implemented (TDD test-first, in progress by another agent)
- `routingProvider.test.ts`: Missing CLERK_WEBHOOK_SECRET env var (pre-existing)
- `computeRouteIndex.test.ts`: Missing CLERK_WEBHOOK_SECRET env var (pre-existing)

All verified pre-existing via `git stash` comparison.
