# US-021 Evidence Bundle

## Commits
- `9856fbaefd05b9df915e0a5831dc292fa199538e` - Test file (RED → GREEN complete)
- `fb88deca9e621d16608c265e2f641b2aaf8399f7` - Model + implementation changes

## TDD Summary

| AC | Test | Result |
|----|------|--------|
| AC-1 | softDeleteRoute sets deletedAt and stores scheduledDeletionId | PASS |
| AC-2 | undoDeleteRoute cancels scheduled deletion and clears deletedAt | PASS |
| AC-3 | permanentlyDeleteRoute deletes the document | PASS |
| AC-3 | permanentlyDeleteRoute is a no-op when already deleted | PASS |
| AC-4 | undoDeleteRoute throws NOT_FOUND when route does not exist | PASS |
| AC-5 | shouldExcludeFromList excludes docs where deletedAt is set | PASS |
| AC-5 | shouldExcludeFromList includes docs where deletedAt is not set | PASS |
| AC-5 | shouldExcludeFromList includes docs where deletedAt is undefined | PASS |

Total: 10 tests passing

## Files Modified
- `models/saved-routes.ts` - Added `deletedAt` (optional number) and `scheduledDeletionId` (optional _scheduled_functions id) to savedRouteValidator
- `convex/db/savedRoutes.ts` - Added helpers, handlers, and mutations
- `convex/db/__tests__/savedRoutes.softDelete.test.ts` - New test file (10 tests)

## Endpoints Added
- `softDeleteRoute` (public mutation) - Sets deletedAt, schedules permanent delete in 5s, returns {scheduledDeletionId}
- `undoDeleteRoute` (public mutation) - Cancels scheduled deletion, clears deletedAt
- `permanentlyDeleteRoute` (internal mutation) - Permanently deletes the route (scheduler callback)
