# MODEL-mapbox-weather-optimization.md - Weather Overlay Optimization Translation Plan

**Document ID**: MAT-MODEL-MAPBOX-WEATHER-OPTIMIZATION
**Status**: Draft
**Source File**: `react-native/lib/mapbox/weather-optimization.ts`
**Classification**: PORT
**Priority**: P1 (Weather overlays)
**Protocol**: 08g-model-translation-protocol.md

---

## Overview

Batch rendering optimization for weather overlays. Batches weather segments by type into single ShapeSources, implements level-of-detail (LOD) simplification based on zoom, and provides Douglas-Peucker geometry simplification. Reduces ShapeSource count from one-per-segment to three total (wind, rain, temperature).

---

## Platform Translation Strategy

### Android (Kotlin)

**GeoJSON**: org.locationtech.jts + Mapbox SDK

```kotlin
// WeatherOptimization.kt
import org.locationtech.jts.geom.Coordinate
import org.locationtech.jts.geom.Geometry
import org.locationtech.jts.simplify.DouglasPeuckerSimplifier

enum class WeatherBatchType { WIND, RAIN, TEMPERATURE }

data class BatchedWeatherLayer(
    val id: String,
    val shape: FeatureCollection, // GeoJSON
    val type: WeatherBatchType,
    val lineWidth: Double,
    val lineOpacity: Double
)

fun calculateLOD(zoom: Double): Double {
    return when {
        zoom >= 16 -> 0.0 // Street level: no simplification
        zoom >= 13 -> 0.0001 // City level
        zoom >= 10 -> 0.001 // Country level
        else -> 0.005 // World level
    }
}

fun simplifyDouglasPeucker(points: List<Coordinate>, tolerance: Double): List<Coordinate> {
    if (points.size <= 2 || tolerance <= 0.0) return points.toList()

    val geometry = geometryFactory.createLineString(points.toTypedArray())
    val simplified = DouglasPeuckerSimplifier.simplify(geometry, tolerance) as org.locationtech.jts.geom.LineString
    return simplified.coordinates.toList()
}

fun batchWeatherPolylines(
    legs: List<RouteLeg>,
    overlays: RouteOverlays,
    semantic: SemanticTheme,
    options: WeatherBatchOptions = WeatherBatchOptions()
): List<BatchedWeatherLayer> {
    val layers = mutableListOf<BatchedWeatherLayer>()
    val zoom = options.zoom ?: 15.0
    val prefix = if (options.routeId != null) "${options.routeId}-" else ""

    // Wind batch
    if (options.visibleLayers?.wind != false && overlays.wind != null) {
        buildWindBatch(legs, overlays.wind.byLeg, semantic, prefix, zoom)?.let { layers.add(it) }
    }

    // Rain batch
    if (options.visibleLayers?.rain != false && overlays.rain != null) {
        buildRainBatch(legs, overlays.rain.byLeg, semantic, prefix, zoom)?.let { layers.add(it) }
    }

    // Temperature batch
    if (options.visibleLayers?.temperature != false && overlays.temperature != null) {
        buildTemperatureBatch(legs, overlays.temperature.byLeg, semantic, prefix, zoom)?.let { layers.add(it) }
    }

    return layers
}

private fun buildWindBatch(
    legs: List<RouteLeg>,
    byLeg: List<WindOverlayByLeg>,
    semantic: SemanticTheme,
    prefix: String,
    zoom: Double
): BatchedWeatherLayer? {
    val tolerance = calculateLOD(zoom)
    val features = mutableListOf<Feature>()

    for (overlay in byLeg) {
        val leg = legs.getOrNull(overlay.legIndex) ?: continue
        val coords = decodePolylineGeometry(leg.geometry)
        if (coords.size < 2) continue

        val distances = computeCumulativeDistances(coords)

        for (segment in overlay.segments) {
            val sliced = slicePolylineByMeters(coords, distances, segment.startMeters, segment.endMeters)
            if (sliced.size < 2) continue

            var mapboxCoords = toMapboxCoords(sliced)
            if (tolerance > 0) {
                mapboxCoords = simplifyDouglasPeucker(mapboxCoords.map { Coordinate(it.longitude, it.latitude) }, tolerance)
                    .map { LatLng(it.y, it.x) }
            }
            if (mapboxCoords.size < 2) continue

            features.add(Feature.fromGeometry(
                LineString.fromLngLats(mapboxCoords.map { Point.fromLngLat(it.longitude, it.latitude) }),
                mapOf("color" to getWindColor(segment.level, semantic), "level" to segment.level)
            ))
        }
    }

    if (features.isEmpty) return null

    return BatchedWeatherLayer(
        id = "${prefix}batched-wind",
        shape = FeatureCollection.fromFeatures(features),
        type = WeatherBatchType.WIND,
        lineWidth = 5.0,
        lineOpacity = 0.85
    )
}

// Similar implementations for buildRainBatch, buildTemperatureBatch

data class WeatherBatchOptions(
    val zoom: Double? = null,
    val routeId: String? = null,
    val visibleLayers: VisibleLayers? = null
)

data class VisibleLayers(
    val wind: Boolean? = null,
    val rain: Boolean? = null,
    val temperature: Boolean? = null
)

// Companion object for geometryFactory
private val geometryFactory = org.locationtech.jts.geom.GeometryFactory()
```

### iOS (Swift)

**GeoJSON**: Turf for Swift + Mapbox SDK

```swift
// WeatherOptimization.swift
import Turf
import MapboxMaps

enum WeatherBatchType { case wind, rain, temperature }

struct BatchedWeatherLayer {
    let id: String
    let shape: FeatureCollection // GeoJSON
    let type: WeatherBatchType
    let lineWidth: Double
    let lineOpacity: Double
}

func calculateLOD(zoom: Double) -> Double {
    switch zoom {
    case 16...: return 0.0 // Street level
    case 13..<16: return 0.0001 // City level
    case 10..<13: return 0.001 // Country level
    default: return 0.005 // World level
    }
}

func simplifyDouglasPeucker(points: [Coordinate2D], tolerance: Double) -> [Coordinate2D] {
    if points.count <= 2 || tolerance <= 0 { return points }

    let coords = points.map { $0.toTurfCoordinate() }
    let simplified = Turf.simplify(coords, tolerance: tolerance)
    return simplified.map { CLLocationCoordinate2D(latitude: $0.coordinates[1], longitude: $0.coordinates[0]) }
}

func batchWeatherPolylines(
    legs: [RouteLeg],
    overlays: RouteOverlays,
    semantic: SemanticTheme,
    options: WeatherBatchOptions = WeatherBatchOptions()
) -> [BatchedWeatherLayer] {
    var layers: [BatchedWeatherLayer] = []
    let zoom = options.zoom ?? 15.0
    let prefix = options.routeId?.isEmpty == false ? "\(options.routeId!)-" : ""

    // Wind batch
    if options.visibleLayers?.wind != false && overlays.wind != nil {
        if let batch = buildWindBatch(legs: legs, byLeg: overlays.wind!.byLeg, semantic: semantic, prefix: prefix, zoom: zoom) {
            layers.append(batch)
        }
    }

    // Rain batch
    if options.visibleLayers?.rain != false && overlays.rain != nil {
        if let batch = buildRainBatch(legs: legs, byLeg: overlays.rain!.byLeg, semantic: semantic, prefix: prefix, zoom: zoom) {
            layers.append(batch)
        }
    }

    // Temperature batch
    if options.visibleLayers?.temperature != false && overlays.temperature != nil {
        if let batch = buildTemperatureBatch(legs: legs, byLeg: overlays.temperature!.byLeg, semantic: semantic, prefix: prefix, zoom: zoom) {
            layers.append(batch)
        }
    }

    return layers
}

private func buildWindBatch(
    legs: [RouteLeg],
    byLeg: [WindOverlayByLeg],
    semantic: SemanticTheme,
    prefix: String,
    zoom: Double
) -> BatchedWeatherLayer? {
    let tolerance = calculateLOD(zoom: zoom)
    var features: [Feature] = []

    for overlay in byLeg {
        guard overlay.legIndex < legs.count else { continue }
        let leg = legs[overlay.legIndex]
        let coords = decodePolylineGeometry(leg.geometry)
        if coords.count < 2 { continue }

        let distances = computeCumulativeDistances(coords)

        for segment in overlay.segments {
            let sliced = slicePolylineByMeters(coords, distances, segment.startMeters, segment.endMeters)
            if sliced.count < 2 { continue }

            var mapboxCoords = toMapboxCoords(sliced)
            if tolerance > 0 {
                mapboxCoords = simplifyDouglasPeucker(points: mapboxCoords, tolerance: tolerance)
            }
            if mapboxCoords.count < 2 { continue }

            let feature = Feature(geometry: .lineString(LineString(mapboxCoords.map { $0.toTurfCoordinate() })))
            feature.properties = [
                "color": .string(getWindColor(segment.level, semantic)),
                "level": .string(segment.level)
            ]
            features.append(feature)
        }
    }

    if features.isEmpty { return nil }

    return BatchedWeatherLayer(
        id: "\(prefix)batched-wind",
        shape: FeatureCollection(features: features),
        type: .wind,
        lineWidth: 5.0,
        lineOpacity: 0.85
    )
}

// Similar implementations for buildRainBatch, buildTemperatureBatch

struct WeatherBatchOptions {
    let zoom: Double?
    let routeId: String?
    let visibleLayers: VisibleLayers?
}

struct VisibleLayers {
    let wind: Bool?
    let rain: Bool?
    let temperature: Bool?
}
```

---

## References

- `08g-model-translation-protocol.md` — Classification and translation patterns
- React Native source: `react-native/lib/mapbox/weather-optimization.ts`
- CLR-022: Batch Rendering Optimization

---

**Change Log**:
- 2026-04-19: Initial translation plan authored (FND-006)
