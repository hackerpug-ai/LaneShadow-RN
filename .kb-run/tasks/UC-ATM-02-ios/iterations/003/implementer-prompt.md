# kb-run remediation prompt: UC-ATM-02-ios iteration 003

You are resuming sprint task `UC-ATM-02-ios` in worktree `.kb-run/worktrees/UC-ATM-02-ios`.

Start commit for this remediation iteration:
`265d8776e58b0e228b35248ebe77d5d36a5cfccc`

Iteration 002 found two real issues:

1. The previous implementation changed `ios/LaneShadow/Sandbox/Stories/AtomsStories.swift` to add `baseStories`. That is not needed. The task's allowed registration file is `ios/LaneShadow/Sandbox/LaneShadowStories.swift`, so keep registration there as:
   `] + AtomsStories.all + LSButtonStories.all`
   and restore `AtomsStories.swift` to the current `main` shape.
2. `ios/project.yml` and the generated `ios/LaneShadow.xcodeproj/project.pbxproj` appear build-relevant because:
   - `ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift` is explicitly listed in project sources, matching the current story-file membership pattern.
   - `ios/LaneShadow/Views/Atoms/Button.swift` already defines `public struct LSButton`, so the project excludes legacy `Button.swift` while the new `LSButton.swift` is introduced.

Required work:

- Apply only the `AtomsStories.swift` cleanup described above.
- Keep `ios/project.yml` and generated project output only if still needed for source membership / legacy `Button.swift` duplicate avoidance.
- Run fast gates:
  - `for v in primary secondary ghost accept destructive outline; do grep -q "atoms.button.$v" ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift || exit 1; done && grep -q 'LSButtonStories' ios/LaneShadow/Sandbox/LaneShadowStories.swift`
  - `! grep -REn 'Color\(|Color\.(red|blue|green|black|white|gray|orange|yellow|purple|pink)|#[0-9a-fA-F]{6}' ios/LaneShadow/Views/Atoms/LSButton.swift`
  - `! grep -REn 'Image\(systemName:' ios/LaneShadow/Views/Atoms/LSButton.swift`
  - `swiftformat --lint ios/LaneShadow/Views/Atoms/LSButton.swift ios/LaneShadow/Views/Atoms/LSButtonStyle.swift ios/LaneShadow/Sandbox/Stories/LSButtonStories.swift ios/LaneShadow/Sandbox/LaneShadowStories.swift ios/LaneShadowTests/Atoms/LSButtonTests.swift`
- Run the requested Xcode gates if the environment allows:
  - `cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/Atoms/LSButtonTests`
  - `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -quiet ONLY_ACTIVE_ARCH=YES COMPILER_INDEX_STORE_ENABLE=NO SWIFT_COMPILATION_MODE=incremental build`
- Create a real remediation commit on top of the start commit. Do not amend and do not bypass hooks.

Do not edit `.kb-run*` files. If `.kb-run*` becomes dirty, report it instead of staging it.
