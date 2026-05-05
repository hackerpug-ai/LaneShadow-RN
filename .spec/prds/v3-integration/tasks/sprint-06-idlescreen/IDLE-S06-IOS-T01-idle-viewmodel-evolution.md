# IDLE-S06-IOS-T01 — iOS IdleViewModel evolution: favorites + weather + Greeting.scope + meta-row

```
TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-CHAT-01, UC-MAP-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: xcodebuild -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES build
  lint:      swiftformat --quiet
```

---

## OUTCOME

`IdleViewModel` produces a time-of-day-aware greeting headline `"Where are we riding {today|tonight}, {firstName}?"` (italic scope word), a meta row `"FRIDAY · 68°F · CLEAR"` from real Convex weather data, and emits favorite locations + advisory severity for downstream T02/T03 to consume — all while keeping `IdleScreen.swift` a purely presentational template.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** extend `LaneShadowPlanningDataProviding` with `subscribeToFavoriteLocations() -> AsyncStream<[FavoriteLocation]>` and `fetchCurrentWeather(lat: Double, lng: Double) async throws -> WeatherSummary` — add to protocol AND `LaneShadowConvexClient` AND stub in `StubLaneShadowConvexClient`.
- **MUST** derive `firstName` by splitting `displayName` on first whitespace; empty/nil falls back to literal `"rider"`.
- **MUST** compute `Greeting.scope` from `Calendar.current.component(.hour, from: Date())` — `hour < 17` → `"today"`, `hour >= 17` → `"tonight"`. Dark colorScheme alone does NOT flip scope.
- **MUST** compose `metaRow` exactly as `"{WEEKDAY_UPPERCASE} · {TEMP}°F · {CONDITION_UPPERCASE}"` (e.g. `"FRIDAY · 68°F · CLEAR"`).
- **MUST** keep all existing observation tasks (`subscribeToCurrentUser`, `subscribeToSessions`) intact; new subscriptions append to `observationTasks` array.
- **NEVER** hardcode color literals — use `LaneShadowTheme.color.signal.default` (copper), `theme.colors.onSurface.default` (headline body).
- **NEVER** stub real Convex subscription results in unit tests — use `StubLaneShadowConvexClient` continuation injection (real interface, fake impl).
- **STRICTLY** keep `IdleScreenTests.swift` AC-6 `no_data_fetching_symbols` passing — `IdleScreen.swift` MUST NOT import `ConvexMobile`, `CoreLocation`, or call `.task()`.

---

## DONE WHEN

- [ ] AC-1: Greeting scope computes `today` for hour 14 (PRIMARY)
- [ ] AC-2: Greeting scope computes `tonight` for hour 19
- [ ] AC-3: `firstName` extracts from `displayName='Cameron Riley'` → `Cameron`; empty → `rider`
- [ ] AC-4: `metaRow` composes to `"FRIDAY · 68°F · CLEAR"` from `WeatherSummary(68, 'clear')` on Friday
- [ ] AC-5: Weather advisory severity propagates to `weatherAdvisory` non-nil
- [ ] AC-6: Existing `IdleScreenTests/no_data_fetching_symbols` still passes
- [ ] All listed `xcodebuild test` commands exit 0; format clean
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Greeting scope `today` before 5pm [PRIMARY]
- **GIVEN** `IdleViewModel.startObserving()` is called and current hour is 14 (2pm)
- **WHEN** `greetingHeadline` is read
- **THEN** headline equals `"Where are we riding today, {firstName}?"` and `emphasis == "today"`
- **TDD_STATE:** none → red → green → refactor
- **TEST_FILE:** `ios/LaneShadowTests/Features/Idle/IdleViewModelTests.swift`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/greetingScope_morning_producesToday`

### AC-2: Greeting scope `tonight` at/after 5pm
- **GIVEN** current hour is 19 (7pm)
- **WHEN** `greetingHeadline` is read
- **THEN** headline equals `"Where are we riding tonight, {firstName}?"` and `emphasis == "tonight"`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/greetingScope_evening_producesTonight`

### AC-3: firstName extraction from displayName
- **GIVEN** `StubLaneShadowConvexClient` yields `LaneShadowCurrentUser(name: 'Cameron Riley')`
- **WHEN** ViewModel processes the `currentUser` update
- **THEN** `greetingDisplayName == 'Cameron'`; if name is empty → `greetingDisplayName == 'rider'`
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/firstName_extractedFromDisplayName`

### AC-4: metaRow composes correctly from weather data
- **GIVEN** `fetchCurrentWeather` returns `WeatherSummary(temperatureF:68, condition:'clear')` on a Friday
- **WHEN** `metaRow` is read
- **THEN** `metaRow == "FRIDAY · 68°F · CLEAR"` (weekday + condition uppercased; degree symbol present)
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/metaRow_composesFromWeatherData`

### AC-5: Weather advisory severity propagates
- **GIVEN** `fetchCurrentWeather` returns `WeatherSummary(severity:.advisory, condition:'Heavy rain')`
- **WHEN** `viewModel.weatherAdvisory` is read
- **THEN** non-nil with appropriate label + body; viewModel exposes `weatherAdvisory` as a Bool flag for upstream tinting
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/weatherAdvisory_severityPropagates`

### AC-6: Existing IdleScreenTests no_data_fetching_symbols still passes
- **GIVEN** `IdleScreen.swift` template has not gained any `Convex`, `CLLocationManager`, or `.task()` symbols
- **WHEN** the regression test runs
- **THEN** test passes (data binding flows through view init params only)
- **VERIFY:** `xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/no_data_fetching_symbols`

---

## TEST CRITERIA

| ID    | Statement                                                                              | Maps To | Type        |
|-------|----------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | hour=14 → headline contains 'today', emphasis='today'                                  | AC-1    | happy_path  |
| TC-2  | hour=19 → headline contains 'tonight', emphasis='tonight'                              | AC-2    | happy_path  |
| TC-3  | name='Cameron Riley' → greetingDisplayName='Cameron'                                   | AC-3    | happy_path  |
| TC-4  | empty name → greetingDisplayName='rider'                                               | AC-3    | edge_case   |
| TC-5  | WeatherSummary(68,'clear') on Friday → metaRow='FRIDAY · 68°F · CLEAR'                 | AC-4    | happy_path  |
| TC-6  | severity:.advisory → viewModel.weatherAdvisory non-nil                                 | AC-5    | happy_path  |
| TC-7  | IdleScreen.swift contains no `Convex`, `CLLocationManager`, or `.task(` patterns       | AC-6    | regression  |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` (MODIFY)
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` (MODIFY)
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (MODIFY — add protocol methods + enum cases)
- `ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift` (MODIFY — stub implementations)
- `ios/LaneShadowTests/Features/Idle/IdleViewModelTests.swift` (NEW)

**writeProhibited:**
- `android/**`, `tokens/**`, `server/**`, `react-native/**`
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — READ ONLY; must not gain data-fetch symbols

---

## BOUNDARIES

✅ **Always:**
- Use `@MainActor @Observable` (never `ObservableObject`/`@Published`)
- Append new subscription `Task`s to `observationTasks` array; cancel in `stopObserving()`
- Use theme tokens for all colors

⚠️ **Ask First:**
- Adding any new dependency on `LaneShadowPlanningDataProviding`
- Changing the existing `subscribeToCurrentUser`/`subscribeToSessions` signatures

---

## DELIVERABLE

- `IdleViewModel.swift` (MODIFY): adds `metaRow`, `greetingHeadline`, `greetingDisplayName` (firstName), `weatherAdvisory`, `favorites`, `userLocation` (nil-init for T02), and `Greeting.scope` computation
- `IdleScreenContainer.swift` (MODIFY): pipes `metaRow` and `greeting` struct through to `IdleScreen`
- `ConvexClient+LaneShadow.swift` (MODIFY): adds `LaneShadowConvexQuery.listFavoriteLocations`, `LaneShadowConvexAction.getCurrentWeather`, plus `subscribeToFavoriteLocations`, `fetchCurrentWeather` to protocol + impl
- `StubLaneShadowConvexClient.swift` (MODIFY): stub impls with continuation injection
- `IdleViewModelTests.swift` (NEW): 7 tests covering AC-1..AC-5 plus fallback edge case

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: RED → GREEN → REFACTOR.

**RED:** Write one failing test in `IdleViewModelTests.swift`. Run `xcodebuild test -only-testing:...`. VERIFY FAILS.

**GREEN:** Write minimal Swift in `IdleViewModel.swift` (and protocol/stub if needed). Re-run; VERIFY PASSES.

**REFACTOR:** Stay green. Tests still pass.

After all 5 ACs are GREEN, run AC-6 regression check.

---

## READING LIST (max 5)

1. `ios/LaneShadow/Features/Idle/IdleViewModel.swift:1-124` **[PRIMARY PATTERN]** — full ViewModel; `observationTasks` append pattern lines 48-76; `subscribeToCurrentUser` subscription; `@ObservationIgnored convexClient`
2. `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift:1-60, 231-258` — `LaneShadowConvexQuery`/`Action` enums; `LaneShadowPlanningDataProviding` protocol; `subscribe()` and `action()` patterns
3. `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift:1-35` — container wiring; passes `greetingDisplayName`, `suggestionLabels` to `IdleScreen`
4. `ios/LaneShadowTests/Features/Idle/IdleScreenWiringTests.swift:1-50` — `StubLaneShadowConvexClient` usage; `sendCurrentUser()` injection; `pumpMainActor()` helper
5. `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth: copper meta row, Newsreader opinion-xl italic `today`/`tonight`

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Swift format | `swiftformat ios/LaneShadow/Features/Idle/IdleViewModel.swift ... --quiet` | Exit 0 |
| Build check | `xcodebuild ... build` | Exit 0 |
| Unit tests — T01 ACs | `xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests` | Exit 0, 7 tests pass |
| Regression — IdleScreenTests/no_data_fetching_symbols | `xcodebuild test -only-testing:.../no_data_fetching_symbols` | Exit 0 |
| Regression — IdleScreenWiringTests full | `xcodebuild test -only-testing:LaneShadowTests/IdleScreenWiringTests` | Exit 0 |

---

## OUT OF SCOPE

- Replacing `LSPaperMap` with `LSMap` — that's IDLE-S06-IOS-T02
- `LocationService` creation — IDLE-S06-IOS-T03
- `DesignReviewCaptureTests` capture methods — IDLE-S06-IOS-T04

---

## CONTEXT

**Current state:** `IdleViewModel.swift` exists (124 lines); subscribes to `currentUser` + `sessions`; sets `greetingDisplayName` from `displayName` (no first-name extraction); no weather, no favorites, no `Greeting.scope`. `IdleScreen.swift` shows hardcoded `"Good morning, {name}"` headline.

**Gap:** Sprint 6 gate requires `"Where are we riding *today/tonight*, {firstName}?"` in Newsreader opinion-xl italic + meta row in copper — both must be driven by real Convex data.

---

## REVIEW (for swift-reviewer)

**Must pass:**
- One test per AC; tests verify behavior not implementation
- RED evidence in TDD_STATE history
- `IdleScreen.swift` template still has zero data-fetch symbols (grep: `Convex`, `CLLocationManager`, `.task(`)
- All colors via theme tokens; no `Color(0x...)` or `Color.blue` literals
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed)

**Should verify:**
- `Greeting.scope` is exclusively driven by hour-of-day; `colorScheme` does not influence it
- `firstName` whitespace split is locale-safe
- New `LaneShadowConvexQuery` / `Action` enum cases match Convex function names

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth for greeting overlay
- `.spec/design/system/views/idle-screen/README.md` — Token Recipe: `signal.default` for meta row, `Greeting.scope` definition (S01 light `today`, S03 dark `tonight`), advisory card `wx-rain-tint` + `wx-rain` tokens

**Pattern:** `@MainActor @Observable` ViewModel with `observationTasks: [Task<Void, Never>]` — new subscriptions appended to array in `startObserving()`.

**Pattern source:** `ios/LaneShadow/Features/Idle/IdleViewModel.swift:48-76`

**Anti-pattern:** Don't switch `IdleScreen.swift` to pull data via `@Environment` — template stays purely presentational.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-CVX-T01, IDLE-S06-CVX-T02 (provides the new endpoints)
- **Blocks:** IDLE-S06-IOS-T02, IDLE-S06-IOS-T03, IDLE-S06-IOS-T04
- **Parallel:** IDLE-S06-AND-T01 (Android twin)

---

## CODING STANDARDS

- `RULES.md` §Verification Standards — `xcodebuild test` exact command
- `RULES.md` §Accessibility Standards (iOS) — accessibilityLabel/Hint required
- `brain/docs/CODING-STANDARDS.md` — Swift 6 concurrency safety, `[weak self]` capture rules

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN hour=14 WHEN greetingHeadline read THEN contains 'today' with emphasis='today'","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/greetingScope_morning_producesToday"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN hour=19 WHEN greetingHeadline read THEN contains 'tonight' with emphasis='tonight'","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/greetingScope_evening_producesTonight"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN currentUser.name='Cameron Riley' WHEN processed THEN greetingDisplayName='Cameron'; empty → 'rider'","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/firstName_extractedFromDisplayName"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN WeatherSummary(temperatureF:68,condition:'clear') Friday WHEN metaRow read THEN equals 'FRIDAY · 68°F · CLEAR'","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/metaRow_composesFromWeatherData"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN advisory severity weather WHEN viewModel.weatherAdvisory read THEN non-nil","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/weatherAdvisory_severityPropagates"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN IdleScreen.swift template WHEN no_data_fetching_symbols runs THEN passes","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/no_data_fetching_symbols"},
    {"id":"TC-1","type":"test_criterion","description":"hour=14 produces today emphasis","maps_to_ac":"AC-1","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/greetingScope_morning_producesToday"},
    {"id":"TC-2","type":"test_criterion","description":"hour=19 produces tonight emphasis","maps_to_ac":"AC-2","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/greetingScope_evening_producesTonight"},
    {"id":"TC-3","type":"test_criterion","description":"Cameron Riley → Cameron","maps_to_ac":"AC-3","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/firstName_extractedFromDisplayName"},
    {"id":"TC-4","type":"test_criterion","description":"empty name → rider","maps_to_ac":"AC-3","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/firstName_fallbackToRider"},
    {"id":"TC-5","type":"test_criterion","description":"metaRow Friday/68/CLEAR","maps_to_ac":"AC-4","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/metaRow_composesFromWeatherData"},
    {"id":"TC-6","type":"test_criterion","description":"advisory severity propagates","maps_to_ac":"AC-5","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleViewModelTests/weatherAdvisory_severityPropagates"},
    {"id":"TC-7","type":"test_criterion","description":"no_data_fetching_symbols regression passes","maps_to_ac":"AC-6","verify":"xcodebuild test -only-testing:LaneShadowTests/IdleScreenTests/no_data_fetching_symbols"}
  ]
}
-->
