# IDLE-S06-AND-T01 — Android IdleViewModel parity: favorites + weather flows + Greeting.scope + meta row

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01, UC-SCR-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:testDebugUnitTest
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
  tokens:    scripts/tokens/enforce-native-compliance.sh
```

---

## OUTCOME

`IdleViewModel` exposes `firstName`, `metaRow`, `weatherSummary`, `favoriteLocations`, and `greetingScope` (TODAY|TONIGHT) sourced from real Convex subscriptions; `IdleRoute.toMockState()` builds an `AnnotatedString` with italic scope word so `IdleScreen` renders `"Where are we riding {today|tonight}, {firstName}?"` and a `"FRIDAY · 68°F · CLEAR"` meta row.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** extend `IdleUiState` with: `firstName: String`, `metaRow: String`, `weatherSummary: WeatherSummary?`, `favoriteLocations: List<FavoriteLocation>`, `greetingScope: GreetingScope` (enum: `TODAY | TONIGHT`).
- **MUST** compute `greetingScope` from `LocalTime.hour`: hours `18-23` or `0-4` → `TONIGHT`, otherwise → `TODAY`.
- **MUST** build `greetingHeadline` as `AnnotatedString` in `IdleRoute.toMockState()`: plain "Where are we riding " + italic `SpanStyle` `today`/`tonight` + plain `, {firstName}?` (italic span on scope word only).
- **MUST** compose `metaRow` as `'{DAY_UPPERCASE} · {TEMP}°F · {CONDITION_UPPERCASE}'` — `DAY` from `java.time.DayOfWeek` display name uppercase, `TEMP` rounded to Int, `CONDITION` uppercase.
- **MUST** extract `firstName` from `displayName` by splitting on whitespace; blank → `'Rider'`.
- **MUST** call NEW Convex action `weather.getCurrentWeather` via `ConvexClientProvider`; collect NEW Convex query `favorites.listFavoriteLocations`.
- **MUST** propagate `weatherSummary.severity >= advisory` to `IdleUiState.showAdvisoryCard = true` and populate `advisoryMessage`.
- **NEVER** hardcode temperature, day-of-week, or condition strings — all computed at runtime.
- **NEVER** use `Thread.sleep` or blocking calls inside `Flow` collectors.
- **NEVER** bypass Hilt DI by constructing repositories in the ViewModel; use `@Inject constructor`.
- **STRICTLY** follow existing Flow error-handling pattern from `IdleViewModel.observeCurrentUser()`: each `.collect` wrapped in `.catch { }` and updates `subscriptionError`.

---

## DONE WHEN

- [x] AC-1: Greeting scope is `TONIGHT` for hours 18-23 / 0-4 (PRIMARY)
- [x] AC-2: Greeting scope is `TODAY` for hours 5-17
- [x] AC-3: `metaRow == "FRIDAY · 68°F · CLEAR"` from `WeatherSummary(68.4, 'Clear', FRIDAY)`
- [x] AC-4: `WeatherSeverity.ADVISORY` sets `showAdvisoryCard = true`
- [x] AC-5: Blank displayName → `firstName == 'Rider'`
- [x] AC-6: FavoritesRepository emission of one item → `state.favoriteLocations.size == 1`
- [x] All `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest'` pass + detekt + native compliance
- [x] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Greeting scope switches on time-of-day [PRIMARY]
- **GIVEN** `IdleViewModel` initialises at hour 19 with `displayName == 'Marcus Webb'`
- **WHEN** ViewModel emits its first non-loading state
- **THEN** `state.greetingScope == GreetingScope.TONIGHT`, `state.firstName == 'Marcus'`; AnnotatedString from `toMockState()` has italic span at `tonight` offset
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.greeting_scope_evening_returns_tonight'`

### AC-2: Greeting scope is TODAY for daytime hours
- **GIVEN** ViewModel initialises at hour 10 with displayName 'Marcus Webb'
- **WHEN** ViewModel emits first state
- **THEN** `state.greetingScope == GreetingScope.TODAY` and `state.firstName == 'Marcus'`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.greeting_scope_morning_returns_today'`

### AC-3: Meta row composes from WeatherSummary
- **GIVEN** `WeatherSummary(tempFahrenheit=68.4, conditionLabel='Clear', dayOfWeek=FRIDAY)` emitted
- **WHEN** ViewModel processes the weather update
- **THEN** `state.metaRow == 'FRIDAY · 68°F · CLEAR'`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.meta_row_formats_day_temp_condition'`

### AC-4: Weather advisory severity gates advisory card
- **GIVEN** `WeatherSummary` with `severity == WeatherSeverity.ADVISORY` emitted
- **WHEN** ViewModel processes the update
- **THEN** `state.showAdvisoryCard == true` and `state.advisoryMessage != null`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.advisory_severity_sets_show_advisory_card'`

### AC-5: firstName falls back to 'Rider' when displayName is blank
- **GIVEN** UserRepository emits user with blank `displayName`
- **WHEN** ViewModel processes the user update
- **THEN** `state.firstName == 'Rider'`
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.blank_display_name_fallback_to_rider'`

### AC-6: Favorite locations flow emits from Convex subscription
- **GIVEN** Fake `FavoritesRepository` emits `[FavoriteLocation(id='fav-1', lat=37.81, lon=-122.47, label='Home')]`
- **WHEN** ViewModel initialises with this repository
- **THEN** `state.favoriteLocations` contains exactly that one entry
- **VERIFY:** `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.favorites_flow_populates_state'`

---

## TEST CRITERIA

| ID    | Statement                                                                                | Maps To | Type        |
|-------|------------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | greetingScope is TONIGHT for hours 18-23 and 0-4                                         | AC-1    | happy_path  |
| TC-2  | greetingScope is TODAY for hours 5-17                                                    | AC-2    | happy_path  |
| TC-3  | metaRow matches `^[A-Z]+ · \d+°F · [A-Z ]+$` for valid WeatherSummary                    | AC-3    | happy_path  |
| TC-4  | WeatherSeverity.ADVISORY → showAdvisoryCard==true + non-null advisoryMessage             | AC-4    | edge_case   |
| TC-5  | Blank displayName → firstName == 'Rider'                                                 | AC-5    | edge_case   |
| TC-6  | One FavoriteLocation emission → state.favoriteLocations.size == 1                        | AC-6    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/data/weather/WeatherSummary.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/data/weather/WeatherRepository.kt` (NEW — interface)
- `android/app/src/main/java/com/laneshadow/data/weather/WeatherRepositoryImpl.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/data/favorites/FavoriteLocation.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/data/favorites/FavoritesRepository.kt` (NEW — interface)
- `android/app/src/main/java/com/laneshadow/data/favorites/FavoritesRepositoryImpl.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/di/IdleModule.kt` (NEW — Hilt @Binds)
- `android/app/src/test/java/com/laneshadow/ui/idle/IdleViewModelTest.kt` (NEW)

**writeProhibited:**
- `ios/**`, `tokens/**`, `server/**`, `react-native/**`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — out of scope (T02)
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` — out of scope (T02 wires favorites)

---

## BOUNDARIES

✅ **Always:**
- Use `_state.update { current -> current.copy(...) }` (UDF discipline)
- Use `@Inject constructor` for repositories
- Use `LocalLaneShadowTheme.current` for any color resolution

⚠️ **Ask First:**
- Adding a new column to existing tables
- Changing the `IdleUiState` field types after initial expansion

---

## DELIVERABLE

- `IdleUiState.kt` (MODIFY): adds 5 new fields + `GreetingScope` enum
- `IdleViewModel.kt` (MODIFY): `observeFavorites()`, `observeWeather()`, scope-aware greeting builder
- `IdleRoute.kt` (MODIFY): `toMockState()` with AnnotatedString construction
- `data/weather/{WeatherSummary, WeatherRepository, WeatherRepositoryImpl}.kt` (NEW)
- `data/favorites/{FavoriteLocation, FavoritesRepository, FavoritesRepositoryImpl}.kt` (NEW)
- `di/IdleModule.kt` (NEW): `@Binds` for both repositories
- `IdleViewModelTest.kt` (NEW): 6 unit tests

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Use fake repository implementations in tests (real interface, fake impl) — NOT mocks of HTTP responses (per project SUPREME RULE).

---

## READING LIST

1. `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:1-145` **[PRIMARY PATTERN]** — `observeCurrentUser()` and `observeSessions()` — replicate `.catch + .collect` for new flows
2. `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt:1-43` — current state shape + `buildGreeting`, `timeOfDayLabel` (extend, do not replace)
3. `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt:47-64` — `toMockState()` adapter; build AnnotatedString from `greetingScope + firstName` here
4. `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt:35-170` — `ConvexGateway` interface; `observeAuthenticatedFlow()` pattern for new weather + favorites
5. `.spec/design/system/views/mapapp/idle/idle-screen.html` — visual ground truth for italic scope word + copper meta row + advisory card

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Kotlin typecheck | `./gradlew :app:compileDebugKotlin` | Exit 0 |
| Unit tests | `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest'` | Exit 0, 6 tests pass |
| Detekt lint | `./gradlew detekt` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |

---

## OUT OF SCOPE

- LSMap warm-paper style + favorite pin overlays — IDLE-S06-AND-T02
- `LocationService` creation — IDLE-S06-AND-T03
- Instrumented end-to-end tests — IDLE-S06-AND-T04

---

## CONTEXT

**Current state:** `IdleViewModel.kt` exists; subscribes to currentUser + sessions via `ConvexClientProvider`. `IdleScreen.kt` already calls real `LSMap` (not a placeholder) — Android leads iOS on map integration. No weather, favorites flow, or greeting scope logic.

**Gap:** Sprint 6 gate requires real-data greeting + meta row + favorites for the map to show pin overlays in T02.

---

## REVIEW (for kotlin-reviewer)

**Must pass:**
- One test per AC; tests use fake repository interfaces, not mocked HTTP
- All state mutations through `_state.update { }` (UDF)
- AnnotatedString italic span targets only the scope word
- Repository @Singleton + @Inject constructor; bindings in `IdleModule`
- SCOPE respected

**Should verify:**
- Convex action/query names exactly match server: `weather.getCurrentWeather`, `favorites.listFavoriteLocations`
- `greetingScope` boundaries (18-23 + 0-4 → TONIGHT) inclusive correctly
- DayOfWeek display name locale handling

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html`
- `.spec/design/system/views/mapapp/idle/README.md` — `var(--signal-default)` for meta row, advisory card `wx-rain-tint` + `wx-rain` tokens, `Greeting.scope` definition

**Pattern:** Flow-based VM state composition: each new data source gets its own private `observeX()` fun launched in `viewModelScope`; updates `_state` via `.update { current -> current.copy(...) }` to mirror `IdleViewModel.observeCurrentUser():99-143`.

**Pattern source:** `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:99-143`

**Anti-pattern:** Merging all data fetching into a single launch block — failing weather would block favorites; each source needs independent coroutines.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01, IDLE-S06-CVX-T02
- **Blocks:** IDLE-S06-AND-T02, IDLE-S06-AND-T03, IDLE-S06-AND-T04
- **Parallel:** IDLE-S06-IOS-T01 (iOS twin)

---

## CODING STANDARDS

- `RULES.md` §Accessibility Standards (Android) — `contentDescription` on interactive elements; touch targets ≥48dp
- `RULES.md` §Cross-Platform Component Parity — sandbox story IDs unchanged
- `RULES.md` §Verification Standards — `./gradlew detekt`, `./gradlew :app:compileDebugKotlin` exact commands

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN hour=19,displayName='Marcus Webb' WHEN first state emits THEN greetingScope=TONIGHT,firstName='Marcus',italic span on 'tonight'","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.greeting_scope_evening_returns_tonight'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN hour=10 WHEN first state emits THEN greetingScope=TODAY","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.greeting_scope_morning_returns_today'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN WeatherSummary(68.4,'Clear',FRIDAY) WHEN weather flow emits THEN metaRow='FRIDAY · 68°F · CLEAR'","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.meta_row_formats_day_temp_condition'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN WeatherSeverity.ADVISORY WHEN processed THEN showAdvisoryCard=true","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.advisory_severity_sets_show_advisory_card'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN blank displayName WHEN user update processed THEN firstName='Rider'","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.blank_display_name_fallback_to_rider'"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN FavoritesRepository emits one FavoriteLocation WHEN VM initialises THEN state.favoriteLocations.size==1","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.favorites_flow_populates_state'"},
    {"id":"TC-1","type":"test_criterion","description":"greetingScope TONIGHT for hours 18-23 and 0-4","maps_to_ac":"AC-1","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.greeting_scope_evening_returns_tonight'"},
    {"id":"TC-2","type":"test_criterion","description":"greetingScope TODAY for hours 5-17","maps_to_ac":"AC-2","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.greeting_scope_morning_returns_today'"},
    {"id":"TC-3","type":"test_criterion","description":"metaRow matches regex","maps_to_ac":"AC-3","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.meta_row_formats_day_temp_condition'"},
    {"id":"TC-4","type":"test_criterion","description":"ADVISORY sets showAdvisoryCard","maps_to_ac":"AC-4","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.advisory_severity_sets_show_advisory_card'"},
    {"id":"TC-5","type":"test_criterion","description":"Blank displayName → 'Rider'","maps_to_ac":"AC-5","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.blank_display_name_fallback_to_rider'"},
    {"id":"TC-6","type":"test_criterion","description":"Single FavoriteLocation emission → size==1","maps_to_ac":"AC-6","verify":"./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.idle.IdleViewModelTest.favorites_flow_populates_state'"}
  ]
}
-->
