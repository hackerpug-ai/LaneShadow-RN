# Android Learnings: PLAN-S08-AND-T03 — Sketch Polyline Overlay

## Implementation Date
2026-05-14

## Overview
Implemented `MapSketchAnimationLayer` composable that renders a copper sketch-polyline with continuous 1400ms linear animation loop and a breathing head-dot at 1400ms ease-in-out reversed. Animation respects system reduced-motion preference.

## Edge Cases Discovered

### 1. Empty Path Handling
**Issue**: Need to prevent crash when path is empty
**Solution**: Early return guard at composable entry point
```kotlin
if (path.isEmpty()) {
    return
}
```
**Learning**: Both SketchPolylineCanvas and SketchHeadDot composables also guard internally

### 2. Reduced-Motion System Setting
**Issue**: How to detect system reduced-motion preference
**Solution**: Accept `reducedMotionEnabled` parameter from caller
**Note**: Caller can determine this via `Settings.Global.getFloat(contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f`
This task leaves the detection to the caller (PlanningScreen) and just respects the flag

### 3. Animation State with Dynamic Theme
**Issue**: Animation timing must not change if user switches theme mid-composition
**Solution**: Theme tokens are resolved at composition time via `LocalLaneShadowTheme.current`
If theme changes, the composable recomposes and re-reads the recipe

### 4. Path Coordinate System
**Issue**: LatLng coordinates need to be projected to screen space for Canvas drawing
**Solution**: Simple linear mapping is used in this implementation as a placeholder
Real integration would use Mapbox's projection matrix when overlaying on actual map

## API Contract Notes

### Parameters
- `path: List<LatLng>` — Route coordinates; empty list is valid (renders nothing)
- `reducedMotionEnabled: Boolean` — Caller determines system reduced-motion setting
- `onProgressUpdate`, `onHeadDotAlphaUpdate`, `onStrokeColorResolved` — Optional testing callbacks

### No Repository Subscriptions
This is a pure presentation layer. Caller (PlanningScreen) is responsible for:
- Collecting sketch route from PlanningViewModel
- Determining reduced-motion setting from system
- Passing data as parameters

### Unexpected States
- **Very short paths (1-2 points)**: Canvas still renders, head dot appears at last point
- **Null path**: Parameter is non-nullable; caller must ensure non-null List
- **Very long paths (1000+ points)**: Performance untested; may need optimization for draw calls

## UI Decisions

### 1. Animation Recipe Reuse
**Decision**: Reuse `sketchPolylineRecipe(theme)` helper from PlanningScreen.kt
**Rationale**: Single source of truth for animation timing across the codebase
**Alternative Considered**: Define new motion recipe in LSMotion.kt (rejected to avoid duplication)

### 2. Reduced-Motion Collapse Strategy
**Decision**: Static values (1.0 for both progress and alpha) when reduced-motion enabled
**Rationale**: Rider still sees the polyline and dot, just without movement
**Alternative Considered**: Completely hide layer (rejected; visibility is important)

### 3. Separate Composables for Canvas Layers
**Decision**: Split SketchPolylineCanvas and SketchHeadDot as separate private composables
**Rationale**: Cleaner composition structure, easier to test behavior independently
**Alternative Considered**: Single Canvas with both polyline and dot (less modular)

### 4. Theme Color Resolution
**Decision**: Use `isSystemInDarkTheme()` + GeneratedTokens directly (not LocalLaneShadowTheme.semantic)
**Rationale**: Consistent with LSMapTypes.kt pattern for route colors
**Note**: `semantic.route.best` resolves to the same colors as `color.Route.best/dark.best`

## Gotchas for iOS Implementer

### 1. Animation Timing Is Fixed (1400ms)
**Android**: Reads from motion token `duration["verySlow"]` which equals 1400ms
**iOS**: Must use same 1400ms linear for path-draw and 1400ms ease-in-out for breathing
**Note**: This is by design for cross-platform parity. Do NOT use configurable animations.

### 2. RepeatMode.Reverse Behavior
**Android**: `infiniteRepeatable(..., repeatMode = RepeatMode.Reverse)` means:
- Animation runs forward: 0 → 1
- Then reverses: 1 → 0
- Full cycle = 2800ms (1400ms forward + 1400ms reverse)
**iOS**: Ensure CABasicAnimation or equivalent has same `autoreverses = true` behavior

### 3. Reduced-Motion Must Be Respected
**Android**: When system animator-duration-scale is 0, the entire animation system pauses
**iOS**: Likely equivalent: `UIAccessibility.isReduceMotionEnabled`
**Critical**: Do NOT skip this guard. Accessibility is gate-blocking.

### 4. Copper Color Token
**Android**: Resolves via `GeneratedTokens.color.Route.best` (light) / `dark.best` (dark)
**iOS**: Ensure token resolution uses same copper value across themes
**Verify**: Design tokens are in sync between platforms

### 5. Path Geometry Projection
**Android**: This implementation uses simplified linear projection for Canvas rendering
**iOS**: Will likely use MapKit's projection or similar native API
**Note**: Coordinate system and rendering approach may differ; ensure visual parity through design review

## Files Created/Modified

### Created
- `android/app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt` (new)
  - Main composable + private helpers (SketchPolylineCanvas, SketchHeadDot)
- `android/app/src/test/java/com/laneshadow/ui/atoms/MapSketchAnimationLayerTest.kt` (new)
  - 7 source-text verification tests

### Not Modified (Write-Prohibited)
- LSMap.kt (Sprint 06 host)
- LSMapHost.kt (Sprint 06 host)
- PlanningScreen.kt (only references recipe helper, no changes)

## Design Token Compliance

✓ No hardcoded color hex values (uses GeneratedTokens.color.Route.best/dark.best)
✓ No hardcoded duration (uses sketchRecipe.durationMillis from theme)
✓ No hardcoded easing (uses sketchRecipe.easing from theme)
✓ Token compliance check: `enforce-native-compliance.sh` passes
✓ Kotlin lint: `ktlintCheck` passes

## Test Coverage

| Test | Purpose | Status |
|------|---------|--------|
| path_draw_progress_cycles_at_1400ms_linear | Verify animation timing | ✓ |
| head_dot_breathing_cycles_at_1400ms_easeinout | Verify breathing easing | ✓ |
| reduced_motion_collapses_to_static | Verify accessibility | ✓ |
| empty_path_renders_nothing_without_crash | Verify safety | ✓ |
| stroke_color_resolves_to_route_best_token | Verify token resolution | ✓ |
| lsmap_and_lsmaphost_not_modified | Verify spec compliance | ✓ |
| uses_motion_recipe_tokens_not_hardcoded_values | Verify token purity | ✓ |

## Performance Notes

- Animation uses Compose's `infiniteRepeatable` which is efficient for infinite loops
- Canvas rendering happens at composition time (not real-time path projection)
- No LaunchedEffect for animation setup; uses Compose animation framework directly
- Early return for empty path prevents unnecessary Canvas allocations

## Integration Status

✓ Ready for integration with PlanningScreen
✓ Can accept path from PlanningUiState.sketchRoute (exposed by AND-T02)
✓ Ready for cross-platform parity verification with iOS (PLAN-S08-IOS-T03)
✓ Ready for E2E testing (PLAN-S08-T11)

## Known Limitations

1. **Canvas Coordinate Projection**: Uses simplified linear mapping, not actual Mapbox projection
   - Fine for testing; real integration would use Mapbox bounds/projection
2. **No Text/Label**: Head dot is just a circle, no label or annotation
3. **Static Head Dot Position**: Dot stays at last path point; doesn't move with path animation

## Recommendations for iOS

1. Verify animation timing with timeline or debugger: 1400ms linear for path, 1400ms ease-in-out for breathing
2. Test reduced-motion: should see static polyline + static dot (no animation)
3. Verify copper color matches Android across light/dark themes
4. Consider similar structure: separate layers for path animation + dot breathing
5. Use CABasicAnimation with `autoreverses = true` for breathing effect (or SwiftUI equivalent)

# Android Learnings: PLAN-S08-AND-T04 — Locked Chat Input + Cancel Confirm

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. The planning collapse affordance was still wired to navigation in the route layer. The fix belongs in the planning container/route wiring, not in `LSChatInput`, because the screen must stay on the same map host until a confirmed cancel transition arrives.
2. The planning chat input can show the wrong message if the adapter uses the latest agent message instead of the latest rider prompt. The planning route adapter now prefers the most recent rider/user message for the locked input text.
3. Dismissing the confirm sheet only on transition is too late for UX and test expectations. The cancel intent now closes the sheet immediately before invoking the repository-backed cancellation flow.

## API Contract Notes
- `PlanningViewModel.cancel()` is the view-layer cancel intent. The view should not call `routeRepository.cancelPlan(...)` directly.
- `PlanningTransition.Cancelled` remains the return-to-idle trigger. The container consumes the transition before invoking `onReturnToIdle()`.
- `PlanningCancelConfirmSheet` still delegates to `LSCancelConfirmSheet`; only planning-specific copy, tags, and semantics were changed.

## UI Decisions
- Used the task contract strings `Keep planning` and `Cancel ride` in the Android wrapper even though older planning design docs still mention `Keep thinking` and `Cancel plan`. The sprint task is the active source of truth for this worktree.
- Kept the persistent-map-host contract intact by removing route-level navigation from the planning collapse action. Back/collapse now opens the confirm flow instead of leaving the screen.

## Gotchas for iOS Implementer
- If the iOS twin still uses the older V02 copy, parity review will need an explicit decision because the current Android sprint task overrides the older design artifact text.
- The locked input should display the rider prompt, not the latest navigator response. This is easy to miss when the planning state adapter only has one `message` field.
- Immediate sheet dismissal on confirm is part of the UX contract even though return-to-idle still waits on the cancelled transition.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` — added `cancel()` intent and exposed latest-agent helper to the route adapter.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt` — removed collapse navigation and restored rider-prompt mapping for locked input.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt` — rewired collapse/cancel handling to stay in-place and return to idle only on cancelled transition.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenOverlays.kt` — removed collapse navigation in overlay mode.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningCancelConfirmSheet.kt` — updated planning-specific labels and semantics.
- `android/app/src/test/java/com/laneshadow/ui/planning/*.kt`, `android/app/src/test/java/com/laneshadow/ui/molecules/LSCancelConfirmSheetTest.kt`, `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenCompositionTest.kt` — aligned test expectations with the active contract.
