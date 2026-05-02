# Android Learnings: CHAT-S04-T10b

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. `android.net.Uri.encode()` is not mocked in local JVM unit tests, so route-construction helpers need a pure Kotlin/Java encoding path if they are covered by `testDebugUnitTest`.
2. A `MutableSharedFlow` with `DROP_OLDEST` can silently lose the first recovery event when `Retry` and `StartOver` are emitted back-to-back. Using suspending `emit(...)` preserved both events in order.
3. Planning failures can arrive through multiple collectors. The ViewModel needs to dedupe the failure transition so the route only navigates once.
4. The emulator launch path on this branch starts at auth by default. The debug bypass flag exposes the bypass button, and tapping it transitions to the signed-in home screen for visual verification.

## RED / GREEN Evidence
- Initial focused run of `:app:testDebugUnitTest` failed at compile time with unresolved references around the new error routing and recovery API surface:
  - `errorRoute`
  - `ErrorRecoveryEvent`
  - `recoveryEvents`
  - `PlanningTransition.Failure` type mismatch
- After implementation, the next focused run failed for two behavior reasons:
  - `ErrorRouteTest` hit `android.net.Uri.encode(...)` not mocked on the JVM.
  - `ErrorViewModelTest` initially observed only `StartOver`, which showed the recovery flow was dropping `Retry`.
- GREEN evidence:
  - `./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.LaneShadowErrorTest --tests com.laneshadow.ui.error.ErrorViewModelTest --tests com.laneshadow.ui.error.ErrorRouteTest --tests com.laneshadow.ui.planning.PlanningViewModelTest`
  - `./gradlew :app:compileDebugKotlin`
  - `./gradlew :app:assembleDebug`

## API Contract Notes
- `SignOutFlow.signOut()` now goes through `ConvexClientProvider.signOut()`, which preserves Convex cleanup and emits `NavEvent.Navigate(Route.SignIn)` afterward.
- `PlanningTransition.Failure` now carries a typed `LaneShadowError` instead of a raw string so the error route can reconstruct the production error screen state.
- `errorRoute(...)` uses encoded `code` and `message` query parameters, and `ErrorRoute` reconstructs the typed error before handing it to the `ErrorViewModel`.
- Recovery is callback-driven: `ErrorViewModel` emits `Retry` and `StartOver` events, and `ErrorRoute` forwards them to `onRetry` / `onStartOver`.
- `PlanLimitExceeded` still intentionally omits `Try again`.

## UI Decisions
- Error navigation stays in `MainNavGraph`; `PlanningRoute` only consumes the failure transition and delegates navigation to the graph.
- Retry should return to the planning flow if the session id is available; otherwise the error route falls back to a safe back navigation.
- Start over navigates to `Route.Home` rather than dismissing the sheet or silently clearing state.

## Gotchas for iOS Implementer
- Do not mirror raw error codes directly into UI copy. Keep the typed error boundary and map the route parameters back into the local error model.
- If you keep a recovery-event stream, make it lossless. Dropped retry events are easy to miss in manual testing but obvious in flaky UI automation.
- The debug bypass path is useful for visual checks on Android, but it is not part of the production error/recovery flow.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/services/SignOutFlow.kt` - moved sign-out through Convex cleanup.
- `android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt` - exposed code-to-error lookup for route parsing.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt` - typed planning failure transition.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` - typed failure emission and deduped transition reporting.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt` - failure navigation into the production error route.
- `android/app/src/main/java/com/laneshadow/ui/error/ErrorUiState.kt` - recovery event model.
- `android/app/src/main/java/com/laneshadow/ui/error/ErrorViewModel.kt` - recovery event emission and sign-out handling.
- `android/app/src/main/java/com/laneshadow/ui/error/ErrorRoute.kt` - route encoding, typed error reconstruction, and callback wiring.
- `android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt` - error destination wiring and recovery callbacks.
- `android/app/src/test/java/com/laneshadow/ui/error/ErrorViewModelTest.kt` - sign-out cleanup and recovery-event assertions.
- `android/app/src/test/java/com/laneshadow/ui/error/ErrorRouteTest.kt` - route encoding coverage.
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt` - failure transition coverage.
