<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-08-android — PhaseDot atom (`LSPhaseDot`) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   90 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release_no_sandbox: cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-08, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-08-phasedot.html
DEPENDS_ON: UC-TOK-02, UC-TOK-04 (motion recipes), UC-TOK-05, UC-SBX-00-android
BLOCKS:     UC-MOL-* (phase indicator molecules), UC-ORG-* (recording state organisms)

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSPhaseDot(state: PhaseDotState)` renders a 10dp ride-phase indicator dot on Android Compose. `PhaseDotState` is a sealed class union of `Pending | Active | Done`. Pending = hollow with `LaneShadowTheme.color.border.strong` 1dp border. Active = filled `LaneShadowTheme.color.signal.default` with an animating concentric ring pulse driven by `LaneShadowTheme.motion.recipe.phaseDotPulse` (no hardcoded `tween(durationMillis=…)` literal). Done = filled `LaneShadowTheme.color.status.success.default` with no animation.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER hardcode `Color(0xFF…)` literals — all colors MUST resolve through `LaneShadowTheme.color.*`.
- NEVER hardcode animation duration or easing — pulse animation MUST consume `LaneShadowTheme.motion.recipe.phaseDotPulse` (zero `tween(durationMillis=` literals in production source).
- NEVER use `androidx.compose.material.icons` or `Icons.Filled/Outlined.*`.
- NEVER place sandbox stories under `android/app/src/main/**`.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `tokens/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSPhaseDot` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt` accepting `state: PhaseDotState` — maps to AC-1 (PRIMARY)
- [ ] Pending = hollow with `color.border.strong` 1dp border — maps to AC-1
- [ ] Active = filled `color.signal.default` + animating concentric ring referencing `motion.recipe.phaseDotPulse` — maps to AC-2, AC-5
- [ ] Done = filled `color.status.success.default`, no animation — maps to AC-3
- [ ] Three sandbox stories registered with id `atoms.phaseDot.{pending|active|done}` — maps to AC-4
- [ ] Animation duration sourced from theme (no `tween(durationMillis=` literal in source) — maps to AC-5
- [ ] No Color(0x…), no Material Icons, no FontFamily.Serif — maps to AC-6
- [ ] Release APK contains zero `com.nativesandbox` references — maps to AC-7
- [ ] Detekt clean; `compileDebugKotlin` green; instrumented + unit tests pass

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSPhaseDot Pending renders hollow with color.border.strong 1dp border [PRIMARY]
  GIVEN: A Compose host providing `LaneShadowTheme`
  WHEN:  Developer renders `LSPhaseDot(state = PhaseDotState.Pending)`
  THEN:  Measured size is 10dp, fill is transparent, border color equals `LaneShadowTheme.color.border.strong`, border width equals 1.dp
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPhaseDotInstrumentationTest.kt
  TEST_FUNCTION: phaseDot_pending_resolves_border_strong_token
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPhaseDotInstrumentationTest.phaseDot_pending_resolves_border_strong_token

AC-2: LSPhaseDot Active renders filled color.signal.default with pulse ring
  GIVEN: A Compose host
  WHEN:  `LSPhaseDot(state = PhaseDotState.Active)` composed
  THEN:  Fill equals `LaneShadowTheme.color.signal.default`; an outer concentric ring node is present whose alpha and scale animate from the `motion.recipe.phaseDotPulse` keyframes
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPhaseDotInstrumentationTest.kt
  TEST_FUNCTION: phaseDot_active_filled_signal_with_pulse
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPhaseDotInstrumentationTest.phaseDot_active_filled_signal_with_pulse

AC-3: LSPhaseDot Done renders filled color.status.success.default no animation
  GIVEN: A Compose host
  WHEN:  `LSPhaseDot(state = PhaseDotState.Done)` composed
  THEN:  Fill equals `LaneShadowTheme.color.status.success.default`; no infinite transition is started
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPhaseDotInstrumentationTest.kt
  TEST_FUNCTION: phaseDot_done_filled_success_no_animation
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPhaseDotInstrumentationTest.phaseDot_done_filled_success_no_animation

AC-4: Three sandbox stories registered with id atoms.phaseDot.*
  GIVEN: `LSPhaseDotStories.kt`
  WHEN:  Sandbox aggregator composes atom stories
  THEN:  Three stories present with ids `atoms.phaseDot.pending`, `atoms.phaseDot.active`, `atoms.phaseDot.done`, all `tier = ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPhaseDotStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.phaseDot.pending atoms.phaseDot.active atoms.phaseDot.done; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPhaseDotStories.kt || exit 1; done

AC-5: Pulse animation duration sourced from motion.recipe.phaseDotPulse (error gate — token discipline)
  GIVEN: `LSPhaseDot.kt`
  WHEN:  Reviewer greps the production source
  THEN:  Zero matches for `tween\(durationMillis\s*=` and zero matches for literal duration constants; instead `LaneShadowTheme.motion.recipe.phaseDotPulse` is referenced
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'tween\(durationMillis\s*=' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt && grep -q 'motion\.recipe\.phaseDotPulse' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt

AC-6: No Color literal, no Material Icons (error gate — boundary)
  GIVEN: `LSPhaseDot.kt`
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Color\(0x`, `androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)`, `FontFamily\.Serif`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|FontFamily\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt

AC-7: Release APK contains zero sandbox references (error gate — release hygiene)
  GIVEN: A release build
  WHEN:  `./gradlew :app:assembleRelease` is run and the APK is inspected
  THEN:  `unzip -l app-release.apk | grep -c com.nativesandbox` returns 0
  TDD_STATE:     none
  TEST_FILE:     android/app/build.gradle.kts
  TEST_FUNCTION: n/a (build gate)
  VERIFY:        cd android && ./gradlew :app:assembleRelease && [ "$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)" = "0" ]

AC-8: PhaseDotState sealed union compiles with Pending/Active/Done cases
  GIVEN: `LSPhaseDot.kt`
  WHEN:  Compiled
  THEN:  `PhaseDotState.Pending`, `PhaseDotState.Active`, `PhaseDotState.Done` reachable as a sealed class union
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSPhaseDotTest.kt
  TEST_FUNCTION: phaseDotState_exposes_three_cases
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSPhaseDotTest.phaseDotState_exposes_three_cases

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | Pending: hollow, color.border.strong, 1dp border, 10dp size | AC-1 | gradlew connectedDebugAndroidTest …phaseDot_pending_resolves_border_strong_token |
| TC-2 | Active: fill = color.signal.default, pulse ring driven by motion recipe | AC-2 | gradlew connectedDebugAndroidTest …phaseDot_active_filled_signal_with_pulse |
| TC-3 | Done: fill = color.status.success.default, no animation | AC-3 | gradlew connectedDebugAndroidTest …phaseDot_done_filled_success_no_animation |
| TC-4 | Three atoms.phaseDot.* stories registered | AC-4 | grep gate above |
| TC-5 | No `tween(durationMillis=` literal; motion recipe referenced | AC-5 | grep gate above |
| TC-6 | No Color(0x / Material Icons / FontFamily.Serif | AC-6 | grep gate above |
| TC-7 | Release APK clean of sandbox refs | AC-7 | unzip+grep gate above |
| TC-8 | PhaseDotState union exposes Pending/Active/Done | AC-8 | gradlew testDebugUnitTest …phaseDotState_exposes_three_cases |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt (NEW — composable + PhaseDotState sealed class)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPhaseDotStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY — register LSPhaseDotStories)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSPhaseDotTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPhaseDotInstrumentationTest.kt (NEW)

writeProhibited:
- ios/** — swift-implementer scope
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- tokens/** — generator output (UC-TOK-04 owns motion recipes)
- android/app/src/main/** for sandbox story files (stories DEBUG-ONLY)
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Build the active pulse with `rememberInfiniteTransition()` and `animateFloat()` whose `infiniteRepeatable` config is constructed from `LaneShadowTheme.motion.recipe.phaseDotPulse`.
- Resolve every color through `LaneShadowTheme.color.*`.
- Place all story code under `android/app/src/debug/`.

⚠️ Ask First:
- Adding a fourth phase (e.g. Skipped) — must originate from the PRD.
- Changing the dot diameter beyond 10dp — must come from a sizing token.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPhaseDotStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSPhaseDotTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPhaseDotInstrumentationTest.kt (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 8 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-08-phasedot.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual spec for Pending/Active/Done states + pulse geometry

2. .spec/prds/v2/05-uc-atm.md
   - Lines: section UC-ATM-08
   - Focus: Canonical AC bullets

3. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/Theme.kt
   - Lines: all
   - Focus: `color.signal.default`, `color.border.strong`, `color.status.success.default`, `motion.recipe.phaseDotPulse`

4. .spec/prds/v2/tasks/sprint-01-foundation-tokens-and-v2-reset/UC-TOK-04-motion-recipes.md
   - Lines: all
   - Focus: motion recipe shape (duration, easing, keyframes) the atom consumes

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.Atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC; AC-4..AC-7 = grep/build gates.
Gate 3: Unit tests pass — `cd android && ./gradlew :app:testDebugUnitTest` exits 0.
Gate 4: Instrumented tests pass — `cd android && ./gradlew :app:connectedDebugAndroidTest` exits 0.
Gate 5: compileDebugKotlin green.
Gate 6: detekt clean.
Gate 7: No `tween(durationMillis=` literal in source; `motion.recipe.phaseDotPulse` referenced.
Gate 8: Release APK has zero `com.nativesandbox` references.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-08-ios — swift-implementer parallel).
- Phase indicator molecule arranging multiple dots horizontally — defer to UC-MOL-* task.
- Defining a new motion recipe — escalate to UC-TOK-04 owner.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-04 generates `motion.recipe.phaseDotPulse` (duration + easing + keyframes). UC-TOK-02 generates `color.signal.default`, `color.border.strong`, `color.status.success.default`.

**Gap:** Without LSPhaseDot, every recording-state organism re-implements ride-phase visualization with inline animations.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; instrumented tests verify token-resolved colors and presence of pulse animation.
- RED evidence in TDD_STATE.
- No literal `tween(durationMillis=…)`; motion recipe referenced.
- Three `atoms.phaseDot.*` stories registered under DEBUG source set.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- PhaseDotState is a true sealed class union (not enum) so future Skipped/Failed states can carry payloads.
- Done state actually skips `rememberInfiniteTransition` (no leaked animations).
- Test names follow `{condition}_{expected}` snake-case convention.
- Anti-pattern check: zero Material Icons / Color(0x / FontFamily.Serif.
- Release APK gate exits 0 sandbox refs.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (color tokens), UC-TOK-04 (motion recipes), UC-TOK-05 (generated theme), UC-SBX-00-android
Blocks:     UC-MOL-* (phase indicator molecules), UC-ORG-* (recording organisms)
Parallel:   UC-ATM-08-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSPhaseDot Pending composed THEN size=10dp, fill transparent, border color=color.border.strong, border 1dp", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPhaseDotInstrumentationTest.phaseDot_pending_resolves_border_strong_token" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSPhaseDot Active composed THEN fill=color.signal.default and outer ring animates from motion.recipe.phaseDotPulse", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPhaseDotInstrumentationTest.phaseDot_active_filled_signal_with_pulse" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSPhaseDot Done composed THEN fill=color.status.success.default, no infinite transition", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPhaseDotInstrumentationTest.phaseDot_done_filled_success_no_animation" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSPhaseDotStories.kt WHEN aggregator composes THEN three atoms.phaseDot.* stories registered as ComponentTier.Atom", "verify": "for id in atoms.phaseDot.pending atoms.phaseDot.active atoms.phaseDot.done; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPhaseDotStories.kt || exit 1; done" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSPhaseDot.kt WHEN grep'd THEN no tween(durationMillis= literal AND motion.recipe.phaseDotPulse referenced", "verify": "! grep -REn 'tween\\(durationMillis\\s*=' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt && grep -q 'motion\\.recipe\\.phaseDotPulse' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSPhaseDot.kt WHEN grep'd THEN zero Color(0x / Material Icons / FontFamily.Serif", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN zero com.nativesandbox refs", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN PhaseDotState WHEN compiled THEN Pending/Active/Done reachable as sealed union", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSPhaseDotTest.phaseDotState_exposes_three_cases" },
    { "id": "TC-1", "type": "test_criterion", "description": "Pending hollow border.strong 1dp 10dp", "maps_to_ac": "AC-1", "verify": "gradlew connectedDebugAndroidTest …phaseDot_pending_resolves_border_strong_token" },
    { "id": "TC-2", "type": "test_criterion", "description": "Active filled signal + pulse from motion recipe", "maps_to_ac": "AC-2", "verify": "gradlew connectedDebugAndroidTest …phaseDot_active_filled_signal_with_pulse" },
    { "id": "TC-3", "type": "test_criterion", "description": "Done filled success no animation", "maps_to_ac": "AC-3", "verify": "gradlew connectedDebugAndroidTest …phaseDot_done_filled_success_no_animation" },
    { "id": "TC-4", "type": "test_criterion", "description": "Three atoms.phaseDot.* stories", "maps_to_ac": "AC-4", "verify": "grep gate" },
    { "id": "TC-5", "type": "test_criterion", "description": "Animation duration sourced from motion recipe", "maps_to_ac": "AC-5", "verify": "grep gate" },
    { "id": "TC-6", "type": "test_criterion", "description": "No Color literal / Material Icons / Serif", "maps_to_ac": "AC-6", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "description": "Release APK clean of sandbox refs", "maps_to_ac": "AC-7", "verify": "unzip+grep gate" },
    { "id": "TC-8", "type": "test_criterion", "description": "PhaseDotState union cases reachable", "maps_to_ac": "AC-8", "verify": "gradlew testDebugUnitTest …phaseDotState_exposes_three_cases" }
  ]
}
-->
