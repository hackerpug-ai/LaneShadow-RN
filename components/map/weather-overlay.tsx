import { LineLayer, ShapeSource } from '@rnmapbox/maps'
import type { FeatureCollection, LineString } from 'geojson'
import type { FC } from 'react'
import { useMemo } from 'react'
import {
  computeCumulativeDistances,
  decodePolylineGeometry,
  type MapLatLng,
  slicePolylineByMeters,
} from '../../server/lib/polyline'
import type {
  RainOverlayByLeg,
  RainOverlaySegment,
  RouteLeg,
  RouteOverlays,
  TemperatureOverlayByLeg,
  TemperatureOverlaySegment,
  WindOverlayByLeg,
  WindOverlaySegment,
} from '../../server/models/saved-routes'
import { getRainColor, getTemperatureColor, getWindColor } from '../../lib/map/overlay-colors'
import { convertCoordinateArray } from '../../lib/mapbox/coordinate-converter'
import type { ExtendedTheme } from '../../styles/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WeatherOverlayType = 'wind' | 'rain' | 'temperature'

export type WeatherOverlayProps = {
  /** Route legs with polyline geometry */
  legs: RouteLeg[]
  /** Weather overlay data (wind, rain, temperature) */
  overlays?: RouteOverlays
  /** Which overlays are currently visible */
  visibleLayers?: {
    wind?: boolean
    rain?: boolean
    temperature?: boolean
  }
  /** Semantic theme for color resolution */
  semantic: ExtendedTheme['semantic']
  /** Route ID prefix for unique ShapeSource/Layer IDs */
  routeId?: string
  /** Test ID prefix */
  testID?: string
}

type WeatherFeature = {
  id: string
  feature: FeatureCollection<LineString>
  color: string
  width: number
  opacity: number
  type: WeatherOverlayType
}

// ---------------------------------------------------------------------------
// Zoom-based style constants
// ---------------------------------------------------------------------------

/** Line width scale factors by zoom range */
const _ZOOM_WIDTH_SCALE = {
  low: 1.5, // zoom < 12 (country level)
  medium: 1.0, // zoom 12-15 (city level)
  high: 0.75, // zoom > 15 (street level)
} as const

const BASE_STROKE_WIDTH = 6

// ---------------------------------------------------------------------------
// Helper: build GeoJSON FeatureCollection from MapLatLng[]
// ---------------------------------------------------------------------------

const buildGeoJSON = (coords: MapLatLng[]): FeatureCollection<LineString> => {
  const googleCoords = coords.map((c) => [c.latitude, c.longitude] as [number, number])
  const mapboxCoords = convertCoordinateArray(googleCoords)

  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: mapboxCoords,
        },
      },
    ],
  }
}

// ---------------------------------------------------------------------------
// Segment builders
// ---------------------------------------------------------------------------

const buildWindFeatures = (
  legCoords: MapLatLng[],
  overlay: WindOverlayByLeg,
  semantic: ExtendedTheme['semantic'],
  prefix: string,
): WeatherFeature[] => {
  const distances = computeCumulativeDistances(legCoords)

  return overlay.segments.reduce<WeatherFeature[]>((acc, segment: WindOverlaySegment) => {
    const sliced = slicePolylineByMeters(
      legCoords,
      distances,
      segment.startMeters,
      segment.endMeters,
    )
    if (sliced.length < 2) return acc

    acc.push({
      id: `${prefix}weather-wind-${overlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
      feature: buildGeoJSON(sliced),
      color: getWindColor(segment.level, semantic),
      width: BASE_STROKE_WIDTH,
      opacity: 0.85,
      type: 'wind',
    })
    return acc
  }, [])
}

const buildRainFeatures = (
  legCoords: MapLatLng[],
  overlay: RainOverlayByLeg,
  semantic: ExtendedTheme['semantic'],
  prefix: string,
): WeatherFeature[] => {
  const distances = computeCumulativeDistances(legCoords)

  return overlay.segments.reduce<WeatherFeature[]>((acc, segment: RainOverlaySegment) => {
    const sliced = slicePolylineByMeters(
      legCoords,
      distances,
      segment.startMeters,
      segment.endMeters,
    )
    if (sliced.length < 2) return acc

    const opacity = segment.level === 'heavy' ? 0.95 : segment.level === 'moderate' ? 0.85 : 0.75

    acc.push({
      id: `${prefix}weather-rain-${overlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
      feature: buildGeoJSON(sliced),
      color: getRainColor(segment.level, semantic),
      width: BASE_STROKE_WIDTH + 1,
      opacity,
      type: 'rain',
    })
    return acc
  }, [])
}

const buildTemperatureFeatures = (
  legCoords: MapLatLng[],
  overlay: TemperatureOverlayByLeg,
  semantic: ExtendedTheme['semantic'],
  prefix: string,
): WeatherFeature[] => {
  const distances = computeCumulativeDistances(legCoords)

  return overlay.segments.reduce<WeatherFeature[]>((acc, segment: TemperatureOverlaySegment) => {
    const sliced = slicePolylineByMeters(
      legCoords,
      distances,
      segment.startMeters,
      segment.endMeters,
    )
    if (sliced.length < 2) return acc

    acc.push({
      id: `${prefix}weather-temp-${overlay.legIndex}-${segment.startMeters}-${segment.endMeters}`,
      feature: buildGeoJSON(sliced),
      color: getTemperatureColor(segment.level, semantic),
      width: BASE_STROKE_WIDTH - 1,
      opacity: 0.9,
      type: 'temperature',
    })
    return acc
  }, [])
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * WeatherOverlay renders weather data as colored polylines on the map.
 *
 * Renders three layers in order (bottom to top):
 * 1. Wind (green/yellow/red by severity)
 * 2. Rain (light blue to dark blue by intensity, with opacity scaling)
 * 3. Temperature (blue/copper/red by comfort level)
 *
 * Each layer is rendered above the route geometry. Missing data is handled
 * gracefully — only available overlays are rendered.
 */
export const WeatherOverlay: FC<WeatherOverlayProps> = ({
  legs,
  overlays,
  visibleLayers = { wind: true, rain: true, temperature: true },
  semantic,
  routeId,
  testID = 'weather-overlay',
}) => {
  const prefix = routeId ? `${routeId}-` : ''

  const features = useMemo(() => {
    if (!overlays) return []

    const legCoords = legs.map((leg) => decodePolylineGeometry(leg.geometry))
    const result: WeatherFeature[] = []

    // Layer 1: Wind (bottom)
    if (visibleLayers.wind && overlays.wind) {
      for (const byLeg of overlays.wind.byLeg) {
        const coords = legCoords[byLeg.legIndex]
        if (!coords || coords.length < 2) continue
        result.push(...buildWindFeatures(coords, byLeg, semantic, prefix))
      }
    }

    // Layer 2: Rain (middle)
    if (visibleLayers.rain && overlays.rain) {
      for (const byLeg of overlays.rain.byLeg) {
        const coords = legCoords[byLeg.legIndex]
        if (!coords || coords.length < 2) continue
        result.push(...buildRainFeatures(coords, byLeg, semantic, prefix))
      }
    }

    // Layer 3: Temperature (top)
    if (visibleLayers.temperature && overlays.temperature) {
      for (const byLeg of overlays.temperature.byLeg) {
        const coords = legCoords[byLeg.legIndex]
        if (!coords || coords.length < 2) continue
        result.push(...buildTemperatureFeatures(coords, byLeg, semantic, prefix))
      }
    }

    return result
  }, [legs, overlays, visibleLayers, semantic, prefix])

  if (features.length === 0) return null

  return (
    <>
      {features.map((wf) => (
        <ShapeSource
          key={wf.id}
          id={`shape-${wf.id}`}
          shape={wf.feature}
          testID={`${testID}--${wf.type}-${wf.id}`}
        >
          <LineLayer
            id={`layer-${wf.id}`}
            aboveLayerID={
              wf.type === 'rain'
                ? `layer-${prefix}weather-wind`
                : wf.type === 'temperature'
                  ? `layer-${prefix}weather-rain`
                  : undefined
            }
            style={{
              lineColor: wf.color,
              lineWidth: wf.width,
              lineOpacity: wf.opacity,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        </ShapeSource>
      ))}
    </>
  )
}
