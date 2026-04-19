# iOS Learnings: DiscoveryFilterBar Component

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Test Discovery Issue**: Unit tests for SwiftUI components using XCTest may not be discovered automatically in Xcode project setup. Tests compile successfully but show "Executed 0 tests" even when test classes and methods exist.
   - **Workaround**: Build verification (`xcodebuild build`) succeeds, confirming code compiles correctly. Manual verification via SwiftUI Preview used for visual validation.
   - **Impact**: Cannot rely on automated test execution in current environment without resolving Xcode project test target configuration.

2. **Icon System Mapping**: RN uses string-based icon names (e.g., "check-all", "road-variant") that map to icon libraries. iOS uses SF Symbols with different naming conventions (e.g., "checkmark.circle.fill", "road.variant").
   - **Resolution**: Mapped RN icon names to closest SF Symbol equivalents. Some mappings are approximate (e.g., "motorbike" → "bicycle").
   - **Learning**: iOS icon system requires different naming than RN; maintain mapping table for cross-platform consistency.

3. **Count Formatting**: Large numbers need formatting (e.g., 1250 → "1.2k", 150 → "99+").
   - **Resolution**: Implemented `formatCount()` function matching RN logic exactly.
   - **Learning**: Count formatting is business logic that belongs in the component, not a separate utility.

## API Contract Notes
- `LSRouteArchetype` enum matches RN `RouteArchetype` type exactly (all, twisties, scenic, technical, cruising, sport, adventure)
- Selection behavior: "All" clears filter (empty array), other archetypes toggle
- Deselecting last archetype auto-selects "All" (clears to empty array)
- Counts dictionary uses enum keys, not string keys (type-safe)
- Test helper `simulateTap()` added for unit testing selection logic

## UI Decisions
- **Glassmorphic Background**: Used `.opacity(0.8)` on surface color, `.opacity(0.2)` on border - matches RN exactly
- **Horizontal ScrollView**: Used `ScrollView(.horizontal, showsIndicators: false)` - matches RN horizontal scroll
- **Chip Component**: Reused existing `LSChip` atom - no duplication, consistent styling
- **Border Implementation**: Used `Rectangle()` with `fill()` and `frame(height:)` instead of `.overlay()` - simpler, more reliable

## Platform-Specific Notes
- **SF Symbols vs Custom Icons**: RN uses custom icon library, iOS uses SF Symbols. Some mappings are approximate.
- **Enum Iteration**: Used `CaseIterable` and `filter { $0 != .all }` to iterate archetypes while keeping "All" first
- **Test Helper Pattern**: Added `simulateTap()` method as public interface for testing - allows unit tests to verify selection logic without SwiftUI rendering complexities

## Files Created/Modified
- **Created**: `ios/LaneShadow/Views/Molecules/DiscoveryFilterBar.swift` - Main component implementation
  - `LSRouteArchetype` enum with labels and icon mappings
  - `LSDiscoveryFilterBar` view with glassmorphic design
  - `formatCount()` helper for number formatting
  - `simulateTap()` test helper for unit testing
  - SwiftUI Preview with multiple states (no selection, single, multiple)
- **Created**: `ios/LaneShadowTests/Molecules/DiscoveryFilterBarTests.swift` - Unit tests (see test discovery note above)

## Testing Status
- ✅ Code compiles successfully: `xcodebuild build`
- ⚠️  Unit tests: Cannot execute due to test discovery issue (tests compile but don't run)
- ✅ Implementation verified against RN source and specifications
- ✅ All theme tokens used correctly (no hardcoded values)
- ✅ SwiftUI Preview available for visual verification

## Android Learnings Applied
From `android-learnings.md` for Badge component (most recent):
- **No hardcoded colors**: Used `theme.colors.surface.default` and `theme.colors.border.default` with opacity
- **Semantic spacing**: Used `theme.space.md/lg/sm` for all padding and spacing
- **Component reuse**: Leveraged existing `LSChip` atom instead of reimplementing chip logic
