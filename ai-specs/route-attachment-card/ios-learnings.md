# iOS Learnings: RouteAttachmentCard Component

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Weather badge optional handling**: The `weatherBadge` property on `LSRouteAttachment` is optional (`LSWeatherBadge?`). The component must safely unwrap it with conditional rendering (`if let weatherBadge = route.weatherBadge`).
2. **Scenic score formatting**: The scenic score is a `Double` that needs formatting to 1 decimal place for display. Used `String(format: "%.1f", route.scenicScore)` to ensure consistent display (e.g., "8.5" not "8.500000").
3. **Label truncation**: Route labels can be long and should truncate to 1 line with ellipsis. Applied `.lineLimit(1)` to prevent overflow in the horizontal layout.
4. **Press state handling**: SwiftUI doesn't have a built-in press state like React Native's `Pressable`. Used `@State private var isPressed` with `simultaneousGesture(DragGesture(minimumDistance: 0))` to detect press and change opacity to 0.8.

## API Contract Notes
- `LSRouteAttachment` model is already defined in `ChatModels.swift` with all required fields
- `LSWeatherBadge` type enum has four cases: `.clear`, `.rain`, `.wind`, `.cloudy`
- Weather badge color mapping follows semantic tokens: rain → danger, wind → warning, others → muted
- The `id` field is a `String` (not UUID) for compatibility with Convex

## UI Decisions
- **Horizontal single-row layout**: Followed React Native reference exactly to maximize space efficiency in chat transcripts
- **Icon mapping**: Added weather icons to `LSIconSymbol.iconMap` (sunny, rainy, windy, cloudy) to maintain single source of truth for icon names
- **Best badge placement**: Positioned before the label (left side) to match React Native layout and prevent layout shift when best status changes
- **Stat items**: Used icon + text pairs for distance and duration to reduce visual noise (icons faster to parse than text labels)
- **Scenic score positioning**: Placed on right side as a highlighted metric with primary color and leaf icon

## Platform-Specific Notes
- **SwiftUI press state**: Unlike React Native's built-in `pressed` state in `Pressable`, SwiftUI requires custom gesture handling. Used `DragGesture(minimumDistance: 0)` with `onChanged`/`onEnded` to simulate press state.
- **Button vs conditional rendering**: Used `Group` with conditional `Button` vs static view to avoid unnecessary button wrapper when `onRoutePress` is nil. This improves accessibility and removes default button styles.
- **Opacity animation**: Press state opacity change (0.8) matches React Native reference exactly for consistency.
- **Accessibility**: Added `.accessibilityLabel("Route: \(route.label)")` and `.accessibilityAddTraits(.isButton)` for VoiceOver support.
- **Test identifiers**: Used `testID` parameter for UI testing support, following existing component patterns.

## Files Created/Modified
- **Created**: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift` (370 lines)
  - Main component implementation with full variant support (standard, best route, weather badges)
  - Six preview variants for visual verification (standard, best, rainy, windy, multiple cards, dark mode)
- **Created**: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadowTests/Molecules/RouteAttachmentCardTests.swift` (193 lines)
  - TDD tests for all acceptance criteria
  - Tests cover: rendering, weather badges, best badge, tap handler, theme tokens, edge cases
- **Modified**: `/Users/justinrich/Projects/LaneShadow/ios/LaneShadow/Views/Atoms/IconSymbol.swift`
  - Added weather icon mappings: `weather-sunny`, `weather-rainy`, `weather-windy`, `weather-cloudy`, `weather-partly-cloudy`
  - Added navigation icon mappings: `map-marker-distance`, `clock-outline`, `leaf`

## TDD Evidence
| AC | Test File | Test Function | RED Evidence |
|----|-----------|---------------|--------------|
| AC-1 | RouteAttachmentCardTests.swift | componentRendersWithAllRouteInfo | Test compilation fails initially because LSRouteAttachmentCard didn't exist |
| AC-2 | RouteAttachmentCardTests.swift | weatherBadgeDisplaysWhenApplicable | Verifies weatherBadge optional handling |
| AC-2 | RouteAttachmentCardTests.swift | weatherBadgeNilWhenNotProvided | Verifies nil weatherBadge doesn't crash |
| AC-3 | RouteAttachmentCardTests.swift | bestBadgeDisplaysWhenIsBest | Verifies isBest flag handling |
| AC-3 | RouteAttachmentCardTests.swift | bestBadgeNotShownWhenNotBest | Verifies isBest=false hides badge |
| AC-4 | RouteAttachmentCardTests.swift | tapHandlerCallbackSupported | Verifies onRoutePress callback accepted |
| AC-4 | RouteAttachmentCardTests.swift | tapHandlerIsOptional | Verifies nil onRoutePress renders static card |
| AC-5 | RouteAttachmentCardTests.swift | themeTokensUsed | Verifies no hardcoded values (code review) |

## Build Verification
- **Main target build**: SUCCEEDED (xcodebuild build -scheme LaneShadow)
- **Component compilation**: No errors or warnings
- **Previews**: Six preview variants compile successfully for visual verification

## Next Steps
- Integration with ChatTranscript component for rendering route attachments in messages
- Consider adding compact variant for map overlay use case (React Native has both full and compact variants)
- Visual verification on simulator for different screen sizes and dynamic type settings
