# IDLE-S06-AND-T04 — Android instrumented test real-data wiring

```
TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT:     sprint-06-idlescreen → ./SPRINT.md
PRD_REFS:   UC-MAP-01, UC-CHAT-01, UC-FID-01

RUNTIME_COMMANDS:
  test:      ./gradlew :app:connectedDebugAndroidTest
  compile:   ./gradlew :app:compileDebugAndroidTestKotlin
  typecheck: ./gradlew :app:compileDebugKotlin
  lint:      ./gradlew detekt
```

---

## OUTCOME

`androidTest/.../ui/templates/IdleScreenInstrumentedTest.kt` covers the idle map view with 8 instrumented Compose tests using stable test tags (`greeting-overlay`, `greeting-meta`, `greeting-headline`, `chat-input`, `idlescreen-map`, `advisory-card`, `ls-topbar`). The suite validates that production composables render correctly when fed `IdleScreenState` simulating real-data outputs from `IdleViewModel`. Tests run via `./gradlew :app:connectedDebugAndroidTest` against a connected emulator / device.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** add at least 8 instrumented tests covering: greeting overlay (header + meta), chat-input with location badge, map with favorite locations, top-bar with menu, advisory card visibility, no-location variant, suggestion chips, italic emphasis on scope word
- **MUST** use stable Compose test tags (`greeting-overlay`, `greeting-meta`, `greeting-headline`, `chat-input`, `idlescreen-map`, `advisory-card`, `ls-topbar`) — these tags are part of the Cross-Platform Component Parity contract for design-review tooling
- **MUST** consume `IdleScreenState` from the debug source set's `MockProviders` to simulate real-data outputs without touching production wiring
- **MUST** verify the `FavoriteLocation` data class parameter names (`id`, `lat`, `lon`, `label`) — per AND-T04 learnings, names diverged from convention previously
- **NEVER** mock Convex / Hilt graph in instrumented tests; the test feeds composable inputs directly via `IdleScreenState`
- **NEVER** introduce flaky Thread.sleep waits; use `composeTestRule.waitUntil { ... }` or `onNodeWithTag(...).assertExists()` polling
- **STRICTLY** call out instrumented test limitations in test class KDoc: emulator/device required, no `--tests` filtering, debug source set scoping

---

## DONE WHEN

- [x] AC-1: ≥8 instrumented test methods present in `IdleScreenInstrumentedTest.kt` (PRIMARY)
- [x] AC-2: Tests use stable test tags from the parity list
- [x] AC-3: `./gradlew :app:compileDebugAndroidTestKotlin` exit 0
- [x] AC-4: `./gradlew :app:connectedDebugAndroidTest` exit 0 against an emulator/device with all instrumented tests passing
- [x] AC-5: `FavoriteLocation` parameter names verified (`id`, `lat`, `lon`, `label`) — no `latitude`/`longitude`
- [x] `./gradlew detekt` clean

---

## ACCEPTANCE CRITERIA

### AC-1: Eight instrumented tests present [PRIMARY]
- **GIVEN** `IdleScreenInstrumentedTest.kt`
- **WHEN** searched for `@Test` annotations
- **THEN** ≥8 instrumented methods exist (greeting overlay, chat-input + location badge, map + favorites, top-bar, advisory card, no-location, suggestion chips, italic emphasis)
- **VERIFY:** `grep -c "^[[:space:]]*@Test" android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt` ≥ 8

### AC-2: Stable test tags used
- **GIVEN** instrumented test bodies
- **WHEN** searched for `onNodeWithTag(`
- **THEN** all required tags appear at least once: `greeting-overlay`, `greeting-meta`, `greeting-headline`, `chat-input`, `idlescreen-map`, `advisory-card`, `ls-topbar`
- **VERIFY:** `grep -E 'onNodeWithTag\("(greeting-overlay|greeting-meta|greeting-headline|chat-input|idlescreen-map|advisory-card|ls-topbar)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt | wc -l` ≥ 7

### AC-3: Instrumented tests compile
- **GIVEN** all instrumented sources committed
- **WHEN** `./gradlew :app:compileDebugAndroidTestKotlin` runs
- **THEN** Exit 0 with no Kotlin compilation errors
- **VERIFY:** `./gradlew :app:compileDebugAndroidTestKotlin`

### AC-4: Instrumented tests pass on emulator
- **GIVEN** an emulator/device connected
- **WHEN** `./gradlew :app:connectedDebugAndroidTest` runs
- **THEN** Exit 0; all `IdleScreenInstrumentedTest` methods pass
- **VERIFY:** `./gradlew :app:connectedDebugAndroidTest`

### AC-5: FavoriteLocation parameter names verified
- **GIVEN** `FavoriteLocation.kt` source
- **WHEN** field declarations inspected
- **THEN** the data class declares `id`, `lat`, `lon`, `label` (no `latitude`, no `longitude`)
- **VERIFY:** `grep -E "data class FavoriteLocation\(" android/app/src/main/java/com/laneshadow/data/favorites/FavoriteLocation.kt` and inspect

---

## TEST CRITERIA

| ID    | Statement                                                                  | Maps To | Type        |
|-------|----------------------------------------------------------------------------|---------|-------------|
| TC-1  | `@Test` count in IdleScreenInstrumentedTest.kt ≥ 8                          | AC-1    | happy_path  |
| TC-2  | All seven stable test tags referenced                                       | AC-2    | happy_path  |
| TC-3  | `compileDebugAndroidTestKotlin` exit 0                                      | AC-3    | happy_path  |
| TC-4  | `connectedDebugAndroidTest` exit 0 on emulator                              | AC-4    | happy_path  |
| TC-5  | `FavoriteLocation` declares `id, lat, lon, label`                           | AC-5    | edge_case   |

---

## SCOPE

**writeAllowed:**
- `android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt` (NEW)
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleScreen.kt` (MODIFY — add Modifier.testTag for required tags if missing)
- `android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt` (MODIFY — testTag if missing)
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` (MODIFY — testTag if missing)

**writeProhibited:**
- `ios/**`, `server/**`, `react-native/**`, `tokens/**`
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` — owned by T01
- `android/app/src/main/java/com/laneshadow/data/location/**` — owned by T03
- `android/app/src/main/java/com/laneshadow/data/favorites/FavoriteLocation.kt` — read-only here (verify only)

---

## BOUNDARIES

✅ **Always:**
- Use stable Compose test tags
- Document instrumented limitations in class KDoc (no `--tests` filter, emulator/device required)
- Feed real-data shapes via `IdleScreenState` from debug `MockProviders`

⚠️ **Ask First:**
- Adding Hilt testing dependencies for true integration tests (significant infra change)
- Switching to screenshot-based instrumented tests (overlap with design-review pipeline)
- Adding Espresso-only flows that bypass Compose

---

## DELIVERABLE

- `IdleScreenInstrumentedTest.kt` (NEW): 8 instrumented tests using stable tags + `IdleScreenState` mock data
- KDoc on test class noting limitations + `pnpm`/`gradle` invocation patterns
- testTag adjustments on production composables if any tag was missing

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC: write the instrumented test first, watch it fail (RED requires emulator running), implement minimal production-side `Modifier.testTag` updates if any tag was missing, re-run, watch it pass (GREEN), then refactor for clarity. Document AND-T04 learnings in `android-learnings.md` (already present).

---

## READING LIST

1. `android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt` **[PRIMARY PATTERN]** — final implementation; 8 tests with stable tags
2. `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt` — `IdleScreenState` shape source
3. `android/app/src/main/java/com/laneshadow/ui/idle/IdleScreen.kt` — production composable; testTag locations
4. `.spec/prds/v3-integration/tasks/sprint-06-idlescreen/android-learnings.md:55-119` — AND-T04 learnings (debug source-set, `--tests` filter, parameter names)
5. `RULES.md` §Cross-Platform Component Parity — canonical sandbox story IDs + parity contract

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Compile instrumented | `./gradlew :app:compileDebugAndroidTestKotlin` | Exit 0 |
| Run instrumented (emulator) | `./gradlew :app:connectedDebugAndroidTest` | Exit 0; ≥8 tests pass |
| Detekt | `./gradlew detekt` | Exit 0 |
| Tag presence grep | `grep -c 'testTag(' android/app/src/main/java/com/laneshadow/ui/idle/IdleScreen.kt` | ≥3 |

---

## OUT OF SCOPE

- Hilt-based real-repository instrumented tests (significant follow-on)
- Screenshot/visual regression tests (overlap with design-review pipeline)
- CI/CD emulator setup automation (separate infra task)
- Sprint gate evidence — IDLE-S06-T11

---

## CONTEXT

**Current state:** Production composables for the idle state ship via T01–T03; some required test tags may be missing from `IdleScreen.kt` / `LSChatInput.kt` / `LSMap.kt`. No instrumented coverage existed.

**Gap:** Sprint 06 must demonstrate Android-side real-data wiring with empirical UI evidence. Per `RULES.md` §Real Device E2E Testing, Android lacks an XCUITest equivalent so instrumented tests + manual device evidence are the canonical proof; this task ships the instrumented baseline.

---

## REVIEW (for kotlin-reviewer)

**Must pass:**
- ≥8 `@Test`s present, each named to describe what it asserts
- Stable test tags referenced (parity contract)
- `connectedDebugAndroidTest` is green on a connected emulator
- KDoc class header documents limitations (no `--tests` filter, emulator required, debug source set)
- SCOPE respected — no `IdleViewModel` / `LocationRepository` / `FavoriteLocation` mutations

**Should verify:**
- Tests fail meaningfully when production composables are broken (do not pass against an empty UI tree)
- Asserted text matches design copy, not paraphrased
- Test class avoids Espresso unless Compose semantics insufficient

**Verdict:** APPROVED

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html`
- `.spec/design/system/views/idle-screen/README.md` — variant catalogue used by tests

**Pattern:** Compose instrumented test driving production composable with state factory injection from debug `MockProviders`; stable tags as the parity contract for cross-platform tooling.

**Pattern source:** `android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt`

**Anti-pattern:** Bringing Hilt's full graph into instrumented tests via `HiltAndroidRule` — slow, brittle, and out-of-scope for this sprint.

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-AND-T01, IDLE-S06-AND-T02, IDLE-S06-AND-T03 (production composables + state surfaces)
- **Blocks:** IDLE-S06-T11 (sprint gate uses instrumented evidence as part of Android testing posture)
- **Parallel:** IDLE-S06-IOS-T04 (XCUITest captures)

---

## CODING STANDARDS

- `RULES.md` §Cross-Platform Component Parity — stable tags + canonical IDs
- `RULES.md` §Real Device E2E Testing — Android observations recorded honestly; instrumented as baseline pending hardware harness
- `RULES.md` §Verification Standards — `./gradlew detekt`, `connectedDebugAndroidTest`
- `brain/docs/ANTI-STUB-REVIEW.md` — instrumented tests must drive real composables, not mocks

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN IdleScreenInstrumentedTest.kt WHEN @Test counted THEN ≥8","verify":"grep -c '^[[:space:]]*@Test' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN test bodies WHEN tags inspected THEN 7 stable tags referenced","verify":"grep -cE 'onNodeWithTag\\(\\\"(greeting-overlay|greeting-meta|greeting-headline|chat-input|idlescreen-map|advisory-card|ls-topbar)' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN sources WHEN compileDebugAndroidTestKotlin runs THEN Exit 0","verify":"./gradlew :app:compileDebugAndroidTestKotlin"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN emulator connected WHEN connectedDebugAndroidTest runs THEN Exit 0 with ≥8 passing","verify":"./gradlew :app:connectedDebugAndroidTest"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN FavoriteLocation.kt WHEN inspected THEN declares id, lat, lon, label","verify":"grep -E 'data class FavoriteLocation\\(' android/app/src/main/java/com/laneshadow/data/favorites/FavoriteLocation.kt"},
    {"id":"TC-1","type":"test_criterion","description":"@Test count ≥8","maps_to_ac":"AC-1","verify":"grep -c '^[[:space:]]*@Test' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt"},
    {"id":"TC-2","type":"test_criterion","description":"Seven stable tags referenced","maps_to_ac":"AC-2","verify":"grep -cE 'onNodeWithTag\\(' android/app/src/androidTest/java/com/laneshadow/ui/templates/IdleScreenInstrumentedTest.kt"},
    {"id":"TC-3","type":"test_criterion","description":"compileDebugAndroidTestKotlin exit 0","maps_to_ac":"AC-3","verify":"./gradlew :app:compileDebugAndroidTestKotlin"},
    {"id":"TC-4","type":"test_criterion","description":"connectedDebugAndroidTest exit 0","maps_to_ac":"AC-4","verify":"./gradlew :app:connectedDebugAndroidTest"},
    {"id":"TC-5","type":"test_criterion","description":"FavoriteLocation declares lat/lon (not latitude/longitude)","maps_to_ac":"AC-5","verify":"grep -E 'data class FavoriteLocation\\(' android/app/src/main/java/com/laneshadow/data/favorites/FavoriteLocation.kt"}
  ]
}
-->
