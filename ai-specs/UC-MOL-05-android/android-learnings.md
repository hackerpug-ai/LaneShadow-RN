# Android Learnings: UC-MOL-05 Pill Semantics Family

## Implementation Date
April 24, 2026

## Edge Cases Discovered
1. `connectedDebugAndroidTest --tests ...` is not a valid Gradle filter for instrumentation in this project; class filtering must use `-Pandroid.testInstrumentationRunnerArguments.class=...`.
2. The AC-7 story gate is source-line based (`grep -c`), so dynamic story generation via loops undercounts even if runtime story count is high; explicit ID lines are required.

## API Contract Notes
- No backend/API contract changes were required for this UI-only scope.
- Weather semantics are modeled locally via `WeatherCondition` and resolved to token-backed colors/icons in `PillSemanticsTypes.kt`.

## UI Decisions
- `LSSuggestionChip` uses named `SuggestionChipPillSize` mapped to `PillSize.Md` to satisfy fixed 32dp height without hardcoded inline height values.
- All four molecules compose `LSPill` + `LSIcon`/`LSText` atoms and resolve semantic colors through `LaneShadowTheme` generated tokens (no raw color literals).

## Gotchas for iOS Implementer
- Keep weather condition type centralized and shared (`WeatherCondition`) because downstream molecules (chat/timeline) depend on the same semantic contract.
- If your story gate is source-based (line grep), avoid compact loop-based registration when acceptance checks count literal IDs.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/molecules/PillSemanticsTypes.kt` - shared semantic types and token style resolvers
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSTagPill.kt` - tag pill molecule
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSFilterChip.kt` - filter chip molecule
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSSuggestionChip.kt` - suggestion chip molecule
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSWeatherBadge.kt` - weather badge molecule
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSTagPillTest.kt` - AC-1 test
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSFilterChipTest.kt` - AC-2 test
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSWeatherBadgeTest.kt` - AC-4/AC-5 tests
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSSuggestionChipUiTest.kt` - AC-3 tap-once test
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSFilterChipUiTest.kt` - AC-8 tap-once test
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSPillSemanticsStory.kt` - 16 molecule stories (12+ required)
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt` - molecules story aggregation
- `android/app/src/debug/java/com/laneshadow/sandbox/stories/AppStories.kt` - added molecules stories to app registry
