# kb-run Implementer Prompt

Execution unit: `UC-MOL-08-ios`
Sprint: `sprint-04-molecules-composite-patterns`
Worktree: `.kb-run/worktrees/UC-MOL-08-ios`
Role: `swift-implementer`
Start commit: `69917ef488ed3ef95e8ec9318251d95193528634`

## Non-Negotiable kb-run Rules

- You are a direct `codex exec` child process, not an in-harness subagent. Do not spawn or delegate to any subagent.
- Work only inside `/Users/justinrich/Projects/LaneShadow/.kb-run/worktrees/UC-MOL-08-ios`.
- Do not edit parent/main worktree files or any `.kb-run*` orchestrator state, notebooks, or checksums.
- This worktree already contains iteration 001 changes that are not yet committed. Treat them as your starting point; do not revert them unless the reviewer findings require a direct replacement.
- Create a real git commit before finishing. Commit normally so hooks run. Never use `--no-verify`, `-n`, or hook-disabling env vars.
- Finish with a clean worktree.
- Respect `RULES.md` and keep scope limited to this task's iOS molecule, test, story, and project-generation files unless the approved remediation below explicitly widens it.

## Objective

Fix the reviewer rejection from iteration `001` without reopening already-satisfied LocationContextBar behavior or touching the legacy `RouteAttachmentCard.swift`.

## Current Reviewer Verdict

Reviewer response: `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-08-ios/iterations/001/reviewer-response.json`

Unresolved requirements:

1. `AC-3`: the scenic meter is currently a scaled `star` / `starFill` fallback instead of the required filled/hollow dot meter.
2. `AC-5`: compact mode uses `vertical: 2, horizontal: 4` instead of the required `10pt vertical / 12pt horizontal`.
3. The current tests are too weak to catch either defect reliably.

## Required Fix

1. Replace the scenic meter in `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift` with a true five-dot filled/hollow implementation that still routes through `LSIcon`.
2. The current scaled-star fallback is not acceptable. If the current `LSIcon`/`IconName` surface in this worktree does not expose circle-based variants, you are explicitly authorized to make the smallest scoped support change needed for a compliant LSIcon-based dot meter. Prefer non-generated changes when possible, but if there is no compliant non-generated path, make the narrowest required support change and document it clearly.
3. Update compact-mode content padding to the required `10pt vertical / 12pt horizontal` contract while preserving the existing stripe and badge-hiding behavior.
4. Strengthen `ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift` so the wrong scenic-meter shape and wrong compact padding values would fail immediately next time.
5. Keep `LSLocationContextBar` stable unless one of the above fixes truly forces a shared project/story adjustment.
6. Do not modify legacy `ios/LaneShadow/Views/Molecules/RouteAttachmentCard.swift`.
7. If project membership needs to change again, go through `ios/project.yml` plus `scripts/ios/generate-project.sh`; never hand-edit `.pbxproj`.

## Concrete References

- Reviewer findings:
  - `/Users/justinrich/Projects/LaneShadow/.kb-run/tasks/UC-MOL-08-ios/iterations/001/reviewer-response.json`
- Current task source of truth:
  - `.spec/prds/v2/tasks/sprint-04-molecules-composite-patterns/UC-MOL-08-ios-location-route-molecules.md`
- Current non-compliant scenic meter:
  - `ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift`
- Existing icon surface:
  - `ios/LaneShadow/Views/Atoms/LSIcon.swift`
  - `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift`
- Current tests:
  - `ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift`

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift ios/LaneShadowTests/Molecules/LSLocationContextBarTests.swift ios/LaneShadowTests/Molecules/LSRouteAttachmentCardTests.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSLocationContextBarStory.swift ios/LaneShadow/Sandbox/Stories/Molecules/LSRouteAttachmentCardStory.swift`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSLocationContextBarTests -only-testing:LaneShadowTests/LSRouteAttachmentCardTests`
- `grep -n 'Color(red:\\|Color(hex:\\|Image(systemName:' ios/LaneShadow/Views/Molecules/LSLocationContextBar.swift ios/LaneShadow/Views/Molecules/LSRouteAttachmentCard.swift | wc -l | xargs test 0 -eq`

## Completion Contract

- Create a real commit with hooks enabled.
- Final response must include:
  - commit SHA
  - files changed
  - validation commands run with pass/fail
  - exactly how the scenic meter now satisfies the filled/hollow dot requirement through LSIcon
  - exactly how compact padding now matches the required contract
  - any residual risks
