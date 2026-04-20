package com.laneshadow.models

/**
 * Weather Batch Rendering Optimization
 *
 * Batches weather segments by type into single ShapeSources, implements
 * level-of-detail (LOD) simplification based on zoom, and provides
 * Douglas-Peucker geometry simplification.
 *
 * Target: 3 ShapeSources total (wind, rain, temperature) instead of
 * one per segment. Geometry simplification at low zoom reduces point
 * count by 50-80%.
 *
 * Translated from: react-native/lib/mapbox/weather-optimization.ts
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Weather batch types supported for optimization
 */
enum class WeatherBatchType {
    WIND,
    RAIN,
    TEMPERATURE
}

/**
 * Geographic position [longitude, latitude]
 */
data class Position(
    val lng: Double,
    val lat: Double
)

/**
 * GeoJSON LineString geometry
 */
data class LineString(
    val type: String = "LineString",
    val coordinates: List<Position>
)

/**
 * GeoJSON Feature with properties
 */
data class Feature(
    val type: String = "Feature",
    val properties: Map<String, Any>,
    val geometry: LineString
)

/**
 * GeoJSON FeatureCollection
 */
data class FeatureCollection(
    val type: String = "FeatureCollection",
    val features: List<Feature>
)

/**
 * Batched weather layer for rendering
 */
data class BatchedWeatherLayer(
    val id: String,
    val shape: FeatureCollection,
    val type: WeatherBatchType,
    val lineWidth: Int,
    val lineOpacity: Double
)

/**
 * Route leg with geometry
 */
data class RouteLeg(
    val geometry: String
)

/**
 * Wind overlay data for a leg
 */
data class WindOverlayByLeg(
    val legIndex: Int,
    val segments: List<WeatherSegment>
)

/**
 * Rain overlay data for a leg
 */
data class RainOverlayByLeg(
    val legIndex: Int,
    val segments: List<WeatherSegment>
)

/**
 * Temperature overlay data for a leg
 */
data class TemperatureOverlayByLeg(
    val legIndex: Int,
    val segments: List<WeatherSegment>
)

/**
 * Weather segment with level and position
 */
data class WeatherSegment(
    val level: String,
    val startMeters: Double,
    val endMeters: Double
)

/**
 * Weather overlays for a route
 */
data class RouteOverlays(
    val wind: WindOverlays?,
    val rain: RainOverlays?,
    val temperature: TemperatureOverlays?
)

/**
 * Wind overlays collection
 */
data class WindOverlays(
    val byLeg: List<WindOverlayByLeg>
)

/**
 * Rain overlays collection
 */
data class RainOverlays(
    val byLeg: List<RainOverlayByLeg>
)

/**
 * Temperature overlays collection
 */
data class TemperatureOverlays(
    val byLeg: List<TemperatureOverlayByLeg>
)

/**
 * Options for weather batching
 */
data class WeatherBatchOptions(
    val zoom: Int? = null,
    val routeId: String? = null,
    val visibleLayers: VisibleLayers? = null
)

/**
 * Layer visibility settings
 */
data class VisibleLayers(
    val wind: Boolean? = null,
    val rain: Boolean? = null,
    val temperature: Boolean? = null
)

/**
 * Semantic theme for color resolution
 */
interface SemanticTheme {
    fun getWindColor(level: String): Int
    fun getRainColor(level: String): Int
    fun getTemperatureColor(level: String): Int
}

// ---------------------------------------------------------------------------
// LOD (Level of Detail) calculation
// ---------------------------------------------------------------------------

/**
 * Calculate simplification tolerance based on zoom level.
 * Higher zoom = more detail (lower tolerance).
 *
 * @param zoom - Map zoom level (0-22)
 * @returns Tolerance for Douglas-Peucker simplification
 */
fun calculateLOD(zoom: Int): Double {
    return when {
        zoom >= 16 -> 0.0 // Street level: no simplification
        zoom >= 13 -> 0.0001 // City level: light simplification
        zoom >= 10 -> 0.001 // Country level: moderate simplification
        else -> 0.005 // World level: heavy simplification
    }
}

// ---------------------------------------------------------------------------
// Douglas-Peucker simplification
// ---------------------------------------------------------------------------

/**
 * Calculate perpendicular distance from a point to a line segment.
 */
private fun perpendicularDistance(
    point: Position,
    lineStart: Position,
    lineEnd: Position
): Double {
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
 *
 * @param points - Array of [lng, lat] positions
 * @param tolerance - Simplification tolerance (0 = no simplification)
 * @returns Simplified array of positions
 */
fun simplifyDouglasPeucker(
    points: List<Position>,
    tolerance: Double
): List<Position> {
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
        val right = simplifyDouglasPeucker(points.subList(maxIndex, points.size), tolerance)

        left.dropLast(1) + right
    } else {
        listOf(points[0], points[end])
    }
}

// ---------------------------------------------------------------------------
// Batch builders (stubs for now - full implementation would require polyline utilities)
// ---------------------------------------------------------------------------

/**
 * Batch weather overlay data into optimized layers by type.
 *
 * Creates at most 3 ShapeSources (wind, rain, temperature) regardless
 * of how many individual segments exist. Applies LOD simplification
 * based on zoom level.
 *
 * @param legs - Route legs with geometry
 * @param overlays - Weather overlay data
 * @param semantic - Semantic theme for color resolution
 * @param options - Optimization options
 * @returns Array of BatchedWeatherLayer (max 3)
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

// Stub implementations - these would require polyline decoding/coordinate utilities
private fun buildWindBatch(
    legs: List<RouteLeg>,
    byLeg: List<WindOverlayByLeg>,
    semantic: SemanticTheme,
    prefix: String,
    zoom: Int
): BatchedWeatherLayer? {
    // TODO: Implement when polyline utilities are available
    // This requires: decodePolylineGeometry, computeCumulativeDistances, slicePolylineByMeters
    return null
}

private fun buildRainBatch(
    legs: List<RouteLeg>,
    byLeg: List<RainOverlayByLeg>,
    semantic: SemanticTheme,
    prefix: String,
    zoom: Int
): BatchedWeatherLayer? {
    // TODO: Implement when polyline utilities are available
    return null
}

private fun buildTemperatureBatch(
    legs: List<RouteLeg>,
    byLeg: List<TemperatureOverlayByLeg>,
    semantic: SemanticTheme,
    prefix: String,
    zoom: Int
): BatchedWeatherLayer? {
    // TODO: Implement when polyline utilities are available
    return null
}
