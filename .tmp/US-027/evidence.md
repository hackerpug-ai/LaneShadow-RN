# US-027: Wire search + date filter into saved-routes screen

## Status: COMPLETED
## Commit: 64388da0bf9e1e62be466c63553cf884f1933c2a

## Files Modified
- `hooks/use-saved-routes.ts` - Extended useSavedRoutesList to accept searchQuery/afterDate/beforeDate
- `app/(app)/(tabs)/saved-routes.tsx` - Wired filter state + FilterHeader into screen (149 lines)
- `app/(app)/(tabs)/saved-routes.components.tsx` - Added FilterHeader, FilteredEmptyState, LoadingState
- `app/(app)/(tabs)/__tests__/saved-routes.filter.test.ts` - 10 new tests

## Test Results
```
Test Suites: 2 passed, 2 total
Tests:       29 passed, 29 total (10 new + 19 existing)
```

## Acceptance Criteria
- [x] AC1: Search bar filters list via debounced query (forwarded to backend)
- [x] AC2: Date chip filters list by date range (forwarded to backend)
- [x] AC3: "Clear all filters" resets search + date (key-reset pattern for DateRangePicker)
- [x] AC4: Result count shown when filters active ("N routes found")
- [x] AC5: "Clear all filters" hidden when no filters active
- [x] AC6: Filtered empty state: "No routes match your filters"

## Notes
- Lint has pre-existing config issue (missing react-native ESLint plugin) - not caused by this change
- Type-check has pre-existing errors in route-polyline.test.tsx - not caused by this change
- Screen file: 149 lines (under 150-line limit)
- Zero hardcoded colors/spacing - all semantic tokens
