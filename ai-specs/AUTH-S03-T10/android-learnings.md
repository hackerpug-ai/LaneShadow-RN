# Android Learnings: AUTH-S03-T10 Auth Screens Remediation

## Implementation Date
April 29, 2026

## Edge Cases Discovered
1. OAuth callback cold-start replay requires both `SharedFlow(replay = 1)` and explicit `latestCallbackUri` handoff to avoid missed callback routing during initial `AuthNavGraph` mount.
2. A fixed callback delay (`delay(500)`) can make behavior timing opaque and is unnecessary for callback completion; removing it keeps callback flow deterministic while preserving loading UI.

## API Contract Notes
- OAuth callback handling is triggered via `AuthViewModel.handleOAuthCallback(uri)` and consumes `DeepLinkBus` replay state with `consumeLatest()` after processing.
- Debug-only screenshot mode uses `screen=loading` query parameter and is guarded by `BuildConfig.DEBUG`.

## UI Decisions
- Continued reuse of `LSFormField` for auth inputs with keyboard and visual transformation pass-through to preserve password and IME behavior across sign-in/sign-up.

## Gotchas for iOS Implementer
- Callback replay reliability depends on startup timing; ensure iOS callback bus/state survives cold start until auth graph is active.
- Debug/screenshot-only loading overrides should remain compile-time or build-config gated so release behavior cannot be affected.

## Files Created/Modified
- `android/app/src/test/java/com/laneshadow/ui/auth/AuthScreensSourceStructureTest.kt` — auth remediation evidence tests.
- `android/app/src/main/java/com/laneshadow/ui/auth/OAuthCallbackScreen.kt` — removed artificial callback delay and documented debug-only loading preview path.
- `.spec/prds/v3-integration/tasks/sprint-03-auth-convex-foundation/AUTH-S03-T10-android-auth-screens.md` — scope expansion + evidence gate updates.
