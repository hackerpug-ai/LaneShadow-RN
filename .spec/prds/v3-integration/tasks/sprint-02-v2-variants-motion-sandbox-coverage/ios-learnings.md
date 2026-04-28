# iOS Learnings: Motion Recipes Wiring (FID-S02-T01)

## Implementation Date
2026-04-28

## Edge Cases Discovered

### 1. TOKEN GAP - Motion Duration Limitation
**Issue**: Design specification requires 1400ms animation durations for `sketchPolylineLoop` and `breathingHeadDot`, but the motion tokens only provide up to 600ms (`deliberate`).

**Impact**: Cannot read the required 1400ms duration from existing theme tokens.

**Resolution**: Implemented using local constants (1.4 seconds) with clear TODO comments noting the token gap. The tokens need to be updated to include a `deliberative` or `verySlow` duration of 1400ms.

**Example**:
```swift
// TOKEN GAP: Design specifies 1400ms, but tokens only provide up to 600ms ("deliberate").
// Using 1400ms as specified in design until tokens are updated.
static func sketchPolylineLoop(theme: Theme) -> Animation {
    let duration: TimeInterval = 1.4 // 1400ms
    return Animation.linear(duration: duration).repeatForever(autoreverses: false)
}
```

### 2. Xcode Project Registration
**Issue**: Swift files created on disk are not automatically added to the Xcode project (`project.pbxproj`), causing "cannot find 'X' in scope" build errors.

**Impact**: New files must be registered in Xcode before they can be used in the build.

**Resolution**: Instead of creating new extension files, added animation helper extensions directly to the files where they're used (PlanningScreen.swift, LSBestBadge.swift, LSTopBar.swift, LSInlineErrorCallout.swift). This avoids the need to modify the Xcode project file.

### 3. Animation Testing Limitations
**Issue**: SwiftUI animation parameters (duration, easing, repeat mode) cannot be directly introspected in unit tests.

**Impact**: Cannot write automated tests to verify animation timing values.

**Resolution**: Tests verify that views render without crashing and contain the expected elements. Actual animation timing must be verified visually through simulator testing or snapshot tests.

## API Contract Notes

### Motion Token Structure
The theme.motion API provides flat dictionaries:
- `theme.motion.duration[key]` - Returns duration in milliseconds (Int)
- `theme.motion.easing[key]` - Returns cubic bezier control points as [Double]

**Available durations**:
- `instant`: 0ms
- `fast`: 120ms
- `standard`: 240ms
- `slow`: 400ms
- `deliberate`: 600ms

**Available easings**:
- `standard`: [0.4, 0.0, 0.2, 1.0]
- `emphasized`: [0.2, 0.0, 0.0, 1.0]
- `decelerated`: [0.0, 0.0, 0.2, 1.0]
- `accelerated`: [0.4, 0.0, 1.0, 1.0]
- `linear`: [0.0, 0.0, 1.0, 1.0]

### Recipe-Level Tokens Not Implemented
The motion.tokens.json file defines recipe-level tokens like:
```json
"sketchPolylineLoop": {
  "duration": "{motion.duration.deliberate}",
  "easing": "{motion.easing.linear}",
  "iteration": "loop"
}
```

However, the Theme.swift struct only exposes flat dictionaries, not recipe-level objects. This means recipes must be manually resolved by reading duration and easing separately.

## UI Decisions

### 1. Breathing Dot Opacity Range
**Decision**: Changed opacity from 1.0→0.75 to 1.0→0.55 to match the spec exactly.

**Rationale**: The spec explicitly states "opacity oscillates 1.0 ⇄ 0.55", so I updated the implementation to use 0.55 instead of 0.75.

### 2. Breathing Dot Scale Effect Removed
**Decision**: Removed the scaleEffect animation from the breathing dot, keeping only opacity animation.

**Rationale**: The spec only mentions opacity changes ("1.0→0.55→1.0"), not scale changes. The previous implementation had scale 1.0→1.25 which was not in the spec.

### 3. Record Dot Implementation
**Decision**: Created a separate `RecordPulsingDot` view component instead of adding animation inline.

**Rationale**: This keeps the animation logic self-contained and reusable. The component manages its own `@State` for the pulse animation.

### 4. Suggestion Chip Stagger
**Decision**: Added 50ms delay between each suggestion chip's entrance animation.

**Rationale**: Creates a more polished, sequential appearance rather than all chips animating simultaneously. The delay is calculated as `Double(index) * 0.05`.

## Platform-Specific Notes

### SwiftUI Animation Lifecycle
- `.onAppear` is used to trigger animations when views first appear
- `.repeatForever(autoreverses:)` requires the animation to be triggered by a state change
- State changes (`isAnimating = true`) must happen after the view appears to start the animation loop

### SwiftUI Animation Modifiers
- `.animation(_:value:)` is the modern SwiftUI approach (iOS 17+)
- Deprecated `.animation(_:)` modifier should not be used
- Animation modifiers must be applied BEFORE the state-dependent modifier (e.g., `.opacity()`)

### @MainActor Requirement
- Test methods that interact with SwiftUI views must be marked `@MainActor`
- SwiftUI views are main actor isolated by default in iOS 17+

## Files Created/Modified

### Created
- `ios/LaneShadowTests/Sandbox/MotionTests.swift` - Test file for all 5 motion recipes

### Modified
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` - Updated sketch polyline (1400ms linear) and breathing dot (1400ms ease-in-out, 1.0→0.55 opacity)
- `ios/LaneShadow/Views/Atoms/LSBestBadge.swift` - Added entrance animation (scale 0.8→1.0, opacity 0→1, spring)
- `ios/LaneShadow/Views/Organisms/LSTopBar.swift` - Added record dot pulse animation (1400ms ease-in-out, 1.0→0.45 opacity)
- `ios/LaneShadow/Views/Organisms/LSInlineErrorCallout.swift` - Added suggestion chip enter animation (slide-up 8pt, fade-in)

## Visual Verification Required

The following animations should be verified in the iOS Simulator:
1. **PlanningScreen**: Sketch polyline draws at 1400ms linear, repeating forever
2. **PlanningScreen**: Leading head dot breathes 1.0→0.55→1.0 at 1400ms ease-in-out
3. **LSRouteSheet**: Best badge scales from 0.8→1.0 and fades in 0→1 when sheet appears
4. **LSTopBar**: Record dot pulses 1.0→0.45→1.0 at 1400ms ease-in-out when in record mode
5. **LSInlineErrorCallout**: Suggestion chips slide up 8pt and fade in with 50ms stagger

## Next Steps

1. **Token Update**: Add `deliberative` duration (1400ms) to motion.tokens.json
2. **Recipe API**: Consider adding recipe-level motion API to Theme struct (e.g., `theme.motion.sketchPolylineLoop`)
3. **Visual Testing**: Run simulator to verify all animations match design specifications
4. **Accessibility Testing**: Verify "Reduce Motion" accessibility setting is respected (animations should fall back to instant)
