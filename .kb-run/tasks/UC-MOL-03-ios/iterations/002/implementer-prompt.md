# kb-run Implementer Prompt

Execution unit: `UC-MOL-03-ios`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-03-ios`
Role: `swift-implementer`
Start commit: `86d6f1c2adc3f674a8a948ccc36013d3ae65c139`
Review cycle: `002`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-03-ios`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md`. Keep scope limited to this task's overlay molecule and its tests.

## Objective

Fix the reviewer rejection from iteration `001`. The only blocker is `LSToast` timing: the dismiss recipe still hardcodes `5000` ms instead of deriving the auto-dismiss duration from the token-backed `motion.recipe.chatOverlayDismiss` contract.

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-03-ios-bottomsheet-toast-modal-molecules.md`
2. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-03-ios/iterations/001/reviewer-response.json`
3. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-03-ios/iterations/001/implementer-response.json`
4. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/06-uc-mol.md`
5. `/Users/justinrich/Projects/LaneShadow/tokens/semantic/motion.tokens.json`
6. `ios/LaneShadow/Views/Molecules/LSToast.swift`
7. `ios/LaneShadowTests/Molecules/LSToastTests.swift`
8. `ios/LaneShadow/Views/Atoms/LSButton.swift`
9. `ios/LaneShadow/Views/Atoms/LSText.swift`

## Scope

Write allowed:

- `ios/LaneShadow/Views/Molecules/LSToast.swift`
- `ios/LaneShadowTests/Molecules/LSToastTests.swift`
- `ai-specs/UC-MOL-03/ios-learnings.md`

Write prohibited:

- `ios/LaneShadow.xcodeproj/**`
- `ios/project.yml`
- `ios/LaneShadow/Views/Molecules/LSBottomSheet.swift`
- `ios/LaneShadow/Views/Molecules/LSModal.swift`
- `ios/LaneShadow/Sandbox/**`
- `tokens/**`
- `android/**`

## Reviewer Findings To Fix

1. `LSToast.dismissRecipe` hardcodes `visibleDurationMilliseconds: 5000`, which violates AC-5 because the dismiss duration must be derived from `motion.recipe.chatOverlayDismiss`.
2. `LSToastTests` encode the same wrong `5000` literal, so the current test suite passes even when the token contract is broken.

## Acceptance Requirements

1. Derive the toast auto-dismiss duration from the token-backed dismiss recipe rather than a copied literal.
2. Keep the named dismiss recipe as `motion.recipe.chatOverlayDismiss`.
3. Drive both the progress animation window and the `Task.sleep` auto-dismiss path from the corrected token-backed duration.
4. Strengthen the toast tests so they fail if the implementation falls back to `5000` again.
5. Do not regress the already-correct bottom-sheet, modal, story, or project-membership work from iteration `001`.

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadowTests/Molecules/LSToastTests.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToastTests`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `grep -n '5000' ios/LaneShadow/Views/Molecules/LSToast.swift ios/LaneShadowTests/Molecules/LSToastTests.swift | wc -l | xargs test 0 -eq`
- `grep -n 'asyncAfter(deadline: .now() +' ios/LaneShadow/Views/Molecules/LSToast.swift | wc -l | xargs test 0 -eq`

## Completion Contract

Return a JSON completion report and write it to the configured output file. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- RED/GREEN evidence for the toast timing fix
- explicit explanation of how the dismiss duration now resolves from the token-backed motion recipe
- explicit explanation of how the updated test would catch the previous `5000` ms regression
- any residual risks
