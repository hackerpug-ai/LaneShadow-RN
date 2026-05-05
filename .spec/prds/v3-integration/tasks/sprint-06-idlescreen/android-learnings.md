# Android Learnings: AND-T03 Location Service + Geocode Pill + Chat Input Active

## Implementation Date
2026-05-04

## Edge Cases Discovered
1. **Android Location mocking in unit tests** - Android's `Location` class methods are not mocked in unit tests (Robolectric limitation). Solution: Created domain model `LocationCoordinate` instead of using Android's `Location` class directly in the repository layer.
2. **ConvexClientProvider is final** - Cannot extend `ConvexClientProvider` in tests. Solution: Use internal constructor with mocked `ConvexGateway` for testing.
3. **Complex AuthRepository interface** - Has many methods that must be implemented even for simple tests. Solution: Created helper function `createTestConvexClientProvider()` to reduce boilerplate.
4. **Google Play Services dependency** - Need `com.google.android.gms:play-services-location` for FusedLocationProviderClient and `kotlinx-coroutines-play-services` for `await()` extension.

## API Contract Notes
- Convex action `actions/places:reverseGeocode` takes `{ lat: number, lng: number }` and returns `{ label: string, placeId?: string }`
- GeocodeResult is wrapped in `Result<>` to handle Convex errors gracefully
- Location repository falls back to Santa Cruz coordinates (36.97, -122.03) on permission denied or provider unavailable

## UI Decisions
- **Location label in state**: Added `locationLabel: String?` to `IdleUiState` to hold the resolved place name
- **Location mode tracking**: Added `locationMode: String` to track "auto" vs "manual" location mode
- **Chat input enablement**: Added `isLocationEnabled: Boolean` to control chat input state (currently always true when location resolves)

## Gotchas for iOS Implementer
1. **Location domain model**: Don't use platform location objects directly in tests - create a simple domain model with lat/lng doubles
2. **Fallback coordinates**: Santa Cruz (36.97, -122.03) is the hardcoded fallback for permission denied/unavailable states
3. **Reverse geocode action**: Call `actions/places:reverseGeocode` with lat/lng, expect `{ label, placeId? }` response
4. **Location mode**: Set to "auto" when resolved from GPS, "manual" when user-selected
5. **Test complexity**: Testing location + Convex integration is complex - consider manual device testing for full E2E verification

## Files Created/Modified
- `android/app/src/main/java/com/laneshadow/data/location/LocationRepository.kt` - Repository interface and implementation
- `android/app/src/main/java/com/laneshadow/data/location/FusedLocationProviderImpl.kt` - FusedLocationProvider wrapper
- `android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt` - Added `reverseGeocode()` method and `GeocodeResult` data class
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleViewModel.kt` - Added location observation logic
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleUiState.kt` - Added locationLabel, locationMode, isLocationEnabled fields
- `android/app/src/main/java/com/laneshadow/ui/idle/IdleRoute.kt` - Updated to use locationLabel from state
- `android/app/src/main/java/com/laneshadow/di/RepositoryModule.kt` - Added LocationRepository and FusedLocationProvider bindings
- `android/app/build.gradle.kts` - Added play-services-location and kotlinx-coroutines-play-services dependencies

## Test Coverage
- `LocationRepositoryTest.kt` - Tests for location retrieval, permission denied fallback, provider unavailable fallback
- `ConvexClientProviderTest.kt` - Tests for reverseGeocode success and error handling
- Note: Full integration tests for IdleViewModel location observation skipped due to complex ConvexClientProvider test setup - recommend manual device testing

## Performance Considerations
- Location fetch is one-time on ViewModel init (not a Flow)
- Reverse geocode happens synchronously after location fetch
- Consider adding location polling or Flow-based updates in future iterations if needed

## Future Improvements
- Add location permission request UI flow
- Add error handling for Convex unavailability during reverse geocode
- Consider caching geocode results to reduce API calls
- Add location updates listener for continuous tracking
