<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-06-android — ChatInput molecule (LSChatInput) — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-06)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/10 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSChatInput renders in the sandbox on Android with correct LSGlassPanel(.chrome) input bar, trailing icon swap (sliders → send) when text non-empty, send/collapse callbacks firing exactly once, optional horizontal LSSuggestionChip LazyRow, optional LSLocationContextBar row, isThinking spinner swap, isEnabled disabled opacity, and 5 story variants registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use LSGlassPanel(.chrome) as input bar container — height theme.sizing.component.inputHeight, radius theme.radius.xl, padding spacing.4 left / spacing.2 right.
- MUST delegate text input to LSTextField atom — not raw BasicTextField or Material3 TextField.
- MUST swap trailing slot based on value.isNotEmpty(): non-empty → LSButton(.primary, Glyph.Send); empty → LSButton(.ghost, Glyph.Sliders) wired to onFilter.
- MUST use LazyRow for horizontal suggestion chip row — not ScrollableRow with fixed children.
- MUST render LSLocationContextBar (UC-MOL-08) when locationBadge is non-null.
- MUST apply opacity.disabled to entire input bar subtree when isEnabled=false; no callbacks fire.
- MUST register stories under Molecules / ChatInput for all 5 PRD variants.
- NEVER inline raw Row { BasicTextField(…) } as input bar.
- NEVER allow onSend to fire when value empty or isEnabled=false.
- NEVER use MaterialTheme.colorScheme — only LaneShadowTheme.
- STRICTLY: trailing icon swap driven by value.isEmpty(); isThinking swaps to LSSpinner with disabled input; detekt exits 0; compileDebugKotlin BUILD SUCCESSFUL.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Default empty state shows sliders icon and glass panel (PRIMARY)
- [ ] AC-2: Non-empty value swaps trailing to send button
- [ ] AC-3: onSend fires with value, not when empty
- [ ] AC-4: onCollapse fires exactly once per tap
- [ ] AC-5: Suggestion chips appear in LazyRow above input
- [ ] AC-6: onSuggestionTap fires correct chip
- [ ] AC-7: locationBadge renders LSLocationContextBar above chips
- [ ] AC-8: isThinking shows spinner and disables input
- [ ] AC-9: isEnabled false disables all callbacks
- [ ] AC-10: 5+ stories registered for ChatInput

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Default empty state — glass panel + sliders [PRIMARY]
  GIVEN: developer composes LSChatInput(value="", onValueChange={}, placeholder="Plan a ride…", onSend={}, onCollapse={}, onFilter={})
  WHEN:  Composable enters composition with empty value
  THEN:  LSGlassPanel(.chrome) present in semantics tree (LSGlassPanelBackgroundColorKey resolved); height theme.sizing.component.inputHeight; radius theme.radius.xl; leading LSButton(.ghost) with collapse icon; trailing LSButton(.ghost) with sliders icon; LSTextField showing placeholder
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.default_empty_state_shows_sliders_icon_and_glass_panel' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt
  TEST_FUNCTION: default_empty_state_shows_sliders_icon_and_glass_panel

AC-2: Non-empty value swaps trailing to send
  GIVEN: LSChatInput with value="Twisty roads near Aptos"
  WHEN:  Composable enters composition
  THEN:  trailing slot renders LSButton(.primary, icon=Glyph.Send) with color.signal.default background; sliders icon absent
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.non_empty_value_swaps_trailing_to_send_button' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt
  TEST_FUNCTION: non_empty_value_swaps_trailing_to_send_button

AC-3: onSend fires with value, not when empty
  GIVEN: LSChatInput with value="Plan a coastal route" and onSend={text -> capturedText=text}
  WHEN:  developer taps send button via Compose UI test
  THEN:  capturedText="Plan a coastal route"; second tap with value="" does not invoke onSend
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_send_fires_with_value_not_when_empty' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSChatInputUiTest.kt
  TEST_FUNCTION: on_send_fires_with_value_not_when_empty

AC-4: onCollapse fires exactly once per tap
  GIVEN: LSChatInput rendered with onCollapse={counter++}
  WHEN:  developer taps leading collapse LSButton once
  THEN:  counter=1; second tap → 2 (not 0 or 3); no other callbacks fire
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_collapse_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSChatInputUiTest.kt
  TEST_FUNCTION: on_collapse_fires_exactly_once

AC-5: Suggestion chip LazyRow above input
  GIVEN: LSChatInput with suggestions=listOf(SuggestionChip("Twisty back roads"), SuggestionChip("Coastal Highway 1"), SuggestionChip("Gravel path"))
  WHEN:  Composable enters composition
  THEN:  LazyRow appears above input bar with spacing.2 gap; each item LSSuggestionChip; horizontally scrollable; absence → no LazyRow
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.suggestion_chips_appear_in_lazy_row_above_input' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt
  TEST_FUNCTION: suggestion_chips_appear_in_lazy_row_above_input

AC-6: onSuggestionTap fires correct chip
  GIVEN: LSChatInput with suggestions and onSuggestionTap={chip -> capturedChip=chip}
  WHEN:  developer taps first suggestion chip via Compose UI test
  THEN:  capturedChip.label equals first chip label; onSend does not fire
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_suggestion_tap_fires_correct_chip' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSChatInputUiTest.kt
  TEST_FUNCTION: on_suggestion_tap_fires_correct_chip

AC-7: locationBadge renders LSLocationContextBar
  GIVEN: LSChatInput with locationBadge=LocationContext(label="Near Santa Cruz, CA", mode=LocationMode.Manual) and suggestions provided
  WHEN:  Composable enters composition
  THEN:  LSLocationContextBar row appears above suggestion chip LazyRow with spacing.2 gap; null → row absent
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.location_badge_renders_context_bar_above_chips' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt
  TEST_FUNCTION: location_badge_renders_context_bar_above_chips

AC-8: isThinking shows spinner and disables input
  GIVEN: LSChatInput with isThinking=true
  WHEN:  Composable enters composition
  THEN:  trailing slot contains LSSpinner; LSButton send/filter absent; LSTextField in disabled state (LSInputVisualStateKey="disabled"); tapping spinner area does not invoke onSend or onFilter
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.is_thinking_true_shows_spinner_and_disables_input' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt
  TEST_FUNCTION: is_thinking_true_shows_spinner_and_disables_input

AC-9: isEnabled false disables all callbacks
  GIVEN: LSChatInput with isEnabled=false and all callbacks instrumented
  WHEN:  developer attempts to tap send, collapse, filter
  THEN:  all counters remain 0; input bar subtree alpha=theme.opacity.disabled
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.is_enabled_false_disables_all_callbacks' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSChatInputUiTest.kt
  TEST_FUNCTION: is_enabled_false_disables_all_callbacks

AC-10: 5+ stories registered
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / ChatInput
  THEN:  stories Default, With Text, Thinking, Disabled, Refining Prompt — all present
  VERIFY: grep -c 'molecules.chatinput' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSChatInputStory.kt | awk '$1 >= 5'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSChatInputStory.kt
  TEST_FUNCTION: (grep gate)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | default_empty_state_shows_sliders_icon_and_glass_panel passes | AC-1 |
| TC-2 | non_empty_value_swaps_trailing_to_send_button passes | AC-2 |
| TC-3 | on_send_fires_with_value_not_when_empty passes (connected) | AC-3 |
| TC-4 | on_collapse_fires_exactly_once passes (connected) | AC-4 |
| TC-5 | suggestion_chips_appear_in_lazy_row_above_input passes | AC-5 |
| TC-6 | on_suggestion_tap_fires_correct_chip passes (connected) | AC-6 |
| TC-7 | location_badge_renders_context_bar_above_chips passes | AC-7 |
| TC-8 | is_thinking_true_shows_spinner_and_disables_input passes | AC-8 |
| TC-9 | is_enabled_false_disables_all_callbacks passes (connected) | AC-9 |
| TC-10 | Zero Color(0xFF in LSChatInput.kt | AC-1 |
| TC-11 | 5+ story IDs in LSChatInputStory.kt | AC-10 |
| TC-12 | detekt + compileDebugKotlin succeed | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInputTypes.kt (NEW — SuggestionChip, LocationContext, LocationMode)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSChatInputTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSChatInputUiTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSChatInputStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (MODIFY)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- android/app/src/main/java/com/laneshadow/ui/molecules/LSLocationContextBar.kt — owned by UC-MOL-08-android
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/chat-input/ [REQUIRED READING]
   - Lines: all
   - Focus: Glass-panel input bar composition, icon swapping behavior, all 6 states

2. .spec/prds/v2/06-uc-mol.md [PRIMARY PATTERN]
   - Lines: 113-153
   - Focus: UC-MOL-06 full signature, composition layers, all acceptance criteria

3. android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt [PRIMARY PATTERN]
   - Lines: all
   - Focus: Glass panel surface atom; LSGlassPanelBackgroundColorKey for test inspection

4. android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt
   - Lines: all
   - Focus: Text input atom; LSInputVisualStateKey for disabled state inspection

5. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt
   - Lines: all
   - Focus: Button atom for collapse (ghost), send (primary), filter (ghost) slots

6. android/app/src/main/java/com/laneshadow/ui/atoms/LSSpinner.kt
   - Lines: all
   - Focus: Spinner atom for isThinking trailing slot

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/chat-input/

Interaction notes:
- REQUIRED READING: .spec/design/system/molecules/chat-input/ before implementing
- LazyRow for suggestion chips: contentPadding=PaddingValues(horizontal=theme.space.md), horizontalArrangement=Arrangement.spacedBy(theme.space.sm)
- When UC-MOL-08 not yet available, declare typealias stub with TODO comment; do not block

Pattern: Vertical Column composing three optional layers — LSLocationContextBar (top), LazyRow of LSSuggestionChip (middle), LSGlassPanel input bar (bottom)
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt
Anti-pattern: Do not build the input bar as raw Row { TextField(…) } — compose LSGlassPanel { Row { LSButton(collapse) · LSTextField · trailing } }

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.
RED: Write failing test (gradle :app:testDebugUnitTest --tests fails). Confirm RED.
GREEN: Implement minimal Composable to pass. Run gradle test. Confirm PASS.
REFACTOR: Extract helpers; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw TextField): grep -n 'BasicTextField\|TextField(' android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt | wc -l = 0
Gate 2 (No literal colors): grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt | wc -l = 0
Gate 3 (detekt): cd android && ./gradlew detekt exit 0
Gate 4 (compile): cd android && ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL
Gate 5 (tests): cd android && ./gradlew test BUILD SUCCESSFUL

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android, UC-MOL-05-android (LSSuggestionChip), UC-MOL-08-android (LSLocationContextBar)
Blocks:     UC-ORG-03-android, UC-ORG-05-android
Parallel:   UC-MOL-06-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Default empty — LSGlassPanel.chrome + inputHeight + radius.xl + collapse LSButton + sliders LSButton trailing + LSTextField placeholder", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.default_empty_state_shows_sliders_icon_and_glass_panel' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Non-empty value swaps trailing to LSButton(.primary, Glyph.Send) with color.signal.default background", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.non_empty_value_swaps_trailing_to_send_button' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "onSend fires with current text on send tap; does not fire when value empty", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_send_fires_with_value_not_when_empty' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "onCollapse fires exactly once per tap of leading icon", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_collapse_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Suggestion chips appear in LazyRow above input bar with spacing.2 gap; absent when null", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.suggestion_chips_appear_in_lazy_row_above_input' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "onSuggestionTap fires with correct chip label; onSend does not fire", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_suggestion_tap_fires_correct_chip' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "locationBadge non-null renders LSLocationContextBar above suggestion row; null omits row", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.location_badge_renders_context_bar_above_chips' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "isThinking=true shows LSSpinner in trailing slot; LSTextField disabled; no callbacks fire", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.is_thinking_true_shows_spinner_and_disables_input' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "isEnabled=false applies opacity.disabled to input subtree; all callback counters stay 0", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.is_enabled_false_disables_all_callbacks' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-10", "type": "acceptance_criterion", "description": "5+ story IDs registered for ChatInput in sandbox", "verify": "grep -c 'molecules.chatinput' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSChatInputStory.kt | awk '$1 >= 5'" },
    { "id": "TC-1", "type": "test_criterion", "description": "default_empty_state_shows_sliders_icon_and_glass_panel passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.default_empty_state_shows_sliders_icon_and_glass_panel' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "non_empty_value_swaps_trailing_to_send_button passes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.non_empty_value_swaps_trailing_to_send_button' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "on_send_fires_with_value_not_when_empty passes (connected)", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_send_fires_with_value_not_when_empty' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "on_collapse_fires_exactly_once passes (connected)", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_collapse_fires_exactly_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "suggestion_chips_appear_in_lazy_row_above_input passes", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.suggestion_chips_appear_in_lazy_row_above_input' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-6", "type": "test_criterion", "description": "on_suggestion_tap_fires_correct_chip passes (connected)", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.on_suggestion_tap_fires_correct_chip' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-7", "type": "test_criterion", "description": "location_badge_renders_context_bar_above_chips passes", "maps_to_ac": "AC-7", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.location_badge_renders_context_bar_above_chips' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-8", "type": "test_criterion", "description": "is_thinking_true_shows_spinner_and_disables_input passes", "maps_to_ac": "AC-8", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSChatInputTest.is_thinking_true_shows_spinner_and_disables_input' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-9", "type": "test_criterion", "description": "is_enabled_false_disables_all_callbacks passes (connected)", "maps_to_ac": "AC-9", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSChatInputUiTest.is_enabled_false_disables_all_callbacks' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-10", "type": "test_criterion", "description": "Zero Color(0xFF in LSChatInput.kt", "maps_to_ac": "AC-1", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSChatInput.kt | wc -l | grep -x '0'" },
    { "id": "TC-11", "type": "test_criterion", "description": "5+ story IDs in LSChatInputStory.kt", "maps_to_ac": "AC-10", "verify": "grep -c 'molecules.chatinput' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSChatInputStory.kt | awk '$1 >= 5'" },
    { "id": "TC-12", "type": "test_criterion", "description": "detekt + compileDebugKotlin succeed", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew detekt :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->
