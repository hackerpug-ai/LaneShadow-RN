# iOS Learnings: AUTH-S03-T07 RootView auth gate

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. `xcodebuild -only-testing` does not reliably target Swift Testing `@Test` cases in this project; XCTest was used for deterministic AC evidence.
2. `EnvironmentKey.defaultValue` with main-actor dependencies triggers Swift 6 concurrency errors unless initialized through `MainActor.assumeIsolated`.

## API Contract Notes
- `ClerkAuth.currentUser == nil` is used as the initial auth gate signal.
- Deep-link handling currently keys on `laneshadow://auth` and refreshes auth state from `ClerkAuth`.

## UI Decisions
- Introduced minimal `AuthFlowView` and `AppFlowView` `NavigationStack` shells to satisfy auth-gate routing while preserving theme token usage.

## Platform-Specific Notes
- XcodeGen synced folders do not always emit explicit file-name entries in `project.pbxproj`; explicit source paths were added in `ios/project.yml` to satisfy registration verification.

## Files Created/Modified
- `ios/LaneShadow/App.swift`
- `ios/LaneShadow/RootView.swift`
- `ios/LaneShadow/Models/AppState.swift`
- `ios/LaneShadow/Environment/AppEnvironment.swift`
- `ios/LaneShadow/Views/AuthFlow/AuthFlowView.swift`
- `ios/LaneShadow/Views/AuthFlow/SignInView.swift`
- `ios/LaneShadow/Views/AuthFlow/SignUpView.swift`
- `ios/LaneShadow/Views/AppFlow/AppFlowView.swift`
- `ios/LaneShadow/Views/AppFlow/AppHomeView.swift`
- `ios/LaneShadowTests/Integration/RootViewTests.swift`
- `ios/project.yml`
- `ios/LaneShadow.xcodeproj/project.pbxproj`
