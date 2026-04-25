<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-04-ios — LSRouteSheet organism — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   180 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-04)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/6 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSRouteSheet renders — top to bottom — 36pt drag handle (color.border.strong), header row with optional LSBestBadge + title (typography.opinion.lg) + subtitle (typography.ui.body.md, color.content.textMuted), LSInstrumentReadout with 4 metrics (dist/time/climb/scenic), LSWeatherTimeline with 'Weather along the way' header, and sticky action row with outline Save + primary Ride this LSButtons (flex 1 and flex 2). Presented via LSBottomSheet molecule with .large detent. Save/Ride/Dismiss handlers fire exactly once. Five variant stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST present the sheet via LSBottomSheet molecule (UC-MOL-03) with default .large detent — do not re-implement bottom-sheet drag gestures.
- MUST compose LSInstrumentReadout (UC-MOL-07) for metrics and LSWeatherTimeline (UC-MOL-07) for weather — no inline re-implementation.
- MUST render LSBestBadge atom when route.isBest == true.
- MUST route title through LSText(typography.opinion.lg) and subtitle through LSText(typography.ui.body.md, color.content.textMuted).
- MUST render drag handle as a 36x4 capsule in color.border.strong.
- MUST render action row as sticky bottom with LSButton(.outline, label: "Save", icon: .bookmark) at flex 1 + LSButton(.primary, label: "Ride this", icon: .chevR) at flex 2.
- MUST register stories Best Route, Alt Route (no Best badge), Long Title + Via, Mixed Weather Timeline, Dark Mode.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- NEVER use Font.system, Color(hex:), Color(red:), or .monospaced() in LSRouteSheet.swift.
- NEVER re-implement weather or instrument grids inline.
- NEVER fetch data — organism is data-agnostic.
- NEVER modify LSBottomSheet, LSInstrumentReadout, or LSWeatherTimeline.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test TEST SUCCEEDED for LSRouteSheetTests; light + dark render correctly; drag-to-dismiss fires onDismiss exactly once.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Full sheet composition renders for a best route (PRIMARY)
- [ ] AC-2: Save / Ride / Dismiss handlers fire exactly once
- [ ] AC-3: Sheet presented via LSBottomSheet molecule with .large detent
- [ ] AC-4: Best badge hidden when route.isBest == false
- [ ] AC-5: All five variant stories registered
- [ ] AC-6: Atom-composition gate (no banned primitives)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Best-route full composition [PRIMARY]
  GIVEN: developer presents LSRouteSheet(route: bestRouteDetails (isBest: true, title: "The Skyline Spine"), weatherTimeline: sixHourTimeline, onSave:, onRide:, onDismiss:)
  WHEN:  sheet body resolves
  THEN:  top-down: 36pt drag handle (color.border.strong); header row with LSBestBadge + LSText(opinion.lg, "The Skyline Spine") + LSText(ui.body.md, subtitle, color.content.textMuted); LSInstrumentReadout with 4 metrics; LSWeatherTimeline with 6 entries; sticky bottom action row with LSButton(.outline) Save + LSButton(.primary) Ride this
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteSheetTests/test_best_route_full_composition 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteSheetTests.swift
  TEST_FUNCTION: test_best_route_full_composition

AC-2: Handlers fire once each
  GIVEN: LSRouteSheet with onSave, onRide, onDismiss handlers
  WHEN:  user taps Save, taps Ride this, and drags down to dismiss
  THEN:  onSave count == 1; onRide count == 1; onDismiss count == 1
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteSheetTests/test_save_ride_dismiss_handlers_fire_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteSheetTests.swift
  TEST_FUNCTION: test_save_ride_dismiss_handlers_fire_once

AC-3: Sheet uses LSBottomSheet molecule .large detent
  GIVEN: LSRouteSheet presented
  WHEN:  inspecting the view hierarchy
  THEN:  a single LSBottomSheet molecule wraps the sheet content with default .large detent
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteSheetTests/test_sheet_uses_lsbottomsheet_molecule_large_detent 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteSheetTests.swift
  TEST_FUNCTION: test_sheet_uses_lsbottomsheet_molecule_large_detent

AC-4: Alt route hides Best badge
  GIVEN: LSRouteSheet(route: altRoute with isBest: false)
  WHEN:  view body resolves
  THEN:  no LSBestBadge renders; title + subtitle render otherwise unchanged
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteSheetTests/test_alt_route_hides_best_badge 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteSheetTests.swift
  TEST_FUNCTION: test_alt_route_hides_best_badge

AC-5: Five stories registered
  GIVEN: developer opens the sandbox
  WHEN:  navigating to Organisms / RouteSheet
  THEN:  stories Best Route, Alt Route (no Best badge), Long Title + Via, Mixed Weather Timeline, Dark Mode all present; render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSRouteSheetTests/test_route_sheet_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSRouteSheetTests.swift
  TEST_FUNCTION: test_route_sheet_stories_registered

AC-6: Atom-composition gate
  GIVEN: LSRouteSheet.swift source
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), Color(red:, .monospaced() occurrences
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_best_route_full_composition passes | AC-1 |
| TC-2 | test_save_ride_dismiss_handlers_fire_once passes | AC-2 |
| TC-3 | test_sheet_uses_lsbottomsheet_molecule_large_detent passes | AC-3 |
| TC-4 | test_alt_route_hides_best_badge passes | AC-4 |
| TC-5 | test_route_sheet_stories_registered passes | AC-5 |
| TC-6 | No banned primitives in LSRouteSheet.swift | AC-6 |
| TC-7 | swiftformat --lint exits 0 for LSRouteSheet.swift | AC-6 |
| TC-8 | xcodebuild build BUILD SUCCEEDED | AC-5 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSRouteSheet.swift (NEW)
- ios/LaneShadowTests/Organisms/LSRouteSheetTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSRouteSheetStory.swift (NEW)
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

1. .spec/prds/v2/concepts/uc-org-04-route-sheet.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (lines 148-181) — UC-ORG-04 full spec
3. ios/LaneShadow/Views/Molecules/LSBottomSheet.swift [PRIMARY PATTERN]
4. ios/LaneShadow/Views/Molecules/LSInstrumentReadout.swift — 4-metric grid
5. ios/LaneShadow/Views/Molecules/LSWeatherTimeline.swift — header + 6 cells
6. ios/LaneShadow/Views/Atoms/LSBestBadge.swift — best badge atom
7. ios/LaneShadow/Views/Atoms/LSButton.swift — .outline / .primary variants

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-04-route-sheet.html, .spec/prds/v2/07-uc-org.md

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-04-route-sheet.html before implementing
- Action row sticky-bottom via .safeAreaInset(edge: .bottom) on the scrollable body
- Button flex ratio Save=1 : Ride=2 via HStack with weighted spacing.2
- Drag handle capsule: Capsule().fill(LaneShadowTheme.color.border.strong).frame(width: 36, height: 4).padding(.top, spacing.2)
- LSBottomSheet detent default .large; pass through dismiss callback to onDismiss

Pattern: Sheet-content organism delegated through LSBottomSheet molecule
Pattern source: ios/LaneShadow/Views/Molecules/LSBottomSheet.swift
Anti-pattern: Do not re-implement instrument grid or weather timeline inline; do not use .sheet modifier directly — LSBottomSheet owns presentation.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw primitives): grep banned pattern list against LSRouteSheet.swift = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED for LSRouteSheetTests
Gate 5 (stories registered): OrganismStories.all contains organisms.routesheet.* ids

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-MOL-03-ios, UC-MOL-07-ios, ALIGN-03-ios
Blocks:     UC-SCR-04-ios
Parallel:   UC-ORG-04-android, UC-ORG-03-ios, UC-ORG-05-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Full best-route composition", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_best_route_full_composition" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Save/Ride/Dismiss fire exactly once", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_save_ride_dismiss_handlers_fire_once" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "LSBottomSheet molecule with .large detent", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_sheet_uses_lsbottomsheet_molecule_large_detent" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Alt route hides best badge", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_alt_route_hides_best_badge" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "Five stories registered", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_route_sheet_stories_registered" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "test_best_route_full_composition passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_best_route_full_composition" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "test_save_ride_dismiss_handlers_fire_once passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_save_ride_dismiss_handlers_fire_once" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "test_sheet_uses_lsbottomsheet_molecule_large_detent passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_sheet_uses_lsbottomsheet_molecule_large_detent" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "test_alt_route_hides_best_badge passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_alt_route_hides_best_badge" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "test_route_sheet_stories_registered passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSRouteSheetTests/test_route_sheet_stories_registered" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSRouteSheet.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "swiftformat --lint exits 0", "verify": "swiftformat --lint ios/LaneShadow/Views/Organisms/LSRouteSheet.swift" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
