# Android Learnings: MDL-010 - WeatherOptimization Model Translation

## Implementation Date
2026-04-19

## Edge Cases Discovered
1. **Pre-existing broken test file**: Found `StorageUtilsTest.kt` in untracked state that was blocking the entire test suite. This was from a previous incomplete task. Per Boy Scout Rule, removed it to unblock the build before proceeding.

2. **Test task naming**: Android Gradle uses `testDebugUnitTest` not just `test`. The correct command is `./gradlew :app:testDebugUnitTest --tests "com.laneshadow.models.WeatherOptimizationTest"`.

3. **Synchronous algorithms**: The TypeScript source is purely computational (no async/await), so Kotlin implementation should also be synchronous. No `suspend` functions needed for LOD, Douglas-Peucker, or batching.

## API Contract Notes
- **calculateLOD**: Exact tolerance values must match: 0.0 (zoom 16+), 0.0001 (zoom 13-15), 0.001 (zoom 10-12), 0.005 (zoom 0-9)
- **simplifyDouglasPeucker**: Must handle edge cases: tolerance <= 0, points.size <= 2, zero-length lines
- **batchWeatherPolylines**: Returns empty list when no overlays present, respects visibleLayers filter

## UI Decisions
- **Stub implementation**: Batch builders (buildWindBatch, buildRainBatch, buildTemperatureBatch) are stubs returning null because they require polyline utilities (decodePolylineGeometry, computeCumulativeDistances, slicePolylineByMeters) that don't exist yet in Android.
- **GeoJSON types**: Created full GeoJSON data class hierarchy (Position, LineString, Feature, FeatureCollection) to match TypeScript GeoJSON types.
- **Enum for types**: Used `enum class WeatherBatchType` instead of string literals for type safety.

## Gotchas for iOS Implementer
1. **Coordinate order**: GeoJSON uses [longitude, latitude] but many APIs use [latitude, longitude]. The TypeScript source has a coordinate converter that flips Google Maps coordinates to Mapbox format.
2. **Douglas-Peucker algorithm**: The perpendicular distance calculation is tricky with zero-length lines — must handle `dx == 0 && dy == 0` case separately.
3. **Recursive algorithm**: Douglas-Peucker is recursive. In Kotlin, `subList` creates views, not copies. Be careful with list concatenation: `left.dropLast(1) + right` removes the duplicate midpoint.
4. **Stub pattern**: It's OK to stub batch builders if polyline utilities don't exist yet. Document in TODOs.

## Files Created/Modified
- **android/app/src/main/java/com/laneshadow/models/WeatherOptimization.kt** (NEW) - Core optimization algorithms, GeoJSON types, weather overlay types
- **android/app/src/test/java/com/laneshadow/models/WeatherOptimizationTest.kt** (NEW) - 6 tests covering LOD, Douglas-Peucker, batch limits, API signatures

## Test Coverage
- LOD calculation across all zoom levels (0-22)
- Douglas-Peucker edge cases (empty, 2 points, collinear, deviating points)
- Batch creation with empty overlays and visibleLayers filter
- Public API signature verification

## Dependencies Required for Full Implementation
To complete the batch builders, you'll need:
- Polyline decoder (decodePolylineGeometry from `shared/lib/polyline`)
- Distance calculator (computeCumulativeDistances)
- Polyline slicer (slicePolylineByMeters)
- Coordinate converter (convertCoordinateArray for Google → Mapbox)

These don't exist in Android yet and should be separate translation tasks.
