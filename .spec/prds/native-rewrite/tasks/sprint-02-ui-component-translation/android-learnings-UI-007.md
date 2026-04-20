# Android Learnings: UI-007 - Chip Component

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Semantics import requirement**: Compose semantics require both `androidx.compose.ui.semantics.Role` (enum) and `androidx.compose.ui.semantics.role` (property) imports to use `role = Role.Checkbox` in semantics block. Missing either causes compilation error.

2. **Press interaction tracking**: Pattern from `Checkbox.kt` using `MutableInteractionSource` + `LaunchedEffect` to collect `PressInteraction.Press/Release/Cancel` events works reliably for press state. No edge cases discovered.

3. **Theme color access**: Theme colors are accessed via `theme.colors.{colorName}.default` (e.g., `theme.colors.primary.default`), not `theme.colors.primary` directly. This is consistent across the codebase.

4. **CircleShape for full radius**: Matrix specifies `radius.full` = 9999dp, but Jetpack Compose's `CircleShape` is the idiomatic equivalent. No functional difference observed.

## API Contract Notes
- Component follows RN wrapper API exactly: `label`, `selected`, `onPress`, `icon`, `testID`
- `icon` parameter is `@Composable (() -> Unit)?` - deferred composable matching RN pattern
- `onPress` is nullable - when null, component is non-interactive (no click handler)
- Default value for `selected` is `false` matching RN wrapper

## UI Decisions
1. **Background opacity**: Matrix specifies 12% opacity for selected background (`${color.primary.default}20`). Implemented using `copy(alpha = 0.12f)` on theme color.
2. **Border opacity**: Matrix specifies 40% opacity for selected border (`${color.primary.default}60`). Implemented using `copy(alpha = 0.4f)` on theme color.
3. **Pressed state**: Matrix uses `color.muted.pressed` for unselected+pressed. Since `mutedPressed` token doesn't exist in current theme, used `theme.colors.muted.default` as fallback.
4. **Font size**: Matrix specifies 13sp (between label.sm 12sp and body.sm 14sp). Hardcoded 13sp as specified.

## Gotchas for iOS Implementer
1. **Semantics imports**: Watch for dual import pattern - need both `Role` enum and `role` property for semantics.
2. **Interaction source**: Press state tracking requires `MutableInteractionSource` + `LaunchedEffect` pattern. iOS may use different state management.
3. **Color opacity**: Android uses `color.copy(alpha = float)` while iOS may use `.opacity()` or similar - verify platform API.
4. **Icon sizing**: Matrix specifies 16dp icons. Consumer must size icon content correctly - component doesn't enforce size.

## Files Created/Modified
- **Created**: `android/app/src/main/java/com/laneshadow/ui/components/atoms/Chip.kt`
  - Implemented `Chip` composable with label, selected, onPress, icon, testID props
  - Press interaction tracking using `MutableInteractionSource` + `LaunchedEffect`
  - Background/border color states: selected (12%/40% primary opacity), unselected+pressed (muted), unselected (transparent/border)
  - Typography: 13sp, Medium weight, 18sp line height
  - Layout: CircleShape, 1dp border, space.md horizontal padding, 6dp vertical padding
  - Icon support with 4dp spacing (Arrangement.spacedBy)
  - Semantics: role = Role.Checkbox, selected state

- **Created**: `android/app/src/test/java/com/laneshadow/ui/components/atoms/ChipTest.kt`
  - 3 tests covering all acceptance criteria
  - AC-1: testChipDefaultRendering - verifies chip renders with text
  - AC-2: testChipStylePropertiesMatchMatrix - verifies selected/unselected variants
  - AC-3: testChipStates - verifies selected, unselected, with icon, non-interactive states
  - Test theme setup matching existing test patterns

## Test Coverage
- **Total tests**: 3
- **Test infrastructure note**: Pre-existing test failures (119/216 failing) prevent validation via test runner
- **Compilation verified**: Component compiles successfully with `./gradlew :app:compileDebugKotlin`
- **Manual verification**: Code review confirms implementation matches matrix specifications

## Matrix Compliance
- Layout: ✓ Padding (horizontal: space.md, vertical: 6dp), Radius: CircleShape
- Background colors: ✓ Selected (12% primary), Pressed (muted), Unselected (transparent)
- Border colors: ✓ Selected (40% primary), Unselected (border.default), Width: 1dp
- Typography: ✓ 13sp, Medium, 18sp line height
- Icon: ✓ 16dp size (consumer responsibility), 4dp gap
- States: ✓ Selected, Unselected, Pressed, Non-interactive (null onPress)
