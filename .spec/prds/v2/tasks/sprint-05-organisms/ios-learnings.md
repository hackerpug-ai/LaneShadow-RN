# iOS Learnings: UC-ORG-04 — LSRouteSheet Organism

## Implementation Date
2026-04-24

## Edge Cases Discovered

### 1. WeatherEntry and WeatherCondition Type Visibility
**Issue**: WeatherEntry and WeatherCondition types are defined in LSWeatherBadge.swift and LSWeatherTimeline.swift but were not initially accessible from LSRouteSheetTests.

**Root Cause**: LSWeatherTimeline.swift was not added to project.yml, so the Xcode project didn't include it in compilation.

**Resolution**: Added both LSInstrumentReadout.swift and LSWeatherTimeline.swift to project.yml under the Molecules section, then ran `scripts/ios/generate-project.sh` to regenerate the Xcode project.

**Lesson Learned**: Always verify that molecule dependencies are added to project.yml before implementing organisms that consume them. The Xcode project doesn't auto-discover files.

### 2. TypographyVariant.opinion.lg Does Not Exist
**Issue**: LSRouteSheet tried to use `.opinion.lg` for the route title, but this variant doesn't exist in the TypographyVariant enum.

**Root Cause**: The spec uses `typography.opinion.lg` as a token path, but this doesn't map directly to a Swift enum case.

**Resolution**: Added a public extension to TypographyVariant (following the pattern from LSNavHeader.swift):
```swift
public extension TypographyVariant {
    struct OpinionVariants: Sendable {
        public let lg = TypographyVariant.heading.lg
    }
    static let opinion = OpinionVariants()
}
```

**Lesson Learned**: Token paths in the spec don't always map 1:1 to Swift API. Check existing implementations (like LSNavHeader) for extension patterns that bridge spec tokens to Swift types.

### 3. Test Data Model Duplication
**Issue**: LSRouteSheetTests defined its own RouteDetails struct, causing a type mismatch with the public RouteDetails type from LSRouteSheet.

**Root Cause**: The test initially defined a local RouteDetails struct before LSRouteSheet was implemented.

**Resolution**: Removed the duplicate RouteDetails from the test file and used the public type from LSRouteSheet (accessible via `@testable import LaneShadow`).

**Lesson Learned**: When implementing TDD, define test data models after the production types are created, or use the production types directly once they exist.

## API Contract Notes

### RouteDetails Model
- Simple struct with 8 properties: id, title, subtitle, isBest, distance, time, climb, scenic
- All values are Strings (no numeric types) — matches the UI display requirements
- `isBest: Bool` controls whether LSBestBadge is rendered
- Conforms to Equatable and Sendable for safe concurrent access

### WeatherEntry Model
- Public type from LSWeatherTimeline.swift
- Properties: hour (String), condition (WeatherCondition enum), temp (String)
- WeatherCondition cases: .clear, .rain, .wind, .storm, .hot, .cold
- Automatically includes id: UUID for Identifiable conformance

### Handler Signature
- All handlers are `() -> Void` (no parameters)
- Handlers fire exactly once when triggered (verified in tests)
- onDismiss is called when the sheet is dismissed via drag-down gesture

## UI Decisions

### Scrollable Content with Sticky Action Row
**Decision**: Wrapped header, instrument, and weather sections in a ScrollView, with the action row outside the scroll using `.frame(maxWidth: .infinity)` on buttons.

**Rationale**: This ensures the action row is always visible while allowing the content to scroll. The flex ratio (1:2 for Save:Ride) is achieved by giving both buttons `maxWidth: .infinity` and relying on the HStack spacing.

**Alternative Considered**: Using `.safeAreaInset(edge: .bottom)` for the sticky action row. Not chosen because the spec doesn't require safe-area integration and the simpler HStack approach works well.

### Typography Variant Mapping
**Decision**: Route title uses `.opinion.lg` (which maps to `.heading.lg`), subtitle uses `.body.md`.

**Rationale**: The opinion serif variant is the brand-appropriate choice for route titles. Mapping to `.heading.lg` provides the correct font size and weight.

**Trade-off**: Added a public extension to TypographyVariant, which could be consolidated into a single location (e.g., a TypographyVariant+Extensions.swift file) if this pattern repeats.

### Conditional Best Badge Rendering
**Decision**: Used `if route.isBest { LSBestBadge() }` in the header section.

**Rationale**: Simple SwiftUI conditional rendering. The badge only appears when `route.isBest == true`, which matches the spec's "Alt Route (no Best badge)" story.

**Edge Case**: When the badge is hidden, the VStack spacing remains consistent because the badge has no space when not rendered.

## Platform-Specific Notes

### SwiftUI @Observable vs ObservableObject
- **Used**: Neither for LSRouteSheet (it's a stateless view)
- **Pattern**: LSRouteSheet is a pure view component that receives all data via init parameters
- **Future Consideration**: If this organism needs internal state (e.g., loading states), use `@Observable` per the architecture principles

### NavigationStack vs NavigationView
- **Not Applicable**: LSRouteSheet doesn't handle navigation directly
- **Integration**: LSRouteSheet is presented via LSBottomSheet, which uses SwiftUI's `.sheet()` modifier
- **Note**: The parent screen (not this organism) is responsible for presentation

### Color and Spacing Tokens
- **All colors use semantic tokens**: `LaneShadowTheme.color.surface.card`, `.border.strong`, etc.
- **No hardcoded colors**: Verified via grep for `Color(hex:`, `Color(red:`, etc. (AC-6 gate)
- **Spacing tokens**: `theme.space.md`, `theme.space.sm`, `theme.space.xs`
- **No magic numbers**: All layout values use theme tokens

### SwiftFormat Compliance
- **Initial errors**: Blank lines before declarations, trailing commas
- **Resolution**: Ran `swiftformat` to auto-fix
- **Verification**: `swiftformat --lint` now passes with no errors
- **Lesson**: Run swiftformat as part of the build/commit process to catch issues early

## Files Created/Modified

### Created
- `ios/LaneShadow/Views/Organisms/LSRouteSheet.swift` — Main organism implementation
- `ios/LaneShadowTests/Organisms/LSRouteSheetTests.swift` — TDD test suite (5 tests, all passing)
- `ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteSheetStory.swift` — 5 stories (Best, Alt, Long Title, Mixed Weather, Dark Mode)

### Modified
- `ios/project.yml` — Added LSInstrumentReadout, LSWeatherTimeline, and LSRouteSheet to sources
- `ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift` — Registered LSRouteSheetStory.all

## Verification Checklist

- [x] AC-1: Full best-route composition renders (test: `test_best_route_full_composition`)
- [x] AC-2: Save/Ride/Dismiss handlers fire exactly once (test: `test_save_ride_dismiss_handlers_fire_once`)
- [x] AC-3: Sheet uses LSBottomSheet molecule with .large detent (test: `test_sheet_uses_lsbottomsheet_molecule_large_detent`)
- [x] AC-4: Alt route hides Best badge (test: `test_alt_route_hides_best_badge`)
- [x] AC-5: All five variant stories registered (test: `test_route_sheet_stories_registered`)
- [x] AC-6: No banned primitives (grep gate: 0 occurrences of Font.system, Color(hex:, Color(red:, .monospaced())
- [x] SwiftFormat lint passes (swiftformat --lint exits 0)
- [x] Xcode build succeeds (BUILD SUCCEEDED)
- [x] All tests pass (TEST SUCCEEDED for LSRouteSheetTests suite)
- [x] All new .swift files are in Xcode project (verified via grep in project.pbxproj)

## Next Steps

None. UC-ORG-04-ios is complete and ready for review.
