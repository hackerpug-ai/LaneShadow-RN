# PLAN-S08-AND-T03 — Android sketch-polyline overlay (1400ms linear loop + 1400ms ease-in-out breathing head dot, reduced-motion aware)

> Status: 🔴 NEEDS_FIXES (Cycle 5 Review)
> Cycle: 5
> Updated: 2026-05-14T23:30:00.000Z

> **Task ID:** PLAN-S08-AND-T03
> **Sprint:** [Sprint 08 — Map View · Planning State](./SPRINT.md)
> **Agent:** kotlin-implementer
> **Estimate:** 240 min
> **Type:** FEATURE
> **Status:** Backlog
> **Priority:** P0
> **Effort:** L
> **Sprint ID:** sprint-08-planning-state
> **PRD Refs:** UC-CHAT-02, UC-FID-01, Sprint 08 Map View — Planning State (Map View Redesign 2026-05-06)

## Background

The planning state's signature visual is a copper sketch-polyline that draws and loops continuously across the map (representing the Navigator's pen moving across the paper), with a leading head-dot breathing in sync. Per the design contract at `.spec/design/system/views/planning-screen/planning-screen.html` § sketch-polyline animation, the loop runs at **1400ms linear** for the path-draw progress and **1400ms ease-in-out** for the head-dot breathing. The animation is decorative chrome — when the user has system animation scale set to 0 or has enabled reduce-motion, the loop MUST collapse to a static stroke + static dot (per accessibility contract).

This task adds a sibling overlay layer to the existing Sprint 06 `LSMapHost` — either a Mapbox annotation animation OR a Compose `Canvas` over the map (whichever the existing `LSMap.kt` integration supports cleanly). The polyline geometry is supplied by `PlanningViewModel` (a stub or evolving path while planning is in progress). The token used for the stroke color is `LaneShadowTheme.semantic.route.best` (copper). The animation respects `AccessibilityManager.isHighTextContrastEnabled` / system animator-duration-scale.

## Critical Constraints

**MUST:**
- Add a new composable `MapSketchAnimationLayer` at `android/app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt` that renders the copper sketch polyline + breathing head-dot as a sibling overlay on the existing Sprint 06 `LSMapHost` — DO NOT modify `LSMap.kt` or `LSMapHost.kt`
- Drive path-draw progress with `infiniteRepeatable(animation = tween(durationMillis = 1400, easing = LinearEasing))` matching `LaneShadowTheme.motion.recipe.sketchPolylineLoop` (which already exposes `motion.duration[verySlow] = 1400ms` and `motion.easing[linear]`)
- Drive head-dot breathing with `infiniteRepeatable(animation = tween(durationMillis = 1400, easing = EaseInOut), repeatMode = RepeatMode.Reverse)` so opacity + scale pulse symmetrically
- Resolve stroke color via `LaneShadowTheme.semantic.route.best` token — never a hex literal, never `Color(0xFF...)`
- Honor reduced-motion: when `Settings.Global.getFloat(contentResolver, Settings.Global.ANIMATOR_DURATION_SCALE, 1f) == 0f` (or equivalent `LocalAccessibilityManager` check) the animation collapses to static stroke + static dot at full opacity
- Accept the polyline geometry as a `List<LatLng>` parameter so `PlanningViewModel` (or PLAN-S08-AND-T02 caller) can supply an evolving stub path; renderer MUST handle empty list (renders nothing, not a crash)
- Add unit/instrumented test in `android/app/src/test/java/com/laneshadow/ui/atoms/MapSketchAnimationLayerTest.kt` covering: animation cadence (1400ms loop), reduced-motion collapse, empty path no-crash, token resolution

**NEVER:**
- NEVER add a new design-system molecule for the sketch polyline — it is a configuration of `LSMap` (a layer/source pair or sibling overlay), not a separate component (per `SPRINT.md` Notes § anti-pattern)
- NEVER modify `LSMap.kt` or `LSMapHost.kt` — both are Sprint 06 components, write-prohibited in this task
- NEVER hardcode the 1400ms duration or copper hex value — both MUST resolve through `LaneShadowTheme.motion.recipe.sketchPolylineLoop` and `LaneShadowTheme.semantic.route.best`
- NEVER skip the reduced-motion guard — accessibility is a gate-blocking requirement per `RULES.md`
- NEVER subscribe to flows or repositories from this composable; it is a pure presentation layer driven by props

**STRICTLY:**
- STRICTLY follow the existing animation pattern in `PlanningScreen.kt` (`sketchPolylineRecipe(theme: LaneShadowThemeValues)` already reads the same motion tokens — reuse the same recipe builder rather than duplicating)
- STRICTLY pass `scripts/tokens/enforce-native-compliance.sh` exit 0 — no hex/numeric literals
- STRICTLY align cadence + opacity curves with the iOS twin (PLAN-S08-IOS-T03) per `RULES.md §Cross-Platform Component Parity` — same 1400ms linear / 1400ms ease-in-out values

## Specification

**Objective:** Ship `MapSketchAnimationLayer` — a Compose composable that overlays a copper sketch-polyline animating at 1400ms linear loop with a breathing head-dot at 1400ms ease-in-out, on top of the existing Sprint 06 `LSMapHost`. The composable is token-driven (uses `LaneShadowTheme.motion.recipe.sketchPolylineLoop` + `LaneShadowTheme.semantic.route.best`), respects reduced-motion (collapses to static stroke + static dot when system animator-duration-scale is 0), and accepts the polyline geometry as a prop so `PlanningViewModel` supplies the evolving stub path.

**Success State:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest'` exits 0; the composable renders a copper polyline whose path-draw progress completes a 0→1 cycle every 1400ms (linear) with a head-dot breathing 0→1→0 alpha cycle every 1400ms (ease-in-out reversed); reduced-motion path collapses to a static stroke; `LSMap.kt` / `LSMapHost.kt` not modified.

## Acceptance Criteria

### AC-1 — Sketch polyline path-draw cycles at 1400ms linear

**GIVEN** `MapSketchAnimationLayer(path = nonEmptyLatLngList)` mounted in a Compose test rule with `mainClock.autoAdvance = false`
**WHEN** the composable runs and the test clock advances 1400ms
**THEN** the captured `pathDrawProgress` value cycles through 0.0 → 1.0 over exactly the 1400ms window with linear cadence (intermediate at 700ms ≈ 0.5)
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.path_draw_progress_cycles_at_1400ms_linear'`

### AC-2 — Head-dot breathing cycles at 1400ms ease-in-out reversed

**GIVEN** the same mounted composable
**WHEN** the test clock advances 2800ms (one full reverse-repeat cycle)
**THEN** the captured `headDotAlpha` cycles 0 → 1 → 0 over 2800ms with ease-in-out cadence; midpoint at 1400ms is at peak alpha 1.0
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.head_dot_breathing_cycles_at_1400ms_easeinout'`

### AC-3 — Reduced-motion collapses both animations to static state

**GIVEN** `MapSketchAnimationLayer(path = nonEmptyLatLngList)` mounted with `LocalAccessibilityManager` overridden so `getRecommendedTimeoutMillis(...)` reports reduced-motion (or system animator-duration-scale stub == 0f)
**WHEN** the composable runs
**THEN** `pathDrawProgress` remains constant at 1.0 (full stroke); `headDotAlpha` remains constant at 1.0 (static); no `infiniteRepeatable` is launched
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.reduced_motion_collapses_to_static'`

### AC-4 — Empty path renders nothing without crash

**GIVEN** `MapSketchAnimationLayer(path = emptyList())`
**WHEN** the composable runs
**THEN** no Canvas draw call is made for the polyline; the composable does not throw; the head-dot also does not render (no leading point)
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.empty_path_renders_nothing_without_crash'`

### AC-5 — Stroke color resolves to LaneShadowTheme.semantic.route.best

**GIVEN** the composable runs in light theme then dark theme
**WHEN** the captured stroke `Color` is read in each theme
**THEN** the value equals `LaneShadowTheme.semantic.route.best` resolved for that theme (copper); no hex literal appears in the source file
**Verify:** `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.stroke_color_resolves_to_route_best_token' && ! grep -E '#[0-9A-Fa-f]{6}|Color\(0x' android/app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayerTest.kt android/app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt`

### AC-6 — Token purity, lint, and consumed-component non-modification gates pass

**GIVEN** the new `MapSketchAnimationLayer.kt` + test file
**WHEN** `scripts/tokens/enforce-native-compliance.sh` and `cd android && ./gradlew ktlintCheck` run AND `git diff --name-only HEAD` is inspected
**THEN** both gates exit 0; `LSMap.kt`, `LSMapHost.kt`, `LSMap*.kt` outside this task's allow list do NOT appear in the diff
**Verify:** `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck && ! git diff --name-only HEAD | grep -E '(LSMap|LSMapHost)\.kt$' | grep -v 'MapSketchAnimationLayer'`

## Test Criteria

| ID | Statement | Maps to AC | Verify | Type |
|---|---|---|---|---|
| TC-1 | path-draw progress cycles 0→1 over 1400ms with linear easing (midpoint at 700ms ≈ 0.5) | AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.path_draw_progress_cycles_at_1400ms_linear'` | happy_path |
| TC-2 | head-dot alpha cycles 0→1→0 over 2800ms (one reverse cycle) with ease-in-out | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.head_dot_breathing_cycles_at_1400ms_easeinout'` | happy_path |
| TC-3 | reduced-motion AccessibilityManager state collapses both animations to static | AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.reduced_motion_collapses_to_static'` | edge |
| TC-4 | empty path renders nothing without crashing | AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.empty_path_renders_nothing_without_crash'` | edge |
| TC-5 | stroke color resolves to LaneShadowTheme.semantic.route.best in light + dark themes; no hex literals in source | AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.stroke_color_resolves_to_route_best_token'` | happy_path |
| TC-6 | enforce-native-compliance.sh + ktlintCheck exit 0; LSMap.kt / LSMapHost.kt unmodified | AC-6 | `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck` | edge |

## Reading List

| Path | Lines | Focus |
|---|---|---|
| `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` | all | Sprint 06 host — read-only; understand the layer/source contract for sibling overlays |
| `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` | 30-150 | Existing `sketchPolylineRecipe(theme)` helper that already reads `motion.duration["verySlow"]` (1400ms) + `motion.easing["linear"]`; reuse this builder |
| `.spec/design/system/views/planning-screen/planning-screen.html` | sketch-polyline animation section | Visual contract — copper polyline draws and loops continuously, leading head-dot breathes in sync, both at 1400ms |
| `.spec/design/system/molecules/phase-indicator/README.md` | motion section | Motion-timing parallel — same 1400ms cadence rationale; ensures cross-component cadence consistency |
| `android/app/src/main/java/com/laneshadow/theme/LSMotion.kt` | all | Motion token API — `LaneShadowTheme.motion.recipe.sketchPolylineLoop`, `motion.duration["verySlow"]`, `motion.easing["linear"]` accessors |
| `android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt` | all | Reference — existing pulse animation respecting reduced-motion; pattern for `LocalAccessibilityManager` checks |
| `.spec/design/system/tokens/tokens.css` | semantic.route.best line | Copper token authoritative value; ensures Kotlin token reads same as design contract |

## Guardrails

**Write-Allowed:**
- `android/app/src/main/java/com/laneshadow/ui/atoms/MapSketchAnimationLayer.kt` (NEW — composable + reduced-motion guard + token resolution)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` (MODIFY — only if needed to expose path-geometry stub via `state.sketchPath: List<LatLng>`)
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt` (MODIFY — add `sketchPath: List<LatLng> = emptyList()` if exposing via state)
- `android/app/src/test/java/com/laneshadow/ui/atoms/MapSketchAnimationLayerTest.kt` (NEW — Compose test rule with `mainClock.autoAdvance = false` for animation cadence verification)

**Write-Prohibited:**
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — Sprint 06 host, never modify
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap*Host*.kt` — Sprint 06 host, never modify
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSContextCapsule.kt` — Sprint 07 component, never modify
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSPhaseIndicator.kt` — existing molecule, never modify in this task
- `android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt` — modified by PLAN-S08-AND-T02 (this task only references the recipe builder; do not alter the screen composition)
- `.spec/design/system/molecules/**` — DO NOT add a new design-system molecule for this animation (anti-pattern)
- `ios/**`, `server/**`, `react-native/**`, `tokens/**` — out of scope

## Design

**References:**
- `.spec/design/system/views/planning-screen/planning-screen.html` (sketch-polyline animation section + token recipe)
- `.spec/design/system/views/planning-screen/README.md` (sketch animation duration constant 1400ms; head-dot breathe duration 1400ms)
- `LaneShadowTheme.motion.recipe.sketchPolylineLoop` (token contract)

**Interaction Notes:** This is non-interactive presentation chrome — the animation has no tap target, no focus traversal, and no SR announcement (the polyline is `aria-hidden="true"` decorative). Reduced-motion handling is mandatory per accessibility contract: when system animator-duration-scale is 0, the loop collapses to a static stroke at full opacity + a static head-dot at full opacity (the rider still sees the polyline, just without movement). Path geometry is owned by `PlanningViewModel` (or a sibling stub generator) — this composable is pure presentation.

**Pattern:** `android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt` — atom with token-driven color + `infiniteRepeatable` Compose animation + `LocalAccessibilityManager` reduced-motion guard.

**Pattern Source:** Sprint 04 `LSPhaseDot` pulse + the existing `sketchPolylineRecipe(theme)` builder in `PlanningScreen.kt` (which this task reuses rather than re-deriving). The recipe builder demonstrates the token-resolution pattern; this task wraps it in a renderable Compose layer.

**Anti-Pattern:** Creating a new design-system molecule for the polyline (it is a configuration of LSMap, not a component); modifying `LSMap.kt` to embed the animation; hardcoding 1400ms or hex copper; skipping reduced-motion (accessibility blocker); using `Color(0xFF...)` instead of resolving through theme tokens; subscribing to repositories from this composable (it must be pure presentation).

## Verification Gates

| AC | Command |
|---|---|
| AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.path_draw_progress_cycles_at_1400ms_linear'` |
| AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.head_dot_breathing_cycles_at_1400ms_easeinout'` |
| AC-3 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.reduced_motion_collapses_to_static'` |
| AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.empty_path_renders_nothing_without_crash'` |
| AC-5 | `cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.stroke_color_resolves_to_route_best_token'` |
| AC-6 | `scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck` |
| build | `cd android && ./gradlew assembleDebug` |
| lint | `cd android && ./gradlew ktlintCheck` |

## Agent Assignment

**Agent:** kotlin-implementer
**Rationale:** New Compose composable using `infiniteRepeatable` + Compose Canvas (or Mapbox annotation API) + `LocalAccessibilityManager` reduced-motion guard + token resolution via `LocalLaneShadowTheme.current`. Pure Android/Kotlin/Compose territory — no SwiftUI, no Convex backend, no design-token authoring (only consumption). Matches kotlin-implementer's mandate per `brain/docs/mobile-architecture/android-principles.md`.

## Coding Standards

- `brain/docs/mobile-architecture/android-principles.md`
- `brain/docs/mobile-architecture/testing-strategy.md`
- `brain/docs/mobile-architecture/performance-optimization.md`
- `RULES.md` (LaneShadow §Cross-Platform Component Parity, §Accessibility Standards Android)

## Dependencies

**Depends on:** PLAN-S08-AND-T02 (this overlay layer composes onto the new `PlanningScreen` composition)
**Blocks:**
- PLAN-S08-AND-T05 (capture tests assert sketch animation behavior)
- PLAN-S08-T11 (sprint gate — real-iPhone XCUITest hardware capture verifies cadence on Android twin)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN MapSketchAnimationLayer with non-empty path WHEN test clock advances 1400ms THEN pathDrawProgress cycles 0\u21921 linear with midpoint at 700ms \u2248 0.5",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.path_draw_progress_cycles_at_1400ms_linear'",
      "satisfied": "PASS",
      "evidence": "Cycle 5: MapSketchAnimationLayerBehaviorTest.kt (src/test/) annotated @RunWith(RobolectricTestRunner) + @Config(manifest=Config.NONE, sdk=[34]) runs via testDebugUnitTest. ac1_path_draw_progress_at_700ms_is_approximately_half: mainClock.autoAdvance=false, advanceTimeBy(700L), assertThat(observedPathProgress).isWithin(0.05f).of(0.5f) \u2014 PASSES. ac1_path_draw_progress_at_1400ms_completes_full_cycle: advanceTimeBy(1400L), assertThat(observedPathProgress).isAtLeast(0.95f) \u2014 PASSES. XML: TEST-com.laneshadow.ui.atoms.MapSketchAnimationLayerBehaviorTest.xml tests=8 failures=0 errors=0. Robolectric dep at build.gradle.kts:213.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN composable mounted WHEN test clock advances 2800ms THEN headDotAlpha cycles 0\u21921\u21920 ease-in-out reversed with peak at 1400ms",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.head_dot_breathing_cycles_at_1400ms_easeinout'",
      "satisfied": "PASS",
      "evidence": "Cycle 5: ac2_head_dot_alpha_at_1400ms_reaches_peak: advanceTimeBy(1400L), assertThat(observedHeadDotAlpha).isWithin(0.05f).of(1.0f) \u2014 PASSES. ac2_head_dot_alpha_at_2800ms_returns_to_zero: advanceTimeBy(2800L), assertThat(observedHeadDotAlpha).isWithin(0.05f).of(0.0f) \u2014 PASSES. Both in MapSketchAnimationLayerBehaviorTest.kt (src/test/) running via testDebugUnitTest with Robolectric. XML: 0 failures.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN reduced-motion enabled WHEN composable runs THEN pathDrawProgress=1.0 + headDotAlpha=1.0 static; no infiniteRepeatable launched",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.reduced_motion_collapses_to_static'",
      "satisfied": "PASS",
      "evidence": "Cycle 5: ac3_reduced_motion_keeps_path_progress_static_at_one in MapSketchAnimationLayerBehaviorTest.kt: reducedMotionOverride=true, advanceTimeBy(2000L), assertThat(observedPathProgress).isWithin(0.001f).of(1.0f) and assertThat(observedHeadDotAlpha).isWithin(0.001f).of(1.0f) \u2014 PASSES via testDebugUnitTest (Robolectric). XML: 0 failures.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN empty path WHEN composable runs THEN no Canvas draw + no crash + no head-dot rendered",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.empty_path_renders_nothing_without_crash'",
      "satisfied": "PASS",
      "evidence": "Cycle 4: MapSketchAnimationLayer.kt:79 \u2014 if (path.isEmpty()) return. Instrumented test ac4_empty_path_renders_nothing_without_crash (androidTest:169-185) advances clock 1500ms and asserts progressCallCount == 0 (callback-count assertion, not tautology). Source-text test also verifies the structural guard. Both pass.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN composable runs light then dark theme WHEN stroke color captured THEN equals LaneShadowTheme.semantic.route.best per theme; zero hex literals in source",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.stroke_color_resolves_to_route_best_token'",
      "satisfied": "PARTIAL",
      "evidence": "Cycle 5: Light-theme test (ac5_stroke_color_resolved_via_callback) is real \u2014 asserts resolvedStrokeColor == GeneratedTokens.color.Route.best, PASSES. Dark-theme test (ac5_stroke_color_resolved_via_callback_dark_theme, BehaviorTest.kt:272-299) is TEST THEATRE: does not force dark theme via Configuration.UI_MODE_NIGHT_YES or MaterialTheme(darkColorScheme()); accepts isDarkTheme||isLightTheme (line 298) \u2014 the test always resolves light-theme in Robolectric environment (isSystemInDarkTheme()=false), making the dark-branch assertion vacuously true. This does NOT verify the dark code path in MapSketchAnimationLayer.kt:67-68. Production dark-branch exists but is untested.",
      "remediation": "Force dark theme in test: wrap setContent with Configuration.UI_MODE_NIGHT_YES override (e.g., RuntimeEnvironment.getApplication().resources.configuration.uiMode = Configuration.UI_MODE_NIGHT_YES or use darkColorScheme MaterialTheme wrapper) so isSystemInDarkTheme() returns true inside the composable. Then assert resolvedStrokeColor == GeneratedTokens.color.Route.dark.best (not the OR-check).",
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN new files WHEN enforce-native-compliance.sh + ktlintCheck run + git diff inspected THEN gates exit 0 and LSMap.kt / LSMapHost.kt not modified",
      "verify": "scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck",
      "satisfied": "PASS",
      "evidence": "Cycle 4: ktlintCheck exit 0, detekt exit 0, assembleDebug BUILD SUCCESSFUL. compileDebugAndroidTestKotlin exit 0 (Truth dependency resolved correctly \u2014 com.google.truth:truth:1.4.4 publishes com.google.common.truth.Truth class, so both package coords and import are correct). LSMap.kt/LSMapHost.kt not in diff. No stub comments (For testing purposes, Bay Area offsets, real integration would clip) found in source. pathProgress genuinely clips via ceil(normalizedCoordinates.size * pathProgress) at line 240-243 with sub-segment interpolation at lines 251-257.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "path-draw progress cycles 0\u21921 over 1400ms linear with midpoint \u2248 0.5",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.path_draw_progress_cycles_at_1400ms_linear'",
      "satisfied": "PASS",
      "evidence": "Cycle 5: Behavior tests migrated to src/test/ via Robolectric. Both ac1_* tests pass via testDebugUnitTest. XML confirms 0 failures.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": "AC-1"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "head-dot alpha cycles 0\u21921\u21920 over 2800ms ease-in-out reversed",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.head_dot_breathing_cycles_at_1400ms_easeinout'",
      "satisfied": "PASS",
      "evidence": "Cycle 5: Both ac2_* tests pass via testDebugUnitTest (Robolectric). XML confirms 0 failures.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": "AC-2"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "reduced-motion path collapses both animations to static state",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.reduced_motion_collapses_to_static'",
      "satisfied": "PASS",
      "evidence": "Cycle 5: ac3_reduced_motion_keeps_path_progress_static_at_one passes via testDebugUnitTest (Robolectric). isWithin(0.001f).of(1.0f) assertions pass. XML confirms 0 failures.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": "AC-3"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "empty path renders nothing + no crash",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.empty_path_renders_nothing_without_crash'",
      "satisfied": "PASS",
      "evidence": "Cycle 4: Callback-count assertion (progressCallCount == 0) in androidTest/ passes. Source-text guard check also passes.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": "AC-4"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "stroke color resolves to LaneShadowTheme.semantic.route.best in both themes",
      "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.MapSketchAnimationLayerTest.stroke_color_resolves_to_route_best_token'",
      "satisfied": "PARTIAL",
      "evidence": "Cycle 5: Light-theme test PASSES with == comparison. Dark-theme test is test theatre \u2014 passes vacuously because it accepts isDarkTheme||isLightTheme without forcing dark mode.",
      "remediation": "Same as AC-5: force dark mode in Robolectric test so isSystemInDarkTheme() returns true; assert == GeneratedTokens.color.Route.dark.best exclusively.",
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": "AC-5"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "enforce-native-compliance.sh + ktlintCheck both exit 0; consumed components not modified",
      "verify": "scripts/tokens/enforce-native-compliance.sh && cd android && ./gradlew ktlintCheck",
      "satisfied": "PASS",
      "evidence": "Cycle 4: All gates exit 0. No stub comments, no fake offsets, no hex literals. pathProgress genuinely clips path.",
      "remediation": null,
      "last_evaluated_cycle": 5,
      "last_evaluated_commit": "703efc9f3c3728799820fb243b897852771f3c6e",
      "maps_to_ac": "AC-6"
    }
  ]
}
-->
