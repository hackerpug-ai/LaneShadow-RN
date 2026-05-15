# IDLE-S06-IOS-T03 — iOS LocationService + geocode pill + chat input active

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LocationServiceTests
  typecheck: xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftlint lint ios/LaneShadow/Services/LocationService.swift ios/LaneShadow/Features/Idle
```

---

## OUTCOME

`LocationService` (`@Observable @MainActor final class : NSObject`) surfaces `currentLocation: CLLocation?` and `authorizationStatus`. On permission grant it requests CoreLocation updates; on permission denied / failure it falls back to Santa Cruz `(36.97, -122.03)`. `IdleViewModel.observeLocation()` consumes the service, calls `actions/places.reverseGeocode` to populate `locationLabel`, sets `isLocationEnabled = true` once resolved, and the idle-screen chat input bar transitions from disabled to active (placeholder copy → primer phrase) on suggestion-chip tap.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** mark `LocationService` `@Observable @MainActor`, conform to `CLLocationManagerDelegate` via a `nonisolated` extension that hops back to the main actor in each delegate callback
- **MUST** request permission via `requestWhenInUseAuthorization()`; on `.denied` / `.restricted` / `didFailWithError`, fall back to Santa Cruz coordinates so the rest of the idle state remains usable
- **MUST** drive `IdleViewModel.locationLabel` from the `actions/places.reverseGeocode` Convex action (never from the iOS device's `CLGeocoder` — Convex is the canonical source)
- **MUST** flip `IdleViewModel.isLocationEnabled` to `true` once `locationLabel != nil`; `false` while resolving; `locationUnavailable = true` if geocode fails twice (after retry)
- **MUST** flip `LSChatInput` to `is-active` styling on suggestion-chip tap: filter button swaps to copper send button, placeholder fills with chip's primer phrase
- **NEVER** hold a strong reference to `CLLocationManager` outside `@ObservationIgnored`
- **NEVER** call `CLLocationManager` APIs from a background thread; all delegate work hops to `@MainActor`
- **STRICTLY** test against the real `LocationService` interface using a fake delegate harness; do NOT mock `CLLocationManager` itself

---

## DONE WHEN

- [x] AC-1: `LocationService` falls back to Santa Cruz on `.denied` (PRIMARY)
- [x] AC-2: `LocationService.currentLocation` updates from `didUpdateLocations`
- [x] AC-3: `IdleViewModel.locationLabel` resolves from Convex `reverseGeocode`
- [x] AC-4: Suggestion-chip tap flips chat input to `is-active`
- [x] AC-5: Geocode failure → `locationUnavailable == true`, chat remains disabled
- [x] AC-6: Re-acquired location → chat returns to enabled
- [x] `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests` exit 0

---

## ACCEPTANCE CRITERIA

### AC-1: Permission denied falls back to Santa Cruz [PRIMARY]
- **GIVEN** `LocationService` instance with `authorizationStatus = .denied`
- **WHEN** `locationManager(_:didChangeAuthorization:)` fires with `.denied`
- **THEN** `currentLocation == CLLocation(latitude: 36.97, longitude: -122.03)`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/test_permissionDenied_fallsBackToSantaCruz`

### AC-2: didUpdateLocations updates currentLocation
- **GIVEN** authorized service
- **WHEN** delegate `didUpdateLocations` fires with `[CLLocation(lat: 37.81, lng: -122.47)]`
- **THEN** `currentLocation == CLLocation(lat: 37.81, lng: -122.47)`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/test_didUpdateLocations_updatesCurrent`

### AC-3: locationLabel resolves from Convex reverseGeocode
- **GIVEN** `LocationService` with `currentLocation = CLLocation(lat: 36.97, lng: -122.03)`
- **WHEN** `IdleViewModel.observeLocation()` runs and Convex `reverseGeocode` returns `{city:"Santa Cruz", state:"CA", label:"Santa Cruz, CA"}`
- **THEN** `IdleViewModel.locationLabel == "Santa Cruz, CA"`, `isLocationEnabled == true`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_locationLabel_resolvesFromReverseGeocode`

### AC-4: Suggestion-chip tap activates chat input
- **GIVEN** `IdleViewModel.isLocationEnabled == true` and chat input idle
- **WHEN** rider taps suggestion chip "Plan a scenic 2-hour ride"
- **THEN** chat input enters `is-active` state; filter button swaps to copper send; placeholder text becomes primer phrase
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_suggestionChipTap_activatesChatInput`

### AC-5: Geocode failure marks location unavailable
- **GIVEN** Convex `reverseGeocode` throws after retry
- **WHEN** `observeLocation()` processes the error
- **THEN** `locationUnavailable == true`, `isLocationEnabled == false`, `locationLabel == nil`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_geocodeFailure_marksUnavailable`

### AC-6: Re-acquired location re-enables chat
- **GIVEN** `locationUnavailable == true` from prior failure
- **WHEN** `LocationService` emits a fresh location and `reverseGeocode` succeeds
- **THEN** `locationUnavailable == false`, `isLocationEnabled == true`, label populated
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_reacquiredLocation_reEnablesChat`

---

## TEST CRITERIA

| ID    | Statement                                                                | Maps To | Type        |
|-------|--------------------------------------------------------------------------|---------|-------------|
| TC-1  | `.denied` authorization → currentLocation == Santa Cruz fallback         | AC-1    | edge_case   |
| TC-2  | didUpdateLocations updates currentLocation                               | AC-2    | happy_path  |
| TC-3  | reverseGeocode `{Santa Cruz, CA}` → locationLabel == "Santa Cruz, CA"    | AC-3    | happy_path  |
| TC-4  | Suggestion-chip tap → chat input is-active + copper send button          | AC-4    | happy_path  |
| TC-5  | reverseGeocode throws after retry → locationUnavailable == true          | AC-5    | error_case  |
| TC-6  | Fresh location + successful geocode → isLocationEnabled flips to true    | AC-6    | edge_case   |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/Services/LocationService.swift` (NEW or MODIFY)
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY — add `observeLocation`)
- `ios/LaneShadow/Views/Molecules/LSChatInput.swift` (MODIFY — `is-active` state styling)
- `ios/LaneShadowTests/Services/LocationServiceTests.swift` (NEW)
- `ios/LaneShadowTests/Features/Idle/IdleViewModelTests.swift` (MODIFY — add AC-3..6)

**writeProhibited:**
- `android/**`, `server/**`, `react-native/**`, `tokens/**`
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — owned by T02
- `ios/LaneShadow/AppFlow/MapView/**` — owned by T02
- `ios/LaneShadow.xcodeproj/**` (generated)

---

## BOUNDARIES

✅ **Always:**
- Hop to `@MainActor` in every delegate callback
- Use Convex `reverseGeocode` for label resolution (not `CLGeocoder`)
- Treat permission denial as a recoverable degraded state (Santa Cruz fallback)

⚠️ **Ask First:**
- Adding background location updates
- Switching to `requestAlwaysAuthorization`
- Persisting last known location across app launches

---

## DELIVERABLE

- `LocationService.swift` (NEW/MODIFY): `@Observable @MainActor` service with delegate plumbing + Santa Cruz fallback
- `IdleViewModel.swift` (MODIFY): `observeLocation` flow calling Convex `reverseGeocode`; suggestion-chip tap handler
- `LSChatInput.swift` (MODIFY): `is-active` variant styling per design reference
- `LocationServiceTests.swift` (NEW): permission denied, didUpdateLocations, didFailWithError tests
- `IdleViewModelTests.swift` (MODIFY): AC-3..6 covering label resolution, chat activation, failure handling, recovery

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Test the service by triggering its delegate methods directly (the delegate is the seam). For ViewModel ACs, use a fake `LaneShadowPlanningDataProviding` that returns `Result<ReverseGeocodeResult, Error>` for `reverseGeocode` calls.

---

## READING LIST

1. `ios/LaneShadow/Services/LocationService.swift:1-60` **[PRIMARY PATTERN]** — final implementation; delegate hops to main actor
2. `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (search `observeLocation`) — flow consumer
3. `ios/LaneShadow/Views/Molecules/LSChatInput.swift` — `is-active` variant + suggestion-chip handler
4. `.spec/design/system/views/mapapp/idle/idle-screen.html` — chat input states (idle / is-active / focused)
5. `.spec/design/system/views/mapapp/idle/README.md` — copper send-button recipe + primer phrase mapping

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | Exit 0 |
| LocationService tests | `xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests` | Exit 0; 3 pass |
| IdleViewModel tests | `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests` | Exit 0; 10 pass (4 from T01 + 4 added here + 2 prior) |
| SwiftLint | `swiftlint lint ios/LaneShadow/Services/LocationService.swift ios/LaneShadow/Features/Idle` | Exit 0 |

---

## OUT OF SCOPE

- DesignReview capture methods — IDLE-S06-IOS-T04
- MANUAL/AUTO mode toggle UI — covered by future enhancement; the property exists but the UI affordance is acceptable as a placeholder this sprint
- Background location updates

---

## CONTEXT

**Current state:** `LocationService` exists with delegate scaffolding and Santa Cruz fallback (committed Sprint 04 for iOS). `LSChatInput` has idle styling but no `is-active` variant, and `IdleViewModel` does not yet wire location → reverseGeocode → label.

**Gap:** The map view's idle state can't render the location pill (`Near Santa Cruz, CA`) or activate chat input on suggestion-chip tap until this wiring lands.

---

## REVIEW (for swift-reviewer)

**Must pass:**
- Delegate methods are `nonisolated` and hop to `@MainActor` via `Task { @MainActor in ... }`
- Permission denial falls back to Santa Cruz (no crash, no infinite spinner)
- Convex `reverseGeocode` is the only source for location labels (not `CLGeocoder`)
- `LSChatInput.is-active` styling matches design reference (copper send button, primer placeholder)
- SCOPE respected — no map-host or T02 file mutations

**Should verify:**
- `requireWhenInUseAuthorization` requested on first launch (info.plist usage description present)
- `currentLocation` updates trigger ViewModel re-resolution (no stale labels)
- Recovery path (AC-6) tested with stop-then-resume `Task` flow

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html` — location pill + chat input states
- `.spec/design/system/views/mapapp/idle/README.md` — `signal.default` for "Near {city}" pill copy

**Pattern:** `@Observable` service + delegate adapter; ViewModel owns the observation `Task` consuming the service property.

**Pattern source:** `ios/LaneShadow/Services/LocationService.swift:1-60`

**Anti-pattern:** Passing `CLLocationManager` directly into ViewModels — couples them to the SDK; use the service abstraction.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01 (`reverseGeocode`), IDLE-S06-IOS-T01 (ViewModel state surface), IDLE-S06-IOS-T02 (map host with overlay slot)
- **Blocks:** IDLE-S06-IOS-T04
- **Parallel:** IDLE-S06-AND-T03

---

## CODING STANDARDS

- `RULES.md` §Accessibility Standards (iOS) — pill `accessibilityLabel`/`accessibilityHint`
- `RULES.md` §Real Device E2E Testing — non-sandbox flows (auth + location + Convex) require real-device evidence in T11
- `RULES.md` §Verification Standards

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN .denied authorization WHEN didChangeAuthorization fires THEN currentLocation == Santa Cruz","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/test_permissionDenied_fallsBackToSantaCruz"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN authorized service WHEN didUpdateLocations fires THEN currentLocation updates","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/test_didUpdateLocations_updatesCurrent"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN currentLocation set WHEN reverseGeocode returns label THEN locationLabel set, isLocationEnabled true","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_locationLabel_resolvesFromReverseGeocode"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN isLocationEnabled WHEN suggestion chip tapped THEN chat input is-active","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_suggestionChipTap_activatesChatInput"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN reverseGeocode fails after retry WHEN error processed THEN locationUnavailable=true","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_geocodeFailure_marksUnavailable"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN locationUnavailable WHEN fresh location + geocode success THEN isLocationEnabled flips to true","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_reacquiredLocation_reEnablesChat"},
    {"id":"TC-1","type":"test_criterion","description":".denied → Santa Cruz fallback","maps_to_ac":"AC-1","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/test_permissionDenied_fallsBackToSantaCruz"},
    {"id":"TC-2","type":"test_criterion","description":"didUpdateLocations updates currentLocation","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowTests/LocationServiceTests/test_didUpdateLocations_updatesCurrent"},
    {"id":"TC-3","type":"test_criterion","description":"reverseGeocode label populates locationLabel","maps_to_ac":"AC-3","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_locationLabel_resolvesFromReverseGeocode"},
    {"id":"TC-4","type":"test_criterion","description":"Suggestion chip tap → chat is-active","maps_to_ac":"AC-4","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_suggestionChipTap_activatesChatInput"},
    {"id":"TC-5","type":"test_criterion","description":"Geocode failure → locationUnavailable","maps_to_ac":"AC-5","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_geocodeFailure_marksUnavailable"},
    {"id":"TC-6","type":"test_criterion","description":"Recovery → isLocationEnabled true","maps_to_ac":"AC-6","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_reacquiredLocation_reEnablesChat"}
  ]
}
-->
