# Android Learnings: AUTH-S03-T06 AuthRepository + Clerk auth

## Implementation Date
2026-04-28

## Edge Cases Discovered
1. OAuth start is a non-terminal state: launching Custom Tabs should suspend pending callback completion, not emit immediate auth failure.
2. Clerk sign-up can return verification-required without a session token; this must map to an explicit `AuthState.VerificationRequired` state.

## API Contract Notes
- OAuth callback now requires validated `state` matching and completion through the pending deferred contract before sign-in resolves.
- JWT persistence remains gated on successful completion; `getJwtForConvex()` still enforces non-blank token.

## UI Decisions
- Added `AuthState.OAuthPending(provider)` and `AuthState.VerificationRequired` so auth state represents in-progress/verification states instead of misclassifying as `Error`.

## Gotchas for iOS Implementer
- OAuth launch should be modeled as an asynchronous pending state until callback completion; avoid treating launch as immediate failure.
- Verification-required sign-up can be a valid intermediate state before user becomes fully signed in.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/data/model/AuthState.kt — added pending/verification states.
- android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt — pending OAuth state + verification-required mapping.
- android/app/src/main/java/com/laneshadow/data/repository/CustomTabsAuthRepository.kt — suspend-until-callback OAuth flow for fallback repository.
- android/app/src/main/java/com/laneshadow/di/AuthModule.kt — added qualified primary/fallback AuthRepository bindings and async OAuth gateway completion.
- android/app/src/test/java/com/laneshadow/data/repository/ClerkAuthRepositoryTest.kt — tests for pending OAuth and verification-required state.
- android/app/src/test/java/com/laneshadow/di/AuthModuleBindingTest.kt — test for primary/fallback binding availability.
