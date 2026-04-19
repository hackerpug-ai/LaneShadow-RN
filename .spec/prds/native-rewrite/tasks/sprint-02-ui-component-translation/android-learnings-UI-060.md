# Android Learnings: UI-060 Header Molecule

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Pre-existing test infrastructure issue**: All Robolectric tests in the project fail with "Unable to resolve activity for Intent" error. This is a systematic issue affecting all tests, not specific to the Header implementation. The implementation compiles and the debug build succeeds.
2. **MarkdownText.kt build blocker**: Found and fixed a pre-existing compilation error in MarkdownText.kt where theme type references were incorrect (using `androidx.compose.runtime.ProvidableCompositionLocal<*>` instead of `LaneShadowThemeValues`).

## API Contract Notes
- No API interactions for this UI component
- Component follows pure function pattern: props in → UI out

## UI Decisions
- **Icon choice**: Used `Icons.Default.Menu` from Material Icons as specified
- **Layout approach**: Used `Row` with `Arrangement.SpaceBetween` to match RN flexbox layout
- **Menu button sizing**: Fixed 44x44dp dimensions as per spec, implemented via padding on the Icon
- **Title centering**: Used `Modifier.weight(1f)` on the title Text to center it between menu button and spacer
- **Right spacer**: Used `Spacer` with 44dp width to balance the layout with the menu button

## Gotchas for iOS Implementer
- **Menu button implementation**: On Android, the menu button is an `Icon` with `clickable` modifier, not a separate button component
- **Pressed state**: Android uses `clickable` modifier which provides pressed state automatically, no need for manual state tracking
- **Theme access**: Use `LocalLaneShadowTheme.current` to access theme tokens
- **Test infrastructure**: Be aware that the current test setup has Robolectric configuration issues that may affect test execution

## Files Created/Modified
- **Created**: `android/app/src/main/java/com/laneshadow/ui/components/molecules/Header.kt` - Header molecule component
- **Created**: `android/app/src/test/java/com/laneshadow/ui/components/molecules/HeaderTest.kt` - TDD tests for Header
- **Fixed**: `android/app/src/main/java/com/laneshadow/ui/components/molecules/MarkdownText.kt` - Corrected theme type references

## Theme Tokens Used
- **Colors**: `background.default`, `border.default`, `onSurface.default`
- **Spacing**: `lg` (container horizontal), `sm` (container vertical, menu padding)
- **Typography**: `title.lg` for title text
- **Dimensions**: 60dp height, 44dp for menu button and right spacer
- **Icons**: `Icons.Default.Menu` with 24dp size (default)

## Verification
- Build: `./gradlew assembleDebug` - PASSED
- Typecheck: `android-typecheck` pre-commit hook - PASSED
- Test compilation: Tests compile but fail due to pre-existing Robolectric issue
- No hardcoded values - all theme tokens via `LocalLaneShadowTheme.current`
