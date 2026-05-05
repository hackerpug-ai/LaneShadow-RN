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

---

# Android Learnings: AND-T04 Instrumented Test Real-Data Wiring

## Implementation Date
2026-05-04

## Edge Cases Discovered
1. **Instrumented tests require debug source set dependencies** - Mock providers (IdleScreenState, Greeting, etc.) are in `app/src/debug/`, so instrumented tests (which run in `androidTest`) can only access them when compiled with the debug variant. This requires understanding Android source set visibility.
2. **connectedAndroidTest doesn't support --tests filter** - Unlike unit tests, instrumented tests cannot be filtered via command line. Must run full suite or use Gradle test tasks with different configurations.
3. **Device/emulator required for instrumented tests** - Cannot run instrumented tests without a connected device or emulator. This is a key difference from unit tests which run on the JVM.
4. **FavoriteLocation parameter names** - The data class uses `lat` and `lon`, not `latitude` and `longitude`. Important to check actual data class signatures.

## API Contract Notes
- `IdleScreenState` from debug mock providers is the canonical shape for UI state
- `FavoriteLocation` has parameters: `id`, `lat`, `lon`, `label`
- `Greeting` has parameters: `meta`, `headline`, `emphasis`
- `LocationContext` has parameters: `label`, `mode`
- Test tags used for Compose testing: `"greeting-overlay"`, `"greeting-meta"`, `"greeting-headline"`, `"chat-input"`, `"idlescreen-map"`, `"advisory-card"`, `"ls-topbar"`

## UI Decisions
- **Instrumented tests verify UI rendering** - These tests confirm that UI components are present and correctly display data from state
- **Test tags for accessibility** - All major UI components have test tags for verification
- **Mock state simulates real data** - Tests use IdleScreenState to simulate the data that would come from IdleViewModel

## Gotchas for iOS Implementer
1. **Debug vs Release source sets** - Mock providers and test helpers may only be available in debug builds, affecting test strategy
2. **Instrumented tests require hardware** - Plan for emulator/device setup in CI/CD for these types of tests
3. **Test tag consistency** - Ensure test tags match between platforms for cross-platform consistency
4. **Parameter naming** - Double-check data class parameter names as they may differ from expected conventions

## Files Created/Modified
- `android/app/src/androidTest/java/com/laneshadow/ui/idle/IdleScreenInstrumentedTest.kt` - NEW: 8 instrumented tests for IdleScreen UI verification

## Test Coverage
- `greeting_overlay_components_are_displayed` - Verifies greeting overlay, meta text, and headline are rendered
- `chat_input_with_location_badge_is_displayed` - Verifies chat input with location badge is rendered
- `map_is_displayed_with_favorite_locations` - Verifies map component is rendered with favorite locations
- `top_bar_with_menu_is_displayed` - Verifies top bar with menu button is rendered
- `weather_advisory_card_is_displayed_when_enabled` - Verifies advisory card appears when showAdvisoryCard is true
- `no_location_variant_shows_correct_ui` - Verifies no-location variant displays correctly
- `suggestion_chips_are_displayed` - Verifies suggestion chips are rendered in chat input
- `greeting_shows_italic_emphasis_on_scope_word` - Verifies greeting headline with italic emphasis

## Running Tests
```bash
# Compile instrumented tests
./gradlew :app:compileDebugAndroidTestKotlin

# Run instrumented tests (requires emulator/device)
./gradlew :app:connectedDebugAndroidTest
```

## Limitations
- Tests require running emulator or connected device
- Cannot filter individual tests via command line (must run full suite)
- Full integration with real Convex data not tested (requires authenticated backend)
- Manual device testing recommended for complete E2E verification

## Future Improvements
- Add Hilt testing dependencies for true integration tests with real repositories
- Set up CI/CD with emulator for automated instrumented test runs
- Add screenshot testing for visual regression detection
- Consider adding Espresso tests for deeper UI interaction testing
