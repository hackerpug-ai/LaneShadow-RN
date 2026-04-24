# kb-run Implementer Packet

Task ID: UC-ATM-09-android
Role: kotlin-implementer
Sprint: sprint-02-atoms-foundation-primitives
Worktree: /Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-ATM-09-android
Branch: kb-run/UC-ATM-09-android
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

- Repo-current drift: Android currently aggregates atom stories through android/app/src/debug/java/com/laneshadow/sandbox/stories/AtomsStories.kt, not the older LaneShadowStories.kt path named in the task markdown.
- Prefer existing atom semantics/testing patterns over legacy component previews under ui/components.

## Normalized Requirements

{
  "requirements": [
    {
      "id": "AC-1",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "LSScrim renders full-parent overlay with color.surface.scrim background [PRIMARY]"
    },
    {
      "id": "AC-2",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "Default opacity sourced from opacity.scrim token (no literal)"
    },
    {
      "id": "AC-3",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "Default LSScrim allows touches to pass through"
    },
    {
      "id": "AC-4",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "blocking=true intercepts touches and fires onTap"
    },
    {
      "id": "AC-5",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "Three sandbox stories registered with id atoms.scrim.*"
    },
    {
      "id": "AC-6",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "No Color literal / Material Icons / FontFamily.Serif (error gate — boundary)"
    },
    {
      "id": "AC-7",
      "source": "ACCEPTANCE CRITERIA",
      "summary": "Release APK contains zero sandbox references (error gate — release hygiene)"
    },
    {
      "id": "TC-1",
      "source": "TEST CRITERIA",
      "summary": "Default scrim fills parent with color.surface.scrim"
    },
    {
      "id": "TC-2",
      "source": "TEST CRITERIA",
      "summary": "Default opacity references opacity.scrim token"
    },
    {
      "id": "TC-3",
      "source": "TEST CRITERIA",
      "summary": "Default scrim lets touches pass through"
    },
    {
      "id": "TC-4",
      "source": "TEST CRITERIA",
      "summary": "blocking=true intercepts and fires onTap"
    },
    {
      "id": "TC-5",
      "source": "TEST CRITERIA",
      "summary": "Three atoms.scrim.* stories registered"
    },
    {
      "id": "TC-6",
      "source": "TEST CRITERIA",
      "summary": "No Color(0x / Material Icons / Serif"
    },
    {
      "id": "TC-7",
      "source": "TEST CRITERIA",
      "summary": "Release APK clean of sandbox refs"
    }
  ],
  "supplemental_requirements": [],
  "outcome_states": [
    "default"
  ],
  "warnings": []
}

## Required Evidence Outputs

- Write a concise evidence log to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-09-android/iterations/001/evidence.md`.
- Write an evidence manifest JSON to `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-ATM-09-android/iterations/001/evidence-manifest.json` with:
  - `task_id`
  - `files_changed`
  - `verification_commands`
  - `red_phase_commands`
  - `notes`
- Your final JSON response must point to those files.

## Task Markdown

<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-09-android — Scrim atom (`LSScrim`) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     S
SPRINT:     [sprint-02-atoms-foundation-primitives](./SPRINT.md)
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   60 min

RUNTIME_COMMANDS:
  test:         cd android && ./gradlew :app:testDebugUnitTest
  instrumented: cd android && ./gradlew :app:connectedDebugAndroidTest
  typecheck:    cd android && ./gradlew :app:compileDebugKotlin
  lint:         cd android && ./gradlew detekt
  release_no_sandbox: cd android && ./gradlew :app:assembleRelease && unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox

PRD_REFS:   UC-ATM-09, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-09-scrim.html
DEPENDS_ON: UC-TOK-02, UC-TOK-05, UC-SBX-00-android
BLOCKS:     UC-MOL-* (bottom sheets, modals, full-bleed photo overlays)

PROGRESS: AC-1 none · 0/7 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSScrim(opacity: Float = 0.35f, blocking: Boolean = false, onTap: (() -> Unit)? = null)` renders a full-parent overlay on Android Compose. Background resolves through `LaneShadowTheme.color.surface.scrim`. Default opacity 0.35 is sourced from `LaneShadowTheme.opacity.scrim` token. By default touches pass through (`Modifier.pointerInput { }` opt-out). When `blocking = true`, the scrim intercepts pointer events and invokes `onTap` on tap.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER hardcode `Color(0xFF…)` literals — background MUST resolve through `LaneShadowTheme.color.surface.scrim`.
- NEVER hardcode the default opacity — it MUST resolve from `LaneShadowTheme.opacity.scrim`.
- NEVER use `androidx.compose.material.icons` or `Icons.Filled/Outlined.*`.
- NEVER place sandbox stories under `android/app/src/main/**`.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `tokens/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSScrim` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt` accepting `opacity: Float = 0.35f`, `blocking: Boolean = false`, `onTap: (() -> Unit)? = null` — maps to AC-1 (PRIMARY)
- [ ] Background resolves through `color.surface.scrim`; default opacity sourced from `opacity.scrim` — maps to AC-1, AC-2
- [ ] Touches pass through by default (non-blocking) — maps to AC-3
- [ ] Blocking mode intercepts pointer events and fires `onTap` — maps to AC-4
- [ ] Sandbox stories registered with id `atoms.scrim.{default|blocking|customOpacity}` — maps to AC-5
- [ ] No Color(0x…), no Material Icons, no FontFamily.Serif — maps to AC-6
- [ ] Release APK contains zero `com.nativesandbox` references — maps to AC-7
- [ ] Detekt clean; `compileDebugKotlin` green; instrumented + unit tests pass

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSScrim renders full-parent overlay with color.surface.scrim background [PRIMARY]
  GIVEN: A Compose host providing `LaneShadowTheme` with a 320×640 parent
  WHEN:  Developer renders `LSScrim()`
  THEN:  Measured size matches parent (320×640); background color equals `LaneShadowTheme.color.surface.scrim`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSScrimInstrumentationTest.kt
  TEST_FUNCTION: scrim_default_fills_parent_with_surface_scrim_token
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSScrimInstrumentationTest.scrim_default_fills_parent_with_surface_scrim_token

AC-2: Default opacity sourced from opacity.scrim token (no literal)
  GIVEN: `LSScrim.kt`
  WHEN:  Reviewer greps the production source
  THEN:  Default parameter expression references `LaneShadowTheme.opacity.scrim` (or generated alias); zero matches for the literal `0.35f` outside the function signature default
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        grep -q 'opacity\.scrim' android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt

AC-3: Default LSScrim allows touches to pass through
  GIVEN: A Compose host with a button under the scrim
  WHEN:  `LSScrim()` is composed above a button and the button area is tapped
  THEN:  The underlying button's `onClick` fires; `onTap` lambda (if any) does not fire
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSScrimInstrumentationTest.kt
  TEST_FUNCTION: scrim_default_passes_touches_through
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSScrimInstrumentationTest.scrim_default_passes_touches_through

AC-4: blocking=true intercepts touches and fires onTap
  GIVEN: A Compose host with a button under the scrim
  WHEN:  `LSScrim(blocking = true, onTap = { … })` is composed above the button and the scrim is tapped
  THEN:  `onTap` lambda fires exactly once; underlying button's `onClick` does NOT fire
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSScrimInstrumentationTest.kt
  TEST_FUNCTION: scrim_blocking_intercepts_and_fires_onTap
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSScrimInstrumentationTest.scrim_blocking_intercepts_and_fires_onTap

AC-5: Three sandbox stories registered with id atoms.scrim.*
  GIVEN: `LSScrimStories.kt`
  WHEN:  Sandbox aggregator composes atom stories
  THEN:  Three stories present with ids `atoms.scrim.default`, `atoms.scrim.blocking`, `atoms.scrim.customOpacity`, all `tier = ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSScrimStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.scrim.default atoms.scrim.blocking atoms.scrim.customOpacity; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSScrimStories.kt || exit 1; done

AC-6: No Color literal / Material Icons / FontFamily.Serif (error gate — boundary)
  GIVEN: `LSScrim.kt`
  WHEN:  Reviewer greps
  THEN:  Zero matches for `Color\(0x`, `androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)`, `FontFamily\.Serif`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'Color\(0x|androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|FontFamily\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt

AC-7: Release APK contains zero sandbox references (error gate — release hygiene)
  GIVEN: A release build
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
| TC-1 | Default scrim fills parent with color.surface.scrim | AC-1 | gradlew connectedDebugAndroidTest …scrim_default_fills_parent_with_surface_scrim_token |
| TC-2 | Default opacity references opacity.scrim token | AC-2 | grep gate above |
| TC-3 | Default scrim lets touches pass through | AC-3 | gradlew connectedDebugAndroidTest …scrim_default_passes_touches_through |
| TC-4 | blocking=true intercepts and fires onTap | AC-4 | gradlew connectedDebugAndroidTest …scrim_blocking_intercepts_and_fires_onTap |
| TC-5 | Three atoms.scrim.* stories registered | AC-5 | grep gate above |
| TC-6 | No Color(0x / Material Icons / Serif | AC-6 | grep gate above |
| TC-7 | Release APK clean of sandbox refs | AC-7 | unzip+grep gate above |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSScrimStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY — register LSScrimStories)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSScrimTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSScrimInstrumentationTest.kt (NEW)

writeProhibited:
- ios/** — swift-implementer scope
- ~/Projects/native-theme/** — schema upstream
- ~/Projects/native-sandbox/** — runtime upstream
- tokens/** — generator output (UC-TOK-05 owns)
- android/app/src/main/** for sandbox story files (stories DEBUG-ONLY)
- Anything not explicitly listed above

--------------------------------------------------------------------------------
BOUNDARIES (✅ Always / ⚠️ Ask First)
--------------------------------------------------------------------------------

✅ Always:
- Use `Modifier.fillMaxSize()` to cover parent.
- Resolve background via `LaneShadowTheme.color.surface.scrim` and apply alpha via the supplied `opacity`.
- Default opacity expression resolves through `LaneShadowTheme.opacity.scrim` (the literal `0.35f` in the function signature is acceptable only as documentation — actual implementation MUST consume the token at runtime).
- Place all story code under `android/app/src/debug/`.

⚠️ Ask First:
- Adding blur/backdrop effects — defer to a separate task.
- Adding entry/exit animations — defer; this atom is static.

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSScrimStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSScrimTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSScrimInstrumentationTest.kt (NEW)

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 7 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-09-scrim.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual spec for default opacity, blocking interaction model

2. .spec/prds/v2/05-uc-atm.md
   - Lines: section UC-ATM-09
   - Focus: Canonical AC bullets

3. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/Theme.kt
   - Lines: all
   - Focus: `color.surface.scrim`, `opacity.scrim`

4. android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt (sibling pattern)
   - Lines: all
   - Focus: How an atom consumes the theme provider on Compose

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
Gate 7: `opacity.scrim` referenced in source.
Gate 8: Release APK has zero `com.nativesandbox` references.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-09-ios — swift-implementer parallel).
- Animated entry/exit transitions — defer to molecule task.
- Backdrop blur — defer.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-02 generates `color.surface.scrim` and `opacity.scrim`. Without LSScrim, every modal/sheet molecule re-implements its own dimming overlay, drifting on opacity and color.

**Gap:** No typed scrim atom exists; downstream sheets and full-bleed overlays will inline raw Box+Color pairs.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC. Automated tests prove user-visible behavior, interaction/state changes, accessibility, and required composition contracts. Exact visual styling checks belong in manual sandbox review unless they are themselves the behavior under test.
- RED evidence in TDD_STATE.
- `opacity.scrim` referenced in source; no `Color(0x…)` literal.
- Three `atoms.scrim.*` stories registered under DEBUG source set.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- Default `blocking = false` truly lets pointer events through (verify with underlying button click test).
- `blocking = true` consumes events with `Modifier.pointerInput { detectTapGestures(onTap = ...) }`.
- Test names follow `{condition}_{expected}` snake-case convention.
- Anti-pattern check: zero Material Icons / Color(0x / FontFamily.Serif.
- Release APK gate exits 0 sandbox refs.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (color + opacity tokens), UC-TOK-05 (generated theme), UC-SBX-00-android
Blocks:     UC-MOL-* (bottom sheets, modals, full-bleed photo overlays)
Parallel:   UC-ATM-09-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN host with 320x640 parent WHEN LSScrim() composed THEN size matches parent and background equals color.surface.scrim", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSScrimInstrumentationTest.scrim_default_fills_parent_with_surface_scrim_token" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSScrim.kt WHEN grep'd THEN opacity.scrim referenced", "verify": "grep -q 'opacity\\.scrim' android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN button under default LSScrim WHEN tapped THEN underlying onClick fires", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSScrimInstrumentationTest.scrim_default_passes_touches_through" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSScrim(blocking=true, onTap) WHEN tapped THEN onTap fires once and underlying button does NOT fire", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSScrimInstrumentationTest.scrim_blocking_intercepts_and_fires_onTap" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSScrimStories.kt WHEN aggregator composes THEN three atoms.scrim.* stories registered as ComponentTier.Atom", "verify": "for id in atoms.scrim.default atoms.scrim.blocking atoms.scrim.customOpacity; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSScrimStories.kt || exit 1; done" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSScrim.kt WHEN grep'd THEN zero Color(0x / Material Icons / FontFamily.Serif", "verify": "! grep -REn 'Color\\(0x|androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|FontFamily\\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN zero com.nativesandbox refs", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "TC-1", "type": "test_criterion", "description": "Default scrim fills parent with color.surface.scrim", "maps_to_ac": "AC-1", "verify": "gradlew connectedDebugAndroidTest …scrim_default_fills_parent_with_surface_scrim_token" },
    { "id": "TC-2", "type": "test_criterion", "description": "Default opacity sourced from opacity.scrim", "maps_to_ac": "AC-2", "verify": "grep gate" },
    { "id": "TC-3", "type": "test_criterion", "description": "Default passes touches through", "maps_to_ac": "AC-3", "verify": "gradlew connectedDebugAndroidTest …scrim_default_passes_touches_through" },
    { "id": "TC-4", "type": "test_criterion", "description": "Blocking intercepts and fires onTap", "maps_to_ac": "AC-4", "verify": "gradlew connectedDebugAndroidTest …scrim_blocking_intercepts_and_fires_onTap" },
    { "id": "TC-5", "type": "test_criterion", "description": "Three atoms.scrim.* stories registered", "maps_to_ac": "AC-5", "verify": "grep gate" },
    { "id": "TC-6", "type": "test_criterion", "description": "No Color literal / Material Icons / Serif", "maps_to_ac": "AC-6", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "description": "Release APK clean of sandbox refs", "maps_to_ac": "AC-7", "verify": "unzip+grep gate" }
  ]
}
-->

