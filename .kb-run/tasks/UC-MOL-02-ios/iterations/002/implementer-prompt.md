# kb-run Implementer Prompt

Execution unit: `UC-MOL-02-ios`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-02-ios`
Role: `swift-implementer`
Start commit: `01b44c51bb1c9081a2c70e80783bc86d2dfb0a6a`
Review cycle: `002`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-02-ios`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md`. Keep scope limited to this task's molecule, story, test, and generated-project inputs.

## Objective

Fix the reviewer rejection from iteration `001` without regressing the already-correct story registration and safe-area behavior.

## Required Reading

Read these before editing:

1. `/Users/justinrich/Projects/LaneShadow/.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-02-ios-toolbar-navheader-molecules.md`
2. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-ios/iterations/001/reviewer-response.json`
3. `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-02-ios/iterations/001/implementer-response.json`
4. `.spec/design/system/molecules/toolbar/`
5. `.spec/design/system/molecules/nav-header/`
6. `.spec/prds/v2/06-uc-mol.md`
7. `ios/LaneShadow/Views/Molecules/LSToolbar.swift`
8. `ios/LaneShadow/Views/Molecules/LSNavHeader.swift`
9. `ios/LaneShadowTests/Molecules/LSToolbarTests.swift`
10. `ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift`
11. `ios/LaneShadow/Views/Atoms/LSButton.swift`
12. `ios/LaneShadow/Views/Atoms/LSIcon.swift`
13. `ios/LaneShadow/Views/Atoms/LSText.swift`

## Scope

Write allowed:

- `ios/LaneShadow/Views/Molecules/LSToolbar.swift`
- `ios/LaneShadow/Views/Molecules/LSNavHeader.swift`
- `ios/LaneShadowTests/Molecules/LSToolbarTests.swift`
- `ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSToolbarStory.swift`
- `ios/LaneShadow/Sandbox/Stories/Molecules/LSNavHeaderStory.swift`
- `ios/LaneShadow/Sandbox/Stories/MoleculesStories.swift`
- `ios/project.yml`
- `ai-specs/UC-MOL-02/ios-learnings.md`

Write prohibited:

- `ios/LaneShadow.xcodeproj/**` directly; if project membership changes, update `ios/project.yml` and run `scripts/ios/generate-project.sh`
- `ios/LaneShadow/Views/Atoms/**`
- `tokens/**`
- `android/**`

## Reviewer Findings To Fix

1. `AC-1` failed because both molecules use `theme.control.minHeight` for their chrome rows instead of the required `sizing.component.toolbarHeight` token, producing a visible 48pt regression where 56pt is required.
2. The tests are too superficial. They mostly inspect source text and token constants, so they missed the real rendered-height regression.
3. `LSNavHeader` spacing does not match the documented molecule recipe; the reviewer expects 16pt horizontal and bottom spacing rather than the current compact token combination.

## Acceptance Requirements

Implement all ACs and TCs from the task file. The critical remediation targets are:

1. `LSToolbar` and `LSNavHeader` must render their chrome rows from the actual toolbar-height token at runtime, not advertise the token while using `theme.control.minHeight`.
2. Replace or strengthen the current tests so AC-1, AC-3, and AC-4 fail on real layout/token regressions instead of passing on source-string inspection.
3. Align `LSNavHeader` spacing with the design recipe while preserving atom composition and large-title behavior.
4. Keep AC-2, AC-5, and AC-6 green.
5. Preserve safe-area handling and story registration.

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSToolbar.swift ios/LaneShadow/Views/Molecules/LSNavHeader.swift ios/LaneShadowTests/Molecules/LSToolbarTests.swift ios/LaneShadowTests/Molecules/LSNavHeaderTests.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSToolbarTests/test_default_render_uses_surface_primary_and_slot_atoms -only-testing:LaneShadowTests/LSNavHeaderTests/test_large_title_uses_opinion_lg_typography -only-testing:LaneShadowTests/LSNavHeaderTests/test_default_variant_uses_ui_title_md -only-testing:LaneShadowTests/LSToolbarTests/test_all_seven_toolbar_navheader_stories_registered`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `grep -n 'safeAreaInset\\|safeAreaPadding\\|ignoresSafeArea' ios/LaneShadow/Views/Molecules/LSToolbar.swift | wc -l | xargs test 0 -lt`
- `grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSToolbar.swift ios/LaneShadow/Views/Molecules/LSNavHeader.swift | wc -l | xargs test 0 -eq`

## Completion Contract

Return a JSON completion report and write it to the configured output file. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- explicit RED/GREEN evidence summary for the revised tests
- explanation of how the rendered toolbar/header height now resolves from `sizing.component.toolbarHeight`
- explanation of how the updated tests catch the original 48pt regression
- any residual risks
