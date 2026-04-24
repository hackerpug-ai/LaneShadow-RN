<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-03-android — BottomSheet + Toast + Modal molecules — Android
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=kotlin-implementer | reviewer=kotlin-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-03)

RUNTIME_COMMANDS:
  test:      cd android && ./gradlew test
  typecheck: cd android && ./gradlew :app:compileDebugKotlin
  lint:      cd android && ./gradlew detekt

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSBottomSheet (ModalBottomSheet with 3 detents, drag-to-dismiss, token surface), LSToast (4 status variants, auto-dismiss timed by motion.recipe.chatOverlayDismiss token), LSModal (center-aligned card from LSCard + LSText + LSButton) all render in the sandbox on Android with correct dark/light theme switching, motion recipe references documented, and onDismiss callbacks fire exactly once.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use ModalBottomSheet from androidx.compose.material3 (1.2+) for LSBottomSheet — wrap with LSGlassPanel/LSPanel for visible sheet surface.
- MUST derive detent heights from theme tokens — small ≈25%, medium ≈50%, large ≈90%; compute via LocalConfiguration.current.screenHeightDp * named fraction constants (no hardcoded px).
- MUST use LSButton atoms for all Modal action buttons.
- MUST reference 'motion.recipe.chatOverlayEnter' (sheet enter) and 'motion.recipe.chatOverlayDismiss' (toast auto-dismiss) — encode timing as named constants from theme.motion.* tokens.
- MUST use LSGlassPanel/LSPanel for sheet surface bg.
- MUST register all 3 molecules in sandbox covering all PRD variants.
- NEVER use raw AlertDialog from Material3 for LSModal — wrap content in Dialog { LSCard { … } }.
- NEVER hardcode dismiss delay for LSToast (e.g., delay(3000)) — derive from theme.motion.duration.chatOverlayDismiss.
- NEVER use literal corner radius for sheet top corners — use theme.radius.lg.
- NEVER inline raw Text() or Icon() in any of the 3 molecules.
- STRICTLY: drag-to-dismiss fires onDismiss exactly once; LSToast auto-dismiss uses token-derived duration; detekt 0; compileDebugKotlin BUILD SUCCESSFUL.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSBottomSheet medium detent — token surface + drag handle + enter motion (PRIMARY)
- [ ] AC-2: Small/large detents render at correct fractional heights
- [ ] AC-3: Drag-to-dismiss fires onDismiss exactly once
- [ ] AC-4: LSToast success — token color + token-derived auto-dismiss timing
- [ ] AC-5: All 4 toast status variants resolve distinct colors
- [ ] AC-6: LSModal title/body/action buttons compose from LS atoms
- [ ] AC-7: Theme toggle + atom-composition gate
- [ ] AC-8: 9+ stories registered for all 3 overlay molecules

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSBottomSheet medium detent — token surface + drag handle + motion [PRIMARY]
  GIVEN: developer presents LSBottomSheet(detent=BottomSheetDetent.Medium, onDismiss={}) { content }
  WHEN:  sheet appears
  THEN:  surface = color.surface.overlay; top corners = radius.lg; 36dp drag handle in color.border.subtle centered at top; enter animation timing references motion.recipe.chatOverlayEnter via named constant; ModalBottomSheet underneath
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest.medium_detent_uses_overlay_surface_and_enter_motion' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSBottomSheetTest.kt
  TEST_FUNCTION: medium_detent_uses_overlay_surface_and_enter_motion

AC-2: Small/large detents fractional heights
  GIVEN: developer renders LSBottomSheet with BottomSheetDetent.Small and Large
  WHEN:  each renders
  THEN:  small ≈ 25% of screenHeightDp; large ≈ 90%; computed from LocalConfiguration * named fraction constants — not hardcoded px
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest.small_and_large_detents_use_fractional_heights' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSBottomSheetTest.kt
  TEST_FUNCTION: small_and_large_detents_use_fractional_heights

AC-3: Drag-to-dismiss fires onDismiss exactly once
  GIVEN: LSBottomSheet presented with onDismiss={counter++}
  WHEN:  user swipes down via Compose UI test gesture
  THEN:  sheet animates closed; onDismiss fires exactly once; counter=1; second swipe after dismiss does not re-fire
  VERIFY: cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetUiTest.drag_to_dismiss_fires_on_dismiss_once' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSBottomSheetUiTest.kt
  TEST_FUNCTION: drag_to_dismiss_fires_on_dismiss_once

AC-4: LSToast success — token color + token-derived dismiss timing
  GIVEN: developer triggers LSToast.show(message="Saved", variant=ToastVariant.Success)
  WHEN:  toast appears
  THEN:  bg = color.status.success; text = color.content.onStatus via LSText; auto-dismiss timer = theme.motion.duration.chatOverlayDismiss via named constant; enter/exit uses motion recipe timing
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToastTest.success_variant_uses_status_color_and_token_dismiss_timing' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSToastTest.kt
  TEST_FUNCTION: success_variant_uses_status_color_and_token_dismiss_timing

AC-5: All 4 toast variants resolve distinct colors
  GIVEN: LSToast for default/success/warning/error
  WHEN:  background colors inspected via semantics
  THEN:  default=color.surface.overlay; success=color.status.success; warning=color.status.warning; error=color.status.error; all 4 distinct
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToastTest.all_four_status_variants_resolve_correct_colors' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSToastTest.kt
  TEST_FUNCTION: all_four_status_variants_resolve_correct_colors

AC-6: LSModal composes from LS atoms
  GIVEN: developer presents LSModal(title="Delete ride?", body="This cannot be undone.", primary=ModalAction.Destructive("Delete"){}, secondary=ModalAction.Ghost("Cancel"){})
  WHEN:  dialog appears
  THEN:  centered card uses LSCard surface; title LSText(typography.ui.title.md); body LSText(typography.ui.body.md); primary LSButton(.primary); secondary LSButton(.ghost); no Material3 AlertDialog or TextButton
  VERIFY: cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSModalTest.modal_composes_from_ls_atoms' 2>&1 | grep 'BUILD SUCCESSFUL'
  TDD_STATE: none
  TEST_FILE: android/app/src/test/java/com/laneshadow/ui/molecules/LSModalTest.kt
  TEST_FUNCTION: modal_composes_from_ls_atoms

AC-7: Theme toggle + atom-composition gate
  GIVEN: LSBottomSheet, LSToast, LSModal each rendered
  WHEN:  developer toggles light → dark via sandbox controller
  THEN:  all 3 switch to dark-mode resolved color.surface.overlay and color.status.* without restarting Composable; zero literal Color(0xFF…) in any of 3 files; zero hardcoded delay literals in LSToast.kt
  VERIFY: grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt | wc -l | grep -x '0'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-8: 9+ stories registered
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / BottomSheet, Toast, Modal
  THEN:  BottomSheet (Small/Medium/Large), Toast (Default/Success/Warning/Error), Modal (Default/Destructive Actions) — 9+ stories
  VERIFY: grep -c 'molecules.bottomsheet\|molecules.toast\|molecules.modal' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSBottomSheetStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSModalStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | LSBottomSheetTest.medium_detent_uses_overlay_surface_and_enter_motion passes | AC-1 |
| TC-2 | LSBottomSheetTest.small_and_large_detents_use_fractional_heights passes | AC-2 |
| TC-3 | LSBottomSheetUiTest.drag_to_dismiss_fires_on_dismiss_once passes (connected) | AC-3 |
| TC-4 | LSToastTest.success_variant_uses_status_color_and_token_dismiss_timing passes | AC-4 |
| TC-5 | LSToastTest.all_four_status_variants_resolve_correct_colors passes | AC-5 |
| TC-6 | LSModalTest.modal_composes_from_ls_atoms passes | AC-6 |
| TC-7 | Zero Color(0xFF across all 3 overlay molecule files | AC-7 |
| TC-8 | No hardcoded delay(3000)/(2000)/(4000) in LSToast.kt | AC-4 |
| TC-9 | 9+ story IDs across the 3 overlay story files | AC-8 |
| TC-10 | detekt + compileDebugKotlin succeed | AC-1 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt (NEW)
- android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSBottomSheetTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSToastTest.kt (NEW)
- android/app/src/test/java/com/laneshadow/ui/molecules/LSModalTest.kt (NEW)
- android/app/src/androidTest/java/com/laneshadow/ui/molecules/LSBottomSheetUiTest.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSBottomSheetStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSModalStory.kt (NEW)
- android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/MoleculesStories.kt (MODIFY)

writeProhibited:
- android/app/build.gradle.kts — no new deps without justification
- android/app/src/main/java/com/laneshadow/ui/atoms/** — atoms owned by Sprint 02/03
- tokens/** — tokens owned by Sprint 01/03
- ios/** — wrong platform

--------------------------------------------------------------------------------
READING LIST
--------------------------------------------------------------------------------

1. .spec/design/system/molecules/bottom-sheet/ [REQUIRED READING]
2. .spec/design/system/molecules/toast/ [REQUIRED READING]
3. .spec/design/system/molecules/modal/ [REQUIRED READING]
4. .spec/prds/v2/06-uc-mol.md (lines 58-72) — UC-MOL-03 acceptance criteria + motion recipe references
5. android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt — sheet bg; LSGlassPanelBackgroundColorKey
6. android/app/src/main/java/com/laneshadow/ui/atoms/LSButton.kt — ghost + primary for modal
7. android/app/src/main/java/com/laneshadow/ui/atoms/LSCard.kt — modal container surface

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/bottom-sheet/, .spec/design/system/molecules/toast/, .spec/design/system/molecules/modal/

Interaction notes:
- REQUIRED READING: all 3 design directories before implementing
- ModalBottomSheet from androidx.compose.material3 1.2+; SheetState with skipPartiallyExpanded=false enables 3 detents
- LSToast: LaunchedEffect(isVisible) with delay(theme.motion.duration.chatOverlayDismiss.toLong()) — never hardcode
- LSModal: Dialog { LSCard { … } } rather than AlertDialog — full atom-driven control

Pattern: ModalBottomSheet + LSGlassPanel surface; LaunchedEffect + AnimatedVisibility for toast; Dialog{} + LSCard for modal
Pattern source: android/app/src/main/java/com/laneshadow/ui/atoms/LSGlassPanel.kt
Anti-pattern: Do not use AlertDialog from Material3 for LSModal; do not delay(3000) in LSToast.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(0xFF' all 3 files = 0
Gate 2 (No hardcoded toast delay): grep 'delay(3000)\|delay(2000)\|delay(4000)' LSToast.kt = 0
Gate 3 (detekt): cd android && ./gradlew detekt exit 0
Gate 4 (compile): cd android && ./gradlew :app:compileDebugKotlin BUILD SUCCESSFUL
Gate 5 (tests): cd android && ./gradlew test BUILD SUCCESSFUL

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-android
Blocks:     UC-ORG-03-android, UC-ORG-05-android
Parallel:   UC-MOL-03-ios

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "LSBottomSheet medium detent — color.surface.overlay + radius.lg top corners + 36dp drag handle in color.border.subtle + motion.recipe.chatOverlayEnter via ModalBottomSheet", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest.medium_detent_uses_overlay_surface_and_enter_motion' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "Small and Large detents compute fractional heights (≈25% / ≈90%) from screenHeightDp using named fraction constants", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest.small_and_large_detents_use_fractional_heights' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "Drag-to-dismiss fires onDismiss exactly once — counter == 1 after one swipe-down gesture", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetUiTest.drag_to_dismiss_fires_on_dismiss_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "LSToast Success — color.status.success background; auto-dismiss timing references motion.duration.chatOverlayDismiss token via named constant", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToastTest.success_variant_uses_status_color_and_token_dismiss_timing' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "All 4 toast variants resolve correct distinct color.status.* / color.surface.overlay backgrounds", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToastTest.all_four_status_variants_resolve_correct_colors' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "LSModal composes from LSCard + LSText + LSButton; no Material3 AlertDialog or TextButton", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSModalTest.modal_composes_from_ls_atoms' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "Theme toggle renders correct dark overlay colors; zero Color(0xFF in any of the three molecule files", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt | wc -l | grep -x '0'" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "9+ stories across BottomSheet (3), Toast (4), Modal (2) in sandbox", "verify": "grep -c 'molecules.bottomsheet\\|molecules.toast\\|molecules.modal' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSBottomSheetStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSModalStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'" },
    { "id": "TC-1", "type": "test_criterion", "description": "LSBottomSheetTest.medium_detent_uses_overlay_surface_and_enter_motion passes", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest.medium_detent_uses_overlay_surface_and_enter_motion' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-2", "type": "test_criterion", "description": "Small/large detent fractional height test passes", "maps_to_ac": "AC-2", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetTest.small_and_large_detents_use_fractional_heights' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-3", "type": "test_criterion", "description": "Drag-to-dismiss connected Compose UI test passes", "maps_to_ac": "AC-3", "verify": "cd android && ./gradlew :app:connectedDebugAndroidTest --tests 'com.laneshadow.ui.molecules.LSBottomSheetUiTest.drag_to_dismiss_fires_on_dismiss_once' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-4", "type": "test_criterion", "description": "LSToast success variant test passes", "maps_to_ac": "AC-4", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToastTest.success_variant_uses_status_color_and_token_dismiss_timing' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-5", "type": "test_criterion", "description": "All 4 toast status color variants test passes", "maps_to_ac": "AC-5", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSToastTest.all_four_status_variants_resolve_correct_colors' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-6", "type": "test_criterion", "description": "Modal atom composition test passes", "maps_to_ac": "AC-6", "verify": "cd android && ./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.molecules.LSModalTest.modal_composes_from_ls_atoms' 2>&1 | grep 'BUILD SUCCESSFUL'" },
    { "id": "TC-7", "type": "test_criterion", "description": "Zero Color(0xFF literals across all 3 molecule files", "maps_to_ac": "AC-7", "verify": "grep -n 'Color(0xFF' android/app/src/main/java/com/laneshadow/ui/molecules/LSBottomSheet.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt android/app/src/main/java/com/laneshadow/ui/molecules/LSModal.kt | wc -l | grep -x '0'" },
    { "id": "TC-8", "type": "test_criterion", "description": "No hardcoded delay literal in LSToast.kt", "maps_to_ac": "AC-4", "verify": "grep -n 'delay(3000)\\|delay(2000)\\|delay(4000)' android/app/src/main/java/com/laneshadow/ui/molecules/LSToast.kt | wc -l | grep -x '0'" },
    { "id": "TC-9", "type": "test_criterion", "description": "9+ story IDs in story files", "maps_to_ac": "AC-8", "verify": "grep -c 'molecules.bottomsheet\\|molecules.toast\\|molecules.modal' android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSBottomSheetStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSToastStory.kt android/app/src/debug/java/com/laneshadow/sandbox/stories/molecules/LSModalStory.kt | awk -F: '{s+=$2} END {print s}' | awk '$1 >= 9'" },
    { "id": "TC-10", "type": "test_criterion", "description": "detekt + compileDebugKotlin succeed", "maps_to_ac": "AC-1", "verify": "cd android && ./gradlew detekt :app:compileDebugKotlin 2>&1 | grep 'BUILD SUCCESSFUL'" }
  ]
}
-->
