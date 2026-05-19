# Android Learnings: PLAN-S08-AND-T02

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. The planning reset/layers chip had no backing state anywhere in `MapAppState`, `PlanningScreenContainer`, or `LSMapCameraController`, so leaving it visible created a false affordance on both the direct template and the live host.
2. The previous TC-4 shape test could pass with injected lambdas or helper-only model assertions. The remediation test now composes the real `MapAppContent` planning path and fails if the live workbar still renders the fake reset action.

## API Contract Notes
- No backend or repository contract changes were required for this remediation.
- `planningMapControlsModel` now treats `onClear` as optional for planning; when no real reset behavior exists, the reset/layers chip is suppressed instead of wired to a no-op callback.
- Planning-state controls currently expose recenter, zoom, and chat toggle on the live path; save and reset remain hidden until a real planning-state behavior exists.

## UI Decisions
- `PlanningScreen` and `MapApp` stay aligned by sharing the same `planningMapControlsModel`, but the model now omits the reset chip by default rather than advertising a fake action.
- The planning workbar still defaults to `MapControlsMode.Map` and switches locally between map/chat modes so TC-4 can verify a real rendered toggle path on the live host.

## Gotchas for iOS Implementer
- If iOS has both a direct planning template and a shared host path, suppress any planning control that lacks real backing state on both surfaces at the same time; otherwise sandbox and live routes drift.
- Shared-host regressions need rendered-path tests, not helper-model assertions. Use the host container in the test so no-op handlers cannot satisfy the contract.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` — made planning reset/layers optional and removed the stubbed live-path `onClear` wiring.
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` — changed `onResetMapState` to optional so the stateless template no longer defaults to a fake reset action.
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt` — moved TC-4 onto the real `MapAppContent` planning path and asserted the reset chip is absent there.
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenCompositionTest.kt` — aligned the source-level planning controls expectation with the suppressed reset chip.
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningMapControlsLivePathTest.kt` — updated the live-path model test to assert `onClear` is absent until real behavior exists.
