<!-- Template Version: 5.1.0 | Sprint: sprint-05-organisms | Type: FEATURE/TDD -->

================================================================================
TASK: UC-ORG-02-android — LSMapLayer organism (map-primary canvas with overlay slots) — Android Compose
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   300 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   07-uc-org.md (UC-ORG-02)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest'
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: 0/8 ACs complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSMapLayer renders the map-primary canvas with strict z-order (map → scrim → top/bottom overlays → bottomSheet → leadingDrawer → topBar) and per-slot WindowInsets/safe-area padding so every Navigator screen reuses one positioning solution; supports ScrimSpec, GlassOverlaySlot lists, DrawerSpec (motion.recipe.sidebarSlideIn via AnimatedVisibility), BottomSheetSpec (delegated to LSBottomSheet molecule), and an optional LSTopBar; 7 sandbox stories (Map Only, Map+TopBar, Map+TopOverlay, Map+BottomOverlay, Map+Scrim+Drawer, Map+Sheet, Full Stack) registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST stack children inside a single Box with z-order: map (bottom) → scrim → top/bottom overlays → bottomSheet → leadingDrawer → topBar (top).
- MUST apply WindowInsets.statusBars / WindowInsets.navigationBars / WindowInsets.systemBars to topBar, top/bottom overlays so each slot pays for its own safe-area.
- MUST animate leadingDrawer presentation via AnimatedVisibility(slideIn) using LaneShadowTheme.motion.recipe.sidebarSlideIn (no inline tween durations).
- MUST delegate bottomSheet to LSBottomSheet (UC-MOL-03) — never reproduce sheet drag/detent logic.
- MUST register all 7 stories with dotted ids organisms.maplayer.* and tier=ComponentTier.Organism.
- NEVER inline Color(0x...), TextStyle(, FontFamily(, or tween(<int>) literals in LSMapLayer.kt.
- NEVER place LSScrim above overlays — scrim must sit below all overlay content.
- NEVER reach into Convex/network/disk; LSMapLayer is data-agnostic and prop-only.
- STRICTLY detekt 0; compileDebugKotlin BUILD SUCCESSFUL; grep gate `grep -rn 'Color(0x\|TextStyle(\|FontFamily(\|tween(' android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt | wc -l` == 0.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSMapLayer renders full-screen LSMap with optional LSTopBar overlay (PRIMARY)
- [ ] AC-2: topOverlays slot stacks overlays below TopBar with safe-area
- [ ] AC-3: bottomOverlays slot anchors above bottom safe-area
- [ ] AC-4: ScrimSpec renders LSScrim above map but below overlays
- [ ] AC-5: leadingDrawer slides in via motion.recipe.sidebarSlideIn
- [ ] AC-6: bottomSheet delegates to LSBottomSheet with detent control
- [ ] AC-7: Z-order contract enforced (map < scrim < overlays < sheet < drawer < topBar)
- [ ] AC-8: 7 sandbox stories registered with dotted ids and ComponentTier.Organism

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: Map + TopBar renders with statusBarsPadding [PRIMARY]
  GIVEN: Developer composes LSMapLayer(map = LSMap(mode = MapMode.Preview, camera = c), topBar = LSTopBar(onMenuTap = {}, onNewTap = {}))
  WHEN:  Composable enters composition
  THEN:  LSMap fills the parent Box (Modifier.fillMaxSize); LSTopBar overlays at top with Modifier.statusBarsPadding; topBar test tag is the topmost child in the z-stack
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.map_with_topbar_renders_topbar_above_map' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt
  TEST_FUNCTION: map_with_topbar_renders_topbar_above_map

AC-2: topOverlays positioned below topBar with safe-area
  GIVEN: LSMapLayer(map = ..., topOverlays = listOf(GlassOverlaySlot(id = "greeting", content = { greetingOverlay() })))
  WHEN:  Composable enters composition
  THEN:  Overlay positioned with Modifier.statusBarsPadding (or below topBar if present) using Alignment.TopCenter; overlay z-order > scrim, < bottomSheet; semantics tag GlassOverlaySlot:greeting present
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.top_overlay_positions_below_topbar_with_safearea' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt
  TEST_FUNCTION: top_overlay_positions_below_topbar_with_safearea

AC-3: bottomOverlays anchor above navigation bar
  GIVEN: LSMapLayer(map = ..., bottomOverlays = listOf(GlassOverlaySlot(id = "chat", content = { LSChatInput(...) })))
  WHEN:  Composable enters composition
  THEN:  Overlay anchored Alignment.BottomCenter with Modifier.navigationBarsPadding + WindowInsets.ime padding; tag GlassOverlaySlot:chat present
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.bottom_overlay_anchors_above_navigation_bar' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt
  TEST_FUNCTION: bottom_overlay_anchors_above_navigation_bar

AC-4: scrim renders above map below overlays
  GIVEN: LSMapLayer(map = ..., scrim = ScrimSpec(opacity = 0.35f))
  WHEN:  Composable enters composition
  THEN:  LSScrim composable present in tree at z-index above LSMap and below any overlays; alpha resolved from LaneShadowTheme.colors.scrim with opacity multiplier 0.35
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.scrim_renders_above_map_below_overlays' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt
  TEST_FUNCTION: scrim_renders_above_map_below_overlays

AC-5: leadingDrawer slides in via sidebar recipe
  GIVEN: LSMapLayer(map = ..., leadingDrawer = DrawerSpec(content = { sessionsDrawerContent() }, onDismiss = {}))
  WHEN:  Composable enters composition with drawer toggling visible=true
  THEN:  AnimatedVisibility uses LaneShadowTheme.motion.recipe.sidebarSlideIn enter spec; drawer aligned Alignment.CenterStart; tap on scrim invokes onDismiss exactly once
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.leading_drawer_slides_in_via_sidebar_recipe' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt
  TEST_FUNCTION: leading_drawer_slides_in_via_sidebar_recipe

AC-6: bottomSheet delegates to LSBottomSheet
  GIVEN: LSMapLayer(map = ..., bottomSheet = BottomSheetSpec(content = { routeSheetContent() }, detent = SheetDetent.Medium, onDismiss = {}))
  WHEN:  Composable enters composition
  THEN:  LSBottomSheet molecule present in tree (tag LSBottomSheet); detent prop forwarded; onDismiss wired; LSMapLayer.kt does not re-implement drag-to-dismiss
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.bottom_sheet_delegates_to_lsbottomsheet' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt
  TEST_FUNCTION: bottom_sheet_delegates_to_lsbottomsheet

AC-7: Z-order contract enforced for full stack
  GIVEN: Full-stack LSMapLayer with map + scrim + topOverlay + bottomOverlay + bottomSheet + leadingDrawer + topBar
  WHEN:  Tree is captured
  THEN:  Children appear in z-order: LSMap (index 0) < LSScrim < topOverlays < bottomOverlays < LSBottomSheet < drawer < LSTopBar (last). Test inspects child indices via SemanticsNode tree.
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.organisms.LSMapLayerTest.z_order_contract_enforced_for_full_stack' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt
  TEST_FUNCTION: z_order_contract_enforced_for_full_stack

AC-8: 7 sandbox stories registered
  GIVEN: Developer opens debug sandbox app
  WHEN:  Navigating to Organisms / MapLayer
  THEN:  Stories Map Only, Map + TopBar, Map + Top Overlay, Map + Bottom Overlay, Map + Scrim + Drawer, Map + Sheet, Full Stack present with dotted ids organisms.maplayer.*
  VERIFY: grep -c 'organisms.maplayer' android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSMapLayerStory.kt | awk '$1 >= 7'
  TDD_STATE: none
  TEST_FILE: android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSMapLayerStory.kt
  TEST_FUNCTION: (grep gate)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSMap fills the entire Box and LSTopBar tag sits above it | AC-1 |
| TC-2 | Top overlay receives statusBarsPadding (or topBar bottom) as top padding | AC-2 |
| TC-3 | Bottom overlay anchored above navigation bar inset | AC-3 |
| TC-4 | LSScrim test tag present and z-order between map and overlays | AC-4 |
| TC-5 | Drawer enter spec equals motion.recipe.sidebarSlideIn (via test hook) | AC-5 |
| TC-6 | LSBottomSheet test tag present; LSMapLayer.kt has 0 Modifier.draggable/nestedScroll | AC-6 |
| TC-7 | Z-order from full-stack matches map<scrim<overlays<sheet<drawer<topBar | AC-7 |
| TC-8 | LSMapLayerStory.kt registers ≥7 stories with ComponentTier.Organism | AC-8 |
| TC-9 | LSMapLayer.kt source has 0 Color(0x/TextStyle(/FontFamily(/tween( | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayerSlots.kt (NEW — sealed slot types: GlassOverlaySlot, ScrimSpec, DrawerSpec, BottomSheetSpec)
- android/app/src/test/java/com/laneshadow/ui/organisms/LSMapLayerTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/LSMapLayerStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/organisms/OrganismStories.kt (MODIFY)

writeProhibited:
- android/app/src/main/java/com/laneshadow/ui/atoms/** — LSMap/LSScrim already shipped
- android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt — shipped Sprint 4
- tokens/**
- ios/**

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/prds/v2/concepts/uc-org-02-maplayer.html [REQUIRED READING — visual design source]
2. .spec/prds/v2/07-uc-org.md (UC-ORG-02, lines 59-90)
3. .spec/prds/v2/11-technical-requirements.md (LSMapLayer slot API)
4. android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSScrim.kt
6. android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt
7. android/app/src/main/java/com/laneshadow/ui/organisms/LSTopBar.kt (UC-ORG-01)
8. android/app/src/main/java/com/laneshadow/theme/LaneShadowTheme.kt

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/prds/v2/concepts/uc-org-02-maplayer.html, .spec/prds/v2/07-uc-org.md (UC-ORG-02)

Interaction notes:
- REQUIRED READING: .spec/prds/v2/concepts/uc-org-02-maplayer.html — extract z-order contract, slot composition, safe-area handling per slot
- Drawer scrim tap dismisses; bottom-sheet drag-to-dismiss owned by LSBottomSheet molecule; topBar always topmost so chips remain interactable over overlays
- Stable sealed classes: ScrimSpec(opacity), GlassOverlaySlot(id, content), DrawerSpec(content, onDismiss), BottomSheetSpec(content, detent, onDismiss)

Pattern: Single Box z-stack with WindowInsets-aware slots; all motion via LaneShadowTheme.motion.recipe.*
Pattern source: .spec/prds/v2/concepts/uc-org-02-maplayer.html
Anti-pattern: Per-screen reimplementation of map+overlay positioning with literal padding numbers.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

1. detekt 0
2. compileDebugKotlin BUILD SUCCESSFUL
3. testDebugUnitTest LSMapLayerTest all green
4. grep gate Color(0x/TextStyle(/FontFamily(/tween( == 0
5. story grep ≥ 7 LSMapLayer stories

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: UC-ORG-01-android (LSTopBar slot), UC-MOL-03-android (LSBottomSheet, shipped), UC-ATM-12-android (LSMap, shipped)
Blocks:     UC-ORG-05-android implicit (drawer slot consumer), Sprint 6 Navigator screens
Parallel:   UC-ORG-02-ios, UC-ORG-03-android, UC-ORG-04-android, UC-ORG-06-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "Map fills + TopBar with statusBarsPadding above", "verify": "gradle test --tests LSMapLayerTest.map_with_topbar_renders_topbar_above_map" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "topOverlays positioned below topBar with safe-area", "verify": "gradle test --tests LSMapLayerTest.top_overlay_positions_below_topbar_with_safearea" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "bottomOverlays anchor above navigation bar", "verify": "gradle test --tests LSMapLayerTest.bottom_overlay_anchors_above_navigation_bar" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "Scrim above map below overlays", "verify": "gradle test --tests LSMapLayerTest.scrim_renders_above_map_below_overlays" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "leadingDrawer AnimatedVisibility uses sidebarSlideIn", "verify": "gradle test --tests LSMapLayerTest.leading_drawer_slides_in_via_sidebar_recipe" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "bottomSheet delegates to LSBottomSheet", "verify": "gradle test --tests LSMapLayerTest.bottom_sheet_delegates_to_lsbottomsheet" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "Z-order map<scrim<overlays<sheet<drawer<topBar", "verify": "gradle test --tests LSMapLayerTest.z_order_contract_enforced_for_full_stack" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "7 sandbox stories registered", "verify": "grep -c 'organisms.maplayer' LSMapLayerStory.kt | awk '$1 >= 7'" },
    { "id": "TC-1", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "Map fills + topBar zIndex above", "verify": "compose test" },
    { "id": "TC-2", "type": "test_criterion", "maps_to_ac": "AC-2", "description": "Top overlay statusBarsPadding", "verify": "compose test" },
    { "id": "TC-3", "type": "test_criterion", "maps_to_ac": "AC-3", "description": "Bottom overlay above nav bar", "verify": "compose test" },
    { "id": "TC-4", "type": "test_criterion", "maps_to_ac": "AC-4", "description": "Scrim z-order between map and overlays", "verify": "compose test" },
    { "id": "TC-5", "type": "test_criterion", "maps_to_ac": "AC-5", "description": "Drawer motion spec is sidebarSlideIn", "verify": "compose test" },
    { "id": "TC-6", "type": "test_criterion", "maps_to_ac": "AC-6", "description": "No draggable/nestedScroll in LSMapLayer", "verify": "grep -n 'Modifier.draggable\\|nestedScroll' android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "maps_to_ac": "AC-7", "description": "Z-order list assertion via SemanticsNode children", "verify": "compose test" },
    { "id": "TC-8", "type": "test_criterion", "maps_to_ac": "AC-8", "description": "7 stories registered", "verify": "grep gate" },
    { "id": "TC-9", "type": "test_criterion", "maps_to_ac": "AC-1", "description": "No hardcoded color/typography/tween in LSMapLayer.kt", "verify": "grep -rn 'Color(0x\\|TextStyle(\\|FontFamily(\\|tween(' android/app/src/main/java/com/laneshadow/ui/organisms/LSMapLayer.kt | wc -l | xargs test 0 -eq" }
  ]
}
-->
