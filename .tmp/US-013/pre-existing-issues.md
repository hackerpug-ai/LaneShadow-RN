# Pre-existing Issues (not caused by US-013)

## Typecheck Errors
- `components/map/route-polyline.test.tsx:109` - Multiple TypeScript parse errors (pre-existing)
- Verified by: running `git stash && tsc --noEmit` produces identical errors

## Lint Errors
- ESLint cannot find plugin "react-native" for rule "react-native/no-inline-styles"
- Verified by: running `git stash && eslint .` produces identical error

## Test Failures (pre-existing)
- `hooks/use-place-autocomplete.test.ts` - Missing EXPO_PUBLIC_CONVEX_URL env var
- `convex/actions/agent/tools/__tests__/probeConditions.test.ts` - Missing CLERK_WEBHOOK_SECRET env var
- `convex/actions/agent/providers/__tests__/routingProvider.test.ts` - Missing CLERK_WEBHOOK_SECRET
- `convex/actions/agent/__tests__/planRide.test.ts` - TypeScript errors in planRide.ts
- `app/(app)/(tabs)/saved-routes.test.ts` - React Native ESM import issue in test env

## US-013 Target Tests
- `components/ui/saved-route-card.test.ts` - 8/8 PASSING
