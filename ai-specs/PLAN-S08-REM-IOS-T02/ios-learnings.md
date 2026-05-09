# iOS Learnings: iOS map controls zoom-bottom remediation

## Implementation Date
2026-05-08

## Edge Cases Discovered
1. `LSMapControls` order assertions were simplest and most stable at the `resolvedAppearance` layer because the contract is chip ordering rather than consumer placement.
2. ViewInspector can validate the zoom cluster structure and button callbacks, but source-path helpers in tests must resolve from `ios/LaneShadowTests/Organisms` back to the repo root with four path hops, not three.

## API Contract Notes
- `LSMapControls.resolvedAppearance` remains source-compatible; only the map-mode `chipsInOrder` sequence changed to append `.zoomCluster` after `.modeToggle`.
- Zoom accessibility identifiers stayed unchanged: `lsmapcontrols-zoom-cluster`, `lsmapcontrols-zoom-in`, and `lsmapcontrols-zoom-out`.

## UI Decisions
- The zoom cluster now uses a single vertical glass card so the plus/minus controls remain grouped while matching the remediation target.
- Zoom button labels were added as `Zoom in` and `Zoom out` to satisfy the interactive accessibility contract without changing identifiers.

## Platform-Specific Notes
- Inspecting SwiftUI views directly can emit benign `Environment<Theme>` warnings under ViewInspector when the environment is read outside an installed host; the tests still passed and the runtime behavior was verified separately on simulator.
- Simulator screenshots work reliably with `xcrun simctl io <booted-udid> screenshot <absolute-path>`; relative output paths can fail with a misleading “folder doesn’t exist” error.

## Files Created/Modified
- `ios/LaneShadow/Views/Organisms/LSMapControls+ResolvedValues.swift` — move `.zoomCluster` to the bottom of the map-mode chip order
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — convert zoom cluster to vertical layout and add zoom accessibility labels
- `ios/LaneShadowTests/Organisms/LSMapControlsTests.swift` — add regression coverage for chip order, vertical layout, and callback stability
- `ai-specs/PLAN-S08-REM-IOS-T02/ios-learnings.md` — task-specific implementation notes
