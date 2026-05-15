# Android Learnings: MAPAPP-UNIFY Cycle 1

## Implementation Date
2025-05-14

## Architecture Decisions

### One View, Many States Pattern
The MapApp implements the persistent map host architecture where a single LSMapHost instance is mounted once and never remounted. State transitions (Idle → Planning → RouteResults) are driven entirely by MapAppState changes in the coordinator ViewModel, not by navigation stack mutations.

**Why this works on Android:**
- Compose naturally supports state-driven conditional rendering via `when (state)`
- The host Composable hierarchy remains stable across state changes
- No need for remounting, which would reset map camera, overlays, or animation state
- Aligns perfectly with iOS pattern where NavStack is removed from session routing

### MapAppViewModel as State Coordinator
MapAppViewModel uses Hilt's @HiltViewModel annotation and holds a StateFlow<MapAppState>. It serves as:
1. State machine coordinator (goToPlanning, goToIdle, confirmPlanningCancellation)
2. Dependency injector for composition (IdleViewModel is @Inject always-live; PlanningViewModel is created via factory)
3. UDF pattern: state flows down to UI, events flow up through callback methods

**Key detail:** IdleRoute and PlanningRoute remain unchanged. They continue to manage their own child ViewModels (IdleViewModel, PlanningViewModel) via @HiltViewModel injection. MapApp is purely a state dispatcher; it does not override or replace the inner ViewModels.

## Edge Cases Discovered

### testTag Preservation
The scope requires preserving existing E2E selectors: `testTag("idlescreen")` during Idle state, `testTag("planningscreen")` during Planning state. Implemented via Box wrapper around IdleRoute/PlanningRoute with conditional testTag.

**Note:** IdleRoute and PlanningRoute themselves do NOT have testTags. The parent MapApp applies them based on state. This avoids duplicating testTag logic and keeps route composition clean.

### State Transition from Planning → Idle via Cancellation
PlanningViewModel emits a `PlanningTransition.Cancelled` event. The current architecture does not wire MapApp to observe this. For Cycle 2, MapApp should:
1. Hoist PlanningRoute's cancellation callback to MapAppViewModel
2. Call viewModel.goToIdle() when cancellation completes

**Current workaround:** PlanningRoute still calls navController.popBackStack() on cancel. This works because Home route (IdleRoute) is still on the stack. Cycle 2 will replace this with state mutation.

### No Placeholder RouteResults Implementation
MapAppState has a RouteResults variant, but the when() in MapApp does not render anything for it yet. Sprint 09 task RR-S09-AND-T02 will wire the RouteResultsRoute composition here.

## API Contract Notes

MapAppState sealed class hierarchy:
- `Idle`: No parameters
- `Planning(sessionId: String)`: Requires sessionId for PlanningRoute composition
- `RouteResults(sessionId: String, routePlanId: String)`: Both IDs required for future route result display

All state transitions are synchronous (MutableStateFlow.update). No async loading states needed at this layer.

## UI Decisions

### Composition Structure
```
MapApp(viewModel)
├─ when (state) {
│  ├─ is Idle:
│  │   └─ Box(testTag="idlescreen") { IdleRoute(...) }
│  ├─ is Planning:
│  │   └─ Box(testTag="planningscreen") { PlanningRoute(...) }
│  └─ is RouteResults:
│      └─ (placeholder)
│  }
└─ MainNavViewModel: injected for PlanningRoute callbacks
```

### Marker: Box Wrapper for testTag
Using a Box wrapper allows applying testTag without affecting the route's internal composition. This is cleaner than modifying IdleRoute/PlanningRoute signatures.

## Gotchas for iOS Implementer

### Composition Timing
On Android, `when (state)` in Compose will unmount the previous branch and mount the new one. Unlike SwiftUI where views must be stable, Compose routes can be composed/decomposed per state. This works because:
- IdleRoute and PlanningRoute are pure functions (no retain-count issues)
- No external resources (DB subscriptions, etc.) are held at the route level—all state is in the inner ViewModels
- The Map host itself is outside MapApp (will be wired in Cycle 2)

On iOS, the equivalent must ensure:
- NavStack is NOT used for Idle/Planning transitions (use @Observable state instead)
- The persistent map host remains mounted across state changes
- Overlays are swapped via conditional @ViewBuilder blocks, not NavigationStack push/pop

### viewModelScope Lifecycle
PlanningRoute uses a creationCallback with @AssistedFactory to create PlanningViewModel(sessionId). The ViewModel's viewModelScope is tied to the Composable's lifecycle. When Planning state is exited, PlanningRoute is unmounted and the ViewModel is garbage collected (along with any active coroutines).

For Cycle 2, this means:
- No need to manually cancel PlanningViewModel jobs on state exit
- But if you retain a reference outside MapApp, you must handle cleanup manually

## Files Created/Modified

### Created
- `app/src/main/java/com/laneshadow/ui/mapapp/MapAppState.kt`: Sealed class for state machine
- `app/src/main/java/com/laneshadow/ui/mapapp/MapAppViewModel.kt`: @HiltViewModel coordinator
- `app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt`: Single @Composable host
- `app/src/main/java/com/laneshadow/ui/mapapp/MapAppRoute.kt`: Navigation entry point
- `app/src/test/java/com/laneshadow/ui/mapapp/MapAppViewModelTest.kt`: State machine unit tests

### Modified
- `app/src/main/java/com/laneshadow/navigation/Route.kt`: Added Route.MapApp variant

### Untouched (for Cycle 3 cleanup)
- `app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt`
- `app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt`
- `app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt`
- `app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt`

## Cycle 2 Requirements

To complete MapApp unification and wire Planning cancellation:

1. **MapApp Integration with PlanningViewModel Cancellation**
   - PlanningRoute should expose a callback for cancellation
   - MapAppViewModel should call goToIdle() when cancel completes

2. **Persistent Map Host Wiring**
   - Mount LSMapHost outside the when() statement (once, never remounted)
   - Overlay state-driven UIs (capsule, phase indicator, chat input) above the map

3. **Navigation Route Consolidation**
   - Update MainNavGraph to use MapAppRoute instead of separate IdleRoute/PlanningRoute composable entries
   - Keep old routes (ErrorRoute, RouteResultsRoute, RouteDetailsRoute) until Cycle 3

4. **Remove navController.navigate() from PlanningRoute**
   - Currently uses navController.popBackStack() on cancel
   - Will use state mutation (goToIdle) instead
