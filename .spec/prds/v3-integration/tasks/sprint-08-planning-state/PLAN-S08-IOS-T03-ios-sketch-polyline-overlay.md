# PLAN-S08-IOS-T03 — iOS sketch polyline overlay layer (1400ms loop + breathing head dot, reduce-motion guarded)

> Status: 🔵 Backlog
> Cycle: 1
> Updated: 2026-05-07T19:10:00.000Z

> **Task ID:** PLAN-S08-IOS-T03
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** swift-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-FID-01 (planning-screen sketch animation variants), Sprint 08 — Map View Planning State (Map View Redesign 2026-05-06)

## Background

The planning state of the canonical map view shows a copper "sketch polyline" continuously drawing across the paper-tile map substrate — visualizing the Navigator's pen moving while the agent thinks. The 2026-05-06 design specifies a 1400ms linear loop (path-draw via `stroke-dashoffset` in HTML, equivalent in SwiftUI) with a leading head dot breathing at 1400ms ease-in-out. Both animations MUST honor accessibility reduced-motion (`UIAccessibility.isReduceMotionEnabled` / `@Environment(\.accessibilityReduceMotion)`) — under reduce-motion the polyline collapses to a static stroke and the dot to a static fill. Color is `var(--route-best)` (copper) per the Navigator brand contract.

The legacy `PlanningScreen.swift` already includes a placeholder `SketchingPolyline` shape rendered in a `parsingPolyline` slot, but its path is hardcoded to a screen-space curve via `UIScreen.main.bounds`, breaks the persistent map host pattern (Sprint 06), and does not respect reduce-motion. This task extracts the sketch animation into a dedicated `MapSketchAnimationLayer.swift` that lives alongside the Sprint 06 `LSMap` atom and is composed by `PlanningScreen` (PLAN-S08-IOS-T02) into the map slot. Path geometry is sourced from `PlanningViewModel.sketchPathPoints` (added here as an `@Published` of CGPoint or LatLng) — a mock geometry is acceptable for Sprint 08 (real path comes from agent route data in Sprint 09), but the layer MUST be path-data-driven, not hardcoded.

## Critical Constraints

**MUST:**
- Create `ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` (new directory if needed) as a SwiftUI `View` consuming `@Environment(\.theme)` and `@Environment(\.accessibilityReduceMotion)`
- Render a copper polyline (`LaneShadowTheme.color.signal.default` — the V3 token alias for `var(--route-best)`) using SwiftUI `Path` + `StrokeStyle` with dash pattern + animated `dashPhase` for the 1400ms linear continuous loop
- Render a leading head dot (`Circle().fill(LaneShadowTheme.color.signal.default)`) at the polyline head (last point), animated 1400ms ease-in-out via `Animation.breathingHeadDot(theme:)` (already present in `PlanningScreen.swift` motion extension — reuse that helper or move it into the new file)
- Honor `@Environment(\.accessibilityReduceMotion)` — when `true`, BOTH animations collapse to static rendering: polyline drawn at fixed `dashPhase: 0`, dot at fixed `opacity: 1.0`, no `Animation.repeatForever` calls active
- Source path geometry from `PlanningViewModel.sketchPathPoints: [CGPoint]` (new `@Published` property added to `PlanningViewModel` as part of this task — the only allowed extension to T01's surface) OR accept the points via initializer parameter; mock geometry of a 4-segment curve is acceptable for Sprint 08; never use `UIScreen.main.bounds` or hardcoded screen-space coordinates
- Read animation timing from `theme.motion.recipes["sketchPolylineLoop"]` and `theme.motion.recipes["breathingHeadDot"]` tokens (existing in `Theme`); never inline `1400` as a literal — use the recipe's `duration`
- Add tests in `ios/LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests.swift`: token-color resolution to `signal.default`, animation timing reads from theme.motion.recipes, reduce-motion guard collapses both animations, head-dot positioned at last point of path, build clean

**NEVER:**
- NEVER hardcode `1400`, `0.85`, `0.55` opacity literals — read from `theme.motion.recipes["sketchPolylineLoop"]` / `theme.motion.recipes["breathingHeadDot"]` (helpers `Animation.sketchPolylineLoop(theme:)` and `Animation.breathingHeadDot(theme:)` already exist in `PlanningScreen.swift` — move/reuse them, do NOT duplicate magic numbers)
- NEVER use `UIScreen.main.bounds` for path coordinates — geometry must be data-driven (path points input) OR sized to the parent `GeometryReader`
- NEVER hardcode hex strings, RGB tuples, `Color(red:...)` — copper color resolves through `LaneShadowTheme.color.signal.default` (the V3 alias for `var(--route-best)`)
- NEVER skip the reduce-motion guard — both animations MUST collapse under `@Environment(\.accessibilityReduceMotion) == true`
- NEVER modify `LSMap.swift`, `LSMapLayer.swift`, or `LSContextCapsule.swift` — composition into the map slot lives in PLAN-S08-IOS-T02

**STRICTLY:**
- STRICTLY follow `brain/docs/mobile-architecture/ios-principles.md` §"Accessibility" — accessibility reduce-motion is a first-class environment value, not a `UIAccessibility.isReduceMotionEnabled` static call inside `body`
- STRICTLY follow `brain/docs/mobile-architecture/performance-optimization.md` §"Animation" — `Animation.repeatForever(autoreverses:)` is acceptable for 1400ms continuous; do NOT trigger SwiftUI re-layout via `@State` toggles every frame
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 — the new file must be token-pure

## Specification

**Objective:** Extract a dedicated `MapSketchAnimationLayer` SwiftUI view that renders a copper sketch polyline at 1400ms linear loop + a leading head dot at 1400ms ease-in-out breathing, both reading timing from theme motion recipes, both honoring `@Environment(\.accessibilityReduceMotion)`, and both fed by data (`PlanningViewModel.sketchPathPoints` or initializer parameter) rather than hardcoded screen coordinates.

**Success State:** `xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests` exits 0 with all reduce-motion + token + timing assertions passing; `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` succeeds; `scripts/tokens/enforce-native-compliance.sh` exits 0; `swiftlint lint ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` clean.

## Acceptance Criteria

### AC-1 — Layer renders polyline + head dot from path points

**GIVEN** `MapSketchAnimationLayer(pathPoints: [CGPoint(x:0,y:50), CGPoint(x:50,y:30), CGPoint(x:100,y:60), CGPoint(x:150,y:40)])`
**WHEN** the view renders inside a 200×100 frame
**THEN** the polyline `Path` traverses all 4 points in order AND a `Circle` head dot is positioned at the last point `(150, 40)`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_pathPoints_renderedInOrder`

### AC-2 — Polyline color resolves through LaneShadowTheme.color.signal.default token

**GIVEN** the layer is rendered with the active theme
**WHEN** the polyline `StrokeStyle` color is inspected
**THEN** the resolved color is `LaneShadowTheme.color.signal.default` (the V3 alias for `var(--route-best)`); no `Color(red:...)`, no hex string, no inline color value
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_polylineColor_resolvesSignalDefault`

### AC-3 — Animation timing reads from motion recipes (not hardcoded literals)

**GIVEN** the layer is rendered
**WHEN** `Animation.sketchPolylineLoop(theme:)` and `Animation.breathingHeadDot(theme:)` are constructed
**THEN** both animations read `duration` from `theme.motion.recipes["sketchPolylineLoop"]` (1400) and `theme.motion.recipes["breathingHeadDot"]` (1400) respectively; the file `MapSketchAnimationLayer.swift` contains zero `1400` literals (only token reads); easing for the dot is `safeCubicBezierEasing(theme.motion.recipes["breathingHeadDot"]?.easing)`
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_animationTiming_readsFromMotionRecipes && grep -c '1400' ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift`

### AC-4 — Reduce-motion collapses polyline animation to static stroke

**GIVEN** `MapSketchAnimationLayer` rendered under `\.accessibilityReduceMotion = true`
**WHEN** the view body resolves
**THEN** the polyline is drawn with `dashPhase: 0` (no animation), no `.animation(.repeatForever)` modifier is attached to the stroke, AND the layer is visually a static dashed line
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_polylineStatic`

### AC-5 — Reduce-motion collapses head dot to static fill

**GIVEN** `MapSketchAnimationLayer` rendered under `\.accessibilityReduceMotion = true`
**WHEN** the view body resolves
**THEN** the head dot is rendered with `opacity: 1.0` (no breathing animation), no `Animation.breathingHeadDot(theme:)` is attached, AND the dot is visually static
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_headDotStatic`

### AC-6 — Animation active under default (no reduce-motion) environment

**GIVEN** `MapSketchAnimationLayer` rendered under `\.accessibilityReduceMotion = false` (default)
**WHEN** the view body resolves
**THEN** the polyline stroke has an `.animation(Animation.sketchPolylineLoop(theme:), value: isAnimating)` modifier active AND the head dot has `.animation(Animation.breathingHeadDot(theme:), value: isAnimating)` modifier active
**Verify:** `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_normalMotion_animationsActive`

### AC-7 — Geometry data-driven (not screen-space)

**GIVEN** the file `ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift`
**WHEN** the file is grep'd for `UIScreen.main` or hardcoded coordinates
**THEN** zero matches — geometry comes from `pathPoints` parameter or `GeometryReader.size` only
**Verify:** `! grep -E 'UIScreen\.main\.bounds' ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift`

### AC-8 — Token purity (zero hex, RGB, numeric literals beyond geometry)

**GIVEN** the new file `ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift`
**WHEN** `scripts/tokens/enforce-native-compliance.sh` runs
**THEN** exit 0 with no findings; the file contains zero `Color(red:...)`, zero hex strings, zero numeric font-size literals, zero hardcoded duration literals (1400/700/...), zero hardcoded opacity literals (0.85/0.55/...)
**Verify:** `scripts/tokens/enforce-native-compliance.sh && grep -E 'Color\(red:|#[0-9A-Fa-f]{6}|Animation\.linear\(duration: [0-9]' ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift | wc -l`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | Polyline traverses all input pathPoints in order; head dot at last point | AC-1 | `xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_pathPoints_renderedInOrder` | happy_path |
| TC-2 | Polyline color resolves through LaneShadowTheme.color.signal.default | AC-2 | `xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_polylineColor_resolvesSignalDefault` | happy_path |
| TC-3 | Animation timings come from theme.motion.recipes; zero `1400` literals in file | AC-3 | `xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_animationTiming_readsFromMotionRecipes` | edge |
| TC-4 | Reduce-motion env true → polyline static, no repeatForever modifier | AC-4 | `xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_polylineStatic` | edge |
| TC-5 | Reduce-motion env true → head dot static, no breathingHeadDot animation | AC-5 | `xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_headDotStatic` | edge |
| TC-6 | Normal motion → both animations active with correct theme-driven timings | AC-6 | `xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_normalMotion_animationsActive` | happy_path |
| TC-7 | grep finds zero `UIScreen.main.bounds` references in the new file | AC-7 | `! grep -E 'UIScreen\.main\.bounds' ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` | edge |
| TC-8 | Token compliance shell + grep show zero violations in new file | AC-8 | `scripts/tokens/enforce-native-compliance.sh` | edge |
| TC-9 | Build + lint pass cleanly | AC-1, AC-8 | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `ios/LaneShadow/Views/Templates/PlanningScreen.swift` | 1-571 | Existing legacy `SketchingPolyline` + `Animation.sketchPolylineLoop(theme:)` + `Animation.breathingHeadDot(theme:)` extensions + `BreathingDotRecipe` struct + `PolylineShape` — pattern source; the helpers move to the new file or are imported from a shared motion module |
| `ios/LaneShadow/Views/Atoms/LSMap.swift` | 1-100 | Map atom shape — confirm the layer composes ABOVE the map (ZStack) without modifying the atom |
| `.spec/design/system/views/planning-screen/planning-screen.html` | sketch-polyline section | Animation contract — 1400ms linear loop, 1400ms ease-in-out breathing dot, copper color, reduce-motion fallback |
| `.spec/design/system/molecules/phase-indicator/README.md` | Animation Notes | Motion timing parallel — confirms 1400ms cadence is the Navigator's "thinking pulse" tempo |
| `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` | all | View-model — extension point for `sketchPathPoints` published property (sibling concept to `phaseSteps` from PLAN-S08-IOS-T01) |
| `ios/LaneShadowTests/Templates/PlanningScreenTests.swift` (if exists) | all | Pattern source for SwiftUI snapshot/inspection tests |
| `tokens/motion.recipes.json` (or wherever motion recipes are defined) | sketchPolylineLoop, breathingHeadDot entries | Confirm token names + duration values |

## Guardrails

**Write-Allowed:**
- `ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` (NEW — entire layer + Path shape + token-driven motion)
- `ios/LaneShadow/Features/Planning/PlanningViewModel.swift` (MODIFY only to add `sketchPathPoints: [CGPoint]` published property if data-driven path is implemented through view-model; PLAN-S08-IOS-T01 owns the rest of this file's structure — coordinate via PR description)
- `ios/LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests.swift` (NEW — token + reduce-motion + path-points tests)
- `ios/LaneShadow/Views/Templates/PlanningScreen.swift` (MODIFY only to remove legacy `SketchingPolyline` if PLAN-S08-IOS-T02 hasn't already; coordinate to avoid double-touch)
- `ios/project.yml` (MODIFY only if file additions require regeneration)

**Write-Prohibited:**
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — Sprint 06 atom, do NOT modify
- `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` — Sprint 06 organism, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSContextCapsule.swift` — Sprint 07 component, do NOT modify
- `ios/LaneShadow/Views/Molecules/LSPhaseIndicator.swift` — Sprint 04 component, do NOT modify
- `ios/LaneShadow/Views/Organisms/LSMapControls.swift` — Sprint 07 component, do NOT modify
- `tokens/**` — token values are read, not modified, in this task
- `android/**`, `server/**`, `react-native/**` — out of scope
- `ios/LaneShadow.xcodeproj/**` — generated

## Design

**References:**
- `.spec/design/system/views/planning-screen/planning-screen.html` (sketch-polyline animation section)
- `.spec/design/system/molecules/phase-indicator/README.md` (motion timing parallel — the Navigator's "thinking pulse" cadence)
- `tokens/motion.recipes.json` (or equivalent motion recipe source)

**Interaction Notes:** Non-interactive — pure presentation. The layer composes inside the `mapView` slot retained by PLAN-S08-IOS-T02; PLAN-S08-IOS-T02 wires the layer into the slot via a `ZStack` over `LSMap`. The layer accepts path geometry as input — for Sprint 08, mock 4-point geometry sourced from the view-model is acceptable; Sprint 09 will replace with real `routePlan.candidates[i].geometry`.

**Pattern:** Existing `SketchingPolyline` struct in `PlanningScreen.swift` (lines 438-506) — the `Animation.sketchPolylineLoop(theme:)` and `Animation.breathingHeadDot(theme:)` extensions (lines 16-42), `BreathingDotRecipe` struct (lines 510-532), `safeCubicBezierEasing` helper (lines 9-14). Move them to the new file or to a shared `MapMotionRecipes.swift` so PlanningScreen no longer owns the duplicated logic.

**Pattern Source:** Sprint 04 phase-indicator pulse animation — same 1400ms cadence philosophy; same reduce-motion guard pattern (`@Environment(\.accessibilityReduceMotion)` short-circuiting the `Animation.repeatForever` modifier).

**Anti-Pattern:** Hardcoding `1400` as a literal anywhere in the file (must read from `theme.motion.recipes`); using `UIScreen.main.bounds` for path coordinates (must be data-driven via input or `GeometryReader`); skipping the reduce-motion guard (both animations must collapse); inlining hex copper color (must resolve through `LaneShadowTheme.color.signal.default`).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_pathPoints_renderedInOrder` |
| AC-2 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_polylineColor_resolvesSignalDefault` |
| AC-3 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_animationTiming_readsFromMotionRecipes` |
| AC-4 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_polylineStatic` |
| AC-5 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_headDotStatic` |
| AC-6 | `xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_normalMotion_animationsActive` |
| AC-7 | `! grep -E 'UIScreen\.main\.bounds' ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` |
| AC-8 | `scripts/tokens/enforce-native-compliance.sh` |
| build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` |
| lint | `swiftlint lint ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift` |

## Agent Assignment

**Agent:** swift-implementer
**Rationale:** Pure SwiftUI animation layer with token-driven motion + reduce-motion accessibility guard + path-data input. Matches swift-implementer's mandate (SwiftUI `Path` / `Shape` / `Animation` APIs, theme tokens, `@Environment(\.accessibilityReduceMotion)`, XCTest for view-level + token resolution). No Mapbox SDK internals, no Convex, no Compose.

## Coding Standards

- `brain/docs/mobile-architecture/ios-principles.md` (`@Environment` accessibility values, `GeometryReader` over `UIScreen`)
- `brain/docs/mobile-architecture/performance-optimization.md` (`Animation.repeatForever` cost, avoid frame-driven `@State` toggles)
- `brain/docs/mobile-architecture/testing-strategy.md` (view-level inspection tests; reduce-motion environment override pattern)
- `RULES.md` (LaneShadow §"Accessibility Standards iOS", §"Cross-Platform Component Parity" if Android twin shares an animation contract)

## Dependencies

**Depends on:** PLAN-S08-IOS-T02 (composition wires the layer into the `mapView` slot retained by the new overlay layout)
**Blocks:**
- PLAN-S08-IOS-T05 (capture tests render the planning state with the sketch animation in static-frame mode)
- PLAN-S08-T11 (Sprint 08 gate — real-iPhone XCUITest evidence of 1400ms motion cadence on hardware)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"MapSketchAnimationLayer renders polyline through input pathPoints in order with head dot at last point","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_pathPoints_renderedInOrder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-2","type":"acceptance_criterion","description":"Polyline color resolves through LaneShadowTheme.color.signal.default token; no hex/RGB literals","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_polylineColor_resolvesSignalDefault","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-3","type":"acceptance_criterion","description":"Animation timings read from theme.motion.recipes (sketchPolylineLoop + breathingHeadDot); zero `1400` literals in file","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_animationTiming_readsFromMotionRecipes","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-4","type":"acceptance_criterion","description":"Reduce-motion env true → polyline static dashPhase 0, no repeatForever modifier attached","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_polylineStatic","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-5","type":"acceptance_criterion","description":"Reduce-motion env true → head dot opacity 1.0 static, no breathingHeadDot animation attached","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_headDotStatic","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-6","type":"acceptance_criterion","description":"Default motion env (reduce-motion false) → both polyline + head-dot animations active with theme-driven timings","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_normalMotion_animationsActive","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-7","type":"acceptance_criterion","description":"Geometry data-driven via pathPoints input or GeometryReader; zero UIScreen.main.bounds references","verify":"! grep -E 'UIScreen\\.main\\.bounds' ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"AC-8","type":"acceptance_criterion","description":"Token compliance script exits 0; zero hex/RGB/duration/opacity literals in new file","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":null},
    {"id":"TC-1","type":"test_criterion","description":"Polyline traverses all 4 input pathPoints in order; head dot at last point","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_pathPoints_renderedInOrder","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"},
    {"id":"TC-2","type":"test_criterion","description":"Polyline color resolves through theme signal.default","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_polylineColor_resolvesSignalDefault","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-2"},
    {"id":"TC-3","type":"test_criterion","description":"Animation timings come from motion recipes; zero hardcoded `1400` literals","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_animationTiming_readsFromMotionRecipes","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-3"},
    {"id":"TC-4","type":"test_criterion","description":"Reduce-motion polyline collapses static, no repeatForever modifier","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_polylineStatic","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-4"},
    {"id":"TC-5","type":"test_criterion","description":"Reduce-motion head dot collapses static, no breathing animation","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_reduceMotion_headDotStatic","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-5"},
    {"id":"TC-6","type":"test_criterion","description":"Normal motion both animations active with theme-driven timings","verify":"xcodebuild test -only-testing:LaneShadowTests/AppFlow/MapView/MapSketchAnimationLayerTests/test_normalMotion_animationsActive","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-6"},
    {"id":"TC-7","type":"test_criterion","description":"grep finds zero UIScreen.main.bounds in new file","verify":"! grep -E 'UIScreen\\.main\\.bounds' ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-7"},
    {"id":"TC-8","type":"test_criterion","description":"Token compliance shell zero violations in new file","verify":"scripts/tokens/enforce-native-compliance.sh","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-8"},
    {"id":"TC-9","type":"test_criterion","description":"Build + swiftlint clean for new file","verify":"xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' && swiftlint lint ios/LaneShadow/AppFlow/MapView/MapSketchAnimationLayer.swift","satisfied":null,"evidence":null,"remediation":null,"last_evaluated_cycle":null,"last_evaluated_commit":null,"maps_to_ac":"AC-1"}
  ]
}
-->
