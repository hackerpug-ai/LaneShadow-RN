# iOS Learnings: IDLE-S06-IOS-T01 — IdleViewModel Evolution

## Implementation Date
2026-05-04

## Edge Cases Discovered

### 1. Type Name Conflicts
**Issue**: `WeatherSummary` already existed in `NavigatorDomain.swift` for mock providers, causing naming collision with Convex types.

**Resolution**: Renamed Convex version to `CurrentWeatherSummary` to avoid ambiguity.

**Lesson**: Always search the codebase for existing type names before adding new Convex types. Mock providers and production types often share similar names.

### 2. SavedRoutesDocument Schema Change
**Issue**: Generated Convex types added `routeFingerprint` field to `SavedRoutesDocument`, breaking existing stub code.

**Resolution**: Updated `StubLaneShadowConvexClient.simulateSavedRoute()` to include the new field in initialization.

**Lesson**: Generated Convex types can change at any time. Keep stub implementations in sync with generated code.

### 3. SwiftFormat and Sendable Warnings
**Issue**: Pre-existing warnings in the codebase about non-Sendable closures in @Sendable contexts.

**Resolution**: Did not fix these as they were out of scope for this task. Focused on new code only.

**Lesson**: Pre-existing warnings should be tracked separately. Don't let them block new feature work.

## API Contract Notes

### CurrentWeatherSummary Structure
```swift
struct CurrentWeatherSummary: Decodable, Equatable, Sendable {
    let temperatureF: Int
    let condition: String
    let severity: WeatherSeverity?  // .advisory or .warning
    let advisoryLabel: String?      // e.g., "Weather advisory"
    let advisoryBody: String?       // Detailed message
}
```

**Key insight**: Advisory fields are all optional. Weather can exist without an advisory. Only create `WeatherAdvisory` object when ALL three fields (severity, label, body) are present.

### FavoriteLocation Structure
```swift
struct FavoriteLocation: Decodable, Equatable, Sendable {
    let id: String
    let label: String
    let lat: Double
    let lng: Double
    let createdAt: Double
}
```

**Usage pattern**: Subscribe to favorites stream, use first favorite as default user location for weather fetching.

## UI Decisions

### Greeting Scope Computation
**Decision**: Base scope solely on hour-of-day (hour < 17 → "today", hour >= 17 → "tonight").

**Rationale**: Spec explicitly states "Dark colorScheme alone does NOT flip scope." This means the scope is time-based, not theme-based.

**Implementation**: Use `Calendar.current.component(.hour, from: Date())` for deterministic hour calculation.

### firstName Extraction
**Decision**: Split on first whitespace; empty/nil → "rider".

**Rationale**: Matches Android behavior and provides a friendly fallback for incomplete user data.

**Implementation**:
```swift
private func extractFirstName(from displayName: String) -> String {
    let trimmed = displayName.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else { return "rider" }
    if let firstSpaceIndex = trimmed.firstIndex(of: " ") {
        return String(trimmed[..<firstSpaceIndex])
    }
    return trimmed
}
```

### metaRow Format
**Decision**: `"{WEEKDAY} · {TEMP}°F · {CONDITION}"` (all uppercase except degree symbol).

**Rationale**: Matches design spec exactly. Uses bullet separator (·) not hyphen.

**Implementation**: DateFormatter for weekday, string interpolation for rest.

## Platform-Specific Notes

### SwiftUI Observation
**Pattern**: Use `@Observable` macro (not `ObservableObject`) for all new ViewModels.

**Key difference**: `@Observable` doesn't require `@Published` wrapper. All stored properties are automatically observable.

### AsyncStream Subscriptions
**Pattern**: Append new observation tasks to `observationTasks` array, cancel all in `stopObserving()`.

**Gotcha**: Must capture `convexClient` in task capture list to avoid retain cycles:
```swift
Task { [weak self, convexClient] in
    // Use convexClient directly, not self?.convexClient
}
```

### MainActor Requirements
**Pattern**: All ViewModels must be `@MainActor` since they update UI state.

**Gotcha**: When calling `MainActor.run` inside async tasks, use explicit `await MainActor.run` to avoid actor hopping warnings.

## Files Created/Modified

### Created
- `ios/LaneShadowTests/Features/Idle/IdleViewModelTests.swift` — 7 tests covering AC-1 through AC-5

### Modified
- `ios/LaneShadow/Features/Idle/IdleViewModel.swift` — Added greeting properties, weather/favorites subscriptions, helper methods
- `ios/LaneShadow/Features/Idle/IdleScreenContainer.swift` — Pipes new ViewModel properties to IdleScreen
- `ios/LaneShadow/Services/ConvexClient+LaneShadow.swift` — Added CurrentWeatherSummary, FavoriteLocation, protocol methods
- `ios/LaneShadow/Views/Templates/IdleScreen.swift` — Added parameters for greetingHeadline, greetingScope, metaRow, weatherAdvisory
- `ios/LaneShadowTests/Helpers/StubLaneShadowConvexClient.swift` — Added stub implementations with continuation injection

## Testing Strategy

### Manual Verification
Due to pre-existing test target compilation errors, verified logic manually:
- firstName extraction: Tested all edge cases (empty, whitespace, nil, single word)
- greeting scope: Verified against current hour (19 → "tonight" ✓)
- AC-6 regression: Confirmed no forbidden symbols in IdleScreen.swift

### Test File Structure
Created comprehensive test file but could not run due to pre-existing test target issues. Tests are ready to run once those issues are resolved.

## Dependencies

### Convex Backend
- **Depends on**: `db/favoriteLocations:list` query (IDLE-S06-CVX-T01)
- **Depends on**: `actions/weather:getCurrentWeather` action (IDLE-S06-CVX-T02)

### Blocked Tasks
This implementation blocks:
- IDLE-S06-IOS-T02 (LSPaperMap → LSMap replacement)
- IDLE-S06-IOS-T03 (LocationService creation)
- IDLE-S06-IOS-T04 (DesignReviewCaptureTests)

## Known Limitations

1. **Test Infrastructure**: Pre-existing compilation errors in test target prevent automated test execution. Tests are written and should pass once infrastructure is fixed.

2. **Time-Based Testing**: Cannot deterministically test time-based logic (greeting scope) without injecting a Clock/Calendar provider. Current tests verify logic against actual current time.

3. **Weather Location**: Currently uses first favorite location as default. Future T03 task will add proper location service integration.

## Recommendations for Future Tasks

1. **Inject Time Provider**: For TDD-compliant testing of time-based logic, inject a `Clock` protocol instead of using `Calendar.current` directly.

2. **Fix Test Infrastructure**: Address pre-existing compilation errors in test target before adding more tests.

3. **Location Service**: T03 should provide a proper `LocationService` to replace the "use first favorite" heuristic.
