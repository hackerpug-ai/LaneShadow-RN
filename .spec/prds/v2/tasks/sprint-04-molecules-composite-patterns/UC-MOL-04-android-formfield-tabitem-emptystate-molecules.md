<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-04-android — FormField + TabItem + EmptyState molecules — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-04)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSFormField (label + LSTextField + helper/error stack), LSTabItem (icon + label + selected indicator), LSEmptyState (centered icon/title/body/action button) render in the Android sandbox with token-driven spacing, state-dependent error styling, and LSButton action callbacks firing exactly once.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST delegate text input to LSTextField atom (UC-ATM-03).
- MUST show label via LSText(typography.ui.label.md) and error via LSText(typography.ui.body.sm, color.content.error) when error != null.
- MUST use LSButton(.primary or .ghost) for EmptyState action.
- MUST resolve LSTabItem selected/unselected colors through LaneShadowTheme — color.signal.default selected; color.content.tertiary unselected; indicator bar in color.signal.default.
- MUST use @Stable sealed interfaces / @Immutable data classes for slot props.
- MUST register stories per molecule.
- NEVER inline raw TextField() from Material3 in LSFormField.
- NEVER hardcode color for selected indicator bar.
- NEVER use literal spacing in vertical stacks — only theme tokens.
- NEVER inline raw Icon() for EmptyState illustration.
- STRICTLY: error text only when error param non-null; LSTabItem indicator bar absent when selected=false; detekt 0; compileDebugKotlin BUILD SUCCESSFUL.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSFormField default state — label + input, no error text (PRIMARY)
- [ ] AC-2: LSFormField error state — error text in error color
- [ ] AC-3: LSTabItem selected/unselected resolve correct token colors with indicator
- [ ] AC-4: LSEmptyState centered layout with atoms
- [ ] AC-5: LSEmptyState action button fires callback exactly once
- [ ] AC-6: 8+ stories registered + atom-composition gate

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSFormField default state — label + input, no error [PRIMARY]
  GIVEN: developer composes LSFormField(label="Email", value=emailState, placeholder="you@example.com", error=null)
  WHEN:  Composable enters composition
  THEN:  label LSText(typography.ui.label.md) above LSTextField atom; helper/error absent when error null; gap = theme.space.sm (spacing.2)
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFormFieldTest.default_state_renders_label_and_input_with_no_error' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSFormFieldTest.kt
  TEST_FUNCTION: default_state_renders_label_and_input_with_no_error

AC-2: LSFormField error state
  GIVEN: developer composes LSFormField with error="Invalid email"
  WHEN:  Composable enters composition with non-null error
  THEN:  error text below LSTextField via LSText(typography.ui.body.sm, color.content.error); LSTextField in error visual state (LSInputVisualStateKey reflects error); spacing.sm
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFormFieldTest.error_state_shows_error_text_in_error_color' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSFormFieldTest.kt
  TEST_FUNCTION: error_state_shows_error_text_in_error_color

AC-3: LSTabItem selected/unselected with indicator
  GIVEN: LSTabItem(icon=Glyph.Home, label="Home", selected=true) and LSTabItem(icon=Glyph.Map, label="Explore", selected=false)
  WHEN:  both Composables enter composition
  THEN:  selected: icon+label color.signal.default; bottom indicator bar in color.signal.default at theme indicator height; unselected: color.content.tertiary; no indicator bar
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSTabItemTest.selected_and_unselected_states_resolve_token_colors' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSTabItemTest.kt
  TEST_FUNCTION: selected_and_unselected_states_resolve_token_colors

AC-4: LSEmptyState centered layout
  GIVEN: developer composes LSEmptyState(icon=Glyph.Inbox, title="No rides yet", body="Record your first ride.", action=EmptyStateAction.Primary("Get Started"){})
  WHEN:  Composable enters composition
  THEN:  vertically centered Column with horizontalAlignment=CenterHorizontally; LSIcon at sizing.icon.xl; LSText(typography.ui.title.md); LSText(typography.ui.body.md); LSButton(.primary)
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSEmptyStateTest.default_render_uses_centered_atom_composition' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSEmptyStateTest.kt
  TEST_FUNCTION: default_render_uses_centered_atom_composition

AC-5: LSEmptyState action button fires callback exactly once
  GIVEN: LSEmptyState rendered with action lambda {counter++}
  WHEN:  developer taps action button via Compose UI test performClick()
  THEN:  counter equals 1; action lambda fires once; no double-fire
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSEmptyStateUiTest.action_button_fires_callback_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSEmptyStateUiTest.kt
  TEST_FUNCTION: action_button_fires_callback_once

AC-6: Stories + atom-composition gate
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / FormField, TabItem, EmptyState
  THEN:  FormField stories Default/Focused/Error; TabItem Selected/Unselected; EmptyState With Illustration/Without Illustration/With Action (8+ total); zero Color(0xFF in any of 3 files
  VERIFY: grep -c 'molecules.formfield\|molecules.tabitem\|molecules.emptystate' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSFormFieldStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSTabItemStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSEmptyStateStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 8'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSFormFieldTest.default_state_renders_label_and_input_with_no_error passes | AC-1 |
| TC-2 | LSFormFieldTest.error_state_shows_error_text_in_error_color passes | AC-2 |
| TC-3 | LSTabItemTest.selected_and_unselected_states_resolve_token_colors passes | AC-3 |
| TC-4 | LSEmptyStateTest.default_render_uses_centered_atom_composition passes | AC-4 |
| TC-5 | LSEmptyStateUiTest.action_button_fires_callback_once passes (connected) | AC-5 |
| TC-6 | Zero Color(0xFF across all 3 molecule files | AC-6 |
| TC-7 | 8+ story IDs across the three story files | AC-6 |
| TC-8 | detekt + compileDebugKotlin succeed | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSTabItem.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSEmptyState.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSFormFieldTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSTabItemTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSEmptyStateTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSEmptyStateUiTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSFormFieldStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSTabItemStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSEmptyStateStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (MODIFY)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/form-field/ [REQUIRED READING]
2. .spec/design/system/molecules/tab-item/ [REQUIRED READING]
3. .spec/design/system/molecules/empty-state/ [REQUIRED READING]
4. .spec/prds/v2/06-uc-mol.md (lines 75-89) — UC-MOL-04 acceptance criteria
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt — input atom; LSInputVisualStateKey
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt — action button atom
7. android/app/src/main/java/com/laneshadow/ui/atoms/LSIcon.kt — empty state illustration / tab icon

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/form-field/, .spec/design/system/molecules/tab-item/, .spec/design/system/molecules/empty-state/

Interaction notes:
- REQUIRED READING: all 3 design directories before implementing
- LSFormField vertical stack uses spacing.2 (theme.space.sm) between label/input/helper — NOT 8.dp
- LSTabItem indicator: bottom-anchored Box of height from theme token; Modifier.fillMaxWidth; absent when selected=false
- LSEmptyState illustration slot is optional @Composable () -> Unit content lambda

Pattern: Vertical Column wrapping LSTextField with LSText label/error; LSTabItem = Column of Row(LSIcon+LSText) + bottom indicator Box; LSEmptyState = centered Column of LSIcon+LSText+LSText+LSButton
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSTextField.kt
Anti-pattern: Do not use Material3 TextField inside LSFormField; do not color tab indicator with literal val selectedColor = Color(0xFFEE7C2B).

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(0xFF' all 3 files = 0
Gate 2 (detekt): cd android && ./gradlew detekt exit 0
Gate 3 (compile): cd android && ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL
Gate 4 (tests): cd android && ./gradlew test BUILD SUCCESSFUL

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android
Blocks:     UC-ORG-02-android
Parallel:   UC-MOL-04-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSFormField default — LSText label + LSTextField atom + no error text when null; spacing.2 gap", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFormFieldTest.default_state_renders_label_and_input_with_no_error' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "LSFormField error — error text appears below input in typography.ui.body.sm + color.content.error when error != null; LSTextField in error visual state", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFormFieldTest.error_state_shows_error_text_in_error_color' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "LSTabItem selected=true uses color.signal.default for icon/label and shows indicator bar; selected=false uses color.content.tertiary; no indicator bar", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSTabItemTest.selected_and_unselected_states_resolve_token_colors' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "LSEmptyState composes centered Column with LSIcon xl + LSText title.md + LSText body.md + LSButton primary", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSEmptyStateTest.default_render_uses_centered_atom_composition' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "LSEmptyState action button fires callback exactly once on tap", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSEmptyStateUiTest.action_button_fires_callback_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "8+ stories for FormField (3), TabItem (2), EmptyState (3) in sandbox; zero Color(0xFF in any molecule file", "verify": "grep -c 'molecules.formfield\\|molecules.tabitem\\|molecules.emptystate' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSFormFieldStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSTabItemStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSEmptyStateStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 8'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSFormFieldTest.default_state_renders_label_and_input_with_no_error passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFormFieldTest.default_state_renders_label_and_input_with_no_error' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "LSFormFieldTest.error_state_shows_error_text_in_error_color passes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSFormFieldTest.error_state_shows_error_text_in_error_color' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "LSTabItemTest.selected_and_unselected_states_resolve_token_colors passes", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSTabItemTest.selected_and_unselected_states_resolve_token_colors' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSEmptyStateTest.default_render_uses_centered_atom_composition passes", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSEmptyStateTest.default_render_uses_centered_atom_composition' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "LSEmptyStateUiTest.action_button_fires_callback_once passes", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSEmptyStateUiTest.action_button_fires_callback_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-6", "type": "test_criterion", "description": "Zero Color(0xFF in all 3 molecule files", "maps_to_ac": "AC-6", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSFormField.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSTabItem.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSEmptyState.kt | wc -l | grep -x '0'" },
    { "id": "TC-7", "type": "test_criterion", "description": "8+ story IDs in story files", "maps_to_ac": "AC-6", "verify": "grep -c 'molecules.formfield\\|molecules.tabitem\\|molecules.emptystate' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSFormFieldStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSTabItemStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSEmptyStateStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 8'" },
    { "id": "TC-8", "type": "test_criterion", "description": "detekt + compileDebugKotlin succeed", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew detekt :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->
