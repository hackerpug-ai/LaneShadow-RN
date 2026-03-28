# Pre-Existing Issues Blocking Commit

## TypeScript Errors
Multiple pre-existing TypeScript errors in the codebase:

### Test Files (using jest instead of vitest)
- `app/(app)/(tabs)/__tests__/saved-routes.filter.test.ts` - Multiple lines: Cannot use namespace 'jest' as a value

### Route Polyline Test
- `components/map/route-polyline.test.tsx:109` - Syntax errors (line 109, column 28+): Multiple TS1005, TS1136, TS1109, TS1146, TS1434, TS1443 errors

### Agent Plan Ride
- `convex/actions/agent/planRide.ts:52` - Property 'origin' does not exist on type
- `convex/actions/agent/planRide.ts:53` - Property 'destination' does not exist on type

## Lint Warnings
- ESLint configuration error: "react-native" plugin not found in configuration
- This is a configuration issue, not related to the code changes

## Test Failures
- 30 test files failed | 14 passed
- 34 tests failed | 114 passed
- Main failures:
  - `convex/actions/agent/providers/__tests__/routingProvider.test.ts` - Cannot find module '../routingProvider'
  - `components/map/route-polyline.test.tsx` - Cannot read properties of undefined (reading 'length')

## Verification

All issues verified as pre-existing via git stash test:
1. Stashed changes
2. Ran `bun run type-check` - Same errors present
3. Ran `bun run lint` - Same ESLint configuration error
4. Ran `bun run test` - Same test failures
5. Restored changes

## New Changes Verification

The new files created/modified for US-040 have NO errors:
- `models/favorite-roads.ts` - No TypeScript errors
- `convex/schema.ts` (modified) - No TypeScript errors in schema definition

Verified with: `npx tsc --noEmit convex/schema.ts models/favorite-roads.ts`
Result: No errors
