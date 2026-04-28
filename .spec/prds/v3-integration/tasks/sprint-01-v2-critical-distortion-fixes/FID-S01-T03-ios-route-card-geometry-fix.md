================================================================================
TASK: FID-S01-T03 - iOS LSRouteCard Geometry Fix
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Done
PRIORITY:   P0
EFFORT:     S
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer

RUNTIME_COMMANDS:
  typecheck: cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build
  test: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  native-compliance: scripts/tokens/enforce-native-compliance.sh

PROGRESS: All ACs complete — implementation was already correct from bf48593f, only fixed test fixture

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSRouteCard map preview fills edge-to-edge with correct 9:4 aspect ratio and no inner double-rounded-corner artifacts.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use `LSCard(padding: .zero)` so map preview extends to card edges
- NEVER keep inner `clipShape(RoundedRectangle)` on map preview — causes double-rounded corner artifact
- MUST use `aspectRatio(9.0/4.0, contentMode: .fill)` for map preview height
- STRICTLY re-apply `padding(theme.space.md)` inside `routeInfo` section only

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [x] Map preview fills card edge-to-edge with no inner padding (AC-1 PRIMARY)
- [x] No inner clipShape on map preview — outer LSCard handles corners (AC-2)
- [x] Map preview uses 9:4 aspect ratio instead of fixed 160pt height (AC-3)
- [x] xcodebuild build passes + native-compliance clean
- [x] Only SCOPE.writeAllowed files modified

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Edge-to-edge map preview [PRIMARY]
  GIVEN: LSRouteCard is displayed in sandbox
  WHEN:  The card renders
  THEN:  Map preview extends to all four card edges with zero inner padding

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteCardGeometryTests.swift
  TEST_FUNCTION: testMapPreviewEdgeToEdge

AC-2: No inner clipShape artifact
  GIVEN: LSRouteCard is displayed in sandbox
  WHEN:  The map preview renders within the card
  THEN:  No inner RoundedRectangle clipShape exists — only outer LSCard clips corners

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteCardGeometryTests.swift
  TEST_FUNCTION: testNoInnerClipShape

AC-3: 9:4 aspect ratio map preview
  GIVEN: LSRouteCard is displayed in sandbox at any width
  WHEN:  Map preview height is calculated
  THEN:  Map uses `aspectRatio(9.0/4.0)` so height scales proportionally with card width

  TDD_STATE:     none
  TEST_FILE:     ios/LaneShadowTests/Sandbox/RouteCardGeometryTests.swift
  TEST_FUNCTION: testMapAspectRatioNineFour

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSRouteCard.swift (MODIFY)
- ios/LaneShadowTests/Sandbox/RouteCardGeometryTests.swift (NEW)

writeProhibited:
- android/**, server/**, react-native/**, any file not listed above

--------------------------------------------------------------------------------
DELIVERABLE
--------------------------------------------------------------------------------

- ios/LaneShadow/Views/Organisms/LSRouteCard.swift (MODIFY): Zero padding on card, remove inner clipShape, use 9:4 aspect ratio, re-apply padding in routeInfo

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. ios/LaneShadow/Views/Organisms/LSRouteCard.swift [PRIMARY PATTERN]
   - Focus: Current padding model, clipShape usage, mapPreviewHeight constant

2. .spec/design/system/organisms/route-card/route-card.html
   - Focus: Edge-to-edge map preview, 9:4 aspect ratio spec

3. .spec/prds/v3-integration/remediations/02-views-route.md
   - Sections: Gap E3-01, E3-02, E3-03

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1: RED evidence in TDD_STATE
Gate 2: One test per AC in RouteCardGeometryTests.swift
Gate 3: xcodebuild test exits 0
Gate 4: xcodebuild build exits 0
Gate 5: native-compliance exits 0
Gate 6: git diff --name-only ⊆ writeAllowed

--------------------------------------------------------------------------------
OUT OF SCOPE
--------------------------------------------------------------------------------

- LSRouteCard saved-state heart icon (Android T08)
- Route card difficulty tags (Sprint 02)
- Subtitle separator pipe (Sprint 02)

--------------------------------------------------------------------------------
CONTEXT
--------------------------------------------------------------------------------

**Current state:** LSRouteCard uses `LSCard(padding: .spacing4)` which insets map from edges, has inner `clipShape(RoundedRectangle)`, and hardcodes `mapPreviewHeight = 160`.
**Gap:** Design specifies edge-to-edge map at 9:4 aspect ratio. Inner clipShape produces dark double-rounded corner artifact.

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
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSRouteCard displayed WHEN card renders THEN map preview extends to all edges with zero inner padding", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSRouteCard displayed WHEN map preview renders THEN no inner clipShape exists, only outer LSCard clips corners", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN LSRouteCard at any width WHEN map height calculated THEN uses aspectRatio(9/4) not fixed height", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSRouteCard uses LSCard(padding: .zero)", "maps_to_ac": "AC-1", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/RouteCardGeometryTests/testMapPreviewEdgeToEdge" },
    { "id": "TC-2", "type": "test_criterion", "description": "Map preview view has no .clipShape modifier", "maps_to_ac": "AC-2", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/RouteCardGeometryTests/testNoInnerClipShape" },
    { "id": "TC-3", "type": "test_criterion", "description": "Map preview uses .aspectRatio(9.0/4.0) not fixed height", "maps_to_ac": "AC-3", "verify": "xcodebuild test -destination 'platform=iOS Simulator,name=iPhone 16' --only-testing:LaneShadowTests/RouteCardGeometryTests/testMapAspectRatioNineFour" }
  ]
}
-->
