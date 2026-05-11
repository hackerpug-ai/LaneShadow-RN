# FIX-S07-IOS-T02 — iOS: add map controls vertical-centering + zoom-delta test verification
> Status: 🔴 Needs Fixes
> Cycle: 2
> Commit: 1ce2739d6fd42e03d7c656eba684e554f835e411
> Blocked: TASK_CONTRACT_INVALID — verify selectors/runtime commands do not target the actual iOS test bundle names
> Review: .kb-run-sprint/tasks/FIX-S07-IOS-T02/review/2/response.json
> Updated: 2026-05-08T21:14:00.000Z

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
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered`

### AC-2 — Zoom callback test verifies real invocation

**GIVEN** the updated `LSMapControlsTests.test_zoomCallbacks_emitPlusMinusOne`
**WHEN** the test runs
**THEN** the test invokes the zoom-in and zoom-out callbacks via button tap or programmatic call and verifies a counter/proxy records +1 and -1 respectively (not just a binding flag)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne`

### AC-3 — All existing tests still pass

**GIVEN** the strengthened tests
**WHEN** the full idle + map controls test suites run
**THEN** all pre-existing tests pass with no regressions
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle -only-testing:LaneShadowTests/Organisms/LSMapControlsTests`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Positioning test asserts vertical center within ±20pt | AC-1 | edge |
| TC-2 | Zoom test invokes callbacks and verifies delta values | AC-2 | happy_path |
| TC-3 | No test regressions from strengthening | AC-3 | happy_path |

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
| AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Idle -only-testing:LaneShadowTests/Organisms/LSMapControlsTests` |

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
      "description": "GIVEN updated positioning test WHEN runs THEN asserts vertical center within ±20pt of map canvas center",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered",
      "satisfied": false,
      "evidence": "ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift:46-68 computes a synthetic `controlsFrame` from `hostedSize(...)` and an assumed centered formula after switching to `IdleScreen()`, while the real production layout lives in `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:56-62`. The test never reads the rendered controls frame.",
      "remediation": "Keep the test on `IdleScreenContainer` and assert against live rendered geometry for the map-controls container (ViewInspector frame data or a test-only GeometryReader/reporting overlay). The assertion must use the actual rendered frame, not a reconstructed centered frame.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "bd4f44b7f6a8e2c6826be10fdcfbac341d86b2b6",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN updated zoom test WHEN runs THEN invokes callbacks and verifies +1/-1 delta values on proxy",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Organisms/LSMapControlsTests.swift:151-179 records emitted deltas and taps both zoom buttons; /tmp/FIX-S07-IOS-T02-current-ac2.txt:340-481 shows `test_zoomCallbacks_emitPlusMinusOne` started and passed.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "bd4f44b7f6a8e2c6826be10fdcfbac341d86b2b6",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN strengthened tests WHEN suites run THEN all pre-existing tests pass",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle -only-testing:LaneShadowTests/Organisms/LSMapControlsTests",
      "satisfied": true,
      "evidence": "/tmp/FIX-S07-IOS-T02-base-test.txt:7758-7766 and /tmp/FIX-S07-IOS-T02-current-test.txt:7874-7882 both report `Test run with 26 tests in 4 suites passed` and `** TEST SUCCEEDED **`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "bd4f44b7f6a8e2c6826be10fdcfbac341d86b2b6",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Positioning test asserts vertical center within ±20pt",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_idle_rendersMapControlsVerticallyCentered",
      "satisfied": false,
      "evidence": "ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift:50-68 verifies spacer structure and then derives a midpoint from expected layout math; it does not assert the rendered map-controls container center on the real screen.",
      "remediation": "Bind the test to the real `IdleScreenContainer` geometry and assert the measured midpoint is within ±20pt of the map canvas midpoint.",
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "bd4f44b7f6a8e2c6826be10fdcfbac341d86b2b6",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Zoom test invokes callbacks and verifies delta values",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Organisms/LSMapControlsTests/test_zoomCallbacks_emitPlusMinusOne",
      "satisfied": true,
      "evidence": "ios/LaneShadowTests/Organisms/LSMapControlsTests.swift:170-179 and /tmp/FIX-S07-IOS-T02-current-ac2.txt:340-481 verify the zoom-in and zoom-out callbacks fire and emit `[1, -1]`.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "bd4f44b7f6a8e2c6826be10fdcfbac341d86b2b6",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "No test regressions from strengthening",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle -only-testing:LaneShadowTests/Organisms/LSMapControlsTests",
      "satisfied": true,
      "evidence": "The reviewed Idle/map-controls suite passed on both base and current commits: /tmp/FIX-S07-IOS-T02-base-test.txt:7758-7766 and /tmp/FIX-S07-IOS-T02-current-test.txt:7874-7882.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "bd4f44b7f6a8e2c6826be10fdcfbac341d86b2b6",
      "maps_to_ac": "AC-3"
    }
  ]
}
-->
