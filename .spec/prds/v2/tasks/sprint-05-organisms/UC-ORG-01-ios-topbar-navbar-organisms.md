<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-01-ios — Navigation organisms (LSTopBar + LSNavBar) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     ✅ Completed
COMPLETED:  2026-04-24T19:05:00Z
COMMIT:     d98c0d91669fa877713e9539588d2adc1055649c
REVIEWER:   swift-reviewer
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   150 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-01)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/7 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSTopBar and LSNavBar organisms render on iOS with correct chrome composition — LSTopBar uses LSGlassPanel(.chrome)-backed hamburger (40x40, radius.md) + optional centered title (typography.ui.title.md) + trailing NEW chip with LSIcon(.plus) + label (typography.ui.label.md); Record Highlight variant swaps trailing to color.status.recording indicator. LSNavBar composes LSToolbar for modal-sheet contexts. Stories registered for all four TopBar variants + NavBar. swiftformat clean; xcodebuild build + test green; no hardcoded hex, no Font.system usage.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST back every TopBar chip with LSGlassPanel(.chrome) atom — no raw Rectangle/RoundedRectangle backgrounds.
- MUST route hamburger + plus glyphs through LSIcon atom (.menu, .plus) — no SF Symbol literals.
- MUST resolve centered title through LSText(typography.ui.title.md) via LaneShadowTheme typography tokens.
- MUST route NEW label through LSText(typography.ui.label.md).
- MUST compose LSNavBar from the existing LSToolbar molecule — do not re-implement toolbar chrome.
- MUST register stories for Default, With Title, Hamburger Only, Record Highlight, and LSNavBar default in OrganismStories.all with tier: .organism and dotted ids (organisms.topbar.*, organisms.navbar.*).
- MUST resolve Record Highlight trailing indicator through color.status.recording token.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj — use project.yml + scripts/ios/generate-project.sh.
- NEVER use Font.system(...), Color(hex:), Color(red:green:blue:), or literal .monospaced() in organism source.
- NEVER inline chip rectangles — chrome flows exclusively through LSGlassPanel(.chrome).
- NEVER fetch data or depend on Observable/ViewModel — organism is data-agnostic.
- NEVER modify atoms, molecules, or tokens from prior sprints.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test TEST SUCCEEDED for all TopBar + NavBar test classes under both light/dark themes.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSTopBar default renders hamburger + NEW chips backed by LSGlassPanel(.chrome) with no title (PRIMARY)
- [ ] AC-2: LSTopBar with title renders centered title between chips
- [ ] AC-3: Tap handlers (onMenuTap, onNewTap) fire exactly once per tap
- [ ] AC-4: Record Highlight variant swaps trailing chip to color.status.recording indicator
- [ ] AC-5: LSNavBar composes LSToolbar with leading back + trailing action slots
- [ ] AC-6: Atom-composition inspection gate (no Font.system/Color(hex:)/.monospaced())
- [ ] AC-7: Stories registered for Default, With Title, Hamburger Only, Record Highlight, NavBar Default

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSTopBar default with hamburger + NEW chips [PRIMARY]
  GIVEN: developer renders LSTopBar(onMenuTap: { }, onNewTap: { })
  WHEN:  view body resolves
  THEN:  leading edge shows 40x40 LSGlassPanel(.chrome) chip with LSIcon(.menu); trailing edge shows rounded LSGlassPanel(.chrome) chip with LSIcon(.plus) + LSText(typography.ui.label.md, 'NEW'); no centered title; safe-area inset respected at top
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTopBarTests/test_default_renders_glass_hamburger_and_new_chip 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSTopBarTests.swift
  TEST_FUNCTION: test_default_renders_glass_hamburger_and_new_chip

AC-2: LSTopBar with title
  GIVEN: developer renders LSTopBar(title: "Details", onMenuTap: { }, onNewTap: { })
  WHEN:  view body resolves
  THEN:  centered LSText(typography.ui.title.md, 'Details') renders between hamburger and NEW chip; layout remains horizontally balanced
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTopBarTests/test_with_title_renders_centered_title 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSTopBarTests.swift
  TEST_FUNCTION: test_with_title_renders_centered_title

AC-3: Tap handlers fire exactly once
  GIVEN: LSTopBar with onMenuTap and onNewTap callbacks
  WHEN:  user taps the hamburger chip and then the NEW chip
  THEN:  onMenuTap invocation count == 1; onNewTap invocation count == 1
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTopBarTests/test_tap_handlers_fire_exactly_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSTopBarTests.swift
  TEST_FUNCTION: test_tap_handlers_fire_exactly_once

AC-4: Record Highlight uses status.recording token
  GIVEN: developer renders LSTopBar(trailing: .recordHighlight(isRecording: true))
  WHEN:  view body resolves
  THEN:  trailing chip shows recording indicator dot resolved from color.status.recording token; glass panel chrome preserved
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTopBarTests/test_record_highlight_variant_uses_status_recording_token 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSTopBarTests.swift
  TEST_FUNCTION: test_record_highlight_variant_uses_status_recording_token

AC-5: LSNavBar composes LSToolbar
  GIVEN: developer renders LSNavBar(title: "Filter", leading: .back { }, trailing: .action(.close) { })
  WHEN:  view body resolves
  THEN:  LSToolbar molecule renders with back LSIcon leading + close LSIcon trailing + centered title; no raw HStack chrome
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavBarTests/test_navbar_composes_lstoolbar_molecule 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSNavBarTests.swift
  TEST_FUNCTION: test_navbar_composes_lstoolbar_molecule

AC-6: Atom-composition inspection gate
  GIVEN: LSTopBar.swift and LSNavBar.swift sources compiled
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), Color(red:, .monospaced() occurrences in organism source
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Organisms/LSTopBar.swift ios/LaneShadow/Views/Organisms/LSNavBar.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-7: Stories registered
  GIVEN: developer opens the sandbox
  WHEN:  navigating to Organisms / TopBar and Organisms / NavBar
  THEN:  stories Default, With Title, Hamburger Only (no NEW chip), Record Highlight, and NavBar Default are present with tier: .organism and dotted ids; all render under both light and dark themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSTopBarTests/test_topbar_and_navbar_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSTopBarTests.swift
  TEST_FUNCTION: test_topbar_and_navbar_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_default_renders_glass_hamburger_and_new_chip passes | AC-1 |
| TC-2 | test_with_title_renders_centered_title passes | AC-2 |
| TC-3 | test_tap_handlers_fire_exactly_once passes | AC-3 |
| TC-4 | test_record_highlight_variant_uses_status_recording_token passes | AC-4 |
| TC-5 | test_navbar_composes_lstoolbar_molecule passes | AC-5 |
| TC-6 | No Font.system / .monospaced() / Color(hex:) in LSTopBar.swift or LSNavBar.swift | AC-6 |
| TC-7 | test_topbar_and_navbar_stories_registered passes | AC-7 |
| TC-8 | swiftformat --lint exits 0 for both organism files | AC-6 |
| TC-9 | xcodebuild build BUILD SUCCEEDED | AC-7 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSTopBar.swift (NEW)
- ios/LaneShadow/Views/Organisms/LSNavBar.swift (NEW)
- ios/LaneShadowTests/Organisms/LSTopBarTests.swift (NEW)
- ios/LaneShadowTests/Organisms/LSNavBarTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSTopBarStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSNavBarStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift (NEW or MODIFY — central registry)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only; regenerate via scripts/ios/generate-project.sh
- ios/LaneShadow/Views/Atoms/** — atoms owned by prior sprints
- ios/LaneShadow/Views/Molecules/** — molecules owned by Sprint 4
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-01-topbar-navbar.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (lines 24-56) — UC-ORG-01 full spec
3. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift [PRIMARY PATTERN] — .chrome variant backs every chip
4. ios/LaneShadow/Views/Atoms/LSIcon.swift — .menu / .plus glyphs
5. ios/LaneShadow/Views/Atoms/LSText.swift — typography token plumbing
6. ios/LaneShadow/Views/Molecules/LSToolbar.swift — composition source for LSNavBar
7. ios/LaneShadow/Sandbox/Stories/Molecules/LSToolbarStory.swift — story registration pattern
8. ~/Projects/native-sandbox/RULES.md (§6) — Story contract

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-01-topbar-navbar.html, .spec/prds/v2/07-uc-org.md

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-01-topbar-navbar.html before implementing
- Hamburger chip is a 40x40 LSGlassPanel(.chrome) with radius.md and LSIcon(.menu) centered
- NEW chip is a rounded LSGlassPanel(.chrome) pill with LSIcon(.plus) + LSText(ui.label.md, 'NEW') hstacked with spacing.1
- Centered title slot only renders when title != nil; uses Spacer alignment to keep chips anchored to edges
- Record Highlight variant: trailing slot becomes an LSGlassPanel(.chrome) pill with a filled circle in color.status.recording + 'REC' label
- LSNavBar is a thin wrapper around LSToolbar; does not add its own chrome — screens pass leading/trailing slots through

Pattern: Slot-based organism over glass chrome atoms; NavBar is molecule delegation
Pattern source: ios/LaneShadow/Views/Molecules/LSToolbar.swift
Anti-pattern: Do not hand-roll HStack { Rectangle() } chrome with .background(Color.white.opacity(0.8)).blur(...) — use LSGlassPanel(.chrome).

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw primitives): grep 'Font.system\|Color(hex:\|Color(red:\|\.monospaced()' LSTopBar.swift LSNavBar.swift = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED for LSTopBarTests and LSNavBarTests
Gate 5 (stories registered): OrganismStories.all contains organisms.topbar.* and organisms.navbar.* ids

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios, UC-MOL-02-ios
Blocks:     UC-ORG-02-ios, UC-SCR-01..06-ios
Parallel:   UC-ORG-01-android, UC-ORG-07-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSTopBar default WHEN resolved THEN LSGlassPanel(.chrome) hamburger (LSIcon(.menu)) + LSGlassPanel(.chrome) NEW chip (LSIcon(.plus)+label) no title", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_default_renders_glass_hamburger_and_new_chip" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSTopBar(title:) WHEN resolved THEN centered LSText(ui.title.md)", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_with_title_renders_centered_title" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN tap handlers WHEN tapped THEN each fires exactly once", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_tap_handlers_fire_exactly_once" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN Record Highlight variant WHEN resolved THEN trailing chip uses color.status.recording", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_record_highlight_variant_uses_status_recording_token" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSNavBar WHEN resolved THEN composes LSToolbar molecule", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavBarTests/test_navbar_composes_lstoolbar_molecule" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN sources WHEN inspected THEN no Font.system/Color(hex:)/.monospaced()", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSTopBar.swift ios/LaneShadow/Views/Organisms/LSNavBar.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating THEN stories Default / With Title / Hamburger Only / Record Highlight / NavBar Default present", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_topbar_and_navbar_stories_registered" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "test_default_renders_glass_hamburger_and_new_chip passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_default_renders_glass_hamburger_and_new_chip" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "test_with_title_renders_centered_title passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_with_title_renders_centered_title" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "test_tap_handlers_fire_exactly_once passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_tap_handlers_fire_exactly_once" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "test_record_highlight_variant_uses_status_recording_token passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_record_highlight_variant_uses_status_recording_token" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "test_navbar_composes_lstoolbar_molecule passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSNavBarTests/test_navbar_composes_lstoolbar_molecule" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "No banned primitives in organism sources", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSTopBar.swift ios/LaneShadow/Views/Organisms/LSNavBar.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "test_topbar_and_navbar_stories_registered passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSTopBarTests/test_topbar_and_navbar_stories_registered" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "swiftformat --lint exits 0", "verify": "swiftformat --lint ios/LaneShadow/Views/Organisms/LSTopBar.swift ios/LaneShadow/Views/Organisms/LSNavBar.swift" },
    { "id": "TC-9", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "xcodebuild build BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
