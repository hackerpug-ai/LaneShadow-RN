# Android Learnings: PLAN-S08-AND-T02

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. The live planning route does not render `PlanningScreen`'s built-in workbar because `PlanningScreenOverlays` uses `skipMapRendering = true`; the persistent-host owner is `MapApp`, so planning controls must be configured there.
2. The previous TC-4 source scan could pass while the real planning path still omitted the planning workbar contract. The test now targets a shared live-path controls model instead of template-only source text.

## API Contract Notes
- No backend or repository contract changes were required for this remediation.
- Planning-state controls currently expose recenter, layers/reset, zoom, and chat toggle on the live path; save remains hidden until a route-save condition is available.

## UI Decisions
- `MapApp` now tags the planning-state workbar as `planning.map-controls` only while `MapAppState.Planning` is active so the persistent map host can expose the planning-specific verification surface without affecting idle/results tags.
- The planning workbar model defaults to `MapControlsMode.Map` and keeps a real toggle path by switching the workbar between map/chat modes locally on the persistent host.

## Gotchas for iOS Implementer
- If the iOS planning overlays also render overlay-only content on top of a shared map host, do not assume template-local controls are the live controls. Verify the real host owner.
- Tests that only inspect template source are not enough for shared-host flows; bind verification to the host-level composition contract that the live route actually uses.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/mapapp/MapApp.kt` — added planning live-path controls model and planning-specific tag/handlers.
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningMapControlsLivePathTest.kt` — added focused live-path contract test.
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenTest.kt` — replaced TC-4 source scan with live-path contract assertions.
- `android/app/src/test/java/com/laneshadow/ui/templates/PlanningScreenCompositionTest.kt` — aligned duplicate AC-4 test with the live-path contract.
