# iOS Learnings: AUTH-S03-T05 Clerk Auth Remediation

## Implementation Date
2026-04-29

## Edge Cases Discovered
1. `clerk-ios` APIs are `@MainActor` oriented for many auth entrypoints; live integration needs a main-actor-aware seam.
2. Full test suite has pre-existing crash/retry instability outside auth scope; focused auth suite is required for reliable remediation validation.

## API Contract Notes
- Email sign-in flow uses `SignIn.create(strategy: .identifier(...))` + `attemptFirstFactor(strategy: .password(...))`.
- OAuth uses `SignIn.authenticateWithRedirect(strategy: .oauth(provider: ...))` and then active user is read from `Clerk.shared.user`.
- Convex JWT bridge uses `Clerk.shared.session?.getToken(.init(template: "convex"))?.jwt`.

## UI Decisions
- No UI token changes were required for this remediation; only service and integration tests were changed.

## Platform-Specific Notes
- `ClerkAuth` remains the `@Observable` facade boundary; live behavior moved into a testable SDK seam (`ClerkSDKClient`).
- Integration tests now exercise `LiveClerkAuthClient` wiring directly instead of only validating fake client behavior.

## Files Created/Modified
- ios/LaneShadow/Services/ClerkAuth.swift — replaced stubs with real Clerk SDK-backed behavior.
- ios/LaneShadowTests/Integration/ClerkAuthTests.swift — added live-client wiring tests.
- .tmp/AUTH-S03-T05/* — verification artifacts.
