================================================================================
TASK: S04B-IOS-T02 - IdleScreen map gestures verified + locate-me control overlay
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S (≤120 min)
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  test:      xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/Atoms/LSMapTests -only-testing:LaneShadowTests/Atoms/LSLocateMeButtonTests -only-testing:LaneShadowTests/Features/Idle/IdleScreenWiringTests
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --lint ios/

PROGRESS: 0/5 AC · pending

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

All `LSMap` interactive gestures (pan, pinch zoom, double-tap zoom, two-finger rotate, two-finger pitch) work on `IdleScreen` — verified via `LSMapRenderModel.interaction.gesturesEnabled == true` and via XCUITest gesture probes. A small floating glass-styled "locate-me" control overlay sits at the bottom-right of the map (above the chat-input bar), tapping it re-centres the camera on `IdleViewModel.locationStatus.currentCoordinate` (or, if denied, prompts re-authorization once). The button is an atom (`LSLocateMeButton`) so it can be reused on other map-bearing screens later. Camera re-centre uses the existing 400 ms ease.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- DESIGN authority: `.spec/design/system/views/idle-screen/idle-screen.html` (the "+ NEW" / hamburger / glass-chip pattern at lines 460-580 is the design language for the locate-me chip — it is a single-icon glass chip 40×40pt circular, copper accent on tap)
- MUST verify (via test) that `LSMap` is invoked from `IdleScreen` with `mode: .interactive` and that `LSMapRenderModel.interaction.gesturesEnabled == true` per `resolveLSMapInteraction(for:)` in `LSMap.swift:369-376`
- MUST verify no parent SwiftUI view in the IdleScreen composition swallows touches in the map area — specifically the `LSMapLayer` overlay slots (`topOverlays`, `bottomOverlays`) must not occlude the map for gesture purposes; if they do, fix the overlay frame so it only consumes the bounds it needs (test asserts the map area below the greeting and above the chat-input bottom-overlay receives gestures)
- MUST add a new atom `LSLocateMeButton` (`ios/LaneShadow/Views/Atoms/LSLocateMeButton.swift`) — 40×40pt circular glass chip styled per `org-topbar__chip--square` design token recipe (background `theme.colors.surface.glass`, border `theme.colors.border.glass`, icon `compass.location` 18pt in `theme.colors.signal.default`); hairline border via `theme.borderWidth.hairline`; soft-shadow per `theme.elevation.level1`
- MUST overlay the locate-me button at the bottom-right of the map area, above the chat-input bottom-overlay. Recommend placing it in `LSMapLayer.bottomOverlays` as a separate `GlassOverlaySlot` aligned `.trailing` — or augment `LSMapLayer` with an explicit `mapControls` slot if the existing slot model does not support trailing-only overlays
- MUST tap-handle: when `IdleViewModel.locationStatus == .granted(coord)` or `.fallback(coord)`, tapping the button calls `IdleViewModel.recenterOnUser()` which sets `cameraPosition = CameraPosition(center: coord, zoom: 12)`; when `.denied`, tapping the button calls `userLocationProvider.requestWhenInUseAuthorization()` once (no infinite re-prompt loop — track an `attempted` flag)
- MUST animate the recenter via observable state mutation so the existing 400 ms ease in `LSMapUIViewRepresentable` activates
- MUST attach `accessibilityIdentifier("idlescreen-locate-me")` and `accessibilityLabel("Centre map on my location")`
- MUST NOT swallow gestures elsewhere on the screen — the chat input bar already absorbs taps in its own bounds, but the open map area must remain interactive
- MUST NOT touch `LSMap.swift` or `LSMapUIViewRepresentable.swift` — those are already correct; this task adds an external overlay only
- DESIGN HTML cite for the locate-me chip placement: `idle-screen.html` does not show a locate-me chip explicitly (the design assumes paper-substrate sandbox); the production locate-me chip uses the same `org-topbar__chip--square` glass styling for visual consistency. Document this divergence as a TOKEN_GAP-style note in the file's leading comment.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSMap` is invoked with `mode: .interactive` from `IdleScreen` (AC-1 PRIMARY)
- [ ] No parent view occludes gestures over the open map area (AC-2)
- [ ] `LSLocateMeButton` atom exists and renders to the design-token recipe (AC-3)
- [ ] Tapping the button re-centres camera on user when status is `.granted`/`.fallback` (AC-4)
- [ ] Tapping the button re-prompts authorization (once) when status is `.denied` (AC-5)
- [ ] All Swift Testing tests pass; lint passes; build clean

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads)
--------------------------------------------------------------------------------

AC-1: LSMap invoked with mode .interactive on IdleScreen [PRIMARY]
  GIVEN: `IdleScreen` rendered with default `IdleScreenLiveState`
  WHEN:  The body materialises and `LSMap` is invoked
  THEN:  The captured `LSMapRenderModel` has `interaction.gesturesEnabled == true`, `interaction.scrollIsolationEnabled == true`, and the resolved `MapMode == .interactive`. (Use a test-only spy injection on `LSMap` or capture via the view tree.)

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift
  TEST_FUNCTION: test_idleScreen_invokes_LSMap_withInteractiveMode_andGesturesEnabled

AC-2: Map area receives gestures (no parent view occludes the open map zone)
  GIVEN: `IdleScreen` rendered in a hosting controller with a 390×844 frame (iPhone 16)
  WHEN:  A hit-test is performed at a point in the open map area (e.g., x = 195, y = 400 — between the greeting overlay's bottom and the chat-input top)
  THEN:  The hit-test result is the `LSMap` host (or a descendant of `LSMapUIViewRepresentable`), NOT the bottom-overlay container, NOT the top-overlay container. Conduct hit-tests at four sample points covering the open zone

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift
  TEST_FUNCTION: test_idleScreen_mapArea_isHitTestable_betweenOverlays

AC-3: LSLocateMeButton atom renders to design-token recipe
  GIVEN: `LSLocateMeButton(onTap: {})` rendered standalone
  WHEN:  The view is materialised
  THEN:  Frame is 40×40pt; background colour resolves to `theme.colors.surface.glass`; border to `theme.colors.border.glass` with `theme.borderWidth.hairline`; icon symbol is `location.circle.fill` (or equivalent SFSymbol) sized 18pt in `theme.colors.signal.default`; corner radius is `theme.radius.full`; shadow values match `theme.elevation.level1`. Zero literal RGB / opacity values in `LSLocateMeButton.swift`.

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Atoms/LSLocateMeButtonTests.swift
  TEST_FUNCTION: test_lsLocateMeButton_rendersToDesignTokenRecipe

AC-4: Tap recenters camera when location granted
  GIVEN: `IdleViewModel` with `locationStatus == .granted(LatLng(36.97, -122.03))` and `cameraPosition.center == LatLng(40.0, -100.0)` (nudged elsewhere by user pan)
  WHEN:  `viewModel.recenterOnUser()` is called
  THEN:  `viewModel.cameraPosition.center == LatLng(36.97, -122.03)`, `cameraPosition.zoom == 12`. The camera change is driven via observable state (no direct `setCamera` call from outside `LSMapUIViewRepresentable`)

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift
  TEST_FUNCTION: test_idleViewModel_recenterOnUser_setsCameraToFix_atZoom12

AC-5: Tap re-prompts authorization once when denied (no infinite loop)
  GIVEN: `IdleViewModel` with `locationStatus == .denied(fallback: ...)` and a `UserLocationProvider` spy
  WHEN:  `viewModel.recenterOnUser()` is called twice in succession
  THEN:  `userLocationProvider.requestWhenInUseAuthorization()` is invoked exactly once across both calls (the second tap is suppressed by an `attemptedReauth` flag); when authorization later transitions to `.granted`, the flag resets so a future denial cycle can re-prompt

  TDD_STATE:     RED
  TEST_FILE:     ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift
  TEST_FUNCTION: test_idleViewModel_recenterOnUser_whenDenied_promptsAuthOnce_thenSuppressedUntilGrantedTransition

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Atoms/LSLocateMeButton.swift (NEW)
- ios/LaneShadow/Views/Templates/IdleScreen.swift (MODIFY — add the button as a bottom-overlay slot or trailing alignment in the bottomOverlays array)
- ios/LaneShadow/Views/Organisms/LSMapLayer.swift (MODIFY — only if a `mapControls` slot is needed; prefer using existing `bottomOverlays` with explicit `.trailing` alignment)
- ios/LaneShadow/Features/Idle/IdleViewModel.swift (MODIFY — add `recenterOnUser()` + `attemptedReauth` flag)
- ios/LaneShadowTests/Atoms/LSLocateMeButtonTests.swift (NEW)
- ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift (MODIFY — adds AC-1, AC-2, AC-4, AC-5)
- ios/project.yml (MODIFY — only if new file glob needed for a `mapControls` slot helper)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated
- ios/LaneShadow/Views/Atoms/LSMap.swift — already correct; do NOT change
- ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift — already correct
- ios/LaneShadow/Services/UserLocationProvider.swift — owned by S04B-IOS-T01 (only consume its API)
- ios/LaneShadow/Views/Atoms/LSChatInput.swift — owned by S04B-IOS-T03
- ios/LaneShadow/Views/Organisms/LSTopBar.swift — owned by S04B-IOS-T04
- ios/LaneShadow/Sandbox/MockProviders/** — leave intact

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Build the locate-me button as an atom so it can be reused later
- Use `theme.colors.*` and `theme.elevation.level1` exclusively; no literal colour / opacity values
- Route taps through `IdleViewModel` so unit tests can verify behaviour without UI

⚠️ Ask First:
- Adding a new `mapControls` slot to `LSMapLayer` (vs. reusing `bottomOverlays`)
- Promoting the button to a molecule (e.g., bundling extra controls)

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- `ios/LaneShadow/Views/Atoms/LSLocateMeButton.swift` (NEW)
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — overlay the button)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY — recenter + reauth-once)
- `ios/LaneShadowTests/Atoms/LSLocateMeButtonTests.swift` (NEW)
- `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift` (MODIFY)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (test fails) → GREEN (minimal pass) → REFACTOR. Capture RED outputs to `.tmp/S04B-IOS-T02/red-{ac}.txt`.

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. `ios/LaneShadow/Views/Atoms/LSMap.swift` lines 369-376 (`resolveLSMapInteraction`)
2. `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift` lines 56-65 (`configureGestures`)
3. `ios/LaneShadow/Views/Organisms/LSMapLayer.swift` (overlay slot model)
4. `.spec/design/system/views/idle-screen/idle-screen.html` lines 460-580 (chip styling for visual consistency reference)
5. `.spec/design/system/views/idle-screen/README.md` § Token Recipe (lines 70-87) — for the chip surface/border/elevation tokens
6. `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (extend)

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED markers + `.tmp/S04B-IOS-T02/red-*.txt`
Gate 2: One test per AC
Gate 3: All tests pass
Gate 4: Build clean
Gate 5: `swiftformat --lint ios/`
Gate 6: `scripts/tokens/enforce-native-compliance.sh`
Gate 7: Scope compliance

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: S04B-IOS-T01 (`LSMap` host on IdleScreen + `IdleViewModel.locationStatus` + `cameraPosition` + `UserLocationProvider`)
Blocks: nothing

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "taskId": "S04B-IOS-T02",
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "LSMap invoked with .interactive mode on IdleScreen", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/IdleScreenWiringTests/test_idleScreen_invokes_LSMap_withInteractiveMode_andGesturesEnabled", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "Map area receives gestures; no parent view occludes the open zone", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/IdleScreenWiringTests/test_idleScreen_mapArea_isHitTestable_betweenOverlays", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "LSLocateMeButton renders to design-token recipe", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/LSLocateMeButtonTests/test_lsLocateMeButton_rendersToDesignTokenRecipe", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "Tap recenters camera at zoom 12 when location granted", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/IdleScreenWiringTests/test_idleViewModel_recenterOnUser_setsCameraToFix_atZoom12", "satisfied": false, "evidence": null, "remediation": null},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "Tap re-prompts auth once when denied; suppressed until granted transition", "verify": "xcodebuild ... test -only-testing:LaneShadowTests/IdleScreenWiringTests/test_idleViewModel_recenterOnUser_whenDenied_promptsAuthOnce_thenSuppressedUntilGrantedTransition", "satisfied": false, "evidence": null, "remediation": null}
  ]
}
-->
================================================================================
