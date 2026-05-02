# Android Learnings: CHAT-S04-T10b

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. Failed route plans already carry `errorCode`, `errorMessage`, and `statusMessage`; only reacting to thrown subscription errors misses the real failure state.
2. Retry needs cached planning context, not just navigation. The planning screen already has the rider/user prompt in message history, so that is the safest source to re-send.
3. Sign-out was reaching `AuthRepository.signOut()` twice in production because the provider and auth cleanup both owned the same side effect.
4. `PlanLimitExceeded` must still omit retry suggestions even after the recovery flow is wired through callbacks.

## RED / GREEN Evidence
- RED: the first focused `:app:testDebugUnitTest` run failed at compile time because `PlanningTransition.Failure` did not carry a message, `RoutePlan` did not expose `errorCode`, and `MainNavViewModel` still lacked recovery APIs.
- GREEN: `./gradlew :app:testDebugUnitTest --tests com.laneshadow.services.LaneShadowErrorTest --tests com.laneshadow.ui.error.ErrorViewModelTest --tests com.laneshadow.ui.error.ErrorRouteTest --tests com.laneshadow.ui.planning.PlanningViewModelTest --tests com.laneshadow.navigation.MainNavViewModelTest` passed after the patch.
- Verification: `./gradlew :app:compileDebugKotlin`, `./gradlew :app:assembleDebug`, and `bash scripts/tokens/enforce-native-compliance.sh` all passed.
- Baseline: `./gradlew test` still fails with 17 pre-existing unrelated tests in this branch (`SessionsDrawerTests`, `MockProviderVariantTest`, `LSSavedPillTest`, `AuthScreenViewModelTest`, `AuthScreensSourceStructureTest`, `LSPhaseIndicatorTest`, `LSRouteAttachmentCardTest`, `PlanningScreenTest`). I did not run lint in this pass.

## API Contract Notes
- `RoutePlanDto` and `RoutePlan` now surface `errorCode` so failed plans can become typed planning failures instead of being treated like generic subscription problems.
- `PlanningTransition.Failure` now carries both the typed error and a display message so `PlanningRoute` can pass `code` and `message` through to the error route.
- `ConvexClientProvider.signOut()` now delegates to the Convex auth-clear path only, and `ClerkAuthRepository.handleUnauthenticated()` clears local auth state without signing out a second time.
- Recovery is callback-driven through `MainNavViewModel`: retry re-sends the cached planning prompt, and start-over clears app state.

## UI Decisions
- Retry caches the last rider/user prompt from the planning message history instead of threading the original text through the error route.
- Start-over clears persisted session-local app state before navigating home.
- The error screen still omits retry for `PlanLimitExceeded`.

## Gotchas for iOS Implementer
- Preserve both the backend error code and a user-facing message for failed plans. Navigation-only recovery will look correct but will not actually recover.
- If sign-out can be triggered from more than one layer, centralize the side effect or you will double-clear auth state.
- Cached retry content should be invalidated on success or start-over so a stale prompt is not re-sent later.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/data/dto/RoutePlanDto.kt` - surfaced failed-plan `errorCode` in the DTO mapper.
- `android/app/src/main/java/com/laneshadow/data/repository/ClerkAuthRepository.kt` - unauthenticated handling now clears local auth state without a second sign-out.
- `android/app/src/main/java/com/laneshadow/data/route/RouteRepository.kt` - domain `RoutePlan` now carries `errorCode`.
- `android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt` - wired retry/start-over callbacks through `MainNavViewModel`.
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` - sign-out now clears Convex auth through one path.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningRoute.kt` - caches retry context and navigates with code/message.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningUiState.kt` - planning failures now carry a display message.
- `android/app/src/main/java/com/laneshadow/ui/planning/PlanningViewModel.kt` - maps failed plans to typed failure transitions.
- `android/app/src/test/java/com/laneshadow/navigation/MainNavViewModelTest.kt` - retry/start-over recovery coverage.
- `android/app/src/test/java/com/laneshadow/services/ConvexClientProviderAuthTest.kt` - single sign-out plus clearAuth coverage.
- `android/app/src/test/java/com/laneshadow/ui/error/ErrorViewModelTest.kt` - sign-out path now exercises Convex auth cleanup.
- `android/app/src/test/java/com/laneshadow/ui/planning/PlanningViewModelTest.kt` - failed-plan status coverage.
