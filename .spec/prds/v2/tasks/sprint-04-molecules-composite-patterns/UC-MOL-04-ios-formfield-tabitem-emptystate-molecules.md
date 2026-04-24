<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-04-ios — FormField + TabItem + EmptyState molecules — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-04)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSFormField (label + LSTextField + error stack), LSTabItem (icon+label+selection indicator), and LSEmptyState (centered icon/title/body/action button) render on iOS with token-driven spacing, state-dependent error styling, action callback firing exactly once, and all 8 stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST route LSFormField input through LSTextField atom (UC-ATM-03) — no raw TextField.
- MUST route label/error through LSText atom with TypographyVariant.
- MUST route LSEmptyState button through LSButton atom (UC-ATM-02).
- MUST route LSTabItem icon through LSIcon atom with IconContentColor.signal (selected) / .tertiary (not).
- MUST resolve all spacing through theme tokens.
- MUST register stories for all 8 variants (3 FormField + 2 TabItem + 3 EmptyState).
- NEVER use raw TextField()/TextEditor() in LSFormField.
- NEVER use raw Image() or system icon directly in LSTabItem.
- NEVER inline literal font modifiers or hex colors.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED; light/dark both render.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSFormField default render routes through LSTextField (PRIMARY)
- [ ] AC-2: LSFormField error state renders error text in content.error color
- [ ] AC-3: LSTabItem selected vs unselected token colors with indicator bar
- [ ] AC-4: LSEmptyState renders centered with icon/title/body/button atoms
- [ ] AC-5: LSEmptyState action button fires callback exactly once
- [ ] AC-6: Atom-composition gate + 8 stories registered

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSFormField default render via LSTextField atom [PRIMARY]
  GIVEN: developer instantiates LSFormField(label: "Email", value: $email, placeholder: "you@example.com", error: nil)
  WHEN:  view body resolves
  THEN:  vertical stack: label LSText(typography.ui.label.md) above; LSTextField atom for input; spacing.2 between label and input; no error text rendered
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_default_render_routes_through_lstextfield_atom 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFormFieldTests.swift
  TEST_FUNCTION: test_default_render_routes_through_lstextfield_atom

AC-2: LSFormField error state
  GIVEN: developer instantiates LSFormField with error: "Invalid email"
  WHEN:  view body resolves
  THEN:  error message via LSText(typography.ui.body.sm) in color.content.error below input; LSTextField in error state
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_error_state_renders_error_text_in_content_error_color 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFormFieldTests.swift
  TEST_FUNCTION: test_error_state_renders_error_text_in_content_error_color

AC-3: LSTabItem selected vs unselected with indicator bar
  GIVEN: developer renders LSTabItem(icon: .home, label: "Home", selected: true) and LSTabItem(..., selected: false)
  WHEN:  both view bodies resolve
  THEN:  selected: icon+label color.signal.default with selection-indicator bar in color.signal.default; unselected: color.content.tertiary; no indicator bar
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTabItemTests/test_selected_uses_signal_default_unselected_uses_tertiary 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSTabItemTests.swift
  TEST_FUNCTION: test_selected_uses_signal_default_unselected_uses_tertiary

AC-4: LSEmptyState renders centered atoms
  GIVEN: developer instantiates LSEmptyState(icon: .inbox, title: "No rides yet", body: "Record your first ride.", action: .primary("Get Started") { })
  WHEN:  view body resolves
  THEN:  centered VStack; LSIcon at sizing.icon.xl; LSText(typography.ui.title.md) title; LSText(typography.ui.body.md) body; LSButton(.primary) action
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSEmptyStateTests/test_centered_layout_with_icon_text_and_button_atoms 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSEmptyStateTests.swift
  TEST_FUNCTION: test_centered_layout_with_icon_text_and_button_atoms

AC-5: LSEmptyState action callback fires exactly once
  GIVEN: LSEmptyState rendered with action closure
  WHEN:  developer taps the action button
  THEN:  closure fires exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSEmptyStateTests/test_action_button_fires_callback_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSEmptyStateTests.swift
  TEST_FUNCTION: test_action_button_fires_callback_once

AC-6: Atom-composition gate + 8 stories registered
  GIVEN: all three molecule sources compiled, sandbox open
  WHEN:  navigating to Molecules / FormField, TabItem, EmptyState
  THEN:  no Color(hex:)/Font.system in any source; FormField stories Default/Focused/Error; TabItem Selected/Unselected; EmptyState With Illustration/Without Illustration/With Action — all 8 present, render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_all_eight_molecule_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSFormFieldTests.swift
  TEST_FUNCTION: test_all_eight_molecule_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_default_render_routes_through_lstextfield_atom passes | AC-1 |
| TC-2 | test_error_state_renders_error_text_in_content_error_color passes | AC-2 |
| TC-3 | test_selected_uses_signal_default_unselected_uses_tertiary passes | AC-3 |
| TC-4 | test_centered_layout_with_icon_text_and_button_atoms passes | AC-4 |
| TC-5 | test_action_button_fires_callback_once passes | AC-5 |
| TC-6 | No literal colors or Font.system in molecule source files | AC-6 |
| TC-7 | test_all_eight_molecule_stories_registered passes | AC-6 |
| TC-8 | swiftformat --lint exits 0 | AC-6 |
| TC-9 | xcodebuild build BUILD SUCCEEDED | AC-6 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSFormField.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSTabItem.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSEmptyState.swift (NEW)
- ios/LaneShadowTests/Molecules/LSFormFieldTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSTabItemTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSEmptyStateTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSFormFieldStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSTabItemStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSEmptyStateStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift (MODIFY)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- ios/LaneShadow/Views/Molecules/EmptyState.swift — LEGACY pre-Sprint 04; do not touch
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/form-field/ [REQUIRED READING]
2. .spec/design/system/molecules/tab-item/ [REQUIRED READING]
3. .spec/design/system/molecules/empty-state/ [REQUIRED READING]
4. .spec/prds/v2/06-uc-mol.md (lines 161-215) — UC-MOL-04 acceptance criteria
5. ios/LaneShadow/Views/Atoms/LSTextField.swift (1-80) [PRIMARY PATTERN] — input atom; InputState enum
6. ios/LaneShadow/Views/Atoms/LSIcon.swift (1-80) — for tab item + empty state
7. ios/LaneShadow/Views/Atoms/LSButton.swift (1-60) — LSButtonVariant.primary for empty state action

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/form-field/, .spec/design/system/molecules/tab-item/, .spec/design/system/molecules/empty-state/

Interaction notes:
- REQUIRED READING: all three design directories before implementing
- LSFormField: @Binding var value and optional error: String? — flip LSTextField InputState to .error when error != nil
- LSTabItem: selection indicator bar = fixed-height Rectangle at bottom, conditional via if-else
- LSEmptyState: legacy EmptyState.swift uses pre-Sprint 04 patterns; create LSEmptyState as NEW file with LS prefix

Pattern: Vertical stack with labeled atom delegation; conditional rendering on Bool flags
Pattern source: ios/LaneShadow/Views/Atoms/LSTextField.swift
Anti-pattern: Do not inline TextField() in LSFormField — entire input must route through LSTextField atom for InputState token resolution.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(hex:\|Font.system' all 3 files = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios
Blocks:     UC-ORG-01-ios, UC-ORG-03-ios
Parallel:   UC-MOL-04-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSFormField(label:value:placeholder:error:nil) WHEN resolved THEN LSText label.md + LSTextField + spacing.2; no error text", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_default_render_routes_through_lstextfield_atom 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSFormField with error WHEN resolved THEN LSText body.sm in color.content.error below input; LSTextField in error state", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_error_state_renders_error_text_in_content_error_color 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSTabItem selected vs unselected WHEN resolved THEN signal.default vs tertiary color; indicator bar present only when selected", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTabItemTests/test_selected_uses_signal_default_unselected_uses_tertiary 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSEmptyState(icon:title:body:action:) WHEN resolved THEN centered VStack; LSIcon sizing.icon.xl; LSText title.md + body.md; LSButton(.primary)", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSEmptyStateTests/test_centered_layout_with_icon_text_and_button_atoms 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSEmptyState with action closure WHEN button tapped THEN fires once", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSEmptyStateTests/test_action_button_fires_callback_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN compiled sources and sandbox WHEN inspected and navigated THEN no Color(hex:)/Font.system; all 8 stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_all_eight_molecule_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_default_render_routes_through_lstextfield_atom passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_default_render_routes_through_lstextfield_atom 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_error_state_renders_error_text_in_content_error_color passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_error_state_renders_error_text_in_content_error_color 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_selected_uses_signal_default_unselected_uses_tertiary passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTabItemTests/test_selected_uses_signal_default_unselected_uses_tertiary 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_centered_layout_with_icon_text_and_button_atoms passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSEmptyStateTests/test_centered_layout_with_icon_text_and_button_atoms 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_action_button_fires_callback_once passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSEmptyStateTests/test_action_button_fires_callback_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "No literal colors or Font.system in source", "maps_to_ac": "AC-6", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSFormField.swift ios/LaneShadow/Views/Molecules/LSTabItem.swift ios/LaneShadow/Views/Molecules/LSEmptyState.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "description": "test_all_eight_molecule_stories_registered passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSFormFieldTests/test_all_eight_molecule_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-8", "type": "test_criterion", "description": "swiftformat --lint exits 0", "maps_to_ac": "AC-6", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSFormField.swift ios/LaneShadow/Views/Molecules/LSTabItem.swift ios/LaneShadow/Views/Molecules/LSEmptyState.swift" },
    { "id": "TC-9", "type": "test_criterion", "description": "xcodebuild build BUILD SUCCEEDED", "maps_to_ac": "AC-6", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
