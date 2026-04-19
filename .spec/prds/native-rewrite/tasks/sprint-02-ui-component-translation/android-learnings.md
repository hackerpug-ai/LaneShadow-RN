# Android Learnings: UI-001 Avatar Component

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Robolectric + Compose Testing**: Unit testing Compose components with Robolectric is challenging due to `createComposeRule()` requiring Android instrumentation. The test infrastructure needs `InstrumentationRegistry` which doesn't work well in Robolectric without proper manifest configuration.
   - **Solution**: For now, skipped unit tests and focused on compilation + visual verification via sandbox story
   - **Future**: Consider using instrumented tests (`androidTest`) or improving Robolectric configuration

2. **Theme Token Construction**: Building mock `LaneShadowThemeValues` for tests requires instantiating many nested data classes (Colors, Space, Radius, Type, Elevation, Motion, Opacity, DomainColors).
   - **Solution**: Created a helper `TestTheme` composable that provides all required tokens
   - **Future**: Consider a test utilities module with pre-built test themes

3. **TextStyle Constructor Changes**: Compose's `TextStyle` constructor changed from positional parameters to named parameters.
   - **Solution**: Use named parameters: `TextStyle(fontSize = 16.sp, lineHeight = 24.sp, fontWeight = FontWeight.Medium)`
   - **Note**: This is a breaking change in newer Compose versions

## API Contract Notes
- **AvatarSize enum**: Uses `Default`, `Large`, `ExtraLarge` (not `lg`, `xl` like RN) for idiomatic Kotlin
- **AvatarBadgeVariant enum**: Matches RN variants (`Default`, `Success`, `Warning`, `Danger`)
- **Badge positioning**: Uses Compose's `Modifier.offset(x = (-4).dp, y = (-4).dp)` for the -4px offset
- **Border vs Ring**: `showBorder` uses `theme.colors.border.default`, `showRing` uses `theme.colors.primary.default`

## UI Decisions
- **Hardcoded sizes**: Avatar sizes (40dp, 64dp, 96dp) are hardcoded per matrix specification rather than using theme tokens
  - **Rationale**: Matrix specifies exact pixel values, and these are fundamental to the component's design system
- **CircleShape**: Uses `CircleShape` instead of `RoundedCornerShape(theme.radius.full)` for simplicity
  - **Rationale**: `CircleShape` is the standard Compose way to create perfect circles
- **Badge padding**: Uses hardcoded `4.dp` horizontal and `2.dp` vertical per matrix
  - **Rationale**: Matrix specifies exact pixel values for badge internal padding

## Gotchas for iOS Implementer
1. **Enum naming**: Android uses `Default`/`Large`/`ExtraLarge` for sizes - iOS may prefer `default`/`lg`/`xl` to match RN
2. **Theme access**: Uses `LocalLaneShadowTheme.current` to access theme tokens - ensure iOS has equivalent theme provider
3. **Compose unit tests**: Testing Compose UI components requires special setup - iOS tests may be more straightforward
4. **ContentScale**: Matrix specifies `ContentScale.Crop` (Android) / `.scaledToFill()` (iOS) for image resize mode

## Files Created/Modified
- **Modified**: `android/app/src/main/java/com/laneshadow/ui/components/atoms/Avatar.kt` - Existing implementation, verified correct
- **Created**: `android/app/src/main/java/com/laneshadow/ui/sandbox/stories/AppStories.kt` - Added AvatarDemo story
- **Attempted**: `android/app/src/test/java/com/laneshadow/ui/components/atoms/AvatarTest.kt` - Unit tests (blocked by Robolectric issues)
- **Created**: `android/app/src/debug/AndroidManifest.xml` - Test manifest for Robolectric (didn't fully resolve issues)

## Component Verification
✅ **AC-1**: Component renders in default state with initials
✅ **AC-2**: All style properties match matrix (sizes: 40/64/96, border: 2dp, colors from theme)
✅ **AC-3**: Component handles states (showBorder, showRing, badge)

## Build Verification
✅ `./gradlew :app:compileDebugKotlin` - SUCCESS
✅ `./gradlew :app:assembleDebug` - SUCCESS

## Next Steps
1. Resolve Robolectric test configuration or move to instrumented tests
2. Add Coil dependency for AsyncImage support (currently TODO in Avatar.kt)
3. Add accessibility labels (`semantics { contentDescription = ... }`) for better screen reader support
