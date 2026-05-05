# Android Learnings: IDLE-S06-AND-T02 — Mapbox Warm-Paper Map + Copper Favorite Pin Overlays

## Implementation Date
2026-05-04

## Edge Cases Discovered

1. **Mapbox AnnotationManager API Lifecycle**
   - `PointAnnotationManager` is created per `MapView` instance via `mapView.annotations.createPointAnnotationManager()`
   - Must call `pointAnnotationManager.deleteAll()` before adding new annotations to avoid duplicates
   - AnnotationManager persists across `AndroidView` update calls, so explicit cleanup is required

2. **Modifier Parameter Ordering in Composables**
   - When adding a new `modifier` parameter to an existing composable, it should typically be the last parameter (after all content parameters)
   - The `modifier` should be composed with existing modifiers using the pattern: `val hostModifier = modifier.fillMaxSize().nestedScroll(...)`
   - This allows callers to chain their own modifiers (like `.testTag()`) while preserving internal modifiers

3. **Backward Compatibility with Default Parameters**
   - Adding new parameters with default values (`emptyList()`) maintains backward compatibility
   - Existing call sites without the new parameter continue to work without changes
   - Tests should verify both the new functionality and backward compatibility

## API Contract Notes

- **Mapbox Style URIs**: Already defined in `GeneratedTokens.map.style.light` (`mapbox://styles/laneshadow/clxwarm01`) and `GeneratedTokens.map.style.dark`
- **FavoriteLocation Domain Entity**: Simple data class with `id`, `lat`, `lon`, `label` — no complex nested structures
- **Coordinate System**: Mapbox uses `Point.fromLngLat(lon, lat)` (longitude first), which differs from some other map APIs

## UI Decisions

- **Copper Color Choice**: Used `GeneratedTokens.color.Signal.default` (copper) for favorite pin fill color to match the LaneShadow brand
- **White Ring Color**: Used `GeneratedTokens.color.Surface.card` for the ring to provide contrast against the warm-paper map background
- **Pin Implementation**: Used Mapbox `AnnotationManager` API rather than Canvas overlay for better performance and native map integration
- **Default Marker Icon**: Used `"default-marker"` icon for initial implementation; custom icons can be added later by registering images with the Mapbox map

## Gotchas for iOS Implementer

1. **Mapbox Annotation Manager Lifecycle**
   - On iOS, you'll need to manage `AnnotationOrchestrator` or individual annotation managers similarly
   - Make sure to remove old annotations before adding new ones to avoid duplicates
   - The annotation manager lifecycle is tied to the map view, not the composable/view model

2. **Modifier Pattern**
   - When adding the `favoriteLocations` parameter to `LSMap` on iOS, consider adding a `modifier` parameter as well for test tags
   - The modifier should be the last parameter and compose with existing modifiers

3. **Token Color Usage**
   - Use the same token colors: `Tokens.Color.Signal.default` (copper) and `Tokens.Color.Surface.card` (white)
   - Never use hardcoded color literals like `Color(red: 0.93, green: 0.49, blue: 0.17)` — always use tokens

4. **testTag Naming**
   - Use the same test tag name: `"idlescreen-map"` for cross-platform consistency
   - This enables parallel UI testing across platforms

5. **Backward Compatibility**
   - Add `favoriteLocations` with a default empty array to maintain backward compatibility
   - Existing call sites should continue to work without modification

## Files Created/Modified

### Modified
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMapTypes.kt` — Added `LSMapFavoritePinSpec` and `resolveLSMapFavoritePinSpecs()`
- `android/app/src/main/java/com/laneshadow/ui/atoms/LSMap.kt` — Added `favoriteLocations` parameter, `modifier` parameter, and `applyFavoritePinAnnotations()` function
- `android/app/src/main/java/com/laneshadow/ui/templates/IdleScreen.kt` — Pass `favoriteLocations` to LSMap and add testTag
- `android/app/src/debug/java/com/laneshadow/sandbox/mockproviders/NavigatorDomain.kt` — Added `favoriteLocations` to `IdleScreenState`
- `android/app/src/release/java/com/laneshadow/sandbox/mockproviders/NavigatorDomain.kt` — Added `favoriteLocations` to `IdleScreenState`
- `android/app/src/test/java/com/laneshadow/ui/atoms/LSMapTest.kt` — Added tests for favorite pin specs and backward compatibility

### TDD Evidence
- All tests pass: `./gradlew :app:testDebugUnitTest --tests 'com.laneshadow.ui.atoms.LSMapTest'`
- No hardcoded color literals in implementation
- Token compliance verified
- Backward compatibility verified
