# Android Learnings: MAPAPP-UNIFY Cycle 3

## Implementation Date
2026-05-14

## Edge Cases Discovered

### 1. Composition vs. Composable Scoping
**Challenge**: Rendering overlay-only content (chat input, cancel sheets) from routes without mounting LSMapLayer requires careful composable boundary management.

**Solution**: 
- When `skipMapRendering=true` in IdleRoute/PlanningRoute, bypass the template composable (IdleScreen/PlanningScreen) entirely
- Render only the overlay UI molecules directly
- This prevents unwanted LSMapLayer mounts while preserving ViewModel state binding

### 2. Camera Controller Lifecycle
**Challenge**: Camera controller must survive state transitions (Idle → Planning → Idle) without losing user panning/zoom state.

**Solution**:
- Mount camera controller in MapApp via `remember { LSMapCameraController(...) }`
- Pass same instance to all states via MapApp parameters
- IdleRoute/PlanningRoute create local camera controllers only when called directly (not from MapApp)
- This ensures camera state persists across state mutations without using ViewModel/NavGraph

### 3. Overlay Content Type Mismatch
**Challenge**: Bottom overlays accept `List<GlassOverlaySlot>` but overlay providers render direct composables.

**Solution**:
- MapApp wraps overlay provider calls (IdleScreenOverlays, PlanningScreenOverlays) inside GlassOverlaySlot
- Each overlay provider returns a single Composable (LSChatInput for Idle, cancel-sheet for Planning)
- This pattern matches iOS's @ViewBuilder composition without requiring complex slot management

## API Contract Notes

### IdleRoute API Changes
- **New parameter**: `skipMapRendering: Boolean = false`
- **Behavior**: When true, bypasses IdleScreen mounting and renders only overlay content (LSChatInput)
- **Note**: Existing callers (not MapApp) get default false, maintaining backward compat

### PlanningScreenContainer API Changes  
- **New parameter**: `skipMapRendering: Boolean = false`
- **Behavior**: When true, bypasses PlanningScreen mounting and renders only cancel-confirm sheet
- **Note**: Existing callers (PlanningRoute) get default false, maintaining backward compat

### MapApp State Handling
- **LSMapLayer mount**: Always happens once at composition entry; never remounted
- **State changes**: Idle ↔ Planning ↔ RouteResults change ONLY:
  - LSMap mode (Interactive vs. Preview)
  - Overlay composition (which overlays render)
  - Test tags (for state identification)
- **Camera controller**: Shared instance across all states

## UI Decisions

### Decision: One LSMapLayer Mount Pattern
**Rationale**: Prevents Compose remount of stateful map when state machine transitions. iOS MapApp.swift already implements this; Android now matches.

### Decision: Overlay Provider Composables
**Rationale**: Separates concerns (map host in MapApp, overlay content in IdleScreenOverlays/PlanningScreenOverlays) and makes state-driven composition explicit.

### Decision: Camera Controller in MapApp, Not ViewModel
**Rationale**: Camera state (zoom level, pan position) is UI-local and should not survive config changes; remembering it in MapApp composable is the Compose idiom.

## Gotchas for iOS Implementer

### 1. Overlay Provider Wrapping
On Android, overlay providers are wrapped in GlassOverlaySlot by MapApp. Ensure iOS LSMapLayer expects similar wrapping pattern.

### 2. State-Driven MapMode
Android's MapMode enum changes based on state. Ensure Preview mode for planning matches iOS's sketch-preview styling.

### 3. skipMapRendering Flag Fragility
The flag in IdleRoute/PlanningRoute is fragile. Consider a more explicit API in future refactors.

## Files Created/Modified

### Modified Files
1. **MapApp.kt** — Refactored to mount ONE LSMapLayer, delegate overlays to provider composables
2. **IdleRoute.kt** — Added skipMapRendering flag; renders overlay-only content when true
3. **PlanningScreenContainer.kt** — Added skipMapRendering flag; renders cancel-sheet only when true

### New Files
1. **IdleScreenOverlays.kt** — Provides idle state overlays without map
2. **PlanningScreenOverlays.kt** — Provides planning state overlays without map

## Cross-Platform Parity

✅ **MapApp unification**: Android Cycle 3 matches iOS (single LSMapLayer, state-driven overlays)
✅ **Test tags**: Android uses same tags as iOS (idlescreen, planningscreen, routeresultsscreen)
✅ **State enum**: MapAppState matches iOS MapAppViewModel.CurrentState
✅ **Camera behavior**: First-fix auto-recenter parity between platforms

Parity verified against iOS MapApp.swift (commits be8fff154, e7c30bd86) on 2026-05-14.
