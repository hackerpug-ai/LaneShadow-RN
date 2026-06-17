# TASK: AUTH-S03-R06 - iOS Clerk-to-Convex Login Integration and Routing Proof

TASK_TYPE: FEATURE
STATUS: Completed
PRIORITY: P0
EFFORT: M
AGENT: implementer=swift-implementer | reviewer=swift-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 300 min

## Outcome

Prove that iOS auth is not just UI: Clerk success updates shared app auth state, binds Convex auth, waits for the current user, routes to IdleScreen, restores on relaunch, signs out, and handles unauthenticated Convex errors.

## Critical Constraints

- MUST update shared app routing only from the same `ClerkAuth`/environment instance used by RootView.
- MUST bind Clerk JWT into Convex before authenticated queries run.
- MUST wait for `db.users.getCurrentUser` before showing a personalized IdleScreen greeting.
- NEVER treat a local view-model `.signedIn` state as sufficient app authentication.
- STRICTLY keep visual layout fixes in R04 and E2E harness work in R08.

## Specification

Objective: complete iOS Clerk/Convex login integration with deterministic tests for auth state, Convex token binding, current-user hydration, restore, sign-out, and `UNAUTHENTICATED` redirect.

Success state: an iOS login path reaches IdleScreen only after Convex can read the authenticated user, and every auth transition has a failing-then-passing test.

## Acceptance Criteria

AC-1: Sign-in and OAuth update the RootView auth source
GIVEN email/password or provider auth succeeds
WHEN `SignInViewModel` or provider actions complete
THEN `RootView` observes the shared auth environment as authenticated and routes to the app flow.
VERIFY: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests`

AC-2: Convex auth receives the Clerk JWT
GIVEN Clerk returns a non-empty JWT
WHEN iOS initializes or refreshes `LaneShadowConvexClient`
THEN Convex `setAuth`/auth provider returns that token for authenticated queries.
VERIFY: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/ClerkAuthTests`

AC-3: IdleScreen greeting waits for current user
GIVEN Convex `db.users.getCurrentUser` returns a display name
WHEN auth completes
THEN the app routes to IdleScreen with the real name in the greeting, not a placeholder or local email fragment.
VERIFY: `rg "getCurrentUser|displayName|Where are we riding today" ios/LaneShadow ios/LaneShadowTests`

AC-4: Restore and sign-out clear the correct state
GIVEN an authenticated iOS session exists in secure storage
WHEN the app cold-starts or the rider signs out
THEN restore returns to IdleScreen and sign-out clears Clerk token, Convex auth, last session/camera state, and auth route state.
VERIFY: `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/RootViewTests`

AC-5: Convex unauthenticated errors redirect to AuthScreen
GIVEN an authenticated subscription receives an `UNAUTHENTICATED` error
WHEN the error mapper handles it
THEN iOS closes authenticated subscriptions and redirects to AuthScreen with a user-safe message.
VERIFY: `rg "UNAUTHENTICATED|LaneShadowError|auth.signIn.root" ios/LaneShadow ios/LaneShadowTests`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | iOS successful sign-in mutates RootView-observed auth state. | AC-1 | `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests` |
| TC-2 | iOS Convex auth provider returns a Clerk JWT for authenticated queries. | AC-2 | `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/ClerkAuthTests` |
| TC-3 | iOS IdleScreen greeting depends on Convex current user data. | AC-3 | `rg "getCurrentUser|displayName" ios/LaneShadow ios/LaneShadowTests` |
| TC-4 | iOS sign-out clears auth and local app state. | AC-4 | `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/RootViewTests` |
| TC-5 | iOS unauthenticated Convex errors route back to AuthScreen. | AC-5 | `rg "UNAUTHENTICATED|auth.signIn.root" ios/LaneShadow ios/LaneShadowTests` |

## Reading List

- `ios/LaneShadow/RootView.swift`
- `ios/LaneShadow/Services/ClerkAuth.swift`
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift`
- `ios/LaneShadow/Services/ClerkAuthProvider.swift`
- `convex/db/users.ts`
- `.spec/prds/v3-integration/04-uc-auth.md`

## Guardrails

write_allowed:
- `ios/LaneShadow/RootView.swift` (MODIFY)
- `ios/LaneShadow/Models/AppState.swift` (MODIFY)
- `ios/LaneShadow/Services/ClerkAuth.swift` (MODIFY)
- `ios/LaneShadow/Services/ClerkAuthProvider.swift` (MODIFY)
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` (MODIFY)
- `ios/LaneShadow/Features/Auth/**` (MODIFY integration hooks only)
- `ios/LaneShadowTests/**` (ADD/MODIFY integration tests)

write_prohibited:
- `android/**` - R07 owns Android integration.
- `convex/**` - only read unless a contract bug is proven and split to Convex owner.
- `ios/LaneShadow/Sandbox/**` - R04 owns view fidelity stories.

## Design

references:
- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/prds/v3-integration/04-uc-auth.md`

pattern: RootView observes one shared app environment; auth completion updates that shared state and Convex uses the same Clerk JWT provider.
pattern_source: `ios/LaneShadow/RootView.swift`
anti_pattern: setting a local SignInViewModel state to signed-in while RootView continues rendering the unauthenticated flow.

## Verification Gates

- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests`
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/ClerkAuthTests`
- `cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' build`

## Review (swift-reviewer contract) - 2026-04-30

Final reviewed commit: `f40355e26b9b2278cb674f4d73ed46ce6ed85bbb`
Merged to `main`: `ff0f564e69830111bab9ac8e903e526e8e967a00`

Acceptance Criteria:
- [x] AC-1: Sign-in and OAuth update the RootView auth source. Evidence: AuthScreen completion calls shared `AppState.completeAuthentication` with the environment `ClerkAuth` and `LaneShadowConvexClient`; `AuthScreensTests` passed.
- [x] AC-2: Convex auth receives the Clerk JWT. Evidence: `LaneShadowConvexClient.setAuth(clerkJWTProvider:)` bridges Clerk JWTs into the Convex auth provider; `ClerkAuthTests` passed.
- [x] AC-3: IdleScreen greeting waits for current user. Evidence: auth completion fetches `db/users:getCurrentUser` before setting `isAuthenticated`, stores `displayName`, and renders the personalized IdleScreen greeting.
- [x] AC-4: Restore and sign-out clear the correct state. Evidence: restore, sign-out, token clearing, route clearing, and current-user hydration are covered by `RootViewTests`.
- [x] AC-5: Convex unauthenticated errors redirect to AuthScreen. Evidence: `LaneShadowConvexClient` now invokes a registered handler for `UNAUTHENTICATED` subscription/query/mutation/action failures; RootView registers the production handler and a regression test drives a failing `subscribeToSessions()` path.

Test Criteria:
- [x] TC-1: iOS successful sign-in mutates RootView-observed auth state.
- [x] TC-2: iOS Convex auth provider returns a Clerk JWT for authenticated queries.
- [x] TC-3: iOS IdleScreen greeting depends on Convex current user data.
- [x] TC-4: iOS sign-out clears auth and local app state.
- [x] TC-5: iOS unauthenticated Convex errors route back to AuthScreen.

Notes:
- First review found AC-5 was test-only plumbing. The follow-up commit wired `UNAUTHENTICATED` handling into production Convex subscription/error paths.
- Review and remediation were run headless with CLI `xcodebuild` and `rg` verification.

## Dependencies

depends_on: [AUTH-S03-R04]
blocks: [AUTH-S03-R08, Sprint 04]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN email/password or provider auth succeeds WHEN actions complete THEN RootView observes shared auth as authenticated and routes to the app flow.","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN Clerk returns a JWT WHEN LaneShadowConvexClient initializes or refreshes THEN Convex auth provider returns that token.","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/ClerkAuthTests"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN db.users.getCurrentUser returns displayName WHEN auth completes THEN IdleScreen greeting uses the real Convex user name.","verify":"rg \"getCurrentUser|displayName|Where are we riding today\" ios/LaneShadow ios/LaneShadowTests"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN authenticated session exists WHEN cold-start or sign-out occurs THEN restore and clear behaviors are correct.","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/RootViewTests"},
{"id":"AC-5","type":"acceptance_criterion","description":"GIVEN an authenticated subscription receives UNAUTHENTICATED WHEN handled THEN iOS closes authenticated subscriptions and redirects to AuthScreen.","verify":"rg \"UNAUTHENTICATED|LaneShadowError|auth.signIn.root\" ios/LaneShadow ios/LaneShadowTests"},
{"id":"TC-1","type":"test_criterion","description":"iOS successful sign-in mutates RootView-observed auth state.","maps_to_ac":"AC-1","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/AuthScreensTests"},
{"id":"TC-2","type":"test_criterion","description":"iOS Convex auth provider returns a Clerk JWT for authenticated queries.","maps_to_ac":"AC-2","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/ClerkAuthTests"},
{"id":"TC-3","type":"test_criterion","description":"iOS IdleScreen greeting depends on Convex current user data.","maps_to_ac":"AC-3","verify":"rg \"getCurrentUser|displayName\" ios/LaneShadow ios/LaneShadowTests"},
{"id":"TC-4","type":"test_criterion","description":"iOS sign-out clears auth and local app state.","maps_to_ac":"AC-4","verify":"cd ios && xcodebuild -project LaneShadow.xcodeproj -scheme LaneShadow -destination 'platform=iOS Simulator,name=iPhone 16' test -only-testing:LaneShadowTests/RootViewTests"},
{"id":"TC-5","type":"test_criterion","description":"iOS unauthenticated Convex errors route back to AuthScreen.","maps_to_ac":"AC-5","verify":"rg \"UNAUTHENTICATED|auth.signIn.root\" ios/LaneShadow ios/LaneShadowTests"}
]}
-->
