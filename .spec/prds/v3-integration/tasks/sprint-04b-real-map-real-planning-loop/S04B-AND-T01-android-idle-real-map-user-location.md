================================================================================
TASK: S04B-AND-T01 - IdleScreen real Mapbox map centred on user (FusedLocation)
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.location.* --tests com.laneshadow.ui.idle.*
  e2e:       cd android && ./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreen*
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/6 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

After login, `IdleScreen.kt` renders a real interactive Mapbox map centred on the rider's actual current location obtained from `FusedLocationProviderClient.getCurrentLocation`. The hardcoded `CameraPosition(center = LatLng(37.8104, -122.4752), zoom = 10.8)` is removed. Permission denied falls back to the rider's `lastKnownCoordinate` cached in `AppStateRepository`; with neither available, the camera defaults to the geographic centre of the contiguous U.S. (`LatLng(39.8283, -98.5795)`) at zoom 4 — never the SF Bay coordinates. Camera eases into the user's coordinate via Mapbox's existing `easeTo` animation when the fix arrives.

This task is **camera + permission + provider plumbing only**. Map gestures + locate-me control are S04B-AND-T02. Places autocomplete is S04B-AND-T03. NEW button + greeting cleanup is S04B-AND-T04.

Sandbox stories under `app/src/debug/.../sandbox/stories/Sprint04IdleStories.kt` continue to render the existing `IdleScreen` for design review — no change there.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST replace `CameraPosition(center = LatLng(37.8104, -122.4752), zoom = 10.8)` at `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt:103-106` with a `cameraPosition` value pulled from `IdleUiState`
- MUST add `com.google.android.gms:play-services-location:21.3.0` (or current stable) to `android/app/build.gradle.kts`
- MUST add `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />` and `ACCESS_COARSE_LOCATION` to `android/app/src/main/AndroidManifest.xml`
- MUST request runtime permission via `rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions())` from `IdleRoute.kt`; trigger the launcher on first composition when `IdleViewModel.locationStatus == .notDetermined`
- MUST use `FusedLocationProviderClient.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, cancellationToken)` for the one-shot fix; fall back to `lastLocation` when `getCurrentLocation` returns null
- MUST persist a fresh fix on `AppStateRepository.setLastKnownCoordinate(LatLng)` (extend the existing DataStore-backed `AppPreferences` schema with a nullable `lastKnownLat` + `lastKnownLon` pair); subsequent IdleViewModel mounts hydrate from this cache so the map shows last-known immediately while the new fix is awaited
- MUST default the camera to `CameraPosition(center = riderLocation, zoom = 12.0)` when a fix is available; on denied + no cache, fall back to `CameraPosition(center = LatLng(39.8283, -98.5795), zoom = 4.0)` (U.S. centre — NEVER the SF Bay coordinate)
- MUST animate camera transitions through state mutation only; the existing `configureMapView` in `LSMap.kt` calls `mapView.mapboxMap.setCamera(...)` on every recomposition — verify (and document) that consecutive calls produce a smooth transition; if `setCamera` jumps hard, switch to `mapView.mapboxMap.flyTo(...)` or `easeTo(...)` with `MapAnimationOptions.duration(400L)`
- MUST keep `LSMap(mode = MapMode.Interactive, ...)` — never switch to Preview on production IdleScreen
- MUST keep all existing `testTag(...)` strings on overlays (`"greeting-overlay"`, `"chat-input"`, `"ls-topbar"`) so existing instrumented tests pass
- MUST NOT use `LocationManager.getLastKnownLocation()` (returns stale fixes; deprecated for Mapbox-style use cases)
- MUST NOT block the main thread waiting for the location fix — render the map at the fallback coordinate first; ease to the real fix via state recomposition once delivered
- MUST NOT inject `Activity` directly into `FusedLocationLocationProvider`; use `@ApplicationContext` Hilt injection
- MUST NOT subscribe to continuous location updates — one-shot per IdleScreen entry only (battery + scope)
- MUST NOT hardcode `LatLng(37.7749, -122.4194)` or `LatLng(37.8104, -122.4752)` anywhere in production source after this task
- DESIGN reference: `.spec/design/system/views/idle-screen/idle-screen.html` § map slot (S01); `.spec/design/system/views/idle-screen/README.md` § Composes table — `org-map-layer__map` slot must render the live Mapbox style URI per `LSMap.kt`'s existing light/dark resolution

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `IdleScreen.kt` reads `cameraPosition` from `IdleScreenState`; no `LatLng(37.8104, -122.4752)` literal anywhere in production source (AC-1 PRIMARY)
- [ ] `FusedLocationLocationProvider` returns `RiderLocation.Available` when the underlying client returns a real fix (AC-2)
- [ ] Permission denied + no cache falls back to U.S. centre at zoom 4, NOT SF coordinates (AC-3)
- [ ] When fix arrives after fallback render, `IdleScreenState.cameraPosition` recomposes from fallback to user-fix (AC-4)
- [ ] `AppStateRepository.lastKnownCoordinate` updates on every fresh fix (AC-5)
- [ ] No raw `Color(0xFF...)` literals introduced; `./gradlew test`, `./gradlew detekt`, `./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreen*` all green (AC-6)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: IdleScreen production source contains no SF-Bay hardcoded camera [PRIMARY]
  GIVEN: The current state of `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt`
  WHEN:  A static-source-grep test scans the file for `37.8104` and `-122.4752` and `37.7749` and `-122.4194`
  THEN:  All four literals are absent (zero matches); the file references `state.cameraPosition` as the camera input to `LSMap(...)`

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/templates/IdleScreenSourceCleanlinessTest.kt
  TEST_FUNCTION: idleScreenSource_doesNotContainHardcodedSfBayCamera_andReadsCameraFromState

AC-2: FusedLocationLocationProvider returns Available with real fix
  GIVEN: A `FusedLocationLocationProvider` constructed with a fake `FusedLocationProviderClient` whose `getCurrentLocation` task succeeds with `Location(lat = 36.97, lon = -122.03)` (Santa Cruz)
  WHEN:  `provider.requestSingleFix()` is awaited
  THEN:  Returns `RiderLocation.Available(LatLng(36.97, -122.03))`

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/location/FusedLocationLocationProviderTest.kt
  TEST_FUNCTION: requestSingleFix_whenCurrentLocationReturned_emitsAvailable

AC-3: Permission denied + no cache falls back to U.S. centre, NOT SF
  GIVEN: An `IdleViewModel` whose injected `LocationProvider.requestSingleFix()` emits `RiderLocation.Unavailable(reason = PermissionDenied)` AND `AppStateRepository.lastKnownCoordinate.first() == null`
  WHEN:  `viewModel.state` is collected
  THEN:  `state.cameraPosition == CameraPosition(center = LatLng(39.8283, -98.5795), zoom = 4.0)`; an additional assertion `state.cameraPosition.center != LatLng(37.7749, -122.4194)` MUST also pass

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelLocationFallbackTest.kt
  TEST_FUNCTION: state_whenPermissionDeniedAndNoCache_fallsBackToUSCenter_notSanFrancisco

AC-4: Camera recomposes from fallback to user fix
  GIVEN: An `IdleViewModel` whose location provider initially emits `RiderLocation.Unavailable` (fallback) and then 200 ms later emits `RiderLocation.Available(LatLng(36.97, -122.03))`
  WHEN:  `viewModel.state` is collected for 500 ms in a `runTest` block
  THEN:  Two distinct `cameraPosition` emissions are observed: first the U.S. centre fallback (zoom 4), then `CameraPosition(center = LatLng(36.97, -122.03), zoom = 12.0)`

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelLocationFallbackTest.kt
  TEST_FUNCTION: state_whenFixArrivesAfterFallback_emitsTwoCameraPositions

AC-5: AppStateRepository.lastKnownCoordinate updates on fresh fix
  GIVEN: An `AppStateRepositoryImpl` backed by an in-memory DataStore<Preferences> with `lastKnownCoordinate == null` initially, plus an `IdleViewModel` whose location provider delivers `RiderLocation.Available(LatLng(36.97, -122.03))`
  WHEN:  `viewModel.observe...` consumes the fix and `appStateRepository.appState.first()` is awaited
  THEN:  `state.lastKnownCoordinate == LatLng(36.97, -122.03)`; a fresh `IdleViewModel` constructed against the same repository hydrates `cameraPosition.center` from this cache before requesting a new fix

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     android/app/src/test/java/com/laneshadow/services/AppStateRepositoryLastKnownCoordinateTest.kt
  TEST_FUNCTION: setLastKnownCoordinate_persistsAndIsConsumedByNextIdleViewModel

AC-6: Token compliance + gates green
  GIVEN: The post-implementation source tree
  WHEN:  `./gradlew test`, `./gradlew detekt`, `./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreen*` run AND `grep -rn "Color(0x" android/app/src/main/java/com/laneshadow/ui/idle/ android/app/src/main/java/com/laneshadow/services/location/` returns zero matches
  THEN:  All three gradle commands exit 0; grep returns zero matches; manifest contains both ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION

  TDD_STATE:     RED replay + GREEN evidence
  TEST_FILE:     N/A (gradle gates)
  TEST_FUNCTION: gradle_test_detekt_instrumented_pass

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/AndroidManifest.xml (MODIFY — add ACCESS_FINE_LOCATION + ACCESS_COARSE_LOCATION)
- android/app/build.gradle.kts (MODIFY — add play-services-location dependency)
- android/app/src/main/java/com/laneshadow/services/location/LocationProvider.kt (NEW — interface + sealed RiderLocation type + national-bounds fallback constant)
- android/app/src/main/java/com/laneshadow/services/location/FusedLocationLocationProvider.kt (NEW — Hilt @Singleton impl using `getCurrentLocation` + `lastLocation` fallback + CancellationTokenSource)
- android/app/src/main/java/com/laneshadow/di/LocationModule.kt (NEW — Hilt @Module providing FusedLocationProviderClient + binding LocationProvider)
- android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt (MODIFY — extend AppPreferences with lastKnownLat/lastKnownLon; add setLastKnownCoordinate / clearLastKnownCoordinate)
- android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt (MODIFY — inject LocationProvider + AppStateRepository; expose `cameraPosition: CameraPosition`, `locationStatus: LocationStatus` in state)
- android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt (MODIFY — add `cameraPosition: CameraPosition`, `locationStatus: LocationStatus`)
- android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt (MODIFY — wire RequestMultiplePermissions launcher; trigger fix request on resume; pass cameraPosition into IdleScreen via the production state class — note: state class plumbing here is the minimum needed for AC-1; broader mockprovider removal is NOT in scope for Sprint 04-B per the narrowed scope)
- android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt (MODIFY — accept cameraPosition prop and pass to LSMap; remove the LatLng(37.8104, -122.4752) literal)
- android/app/src/test/java/com/laneshadow/services/location/FusedLocationLocationProviderTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelLocationFallbackTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/services/AppStateRepositoryLastKnownCoordinateTest.kt (NEW or extend existing AppStateRepositoryTest.kt)
- android/app/src/test/java/com/laneshadow/ui/templates/IdleScreenSourceCleanlinessTest.kt (NEW)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt — already correct; do NOT modify
- android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt — public contract is stable
- android/app/src/main/java/com/laneshadow/ui/templates/PlanningScreen.kt — out of Sprint 04-B scope (future initiative)
- android/app/src/main/java/com/laneshadow/ui/templates/RouteResultsScreen.kt — out of scope
- android/app/src/main/java/com/laneshadow/ui/templates/RouteDetailsScreen.kt — out of scope
- android/app/src/main/java/com/laneshadow/ui/templates/ErrorScreen.kt — out of scope
- android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt — covered by S04B-AND-T04 (NEW button task)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt — covered by S04B-AND-T03 (Places task)
- ios/** — parallel iOS planner
- server/convex/** — parallel Convex planner

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

Always:
- Use `Hilt @Singleton` + constructor injection for `FusedLocationLocationProvider`
- Use `kotlinx.coroutines.tasks.await` to bridge Google Play Services `Task<Location>` to suspend functions
- Inject `@ApplicationContext` (NOT `Activity`) into `FusedLocationLocationProvider`
- Use `LocationServices.getFusedLocationProviderClient(context)` — do not subclass
- National-bounds fallback constant: `val NATIONAL_BOUNDS_CAMERA = CameraPosition(center = LatLng(39.8283, -98.5795), zoom = 4.0)` exposed from `LocationProvider.kt`
- Permission launcher fires once per `IdleScreen` entry; if permanently denied, ViewModel stays on cached or U.S. centre fallback
- Use design tokens for any new spacing / colors (none should be needed — this task adds no UI surface beyond the camera value)

Ask First:
- Adding any other Google Play Services dependency beyond `play-services-location`
- Introducing background-location permission (out of scope)
- Renaming any public state-class fields used by sandbox stories

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- `LocationProvider.kt` (NEW): `interface LocationProvider { suspend fun requestSingleFix(): RiderLocation }` + `sealed interface RiderLocation { data class Available(val latLng: LatLng) : RiderLocation; data class Unavailable(val reason: Reason) : RiderLocation }` + `enum class Reason { PermissionDenied, NoFixAvailable, Timeout }` + `val NATIONAL_BOUNDS_CAMERA: CameraPosition`
- `FusedLocationLocationProvider.kt` (NEW): @Singleton @Inject implementation using `getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, ...)` with `lastLocation` fallback and `CancellationTokenSource` lifecycle managed via `kotlinx.coroutines.suspendCancellableCoroutine`
- `LocationModule.kt` (NEW): @Module @InstallIn(SingletonComponent::class) `@Provides @Singleton fun provideFusedLocationProviderClient(@ApplicationContext context): FusedLocationProviderClient` + `@Binds abstract fun bindLocationProvider(impl: FusedLocationLocationProvider): LocationProvider`
- `AppStateRepository.kt` (MODIFY): extend `AppPreferences` data class with `lastKnownLat: Double?` + `lastKnownLon: Double?`; add `suspend fun setLastKnownCoordinate(LatLng)` + `suspend fun clearLastKnownCoordinate()`
- `IdleViewModel.kt` (MODIFY): inject `LocationProvider` + `AppStateRepository`; new internal helper `loadCameraPosition()` runs in `init` block — hydrates from cache, then requests fresh fix; new `fun onLocationPermissionResolved(granted: Boolean)` driven by Compose launcher
- `IdleUiState.kt` (MODIFY): `val cameraPosition: CameraPosition = NATIONAL_BOUNDS_CAMERA`, `val locationStatus: LocationStatus = LocationStatus.NotDetermined`
- `IdleRoute.kt` (MODIFY): `rememberLauncherForActivityResult(RequestMultiplePermissions())`; LaunchedEffect(Unit) requests permission, then ViewModel handles the resolved boolean; pass `state.cameraPosition` into `IdleScreen(...)` via the existing state-bridge function
- `IdleScreen.kt` (MODIFY): replace literal `CameraPosition(center = LatLng(37.8104, -122.4752), zoom = 10.8)` with `state.cameraPosition` consumed via the state class
- 4 test files (3 unit + 1 source-purity unit)
- TDD evidence under `.tmp/S04B-AND-T01/tdd-evidence.json`

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

## FOR EACH ACCEPTANCE CRITERION:

### RED PHASE
  READ:   AC, existing `IdleViewModelTest.kt`, `LSMap.kt` contract
  WRITE:  ONE test exercising GIVEN-WHEN-THEN
  RUN:    cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.{class}.{function}
  VERIFY: Test FAILS — capture output

### GREEN PHASE
  READ:   Failing test, AC, `LSMap.kt`, `IdleViewModel.kt`
  WRITE:  MINIMAL Kotlin to make test pass
  RUN:    cd android && ./gradlew :app:testDebugUnitTest
  VERIFY: Test PASSES

### REFACTOR PHASE
  READ:   Implementation
  WRITE:  Improvements
  RUN:    cd android && ./gradlew test && ./gradlew detekt
  VERIFY: All green

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt [PRIMARY MAP CONTRACT]
   - Lines: 1-378
   - Focus: Existing `LSMap(mode, camera, polylines, ...)` signature; how `configureMapView` calls `setCamera` on every recomposition

2. android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt
   - Lines: 1-145
   - Focus: Existing `MutableStateFlow<IdleUiState>` pattern; `observeCurrentUser` / `observeSessions` existing flow-based pattern

3. android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt + android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt
   - Existing Compose entry; this is where the permission launcher composes and the camera value flows to `LSMap`

4. android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt
   - Existing DataStore-backed pattern; AppPreferences shape

5. https://developer.android.com/develop/sensors-and-location/location/retrieve-current
   - `getCurrentLocation` with `Priority.PRIORITY_HIGH_ACCURACY` and `CancellationTokenSource`

6. .spec/design/system/views/idle-screen/idle-screen.html § map slot S01
   - The map background spec — confirm the live Mapbox style URI is correct (already handled by LSMap.kt)

7. .spec/design/system/views/idle-screen/README.md § Composes table
   - `org-map-layer__map` slot — paper background + contour SVG in design; production substitutes the live Mapbox style

8. .spec/prds/v3-integration/tasks/sprint-04b-real-map-real-planning-loop/S04B-IOS-T01-idlescreen-real-lsmap-user-location.md
   - Sibling iOS task — cross-platform parity on AC structure

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: TDD evidence (6 ACs)
Gate 2: `cd android && ./gradlew :app:testDebugUnitTest` exit 0
Gate 3: `cd android && ./gradlew :app:compileDebugKotlin` exit 0
Gate 4: `cd android && ./gradlew detekt` exit 0
Gate 5: `cd android && ./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreen*` exit 0
Gate 6: Token compliance — `scripts/tokens/enforce-native-compliance.sh` exit 0
Gate 7: `grep -rn "37.8104\|-122.4752\|37.7749\|-122.4194" android/app/src/main/java/com/laneshadow/ui/idle/ android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` returns ZERO matches
Gate 8: `grep -E "ACCESS_FINE_LOCATION|ACCESS_COARSE_LOCATION" android/app/src/main/AndroidManifest.xml` returns BOTH lines

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: (none — runs independently)
Blocks: S04B-AND-T02 (gestures + locate-me control rely on the cameraPosition / locationStatus state surfaces this task ships), S04B-AND-T03 (Places dropdown in chat input — uses the same IdleScreen surface that this task touches; coordinate file edits via worktree to avoid merge conflicts), S04B-AND-T04 (NEW button uses the IdleViewModel hooks this task wires)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "S04B-AND-T01",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "IdleScreen.kt source contains no SF-Bay hardcoded camera; reads camera from state", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.templates.IdleScreenSourceCleanlinessTest.idleScreenSource_doesNotContainHardcodedSfBayCamera_andReadsCameraFromState", "satisfied": false, "evidence": ".tmp/S04B-AND-T01/tdd-evidence.json#AC-1", "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "FusedLocationLocationProvider returns Available with real fix", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.location.FusedLocationLocationProviderTest.requestSingleFix_whenCurrentLocationReturned_emitsAvailable", "satisfied": false, "evidence": ".tmp/S04B-AND-T01/tdd-evidence.json#AC-2", "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Permission denied + no cache falls back to U.S. centre, NOT San Francisco", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelLocationFallbackTest.state_whenPermissionDeniedAndNoCache_fallsBackToUSCenter_notSanFrancisco", "satisfied": false, "evidence": ".tmp/S04B-AND-T01/tdd-evidence.json#AC-3", "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Camera recomposes from fallback to user fix", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.idle.IdleViewModelLocationFallbackTest.state_whenFixArrivesAfterFallback_emitsTwoCameraPositions", "satisfied": false, "evidence": ".tmp/S04B-AND-T01/tdd-evidence.json#AC-4", "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "AppStateRepository persists lastKnownCoordinate and is consumed by next IdleViewModel", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.AppStateRepositoryLastKnownCoordinateTest.setLastKnownCoordinate_persistsAndIsConsumedByNextIdleViewModel", "satisfied": false, "evidence": ".tmp/S04B-AND-T01/tdd-evidence.json#AC-5", "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "All gates green; no Color(0x...) literals; manifest contains both location permissions", "verify": "cd android && ./gradlew test && ./gradlew detekt && ./gradlew connectedAndroidTest --tests com.laneshadow.ui.templates.IdleScreen*", "satisfied": false, "evidence": ".tmp/S04B-AND-T01/tdd-evidence.json#AC-6", "remediation": null}
  ]
}
-->
================================================================================
