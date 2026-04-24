# kb-run Implementer Prompt

Execution unit: `UC-MOL-01-ios`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-01-ios`
Role: `swift-implementer`
Start commit: `13eeac25b48a66e97ba6265bceca4ec61dbe0b0f`
Review cycle: `003`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-01-ios`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md` and keep scope limited to this task's iOS molecule, test, story, and project-generation files.

## Objective

Remediate reviewer cycle 2 for `UC-MOL-01-ios` without regressing the approved implementation behavior:

- keep `LSContentCard` and `LSListRow` implementation contract intact unless a minimal code change is necessary to make public-surface tests possible
- rewrite AC-1 through AC-4 tests so they prove hosted/rendered behavior rather than helper methods or stored properties
- capture real RED evidence for the revised tests
- produce a valid screenshot of the actual molecule UI, not the simulator home screen

## Required Reading

Read these before editing:

1. `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-01-ios-card-listrow-molecules.md`
2. `.kb-run/tasks/UC-MOL-01-ios/iterations/002/reviewer-response.json`
3. `.kb-run/tasks/UC-MOL-01-ios/iterations/002/implementer-response.json`
4. `.spec/design/system/molecules/content-card/`
5. `.spec/design/system/molecules/list-row/`
6. `.spec/prds/v2/06-uc-mol.md`
7. `ios/LaneShadow/Views/Molecules/LSContentCard.swift`
8. `ios/LaneShadow/Views/Molecules/LSListRow.swift`
9. `ios/LaneShadowTests/Molecules/LSContentCardTests.swift`
10. `ios/LaneShadowTests/Molecules/LSListRowTests.swift`
11. `ios/LaneShadow/Views/Atoms/LSCard.swift`
12. `ios/LaneShadow/Views/Atoms/LSText.swift`
13. `ios/LaneShadow/Views/Atoms/LSAvatar.swift`
14. `ios/LaneShadow/Views/Atoms/LSIcon.swift`
15. `ios/LaneShadow/Views/Atoms/LSDivider.swift`
16. `ios/LaneShadow/Views/Atoms/Switch.swift`

## Scope

Write allowed:

- `ios/LaneShadow/Views/Molecules/LSContentCard.swift`
- `ios/LaneShadow/Views/Molecules/LSListRow.swift`
- `ios/LaneShadowTests/Molecules/LSContentCardTests.swift`
- `ios/LaneShadowTests/Molecules/LSListRowTests.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSContentCardStory.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSListRowStory.swift`
- `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift`
- `ios/project.yml`
- `ai-specs/UC-MOL-01/ios-learnings.md`

Write prohibited:

- `ios/LaneShadow.xcodeproj/**` directly; if project membership changes, update `ios/project.yml` and run `scripts/ios/generate-project.sh`
- `ios/LaneShadow/Views/Atoms/**`
- `tokens/**`
- `android/**`

## Reviewer Findings To Fix

1. `LSContentCardTests.test_default_render_uses_surface_card_tokens` exists but still checks helper/token accessors and stored properties instead of proving rendered `LSCard`/`LSText` composition.
2. `LSContentCardTests.test_action_footer_slot_renders_below_metadata` reads `@Environment`-backed internals outside a hosted view and does not prove metadata-to-footer ordering or absence of extra gap when actions are missing.
3. `LSListRowTests.test_layout_tokens_and_minimum_touch_target` still checks helper methods and stored properties instead of rendered spacing, chevron composition, and actual 44pt touch-target behavior.
4. `LSListRowTests.test_ontap_fires_once_and_no_highlight_without_handler` calls `performPrimaryAction()` directly and uses helper assertions instead of exercising the public interaction surface.
5. The screenshot artifact from iteration 002 is invalid because it shows only the simulator home screen.
6. The prior implementer report lacked explicit RED-phase evidence.

## Acceptance Requirements

Implement all ACs and TCs from the task file. The critical remediation targets are:

1. AC-1 through AC-4 must be verified through hosted/rendered SwiftUI behavior or public accessibility/UI surface checks, not helper functions or direct method calls.
2. Avoid SwiftUI runtime warnings caused by reading environment-backed properties outside a hosted view.
3. Keep AC-5 and AC-6 green.
4. Capture a real screenshot of the relevant molecule UI/story surface.
5. Include explicit RED evidence for the rewritten tests in the completion report.

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift ios/LaneShadowTests/Molecules/LSContentCardTests.swift ios/LaneShadowTests/Molecules/LSListRowTests.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSContentCardTests/test_default_render_uses_surface_card_tokens -only-testing:LaneShadowTests/LSContentCardTests/test_action_footer_slot_renders_below_metadata -only-testing:LaneShadowTests/LSListRowTests/test_layout_tokens_and_minimum_touch_target -only-testing:LaneShadowTests/LSListRowTests/test_ontap_fires_once_and_no_highlight_without_handler -only-testing:LaneShadowTests/LSContentCardTests/test_all_ten_stories_registered`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift | wc -l | xargs test 0 -eq`

## Completion Contract

Return a JSON completion report and write it to the configured output file. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- explicit RED/GREEN evidence summary for the TDD flow
- explanation of how AC-1 through AC-4 are now proven via public/rendered behavior
- screenshot artifact path proving real molecule UI capture
- any residual risks
