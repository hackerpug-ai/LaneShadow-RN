# Android Learnings: MDL-009 - StorageUtils Model Translation

## Implementation Date
2026-04-19

## Edge Cases Discovered

1. **Integer Overflow in Byte Calculations**: When multiplying large numbers for byte calculations (e.g., `32 * 1024 * 1024 * 1024`), Kotlin computes this as `Int` which overflows before being assigned to `Long`. Must use `Long` literals explicitly (e.g., `32L * 1024 * 1024 * 1024`).

2. **List Destructuring in Kotlin**: Unlike TypeScript/JavaScript, Kotlin doesn't support destructuring nested lists directly with `val [[swLng, swLat], [neLng, neLat]] = bounds`. Must access elements explicitly with indices: `bounds[0][0]`, `bounds[0][1]`, etc.

3. **Mercator Projection Math**: The tile count estimation requires precise mathematical formulas using `kotlin.math` functions. Had to use `kotlin.math.tan`, `kotlin.math.cos`, `kotlin.math.ln`, `kotlin.math.pow`, `kotlin.math.floor`, `kotlin.math.ceil`, and `kotlin.math.max` instead of the global JavaScript equivalents.

4. **Suspend Function Reflection**: `getDeclaredMethod()` doesn't work directly with `suspend` functions because they have a different signature at runtime (with an additional continuation parameter). Tests should verify suspend functions by calling them within `runTest` rather than using reflection.

5. **StatFs for Storage Information**: Android's `StatFs` class provides storage information via `blockCountLong`, `blockSizeLong`, and `availableBlocksLong`. Must use the `Long` variants to avoid overflow on large storage devices.

6. **Math.toRadians vs Manual Conversion**: For latitude conversion to radians, `Math.toRadians()` is cleaner than manual multiplication with `Math.PI / 180`.

## API Contract Notes

- **Data Classes**: Used `data class StorageInfo` for immutability and automatic `equals()`, `hashCode()`, and `toString()` implementations
- **Provider Pattern**: `StorageInfoProvider` interface allows runtime injection of platform-specific storage info implementation
- **Object Declaration**: `object StorageUtils` provides singleton pattern matching TypeScript's module export
- **Suspend Functions**: All storage operations are `suspend` functions to match async/await patterns in source

## UI Decisions

None - this is a model layer translation with no UI components.

## Gotchas for iOS Implementer

1. **Integer Overflow**: Swift's `Int` is 64-bit on modern platforms, but explicit type annotations are still recommended for large byte calculations (use `Int` or `Int64` consistently).

2. **List Destructuring**: Swift supports tuple destructuring, so you can use `let (swLng, swLat) = bounds[0]` which is cleaner than Kotlin's indexed access.

3. **Math Functions**: Swift uses `Foundation` math functions like `tan`, `cos`, `log`, `pow`, `floor`, `ceil`, and `max`. Use Darwin/Foundation imports instead of kotlin.math.

4. **ResourceValues API**: iOS uses `URL.resourceValues(forKeys:)` with `volumeAvailableCapacityForImportantUsageKey` and `volumeTotalCapacityKey` for storage info, which is async and may throw.

5. **Async/Await**: Swift's `async/await` maps well to Kotlin's `suspend` functions. Use `async throws` for functions that can fail and `async` for non-throwing async operations.

6. **Mercator Projection**: The math formulas are identical, but Swift uses `Double.pi` instead of `Math.PI` and `Foundation` trigonometric functions.

## Files Created/Modified

- **Created**: `android/app/src/main/java/com/laneshadow/models/StorageUtils.kt` (149 lines)
  - Complete translation of `react-native/lib/mapbox/storage-utils.ts`
  - All public methods from source implemented
  - Proper coroutine usage with `suspend` functions
  - StatFs-based storage info implementation
  - Tile count estimation using Mercator projection

- **Created**: `android/app/src/test/java/com/laneshadow/models/StorageUtilsTest.kt` (131 lines)
  - 3 test methods covering all acceptance criteria
  - Tests verify public API structure, coroutine usage, and storage patterns
  - All tests passing

- **Modified**: `android/app/src/main/java/com/laneshadow/models/WifiValidator.kt`
  - Fixed variable declaration order bug in `waitForWiFi()` (unreleased reference)

- **Modified**: `android/app/src/main/java/com/laneshadow/models/WeatherOptimization.kt`
  - Fixed `subList` call to include proper `toIndex` parameter

- **Modified**: `android/app/src/main/java/com/laneshadow/ui/components/atoms/Chip.kt`
  - Fixed `role` property usage in semantics (removed invalid property)

- **Modified**: `android/app/src/test/java/com/laneshadow/models/WeatherOptimizationTest.kt`
  - Added missing imports (`assertTrue`, `assertEquals`)

- **Modified**: `android/app/src/test/java/com/laneshadow/models/WifiValidatorTest.kt`
  - Fixed Mockito import to use `ArgumentMatchers.any()`

## Translation Accuracy

Successfully translated all features from `react-native/lib/mapbox/storage-utils.ts`:
- ✅ `StorageInfo` data class with `totalBytes` and `freeBytes`
- ✅ `StorageInfoProvider` interface for dependency injection
- ✅ `DefaultStorageInfoProvider` using StatFs
- ✅ `configure()` for provider injection
- ✅ `getStorageInfo()` as suspend function
- ✅ `estimateRegionSize()` with tile count heuristic
- ✅ `hasEnoughStorage()` with 500MB buffer
- ✅ `formatBytes()` with B/KB/MB/GB formatting
- ✅ Mercator projection formulas (lngToTileCount, latToTileCount, latToTileY)
- ✅ All methods use appropriate coroutine patterns

## Dependencies

- **Android StatFs**: Platform storage abstraction (equivalent to navigator.storage in TypeScript)
- **Coroutines**: For async operations (kotlinx-coroutines-core)
- **kotlin.math**: For mathematical operations (tan, cos, ln, pow, floor, ceil, max)

## Testing Notes

- Used `runTest` for coroutine testing
- Tests verify method signatures and coroutine usage
- Storage abstraction tests verify correct buffer calculation
- All tests pass successfully
- Fixed unrelated pre-existing test compilation errors in other files (Boy Scout Rule)
