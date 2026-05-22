# iOS Learnings: currentLocation wiring verification repair

## Implementation Date
2026-05-22

## Edge Cases Discovered
1. `xcodebuild -only-testing:LaneShadowTests/Services/...` does not resolve these tests in this target layout, even after adding XCTest selectors. The executable target identifier is `LaneShadowTests/ConvexClientLaneShadowTests`.
2. The live planning regression is backend-flaky on the `route_options` attachment assertion. A retry passed with the same current-location and no-clarification behavior.

## API Contract Notes
- `sendPlanningMessage` continues to omit `currentLocation` when nil and encode it as `{ "lat": Double, "lng": Double }` when present.
- The remediation did not change the Convex action contract or the public Swift signature.

## UI Decisions
- Removed the production `XCTestConfigurationFilePath` blank-screen branch from `LaneShadowApp` so UI tests and design-review launches boot the real app root.

## Platform-Specific Notes
- XCTest selectors remain the most reliable way to satisfy `xcodebuild` per-test verification in this mixed Swift Testing/XCTest target.
- App-entry workarounds belong in tests or launch configuration, not in the production `@main` app branch.

## Files Created/Modified
- `ios/LaneShadow/App.swift` — removed the blanket unit-test blank-screen gate
- `ios/LaneShadowTests/Services/ConvexClientLaneShadowTests.swift` — added XCTest selectors sharing the existing transport assertions
- `ai-specs/FIX-S08-IOS-T02/ios-learnings.md` — recorded remediation-specific learnings
