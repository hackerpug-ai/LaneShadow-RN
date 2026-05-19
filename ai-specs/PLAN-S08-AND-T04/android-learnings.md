# Android Learnings: PLAN-S08-AND-T04

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. The persistent `MapApp` planning path uses `skipMapRendering = true`, so overlay-only branches must still compose the planning chrome; otherwise the locked chat input and phase UI disappear on the shipped route even though isolated template tests pass.
2. Route-level Robolectric tests cannot mount the production `LSMap` implementation because it loads native Mapbox code; a test-only map slot seam is required to verify the real `MapApp -> PlanningScreenOverlays` composition without stubbing overlay behavior.

## API Contract Notes
- `PlanningTransition.Cancelled` remains the single signal for returning the planning route to idle; `consumeTransition()` must run before or alongside the idle callback to avoid duplicate restoration.
- The cancel-confirm flow continues to go through `viewModel.cancel()` only. The view layer never calls `routePlans.cancelPlan` directly.

## UI Decisions
- The `skipMapRendering` branch now renders the planning overlay chrome over the persistent `MapApp` host instead of returning after only the cancel sheet.
- `PlanningScreen` now shares its top/bottom planning overlay composition with the persistent-host path so the locked chat input, capsule, and phase indicator stay visually consistent.
- `PlanningScreenOverlays` and `MapAppContent` expose narrow composition seams for route-level tests; production behavior still uses the same default wiring.

## Gotchas for iOS Implementer
- When the planning state is hosted over a persistent map surface, treat "overlay-only" as a full overlay composition problem, not just a modal-sheet problem.
- If route-level tests need to avoid native map dependencies, swap only the map body. Keep the real overlay container path intact so BackHandler and transition behavior stay covered.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` — extracted `MapAppContent` and added a test-only map slot seam.
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` — exposed the top-bar reserved height for shared overlay positioning.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenContainer.kt` — rendered planning overlay chrome in the `skipMapRendering` branch.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningScreenOverlays.kt` — added an injectable container seam for route-level tests.
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` — extracted shared planning overlay chrome used by both the full template and persistent-host path.
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningCancelConfirmTest.kt` — moved the acceptance tests onto the real `MapApp -> PlanningScreenOverlays` route.
