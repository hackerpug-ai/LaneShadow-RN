# Android Learnings: AUTH-S03-T08 MainActivity Compose shell

## Implementation Date
2026-04-28

## Edge Cases Discovered
1. Hilt app root conflict occurs if both `LaneShadowApp` and `LaneShadowApplication` are annotated with `@HiltAndroidApp`; only one app root can exist.
2. Existing OAuth callback handling is safest when centralized through a bus (`DeepLinkBus`) and observed in shell/viewmodel, while keeping `MainActivity` intent intake minimal.

## API Contract Notes
- Existing `AuthRepository.observeAuthState()` already provides app-shell routing source; no additional auth stream needed.
- Existing callback contract (`handleOAuthCallback(Uri)`) can be fed directly from deep-link events.

## UI Decisions
- `LaneShadowApp` routes auth states with a minimal splash/auth/main branching shell, while preserving DEBUG sandbox entry in `MainActivity`.

## Gotchas for iOS Implementer
- Keep one DI application root only; duplicate app roots break build tooling.
- Preserve debug/sandbox launch paths while migrating app-shell routing to avoid regressions in internal testing workflows.

## Files Created/Modified
- android/app/src/main/java/com/laneshadow/LaneShadowApplication.kt
- android/app/src/main/java/com/laneshadow/MainActivity.kt
- android/app/src/main/java/com/laneshadow/ui/LaneShadowApp.kt
- android/app/src/main/java/com/laneshadow/navigation/Route.kt
- android/app/src/main/java/com/laneshadow/navigation/DeepLinkBus.kt
- android/app/src/main/java/com/laneshadow/navigation/AuthNavGraph.kt
- android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt
- android/app/src/main/AndroidManifest.xml
- android/app/build.gradle.kts
- android/app/src/test/java/com/laneshadow/appshell/MainActivityShellContractTest.kt
- android/app/src/main/java/com/laneshadow/LaneShadowApp.kt
