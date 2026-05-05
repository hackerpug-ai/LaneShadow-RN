# IDLE-S06-IOS-T02 — iOS replace LSPaperMap with real LSMap (Mapbox warm-paper) + copper favorite pin overlays

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-MAP-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --quiet
```

---

## OUTCOME

`IdleScreen.swift` renders a real Mapbox warm-paper tile (`mapbox://styles/laneshadow/clxwarm01` light, `clxnight02` dark) via `LSMap`, with copper favorite-pin overlays driven by `viewModel.showFavoritePins` and the camera centered on the rider's location (or San Francisco fallback) — replacing the `LSPaperMap` placeholder.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** replace `LSPaperMap(overlayStyle:.contours, showPins:state.showFavoritePins)` at `IdleScreen.swift:78` with `LSMap(mode:.interactive, camera: resolvedCamera, showFavorites: viewModel.showFavoritePins)`. The warm-paper style URL is already resolved by `resolveLSMapStyleURI(colorScheme:)` inside `LSMap`.
- **MUST** wire `resolvedCamera` as: `viewModel.userLocation.map { CameraPosition(center:$0, zoom:12.0) } ?? CameraPosition(center: LatLng(lat:37.7749, lng:-122.4194), zoom:11.0)` (SF default).
- **MUST** add `userLocation: LatLng?` and `showFavoritePins: Bool` as `@Observable` properties on `IdleViewModel` (T01 added the protocol/init; this task wires the property surface). Reserve nil for T02; T03 populates.
- **MUST** add `@ObservationIgnored private let locationService: LocationService` injection point on `IdleViewModel` so T03 can wire without changing VM signature.
- **MUST** preserve `.accessibilityIdentifier("idlescreen-map")` on the map view — DesignReviewCaptureTests selector path.
- **NEVER** import `MapboxMaps` in `IdleScreen.swift` or `IdleViewModel.swift` — only `LSMapUIViewRepresentable.swift` imports the Mapbox SDK.
- **NEVER** hardcode style URL strings — use `lsMapLightStyleURI` / `lsMapDarkStyleURI` constants via `resolveLSMapStyleURI(colorScheme:)`.
- **STRICTLY** keep `IdleScreenTests.swift no_data_fetching_symbols` passing.

---

## DONE WHEN

- [ ] AC-1: `LSPaperMap` removed from `IdleScreen.swift mapView`; build succeeds (PRIMARY)
- [ ] AC-2: `resolveLSMapStyleURI(.light)` returns `lsMapLightStyleURI`
- [ ] AC-3: `userLocation == nil` → camera centers on SF (37.7749, -122.4194) at zoom 11
- [ ] AC-4: `showFavoritePins` driven by non-empty favorites subscription from T01
- [ ] AC-5: `LSMapErrorView` shown gracefully when Mapbox token absent in test env
- [ ] All `xcodebuild test` commands exit 0; no `LSPaperMap` import in `IdleScreen.swift`
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: LSPaperMap removed from IdleScreen map slot [PRIMARY]
- **GIVEN** `IdleScreen.swift` is compiled
- **WHEN** the `mapView` computed property is inspected
- **THEN** it calls `LSMap(...)` not `LSPaperMap(...)`; `LSPaperMap` import removed
- **VERIFY:** `xcodebuild ... build && grep -c 'LSPaperMap' ios/LaneShadow/Views/Templates/IdleScreen.swift` returns 0

### AC-2: LSMap renders warm-paper style in light mode
- **GIVEN** app launched in light colorScheme with valid Mapbox access token
- **WHEN** IdleScreen is displayed
- **THEN** `resolveLSMapStyleURI(colorScheme:.light)` returns `lsMapLightStyleURI = 'mapbox://styles/laneshadow/clxwarm01'`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LSMapRenderModelTests/warmPaperStyle_lightMode`

### AC-3: Camera defaults to SF when userLocation is nil
- **GIVEN** `viewModel.userLocation == nil`
- **WHEN** IdleScreen renders the map slot
- **THEN** `CameraPosition.center == LatLng(37.7749, -122.4194)` at zoom 11.0
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/camera_defaultsToSF_whenLocationNil`

### AC-4: showFavorites wired from viewModel.showFavoritePins
- **GIVEN** `StubLaneShadowConvexClient` yields a non-empty favorites list
- **WHEN** ViewModel processes the favorites update
- **THEN** `showFavoritePins == true`; LSMap is called with `showFavorites: true`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/showFavoritePins_drivenByFavoritesSubscription`

### AC-5: LSMapErrorView gracefully shown when Mapbox token absent
- **GIVEN** simulator has no `MAPBOX_ACCESS_TOKEN` (token is empty)
- **WHEN** IdleScreen renders the map slot
- **THEN** `LSMapErrorView` is displayed with `fallback.error == .missingToken`; app does not crash
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/mapFallback_gracefulWhenTokenAbsent`

---

## TEST CRITERIA

| ID    | Statement                                                                            | Maps To | Type        |
|-------|--------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | resolveLSMapStyleURI(.light) returns lsMapLightStyleURI constant                     | AC-2    | happy_path  |
| TC-2  | resolveLSMapStyleURI(.dark) returns lsMapDarkStyleURI constant                       | AC-2    | happy_path  |
| TC-3  | userLocation=nil → resolvedCamera = SF LatLng(37.7749,-122.4194) zoom 11             | AC-3    | edge_case   |
| TC-4  | non-empty favorites subscription → showFavoritePins == true                          | AC-4    | happy_path  |
| TC-5  | empty Mapbox token → LSMapContainer renders LSMapErrorView, no crash                 | AC-5    | edge_case   |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — replace LSPaperMap call site only)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY — add `userLocation`, `showFavoritePins`, `resolvedCamera`)
- `ios/LaneShadowTests/Templates/IdleScreenTests.swift` (MODIFY — add mapFallback test)
- `ios/LaneShadowTests/Features/Idle/IdleViewModelTests.swift` (MODIFY — add camera + showFavoritePins tests)

**writeProhibited:**
- `android/**`, `tokens/**`, `server/**`, `react-native/**`
- `ios/LaneShadow/Views/Molecules/LSPaperMap.swift` — READ ONLY; must not delete (still used in sandbox)
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — READ ONLY; no API changes
- `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift` — READ ONLY

---

## BOUNDARIES

✅ **Always:**
- Use `LSMap` public API only; never reach into `LSMapUIViewRepresentable` directly
- Keep `accessibilityIdentifier("idlescreen-map")` intact

⚠️ **Ask First:**
- Adding new parameters to `LSMap` public API
- Changing the warm-paper Mapbox style URL constant

---

## DELIVERABLE

- `IdleScreen.swift` (MODIFY): `mapView` body now calls `LSMap(mode:.interactive, camera: viewModel.resolvedCamera, showFavorites: viewModel.showFavoritePins).accessibilityIdentifier("idlescreen-map")`
- `IdleViewModel.swift` (MODIFY): adds `userLocation: LatLng?`, `showFavoritePins: Bool`, computed `resolvedCamera: CameraPosition`
- `IdleScreenTests.swift` (MODIFY): adds `mapFallback_gracefulWhenTokenAbsent`
- `IdleViewModelTests.swift` (MODIFY): adds 2 new tests

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR.

**RED:** Write failing test. `xcodebuild test`. VERIFY FAILS.

**GREEN:** Minimal Swift change. Re-run; VERIFY PASSES.

**REFACTOR:** Stay green.

---

## READING LIST

1. `ios/LaneShadow/Views/Atoms/LSMap.swift:102-195` **[PRIMARY PATTERN]** — `LSMap()` signature lines 177-195; `lsMapLightStyleURI` / `lsMapDarkStyleURI` constants lines 120-122; `resolveLSMapStyleURI()` lines 360-367; `LSMapContainer` body lines 208-243 (fallback path)
2. `ios/LaneShadow/Views/Atoms/LSMapUIViewRepresentable.swift:1-50` — UIViewRepresentable params; access token resolution
3. `ios/LaneShadow/Views/Templates/IdleScreen.swift:75-83` — current `LSPaperMap` call to replace (line 78)
4. `ios/LaneShadow/Features/Idle/IdleViewModel.swift:1-40` — add `userLocation` + `showFavoritePins` properties + `resolvedCamera` computed
5. `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth for warm-paper map + copper favorite pins

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Swift format | `swiftformat ... --quiet` | Exit 0 |
| Build check | `xcodebuild ... build` | Exit 0 |
| Unit tests — T02 ACs | `xcodebuild test -only-testing:.../LSMapRenderModelTests -only-testing:.../IdleViewModelTests/camera_defaultsToSF_whenLocationNil ...` | Exit 0, 5 tests pass |
| Regression — no_data_fetching_symbols | `xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/no_data_fetching_symbols` | Exit 0 |
| No LSPaperMap import | `! grep -q LSPaperMap ios/LaneShadow/Views/Templates/IdleScreen.swift` | Exit 0 |

---

## OUT OF SCOPE

- Creating `LocationService.swift` — IDLE-S06-IOS-T03
- Pin tap interactions — out of scope for entire sprint (deferred)
- Modifying `LSMap` public API or `LSMapUIViewRepresentable`

---

## CONTEXT

**Current state:** `IdleScreen.swift:78` uses `LSPaperMap(overlayStyle:.contours, showPins:state.showFavoritePins)` — paper substrate placeholder, no real Mapbox tiles. `LSMap` (`Views/Atoms/LSMap.swift`) is fully implemented as a Mapbox SDK wrapper with warm-paper style URLs already wired.

**Gap:** Sprint 6 gate explicitly requires "real Mapbox warm-paper tile layer (not a `LinearGradient` or `LSPaperMap` placeholder)".

---

## REVIEW (for swift-reviewer)

**Must pass:**
- One test per AC; tests verify behavior not implementation
- No `MapboxMaps` import in `IdleScreen.swift` or `IdleViewModel.swift` (grep proof)
- `LSPaperMap` removed from `IdleScreen.swift` (grep proof)
- `accessibilityIdentifier("idlescreen-map")` preserved
- SCOPE respected

**Should verify:**
- Camera fallback to SF is exact (37.7749, -122.4194) at zoom 11
- `LSMap` called with `mode: .interactive` (not `.preview`)
- `viewModel.showFavoritePins` derives correctly from non-empty favorites array

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html` — warm-paper map tile, copper favorite pin dots
- `.spec/design/system/views/idle-screen/README.md` — Token Recipe: 'Favorite pin fill: var(--signal-default)', 'Favorite pin border: var(--surface-card)'

**Pattern:** `LSMap(mode:.interactive, camera: resolvedCamera, showFavorites: viewModel.showFavoritePins)` — `resolvedCamera` is a computed property on `IdleViewModel`.

**Pattern source:** `.spec/prds/v3-integration/architecture/ios-architecture.md:747`

**Anti-pattern:** Don't import `MapboxMaps` in template/VM. Don't recreate `LSFavoritePinDot` at hardcoded CGPoints — `showFavorites:true` handles annotation rendering inside `LSMapUIViewRepresentable`.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-IOS-T01 (provides `IdleViewModel` shape + favorites/weather subscriptions)
- **Blocks:** IDLE-S06-IOS-T04
- **Parallel:** IDLE-S06-AND-T02 (Android twin)

---

## CODING STANDARDS

- `RULES.md` §Verification Standards — `xcodebuild test` exact command
- `RULES.md` §Accessibility Standards (iOS) — testIdentifier preservation
- `brain/docs/CODING-STANDARDS.md` — Swift 6 concurrency, `@MainActor` boundaries

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN IdleScreen.swift compiled WHEN mapView inspected THEN calls LSMap not LSPaperMap","verify":"xcodebuild ... build && ! grep -q LSPaperMap ios/LaneShadow/Views/Templates/IdleScreen.swift"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN light colorScheme WHEN IdleScreen displayed THEN style URI = lsMapLightStyleURI warm-paper","verify":"xcodebuild test -only-testing:LaneShadowTests/LSMapRenderModelTests/warmPaperStyle_lightMode"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN userLocation=nil WHEN camera resolved THEN center=SF LatLng(37.7749,-122.4194) zoom=11","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/camera_defaultsToSF_whenLocationNil"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN non-empty favorites subscription WHEN showFavoritePins read THEN true","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/showFavoritePins_drivenByFavoritesSubscription"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN no Mapbox token WHEN map slot renders THEN LSMapErrorView shown, no crash","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/mapFallback_gracefulWhenTokenAbsent"},
    {"id":"TC-1","type":"test_criterion","description":"warmPaperStyle_lightMode passes","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowTests/LSMapRenderModelTests/warmPaperStyle_lightMode"},
    {"id":"TC-2","type":"test_criterion","description":"warmPaperStyle_darkMode passes","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowTests/LSMapRenderModelTests/warmPaperStyle_darkMode"},
    {"id":"TC-3","type":"test_criterion","description":"camera_defaultsToSF_whenLocationNil passes","maps_to_ac":"AC-3","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/camera_defaultsToSF_whenLocationNil"},
    {"id":"TC-4","type":"test_criterion","description":"showFavoritePins_drivenByFavoritesSubscription passes","maps_to_ac":"AC-4","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/showFavoritePins_drivenByFavoritesSubscription"},
    {"id":"TC-5","type":"test_criterion","description":"mapFallback_gracefulWhenTokenAbsent passes","maps_to_ac":"AC-5","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/mapFallback_gracefulWhenTokenAbsent"}
  ]
}
-->
