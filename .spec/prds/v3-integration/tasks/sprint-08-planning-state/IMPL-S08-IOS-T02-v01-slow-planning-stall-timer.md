# IMPL-S08-IOS-T02 — iOS: V01 slow planning stall timer + apology copy

> **Task ID:** IMPL-S08-IOS-T02 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 90 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P1 · **Effort:** S
> **PRD Refs:** design spec `.spec/design/system/views/mapapp/planning/slow-planning/README.md`, red-hat review 2026-05-19 finding F5 (V01 missing)

## Background

The V01 Slow Planning spec variant says: "Phase 2 active, >4s stall; inline apology copy appears below steps in the phase indicator while the planning capsule remains visible above". Red-hat review found NO stall timer in the codebase. `PlanningScreenLiveState` has no `isSlowPlanning` field; `PlanningViewModel.updateMessages` has no timer; `livePhaseIndicatorView` has no slow-apology branch. This is a complete net-new state.

Implementation: track the timestamp of the most recent phase change in the view model. When the same phase has been active for >4 seconds without a transition, set `isSlowPlanning = true` and provide a `slowApologyText` value. When the phase advances, reset.

## Critical Constraints

**MUST:**
- Add `var isSlowPlanning: Bool` to `PlanningScreenLiveState`
- Add `var slowApologyText: String?` to `PlanningScreenLiveState`
- In `PlanningViewModel`, track `phaseEntryDate: Date` set whenever the active phase changes
- Use a single `Task.sleep(for: .seconds(4))` cancellable per phase entry; if the phase advances before the sleep completes, cancel it; if the sleep completes, set `isSlowPlanning = true` and `slowApologyText` to a localized copy
- Reset `isSlowPlanning = false` and `slowApologyText = nil` on every phase advancement
- Render the apology slot in `LSPhaseIndicator` (or as an overlay below it) per spec when `isSlowPlanning == true`

**NEVER:**
- Poll the phase in a tight loop
- Show the apology copy after `.finalizing` (the planning is about to complete)
- Touch backend code

**STRICTLY:**
- The timer must respect the existing `stopObserving()` cancellation — when the view model stops observing, any pending stall task must cancel
- The apology copy is a localized string (`NSLocalizedString` or equivalent) so it can be translated
- Reduced-motion must not affect this (text-only, no animation)

## Specification

**Objective:** Surface a "Sorry this is taking longer than usual" message when a single phase has stalled for >4 seconds.

**Success State:** A test that constructs a `PlanningViewModel`, drives it to `.searching`, waits 5 seconds without advancing, and asserts `screenState.isSlowPlanning == true` passes. The live planning view shows the apology text after a forced delay.

## Acceptance Criteria

### AC-1 — Fields exist on `PlanningScreenLiveState`
**GIVEN** the state struct
**WHEN** read
**THEN** both `isSlowPlanning` and `slowApologyText` are declared
**Verify:** `grep -E "isSlowPlanning|slowApologyText" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift`

### AC-2 — Stall timer fires after 4 seconds without phase change
**GIVEN** a `PlanningViewModel` with mock clock at `t=0` and active phase `.searching`
**WHEN** time advances to `t=5s` with no phase change
**THEN** `screenState.isSlowPlanning == true` and `slowApologyText != nil`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_stallTimer_firesAfterFourSeconds`

### AC-3 — Phase advancement resets the stall flag
**GIVEN** `isSlowPlanning == true`
**WHEN** the active phase advances to `.drafting`
**THEN** `screenState.isSlowPlanning == false` and `slowApologyText == nil`
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseAdvance_resetsStallFlag`

### AC-4 — Stall timer is cancelled on `stopObserving`
**GIVEN** a `PlanningViewModel` with an active stall task
**WHEN** `stopObserving()` is called
**THEN** the stall task is cancelled and no further state mutations occur after cancellation
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_stopObserving_cancelsStallTimer`

### AC-5 — V01 visual capture matches spec
**GIVEN** a Simulator build with this fix
**WHEN** XCUITest forces a slow scenario (mock backend delay or sandbox state)
**THEN** the apology text is visible under the phase indicator
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_V01_slowPlanning`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Both new fields declared | AC-1 | edge |
| TC-2 | 4-second stall sets `isSlowPlanning = true` | AC-2 | happy_path |
| TC-3 | Phase advancement resets stall state | AC-3 | edge |
| TC-4 | `stopObserving` cancels stall task | AC-4 | edge |
| TC-5 | V01 XCUITest capture matches spec | AC-5 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/design/system/views/mapapp/planning/slow-planning/README.md` | all | V01 spec |
| `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` | all | Add fields |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | all | Add stall task + reset logic |
| `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` | all | Apology slot rendering |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` (MODIFY)
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY)
- `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` (MODIFY — add optional apology slot parameter)
- Tests under `ios/LaneShadowTests/` and `ios/LaneShadowUITests/`

**Write-Prohibited:**
- `server/**`, `android/**`, `react-native/**`

## Design

**References:**
- `.spec/design/system/views/mapapp/planning/slow-planning/README.md`
- `.spec/design/system/views/mapapp/planning/README.md` (V01 row)

**Pattern:** Single cancellable `Task` per phase entry; cancel on phase change or stopObserving — Swift Concurrency primitives

**Anti-Pattern:** Timer-based polling; never-cancelled tasks; setting flag from outside the view model

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -E "isSlowPlanning\|slowApologyText" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_stallTimer_firesAfterFourSeconds` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_phaseAdvance_resetsStallFlag` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_stopObserving_cancelsStallTimer` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_V01_slowPlanning` |
| regression | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Swift Concurrency + SwiftUI view-model state + XCUITest capture.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `RULES.md` (§Cross-Platform Component Parity — story id naming for `planning.slow-planning.v01`)

## Dependencies

**Depends on:** FIX-S08-IOS-T01 (phase change events drive the stall timer reset)
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Both fields declared", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Stall after 4s sets isSlowPlanning true", "verify": "xcodebuild test ... test_stallTimer_firesAfterFourSeconds", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Phase advance resets stall flag", "verify": "xcodebuild test ... test_phaseAdvance_resetsStallFlag", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "stopObserving cancels stall task", "verify": "xcodebuild test ... test_stopObserving_cancelsStallTimer", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "V01 capture matches spec", "verify": "xcodebuild test ... test_planningScreen_V01_slowPlanning", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "Fields declared", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Stall fires at 4s", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Phase change resets stall", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "stopObserving cancels timer", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "V01 visual capture", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-5" }
  ]
}
-->
