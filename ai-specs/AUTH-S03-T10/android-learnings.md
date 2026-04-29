# Android Learnings: AUTH-S03-T10 Auth Screens

## Implementation Date
2026-04-28

## Edge Cases Discovered
1. `SpinnerSize` currently only exposes `Md`; callback screen loading indicators must use that tokenized size.
2. OAuth brand-specific icon tokens are not clearly exposed as Google/Apple in the checked-in code; provider button currently uses available icon tokens while preserving reusable molecule structure.

## API Contract Notes
- Existing `AuthViewModel` in `ui/LaneShadowApp.kt` provides required real contract methods (`signIn`, `signUp`, `signInWithGoogle`, `signInWithApple`, `handleOAuthCallback`).
- Deep-link callback uses `laneshadow://oauth-callback` and is already routed via `DeepLinkBus` in `MainActivity`.

## UI Decisions
- Multi-step sign-in state (email -> password) is modeled in dedicated `SignInUiState` + `SignInViewModel` to keep screen logic explicit and unidirectional.

## Gotchas for iOS Implementer
- Keep multi-step validation and loading/error state mapping aligned with backend auth transitions to avoid mixed UI state.
- Navigation wiring to replace placeholder auth routes is still required outside this task scope to fully activate these screens.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/auth/models/SignInStep.kt` — sign-in step enum.
- `android/app/src/main/java/com/laneshadow/ui/auth/models/SignInUiState.kt` — sign-in ui state model.
- `android/app/src/main/java/com/laneshadow/ui/auth/models/SignUpField.kt` — sign-up field enum.
- `android/app/src/main/java/com/laneshadow/ui/auth/viewmodels/SignInViewModel.kt` — local sign-in ui state reducer.
- `android/app/src/main/java/com/laneshadow/ui/components/LSAuthProviderButton.kt` — shared OAuth provider button molecule.
- `android/app/src/main/java/com/laneshadow/ui/auth/SignInScreen.kt` — multi-step sign-in screen.
- `android/app/src/main/java/com/laneshadow/ui/auth/SignUpScreen.kt` — sign-up screen with name/email/password/confirm fields.
- `android/app/src/main/java/com/laneshadow/ui/auth/OAuthCallbackScreen.kt` — callback processing screen.
