<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-02-ios — Toolbar + NavHeader molecules — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   120 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-02)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/6 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSToolbar and LSNavHeader render on iOS with token-driven chrome, safe-area respect via safeAreaInset, atom-composed slots from LSIcon/LSButton/LSText, large-title typography via opinion.lg, and all 4 + 3 documented stories registered. swiftformat clean. xcodebuild test exits TEST SUCCEEDED.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST compose leading/title/trailing slots from LSButton, LSIcon, LSText atoms.
- MUST resolve all colors through LaneShadowTheme.* (color.surface.primary, color.content.*).
- MUST use safeAreaInset(edge: .top) or .safeAreaPadding for toolbar safe-area handling.
- MUST resolve toolbar height from sizing.component.toolbarHeight token.
- MUST use TypographyVariant.ui.title.md (default) and .opinion.lg (large-title) via LSText.
- MUST register stories for all 4 LSToolbar + 3 LSNavHeader variants.
- NEVER hardcode status bar height (44, 47, 20).
- NEVER use NavigationView/NavigationStack inside LSNavHeader.
- NEVER inline raw Text() with Font.system/literal color.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED; light/dark both render.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSToolbar default render with slot atoms and surface tokens (PRIMARY)
- [ ] AC-2: LSToolbar safe-area respect via safeAreaInset
- [ ] AC-3: LSNavHeader large-title variant typography
- [ ] AC-4: LSNavHeader default variant uses ui.title.md
- [ ] AC-5: Atom-composition gate (no Color(hex:)/Font.system)
- [ ] AC-6: All 7 stories registered (4 toolbar + 3 navheader)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSToolbar default render [PRIMARY]
  GIVEN: developer instantiates LSToolbar(leading: .back { }, title: "Details", trailing: .action(icon: .ellipsis) { })
  WHEN:  view body resolves on iOS
  THEN:  height = sizing.component.toolbarHeight; background = color.surface.primary; title centered using LSText(typography.ui.title.md); back icon at sizing.icon.md via LSIcon; trailing via LSButton(.ghost)
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_default_render_uses_surface_primary_and_slot_atoms 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSToolbarTests.swift
  TEST_FUNCTION: test_default_render_uses_surface_primary_and_slot_atoms

AC-2: LSToolbar safe-area respect via safeAreaInset
  GIVEN: LSToolbar placed at top of screen without additional padding
  WHEN:  rendered on a device with status bar
  THEN:  toolbar content does not overlap status bar; safeAreaInset (or .safeAreaPadding/.ignoresSafeArea) is used; no hardcoded status bar height in source
  VERIFY: grep -n 'safeAreaInset\|safeAreaPadding\|ignoresSafeArea' ios/LaneShadow/Views/Molecules/LSToolbar.swift | wc -l | xargs test 0 -lt
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-3: LSNavHeader large-title variant typography
  GIVEN: developer instantiates LSNavHeader(variant: .largeTitle, title: "Chat")
  WHEN:  view body resolves
  THEN:  title renders in typography.opinion.lg via LSText; large-title variant occupies its own row above subsequent content
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavHeaderTests/test_large_title_uses_opinion_lg_typography 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift
  TEST_FUNCTION: test_large_title_uses_opinion_lg_typography

AC-4: LSNavHeader default variant uses ui.title.md
  GIVEN: developer instantiates LSNavHeader(variant: .default, title: "Routes")
  WHEN:  view body resolves
  THEN:  title renders in typography.ui.title.md via LSText; no large-title layout applied
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavHeaderTests/test_default_variant_uses_ui_title_md 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift
  TEST_FUNCTION: test_default_variant_uses_ui_title_md

AC-5: Atom-composition gate
  GIVEN: LSToolbar.swift and LSNavHeader.swift compiled
  WHEN:  source inspected
  THEN:  no Color(hex:), Color(red:), Font.system, or .foregroundColor deprecated API
  VERIFY: grep -n 'Color(red:\|Color(hex:\|Font.system\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSToolbar.swift ios/LaneShadow/Views/Molecules/LSNavHeader.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-6: All 7 stories registered
  GIVEN: developer opens sandbox app
  WHEN:  navigating to Molecules / Toolbar and Molecules / NavHeader
  THEN:  Toolbar stories Back+Title+Action, Title Only, Title+Two Actions, No Back Button; NavHeader stories Default, Large Title, Large Title With Subtitle — all 7 render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_all_seven_toolbar_navheader_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSToolbarTests.swift
  TEST_FUNCTION: test_all_seven_toolbar_navheader_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_default_render_uses_surface_primary_and_slot_atoms passes | AC-1 |
| TC-2 | safeAreaInset/safeAreaPadding present in LSToolbar source | AC-2 |
| TC-3 | test_large_title_uses_opinion_lg_typography passes | AC-3 |
| TC-4 | test_default_variant_uses_ui_title_md passes | AC-4 |
| TC-5 | No literal colors or Font.system in source | AC-5 |
| TC-6 | test_all_seven_toolbar_navheader_stories_registered passes | AC-6 |
| TC-7 | swiftformat --lint exits 0 | AC-5 |
| TC-8 | xcodebuild build BUILD SUCCEEDED | AC-6 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSToolbar.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSNavHeader.swift (NEW)
- ios/LaneShadowTests/Molecules/LSToolbarTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSToolbarStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSNavHeaderStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift (MODIFY)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/toolbar/ [REQUIRED READING]
2. .spec/design/system/molecules/nav-header/ [REQUIRED READING]
3. .spec/prds/v2/06-uc-mol.md (lines 61-100) — UC-MOL-02 acceptance criteria
4. ios/LaneShadow/Views/Atoms/LSButton.swift (1-80) — ghost button variant for icon buttons
5. ios/LaneShadow/Views/Atoms/LSIcon.swift (1-80) — back arrow + action icons
6. ios/LaneShadow/Views/Atoms/LSText.swift — title typography (opinion.lg for large title)

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/toolbar/, .spec/design/system/molecules/nav-header/

Interaction notes:
- REQUIRED READING: both design directories before implementing
- Use safeAreaInset(edge: .top) for safe-area handling — never hardcode status bar heights
- LSNavHeader is a presentation molecule — do NOT embed NavigationStack; host screen owns navigation
- Large-title variant uses typography.opinion.lg in its own row

Pattern: Named slot composition with enum cases + ViewBuilder; static token helpers mirroring LSCard
Pattern source: ios/LaneShadow/Views/Atoms/LSCard.swift
Anti-pattern: Do not use NavigationView/NavigationStack inside LSNavHeader — it is a plain presentation molecule.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(hex:\|Font.system' both files = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios
Blocks:     UC-ORG-01-ios, UC-ORG-02-ios
Parallel:   UC-MOL-02-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSToolbar(leading:.back,title:,trailing:.action) WHEN view resolves THEN sizing.component.toolbarHeight; color.surface.primary; LSText title.md; LSIcon back icon.md; LSButton(.ghost) trailing", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_default_render_uses_surface_primary_and_slot_atoms 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSToolbar at top WHEN rendered THEN no status bar overlap; safeAreaInset used; no hardcoded height", "verify": "grep -n 'safeAreaInset\\|safeAreaPadding\\|ignoresSafeArea' ios/LaneShadow/Views/Molecules/LSToolbar.swift | wc -l | xargs test 0 -lt" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSNavHeader(variant:.largeTitle, title:) WHEN resolved THEN typography.opinion.lg via LSText; large-title row above content", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavHeaderTests/test_large_title_uses_opinion_lg_typography 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSNavHeader(variant:.default, title:) WHEN resolved THEN typography.ui.title.md via LSText; no large-title layout", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavHeaderTests/test_default_variant_uses_ui_title_md 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN compiled source WHEN inspected THEN no Color(hex:)/Font.system literals", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSToolbar.swift ios/LaneShadow/Views/Molecules/LSNavHeader.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating to Molecules/Toolbar and Molecules/NavHeader THEN all 4+3 stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_all_seven_toolbar_navheader_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_default_render_uses_surface_primary_and_slot_atoms passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_default_render_uses_surface_primary_and_slot_atoms 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "safeAreaInset present in LSToolbar source", "maps_to_ac": "AC-2", "verify": "grep -n 'safeAreaInset\\|safeAreaPadding\\|ignoresSafeArea' ios/LaneShadow/Views/Molecules/LSToolbar.swift | wc -l | xargs test 0 -lt" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_large_title_uses_opinion_lg_typography passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavHeaderTests/test_large_title_uses_opinion_lg_typography 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_default_variant_uses_ui_title_md passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSNavHeaderTests/test_default_variant_uses_ui_title_md 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "No literal colors or Font.system in source", "maps_to_ac": "AC-5", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSToolbar.swift ios/LaneShadow/Views/Molecules/LSNavHeader.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-6", "type": "test_criterion", "description": "test_all_seven_toolbar_navheader_stories_registered passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_all_seven_toolbar_navheader_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-7", "type": "test_criterion", "description": "swiftformat --lint exits 0", "maps_to_ac": "AC-5", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSToolbar.swift ios/LaneShadow/Views/Molecules/LSNavHeader.swift" },
    { "id": "TC-8", "type": "test_criterion", "description": "xcodebuild build BUILD SUCCEEDED", "maps_to_ac": "AC-6", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
