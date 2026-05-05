# Android Learnings: IDLE-S06-AND-T01

## Implementation Date
2026-05-04

## Edge Cases Discovered

### 1. Time-based Greeting Scope Boundaries
- **Issue**: Initial implementation had off-by-one errors in hour boundaries for TONIGHT scope
- **Resolution**: Spec clearly defines TONIGHT as hours 18-23 AND 0-4 (wraps around midnight)
- **Test coverage**: Added specific test cases for hour 19 (TONIGHT) and hour 10 (TODAY)

### 2. DayOfWeek Formatting
- **Issue**: `DayOfWeek.name` returns uppercase (FRIDAY) but initial implementation used `.lowercase().replaceFirstChar { it.uppercase() }` which produced title case (Friday)
- **Resolution**: Use `DayOfWeek.name` directly for uppercase output as required by spec
- **Test failure**: "expected: FRIDAY · 68°F · CLEAR but was : Friday · 68°F · CLEAR"

### 3. Blank DisplayName Handling
- **Issue**: `displayName.split_whitespace()` on blank string could return empty list
- **Resolution**: Added explicit blank check before splitting: `if (displayName.isBlank()) return "Rider"`
- **Test coverage**: AC-5 specifically tests blank displayName fallback

### 4. Repository Constructor Parameters
- **Issue**: Hilt DI requires all constructor parameters to be providable or have default values
- **Resolution**: Added `timeProvider: () -> LocalTime = { LocalTime.now() }` with default value for testability
- **DI Module**: Added `@Provides @Singleton fun provideTimeProvider(): () -> LocalTime` in IdleModule

## API Contract Notes

### Convex Integration
- **Action**: `weather.getCurrentWeather` - Returns `WeatherSummary` with temp, condition, day-of-week, severity
- **Query**: `favorites.listFavoriteLocations` - Returns `List<FavoriteLocation>` with id, lat, lon, label
- **Status**: Backend implementations (IDLE-S06-CVX-T01, IDLE-S06-CVX-T02) must be complete before this feature works end-to-end
- **Current State**: Repository implementations return empty/null flows until Convex integration is wired

### Data Models
```kotlin
// Weather severity levels for advisory card gating
enum class WeatherSeverity { NONE, ADVISORY, WARNING }

// Weather summary from Convex action
data class WeatherSummary(
    val tempFahrenheit: Double,
    val conditionLabel: String,
    val dayOfWeek: DayOfWeek,
    val severity: WeatherSeverity = WeatherSeverity.NONE,
)

// Favorite location from Convex query
data class FavoriteLocation(
    val id: String,
    val lat: Double,
    val lon: Double,
    val label: String,
)
```

## UI Decisions

### Greeting Scope Computation
- **Decision**: Compute scope from `LocalTime.hour` in ViewModel, not in UI layer
- **Rationale**: Enables testability without Compose UI dependencies; follows existing pattern for time-based labels
- **Formula**: `hour in 18..23 || hour in 0..4 → TONIGHT, otherwise → TODAY`

### Meta Row Formatting
- **Decision**: Format as "{DAY_UPPERCASE} · {TEMP}°F · {CONDITION_UPPERCASE}"
- **Rationale**: Matches design spec; uses `·` (middle dot) separator as shown in mockups
- **Temperature**: Rounds to Int (68.4°F → 68°F)

### firstName Extraction
- **Decision**: Split on whitespace and take first non-blank token
- **Rationale**: Handles "Marcus Webb" → "Marcus", "Rider" → "Rider", "" → "Rider" (fallback)
- **Pattern**: Mirrors iOS implementation for cross-platform parity

### Mock Provider Integration
- **Decision**: Use `Greeting(headline, emphasis)` pattern instead of `AnnotatedString`
- **Rationale**: Mock providers expect String + emphasis substring; simpler than Compose AnnotatedString
- **Headline format**: "Where are we riding {scopeWord}, {firstName}?"
- **Emphasis**: scopeWord in lowercase ("today" or "tonight")

## Gotchas for iOS Implementer

### 1. Time Provider Dependency
- Android uses constructor-injected `timeProvider: () -> LocalTime` for testability
- iOS should consider similar pattern (e.g., `DateProvider` protocol) to avoid hardcoded `Date()` in tests

### 2. Repository Flow Error Handling
- **Pattern**: Each `.collect` must be wrapped in `.catch { }` to update `subscriptionError`
- **Critical**: Without `.catch`, Flow errors will crash the app instead of surfacing in UI
- **Example**:
  ```kotlin
  weatherRepository.subscribeToCurrentWeather()
      .catch { error ->
          _state.update { it.copy(subscriptionError = error.message) }
      }
      .collect { weather -> /* update state */ }
  ```

### 3. Hilt Duplicate Bindings
- **Issue**: Adding `@Binds` for same interface in multiple modules causes Dagger duplicate binding errors
- **Resolution**: Only bind each interface once (chose RepositoryModule over IdleModule for consistency)
- **Symptom**: `[Dagger/DuplicateBindings] WeatherRepository is bound multiple times`

### 4. Test Constructor Parameters
- **Issue**: Adding constructor parameters to ViewModel breaks existing tests
- **Resolution**: Must update ALL test instantiations to include new parameters
- **Pattern**: Provide fake implementations for all new repositories in tests

### 5. DayOfWeek Enum Values
- **Gotcha**: `DayOfWeek.FRIDAY.name` returns "FRIDAY" (uppercase)
- **iOS Equivalent**: `weekdaySymbols[0]` returns "Sunday" (localized)
- **Recommendation**: Use calendar's `weekdaySymbols` with locale-aware formatting if needed

## Files Created/Modified

### Modified
- `IdleUiState.kt` - Added 5 new fields: firstName, greetingScope, metaRow, weatherSummary, favoriteLocations, showAdvisoryCard, advisoryMessage; Added GreetingScope enum
- `IdleViewModel.kt` - Added weatherRepository, favoritesRepository, timeProvider constructor params; Added observeWeather(), observeFavorites() methods; Added extractFirstName(), computeGreetingScope(), buildMetaRow() helpers
- `IdleRoute.kt` - Updated toMockState() to build greeting headline with scope-aware emphasis
- `RepositoryModule.kt` - Added @Binds for WeatherRepository and FavoritesRepository
- `IdleViewModelTest.kt` - Added 6 new tests for AC-1 through AC-6

### Created
- `data/weather/WeatherSummary.kt` - Data model with temp, condition, day-of-week, severity
- `data/weather/WeatherRepository.kt` - Interface + @Singleton impl with subscribeToCurrentWeather()
- `data/favorites/FavoriteLocation.kt` - Data model with id, lat, lon, label
- `data/favorites/FavoritesRepository.kt` - Interface + @Singleton impl with subscribeToFavoriteLocations()
- `di/IdleModule.kt` - @Module with @Provides for timeProvider function

## Test Coverage Summary

| AC | Test Name | Status |
|----|-----------|--------|
| AC-1 | greeting_scope_evening_returns_tonight | PASS |
| AC-2 | greeting_scope_morning_returns_today | PASS |
| AC-3 | meta_row_formats_day_temp_condition | PASS |
| AC-4 | advisory_severity_sets_show_advisory_card | PASS |
| AC-5 | blank_display_name_fallback_to_rider | PASS |
| AC-6 | favorites_flow_populates_state | PASS |

All tests use fake repository implementations (not mocks) per project's SUPREME RULE against stubbing.

## Integration Status

**Ready for**: IDLE-S06-AND-T02 (LSMap favorite pin overlays)
**Depends on**: IDLE-S06-CVX-T01, IDLE-S06-CVX-T02 (Convex backend)
**Blocks**: IDLE-S06-AND-T02, IDLE-S06-AND-T03, IDLE-S06-AND-T04

## Platform-Specific Differences

### Android vs iOS
- **Time**: Android uses `java.time.LocalTime` (hour 0-23); iOS uses `Date` or `Calendar`
- **Flow vs Combine**: Android uses Kotlin Flow; iOS uses SwiftUI Combine/Publishers
- **DI**: Android uses Hilt; iOS uses @Environment or manual DI
- **State**: Android uses `StateFlow<IdleUiState>`; iOS uses `@Published var idleState: IdleState`

### Cross-Platform Parity
- **Story ID**: Both platforms use same AC definitions (AC-1 through AC-6)
- **Data Models**: WeatherSummary, FavoriteLocation map 1:1 across platforms
- **Business Logic**: greetingScope boundaries, firstName extraction, metaRow formatting identical
