# iOS Learnings: CHAT-S04-T10a

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. `ClientError.ConvexError(data:)` can carry JSON with a `code` field, while `ServerError` and `InternalError` often expose the code as a leading token in the message. The mapper needs to handle both shapes.
2. `PLAN_LIMIT_EXCEEDED` is a terminal state for the chat composer. It should render copy without a retry affordance and should not preserve the failed prompt for redispatch.
3. Unauthenticated Convex failures need to clear the local Clerk session, log out of Convex, drop the cached failed input, and route back to sign-in. Skipping any of those leaves stale UI state behind.

## API Contract Notes
- The server error taxonomy is code-driven, not message-driven. Canonical codes are mapped to typed `LaneShadowError` cases.
- Unknown coded messages should stay structured enough for debugging, but uncoded strings still fall back to `.unknown(message)`.
- `ErrorScreen` interactions are driven by the typed error state, not by raw server text.

## UI Decisions
- `Try again` only appears when the current error can be retried and there is a cached failed prompt to resend.
- `Start over` always resets the flow and clears the cached failed prompt.
- `PLAN_LIMIT_EXCEEDED` shows the no-retry copy and disables the chat composer.

## Platform-Specific Notes
- Simulator visual verification was done through the built-in sandbox story route using `-LaneShadowSandbox -SandboxStoryId templates.error.default`.
- The ErrorScreen story renders correctly in the sandbox without needing any temporary app route or debug-only production hook.

## Files Created/Modified
- `ios/LaneShadow/Services/LaneShadowError.swift` - typed error taxonomy and mapping.
- `ios/LaneShadow/Services/LaneShadowErrorRouter.swift` - unauthenticated error routing.
- `ios/LaneShadow/Models/AppState.swift` - cached failed input + sign-out flow support.
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` - removed the old inline error stub.
- `ios/LaneShadow/Features/Error/ErrorScreenViewModel.swift` - live error state + retry/start-over actions.
- `ios/LaneShadow/Features/Error/ErrorScreenContainer.swift` - live wiring into the template.
- `ios/LaneShadow/Views/Templates/ErrorScreen.swift` - live/provider hybrid template.
- `ios/LaneShadowTests/Services/LaneShadowErrorTests.swift` - taxonomy and unauthenticated routing coverage.
- `ios/LaneShadowTests/Features/Error/ErrorScreenWiringTests.swift` - ErrorScreen wiring coverage.

## Remediation Evidence
Original reviewer RED logs were not preserved in the repo, so this section records the new RED/GREEN evidence captured while remediating CHAT-S04-T10a.

### RED
1. `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/RootViewTests` failed with `Swift/ContiguousArrayBuffer.swift:692: Fatal error: Index out of range` when the app-flow error route was still being inspected through ViewInspector.
2. `swiftlint lint ios/LaneShadow/Features/Error/ErrorScreenViewModel.swift ios/LaneShadow/Features/Idle/IdleViewModel.swift ios/LaneShadow/Features/Planning/PlanningViewModel.swift ios/LaneShadow/RootView.swift ios/LaneShadow/Services/LaneShadowError.swift ios/LaneShadow/Views/AppFlow/AppFlowView.swift ios/LaneShadowTests/Features/Error/ErrorScreenWiringTests.swift ios/LaneShadowTests/Features/Planning/PlanningScreenWiringTests.swift ios/LaneShadowTests/Integration/RootViewTests.swift ios/LaneShadowTests/Services/LaneShadowErrorTests.swift` reported a serious `large_tuple` violation in `PlanningScreenWiringTests.swift` before the shared context was converted to a named struct.

### GREEN
1. The root route test now asserts the app-flow branch via `AppFlowView.sessionDestination(for:)` instead of forcing SwiftUI body inspection, and the focused route suite passes.
2. The planning wiring test now uses a named `PlanningScreenTestContext`, removing the serious `large_tuple` violation introduced by the retry-cache coverage.
3. `xcodebuild test -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' -only-testing:LaneShadowTests/LaneShadowErrorTests -only-testing:LaneShadowTests/ErrorScreenWiringTests -only-testing:LaneShadowTests/PlanningScreenWiringTests -only-testing:LaneShadowTests/RootViewTests` passed after the fixes.
4. `xcodebuild build -project ios/LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16'` passed.
