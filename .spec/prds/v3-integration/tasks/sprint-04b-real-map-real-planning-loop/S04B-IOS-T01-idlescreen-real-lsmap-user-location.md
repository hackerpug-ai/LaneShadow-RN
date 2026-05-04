================================================================================
TASK: S04B-IOS-T01 - Real LSMap on IdleScreen with CoreLocation user-centred camera
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M (≤180 min)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Features/Idle/IdleScreenWiringTests -only-testing:LaneShadowTests/Services/UserLocationProviderTests
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/6 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

After login, IdleScreen renders an interactive Mapbox `LSMap` (not `LSPaperMap`) centred on the rider's actual current location supplied by `CLLocationManager`. The hardcoded SF camera and the `LSPaperMap(...)` call are removed from the production template. Permission denial falls back to a `lastKnownCoordinate` persisted on `AppState`; if neither a fresh fix nor a cached coordinate exists, a sensible default region renders (NOT San Francisco). The light / dark Mapbox style URI is selected automatically by the existing `LSMap` from `colorScheme`. Sandbox stories under `Sandbox/Stories/...` continue to use `LSPaperMap` for design reference.

This task is **map host + permissions + camera only**. Map gestures verification + locate-me control = T02. Places autocomplete = T03. TopBar / NEW button / Good-morning-line removal = T04.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- DESIGN authority: `.spec/design/system/views/idle-screen/idle-screen.html` (S01 phone frame: lines 185-460); `.spec/design/system/views/idle-screen/README.md` § Composes — the production map slot uses the LaneShadow Mapbox style URI (`mapbox://styles/laneshadow/clxwarm01` light / `clxnight02` dark, see `LSMap.swift:120-121`), not the paper substrate
- MUST replace `LSPaperMap(overlayStyle: .contours, showPins: ...)` in `ios/LaneShadow/Views/Templates/IdleScreen.swift:78` with `LSMap(mode: .interactive, camera: <user-location camera>, ...)` — `mode: .interactive` is required so T02's gesture verification passes
- MUST add a `UserLocationProvider` service (`ios/LaneShadow/Services/UserLocationProvider.swift`) wrapping `CLLocationManager` with `@MainActor @Observable` semantics; expose `requestWhenInUseAuthorization()`, a one-shot `currentLocation()` async method, and an authorization-status observable; protocol-driven so tests inject a fake
- MUST persist last-known coordinate on `AppState.lastKnownCoordinate: LatLng?` so re-mounts and other screens can read it without re-prompting
- MUST add `NSLocationWhenInUseUsageDescription` to `ios/LaneShadow/Info.plist` with copy `"LaneShadow uses your location to centre the map and plan rides from where you are."`
- MUST default the camera to `CameraPosition(center: <rider location>, zoom: 12)` when a fix is available; on permission denied or fix unavailable, fall back to `AppState.lastKnownCoordinate` and finally to a sentinel `LatLng(lat: 39.8283, lon: -98.5795)` (geographic centre of the contiguous U.S., NOT San Francisco) at zoom 4
- MUST animate the camera transition via SwiftUI observable state mutation so the existing 400 ms ease in `LSMapUIViewRepresentable` activates — never call `mapboxMap.setCamera` directly from outside the representable
- MUST NOT import or reference `IdleMockProvider` from `IdleScreen.swift` production code; the production initializer takes a value-typed `IdleScreenLiveState` populated by `IdleViewModel`. Sandbox stories may consume `IdleMockProvider` from a separate sandbox-tagged file under `ios/LaneShadow/Sandbox/Stories/...`
- MUST keep `accessibilityIdentifier("idlescreen-map")` attached to the `LSMap` host; this id is consumed by the map-gesture verification work in T02
- NEVER hardcode a fallback to `LatLng(37.7749, -122.4194)` — the round-4 audit explicitly flagged this; the no-cache no-fix fallback must NOT be San Francisco
- NEVER block the main thread waiting for the location fix; show the fallback coordinate immediately and animate to the real fix when delivered
- NEVER edit `ios/LaneShadow.xcodeproj/**` directly — regenerate via `scripts/ios/generate-project.sh` after touching `ios/project.yml`
- NEVER reintroduce `Color.blue` or any literal colour value (RF-31 stays closed for the lines this task touches; full RF-31 closeout is T04)

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] Production IdleScreen body renders `LSMap(mode: .interactive, ...)` and never `LSPaperMap(...)` (AC-1 PRIMARY)
- [ ] `UserLocationProvider` requests `whenInUse` authorization on first appearance and delivers a one-shot fix to `IdleViewModel.cameraPosition` (AC-2)
- [ ] On permission denied with no cached coordinate, the map shows the U.S. centre fallback at zoom 4 (no SF camera) (AC-3)
- [ ] When a real fix arrives, the camera eases to the rider coordinate at zoom 12 via observable state mutation (AC-4)
- [ ] `AppState.lastKnownCoordinate` is updated whenever a fresh location is delivered (AC-5)
- [ ] `IdleScreen.swift` production file contains zero references to `IdleMockProvider`, `MockProvider`, or `LSPaperMap` (AC-6)
- [ ] All Swift Testing tests pass; `swiftformat --lint ios/` passes; project builds for iPhone 16 simulator
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: IdleScreen production body composes interactive LSMap, never LSPaperMap [PRIMARY]
  GIVEN: IdleScreen initialised via the production initializer (IdleScreenLiveState, no MockProvider)
  WHEN:  The view body is materialised in a hosting controller
  THEN:  The composed map view's `accessibilityIdentifier("idlescreen-map")` resolves to a Mapbox-backed `LSMap` host (the `LSMapUIViewRepresentable` underlying class is found in the view tree); `LSMap` is invoked with `mode: .interactive`; no `LSPaperMap` instance exists in the production view hierarchy

  TDD_STATE:     RED — the test fails because the current body returns `LSPaperMap`
  TEST_FILE:     ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift
  TEST_FUNCTION: test_idleScreen_productionBody_composesInteractiveLSMap_notLSPaperMap

AC-2: UserLocationProvider delivers one-shot fix to IdleViewModel
  GIVEN: A `UserLocationProvider` initialised with an injected fake `CLLocationManager`
  WHEN:  `currentLocation()` is awaited and the fake manager delivers `CLLocation(lat: 36.97, lon: -122.03)` (Santa Cruz)
  THEN:  The async result is `.granted(LatLng(lat: 36.97, lon: -122.03))`; `IdleViewModel.cameraPosition.center` updates to that coordinate at zoom 12; `IdleViewModel.locationStatus == .granted(...)`

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Services/UserLocationProviderTests.swift
  TEST_FUNCTION: test_userLocationProvider_deliversOneShotFixToViewModel

AC-3: Permission denied with no cache falls back to U.S. centre, NOT San Francisco
  GIVEN: A `UserLocationProvider` whose injected manager reports `.denied` and `AppState.lastKnownCoordinate == nil`
  WHEN:  `IdleViewModel.observe()` runs
  THEN:  `viewModel.cameraPosition.center == LatLng(lat: 39.8283, lon: -98.5795)` (NOT 37.7749/-122.4194), zoom == 4, `viewModel.locationStatus == .denied(fallback: ...)`. A direct equality assertion that the fallback equals `LatLng(37.7749, -122.4194)` MUST fail.

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Services/UserLocationProviderTests.swift
  TEST_FUNCTION: test_userLocationProvider_deniedWithoutCache_fallsBackToUSCenter_notSanFrancisco

AC-4: Camera eases (no jump) when fix arrives after fallback render
  GIVEN: `IdleViewModel.cameraPosition` initially set to fallback U.S. centre and the provider then delivers a real fix
  WHEN:  The camera-position observable emits the new coordinate
  THEN:  Recorded camera state values show two sequential positions (fallback then user fix); the camera change is driven entirely via observable state mutation (verified by inspecting that `LSMap`'s rendered `CameraPosition` parameter changed); no `mapView.mapboxMap.setCamera` is invoked from outside `LSMapUIViewRepresentable`

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift
  TEST_FUNCTION: test_idleScreen_camera_easesFromFallbackToUserFix

AC-5: AppState.lastKnownCoordinate updates on fresh fix
  GIVEN: An `AppState` with `lastKnownCoordinate == nil` and a `UserLocationProvider` that delivers a fix
  WHEN:  `IdleViewModel.observe()` consumes the fix
  THEN:  `appState.lastKnownCoordinate == LatLng(<delivered coordinate>)`; subsequent re-mounts of `IdleViewModel` start with the cached coordinate without re-prompting

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Services/UserLocationProviderTests.swift
  TEST_FUNCTION: test_userLocationProvider_updatesAppStateLastKnownCoordinate

AC-6: IdleScreen.swift production source contains no MockProvider / LSPaperMap symbols (composition matches design HTML's real-Mapbox slot)
  GIVEN: A static-source assertion test (file-content scan) over `ios/LaneShadow/Views/Templates/IdleScreen.swift`
  WHEN:  The test reads the file as a string
  THEN:  Zero matches for the literals `IdleMockProvider`, `MockProvider`, or `LSPaperMap`. The file passes `scripts/tokens/enforce-native-compliance.sh` for the lines this task modified (full RF-31 closeout is owned by T04). Composition references the design HTML in a leading file comment: `// Design: .spec/design/system/views/idle-screen/idle-screen.html § map slot (S01 lines 185-460)`.

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift
  TEST_FUNCTION: test_idleScreen_productionSource_hasNoMockProviderOrPaperMapReferences_andDesignHTMLIsCited

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Templates/IdleScreen.swift (MODIFY — replace LSPaperMap with LSMap; production initializer takes IdleScreenLiveState; remove MockProvider import)
- ios/LaneShadow/Features/Idle/IdleViewModel.swift (MODIFY — add cameraPosition + locationStatus; init takes UserLocationProvider)
- ios/LaneShadow/Features/Idle/IdleScreenContainer.swift (MODIFY — wire UserLocationProvider through and pass IdleScreenLiveState)
- ios/LaneShadow/Services/UserLocationProvider.swift (NEW)
- ios/LaneShadow/Services/UserLocationStatus.swift (NEW — small enum)
- ios/LaneShadow/Models/AppState.swift (MODIFY — add lastKnownCoordinate: LatLng?)
- ios/LaneShadow/Info.plist (MODIFY — add NSLocationWhenInUseUsageDescription)
- ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenSandbox.swift (NEW — preserves the LSPaperMap + MockProvider story for the sandbox catalog)
- ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift (MODIFY)
- ios/LaneShadowTests/Services/UserLocationProviderTests.swift (NEW)
- ios/project.yml (MODIFY — only if a new file glob is needed for Services or Sandbox/Stories/Templates)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated; edit ios/project.yml + run scripts/ios/generate-project.sh
- ios/LaneShadow/Generated/** — generated by server/scripts/generate-mobile-types.ts
- ios/LaneShadow/Views/Molecules/LSPaperMap.swift — DO NOT delete or modify; sandbox stories still consume it
- ios/LaneShadow/Views/Atoms/LSMap.swift — already complete; do NOT change
- ios/LaneShadow/Views/Atoms/LSChatInput.swift — owned by S04B-IOS-T03 (Places autocomplete)
- ios/LaneShadow/Views/Organisms/LSTopBar.swift — owned by S04B-IOS-T04 (NEW button)
- ios/LaneShadow/Sandbox/MockProviders/** — leave intact

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Use `@MainActor @Observable` for `UserLocationProvider`
- Inject a `CLLocationManager` protocol surface so tests stub authorization and fix delivery deterministically
- Animate via observable state change so the existing 400 ms ease in `LSMapUIViewRepresentable` activates

⚠️ Ask First:
- Adding any new SPM dependency
- Changing the `LSMap` public surface
- Re-architecting `IdleScreen` initializer beyond what AC-1/AC-6 require — composition rebuild is intentionally NOT in this sprint

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- `ios/LaneShadow/Services/UserLocationProvider.swift` (NEW)
- `ios/LaneShadow/Services/UserLocationStatus.swift` (NEW)
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — minimal change: swap map; production init takes `IdleScreenLiveState`; sandbox factory removed)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY)
- `ios/LaneShadow/Models/AppState.swift` (MODIFY)
- `ios/LaneShadow/Info.plist` (MODIFY)
- `ios/LaneShadow/Sandbox/Stories/Templates/IdleScreenSandbox.swift` (NEW)
- `ios/LaneShadowTests/Services/UserLocationProviderTests.swift` (NEW)
- `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift` (MODIFY)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal production code) → REFACTOR. Capture RED replay output to `.tmp/S04B-IOS-T01/red-{ac}.txt`. Never write production code in RED phase.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `.spec/prds/v3-integration/tasks/sprint-04b-real-map-real-planning-loop/SPRINT.md`
2. `.spec/design/system/views/idle-screen/README.md` § Composes (lines 23-65), § Token Recipe (lines 70-87)
3. `.spec/design/system/views/idle-screen/idle-screen.html` lines 185-460 (S01 phone-frame map slot — fidelity reference)
4. `ios/LaneShadow/Views/Atoms/LSMap.swift` lines 119-125, 177-243
5. `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift` lines 38-86, 140-180
6. `ios/LaneShadow/Features/Idle/IdleViewModel.swift` lines 1-124
7. `ios/LaneShadow/Models/AppState.swift`

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED phase markers + `.tmp/S04B-IOS-T01/red-*.txt`
Gate 2: One test per AC
Gate 3: All tests pass on iPhone 16 simulator
Gate 4: Build clean with `SWIFT_STRICT_CONCURRENCY=complete`
Gate 5: `swiftformat --lint ios/`
Gate 6: `scripts/tokens/enforce-native-compliance.sh`
Gate 7: `git diff --name-only` matches SCOPE.writeAllowed
Gate 8: AC-3 explicitly asserts NOT (37.7749, -122.4194)
Gate 9: AC-6 grep test passes (zero MockProvider/LSPaperMap references in IdleScreen.swift) and design-HTML citation present in leading comment

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: AUTH-S03-T07 (AppState shape), CHAT-S04-T01 (RideFlow + ChatStore wiring)
Blocks: S04B-IOS-T02 (gestures + locate-me control needs the LSMap host in place); S04B-IOS-T03 (autocomplete stores selected coordinate alongside the user-location coordinate); S04B-IOS-T04 (NEW button + topbar fix sit on the same template)

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "S04B-IOS-T01",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "Production IdleScreen body composes interactive LSMap not LSPaperMap", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/IdleScreenWiringTests/test_idleScreen_productionBody_composesInteractiveLSMap_notLSPaperMap", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "UserLocationProvider delivers one-shot fix to view-model camera", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/UserLocationProviderTests/test_userLocationProvider_deliversOneShotFixToViewModel", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "Denied + no cache falls back to US centre NOT San Francisco", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/UserLocationProviderTests/test_userLocationProvider_deniedWithoutCache_fallsBackToUSCenter_notSanFrancisco", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Camera eases via observable state from fallback to user fix", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/IdleScreenWiringTests/test_idleScreen_camera_easesFromFallbackToUserFix", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "AppState.lastKnownCoordinate updates on fresh fix", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/UserLocationProviderTests/test_userLocationProvider_updatesAppStateLastKnownCoordinate", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "IdleScreen.swift production source has no MockProvider/LSPaperMap and cites design HTML", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/IdleScreenWiringTests/test_idleScreen_productionSource_hasNoMockProviderOrPaperMapReferences_andDesignHTMLIsCited", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
