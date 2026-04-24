<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-01-ios — Card + ListRow molecules — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-01)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSContentCard and LSListRow render in the iOS sandbox with token-driven layout, atom composition only (LSCard, LSText, LSAvatar, LSIcon, LSDivider), all 4 ContentCard + 6 ListRow stories registered, and LSListRow onTap fires exactly once.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose only from atoms — LSContentCard wraps LSCard; LSListRow uses LSText, LSAvatar, LSIcon, LSDivider.
- MUST resolve all colors through LaneShadowTheme.* — no literal hex or UIColor.
- MUST resolve typography through LSText with TypographyVariant — no Font.system(...).
- MUST resolve spacing/radius/elevation through theme tokens — no literal CGFloat.
- MUST register stories in ios/LaneShadow/Sandbox/Stories/Molecules/ for all 4 ContentCard + 6 ListRow variants.
- MUST maintain min touch target sizing.touchTarget (44pt) for interactive LSListRow.
- NEVER inline raw Text() with .font(.system) or .foregroundStyle(Color(hex:)).
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED; light/dark both render.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSContentCard default render uses surface card tokens (PRIMARY)
- [ ] AC-2: LSContentCard action footer slot renders below metadata
- [ ] AC-3: LSListRow layout tokens and minimum touch target
- [ ] AC-4: LSListRow onTap fires once; no highlight without handler
- [ ] AC-5: Atom-composition gate (no Color(hex:)/Font.system)
- [ ] AC-6: All 10 stories registered (4 ContentCard + 6 ListRow)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSContentCard default render with surface tokens [PRIMARY]
  GIVEN: developer instantiates LSContentCard(title: "Route X", subtitle: "42 mi · 1h 12m")
  WHEN:  view body resolves on iOS
  THEN:  card surface = color.surface.card; corner radius = radius.lg; shadow = elevation.2; title in typography.ui.title.md via LSText; subtitle in typography.ui.body.md via LSText; layout spacing from spacing.* tokens
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_default_render_uses_surface_card_tokens 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSContentCardTests.swift
  TEST_FUNCTION: test_default_render_uses_surface_card_tokens

AC-2: LSContentCard action footer slot
  GIVEN: developer instantiates LSContentCard with trailing actions ViewBuilder containing two LSButton atoms
  WHEN:  view body resolves
  THEN:  action footer renders below metadata row with spacing.2 vertical gap; LSButton atoms used unmodified
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_action_footer_slot_renders_below_metadata 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSContentCardTests.swift
  TEST_FUNCTION: test_action_footer_slot_renders_below_metadata

AC-3: LSListRow layout tokens and minimum touch target
  GIVEN: developer instantiates LSListRow(leading: .avatar(...), title: "Name", subtitle: "Detail", trailing: .chevron)
  WHEN:  view body resolves
  THEN:  row min height = sizing.touchTarget (44pt); leading-to-title gap = spacing.3; vertical padding = spacing.2; chevron is LSIcon atom
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSListRowTests/test_layout_tokens_and_minimum_touch_target 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSListRowTests.swift
  TEST_FUNCTION: test_layout_tokens_and_minimum_touch_target

AC-4: LSListRow onTap fires once; no tap highlight without handler
  GIVEN: interactive LSListRow with onTap handler and non-interactive LSListRow without onTap
  WHEN:  developer taps each row
  THEN:  onTap fires exactly once on interactive row; non-interactive row shows no pressed highlight
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSListRowTests/test_ontap_fires_once_and_no_highlight_without_handler 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSListRowTests.swift
  TEST_FUNCTION: test_ontap_fires_once_and_no_highlight_without_handler

AC-5: Atom-composition inspection gate
  GIVEN: LSContentCard.swift and LSListRow.swift compiled
  WHEN:  source inspected for primitive inlining
  THEN:  no Color(hex:), Color(red:), Font.system, or .foregroundColor deprecated API in either file
  VERIFY: grep -n 'Color(red:\|Color(hex:\|Font.system\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-6: Sandbox stories registered for both molecules
  GIVEN: developer opens sandbox app on iOS
  WHEN:  navigating to Molecules / ContentCard and Molecules / ListRow
  THEN:  ContentCard stories With Image Header, Title Only, Title+Subtitle+Chips, With Actions present; ListRow stories Leading Icon, Leading Avatar, With Subtitle, With Toggle, With Chevron, With Trailing Button present; all 10 render under both light and dark themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_all_ten_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSContentCardTests.swift
  TEST_FUNCTION: test_all_ten_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_default_render_uses_surface_card_tokens passes | AC-1 |
| TC-2 | test_action_footer_slot_renders_below_metadata passes | AC-2 |
| TC-3 | test_layout_tokens_and_minimum_touch_target passes | AC-3 |
| TC-4 | test_ontap_fires_once_and_no_highlight_without_handler passes | AC-4 |
| TC-5 | No literal colors or Font.system in molecule source files | AC-5 |
| TC-6 | test_all_ten_stories_registered passes | AC-6 |
| TC-7 | swiftformat --lint exits 0 for new molecule files | AC-5 |
| TC-8 | xcodebuild build exits BUILD SUCCEEDED | AC-6 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSContentCard.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSListRow.swift (NEW)
- ios/LaneShadowTests/Molecules/LSContentCardTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSListRowTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSContentCardStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSListRowStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift (MODIFY — append story entries)
- ios/project.yml (MODIFY — add Molecules file groups if not present; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only via scripts/ios/generate-project.sh
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/content-card/ [REQUIRED READING]
   - Lines: all
   - Focus: Visual design source for LSContentCard variants (image header, title-only, title+subtitle+chips, with actions)

2. .spec/design/system/molecules/list-row/ [REQUIRED READING]
   - Lines: all
   - Focus: Visual design source for LSListRow variants (leading icon, avatar, subtitle, toggle, chevron, trailing button)

3. .spec/prds/v2/06-uc-mol.md
   - Lines: 1-60
   - Focus: UC-MOL-01 acceptance criteria, design reference callouts

4. ios/LaneShadow/Views/Atoms/LSCard.swift [PRIMARY PATTERN]
   - Lines: all
   - Focus: Surface atom LSContentCard wraps; surfaceFill/cornerRadius/elevation token helpers

5. ios/LaneShadow/Views/Atoms/LSText.swift
   - Lines: all
   - Focus: Typography atom for title/subtitle; TypographyVariant pattern

6. ios/LaneShadow/Views/Atoms/LSAvatar.swift, LSIcon.swift, LSDivider.swift
   - Lines: all
   - Focus: Leading avatar/icon, trailing chevron, row separators

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/content-card/, .spec/design/system/molecules/list-row/

Interaction notes:
- REQUIRED READING: both design directories before implementing
- Min touch target for interactive LSListRow: sizing.touchTarget (44pt) — apply via .frame(minHeight:)
- Rows without onTap must NOT show pressed-state highlight — conditionally apply .buttonStyle/.contentShape only when handler present
- LSContentCard optional header slot accepts ViewBuilder consistent with LSCard pattern

Pattern: Wrapping LSCard with structured named slots (header, title, subtitle, metadata, actions); LSListRow uses HStack of atoms with token-driven spacing
Pattern source: ios/LaneShadow/Views/Atoms/LSCard.swift
Anti-pattern: Do not inline RoundedRectangle().fill(Color.white) — route through LSCard so surface token wins.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC. RED: failing xcodebuild test. GREEN: minimal SwiftUI body. REFACTOR: extract slot helpers; tests stay green.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep -n 'Color(red:\|Color(hex:\|Font.system' files = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios
Blocks:     UC-ORG-04-ios, UC-ORG-06-ios
Parallel:   UC-MOL-01-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSContentCard(title:subtitle:) WHEN view resolves THEN color.surface.card + radius.lg + elevation.2 + spacing tokens; title LSText typography.ui.title.md; subtitle LSText typography.ui.body.md", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_default_render_uses_surface_card_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSContentCard with actions closure WHEN view resolves THEN action footer renders below metadata row; LSButton atoms used unmodified", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_action_footer_slot_renders_below_metadata 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSListRow(leading:.avatar, title:, subtitle:, trailing:.chevron) WHEN view resolves THEN min height 44pt; leading gap spacing.3; vertical padding spacing.2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSListRowTests/test_layout_tokens_and_minimum_touch_target 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN interactive and non-interactive LSListRow WHEN tapped THEN onTap fires once; no pressed highlight without handler", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSListRowTests/test_ontap_fires_once_and_no_highlight_without_handler 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN compiled molecule source WHEN inspected THEN no raw Color(hex:)/Font.system literals; composition through atoms only", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN sandbox app WHEN navigating to Molecules/ContentCard and Molecules/ListRow THEN all 10 stories present and render under light and dark themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_all_ten_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_default_render_uses_surface_card_tokens passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_default_render_uses_surface_card_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_action_footer_slot_renders_below_metadata passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_action_footer_slot_renders_below_metadata 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_layout_tokens_and_minimum_touch_target passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSListRowTests/test_layout_tokens_and_minimum_touch_target 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_ontap_fires_once_and_no_highlight_without_handler passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSListRowTests/test_ontap_fires_once_and_no_highlight_without_handler 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "No literal colors or Font.system in molecule source", "maps_to_ac": "AC-5", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-6", "type": "test_criterion", "description": "test_all_ten_stories_registered passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_all_ten_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "swiftformat --lint exits 0 for new molecule files", "maps_to_ac": "AC-5", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift" },
    { "id": "TC-8", "type": "test_criterion", "description": "xcodebuild build exits BUILD SUCCEEDED", "maps_to_ac": "AC-6", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
