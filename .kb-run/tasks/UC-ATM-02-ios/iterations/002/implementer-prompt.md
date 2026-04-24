# kb-run remediation prompt: UC-ATM-02-ios iteration 002

You are resuming sprint task `UC-ATM-02-ios` in worktree `.kb-run/worktrees/UC-ATM-02-ios`.

Start commit for this remediation iteration:
`265d8776e58b0e228b35248ebe77d5d36a5cfccc`

The previous implementation commit exists, but the host deterministic gate rejected it before reviewer dispatch because the diff from `main...HEAD` includes files outside the task scope:

- `ios/LaneShadow.xcodeproj/project.pbxproj` changed. Task scope explicitly prohibits `ios/LaneShadow.xcodeproj/**`; project rules also say never hand-edit project internals.
- `ios/project.yml` changed, but this task's `writeAllowed` list does not include it.
- `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift` changed, but this task's `writeAllowed` list names only `ios/LaneShadow/Sandbox/LaneShadowStories.swift` as the allowed aggregator file.

Required remediation:

1. Inspect the current implementation and the current repo patterns.
2. Bring the final diff into scope if possible:
   - Keep `ios/LaneShadow/Views/Atoms/LSButton.swift`.
   - Keep `ios/LaneShadow/Views/Atoms/LSButtonStyle.swift`.
   - Keep `ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift`.
   - Keep `ios/LaneShadow/Sandbox/LaneShadowStories.swift` only if needed for story registration.
   - Keep `ios/LaneShadowTests/Atoms/LSButtonTests.swift`.
   - Remove `ios/LaneShadow.xcodeproj/**`, `ios/project.yml`, and `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift` from the diff unless you can prove the task cannot build without a scoped task correction. If you cannot make it both build-clean and scope-clean, stop after committing the best evidence and clearly report the blocker.
3. Make sure all nine ACs remain satisfied after any cleanup.
4. Run these gates and include outcomes in your final response:
   - `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSButtonTests`
   - `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build`
   - `swiftformat --lint ios/LaneShadow/`
   - `for v in primary secondary ghost accept destructive outline; do grep -q "atoms.button.$v" ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift || exit 1; done && grep -q 'LSButtonStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift`
   - `! grep -REn 'Color\(|Color\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSButton.swift`
   - `! grep -REn 'Image\(systemName:' ios/LaneShadow/Views/Atoms/LSButton.swift`
5. Create a real remediation commit on top of the start commit. Do not amend the previous commit and do not bypass hooks.

Task summary:

- Implement `LSButton(title:variant:size:leadingIcon:trailingIcon:isDisabled:action:)` for iOS SwiftUI.
- Six variants: primary, secondary, ghost, accept, destructive, outline.
- Pressed and disabled states must resolve through LaneShadowTheme action tokens.
- Minimum touch target is 44x44pt for every size.
- Icon slots must compose through `LSIcon`; no `Image(systemName:)`.
- `LSButton.swift` must not contain literal SwiftUI colors or hex color strings.
- Six sandbox story ids must exist: `atoms.button.primary`, `atoms.button.secondary`, `atoms.button.ghost`, `atoms.button.accept`, `atoms.button.destructive`, `atoms.button.outline`.
- Tests live in `ios/LaneShadowTests/Atoms/LSButtonTests.swift`.

Allowed task files from the source task:

- `ios/LaneShadow/Views/Atoms/LSButton.swift`
- `ios/LaneShadow/Views/Atoms/LSButtonStyle.swift`
- `ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift`
- `ios/LaneShadow/Sandbox/LaneShadowStories.swift`
- `ios/LaneShadowTests/Atoms/LSButtonTests.swift`

If the repository's actual aggregator pattern means `AtomsStories.swift` is the correct registration point, report that as a task-spec mismatch with exact evidence instead of silently leaving an out-of-scope diff.
