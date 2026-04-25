<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-02-ios — LSMapLayer organism (map-primary canvas with overlay slots) — iOS SwiftUI
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   300 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-02)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: 0/8 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSMapLayer renders a map-primary canvas on iOS that stacks — bottom to top — map → scrim → top/bottom overlays → bottomSheet → leadingDrawer → topBar, with each slot respecting its own safe-area padding. Slot API accepts LSMap, optional ScrimSpec, topOverlays[], bottomOverlays[], DrawerSpec, BottomSheetSpec, and LSTopBar. Seven sandbox stories (Map Only, Map+TopBar, Map+Top Overlay, Map+Bottom Overlay, Map+Scrim+Drawer, Map+Sheet, Full Stack) render in light + dark. Z-order and safe-area contracts asserted by tests.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST stack children in the z-order: map → scrim → topOverlays+bottomOverlays → bottomSheet → leadingDrawer → topBar (ZStack ordering asserted in tests).
- MUST compose ONLY from atoms (LSMap, LSScrim) + organism LSTopBar + molecules (LSBottomSheet) — no raw Rectangle overlays.
- MUST apply safeAreaInset / safeAreaPadding to each slot independently so screens do not re-implement positioning.
- MUST resolve drawer slide-in via motion.recipe.sidebarSlideIn token; bottom sheet enter uses LSBottomSheet molecule standard motion.
- MUST register all seven stories in OrganismStories.all with tier: .organism and ids organisms.maplayer.{map-only, map-topbar, map-top-overlay, map-bottom-overlay, map-scrim-drawer, map-sheet, full-stack}.
- MUST expose GlassOverlaySlot, DrawerSpec, BottomSheetSpec, ScrimSpec value types with `id: String` and `content: () -> AnyView` surfaces.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- NEVER inline scrim or drawer motion with literal .easeInOut(duration:) — reference motion.recipe tokens.
- NEVER use Font.system, Color(hex:), Color(red:), or .monospaced() in LSMapLayer.swift.
- NEVER fetch data or reach into Convex/networking.
- NEVER modify LSMap, LSScrim, LSTopBar, or LSBottomSheet source — consume as-is.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test TEST SUCCEEDED for LSMapLayerTests covering z-order, safe-area inset, and all seven stories; light + dark render without overlap regressions.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: Map + TopBar stacks correctly with top-bar under status bar (PRIMARY)
- [ ] AC-2: topOverlays render below top bar with safe-area padding preserved
- [ ] AC-3: bottomOverlays anchor above bottom safe-area
- [ ] AC-4: scrim renders above map and below overlays at specified opacity
- [ ] AC-5: leadingDrawer slides in via motion.recipe.sidebarSlideIn above scrim
- [ ] AC-6: bottomSheet anchors above bottom overlays via LSBottomSheet molecule
- [ ] AC-7: All seven stories registered and render under both themes
- [ ] AC-8: Atom-composition inspection gate (no banned primitives)

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Map + TopBar z-order + safe-area [PRIMARY]
  GIVEN: developer renders LSMapLayer(map: LSMap(mode: .preview, camera: c), topBar: LSTopBar(onMenuTap:{}, onNewTap:{}))
  WHEN:  view body resolves
  THEN:  ZStack contains LSMap at z=0 and LSTopBar at top z; top bar respects status-bar safe-area inset; no drawer or sheet present
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_map_plus_topbar_z_order_and_safe_area 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_map_plus_topbar_z_order_and_safe_area

AC-2: topOverlays preserve safe-area padding
  GIVEN: LSMapLayer with topOverlays: [GlassOverlaySlot(id: "greeting", content: { greetingOverlay })]
  WHEN:  view body resolves
  THEN:  greeting overlay renders aligned to top, below top-bar z, with safe-area top inset respected; id uniquely keyed in ZStack
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_top_overlays_render_with_safe_area_padding 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_top_overlays_render_with_safe_area_padding

AC-3: bottomOverlays anchor above safe-area
  GIVEN: LSMapLayer with bottomOverlays: [GlassOverlaySlot(id: "chat", content: { LSChatInput(...) })]
  WHEN:  view body resolves
  THEN:  chat overlay anchors above bottom safe-area inset; renders below bottomSheet z when both present
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_bottom_overlays_anchor_above_safe_area 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_bottom_overlays_anchor_above_safe_area

AC-4: scrim z between map and overlays
  GIVEN: LSMapLayer with scrim: ScrimSpec(opacity: 0.35)
  WHEN:  view body resolves
  THEN:  LSScrim atom renders directly above map and below any overlay slots at the specified opacity token
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_scrim_renders_above_map_below_overlays 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_scrim_renders_above_map_below_overlays

AC-5: leadingDrawer slide-in via motion token
  GIVEN: LSMapLayer with leadingDrawer: DrawerSpec(content: { LSSessionsDrawer(...) }, onDismiss: {})
  WHEN:  presented
  THEN:  drawer slides in from leading edge via motion.recipe.sidebarSlideIn token; renders above scrim and overlays; onDismiss triggered on scrim tap
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_leading_drawer_slide_in_motion_token 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_leading_drawer_slide_in_motion_token

AC-6: bottomSheet uses LSBottomSheet molecule
  GIVEN: LSMapLayer with bottomSheet: BottomSheetSpec(content: { LSRouteSheet(...) }, detent: .medium)
  WHEN:  presented
  THEN:  LSBottomSheet molecule anchors to bottom with .medium detent; renders above bottom overlays and below leadingDrawer z
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_bottom_sheet_uses_lsbottomsheet_molecule 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_bottom_sheet_uses_lsbottomsheet_molecule

AC-7: Seven stories registered
  GIVEN: developer opens the sandbox
  WHEN:  navigating to Organisms / MapLayer
  THEN:  stories Map Only, Map + TopBar, Map + Top Overlay, Map + Bottom Overlay, Map + Scrim + Drawer, Map + Sheet, Full Stack all present with tier: .organism and dotted ids; render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSMapLayerTests/test_all_seven_maplayer_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Organisms/LSMapLayerTests.swift
  TEST_FUNCTION: test_all_seven_maplayer_stories_registered

AC-8: Atom-composition gate
  GIVEN: LSMapLayer.swift source
  WHEN:  inspected
  THEN:  no Font.system, Color(hex:), Color(red:, .monospaced() occurrences
  VERIFY: grep -n 'Font.system\|Color(red:\|Color(hex:\|\.monospaced()' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_map_plus_topbar_z_order_and_safe_area passes | AC-1 |
| TC-2 | test_top_overlays_render_with_safe_area_padding passes | AC-2 |
| TC-3 | test_bottom_overlays_anchor_above_safe_area passes | AC-3 |
| TC-4 | test_scrim_renders_above_map_below_overlays passes | AC-4 |
| TC-5 | test_leading_drawer_slide_in_motion_token passes | AC-5 |
| TC-6 | test_bottom_sheet_uses_lsbottomsheet_molecule passes | AC-6 |
| TC-7 | test_all_seven_maplayer_stories_registered passes | AC-7 |
| TC-8 | No Font.system / .monospaced() / Color(hex:) in LSMapLayer.swift | AC-8 |
| TC-9 | swiftformat --lint exits 0 for LSMapLayer.swift | AC-8 |
| TC-10 | xcodebuild build BUILD SUCCEEDED | AC-7 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Organisms/LSMapLayer.swift (NEW)
- ios/LaneShadow/Views/Organisms/LSMapLayerSlots.swift (NEW — GlassOverlaySlot, ScrimSpec, DrawerSpec, BottomSheetSpec)
- ios/LaneShadowTests/Organisms/LSMapLayerTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/LSMapLayerStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Organisms/OrganismStories.swift (MODIFY — register MapLayer stories)
- ios/project.yml (MODIFY if needed; then run scripts/ios/generate-project.sh)

writeProhibited:
- ios/LaneShadow.xcodeproj/** — generated only
- ios/LaneShadow/Views/Atoms/** — atoms owned by prior sprints
- ios/LaneShadow/Views/Molecules/** — molecules owned by Sprint 4
- tokens/** — tokens owned by Sprint 01/03
- android/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-02-maplayer.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (lines 59-89) — UC-ORG-02 full spec and slot API
3. .spec/prds/v2/11-technical-requirements.md — LSMapLayer slot API and entity schemas
4. ios/LaneShadow/Views/Atoms/LSMap.swift [PRIMARY PATTERN] — map atom contract
5. ios/LaneShadow/Views/Atoms/LSScrim.swift — scrim atom with opacity token
6. ios/LaneShadow/Views/Molecules/LSBottomSheet.swift — bottom sheet molecule
7. ios/LaneShadow/Views/Organisms/LSTopBar.swift — top bar organism (from UC-ORG-01-ios)
8. tokens/platforms/swift/Sources/LaneShadowTheme/ — motion.recipe.sidebarSlideIn, elevation.overlay

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-02-maplayer.html, .spec/prds/v2/07-uc-org.md, .spec/prds/v2/11-technical-requirements.md

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-02-maplayer.html before implementing
- ZStack ordering is load-bearing — tests must assert ordering via accessibility identifier per slot layer (e.g. 'maplayer.map', 'maplayer.scrim', 'maplayer.topOverlay.<id>', 'maplayer.bottomOverlay.<id>', 'maplayer.bottomSheet', 'maplayer.drawer', 'maplayer.topBar')
- Each overlay slot applies its own safeAreaPadding(.top) or safeAreaPadding(.bottom) so screens pass pre-assembled content without offsets
- Drawer slide-in: .transition(.move(edge: .leading).combined(with: .opacity)) with animation pulled from motion.recipe.sidebarSlideIn
- Use .frame(maxWidth: .infinity, maxHeight: .infinity) so the map atom occupies the full canvas
- LSTopBar is optional — only render when non-nil; z is highest so status-bar readability is preserved

Pattern: Slot-based ZStack canvas with safe-area-aware presentation wrappers
Pattern source: ios/LaneShadow/Views/Molecules/LSBottomSheet.swift (for sheet slot delegation)
Anti-pattern: Do not re-implement bottom-sheet drag gestures inside LSMapLayer — delegate to LSBottomSheet. Do not implement scrim color via Color.black.opacity — use LSScrim atom.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No raw primitives): grep banned pattern list against LSMapLayer.swift = 0
Gate 2 (swiftformat): swiftformat --lint exit 0
Gate 3 (build): xcodebuild build BUILD SUCCEEDED
Gate 4 (tests): xcodebuild test TEST SUCCEEDED for LSMapLayerTests (z-order, safe-area, motion token, story registration)
Gate 5 (stories registered): OrganismStories.all contains all seven organisms.maplayer.* ids

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ORG-01-ios, UC-ATM-12-ios, UC-MOL-03-ios
Blocks:     UC-SCR-01..06-ios
Parallel:   UC-ORG-02-android, UC-ORG-03-ios, UC-ORG-04-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Map+TopBar z-order + safe-area inset", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_map_plus_topbar_z_order_and_safe_area" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "topOverlays safe-area preserved", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_top_overlays_render_with_safe_area_padding" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "bottomOverlays anchor above bottom safe-area", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_bottom_overlays_anchor_above_safe_area" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "scrim renders above map below overlays", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_scrim_renders_above_map_below_overlays" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "leadingDrawer uses motion.recipe.sidebarSlideIn", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_leading_drawer_slide_in_motion_token" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "bottomSheet uses LSBottomSheet molecule", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_bottom_sheet_uses_lsbottomsheet_molecule" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "all seven stories registered", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_all_seven_maplayer_stories_registered" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "test_map_plus_topbar_z_order_and_safe_area passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_map_plus_topbar_z_order_and_safe_area" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "test_top_overlays_render_with_safe_area_padding passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_top_overlays_render_with_safe_area_padding" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "test_bottom_overlays_anchor_above_safe_area passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_bottom_overlays_anchor_above_safe_area" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "test_scrim_renders_above_map_below_overlays passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_scrim_renders_above_map_below_overlays" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "test_leading_drawer_slide_in_motion_token passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_leading_drawer_slide_in_motion_token" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "test_bottom_sheet_uses_lsbottomsheet_molecule passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_bottom_sheet_uses_lsbottomsheet_molecule" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "test_all_seven_maplayer_stories_registered passes", "verify": "xcodebuild test -only-testing:LaneShadowTests/LSMapLayerTests/test_all_seven_maplayer_stories_registered" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-8", "description": "No banned primitives", "verify": "grep -n 'Font.system\\|Color(red:\\|Color(hex:\\|\\.monospaced()' ios/LaneShadow/Views/Organisms/LSMapLayer.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-9", "type": "test_criterion", "maps_to_ac": "AC-8", "description": "swiftformat --lint exits 0", "verify": "swiftformat --lint ios/LaneShadow/Views/Organisms/LSMapLayer.swift" },
    { "id": "TC-10", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "BUILD SUCCEEDED", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
