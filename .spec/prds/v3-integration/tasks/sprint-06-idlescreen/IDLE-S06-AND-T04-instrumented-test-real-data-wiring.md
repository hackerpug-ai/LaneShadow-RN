# IDLE-S06-AND-T04 — Android instrumented test verifying IdleScreen real-data wiring on emulator

```
TASK_TYPE:  TEST
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-SCR-01, UC-CHAT-01

RUNTIME_COMMANDS:
  test_compile: ./gradlew :app:compileDebugAndroidTestKotlin
  test:         ./gradlew :app:connectedDebugAndroidTest
  lint:         ./gradlew detekt
```

---

## OUTCOME

`IdleScreenInstrumentedTest.kt` adds 6 end-to-end tests (TC-5..TC-10) that sign in via real Clerk auth, launch `MainActivity`, and assert real-data rendering: greeting first name, meta row format, Mapbox map presence, location pill, suggestion-chip → is-active state, and dark-mode "tonight" rewrite.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** use real Clerk credentials from `.env.local` (`CLERK_TEST_EMAIL` / `CLERK_TEST_PASSWORD`) — per Sprint 03 RF-38, NO `bypassAuthForTesting` or fake auth tokens.
- **MUST** launch `MainActivity` via `ActivityScenario<MainActivity>` (not `createComposeRule()`) so the real Hilt DI graph, Convex subscription, and FusedLocationProvider are wired.
- **MUST** add testTag `idlescreen-map` assertion (AC-3) — depends on T02 being merged first; coordinate test order with T02.
- **MUST** run via `./gradlew :app:connectedDebugAndroidTest` on API 30+ AVD with Google Play Services.
- **MUST** simulate emulator location via `adb shell geo fix {lon} {lat}` BEFORE launching MainActivity so location pill resolves.
- **MUST** assert dark-mode rewrite: programmatically toggle system dark mode via `adb shell cmd uimode night yes` and re-assert greeting contains 'tonight' (gated by `Assume.assumeTrue(LocalTime.now().hour >= 18)` if time cannot be controlled).
- **NEVER** mock Convex responses in instrumented tests — real Convex subscription against `BuildConfig.CONVEX_DEPLOYMENT`.
- **NEVER** use Espresso IdlingResource stubs / test doubles for auth — Clerk WebView flow must complete end-to-end.
- **NEVER** mark Android assertions PASS based on iOS evidence — Android must produce its own exit-0 `gradlew` result.
- **STRICTLY** extend the EXISTING file `IdleScreenInstrumentedTest.kt` — do not create a parallel test class.

---

## DONE WHEN

- [ ] AC-1: Greeting headline contains rider's first name (PRIMARY)
- [ ] AC-2: Meta row matches `^[A-Z]+ · \d+°F · [A-Z ]+$`
- [ ] AC-3: Mapbox map view rendered (testTag `idlescreen-map` displayed)
- [ ] AC-4: Location pill shows 'Near {city}, {state}' or NEEDED
- [ ] AC-5: Suggestion chip tap shifts LSChatInput to is-active (send button visible)
- [ ] AC-6: Dark mode + hour ≥ 18 rewrites greeting to 'tonight'
- [ ] `./gradlew :app:connectedDebugAndroidTest` exits 0; all 10 tests pass (TC-1..TC-4 pre-existing, TC-5..TC-10 new)
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: Greeting headline contains rider's first name [PRIMARY]
- **GIVEN** Real Clerk sign-in with `CLERK_TEST_EMAIL` whose display name is e.g. 'Marcus Webb'
- **WHEN** MainActivity launches and IdleScreen visible
- **THEN** `onNode(hasText('Marcus', substring=true)).assertIsDisplayed()` passes; headline does NOT contain 'Rider' fallback
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc5_greeting_headline_contains_first_name'`

### AC-2: Meta row matches DAY · TEMP°F · COND format
- **GIVEN** Weather data available from Convex for test environment
- **WHEN** IdleScreen greeting overlay visible
- **THEN** `onNodeWithTag('greeting-meta')` text matches regex `^[A-Z]+ · \d+°F · [A-Z ]+$`
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc6_meta_row_matches_day_temp_cond_format'`

### AC-3: Mapbox map view rendered
- **GIVEN** IdleScreen visible with valid Mapbox token
- **WHEN** View hierarchy is inspected
- **THEN** `onNodeWithTag('idlescreen-map').assertIsDisplayed()` passes (testTag added in T02)
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc7_map_view_rendered'`

### AC-4: Location pill shows 'Near {city}, {state}' or NEEDED
- **GIVEN** Emulator received `adb shell geo fix -122.06 37.33` before test launch
- **WHEN** IdleScreen visible
- **THEN** `onNodeWithTag('ls-location-context-bar-location-pill')` text contains 'Near ' prefix; OR if permission denied, `onNodeWithTag('ls-location-context-bar-mode-pill')` text == 'NEEDED'
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc8_location_pill_shows_geocode_or_needed'`

### AC-5: Suggestion chip tap shifts LSChatInput to is-active
- **GIVEN** IdleScreen visible with suggestion chips
- **WHEN** First suggestion chip tapped via `performClick()`
- **THEN** Chip label appears in chat input field; send button (`LSButton` with `IconName.Send`) visible in trailing slot
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc9_suggestion_chip_tap_activates_chat_input'`

### AC-6: Dark mode + hour ≥ 18 rewrites greeting to 'tonight'
- **GIVEN** System dark mode toggled via `adb shell cmd uimode night yes`; test runs at or after 18:00 device time
- **WHEN** IdleScreen recomposes
- **THEN** `onNodeWithTag('greeting-headline')` text contains 'tonight'; OR `Assume.assumeTrue(LocalTime.now().hour >= 18)` skips test with documented comment
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc10_dark_mode_rewrites_greeting_to_tonight'`

---

## TEST CRITERIA

| ID    | Statement                                                                          | Maps To | Type        |
|-------|------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | greeting headline contains test user's first name (not 'Rider')                    | AC-1    | happy_path  |
| TC-2  | meta row matches `^[A-Z]+ · \d+°F · [A-Z ]+$`                                       | AC-2    | happy_path  |
| TC-3  | testTag 'idlescreen-map' is displayed                                              | AC-3    | happy_path  |
| TC-4  | Location pill contains 'Near ' prefix OR mode pill reads 'NEEDED'                  | AC-4    | edge_case   |
| TC-5  | First suggestion chip tap populates input + send button visible                    | AC-5    | happy_path  |
| TC-6  | Dark mode + hour ≥ 18 → greeting contains 'tonight'                                | AC-6    | edge_case   |

---

## SCOPE

**writeAllowed:**
- `android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt` (MODIFY — append `tc5` through `tc10` test methods)

**writeProhibited:**
- `ios/**`, `tokens/**`, `server/**`, `react-native/**`
- `android/app/src/main/**` — production code is locked at this point
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` — out of scope
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` — out of scope

---

## BOUNDARIES

✅ **Always:**
- `@RunWith(AndroidJUnit4::class)` + `@HiltAndroidTest` annotations
- `HiltAndroidRule` + `ActivityScenario` for tests needing real DI graph
- `composeTestRule.waitUntil(5000)` to wait for Convex subscription before asserting

⚠️ **Ask First:**
- Adding a new emulator setup script
- Bumping AVD API level beyond 30

---

## DELIVERABLE

- `IdleScreenInstrumentedTest.kt` (MODIFY): appends 6 new test methods (`tc5` through `tc10`); preserves existing `tc1` through `tc4`

---

## AGENT INSTRUCTIONS

For each AC: write test method → run on emulator with `adb shell geo fix` + auth credentials seeded → verify exit 0 + assertion pass. Coordinate with T02 merge for AC-3 (testTag).

---

## READING LIST

1. `android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt:1-272` **[PRIMARY PATTERN]** — full existing test class; new tests append; switch from `createComposeRule()` to `ActivityScenario` for real DI tests
2. `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt:17-44` — wires `hiltViewModel + Convex subscriptions; instrumented test exercises this exact path
3. `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt:1-145` — `@HiltViewModel` auto-injected by ActivityScenario
4. `android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt:22-30` — testTag constants `LSLocationContextBarLocationPillTag`, `LSLocationContextBarModePillTag`
5. `.spec/design/system/views/idle-screen/idle-screen.html` — pixel reference for assertions

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Kotlin typecheck (test source) | `./gradlew :app:compileDebugAndroidTestKotlin` | Exit 0 |
| Instrumented tests | `./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest'` | Exit 0, 10 tests pass (4 pre-existing + 6 new) |
| Detekt lint | `./gradlew detekt` | Exit 0 |

---

## OUT OF SCOPE

- Physical-device automation (Android lacks XCUITest equivalent — emulator-only per RULES.md §Real Device E2E)
- Cross-emulator parity testing
- Performance / motion timing assertions

---

## CONTEXT

**Current state:** `IdleScreenInstrumentedTest.kt` exists with `tc1` through `tc4` covering sandbox-style assertions. Real-data wiring tests not present.

**Gap:** Sprint 6 gate requires Android instrumented test exercising real Convex + real Clerk + real FusedLocation against the live `MainActivity`.

---

## REVIEW (for kotlin-reviewer)

**Must pass:**
- One test method per AC (6 total); all use real Clerk auth (no bypass)
- ActivityScenario + HiltAndroidRule for real DI
- No mocked Convex responses; assertions satisfied by real subscription data
- testTag `idlescreen-map` is on Box wrapper (matches T02 placement)
- SCOPE respected — only `IdleScreenInstrumentedTest.kt` modified

**Should verify:**
- `Assume.assumeTrue` for time-of-day-dependent test (AC-6) avoids false failure
- `composeTestRule.waitUntil` timeouts are reasonable (≤5s)
- Emulator preconditions documented in test class comments

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html`
- `.spec/design/system/views/idle-screen/README.md` — variant specs S01-V03 + dark mode 'tonight' trigger

**Pattern:** ActivityScenario-based real DI instrumented test: `@HiltAndroidTest + HiltAndroidRule + ActivityScenario.launch(MainActivity::class.java)`; `composeTestRule.waitUntil(5000)` for Convex subscription delivery.

**Pattern source:** `android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSToolbarUiTest.kt` (Hilt instrumented pattern, if present)

**Anti-pattern:** Using `createComposeRule()` with static mock content — violates the project SUPREME RULE (no stubbing).

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-AND-T01, IDLE-S06-AND-T02, IDLE-S06-AND-T03 (all production wiring lands first)
- **Blocks:** IDLE-S06-T11 (sprint gate)
- **Parallel:** IDLE-S06-IOS-T04 (iOS twin)

---

## CODING STANDARDS

- `RULES.md` §Real Device E2E Testing — Android instrumented tests on emulator are acceptable; physical-device evidence MANUAL/BLOCKED until Android device harness exists
- `RULES.md` §Verification Standards — `./gradlew :app:connectedDebugAndroidTest` exact command
- Global `CLAUDE.md` §SUPREME RULE — no stubbed Convex; no mock auth; tests hit real services

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN real Clerk sign-in WHEN IdleScreen visible THEN greeting contains first name (not 'Rider')","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc5_greeting_headline_contains_first_name'"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN Convex weather WHEN IdleScreen visible THEN meta row matches ^[A-Z]+ · \\d+°F · [A-Z ]+$","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc6_meta_row_matches_day_temp_cond_format'"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN valid Mapbox token WHEN IdleScreen visible THEN testTag 'idlescreen-map' displayed","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc7_map_view_rendered'"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN emulator geo fix WHEN IdleScreen visible THEN location pill 'Near ' or mode 'NEEDED'","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc8_location_pill_shows_geocode_or_needed'"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN suggestion chips WHEN tapped THEN input contains chip label + send button visible","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc9_suggestion_chip_tap_activates_chat_input'"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN dark mode + hour>=18 WHEN IdleScreen recomposes THEN greeting contains 'tonight'","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc10_dark_mode_rewrites_greeting_to_tonight'"},
    {"id":"TC-1","type":"test_criterion","description":"first name in headline","maps_to_ac":"AC-1","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc5_greeting_headline_contains_first_name'"},
    {"id":"TC-2","type":"test_criterion","description":"meta row regex","maps_to_ac":"AC-2","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc6_meta_row_matches_day_temp_cond_format'"},
    {"id":"TC-3","type":"test_criterion","description":"testTag idlescreen-map displayed","maps_to_ac":"AC-3","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc7_map_view_rendered'"},
    {"id":"TC-4","type":"test_criterion","description":"location pill 'Near ' or NEEDED","maps_to_ac":"AC-4","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc8_location_pill_shows_geocode_or_needed'"},
    {"id":"TC-5","type":"test_criterion","description":"chip tap → input + send","maps_to_ac":"AC-5","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc9_suggestion_chip_tap_activates_chat_input'"},
    {"id":"TC-6","type":"test_criterion","description":"dark mode + evening → tonight","maps_to_ac":"AC-6","verify":"./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.templates.IdleScreenInstrumentedTest.tc10_dark_mode_rewrites_greeting_to_tonight'"}
  ]
}
-->
