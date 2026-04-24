# ALIGN-03-ios Implementer Packet

You are executing `ALIGN-03-ios` in a fresh kb-run restart.

Task file:
- `.spec/prds/v2/tasks/sprint-03-design-system-alignment/ALIGN-03-ios-refactor-ios-atoms.md`

Required reading before edits:
- `.spec/prds/v2/tasks/sprint-03-design-system-alignment/drift-report.md`
- `ios/LaneShadow/Views/Atoms/BadgeVariant.swift`
- `ios/LaneShadow/Views/Atoms/LSText.swift`
- `ios/LaneShadow/Views/Atoms/LSScrim.swift`
- `tokens/platforms/swift/Sources/LaneShadowTheme/Generated/Tokens.swift`

Critical constraints:
- Stay inside `ios/LaneShadow/Views/Atoms/*.swift`.
- Do not edit sandbox files or token generator outputs.
- Follow RED -> GREEN -> REFACTOR and record concrete evidence.
- Do not commit; the orchestrator owns checkpoint commits.

Corrected runtime commands:
- `swiftformat --lint ios/LaneShadow/`
- `cd ios && xcodebuild build -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'`
- `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LSAvatarTests -only-testing:LaneShadowTests/LSBadgeTests -only-testing:LaneShadowTests/LSBestBadgeTests -only-testing:LaneShadowTests/LSButtonTests -only-testing:LaneShadowTests/LSCardTests -only-testing:LaneShadowTests/LSDividerTests -only-testing:LaneShadowTests/LSGlassPanelTests -only-testing:LaneShadowTests/LSGlassPanelTypeSafetyTests -only-testing:LaneShadowTests/LSIconTests -only-testing:LaneShadowTests/LSIconTypeSafetyTests -only-testing:LaneShadowTests/LSMapTests -only-testing:LaneShadowTests/LSPanelTests -only-testing:LaneShadowTests/LSPhaseDotTests -only-testing:LaneShadowTests/LSPillTests -only-testing:LaneShadowTests/LSScrimTests -only-testing:LaneShadowTests/LSSpinnerTests -only-testing:LaneShadowTests/LSTextAreaTests -only-testing:LaneShadowTests/LSTextFieldTests -only-testing:LaneShadowTests/LSTextTests -only-testing:LaneShadowTests/LSTextTypeSafetyTests`

Minimum requirement coverage:
- AC-1 through AC-6
- TC-1 through TC-7

Completion packet requirements:
- Summarize changed files.
- List RED tests run and failing evidence.
- List GREEN validation commands and results.
- Confirm no out-of-scope files were changed.
