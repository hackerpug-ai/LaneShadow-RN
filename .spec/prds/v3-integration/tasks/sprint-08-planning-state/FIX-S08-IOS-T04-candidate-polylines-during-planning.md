# FIX-S08-IOS-T04 — iOS: wire candidate polylines from routePlan to LSMap during planning

> **Task ID:** FIX-S08-IOS-T04 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 120 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P1 · **Effort:** M
> **PRD Refs:** UC-CHAT-02, design spec `.spec/design/system/views/mapapp/planning/scoring/README.md`, red-hat review 2026-05-19 finding F9

## Background

Red-hat review found that `ios/LaneShadow/Views/Templates/PlanningScreen.swift:139` hardcodes `polylines: []` for the map view during planning. The S04 Scoring spec variant requires three candidate polylines (`--route-best`, `--route-alt1`, `--route-alt2`) to render once the agent reaches the scoring/finalizing phase. The data exists — `LaneShadowRoutePlanSnapshot.routeOptions.options` carries candidate routes — but the view never reads it. Even if FIX-S08-CVX-T01 + FIX-S08-IOS-T01 fix the phase progression, the map remains empty during scoring.

This task plumbs `routeOptions` from the route-plan subscription through to `PlanningScreenLiveState`, then through to `LSMap`'s `polylines` parameter.

## Critical Constraints

**MUST:**
- Add a `var polylines: [LSMapPolyline]` (or whatever the project's existing polyline-value-type is) to `PlanningScreenLiveState`
- Populate `polylines` from `routePlan.routeOptions.options` when the route plan subscription delivers a snapshot with non-empty options
- Pass `polylines` into `LSMap(polylines: liveState.polylines)` from `PlanningScreen+LiveContent.swift`'s `mapView` (or the equivalent slot)
- Use the existing `--route-best` / `--route-alt1` / `--route-alt2` token mapping in the polyline value type's stroke color (the spec at `.spec/design/system/views/mapapp/planning/scoring/README.md` mandates this color triple)

**NEVER:**
- Render polylines during phases earlier than `.drafting` (no candidate data exists yet)
- Render polylines from the planning row's `content` JSON — the canonical data is the route-plan snapshot
- Touch backend code or schema

**STRICTLY:**
- Reduced-motion preference must not affect polylines (these are static visual elements, not animations)
- Sandbox stories must remain compatible (sandbox state has its own polylines field or remains empty)

## Specification

**Objective:** Make the planning state's S04 scoring variant render real candidate polylines on the map host as soon as the agent produces them.

**Success State:** A live planning run on Simulator that reaches the scoring phase shows three polylines on the map with copper-best / accent-alt1 / accent-alt2 strokes. Verified via XCUITest screenshot capture against the spec reference.

## Acceptance Criteria

### AC-1 — `polylines` field exists on `PlanningScreenLiveState`
**GIVEN** `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift`
**WHEN** read
**THEN** the struct declares `var polylines: [LSMapPolyline]` (or equivalent)
**Verify:** `grep -n "polylines" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift`

### AC-2 — Polylines populate from route-plan snapshot
**GIVEN** a `PlanningViewModel` subscribed to a route plan snapshot with three `routeOptions.options`
**WHEN** `handleRoutePlanSnapshot` runs (or the `screenState` is computed)
**THEN** `screenState.polylines.count == 3` and the polylines map options[0/1/2] to `--route-best/--route-alt1/--route-alt2` stroke tokens
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_routeOptions_populatePolylines`

### AC-3 — Live PlanningScreen passes polylines to LSMap
**GIVEN** a `PlanningScreenLiveState` with three polylines
**WHEN** the live `mapView` is rendered
**THEN** the `LSMap` receives `polylines` with three entries (verified via SwiftUI snapshot or XCUITest accessibility query)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_mapView_passesPolylinesToLSMap`

### AC-4 — Live Simulator scoring phase renders three polylines
**GIVEN** a Simulator build, FIX-S08-CVX-T01 + FIX-S08-IOS-T01 + this fix
**WHEN** the rider completes a planning request that produces 3+ route candidates
**THEN** XCUITest captures three distinct polyline overlays on the map during the scoring phase
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_S04_scoringPolylines`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | `PlanningScreenLiveState` declares `polylines` field | AC-1 | edge |
| TC-2 | Three `routeOptions` produce three polylines with correct tokens | AC-2 | happy_path |
| TC-3 | `LSMap` receives polylines from live state | AC-3 | happy_path |
| TC-4 | Scoring-phase capture shows three polylines | AC-4 | happy_path |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` | all | Add `polylines` field |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 165-250 | `handleRoutePlanSnapshot` and `routeOptions` handling |
| `ios/LaneShadow/Views/Templates/PlanningScreen.swift` | 134-150 | Where `mapView` builds `LSMap` |
| `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` | all | Live composition path |
| `ios/LaneShadow/Views/Atoms/LSMap.swift` | search `polylines:` | Existing `LSMap` polylines API |
| `.spec/design/system/views/mapapp/planning/scoring/README.md` | all | Spec for S04 visual + token recipe |
| `ios/LaneShadow/Models/` | search `LaneShadowRoutePlanSnapshot` | Route plan snapshot type — `routeOptions.options` shape |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` (MODIFY — add field)
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY — populate polylines)
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` (MODIFY — pass polylines to LSMap)
- `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` (MODIFY only if mapView lives there)
- `ios/LaneShadowTests/Features/Planning/PlanningViewModelTests.swift` (MODIFY)
- `ios/LaneShadowTests/Templates/PlanningScreenCompositionTests.swift` (MODIFY)
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (MODIFY — add S04 capture)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — existing atom, only consume its public API
- `server/**`, `android/**`, `react-native/**`

## Design

**References:**
- `.spec/design/system/views/mapapp/planning/scoring/README.md` — S04 visual spec
- `.spec/design/system/views/mapapp/planning/README.md` Token recipe: `--route-best` / `--route-alt1` / `--route-alt2`

**Pattern:** `LSMap(polylines: ...)` is the existing API from Sprint 06; route-results state (Sprint 09) uses the same pattern for terminal routes — this task is the planning-state precursor

**Anti-Pattern:** Reading polyline data from the planning row's `content` JSON; building a new map composition that doesn't reuse `LSMap`

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -n "polylines" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_routeOptions_populatePolylines` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_mapView_passesPolylinesToLSMap` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_S04_scoringPolylines` |
| regression | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Pure SwiftUI data plumbing + design-token consumption; XCUITest capture for visual verification.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `brain/docs/design-tokens.md` (or equivalent)
- `RULES.md` (§Cross-Platform Component Parity — story id naming)

## Dependencies

**Depends on:** FIX-S08-IOS-T01 (phase progression must be reliable)
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "polylines field exists on PlanningScreenLiveState", "verify": "grep -n 'polylines' ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Three routeOptions populate three polylines with correct tokens", "verify": "xcodebuild test ... test_routeOptions_populatePolylines", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Live mapView passes polylines to LSMap", "verify": "xcodebuild test ... test_mapView_passesPolylinesToLSMap", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Live simulator scoring phase renders three polylines", "verify": "xcodebuild test ... test_planningScreen_S04_scoringPolylines", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "polylines declared", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Polylines mapped to route-best/alt1/alt2 tokens", "verify": "xcodebuild test ... test_routeOptions_populatePolylines", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSMap receives 3 polylines", "verify": "xcodebuild test ... test_mapView_passesPolylinesToLSMap", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "S04 XCUITest capture shows 3 polylines", "verify": "xcodebuild test ... test_planningScreen_S04_scoringPolylines", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" }
  ]
}
-->
