# RR-S09-IOS-T03 — iOS three-polyline rendering + alt-selection promotion (on MapApp)

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-14T20:25:00.000Z (retrofitted for MAPAPP-DOCTRINE 2026-05-14)

> **Task ID:** RR-S09-IOS-T03
> **Sprint:** [Sprint 09 — MapApp · Route Results State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-09-route-results-screen
> **PRD Refs:** UC-CHAT-03 (multi-polyline map), UC-FID-01 (alt-selection promotion), Sprint 09

## Background

**Doctrine:** Per `RULES.md` § Design Rules › One View, Many States, this task renders the three real polylines on the persistent `LSMap` instance owned by `MapApp` when `MapAppState == .routeResults(...)`. Polyline rendering is a STATE-DRIVEN CONFIGURATION of the same `LSMap` atom that was mounted during `.idle` and `.planning`; it is NOT a new map host, not a sibling screen.

Polylines are configured by feeding `mapAppViewModel.polylines` (RR-S09-IOS-T01) into `LSMap`'s polyline source/layer surface via a per-state helper (`RouteResultsPolylineLayer.swift`) consumed by `MapApp.swift`'s `.routeResults` overlay/layer composition. The selected polyline renders solid-bold (stroke-width per design = 3.5px copper for best, 2.5px sage / slate for alts); when an alt card is tapped, the alt polyline promotes from dashed → solid-bold, the previously-selected polyline demotes to dashed, and the card border tint + compass chip tint re-resolve to the new variant's color token. Start dot (filled 14px) + end dot (outer 18px + inner 6px) render at the polyline endpoints per the design-system view-local constants. Honors `UIAccessibility.isReduceMotionEnabled` — when set, the promotion is an instantaneous swap (no stroke-width tween).

## Critical Constraints

**MUST:**
- MUST configure the SAME `LSMap` instance already mounted by `MapApp.swift` with three polyline layer-source pairs sourced from `mapAppViewModel.polylines[*]` when `MapAppState == .routeResults`; each polyline gets a unique layer ID derived from the option ID
- MUST resolve stroke-width and dash-array per polyline variant: best = solid 3.5px; alt1 = dashed (`6,4`) 2.5px; alt2 = dashed (`3,4`) 2.5px; alt2/alt1 stroke-width values are SVG-attribute literals per design-system README view-local constants exemption
- MUST resolve polyline color via `LaneShadowTheme.colors.route.{best,alt1,alt2}` tokens
- MUST render the leading/trailing dot annotations (start 14px filled, end 18px outer + 6px inner) at the first/last coordinates of each polyline using `LSMap.annotations`
- MUST bind alt-card tap (callback exposed by `MapApp.swift`'s composition from RR-S09-IOS-T02) to `mapAppViewModel.selectAlt(_:)` (from RR-S09-IOS-T01)
- MUST update the SELECTED polyline's stroke style: selected ⇒ solid-bold (best-variant stroke-width 3.5px even when an alt is selected; alts get 2.5px bold solid when selected); UNSELECTED polylines render with their default dashed style (alts) or with a "ghosted" copper outline (best, when an alt is selected) per `route-results-screen.html` S02 variant
- MUST re-tint the SELECTED card's leading 3px stripe AND the LSNavigatorMessage compass chip to match the selected variant's color token (the card stripe + chip re-tint is composed inside `MapApp.swift`'s `.routeResults` overlay branch driven by `mapAppViewModel.selectedRouteId`)
- MUST honor `UIAccessibility.isReduceMotionEnabled`: collapse the stroke-width tween to an instantaneous swap when reduced motion is enabled
- MUST add tests in `ios/LaneShadowTests/Templates/MapAppRouteResultsPolylineTests.swift` covering: 3 polylines render with correct strokes; alt-tap promotes the alt and demotes prior selection; card stripe + compass chip re-tint on selection change; reduced-motion path is instantaneous

**NEVER:**
- NEVER hardcode hex color literals or numeric stroke widths outside the documented design-system view-local-constants exemption (SVG dash arrays `6,4` and `3,4`; SVG stroke widths 2.5 and 3.5 are also view-local constants per the README)
- NEVER mount a second `LSMap` instance; the polyline configuration applies to MapApp's existing `LSMap`
- NEVER persist `selectedRouteId` to Convex (it's client-side per RR-S09-CVX-T01)
- NEVER re-create the `LSMap` instance on selection change; selection is a layer-style swap on the existing map
- NEVER animate the stroke-width tween at a duration that exceeds the design-system motion recipe (a clean ≤ 200ms ease curve is acceptable)
- NEVER block the main thread with synchronous polyline decoding; the view-model owns decoding via `Convex/Polyline.swift`
- NEVER place this code under `ios/LaneShadow/Features/RouteResults/` — it lives under `ios/LaneShadow/Features/MapApp/RouteResults/` to colocate with the rest of MapApp's routeResults state code

**STRICTLY:**
- STRICTLY follow `RULES.md` §"Real Map Surfaces" — polylines render on the existing `LSMap` (Mapbox-backed) instance owned by `MapApp`, never on a static SVG fallback
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0
- STRICTLY observe the `UIAccessibility.reduceMotionStatusDidChangeNotification` (or equivalent) to update the animation behavior dynamically if the user toggles reduce-motion mid-session

## Specification

**Objective:** Render three real polylines on MapApp's persistent `LSMap` instance from `mapAppViewModel.polylines` with per-variant tokens when `MapAppState == .routeResults`; render start/end dot annotations; implement alt-selection promotion as a stroke-style swap with reduced-motion fallback. Card stripe + compass chip re-tint with selection (re-tint rendering owned by MapApp's overlay composition from RR-S09-IOS-T02 — this task ensures the polyline-side stroke swap matches the card/chip side).

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests` exits 0; opening the `templates.map-app.route-results-alt1-tapped-sage-promoted-light` story renders the alt1 polyline solid-bold sage with the best polyline ghosted dashed copper; `xcodebuild build` exits 0; `scripts/tokens/enforce-native-compliance.sh` exits 0; `swiftlint lint` clean.

## Acceptance Criteria

### AC-1 — Three polylines render on MapApp's LSMap with correct strokes from mapAppViewModel.polylines

**GIVEN** `MapApp` rendered with `MapAppState == .routeResults(...)` AND `mapAppViewModel.polylines.count == 3` with best/alt1/alt2 entries
**WHEN** the view tree renders
**THEN** the same `LSMap` instance MapApp owns has three polyline layer-source pairs; best stroke is `LaneShadowTheme.colors.route.best` solid 3.5px; alt1 stroke is `route.alt1` dashed (`6,4`) 2.5px; alt2 stroke is `route.alt2` dashed (`3,4`) 2.5px
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_threePolylinesRenderOnMapAppWithCorrectStrokes`

### AC-2 — Start + end dot annotations render at polyline endpoints

**GIVEN** each `mapAppViewModel.polylines[i]` has a non-empty `coordinates` array
**WHEN** the polyline layer is added to MapApp's `LSMap`
**THEN** `LSMap.annotations` contains a start dot (filled 14px) at `coordinates.first` AND an end dot (outer 18px + inner 6px) at `coordinates.last` for each polyline, color-matched to the polyline's variant token
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_startEndDots_renderAtEndpoints`

### AC-3 — Alt-tap promotes alt polyline and demotes prior selection

**GIVEN** `mapAppViewModel.selectedRouteId == "best-id"` (initial state); alt1 polyline is dashed sage
**WHEN** the user taps the alt1 card (callback to `mapAppViewModel.selectAlt("alt1-id")`)
**THEN** alt1 polyline stroke becomes solid-bold sage (3.5px); best polyline demotes to dashed copper (2.5px or "ghosted" per S02 design); `mapAppViewModel.selectedRouteId == "alt1-id"`; no `LSMap` remount
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_altTap_promotesAltDemotesBest`

### AC-4 — Card stripe + compass chip re-tint with selection

**GIVEN** `mapAppViewModel.selectedRouteId == "best-id"`; selected card stripe is copper; compass chip in LSNavigatorMessage is copper
**WHEN** `mapAppViewModel.selectAlt("alt1-id")` fires
**THEN** the alt1 card's leading 3px stripe re-tints to sage (rendered in MapApp's overlay composition); the LSNavigatorMessage compass chip re-tints to sage; the previously-selected best card's stripe returns to its default (un-selected card stripe)
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_cardStripeAndCompassChip_reTintOnSelection`

### AC-5 — Reduced-motion path is instantaneous

**GIVEN** `UIAccessibility.isReduceMotionEnabled == true`
**WHEN** the user taps an alt card and selection changes
**THEN** the stroke-width swap happens in zero animation duration (no tween); the test asserts via a stub `AnimationController` or `withAnimation { ... }` flag that no animation block runs
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_reducedMotion_swapIsInstantaneous`

### AC-6 — Two-candidate variant (V01) renders 2 polylines, 2 dots pairs

**GIVEN** `mapAppViewModel.polylines.count == 2` (best + alt1)
**WHEN** `MapApp` renders with `state == .routeResults`
**THEN** MapApp's `LSMap` has exactly two polyline layer-source pairs; start + end dots render for each; no third polyline / third dot pair is present
**Verify:** `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_twoCandidates_rendersTwoPolylines`

### AC-7 — Token purity

**GIVEN** modified polyline-rendering Swift code
**WHEN** token compliance runs
**THEN** zero hex / RGB / numeric font / hardcoded spacing violations
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -rE 'Color\(red:\|#[0-9A-Fa-f]{6}' ios/LaneShadow/Features/MapApp/RouteResults/ | wc -l` returns 0

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Three polylines with best/alt1/alt2 tokens + strokes render on MapApp's LSMap | AC-1 | `xcodebuild test -only-testing:.../test_threePolylinesRenderOnMapAppWithCorrectStrokes` | happy_path |
| TC-2 | Start (14px filled) + end (18+6px) dots at polyline endpoints | AC-2 | `xcodebuild test -only-testing:.../test_startEndDots_renderAtEndpoints` | happy_path |
| TC-3 | Alt-tap promotes alt to solid-bold, demotes best to dashed/ghosted; no LSMap remount | AC-3 | `xcodebuild test -only-testing:.../test_altTap_promotesAltDemotesBest` | happy_path |
| TC-4 | Card stripe + compass chip re-tint to selected variant token | AC-4 | `xcodebuild test -only-testing:.../test_cardStripeAndCompassChip_reTintOnSelection` | happy_path |
| TC-5 | Reduced-motion path is instantaneous (no animation block) | AC-5 | `xcodebuild test -only-testing:.../test_reducedMotion_swapIsInstantaneous` | edge |
| TC-6 | Two-option plan renders exactly 2 polylines + 2 dot pairs | AC-6 | `xcodebuild test -only-testing:.../test_twoCandidates_rendersTwoPolylines` | edge |
| TC-7 | Token compliance clean | AC-7 | `scripts/tokens/enforce-native-compliance.sh` | edge |
| TC-8 | Build + lint clean | all | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/MapApp/` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Atoms/LSMap.swift` | all | [PRIMARY PATTERN] `polylines:annotations:` API surface; how layer-source pairs are configured (same atom MapApp already mounts) |
| `ios/LaneShadow/Views/Templates/MapApp.swift` | all | Persistent host — understand where polyline configuration plugs in for the `.routeResults` state branch |
| `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` | extended by RR-S09-IOS-T01 | View-model published properties — `polylines`, `selectedRouteId`, `selectAlt(_:)` |
| `ios/LaneShadow/Convex/Polyline.swift` (or equivalent) | all | Polyline decoder (read-only) |
| `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T03-ios-sketch-polyline-overlay.md` | all | Sprint 08 sibling task — polyline overlay layer architecture (different content, same architecture); the sketch polyline layer also targets MapApp's LSMap |
| `.spec/design/system/views/route-results-screen/route-results-screen.html` | polyline section | Stroke widths, dash arrays, start/end dot dimensions; S02 alt-selected variant for ghosted-best treatment |
| `.spec/design/system/views/route-results-screen/README.md` | "View-local constants" + "Token recipe" | Stroke-width literals + token mappings |
| `RULES.md` | "Design Rules › One View, Many States", "Real Map Surfaces" | Doctrine + map-rendering rules |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/Features/MapApp/RouteResults/RouteResultsPolylineLayer.swift` (NEW — wraps `LSMap` polyline configuration logic for the routeResults state; consumed by `MapApp.swift`'s `.routeResults` branch)
- `ios/LaneShadow/Views/Templates/MapApp.swift` (MODIFY — wire the polyline layer into the `.routeResults` branch; bind card-tap callbacks to `mapAppViewModel.selectAlt` via the composition's exposed hooks)
- `ios/LaneShadowTests/Templates/MapAppRouteResultsPolylineTests.swift` (NEW)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 atom
- `ios/LaneShadow/Convex/Polyline.swift` — existing decoder
- `ios/LaneShadow/Features/MapApp/MapAppViewModel.swift` — RR-S09-IOS-T01 ownership in this sprint
- `ios/LaneShadow/Features/MapApp/MapAppState.swift` — MAPAPP-UNIFY ownership
- `ios/LaneShadow/Features/MapApp/RouteResults/RouteResultsOverlays.swift` — RR-S09-IOS-T02 ownership in this sprint
- `ios/LaneShadow/Features/Planning/MapSketchAnimationLayer.swift` — Sprint 08 ownership
- `ios/LaneShadow/Views/Templates/RouteResultsScreen.swift` — pre-doctrine sandbox-only fixture; do NOT touch
- `ios/LaneShadow/Features/RouteResults/` — do NOT create this directory
- `android/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/views/route-results-screen/route-results-screen.html` (polyline strokes, start/end dots, S02 ghosted-best treatment)
- `.spec/design/system/views/route-results-screen/README.md` (token recipe + view-local constants)
- `.spec/design/system/views/route-results-screen/default--best-pre-selected/default--best-pre-selected.light.png` (S01)
- `.spec/design/system/views/route-results-screen/alt1-tapped--sage-promoted/alt1-tapped--sage-promoted.light.png` (S02)
- Sprint 08 PLAN-S08-IOS-T03 (sketch polyline architecture pattern)
- `ios/LaneShadow/Views/Templates/MapApp.swift` + `ios/LaneShadow/Features/MapApp/MapAppState.swift`

**Interaction Notes:** REQUIRED READING: `.spec/design/system/views/route-results-screen/route-results-screen.html`. Card-tap is the only user interaction in this task; the polyline rendering reacts to `mapAppViewModel.selectedRouteId` changes via SwiftUI's reactive observation on the `@Observable` view-model. The compass chip + card stripe re-tint is a function of selection, composed inside MapApp's overlay branch (RR-S09-IOS-T02 ownership), not a separate gesture.

**Pattern:** Sprint 08 `MapSketchAnimationLayer.swift` (PLAN-S08-IOS-T03) — layer architecture: a Swift file owns the Mapbox configuration; the parent view (`MapApp.swift`) passes data + callbacks; reduce-motion handling is gated at the animation block. Mirror the architecture, swap the content (3 real polylines vs 1 looping sketch polyline). Both layers target the SAME `LSMap` instance owned by `MapApp`.

**Pattern Source:** `.spec/prds/v3-integration/tasks/sprint-08-planning-state/PLAN-S08-IOS-T03-ios-sketch-polyline-overlay.md`

**Anti-Pattern:** Re-creating `LSMap` on selection change; mounting a second `LSMap` instance; rendering polylines from `MapApp.body` directly (use a separate layer file under `Features/MapApp/RouteResults/`); tweening the entire polyline path (only stroke-width swaps); persisting selection to Convex; hardcoding stroke widths in places other than the documented view-local constants; placing this code under `Features/RouteResults/` instead of `Features/MapApp/RouteResults/`.

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_threePolylinesRenderOnMapAppWithCorrectStrokes` |
| AC-2 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_startEndDots_renderAtEndpoints` |
| AC-3 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_altTap_promotesAltDemotesBest` |
| AC-4 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_cardStripeAndCompassChip_reTintOnSelection` |
| AC-5 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_reducedMotion_swapIsInstantaneous` |
| AC-6 | `xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_twoCandidates_rendersTwoPolylines` |
| AC-7 | `scripts/tokens/enforce-native-compliance.sh` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/Features/MapApp/RouteResults/RouteResultsPolylineLayer.swift ios/LaneShadow/Views/Templates/MapApp.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Polyline layer + interaction wiring under `Features/MapApp/RouteResults/` consuming the Sprint 06 `LSMap` API. Matches swift-implementer mandate. Reviewer: `swift-reviewer`.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` § State-Driven Views (Persistent Host) + small layers, view-model intent calls
- `brain/docs/mobile-architecture/performance-optimization.md` (avoid full map re-renders on selection change)
- `RULES.md` § Design Rules › One View, Many States, §"Real Map Surfaces", §"Accessibility Standards iOS"

## Dependencies

**Depends on:**
- RR-S09-IOS-T01 (consumes `mapAppViewModel.polylines`, `selectedRouteId`, `selectAlt(_:)`)
- RR-S09-IOS-T02 (composition wires the polyline layer into MapApp's `.routeResults` branch + exposes card-tap callbacks)

**Blocks:**
- RR-S09-IOS-T05 (capture tests need polylines rendering in the variant captures)
- RR-S09-E2E-IOS-T01 (E2E asserts alt-tap promotes polyline)
- RR-S09-T11 (Sprint 09 gate)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"Three polylines render on MapApp's persistent LSMap with best/alt1/alt2 color tokens and per-variant strokes (best solid 3.5, alt1 dashed 6,4 2.5, alt2 dashed 3,4 2.5)","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_threePolylinesRenderOnMapAppWithCorrectStrokes","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Start (14px filled) + end (18px outer + 6px inner) dots at first/last coordinates of each polyline","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_startEndDots_renderAtEndpoints","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Alt-card tap promotes alt polyline to solid-bold, demotes best to dashed (or ghosted per S02); no LSMap remount","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_altTap_promotesAltDemotesBest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Selected card stripe + LSNavigatorMessage compass chip re-tint to selected variant color (rendered by MapApp overlay branch driven by mapAppViewModel.selectedRouteId)","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_cardStripeAndCompassChip_reTintOnSelection","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Reduced-motion enabled: stroke-width swap is instantaneous (no animation block)","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_reducedMotion_swapIsInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"V01 Two Candidates: exactly 2 polylines + 2 dot pairs render on MapApp's LSMap","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_twoCandidates_rendersTwoPolylines","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Token compliance clean across polyline-rendering files under Features/MapApp/RouteResults/","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Three polylines with correct strokes","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_threePolylinesRenderOnMapAppWithCorrectStrokes","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Start + end dots at endpoints","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_startEndDots_renderAtEndpoints","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Alt-tap promotes alt, demotes best, no remount","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_altTap_promotesAltDemotesBest","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Card stripe + compass chip re-tint","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_cardStripeAndCompassChip_reTintOnSelection","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Reduced-motion instantaneous swap","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_reducedMotion_swapIsInstantaneous","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Two-candidate variant renders 2 polylines","verify":"xcodebuild test -only-testing:LaneShadowTests/Templates/MapAppRouteResultsPolylineTests/test_twoCandidates_rendersTwoPolylines","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"Token compliance returns zero","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Build + lint clean","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/Features/MapApp/","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
