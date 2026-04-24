<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ATM-12-android — LSMap Android Implementation on the Copper Theme
================================================================================

TASK_TYPE:  FEATURE
STATUS:     🔄 NEEDS_REMEDIATION
PRIORITY:   P0
EFFORT:     XL
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   360 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   05-uc-atm.md (UC-ATM-13)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 complete · 1/7 complete · reopened 2026-04-24 after red-hat review

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSMap Android renders production Mapbox maps on the Copper theme with Copper Studio styles, multi-polyline route variants, token-correct annotations, camera auto-fit, scroll isolation, and graceful fallback — no SDK types leak into public signature, no literal token committed.

--------------------------------------------------------------------------------
REOPEN NOTES — 2026-04-24
--------------------------------------------------------------------------------

Red-hat review re-opened this task because the runtime implementation is still stubbed:

- `LSMap.kt` still renders a placeholder `Box` while the real `AndroidView` + Mapbox code path remains commented out.
- `GeneratedTokens.map.style.light` / `.dark` are generated, but the runtime implementation never loads them.
- Polyline rendering, annotations, camera-fit logic, missing-token fallback, and nested-scroll isolation are not implemented.
- The Mapbox dependency/setup required by the task is not active in the runtime path, so the sandbox map stories do not prove production behavior.
- The current `LSMapTest.kt` only checks type presence and source text; it does not prove the UC-ATM-12 behavioral acceptance criteria.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST add Mapbox Maven repository and com.mapbox.maps:android dependency to android/app/build.gradle.kts before any MapView code.
- MUST generate android/app/src/main/res/values/secrets.xml from MAPBOX_ACCESS_TOKEN env via a Gradle task; file is gitignored.
- MUST preserve MapView instance across theme changes — call mapboxMap.loadStyleUri() in the AndroidView update lambda; never re-create on theme change.
- MUST apply Modifier.nestedScroll(rememberNestedScrollInteropConnection()) so outer scroll is not hijacked.
- MUST consume the Sprint 03 Copper theme surface and must not delete legacy-theme infrastructure in this sprint.
- NEVER commit a literal Mapbox access token.
- STRICTLY: Zero Mapbox SDK types (MapView, MapboxMap, CircleAnnotation, LineLayer) in public LSMap composable signature — all hidden inside AndroidView factory lambda.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] AC-1: LSMap signature matches UC-ATM-11 contract exactly (PRIMARY)
- [ ] AC-2: Mapbox style URL loads from GeneratedTokens.map.style.light/.dark — FAIL: runtime Mapbox implementation is commented out and never calls `loadStyleUri(GeneratedTokens.map.style.*)` (android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:45)
- [ ] AC-3: Multi-polyline rendering with token-correct colors + widths — FAIL: polyline rendering is not implemented (android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:45)
- [ ] AC-4: Annotations at spec-correct sizes — FAIL: annotation rendering is not implemented (android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:45)
- [ ] AC-5: CameraFit.Polylines computes union bounds with 16dp padding — FAIL: camera fitting is not implemented (android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:45)
- [ ] AC-6: Missing token renders LSGlassPanel fallback without crash — FAIL: LSMap renders only a placeholder Box in runtime mode; no LSGlassPanel fallback path exists (android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:62)
- [ ] AC-7: Scroll isolation inside LazyColumn — FAIL: no nested-scroll interop or isolation behavior is implemented (android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:45)
- [ ] All 9 sandbox stories compile and render — PARTIAL: stories exist, but runtime map rendering remains stubbed (android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:45)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Public signature matches UC-ATM-11 contract [PRIMARY]
  GIVEN: UC-ATM-11 canonical Kotlin signature
  WHEN:  LSMap.kt is compiled
  THEN:  @Composable fun LSMap(mode, camera, cameraFit, polylines, annotations, showFavorites, onTap) compiles; no Mapbox SDK type in signature
  VERIFY: cd android && ./gradlew :app:compileDebugKotlin
  TDD_STATE: none
  TEST_FILE: android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt
  TEST_FUNCTION: (compile-time assertion)

AC-2: Style URL loads from tokens; theme toggle reloads in-place
  GIVEN: ALIGN-02-android added GeneratedTokens.map.style.light/.dark
  WHEN:  sandbox theme toggles light→dark
  THEN:  AndroidView update lambda calls mapboxMap.loadStyleUri(GeneratedTokens.map.style.dark) on existing MapView; no new AndroidView composed; LSMapStyleKey semantics reflect new URL
  VERIFY: grep -n 'loadStyleUri\|loadStyleURI' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt
  TEST_FUNCTION: theme_change_reloads_style_in_place

AC-3: Multi-polyline rendering uses route tokens
  GIVEN: Three PolylineData with .best/.alt1/.alt2; GeneratedTokens.color.Route.*; sizing.stroke.md = 2.dp
  WHEN:  LSMap renders with three polylines
  THEN:  LSMapPolylineColorsKey returns [route.best, route.alt1, route.alt2]; LSMapStrokeWidthKey = 2.dp; no Color(0x) in polyline code path
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSMapTest.three_polylines_use_token_colors'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt
  TEST_FUNCTION: three_polylines_use_token_colors

AC-4: Annotations at spec-correct sizes
  GIVEN: map spec: start=14dp, end=18dp outer/6dp inner, waypoint=12dp
  WHEN:  LSMap renders with one Annotation per AnnotationKind
  THEN:  LSMapAnnotationSizesKey returns {start=14.dp, endOuter=18.dp, endInner=6.dp, waypoint=12.dp}; fills from GeneratedTokens.color.Status.*
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSMapTest.annotations_render_at_spec_sizes'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt
  TEST_FUNCTION: annotations_render_at_spec_sizes

AC-5: CameraFit.Polylines union bounds
  GIVEN: CameraFit.Polylines(padding) with spacing.4 = 16dp; motion.duration.cameraEase = 400ms
  WHEN:  LSMap renders with cameraFit=Polylines and two polylines
  THEN:  easeCamera called with padding=16dp on all sides, duration=400ms; LSMapCameraFitKey = 'polylines'
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSMapTest.camera_fit_polylines_uses_token_padding'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt
  TEST_FUNCTION: camera_fit_polylines_uses_token_padding

AC-6: Missing-token fallback, no crash
  GIVEN: R.string.mapbox_access_token is blank
  WHEN:  LSMap composes with blank token
  THEN:  LSGlassPanel with LSIcon + 'Map unavailable' caption rendered; no MapView instantiated; no exception; LSMapErrorKey = 'missingToken'
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSMapTest.missing_token_shows_glass_panel_fallback'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt
  TEST_FUNCTION: missing_token_shows_glass_panel_fallback

AC-7: Scroll isolation in LazyColumn
  GIVEN: LSMap Interactive wrapped in LazyColumn; Modifier.nestedScroll(rememberNestedScrollInteropConnection()) applied
  WHEN:  vertical swipe over map
  THEN:  LazyColumn scrolls; map does not pan vertically; LSMapScrollIsolatedKey = true
  VERIFY: grep 'nestedScroll\|rememberNestedScrollInteropConnection' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt
  TDD_STATE: none
  TEST_FILE: android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt
  TEST_FUNCTION: (grep-based assertion)

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | LSMapTest.three_polylines_use_token_colors passes: best=EE7C2B, alt1=4D8470, alt2=6B7B8F | AC-3 | ./gradlew :app:test --tests '*.LSMapTest.three_polylines_use_token_colors' |
| TC-2 | LSMapTest.annotations_render_at_spec_sizes passes: start=14/end=18/6/waypoint=12 | AC-4 | ./gradlew :app:test --tests '*.LSMapTest.annotations_render_at_spec_sizes' |
| TC-3 | LSMapTest.missing_token_shows_glass_panel_fallback passes: no MapView created | AC-6 | ./gradlew :app:test --tests '*.LSMapTest.missing_token_shows_glass_panel_fallback' |
| TC-4 | LSMapTest.network_unavailable_shows_glass_panel_fallback passes | AC-6 | ./gradlew :app:test --tests '*.LSMapTest.network_unavailable_shows_glass_panel_fallback' |
| TC-5 | LSMap.kt contains zero raw Color(0x literals in polyline/annotation code | AC-3 | grep -n 'Color(0x' LSMap.kt \| grep -v '//' \| wc -l |
| TC-6 | LSMap.kt calls rememberNestedScrollInteropConnection for scroll isolation | AC-7 | grep -c 'nestedScrollInteropConnection' LSMap.kt |
| TC-7 | LSMap.kt has no hardcoded mapbox:// URL outside GeneratedTokens references | AC-2 | grep -n 'mapbox://styles' LSMap.kt \| grep -v 'Tokens\.' \| wc -l |
| TC-8 | LSMapStories.kt defines exactly 9 stories matching iOS parity manifest | AC-1 | grep -c 'Story(' LSMapStories.kt |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt (NEW) — MapMode, CameraPosition, CameraFit, PolylineData, Annotation, AnnotationKind, RouteVariant, MapError
- android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt (NEW)
- android/app/build.gradle.kts (MODIFY) — Mapbox dep + secrets Gradle task
- android/settings.gradle.kts (MODIFY) — Mapbox Maven repo
- android/app/src/main/res/values/secrets.xml (NEW, gitignored)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt (MODIFY) — register LSMapStories.all

writeProhibited:
- .spec/design/system/atoms/map/** — read-only
- tokens/platforms/kotlin/** — ALIGN-02-android scope
- android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt — reuse, do not modify
- android/app/src/release/** — release variant untouched

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Route all Mapbox SDK calls inside AndroidView factory/update lambdas
- Hide SDK types from public signature
- Diff polylines by layer ID in updateUIView to avoid flicker

⚠️ Ask First:
- Pinning a Mapbox SDK version not documented in UC-ATM-11 reference
- Adding fixture scenarios beyond route_preview_single, route_results_three_alts, route_preview_long_coastal

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/build.gradle.kts (MODIFY): Mapbox dep + secrets task
- android/settings.gradle.kts (MODIFY): Mapbox Maven
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt (NEW)
- tokens/sandbox/fixtures/routes.fixtures.json (NEW if not created by UC-ATM-11)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/atoms/map/README.md [PRIMARY PATTERN]
   - Lines: all
   - Focus: Canonical LSMap spec — contract types, token table, Android implementation section, story list, quality gates

2. android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt
   - Lines: 1-50
   - Focus: Error fallback composable + SemanticsPropertyKey pattern

3. android/app/src/debug/java/com/laneshadow/sandbox/stories/LSButtonStories.kt
   - Lines: 1-140
   - Focus: Story registration pattern to replicate for LSMapStories

4. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
   - Lines: 73-110 (after ALIGN-02-android)
   - Focus: GeneratedTokens.color.Route, color.Status, sizing.stroke, map.style constants

5. android/app/build.gradle.kts
   - Lines: 1-119
   - Focus: Where to add Mapbox Maven repo, dependency, secrets generation Gradle task

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/atoms/map/map.html, .spec/design/system/atoms/map/README.md

Interaction notes:
- REQUIRED READING: .spec/design/system/atoms/map/README.md (entire file, incl. Android section lines 199-218 and quality gates 299-308)
- Token strategy: polyline color from GeneratedTokens.color.Route.*; stroke width from sizing.stroke.md; style URLs from map.style.*; annotation sizes from spec constants
- secrets.xml Gradle task: generateSecretsXml emits <resources><string name="mapbox_access_token">${env.MAPBOX_ACCESS_TOKEN ?: ""}</string></resources>; preBuild.dependsOn(generateSecretsXml)
- Story IDs: atoms.map.preview, atoms.map.interactive, atoms.map.one-polyline, atoms.map.three-alt-polylines, atoms.map.start-end-markers, atoms.map.auto-fit, atoms.map.dark-style, atoms.map.error-no-token, atoms.map.error-no-network

Pattern: AndroidView wraps MapView; SDK calls inside factory/update lambdas; public signature has zero SDK types; scroll isolation via nestedScrollInteropConnection.
Pattern source: .spec/design/system/atoms/map/README.md:199-218
Anti-pattern: Do not re-create AndroidView on theme change — call loadStyleUri() on existing MapView to avoid camera reset.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.
RED: Write failing test in LSMapTest.kt. Run `./gradlew :app:test --tests ...`. Verify FAILS (often via missing LSMap entry — the composable doesn't exist yet).
GREEN: Add minimal LSMap + LSMapTypes implementation to pass the test. Gradle sync + compile. Run test. Verify PASSES.
REFACTOR: Extract helpers (PolylineLayerDiffer, AnnotationRenderer); tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (App compiles): `./gradlew :app:compileDebugKotlin` exits 0.
Gate 2 (LSMap tests): `./gradlew :app:test --tests '*.LSMapTest'` passes 0 failures.
Gate 3 (Full suite): `./gradlew :app:test` passes 0 failures.
Gate 4 (No raw Color): `grep -n 'Color(0x' LSMap.kt | grep -v '//' | wc -l` = 0.
Gate 5 (No literal mapbox URL): `grep 'mapbox://styles' LSMap.kt | grep -v 'Tokens' | wc -l` = 0.
Gate 6 (9 stories): `grep -c 'Story(' LSMapStories.kt` = 9.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ATM-11 (contract + fixtures), ALIGN-02-android (Copper map/style tokens)
Blocks:     ALIGN-04-android (sandbox registration depends on LSMapStories on the new theme)
Parallel:   UC-ATM-12-ios (iOS equivalent)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN UC-ATM-11 canonical Kotlin signature WHEN LSMap.kt compiled THEN seven-parameter signature compiles with no Mapbox SDK types in public surface", "verify": "cd android && ./gradlew :app:compileDebugKotlin" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN GeneratedTokens.map.style.* WHEN sandbox theme toggles THEN loadStyleUri called on existing MapView; no AndroidView recreation", "verify": "grep -n 'loadStyleUri\\|loadStyleURI' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN three PolylineData items WHEN LSMap renders THEN LSMapPolylineColorsKey returns token-correct colors; stroke width = 2.dp; no raw hex", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.three_polylines_use_token_colors'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN one Annotation per AnnotationKind WHEN LSMap renders THEN LSMapAnnotationSizesKey returns start=14dp, endOuter=18dp, endInner=6dp, waypoint=12dp with status token fills", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.annotations_render_at_spec_sizes'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN CameraFit.Polylines + two polylines WHEN LSMap renders THEN easeCamera called with padding=16dp, duration=400ms; LSMapCameraFitKey = 'polylines'", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.camera_fit_polylines_uses_token_padding'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN blank mapbox_access_token WHEN LSMap composes THEN LSGlassPanel rendered, no MapView instantiated, no exception, LSMapErrorKey = 'missingToken'", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.missing_token_shows_glass_panel_fallback'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSMap Interactive in LazyColumn WHEN vertical swipe over map THEN outer scrolls; Modifier.nestedScroll(rememberNestedScrollInteropConnection()) present", "verify": "grep 'nestedScroll\\|rememberNestedScrollInteropConnection' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSMapTest.three_polylines_use_token_colors passes: best=EE7C2B, alt1=4D8470, alt2=6B7B8F", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.three_polylines_use_token_colors'" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSMapTest.annotations_render_at_spec_sizes passes: start=14.dp, endOuter=18.dp, endInner=6.dp, waypoint=12.dp", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.annotations_render_at_spec_sizes'" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSMapTest.missing_token_shows_glass_panel_fallback passes: no MapView created, LSMapErrorKey = 'missingToken'", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.missing_token_shows_glass_panel_fallback'" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSMapTest.network_unavailable_shows_glass_panel_fallback passes: LSMapErrorKey = 'networkUnavailable'", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:test --tests '*.LSMapTest.network_unavailable_shows_glass_panel_fallback'" },
    { "id": "TC-5", "type": "test_criterion", "description": "LSMap.kt contains zero raw Color(0x literals in polyline/annotation rendering code paths", "maps_to_ac": "AC-3", "verify": "grep -n 'Color(0x' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt | grep -v '//' | wc -l" },
    { "id": "TC-6", "type": "test_criterion", "description": "LSMap.kt contains a call to rememberNestedScrollInteropConnection for scroll isolation", "maps_to_ac": "AC-7", "verify": "grep -c 'nestedScrollInteropConnection' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt" },
    { "id": "TC-7", "type": "test_criterion", "description": "LSMap.kt has no hardcoded mapbox:// URL strings outside GeneratedTokens references", "maps_to_ac": "AC-2", "verify": "grep -n 'mapbox://styles' android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt | grep -v 'Tokens\\.' | wc -l" },
    { "id": "TC-8", "type": "test_criterion", "description": "LSMapStories.kt defines exactly 9 stories matching iOS parity manifest story IDs", "maps_to_ac": "AC-1", "verify": "grep -c 'Story(' android/app/src/debug/java/com/laneshadow/sandbox/stories/LSMapStories.kt" }
  ]
}
-->
