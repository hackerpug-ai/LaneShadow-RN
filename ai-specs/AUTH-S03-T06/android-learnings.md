# Android Learnings: AUTH-S03-T06 AuthRepository + Clerk auth

## Implementation Date
2026-04-28

## Edge Cases Discovered
1. Kotlin `Result<T>` in suspend interface methods causes JVM name mangling; reflection-based method assertions need prefix checks (`startsWith`) rather than exact method names.
2. `android.net.Uri` parsing in local unit tests requires Robolectric runner/config; plain JVM tests can fail with Android framework runtime exceptions.

## API Contract Notes
- `AuthRepository` now includes email/password, sign-up, Google/Apple OAuth entry points, callback handling, JWT retrieval, and `StateFlow<AuthState>` observation.
- OAuth callback parser accepts both `token` and `jwt` query params and supports fallback identity fields when provider payload is partial.

## UI Decisions
- No Compose UI changes were introduced in this task; all work is data/DI/manifest level.

## Gotchas for iOS Implementer
- Deep-link callback must preserve provider + token payload shape (`laneshadow://oauth-callback?...`) for cross-platform parity in OAuth completion.
- Secure token persistence should be encapsulated behind a small storage contract to keep auth repository behavior testable.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/data/repository/AuthRepository.kt — auth contract
- android/app/src/main/java/com/laneshadow/data/model/AuthState.kt — auth state + ClerkUser model
- android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt — primary repository
- android/app/src/main/java/com/laneshadow/data/repository/CustomTabsAuthRepository.kt — fallback repository
- android/app/src/main/java/com/laneshadow/data/store/EncryptedTokenStore.kt — encrypted token persistence
- android/app/src/main/java/com/laneshadow/di/AuthModule.kt — Hilt bindings/providers
- android/app/src/main/AndroidManifest.xml — OAuth callback deep-link intent filter
- android/app/build.gradle.kts — Clerk/security/Hilt/browser dependencies
- android/app/src/test/java/com/laneshadow/data/repository/AuthRepositoryTddTest.kt — TDD behavior tests for AC coverage
