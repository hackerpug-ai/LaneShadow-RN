# TASK: AUTH-S03-R07 - Android Clerk-to-Convex Login Integration and Routing Proof

TASK_TYPE: FEATURE
STATUS: Completed
PRIORITY: P0
EFFORT: M
AGENT: implementer=kotlin-implementer | reviewer=kotlin-reviewer
SPRINT: sprint-03-auth-design-e2e-remediation
ESTIMATE: 300 min

## Outcome

Prove that Android auth is not just UI: Clerk success updates app auth state, binds Convex auth, waits for the current user, routes to IdleScreen, restores on relaunch, signs out, and handles unauthenticated Convex errors.

## Critical Constraints

- MUST update the same auth state Flow that selects `AuthNavGraph` vs `MainNavGraph`.
- MUST bind Clerk JWT into Convex before authenticated queries run.
- MUST wait for `db.users.getCurrentUser` before showing a personalized IdleScreen greeting.
- NEVER treat a repository `SignedIn` state as sufficient if Navigation Compose still shows auth.
- STRICTLY keep visual layout fixes in R05 and evidence aggregation in R08.

## Specification

Objective: complete Android Clerk/Convex login integration with deterministic unit/instrumentation tests for auth state, Convex token binding, current-user hydration, restore, sign-out, and `UNAUTHENTICATED` redirect.

Success state: an Android login path reaches IdleScreen only after Convex can read the authenticated user, and every auth transition has a failing-then-passing test.

## Acceptance Criteria

AC-1: Sign-in and OAuth update the app auth Flow
GIVEN email/password or provider auth succeeds
WHEN repository actions complete
THEN `LaneShadowApp`/navigation observes authenticated state and routes to the main graph.
VERIFY: `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'`

AC-2: Convex auth receives the Clerk JWT
GIVEN Clerk returns a non-empty JWT
WHEN Android initializes or refreshes `ConvexClientProvider`
THEN Convex auth provider returns that token for authenticated queries.
VERIFY: `cd android && ./gradlew :app:testDebugUnitTest --tests '*Convex*' --tests '*Auth*'`

AC-3: IdleScreen greeting waits for current user
GIVEN Convex `db.users.getCurrentUser` returns a display name
WHEN auth completes
THEN the app routes to IdleScreen with the real name in the greeting, not a placeholder or local email fragment.
VERIFY: `rg "getCurrentUser|displayName|Where are we riding today" android/app/src/main android/app/src/test android/app/src/androidTest`

AC-4: Restore and sign-out clear the correct state
GIVEN an authenticated Android session exists in encrypted storage
WHEN the app cold-starts or the rider signs out
THEN restore returns to IdleScreen and sign-out clears Clerk token, Convex auth, last session/camera state, and auth route state.
VERIFY: `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*Root*'`

AC-5: Convex unauthenticated errors redirect to AuthScreen
GIVEN an authenticated subscription receives an `UNAUTHENTICATED` error
WHEN the error mapper handles it
THEN Android closes authenticated subscriptions and redirects to AuthScreen with a user-safe message.
VERIFY: `rg "UNAUTHENTICATED|LaneShadowError|auth.signIn.root|AuthScreen" android/app/src/main android/app/src/test android/app/src/androidTest`

## Test Criteria

| ID | Boolean Statement | Maps To AC | Verify |
|---|---|---|---|
| TC-1 | Android successful sign-in mutates navigation-observed auth state. | AC-1 | `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'` |
| TC-2 | Android Convex auth provider returns a Clerk JWT for authenticated queries. | AC-2 | `cd android && ./gradlew :app:testDebugUnitTest --tests '*Convex*' --tests '*Auth*'` |
| TC-3 | Android IdleScreen greeting depends on Convex current user data. | AC-3 | `rg "getCurrentUser|displayName" android/app/src/main android/app/src/test android/app/src/androidTest` |
| TC-4 | Android sign-out clears auth and local app state. | AC-4 | `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*Root*'` |
| TC-5 | Android unauthenticated Convex errors route back to AuthScreen. | AC-5 | `rg "UNAUTHENTICATED|AuthScreen" android/app/src/main android/app/src/test android/app/src/androidTest` |

## Reading List

- `android/app/src/main/java/com/laneshadow/data/repository/AuthRepository.kt`
- `android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt`
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt`
- `android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt`
- `server/convex/db/users.ts`
- `.spec/prds/v3-integration/04-uc-auth.md`

## Guardrails

write_allowed:
- `android/app/src/main/java/com/laneshadow/data/**` (MODIFY auth state/repository only)
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` (MODIFY)
- `android/app/src/main/java/com/laneshadow/navigation/**` (MODIFY auth/main graph switch only)
- `android/app/src/main/java/com/laneshadow/ui/auth/**` (MODIFY integration hooks only)
- `android/app/src/test/**` and `android/app/src/androidTest/**` (ADD/MODIFY integration tests)

write_prohibited:
- `ios/**` - R06 owns iOS integration.
- `server/convex/**` - only read unless a contract bug is proven and split to Convex owner.
- `android/app/src/debug/**` - R05 owns view fidelity stories.

## Design

references:
- `.spec/design/system/views/auth/auth-screen.html`
- `.spec/prds/v3-integration/04-uc-auth.md`

pattern: Navigation observes repository state Flow; Convex client auth provider reads the same Clerk token source.
pattern_source: `android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt`
anti_pattern: setting repository state to SignedIn while app navigation or Convex auth remains unauthenticated.

## Verification Gates

- `cd android && ./gradlew :app:compileDebugKotlin`
- `cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'`
- `cd android && ./gradlew :app:connectedDebugAndroidTest` when emulator/device evidence is available.

## Review (kotlin-reviewer contract) - 2026-04-30

Final reviewed commit: `301b9ecce17702e226f7fc75dfd202ce56d6cb68`
Merged to `main`: `8a019d620db8cdbf28e36bc2e21fa1d08c5f66e0`

Acceptance Criteria:
- [x] AC-1: Sign-in and OAuth update the app auth Flow. Evidence: `ClerkAuthRepository` restores persisted JWT state and updates the navigation-observed `AuthState` Flow for sign-in, OAuth, restore, sign-out, and unauthenticated errors.
- [x] AC-2: Convex auth receives the Clerk JWT. Evidence: `ConvexClientProvider` binds the Clerk JWT before authenticated queries; focused Convex/auth tests passed.
- [x] AC-3: IdleScreen greeting waits for current user. Evidence: `MainNavViewModel` calls `getCurrentUser()` and renders `IdleScreen` only after `displayName` is available.
- [x] AC-4: Restore and sign-out clear the correct state. Evidence: repository restore/sign-out tests and `ConvexClientProvider.signOut()` behavior tests passed.
- [x] AC-5: Convex unauthenticated errors redirect to AuthScreen. Evidence: `ConvexClientProvider` maps `UNAUTHENTICATED`, clears Convex/auth state, and sets the session-expired auth error observed by the auth graph.

Test Criteria:
- [x] TC-1: Android successful sign-in mutates navigation-observed auth state.
- [x] TC-2: Android Convex auth provider returns a Clerk JWT for authenticated queries.
- [x] TC-3: Android IdleScreen greeting depends on Convex current user data.
- [x] TC-4: Android sign-out clears auth and local app state.
- [x] TC-5: Android unauthenticated Convex errors route back to AuthScreen.

Notes:
- First review found a runtime crash in the Convex logout success path and source-string-only sign-out clearing coverage. The follow-up commit fixed the `Void` result path and added behavioral sign-out coverage.
- Review and remediation were run headless with CLI Gradle and `rg` verification.

## Dependencies

depends_on: [AUTH-S03-R05]
blocks: [AUTH-S03-R08, Sprint 04]

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{"requirements":[
{"id":"AC-1","type":"acceptance_criterion","description":"GIVEN email/password or provider auth succeeds WHEN repository actions complete THEN navigation observes authenticated state and routes to the main graph.","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'"},
{"id":"AC-2","type":"acceptance_criterion","description":"GIVEN Clerk returns a JWT WHEN ConvexClientProvider initializes or refreshes THEN Convex auth provider returns that token.","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Convex*' --tests '*Auth*'"},
{"id":"AC-3","type":"acceptance_criterion","description":"GIVEN db.users.getCurrentUser returns displayName WHEN auth completes THEN IdleScreen greeting uses the real Convex user name.","verify":"rg \"getCurrentUser|displayName|Where are we riding today\" android/app/src/main android/app/src/test android/app/src/androidTest"},
{"id":"AC-4","type":"acceptance_criterion","description":"GIVEN authenticated session exists WHEN cold-start or sign-out occurs THEN restore and clear behaviors are correct.","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*Root*'"},
{"id":"AC-5","type":"acceptance_criterion","description":"GIVEN an authenticated subscription receives UNAUTHENTICATED WHEN handled THEN Android closes authenticated subscriptions and redirects to AuthScreen.","verify":"rg \"UNAUTHENTICATED|LaneShadowError|auth.signIn.root|AuthScreen\" android/app/src/main android/app/src/test android/app/src/androidTest"},
{"id":"TC-1","type":"test_criterion","description":"Android successful sign-in mutates navigation-observed auth state.","maps_to_ac":"AC-1","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*'"},
{"id":"TC-2","type":"test_criterion","description":"Android Convex auth provider returns a Clerk JWT for authenticated queries.","maps_to_ac":"AC-2","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Convex*' --tests '*Auth*'"},
{"id":"TC-3","type":"test_criterion","description":"Android IdleScreen greeting depends on Convex current user data.","maps_to_ac":"AC-3","verify":"rg \"getCurrentUser|displayName\" android/app/src/main android/app/src/test android/app/src/androidTest"},
{"id":"TC-4","type":"test_criterion","description":"Android sign-out clears auth and local app state.","maps_to_ac":"AC-4","verify":"cd android && ./gradlew :app:testDebugUnitTest --tests '*Auth*' --tests '*Root*'"},
{"id":"TC-5","type":"test_criterion","description":"Android unauthenticated Convex errors route back to AuthScreen.","maps_to_ac":"AC-5","verify":"rg \"UNAUTHENTICATED|AuthScreen\" android/app/src/main android/app/src/test android/app/src/androidTest"}
]}
-->
