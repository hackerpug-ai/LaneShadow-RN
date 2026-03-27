# US-018: Preserve list scroll position on navigation - Evidence

## Summary

Scroll position preservation is primarily "free" with the existing Expo Router Stack + Tabs architecture:

1. **Stack navigation**: `saved-route/[id]` pushes onto the Stack, keeping `(tabs)` (and `saved-routes`) mounted. FlatList scroll state is naturally preserved.
2. **Tab switching**: Expo Router Tabs keep screens mounted by default, so switching tabs and returning preserves scroll.
3. **Data changes**: Added `maintainVisibleContentPosition={{ minIndexForVisible: 0 }}` to handle the case where Convex real-time updates push new data while the user is on the detail screen (AC-3).

## Changes Made

### app/(app)/(tabs)/saved-routes.tsx
- Added `maintainVisibleContentPosition={{ minIndexForVisible: 0 }}` to FlatList
- This ensures visible content stays in place when data prepends/inserts occur

### app/(app)/(tabs)/saved-routes.test.ts
- Added mock for `empty-state` component (fixes test import error)
- Added 4 new tests under "US-018: Scroll position preservation":
  - AC-1/AC-2: FlatList stays mounted when data is loaded (no conditional unmount)
  - AC-3: maintainVisibleContentPosition is set for data changes during navigation
  - AC-3: FlatList uses stable keyExtractor so existing items are not re-mounted
  - AC-4: Component does not force scroll-to-top on re-render

## Why This Works (Architecture)

```
app/(app)/_layout.tsx  -->  Stack navigator
  (tabs)               -->  Tabs navigator (stays mounted when detail is pushed)
    saved-routes.tsx   -->  FlatList (stays mounted, scroll preserved)
  saved-route/[id]     -->  Pushed on Stack (tabs underneath, still mounted)
```

## Test Results

All 19 tests pass (15 existing + 4 new US-018 tests).
