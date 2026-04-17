/**
 * CLR-022: Batch Rendering Optimization
 *
 * Batches weather segments by type into single ShapeSources, implements
 * level-of-detail (LOD) simplification based on zoom, and provides
 * Douglas-Peucker geometry simplification.
 *
 * Target: 3 ShapeSources total (wind, rain, temperature) instead of
 * one per segment. Geometry simplification at low zoom reduces point
 * count by 50-80%.
 */

import type { FeatureCollection, LineString, Position } from 'geojson'
import type {
  RainOverlayByLeg,
  RouteLeg,
  RouteOverlays,
  TemperatureOverlayByLeg,
  WindOverlayByLeg,
} from '../../models/saved-routes'
import type { ExtendedTheme } from '../../styles/types'
import { getRainColor, getTemperatureColor, getWindColor } from '../map/overlay-colors'
import { convertCoordinateArray } from '../mapbox/coordinate-converter'
import {
  computeCumulativeDistances,
  decodePolylineGeometry,
  type MapLatLng,
  slicePolylineByMeters,
} from '../polyline'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WeatherBatchType = 'wind' | 'rain' | 'temperature'

export interface BatchedWeatherLayer {
  /** Unique ID for the ShapeSource */
  id: string
  /** Batched GeoJSON FeatureCollection */
  shape: FeatureCollection<LineString>
  /** Line color (applied per-segment via properties) */
  type: WeatherBatchType
  /** Default line width */
  lineWidth: number
  /** Default line opacity */
  lineOpacity: number
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
export const calculateLOD = (zoom: number): number => {
  if (zoom >= 16) return 0 // Street level: no simplification
  if (zoom >= 13) return 0.0001 // City level: light simplification
  if (zoom >= 10) return 0.001 // Country level: moderate simplification
  return 0.005 // World level: heavy simplification
}

// ---------------------------------------------------------------------------
// Douglas-Peucker simplification
// ---------------------------------------------------------------------------

/**
 * Calculate perpendicular distance from a point to a line segment.
 */
const perpendicularDistance = (point: Position, lineStart: Position, lineEnd: Position): number => {
  const dx = lineEnd[0] - lineStart[0]
  const dy = lineEnd[1] - lineStart[1]

  // Handle zero-length line
  if (dx === 0 && dy === 0) {
    return Math.sqrt((point[0] - lineStart[0]) ** 2 + (point[1] - lineStart[1]) ** 2)
  }

  const numerator = Math.abs(
    dy * point[0] - dx * point[1] + lineEnd[0] * lineStart[1] - lineEnd[1] * lineStart[0],
  )
  const denominator = Math.sqrt(dx * dx + dy * dy)

  return numerator / denominator
}

/**
 * Simplify a polyline using the Douglas-Peucker algorithm.
 *
 * @param points - Array of [lng, lat] positions
 * @param tolerance - Simplification tolerance (0 = no simplification)
 * @returns Simplified array of positions
 */
export const simplifyDouglasPeucker = (points: Position[], tolerance: number): Position[] => {
  if (points.length <= 2) return [...points]
  if (tolerance <= 0) return [...points]

  let maxDist = 0
  let maxIndex = 0
  const end = points.length - 1

  for (let i = 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], points[0], points[end])
    if (dist > maxDist) {
      maxDist = dist
      maxIndex = i
    }
  }

  if (maxDist > tolerance) {
    const left = simplifyDouglasPeucker(points.slice(0, maxIndex + 1), tolerance)
    const right = simplifyDouglasPeucker(points.slice(maxIndex), tolerance)
    return [...left.slice(0, -1), ...right]
  }

  return [points[0], points[end]]
}

// ---------------------------------------------------------------------------
// Coordinate conversion helper
// ---------------------------------------------------------------------------

const toMapboxCoords = (coords: MapLatLng[]): Position[] => {
  const googleCoords = coords.map((c) => [c.latitude, c.longitude] as [number, number])
  return convertCoordinateArray(googleCoords)
}

// ---------------------------------------------------------------------------
// Batch builders
// ---------------------------------------------------------------------------

const buildWindBatch = (
  legs: RouteLeg[],
  byLeg: WindOverlayByLeg[],
  semantic: ExtendedTheme['semantic'],
  prefix: string,
  zoom: number,
): BatchedWeatherLayer | null => {
  const tolerance = calculateLOD(zoom)
  const legCoords = legs.map((leg) => decodePolylineGeometry(leg.geometry))
  const features: FeatureCollection<LineString>['features'] = []

  for (const overlay of byLeg) {
    const coords = legCoords[overlay.legIndex]
    if (!coords || coords.length < 2) continue

    const distances = computeCumulativeDistances(coords)

    for (const segment of overlay.segments) {
      const sliced = slicePolylineByMeters(
        coords,
        distances,
        segment.startMeters,
        segment.endMeters,
      )
      if (sliced.length < 2) continue

      let mapboxCoords = toMapboxCoords(sliced)
      if (tolerance > 0) {
        mapboxCoords = simplifyDouglasPeucker(mapboxCoords, tolerance)
      }
      if (mapboxCoords.length < 2) continue

      features.push({
        type: 'Feature',
        properties: {
          color: getWindColor(segment.level, semantic),
          level: segment.level,
        },
        geometry: {
          type: 'LineString',
          coordinates: mapboxCoords,
        },
      })
    }
  }

  if (features.length === 0) return null

  return {
    id: `${prefix}batched-wind`,
    shape: { type: 'FeatureCollection', features },
    type: 'wind',
    lineWidth: 5,
    lineOpacity: 0.85,
  }
}

const buildRainBatch = (
  legs: RouteLeg[],
  byLeg: RainOverlayByLeg[],
  semantic: ExtendedTheme['semantic'],
  prefix: string,
  zoom: number,
): BatchedWeatherLayer | null => {
  const tolerance = calculateLOD(zoom)
  const legCoords = legs.map((leg) => decodePolylineGeometry(leg.geometry))
  const features: FeatureCollection<LineString>['features'] = []

  for (const overlay of byLeg) {
    const coords = legCoords[overlay.legIndex]
    if (!coords || coords.length < 2) continue

    const distances = computeCumulativeDistances(coords)

    for (const segment of overlay.segments) {
      const sliced = slicePolylineByMeters(
        coords,
        distances,
        segment.startMeters,
        segment.endMeters,
      )
      if (sliced.length < 2) continue

      let mapboxCoords = toMapboxCoords(sliced)
      if (tolerance > 0) {
        mapboxCoords = simplifyDouglasPeucker(mapboxCoords, tolerance)
      }
      if (mapboxCoords.length < 2) continue

      const opacity = segment.level === 'heavy' ? 0.95 : segment.level === 'moderate' ? 0.85 : 0.75

      features.push({
        type: 'Feature',
        properties: {
          color: getRainColor(segment.level, semantic),
          level: segment.level,
          opacity,
        },
        geometry: {
          type: 'LineString',
          coordinates: mapboxCoords,
        },
      })
    }
  }

  if (features.length === 0) return null

  return {
    id: `${prefix}batched-rain`,
    shape: { type: 'FeatureCollection', features },
    type: 'rain',
    lineWidth: 6,
    lineOpacity: 0.85,
  }
}

const buildTemperatureBatch = (
  legs: RouteLeg[],
  byLeg: TemperatureOverlayByLeg[],
  semantic: ExtendedTheme['semantic'],
  prefix: string,
  zoom: number,
): BatchedWeatherLayer | null => {
  const tolerance = calculateLOD(zoom)
  const legCoords = legs.map((leg) => decodePolylineGeometry(leg.geometry))
  const features: FeatureCollection<LineString>['features'] = []

  for (const overlay of byLeg) {
    const coords = legCoords[overlay.legIndex]
    if (!coords || coords.length < 2) continue

    const distances = computeCumulativeDistances(coords)

    for (const segment of overlay.segments) {
      const sliced = slicePolylineByMeters(
        coords,
        distances,
        segment.startMeters,
        segment.endMeters,
      )
      if (sliced.length < 2) continue

      let mapboxCoords = toMapboxCoords(sliced)
      if (tolerance > 0) {
        mapboxCoords = simplifyDouglasPeucker(mapboxCoords, tolerance)
      }
      if (mapboxCoords.length < 2) continue

      features.push({
        type: 'Feature',
        properties: {
          color: getTemperatureColor(segment.level, semantic),
          level: segment.level,
        },
        geometry: {
          type: 'LineString',
          coordinates: mapboxCoords,
        },
      })
    }
  }

  if (features.length === 0) return null

  return {
    id: `${prefix}batched-temp`,
    shape: { type: 'FeatureCollection', features },
    type: 'temperature',
    lineWidth: 4,
    lineOpacity: 0.9,
  }
}

// ---------------------------------------------------------------------------
// Main batch function
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
export const batchWeatherPolylines = (
  legs: RouteLeg[],
  overlays: RouteOverlays,
  semantic: ExtendedTheme['semantic'],
  options: {
    zoom?: number
    routeId?: string
    visibleLayers?: { wind?: boolean; rain?: boolean; temperature?: boolean }
  } = {},
): BatchedWeatherLayer[] => {
  const { zoom = 15, routeId, visibleLayers = {} } = options
  const prefix = routeId ? `${routeId}-` : ''
  const layers: BatchedWeatherLayer[] = []

  // Wind batch
  if (visibleLayers.wind !== false && overlays.wind) {
    const batch = buildWindBatch(legs, overlays.wind.byLeg, semantic, prefix, zoom)
    if (batch) layers.push(batch)
  }

  // Rain batch
  if (visibleLayers.rain !== false && overlays.rain) {
    const batch = buildRainBatch(legs, overlays.rain.byLeg, semantic, prefix, zoom)
    if (batch) layers.push(batch)
  }

  // Temperature batch
  if (visibleLayers.temperature !== false && overlays.temperature) {
    const batch = buildTemperatureBatch(legs, overlays.temperature.byLeg, semantic, prefix, zoom)
    if (batch) layers.push(batch)
  }

  return layers
}
