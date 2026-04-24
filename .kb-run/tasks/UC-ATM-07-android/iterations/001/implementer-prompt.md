# kb-run Implementer Packet

Task ID: UC-ATM-07-android
Role: kotlin-implementer
Sprint: sprint-02-atoms-foundation-primitives
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-ATM-07-android
Branch: kb-run/UC-ATM-07-android
Start commit: b00189119bf2c60fa35858a57376cfa607f773cd

## Operating Contract

- You are the implementer child session for this single task.
- Work only inside this worktree.
- Do not edit any .kb-run* state or notebook files.
- Do not edit files outside SCOPE.writeAllowed.
- Use TDD per the task: RED -> GREEN -> REFACTOR, and capture concrete RED evidence.
- Before running build/test commands, source `scripts/agent-worktree-env.sh` from the worktree root.
- Do not use --no-verify, git commit -n, or hook-bypass environment variables.
- The orchestrator owns the checkpoint commit. Leave your product changes uncommitted unless you hit a blocker that requires a committed checkpoint for evidence.
- Final response must be JSON only and must satisfy the provided output schema.

## Repo-Current Notes

- Repo-current drift: Android currently aggregates atom stories through android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt, not the older LaneShadowStories.kt path named in some task docs.
- Existing atom patterns to mirror: LSPill.kt, LSIcon.kt, and LSButton.kt under android/app/src/main/java/com/laneshadow/ui/atoms/.

## Normalized Requirements

{
  "requirements": [
    {
      "id": "AC-1",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "LSBadge Status.Recording resolves color.status.recording tokens [PRIMARY]"
    },
    {
      "id": "AC-2",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "BadgeVariant sealed union exposes Status + Weather cases"
    },
    {
      "id": "AC-3",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "LSBadge Status.Success resolves color.status.success tokens"
    },
    {
      "id": "AC-4",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "LSBadge Weather.Rain resolves color.weather.rain tokens + leading icon"
    },
    {
      "id": "AC-5",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "LSBadge Weather.Wind resolves color.weather.wind tokens + leading icon"
    },
    {
      "id": "AC-6",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "LSBestBadge resolves color.signal tokens + filled star"
    },
    {
      "id": "AC-7",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "All 12 sandbox stories registered with id atoms.badge.*"
    },
    {
      "id": "AC-8",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "No Color literal in production source (error gate — boundary)"
    },
    {
      "id": "AC-9",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "No Material Icons references (error gate — boundary)"
    },
    {
      "id": "AC-10",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "Release APK contains zero sandbox references (error gate — release hygiene)"
    },
    {
      "id": "TC-1",
      "source": "TEST CRITERIA",
      "summary": "Status.Recording resolves color.status.recording.{tint,default}"
    },
    {
      "id": "TC-2",
      "source": "TEST CRITERIA",
      "summary": "BadgeVariant sealed union exposes Status + Weather cases"
    },
    {
      "id": "TC-3",
      "source": "TEST CRITERIA",
      "summary": "Status.Success resolves color.status.success.{tint,default}"
    },
    {
      "id": "TC-4",
      "source": "TEST CRITERIA",
      "summary": "Weather.Rain resolves rain tokens + IconName.rain at sizing.icon.xs"
    },
    {
      "id": "TC-5",
      "source": "TEST CRITERIA",
      "summary": "Weather.Wind resolves wind tokens + IconName.wind at sizing.icon.xs"
    },
    {
      "id": "TC-6",
      "source": "TEST CRITERIA",
      "summary": "LSBestBadge resolves color.signal + IconName.starFill"
    },
    {
      "id": "TC-7",
      "source": "TEST CRITERIA",
      "summary": "All 12 atoms.badge.* stories registered"
    },
    {
      "id": "TC-8",
      "source": "TEST CRITERIA",
      "summary": "No Color(0x literal in production source"
    },
    {
      "id": "TC-9",
      "source": "TEST CRITERIA",
      "summary": "No Material Icons references"
    },
    {
      "id": "TC-10",
      "source": "TEST CRITERIA",
      "summary": "Release APK contains zero sandbox references"
    }
  ],
  "supplemental_requirements": [],
  "outcome_states": [
    "default",
    "error"
  ],
  "warnings": []
}

## Required Evidence Outputs

- Write a concise evidence log to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-07-android/iterations/001/evidence.md`.
- Write an evidence manifest JSON to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-07-android/iterations/001/evidence-manifest.json` with:
  - `task_id`
  - `files_changed`
  - `verification_commands`
  - `red_phase_commands`
  - `notes`
- Your final JSON response must point to those files.

## Task Markdown

<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-07-android — Badge atoms (`LSBadge`, `LSBestBadge`) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   120 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release_no_sandbox: cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-07, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-07-badge.html
DEPENDS_ON: UC-TOK-02, UC-TOK-03, UC-TOK-05, UC-ATM-06-android (Pill), UC-ATM-10-android (Icon), UC-SBX-00-android
BLOCKS:     UC-MOL-* (cards using badges), UC-ORG-* (recording state organisms)

PROGRESS: AC-1 none · 0/10 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSBadge(count: Int? = null, label: String? = null, variant: BadgeVariant)` renders a typed status- or weather-coded badge on Android Compose. `BadgeVariant` is a sealed class union of `Status.{Info, Success, Warning, Error, Recording}` and `Weather.{Clear, Rain, Wind, Storm, Hot, Cold}`. Status variants resolve through `LaneShadowTheme.color.status.*`. Weather variants resolve through `LaneShadowTheme.color.weather.*.tint` (background) + `LaneShadowTheme.color.weather.*.default` (foreground + ~0.5dp border at 55% alpha) and prepend an `LSIcon` at `sizing.icon.xs`. Implementation composes `LSPill(size = PillSize.Sm)` from UC-ATM-06-android. Sibling typed atom `LSBestBadge` renders the "BEST FOR TODAY" affordance with a filled-star prefix in `color.signal.{default, on}`.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `androidx.compose.material.icons` or `Icons.Filled/Outlined.*` — leading icons resolve through `LSIcon(IconName.*)` from UC-ATM-10-android.
- NEVER hardcode `Color(0xFF…)` literals; status/weather/signal colors MUST resolve through `LaneShadowTheme.color.{status,weather,signal}.*`.
- NEVER hardcode `.dp` border widths — the ~0.5dp weather border MUST resolve from a token (e.g. `LaneShadowTheme.borders.hairline`).
- NEVER reimplement pill geometry — MUST compose `LSPill(size = PillSize.Sm)` from UC-ATM-06-android.
- NEVER place sandbox stories under `android/app/src/main/**`.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `tokens/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSBadge` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt` and accepts `count: Int?`, `label: String?`, `variant: BadgeVariant` — maps to AC-1 (PRIMARY)
- [ ] `BadgeVariant` sealed class union exists with `Status.*` and `Weather.*` cases — maps to AC-2
- [ ] Status badges resolve `color.status.{info,success,warning,error,recording}` — maps to AC-1, AC-3
- [ ] Weather badges resolve `color.weather.*.tint` background + `color.weather.*.default` foreground/border + leading icon at `sizing.icon.xs` — maps to AC-4, AC-5
- [ ] `LSBestBadge` composable exists with filled-star prefix in `color.signal.{default,on}` — maps to AC-6
- [ ] All 12 sandbox stories registered with id `atoms.badge.{statusInfo|statusSuccess|statusWarning|statusError|statusRecording|weatherClear|weatherRain|weatherWind|weatherStorm|weatherHot|weatherCold|bestForToday}` — maps to AC-7
- [ ] Zero `Color(0x…)` literals in production source — maps to AC-8
- [ ] Zero Material Icons references — maps to AC-9
- [ ] Release APK contains zero `com.nativesandbox` references — maps to AC-10
- [ ] Detekt clean; `compileDebugKotlin` green; instrumented + unit tests pass

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSBadge Status.Recording resolves color.status.recording tokens [PRIMARY]
  GIVEN: A Compose host providing `LaneShadowTheme`
  WHEN:  Developer renders `LSBadge(label = "REC", variant = BadgeVariant.Status.Recording)`
  THEN:  Background equals `LaneShadowTheme.color.status.recording.tint`; foreground equals `LaneShadowTheme.color.status.recording.default`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBadgeInstrumentationTest.kt
  TEST_FUNCTION: badge_status_recording_resolves_token_colors
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_status_recording_resolves_token_colors

AC-2: BadgeVariant sealed union exposes Status + Weather cases
  GIVEN: `BadgeVariant.kt`
  WHEN:  Compiled
  THEN:  `BadgeVariant.Status.{Info,Success,Warning,Error,Recording}` and `BadgeVariant.Weather.{Clear,Rain,Wind,Storm,Hot,Cold}` are reachable
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/BadgeVariantTest.kt
  TEST_FUNCTION: badgeVariant_exposes_status_and_weather_cases
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.BadgeVariantTest.badgeVariant_exposes_status_and_weather_cases

AC-3: LSBadge Status.Success resolves color.status.success tokens
  GIVEN: A Compose host
  WHEN:  `LSBadge(label = "ON", variant = BadgeVariant.Status.Success)` composed
  THEN:  Background equals `color.status.success.tint`; foreground equals `color.status.success.default`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBadgeInstrumentationTest.kt
  TEST_FUNCTION: badge_status_success_resolves_token_colors
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_status_success_resolves_token_colors

AC-4: LSBadge Weather.Rain resolves color.weather.rain tokens + leading icon
  GIVEN: A Compose host
  WHEN:  `LSBadge(label = "RAIN", variant = BadgeVariant.Weather.Rain)` composed
  THEN:  Background == `color.weather.rain.tint`, foreground == `color.weather.rain.default`, border == `color.weather.rain.default` at 55% alpha with hairline width, leading `LSIcon(IconName.rain)` at `sizing.icon.xs`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBadgeInstrumentationTest.kt
  TEST_FUNCTION: badge_weather_rain_resolves_tokens_and_icon
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_weather_rain_resolves_tokens_and_icon

AC-5: LSBadge Weather.Wind resolves color.weather.wind tokens + leading icon
  GIVEN: A Compose host
  WHEN:  `LSBadge(label = "GUSTS", variant = BadgeVariant.Weather.Wind)` composed
  THEN:  Background == `color.weather.wind.tint`, foreground == `color.weather.wind.default`, leading `LSIcon(IconName.wind)` at `sizing.icon.xs`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBadgeInstrumentationTest.kt
  TEST_FUNCTION: badge_weather_wind_resolves_tokens_and_icon
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_weather_wind_resolves_tokens_and_icon

AC-6: LSBestBadge resolves color.signal tokens + filled star
  GIVEN: A Compose host
  WHEN:  `LSBestBadge()` composed
  THEN:  Background == `color.signal.default`, foreground == `color.signal.on`, label == "BEST FOR TODAY", leading `LSIcon(IconName.starFill)` at `sizing.icon.xs`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBestBadgeInstrumentationTest.kt
  TEST_FUNCTION: bestBadge_resolves_signal_tokens_and_filled_star
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBestBadgeInstrumentationTest.bestBadge_resolves_signal_tokens_and_filled_star

AC-7: All 12 sandbox stories registered with id atoms.badge.*
  GIVEN: `LSBadgeStories.kt`
  WHEN:  Sandbox aggregator composes atom stories
  THEN:  Stories present with ids `atoms.badge.statusInfo`, `atoms.badge.statusSuccess`, `atoms.badge.statusWarning`, `atoms.badge.statusError`, `atoms.badge.statusRecording`, `atoms.badge.weatherClear`, `atoms.badge.weatherRain`, `atoms.badge.weatherWind`, `atoms.badge.weatherStorm`, `atoms.badge.weatherHot`, `atoms.badge.weatherCold`, `atoms.badge.bestForToday`, all `tier = ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSBadgeStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.badge.statusInfo atoms.badge.statusSuccess atoms.badge.statusWarning atoms.badge.statusError atoms.badge.statusRecording atoms.badge.weatherClear atoms.badge.weatherRain atoms.badge.weatherWind atoms.badge.weatherStorm atoms.badge.weatherHot atoms.badge.weatherCold atoms.badge.bestForToday; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSBadgeStories.kt || exit 1; done

AC-8: No Color literal in production source (error gate — boundary)
  GIVEN: `LSBadge.kt`, `LSBestBadge.kt`, `BadgeVariant.kt`
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Color\(0x` and `FontFamily\.Serif`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(0x|FontFamily\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt android/app/src/main/java/com/laneshadow/ui/atoms/BadgeVariant.kt

AC-9: No Material Icons references (error gate — boundary)
  GIVEN: `LSBadge.kt`, `LSBestBadge.kt`
  WHEN:  Reviewer greps
  THEN:  Zero matches for `androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)' android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt

AC-10: Release APK contains zero sandbox references (error gate — release hygiene)
  GIVEN: A release build of the app
  WHEN:  `./gradlew :app:assembleRelease` is run and APK is inspected
  THEN:  `unzip -l app-release.apk | grep -c com.nativesandbox` returns 0
  TDD_STATE:     none
  TEST_FILE:     android/app/build.gradle.kts
  TEST_FUNCTION: n/a (build gate)
  VERIFY:        cd android && ./gradlew :app:assembleRelease && [ "$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)" = "0" ]

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | Status.Recording resolves color.status.recording.{tint,default} | AC-1 | gradlew connectedDebugAndroidTest …badge_status_recording_resolves_token_colors |
| TC-2 | BadgeVariant sealed union exposes Status + Weather cases | AC-2 | gradlew testDebugUnitTest …badgeVariant_exposes_status_and_weather_cases |
| TC-3 | Status.Success resolves color.status.success.{tint,default} | AC-3 | gradlew connectedDebugAndroidTest …badge_status_success_resolves_token_colors |
| TC-4 | Weather.Rain resolves rain tokens + IconName.rain at sizing.icon.xs | AC-4 | gradlew connectedDebugAndroidTest …badge_weather_rain_resolves_tokens_and_icon |
| TC-5 | Weather.Wind resolves wind tokens + IconName.wind at sizing.icon.xs | AC-5 | gradlew connectedDebugAndroidTest …badge_weather_wind_resolves_tokens_and_icon |
| TC-6 | LSBestBadge resolves color.signal + IconName.starFill | AC-6 | gradlew connectedDebugAndroidTest …bestBadge_resolves_signal_tokens_and_filled_star |
| TC-7 | All 12 atoms.badge.* stories registered | AC-7 | grep gate above |
| TC-8 | No Color(0x literal in production source | AC-8 | grep gate above |
| TC-9 | No Material Icons references | AC-9 | grep gate above |
| TC-10 | Release APK contains zero sandbox references | AC-10 | unzip+grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/BadgeVariant.kt (NEW — sealed class union)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSBadgeStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY — register LSBadgeStories)
- android/app/src/test/java/com/laneshadow/ui/atoms/BadgeVariantTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBadgeInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBestBadgeInstrumentationTest.kt (NEW)

writeProhibited:
- ios/** — swift-implementer scope
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- tokens/** — generator output (UC-TOK-05 owns)
- android/app/src/main/** for sandbox story files (stories are DEBUG-ONLY)
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Compose `LSPill(size = PillSize.Sm)` for geometry. Never reimplement pill shape.
- Resolve every color through `LaneShadowTheme.color.{status,weather,signal}.*`.
- Resolve weather border width through a token (e.g. `LaneShadowTheme.borders.hairline`).
- Render leading icons via `LSIcon(IconName.*, size = IconSize.Xs)`.
- Place all story code under `android/app/src/debug/`.

⚠️ Ask First:
- Adding a new Status or Weather case beyond the listed sets.
- Replacing the LSPill composition with a custom shape.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/BadgeVariant.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSBadgeStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY)
- android/app/src/test/java/com/laneshadow/ui/atoms/BadgeVariantTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBadgeInstrumentationTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSBestBadgeInstrumentationTest.kt (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 10 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-07-badge.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual spec for status/weather/best matrix

2. .spec/prds/v2/05-uc-atm.md
   - Lines: section UC-ATM-07
   - Focus: Canonical AC bullets

3. .spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-06-android-pill-atom-lspill-android-compose.md
   - Lines: all
   - Focus: Pill API this badge composes on

4. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/Theme.kt
   - Lines: all
   - Focus: Generated `color.status.*`, `color.weather.*.{tint,default}`, `color.signal.{default,on}`, `borders.hairline`, `sizing.icon.xs`

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.Atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC. Automated tests must prove user-visible behavior, interaction/state changes, accessibility, and required composition contracts. Do not require exact visual styling assertions; review those manually in the sandbox.
Gate 3: Unit tests pass — `cd android && ./gradlew :app:testDebugUnitTest` exits 0.
Gate 4: Instrumented tests pass — `cd android && ./gradlew :app:connectedDebugAndroidTest` exits 0.
Gate 5: compileDebugKotlin green.
Gate 6: detekt clean.
Gate 7: Zero Color(0x) / FontFamily.Serif / Material Icons in source.
Gate 8: Release APK has zero `com.nativesandbox` references.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-07-ios — swift-implementer parallel).
- Defining new Status/Weather color tokens — UC-TOK-02 owns.
- Building dot-only badge variants — defer to a future molecule task.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-02 generates `color.status.*`, `color.weather.*.{tint,default}`, `color.signal.{default,on}` into the Kotlin theme. UC-ATM-06-android delivers `LSPill`. Without LSBadge, every chip-shaped recording/weather signal must inline color resolution.

**Gap:** No typed badge atom exists; downstream cards/maps will inline raw colors.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC. Automated tests prove user-visible behavior, interaction/state changes, accessibility, and required composition contracts. Exact visual styling checks belong in manual sandbox review unless they are themselves the behavior under test.
- RED evidence present in TDD_STATE history.
- Zero `Color(0x…)` literals; zero Material Icons references.
- All 12 `atoms.badge.*` stories registered under DEBUG source set.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- BadgeVariant is a true sealed class union (not enum).
- LSBestBadge composes LSPill + LSIcon, not a custom shape.
- Weather border width comes from `LaneShadowTheme.borders.hairline` token.
- Test naming follows `{condition}_{expected}` snake-case convention.
- Anti-pattern check: zero Material Icons / Color(0x / FontFamily.Serif.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (color tokens), UC-TOK-03 (sizing/borders), UC-TOK-05 (generated theme), UC-ATM-06-android (Pill), UC-ATM-10-android (Icon), UC-SBX-00-android
Blocks:     UC-MOL-* (cards using badges), UC-ORG-* (recording state organisms)
Parallel:   UC-ATM-07-ios (iOS pair)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSBadge Status.Recording composed THEN background=color.status.recording.tint, foreground=color.status.recording.default", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_status_recording_resolves_token_colors" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN BadgeVariant.kt WHEN compiled THEN Status.{Info,Success,Warning,Error,Recording} and Weather.{Clear,Rain,Wind,Storm,Hot,Cold} reachable", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.BadgeVariantTest.badgeVariant_exposes_status_and_weather_cases" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSBadge Status.Success composed THEN background=color.status.success.tint, foreground=color.status.success.default", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_status_success_resolves_token_colors" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSBadge Weather.Rain composed THEN background=color.weather.rain.tint, foreground=color.weather.rain.default, hairline border at 55% alpha, leading LSIcon(IconName.rain) at sizing.icon.xs", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_weather_rain_resolves_tokens_and_icon" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSBadge Weather.Wind composed THEN background=color.weather.wind.tint, foreground=color.weather.wind.default, leading LSIcon(IconName.wind) at sizing.icon.xs", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBadgeInstrumentationTest.badge_weather_wind_resolves_tokens_and_icon" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSBestBadge composed THEN background=color.signal.default, foreground=color.signal.on, label='BEST FOR TODAY', leading LSIcon(IconName.starFill) at sizing.icon.xs", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSBestBadgeInstrumentationTest.bestBadge_resolves_signal_tokens_and_filled_star" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN LSBadgeStories.kt WHEN aggregator composes THEN 12 atoms.badge.* stories registered as ComponentTier.Atom", "verify": "for id in atoms.badge.statusInfo atoms.badge.statusSuccess atoms.badge.statusWarning atoms.badge.statusError atoms.badge.statusRecording atoms.badge.weatherClear atoms.badge.weatherRain atoms.badge.weatherWind atoms.badge.weatherStorm atoms.badge.weatherHot atoms.badge.weatherCold atoms.badge.bestForToday; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSBadgeStories.kt || exit 1; done" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN production source WHEN grep'd THEN zero Color(0x and zero FontFamily.Serif", "verify": "! grep -REn 'Color\\(0x|FontFamily\\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt android/app/src/main/java/com/laneshadow/ui/atoms/BadgeVariant.kt" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN production source WHEN grep'd THEN zero Material Icons references", "verify": "! grep -REn 'androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)' android/app/src/main/java/com/laneshadow/ui/atoms/LSBadge.kt android/app/src/main/java/com/laneshadow/ui/atoms/LSBestBadge.kt" },
    { "id": "AC-10", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN zero com.nativesandbox refs", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "Status.Recording token colors", "maps_to_ac": "AC-1", "verify": "gradlew connectedDebugAndroidTest …badge_status_recording_resolves_token_colors" },
    { "id": "TC-2", "type": "test_criterion", "description": "BadgeVariant cases reachable", "maps_to_ac": "AC-2", "verify": "gradlew testDebugUnitTest …badgeVariant_exposes_status_and_weather_cases" },
    { "id": "TC-3", "type": "test_criterion", "description": "Status.Success token colors", "maps_to_ac": "AC-3", "verify": "gradlew connectedDebugAndroidTest …badge_status_success_resolves_token_colors" },
    { "id": "TC-4", "type": "test_criterion", "description": "Weather.Rain tokens + icon", "maps_to_ac": "AC-4", "verify": "gradlew connectedDebugAndroidTest …badge_weather_rain_resolves_tokens_and_icon" },
    { "id": "TC-5", "type": "test_criterion", "description": "Weather.Wind tokens + icon", "maps_to_ac": "AC-5", "verify": "gradlew connectedDebugAndroidTest …badge_weather_wind_resolves_tokens_and_icon" },
    { "id": "TC-6", "type": "test_criterion", "description": "BestBadge signal tokens + filled star", "maps_to_ac": "AC-6", "verify": "gradlew connectedDebugAndroidTest …bestBadge_resolves_signal_tokens_and_filled_star" },
    { "id": "TC-7", "type": "test_criterion", "description": "12 atoms.badge.* stories", "maps_to_ac": "AC-7", "verify": "grep gate" },
    { "id": "TC-8", "type": "test_criterion", "description": "No Color literal", "maps_to_ac": "AC-8", "verify": "grep gate" },
    { "id": "TC-9", "type": "test_criterion", "description": "No Material Icons", "maps_to_ac": "AC-9", "verify": "grep gate" },
    { "id": "TC-10", "type": "test_criterion", "description": "Release APK clean of sandbox refs", "maps_to_ac": "AC-10", "verify": "unzip+grep gate" }
  ]
}
-->

