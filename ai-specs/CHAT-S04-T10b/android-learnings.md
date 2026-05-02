# Android Learnings: CHAT-S04-T10b

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. Android string resources must escape apostrophes in values like `You've` and `We'll`; otherwise resource merging fails with invalid unicode escape errors.
2. A `SharedFlow` sign-out event can be lost in tests if the collector has not started before the emit happens. Starting the collector with `CoroutineStart.UNDISPATCHED` made the AC-4 test deterministic.
3. The sandbox launcher in this repo opens the catalog shell even when a story id is supplied unless the registry is wired to expose that story directly. For visual verification, the error screen preview in the sandbox story detail was the most reliable emulator target.

## API Contract Notes
- `LaneShadowError` carries `messageResId` as the source of user-facing copy; the UI must resolve it with `stringResource(...)` rather than formatting raw server codes.
- `toLaneShadowError(Throwable)` checks direct throwable messages first, then Convex exception payloads, then `IOException` for `NetworkTimeout`, and only then falls back to `Unknown`.
- `SignOutFlow.signOut()` runs `AuthRepository.signOut()` on the injected IO dispatcher and emits `NavEvent.Navigate(Route.SignIn)` on a `SharedFlow`.
- `AuthRepository.signOut()` already clears encrypted token storage, so the sign-out flow only needs to call the repository once.

## UI Decisions
- `PlanLimitExceeded` intentionally exposes only `Start over`; it does not surface `Try again`.
- `ErrorRoute` stays thin: it maps the typed error to the existing template and delegates recovery chip behavior back into the view model.
- `Route.SignIn` is handled as a navigation target from `MainNavGraph` so the sign-out flow can redirect without holding a `NavController`.

## Gotchas for iOS Implementer
- Do not mirror raw error codes into UI text. Keep the typed error boundary and localize via resource or string catalog equivalents.
- If you mirror the event-driven sign-out path, make sure the navigation event cannot be dropped before a subscriber is attached.
- The sandbox preview and the production error route are separate concerns on Android; a visual preview can validate the template even when the app route is harder to reach directly.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/services/LaneShadowError.kt` - typed sealed error taxonomy.
- `android/app/src/main/java/com/laneshadow/services/LaneShadowErrorMapper.kt` - pure throwable-to-error mapper.
- `android/app/src/main/java/com/laneshadow/services/SignOutFlow.kt` - IO sign-out flow plus navigation event stream.
- `android/app/src/main/java/com/laneshadow/ui/error/ErrorUiState.kt` - error screen state and suggestion models.
- `android/app/src/main/java/com/laneshadow/ui/error/ErrorViewModel.kt` - error handling and suggestion derivation.
- `android/app/src/main/java/com/laneshadow/ui/error/ErrorRoute.kt` - template wiring for the error screen.
- `android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt` - sign-out navigation event collection and error route destination.
- `android/app/src/main/res/values/strings.xml` - localized error copy resources.
- `android/app/src/test/java/com/laneshadow/services/LaneShadowErrorTest.kt` - mapper and resource-id coverage.
- `android/app/src/test/java/com/laneshadow/ui/error/ErrorViewModelTest.kt` - unauthenticated sign-out and plan-limit chip coverage.
