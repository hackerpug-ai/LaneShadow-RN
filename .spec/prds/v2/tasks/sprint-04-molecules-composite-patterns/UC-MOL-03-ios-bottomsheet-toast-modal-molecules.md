<!-- Template Version: 5.1.0 | Sprint: sprint-04-molecules-composite-patterns | Type: FEATURE/TDD -->

================================================================================
TASK: UC-MOL-03-ios — BottomSheet + Toast + Modal molecules — iOS
================================================================================

TASK_TYPE:  FEATURE
STATUS:     Backlog
PRIORITY:   P1
EFFORT:     L
AGENT:      implementer=swift-implementer | reviewer=swift-reviewer
ESTIMATE:   240 min
SPRINT:     [SPRINT.md](./SPRINT.md)
PRD_REFS:   06-uc-mol.md (UC-MOL-03)

RUNTIME_COMMANDS:
  test:      cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  typecheck: cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'
  lint:      swiftformat --lint ios/LaneShadow/

PROGRESS: AC-1 none · 0/8 complete

--------------------------------------------------------------------------------
OUTCOME
--------------------------------------------------------------------------------

LSBottomSheet, LSToast, LSModal render on iOS with token-driven surfaces, motion-recipe enter/exit animations, presentationDetents detent support, auto-dismiss timing from motion tokens, onDismiss callback on drag-to-dismiss, theme parity, and all variant stories registered.

--------------------------------------------------------------------------------
🚫 CRITICAL CONSTRAINTS
--------------------------------------------------------------------------------

- MUST use SwiftUI .sheet with .presentationDetents for LSBottomSheet — do not build custom drag-gesture sheet.
- MUST resolve detent percentages (small ≈25%, medium ≈50%, large ≈90%) using PresentationDetent.fraction.
- MUST compose LSModal buttons exclusively from LSButton atoms (.destructive, .ghost).
- MUST animate LSToast enter/exit using motion.recipe.chatOverlayEnter/chatOverlayDismiss tokens.
- MUST auto-dismiss LSToast using motion.recipe.chatOverlayDismiss duration — no hardcoded 3.0/2.0 literals.
- MUST resolve overlay background via color.surface.overlay token.
- MUST register stories.
- NEVER build LSBottomSheet as raw ZStack-overlay with manual drag — use presentationDetents.
- NEVER inline literal animation durations.
- NEVER use raw Text/Button/Color in LSModal body — compose from LSText and LSButton.
- NEVER hand-edit ios/LaneShadow.xcodeproj/project.pbxproj.
- STRICTLY: swiftformat --lint exits 0; xcodebuild test exits TEST SUCCEEDED.

--------------------------------------------------------------------------------
DONE WHEN
--------------------------------------------------------------------------------

- [ ] AC-1: LSBottomSheet small detent presents with overlay tokens (PRIMARY)
- [ ] AC-2: Medium and large detents resolve correct fractions
- [ ] AC-3: Drag-to-dismiss fires onDismiss exactly once
- [ ] AC-4: LSToast all 4 status variants resolve color tokens with motion recipe
- [ ] AC-5: LSToast auto-dismisses after motion recipe duration
- [ ] AC-6: LSModal renders atom-composed buttons + correct typography
- [ ] AC-7: Theme toggle: all overlays render dark variants; atom-composition gate
- [ ] AC-8: Sandbox stories registered for all 3 overlay molecules

--------------------------------------------------------------------------------
ACCEPTANCE CRITERIA
--------------------------------------------------------------------------------

AC-1: LSBottomSheet small detent presents with overlay surface tokens [PRIMARY]
  GIVEN: developer calls LSBottomSheet(detent: .small) { content } and presents it
  WHEN:  sheet appears
  THEN:  background = color.surface.overlay; top corners = radius.lg; 36pt drag handle in color.border.subtle; PresentationDetent.fraction(0.25); enter animation references motion.recipe.chatOverlayEnter
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_small_detent_uses_overlay_surface_tokens 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift
  TEST_FUNCTION: test_small_detent_uses_overlay_surface_tokens

AC-2: Medium and large detents resolve correct fractions
  GIVEN: developer presents LSBottomSheet with detent: .medium and .large separately
  WHEN:  each appears
  THEN:  medium = PresentationDetent.fraction(0.5); large = PresentationDetent.fraction(0.9); both retain overlay surface tokens
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_medium_and_large_detents_resolve_correct_fractions 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift
  TEST_FUNCTION: test_medium_and_large_detents_resolve_correct_fractions

AC-3: Drag-to-dismiss fires onDismiss exactly once
  GIVEN: LSBottomSheet presented with onDismiss closure; user swipes down
  WHEN:  dismiss gesture completes
  THEN:  sheet dismisses; onDismiss fires exactly once
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_drag_dismiss_fires_ondismiss_once 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift
  TEST_FUNCTION: test_drag_dismiss_fires_ondismiss_once

AC-4: LSToast all 4 status variants resolve color tokens
  GIVEN: developer renders LSToast for default, success, warning, error
  WHEN:  each toast resolves
  THEN:  default=color.surface.overlay; success=color.status.success; warning=color.status.warning; error=color.status.error; enter uses motion.recipe.chatOverlayEnter; auto-dismiss from motion.recipe.chatOverlayDismiss; no hardcoded literals
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToastTests/test_all_four_variants_resolve_status_tokens_and_motion_recipe 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSToastTests.swift
  TEST_FUNCTION: test_all_four_variants_resolve_status_tokens_and_motion_recipe

AC-5: LSToast auto-dismisses on schedule
  GIVEN: developer calls LSToast.show(message: "Saved", variant: .success)
  WHEN:  chatOverlayDismiss timing window elapses
  THEN:  toast exit animation fires; toast removed from view hierarchy
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToastTests/test_auto_dismiss_fires_after_motion_recipe_duration 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSToastTests.swift
  TEST_FUNCTION: test_auto_dismiss_fires_after_motion_recipe_duration

AC-6: LSModal renders atom-composed buttons + typography
  GIVEN: developer instantiates LSModal(title: "Delete ride?", body: "This cannot be undone.", primary: .destructive("Delete") { }, secondary: .ghost("Cancel") { })
  WHEN:  modal appears
  THEN:  centered card with title LSText(typography.ui.title.md); body LSText(typography.ui.body.md); primary LSButton(.destructive); secondary LSButton(.ghost); secondary tap fires action once and dismisses
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSModalTests/test_modal_composes_button_atoms_and_secondary_dismisses 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSModalTests.swift
  TEST_FUNCTION: test_modal_composes_button_atoms_and_secondary_dismisses

AC-7: Theme toggle + atom-composition gate
  GIVEN: sandbox app with theme toggled to dark
  WHEN:  developer opens BottomSheet, Toast, Modal stories
  THEN:  all 3 resolve dark-variant token values; no Color(hex:) or Font.system in source
  VERIFY: grep -n 'Color(red:\|Color(hex:\|Font.system\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift | wc -l | xargs test 0 -eq
  TDD_STATE: none
  TEST_FILE: (grep gate)
  TEST_FUNCTION: (build-time invariant)

AC-8: Sandbox stories registered
  GIVEN: developer opens sandbox
  WHEN:  navigating to Molecules / BottomSheet, Toast, Modal
  THEN:  BottomSheet stories Small/Medium/Large; Toast stories Default/Success/Warning/Error; Modal story with destructive+ghost buttons — all present, render under both themes
  VERIFY: xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_overlay_molecule_stories_registered 2>&1 | grep 'TEST SUCCEEDED'
  TDD_STATE: none
  TEST_FILE: ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift
  TEST_FUNCTION: test_overlay_molecule_stories_registered

--------------------------------------------------------------------------------
TEST CRITERIA
--------------------------------------------------------------------------------

| ID | Statement | Maps to AC |
|----|-----------|------------|
| TC-1 | test_small_detent_uses_overlay_surface_tokens passes | AC-1 |
| TC-2 | test_medium_and_large_detents_resolve_correct_fractions passes | AC-2 |
| TC-3 | test_drag_dismiss_fires_ondismiss_once passes | AC-3 |
| TC-4 | test_all_four_variants_resolve_status_tokens_and_motion_recipe passes | AC-4 |
| TC-5 | test_auto_dismiss_fires_after_motion_recipe_duration passes | AC-5 |
| TC-6 | No hardcoded asyncAfter literal duration in LSToast source | AC-5 |
| TC-7 | test_modal_composes_button_atoms_and_secondary_dismisses passes | AC-6 |
| TC-8 | No literal hex/Font.system in any of 3 overlay molecule sources | AC-7 |
| TC-9 | test_overlay_molecule_stories_registered passes | AC-8 |
| TC-10 | swiftformat --lint exits 0 | AC-7 |
| TC-11 | xcodebuild build BUILD SUCCEEDED | AC-8 |

--------------------------------------------------------------------------------
SCOPE
--------------------------------------------------------------------------------

writeAllowed:
- ios/LaneShadow/Views/Molecules/LSBottomSheet.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSToast.swift (NEW)
- ios/LaneShadow/Views/Molecules/LSModal.swift (NEW)
- ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSToastTests.swift (NEW)
- ios/LaneShadowTests/Molecules/LSModalTests.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSBottomSheetStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSToastStory.swift (NEW)
- ios/LaneShadow/Sandbox/Stories/Molecules/LSModalStory.swift (NEW)
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

1. .spec/design/system/molecules/bottom-sheet/ [REQUIRED READING]
2. .spec/design/system/molecules/toast/ [REQUIRED READING]
3. .spec/design/system/molecules/modal/ [REQUIRED READING]
4. .spec/prds/v2/06-uc-mol.md (lines 101-160) — UC-MOL-03 acceptance criteria, motion recipe references
5. ios/LaneShadow/Views/Atoms/LSButton.swift (1-80) — destructive + ghost variants for modal
6. ios/LaneShadow/Views/Atoms/LSGlassPanel.swift — surface atom pattern
7. ios/LaneShadow/Views/Atoms/LSText.swift — title/body typography

--------------------------------------------------------------------------------
DESIGN
--------------------------------------------------------------------------------

References: .spec/design/system/molecules/bottom-sheet/, .spec/design/system/molecules/toast/, .spec/design/system/molecules/modal/

Interaction notes:
- REQUIRED READING: all 3 design directories before implementing
- Use SwiftUI .presentationDetents([.fraction(0.25), .fraction(0.5), .fraction(0.9)]) for LSBottomSheet — native iOS 16+ API
- LSToast auto-dismiss: Task { try await Task.sleep(for: .seconds(motionRecipeDuration)) } on @MainActor — duration from theme tokens
- LSModal: SwiftUI .sheet with .presentationBackground(.clear) for center-anchored over dimmed overlay

Pattern: presentationDetents for BottomSheet; offset animation overlay for Toast; .sheet + presentationBackground(.clear) for Modal
Pattern source: ios/LaneShadow/Views/Atoms/LSGlassPanel.swift
Anti-pattern: Do not build LSBottomSheet as raw ZStack with DragGesture — use presentationDetents for accessibility and system behavior.

--------------------------------------------------------------------------------
AGENT INSTRUCTIONS (TDD Flow)
--------------------------------------------------------------------------------

RED → GREEN → REFACTOR per AC.

--------------------------------------------------------------------------------
EVIDENCE GATES
--------------------------------------------------------------------------------

Gate 1 (No literal colors): grep 'Color(hex:\|Font.system' all 3 files = 0
Gate 2 (No hardcoded toast duration): grep 'asyncAfter(deadline: .now() +' LSToast.swift = 0
Gate 3 (swiftformat): swiftformat --lint exit 0
Gate 4 (build): xcodebuild build BUILD SUCCEEDED
Gate 5 (tests): xcodebuild test TEST SUCCEEDED

--------------------------------------------------------------------------------
DEPENDENCIES
--------------------------------------------------------------------------------

Depends on: ALIGN-03-ios
Blocks:     UC-ORG-03-ios, UC-ORG-05-ios
Parallel:   UC-MOL-03-android

================================================================================

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    { "id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN LSBottomSheet(detent:.small){content} WHEN presented THEN color.surface.overlay; radius.lg top; 36pt drag handle in color.border.subtle; PresentationDetent.fraction(0.25); chatOverlayEnter animation", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_small_detent_uses_overlay_surface_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN LSBottomSheet medium and large WHEN presented THEN PresentationDetent.fraction(0.5) and (0.9); overlay surface preserved", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_medium_and_large_detents_resolve_correct_fractions 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN presented LSBottomSheet WHEN swiped down THEN dismisses; onDismiss fires once", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_drag_dismiss_fires_ondismiss_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN all four LSToast variants WHEN rendered THEN each resolves correct color.status.* token; chatOverlayEnter animation; chatOverlayDismiss duration; no hardcoded literals", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToastTests/test_all_four_variants_resolve_status_tokens_and_motion_recipe 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN LSToast.show WHEN motion recipe duration elapses THEN exit animation fires and toast removed", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToastTests/test_auto_dismiss_fires_after_motion_recipe_duration 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN LSModal(title:body:primary:secondary:) WHEN presented THEN LSText title.md; LSText body.md; LSButton(.destructive); LSButton(.ghost); secondary tap fires once and dismisses", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSModalTests/test_modal_composes_button_atoms_and_secondary_dismisses 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN compiled overlay sources WHEN inspected THEN no Color(hex:)/Font.system literals; dark theme renders correctly via tokens", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift | wc -l | xargs test 0 -eq" },
    { "id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN sandbox WHEN navigating to Molecules/BottomSheet, Toast, Modal THEN all variant stories present under both themes", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_overlay_molecule_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-1", "type": "test_criterion", "description": "test_small_detent_uses_overlay_surface_tokens passes", "maps_to_ac": "AC-1", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_small_detent_uses_overlay_surface_tokens 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-2", "type": "test_criterion", "description": "test_medium_and_large_detents_resolve_correct_fractions passes", "maps_to_ac": "AC-2", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_medium_and_large_detents_resolve_correct_fractions 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-3", "type": "test_criterion", "description": "test_drag_dismiss_fires_ondismiss_once passes", "maps_to_ac": "AC-3", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_drag_dismiss_fires_ondismiss_once 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-4", "type": "test_criterion", "description": "test_all_four_variants_resolve_status_tokens_and_motion_recipe passes", "maps_to_ac": "AC-4", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToastTests/test_all_four_variants_resolve_status_tokens_and_motion_recipe 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-5", "type": "test_criterion", "description": "test_auto_dismiss_fires_after_motion_recipe_duration passes", "maps_to_ac": "AC-5", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToastTests/test_auto_dismiss_fires_after_motion_recipe_duration 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-6", "type": "test_criterion", "description": "No hardcoded asyncAfter literal duration in LSToast", "maps_to_ac": "AC-5", "verify": "grep -n 'asyncAfter(deadline: .now() +' ios/LaneShadow/Views/Molecules/LSToast.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-7", "type": "test_criterion", "description": "test_modal_composes_button_atoms_and_secondary_dismisses passes", "maps_to_ac": "AC-6", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSModalTests/test_modal_composes_button_atoms_and_secondary_dismisses 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-8", "type": "test_criterion", "description": "No literal hex or Font.system in overlay molecule sources", "maps_to_ac": "AC-7", "verify": "grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift | wc -l | xargs test 0 -eq" },
    { "id": "TC-9", "type": "test_criterion", "description": "test_overlay_molecule_stories_registered passes", "maps_to_ac": "AC-8", "verify": "xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_overlay_molecule_stories_registered 2>&1 | grep 'TEST SUCCEEDED'" },
    { "id": "TC-10", "type": "test_criterion", "description": "swiftformat --lint exits 0", "maps_to_ac": "AC-7", "verify": "swiftformat --lint ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift" },
    { "id": "TC-11", "type": "test_criterion", "description": "xcodebuild build BUILD SUCCEEDED", "maps_to_ac": "AC-8", "verify": "cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' 2>&1 | grep 'BUILD SUCCEEDED'" }
  ]
}
-->
