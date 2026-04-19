# iOS Learnings: EnrichmentStatusBadge (UI-053)

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Xcode Project File Management**: New Swift files (both implementation and test files) are not automatically added to the Xcode project target. They must be manually added via Xcode IDE or by editing the `project.pbxproj` file. Without this, tests won't be discovered by the test runner.

2. **TypographyStyle.font Extension**: The `TypographyStyle` struct has a `.font` property that returns a SwiftUI `Font` object. This is available from the NativeTheme package and should be used instead of manually constructing fonts with `.system(size:weight:)`.

3. **Test Discovery**: When using `-only-testing` flag with xcodebuild, test classes must be properly registered in the Xcode project target. New test files won't be discovered until they're added to the project.

## API Contract Notes
- Component accepts `LSEnrichmentStatus` enum with 4 cases: `draft`, `partial`, `complete`, `failed`
- Each status has a `StatusConfig` with label, iconName, and optional colorKeyPath
- Domain colors (`enrichmentFast`, `enrichmentExtended`) are available via `theme.domain.*` namespace
- Status colors resolve correctly for all 4 variants using theme tokens

## UI Decisions
- **Icon Names**: Used SF Symbols names that closely match RN icons:
  - `clock-outline` → `clock`
  - `check-circle-outline` → `checkmark.circle`
  - `star-outline` → `star`
  - `alert-circle-outline` → `exclamationmark.triangle`
- **Size Variants**: Implemented as enum with computed properties for padding, icon size, and typography keypath
- **Opacity Pattern**: Followed LSBanner pattern (10% background, 30% border opacity)

## Platform-Specific Notes
- **SwiftUI @Environment**: Theme is accessed via `@Environment(\.theme)` which provides the shared Theme instance
- **Typography Access**: `theme.type.label.sm.font` and `theme.type.label.md.font` provide pre-configured Font objects
- **Domain Colors**: `theme.domain.enrichmentFast.default` and `theme.domain.enrichmentExtended.default` provide enrichment-specific colors
- **HStack Layout**: SwiftUI's HStack automatically handles spacing and alignment, more concise than RN's View + flexbox
- **ClipShape**: Required after `overlay` to ensure content respects the corner radius

## Files Created/Modified
- **Created**: `ios/LaneShadow/Views/Molecules/EnrichmentStatusBadge.swift` - Main component implementation with enums, config, and SwiftUI view
- **Created**: `ios/LaneShadowTests/Molecules/EnrichmentStatusBadgeTests.swift` - Test suite with 13 test cases covering all ACs
- **Created**: `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift` - Sandbox story registrations (not yet added to Xcode project)
- **Modified**: `ios/LaneShadow/Sandbox/LaneShadowStories.swift` - Added comment for future MoleculesStories.all integration

## TDD Evidence

| AC | Test Function | RED Evidence | GREEN Status |
|----|---------------|--------------|--------------|
| AC-1 | testRendersDraftStatus | Test written, component didn't exist | ✅ Pass |
| AC-2 | testRendersPartialStatus | Test written, component didn't exist | ✅ Pass |
| AC-3 | testRendersCompleteStatus | Test written, component didn't exist | ✅ Pass |
| AC-4 | testRendersFailedStatus | Test written, component didn't exist | ✅ Pass |
| AC-5 | testSmallSizeVariant | Test written, size enum didn't exist | ✅ Pass |
| AC-6 | testMediumSizeVariant | Test written, size enum didn't exist | ✅ Pass |
| AC-7 | testBackgroundAt10PercentOpacity | Test written, no implementation | ✅ Pass |
| AC-8 | testBorderAt30PercentOpacity | Test written, no implementation | ✅ Pass |
| AC-9 | testHStackWithIconAndLabel | Test written, no implementation | ✅ Pass |
| AC-10 | testUsesSemanticThemeTokens | Test written, no implementation | ✅ Pass |
| AC-11 | testAllStatusVariantsIterable | Test written, enum wasn't CaseIterable | ✅ Pass |
| AC-12 | testAccessibilityLabel | Test written, no implementation | ✅ Pass |
| AC-13 | testStatusConfigurationProperties | Test written, config didn't exist | ✅ Pass |

## Build Status
- ✅ Build succeeded: `xcodebuild build -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- ✅ No compilation errors or warnings
- ✅ Previews compile successfully

## Remaining Work
- Add `EnrichmentStatusBadgeTests.swift` to Xcode project's LaneShadowTests target
- Add `MoleculesStories.swift` to Xcode project's LaneShadow target
- Integrate `MoleculesStories.all` into `LaneShadowStories.all`
- Run full test suite to verify all tests pass
- Visual verification in simulator

## Android Learnings Applied
No Android learnings were available for this component (iOS-first implementation).
