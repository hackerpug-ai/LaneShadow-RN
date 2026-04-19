# MODEL-weather-optimization.md - Weather Batch Rendering Translation Plan

**Source File**: `react-native/lib/mapbox/weather-optimization.ts`
**Classification**: PORT
**Priority**: P2 (weather overlays)

---

## SOURCE ANALYSIS

### Purpose
Batch rendering optimization for weather segments. Implements level-of-detail (LOD) simplification based on zoom, Douglas-Peucker geometry simplification, and batch creation by weather type (wind, rain, temperature).

### Exports
- `calculateLOD(zoom)` → `number` (tolerance for simplification)
- `simplifyDouglasPeucker(points, tolerance)` → `Position[]`
- `batchWeatherPolylines(legs, overlays, semantic, options)` → `BatchedWeatherLayer[]`

### Dependencies
- `../../../server/lib/polyline` (SHARED-TS) - Polyline utilities
- `../../../server/models/saved-routes` (SHARED-TS) - Overlay types
- `../../styles/types` (SHARED-TS) - ExtendedTheme
- `../map/overlay-colors.ts` (SHARED-TS) - Color utilities
- `./coordinate-converter.ts` (SHARED-TS) - Coordinate conversion

### Key Behaviors
- LOD tolerance based on zoom level (0-22)
- Douglas-Peucker simplification algorithm
- Batch creation by weather type (max 3 ShapeSources)
- Color resolution via semantic theme
- Geometry slicing by meters along route

---

## TRANSLATION STRATEGY

### Android (Kotlin)

```kotlin
// weather/WeatherOptimization.kt
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import org.json.JSONArray
import org.json.JSONObject

data class Position(val lng: Double, val lat: Double)

data class BatchedWeatherLayer(
    val id: String,
    val shape: FeatureCollection,
    val type: WeatherBatchType,
    val lineWidth: Int,
    val lineOpacity: Double
)

enum class WeatherBatchType {
    WIND,
    RAIN,
    TEMPERATURE
}

data class FeatureCollection(
    val type: String = "FeatureCollection",
    val features: List<Feature>
)

data class Feature(
    val type: String = "Feature",
    val properties: Map<String, Any>,
    val geometry: LineString
)

data class LineString(
    val type: String = "LineString",
    val coordinates: List<Position>
)

/**
 * Calculate simplification tolerance based on zoom level.
 * Higher zoom = more detail (lower tolerance).
 */
fun calculateLOD(zoom: Int): Double {
    return when {
        zoom >= 16 -> 0.0 // Street level: no simplification
        zoom >= 13 -> 0.0001 // City level: light simplification
        zoom >= 10 -> 0.001 // Country level: moderate simplification
        else -> 0.005 // World level: heavy simplification
    }
}

/**
 * Calculate perpendicular distance from a point to a line segment.
 */
private fun perpendicularDistance(point: Position, lineStart: Position, lineEnd: Position): Double {
    val dx = lineEnd.lng - lineStart.lng
    val dy = lineEnd.lat - lineStart.lat

    // Handle zero-length line
    if (dx == 0.0 && dy == 0.0) {
        return Math.sqrt(
            Math.pow(point.lng - lineStart.lng, 2.0) +
            Math.pow(point.lat - lineStart.lat, 2.0)
        )
    }

    val numerator = Math.abs(
        dy * point.lng - dx * point.lat + lineEnd.lng * lineStart.lat - lineEnd.lat * lineStart.lng
    )
    val denominator = Math.sqrt(dx * dx + dy * dy)

    return numerator / denominator
}

/**
 * Simplify a polyline using the Douglas-Peucker algorithm.
 */
fun simplifyDouglasPeucker(points: List<Position>, tolerance: Double): List<Position> {
    if (points.size <= 2) return points.toList()
    if (tolerance <= 0.0) return points.toList()

    var maxDist = 0.0
    var maxIndex = 0
    val end = points.size - 1

    for (i in 1 until end) {
        val dist = perpendicularDistance(points[i], points[0], points[end])
        if (dist > maxDist) {
            maxDist = dist
            maxIndex = i
        }
    }

    return if (maxDist > tolerance) {
        val left = simplifyDouglasPeucker(points.subList(0, maxIndex + 1), tolerance)
        val right = simplifyDouglasPeucker(points.subList(maxIndex), tolerance)

        left.dropLast(1) + right
    } else {
        listOf(points[0], points[end])
    }
}

/**
 * Batch weather overlay data into optimized layers by type.
 */
fun batchWeatherPolylines(
    legs: List<RouteLeg>,
    overlays: RouteOverlays,
    semantic: SemanticTheme,
    options: WeatherBatchOptions = WeatherBatchOptions()
): List<BatchedWeatherLayer> {
    val zoom = options.zoom ?: 15
    val prefix = if (options.routeId != null) "${options.routeId}-" else ""
    val layers = mutableListOf<BatchedWeatherLayer>()

    // Wind batch
    if (options.visibleLayers?.wind != false && overlays.wind != null) {
        val batch = buildWindBatch(legs, overlays.wind.byLeg, semantic, prefix, zoom)
        if (batch != null) layers.add(batch)
    }

    // Rain batch
    if (options.visibleLayers?.rain != false && overlays.rain != null) {
        val batch = buildRainBatch(legs, overlays.rain.byLeg, semantic, prefix, zoom)
        if (batch != null) layers.add(batch)
    }

    // Temperature batch
    if (options.visibleLayers?.temperature != false && overlays.temperature != null) {
        val batch = buildTemperatureBatch(legs, overlays.temperature.byLeg, semantic, prefix, zoom)
        if (batch != null) layers.add(batch)
    }

    return layers
}

// Helper classes for server types
data class RouteLeg(val geometry: String)
data class RouteOverlays(
    val wind: WindOverlays?,
    val rain: RainOverlays?,
    val temperature: TemperatureOverlays?
)
data class WeatherBatchOptions(
    val zoom: Int? = null,
    val routeId: String? = null,
    val visibleLayers: VisibleLayers? = null
)
data class VisibleLayers(
    val wind: Boolean? = null,
    val rain: Boolean? = null,
    val temperature: Boolean? = null
)

// Semantic theme for color resolution
interface SemanticTheme {
    fun getWindColor(level: String): Int
    fun getRainColor(level: String): Int
    fun getTemperatureColor(level: String): Int
}

// Batch builders would be implemented here
// buildWindBatch, buildRainBatch, buildTemperatureBatch
// These would decode polylines, slice by meters, apply simplification, and build GeoJSON
```

### iOS (Swift)

```swift
// weather/WeatherOptimization.swift
import Foundation
import CoreLocation
import MapboxMaps

struct Position: Codable {
    let lng: Double
    let lat: Double
}

struct BatchedWeatherLayer {
    let id: String
    let shape: FeatureCollection
    let type: WeatherBatchType
    let lineWidth: Int
    let lineOpacity: Double
}

enum WeatherBatchType {
    case wind
    case rain
    case temperature
}

struct FeatureCollection: Codable {
    let type: String
    let features: [Feature]
}

struct Feature: Codable {
    let type: String
    let properties: [String: Any]
    let geometry: LineString

    enum CodingKeys: String, CodingKey {
        case type, properties, geometry
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        type = try container.decode(String.self, forKey: .type)

        let propsDict = try container.decode([String: Any].self, forKey: .properties)
        properties = propsDict

        geometry = try container.decode(LineString.self, forKey: .geometry)
    }
}

struct LineString: Codable {
    let type: String
    let coordinates: [Position]
}

/**
 * Calculate simplification tolerance based on zoom level.
 * Higher zoom = more detail (lower tolerance).
 */
func calculateLOD(zoom: Int) -> Double {
    switch zoom {
    case 16...: return 0.0 // Street level: no simplification
    case 13..<16: return 0.0001 // City level: light simplification
    case 10..<13: return 0.001 // Country level: moderate simplification
    default: return 0.005 // World level: heavy simplification
    }
}

/**
 * Calculate perpendicular distance from a point to a line segment.
 */
private func perpendicularDistance(point: Position, lineStart: Position, lineEnd: Position) -> Double {
    let dx = lineEnd.lng - lineStart.lng
    let dy = lineEnd.lat - lineStart.lat

    // Handle zero-length line
    if dx == 0 && dy == 0 {
        let latDiff = point.lat - lineStart.lat
        let lngDiff = point.lng - lineStart.lng
        return sqrt(latDiff * latDiff + lngDiff * lngDiff)
    }

    let numerator = abs(
        dy * point.lng - dx * point.lat + lineEnd.lng * lineStart.lat - lineEnd.lat * lineStart.lng
    )
    let denominator = sqrt(dx * dx + dy * dy)

    return numerator / denominator
}

/**
 * Simplify a polyline using the Douglas-Peucker algorithm.
 */
func simplifyDouglasPeucker(points: [Position], tolerance: Double) -> [Position] {
    guard points.count > 2 else { return points }
    guard tolerance > 0 else { return points }

    var maxDist = 0.0
    var maxIndex = 0
    let end = points.count - 1

    for i in 1..<end {
        let dist = perpendicularDistance(
            point: points[i],
            lineStart: points[0],
            lineEnd: points[end]
        )

        if dist > maxDist {
            maxDist = dist
            maxIndex = i
        }
    }

    if maxDist > tolerance {
        let left = simplifyDouglasPeucker(
            points: Array(points[0...maxIndex]),
            tolerance: tolerance
        )

        let right = simplifyDouglasPeucker(
            points: Array(points[maxIndex...]),
            tolerance: tolerance
        )

        return left.dropLast() + right
    } else {
        return [points[0], points[end]]
    }
}

/**
 * Batch weather overlay data into optimized layers by type.
 */
func batchWeatherPolylines(
    legs: [RouteLeg],
    overlays: RouteOverlays,
    semantic: SemanticTheme,
    options: WeatherBatchOptions = WeatherBatchOptions()
) -> [BatchedWeatherLayer] {
    let zoom = options.zoom ?? 15
    let prefix = options.routeId != nil ? "\(options.routeId!)-" : ""
    var layers: [BatchedWeatherLayer] = []

    // Wind batch
    if options.visibleLayers?.wind != false && overlays.wind != nil {
        if let batch = buildWindBatch(
            legs: legs,
            byLeg: overlays.wind!.byLeg,
            semantic: semantic,
            prefix: prefix,
            zoom: zoom
        ) {
            layers.append(batch)
        }
    }

    // Rain batch
    if options.visibleLayers?.rain != false && overlays.rain != nil {
        if let batch = buildRainBatch(
            legs: legs,
            byLeg: overlays.rain!.byLeg,
            semantic: semantic,
            prefix: prefix,
            zoom: zoom
        ) {
            layers.append(batch)
        }
    }

    // Temperature batch
    if options.visibleLayers?.temperature != false && overlays.temperature != nil {
        if let batch = buildTemperatureBatch(
            legs: legs,
            byLeg: overlays.temperature!.byLeg,
            semantic: semantic,
            prefix: prefix,
            zoom: zoom
        ) {
            layers.append(batch)
        }
    }

    return layers
}

// Helper types
struct RouteLeg {
    let geometry: String
}

struct RouteOverlays {
    let wind: WindOverlays?
    let rain: RainOverlays?
    let temperature: TemperatureOverlays?
}

struct WeatherBatchOptions {
    let zoom: Int?
    let routeId: String?
    let visibleLayers: VisibleLayers?
}

struct VisibleLayers {
    let wind: Bool?
    let rain: Bool?
    let temperature: Bool?
}

// Semantic theme protocol
protocol SemanticTheme {
    func getWindColor(level: String) -> UInt
    func getRainColor(level: String) -> UInt
    func getTemperatureColor(level: String) -> UInt
}

// Batch builders would be implemented here
// buildWindBatch, buildRainBatch, buildTemperatureBatch
// These would decode polylines, slice by meters, apply simplification, and build GeoJSON
```

---

## PARITY CONTRACT

### Behavioral Invariants
1. **LOD Calculation**: MUST use exact tolerance values per zoom level
2. **Douglas-Peucker Algorithm**: MUST implement recursive simplification with perpendicular distance
3. **Batch Creation**: MUST create max 3 layers (wind, rain, temperature)
4. **Coordinate Conversion**: MUST convert Google to Mapbox coordinates
5. **Geometry Slicing**: MUST slice polylines by meters along route
6. **Color Resolution**: MUST use semantic theme for colors

### LOD Tolerance Values
```
Zoom 16+: 0 (no simplification)
Zoom 13-15: 0.0001
Zoom 10-12: 0.001
Zoom 0-9: 0.005
```

### Douglas-Peucker Algorithm
1. Find point with maximum perpendicular distance from line formed by endpoints
2. If max distance > tolerance, recursively simplify left and right
3. If max distance <= tolerance, return only endpoints

### Batch Requirements
- Maximum 3 ShapeSources (wind, rain, temperature)
- Each batch contains FeatureCollection with LineString features
- Features have properties for color and level
- Simplification applied per zoom level

---

## DEPENDENCIES

### Translation Order
- MUST translate AFTER `lib/mapbox/coordinate-converter.ts` (SHARED-TS) - uses coordinate conversion
- MUST have access to `server/lib/polyline` utilities (decode, slice, distances)
- MUST have access to `server/models/saved-routes` types

### Integration Points
- Used by map components for weather overlay rendering
- Used by route display components
- Depends on semantic theme system for colors

### Test Porting
- Port `lib/mapbox/__tests__/weather-optimization.test.ts` to platform tests
- Test LOD calculation accuracy
- Test Douglas-Peucker simplification
- Test batch creation limits
