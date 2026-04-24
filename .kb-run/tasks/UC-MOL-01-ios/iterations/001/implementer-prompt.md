# kb-run Implementer Prompt

Execution unit: `UC-MOL-01-ios`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-01-ios`
Role: `swift-implementer`
Start commit: `fbe49fe479d55d6eee99efa6264bea5ec7bce515`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-01-ios`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md` and keep scope limited to this task's iOS molecule, test, story, and project-generation files.

## Objective

Implement `UC-MOL-01-ios` from the current task spec with full TDD evidence:

- `LSContentCard` and `LSListRow` as iOS molecules
- atom-only composition through `LSCard`, `LSText`, `LSAvatar`, `LSIcon`, and `LSDivider`
- all 10 sandbox stories registered
- interactive `LSListRow` tap fires exactly once
- no literal colors, typography, or spacing outside theme/token surfaces

## Required Reading

Read these before editing:

1. `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-01-ios-card-listrow-molecules.md`
2. `.spec/design/system/molecules/content-card/`
3. `.spec/design/system/molecules/list-row/`
4. `.spec/prds/v2/06-uc-mol.md`
5. `ios/LaneShadow/Views/Atoms/LSCard.swift`
6. `ios/LaneShadow/Views/Atoms/LSText.swift`
7. `ios/LaneShadow/Views/Atoms/LSAvatar.swift`
8. `ios/LaneShadow/Views/Atoms/LSIcon.swift`
9. `ios/LaneShadow/Views/Atoms/LSDivider.swift`

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

Write prohibited:

- `ios/LaneShadow.xcodeproj/**` directly; if project membership changes, update `ios/project.yml` and run `scripts/ios/generate-project.sh`
- `ios/LaneShadow/Views/Atoms/**`
- `tokens/**`
- `android/**`

## Acceptance Requirements

Implement all ACs and TCs from the task file. The critical ones are:

1. `LSContentCard` default render uses surface card tokens through `LSCard`.
2. `LSContentCard` action footer slot renders below metadata without extra gap when absent.
3. `LSListRow` uses token-driven spacing and minimum touch target sizing.
4. Interactive `LSListRow` onTap fires exactly once; non-interactive row shows no pressed highlight.
5. `LSContentCard.swift` and `LSListRow.swift` contain no `Color(hex:)`, `Color(red:)`, `Font.system`, or deprecated `foregroundColor(` usage.
6. All 10 stories are registered and render through the iOS sandbox molecules story index.

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift ios/LaneShadowTests/Molecules/LSContentCardTests.swift ios/LaneShadowTests/Molecules/LSListRowTests.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSContentCardStory.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSListRowStory.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `grep -n 'Color(red:\\|Color(hex:\\|Font.system\\|foregroundColor(' ios/LaneShadow/Views/Molecules/LSContentCard.swift ios/LaneShadow/Views/Molecules/LSListRow.swift | wc -l | xargs test 0 -eq`

## Completion Contract

Return a Markdown completion report and write it to the configured output file. Include:

- base SHA and final commit SHA
- changed files
- validation commands run with pass/fail
- explicit RED/GREEN evidence summary for the TDD flow
- story registration summary
- any residual risks
