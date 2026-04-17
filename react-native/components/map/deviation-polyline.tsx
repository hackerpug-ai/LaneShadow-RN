import { LineLayer, ShapeSource } from '@rnmapbox/maps'
import type { FeatureCollection, LineString } from 'geojson'
import type { FC } from 'react'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { convertCoordinateArray } from '../../lib/mapbox/coordinate-converter'
import type { ExtendedTheme } from '../../styles/types'

/**
 * Deviation path segment types
 */
export type DeviationSegmentType = 'original' | 'detour' | 'reconnect'

/**
 * Deviation path segment
 */
export type DeviationSegment = {
  type: DeviationSegmentType
  coordinates: {
    latitude: number
    longitude: number
  }[]
}

/**
 * Deviation polyline props
 */
export type DeviationPolylineProps = {
  /**
   * Array of deviation path segments
   */
  segments: DeviationSegment[]

  /**
   * Whether the deviation is currently active/selected
   */
  isActive?: boolean

  /**
   * Stroke width for the polylines
   */
  strokeWidth?: number

  /**
   * Test ID for testing
   */
  testID?: string
}

/**
 * Get color for deviation segment type
 */
const getSegmentColor = (
  type: DeviationSegmentType,
  semantic: ExtendedTheme['semantic'],
  isActive: boolean,
): string => {
  switch (type) {
    case 'original':
      return semantic.color.deviationOriginalRoute?.default ?? semantic.color.muted.default
    case 'detour':
      return semantic.color.deviationDetourPath?.default ?? semantic.color.orange.default
    case 'reconnect':
      return semantic.color.deviationReconnectPoint?.default ?? semantic.color.success.default
    default:
      return semantic.color.muted.default
  }
}

/**
 * Build a GeoJSON FeatureCollection from Google-format coordinates.
 * Converts [lat, lng] to Mapbox [lng, lat].
 */
const buildLineFeature = (
  coordinates: { latitude: number; longitude: number }[],
): FeatureCollection<LineString> => {
  const googleCoords = coordinates.map((c) => [c.latitude, c.longitude] as [number, number])
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

/**
 * DeviationPolyline Component
 *
 * Renders deviation path visualization showing original route, detour path, and reconnection point.
 * Uses Mapbox ShapeSource + LineLayer for native rendering.
 *
 * Visual Design:
 * - Original route: Gray/muted (faded to show it's not active)
 * - Detour path: Orange (high contrast to show active deviation)
 * - Reconnect point: Green (shows where detour rejoins original route)
 * - Active state increases stroke width for emphasis
 *
 * Acceptance Criteria (DESIGN-426):
 * - AC1: Create DeviationPolyline component for detour visualization
 * - AC2: Show original route in muted gray
 * - AC3: Show detour path in orange
 * - AC4: Show reconnection point in green
 * - AC5: Support active/inactive states for emphasis
 */
export const DeviationPolyline: FC<DeviationPolylineProps> = ({
  segments,
  isActive = false,
  strokeWidth = 4,
  testID,
}) => {
  const { semantic } = useSemanticTheme()

  const baseStrokeWidth = isActive ? strokeWidth + 2 : strokeWidth

  return (
    <>
      {segments.map((segment, index) => {
        // Skip segments with insufficient coordinates for a line
        if (!segment.coordinates || segment.coordinates.length < 2) {
          return null
        }

        const segmentColor = getSegmentColor(segment.type, semantic, isActive)
        const sourceId = `deviation-${segment.type}-${index}`
        const layerId = `${sourceId}-layer`

        const feature = buildLineFeature(segment.coordinates)

        return (
          <ShapeSource
            key={sourceId}
            id={sourceId}
            shape={feature}
            testID={
              testID ? `${testID}-${segment.type}-${index}` : `deviation-${segment.type}-${index}`
            }
          >
            <LineLayer
              id={layerId}
              style={{
                lineColor: segmentColor,
                lineWidth: baseStrokeWidth,
                lineOpacity: 1.0,
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          </ShapeSource>
        )
      })}
    </>
  )
}

/**
 * Build deviation segments from detour info
 * Utility function to convert deviation data into polyline segments
 */
export const buildDeviationSegments = (
  originalRouteCoordinates: { latitude: number; longitude: number }[],
  detourPathCoordinates: { latitude: number; longitude: number }[],
  reconnectPoint: { latitude: number; longitude: number },
): DeviationSegment[] => {
  const segments: DeviationSegment[] = []

  // Original route segment (before detour starts)
  if (originalRouteCoordinates.length > 0) {
    segments.push({
      type: 'original',
      coordinates: originalRouteCoordinates,
    })
  }

  // Detour path segment
  if (detourPathCoordinates.length > 0) {
    segments.push({
      type: 'detour',
      coordinates: detourPathCoordinates,
    })
  }

  // Reconnection point (where detour meets original route again)
  segments.push({
    type: 'reconnect',
    coordinates: [reconnectPoint],
  })

  return segments
}
