# IDLE-S06-IOS-T04 — iOS DesignReviewCaptureTests for IdleScreen 7 variants + real-iPhone XCUITest motion evidence

```
TASK_TYPE:  TESTING
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
SPRINT:     sprint-06-idlescreen → ../SPRINT.md
PRD_REFS:   UC-FID-01

RUNTIME_COMMANDS:
  test_simulator: xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadowUITests -destination 'platform=iOS Simulator,name=iPhone 16'
  test_device:    xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadowUITests -destination 'platform=iOS,name={device}' -resultBundlePath ios/build/IdleScreenE2E.xcresult
  gate:           pnpm design:review --screens idle-screen
```

---

## OUTCOME

`DesignReviewCaptureTests.swift` exposes 7 new `testCaptureIdleScreen_*` methods (S01–S04, V01–V03) that real-Clerk auth, drive the app to each variant via `LaunchEnvironment` overrides, capture screenshots named `idle-screen.{variantId}.{theme}`, and register them in `.design-review/manifest.json` — produced as `.xcresult` motion evidence on a real iPhone.

---

## 🚫 CRITICAL CONSTRAINTS

- **MUST** add 7 test methods to `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift`: `testCaptureIdleScreen_S01_DefaultLight`, `..._S02_TypingSend`, `..._S03_DefaultDark`, `..._S04_FilterSheet`, `..._V01_NoLocation`, `..._V02_FirstRide`, `..._V03_WeatherAdvisory`.
- **MUST** use real Clerk auth via existing `authenticateAndReachIdleScreen()` helper (`DesignReviewCaptureTests.swift:1010-1026`) — NO `bypassAuthForTesting`, NO `-LaneShadowUITestBypassAuth` per Sprint 03 RF-38.
- **MUST** name each XCTAttachment as `"idle-screen.{variantId}.{theme}"` — variantIds: `s01-default`, `s02-typing-send`, `s03-default`, `s04-filter-sheet`, `v01-no-location`, `v02-first-ride`, `v03-weather-advisory` (all lowercase kebab-case).
- **MUST** drive variant state via new `LaunchEnvironment` keys: `IDLE_VARIANT_SEED`, `IDLE_LOCATION_MODE`, `IDLE_FAVORITE_COUNT`, `IDLE_WEATHER_SEVERITY`, `IDLE_HOUR_OVERRIDE` — read at app DI wiring point, not in template.
- **MUST** add 7 entries to `.design-review/manifest.json` matching the existing schema `{id, screen, state, theme, captured, captured_metadata, reference, annotations}`.
- **MUST** run on a real physical iPhone via `xcodebuild test -destination 'platform=iOS,name={device}'`; simulator-only run is insufficient for sprint gate.
- **NEVER** modify existing Sprint 05 test methods in `DesignReviewCaptureTests.swift` — only append new methods.
- **STRICTLY** use `DesignReviewHelpers.captureScreen(screen:state:action:app:)` + `DesignReviewHelpers.setupDeterminismEnvironment(app:colorScheme:)` exactly as Sprint 05 established.

---

## DONE WHEN

- [ ] AC-1: `testCaptureIdleScreen_S01_DefaultLight` produces XCTAttachment `idle-screen.s01-default.light` (PRIMARY)
- [ ] AC-2: `testCaptureIdleScreen_S02_TypingSend` produces `idle-screen.s02-typing-send.light` with send button visible
- [ ] AC-3: `testCaptureIdleScreen_S03_DefaultDark` produces `idle-screen.s03-default.dark`
- [ ] AC-4: `testCaptureIdleScreen_S04_FilterSheet` produces `idle-screen.s04-filter-sheet.light` with bottom sheet visible
- [ ] AC-5: `testCaptureIdleScreen_V01_NoLocation` produces `idle-screen.v01-no-location.light` with "Set a start point" pill
- [ ] AC-6: `testCaptureIdleScreen_V02_FirstRide` produces `idle-screen.v02-first-ride.light` (no favorite pins)
- [ ] AC-7: `testCaptureIdleScreen_V03_WeatherAdvisory` produces `idle-screen.v03-weather-advisory.light` (advisory card)
- [ ] `.design-review/manifest.json` has 7 new `idle-screen` entries
- [ ] `pnpm design:review --screens idle-screen` zero `high`-severity issues
- [ ] Real-iPhone `.xcresult` recorded at `ios/build/IdleScreenE2E.xcresult`
- [ ] `git diff --name-only` ⊆ writeAllowed

---

## ACCEPTANCE CRITERIA

### AC-1: S01 Default Light capture produced [PRIMARY]
- **GIVEN** real Clerk auth succeeds; app reaches IdleScreen with `IDLE_VARIANT_SEED=""` (default) in light theme
- **WHEN** `testCaptureIdleScreen_S01_DefaultLight` runs
- **THEN** XCTAttachment named `idle-screen.s01-default.light` with `.keepAlways` lifetime is attached; real Mapbox warm-paper tile visible; greeting headline + suggestion chips visible
- **VERIFY:** `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S01_DefaultLight`

### AC-2: S02 Typing/Send capture produced
- **GIVEN** App on IdleScreen; test types "Twisty back roads" into chat field
- **WHEN** `testCaptureIdleScreen_S02_TypingSend` runs
- **THEN** XCTAttachment `idle-screen.s02-typing-send.light`; send button (`lschatinput-send`) visible not filter button
- **VERIFY:** `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:.../testCaptureIdleScreen_S02_TypingSend`

### AC-3: S03 Default Dark capture produced
- **GIVEN** `setupDeterminismEnvironment(app:colorScheme:'dark')` + `IDLE_HOUR_OVERRIDE=19` to force evening
- **WHEN** `testCaptureIdleScreen_S03_DefaultDark` runs
- **THEN** XCTAttachment `idle-screen.s03-default.dark`; dark ink substrate; greeting contains "tonight"
- **VERIFY:** `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:.../testCaptureIdleScreen_S03_DefaultDark`

### AC-4: S04 Filter Sheet capture produced
- **GIVEN** App on IdleScreen; test taps `lschatinput-filter` to open `LSBottomSheet`
- **WHEN** `testCaptureIdleScreen_S04_FilterSheet` runs
- **THEN** XCTAttachment `idle-screen.s04-filter-sheet.light`; LSBottomSheet visible at `.medium` detent over scrimmed map
- **VERIFY:** `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:.../testCaptureIdleScreen_S04_FilterSheet`

### AC-5: V01 No Location capture produced
- **GIVEN** `IDLE_LOCATION_MODE='needed'` seeds LocationService in `.needed`
- **WHEN** `testCaptureIdleScreen_V01_NoLocation` runs
- **THEN** XCTAttachment `idle-screen.v01-no-location.light`; location pill shows "Set a start point"; chat input dimmed
- **VERIFY:** `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:.../testCaptureIdleScreen_V01_NoLocation`

### AC-6: V02 First Ride capture produced
- **GIVEN** `IDLE_FAVORITE_COUNT='0'` seeds `viewModel.showFavoritePins=false`
- **WHEN** `testCaptureIdleScreen_V02_FirstRide` runs
- **THEN** XCTAttachment `idle-screen.v02-first-ride.light`; no favorite pins on map; onboarding suggestion chips visible
- **VERIFY:** `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:.../testCaptureIdleScreen_V02_FirstRide`

### AC-7: V03 Weather Advisory capture produced
- **GIVEN** `IDLE_WEATHER_SEVERITY='advisory'` seeds `viewModel.weatherAdvisory` non-nil
- **WHEN** `testCaptureIdleScreen_V03_WeatherAdvisory` runs
- **THEN** XCTAttachment `idle-screen.v03-weather-advisory.light`; advisory card visible; warning-accented meta row
- **VERIFY:** `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:.../testCaptureIdleScreen_V03_WeatherAdvisory`

---

## TEST CRITERIA

| ID    | Statement                                                                          | Maps To | Type        |
|-------|------------------------------------------------------------------------------------|---------|-------------|
| TC-1  | S01 produces exactly one attachment `idle-screen.s01-default.light` keepAlways     | AC-1    | happy_path  |
| TC-2  | S02 attachment exists; `lschatinput-send` identifier exists in capture state       | AC-2    | happy_path  |
| TC-3  | S03 attachment exists with `.dark` theme suffix                                    | AC-3    | happy_path  |
| TC-4  | S04 attachment exists; LSBottomSheet visible                                       | AC-4    | happy_path  |
| TC-5  | V01 attachment exists; mode='needed' seeded correctly                              | AC-5    | edge_case   |
| TC-6  | V02 attachment exists; favorite count = 0                                          | AC-6    | edge_case   |
| TC-7  | V03 attachment exists; advisory card visible                                       | AC-7    | edge_case   |

---

## SCOPE

**writeAllowed:**
- `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift` (MODIFY — append 7 methods only)
- `ios/LaneShadowUITests/Helpers/AppLauncher.swift` (MODIFY — forward `IDLE_*` env keys)
- `.design-review/manifest.json` (MODIFY — append 7 idle-screen entries)
- `ios/LaneShadow/LaneShadowApp.swift` OR `ios/LaneShadow/App/AppDelegate.swift` (MODIFY — read `IDLE_*` LaunchEnvironment keys at DI wiring)

**writeProhibited:**
- `android/**`, `tokens/**`, `server/**`, `react-native/**`
- `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift` — READ ONLY

---

## BOUNDARIES

✅ **Always:**
- Use `DesignReviewHelpers.captureScreen` and `setupDeterminismEnvironment`
- Use `XCUIElement.waitForExistence(timeout:)` not `Thread.sleep`
- Add manifest entries before merging

⚠️ **Ask First:**
- Adding new helpers to `DesignReviewHelpers.swift`
- Changing variant IDs (must match `.spec/design/system/views/idle-screen/README.md` table)

---

## DELIVERABLE

- `DesignReviewCaptureTests.swift` (MODIFY): adds 7 new methods
- `AppLauncher.swift` (MODIFY): adds `IDLE_VARIANT_SEED`, `IDLE_LOCATION_MODE`, `IDLE_FAVORITE_COUNT`, `IDLE_WEATHER_SEVERITY`, `IDLE_HOUR_OVERRIDE` to forwarded env keys
- `.design-review/manifest.json` (MODIFY): 7 new idle-screen entries
- `LaneShadowApp.swift` / `AppDelegate.swift` (MODIFY): reads launch env at app startup, configures IdleViewModel seed state for E2E

---

## AGENT INSTRUCTIONS

For each variant: (1) write the test method exactly per the existing Sprint 05 capture pattern, (2) run on simulator first to check it builds + auth path works, (3) run on real iPhone for motion evidence + final XCTAttachment, (4) update `.design-review/manifest.json` with the new entry, (5) verify via `pnpm design:review --screens idle-screen`.

---

## READING LIST

1. `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift:1-95, 1010-1061` **[PRIMARY PATTERN]** — class header, `authenticateAndReachIdleScreen()` helper (1010-1026), `firstSuggestionChip()` (1028), `loadCredentials()` (148-185), `captureScreen` call pattern (83-93)
2. `ios/LaneShadowUITests/DesignReview/DesignReviewHelpers.swift:1-61` — `captureScreen()` (20-32); `setupDeterminismEnvironment(app:colorScheme:)` (42-60)
3. `ios/LaneShadowUITests/Helpers/AppLauncher.swift:1-76` — `launchApp()` env forwarding; existing `-LaneShadowUITestE2E` flag
4. `.design-review/manifest.json:1-25` — entry shape `{id, screen, state, theme, captured, captured_metadata, reference, annotations}`
5. `.spec/design/system/views/idle-screen/README.md:9-19` — Variants table: S01-S04, V01-V03 canonical IDs

---

## EVIDENCE GATES

| Gate | Command | Expected |
|------|---------|----------|
| Simulator compile + 3 representative tests | `xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:.../testCaptureIdleScreen_S01_DefaultLight ...` | Exit 0 |
| Real iPhone E2E — motion evidence | `xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:.../testCaptureIdleScreen_S01... ...V03... -resultBundlePath ios/build/IdleScreenE2E.xcresult` | Exit 0; 7 attachments in xcresult |
| manifest.json valid | `node -e "const m=require('./.design-review/manifest.json'); const idle=m.entries.filter(e=>e.screen==='idle-screen'); if(idle.length<7) process.exit(1)"` | Exit 0, 7 entries |
| Regression — Sprint 05 capture tests | `xcodebuild test -only-testing:.../test_authScreen_entry -only-testing:.../test_captureHelper_attachesNamedPng` | Exit 0 |
| Sprint gate | `pnpm design:review --screens idle-screen` | Zero high-severity issues |

---

## OUT OF SCOPE

- Sprint gate sign-off itself — IDLE-S06-T11
- Re-eval loop on regression — Sprint 05 T09 territory
- Adding new helpers to `DesignReviewHelpers.swift`

---

## CONTEXT

**Current state:** `DesignReviewCaptureTests.swift` exists from Sprint 05 with auth-screen capture methods + `authenticateAndReachIdleScreen()` helper. `IdleScreen` is rendered but only Sprint 05 auth-screen variants are captured. `.design-review/manifest.json` exists with auth-screen entries.

**Gap:** Sprint 6 gate requires all 7 idle-screen variants (S01–S04, V01–V03) captured for the design-review pipeline + recorded on real iPhone.

---

## REVIEW (for swift-reviewer)

**Must pass:**
- One test method per variant (7 total); each produces exactly one named attachment
- All tests use real Clerk auth (no `bypassAuthForTesting`)
- Variant IDs match `README.md` table verbatim (kebab-case)
- `.design-review/manifest.json` has 7 new idle-screen entries
- Sprint gate `pnpm design:review --screens idle-screen` zero high-severity

**Should verify:**
- `IDLE_HOUR_OVERRIDE` is read at IdleViewModel construction (not in template)
- Real-iPhone .xcresult preserved as gate evidence
- LaunchEnvironment keys are deterministic (TZ frozen, animations disabled)

**Verdict:** APPROVED | NEEDS_FIXES

---

## DESIGN

**References:**
- `.spec/design/system/views/idle-screen/idle-screen.html` — visual ground truth for all 7 variants
- `.spec/design/system/views/idle-screen/README.md` — variant table; canonical IDs

**Pattern:** `authenticateAndReachIdleScreen()` → seed variant state via LaunchEnvironment → wait for variant-specific element → `DesignReviewHelpers.captureScreen()` → attach.

**Pattern source:** `ios/LaneShadowUITests/DesignReview/DesignReviewCaptureTests.swift:1010-1026`

**Anti-pattern:** Using `bypassAuthForTesting` or fixed `Thread.sleep`. Not using `DesignReviewHelpers` (would create rogue attachment names).

---

## DEPENDENCIES

- **Depends on:** IDLE-S06-IOS-T01, IDLE-S06-IOS-T02, IDLE-S06-IOS-T03 (all VM/map/location wiring lands first)
- **Blocks:** IDLE-S06-T11 (sprint gate)
- **Parallel:** IDLE-S06-AND-T04 (Android twin)

---

## CODING STANDARDS

- `RULES.md` §Real Device E2E Testing — `xcresult` artifacts at `ios/build/` are gate evidence
- `RULES.md` §Verification Standards — `xcodebuild test` exact command
- `brain/docs/CODING-STANDARDS.md` — XCUITest discipline; no flaky timeouts

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id":"AC-1","type":"acceptance_criterion","description":"GIVEN real auth + default idle state WHEN S01 test runs THEN attachment 'idle-screen.s01-default.light' produced","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S01_DefaultLight"},
    {"id":"AC-2","type":"acceptance_criterion","description":"GIVEN text typed in chatInput WHEN S02 test runs THEN attachment 'idle-screen.s02-typing-send.light' produced","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S02_TypingSend"},
    {"id":"AC-3","type":"acceptance_criterion","description":"GIVEN dark colorScheme + IDLE_HOUR_OVERRIDE=19 WHEN S03 test runs THEN attachment 'idle-screen.s03-default.dark' produced","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S03_DefaultDark"},
    {"id":"AC-4","type":"acceptance_criterion","description":"GIVEN filter button tapped WHEN S04 test runs THEN attachment 'idle-screen.s04-filter-sheet.light' produced","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S04_FilterSheet"},
    {"id":"AC-5","type":"acceptance_criterion","description":"GIVEN IDLE_LOCATION_MODE=needed WHEN V01 test runs THEN attachment 'idle-screen.v01-no-location.light' produced","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_V01_NoLocation"},
    {"id":"AC-6","type":"acceptance_criterion","description":"GIVEN IDLE_FAVORITE_COUNT=0 WHEN V02 test runs THEN attachment 'idle-screen.v02-first-ride.light' produced","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_V02_FirstRide"},
    {"id":"AC-7","type":"acceptance_criterion","description":"GIVEN IDLE_WEATHER_SEVERITY=advisory WHEN V03 test runs THEN attachment 'idle-screen.v03-weather-advisory.light' produced","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_V03_WeatherAdvisory"},
    {"id":"TC-1","type":"test_criterion","description":"S01 attachment produced","maps_to_ac":"AC-1","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S01_DefaultLight"},
    {"id":"TC-2","type":"test_criterion","description":"S02 attachment produced","maps_to_ac":"AC-2","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S02_TypingSend"},
    {"id":"TC-3","type":"test_criterion","description":"S03 attachment produced","maps_to_ac":"AC-3","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S03_DefaultDark"},
    {"id":"TC-4","type":"test_criterion","description":"S04 attachment produced","maps_to_ac":"AC-4","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_S04_FilterSheet"},
    {"id":"TC-5","type":"test_criterion","description":"V01 attachment produced","maps_to_ac":"AC-5","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_V01_NoLocation"},
    {"id":"TC-6","type":"test_criterion","description":"V02 attachment produced","maps_to_ac":"AC-6","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_V02_FirstRide"},
    {"id":"TC-7","type":"test_criterion","description":"V03 attachment produced","maps_to_ac":"AC-7","verify":"xcodebuild test -destination 'platform=iOS,name={device}' -only-testing:LaneShadowUITests/DesignReviewCaptureTests/testCaptureIdleScreen_V03_WeatherAdvisory"}
  ]
}
-->
