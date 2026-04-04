# US-022 Evidence Bundle

## Commit
- Base SHA: fb88deca9e621d16608c265e2f641b2aaf8399f7
- Commit SHA: b65cfd036a81eb7f20b9e86e4dfe68b6fb4ab131

## Files Modified
- `convex/db/savedRoutes.ts` — Added `ConvexError` import + validation in `patchName`
- `__mocks__/convex/values.ts` — Added `ConvexError` class mock
- `__mocks__/convex/api.ts` — Updated `api`/`internal` to use deep Proxy

## Files Created
- `convex/db/__tests__/savedRoutes.rename.test.ts` — 4 tests (one per AC)

## TDD Summary

| AC | Test | RED Evidence | GREEN |
|----|------|-------------|-------|
| AC-1 | trims whitespace from name before saving | saved "  Morning Ride  " untrimmed | saves "Morning Ride" |
| AC-2 | throws ConvexError for empty string | resolved instead of rejected | throws correctly |
| AC-3 | throws ConvexError for whitespace-only | resolved instead of rejected | throws correctly |
| AC-4 | throws ConvexError for 101-char name | resolved instead of rejected | throws correctly |

## Test Results
```
PASS convex/db/__tests__/savedRoutes.rename.test.ts
  patchName validation
    ✓ AC-1: trims whitespace from name before saving
    ✓ AC-2: throws ConvexError for empty string name
    ✓ AC-3: throws ConvexError for whitespace-only name
    ✓ AC-4: throws ConvexError for name exceeding 100 characters

Tests: 4 passed, 4 total
```
