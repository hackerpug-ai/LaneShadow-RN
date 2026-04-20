# iOS Learnings: UI-001 Avatar

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **AsyncImage phase handling**: The Avatar component properly handles all AsyncImage phases:
   - `.success` - displays the loaded image
   - `.failure` - falls back to initials with full opacity
   - `.empty` - shows initials with 0.5 opacity while loading
   - `@unknown default` - provides future-proofing for new phases

2. **Theme environment access**: The component uses `@Environment(\.theme)` instead of `Theme.shared` singleton, which is the modern SwiftUI pattern and allows for theme switching in previews.

3. **Badge positioning**: The badge is positioned using `.offset(x:y:)` with theme-based spacing (`theme.space.xs` = 4pt), matching the RN wrapper's -4px offset.

4. **Duplicate implementations**: Two Avatar.swift files existed:
   - `/ios/LaneShadow/Avatar.swift` - Legacy implementation with hardcoded values
   - `/ios/LaneShadow/Views/Atoms/Avatar.swift` - Modern implementation with theme tokens
   The modern implementation should be used and the legacy file removed.

## API Contract Notes
- **Size variants**: `AvatarSize` enum with `.defaultSize`, `.lg`, `.xl` cases
- **Image source**: Expects `String?` URL (not ImageSourcePropType like RN)
- **Badge closure**: Uses `(() -> AnyView)?` instead of `React.ReactNode` for type safety
- **Accessibility**: Properly labels avatars with `alt` text or initials fallback

## UI Decisions
- **AsyncImage over UIImage**: Using SwiftUI's AsyncImage for remote image loading instead of UIImage
- **Circle clip shape**: Using `.clipShape(Circle())` for consistent rounded corners
- **Overlay for border/ring**: Using `.overlay(Circle().stroke())` for border/ring rendering
- **ZStack for badge**: Using `ZStack(alignment: .topTrailing)` for badge positioning

## Platform-Specific Notes
- **SwiftUI vs React Native**: SwiftUI uses value types (structs) instead of reference types (components)
- **ViewBuilder pattern**: Badge content uses `@ViewBuilder` closure pattern instead of children prop
- **Environment values**: Theme accessed via `@Environment(\.theme)` instead of `useSemanticTheme()` hook
- **Font system**: Uses `.font(.system(size:weight:))` instead of RN's font scale system

## Theme Token Compliance
All styling uses semantic tokens from `Theme.shared`:
- **Sizes**: `theme.size.avatarDefault/Lg/Xl` (40/64/96)
- **Typography**: `theme.type.body.sm/title.lg/display.sm.fontSize` (16/24/36)
- **Colors**: `theme.colors.muted.default`, `theme.colors.onSurface.default`
- **Border**: `theme.colors.border.default`, `theme.colors.primary.default`
- **Stroke**: `theme.borderWidth.thick` (2)
- **Radius**: `theme.radius.full`
- **Spacing**: `theme.space.xs` (4, for badge offset)

## Files Created/Modified
- `ios/LaneShadow/Views/Atoms/Avatar.swift` - Modern Avatar implementation with theme tokens
- `ios/LaneShadowTests/Components/UI/Atoms/AvatarTests.swift` - Test coverage for all ACs
- `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift` - Added Avatar stories for visual verification

## Test Coverage
- **AC-1**: `testAvatarDefaultRendering()` - Verifies default rendering with initials
- **AC-1**: `testAvatarDefaultSize()` - Verifies default size (40×40)
- **AC-2**: `testAvatarStylePropertiesMatchMatrix()` - Tests all size variants
- **AC-2**: `testAvatarBorderProperties()` - Tests border styling
- **AC-2**: `testAvatarRingProperties()` - Tests ring styling
- **AC-3**: `testAvatarStates()` - Tests image, initials, and badge states
- **AC-3**: `testAvatarBadgeVariants()` - Tests all badge color variants

## Known Issues
1. Avatar files not yet added to Xcode project - need to be added via Xcode IDE or project file edit
2. Legacy `Avatar.swift` in root directory should be removed to avoid confusion
3. Tests need Xcode project configuration to run successfully

## Recommendations
1. Use the modern `Views/Atoms/Avatar.swift` implementation
2. Remove legacy `LaneShadow/Avatar.swift` file
3. Add Avatar files to Xcode project using IDE or script
4. Run tests in Xcode to verify all ACs pass
