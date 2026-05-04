================================================================================
TASK: S04B-AND-T02 - All map controls work + glass locate-me FAB
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSMapGestures* --tests com.laneshadow.ui.idle.LocateMe*
  e2e:       cd android && ./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreenGestures* --tests com.laneshadow.ui.molecules.LSLocateMeButton*
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/5 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Every Mapbox-supported gesture works on the IdleScreen map: pan, pinch zoom, double-tap zoom, two-finger rotate, two-finger pitch. A glass-styled "locate-me" floating control composites over the bottom-right of the map (above the chat input but below the bottom overlay z-stack) and re-centres the camera on the rider's current fix with a 400 ms ease.

This task closes the "interactive map" half of Sprint 04-B's first outcome (S04B-AND-T01 ships the camera; this task ships the gestures + locate-me FAB).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST verify and document that `LSMap(mode = MapMode.Interactive, ...)` produces an `MapView` with `gestures.scrollEnabled = true`, `pinchEnabled = true`, `doubleTapToZoomInEnabled = true`, `rotateEnabled = true`, `pitchEnabled = true` — Mapbox Android SDK 11.x defaults are typically all true, but the audit must confirm via `mapView.gestures.gesturesManager` and patch any plugin-imposed restriction
- MUST audit the `IdleScreen.kt` overlay stack for any parent that consumes pointer events that should reach the map — `LSMapLayer.kt` uses `nestedScroll(rememberNestedScrollInteropConnection())`; verify that the chat input overlay does NOT cover the bottom 50% of the map at all times (today's stack overflows when the keyboard opens; the FAB must remain reachable)
- MUST add a new molecule `LSLocateMeButton` at `android/app/src/main/java/com/laneshadow/ui/molecules/LSLocateMeButton.kt` — a 48dp circular `LSGlassPanel`-wrapped icon button with `IconName.Crosshair` (or equivalent compass / locate-me glyph from the existing icon catalog); positioned via `Modifier.align(Alignment.BottomEnd)` inside an additional `LSMapLayer` slot (extend `topOverlays`/`bottomOverlays` API only if necessary — prefer adding a `floatingControls: List<GlassOverlaySlot>` slot)
- MUST tap target ≥ 48dp (Material 3 / WCAG); supply `contentDescription = "Centre map on my location"` for accessibility
- MUST animate the recentre via `mapView.mapboxMap.flyTo(CameraOptions.Builder().center(...).zoom(12.0).build(), MapAnimationOptions.mapAnimationOptions { duration(400L) })` — exact 400 ms duration matches `LSMapCameraEaseDurationMs`
- MUST trigger an immediate location-fix request when tapped if `RiderLocation` is currently `Unavailable` — re-invoke `LocationProvider.requestSingleFix()` (debounced to one call per 3 s to prevent abuse)
- MUST handle the "permission previously denied" case: tapping locate-me when permission is denied opens the system app-settings page via `Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)` (educational fallback)
- MUST keep the FAB visible on map even with the chat input expanded; verify Z-ordering with the existing `LSMapLayer` slot system (FAB sits between the map and the chat input z-band)
- MUST use ONLY theme tokens for the FAB (`theme.colors.surface.glass`, `theme.space.md`, `theme.shape.circle`); zero `Color(0xFF...)` literals
- NEVER bake the FAB into `LSMap.kt` — keep it as a separate molecule consumed via the layer slot
- NEVER call `mapView.mapboxMap.setCamera` directly from the FAB onClick — funnel through `IdleViewModel.onLocateMeTapped()` so the state path remains the source of truth

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] All 5 Mapbox gestures (pan, pinch, double-tap, rotate, pitch) work on real device — verified via instrumented gesture sequence (AC-1 PRIMARY)
- [ ] `LSLocateMeButton` molecule exists with 48dp tap target + correct contentDescription (AC-2)
- [ ] Tapping FAB while location is Available eases the camera to the user's fix at zoom 12 over 400 ms (AC-3)
- [ ] Tapping FAB while location is Unavailable triggers a fresh `requestSingleFix` (AC-4)
- [ ] Tapping FAB with denied permission opens system settings (AC-5)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: Mapbox gestures all enabled on IdleScreen [PRIMARY]
  GIVEN: An `IdleScreen` rendered into a `createAndroidComposeRule<MainActivity>()` test (real `MapView`, real Mapbox SDK)
  WHEN:  The Compose test inspects the underlying `MapView.gestures` configuration via `mapView.gestures.gesturesManager` reflection
  THEN:  All five gesture flags are true: `scrollEnabled`, `pinchScrollEnabled` / `pinchEnabled`, `doubleTapToZoomInEnabled`, `rotateEnabled`, `pitchEnabled`

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenGesturesEnabledTest.kt
  TEST_FUNCTION: idleScreen_mapView_allGesturesEnabled

AC-2: LSLocateMeButton molecule exists with correct semantics
  GIVEN: An isolated `LSLocateMeButton(onTap = {})` rendered in `createComposeRule()`
  WHEN:  The Compose semantics tree is queried for the FAB
  THEN:  A node tagged `ls-locate-me-button` exists, has `contentDescription = "Centre map on my location"`, has tap target ≥ 48dp, and is wrapped in an `LSGlassPanel` (verify via Compose semantics tag inheritance)

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSLocateMeButtonTest.kt
  TEST_FUNCTION: locateMeButton_hasCorrectSemanticsAndTapTarget

AC-3: FAB tap eases camera to user fix
  GIVEN: An `IdleViewModel` whose `LocationProvider.requestSingleFix()` returns `RiderLocation.Available(LatLng(36.97, -122.03))`; an `IdleScreen` whose map is currently at the U.S. centre fallback
  WHEN:  The locate-me FAB is tapped
  THEN:  `IdleViewModel.cameraPosition` updates to `CameraPosition(center = LatLng(36.97, -122.03), zoom = 12.0)`; the underlying `MapView` records a `flyTo` with `duration = 400L`

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelLocateMeTest.kt
  TEST_FUNCTION: onLocateMeTapped_whenAvailable_easesCameraToUserFix

AC-4: FAB tap triggers fresh fix when Unavailable
  GIVEN: An `IdleViewModel` whose initial `locationStatus = Unavailable(NoFixAvailable)` and a fake LocationProvider with a recorder for `requestSingleFix` calls
  WHEN:  The FAB is tapped
  THEN:  `LocationProvider.requestSingleFix()` was invoked exactly once (not zero, not twice) within the test scope

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelLocateMeTest.kt
  TEST_FUNCTION: onLocateMeTapped_whenUnavailable_invokesRequestSingleFix

AC-5: Denied permission tap opens settings
  GIVEN: An `IdleViewModel` whose `locationStatus = Unavailable(PermissionDenied)` and a fake `IntentLauncher` recorder
  WHEN:  The FAB is tapped
  THEN:  An Intent is launched with `action == Settings.ACTION_APPLICATION_DETAILS_SETTINGS` and `data == Uri.parse("package:com.laneshadow.app")`

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelLocateMeTest.kt
  TEST_FUNCTION: onLocateMeTapped_whenPermissionDenied_launchesAppSettings

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSLocateMeButton.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt (MODIFY — add `onLocateMeTapped()` + inject IntentLauncher abstraction)
- android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt (MODIFY — wire IntentLauncher and FAB onTap)
- android/app/src/main/java/com/laneshadow/services/IntentLauncher.kt (NEW — small abstraction over Activity.startActivity for testability)
- android/app/src/main/java/com/laneshadow/di/IntentLauncherModule.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt (MODIFY — add LocateMe FAB into the map layer's floating controls slot)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt (MODIFY only if a new `floatingControls` slot must be added — prefer reusing `bottomOverlays`)
- android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelLocateMeTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSLocateMeButtonTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenGesturesEnabledTest.kt (NEW)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt — already correct
- android/app/src/main/java/com/laneshadow/services/location/** — owned by S04B-AND-T01 (will already exist when this task lands)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt — covered by S04B-AND-T03
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt — covered by S04B-AND-T04
- ios/** — parallel iOS planner
- server/convex/** — parallel Convex planner

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

Always:
- Use design tokens (`theme.colors.surface.glass`, `theme.space.md`, `theme.shape.circle`); no raw colors
- Use `LSGlassPanel(variant = GlassVariant.Chrome)` for the FAB chrome
- Tap target ≥ 48dp via `Modifier.minimumInteractiveComponentSize()` if the visible icon is smaller
- Use `MapAnimationOptions.mapAnimationOptions { duration(400L) }` for camera animation; the constant lives in `LSMapCameraEaseDurationMs` already
- Throttle the requestSingleFix path (3 s minimum between FAB-triggered fixes) to prevent abuse — implement in `IdleViewModel`

Ask First:
- Adding a new icon glyph if `IconName.Crosshair` doesn't exist (verify the design-token-generated icon set first)
- Modifying `LSMapLayer`'s public slot API beyond an additive `floatingControls` slot
- Replacing `flyTo` with `easeTo` (Mapbox SDK has both; flyTo is parabolic, easeTo is direct — design TBD)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- `LSLocateMeButton.kt` (NEW): 48dp circular glass FAB with crosshair icon
- `IntentLauncher.kt` (NEW): `interface IntentLauncher { fun openAppSettings() }` + Hilt-bound impl
- `IdleViewModel.kt` (MODIFY): `fun onLocateMeTapped()` branches on `locationStatus`: Available → emit fresh camera; Unavailable(NoFixAvailable) → re-invoke `requestSingleFix`; Unavailable(PermissionDenied) → `intentLauncher.openAppSettings()`
- `IdleRoute.kt` (MODIFY): pass `viewModel::onLocateMeTapped` to FAB onTap
- `IdleScreen.kt` (MODIFY): mount `LSLocateMeButton` inside the map layer (e.g., as a child of `bottomOverlays` with `Modifier.align(Alignment.BottomEnd)`)
- 3 test files (1 unit + 2 instrumented)
- TDD evidence under `.tmp/S04B-AND-T02/tdd-evidence.json`

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH AC:

### RED PHASE
  WRITE: failing test
  RUN:   cd android && ./gradlew :app:testDebugUnitTest OR connectedAndroidTest
  VERIFY: FAILS

### GREEN PHASE
  WRITE: minimal Kotlin/Compose to pass
  VERIFY: PASSES

### REFACTOR
  RUN:   ./gradlew test && ./gradlew detekt && ./gradlew connectedAndroidTest
  VERIFY: green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt:186-209
   - `configureMapView` — how the existing `setCamera` flows; understand to introduce `flyTo`

2. android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt:121
   - `LSMapCameraEaseDurationMs = 400` — constant to reuse

3. android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt
   - Slot system; understand topOverlays/bottomOverlays signatures before adding `floatingControls`

4. https://docs.mapbox.com/android/maps/guides/gestures/
   - Mapbox Android gestures plugin reference

5. https://docs.mapbox.com/android/maps/api/11.0.0/mapbox-maps-android/com.mapbox.maps/-mapbox-map/fly-to.html
   - `flyTo` + `MapAnimationOptions`

6. android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt
   - Glass surface primitive — wrap the FAB

7. .spec/design/system/views/idle-screen/idle-screen.html
   - Confirm the design HTML does NOT show a competing FAB; if it does, render to spec

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: TDD evidence (5 ACs)
Gate 2: `./gradlew :app:testDebugUnitTest` exit 0
Gate 3: `./gradlew detekt` exit 0
Gate 4: `./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreenGestures* --tests com.laneshadow.ui.molecules.LSLocateMeButton*` exit 0
Gate 5: `grep -rn "Color(0x" android/app/src/main/java/com/laneshadow/ui/molecules/LSLocateMeButton.kt` returns zero
Gate 6: `grep -rn "mapView.mapboxMap.setCamera\|mapView.mapboxMap.flyTo" android/app/src/main/java/com/laneshadow/ui/molecules/LSLocateMeButton.kt` returns zero (FAB does NOT call MapView directly; routes through ViewModel)

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: S04B-AND-T01 (consumes `LocationProvider`, `IdleUiState.cameraPosition`, `IdleUiState.locationStatus`)
Blocks: (none — leaf task)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "S04B-AND-T02",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "All 5 Mapbox gestures enabled on IdleScreen", "verify": "cd android && ./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreenGesturesEnabledTest.idleScreen_mapView_allGesturesEnabled", "satisfied": false, "evidence": ".tmp/S04B-AND-T02/tdd-evidence.json#AC-1", "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "LSLocateMeButton has correct semantics and 48dp tap target", "verify": "cd android && ./gradlew connectedAndroidTest --tests com.laneshadow.ui.molecules.LSLocateMeButtonTest.locateMeButton_hasCorrectSemanticsAndTapTarget", "satisfied": false, "evidence": ".tmp/S04B-AND-T02/tdd-evidence.json#AC-2", "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "FAB tap when Available eases camera with 400 ms duration", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelLocateMeTest.onLocateMeTapped_whenAvailable_easesCameraToUserFix", "satisfied": false, "evidence": ".tmp/S04B-AND-T02/tdd-evidence.json#AC-3", "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "FAB tap when Unavailable triggers fresh requestSingleFix", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelLocateMeTest.onLocateMeTapped_whenUnavailable_invokesRequestSingleFix", "satisfied": false, "evidence": ".tmp/S04B-AND-T02/tdd-evidence.json#AC-4", "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "FAB tap with denied permission opens app settings", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelLocateMeTest.onLocateMeTapped_whenPermissionDenied_launchesAppSettings", "satisfied": false, "evidence": ".tmp/S04B-AND-T02/tdd-evidence.json#AC-5", "remediation": null}
  ]
}
-->
================================================================================
