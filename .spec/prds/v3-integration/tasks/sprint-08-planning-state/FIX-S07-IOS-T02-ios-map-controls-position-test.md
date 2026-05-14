# FIX-S07-IOS-T02 — iOS: add map controls vertical-centering + zoom-delta test verification
> Status: ✅ Completed
> Cycle: 5
> Commit: ea95cc6f6f93fcb32c14030e070cb18798bba0df
> Reviewer: swift-reviewer
> Review: .kb-run-sprint/tasks/FIX-S07-IOS-T02/review/5/response.json
> Updated: 2026-05-14T02:31:30Z
> **Task ID:** FIX-S07-IOS-T02 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 60 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P1 · **Effort:** S
> **PRD Refs:** UC-MAP-01, Sprint 07 red-hat review findings H-3 and H-4

## Background

Red-hat review of Sprint 07 identified two test-quality gaps:

1. **T05 AC-3 (H-3):** `IdleScreenRetrofitTests.test_idle_rendersMapControlsVerticallyCentered` checks that LSMapControls exist (`!= nil`) but does not verify the "vertical middle of right edge" positioning requirement (±20pt of map canvas center). The test would pass if controls were top-aligned or bottom-aligned.

2. **T03 AC-5 (H-4):** `LSMapControlsTests.test_zoomCallbacks_emitPlusMinusOne` checks a `zoomCallbacksBound` boolean flag, never invokes callbacks or measures camera deltas. The AC describes "+1/-1 zoom on Mapbox camera" but the test only verifies binding, not behavior.

Both are test-theatre — tests that pass regardless of whether the feature works correctly. These tests must be strengthened before Sprint 08's planning state relies on correct map controls positioning and zoom behavior.

## Critical Constraints

**MUST:**
- Strengthen T05 AC-3 test to verify LSMapControls' vertical center is within ±20pt of the map canvas vertical center (using ViewInspector frame inspection or equivalent)
- Strengthen T03 AC-5 test to verify callbacks actually fire with expected delta values when invoked (using a fake camera proxy or counter-based verification)
- Preserve all existing passing tests — no regressions

**NEVER:**
- Remove or weaken existing test assertions — only add stronger verification
- Add XCUITest-only verification for positioning (unit test is preferred for faster feedback)
- Modify LSMapControls.swift or IdleScreen.swift production code unless the tests expose a real bug

**STRICTLY:**
- If ViewInspector cannot access frame geometry in the current test environment, add a GeometryReader-based position report to a test-only overlay and verify its output
- If callback invocation testing requires a fake camera proxy that doesn't exist, create it as a minimal test helper

## Specification

**Objective:** Strengthen two test-theatre cases into real behavioral verification tests for map controls positioning and zoom callback behavior.

**Success State:** `test_idle_rendersMapControlsVerticallyCentered` asserts ±20pt positioning, and `test_zoomCallbacks_emitPlusMinusOne` asserts real callback invocation with expected values.

## Acceptance Criteria

### AC-1 — Map controls positioning test asserts vertical center ±20pt

**GIVEN** the updated `IdleScreenRetrofitTests.test_idle_rendersMapControlsVerticallyCentered`
**WHEN** the test runs
**THEN** the test asserts that the LSMapControls container's vertical center is within ±20pt of the map canvas vertical center (not just existence)
**Verify:** `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered`

### AC-2 — Zoom callback test verifies real invocation

**GIVEN** the updated `LSMapControlsTests.test_zoomCallbacks_emitPlusMinusOne`
**WHEN** the test runs
**THEN** the test invokes the zoom-in and zoom-out callbacks via button tap or programmatic call and verifies a counter/proxy records +1 and -1 respectively (not just a binding flag)
**Verify:** `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne`

### AC-3 — All existing tests still pass

**GIVEN** the strengthened tests
**WHEN** the full idle + map controls test suites run
**THEN** all pre-existing tests pass with no regressions
**Verify:** `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered -only-testing:LaneShadowTests/LSMapControlsTests`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Positioning test asserts vertical center within ±20pt | AC-1 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered` | edge |
| TC-2 | Zoom test invokes callbacks and verifies delta values | AC-2 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne` | happy_path |
| TC-3 | No test regressions from strengthening | AC-3 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered -only-testing:LaneShadowTests/LSMapControlsTests` | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift` | all | Current positioning test — site to strengthen |
| `ios/LaneShadowTests/Organisms/LSMapControlsTests.swift` | 150-206 | Current zoom test — site to strengthen |
| `ios/LaneShadow/Views/Organisms/LSMapControls.swift` | all | Production code — understand callback binding |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift` (MODIFY — strengthen positioning assertion)
- `ios/LaneShadowTests/Organisms/LSMapControlsTests.swift` (MODIFY — strengthen callback assertion)
- Test helper files (NEW — if fake camera proxy needed)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — Sprint 07 component
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — only FIX-S07-IOS-T01 should modify this
- `android/**`, `server/**`

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered` |
| AC-2 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne` |
| AC-3 | `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered -only-testing:LaneShadowTests/LSMapControlsTests` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Test strengthening in Swift/XCTest — swift-implementer's domain.

## Dependencies

**Depends on:** Sprint 07 tests (existing test files)
**Blocks:** PLAN-S08-IOS-T02 (planning state needs verified positioning and zoom behavior)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN updated positioning test WHEN runs THEN asserts vertical center within \u00b120pt of map canvas center",
      "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift:38-74 and :247-250 assert live frame midpoints with XCTAssertLessThanOrEqual(..., 20); .tmp/FIX-S07-IOS-T02-integration/ac1-selector.log shows IdleScreenRetrofitSpecTests executed 1 test and passed.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "b1852605f14e85fdb2f9f51981140af10d2cad4f",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN updated zoom test WHEN runs THEN invokes callbacks and verifies +1/-1 delta values on proxy",
      "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Organisms/LSMapControlsTests.swift:97-125 taps zoom-in and zoom-out buttons and asserts recorded deltas equal [1, -1]; .tmp/FIX-S07-IOS-T02-integration/ac2-selector.log shows LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne executed 1 test and passed.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "b1852605f14e85fdb2f9f51981140af10d2cad4f",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN strengthened tests WHEN suites run THEN all pre-existing tests pass",
      "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered -only-testing:LaneShadowTests/LSMapControlsTests",
      "satisfied": true,
      "evidence": ".tmp/FIX-S07-IOS-T02-integration/combined-suites.log shows IdleScreenRetrofitSpecTests passed with 1 test and LSMapControlsTests passed with 8 tests; Selected tests executed 9 tests with 0 failures. .tmp/FIX-S07-IOS-T02-integration/trailing-comma.log shows 0 violations.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "b1852605f14e85fdb2f9f51981140af10d2cad4f",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Positioning test asserts vertical center within \u00b120pt",
      "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Zoom test invokes callbacks and verifies delta values",
      "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "No test regressions from strengthening",
      "verify": "cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleScreenRetrofitSpecTests/test_idle_rendersMapControlsVerticallyCentered -only-testing:LaneShadowTests/LSMapControlsTests",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null,
      "maps_to_ac": "AC-3"
    }
  ]
}
-->