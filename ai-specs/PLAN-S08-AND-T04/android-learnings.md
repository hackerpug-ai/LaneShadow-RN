# Android Learnings: PLAN-S08-AND-T04

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. `PlanningUiState.toMockState()` must prefer the latest rider/user message over the latest agent message or the locked chat input shows the wrong text while planning is active.
2. Runtime Compose tests for planning need a fake `mapContent` slot because the default `LSMap` path loads Mapbox native code under Robolectric.

## API Contract Notes
- `PlanningTransition.Cancelled` is the signal that must restore the screen to idle; consuming the transition before the idle callback prevents duplicate restoration.
- The planning cancellation path already goes through `viewModel.cancel()`; the missing contract was route restoration on the same mounted map host.

## UI Decisions
- `PlanningRoute` now drives the existing `MapApp` persistent-host path and restores idle by switching `MapAppViewModel` state, not by popping navigation.
- `PlanningScreenContainer` now delegates to an internal `PlanningScreenContent` composable so runtime behavior can be tested without Hilt wiring.

## Gotchas for iOS Implementer
- If the locked planning input is derived from a mixed rider/agent message list, explicitly bias toward the rider prompt for the visible filled value.
- Shared-host cancel restoration should be modeled as a state swap on the unified map screen, not as navigation back to a different idle screen instance.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt` — switched cancel restoration to the persistent `MapApp` host and fixed prompt selection.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt` — extracted testable content layer around the planning UI behavior.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenOverlays.kt` — parameterized return-to-idle callback for shared-host restoration.
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` — forwarded planning cancel restoration into `MapAppViewModel`.
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningCancelConfirmTest.kt` — replaced source inspection with Compose behavior tests.
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningScreenContainerTest.kt` — updated source contract expectations for the new content layer.
- `android/app/src/test/java/com/laneshadow/navigation/AuthRootNavigationContractTest.kt` — updated route contract expectations for `MapApp`-based planning restoration.
