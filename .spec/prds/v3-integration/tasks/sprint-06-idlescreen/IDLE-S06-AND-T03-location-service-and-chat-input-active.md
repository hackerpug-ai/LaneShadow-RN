# IDLE-S06-AND-T03 — Android FusedLocationProvider + reverse-geocode pill + MANUAL/AUTO toggle + LSChatInput is-active

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-SCR-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:testDebugUnitTest
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
  tokens:    scripts/tokens/enforce-native-compliance.sh
```

---

## OUTCOME

A Hilt-injectable `LocationService` exposes `Flow<LocationState>` (coordinate + AUTO/MANUAL/NEEDED mode + reverse-geocoded "Near {city}, {state}" label); `IdleViewModel` collects the flow and propagates to `IdleUiState.locationContext`; mode pill tap cycles AUTO ↔ MANUAL with copper tint; suggestion-chip tap sets `inputValue + isChatActive=true` so LSChatInput shows the send button.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** create `android/app/src/main/java/com/laneshadow/services/LocationService.kt` as `@Singleton` Hilt-injectable backed by `FusedLocationProviderClient`, exposing `Flow<LocationState>` where `LocationState = data class(currentCoordinate: LatLng?, mode: LocationMode (AUTO|MANUAL|NEEDED), placeLabel: String?)`.
- **MUST** reverse-geocode resolved coordinate via NEW Convex action `places.getReverseGeocode(lat,lng)` — result formatted as `"Near {city}, {state}"`.
- **MUST** inject `LocationService` into `IdleViewModel` (T01 reserves the slot); collect into `IdleUiState.locationContext` already consumed by `IdleRoute.toMockState()`.
- **MUST** implement MANUAL toggle: tap mode chip (testTag `ls-location-context-bar-mode-pill`) → `IdleViewModel.onToggleLocationMode()`; AUTO ↔ MANUAL with coordinate freeze on MANUAL.
- **MUST** wire LSChatInput is-active: `onSuggestionTap` sets `IdleUiState.inputValue = chip.label` AND `IdleUiState.isChatActive = true`; `IdleRoute.toMockState()` propagates `isChatActive` so `LSChatInput.value.isNotEmpty()` triggers the send button (LSChatInput.kt:126-148 already handles this swap).
- **MUST** request `ACCESS_FINE_LOCATION` + `ACCESS_COARSE_LOCATION` runtime permissions before starting updates; on denial set `LocationState.mode = NEEDED`.
- **NEVER** hardcode a city/state string — placeLabel must come from Convex action.
- **NEVER** call `FusedLocationProviderClient` on main thread; use `Dispatchers.IO` or `callbackFlow { }`.
- **STRICTLY** copper tint for MANUAL mode chip: `LSLocationContextBar.kt:39` already maps `LocationMode.Manual → AccentColor.Signal`; verify `toMockState()` correctly maps service mode `MANUAL → 'manual'`.

---

## DONE WHEN

- [ ] AC-1: `LocationService` emits AUTO state with reverse-geocoded label (PRIMARY)
- [ ] AC-2: MANUAL toggle freezes coordinate
- [ ] AC-3: Permission denial produces NEEDED state
- [ ] AC-4: Suggestion chip tap sets `inputValue + isChatActive=true`
- [ ] AC-5: MANUAL mode chip renders with `AccentColor.Signal` (copper)
- [ ] All `./gradlew` exit 0; native compliance passes
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: LocationService emits AUTO state with reverse-geocoded label [PRIMARY]
- **GIVEN** Device location available + `ACCESS_FINE_LOCATION` granted
- **WHEN** `LocationService.locationFlow` is collected
- **THEN** First non-null emission has `mode == AUTO` and `placeLabel` matches `'Near {city}, {state}'` (e.g. `'Near Santa Cruz, CA'`)
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.location_flow_emits_auto_state_with_geocode_label'`

### AC-2: MANUAL toggle freezes coordinate
- **GIVEN** `LocationService` in AUTO mode with coordinate `(37.81, -122.47)`
- **WHEN** `IdleViewModel.onToggleLocationMode()` called once
- **THEN** `LocationState.mode == MANUAL`; `placeLabel` non-null; coordinate does NOT change on next FusedLocation update
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.manual_toggle_freezes_coordinate'`

### AC-3: Permission denial produces NEEDED state
- **GIVEN** `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` both denied
- **WHEN** `LocationService.locationFlow` is collected
- **THEN** Emission has `mode == NEEDED`, `currentCoordinate == null`, `placeLabel == null`; `IdleUiState.isNoLocation == true`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.permission_denial_produces_needed_state'`

### AC-4: Suggestion chip tap sets inputValue + isChatActive
- **GIVEN** `IdleViewModel` has suggestions `['Twisty back roads', 'Coastal cruise', 'Half-day loop', 'Mountain passes']`
- **WHEN** `onSuggestionTap(SuggestionChip(text='Coastal cruise'))` called
- **THEN** `state.inputValue == 'Coastal cruise'` and `state.isChatActive == true`; in IdleScreen, LSChatInput value triggers send button (LSChatInput.kt:130 — `value.isNotEmpty()`)
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestion_tap_sets_input_value_and_chat_active'`

### AC-5: MANUAL mode chip → AccentColor.Signal copper
- **GIVEN** `LocationState.mode == MANUAL`
- **WHEN** `IdleRoute.toMockState()` maps to `IdleScreenState.locationContext.mode == 'manual'`
- **THEN** `IdleScreen.toUiLocationContext()` maps `'manual' → LocationMode.Manual`; `LSLocationContextBar` renders mode chip with `AccentColor.Signal` (copper) via existing logic at LSLocationContextBar.kt:39
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleRouteTest.manual_location_mode_maps_to_signal_accent_in_ui'`

---

## TEST CRITERIA

| ID    | Statement                                                                         | Maps To | Type        |
|-------|-----------------------------------------------------------------------------------|---------|-------------|
| TC-1  | LocationService AUTO + granted permission emits placeLabel matching 'Near {city}, {state}' | AC-1 | happy_path  |
| TC-2  | onToggleLocationMode() AUTO → MANUAL + coordinate frozen                          | AC-2    | happy_path  |
| TC-3  | Denied permissions → mode=NEEDED + null placeLabel                                | AC-3    | edge_case   |
| TC-4  | onSuggestionTap('Coastal cruise') → inputValue='Coastal cruise' + isChatActive=true | AC-4  | happy_path  |
| TC-5  | LocationMode.Manual → AccentColor.Signal copper in LSLocationContextBar           | AC-5    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `android/app/src/main/java/com/laneshadow/services/LocationService.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/services/ReverseGeocodeRepository.kt` (NEW — interface)
- `android/app/src/main/java/com/laneshadow/services/ConvexReverseGeocodeRepository.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` (MODIFY — add `isChatActive: Boolean = false`)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` (MODIFY — inject LocationService, add `onToggleLocationMode()`, update `onSuggestionTap`)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` (MODIFY — pass isChatActive to inputValue)
- `android/app/src/main/java/com/laneshadow/di/LocationModule.kt` (NEW — Hilt @Binds + @Provides for FusedLocationProviderClient)
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` (MODIFY — add getReverseGeocode to ConvexGateway interface + RealConvexGateway)
- `android/app/src/test/java/com/laneshadow/services/LocationServiceTest.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/ui/idle/IdleRouteTest.kt` (NEW)

**writeProhibited:**
- `ios/**`, `tokens/**`, `server/**`, `react-native/**`
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` — READ ONLY; is-active state already driven by value binding
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt` — READ ONLY; mode color already wired
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — out of scope

---

## BOUNDARIES

✅ **Always:**
- `@Singleton` + `@Inject constructor` for repositories
- `callbackFlow { }` for FusedLocation callback bridging
- `ContextCompat.checkSelfPermission` before registering location callbacks

⚠️ **Ask First:**
- Adding `ACCESS_BACKGROUND_LOCATION` (don't need for IdleScreen)
- Bumping Google Play Services dependency version

---

## DELIVERABLE

- `LocationService.kt` (NEW): `@Singleton` Flow emitter; FusedLocation callback bridging
- `ReverseGeocodeRepository.kt` (NEW): `interface` with `suspend fun getReverseGeocode(lat,lon): String?`
- `ConvexReverseGeocodeRepository.kt` (NEW): calls `ConvexClientProvider.action("places.getReverseGeocode")`
- `IdleUiState.kt` (MODIFY): adds `isChatActive: Boolean = false`
- `IdleViewModel.kt` (MODIFY): injects LocationService, observes flow, adds `onToggleLocationMode()`, updates `onSuggestionTap`
- `IdleRoute.kt` (MODIFY): pipes `isChatActive` to LSChatInput value
- `di/LocationModule.kt` (NEW): Hilt module
- `ConvexClientProvider.kt` (MODIFY): adds getReverseGeocode action
- `LocationServiceTest.kt` + `IdleRouteTest.kt` (NEW): unit tests for AC-1..AC-5

---

## AGENT INSTRUCTIONS

For each AC: RED → GREEN → REFACTOR. LocationService tests use a fake `ReverseGeocodeRepository` (real interface, fake impl) — never mock HTTP per project SUPREME RULE.

---

## READING LIST

1. `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt:1-43` — extend with `isChatActive`
2. `android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt:35-39` **[PRIMARY PATTERN]** — `LocationMode.Manual → AccentColor.Signal` already implemented; just confirm mapping
3. `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt:126-148` — trailing slot swap logic; `value.isNotEmpty() → send`
4. `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt:35-170` — `ConvexGateway` interface; add `getReverseGeocode`
5. `android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt:56-65` — `callbackFlow { }` DataStore pattern; mirror for FusedLocation

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Kotlin typecheck | `./gradlew :app:compileDebugKotlin` | Exit 0 |
| Unit tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest' --tests 'com.laneshadow.ui.idle.IdleViewModelTest' --tests 'com.laneshadow.ui.idle.IdleRouteTest'` | Exit 0, all 5+ pass |
| Detekt lint | `./gradlew detekt` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |

---

## OUT OF SCOPE

- Background location updates (foreground only)
- Geofencing for favorite locations (post-Sprint-10)
- Custom permission rationale UX

---

## CONTEXT

**Current state:** No `LocationService.kt` in `android/app/src/main/java/com/laneshadow/services/`. `LSLocationContextBar.kt:39` already maps `LocationMode.Manual → AccentColor.Signal`. `LSChatInput.kt:130-148` already handles is-active swap based on `value.isNotEmpty()`.

**Gap:** Sprint 6 gate requires real FusedLocation + Convex reverse-geocode + MANUAL toggle + chip→is-active wiring.

---

## REVIEW (for kotlin-reviewer)

**Must pass:**
- One test per AC; tests use fake repositories (real interface + fake impl)
- LocationService is `@Singleton` `@Inject constructor`
- `callbackFlow { }` registers FusedLocation callbacks; emissions on appropriate dispatcher
- `ContextCompat.checkSelfPermission` gate before requesting updates
- SCOPE respected; LSChatInput.kt and LSLocationContextBar.kt unchanged

**Should verify:**
- `Info.plist` equivalent — `AndroidManifest.xml` has `ACCESS_FINE_LOCATION` and `ACCESS_COARSE_LOCATION` declarations
- Permission rationale handling on Android 12+
- AnnotatedString italic span preservation across recomposition

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html`
- `.spec/design/system/views/idle-screen/README.md:42-53` — `mol-lcb__mode-chip is-manual` copper tint; `mol-chat-input__bar is-active` send state

**Pattern:** Service as `@Singleton` Flow emitter — `callbackFlow { }` registers FusedLocation callbacks; ViewModel collects via `viewModelScope.launch + .catch`; mirrors `AppStateRepository.appState:56-65`.

**Pattern source:** `android/app/src/main/java/com/laneshadow/services/AppStateRepository.kt:56-65`

**Anti-pattern:** Requesting permissions inside LocationService — must be requested from Activity/Fragment hosting Compose; LocationService only checks `ContextCompat.checkSelfPermission` before registering callbacks.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01 (`getReverseGeocode` action), IDLE-S06-AND-T01 (VM scaffold)
- **Blocks:** IDLE-S06-AND-T04
- **Parallel:** IDLE-S06-IOS-T03 (iOS twin)

---

## CODING STANDARDS

- `RULES.md` §Accessibility Standards (Android) — location pill `contentDescription = "Current location: {placeLabel}"`; mode chip `contentDescription` "Location mode: MANUAL/AUTO"
- `RULES.md` §Real Device E2E Testing — Android-only real-device location is MANUAL/BLOCKED until physical-device harness exists
- `brain/docs/CODING-STANDARDS.md` — Kotlin coroutines + Flow patterns

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN permission granted WHEN locationFlow collected THEN AUTO state with 'Near {city}, {state}' label","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.location_flow_emits_auto_state_with_geocode_label'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN AUTO mode WHEN onToggleLocationMode called THEN mode=MANUAL + coordinate frozen","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.manual_toggle_freezes_coordinate'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN permission denied WHEN locationFlow collected THEN NEEDED state with null coordinate + placeLabel","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.permission_denial_produces_needed_state'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN suggestion chips WHEN onSuggestionTap called THEN inputValue set + isChatActive=true","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestion_tap_sets_input_value_and_chat_active'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN mode=MANUAL WHEN toMockState maps to LocationMode.Manual THEN LSLocationContextBar renders AccentColor.Signal","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleRouteTest.manual_location_mode_maps_to_signal_accent_in_ui'"},
    {"id":"TC-1","type":"test_criterion","description":"AUTO flow with granted permission emits 'Near {city}, {state}'","maps_to_ac":"AC-1","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.location_flow_emits_auto_state_with_geocode_label'"},
    {"id":"TC-2","type":"test_criterion","description":"Manual toggle from AUTO freezes coordinate","maps_to_ac":"AC-2","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.manual_toggle_freezes_coordinate'"},
    {"id":"TC-3","type":"test_criterion","description":"Permission denial → NEEDED state with null coordinate","maps_to_ac":"AC-3","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.LocationServiceTest.permission_denial_produces_needed_state'"},
    {"id":"TC-4","type":"test_criterion","description":"Suggestion tap → inputValue + isChatActive=true","maps_to_ac":"AC-4","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestion_tap_sets_input_value_and_chat_active'"},
    {"id":"TC-5","type":"test_criterion","description":"Manual mode → AccentColor.Signal","maps_to_ac":"AC-5","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleRouteTest.manual_location_mode_maps_to_signal_accent_in_ui'"}
  ]
}
-->
