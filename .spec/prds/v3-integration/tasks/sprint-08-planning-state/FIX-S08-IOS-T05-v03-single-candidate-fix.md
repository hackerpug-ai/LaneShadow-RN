# FIX-S08-IOS-T05 — iOS: fix V03 single-candidate semantic + advisory block

> **Task ID:** FIX-S08-IOS-T05 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 120 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P1 · **Effort:** M
> **PRD Refs:** design spec `.spec/design/system/views/mapapp/planning/single-candidate/README.md`, red-hat review 2026-05-19 finding F12

## Background

Red-hat review found a semantic collision in `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift:89`: `showWarningChrome: liveState.errorMessage != nil`. The V03 Single Candidate spec describes warning chrome appearing when the agent yields *exactly one* candidate route (an over-constraint advisory) — NOT when the planning errored out. The current code repurposes the error flag, producing wrong behavior: a network error displays the over-constraint chrome, and a real single-candidate result displays nothing at all. Additionally, the spec calls for an "over-constraint advisory block" with copy explaining why only one candidate was returned — this text has no field in `PlanningScreenLiveState` and no rendering branch.

## Critical Constraints

**MUST:**
- Add `var isSingleCandidate: Bool` to `PlanningScreenLiveState`
- Add `var singleCandidateAdvisoryText: String?` to `PlanningScreenLiveState` (nil when no advisory)
- Set `isSingleCandidate = true` when `routePlan.routeOptions?.options.count == 1` in `handleRoutePlanSnapshot`
- Wire advisory copy from the route plan snapshot if backend provides it; otherwise use a default localized string for the over-constraint case (e.g., "Only one route fits your filters — try widening your search.")
- Change `showWarningChrome` in `PlanningScreen+LiveContent.swift` to read `liveState.isSingleCandidate` (NOT `errorMessage != nil`)
- Render `singleCandidateAdvisoryText` in the phase-indicator advisory slot per spec when non-nil

**NEVER:**
- Render the advisory or warning chrome during any phase earlier than `.finalizing`
- Tie warning chrome to error state (the error path has its own rendering branch via `errorMessage`)
- Touch backend code

**STRICTLY:**
- The error path (`errorMessage != nil`) must continue to render correctly — this is a separate visual state from V03 and must NOT regress
- The dark/light theming for the warning copper accent must follow the existing `--signal-default` token from the spec

## Specification

**Objective:** Make V03 Single Candidate render with correct semantics — warning chrome and advisory block fire on a one-result outcome, not on an error.

**Success State:** A planning run that produces exactly one candidate route shows warning-copper chrome on the phase indicator and the advisory text below the steps. A planning run that errors shows the error UI (unchanged). Verified by XCUITest captures of both flows.

## Acceptance Criteria

### AC-1 — `isSingleCandidate` + `singleCandidateAdvisoryText` exist on `PlanningScreenLiveState`
**GIVEN** `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift`
**WHEN** read
**THEN** both fields are declared
**Verify:** `grep -E "isSingleCandidate|singleCandidateAdvisoryText" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift`

### AC-2 — `isSingleCandidate` flips true when routeOptions has exactly one option
**GIVEN** a `PlanningViewModel`
**WHEN** `handleRoutePlanSnapshot` runs with a snapshot whose `routeOptions.options.count == 1`
**THEN** `screenState.isSingleCandidate == true` and `singleCandidateAdvisoryText` is non-nil
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_singleCandidate_flipsFlagAndAdvisory`

### AC-3 — `showWarningChrome` no longer reads `errorMessage`
**GIVEN** `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift`
**WHEN** grep'd
**THEN** `showWarningChrome` is bound to `liveState.isSingleCandidate`; no occurrence of `showWarningChrome: liveState.errorMessage != nil` remains
**Verify:** `grep -E "showWarningChrome: liveState\.errorMessage" ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` returns nothing

### AC-4 — Error state still renders correctly
**GIVEN** a `PlanningScreenLiveState` with `errorMessage != nil` and `isSingleCandidate == false`
**WHEN** the live planning view renders
**THEN** the error UI (existing error message rendering) appears AND warning chrome does NOT appear
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_errorState_doesNotShowWarningChrome`

### AC-5 — V03 visual capture matches spec
**GIVEN** a Simulator build and a sandbox or live run that triggers `isSingleCandidate`
**WHEN** XCUITest captures the planning screen
**THEN** the screenshot shows warning-copper accent on phase 5 + the advisory block below the steps
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_V03_singleCandidate`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | Both new fields declared on `PlanningScreenLiveState` | AC-1 | edge |
| TC-2 | One-option snapshot flips `isSingleCandidate` true with advisory text | AC-2 | happy_path |
| TC-3 | `showWarningChrome` no longer reads `errorMessage` | AC-3 | edge |
| TC-4 | Error state renders error UI without warning chrome | AC-4 | edge |
| TC-5 | V03 XCUITest capture matches spec | AC-5 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` | all | Add fields |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 220-250 | `handleRoutePlanSnapshot` |
| `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` | 80-100 | `showWarningChrome` binding site |
| `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` | all | Confirm advisory text slot exists or needs adding |
| `.spec/design/system/views/mapapp/planning/single-candidate/README.md` | all | V03 spec |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` (MODIFY)
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY)
- `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` (MODIFY)
- `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` (MODIFY only if advisory slot needs a new parameter — keep changes minimal)
- `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` (MODIFY)
- `ios/LaneShadowTests/Templates/PlanningScreenCompositionTests.swift` (MODIFY)
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (MODIFY)

**Write-Prohibited:**
- `server/**`, `android/**`, `react-native/**`
- Other molecules / atoms — keep changes localized

## Design

**References:**
- `.spec/design/system/views/mapapp/planning/single-candidate/README.md`
- `.spec/design/system/views/mapapp/planning/README.md` (V03 row of variants table)

**Pattern:** `LSPhaseIndicator` already exposes a state-driven step model; add an optional `advisoryText: String?` parameter rendered below the step list when non-nil

**Anti-Pattern:** Repurposing semantically distinct flags (error vs single-candidate) to drive the same visual

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -E "isSingleCandidate\|singleCandidateAdvisoryText" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_singleCandidate_flipsFlagAndAdvisory` |
| AC-3 | `grep -E "showWarningChrome: liveState\.errorMessage" ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_errorState_doesNotShowWarningChrome` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_V03_singleCandidate` |
| regression | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** SwiftUI state machine + view binding; XCUITest visual verification.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `RULES.md` (§Cross-Platform Component Parity)

## Dependencies

**Depends on:** FIX-S08-IOS-T01 (phase derivation must be reliable for V03 to fire at the right phase)
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Both fields declared on PlanningScreenLiveState", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "isSingleCandidate flips true on one-option snapshot", "verify": "xcodebuild test ... test_singleCandidate_flipsFlagAndAdvisory", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "showWarningChrome no longer reads errorMessage", "verify": "grep returns empty", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Error state renders without warning chrome", "verify": "xcodebuild test ... test_errorState_doesNotShowWarningChrome", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "V03 XCUITest capture matches spec", "verify": "xcodebuild test ... test_planningScreen_V03_singleCandidate", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "Fields declared", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "One-option snapshot flips flag", "verify": "xcodebuild test ... test_singleCandidate_flipsFlagAndAdvisory", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "showWarningChrome decoupled from errorMessage", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Error path renders correctly", "verify": "xcodebuild test ... test_errorState_doesNotShowWarningChrome", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "V03 capture matches spec", "verify": "xcodebuild test ... test_planningScreen_V03_singleCandidate", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-5" }
  ]
}
-->
