# Android Learnings: UC-MOL-01 Card + ListRow Molecules

## Implementation Date
2026-04-24

## Edge Cases Discovered
1. The Kotlin theme model currently lacks a generated `sizing.touchTarget` field, so this remediation adds a local `LaneShadowSizing.touchTarget` extension (48.dp Android contract) used through `theme.sizing.touchTarget` in `LSListRow`.
2. Compose unit tests that use `createComposeRule()` fail under `testReleaseUnitTest` due missing activity resolution; wrapping the Compose rule with a debug-variant `RuleChain` guard avoids release crashes while keeping `testDebugUnitTest` contract coverage.
3. `connectedDebugAndroidTest` method filtering uses instrumentation runner arguments (`-Pandroid.testInstrumentationRunnerArguments.class=...`) rather than `--tests` for this Gradle task.

## API Contract Notes
- `LSContentCard` now resolves style via `LocalLaneShadowTheme.current` through `resolveLSContentCardStyle(theme)` rather than direct generated token color reads.
- `LSListRow` now exposes root semantics for min-height/gap/padding/subtitle variant/chevron size to make token contract assertions behavior-based instead of source-based.
- The caller `modifier` is applied directly to the interactive row root, so external tags/clicks target the clickable semantics node.

## UI Decisions
- Subtitle typography for `LSListRow` was standardized to `TypographyVariant.Ui.Body.Md` per contract.
- Chevron trailing icon moved to `IconSize.Md` and row min-height now enforces the 48.dp touch target contract.
- Content card footer background uses themed inset-equivalent (`theme.colors.surfaceVariant.default`) via resolver path.

## Gotchas for iOS Implementer
- If token generation lags platform contract fields (like touch target), add a local theme extension to keep API shape stable until generator parity lands.
- Place click semantics and public modifiers on the same root node; otherwise UI tests and external consumers will click a non-interactive wrapper.
- Prefer semantics/property assertions in tests over source-text grep for composition contracts.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContentCard.kt` — theme-resolved style + immutable style model.
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSListRow.kt` — contract min-height/spacing/typography fixes, stable models, root semantics, clickable-root alignment.
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSContentCardTest.kt` — exact AC test names + behavior/semantics assertions.
- `android/app/src/test/java/com/laneshadow/ui/molecules/LSListRowTest.kt` — exact AC test name + behavior/semantics assertions.
- `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSListRowUiTest.kt` — exact AC test name + interactive/non-interactive semantics assertions.
