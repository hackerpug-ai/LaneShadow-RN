# DESIGN-005 Evidence Bundle

## Task Summary
**Task ID:** DESIGN-005
**Title:** IntentSearchInput with Loading/Offline/Cache States
**Epic:** Epic 3 - Local Discovery Layer & React Hooks
**Status:** ✅ Completed

## Commit Details
**Commit SHA:** `c9e700abc1571b462c3b526d0e8f3ce3ecfcecbb`
**Commit Message:** DESIGN-005: IntentSearchInput with Loading/Offline/Cache States

## Files Created
1. `components/discovery/intent-search-sheet.tsx` (289 lines)
2. `components/discovery/intent-summary-pill.tsx` (128 lines)

## Acceptance Criteria Verification

### AC-001: Input with keyboard
✅ **IMPLEMENTED**
- Uses `BottomSheetWrapper` with `hasTextInput={true}`
- Bottom sheet appears with search input
- Keyboard opens automatically (Gorhom native handling)
- Placeholder: "Describe your ideal ride..."
- Dismissible by swiping down (Gorhom default)

### AC-002: Cache hit instant (no spinner)
✅ **IMPLEMENTED**
- `cache_hit` state renders with zero loading indicators
- Shows `IntentSummaryPill` with search text
- No `ActivityIndicator` in cache-hit render path
- Instant visual feedback

### AC-003: Online loading spinner
✅ **IMPLEMENTED**
- `searching` state shows copper `ActivityIndicator`
- Status message: "Finding your perfect ride..."
- Helper text: "This usually takes 1-2 seconds"
- Input disabled during loading (`isDisabled` prop)

### AC-004: Offline empty state with chips
✅ **IMPLEMENTED**
- `offline_unsupported` state shows "Connect to search" message
- Recent-intent chips displayed in horizontal ScrollView
- Chips are tappable (onPress callback: `onRecentIntentTap`)
- Semi-transparent background for map visibility
- Wifi-off icon for visual clarity

### AC-005: Clear search resets to browse
✅ **IMPLEMENTED**
- Clear button (X icon) in input row
- Calls `onClear()` callback
- Resets query text and search state
- Collapses sheet via `BottomSheetWrapper onClose`

## Design Patterns Applied
- ✅ All colors use `semantic.color.*` tokens (no hardcoded hex)
- ✅ All spacing uses `semantic.space.*` tokens
- ✅ All typography uses `semantic.type.*` tokens
- ✅ Copper accent (`semantic.color.primary.default`) for interactive elements
- ✅ Glassmorphic overlay pattern (semi-transparent backgrounds)
- ✅ `BottomSheetWrapper` for consistent sheet behavior
- ✅ Mock states with sample data (no real hooks)

## Component Structure

### IntentSearchSheet
```typescript
type SearchState =
  | { status: 'idle' }
  | { status: 'cache_hit'; summary: string }
  | { status: 'searching' }
  | { status: 'offline_unsupported'; recentIntents: string[] }
  | { status: 'results'; summary: string }
```

**Visual States:**
1. **Idle:** Empty input field with placeholder
2. **Cache Hit:** Intent summary pill with instant results
3. **Searching:** Spinner with status message
4. **Offline:** Empty state with recent-intent chips
5. **Results:** Intent summary pill with search results

### IntentSummaryPill
```typescript
type IntentSummaryPillProps = {
  text: string
  onDismiss: () => void
  testID?: string
}
```

**Visual Treatment:**
- Glassmorphic background (10% copper opacity)
- Copper border (30% opacity)
- Copper accent dot (8px circle)
- Dismissible via X button
- Semi-transparent for map visibility

## Testing Notes
- TypeScript compilation: ✅ Pass
- ESLint: ✅ Pass (0 errors, warnings allowed)
- Components render without runtime errors
- Mock state props for visual verification
- No real data hooks (design task)

## Additional Fixes
- Fixed invalid MaterialCommunityIcons name in route-pin.tsx: `mountain` → `image-filter-hdr`
- Fixed ESLint eqeqeq errors: `!=` → `!==` in route-pin.tsx

## Verification Checklist
- [x] Bottom sheet opens with keyboard-avoiding input
- [x] Cache-hit state renders with no spinner and intent summary pill
- [x] Online loading state renders with spinner and status message
- [x] Offline state renders with "Connect to search" and recent-intent chips
- [x] Clear button resets search and collapses sheet
- [x] Intent summary pill shows search text
- [x] All colors from useSemanticTheme (no hardcoded hex)
- [x] No attempt to show spinner for cache hits
- [x] Component renders without runtime errors
- [x] TypeScript compiles cleanly
- [x] ESLint passes (0 errors)

## Next Steps
- **CUR-013:** Wire real `useIntentSearch` hook to replace mock state props
- **DESIGN-001:** Integrate with RouteDiscoveryScreen layout
- **Testing:** Add Storybook stories for visual testing

## Implementation Notes
This is a **DESIGN task** — components render mock states for visual verification only.
Real data integration (Convex hooks, Haiku API) will be implemented in CUR-013.
