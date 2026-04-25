# Android Learnings: UC-SBX-03-android — Mock Data Providers + Fixtures

## Implementation Date
2026-04-25

## Task Summary
Implemented six Navigator screen mock providers (IdleMockProvider, PlanningMockProvider, RouteResultsMockProvider, RouteDetailsMockProvider, SessionsMockProvider, ErrorMockProvider) with typed Navigator domain entities and four variants each (default, empty, overflow, long-copy).

## Edge Cases Discovered

### 1. Keyword Escaping in Kotlin
**Issue**: The `when` keyword in Kotlin conflicted with the `Session` data class property name.
**Solution**: Used backticks to escape the keyword: `` `when`: String `` in the data class definition.
**Learning**: Always check for Kotlin keywords when naming properties from JSON schemas or API specs.

### 2. Test Path Resolution
**Issue**: Unit tests run from the `app/src/test` directory, not the project root.
**Solution**: Used relative path `"src/debug/java/com/laneshadow/sandbox/mockproviders"` instead of `"android/app/src/debug/java/..."` in test files.
**Learning**: Android test working directory is `app/src/test`, not project root.

### 3. Purity Test False Positives
**Issue**: Initial purity test detected "Convex" in comments and "suspend fun" in documentation.
**Solution**: Enhanced purity test to strip comments before checking for banned imports/patterns using regex.
**Learning**: Always strip comments when doing source code analysis to avoid false positives from documentation.

### 4. Object vs Class for Providers
**Decision**: Used `object` (singleton) for all mock providers instead of `class`.
**Rationale**: Mock providers are stateless singletons - no need for multiple instances. This matches the pattern for accessing generated fixtures.
**Learning**: Use `object` for stateless providers, `class` only when state or multiple instances are needed.

## API Contract Notes

### Navigator Domain Entities
- Created complete Kotlin data classes mirroring Convex schema types
- All properties are immutable (`val`) for thread safety
- Optional properties use nullable types (`String?`) instead of default values
- Collections use `List<T>` (immutable) by default

### MockProvider Interface
```kotlin
interface MockProvider<T> {
    fun value(variant: String = "default"): T
    val variants: List<String>
        get() = listOf("default", "empty", "overflow", "long-copy")
}
```

### Variant Behavior
- **default**: Canonical happy path with realistic data
- **empty**: Empty collections, minimal data for edge case testing
- **overflow**: 12+ items to stress scroll behavior
- **long-copy**: Long strings to test text wrapping and truncation

## UI Decisions

### Provider Location
**Decision**: Placed providers in `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/`
**Rationale**: Mock providers are debug-only infrastructure - they should never ship in release builds.
**Implication**: Release builds will not include mock provider code, keeping APK size smaller.

### Data Class Organization
**Decision**: Created separate `NavigatorDomain.kt` file with all domain entities
**Rationale**: Single source of truth for Navigator data shapes prevents duplication
**Implication**: All providers reference the same domain types, ensuring consistency

### Fixture File Organization
**Decision**: Created fixture JSON files in `tokens/sandbox/fixtures/` with naming convention `{entity}.fixtures.json`
**Rationale**: Platform-agnostic fixture storage allows both iOS and Android to consume the same source data
**Implication**: Future codegen step can generate platform-specific types from these fixtures

## Gotchas for iOS Implementer

### 1. Keyword Conflicts
Watch out for Swift keywords when naming properties from the Navigator schema:
- `when` → `when` (Swift also has this keyword)
- `fun` → not a keyword in Swift, but watch for similar conflicts
- Solution: Use backticks in both languages when necessary

### 2. Fixture Structure
The fixture JSON files use variant names as top-level keys:
```json
{
  "default": [...],
  "empty": [],
  "overflow": [...],
  "long-copy": [...]
}
```
This structure supports direct lookup by variant name in both Swift and Kotlin providers.

### 3. Type Matching
Ensure Swift struct field types match Kotlin data class types:
- Kotlin `Int` → Swift `Int`
- Kotlin `String?` → Swift `String?`
- Kotlin `List<T>` → Swift `[T]`
- Kotlin `Boolean` → Swift `Bool`

### 4. Provider Purity
The purity test enforces NO I/O in providers:
- No `URLSession`, `FileManager`, or network calls
- No `suspend` functions or coroutines
- No async patterns
- All data must be pre-defined or computed synchronously

### 5. Determinism
Providers MUST return identical data for identical variant strings:
```swift
let data1 = MyProvider.value(variant: "default")
let data2 = MyProvider.value(variant: "default")
assert(data1 == data2)  // MUST pass
```

## Files Created/Modified

### Created Files
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/MockProvider.kt` - Provider interface
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/NavigatorDomain.kt` - Domain entities
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/IdleMockProvider.kt` - Idle screen provider
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/PlanningMockProvider.kt` - Planning screen provider
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteResultsMockProvider.kt` - Route results provider
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/RouteDetailsMockProvider.kt` - Route details provider
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/SessionsMockProvider.kt` - Sessions provider
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/ErrorMockProvider.kt` - Error screen provider
- `android/app/src/test/java/com/laneshadow/sandbox/mockproviders/MockProviderExistenceTest.kt` - AC-1 tests
- `android/app/src/test/java/com/laneshadow/sandbox/mockproviders/MockProviderPurityTest.kt` - AC-5 tests
- `android/app/src/test/java/com/laneshadow/sandbox/mockproviders/MockProviderVariantTest.kt` - AC-3, AC-4 tests

### Fixture Files Created
- `tokens/sandbox/fixtures/users.fixtures.json` - User entity fixtures
- `tokens/sandbox/fixtures/navigator-routes.fixtures.json` - Route entity fixtures
- `tokens/sandbox/fixtures/sessions.fixtures.json` - Session entity fixtures
- `tokens/sandbox/fixtures/navigator-messages.fixtures.json` - Navigator message fixtures
- `tokens/sandbox/fixtures/weather-timelines.fixtures.json` - Weather timeline fixtures
- `tokens/sandbox/fixtures/planning-phases.fixtures.json` - Planning phase fixtures
- `tokens/sandbox/fixtures/suggestion-chips.fixtures.json` - Suggestion chip fixtures

## Test Coverage Summary
- **Total Tests**: 36 tests (7 existence + 3 purity + 26 variant)
- **Pass Rate**: 100% (36/36)
- **Coverage**: All 6 providers × 4 variants tested
- **Determinism**: Verified for all providers
- **Purity**: Verified for all providers (no I/O, no async)

## Performance Notes
- All providers are pure functions - no side effects
- Zero allocations after initialization (objects are singletons)
- Variant switching is O(1) lookup
- Data is immutable, safe for concurrent access

## Next Steps
- Wire providers into Navigator screen stories (UC-SCR-01 through UC-SCR-06)
- Implement `.select` argType controls in stories for variant switching (UC-SBX-02)
- Consider adding generated `Fixtures.kt` from fixture JSON files (future codegen task)
