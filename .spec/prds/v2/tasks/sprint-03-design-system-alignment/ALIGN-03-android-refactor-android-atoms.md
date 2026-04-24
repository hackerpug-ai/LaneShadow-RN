<!-- Template Version: 5.1.0 | Sprint: sprint-03-design-system-alignment | Type: FEATURE/TDD -->

================================================================================
TASK: ALIGN-03-android — Migrate Android Atoms onto the Copper Second Theme
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   05-uc-atm.md

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/7 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

Every Android atom used by Sprint 03 stories renders identically to its .spec/design/system/atoms/ HTML reference on the Copper theme with zero raw Color(0x) or .dp literals in @Composable bodies; atom tests pass and legacy theme infrastructure remains intact for later deletion.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compare each atom's token consumption against its .spec/design/system/atoms/{name}/README.md before code changes.
- MUST run ./gradlew :app:test after refactoring each atom — no test may regress.
- MUST move atoms to the Copper second theme without deleting legacy theme infrastructure in this sprint.
- NEVER introduce raw Color(0xFF...) or raw .dp literals inside atom @Composable bodies — all values reference GeneratedTokens or LocalLaneShadowTheme.current.
- NEVER remove or rename existing public API (variant enums, parameter names) — only internal token resolution changes.
- STRICTLY: ALIGN-02-android must be merged before this task starts; Tokens.kt must contain all missing keys.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSButton resolves variants from GeneratedTokens.color.Action.* (PRIMARY) — PARTIAL: implementation work was validated only via targeted tests; unit was blocked on repo-wide `:app:test` (see .kb-run/tasks/ALIGN-03-android/notebook.md:24)
- [ ] AC-2: LSText renders three families with token-correct fontSize/fontFamily — PARTIAL: implementation work was validated only via targeted tests; unit was blocked on repo-wide `:app:test` (see .kb-run/tasks/ALIGN-03-android/notebook.md:24)
- [ ] AC-3: LSGlassPanel blur + surface.glass token resolution — PARTIAL: implementation work was validated only via targeted tests; unit was blocked on repo-wide `:app:test` (see .kb-run/tasks/ALIGN-03-android/notebook.md:24)
- [ ] AC-4: LSPhaseDot animation uses motion token — PARTIAL: implementation work was validated only via targeted tests; unit was blocked on repo-wide `:app:test` (see .kb-run/tasks/ALIGN-03-android/notebook.md:24)
- [ ] AC-5: All 17 atom files contain zero raw Color(0x) literals — PARTIAL: no repo-level proof captured in-task because the lane was blocked (see .kb-run/tasks/ALIGN-03-android/notebook.md:26)
- [ ] AC-6: Dark-mode token resolution correct (LSScrim, LSCard) — PARTIAL: targeted tests passed, but full-suite gate remained red (see .kb-run/tasks/ALIGN-03-android/notebook.md:25)
- [ ] AC-7: Full atom test suite passes — FAIL: explicitly blocked; `./gradlew :app:test` had 207 failures at validation time (see .kb-run/tasks/ALIGN-03-android/notebook.md:25)
- [ ] Only SCOPE.writeAllowed files modified — PARTIAL: unit not merged; scope compliance not established as a merged main-branch artifact (see .kb-run/tasks/ALIGN-03-android/notebook.md:26)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSButton variant×state token resolution [PRIMARY]
  GIVEN: button.html defines variant×state color matrix
  WHEN:  LSButton is rendered for each variant in Default and Pressed inside LaneShadowTheme{}
  THEN:  LSButtonBackgroundColorKey semantics return GeneratedTokens.color.Action.Primary.default for Primary-Default, .pressed for Primary-Pressed, danger.default for Destructive-Default; no Color(0x) literal in LSButton.kt
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSButtonTest'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSButtonTest.kt
  TEST_FUNCTION: all_six_variants_resolve_correct_action_tokens

AC-2: LSText family resolution
  GIVEN: Three typography families (opinion Newsreader, ui Geist, instrument JetBrains Mono)
  WHEN:  LSText renders with Opinion.Xl, UI.Title.Lg, Instrument.Lg inside LaneShadowTheme{}
  THEN:  Opinion.Xl fontSize=30.sp fontFamily=newsreader; UI.Title.Lg fontSize=17.sp fontFamily=geist; Instrument.Lg fontSize=18.sp fontFamily=jetBrainsMono
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSTextTest'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSTextTest.kt
  TEST_FUNCTION: all_three_families_resolve_correct_tokens

AC-3: LSGlassPanel surface.glass token
  GIVEN: Light theme surface.glass = rgba(253,251,248,0.72)
  WHEN:  LSGlassPanel renders inside LaneShadowTheme{ darkTheme=false }
  THEN:  LSGlassPanelBackgroundColorKey returns Color with alpha ≈ 0.72 matching GeneratedTokens.color.Surface.glass; no Color(0x) literal in LSGlassPanel.kt
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSGlassPanelTest'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSGlassPanelTest.kt
  TEST_FUNCTION: light_mode_uses_token_surface_glass

AC-4: LSPhaseDot motion token
  GIVEN: phase-dot design spec specifies pulse animation
  WHEN:  LSPhaseDot.kt source is inspected for hardcoded animation duration
  THEN:  No integer literal for animation duration — references LocalLaneShadowTheme.current.motion or GeneratedTokens.motion
  VERIFY: grep -n 'tween(' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt | grep -v '//'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSPhaseDotTest.kt
  TEST_FUNCTION: active_state_pulses_using_token_duration

AC-5: Zero raw color/dimension literals in atoms
  GIVEN: Sprint 2 may have introduced placeholder literals; ALIGN-02-android supplies required tokens
  WHEN:  grep for Color(0x over all atom files is run
  THEN:  grep -rn 'Color(0x' in android/app/src/main/java/com/laneshadow/ui/atoms/ returns 0 non-comment matches
  VERIFY: grep -rn 'Color(0x' android/app/src/main/java/com/laneshadow/ui/atoms/ | grep -v '//' | wc -l
  TDD_STATE: none
  TEST_FILE: (static grep assertion)
  TEST_FUNCTION: (n/a)

AC-6: Dark-mode token resolution
  GIVEN: theme.dark.json surface.scrim = rgba(10,6,3,0.50); surface.card = #2D2218
  WHEN:  LSScrim and LSCard render inside LaneShadowTheme{ darkTheme=true }
  THEN:  LSScrim semantics return alpha ≈ 0.50 matching dark scrim; LSCard background = Color(0xFF2D2218)
  VERIFY: cd android && ./gradlew :app:test --tests '*.LSCardTest' --tests '*.LSScrimTest'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/atoms/LSCardTest.kt, LSScrimTest.kt
  TEST_FUNCTION: dark_mode_resolves_correct_surface

AC-7: Full atom test suite passes
  GIVEN: 71 atom test files
  WHEN:  ./gradlew :app:test runs
  THEN:  BUILD SUCCESSFUL with 0 failures; no tests newly skipped
  VERIFY: cd android && ./gradlew :app:test
  TDD_STATE: none
  TEST_FILE: (suite-wide)
  TEST_FUNCTION: (suite-wide)

--------------------------------------------------------------------------------
TEST CRITERIA (boolean)
--------------------------------------------------------------------------------

| ID | Statement | Maps To | Verify |
|----|-----------|---------|--------|
| TC-1 | LSButtonTest.all_six_variants_resolve_correct_action_tokens passes | AC-1 | ./gradlew :app:test --tests '*.LSButtonTest.all_six_variants_resolve_correct_action_tokens' |
| TC-2 | LSTextTest asserts Opinion.Xl fontFamily equals LaneShadowFontFamilies.newsreader | AC-2 | ./gradlew :app:test --tests '*.LSTextTest' |
| TC-3 | grep Color(0x in atom files returns 0 non-comment matches | AC-5 | grep -rn 'Color(0x' android/app/src/main/java/com/laneshadow/ui/atoms/ \| grep -v '//' \| wc -l |
| TC-4 | LSGlassPanelTest asserts blur strategy not 'none' in light mode | AC-3 | ./gradlew :app:test --tests '*.LSGlassPanelTest' |
| TC-5 | LSPhaseDot.kt contains no bare integer tween duration literal | AC-4 | grep -n 'tween(' LSPhaseDot.kt \| grep -v '//' |
| TC-6 | ./gradlew :app:test produces BUILD SUCCESSFUL with 0 failures | AC-7 | ./gradlew :app:test |
| TC-7 | LSCardTest and LSScrimTest pass under darkTheme=true | AC-6 | ./gradlew :app:test --tests '*.LSCardTest' --tests '*.LSScrimTest' |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/atoms/*.kt (MODIFY) — fix token drift
- android/app/src/test/java/com/laneshadow/ui/atoms/*.kt (MODIFY/NEW)
- android/app/src/test/java/com/laneshadow/ui/components/TestThemeHelper.kt (MODIFY if ALIGN-02 adds fields)

writeProhibited:
- .spec/design/system/atoms/** — read-only
- tokens/platforms/kotlin/** — ALIGN-02-android scope
- android/app/src/debug/java/com/laneshadow/sandbox/** — ALIGN-04-android scope

--------------------------------------------------------------------------------
BOUNDARIES
--------------------------------------------------------------------------------

✅ Always:
- Read .spec/design/system/atoms/{name}/README.md before touching the .kt file
- Use LocalLaneShadowTheme.current or GeneratedTokens.* for every color/dimension

⚠️ Ask First:
- Changes that would alter an atom's public API (new parameters, renamed variants)
- Adding a new atom file not listed in the design system

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt (MODIFY)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSText.kt (MODIFY)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt (MODIFY)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt (MODIFY)
- android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt, LSCard.kt (MODIFY as needed)
- Other 12 atom files as needed (NEW/MODIFY tests)

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt [PRIMARY PATTERN]
   - Lines: 1-70
   - Focus: SemanticsPropertyKey pattern for token assertions — replicate across atoms

2. android/app/src/test/java/com/laneshadow/ui/atoms/LSButtonTest.kt
   - Lines: 1-73
   - Focus: Token-assertion test pattern using resolveLSButtonVisualStyle + SemanticsPropertyKey

3. .spec/design/system/atoms/button/README.md
   - Lines: all
   - Focus: Authoritative design spec — read per-atom README before touching each .kt

4. tokens/platforms/kotlin/src/main/java/com/laneshadow/theme/generated/Tokens.kt
   - Lines: 1-293 (after ALIGN-02-android)
   - Focus: All available token constants — atoms reference only these

5. android/app/src/test/java/com/laneshadow/ui/components/TestThemeHelper.kt
   - Lines: 1-176
   - Focus: testTheme fixture — extend if ALIGN-02 added new fields

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/atoms/button, text, glass-panel, phase-dot, scrim, card, plus remaining atoms.

Interaction notes:
- REQUIRED READING: Per-atom README under .spec/design/system/atoms/{name}/ before modifying
- Colors: GeneratedTokens.color.* or LocalLaneShadowTheme.current.colors.*
- Spacing: LocalLaneShadowTheme.current.space.*
- Typography: GeneratedTokens.typography.* or LocalLaneShadowTheme.current.type.*
- Alpha-channel colors use the float-component Color(r,g,b,a) constructor

Pattern: Atoms contain zero Color(0x literals; all token references go through LocalLaneShadowTheme.current or GeneratedTokens.*
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt:34
Anti-pattern: Do not add new variant enums or change public API during alignment — only fix internal token resolution.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow — per AC)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.
RED: Extend or add test asserting the expected token resolution. Run `./gradlew :app:test --tests ...`. Verify FAILS.
GREEN: Modify atom implementation to resolve through GeneratedTokens/LocalLaneShadowTheme. Run same test. Verify PASSES.
REFACTOR: Clean up duplicate token lookups; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (RED): TDD_STATE history shows red before green.
Gate 2 (One test per AC): Tests cover each AC.
Gate 3 (Tests pass): `./gradlew :app:test` exits 0.
Gate 4 (Typecheck): `./gradlew :app:compileDebugKotlin` exits 0.
Gate 5 (No raw literals): `grep -rn 'Color(0x' android/app/src/main/java/com/laneshadow/ui/atoms/ | grep -v '//' | wc -l` returns 0.
Gate 6 (Scope): `git diff --name-only` ⊆ writeAllowed.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-02-android (Copper token surface must be aligned first)
Blocks:     ALIGN-04-android (sandbox stories depend on migrated atoms)
Parallel:   ALIGN-03-ios (iOS equivalent), UC-ATM-12-android (LSMap implementation)

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN button variant×state matrix WHEN LSButton renders per variant THEN LSButtonBackgroundColorKey semantics return GeneratedTokens.color.Action.* values; no Color(0x) in LSButton.kt", "verify": "cd android && ./gradlew :app:test --tests '*.LSButtonTest'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN three typography families WHEN LSText renders with each variant THEN font sizes and families match GeneratedTokens.typography values", "verify": "cd android && ./gradlew :app:test --tests '*.LSTextTest'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN glass-panel rgba spec WHEN LSGlassPanel renders in light mode THEN LSGlassPanelBackgroundColorKey returns alpha ≈ 0.72 matching GeneratedTokens.color.Surface.glass", "verify": "cd android && ./gradlew :app:test --tests '*.LSGlassPanelTest'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN phase-dot pulse spec WHEN LSPhaseDot.kt inspected THEN no integer literal for animation duration — only theme.motion.duration references", "verify": "grep -n 'tween(' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt | grep -v '//'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN all 17 atom files WHEN grep -rn 'Color(0x' runs THEN 0 non-comment matches exist", "verify": "grep -rn 'Color(0x' android/app/src/main/java/com/laneshadow/ui/atoms/ | grep -v '//' | wc -l" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN dark theme values WHEN LSScrim and LSCard render under darkTheme=true THEN semantics return correct dark surface colors", "verify": "cd android && ./gradlew :app:test --tests '*.LSCardTest' --tests '*.LSScrimTest'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN refactored atoms WHEN ./gradlew :app:test runs THEN BUILD SUCCESSFUL with 0 failures", "verify": "cd android && ./gradlew :app:test" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSButtonTest.all_six_variants_resolve_correct_action_tokens passes after refactor", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:test --tests '*.LSButtonTest.all_six_variants_resolve_correct_action_tokens'" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSTextTest asserts Opinion.Xl fontFamily equals LaneShadowFontFamilies.newsreader (not default system font)", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:test --tests '*.LSTextTest'" },
    { "id": "TC-3", "type": "test_criterion", "description": "grep for Color(0x in all atom files returns 0 results excluding comment lines", "maps_to_ac": "AC-5", "verify": "grep -rn 'Color(0x' android/app/src/main/java/com/laneshadow/ui/atoms/ | grep -v '//' | wc -l" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSGlassPanelTest asserts blur strategy is not 'none' (haze is active) in light mode", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:test --tests '*.LSGlassPanelTest'" },
    { "id": "TC-5", "type": "test_criterion", "description": "LSPhaseDot.kt contains no bare integer tween duration literal outside comment lines", "maps_to_ac": "AC-4", "verify": "grep -n 'tween(' android/app/src/main/java/com/laneshadow/ui/atoms/LSPhaseDot.kt | grep -v '//'" },
    { "id": "TC-6", "type": "test_criterion", "description": "./gradlew :app:test produces BUILD SUCCESSFUL with 0 failures", "maps_to_ac": "AC-7", "verify": "cd android && ./gradlew :app:test" },
    { "id": "TC-7", "type": "test_criterion", "description": "LSCardTest and LSScrimTest pass under darkTheme=true with correct dark surface values", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:test --tests '*.LSCardTest' --tests '*.LSScrimTest'" }
  ]
}
-->
