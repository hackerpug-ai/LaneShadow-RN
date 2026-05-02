# Android Learnings: CHAT-S04-T06 RouteResults Wiring

## Implementation Date
2026-05-01

## Edge Cases Discovered
1. The route-results attachment node was clickable in semantics but unreliable for physical hit testing inside the map overlay. The connected test had to invoke `SemanticsActions.OnClick` on the wrapper node instead of relying on coordinate-based clicking.
2. The shared `LSRouteAttachmentCard` molecule already owns its own accessibility semantics when `onTap` is non-null. To keep the route-results tap contract local, the wrapper composable had to carry `testTag`, `contentDescription`, `Role.Button`, and `clickable` while leaving the shared molecule unchanged.
3. `connectedDebugAndroidTest` class filters that include `#` must be quoted in zsh, otherwise the shell treats the filter suffix like a comment and the Gradle invocation fails before the test runs.

## API Contract Notes
- `RouteRepository.subscribeToPlanById(routePlanId)` now backs the route-results screen with the live plan payload from `db.routePlans.getPlanById`.
- `Route.RouteDetails(sessionId, routeOptionId)` is the typed navigation contract required by AC-3. This is a scope exception from the earlier untyped route model, but it keeps route-results navigation explicit and testable.
- Route selection remains local UI state only; the backing plan/options are not mutated client-side.

## UI Decisions
- Route attachment taps are handled by a route-results-specific wrapper instead of the shared card molecule so the screen can own accessibility and navigation behavior without widening the shared component contract.
- The wrapper semantics node is the test target for route-card navigation because the overlay stack makes physical hit testing less reliable than semantics actions.
- The selected attachment card still uses the shared molecule for layout and presentation, but the route-results screen adds the tap affordance.

## Gotchas for iOS Implementer
- If a route card sits inside a dense overlay stack, prefer an explicit accessibility action target over a physical point tap in tests.
- Typed route models are easier to verify than concatenated string routes once navigation arguments grow beyond a single identifier.
- Keep the navigation contract and the UI card contract separate; the route-results layer may need its own wrapper even if the underlying molecule is shared.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsRoute.kt` - route-results UI, wrapper semantics, and navigation callback wiring.
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsViewModel.kt` - live state derivation, selection, dismiss, recall, and refine logic.
- `android/app/src/main/java/com/laneshadow/ui/routeresults/RouteResultsUiState.kt` - state and route attachment models.
- `android/app/src/main/java/com/laneshadow/data/route/RouteRepository.kt` - plan subscription API for route results.
- `android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt` - production destination wiring.
- `android/app/src/main/java/com/laneshadow/navigation/Route.kt` - typed `Route.RouteDetails(sessionId, routeOptionId)` scope exception.
- `android/app/src/test/java/com/laneshadow/ui/routeresults/RouteResultsViewModelTest.kt` - unit coverage for AC-1, AC-2, AC-4, and AC-5.
- `android/app/src/androidTest/java/com/laneshadow/ui/routeresults/RouteResultsRouteTest.kt` - connected navigation coverage for AC-3.
- `.spec/prds/v3-integration/tasks/sprint-04-conversational-planning-loop/CHAT-S04-T06-android-route-results-wiring.md` - task evidence and scope notes.
