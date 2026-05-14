# RR-S09-AND-T03 — Android three-polyline rendering + alt-selection promotion parity

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z

> **Task ID:** RR-S09-AND-T03
> **Sprint:** [Sprint 09 — Map View · Route Results State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03, UC-FID-01, Sprint 09

## Background

Android parity for RR-S09-IOS-T03. Render three real polylines on `LSMapHost`'s Mapbox layer-source surface from `state.polylines` (RR-S09-AND-T01). Implement alt-selection promotion as a stroke-style swap on tap. Render start/end dot annotations. Honor accessibility reduced-motion preference (system animation scale == 0 collapses tween to instantaneous swap). Mirror iOS T03 behavior.

## Critical Constraints

**MUST:**
- MUST configure `LSMapHost` Mapbox layer-source pairs sourced from `state.polylines[*]` with unique layer IDs derived from option ID
- MUST resolve stroke-width, dash array, and color per variant: best = solid 3.5dp copper; alt1 = dashed (`6,4`) 2.5dp sage; alt2 = dashed (`3,4`) 2.5dp slate — colors via `LaneShadowTheme.colors.route.*`
- MUST render start (filled 14dp) + end (outer 18dp + inner 6dp) dot annotations at first/last coordinates of each polyline; color matches polyline variant
- MUST wire alt-card tap (via the composition from RR-S09-AND-T02) to `viewModel.selectAlt(id)`
- MUST update the SELECTED polyline's stroke style: selected → solid-bold (best width 3.5dp; alts get 2.5dp solid-bold when selected); UNSELECTED polylines render with their default dashed style (alts) or ghosted copper outline (best, when an alt is selected) per S02 variant
- MUST re-tint selected card stripe + LSNavigatorMessage compass chip color to match the selected variant token
- MUST honor `AccessibilityManager.isReduceTransitionsEnabled` (or system animation scale = 0): collapse the stroke-width tween to instantaneous swap
- MUST add tests covering: 3 polylines render with correct strokes; alt-tap promotes alt and demotes prior selection; card stripe + compass chip re-tint on selection; reduced-motion path is instantaneous; two-candidate edge case renders 2 polylines

**NEVER:**
- NEVER hardcode color hex; use theme tokens
- NEVER re-create `LSMapHost` on selection change; selection is a layer-style swap
- NEVER persist `selectedRouteId` to Convex
- NEVER block the main thread; polyline decoding belongs in the view-model / repository layer

**STRICTLY:**
- STRICTLY follow `RULES.md` §"Real Map Surfaces" — polylines render on the real `LSMapHost` (Mapbox), never on a static fallback
- STRICTLY pass `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`
- STRICTLY observe accessibility-changed events to update animation behavior dynamically

## Specification

**Objective:** Render three real polylines on `LSMapHost` from `state.polylines` with per-variant tokens; render start/end dot annotations; implement alt-selection promotion as a stroke-style swap with reduced-motion fallback; re-tint card stripe + compass chip with selection.

**Success State:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest` exits 0; the `templates.route-results-screen.alt1-tapped-sage-promoted-light` story renders alt1 solid-bold sage with best ghosted dashed copper; `./gradlew :app:compileDebugKotlin && :app:detekt` exit 0.

## Acceptance Criteria

### AC-1 — Three polylines render with correct strokes

**GIVEN** `state.polylines.size == 3` with best/alt1/alt2 entries
**WHEN** the screen renders
**THEN** `LSMapHost` has 3 polyline layer-source pairs; best stroke = `LaneShadowTheme.colors.route.best` solid 3.5dp; alt1 = `route.alt1` dashed (`6,4`) 2.5dp; alt2 = `route.alt2` dashed (`3,4`) 2.5dp
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.threePolylinesRenderWithCorrectStrokes`

### AC-2 — Start + end dot annotations render at endpoints

**GIVEN** each polyline has a non-empty coordinates list
**WHEN** the polyline layer is added
**THEN** start dot (filled 14dp) + end dot (outer 18dp + inner 6dp) annotations render at coordinates.first / coordinates.last per polyline, colored to match the variant
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.startEndDots_renderAtEndpoints`

### AC-3 — Alt-tap promotes alt polyline and demotes prior selection

**GIVEN** `state.selectedRouteId == "best-id"`; alt1 polyline is dashed sage
**WHEN** the user taps the alt1 card
**THEN** alt1 polyline becomes solid-bold sage; best polyline demotes to dashed or ghosted; `state.selectedRouteId == "alt1-id"`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.altTap_promotesAltDemotesBest`

### AC-4 — Card stripe + compass chip re-tint on selection

**GIVEN** initial `state.selectedRouteId == "best-id"`; selected stripe + chip copper
**WHEN** `selectAlt("alt1-id")` fires
**THEN** alt1 card stripe re-tints to sage; LSNavigatorMessage compass chip re-tints to sage; previously-selected best stripe returns to default
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.cardStripeAndCompassChip_reTintOnSelection`

### AC-5 — Reduced-motion: swap is instantaneous

**GIVEN** system animation scale is 0 (reduce-motion enabled)
**WHEN** alt-tap fires
**THEN** stroke-width swap completes in zero duration (no animation block); test asserts via a stub animation runner or Compose `LocalDensity.animationScale`
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.reducedMotion_swapIsInstantaneous`

### AC-6 — Two-candidate variant renders 2 polylines

**GIVEN** `state.polylines.size == 2`
**WHEN** the screen renders
**THEN** exactly 2 polyline layer-source pairs + 2 dot pairs render; no third polyline / dot pair
**Verify:** `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.twoCandidates_rendersTwoPolylines`

### AC-7 — Detekt + compile clean

**GIVEN** modified Kotlin files
**WHEN** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` run
**THEN** both exit 0
**Verify:** `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Three polylines with correct strokes | AC-1 | `./gradlew :app:testDebugUnitTest --tests ...threePolylinesRenderWithCorrectStrokes` | happy_path |
| TC-2 | Start + end dots at endpoints | AC-2 | `./gradlew :app:testDebugUnitTest --tests ...startEndDots_renderAtEndpoints` | happy_path |
| TC-3 | Alt-tap promotes alt + demotes best | AC-3 | `./gradlew :app:testDebugUnitTest --tests ...altTap_promotesAltDemotesBest` | happy_path |
| TC-4 | Card stripe + compass chip re-tint | AC-4 | `./gradlew :app:testDebugUnitTest --tests ...cardStripeAndCompassChip_reTintOnSelection` | happy_path |
| TC-5 | Reduced-motion instantaneous swap | AC-5 | `./gradlew :app:testDebugUnitTest --tests ...reducedMotion_swapIsInstantaneous` | edge |
| TC-6 | Two-candidate variant 2 polylines | AC-6 | `./gradlew :app:testDebugUnitTest --tests ...twoCandidates_rendersTwoPolylines` | edge |
| TC-7 | Detekt + compile clean | AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/components/organisms/LSMapHost.kt` | all | [PRIMARY PATTERN] Mapbox layer-source configuration API |
| `android/app/src/main/java/com/laneshadow/data/PolylineDecoder.kt` (or equivalent) | all | Polyline decoder (read-only) |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T03-android-sketch-polyline-overlay.md` | all | Sprint 08 sibling — polyline overlay architecture |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | polyline section | Strokes, dash arrays, dot dimensions, S02 ghosted-best |
| `.spec/design/system/views/route-results-screen/README.md` | view-local constants | Stroke widths + token map |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsPolylineLayer.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsScreen.kt` (MODIFY — wire polyline layer + card-tap → `viewModel.selectAlt(id)`)
- `android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsPolylineTest.kt` (NEW)

**Write-Prohibited:**
- `LSMapHost.kt` — Sprint 06 organism
- `RouteResultsViewModel.kt` — RR-S09-AND-T01 ownership
- `PolylineDecoder.kt` — existing
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html`
- `.spec/design/system/views/route-results-screen/README.md`
- `.spec/design/system/refs/route-results-screen/alt1-tapped--sage-promoted.light.png` (S02 visual)
- Sprint 08 PLAN-S08-AND-T03

**Interaction Notes:** Card-tap is the only user interaction. Polyline rendering reacts to `state.selectedRouteId` changes via Compose recomposition. Compass chip + card stripe re-tint is a function of selection.

**Pattern:** Sprint 08 `MapSketchAnimationLayer.kt` (PLAN-S08-AND-T03). Mirror the architecture; swap content.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-AND-T03-android-sketch-polyline-overlay.md`

**Anti-Pattern:** Re-rendering `LSMapHost` on selection change; rendering polylines from `RouteResultsScreen.kt` body directly (use a separate layer file); tweening the whole path; hardcoding stroke widths outside the documented view-local constants.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.threePolylinesRenderWithCorrectStrokes` |
| AC-2 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.startEndDots_renderAtEndpoints` |
| AC-3 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.altTap_promotesAltDemotesBest` |
| AC-4 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.cardStripeAndCompassChip_reTintOnSelection` |
| AC-5 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.reducedMotion_swapIsInstantaneous` |
| AC-6 | `./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.twoCandidates_rendersTwoPolylines` |
| AC-7 | `./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** Kotlin polyline layer + Compose interaction wiring. Matches kotlin-implementer mandate. Reviewer: `kotlin-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` §"Real Map Surfaces", §"Accessibility Standards Android"

## Dependencies

**Depends on:**
- RR-S09-AND-T01 (`state.polylines`, `selectedRouteId`, `selectAlt`)
- RR-S09-AND-T02 (composition wires the polyline layer + card-tap callback)

**Blocks:**
- RR-S09-AND-T05 (capture tests need polylines rendering)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Three polylines with best/alt1/alt2 tokens + per-variant strokes","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.threePolylinesRenderWithCorrectStrokes","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Start + end dot annotations at endpoints with correct dimensions","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.startEndDots_renderAtEndpoints","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Alt-tap promotes alt to solid-bold; demotes best to dashed/ghosted","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.altTap_promotesAltDemotesBest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Card stripe + compass chip re-tint to selected variant","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.cardStripeAndCompassChip_reTintOnSelection","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Reduced-motion: swap is instantaneous (no animation block)","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.reducedMotion_swapIsInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"V01: 2 polylines + 2 dot pairs only","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.twoCandidates_rendersTwoPolylines","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Detekt + compile clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Three polylines correct strokes","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.threePolylinesRenderWithCorrectStrokes","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Start + end dots at endpoints","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.startEndDots_renderAtEndpoints","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Alt-tap promotion","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.altTap_promotesAltDemotesBest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Card stripe + compass chip re-tint","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.cardStripeAndCompassChip_reTintOnSelection","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Reduced-motion instantaneous","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.reducedMotion_swapIsInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Two-candidate renders 2","verify":"./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.routeresults.RouteResultsPolylineTest.twoCandidates_rendersTwoPolylines","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Detekt + compile clean","verify":"./gradlew :app:detekt && ./gradlew :app:compileDebugKotlin","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"}
  ]
}
-->
