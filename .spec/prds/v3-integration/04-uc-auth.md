---
stability: FEATURE_SPEC
last_validated: 2026-04-27
prd_version: 1.0.0
functional_group: AUTH
---

# Use Cases: Authentication & Session (AUTH)

| ID | Title | Description |
|----|-------|-------------|
| UC-AUTH-01 | Sign in with email and password | Multi-step Clerk email/password flow (email entry → password screen → Convex session) |
| UC-AUTH-02 | Sign in with social OAuth (Google / Apple) | Apple Sign-In native sheet on iOS; Google OAuth on both platforms; Custom Tabs fallback for Android if Clerk Android SDK is immature |
| UC-AUTH-03 | Sign up new account | Clerk email/password account creation with email verification |
| UC-AUTH-04 | Persist session and restore on relaunch / sign out | Tokens cached to platform secure storage; restored on cold start; sign-out clears all auth + local state |

---

## UC-AUTH-01: Sign in with email and password

Multi-step Clerk email-and-password flow. Mirrors RN's `app/(auth)/sign-in.tsx` two-step pattern: email entry first, then password entry conditional on `supportedFirstFactors` lookup.

- **Maps to**: `SignInScreen` (NEW UI, no V2 equivalent)
- **Backend**: Clerk SDK (`signIn.create` + `signIn.attemptFirstFactor`); Convex `setAuth` callback re-fetches Clerk JWT after success

### Acceptance Criteria

- ☐ User can enter email on the sign-in screen and tap "Continue" to advance to the password step
- ☐ User can enter password after email is recognized as existing in Clerk and tap "Sign in" to authenticate
- ☐ User can navigate to the sign-up flow when their entered email is not recognized as an existing account
- ☐ System validates credentials via Clerk and binds the Convex client's `setAuth` callback to the new Clerk JWT on successful sign-in
- ☐ System displays a clear inline error message when Clerk rejects the credentials, without leaking the specific failure reason
- ☐ User remains signed in across app close after successful sign-in (Clerk SDK persists tokens to Keychain on iOS / EncryptedSharedPreferences on Android)
- ☐ User can navigate to RootView (IdleScreen or last-viewed session) on successful sign-in via the auth-gate router

---

## UC-AUTH-02: Sign in with social OAuth (Google / Apple)

Native social authentication via Clerk's OAuth integration. Apple Sign-In uses iOS's native sheet; Google uses the platform-appropriate flow. Android falls back to `Custom Tabs + ASWebAuthenticationSession`-equivalent if `clerk-android` alpha is missing OAuth methods at week 1.

- **Maps to**: `SignInScreen` (Apple/Google buttons row using new `LSAuthProviderButton` molecule)
- **Backend**: Clerk SDK `signIn.authenticateWithRedirect(strategy: .oauth(.apple))` / `.google` on iOS; `signInWithOAuth(provider)` on Android Clerk SDK (or Custom Tabs fallback)
- **Deep linking**: redirect URL `laneshadow://oauth-callback` registered in `Info.plist` (iOS) and AndroidManifest `<intent-filter>` (Android)

### Acceptance Criteria

- ☐ User can tap "Continue with Apple" on iOS to launch the native Apple Sign-In sheet
- ☐ User can tap "Continue with Google" to launch the Google OAuth flow on either iOS or Android
- ☐ System handles the OAuth callback redirect via `onOpenURL` (iOS) / `onNewIntent` (Android) and creates a Convex-backed session on success
- ☐ System returns the user to the sign-in screen with a friendly error message if OAuth is canceled or rejected by the provider
- ☐ User is routed to IdleScreen (or last-viewed session) on successful OAuth completion via the auth-gate router

---

## UC-AUTH-03: Sign up new account

New rider creates an account with email + password via Clerk SDK. Mirror RN's sign-up flow — email collection → email verification → password set → Convex `users` row provisioned via Clerk webhook.

- **Maps to**: `SignUpScreen` (NEW UI; variant of SignInScreen)
- **Backend**: Clerk SDK `signUp.create` + `signUp.attemptEmailAddressVerification` flow; Convex backend Clerk webhook creates `users` row automatically

### Acceptance Criteria

- ☐ User can enter email and password on the sign-up screen and tap "Create account" to submit
- ☐ System validates password strength via Clerk and shows feedback inline beneath the password field
- ☐ User can complete email verification by entering the code Clerk emails them
- ☐ System creates the Clerk account on verification success, which triggers the Clerk webhook to provision the Convex `users` row
- ☐ User is routed to IdleScreen on successful sign-up after `db.users.getCurrentUser` returns a non-null row (verifies webhook completion)
- ☐ System displays a clear inline error when the entered email is already registered with Clerk

---

## UC-AUTH-04: Persist session and restore on relaunch / sign out

Auth tokens cached securely; restored on cold start; sign-out clears auth tokens, persisted session ID, camera cache, theme preferences, and all local state.

- **Maps to**: APP infrastructure (no dedicated screen — runs in `RootView` / `MainActivity` lifecycle hooks)
- **iOS**: Clerk SDK uses Keychain by default (`kSecAttrAccessibleAfterFirstUnlock`)
- **Android**: Clerk SDK uses EncryptedSharedPreferences (AES-256)
- **Sign-out**: `Clerk.shared.signOut()` (iOS) / `Clerk.signOut()` (Android) → Convex client's `setAuth` callback returns nil → all subscriptions close → navigate to SignInScreen

### Acceptance Criteria

- ☐ System persists Clerk auth tokens to platform-native secure storage automatically via the Clerk SDK
- ☐ System restores the authenticated session on app launch when a valid token is present in storage
- ☐ User can sign out from the SettingsScreen (UC-APP-01) and the system clears Clerk tokens, the Convex client's auth state, the persisted last-viewed session ID, the chat camera cache, and the theme preference
- ☐ User is redirected to SignInScreen after sign-out completes
- ☐ System redirects to SignInScreen automatically when Convex returns `UNAUTHENTICATED` for any query (token validation failure mid-session)
