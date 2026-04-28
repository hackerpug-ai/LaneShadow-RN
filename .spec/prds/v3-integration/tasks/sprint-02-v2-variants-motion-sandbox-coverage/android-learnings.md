# Android Learnings: FID-S02-T02 - Motion Recipes Wiring

## Implementation Date
2026-04-28

## Task Summary
Wired 6 Android motion recipes to theme.motion tokens, replacing hardcoded durations and manual coroutine delay loops with Compose animation APIs (Animatable, infiniteRepeatable, AnimatedVisibility, spring).

## Edge Cases Discovered

### 1. Missing Motion Recipe Tokens
**Issue**: Spec required 1400ms durations for `sketchPolylineLoop`, `breathingHeadDot`, and `recordDotPulse`, but tokens only have:
- `instant`: 0ms
- `fast`: 120ms
- `normal`: 200ms
- `slow`: 400ms
- `slower`: 600ms

**Resolution**: Used closest available token (`slower` = 600ms or `slow` = 400ms) as placeholder and documented discrepancy in learnings. Design team needs to add 1400ms duration token.

### 2. Animatable Type Parameters
**Issue**: `Animatable<Float, AnimationVector>` requires explicit type parameters in Kotlin.

**Resolution**: Used `Animatable<Float>` without explicit second type parameter. For `mutableStateListOf`, switched to `remember { List(polylines.size) { Animatable(0f) } }` instead of `mutableStateListOf<Animatable<Float>>()` because the latter had "unresolved reference 'add'" compilation errors.

### 3. LocalDensity for slideInVertically
**Issue**: `slideInVertically(initialOffsetY = { 8.dp.toPx().toInt() })` requires `LocalDensity` context.

**Resolution**: Added `import androidx.compose.ui.platform.LocalDensity` and called `val density = LocalDensity.current` before using `with(density) { 8.dp.toPx().toInt() }`.

### 4. LSPhaseIndicator Head Dot Missing
**Issue**: AC-2 required adding a leading head dot composable to LSPhaseIndicator for Active phases, but it didn't exist.

**Resolution**: Added `BreathingHeadDot` composable that:
- Only renders when `state == PhaseDotState.Active`
- Uses `infiniteRepeatable(tween, RepeatMode.Reverse)` for breathing animation
- Alpha oscillates between 1.0 and 0.45 per spec

### 5. LSSessionsDrawer Animation Location
**Issue**: Spec said to replace drawer slide tween with spring, but LSSessionsDrawer.kt had no animation code.

**Resolution**: Found animation in LSMapLayer.kt which wraps the drawer in `AnimatedVisibility`. Updated from `tween` with `CubicBezierEasing` to `spring(dampingRatio = 0.85f, stiffness = StiffnessMedium)`.

## API Contract Notes

### Motion Token Structure
Theme motion tokens are exposed as:
```kotlin
data class LaneShadowMotion(
    val duration: Map<String, Int>,        // "fast" -> 120, "standard" -> 240, etc.
    val easing: Map<String, List<Double>>, // "linear" -> [0.0, 0.0, 1.0, 1.0]
    val delay: Map<String, Int>,
    val scale: Map<String, Double>
)
```

Access pattern:
```kotlin
val duration = theme.motion.duration["deliberate"] ?: 600
val easingPoints = theme.motion.easing["linear"] ?: listOf(0.0, 0.0, 1.0, 1.0)
val easing = CubicBezierEasing(
    easingPoints[0].toFloat(),
    easingPoints[1].toFloat(),
    easingPoints[2].toFloat(),
    easingPoints[3].toFloat()
)
```

### Existing Recipes in motion.tokens.json
- `sketchPolylineLoop`: duration="deliberate" (600ms), easing="linear", iteration="loop"
- `chatOverlayEnter`: duration="standard" (240ms), easing="decelerated", iteration="once"
- `routeDrawOn`: duration="deliberate" (600ms), easing="decelerated", iteration="once"
- `phaseDotPulse`: duration="slow" (400ms), easing="standard", iteration="loop"

### Missing Recipes (Spec Required But Not In Tokens)
- `breathingHeadDot`: Spec requires 1400ms, used `slow` (400ms) as placeholder
- `recordDotPulse`: Spec requires 1400ms, used `slow` (400ms) as placeholder

## UI Decisions

### 1. Head Dot Placement in LSPhaseIndicator
**Decision**: Added head dot alongside the phase dot for Active phases, not replacing it.

**Rationale**: The phase dot (LSPhaseDot) handles its own pulsing animation for Active state. The breathing head dot is an additional visual indicator that appears next to Active phase labels.

### 2. Animatable vs Manual Delay Loop
**Decision**: Replaced `repeat(steps) { delay(120); progress = it }` with `Animatable.animateTo(targetValue = 1f, animationSpec = tween(durationMillis))`

**Rationale**: Animatable is the Compose-idiomatic way to animate values. It:
- Provides smooth animation (30 steps → continuous)
- Uses animation specs (tween, spring) for consistency
- Doesn't block the recomposition thread
- Can be canceled on composition exit

### 3. Spring vs Tween for Drawer
**Decision**: Changed drawer slide from `tween(durationMillis, easing = CubicBezierEasing(...))` to `spring(dampingRatio = 0.85f, stiffness = StiffnessMedium)`

**Rationale**: Spring animations feel more natural for UI physics (like drawer slides) and adapt to device capabilities. The spec explicitly required spring for this animation.

## Gotchas for iOS Implementer

### 1. Missing 1400ms Duration
iOS implementer will hit the same issue: spec requires 1400ms but tokens only go up to 600ms. Coordinate with design team to either:
- Add 1400ms token to motion.duration, OR
- Update spec to use existing 600ms token

### 2. Head Dot Composable
LSPhaseIndicator on Android previously lacked the head dot entirely. iOS may have it already (need to verify). If missing, add it as a separate circle alongside Active phase dots with breathing animation.

### 3. Manual Delay Loop Pattern
RouteResultsScreen had `repeat(steps) { delay(120); state = it }` which stutters under composition load. Replace with `Animatable.animateTo()` or iOS equivalent (UIViewPropertyAnimator or SwiftUI withAnimation).

### 4. Drawer Animation Location
Don't look for animation in LSSessionsDrawer directly. It's in the parent layer component (LSMapLayer on Android, likely a container view or controller on iOS).

### 5. LocalDensity Requirement
When converting dp to px in slide animations, need access to density context. On iOS, this is equivalent to UIScreen.main.scale.

## Files Created/Modified

### Created
- `android/app/src/main/java/com/laneshadow/theme/LSMotion.kt` - Motion recipe helper functions
- `android/app/src/test/java/com/laneshadow/sandbox/MotionTests.kt` - Motion spec verification tests

### Modified
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt` - Added BreathingHeadDot composable
- `android/app/src/main/java/com/laneshadow/ui/templates/RouteResultsScreen.kt` - Replaced manual delay loop with Animatable.animateTo
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt` - Implemented record dot pulse animation
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSInlineErrorCallout.kt` - Added AnimatedVisibility for suggestion chips
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` - Changed drawer slide from tween to spring

### No Changes Required
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` - Already using motion tokens correctly (sketchPolylineRecipe function)

## Status
✅ Implementation complete
⚠️  Token discrepancy documented (1400ms required, max available is 600ms)
📝 Design team action item: Add 1400ms duration to motion tokens OR update spec to use 600ms

## Test Results
- All MotionTests pass
- `./gradlew :app:compileDebugKotlin` succeeds
- `./gradlew :app:testDebugUnitTest` passes
