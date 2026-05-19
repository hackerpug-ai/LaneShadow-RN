# iOS Learnings: PLAN-S08-IOS-T02 Planning State Overlay Composition

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. `RootView` drives planning through `MapApp`, so fixing only `PlanningScreen+LiveContent` leaves the runtime path broken; the remediation had to move overlay composition, back-chip intent, and controls into the persistent `MapApp` host.
2. `LSMapLayer` top overlays share one top alignment gutter, so the phase indicator still needs its own token offset (`theme.space.xxxl`) to sit below the planning capsule without changing the shared map-layer contract.
3. `xcodebuild -only-testing` selectors now execute correctly only after converting `PlanningScreenTests` to `XCTestCase`; the previous Swift Testing/source-grep approach reported green while running zero tests.
4. The live session route still renders `PlanningScreenContainer` from `AppFlowView`, so fixing only `MapApp` is insufficient; the container itself needs a testable presentation-state object so `onLayers` mutates real overlay composition.

## API Contract Notes
- `MapApp` should bind `LSContextCapsule` with `.planning(headline: planningViewModel.capsuleHeadline)` and `LSPhaseIndicator` with `planningViewModel.phaseSteps`; using the computed `phases` alias is functionally equivalent but less explicit for the contract.
- The planning back affordance must call `MapAppViewModel.requestCancelPlanning()`, which delegates to `PlanningViewModel.requestCancelConfirmation()` without invoking cancellation side effects from the view layer.
- For `PlanningScreenContainer`, control presentation state is more reliable as an injected `@Observable` helper than as opaque local `@State` when view-level tests need to verify the `onLayers` path.

## UI Decisions
- The planning top bar now renders with `LSTopBarTrailing.none`; the planning capsule lives in `LSMapLayer.topOverlays`, not in the top-bar center slot.
- `MapApp` exposes planning controls with `planningscreen-controls` plus an accessibility value that reflects `mode` and `layers` state, which made the runtime host verifiable without touching `LSMapControls.swift`.
- The persistent map host exposes a stable `host=` token in its accessibility value so idle→planning tests can prove the same mounted host survives state changes.
- When the planning layers chip is toggled off on the live session route, `PlanningScreen.liveContent` now removes the sketch overlay instead of only updating accessibility metadata.

## Platform-Specific Notes
- Repo-wide `pnpm type-check:native` is not usable in this worktree without additional JS tooling bootstrap (`tsgo` missing), but the native pre-commit path for staged Swift files is still governed by `swiftformat`, token compliance, and `xcodebuild` from `ios/`.
- Repo-wide `pnpm exec biome check --no-errors-on-unmatched` currently surfaces unrelated `logos/**` accessibility violations; they are outside this iOS task and do not affect the staged Swift hook path.
- Visual verification can be satisfied with `simctl` by launching `com.laneshadow.app` into planning state using `-MapAppState=planning -SessionId=session-123` and saving a screenshot from the booted simulator.

## Files Created/Modified
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` - replaced the placeholder local controls toggle with an injectable `PlanningLiveControlsState` used by the actual live session route.
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` - extended `PlanningMapControlsConfiguration` with `layersVisible` so live composition can respond to control state.
- `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` - makes the live planning sketch overlay mount/unmount from the controls state instead of ignoring `onLayers`.
- `ios/LaneShadowTests/Templates/PlanningScreenTests.swift` - exercises the real `PlanningScreenContainer` path, verifying the layers tap mutates live controls state and re-renders without the sketch overlay.
