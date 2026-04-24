# kb-run Implementer Prompt

Execution unit: `UC-MOL-03-ios`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-ios`
Role: `swift-implementer`
Start commit: `6269d32539a0ac36ea59f23161231076be4158ec`
Review cycle: `001`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-ios`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Source `../../scripts/agent-worktree-env.sh` before running build/test commands so DerivedData and caches stay isolated to this worktree.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean task-scope worktree. Ignore only `.kb-run-sprint-codex/.state.json.sha256` if it changes during your session.
- Respect `RULES.md`. Keep scope limited to this task's overlay molecules, tests, stories, registry updates, and generated-project inputs.

## Objective

Implement `UC-MOL-03-ios` from scratch on this worktree base and satisfy the full task contract for:

- `LSBottomSheet`
- `LSToast`
- `LSModal`

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-03-ios-bottomsheet-toast-modal-molecules.md`
2. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/06-uc-mol.md`
3. `/Users/justinrich/Projects/LaneShadow/.spec/design/system/molecules/bottom-sheet/`
4. `/Users/justinrich/Projects/LaneShadow/.spec/design/system/molecules/toast/`
5. `/Users/justinrich/Projects/LaneShadow/.spec/design/system/molecules/modal/`
6. `ios/LaneShadow/Views/Atoms/LSButton.swift`
7. `ios/LaneShadow/Views/Atoms/LSGlassPanel.swift`
8. `ios/LaneShadow/Views/Atoms/LSText.swift`
9. `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift`
10. Any existing Sprint 04 overlay-adjacent molecules or stories needed for pattern reuse

## Scope

Write allowed:

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
- `ai-specs/UC-MOL-03/ios-learnings.md`

Write prohibited:

- `ios/LaneShadow.xcodeproj/**` directly; if project membership changes, update `ios/project.yml` and run `scripts/ios/generate-project.sh`
- `ios/LaneShadow/Views/Atoms/**`
- `tokens/**`
- `android/**`

## Key Contract Reminders

1. `LSBottomSheet` must use native SwiftUI `.sheet` with `.presentationDetents([.fraction(0.25), .fraction(0.5), .fraction(0.9)])`; do not build a custom drag gesture sheet.
2. `LSToast` must use `motion.recipe.chatOverlayEnter` and `motion.recipe.chatOverlayDismiss` token timing. No hardcoded `2.0`/`3.0` style literals.
3. `LSModal` must compose title/body through `LSText` and actions through `LSButton(.destructive/.ghost)`.
4. Overlay background must resolve through `color.surface.overlay`.
5. Story registration is part of the contract.
6. No raw `Text`, `Button`, `Color`, `Font.system`, `foregroundColor(`, or direct `.pbxproj` edits.

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift ios/LaneShadowTests/Molecules/LSBottomSheetTests.swift ios/LaneShadowTests/Molecules/LSToastTests.swift ios/LaneShadowTests/Molecules/LSModalTests.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSBottomSheetTests/test_small_detent_uses_overlay_surface_tokens -only-testing:LaneShadowTests/LSBottomSheetTests/test_medium_and_large_detents_resolve_correct_fractions -only-testing:LaneShadowTests/LSBottomSheetTests/test_drag_dismiss_fires_ondismiss_once -only-testing:LaneShadowTests/LSToastTests/test_all_four_variants_resolve_status_tokens_and_motion_recipe -only-testing:LaneShadowTests/LSToastTests/test_auto_dismiss_fires_after_motion_recipe_duration -only-testing:LaneShadowTests/LSModalTests/test_modal_composes_button_atoms_and_secondary_dismisses -only-testing:LaneShadowTests/LSBottomSheetTests/test_overlay_molecule_stories_registered`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSBottomSheet.swift ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadow/Views/Molecules/LSModal.swift | wc -l | xargs test 0 -eq`
- `grep -n 'asyncAfter(deadline: .now() +' ios/LaneShadow/Views/Molecules/LSToast.swift | wc -l | xargs test 0 -eq`

## Completion Contract

Write a JSON completion report to:

- `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-ios/implementer_response.json`

Also print the same JSON in your final response. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- explicit RED/GREEN evidence summary
- whether `ios/project.yml` and generated project files changed
- any residual risks or known limitations
