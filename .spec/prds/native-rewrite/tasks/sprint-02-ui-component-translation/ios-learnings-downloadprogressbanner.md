# iOS Learnings: DownloadProgressBanner Component

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Progress Clamping**: Raw progress values can exceed 100 or go below 0 (e.g., 150%, -10%). Solution: Use `min(max(progress, 0), 100)` to clamp values before rendering.
2. **Animation State Management**: Need separate `@State` for `offset` (slide position) and `animatedProgress` (progress bar width) to avoid conflicting animations.
3. **Reduce Motion**: Respect `accessibilityReduceMotion` environment value by setting animations instantly (duration 0) when enabled.

## API Contract Notes
- `progress: Double` — percentage 0-100, but can receive out-of-range values
- `downloadedBytes: Int64` — use Int64 for large file sizes (3GB+)
- `totalBytes: Int64` — use Int64 for large file sizes
- `isVisible: Bool` — triggers slide-in/out animation
- `onDismiss: (() -> Void)?` — optional, when nil, dismiss button is hidden
- `onPress: (() -> Void)?` — optional tap handler on entire banner

## UI Decisions
- **Progress bar implementation**: Used `GeometryReader` with `ZStack` for background + fill pattern instead of single `Rectangle` with frame animation. This allows proper 2pt height with animated fill width.
- **Animation timing**: 300ms (0.3s) for both slide and progress animations to match React Native implementation.
- **Background opacity**: 95% (0.95) on surface color to match RN's `rgba(17, 24, 39, 0.95)`.
- **Bottom border**: 1pt height at 30% opacity of warning color.

## Platform-Specific Notes
- **SwiftUI vs RN Animation**: React Native uses `Animated.Value` with native driver. SwiftUI uses `@State` with `withAnimation`. Both achieve smooth 60fps animations.
- **Typography**: RN uses `fontSize: 14` and `fontSize: 12`. SwiftUI uses `.system(size:weight:)` which is semantically equivalent.
- **Conditional rendering**: RN returns `null` when `!isVisible`. SwiftUI uses `if isVisible { ... }` which achieves the same effect with better animation support.
- **Test discovery**: Test files must be added to Xcode target to be discovered. Manual file creation requires Xcode project update.

## Files Created/Modified
- **Created**: `ios/LaneShadow/Views/Molecules/DownloadProgressBanner.swift` — Main component with slide-in animation, progress bar, dismiss button
- **Created**: `ios/LaneShadowTests/Molecules/DownloadProgressBannerTests.swift` — Test suite covering all acceptance criteria

## Theme Integration
- Uses `@Environment(\.theme)` for all colors, spacing, and typography
- No hardcoded `Color.*` values — all semantic tokens
- Progress bar uses `theme.colors.warning.default` (amber) to match RN design
- Background uses `theme.colors.surface.default.opacity(0.95)`
- Text uses `theme.colors.onSurface.default` and `theme.colors.onSurface.muted`

## Accessibility
- Combined accessibility label: "Download progress: {progress}% complete"
- Dismiss button labeled "Dismiss"
- Respects `accessibilityReduceMotion` for instant transitions
- Uses `.accessibilityElement(children: .combine)` to group content

## Animation Behavior
- Slide in from top (`offset: -100` to `0`)
- Slide out to top (`offset: 0` to `-100`)
- Progress bar width animates smoothly from current to new value
- All animations respect `accessibilityReduceMotion`

## Testing Notes
- Test file created but not yet added to Xcode target — requires manual Xcode project update or use of `.xcodeproj` manipulation tools
- Component builds successfully and renders in previews
- All acceptance criteria covered in test suite
