# kb-run Implementer Prompt

Execution unit: `UC-ATM-02-ios`
Sprint: `sprint-02-atoms-foundation-primitives`
Worktree: `.kb-run/worktrees/UC-ATM-02-ios`
Role: `swift-implementer`

## Objective

Remediate the existing `UC-ATM-02-ios` branch so it is merge-ready.

You are continuing an existing implementation for:

- Task file: `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-02-ios-button-atom-all-variants-states-ios-swiftui.md`

Current branch already contains an `LSButton` implementation plus tests/stories. Reviewer validated story registration, touch target, action dispatch, and grep gates. The remaining work is to fix the token contract issues and remove out-of-scope drift.

## Must Fix

1. `AC-2`: primary pressed state must resolve to the correct primary pressed token path, not `theme.colors.accent.pressed`.
2. `AC-3`: disabled colors must resolve through dedicated disabled tokens, not opacity-dimming fallback colors.
3. `AC-4`: outline layout must use the spec horizontal padding instead of size-varying padding.
4. `AC-1` / `AC-4`: button text and icon color rendering must be token-resolved end-to-end. Reviewer rejected the current path because `LSText` / `LSIcon` shared color helpers still include hard-coded mappings for non-signal colors.
5. Remove out-of-scope drift from the branch. Restore these paths to `main` unless they are strictly required for this task:
   - `.spec/codex-remediation-handoff-20260423.md`
   - `.spec/prds/v2/tasks/sprint-02-atoms-foundation-primitives/UC-ATM-02-ios-button-atom-all-variants-states-ios-swiftui.md`
   - `lefthook.yml`
   - `scripts/ios/xcodebuild-worktree.sh`

## Scope

Primary allowed task files:

- `ios/LaneShadow/Views/Atoms/LSButton.swift`
- `ios/LaneShadow/Views/Atoms/LSButtonStyle.swift`
- `ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift`
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadowTests/Atoms/LSButtonTests.swift`

Generated-project updates are allowed only if they are necessary to make the new button/story files build cleanly with the existing legacy `ios/LaneShadow/Views/Atoms/Button.swift` still in the tree:

- `ios/project.yml`
- `ios/LaneShadow.xcodeproj/project.pbxproj` via project generation only

Do not widen scope beyond that.

## Important Local Context

- Main already has a legacy `ios/LaneShadow/Views/Atoms/Button.swift` that defines `LSButton`.
- The current branch added `ios/project.yml` changes to exclude that legacy file and include `LSButtonStories.swift`. Keep those changes only if they are actually required.
- `CODEX-SPECIALIST-PROMPTS.md` exists but is empty, so use the task file and repo rules as the specialist source of truth.

## Reviewer Findings To Address

- High: label/icon colors are not fully token-resolved because the current implementation relies on shared helpers with hard-coded color mappings.
- High: branch includes out-of-scope remediation/config changes.
- Medium: horizontal padding varies by size instead of matching the fixed spec padding.

## Suggested In-Scope Direction

If useful, avoid shared hard-coded text/icon color helpers inside the button implementation. For example, resolve the foreground color directly from theme tokens in `LSButton` and keep icon rendering token-colored without widening the task into a shared atom refactor.

## Validation Targets

Run the task gates from the task file and leave the worktree clean after commit:

- `swiftformat --lint ios/LaneShadow/`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSButtonTests`
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build`
- grep gates from the task file

## Completion Contract

- Create a real commit with hooks enabled.
- Final response must include:
  - commit SHA
  - files changed
  - validation commands run with pass/fail
  - whether `ios/project.yml` / generated project updates were retained and why
