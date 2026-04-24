# Reviewer Packet: UC-MOL-03-ios

Execution unit: `UC-MOL-03-ios`
Task file: `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-03-ios-bottomsheet-toast-modal-molecules.md`
Base commit: `6269d32539a0ac36ea59f23161231076be4158ec`
Candidate commit: `86d6f1c2adc3f674a8a948ccc36013d3ae65c139`
Checkpoint branch: `kb-run/sprint-04-UC-MOL-03-ios`

## Scope

- `ai-specs/UC-MOL-03/ios-learnings.md`
- `ios/LaneShadow/Views/Molecules/LSBottomSheet.swift`
- `ios/LaneShadow/Views/Molecules/LSToast.swift`
- `ios/LaneShadow/Views/Molecules/LSModal.swift`
- `ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift`
- `ios/LaneShadowTests/Molecules/LSToastTests.swift`
- `ios/LaneShadowTests/Molecules/LSModalTests.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSBottomSheetStory.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSToastStory.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSModalStory.swift`
- `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift`
- `ios/project.yml`
- `ios/LaneShadow.xcodeproj/project.pbxproj`

## Task Requirements

- AC-1: `LSBottomSheet` small detent presents with overlay token surface, radius, subtle 36pt handle, and `PresentationDetent.fraction(0.25)`.
- AC-2: Medium and large bottom-sheet detents resolve `0.5` and `0.9`.
- AC-3: Drag-to-dismiss fires `onDismiss` exactly once.
- AC-4: `LSToast` default, success, warning, and error variants resolve the required status tokens and enter motion recipe.
- AC-5: `LSToast` auto-dismisses using the `motion.recipe.chatOverlayDismiss` duration, not a hardcoded literal.
- AC-6: `LSModal` composes title/body with `LSText` and actions with `LSButton` destructive/ghost variants.
- AC-7: Overlay molecules stay token-driven in dark theme and avoid literal color/font shortcuts.
- AC-8: Sandbox stories are registered for all three overlay molecules.

## Validation Evidence

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift ios/LaneShadowTests/Molecules/LSToastTests.swift ios/LaneShadowTests/Molecules/LSModalTests.swift` -> pass
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` -> pass
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_small_detent_uses_overlay_surface_tokens -only-testing:LaneShadowTests/LSBottomSheetTests/test_medium_and_large_detents_resolve_correct_fractions -only-testing:LaneShadowTests/LSBottomSheetTests/test_drag_dismiss_fires_ondismiss_once -only-testing:LaneShadowTests/LSToastTests/test_all_four_variants_resolve_status_tokens_and_motion_recipe -only-testing:LaneShadowTests/LSToastTests/test_auto_dismiss_fires_after_motion_recipe_duration -only-testing:LaneShadowTests/LSModalTests/test_modal_composes_button_atoms_and_secondary_dismisses -only-testing:LaneShadowTests/LSBottomSheetTests/test_overlay_molecule_stories_registered` -> pass
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` -> pass after one simulator reset and rerun
- `grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift | wc -l | xargs test 0 -eq` -> pass
- `grep -n 'asyncAfter(deadline: .now() +' ios/LaneShadow/Views/Molecules/LSToast.swift | wc -l | xargs test 0 -eq` -> pass

## Candidate Summary

- Added native SwiftUI `LSBottomSheet`, `LSToast`, and `LSModal` molecules with token-backed overlay styling and motion helpers.
- Added focused molecule tests plus sandbox stories for bottom sheet, toast, and modal, and registered them in `MoleculesStories.swift`.
- Updated `ios/project.yml` and regenerated `ios/LaneShadow.xcodeproj/project.pbxproj` to include the new source, story, and test files.

## Residual Risk

- The first full-suite `xcodebuild test` attempt hit a simulator launch preflight Busy error before passing on the rerun after `xcrun simctl shutdown all`. Treat that as an environment watch item unless the code suggests a real overlay regression.

## Review Instructions

1. Review the exact diff with `git diff 6269d32539a0ac36ea59f23161231076be4158ec..86d6f1c2adc3f674a8a948ccc36013d3ae65c139`.
2. Read every changed file in full, with extra scrutiny on `LSBottomSheet.swift`, `LSToast.swift`, `LSModal.swift`, and the molecule tests.
3. Confirm the generated project change is only the expected XcodeGen output from `ios/project.yml`.
4. Decide whether the simulator Busy failure is environmental only or evidence of a product-level flake that should block approval.
5. Return only JSON matching the required reviewer verdict schema.
