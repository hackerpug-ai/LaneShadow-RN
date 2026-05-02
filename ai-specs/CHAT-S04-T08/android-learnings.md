# Android Learnings: Route Details Wiring

## Implementation Date
2026-05-02

## Edge Cases Discovered
1. `RouteDetailsViewModel` must derive `routePlanId` from the active plan list, but the selected option can still be missing from the first candidate. I used a match-on-option-id first, then completed-plan fallback, then first-plan fallback.
2. Save-sheet visibility needs an internal hot collector in tests. Without it, `stateIn(WhileSubscribed(5_000))` can stop after the first assertion collector completes, and `showSaveSheet` never re-emits for the saved copy.
3. The saved-route repository cannot eagerly construct `ConvexClientWithAuth` in unit tests. I moved the client behind `lazy` so the fake repository can subclass it without triggering the native auth path.

## API Contract Notes
- `RouteRepository.subscribeToEnrichments(routePlanId)` returns `JsonElement` and the backend query can legally return `null`, so enrichment parsing must default to an empty six-hour list instead of failing the whole route screen.
- `SavedRouteRepository.matchesFingerprint(routeIndexFingerprint)` compares the public saved-routes list locally against `routeIndex.routeFingerprint`; no dedicated backend fingerprint query exists.
- The fingerprint format is `fnv1a:<hash>` and must be computed from provider + overview polyline + leg segments in the same order as the backend tool.

## UI Decisions
- `RouteDetailsRoute` adapts the ViewModel state into the existing `RouteDetailsScreen` template at the route boundary only.
- `SaveFavoriteSheet` remains out of scope for this sprint. The ViewModel only hoists `showSaveSheet`; the actual sheet body is deferred.
- Enrichment loading is intentionally non-blocking. The route detail view should render instrument data as soon as plan JSON is available, even if weather has not emitted yet.

## Gotchas for iOS Implementer
- The Android template still expects the old sandbox `RouteDetailsScreenState` shape, so the live state needs a translation layer at the boundary.
- Weather forecast payloads are loose JSON. The parser needs to tolerate missing or null enrichments and still render the route.
- The repo-level lint/`detekt` run currently fails on a pre-existing `LoginSmokeTest.kt` view-model-in-composable issue outside this task’s scope.

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsViewModel.kt` - live route-details state machine and fingerprint computation.
- `android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsRoute.kt` - route boundary adapter into the existing template.
- `android/app/src/main/java/com/laneshadow/ui/routedetails/RouteDetailsUiState.kt` - UI state, instrument data, and save state.
- `android/app/src/main/java/com/laneshadow/data/route/RouteRepository.kt` - enrichment subscription wiring.
- `android/app/src/main/java/com/laneshadow/data/savedroutes/SavedRouteRepository.kt` - saved-route fingerprint matching.
- `android/app/src/main/java/com/laneshadow/data/dto/HourlyForecastDto.kt` - hourly forecast DTO.
- `android/app/src/main/java/com/laneshadow/data/dto/RouteEnrichmentDto.kt` - enrichment DTO and weather parsing helpers.
- `android/app/src/main/java/com/laneshadow/navigation/MainNavGraph.kt` - `Route.RouteDetails` nav wiring.
- `android/app/src/test/java/com/laneshadow/ui/routedetails/RouteDetailsViewModelTest.kt` - AC coverage for the route-details state machine.
