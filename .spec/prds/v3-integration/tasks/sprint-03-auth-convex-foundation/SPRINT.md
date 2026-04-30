# Sprint 03: Auth & Convex Foundation

**Sequence:** 3
**Timeline:** Phase 2 · Week 3
**Status:** In Progress (task expansion 2026-04-28)

## Overview

Sprint 03 wires auth + Convex foundation — the substrate every other UC depends on. Clerk OAuth (email/password + Google + Apple) integrates on both platforms, Convex client wrappers expose typed subscriptions, auth-gate routing replaces the placeholder ContentView/MainActivity, and SignInScreen/SignUpScreen composables ship on iOS and Android. This sprint transforms the app from a sandbox-only shell into an authenticated, Convex-connected native experience.

## Human Testing Gate

**Gate:** A rider can sign in via email or Google/Apple OAuth on both iOS and Android, see their session restored on cold-start relaunch, and view the IdleScreen with their real name interpolated into the greeting from `db.users.getCurrentUser`.

## Human Test Deliverable

**Test Steps:**
1. Launch the iOS app on a fresh Simulator and tap "Continue with Apple" on the SignInScreen; confirm the native Apple Sign-In sheet presents and authentication completes, redirecting to IdleScreen
2. Launch the Android app on a fresh Emulator and tap "Continue with Google" on the SignInScreen; confirm the OAuth flow (Clerk SDK or Custom Tabs fallback) completes and the rider lands on IdleScreen
3. View the IdleScreen and confirm the greeting interpolates the rider's name from the Convex `users` table (e.g., "Where are we riding today, Justin?")
4. Kill the app on both platforms via the simulator/emulator and re-launch; confirm the rider remains signed in (Clerk JWT cached in Keychain on iOS, EncryptedSharedPreferences on Android)
5. Navigate to Settings (via hamburger menu) on both platforms, tap "Sign out", confirm the dialog, and confirm the app redirects to SignInScreen with all local state cleared
6. Run `cd /Users/justinrich/Projects/LaneShadow/server && pnpm convex dev` and watch the new `db.users.getCurrentUser` query return user data when the iOS or Android client subscribes
7. Trigger an `UNAUTHENTICATED` Convex error mid-session (e.g., revoke the token in Clerk dashboard); confirm the app redirects to SignInScreen automatically via the LaneShadowError typed-error pathway
8. Verify the type-generation pipeline by running `pnpm server:codegen` and confirming `ios/LaneShadow/Generated/ConvexTypes.generated.swift` and `android/.../generated/ConvexTypes.kt` files regenerate from `_generated/api.d.ts`

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| AUTH-S03-T01 | Backend additions — `db.users.getCurrentUser` public query (~30 LoC) + optional `limit` arg on `db.sessionMessages.list` (+5 LoC); deploy to Convex dev environment | convex-implementer | 90 min |
| AUTH-S03-T02 | Type-gen pipeline — `server/scripts/generate-mobile-types.ts` reads `_generated/api.d.ts` and emits `ios/LaneShadow/Generated/ConvexTypes.generated.swift` (Codable structs) + `android/app/src/main/.../generated/ConvexTypes.kt` (`@Serializable` data classes); wire into `pnpm server:codegen` | convex-implementer | 360 min |
| AUTH-S03-T03 | iOS ConvexMobile Swift SDK integration via SPM; `Services/ConvexClient+LaneShadow.swift` typed wrapper exposing `subscribeToSessions() -> AsyncStream<[Session]>`, `sendMessage`, `createSession`, etc.; `setAuth` callback bound to Clerk JWT | swift-implementer | 240 min |
| AUTH-S03-T04 | Android ConvexMobile Kotlin SDK integration via Gradle; `services/ConvexClientProvider.kt` Hilt @Singleton wrapper exposing `Flow<List<Session>>`, suspend mutations; `setAuth` callback bound to Clerk JWT | kotlin-implementer | 240 min |
| AUTH-S03-T05 | iOS `Services/ClerkAuth.swift` — `clerk-ios` SDK adapter with email/password + Apple Sign-In + Google OAuth flows; Keychain token storage (default Clerk behavior); deep-link `.onOpenURL` for `laneshadow://oauth-callback` | swift-implementer | 240 min |
| AUTH-S03-T06 | Android `services/ClerkAuth.kt` — `AuthRepository` interface with primary `ClerkAuthRepository` (alpha clerk-android SDK) and `CustomTabsAuthRepository` fallback (single Hilt @Binds swap if SDK proves immature week 1 spike); `EncryptedSharedPreferences` token storage; deep-link intent filter | kotlin-implementer | 360 min |
| AUTH-S03-T07 | iOS `App/RootView.swift` — top-level NavigationStack with AuthGate switch (`.unauthenticated` → SignInScreen / SignUpScreen / OAuthCallbackScreen; `.authenticated` → IdleScreen or last-viewed session phase); `AppEnvironment` @Observable injection of ConvexClient + Clerk | swift-implementer | 180 min |
| AUTH-S03-T08 | Android `MainActivity` Compose shell — `@AndroidEntryPoint` + `LaneShadowApp` with `@HiltAndroidApp`; Navigation Compose typed sealed `Route` interface; `AuthNavGraph` vs `MainNavGraph` selection from auth state Flow | kotlin-implementer | 240 min |
| AUTH-S03-T09 | iOS SignInScreen + SignUpScreen + OAuthCallbackScreen — composed from V2 atoms (LSCard + LSTextField + LSButton) + new `LSAuthProviderButton` molecule (Apple + Google variants); multi-step email-then-password flow matching RN pattern | swift-implementer | 360 min |
| AUTH-S03-T10 | Android SignInScreen + SignUpScreen + OAuthCallbackScreen — Compose composables matching iOS visual + behavioral parity; `LSAuthProviderButton` Android impl | kotlin-implementer | 360 min |
| AUTH-S03-T11 | Real-device XCUITest E2E gate — codify the automated iOS email/password auth path as native XCTest result artifacts with screenshots and xcodebuild logs for non-sandbox auth + Convex restore evidence | swift-implementer | 240 min |

### Task Files

Generated by /kb-sprint-tasks-plan on 2026-04-28

- [AUTH-S03-T01-backend-users-query.md](AUTH-S03-T01-backend-users-query.md) (convex-implementer, 90 min)
- [AUTH-S03-T02-type-gen-pipeline.md](AUTH-S03-T02-type-gen-pipeline.md) (convex-implementer, 360 min)
- [AUTH-S03-T03-ios-convex-client.md](AUTH-S03-T03-ios-convex-client.md) (swift-implementer, 240 min)
- [AUTH-S03-T04-android-convex-client.md](AUTH-S03-T04-android-convex-client.md) (kotlin-implementer, 240 min)
- [AUTH-S03-T05-ios-clerk-auth.md](AUTH-S03-T05-ios-clerk-auth.md) (swift-implementer, 240 min)
- [AUTH-S03-T06-android-auth-repository.md](AUTH-S03-T06-android-auth-repository.md) (kotlin-implementer, 360 min)
- [AUTH-S03-T07-ios-rootview-auth-gate.md](AUTH-S03-T07-ios-rootview-auth-gate.md) (swift-implementer, 180 min)
- [AUTH-S03-T08-android-mainactivity-shell.md](AUTH-S03-T08-android-mainactivity-shell.md) (kotlin-implementer, 240 min)
- [AUTH-S03-T09-ios-auth-screens.md](AUTH-S03-T09-ios-auth-screens.md) (swift-implementer, 360 min)
- [AUTH-S03-T10-android-auth-screens.md](AUTH-S03-T10-android-auth-screens.md) (kotlin-implementer, 360 min)
- [AUTH-S03-T11-real-device-wda-e2e.md](AUTH-S03-T11-real-device-wda-e2e.md) (swift-implementer, 240 min)

## Source Coverage

- UC-AUTH-01 (Sign in with email/password — 7 ACs)
- UC-AUTH-02 (Sign in with social OAuth — 5 ACs)
- UC-AUTH-03 (Sign up new account — 6 ACs)
- UC-AUTH-04 (Persist session and restore on relaunch / sign out — 5 ACs)
- UC-APP-02 (Top-level routing with auth gate — 5 ACs)
- `architecture/ios-architecture.md` § 1-2 (App Entry, Auth Stack)
- `architecture/android-architecture.md` § 1-2 (App Entry, Auth Stack)
- `11-technical-requirements.md` § Auth Flow Contract, Data Schema, API Design

## Blocks

- Blocks: Sprint 04 (Conversational Planning Loop)
- Dependent on: Sprint 02 (V2 Variants, Motion & Sandbox Coverage)
