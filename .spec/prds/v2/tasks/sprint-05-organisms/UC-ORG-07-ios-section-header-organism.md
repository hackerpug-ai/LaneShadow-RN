<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-07-ios — LSSectionHeader organism — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   90 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-07)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/6 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSSectionHeader renders title in typography.ui.title.md on the leading edge with an optional trailing 'See all' LSText link tinted color.signal.default. Signature LSSectionHeader(title: String, trailing: TrailingSlot = .none, inset: SpacingToken? = .spacing3). Trailing slot supports .none or .link(label:onTap:). Tap fires handler exactly once. Five variant stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST route title through LSText(typography.ui.title.md).
- MUST route 'See all' link through LSText + Button with tint color.signal.default.
- MUST default inset to .spacing3 from LaneShadowTheme spacing tokens; accept override via SpacingToken? parameter.
- MUST compose from atoms only — LSText, LSIcon if needed; no molecules or raw Rectangle backgrounds.
- MUST register stories Title Only, Title + See All, Caps Label (no See All), Custom Inset, Dark Mode with dotted ids organisms.sectionheader.*.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- NEVER use Font.system, Color(hex:), Color(red:), or .monospaced() in LSSectionHeader.swift.
- NEVER hardcode inset as 16 / 12 / etc. — always SpacingToken-resolved.
- NEVER add chrome backgrounds — header is transparent.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test TEST SUCCEEDED for LSSectionHeaderTests.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Title + See all renders leading title + trailing tinted link with spacing.3 inset (PRIMARY)
- [ ] AC-2: Caps-label variant renders with no trailing slot
- [ ] AC-3: See all tap fires onTap exactly once
- [ ] AC-4: Custom inset parameter overrides default spacing.3
- [ ] AC-5: All five stories registered
- [ ] AC-6: Atom-composition gate (no banned primitives)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Title + See all with spacing.3 inset [PRIMARY]
  GIVEN: developer renders LSSectionHeader(title: "Nearby Routes", trailing: .link("See all") { })
  WHEN:  view body resolves
  THEN:  LSText(typography.ui.title.md, "Nearby Routes") leading + LSText link 'See all' trailing tinted with color.signal.default; leading inset is spacing.3
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSectionHeaderTests/test_title_plus_see_all_renders_with_spacing3_inset 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSectionHeaderTests.swift
  TEST_FUNCTION: test_title_plus_see_all_renders_with_spacing3_inset

AC-2: Caps label no trailing slot
  GIVEN: developer renders LSSectionHeader(title: "THIS WEEK")
  WHEN:  view body resolves
  THEN:  title LSText renders (caps text passed through; typography token still ui.title.md); no trailing slot; inset spacing.3
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSectionHeaderTests/test_caps_label_no_trailing_slot 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSectionHeaderTests.swift
  TEST_FUNCTION: test_caps_label_no_trailing_slot

AC-3: See all tap fires once
  GIVEN: LSSectionHeader with trailing: .link("See all") { onTap }
  WHEN:  user taps the See all link
  THEN:  onTap is invoked exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSectionHeaderTests/test_see_all_tap_fires_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSectionHeaderTests.swift
  TEST_FUNCTION: test_see_all_tap_fires_once

AC-4: Custom inset override
  GIVEN: developer renders LSSectionHeader(title: "Custom", inset: .spacing4)
  WHEN:  view body resolves
  THEN:  leading inset resolves to spacing.4 token value — not spacing.3 default
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSectionHeaderTests/test_custom_inset_overrides_default 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSectionHeaderTests.swift
  TEST_FUNCTION: test_custom_inset_overrides_default

AC-5: Five stories registered
  GIVEN: developer opens the sandbox
  WHEN:  navigating to Organisms / SectionHeader
  THEN:  stories Title Only, Title + See All, Caps Label (no See All), Custom Inset, Dark Mode all present with dotted ids; render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSSectionHeaderTests/test_section_header_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSSectionHeaderTests.swift
  TEST_FUNCTION: test_section_header_stories_registered

AC-6: Atom-composition gate
  GIVEN: LSSectionHeader.swift source
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), Color(red:, .monospaced() occurrences
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Organisms/LSSectionHeader.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_title_plus_see_all_renders_with_spacing3_inset passes | AC-1 |
| TC-2 | test_caps_label_no_trailing_slot passes | AC-2 |
| TC-3 | test_see_all_tap_fires_once passes | AC-3 |
| TC-4 | test_custom_inset_overrides_default passes | AC-4 |
| TC-5 | test_section_header_stories_registered passes | AC-5 |
| TC-6 | No banned primitives in LSSectionHeader.swift | AC-6 |
| TC-7 | swiftformat --lint exits 0 for LSSectionHeader.swift | AC-6 |
| TC-8 | xcodebuild build BUILD SUCCEEDED | AC-5 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSSectionHeader.swift (NEW)
- ios/LaneShadowTests/Organisms/LSSectionHeaderTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSSectionHeaderStory.swift (NEW)
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

1. .spec/prds/v2/concepts/uc-org-07-section-header.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (lines 247-261) — UC-ORG-07 full spec
3. ios/LaneShadow/Views/Atoms/LSText.swift [PRIMARY PATTERN] — typography token plumbing
4. tokens/platforms/swift/Sources/LaneShadowTheme/ — spacing.3 / spacing.4 tokens, color.signal.default

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-07-section-header.html, .spec/prds/v2/07-uc-org.md

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-07-section-header.html before implementing
- TrailingSlot is an enum: case none; case link(label: String, onTap: () -> Void)
- Caps label style is not a separate variant — calling sites pass already-caps strings (e.g. 'THIS WEEK'); do not apply .textCase(.uppercase) automatically
- Use HStack { LSText(title); Spacer(); trailing view }.padding(.leading, inset.value) — keep the implementation minimal

Pattern: Simple leading/trailing HStack with token-resolved inset
Pattern source: ios/LaneShadow/Views/Atoms/LSText.swift
Anti-pattern: Do not add background chrome or dividers — section header is transparent. Do not re-implement the See all link as a raw NavigationLink.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw primitives): grep banned pattern list against LSSectionHeader.swift = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED for LSSectionHeaderTests
Gate 5 (stories registered): OrganismStories.all contains all five organisms.sectionheader.* ids

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios
Blocks:     UC-ORG-05-ios, UC-SCR-06-ios
Parallel:   UC-ORG-07-android, UC-ORG-01-ios, UC-ORG-02-ios, UC-ORG-03-ios, UC-ORG-04-ios, UC-ORG-06-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Title + See all with spacing.3 inset", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_title_plus_see_all_renders_with_spacing3_inset" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Caps label no trailing slot", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_caps_label_no_trailing_slot" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "See all tap fires once", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_see_all_tap_fires_once" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Custom inset override", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_custom_inset_overrides_default" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Five stories registered", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_section_header_stories_registered" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSSectionHeader.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "test_title_plus_see_all_renders_with_spacing3_inset passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_title_plus_see_all_renders_with_spacing3_inset" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "test_caps_label_no_trailing_slot passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_caps_label_no_trailing_slot" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "test_see_all_tap_fires_once passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_see_all_tap_fires_once" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "test_custom_inset_overrides_default passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_custom_inset_overrides_default" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "test_section_header_stories_registered passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSSectionHeaderTests/test_section_header_stories_registered" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSSectionHeader.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "swiftformat --lint exits 0", "verify": "swiftformat --lint ios/LaneShadow/Views/Organisms/LSSectionHeader.swift" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
