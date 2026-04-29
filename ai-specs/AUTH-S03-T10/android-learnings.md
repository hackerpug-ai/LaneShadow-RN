# Android Learnings: AUTH-S03-T10 Auth Screens

## Implementation Date
2026-04-28

## Edge Cases Discovered
1. OAuth callback can deadlock if `AuthNavGraph` is unmounted during `AuthState.OAuthPending`; keeping auth graph mounted preserves `DeepLinkBus` collection and callback reachability.
2. Sign-up submit UX must bind to repository-driven auth transitions; local-only loading state is insufficient for real async error display.

## API Contract Notes
- OAuth providers can return control while auth state is still `OAuthPending`; navigation listeners must remain active until callback is consumed.
- Auth failures surface through shared `AuthState.Error`, so screen-level error callouts should map from that source of truth.

## UI Decisions
- Reused `LSTextField` as the canonical V2 input atom: no Android `LSInputField` implementation exists in this codebase.
- Provider buttons intentionally use provider-specific labels without icon placeholders until brand icon tokens/assets are available.

## Gotchas for iOS Implementer
- Callback listeners tied to auth-screen mount lifecycle can silently miss deep-link events if auth state gating switches roots too early.
- Verification and auth fallback UIs should consistently use design-system atoms, not platform default controls, to preserve parity checks.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt
- android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt
- android/app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt
- .spec/prds/v3-integration/tasks/sprint-03-auth-convex-foundation/AUTH-S03-T10-android-auth-screens.md
- ai-specs/AUTH-S03-T10/android-learnings.md
