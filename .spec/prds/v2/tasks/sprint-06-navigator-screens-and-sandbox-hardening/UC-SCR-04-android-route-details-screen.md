# UC-SCR-04-android: `RouteDetailsScreen` — single polyline + `LSRouteSheet` — Android Compose

**Sprint:** [Sprint 6: Navigator Screens & Sandbox Hardening](SPRINT.md)
**Agent:** kotlin-implementer
**Estimate:** 150 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** L
**PRD Refs:** UC-SCR-04

---

## Background

Render RouteDetailsScreen on Android with single best polyline, pre-presented LSRouteSheet at large detent showing best badge, opinion-serif title + via subtitle, 4-column instrument readout, 6-hour weather timeline, and sticky Save / Ride this row.

## Critical Constraints

**MUST:**
- Drive all metrics, weather tints, and badge styling from LaneShadowTheme tokens — NEVER hardcoded.
- Register `templates.routeDetails.default` at `tier: ComponentTier.template` (+ mixed-weather variant).
- STRICTLY no Convex — `RouteDetailsMockProvider` only.
- Use `cameraFit: .polyline` with `spacing.4` padding.

**NEVER:**
- Edit iOS or token sources.
- Hardcode weather hex tints or sheet detent values.

**STRICTLY:**
- Sheet pre-presented at large detent on appear; mixed-weather variant required.

## Specification

**Objective:** Render RouteDetailsScreen on Android with single best polyline, pre-presented LSRouteSheet at large detent showing best badge, opinion-serif title + via subtitle, 4-column instrument readout, 6-hour weather timeline, and sticky Save / Ride this row.

**Success State:** Story renders sheet at large detent with all metrics; drag-down dismiss fires; mixed-weather variant exists; tests pass.

## Acceptance Criteria

### AC-1 — RouteDetails composition renders
- **GIVEN** Sandbox `templates.routeDetails.default` selected
- **WHEN** Story mounts
- **THEN** Top bar visible, map shows single best polyline with `spacing.4` padding fit, pre-presented `LSRouteSheet` at `.large` detent shows `LSBestBadge`, opinion-serif title 'The Skyline Spine', via subtitle, 4-column readout (DIST/TIME/CLIMB/SCENIC), 6-hour weather timeline header + cells, sticky outline `Save` + primary `Ride this`
- **Verify:** Compose UI test asserts hierarchy + textual content
- **TDD State:** RED

### AC-2 — Save/Ride callbacks
- **GIVEN** Sheet rendered
- **WHEN** Developer taps Save then Ride this
- **THEN** Respective callbacks fire (sandbox stub logs)
- **Verify:** UI test with fake handlers
- **TDD State:** RED

### AC-3 — Detent + dismiss
- **GIVEN** Sheet at large detent
- **WHEN** Developer drags down past dismiss threshold
- **THEN** Detent transitions; past threshold `onDismiss` fires (sandbox stub re-presents)
- **Verify:** UI test with drag gesture
- **TDD State:** RED

### AC-4 — Weather timeline tints + mixed variant
- **GIVEN** Story has at least one mixed-weather variant (clear/rain/wind)
- **WHEN** Variant rendered
- **THEN** Cells show per-condition tint backgrounds from theme tokens
- **Verify:** UI test asserts tint tokens per cell
- **TDD State:** RED

### AC-5 — Light/dark re-resolves tokens
- **GIVEN** Sheet rendered
- **WHEN** Theme toggled
- **THEN** All elements re-resolve correctly
- **Verify:** Snapshot test light + dark
- **TDD State:** RED

### AC-6 — No data-fetching logic
- **GIVEN** Source
- **WHEN** Inspected
- **THEN** No Convex/network — data via `RouteDetailsMockProvider`
- **Verify:** Static unit test
- **TDD State:** RED

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|----|-----------|------------|--------|------|
| TC-1 | UI test asserts sheet contents + sticky action row | AC-1 | connectedDebugAndroidTest | ui |
| TC-2 | UI test asserts Save and Ride this callbacks | AC-2 | connectedDebugAndroidTest | ui |
| TC-3 | UI test asserts drag-down detent + dismiss | AC-3 | connectedDebugAndroidTest | ui |
| TC-4 | UI test asserts mixed-weather variant tints | AC-4 | connectedDebugAndroidTest | ui |
| TC-5 | Snapshot test light + dark | AC-5 | testDebugUnitTest | snapshot |
| TC-6 | Import allow-list test | AC-6 | testDebugUnitTest | unit |

## Reading List

- `.spec/prds/v2/concepts/uc-scr-04-route-details.html` lines `all` — REQUIRED READING — visual design source for this task
- `.spec/prds/v2/08-uc-scr.md` lines `102-122` — UC-SCR-04 spec + ACs
- `.spec/prds/v2/11-technical-requirements.md` lines `all` — RouteDetails + WeatherTimelineEntry schemas
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSRouteSheet.kt` lines `all` — Sheet API + detents
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt` lines `all` — Badge usage
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` lines `all` — Bottom sheet slot

## Guardrails

**WRITE-ALLOWED:**
- `android/app/src/debug/java/com/laneshadow/sandbox/templates/RouteDetailsScreenStory.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt` (NEW)
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteDetailsMockProvider.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/templates/RouteDetailsScreenTest.kt` (NEW)

**WRITE-PROHIBITED:**
- `ios/**` — iOS task is paired
- `tokens/platforms/kotlin/**` — read only
- `react-native/**`

## Code Pattern

**Reference:** Slot-based template with persistent bottom sheet.

**Source:** UC-ORG-02 LSMapLayer + LSRouteSheet organism

**Anti-Pattern:** Hardcoded weather hex tints or sheet detent values.

## Design

**References:**
- `concepts/uc-scr-04-route-details.html`
- `concepts/designs.html`
- `.spec/prds/v2/08-uc-scr.md#UC-SCR-04`

**Interaction Notes:**
- Sheet pre-presented at large detent; drag-down dismiss; mixed-weather story variant required.

## Verification Gates

| Gate | Command | Expected |
|------|---------|----------|
| lint | `cd android && ./gradlew detekt` | BUILD SUCCESSFUL, zero violations |
| build | `cd android && ./gradlew :app:compileDebugKotlin` | BUILD SUCCESSFUL |
| unit-test | `cd android && ./gradlew :app:testDebugUnitTest` | All tests pass |
| compose-ui-test | `cd android && ./gradlew :app:connectedDebugAndroidTest` | All instrumented tests pass |
| tokens | `pnpm tokens:validate` | Tokens validate clean |

## Agent Assignment

**Agent:** kotlin-implementer

**Rationale:** Compose template combining single best-variant polyline with LSRouteSheet bottom sheet (best badge, instrument readout, weather timeline, action row).

## Coding Standards

- `brain/docs/kotlin-rules.md`
- `RULES.md §6 ComponentTier`
- `styles/RULES.md`

## Dependencies

**Depends On:** UC-SBX-01-android, UC-SBX-03-android

**Blocks:** UC-SBX-06-android

## TDD Workflow

1. **RED** — Write failing tests for AC-1..AC-6
2. **GREEN** — Implement Compose code
3. **REFACTOR** — Clean
4. **VERIFY** — Run all gates; commit when green

---


## Error States (V3 Deferred)

These error states are documented for V3 planning. They are NOT implemented in Sprint 6.

- **Map init failure:** Show `LSInlineErrorCallout` with warn-stripe + recovery message. Map surface falls back to static placeholder. See UC-SCR-06 for canonical error UI pattern.
- **Malformed fixture data:** Sandbox: display empty state with console warning. In production (V3), validate fixture schema and surface descriptive error to user.
- **Animation failure:** Graceful degradation to static render. If motion recipe fails to initialize, render the final frame without animation. No error surface needed.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"RouteDetails composition renders","verify":"ui"},
{"id":"AC-2","type":"acceptance_criterion","description":"Save/Ride callbacks","verify":"ui"},
{"id":"AC-3","type":"acceptance_criterion","description":"Detent + dismiss","verify":"ui"},
{"id":"AC-4","type":"acceptance_criterion","description":"Weather timeline tints + mixed variant","verify":"ui"},
{"id":"AC-5","type":"acceptance_criterion","description":"Light/dark re-resolves","verify":"snapshot"},
{"id":"AC-6","type":"acceptance_criterion","description":"No data fetching","verify":"unit"},
{"id":"TC-1","type":"test_criterion","description":"Sheet contents + action row","verify":"ui","maps_to_ac":"AC-1"},
{"id":"TC-2","type":"test_criterion","description":"Save/Ride callbacks","verify":"ui","maps_to_ac":"AC-2"},
{"id":"TC-3","type":"test_criterion","description":"Drag dismiss","verify":"ui","maps_to_ac":"AC-3"},
{"id":"TC-4","type":"test_criterion","description":"Mixed-weather tints","verify":"ui","maps_to_ac":"AC-4"},
{"id":"TC-5","type":"test_criterion","description":"Snapshot light+dark","verify":"snapshot","maps_to_ac":"AC-5"},
{"id":"TC-6","type":"test_criterion","description":"Import allow-list","verify":"unit","maps_to_ac":"AC-6"}
]}
-->
