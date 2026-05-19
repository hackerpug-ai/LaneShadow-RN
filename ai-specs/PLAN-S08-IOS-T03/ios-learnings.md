# iOS Learnings: Map Sketch Animation Layer

## Implementation Date
2026-05-19

## Edge Cases Discovered
1. `LSMapLayer.bottomOverlays` always bottom-aligns overlay content; presentation layers that need to span the map surface must apply a full-screen frame at the composition site.
2. `xcodebuild -only-testing` does not execute individual Swift Testing cases in this suite when addressed with per-test selectors; suite-level selection runs correctly and produces nonzero executed-test evidence.

## API Contract Notes
- `PlanningViewModel.sketchPathPoints` and `PlanningScreenLiveState.sketchPathPoints` already provide the correct data-driven geometry channel; no new API surface was required for this remediation.
- The live preview path in `PlanningScreen.swift` is the canonical composition reference for the sketch layer because it already expands the overlay to the full map slot.

## UI Decisions
- Applied `.frame(maxWidth: .infinity, maxHeight: .infinity)` to both live sketch overlay call sites so the existing `MapSketchAnimationLayer` fills the map canvas without changing `LSMapLayer`.

## Platform-Specific Notes
- SwiftUI overlay alignment is inherited from the parent `frame(alignment:)`; child overlays inserted through `LSMapLayer.bottomOverlays` need explicit full-size expansion to avoid intrinsic-height bottom placement.
- Swift Testing output in Xcode logs can show a suite run with `0 tests` even when the suite itself resolves; use suite-level selectors for reliable evidence when per-test selection is unsupported.
- Remediation cycle 2 required aligning the task spec and evidence bundle to the executable Swift Testing suite selector `LaneShadowTests/MapSketchAnimationLayerTests`; per-test `-only-testing` selectors were the contract bug, not the product code.

## Files Created/Modified
- `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` — expanded live planning sketch overlay to fill the map slot
- `ios/LaneShadow/Views/Templates/MapApp.swift` — expanded unified map-app sketch overlay to fill the map slot
- `ai-specs/PLAN-S08-IOS-T03/ios-learnings.md` — recorded remediation learnings and selector behavior
- `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T03-ios-sketch-polyline-overlay.md` — aligned verification commands with the executable Swift Testing suite selector
