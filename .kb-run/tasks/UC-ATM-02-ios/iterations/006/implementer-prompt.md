# kb-run Implementer Prompt

Execution unit: `UC-ATM-02-ios`
Sprint: `sprint-02-atoms-foundation-primitives`
Worktree: `.kb-run/worktrees/UC-ATM-02-ios`
Role: `swift-implementer`
Start commit: `70587687a67b0deda009ba567b040a9d6414b551`

## Objective

Fix the remaining reviewer rejection from iteration `005`. Do not reopen the broader button work.

## Current Reviewer Verdict

Reviewer response: `.kb-run/tasks/UC-ATM-02-ios/iterations/005/reviewer-response.json`

High finding to fix:

- `ios/LaneShadow/Views/Atoms/LSButton.swift:133-143`
- The icon slot is still off-spec. `.plus` and `.sparkle` bypass `LSIcon` via custom `Canvas` drawing, and other icon names are rendered as `LSIcon(...).hidden()`, so they disappear.

Medium finding to improve if possible within scope:

- `ios/LaneShadowTests/Atoms/LSButtonTests.swift`
- Tests are too weak to catch icon/rendering regressions and the documented selector in the task file is a no-op in this project.

## Required Fix

1. Route the button icon slot through `LSIcon` for supported `IconName` values.
2. Preserve token-resolved foreground behavior for the icon without widening this task into a shared `LSIcon` refactor unless absolutely necessary.
3. Remove the custom `Canvas` icon fallback and the hidden-icon path.
4. Strengthen tests so they would fail if the leading icon were hidden or bypassed.

## Scope

Keep changes as narrow as possible. Prefer touching only:

- `ios/LaneShadow/Views/Atoms/LSButton.swift`
- `ios/LaneShadowTests/Atoms/LSButtonTests.swift`

Only widen beyond that if it is truly required to make `LSIcon` usable with the resolved button foreground color, and keep any widening minimal and justified.

## Suggested Direction

If possible, render `LSIcon` itself and apply the resolved button foreground via masking/overlay/compositing so the visual output comes from `LSIcon` while the final color still comes from the button tokens.

For tests, prefer a hosting-controller-based assertion that can prove the icon actually renders in the view tree rather than only checking helper values or `XCTAssertNotNil`.

## Validation Targets

- `swiftformat --lint ios/LaneShadow/Views/Atoms/LSButton.swift ios/LaneShadowTests/Atoms/LSButtonTests.swift`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSButtonTests`
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build`
- grep gates from the task file

## Completion Contract

- Create a real commit with hooks enabled.
- Final response must include:
  - commit SHA
  - files changed
  - validation commands run with pass/fail
  - explanation of how icons now render through `LSIcon`
