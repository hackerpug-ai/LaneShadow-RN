# IDLE-S06-AND-T03 — Android LocationRepository + geocode pill + chat input active

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest' --tests 'com.laneshadow.services.ConvexClientProviderTest'
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
```

---

## OUTCOME

`data/location/LocationRepository` and `FusedLocationProviderImpl` expose `LocationCoordinate` from the FusedLocationProviderClient with Santa Cruz `(36.97, -122.03)` fallback on permission-denied / provider-unavailable. `ConvexClientProvider.reverseGeocode(lat, lng)` returns `Result<GeocodeResult>` populating `IdleUiState.locationLabel`, `locationMode` (`auto | manual`), and `isLocationEnabled`. The chat input bar transitions to `is-active` on suggestion-chip tap (filter button → copper send button, placeholder → primer phrase) once the location pill resolves.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** introduce a domain `LocationCoordinate(lat: Double, lon: Double)` model — never expose Android's `Location` class through the repository layer (Robolectric cannot mock it; matches AND-T03 learnings)
- **MUST** wrap FusedLocationProviderClient with `await()` from `kotlinx-coroutines-play-services`; declare the play-services-location dependency in `app/build.gradle.kts`
- **MUST** fall back to Santa Cruz `(36.97, -122.03)` on permission denied OR provider unavailable
- **MUST** wrap `actions/places.reverseGeocode` invocation in `Result<>` so callers handle Convex errors gracefully (`Result.failure(...)` → `IdleUiState.locationUnavailable = true`)
- **MUST** flip `IdleUiState.isLocationEnabled = true` once `locationLabel != null`; flip `false` while resolving; `true` again on recovery
- **MUST** flip `LSChatInput` to `is-active` on suggestion-chip tap: filter button swaps to copper send, placeholder fills with chip's primer phrase
- **NEVER** mock the FusedLocationProviderClient HTTP layer in unit tests — use the `LocationCoordinate` domain model and a fake `FusedLocationProvider` interface as the seam
- **NEVER** extend `ConvexClientProvider` in tests (it is `final`); inject a fake `ConvexGateway` via `internal` constructor
- **STRICTLY** follow ConvexGateway error handling: `Result.failure` carries the `ConvexError` for upstream classification

---

## DONE WHEN

- [x] AC-1: `LocationRepository.fetch()` returns Santa Cruz fallback on permission denied (PRIMARY)
- [x] AC-2: `LocationRepository.fetch()` returns FusedLocation coordinates when authorized
- [x] AC-3: `ConvexClientProvider.reverseGeocode` returns `Result.success(GeocodeResult)` for valid coordinates
- [x] AC-4: `ConvexClientProvider.reverseGeocode` returns `Result.failure` when Convex throws
- [x] AC-5: Suggestion-chip tap → `IdleUiState` flips `chatInputState = is-active`
- [x] AC-6: Geocode failure → `locationUnavailable = true`; recovery flips back to `false`
- [x] `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest'` exit 0
- [x] `./gradlew detekt` clean

---

## ACCEPTANCE CRITERIA

### AC-1: Permission denied falls back to Santa Cruz [PRIMARY]
- **GIVEN** Fake `FusedLocationProvider` reports permission denied
- **WHEN** `LocationRepository.fetch()` is invoked
- **THEN** returns `LocationCoordinate(lat=36.97, lon=-122.03)`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest.permissionDenied_fallsBackToSantaCruz'`

### AC-2: Authorized fetch returns provider coordinates
- **GIVEN** Fake `FusedLocationProvider` returns `(lat=37.81, lon=-122.47)` with permission granted
- **WHEN** `LocationRepository.fetch()` is invoked
- **THEN** returns `LocationCoordinate(lat=37.81, lon=-122.47)`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest.authorized_returnsProviderCoordinates'`

### AC-3: reverseGeocode success path
- **GIVEN** Fake `ConvexGateway.action('actions/places:reverseGeocode', {lat,lng})` returns `{label: "Santa Cruz, CA", placeId: "..."}`
- **WHEN** `ConvexClientProvider.reverseGeocode(lat, lng)` is invoked
- **THEN** returns `Result.success(GeocodeResult(label="Santa Cruz, CA", placeId="..."))`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.ConvexClientProviderTest.reverseGeocode_success'`

### AC-4: reverseGeocode error path
- **GIVEN** Fake `ConvexGateway` throws `ConvexError("GEOCODE_NOT_FOUND")`
- **WHEN** `ConvexClientProvider.reverseGeocode(lat, lng)` is invoked
- **THEN** returns `Result.failure(...)` with the error preserved
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.ConvexClientProviderTest.reverseGeocode_failure'`

### AC-5: Suggestion-chip tap activates chat input
- **GIVEN** `IdleUiState.isLocationEnabled = true` and chat input idle
- **WHEN** rider taps suggestion chip "Plan a scenic 2-hour ride"
- **THEN** `IdleUiState.chatInputState == ChatInputState.IsActive`; placeholder text becomes primer phrase
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestionChipTap_activatesChatInput'`

### AC-6: Failure marks unavailable; recovery re-enables
- **GIVEN** `reverseGeocode` returned `Result.failure`
- **WHEN** state processes the error, then a fresh location succeeds
- **THEN** sequence is `locationUnavailable → true → false`; `isLocationEnabled → false → true`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.geocodeRecovery_reEnablesChat'`

---

## TEST CRITERIA

| ID    | Statement                                                                | Maps To | Type        |
|-------|--------------------------------------------------------------------------|---------|-------------|
| TC-1  | Permission denied → LocationCoordinate(36.97,-122.03)                    | AC-1    | edge_case   |
| TC-2  | Authorized fetch returns provider coordinates                            | AC-2    | happy_path  |
| TC-3  | reverseGeocode → Result.success(GeocodeResult) for valid coords          | AC-3    | happy_path  |
| TC-4  | reverseGeocode → Result.failure when ConvexError thrown                  | AC-4    | error_case  |
| TC-5  | Suggestion-chip tap flips chatInputState to IsActive                     | AC-5    | happy_path  |
| TC-6  | Failure → locationUnavailable=true; recovery → locationUnavailable=false | AC-6    | edge_case   |

---

## SCOPE

**writeAllowed:**
- `android/app/src/main/java/com/laneshadow/data/location/LocationCoordinate.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/data/location/LocationRepository.kt` (NEW — interface + impl)
- `android/app/src/main/java/com/laneshadow/data/location/FusedLocationProviderImpl.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` (MODIFY — add `reverseGeocode` + `GeocodeResult`)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` (MODIFY — `observeLocation` + suggestion-chip handler)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` (MODIFY — `locationLabel`, `locationMode`, `isLocationEnabled`, `chatInputState`)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` (MODIFY — pass new fields through to IdleScreenState)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` (MODIFY — IsActive variant)
- `android/app/src/main/java/com/laneshadow/di/RepositoryModule.kt` (MODIFY — bindings)
- `android/app/build.gradle.kts` (MODIFY — `play-services-location`, `kotlinx-coroutines-play-services`)
- `android/app/src/test/java/com/laneshadow/data/location/LocationRepositoryTest.kt` (NEW)
- `android/app/src/test/java/com/laneshadow/services/ConvexClientProviderTest.kt` (NEW)

**writeProhibited:**
- `ios/**`, `server/**`, `react-native/**`, `tokens/**`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — owned by T02
- `android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt` — owned by T02
- `android/app/src/androidTest/**` — owned by T04

---

## BOUNDARIES

✅ **Always:**
- Use `LocationCoordinate` domain model in tests (never Android `Location`)
- Wrap Convex calls in `Result<>` for upstream error handling
- Use `internal` test constructor for `ConvexClientProvider` to inject fakes

⚠️ **Ask First:**
- Adding a Flow-based location stream (currently one-shot fetch on init)
- Switching FusedLocationProvider to `LocationManager`
- Persisting last known location across app launches

---

## DELIVERABLE

- `LocationCoordinate.kt` (NEW): domain model `(lat, lon)` doubles
- `LocationRepository.kt` (NEW): interface + impl wrapping `FusedLocationProvider`
- `FusedLocationProviderImpl.kt` (NEW): Google Play Services wrapper using `await()`
- `ConvexClientProvider.kt` (MODIFY): add `reverseGeocode(...) : Result<GeocodeResult>` + `GeocodeResult` data class
- `IdleViewModel.kt` (MODIFY): `observeLocation` flow + suggestion-chip activation handler
- `IdleUiState.kt` (MODIFY): `locationLabel`, `locationMode`, `isLocationEnabled`, `chatInputState` fields
- `IdleRoute.kt` (MODIFY): plumb new fields into `IdleScreenState`
- `LSChatInput.kt` (MODIFY): IsActive variant styling per design reference
- `RepositoryModule.kt` (MODIFY): Hilt bindings for `LocationRepository` + `FusedLocationProvider`
- `app/build.gradle.kts` (MODIFY): play-services-location + coroutines-play-services dependencies
- `LocationRepositoryTest.kt` (NEW): permission denied, provider unavailable, success
- `ConvexClientProviderTest.kt` (NEW): reverseGeocode success + failure paths

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Use a `Fake` `FusedLocationProvider` (real interface, fake impl) for repository tests; use a `Fake` `ConvexGateway` injected through the `internal` constructor for provider tests. Per AND-T03 learnings: full integration tests for `IdleViewModel.observeLocation` are skipped in unit suite due to ConvexClientProvider complexity — **manual device testing covered by IDLE-S06-AND-T04 instrumented tests**.

---

## READING LIST

1. `android/app/src/main/java/com/laneshadow/data/location/LocationRepository.kt` **[PRIMARY PATTERN]** — interface + impl + Santa Cruz fallback
2. `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` (search `reverseGeocode`) — `Result<>` wrapping pattern
3. `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` (search `observeLocation`) — flow consumer + state mutation
4. `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` — IsActive variant
5. `.spec/design/system/views/mapapp/idle/idle-screen.html` — chat input states + location pill copy
6. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/android-learnings.md:1-55` — AND-T03 learnings (Robolectric limits, FusedLocationProvider mocking)

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Kotlin typecheck | `./gradlew :app:compileDebugKotlin` | Exit 0 |
| LocationRepository tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest'` | Exit 0; ≥3 pass |
| ConvexClientProvider tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.ConvexClientProviderTest'` | Exit 0; ≥2 pass |
| Detekt lint | `./gradlew detekt` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |

---

## OUT OF SCOPE

- Instrumented test coverage of full ViewModel + Convex integration — IDLE-S06-AND-T04
- Continuous location updates (Flow-based) — current scope is one-shot fetch on init
- Manual mode UI affordance — `locationMode` field exists; visual toggle deferred

---

## CONTEXT

**Current state:** No `LocationRepository` existed; `ConvexClientProvider` had no `reverseGeocode`; chat input had idle styling only. Per `android-learnings.md`, Robolectric cannot mock Android's `Location` class, so a domain model is required for testability.

**Gap:** Without these primitives, the idle map view cannot resolve "Near {city}, {state}" copy or activate the chat input, leaving idle state visibly distorted vs. the design reference.

---

## REVIEW (for kotlin-reviewer)

**Must pass:**
- Repository surface uses `LocationCoordinate` (no Android `Location` leak)
- `reverseGeocode` returns `Result<>` (errors propagate via `Result.failure`)
- Hilt bindings present in `RepositoryModule`
- `build.gradle.kts` declares both play-services dependencies
- SCOPE respected — no T02 / T04 file mutations

**Should verify:**
- `await()` import comes from `kotlinx-coroutines-play-services`
- Permission state checks live in `FusedLocationProviderImpl`, not the Repository (separation)
- ChatInputState transitions are unit-tested independently of UI tree

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html` — location pill, chat input states
- `.spec/design/system/views/mapapp/idle/README.md` — `signal.default` for "Near {city}" pill copy

**Pattern:** Repository hides platform SDK behind a domain model; `Result<>` carries Convex outcomes upstream; ViewModel reflects state into UI without throwing.

**Pattern source:** `android/app/src/main/java/com/laneshadow/data/location/LocationRepository.kt`

**Anti-pattern:** Returning Android `Location?` from the repository — couples tests to Robolectric and SDK stubs.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01 (`reverseGeocode`), IDLE-S06-AND-T01 (ViewModel state surface), IDLE-S06-AND-T02 (map host)
- **Blocks:** IDLE-S06-AND-T04 (instrumented tests assume full real-data wiring)
- **Parallel:** IDLE-S06-IOS-T03

---

## CODING STANDARDS

- `RULES.md` §Accessibility Standards (Android) — `contentDescription` on chat input affordances
- `RULES.md` §Real Device E2E Testing — non-sandbox flows require real-device evidence (covered by AND-T04 + Sprint Gate T11)
- `convex/_generated/ai/guidelines.md` — Convex action invocation pattern

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN permission denied WHEN LocationRepository.fetch() invoked THEN returns LocationCoordinate(36.97,-122.03)","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest.permissionDenied_fallsBackToSantaCruz'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN authorized provider WHEN fetch() invoked THEN returns provider coordinates","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest.authorized_returnsProviderCoordinates'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN ConvexGateway returns label WHEN reverseGeocode invoked THEN Result.success(GeocodeResult)","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.ConvexClientProviderTest.reverseGeocode_success'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN ConvexGateway throws WHEN reverseGeocode invoked THEN Result.failure","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.ConvexClientProviderTest.reverseGeocode_failure'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN isLocationEnabled WHEN suggestion chip tapped THEN chatInputState=IsActive","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestionChipTap_activatesChatInput'"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN failure then success WHEN processed THEN locationUnavailable transitions true→false","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.geocodeRecovery_reEnablesChat'"},
    {"id":"TC-1","type":"test_criterion","description":"Permission denied → Santa Cruz fallback","maps_to_ac":"AC-1","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest.permissionDenied_fallsBackToSantaCruz'"},
    {"id":"TC-2","type":"test_criterion","description":"Authorized fetch returns provider coordinates","maps_to_ac":"AC-2","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.data.location.LocationRepositoryTest.authorized_returnsProviderCoordinates'"},
    {"id":"TC-3","type":"test_criterion","description":"reverseGeocode → Result.success","maps_to_ac":"AC-3","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.ConvexClientProviderTest.reverseGeocode_success'"},
    {"id":"TC-4","type":"test_criterion","description":"reverseGeocode → Result.failure on error","maps_to_ac":"AC-4","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.services.ConvexClientProviderTest.reverseGeocode_failure'"},
    {"id":"TC-5","type":"test_criterion","description":"Chip tap → chatInputState=IsActive","maps_to_ac":"AC-5","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.suggestionChipTap_activatesChatInput'"},
    {"id":"TC-6","type":"test_criterion","description":"Failure → recovery transitions","maps_to_ac":"AC-6","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.geocodeRecovery_reEnablesChat'"}
  ]
}
-->
