# Android Learnings: Route Details Wiring

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. `RouteDetailsViewModel` must derive `routePlanId` from the active plan list, but the selected option can still be missing from the first candidate. I used a match-on-option-id first, then completed-plan fallback, then first-plan fallback.
2. Save-sheet visibility needs an internal hot collector in tests. Without it, `stateIn(WhileSubscribed(5_000))` can stop after the first assertion collector completes, and `showSaveSheet` never re-emits for the saved copy.
3. The saved-route repository cannot eagerly construct `ConvexClientWithAuth` in unit tests. I moved the client behind `lazy` so the fake repository can subclass it without triggering the native auth path.
4. `getSavedRoutesList` caps results at 50, so already-saved checks must page with `beforeDate` instead of trusting the first response.

## API Contract Notes
- `RouteRepository.subscribeToEnrichments(routePlanId)` returns `JsonElement` and the backend query can legally return `null`, so enrichment parsing must default to an empty six-hour list instead of failing the whole route screen.
- `SavedRouteRepository.matchesFingerprint(routeIndexFingerprint)` compares the public saved-routes list locally against `routeIndex.routeFingerprint`; no dedicated backend fingerprint query exists.
- Saved-route pagination uses the oldest `createdAt` from each page minus one as the next `beforeDate`, and stops on a short page or repeated page to avoid loops.
- The fingerprint format is `fnv1a:<hash>` and must be computed from provider + overview polyline + leg segments in the same order as the backend tool.

## UI Decisions
- `RouteDetailsRoute` now renders the same map-layer and route-sheet organisms directly so the sheet can receive the ViewModel's computed instrument readout strings. The legacy template still formats raw sandbox fields and would lose the computed km/min/m values.
- `SaveFavoriteSheet` remains out of scope for this sprint. The ViewModel only hoists `showSaveSheet`; the actual sheet body is deferred.
- Enrichment loading is intentionally non-blocking. The route detail view should render instrument data as soon as plan JSON is available, even if weather has not emitted yet.

## Gotchas for iOS Implementer
- The Android template still expects the old sandbox `RouteDetailsScreenState` shape and formats raw route fields; live Route Details should preserve computed metrics at the route boundary or organism level.
- Weather forecast payloads are loose JSON. The parser needs to tolerate missing or null enrichments and still render the route.
- Saved-route matching should not assume one public list page contains all favorites.
- The repo-level lint/`detekt` run currently fails on a pre-existing `LoginSmokeTest.kt` view-model-in-composable issue outside this task’s scope.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsViewModel.kt` - live route-details state machine and fingerprint computation.
- `android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsRoute.kt` - route boundary content adapter that preserves computed instrument readouts.
- `android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsUiState.kt` - UI state, instrument data, and save state.
- `android/app/src/main/java/com/laneshadow/data/route/RouteRepository.kt` - enrichment subscription wiring.
- `android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt` - saved-route fingerprint matching.
- `android/app/src/main/java/com/laneshadow/data/dto/HourlyForecastDto.kt` - hourly forecast DTO.
- `android/app/src/main/java/com/laneshadow/data/dto/RouteEnrichmentDto.kt` - enrichment DTO and weather parsing helpers.
- `android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt` - `Route.RouteDetails` nav wiring.
- `android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt` - AC coverage for the route-details state machine.
- `android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsRouteTest.kt` - route-boundary coverage for rendered computed instrument values.
- `android/app/src/test/java/com/laneshadow/data/savedroutes/SavedRouteRepositoryTest.kt` - pagination coverage for saved-route fingerprint matches beyond the first capped page.
