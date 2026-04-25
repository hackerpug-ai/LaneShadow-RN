<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-05-ios — LSSessionsDrawer organism — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-05)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/7 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSSessionsDrawer renders a 312pt wide, full-height LSGlassPanel(.chrome) container with a 1px trailing border (color.border.default) and elevation.overlay. Sticky header contains 'Rides' title (typography.ui.title.lg) + trailing LSButton(.outline, icon: .plus, label: 'NEW'). Section label uses LSSectionHeader. Scrollable session rows render a 3px leading active stripe (color.signal.default when active), 5%-alpha tinted background when active, title (ui.label.lg), when label (instrument.sm, color.content.textMuted), preview (ui.body.sm, color.content.textMuted), meta footer, bottom divider (color.border.subtle). Five variant stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST wrap drawer in LSGlassPanel(.chrome) with 312pt fixed width and full-height.
- MUST use LSSectionHeader organism (UC-ORG-07) for the 'THIS WEEK' group label.
- MUST use LSButton(.outline, icon: .plus, label: "NEW") for the NEW affordance in sticky header.
- MUST render a 3px leading stripe per active row resolved through color.signal.default; 0px/transparent otherwise.
- MUST tint active row background to color.signal.default at 5% alpha; inactive rows transparent.
- MUST render row divider through color.border.subtle token.
- MUST register stories Default (5 sessions, 1 active), Empty State (no sessions), Long List (20 sessions, scrollable), No Active Session, Dark Mode.
- MUST make the header + NEW + section label remain sticky while rows scroll.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- NEVER use Font.system, Color(hex:), Color(red:), or .monospaced() in LSSessionsDrawer.swift.
- NEVER fetch data — take sessions + activeSessionId as props.
- NEVER re-implement a section header — always delegate to LSSectionHeader.
- NEVER use raw colors for active stripe/background — resolve from color.signal.default.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test TEST SUCCEEDED for LSSessionsDrawerTests; light + dark render correctly.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Default 5-session drawer with 1 active renders full composition (PRIMARY)
- [ ] AC-2: Tap session row fires onSelect(id) once
- [ ] AC-3: Tap NEW button fires onNew once
- [ ] AC-4: Header + NEW + section label remain sticky on scroll
- [ ] AC-5: Active row shows stripe + tinted bg; inactive does not
- [ ] AC-6: All five stories registered under both themes
- [ ] AC-7: Atom-composition gate (no banned primitives)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Full drawer composition [PRIMARY]
  GIVEN: developer renders LSSessionsDrawer(sessions: fiveMockSessions, activeSessionId: "santa-cruz-loop", onSelect:, onNew:, onDismiss:)
  WHEN:  view body resolves
  THEN:  312pt-wide LSGlassPanel(.chrome) drawer with trailing 1px color.border.default border + elevation.overlay; sticky header with 'Rides' title (ui.title.lg) + NEW LSButton; LSSectionHeader 'THIS WEEK'; 5 session rows; santa-cruz-loop row shows 3px stripe + 5%-alpha tint
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_default_renders_full_drawer_composition 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSessionsDrawerTests.swift
  TEST_FUNCTION: test_default_renders_full_drawer_composition

AC-2: Row tap fires onSelect with id
  GIVEN: LSSessionsDrawer with 5 sessions and onSelect handler
  WHEN:  user taps the third row
  THEN:  onSelect is invoked exactly once with the third session's id
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_row_tap_fires_onselect_with_id 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSessionsDrawerTests.swift
  TEST_FUNCTION: test_row_tap_fires_onselect_with_id

AC-3: NEW button fires onNew
  GIVEN: LSSessionsDrawer with onNew handler
  WHEN:  user taps the NEW button
  THEN:  onNew is invoked exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_new_button_fires_onnew_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSessionsDrawerTests.swift
  TEST_FUNCTION: test_new_button_fires_onnew_once

AC-4: Header + section label stay sticky on scroll
  GIVEN: LSSessionsDrawer with 20 sessions (Long List story)
  WHEN:  user scrolls the session list
  THEN:  header row (Rides + NEW) and section label (THIS WEEK) remain visually pinned; only rows scroll beneath
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_header_and_section_label_stay_sticky_on_scroll 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSessionsDrawerTests.swift
  TEST_FUNCTION: test_header_and_section_label_stay_sticky_on_scroll

AC-5: Active row stripe + tint (inactive transparent)
  GIVEN: LSSessionsDrawer with activeSessionId set
  WHEN:  view body resolves
  THEN:  only the matching row has 3px leading stripe in color.signal.default + 5%-alpha color.signal.default background; other rows have no stripe and transparent background
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_active_row_has_stripe_and_tint_inactive_does_not 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSessionsDrawerTests.swift
  TEST_FUNCTION: test_active_row_has_stripe_and_tint_inactive_does_not

AC-6: Five stories registered
  GIVEN: developer opens the sandbox
  WHEN:  navigating to Organisms / SessionsDrawer
  THEN:  stories Default (5 sessions, 1 active), Empty State (no sessions), Long List (20 sessions, scrollable), No Active Session, Dark Mode all present with dotted ids; render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_sessions_drawer_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSessionsDrawerTests.swift
  TEST_FUNCTION: test_sessions_drawer_stories_registered

AC-7: Atom-composition gate
  GIVEN: LSSessionsDrawer.swift source
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), Color(red:, .monospaced() occurrences
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_default_renders_full_drawer_composition passes | AC-1 |
| TC-2 | test_row_tap_fires_onselect_with_id passes | AC-2 |
| TC-3 | test_new_button_fires_onnew_once passes | AC-3 |
| TC-4 | test_header_and_section_label_stay_sticky_on_scroll passes | AC-4 |
| TC-5 | test_active_row_has_stripe_and_tint_inactive_does_not passes | AC-5 |
| TC-6 | test_sessions_drawer_stories_registered passes | AC-6 |
| TC-7 | No banned primitives in LSSessionsDrawer.swift | AC-7 |
| TC-8 | swiftformat --lint exits 0 for LSSessionsDrawer.swift | AC-7 |
| TC-9 | xcodebuild build BUILD SUCCEEDED | AC-6 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift (NEW)
- ios/LaneShadow/Views/Organisms/LSSessionRow.swift (NEW — internal row subview)
- ios/LaneShadowTests/Organisms/LSSessionsDrawerTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSSessionsDrawerStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift (MODIFY)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — prior sprints
- ios/LaneShadow/Views/Molecules/** — Sprint 4
- tokens/** — Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-05-sessions-drawer.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (lines 184-223) — UC-ORG-05 full spec
3. .spec/prds/v2/11-technical-requirements.md — Session entity schema
4. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift [PRIMARY PATTERN] — .chrome variant
5. ios/LaneShadow/Views/Atoms/LSButton.swift — .outline variant
6. ios/LaneShadow/Views/Atoms/LSDivider.swift — row divider atom
7. ios/LaneShadow/Views/Organisms/LSSectionHeader.swift — section header (UC-ORG-07)

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-05-sessions-drawer.html, .spec/prds/v2/07-uc-org.md

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-05-sessions-drawer.html before implementing
- Use LazyVStack inside ScrollView for row list; sticky header via VStack { header; ScrollView { LazyVStack { rows } } } composition
- Row background tint: ZStack with 3px leading Rectangle for stripe + tinted Rectangle for row bg when active
- Session row subview (LSSessionRow) is internal to drawer — not exposed as an atom/molecule
- Sessions prop is [Session] from entity schema
- Empty state: when sessions.isEmpty, render a centered 'No rides yet' message with ui.body.md + textMuted

Pattern: Sticky-header drawer with active-state row list
Pattern source: ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
Anti-pattern: Do not use SwiftUI List (adds its own insets/dividers); prefer LazyVStack with explicit LSDivider/border. Do not hardcode 312 as a magic number — expose as static let width: CGFloat = 312.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw primitives): grep banned pattern list against LSSessionsDrawer.swift + LSSessionRow.swift = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED for LSSessionsDrawerTests
Gate 5 (stories registered): OrganismStories.all contains all five organisms.sessionsdrawer.* ids

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ORG-07-ios, ALIGN-03-ios
Blocks:     UC-SCR-06-ios
Parallel:   UC-ORG-05-android, UC-ORG-03-ios, UC-ORG-04-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Full drawer composition", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_default_renders_full_drawer_composition" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Row tap fires onSelect once with id", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_row_tap_fires_onselect_with_id" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "NEW tap fires onNew once", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_new_button_fires_onnew_once" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Header+section label sticky on scroll", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_header_and_section_label_stay_sticky_on_scroll" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Active row stripe + tint", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_active_row_has_stripe_and_tint_inactive_does_not" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "Five stories registered", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_sessions_drawer_stories_registered" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "test_default_renders_full_drawer_composition passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_default_renders_full_drawer_composition" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "test_row_tap_fires_onselect_with_id passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_row_tap_fires_onselect_with_id" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "test_new_button_fires_onnew_once passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_new_button_fires_onnew_once" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "test_header_and_section_label_stay_sticky_on_scroll passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_header_and_section_label_stay_sticky_on_scroll" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "test_active_row_has_stripe_and_tint_inactive_does_not passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_active_row_has_stripe_and_tint_inactive_does_not" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "test_sessions_drawer_stories_registered passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSessionsDrawerTests/test_sessions_drawer_stories_registered" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "swiftformat --lint exits 0", "verify": "swiftformat --lint ios/LaneShadow/Views/Organisms/LSSessionsDrawer.swift" },
    { "id": "TC-9", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
