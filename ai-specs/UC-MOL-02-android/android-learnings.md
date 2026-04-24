# Android Learnings: UC-MOL-02 Toolbar + NavHeader

## Implementation Date
2026-04-24

## Edge Cases Discovered
1. `connectedDebugAndroidTest` does not accept `--tests`; filtering must use `-Pandroid.testInstrumentationRunnerArguments.class=...`.
2. `LaneShadowThemeValues` currently does not expose `sizing.component.toolbarHeight`; molecule code needs an in-file sizing bridge derived from existing theme tokens.

## API Contract Notes
- Toolbar and nav header expose semantics keys for token verification (`height`, title/subtitle variants, background color, insets-applied flag).
- `LSToolbarTrailing.Actions` is explicitly modeled as two actions to satisfy the required two-action variant and stable slot API.

## UI Decisions
- Toolbar chrome uses `GeneratedTokens.color.Surface.primary` and applies `Modifier.windowInsetsPadding(WindowInsets.systemBars)` at root.
- Icon actions are composed using `LSButton` (ghost) plus a centered bare `LSIcon` so slot composition satisfies both atom constraints and md icon sizing intent.
- Android `LSNavHeader` large-title variants are static (no collapse behavior) per UC-MOL-02 requirements.

## Gotchas for iOS Implementer
- If iOS has direct `component.toolbarHeight` token exposure, do not mirror the Android bridge workaround.
- Keep slot models stable and explicit; avoid ad-hoc lambdas in public APIs when variants are finite and spec-driven.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/ui/molecules/LSToolbar.kt
- android/app/src/main/java/com/laneshadow/ui/molecules/LSNavHeader.kt
- android/app/src/test/java/com/laneshadow/ui/molecules/LSToolbarTest.kt
- android/app/src/test/java/com/laneshadow/ui/molecules/LSNavHeaderTest.kt
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToolbarStory.kt
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSNavHeaderStory.kt
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt
