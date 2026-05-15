# IDLE-S06-IOS-T01 — iOS IdleViewModel evolution: favorites + weather flows + Greeting.scope + meta row

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01, UC-SCR-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/IdleViewModelTests
  typecheck: xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftlint lint ios/LaneShadow/Features/Idle
  tokens:    scripts/tokens/enforce-native-compliance.sh
```

---

## OUTCOME

`IdleViewModel` (an `@Observable @MainActor final class`) exposes `greetingDisplayName`, `greetingScope` (`GreetingScope.today | .tonight`), `metaRow`, `weatherSummary`, `weatherAdvisory`, `favoriteLocations`, `recentSessions`, `locationLabel`, `isLocationEnabled`, and `locationUnavailable` — all sourced from real Convex subscriptions/actions through `LaneShadowPlanningDataProviding` plus `LocationService`. The view consumes the model directly so `IdleScreen` renders `"Where are we riding {today|tonight}, {firstName}?"` (italic on scope word) above the meta row `"FRIDAY · 68°F · CLEAR"`.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** use `@Observable` + `@MainActor` on `IdleViewModel`; mark dependencies `@ObservationIgnored` for stores, services, and the convex client to avoid spurious view invalidation
- **MUST** structure each data flow as its own `Task<Void, Never>` returned from a private `observeX(convexClient:)` and store all five tasks in `observationTasks` for lifecycle cancellation in `stopObserving()`
- **MUST** compute `greetingScope` from `Calendar.current.component(.hour, from: Date())` via `GreetingScope.from(hour:)` — hours 18–23 and 0–4 → `.tonight`, otherwise → `.today`
- **MUST** consume Convex via `LaneShadowPlanningDataProviding` async sequences (`subscribeToCurrentUser`, `subscribeToSessions`, etc.) — never instantiate `ConvexClient` directly in the ViewModel
- **MUST** map Convex `WeatherSummary` → `CurrentWeatherSummary` (Swift) preserving `temperatureFahrenheit`, `condition`, `dayOfWeek`, `severity`; populate `weatherAdvisory` when `severity != .normal`
- **NEVER** block the main actor (no `Thread.sleep`, no synchronous I/O); cancellation must be `Task.cancel()` driven
- **NEVER** hardcode the suggestion-chip labels in views — they live on the ViewModel for testability
- **STRICTLY** follow the `Sendable` discipline: closures crossing actor boundaries are `@Sendable`; the `onSessionStarted` callback is `@MainActor @Sendable`

---

## DONE WHEN

- [x] AC-1: `greetingScope == .tonight` for hour 19; italic span on `tonight` (PRIMARY)
- [x] AC-2: `greetingScope == .today` for hour 10
- [x] AC-3: `metaRow == "FRIDAY · 68°F · CLEAR"` from `WeatherSummary(68, "CLEAR", .friday)`
- [x] AC-4: `weatherAdvisory != nil` when `severity == .advisory`
- [x] AC-5: Blank `displayName` → `greetingDisplayName == "rider"`
- [x] AC-6: One favorite emission → `favoriteLocations.count == 1`
- [x] `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests` exit 0
- [x] `swiftlint` clean; `enforce-native-compliance.sh` clean
- [x] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Greeting scope switches on time-of-day [PRIMARY]
- **GIVEN** `IdleViewModel` initialised at hour 19 with current user `displayName == "Marcus Webb"`
- **WHEN** `observe()` runs and the user subscription emits
- **THEN** `greetingScope == .tonight`, `greetingDisplayName == "Marcus"`; greeting `AttributedString` italicises only `tonight`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_greetingScope_evening_returnsTonight`

### AC-2: Greeting scope is .today for daytime hours
- **GIVEN** ViewModel initialised at hour 10 with displayName `"Marcus Webb"`
- **WHEN** `observe()` runs and emits first state
- **THEN** `greetingScope == .today`, `greetingDisplayName == "Marcus"`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_greetingScope_morning_returnsToday`

### AC-3: Meta row composes from weather summary
- **GIVEN** Convex `WeatherSummary(temperatureFahrenheit: 68, condition: "CLEAR", dayOfWeek: .friday)`
- **WHEN** the weather subscription emits
- **THEN** `metaRow == "FRIDAY · 68°F · CLEAR"`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_metaRow_formatsDayTempCondition`

### AC-4: Weather advisory severity surfaces advisory card payload
- **GIVEN** `WeatherSummary` with `severity == .advisory`
- **WHEN** the weather subscription emits
- **THEN** `weatherAdvisory != nil` with non-empty `message`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_advisorySeverity_setsWeatherAdvisory`

### AC-5: greetingDisplayName falls back to "rider" for blank displayName
- **GIVEN** Convex emits `currentUser` with blank `displayName`
- **WHEN** the user subscription processes the update
- **THEN** `greetingDisplayName == "rider"`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_blankDisplayName_fallsBackToRider`

### AC-6: Favorite locations flow populates from Convex subscription
- **GIVEN** `subscribeToFavoriteLocations` emits one `FavoriteLocation(name: "Highway 1", geometry: "...")`
- **WHEN** the ViewModel observes the stream
- **THEN** `favoriteLocations.count == 1` with the same name
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_favorites_populateState`

---

## TEST CRITERIA

| ID    | Statement                                                                          | Maps To | Type        |
|-------|------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | `greetingScope == .tonight` for hour 19; italic span on `tonight`                  | AC-1    | happy_path  |
| TC-2  | `greetingScope == .today` for hour 10                                              | AC-2    | happy_path  |
| TC-3  | `metaRow == "FRIDAY · 68°F · CLEAR"` for sample summary                            | AC-3    | happy_path  |
| TC-4  | `weatherAdvisory != nil` when `severity == .advisory`                              | AC-4    | edge_case   |
| TC-5  | Blank `displayName` → `greetingDisplayName == "rider"`                             | AC-5    | edge_case   |
| TC-6  | One favorite emission → `favoriteLocations.count == 1`                             | AC-6    | happy_path  |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (NEW or MODIFY)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (NEW)
- `ios/LaneShadow/Features/Idle/IdleWeatherTypes.swift` (NEW)
- `ios/LaneShadow/Sandbox/MockProviders/IdleMockProvider.swift` (MODIFY — extend mock to feed new fields)
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` (MODIFY — read new ViewModel fields)
- `ios/LaneShadowTests/Features/Idle/IdleViewModelTests.swift` (NEW)

**writeProhibited:**
- `android/**`, `server/**`, `react-native/**`, `tokens/**`
- `ios/LaneShadow/Views/Atoms/LSMap.swift` — out of scope (T02)
- `ios/LaneShadow/Services/LocationService.swift` — modified by T03 (do not refactor here)
- `ios/LaneShadow.xcodeproj/**` — generated; edit `ios/project.yml` only

---

## BOUNDARIES

✅ **Always:**
- Mark stored dependencies `@ObservationIgnored`
- Cancel observation tasks in `stopObserving()` before re-subscribing
- Use `Calendar.current` (not a hardcoded zero offset) for hour resolution

⚠️ **Ask First:**
- Adding a new Convex subscription beyond the five planned (`currentUser`, `sessions`, `weather`, `favoriteLocations`, `location`)
- Changing `LaneShadowPlanningDataProviding` protocol surface

---

## DELIVERABLE

- `IdleViewModel.swift` (NEW): `@Observable @MainActor final class` with five `observeX` flows + `observe()`/`stopObserving()` lifecycle
- `IdleScreenContainer.swift` (NEW): hosts `IdleScreen` and wires the ViewModel to environment dependencies
- `IdleWeatherTypes.swift` (NEW): `CurrentWeatherSummary`, `WeatherAdvisory`, `GreetingScope` (with `from(hour:)`), `WeatherSeverity`
- `IdleMockProvider.swift` (MODIFY): extend `IdleScreenState` with greetingScope, weather, advisory, favorites for sandbox stories
- `IdleViewModelTests.swift` (NEW): 6 unit tests using fake `LaneShadowPlanningDataProviding` (real protocol, fake impl)

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR. Use a fake `LaneShadowPlanningDataProviding` test double that returns `AsyncStream`s of pre-baked Convex DTOs. Do NOT mock URLSession or the Convex SDK; the protocol is the seam.

---

## READING LIST

1. `ios/LaneShadow/Features/Idle/IdleViewModel.swift:1-200` **[PRIMARY PATTERN]** — final implementation; observation lifecycle + five flows
2. `ios/LaneShadow/Features/Idle/IdleWeatherTypes.swift` — DTOs and `GreetingScope.from(hour:)`
3. `ios/LaneShadow/Sandbox/MockProviders/IdleMockProvider.swift` — sandbox state shape (S01–V03 variants)
4. `ios/LaneShadow/Views/Templates/IdleScreen.swift` — view consumer; verify it reads ViewModel fields, never mock data
5. `.spec/design/system/views/mapapp/idle/idle-screen.html` — visual ground truth for italic scope word + meta row + advisory card

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Build | `xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` | Exit 0 |
| Unit tests | `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests` | Exit 0; 6 tests pass |
| SwiftLint | `swiftlint lint ios/LaneShadow/Features/Idle` | Exit 0 |
| Token compliance | `scripts/tokens/enforce-native-compliance.sh` | Exit 0 |

---

## OUT OF SCOPE

- Mapbox warm-paper substrate + copper favorite pins — IDLE-S06-IOS-T02
- `LocationService` evolution + geocode pill — IDLE-S06-IOS-T03
- DesignReviewCaptureTests methods — IDLE-S06-IOS-T04

---

## CONTEXT

**Current state:** Pre-Sprint-06 `IdleViewModel.swift` (if any) only modelled chat + sessions; no weather, no favorites, no location, no greeting scope.

**Gap:** The map view's idle state needs five live data flows surfaced through one ViewModel so `IdleScreen` can compose its overlays from real Convex/Clerk/CoreLocation state.

---

## REVIEW (for swift-reviewer)

**Must pass:**
- `IdleViewModel` is `@Observable @MainActor final class`; dependencies `@ObservationIgnored`
- All five flows are independent `Task`s collected in `observationTasks`; `stopObserving()` cancels all
- One unit test per AC; tests use protocol-typed fakes (no `URLSession` or Convex SDK mocks)
- `GreetingScope.from(hour:)` boundary handling at hours 4/5 and 17/18 is exact
- SCOPE respected; no `LSMap` / `LocationService` mutations

**Should verify:**
- `Sendable` conformance on closures; no implicit retain cycles in capture lists
- `metaRow` regex `^[A-Z]+ · \d+°F · [A-Z ]+$` holds for advisory variant too
- `IdleScreen.swift` reads ViewModel fields directly (no parallel mock pipeline left in production code)

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/mapapp/idle/idle-screen.html`
- `.spec/design/system/views/mapapp/idle/README.md` — `Greeting.scope` rules; meta-row token recipe; advisory card variant

**Pattern:** Per-flow `observeX(convexClient:) -> Task<Void, Never>` returned from `startObserving()`; each flow `for await` consumes the Convex async sequence and updates published `@Observable` state on the main actor.

**Pattern source:** `ios/LaneShadow/Features/Idle/IdleViewModel.swift:60-200`

**Anti-pattern:** Single mega-task that `await`s all flows in series — failures in weather would block favorites from updating.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01, IDLE-S06-CVX-T02
- **Blocks:** IDLE-S06-IOS-T02, IDLE-S06-IOS-T03, IDLE-S06-IOS-T04
- **Parallel:** IDLE-S06-AND-T01 (Android twin)

---

## CODING STANDARDS

- `RULES.md` §Accessibility Standards (iOS) — `accessibilityLabel`/`accessibilityIdentifier` on every interactive element
- `RULES.md` §Multi-Agent Dispatch — orchestrator does not write Swift; this task is owned by `swift-implementer`
- `RULES.md` §Verification Standards — `xcodebuild` exact destination strings

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN hour=19,displayName='Marcus Webb' WHEN observe() emits THEN greetingScope=.tonight,greetingDisplayName='Marcus',italic span on 'tonight'","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_greetingScope_evening_returnsTonight"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN hour=10 WHEN first state THEN greetingScope=.today","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_greetingScope_morning_returnsToday"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN WeatherSummary(68,'CLEAR',.friday) WHEN weather emits THEN metaRow='FRIDAY · 68°F · CLEAR'","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_metaRow_formatsDayTempCondition"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN severity=.advisory WHEN weather emits THEN weatherAdvisory!=nil","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_advisorySeverity_setsWeatherAdvisory"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN blank displayName WHEN user emits THEN greetingDisplayName='rider'","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_blankDisplayName_fallsBackToRider"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN one favorite emission WHEN observed THEN favoriteLocations.count==1","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_favorites_populateState"},
    {"id":"TC-1","type":"test_criterion","description":"greetingScope=.tonight at hour 19","maps_to_ac":"AC-1","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_greetingScope_evening_returnsTonight"},
    {"id":"TC-2","type":"test_criterion","description":"greetingScope=.today at hour 10","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_greetingScope_morning_returnsToday"},
    {"id":"TC-3","type":"test_criterion","description":"metaRow matches design copy","maps_to_ac":"AC-3","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_metaRow_formatsDayTempCondition"},
    {"id":"TC-4","type":"test_criterion","description":"advisory severity sets weatherAdvisory","maps_to_ac":"AC-4","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_advisorySeverity_setsWeatherAdvisory"},
    {"id":"TC-5","type":"test_criterion","description":"Blank displayName falls back to 'rider'","maps_to_ac":"AC-5","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_blankDisplayName_fallsBackToRider"},
    {"id":"TC-6","type":"test_criterion","description":"One favorite emission populates state","maps_to_ac":"AC-6","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/test_favorites_populateState"}
  ]
}
-->
