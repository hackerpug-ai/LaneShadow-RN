# iOS Learnings: PLAN-S08-IOS-T02 Planning State Overlay Composition

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. `PlanningScreenTests` had to resolve source files relative to the current worktree using `#filePath`; path checks against the main checkout produced false negatives during TDD verification.
2. The planning-state controls need real non-placeholder closures in `PlanningScreen+LiveContent`; `Logger`-only stubs fail the planning overlay contract even when the view renders.
3. `LSMapLayer` top overlays share the same top alignment gutter, so a second overlay must apply its own token-based offset to stack beneath the first one.

## API Contract Notes
- `PlanningScreenContainer` should only request cancel confirmation from the view model; it should not directly trigger `confirmCancellation()` or `cancelPlanning()` from this composition layer.
- `cancelConfirmationVisible` remains part of `PlanningScreenLiveState` so the container can pass planning-state visibility without owning the cancel-confirm sheet presentation.
- Planning-state map controls must be wired through a live configuration object so the screen keeps the same map host while still exposing recenter, layers, and mode-toggle behavior.

## UI Decisions
- The container now treats cancel confirmation as view-model state propagation only, keeping overlay composition focused on the persistent map host and top/right-edge slot wiring.
- Planning controls remain mounted on the right edge with the planning accessibility identifier to preserve the expected overlay contract.
- The phase indicator applies token spacing on its own view so it renders below the planning capsule without changing `LSMapLayer`'s generic slot layout.

## Platform-Specific Notes
- Swift Testing filter selection via `xcodebuild -only-testing` is unreliable for these planning-screen tests, so evidence should call out when the runner selects zero tests and rely on broader bundle execution plus source assertions.
- The worktree builds cleanly in Xcode even though repo-wide JS tooling checks remain pre-existing and unrelated to this Swift task.
- Preserving map-host identity is easiest when the container owns the `LSMapCameraController` state and injects the live map configuration into `PlanningScreen`.

## Files Created/Modified
- `ios/LaneShadow/Features/Planning/PlanningScreenContainer.swift` - owns live map controller state and wires planning controls to real behavior.
- `ios/LaneShadow/Sandbox/Stories/Templates/PlanningScreenStory.swift` - replaced unused closure parameters so the touched story file is lint-clean.
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` - accepts injected live map configuration to preserve the persistent planning map host.
- `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` - stacks the top overlays and binds planning controls through the live map configuration.
- `ios/LaneShadowTests/Templates/PlanningScreenTests.swift` - updated worktree-aware assertions for planning composition requirements.
