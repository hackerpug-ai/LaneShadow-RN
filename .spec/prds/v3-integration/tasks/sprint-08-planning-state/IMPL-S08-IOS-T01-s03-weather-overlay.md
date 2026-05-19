# IMPL-S08-IOS-T01 — iOS: S03 weather icon overlay during `.enriching` phase

> **Task ID:** IMPL-S08-IOS-T01 · **Sprint:** [Sprint 08](./SPRINT.md) · **Agent:** swift-implementer · **Estimate:** 120 min · **Type:** FEATURE · **Status:** Backlog · **Priority:** P1 · **Effort:** M
> **PRD Refs:** design spec `.spec/design/system/views/mapapp/planning/weather/README.md`, red-hat review 2026-05-19 finding F5 (S03 missing)

## Background

The S03 Weather spec variant calls for "weather condition icons (clear + wind) float over dimmed sketch" while the agent is in the `.enriching` phase. Red-hat review found the live `livePhaseIndicatorView` has no weather-overlay slot and `PlanningScreenLiveState` has no `weatherConditions` field. This variant has been promised by the design system but has no live implementation. With FIX-S08-CVX-T01 in place, the backend's enriching phase fires reliably; this task adds the iOS surface to render weather icons during that phase.

Weather data already exists in the agent flow — the `getRouteWeather` tool returns structured condition data. Backend should expose it via the route plan snapshot or the planning row's content events; this task assumes the data is available on `routePlan` (verify and confirm shape in the reading list; if the data is not exposed, file a follow-up Convex task — do NOT proceed with stubbed data).

## Critical Constraints

**MUST:**
- Add `var weatherConditions: [WeatherCondition]?` to `PlanningScreenLiveState` (nil when no data)
- Define a minimal `WeatherCondition` value type with `icon: SystemImageName` and `label: String` (use SF Symbols — e.g., `sun.max` / `wind` / `cloud.rain`)
- Render weather icons in the top-overlay region of `PlanningScreen+LiveContent.swift` ONLY when phase is `.enriching` AND `weatherConditions` is non-empty
- Use the dim-sketch backdrop per spec (the existing sketch polyline becomes lower opacity when weather overlay is visible)
- If backend does not currently expose weather conditions on the route plan snapshot, STOP and file a Convex follow-up task; do NOT stub data

**NEVER:**
- Hardcode weather icons (must come from real backend data)
- Render weather during phases other than `.enriching`
- Block on weather data — if absent, phase progression must continue without it (degrade gracefully to no overlay)

**STRICTLY:**
- Reduced-motion preference must collapse any weather icon animation to static
- Dark-mode tokens must render correctly (use `var(--content-secondary)` or equivalent)
- Capture a XCUITest screenshot for the spec reference

## Specification

**Objective:** Make the planning state's S03 Weather variant render real condition icons during the `.enriching` phase per spec.

**Success State:** Live planning run on Simulator that reaches `.enriching` with `weatherConditions = [clear, wind]` shows two SF Symbol icons floating above a dimmed sketch overlay. Capture matches `.spec/design/system/views/mapapp/planning/weather/weather.light.png` within the design-review tolerance.

## Acceptance Criteria

### AC-1 — `weatherConditions` field on `PlanningScreenLiveState`
**GIVEN** `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift`
**WHEN** read
**THEN** the struct declares `var weatherConditions: [WeatherCondition]?`
**Verify:** `grep -n "weatherConditions" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift`

### AC-2 — Weather data wired from route plan snapshot
**GIVEN** a `PlanningViewModel` and a mock route plan snapshot containing weather conditions (verify shape in `LaneShadowRoutePlanSnapshot`)
**WHEN** `handleRoutePlanSnapshot` runs
**THEN** `screenState.weatherConditions` is populated with the parsed condition values
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_weatherConditions_parsedFromSnapshot`

### AC-3 — Weather overlay renders only during `.enriching`
**GIVEN** a live planning view with `weatherConditions = [clear, wind]`
**WHEN** the active phase is `.enriching`
**THEN** the weather overlay is visible with two SF Symbol icons
**AND WHEN** the active phase is `.drafting` or `.finalizing`
**THEN** the overlay is NOT visible
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_weatherOverlay_visibilityByPhase`

### AC-4 — Sketch dims when weather overlay is visible
**GIVEN** a live planning view with weather overlay visible
**WHEN** the composition is rendered
**THEN** the sketch polyline opacity is reduced per spec (test against a known dimmed value, e.g., 0.38)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_sketchDims_whenWeatherVisible`

### AC-5 — S03 XCUITest capture matches spec
**GIVEN** a Simulator build with this fix and FIX-S08-CVX-T01 + FIX-S08-IOS-T01
**WHEN** an XCUITest invokes the S03 variant (via sandbox or real flow)
**THEN** the capture matches the `weather.light.png` reference within design-review tolerance
**Verify:** `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_S03_weather`

### AC-6 — Backend weather data exposure verified or blocked
**GIVEN** an inspection of `LaneShadowRoutePlanSnapshot` and the Convex schema for `routePlans` table
**WHEN** the inspector confirms whether weather conditions are exposed
**THEN** EITHER the field is present and AC-2 passes — OR a follow-up Convex task is filed and this iOS task is blocked
**Verify:** `grep -n "weather" server/convex/schema.ts` AND `grep -n "weather" ios/LaneShadow/Models/`; document outcome in `.tmp/IMPL-S08-IOS-T01/ac-6-data-exposure.md`

## Test Criteria

| ID | Statement | Maps to AC | Type |
|---|---|---|---|
| TC-1 | `weatherConditions` field declared | AC-1 | edge |
| TC-2 | Snapshot parsing populates `weatherConditions` | AC-2 | happy_path |
| TC-3 | Overlay visible only during `.enriching` | AC-3 | edge |
| TC-4 | Sketch dims when overlay visible | AC-4 | edge |
| TC-5 | S03 capture matches spec | AC-5 | happy_path |
| TC-6 | Backend data exposure confirmed or blocked | AC-6 | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `.spec/design/system/views/mapapp/planning/weather/README.md` | all | S03 spec |
| `.spec/design/system/views/mapapp/planning/weather/weather.annotations.json` | all | Token contracts |
| `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` | all | Add field |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | 220-250 | `handleRoutePlanSnapshot` |
| `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` | all | Live composition |
| `ios/LaneShadow/Views/Templates/PlanningScreen+SketchingPolyline.swift` | all | Sketch dim parameter |
| `server/convex/actions/agent/tools/getRouteWeather.ts` | all | Real weather data shape |
| `ios/LaneShadow/Models/` | discover route plan snapshot type | Confirm weather field |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` (MODIFY)
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY)
- `ios/LaneShadow/Views/Templates/PlanningScreen+LiveContent.swift` (MODIFY)
- `ios/LaneShadow/Views/Templates/PlanningScreen+SketchingPolyline.swift` (MODIFY only for dim parameter)
- `ios/LaneShadow/Views/Atoms/LSWeatherIcon.swift` (NEW — minimal SF Symbol wrapper)
- Tests under `ios/LaneShadowTests/` and `ios/LaneShadowUITests/`

**Write-Prohibited:**
- `server/**`, `android/**`, `react-native/**`
- `ios/LaneShadow/Generated/`

## Design

**References:**
- `.spec/design/system/views/mapapp/planning/weather/README.md`
- `.spec/design/system/views/mapapp/planning/README.md` (S03 row)

**Pattern:** Phase-gated overlay slot in `liveContent` (consistent with how cancel-confirm overlay is conditionally rendered)

**Anti-Pattern:** Hardcoded icon list; overlay rendering during wrong phases

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `grep -n "weatherConditions" ios/LaneShadow/Features/Planning/PlanningScreenLiveState.swift` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning/PlanningViewModelTests/test_weatherConditions_parsedFromSnapshot` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_weatherOverlay_visibilityByPhase` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/PlanningScreenCompositionTests/test_sketchDims_whenWeatherVisible` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowUITests/DesignReview/DesignReviewCaptureTests/test_planningScreen_S03_weather` |
| AC-6 | doc `.tmp/IMPL-S08-IOS-T01/ac-6-data-exposure.md` |
| regression | `xcodebuild test -only-testing:LaneShadowTests/Features/Planning` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** New SwiftUI overlay atom + composition wiring + XCUITest capture.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md`
- `RULES.md` (§Cross-Platform Component Parity — story id naming for `planning.weather.s03`)

## Dependencies

**Depends on:** FIX-S08-CVX-T01, FIX-S08-IOS-T01 (phase progression must be reliable to gate visibility)
**Blocks:** —

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "weatherConditions field declared", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Snapshot parsing populates weatherConditions", "verify": "xcodebuild test ... test_weatherConditions_parsedFromSnapshot", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Overlay visible only during .enriching", "verify": "xcodebuild test ... test_weatherOverlay_visibilityByPhase", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Sketch dims when overlay visible", "verify": "xcodebuild test ... test_sketchDims_whenWeatherVisible", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "S03 capture matches spec", "verify": "xcodebuild test ... test_planningScreen_S03_weather", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "Backend data exposure verified or blocked", "verify": "doc .tmp/IMPL-S08-IOS-T01/ac-6-data-exposure.md", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": null },
    { "id": "TC-1", "type": "test_criterion", "description": "Field exists", "verify": "grep", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-1" },
    { "id": "TC-2", "type": "test_criterion", "description": "Snapshot parsing test", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-2" },
    { "id": "TC-3", "type": "test_criterion", "description": "Overlay visibility by phase", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-3" },
    { "id": "TC-4", "type": "test_criterion", "description": "Sketch dim test", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-4" },
    { "id": "TC-5", "type": "test_criterion", "description": "S03 capture vs reference", "verify": "xcodebuild test", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-5" },
    { "id": "TC-6", "type": "test_criterion", "description": "Backend exposure doc", "verify": "doc", "satisfied": false, "evidence": null, "remediation": null, "last_evaluated_cycle": null, "last_evaluated_commit": null, "maps_to_ac": "AC-6" }
  ]
}
-->
