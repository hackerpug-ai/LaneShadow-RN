# ALIGN-03-ios Implementer Packet — Iteration 002

You are continuing `ALIGN-03-ios` after host validation of iteration 001.

Task file:
- `.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-03-ios-refactor-ios-atoms.md`

Current validated state:
- `swiftformat --lint ios/LaneShadow/` passes.
- Static task greps are already green in the worktree for `BadgeVariant.swift`, `LSText.swift`, `LSScrim.swift`, and no hardcoded `cornerRadius:` literals in production atom bodies.
- Corrected Atoms XCTest slice fails only in `LaneShadowTests/LSPillTests.test_md_size_resolves_height_and_radius_tokens`.
- Re-run of the corrected Atoms slice without `LSPillTests` passed with 74 tests and 0 failures.

Observed blocker:
- `ios/LaneShadowTests/Atoms/LSPillTests.swift` currently asserts `theme.radius.full == 999`, but the current token value resolves to `9999`.
- `ios/LaneShadow/Views/Atoms/LSPill.swift` already uses `theme.radius.full`.

Required reading before edits:
- `.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md`
- `ios/LaneShadow/Views/Atoms/LSPill.swift`
- `ios/LaneShadowTests/Atoms/LSPillTests.swift`

Critical constraints:
- Keep the change minimal and focused on getting the corrected Atoms suite green.
- Do not touch sandbox files or generated token outputs.
- If the right fix is in tests, make the smallest defensible change and explain why the previous expectation was stale.
- Do not commit; the orchestrator owns checkpoint commits.

Required validation:
- `swiftformat --lint ios/LaneShadow/`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSPillTests`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSAvatarTests -only-testing:LaneShadowTests/LSBadgeTests -only-testing:LaneShadowTests/LSBestBadgeTests -only-testing:LaneShadowTests/LSButtonTests -only-testing:LaneShadowTests/LSCardTests -only-testing:LaneShadowTests/LSDividerTests -only-testing:LaneShadowTests/LSGlassPanelTests -only-testing:LaneShadowTests/LSGlassPanelTypeSafetyTests -only-testing:LaneShadowTests/LSIconTests -only-testing:LaneShadowTests/LSIconTypeSafetyTests -only-testing:LaneShadowTests/LSMapTests -only-testing:LaneShadowTests/LSPanelTests -only-testing:LaneShadowTests/LSPhaseDotTests -only-testing:LaneShadowTests/LSPillTests -only-testing:LaneShadowTests/LSScrimTests -only-testing:LaneShadowTests/LSSpinnerTests -only-testing:LaneShadowTests/LSTextAreaTests -only-testing:LaneShadowTests/LSTextFieldTests -only-testing:LaneShadowTests/LSTextTests -only-testing:LaneShadowTests/LSTextTypeSafetyTests`

Completion packet requirements:
- Summarize changed files.
- Show the RED failure you started from.
- Show the GREEN validation commands and results.
- Confirm the final diff is still minimal and scoped.
