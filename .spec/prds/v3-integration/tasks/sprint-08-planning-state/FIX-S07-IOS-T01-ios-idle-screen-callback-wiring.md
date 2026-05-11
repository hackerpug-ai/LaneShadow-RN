# FIX-S07-IOS-T01 — iOS IdleScreen: wire map controls callbacks to LSMapHost camera
> Status: ✅ Completed
> Cycle: 2
> Commit: b834e15c5ffd37719de64f4641da2b8667581898
> Reviewer: swift-reviewer
> Updated: 2026-05-08T19:11:19.163Z

> **Task ID:** FIX-S07-IOS-T01 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 60 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P0 · **Effort:** S
> **PRD Refs:** UC-MAP-01, Sprint 07 red-hat review finding H-1

## Background

Red-hat review of Sprint 07 discovered that `ios/LaneShadow/Views/Templates/IdleScreen.swift:116-120` ships all map controls callbacks as empty closures (`onZoomIn: {}, onZoomOut: {}, onRecenter: {}, onLayers: {}, onToggleView: {}`). The REQUIREMENT-CONTRACT for CAPS-S07-T05 AC-7 claims `satisfied: true` with evidence from `IdleScreenContainer.swift:99-101` — a different file. The template the task modified has empty closures while the container may override them. This is a CRITICAL stub violation under the CLAUDE.md anti-stub mandate. Sprint 08 depends on working map controls (the planning state reconfigures them), so this must be fixed before Sprint 08 execution.

## Critical Constraints

**MUST:**
- Wire `onZoomIn` and `onZoomOut` through IdleScreen to the LSMapHost camera controller (`LSMapCameraController`) so taps produce verifiable +1/-1 zoom deltas
- Wire `onRecenter` to `mapHost.recenterToUserLocation()` (or equivalent API on the camera controller)
- Wire `onLayers` to `mapHost.toggleLayers()` or an explicit stub with `os_log(.info, "[STUB] Layers toggle — Sprint 09")` if the API doesn't exist yet
- Wire `onToggleView` to `os_log(.info, "[STUB] Mode toggle — Sprint 08")` (documented as Sprint 08 work per SPRINT.md notes)
- Preserve the existing `IdleScreenContainer.swift` wiring path — if the container already overrides callbacks, ensure the template provides meaningful defaults that the container can optionally override

**NEVER:**
- Ship empty closures `{}` for zoom, recenter, or layers — these are core UI functionality
- Import `MapboxMaps` inside `IdleScreen.swift` — callbacks should call ViewModel/host methods, not raw SDK APIs
- Modify `LSMapControls.swift` or `LSContextCapsule.swift` — those are Sprint 07 components

**STRICTLY:**
- If `IdleScreenContainer` already wires callbacks correctly, refactor so `IdleScreen.swift` accepts closures as parameters with meaningful defaults rather than hardcoding empty ones
- Add TODO comments for any callback that must be completed in a later sprint, with the sprint reference

## Specification

**Objective:** Wire all map controls callbacks in `IdleScreen.swift` to real LSMapHost camera APIs (or explicit documented stubs for deferred work), eliminating the empty-closure anti-pattern.

**Success State:** Tapping zoom-in/+1 and zoom-out/-1 on the idle screen produces real camera zoom deltas visible in the XCUITest from CAPS-S07-T05 AC-7. Recenter and layers callbacks are non-nil and resolve without crash. Mode-toggle emits a log entry.

## Acceptance Criteria

### AC-1 — Zoom callbacks produce real camera deltas

**GIVEN** IdleScreen with LSMapControls mounted on a real LSMapHost in the idle stack
**WHEN** an XCUITest taps `control-zoom-in` then `control-zoom-out`
**THEN** the LSMapHost camera proxy records +1 then -1 zoom delta (final delta 0)
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera`

### AC-2 — Recenter callback is wired to a non-crashing handler

**GIVEN** IdleScreen with LSMapControls
**WHEN** the recenter chip is tapped
**THEN** the `onRecenter` callback fires without crash; if `recenterToUserLocation()` exists on the camera controller, it is invoked; otherwise a log stub fires with `os_log(.info, "[STUB] Recenter — API pending")`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_recenterCallback_isWired`

### AC-3 — No empty closures remain in IdleScreen.swift for map controls

**GIVEN** `ios/LaneShadow/Views/Templates/IdleScreen.swift`
**WHEN** grep is run for empty callback patterns
**THEN** zero occurrences of `onZoomIn: {}`, `onZoomOut: {}`, `onRecenter: {}`, or `onLayers: {}` remain; `onToggleView: { ... }` may contain a logging stub but never a bare `{}`
**Verify:** `grep -cE 'on(ZoomIn|ZoomOut|Recenter|Layers): \{\}' ios/LaneShadow/Views/Templates/IdleScreen.swift | grep -v ':0$'` returns nothing

### AC-4 — Existing Sprint 06 + Sprint 07 tests still pass

**GIVEN** the wired IdleScreen
**WHEN** the full idle-related test suite runs
**THEN** all pre-existing tests in `LaneShadowTests/IdleViewModelTests`, `LaneShadowTests/Features/Idle/*`, and `LaneShadowUITests/Features/Idle/*` pass with no regressions
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | XCUITest taps zoom-in then zoom-out and observes +1/-1 camera deltas | AC-1 | happy_path |
| TC-2 | Recenter callback fires without crash when tapped | AC-2 | happy_path |
| TC-3 | grep finds zero empty closures for zoom/recenter/layers callbacks | AC-3 | edge |
| TC-4 | All existing idle tests pass after wiring change | AC-4 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Templates/IdleScreen.swift` | 110-130 | Current empty closures — the site to fix |
| `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` | 90-110 | Existing wiring path that may already override callbacks |
| `ios/LaneShadow/Views/Atoms/LSMapCameraController.swift` | all | Camera controller API surface for zoom/recenter |
| `ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift` | all | Existing retrofit tests that must keep passing |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — wire callbacks)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY only if delegation pattern requires adjustment)
- `ios/LaneShadowTests/Features/Idle/IdleScreenRetrofitTests.swift` (MODIFY — add callback-wiring tests)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — Sprint 07 component
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — Sprint 07 component
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 host
- `android/**`, `server/**`, `react-native/**`

## Design

**References:** CAPS-S07-T05 task spec (AC-7), red-hat review finding H-1

**Pattern:** `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:99-101` — existing wiring pattern that the container uses to override template defaults

**Anti-Pattern:** Empty closures `{}` for core UI callbacks (the bug being fixed)

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_recenterCallback_isWired` |
| AC-3 | `grep -cE 'on(ZoomIn|ZoomOut|Recenter|Layers): \{\}' ios/LaneShadow/Views/Templates/IdleScreen.swift` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Modifying IdleScreen.swift (SwiftUI template) and adding tests — pure SwiftUI/Observable wiring within existing iOS feature surface.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `RULES.md` (§Real Device E2E Testing)

## Dependencies

**Depends on:** Sprint 07 components (LSMapControls, LSContextCapsule, LSMapCameraController from T05 cycle 4)
**Blocks:** PLAN-S08-IOS-T02 (planning state must have working map controls)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN IdleScreen with LSMapControls on LSMapHost WHEN XCUITest taps zoom-in then zoom-out THEN camera records +1/-1 deltas",
      "verify": "xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera",
      "satisfied": true,
      "evidence": "ios/LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests.swift:72 and .tmp/FIX-S07-IOS-T01/ac-1-output.txt show zoom-in records zoom-deltas=1 and zoom-out records zoom-deltas=1,-1; xcodebuild executed 1 test with 0 failures.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN IdleScreen WHEN recenter tapped THEN callback fires without crash; real API or logged stub",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_recenterCallback_isWired",
      "satisfied": true,
      "evidence": "ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:140 and .tmp/FIX-S07-IOS-T01/ac-2-output.txt show recenter requests are consumed and the selector executed 1 test with 0 failures.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN IdleScreen.swift WHEN grep runs THEN zero empty closures for zoom/recenter/layers callbacks",
      "verify": "grep -cE 'on(ZoomIn|ZoomOut|Recenter|Layers): \\{\\}' ios/LaneShadow/Views/Templates/IdleScreen.swift",
      "satisfied": true,
      "evidence": ".tmp/FIX-S07-IOS-T01/ac-3-output.txt shows grep -cE 'on(ZoomIn|ZoomOut|Recenter|Layers): \\\\{\\\\}' returned 0.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN wired IdleScreen WHEN idle tests run THEN all existing tests pass with no regressions",
      "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Features/Idle",
      "satisfied": true,
      "evidence": ".tmp/FIX-S07-IOS-T01/ac-4-output.txt shows the idle regression command exited 0, includes Swift Testing output 'Test run with 26 tests in 4 suites passed', and ends with TEST SUCCEEDED.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "XCUITest zoom-in/+1 then zoom-out/-1 produces camera deltas",
      "verify": "xcodebuild test -only-testing:LaneShadowUITests/Features/Idle/IdleMapControlsWiringTests/test_zoomChips_emitDeltasToHostCamera",
      "satisfied": true,
      "evidence": ".tmp/FIX-S07-IOS-T01/ac-1-output.txt shows value assertions for zoom-deltas=1 and zoom-deltas=1,-1; TEST SUCCEEDED.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Recenter callback fires without crash",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle/IdleScreenRetrofitTests/test_recenterCallback_isWired",
      "satisfied": true,
      "evidence": ".tmp/FIX-S07-IOS-T01/ac-2-output.txt shows test_recenterCallback_isWired passed and logged the explicit no-user-location recenter path.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "grep finds zero empty closures for zoom/recenter/layers",
      "verify": "grep -cE 'on(ZoomIn|ZoomOut|Recenter|Layers): \\{\\}' ios/LaneShadow/Views/Templates/IdleScreen.swift",
      "satisfied": true,
      "evidence": ".tmp/FIX-S07-IOS-T01/ac-3-output.txt shows 0 empty callback closures matched.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "All existing idle tests pass after wiring change",
      "verify": "xcodebuild test -only-testing:LaneShadowTests/Features/Idle",
      "satisfied": true,
      "evidence": ".tmp/FIX-S07-IOS-T01/ac-4-output.txt shows 26 Swift Testing idle tests in 4 suites passed and TEST SUCCEEDED.",
      "remediation": null,
      "last_evaluated_cycle": 2,
      "last_evaluated_commit": "b834e15c5ffd37719de64f4641da2b8667581898",
      "maps_to_ac": "AC-4"
    }
  ]
}
-->
