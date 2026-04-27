# UC-SCR-04-ios: `RouteDetailsScreen` — single polyline + `LSRouteSheet` — iOS SwiftUI

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** swift-implementer
**Estimate:** 150 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SCR-04

---

## Background

Render `RouteDetailsScreen` with single best-variant polyline + pre-presented `LSRouteSheet` (best badge, instrument readout, 6-hour weather timeline, save/ride action row), sourced from `RouteDetailsMockProvider`. Sheet pre-presented at `.large` detent; drag-down dismiss; mixed-weather story variant required.

## Critical Constraints

**MUST:**
- Present `LSRouteSheet` via `bottomSheet` slot at `.large` detent on initial render.
- Source weather cell tints from per-condition tokens (no literal tint values).
- Register via `Story` API at `tier: .template` into `TemplateStories.all`.
- Include at least one mixed-weather story variant (clear / rain / wind).

**NEVER:**
- Fetch route or weather data.
- Mutate `LSRouteSheet` internals.

**STRICTLY:**
- Story ids `templates.routeDetails.default` (clear weather) and `templates.routeDetails.mixedWeather`.
- Camera fit via `cameraFit: .polyline(padding: .spacing4)`.

## Specification

**Objective:** Render `RouteDetailsScreen` with single best-variant polyline + pre-presented `LSRouteSheet` (best badge, instrument readout, 6-hour weather timeline, save/ride action row), sourced from `RouteDetailsMockProvider`.

**Success State:** Reviewer opens `templates.routeDetails.default` and `templates.routeDetails.mixedWeather`: sees top bar, single polyline framed with `spacing.4` padding, sheet at `.large` detent showing badge + "The Skyline Spine" title + via subtitle + 4-column instrument readout + 6-hour timeline + sticky Save/Ride row. Save/Ride/dismiss callbacks fire. All gates green.

## Acceptance Criteria

### AC-1 — RouteDetails composition renders
- **GIVEN** sandbox on iPhone 16
- **WHEN** reviewer opens `templates.routeDetails.default`
- **THEN** screen shows top bar, map with single best-variant polyline centered with `spacing.4` padding, pre-presented `LSRouteSheet` at `.large` detent showing `LSBestBadge`, opinion-serif title "The Skyline Spine", via subtitle, 4-column instrument readout (DIST/TIME/CLIMB/SCENIC), 6-hour weather timeline header + cells, sticky action row with outline `Save` + primary `Ride this`
- **Verify:** snapshot + manual
- **TDD State:** RED

### AC-2 — Save/Ride callbacks
- **GIVEN** the sheet is presented
- **WHEN** reviewer taps `Save` then `Ride this`
- **THEN** `onSave` fires once, then `onRide` fires once (sandbox stub logs each)
- **Verify:** ViewInspector tap test asserting both counters == 1
- **TDD State:** RED

### AC-3 — Detent drag + dismiss
- **GIVEN** the sheet is at `.large`
- **WHEN** reviewer drags it down past dismiss threshold
- **THEN** detent transitions through `.medium` then `onDismiss` fires; sandbox stub re-presents the sheet
- **Verify:** ViewInspector gesture test + callback assertion
- **TDD State:** RED

### AC-4 — Weather variants exist
- **GIVEN** the story registry
- **WHEN** queried for routeDetails variants
- **THEN** at least one variant uses mixed weather (clear / rain / wind cells), each cell tinted from per-condition tokens (not literal colors)
- **Verify:** story enumeration test + grep for token usage
- **TDD State:** RED

### AC-5 — Light/dark token re-resolution
- **GIVEN** the story is rendered
- **WHEN** reviewer toggles dark mode
- **THEN** map, sheet chrome, badge, instrument grid, weather cells, and action buttons all re-render via dark-scheme tokens
- **Verify:** snapshot pair
- **TDD State:** RED

### AC-6 — No data fetching in template
- **GIVEN** the `RouteDetailsScreen` source
- **WHEN** scanned
- **THEN** no Convex/URLSession/.task — all data via `RouteDetailsMockProvider`
- **Verify:** static grep test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | Default snapshot matches baseline | AC-1 | snapshot | snapshot |
| TC-2 | onSave count==1 and onRide count==1 after taps | AC-2 | ViewInspector | behavioral |
| TC-3 | Drag past threshold fires onDismiss exactly once | AC-3 | ViewInspector gesture | behavioral |
| TC-4 | Story enumeration finds `templates.routeDetails.mixedWeather` variant; cells reference per-condition tokens | AC-4 | registry test + grep | static |
| TC-5 | Dark snapshot matches baseline | AC-5 | snapshot | snapshot |
| TC-6 | Static grep finds no fetch symbols | AC-6 | static | static |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-04-route-details.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `102-122` — UC-SCR-04 composition + AC list
- `ios/LaneShadow/Views/Organisms/LSRouteSheet.swift` lines `all` — Sheet detents + action row + onSave/onRide/onDismiss
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` lines `all` — bottomSheet slot + cameraFit.polyline
- `ios/LaneShadow/Views/Atoms/LSBestBadge.swift` lines `all` — Badge usage inside sheet
- `tokens/platforms/swift/Sources/LaneShadowTheme/` lines `all` — Per-weather-condition color tokens + spacing.4

## Guardrails

**WRITE-ALLOWED:**
- `ios/LaneShadow/Sandbox/Stories/Templates/RouteDetailsScreenStory.swift` (NEW)
- `ios/LaneShadow/Views/Templates/RouteDetailsScreen.swift` (NEW)
- `ios/LaneShadow/Sandbox/MockProviders/RouteDetailsMockProvider.swift` (NEW)
- `ios/LaneShadow/Sandbox/Stories/Templates/TemplateStories.swift` (MODIFY — append)
- `ios/LaneShadowTests/Templates/RouteDetailsScreenTests.swift` (NEW)

**WRITE-PROHIBITED:**
- `android/**` — paired Android task
- `tokens/platforms/swift/**` — read only
- `react-native/**`
- `ios/LaneShadow/Views/Organisms/**` — Sprint 5 frozen

## Code Pattern

**Reference:**
```swift
Story(id: "templates.routeDetails.default", tier: .template, component: "RouteDetailsScreen",
      name: "Default — Skyline", summary: "...") { _ in
    RouteDetailsScreen(provider: RouteDetailsMockProvider.skylineSpine)
}
```

**Source:** `ios/LaneShadow/Sandbox/Stories/Organisms/LSNavigatorMessageStory.swift:1-60`

**Anti-Pattern:** Do NOT use literal hex tints for weather cells; do NOT skip the mixedWeather variant; do NOT call backend; do NOT modify LSRouteSheet.

## Design

**References:**
- `concepts/uc-scr-04-route-details.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-04`

**Interaction Notes:**
- Sheet pre-presented at `.large` detent on appear via SwiftUI `.presentationDetents([.medium, .large])` and selection binding initialized to `.large`.
- Action row sticky-pinned to sheet bottom inside `LSRouteSheet`.
- Drag past dismiss threshold triggers `onDismiss`; sandbox stub re-presents on next tick to keep sheet visible for repeated review.
- Story variants: `default` (clear weather), `mixedWeather` (rain + wind cells).

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `swiftlint --quiet --strict` | exit 0 |
| build | `xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build` | BUILD SUCCEEDED |
| test | `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Templates/RouteDetailsScreenTests` | all tests pass |
| tokens | `pnpm tokens:validate` | exit 0 |

## Agent Assignment

**Agent:** swift-implementer

**Rationale:** Bottom-sheet detent management + single-polyline map + weather timeline composition; swift-implementer owns SwiftUI sheet detents and LSRouteSheet integration.

## Coding Standards

- `brain/docs/swift-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-ios, UC-SBX-03-ios, UC-ORG-04-ios

**Blocks:** UC-SBX-06-ios

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-6
2. **GREEN** — Implement minimum SwiftUI to pass each AC
3. **REFACTOR** — Clean without breaking tests
4. **VERIFY** — Run all gates; commit only when green

---


## Error States (V3 Deferred)

These error states are documented for V3 planning. They are NOT implemented in Sprint 6.

- **Map init failure:** Show `LSInlineErrorCallout` with warn-stripe + recovery message. Map surface falls back to static placeholder. See UC-SCR-06 for canonical error UI pattern.
- **Malformed fixture data:** Sandbox: display empty state with console warning. In production (V3), validate fixture schema and surface descriptive error to user.
- **Animation failure:** Graceful degradation to static render. If motion recipe fails to initialize, render the final frame without animation. No error surface needed.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"RouteDetails renders all slots","verify":"snapshot"},
{"id":"AC-2","type":"acceptance_criterion","description":"Save/Ride callbacks fire","verify":"unit"},
{"id":"AC-3","type":"acceptance_criterion","description":"Detent drag + dismiss","verify":"unit"},
{"id":"AC-4","type":"acceptance_criterion","description":"Mixed-weather variant + token tints","verify":"registry + grep"},
{"id":"AC-5","type":"acceptance_criterion","description":"Dark re-resolve","verify":"snapshot pair"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data fetching","verify":"grep"},
{"id":"TC-1","type":"test_criterion","description":"Light snapshot","verify":"snapshot","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Action callbacks","verify":"unit","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Dismiss gesture","verify":"unit","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Mixed-weather variant present","verify":"static","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Dark snapshot","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"No fetch symbols","verify":"static","maps_to_ac":"AC-6"}
]}
-->
