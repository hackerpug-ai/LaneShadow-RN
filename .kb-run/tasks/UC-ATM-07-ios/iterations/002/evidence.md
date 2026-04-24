# UC-ATM-07-ios Evidence

- Read required context: `ROOT-CONTEXT.md`, `RULES.md`, `brain/agents/swift-implementer.md`, the task spec, the badge concept HTML, UC-ATM-06 pill task, `Theme.swift`, and native-sandbox rules.
- Inspected existing atom/test/story patterns and found a pre-existing top-level `BadgeVariant` in `ios/LaneShadow/Views/Atoms/Badge.swift`.
- RED phase:
  - Added `ios/LaneShadowTests/Atoms/LSBadgeTests.swift`
  - Added `ios/LaneShadowTests/Atoms/LSBestBadgeTests.swift`
  - Ran isolated XCTest commands with `scripts/agent-worktree-env.sh`, `-derivedDataPath "$DERIVED_DATA_PATH"`, and `-clonedSourcePackagesDirPath "$SWIFTPM_CACHE_DIR"`.
  - First attempt failed during package resolution when isolation flags were missing.
  - Second attempt reached compilation and failed as expected because `LSBadge`, `LSBestBadge`, and the required typed `BadgeVariant.status/.weather` API do not exist.
- Blocking issue:
  - The module already defines `public enum BadgeVariant: String, CaseIterable` in `ios/LaneShadow/Views/Atoms/Badge.swift`.
  - This task requires a different top-level `BadgeVariant` shape (`.status(...)` + `.weather(...)`) but `Badge.swift` is outside `SCOPE.writeAllowed`.
  - Swift cannot contain two top-level types with the same name in the same module, so the required deliverable cannot be implemented without a scope change.

## RED Evidence

Command:

```bash
source scripts/agent-worktree-env.sh && cd ios && xcodebuild test -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -derivedDataPath "$DERIVED_DATA_PATH" -clonedSourcePackagesDirPath "$SWIFTPM_CACHE_DIR" -only-testing:LaneShadowTests/LSBadgeTests/test_status_recording_resolves_tokens
```

Relevant failure lines:

```text
Cannot find 'LSBestBadge' in scope
Cannot find 'LSBadge' in scope
Type 'BadgeVariant' has no member 'status'
Type 'BadgeVariant' has no member 'weather'
Value of type 'BadgeVariant' has no member 'resolvedStyle'
```

Collision confirmation:

```text
ios/LaneShadow/Views/Atoms/Badge.swift:81:public enum BadgeVariant: String, CaseIterable {
```
