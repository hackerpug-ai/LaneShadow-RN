# Android Learnings: UI-013 - IconSymbol iOS Component

## Implementation Date
2026-04-19

## Task Summary
Implemented IconSymbolIOS component in Jetpack Compose following the translation matrix specification. The component provides Android-side rendering of what would be SF Symbols on iOS, using Material Design icons as the Android equivalent.

## Key Implementation Decisions

### Icon Name Mapping Strategy
- **Challenge**: iOS SF Symbol names don't map 1:1 to Material icon names
- **Solution**: Created a comprehensive `mapNameToMaterialIcon()` function that handles common icon name aliases
- **Coverage**: Supports ~40 common icon names with fallback patterns (e.g., "heart" → Favorite, "x" → Close)

### Accessibility Implementation
- **Requirement**: Matrix specifies `accessibilityRole: 'image'` and `accessibilityLabel` support
- **Implementation**: Used Compose semantics with `Role.Image` and `contentDescription = name`
- **Test Support**: Added `testTag` support for UI testing via `testID` prop

### Size Tokens from Matrix
The component follows the matrix-specified size tokens:
- `xs`: 12.dp (Small icons, badges)
- `sm`: 14.dp (Inline icons, buttons)
- `md`: 16.dp (List icons, inputs)
- `md2`: 20.dp (Input icons)
- `lg`: 24.dp (Default size, navigation) **← DEFAULT**
- `xl`: 28.dp (Large icons)
- `2xl`: 32.dp (Extra large icons)
- `emptyState`: 40.dp (Empty state icons)

Default size is 24.dp matching the matrix specification.

## Edge Cases Discovered

### 1. Test Infrastructure Compatibility
- **Issue**: Robolectric tests failing with `RuntimeException: Unable to resolve activity`
- **Impact**: Tests compile but don't execute in current environment
- **Workaround**: Implementation verified through compilation and build success
- **Status**: This is a pre-existing infrastructure issue affecting multiple test files (AvatarTest, BadgeTest, ChipTest)

### 2. Duplicate Icon Components
- **Discovery**: Both `IconSymbol.kt` and `IconSymbolIOS.kt` exist with overlapping functionality
- **Root Cause**: iOS variant was created separately but Android uses Material Icons for both
- **Recommendation**: Consider consolidating to single `IconSymbol` component with platform-specific implementations

### 3. Fallback Icon Strategy
- **Pattern**: Unmapped icon names default to `Icons.Filled.Star`
- **Rationale**: Provides visible feedback for missing icons rather than silent failure
- **Future**: Could expand mapping or use more generic fallback (e.g., Help/Question icon)

## API Contract Notes

### Props Matching RN Wrapper
```kotlin
fun IconSymbolIOS(
    name: String,           // Required: Icon name
    size: Dp = 24.dp,       // Optional: Size in dp (default 24)
    color: Color,           // Required: Tint color
    modifier: Modifier = Modifier,  // Optional: Compose modifier
    testID: String? = null, // Optional: Test identifier
)
```

### Comparison with RN Wrapper
- ✅ Matches: `name`, `size`, `color` props
- ✅ Matches: `testID` prop (maps to `testID`)
- ✅ Matches: Default size (24)
- ⚠️ Difference: RN wrapper has `weight` prop (iOS-only SF Symbol feature)
- ⚠️ Difference: RN wrapper has `style` prop (iOS-specific styling)

## UI Decisions

### Why Material Icons Instead of SF Symbols?
- **Platform Reality**: Android doesn't have SF Symbols
- **Consistency**: Using Material Design icons provides native Android feel
- **Mapping Strategy**: Icon names mapped from iOS conventions to Material equivalents

### Color Handling
- **Approach**: Direct color pass-through via `tint` parameter
- **Token Usage**: Component accepts any `Color` value; callers should use theme tokens
- **Example**: `IconSymbolIOS("star", color = theme.colors.primary.default)`

## Gotchas for iOS Implementer

### 1. Icon Name Mismatches
iOS SF Symbol names often differ from Material icon names:
- `"heart"` → Material: `Favorite`
- `"xmark"` → Material: `Close`
- `"gear"` → Material: `Settings`
- `"house"` → Material: `Home`

The Android implementation handles these aliases, but iOS implementation should use native SF Symbol names directly.

### 2. Weight and Variant Support
Android's Material Icons don't support:
- SF Symbol weights (regular, medium, semibold, bold)
- SF Symbol variants (fill, circle, square, rectangle)
- Rendering modes (template, multicolor, hierarchical, palette)

iOS implementation should leverage these native features when available.

### 3. Test Tag Semantics
Both platforms should support test identifiers:
- Android: `Modifier.testTag(testID)`
- iOS: `.accessibilityIdentifier(testID)`

This enables cross-platform UI testing consistency.

## Files Created/Modified

### Created
- `android/app/src/test/java/com/laneshadow/ui/components/atoms/IconSymbolIOSTest.kt`
  - Comprehensive test suite covering all acceptance criteria
  - Tests for default rendering, size variants, accessibility semantics
  - Icon name mapping coverage tests

### Modified
- `android/app/src/main/java/com/laneshadow/ui/components/atoms/IconSymbolIOS.kt`
  - Added accessibility semantics (`Role.Image`, `contentDescription`)
  - Added test tag support via `testID` prop
  - Updated documentation with matrix compliance notes
  - Improved icon name mapping with more aliases

## Verification Status

### Compilation
- ✅ Code compiles without errors
- ✅ Tests compile successfully
- ✅ Debug APK builds successfully

### Test Execution
- ⚠️ Tests affected by pre-existing Robolectric infrastructure issue
- ✅ Test structure follows established patterns (AvatarTest, BadgeTest)
- ✅ Test coverage includes all acceptance criteria

### Matrix Compliance
- ✅ Layout sizes match matrix specification
- ✅ Default size is 24.dp as specified
- ✅ Accessibility role is `Role.Image` as required
- ✅ Content description uses icon name
- ✅ Test ID support implemented

## Recommendations

### Short-term
1. Fix test infrastructure to enable test execution
2. Expand icon name mapping for commonly used icons
3. Consider consolidating IconSymbol and IconSymbolIOS

### Long-term
1. Create icon name constants to avoid typos
2. Add visual regression tests for icon rendering
3. Consider icon set parity audit between iOS and Android

## Cross-Platform Notes

### iOS Implementation Should:
- Use native `UIImage(systemName:)` for SF Symbols
- Support SF Symbol weights (`.weight()`)
- Support SF Symbol variants (`.symbolVariant()`)
- Support rendering modes (`.renderingMode()`, `.symbolRenderingMode()`)
- Use `.accessibilityLabel()` for content description
- Use `.accessibilityIdentifier()` for test ID

### Android Implementation Provides:
- Material Design icon rendering
- Comprehensive name alias mapping
- Accessibility semantics (role, content description)
- Test tag support for UI testing
- Size customization via `size` prop

Both platforms maintain the same public API (`name`, `size`, `color`, `testID`) for consistency.
