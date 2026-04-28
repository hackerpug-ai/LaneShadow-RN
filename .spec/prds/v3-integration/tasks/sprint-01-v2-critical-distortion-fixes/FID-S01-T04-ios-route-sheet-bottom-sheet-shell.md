================================================================================
TASK: FID-S01-T04 - iOS LSRouteSheet Bottom-Sheet Shell
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P0
EFFORT:     M
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: AC-1..AC-4 not started

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSRouteSheet renders inside an LSBottomSheet shell with scenic strip, correct via subtitle size, and 1:2 Save/Ride button proportion.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST wrap LSRouteSheet in `LSBottomSheet(detent: .large, onDismiss:)` — currently a plain VStack
- MUST add 5-dot scenic indicator strip: copper-filled = scenic score, `border.strong` empty dots
- MUST change via subtitle from `body.md` to `body.sm` typography
- MUST fix Save/Ride buttons to 1:2 width ratio (Save=1, Ride=2) using `.frame(maxWidth:)` or layout priority
- NEVER use equal-width buttons — design specifies visual weight difference

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] LSRouteSheet wrapped in LSBottomSheet with drag handle + dismiss gesture (AC-1 PRIMARY)
- [ ] 5-dot scenic strip renders beside LSBestBadge (AC-2)
- [ ] Via subtitle renders in body.sm, not body.md (AC-3)
- [ ] Save button width 1 : Ride button width 2 (AC-4)
- [ ] xcodebuild build passes + native-compliance clean
- [ ] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Bottom-sheet shell wrapping [PRIMARY]
  GIVEN: LSRouteSheet is displayed in sandbox
  WHEN:  The sheet presents
  THEN:  It appears inside LSBottomSheet(detent: .large) with a drag handle bar and dismiss gesture

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift
  TEST_FUNCTION: testRouteSheetBottomSheetShell

AC-2: 5-dot scenic indicator strip
  GIVEN: LSRouteSheet is displayed with a scenic score (e.g., 4/5)
  WHEN:  The badge area renders
  THEN:  5 dots appear beside LSBestBadge: 4 copper-filled, 1 `border.strong` empty, each 8pt

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift
  TEST_FUNCTION: testScenicDotStrip

AC-3: Via subtitle body.sm typography
  GIVEN: LSRouteSheet is displayed with a via subtitle ("via Bear Creek Pass...")
  WHEN:  The subtitle renders
  THEN:  Text uses `body.sm` typography (not `body.md`)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift
  TEST_FUNCTION: testViaSubtitleBodySM

AC-4: Save/Ride 1:2 button proportion
  GIVEN: LSRouteSheet is displayed with action buttons
  WHEN:  The Save and Ride buttons render
  THEN:  Save button is relative width 1, Ride button is relative width 2 (1:2 ratio)

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift
  TEST_FUNCTION: testSaveRideButtonProportion

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSRouteSheet.swift (MODIFY)
- ios/LaneShadow/Views/Molecules/LSScenicDotStrip.swift (NEW)
- ios/LaneShadowTests/Sandbox/RouteSheetShellTests.swift (NEW)

writeProhibited:
- android/**, server/**, react-native/**, any file not listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Organisms/LSRouteSheet.swift (MODIFY): Wrap in LSBottomSheet, add scenic strip, fix via subtitle, fix button ratio
- ios/LaneShadow/Views/Molecules/LSScenicDotStrip.swift (NEW): 5-dot scenic rating molecule

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/organisms/route-sheet/route-sheet.html [PRIMARY PATTERN]
   - Focus: Bottom sheet structure, scenic dots, via subtitle, action button layout

2. ios/LaneShadow/Views/Organisms/LSRouteSheet.swift
   - Focus: Current VStack implementation, button layout, subtitle typography

3. ios/LaneShadow/Views/Organisms/LSBottomSheet.swift
   - Focus: Existing bottom-sheet shell API (detents, handle, onDismiss)

4. .spec/prds/v3-integration/remediations/02-views-route.md
   - Sections: Gap E2-01, E2-02, E2-03, E2-04

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED evidence in TDD_STATE
Gate 2: One test per AC
Gate 3: xcodebuild test exits 0
Gate 4: xcodebuild build exits 0
Gate 5: native-compliance exits 0
Gate 6: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- LSBestBadge enter animation (200ms scale+fade — Sprint 02)
- Copper top-edge stripe on dismiss drag (Sprint 02)
- Weather timeline header (Sprint 02)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** LSRouteSheet is a plain `VStack(spacing: 0)` with no sheet shell, no handle, no detent system. Buttons are equal width. Via uses body.md.
**Gap:** Design specifies bottom-sheet shell with scenic dots, smaller via text, and weighted buttons.

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: None
Blocks:     FID-S01-T09
Parallel:   All other Sprint 01 tasks

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSRouteSheet displayed WHEN sheet presents THEN wrapped in LSBottomSheet(detent: .large) with drag handle and dismiss", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSRouteSheet with scenic score 4/5 WHEN badge renders THEN 5 dots appear: 4 copper-filled, 1 border.strong empty", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSRouteSheet with via subtitle WHEN subtitle renders THEN uses body.sm typography not body.md", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN LSRouteSheet with action buttons WHEN buttons render THEN Save width:Ride width = 1:2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSRouteSheet content is wrapped in LSBottomSheet component", "maps_to_ac": "AC-1", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/RouteSheetShellTests/testRouteSheetBottomSheetShell" },
    { "id": "TC-2", "type": "test_criterion", "description": "Scenic dot strip renders 5 dots with correct fill/empty pattern", "maps_to_ac": "AC-2", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/RouteSheetShellTests/testScenicDotStrip" },
    { "id": "TC-3", "type": "test_criterion", "description": "Via subtitle uses theme.type.body.sm token", "maps_to_ac": "AC-3", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/RouteSheetShellTests/testViaSubtitleBodySM" },
    { "id": "TC-4", "type": "test_criterion", "description": "Save button frame width is half of Ride button frame width", "maps_to_ac": "AC-4", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/RouteSheetShellTests/testSaveRideButtonProportion" }
  ]
}
-->
