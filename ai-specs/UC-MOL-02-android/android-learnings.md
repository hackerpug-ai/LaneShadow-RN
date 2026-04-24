# Android Learnings: UC-MOL-02 Toolbar + NavHeader

## Implementation Date
2026-04-24

## Edge Cases Discovered
1. `connectedDebugAndroidTest` does not accept `--tests`; filtering must use `-Pandroid.testInstrumentationRunnerArguments.class=...`.
2. `LaneShadowThemeValues` still does not expose `sizing.component.toolbarHeight`; bridging toolbar height from spacing rungs (`space.4xl`) silently produces `64dp`, which violates the canonical component token value (`56dp`).
3. A `top > 0` assertion is not a valid insets proof; use two toolbars with injected `WindowInsets` values and assert the exact height delta equals the injected top inset.

## API Contract Notes
- Toolbar and nav header expose semantics keys for token verification (`height`, title/subtitle variants, background color, insets-applied flag).
- Toolbar now also exposes semantics for icon-button variant and icon size (`Ghost`, `sizing.icon.md`) so tests can verify composition semantics directly.
- `LSToolbarTrailing.Actions` is explicitly modeled as two actions to satisfy the required two-action variant and stable slot API.
- AC-1 verification should assert `56.dp` (or a dedicated component token API) directly in test code; asserting against `theme.toolbarComponentSizing.toolbarHeight` can self-validate a broken bridge.

## UI Decisions
- Toolbar chrome uses `GeneratedTokens.color.Surface.primary` and applies `Modifier.windowInsetsPadding(WindowInsets.systemBars)` at root.
- `LSToolbar` accepts an optional `windowInsets` parameter (default `WindowInsets.systemBars`) to allow deterministic instrumentation tests without changing production behavior.
- Icon actions are composed using `LSButton` (ghost) plus a centered bare `LSIcon` so slot composition satisfies both atom constraints and md icon sizing intent.
- Android `LSNavHeader` large-title variants are static (no collapse behavior) per UC-MOL-02 requirements.
- Toolbar height bridge now uses a dedicated component token API (`ToolbarHeightComponentToken = 56.dp`) instead of any spacing ladder mapping.

## Gotchas for iOS Implementer
- If iOS has direct `component.toolbarHeight` token exposure, do not mirror the Android bridge workaround.
- If iOS needs deterministic safe-area tests, prefer injectable inset sources in the component API rather than assertions against absolute Y-position.
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
