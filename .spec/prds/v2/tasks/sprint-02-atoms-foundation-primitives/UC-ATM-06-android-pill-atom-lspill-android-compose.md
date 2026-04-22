<!-- Task Template v5.1 | FEATURE -->

================================================================================
TASK: UC-ATM-06-android — Pill atom (`LSPill`) — Android Compose
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

PRD_REFS:   UC-ATM-06, .spec/prds/v2/05-uc-atm.md, .spec/prds/v2/concepts/uc-atm-06-pill.html
DEPENDS_ON: UC-TOK-02, UC-TOK-03, UC-TOK-05, UC-SBX-00-android
BLOCKS:     UC-ATM-07-android (Badge), UC-MOL-* (chip-shaped molecules)

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

`LSPill(size: PillSize.Sm | Md | Lg, padding: PaddingValues? = null, content: @Composable RowScope.() -> Unit)` renders a pill-shaped, non-interactive Compose container on Android. Corner radius resolves through `LaneShadowTheme.radius.pill`; height resolves through `LaneShadowTheme.sizing.pill.{sm=24dp, md=32dp, lg=40dp}` exclusively from generated tokens (UC-TOK-05).

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)
--------------------------------------------------------------------------------

- NEVER use `androidx.compose.material.icons` or `Icons.Filled/Outlined.*` anywhere in `android/app/src/main/`.
- NEVER hardcode `Color(0xFF…)` literals; all surface/border/content colors MUST resolve through `LaneShadowTheme.color.*`.
- NEVER hardcode `.dp` height literals — height MUST come from `LaneShadowTheme.sizing.pill.*`. Padding defaults MUST come from `LaneShadowTheme.spacing.*`.
- NEVER place sandbox stories under `android/app/src/main/**` — story files are DEBUG-ONLY under `android/app/src/debug/`.
- NEVER reference `FontFamily.Serif` or other system font families.
- MUST modify only files listed in SCOPE.writeAllowed.
- STRICTLY no edits to `~/Projects/native-theme/**`, `~/Projects/native-sandbox/**`, or `tokens/**`.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] `LSPill` composable exists at `android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt` and accepts `size: PillSize`, optional `padding: PaddingValues?`, and `content: @Composable RowScope.() -> Unit` — maps to AC-1 (PRIMARY)
- [ ] All three sizes (`Sm=24dp, Md=32dp, Lg=40dp`) render at exact token-resolved heights — maps to AC-1, AC-2, AC-3
- [ ] Custom padding override flows from token-derived `PaddingValues` — maps to AC-4
- [ ] Five sandbox stories registered with id `atoms.pill.{small|medium|large|withIconLabel|withIconOnly}` — maps to AC-5, AC-6
- [ ] Release APK contains zero references to `com.nativesandbox` — maps to AC-7
- [ ] Detekt clean; `compileDebugKotlin` green; instrumented + unit tests pass
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA (TDD Beads — ordered happy-path first)
--------------------------------------------------------------------------------

AC-1: LSPill renders at sizing.pill.md height when size=Md [PRIMARY]
  GIVEN: A Compose host providing `LaneShadowTheme`
  WHEN:  Developer renders `LSPill(size = PillSize.Md) { LSText("Tag", variant = ui.label.sm) }`
  THEN:  The measured height of the pill equals `LaneShadowTheme.sizing.pill.md` (32.dp) exactly; corner radius equals `LaneShadowTheme.radius.pill`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPillInstrumentationTest.kt
  TEST_FUNCTION: pill_md_measured_height_matches_sizing_pill_md
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_md_measured_height_matches_sizing_pill_md

AC-2: LSPill renders at sizing.pill.sm height when size=Sm
  GIVEN: A Compose host providing `LaneShadowTheme`
  WHEN:  `LSPill(size = PillSize.Sm) { ... }` is composed
  THEN:  Measured height equals `LaneShadowTheme.sizing.pill.sm` (24.dp) exactly
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPillInstrumentationTest.kt
  TEST_FUNCTION: pill_sm_measured_height_matches_sizing_pill_sm
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_sm_measured_height_matches_sizing_pill_sm

AC-3: LSPill renders at sizing.pill.lg height when size=Lg
  GIVEN: A Compose host providing `LaneShadowTheme`
  WHEN:  `LSPill(size = PillSize.Lg) { ... }` is composed
  THEN:  Measured height equals `LaneShadowTheme.sizing.pill.lg` (40.dp) exactly
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPillInstrumentationTest.kt
  TEST_FUNCTION: pill_lg_measured_height_matches_sizing_pill_lg
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_lg_measured_height_matches_sizing_pill_lg

AC-4: Custom padding override resolves through PaddingValues from tokens
  GIVEN: `LSPill(size = PillSize.Md, padding = PaddingValues(horizontal = LaneShadowTheme.spacing.md, vertical = LaneShadowTheme.spacing.xs))`
  WHEN:  Composed and measured
  THEN:  Inner content padding equals provided `PaddingValues`; height still equals `sizing.pill.md`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPillInstrumentationTest.kt
  TEST_FUNCTION: pill_custom_padding_overrides_default
  VERIFY:        cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_custom_padding_overrides_default

AC-5: Five sandbox stories registered with id atoms.pill.*
  GIVEN: `android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPillStories.kt`
  WHEN:  Sandbox aggregator composes atom stories
  THEN:  Five stories present with ids `atoms.pill.small`, `atoms.pill.medium`, `atoms.pill.large`, `atoms.pill.withIconLabel`, `atoms.pill.withIconOnly`, all `tier = ComponentTier.Atom`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPillStories.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        for id in atoms.pill.small atoms.pill.medium atoms.pill.large atoms.pill.withIconLabel atoms.pill.withIconOnly; do grep -q "$id" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPillStories.kt || exit 1; done

AC-6: No Material Icons or Color literal references (error gate — boundary)
  GIVEN: `android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt`
  WHEN:  Reviewer greps
  THEN:  Zero matches for `androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)`, zero matches for `Color\(0x`, zero matches for `FontFamily\.Serif`
  TDD_STATE:     none
  TEST_FILE:     android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt
  TEST_FUNCTION: n/a (grep gate)
  VERIFY:        ! grep -REn 'androidx\.compose\.material\.icons|Icons\.(Filled|Outlined)|Color\(0x|FontFamily\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt

AC-7: Release APK contains zero sandbox references (error gate — release hygiene)
  GIVEN: A release build of the app
  WHEN:  `./gradlew :app:assembleRelease` is run and the resulting APK is inspected
  THEN:  `unzip -l app-release.apk | grep -c com.nativesandbox` returns 0
  TDD_STATE:     none
  TEST_FILE:     android/app/build.gradle.kts
  TEST_FUNCTION: n/a (build gate)
  VERIFY:        cd android && ./gradlew :app:assembleRelease && [ "$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)" = "0" ]

AC-8: Unit test verifies token-resolved size enum mapping (no literal heights)
  GIVEN: `LSPillTest.kt`
  WHEN:  PillSize enum is mapped to height
  THEN:  Resolved height for each size equals `LaneShadowTheme.sizing.pill.{sm|md|lg}` from the generated theme — not a literal `.dp` constant in the production source
  TDD_STATE:     none
  TEST_FILE:     android/app/src/test/java/com/laneshadow/ui/atoms/LSPillTest.kt
  TEST_FUNCTION: pillSize_maps_to_token_height
  VERIFY:        cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSPillTest.pillSize_maps_to_token_height

--------------------------------------------------------------------------------
TEST CRITERIA (boolean — each maps to one AC)
--------------------------------------------------------------------------------

| ID  | Statement | Maps to | Verify |
|-----|-----------|---------|--------|
| TC-1 | LSPill Md height equals sizing.pill.md | AC-1 | gradlew connectedDebugAndroidTest …pill_md_measured_height_matches_sizing_pill_md |
| TC-2 | LSPill Sm height equals sizing.pill.sm | AC-2 | gradlew connectedDebugAndroidTest …pill_sm_measured_height_matches_sizing_pill_sm |
| TC-3 | LSPill Lg height equals sizing.pill.lg | AC-3 | gradlew connectedDebugAndroidTest …pill_lg_measured_height_matches_sizing_pill_lg |
| TC-4 | Custom PaddingValues override applies | AC-4 | gradlew connectedDebugAndroidTest …pill_custom_padding_overrides_default |
| TC-5 | Five atoms.pill.* stories registered | AC-5 | grep gate above |
| TC-6 | No Material Icons / Color(0x / FontFamily.Serif in source | AC-6 | grep gate above |
| TC-7 | Release APK contains zero com.nativesandbox refs | AC-7 | unzip+grep gate above |
| TC-8 | PillSize maps to token-resolved heights | AC-8 | gradlew testDebugUnitTest …pillSize_maps_to_token_height |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/atoms/PillSize.kt (NEW — enum if not generated)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPillStories.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY — register LSPillStories)
- android/app/src/test/java/com/laneshadow/ui/atoms/LSPillTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPillInstrumentationTest.kt (NEW)

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
- Resolve corner radius via `LaneShadowTheme.radius.pill`.
- Resolve heights via `LaneShadowTheme.sizing.pill.{sm|md|lg}`.
- Default padding: derive horizontal padding from `LaneShadowTheme.spacing.*` tokens.
- Register stories with id `atoms.pill.{variant}`, tier `ComponentTier.Atom`.
- Place all story code under `android/app/src/debug/`.

⚠️ Ask First:
- Adding a new size beyond Sm/Md/Lg (must originate from UC-TOK-03 sizing tokens).
- Making LSPill interactive (this task is non-interactive only).

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt (NEW): the pill atom
- android/app/src/main/java/com/laneshadow/ui/atoms/PillSize.kt (NEW): size enum
- android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPillStories.kt (NEW): 5 stories
- android/app/src/debug/java/com/laneshadow/sandbox/LaneShadowStories.kt (MODIFY): register
- android/app/src/test/java/com/laneshadow/ui/atoms/LSPillTest.kt (NEW): unit test
- android/app/src/androidTest/java/com/laneshadow/ui/atoms/LSPillInstrumentationTest.kt (NEW): measured-height tests

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

For each AC: RED (write failing test) → GREEN (minimal impl) → REFACTOR. Show actual test failure output in RED phase. Never write implementation in RED. Never expand beyond current AC in GREEN.

After all 8 ACs: dispatch kotlin-reviewer.

--------------------------------------------------------------------------------
READING LIST (max 5 files — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-atm-06-pill.html [PRIMARY PATTERN]
   - Lines: all
   - Focus: REQUIRED READING — visual design source for pill geometry and size matrix

2. .spec/prds/v2/05-uc-atm.md
   - Lines: section UC-ATM-06
   - Focus: Canonical AC bullets

3. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/Theme.kt
   - Lines: all
   - Focus: ThemeProvider, generated `sizing.pill.*`, `radius.pill`, `spacing.*`

4. android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt (sibling pattern from UC-ATM-01-android)
   - Lines: all
   - Focus: How an atom consumes the theme provider on Compose

5. ~/Projects/native-sandbox/RULES.md
   - Sections: §6 (Story contract), §10 (ArgTypes discipline)
   - Focus: Story id format `atoms.{component}.{variant}`, ComponentTier.Atom

--------------------------------------------------------------------------------
EVIDENCE GATES (fast/cheap first)
--------------------------------------------------------------------------------

Gate 1: RED phase evidence (TDD_STATE shows red before green per AC).
Gate 2: One test per behavioral AC; AC-5/AC-6/AC-7 = grep/build gates.
Gate 3: Unit tests pass — `cd android && ./gradlew :app:testDebugUnitTest` exits 0.
Gate 4: Instrumented tests pass — `cd android && ./gradlew :app:connectedDebugAndroidTest` exits 0.
Gate 5: compileDebugKotlin green.
Gate 6: detekt clean.
Gate 7: No Material Icons / Color(0x / FontFamily.Serif — grep gate above.
Gate 8: Release APK has zero `com.nativesandbox` references.
Gate 9: Scope compliance — `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- iOS implementation (UC-ATM-06-ios — runs in parallel under swift-implementer).
- Adding interactive (clickable) behavior — this atom is non-interactive only.
- Defining new pill sizes — escalate to UC-TOK-03 owner.

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** UC-TOK-03 generates `sizing.pill.{sm,md,lg}` and `radius.pill` into `tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/`. Android has no pill atom — every chip-shaped surface is currently inlined.

**Gap:** Without LSPill, every badge/chip molecule duplicates corner radius and height literals, defeating UC-TOK-03.

--------------------------------------------------------------------------------
REVIEW (for kotlin-reviewer)
--------------------------------------------------------------------------------

Must pass (≤5):
- One test per behavioral AC; instrumented tests verify rendered token resolution.
- RED evidence present in TDD_STATE history.
- No Material Icons, Color literals, or FontFamily.Serif in production source.
- Five `atoms.pill.*` stories registered under DEBUG source set only.
- SCOPE respected (`git diff --name-only` ⊆ writeAllowed).

Should verify (≤5):
- API ergonomics — `PillSize.Sm | Md | Lg`, optional `padding`, `content: @Composable RowScope.() -> Unit`.
- Default padding derives from `LaneShadowTheme.spacing.*` (no `.dp` literals).
- Release APK gate exits 0 sandbox refs.
- Test naming follows `{condition}_{expected}` snake-case convention.
- Anti-pattern check: zero Material Icons / Color(0x / FontFamily.Serif.

Verdict: APPROVED | NEEDS_FIXES

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-TOK-02 (color), UC-TOK-03 (sizing/radius/spacing), UC-TOK-05 (generated Kotlin theme), UC-SBX-00-android (sandbox runtime)
Blocks:     UC-ATM-07-android (Badge composes LSPill), UC-MOL-* (chip-shaped molecules)
Parallel:   UC-ATM-06-ios (iOS pair)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LaneShadowTheme host WHEN LSPill(Md) composed THEN measured height equals sizing.pill.md and corner radius equals radius.pill", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_md_measured_height_matches_sizing_pill_md" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSPill(Sm) composed THEN measured height equals sizing.pill.sm", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_sm_measured_height_matches_sizing_pill_sm" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN host WHEN LSPill(Lg) composed THEN measured height equals sizing.pill.lg", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_lg_measured_height_matches_sizing_pill_lg" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN custom PaddingValues from tokens WHEN LSPill composed THEN inner padding matches override and height stays sizing.pill.md", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests com.laneshadow.ui.atoms.LSPillInstrumentationTest.pill_custom_padding_overrides_default" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSPillStories.kt WHEN aggregator composes THEN five atoms.pill.* stories registered as ComponentTier.Atom", "verify": "for id in atoms.pill.small atoms.pill.medium atoms.pill.large atoms.pill.withIconLabel atoms.pill.withIconOnly; do grep -q \"$id\" android/app/src/debug/java/com/laneshadow/sandbox/stories/LSPillStories.kt || exit 1; done" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSPill.kt WHEN grep'd THEN zero Material Icons / Color(0x / FontFamily.Serif", "verify": "! grep -REn 'androidx\\.compose\\.material\\.icons|Icons\\.(Filled|Outlined)|Color\\(0x|FontFamily\\.Serif' android/app/src/main/java/com/laneshadow/ui/atoms/LSPill.kt" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN release build WHEN APK inspected THEN zero com.nativesandbox refs", "verify": "cd android && ./gradlew :app:assembleRelease && [ \"$(unzip -l app/build/outputs/apk/release/app-release.apk | grep -c com.nativesandbox)\" = \"0\" ]" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN PillSize enum WHEN mapped THEN heights resolve from generated theme tokens, not literal dp", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests com.laneshadow.ui.atoms.LSPillTest.pillSize_maps_to_token_height" },
    { "id": "TC-1", "type": "test_criterion", "description": "Md height equals sizing.pill.md", "maps_to_ac": "AC-1", "verify": "gradlew :app:connectedDebugAndroidTest --tests …pill_md_measured_height_matches_sizing_pill_md" },
    { "id": "TC-2", "type": "test_criterion", "description": "Sm height equals sizing.pill.sm", "maps_to_ac": "AC-2", "verify": "gradlew :app:connectedDebugAndroidTest --tests …pill_sm_measured_height_matches_sizing_pill_sm" },
    { "id": "TC-3", "type": "test_criterion", "description": "Lg height equals sizing.pill.lg", "maps_to_ac": "AC-3", "verify": "gradlew :app:connectedDebugAndroidTest --tests …pill_lg_measured_height_matches_sizing_pill_lg" },
    { "id": "TC-4", "type": "test_criterion", "description": "Padding override applied", "maps_to_ac": "AC-4", "verify": "gradlew :app:connectedDebugAndroidTest --tests …pill_custom_padding_overrides_default" },
    { "id": "TC-5", "type": "test_criterion", "description": "Five stories registered", "maps_to_ac": "AC-5", "verify": "grep gate" },
    { "id": "TC-6", "type": "test_criterion", "description": "No Material Icons / Color(0x / FontFamily.Serif", "maps_to_ac": "AC-6", "verify": "grep gate" },
    { "id": "TC-7", "type": "test_criterion", "description": "Release APK clean of sandbox refs", "maps_to_ac": "AC-7", "verify": "unzip+grep gate" },
    { "id": "TC-8", "type": "test_criterion", "description": "PillSize maps to token heights", "maps_to_ac": "AC-8", "verify": "gradlew :app:testDebugUnitTest --tests …pillSize_maps_to_token_height" }
  ]
}
-->
