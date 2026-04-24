<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-06-ios — ChatInput molecule (LSChatInput) — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-06)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/10 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSChatInput renders as a layered bottom-anchored bar: LSGlassPanel(.chrome) input bar with LSButton collapse/send/filter + LSTextField, optional scrollable LSSuggestionChip row, optional LSLocationContextBar. isThinking swaps trailing slot to LSSpinner. isEnabled applies opacity.disabled. All 10 ACs verified, 6 stories registered, swiftformat clean, xcodebuild test exits TEST SUCCEEDED.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose the input bar container from LSGlassPanel(.chrome) atom — no raw RoundedRectangle with .ultraThinMaterial.
- MUST route text input through LSTextField atom — no raw SwiftUI TextField.
- MUST route collapse, send, and filter actions through LSButton atoms (.ghost and .primary variants).
- MUST route isThinking trailing slot through LSSpinner atom — no ProgressView directly.
- MUST route suggestion chips through LSSuggestionChip molecule (UC-MOL-05) — no raw Button() chips.
- MUST route location context bar through LSLocationContextBar molecule (UC-MOL-08) when locationBadge is provided.
- MUST resolve input bar height from sizing.component.inputHeight; padding from spacing.4 leading / spacing.2 trailing; corner radius from radius.xl.
- MUST register stories in ios/LaneShadow/Sandbox/Stories/Molecules/ for all 6 documented variants.
- NEVER inline raw TextField() or HStack with literal colors for the input bar.
- NEVER hardcode the input bar height — route through sizing.component.inputHeight.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED for all LSChatInputTests; light and dark theme render correctly.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Empty state renders LSGlassPanel + sliders trailing icon (PRIMARY)
- [ ] AC-2: Non-empty value swaps trailing to LSButton(.primary, .send)
- [ ] AC-3: onSend fires with text and clears input
- [ ] AC-4: onCollapse fires exactly once per tap
- [ ] AC-5: Suggestion chip row renders and onSuggestionTap fires
- [ ] AC-6: locationBadge renders LSLocationContextBar above suggestions
- [ ] AC-7: isThinking swaps trailing slot to LSSpinner and disables input
- [ ] AC-8: isEnabled false applies opacity.disabled and blocks callbacks
- [ ] AC-9: Atom-composition inspection gate (no raw TextField/ProgressView/Color(hex:))
- [ ] AC-10: Six sandbox stories registered for all variants

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Empty state — LSGlassPanel + sliders trailing [PRIMARY]
  GIVEN: developer instantiates LSChatInput(value: $text, placeholder: "Plan a ride…", onSend: { _ in }, onCollapse: { }, onFilter: { }) with text == ""
  WHEN:  view body resolves
  THEN:  single LSGlassPanel(.chrome) bar at sizing.component.inputHeight + radius.xl; leading LSButton(.ghost, icon: .collapse); LSTextField in center; trailing LSButton(.ghost, icon: .sliders); no suggestion row; no location bar
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_empty_state_renders_glasspanel_with_sliders_trailing 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_empty_state_renders_glasspanel_with_sliders_trailing

AC-2: Trailing swaps to primary send button when value non-empty
  GIVEN: LSChatInput rendered with value bound to non-empty string
  WHEN:  value changes from empty to non-empty
  THEN:  trailing sliders button replaced by LSButton(.primary, icon: .send) with color.signal.default background; transition is animated
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_nonempty_value_swaps_trailing_to_primary_send 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_nonempty_value_swaps_trailing_to_primary_send

AC-3: onSend fires with current text and input clears
  GIVEN: LSChatInput with non-empty value and onSend closure
  WHEN:  developer taps the send button
  THEN:  onSend called with current text exactly once; value binding set to empty string after send; trailing slot reverts to sliders icon
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_send_fires_with_text_and_clears_input 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_send_fires_with_text_and_clears_input

AC-4: onCollapse fires exactly once per tap
  GIVEN: LSChatInput rendered with onCollapse closure
  WHEN:  developer taps the leading collapse icon
  THEN:  onCollapse fires exactly once; no other callbacks fire
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_collapse_fires_oncollapse_exactly_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_collapse_fires_oncollapse_exactly_once

AC-5: Suggestion chip row renders and onSuggestionTap fires
  GIVEN: developer passes suggestions: [SuggestionChip(label: "Twisty back roads"), SuggestionChip(label: "Coastal route")] to LSChatInput
  WHEN:  view renders and developer taps the first chip
  THEN:  horizontal scrollable row of LSSuggestionChip molecules appears above input bar with spacing.2 gap; tapping fires onSuggestionTap(chip) exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_suggestion_chips_render_and_ontap_fires 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_suggestion_chips_render_and_ontap_fires

AC-6: locationBadge renders LSLocationContextBar
  GIVEN: developer passes locationBadge: LocationContext(label: "Near Santa Cruz, CA", mode: .manual)
  WHEN:  view renders
  THEN:  LSLocationContextBar molecule renders above the suggestion chip row (or directly above input bar if no suggestions) with spacing.2 gap; uses two LSTagPill atoms internally per UC-MOL-08
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_location_badge_renders_locationcontextbar_above_chips 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_location_badge_renders_locationcontextbar_above_chips

AC-7: isThinking swaps to spinner and disables input
  GIVEN: developer passes isThinking: true
  WHEN:  view renders
  THEN:  trailing slot shows LSSpinner instead of send/sliders button; LSTextField disabled; no send callback fires
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_isthinking_swaps_to_spinner_and_disables_input 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_isthinking_swaps_to_spinner_and_disables_input

AC-8: isEnabled false applies opacity and blocks callbacks
  GIVEN: developer passes isEnabled: false
  WHEN:  view renders and developer taps any button
  THEN:  entire input bar renders at opacity.disabled (from LaneShadowTheme); tapping collapse, send, filter, or any chip fires no callbacks
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_disabled_state_applies_opacity_and_blocks_callbacks 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_disabled_state_applies_opacity_and_blocks_callbacks

AC-9: Atom-composition inspection gate
  GIVEN: LSChatInput.swift compiled
  WHEN:  source inspected
  THEN:  no raw TextField(), ProgressView(), ActivityIndicator, Color(hex:), Font.system, or RoundedRectangle with literal fill colors
  VERIFY: grep -n 'TextField(\|ProgressView()\|Color(red:\|Color(hex:\|Font.system' ios/LaneShadow/Views/Molecules/LSChatInput.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-10: Sandbox stories registered for all 6 variants
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / ChatInput
  THEN:  stories Default (empty), With Text (send shown), With Suggestions + Location, Thinking (spinner), Disabled, Refining Prompt (long placeholder) — all present and render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_six_chatinput_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSChatInputTests.swift
  TEST_FUNCTION: test_six_chatinput_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA (boolean statements mapping to ACs)
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_empty_state_renders_glasspanel_with_sliders_trailing passes | AC-1 |
| TC-2 | test_nonempty_value_swaps_trailing_to_primary_send passes | AC-2 |
| TC-3 | test_send_fires_with_text_and_clears_input passes | AC-3 |
| TC-4 | test_collapse_fires_oncollapse_exactly_once passes | AC-4 |
| TC-5 | test_suggestion_chips_render_and_ontap_fires passes | AC-5 |
| TC-6 | test_location_badge_renders_locationcontextbar_above_chips passes | AC-6 |
| TC-7 | test_isthinking_swaps_to_spinner_and_disables_input passes | AC-7 |
| TC-8 | test_disabled_state_applies_opacity_and_blocks_callbacks passes | AC-8 |
| TC-9 | No raw TextField/ProgressView/Color(hex:)/Font.system in LSChatInput.swift | AC-9 |
| TC-10 | test_six_chatinput_stories_registered passes | AC-10 |
| TC-11 | swiftformat --lint exits 0 for LSChatInput.swift | AC-9 |
| TC-12 | xcodebuild build exits BUILD SUCCEEDED | AC-10 |

--------------------------------------------------------------------------------
SCOPE (file-level write permissions)
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSChatInput.swift (NEW)
- ios/LaneShadowTests/Molecules/LSChatInputTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSChatInputStory.swift (NEW)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift — owned by UC-MOL-08; only consume it
- ios/LaneShadow/Views/Molecules/LSSuggestionChip.swift — owned by UC-MOL-05; only consume it
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST (max 6 — canonical pattern first)
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/chat-input/ [REQUIRED READING]
   - Lines: all
   - Focus: All 6 states (empty, with text, thinking, disabled, with chips, with location), glass-panel composition, icon swap behavior

2. .spec/prds/v2/06-uc-mol.md [PRIMARY PATTERN]
   - Lines: 113-153
   - Focus: UC-MOL-06 full signature, layering spec (bottom→top), isThinking/isEnabled behavior, onCollapse semantic

3. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift [PRIMARY PATTERN]
   - Lines: all
   - Focus: GlassVariant.chrome; cornerRadius/elevation token helpers — input bar container atom

4. ios/LaneShadow/Views/Atoms/LSTextField.swift
   - Lines: all
   - Focus: TextField atom; InputState.disabled for isThinking/isEnabled wiring

5. ios/LaneShadow/Views/Atoms/LSButton.swift
   - Lines: 1-80
   - Focus: LSButtonVariant.ghost and .primary; leadingIcon for collapse/send/sliders

6. ios/LaneShadow/Views/Atoms/LSSpinner.swift
   - Lines: all
   - Focus: Spinner atom for isThinking trailing slot

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/chat-input/

Interaction notes:
- REQUIRED READING: .spec/design/system/molecules/chat-input/ before implementing — pay close attention to the state machine showing empty/with-text/thinking transitions
- Layer order (bottom to top, VStack): input bar → suggestion chip row (optional, spacing.2 above bar) → location context bar (optional, spacing.2 above chips)
- Trailing slot: use @ViewBuilder func trailingSlot() -> some View with switch on (isThinking, value.isEmpty)

Pattern: LSGlassPanel(.chrome) container with HStack of named slot atoms; layered VStack with optional rows above; @ViewBuilder trailing slot switch
Pattern source: ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
Anti-pattern: Do not mirror old SuggestionChips.swift (raw Button + literal Capsule) — use LSSuggestionChip molecule from UC-MOL-05.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.
RED: Write test function (xcodebuild test ... -only-testing fails initially). Confirm RED.
GREEN: Implement minimal SwiftUI body to pass the test. Run xcodebuild test. Confirm PASS.
REFACTOR: Extract helpers (TrailingSlotBuilder, ChatInputState); tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw TextField in molecule): grep -n 'TextField(' ios/LaneShadow/Views/Molecules/LSChatInput.swift | wc -l = 0
Gate 2 (No literal colors): grep -n 'Color(red:\|Color(hex:\|Font.system' ios/LaneShadow/Views/Molecules/LSChatInput.swift | wc -l = 0
Gate 3 (swiftformat): swiftformat --lint ios/LaneShadow/Views/Molecules/LSChatInput.swift exit 0
Gate 4 (iOS build): cd ios && xcodebuild build -scheme LaneShadow BUILD SUCCEEDED
Gate 5 (All tests): cd ios && xcodebuild test -scheme LaneShadow TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios (atoms migrated to Copper theme), UC-MOL-05-ios (LSSuggestionChip), UC-MOL-08-ios (LSLocationContextBar)
Blocks:     UC-ORG-03-ios (LSNavigatorMessage), UC-ORG-05-ios (LSSessionsDrawer)
Parallel:   UC-MOL-06-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSChatInput empty value WHEN rendered THEN LSGlassPanel(.chrome) at inputHeight/radius.xl; LSButton(.ghost,.collapse) leading; LSTextField center; LSButton(.ghost,.sliders) trailing", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_empty_state_renders_glasspanel_with_sliders_trailing 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN non-empty value WHEN trailing resolved THEN LSButton(.primary, .send) with color.signal.default", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_nonempty_value_swaps_trailing_to_primary_send 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN send tapped WHEN value non-empty THEN onSend(text) fires once; value clears; trailing reverts to sliders", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_send_fires_with_text_and_clears_input 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN collapse tapped WHEN rendered THEN onCollapse fires once", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_collapse_fires_oncollapse_exactly_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN suggestions array passed WHEN chip tapped THEN scrollable LSSuggestionChip row above bar; onSuggestionTap(chip) fires once", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_suggestion_chips_render_and_ontap_fires 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN locationBadge provided WHEN rendered THEN LSLocationContextBar above suggestion row with spacing.2 gap", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_location_badge_renders_locationcontextbar_above_chips 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN isThinking:true WHEN rendered THEN LSSpinner in trailing slot; LSTextField disabled", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_isthinking_swaps_to_spinner_and_disables_input 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN isEnabled:false WHEN any button tapped THEN opacity.disabled applied; no callbacks fire", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_disabled_state_applies_opacity_and_blocks_callbacks 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-9", "type": "acceptance_criterion", "description": "GIVEN compiled source WHEN inspected THEN no raw TextField/ProgressView/Color(hex:)/Font.system", "verify": "grep -n 'TextField(\\|ProgressView()\\|Color(red:\\|Color(hex:\\|Font.system' ios/LaneShadow/Views/Molecules/LSChatInput.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-10", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating to Molecules/ChatInput THEN 6 stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_six_chatinput_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_empty_state_renders_glasspanel_with_sliders_trailing passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_empty_state_renders_glasspanel_with_sliders_trailing 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_nonempty_value_swaps_trailing_to_primary_send passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_nonempty_value_swaps_trailing_to_primary_send 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_send_fires_with_text_and_clears_input passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_send_fires_with_text_and_clears_input 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_collapse_fires_oncollapse_exactly_once passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_collapse_fires_oncollapse_exactly_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_suggestion_chips_render_and_ontap_fires passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_suggestion_chips_render_and_ontap_fires 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "test_location_badge_renders_locationcontextbar_above_chips passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_location_badge_renders_locationcontextbar_above_chips 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "test_isthinking_swaps_to_spinner_and_disables_input passes", "maps_to_ac": "AC-7", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_isthinking_swaps_to_spinner_and_disables_input 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-8", "type": "test_criterion", "description": "test_disabled_state_applies_opacity_and_blocks_callbacks passes", "maps_to_ac": "AC-8", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_disabled_state_applies_opacity_and_blocks_callbacks 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-9", "type": "test_criterion", "description": "No raw TextField/ProgressView/Color(hex:)/Font.system in source", "maps_to_ac": "AC-9", "verify": "grep -n 'TextField(\\|ProgressView()\\|Color(red:\\|Color(hex:\\|Font.system' ios/LaneShadow/Views/Molecules/LSChatInput.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-10", "type": "test_criterion", "description": "test_six_chatinput_stories_registered passes", "maps_to_ac": "AC-10", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSChatInputTests/test_six_chatinput_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-11", "type": "test_criterion", "description": "swiftformat --lint exits 0", "maps_to_ac": "AC-9", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSChatInput.swift" },
    { "id": "TC-12", "type": "test_criterion", "description": "xcodebuild build exits BUILD SUCCEEDED", "maps_to_ac": "AC-10", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
