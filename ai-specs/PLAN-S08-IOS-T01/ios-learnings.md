# iOS Learnings: PLAN-S08-IOS-T01

## Implementation Date
2026-05-08

## Edge Cases Discovered
1. Xcode `-only-testing` filtering for Swift Testing still prints `Executed 0 tests` in the XCTest summary even when the Swift Testing suite runs below it; evidence should key off the Swift Testing run lines, not just the XCTest count line.
2. The current iOS `LaneShadowSessionMessage` model does not decode a persisted `phase` field, so deterministic client-side phase derivation must mirror the backend helper from structured `thinkingSteps`, planning-event JSON, and status without using text heuristics.

## API Contract Notes
- `planning` session messages use the backend tool-name contract (`geocode`, `planRoute`, `searchNearby`, `routing_agent`) to derive phases safely.
- `status == complete` remains a terminal shortcut to `finalizing`, matching the backend helper.

## UI Decisions
- `capsuleHeadline` uses stable per-phase fallback copy rather than message text so the planning capsule stays single-line and italic-ready even when the streamed planning payload omits narrator text.
- `phaseSteps` now comes directly from the view-model, removing duplicated active/done/pending conversion logic from consumers.

## Platform-Specific Notes
- `LSPhaseIndicator` already owned a top-level `PlanningPhase` row model, so the component row type had to be nested under `LSPhaseIndicator.Phase` before adding the feature-local `PlanningPhase` enum.
- Full scheme `xcodebuild test` is currently blocked by a pre-existing idle-screen UI capture failure unrelated to Planning; baseline reproduction was captured under `.tmp/PLAN-S08-IOS-T01/preexisting-ui-test-check.txt`.

## Files Created/Modified
- `ios/LaneShadow/Features/Planning/PlanningPhase.swift` — canonical planning phase enum plus deterministic derivation helper and indicator-step mapping
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` — cancel confirmation flow, phase/headline publication, heuristic removal
- `ios/LaneShadow/Features/Planning/PlanningViewModel+Submission.swift` — extracted submission/retry flow to keep the main view-model file lean
- `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` — extracted live state carrier
- `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` — contract coverage for phase derivation, headlines, indicator steps, and cancel flow
- `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` — nested the row model under `LSPhaseIndicator.Phase`
