import PolylineEncoder from '@mapbox/polyline'
import { NativeModules } from 'react-native'

const mapboxAvailable = NativeModules.RNMBXModule != null
let LineLayer: any = null
let ShapeSource: any = null
if (mapboxAvailable) {
  try { ({ LineLayer, ShapeSource } = require('@rnmapbox/maps')) } catch {}
}

import * as Haptics from 'expo-haptics'
import type { FeatureCollection, LineString } from 'geojson'
import type { FC } from 'react'
import { useCallback, useRef, useState } from 'react'
import { useTheme } from 'react-native-paper'
import { convertCoordinateArray } from '../../lib/mapbox/coordinate-converter'
import type { ExtendedTheme } from '../../styles/types'

import type { BuiltPolyline } from './route-polyline'

/**
 * Segment selection callback data
 */
export type SegmentSelectData = {
  geometry: string // Encoded polyline string
  bounds: {
    northEast: { latitude: number; longitude: number }
    southWest: { latitude: number; longitude: number }
  }
  legIndex?: number
  segmentType: 'overview' | 'leg' | 'wind' | 'rain' | 'temp'
  segmentId: string
}

/**
 * Props for RoutePolyline component
 */
export type RoutePolylineProps = {
  polylines: BuiltPolyline[]
  onSegmentSelect?: (segment: SegmentSelectData) => void
  selectedSegmentId?: string
  testID?: string
}

/**
 * Calculate bounding box from coordinates
 */
const calculateBounds = (coordinates: { latitude: number; longitude: number }[]) => {
  const lats = coordinates.map((c) => c.latitude)
  const lngs = coordinates.map((c) => c.longitude)

  return {
    northEast: {
      latitude: Math.max(...lats),
      longitude: Math.max(...lngs),
    },
    southWest: {
      latitude: Math.min(...lats),
      longitude: Math.min(...lngs),
    },
  }
}

/**
 * Encode coordinates to Google Polyline encoded string
 * Uses @mapbox/polyline library for proper encoding
 */
const encodeCoordinates = (coordinates: { latitude: number; longitude: number }[]): string => {
  // Convert to [longitude, latitude] format expected by @mapbox/polyline
  const points = coordinates.map((coord) => [coord.longitude, coord.latitude] as [number, number])
  return PolylineEncoder.encode(points)
}

/**
 * Extract segment type and leg index from polyline ID
 */
const parseSegmentId = (id: string): { type: string; legIndex?: number } => {
  if (id === 'overview') return { type: 'overview' }
  if (id.startsWith('leg-')) {
    const legIndex = parseInt(id.split('-')[1], 10)
    return { type: 'leg', legIndex }
  }
  if (id.startsWith('wind-')) {
    const legIndex = parseInt(id.split('-')[1], 10)
    return { type: 'wind', legIndex }
  }
  if (id.startsWith('rain-')) {
    const legIndex = parseInt(id.split('-')[1], 10)
    return { type: 'rain', legIndex }
  }
  if (id.startsWith('temp-')) {
    const legIndex = parseInt(id.split('-')[1], 10)
    return { type: 'temp', legIndex }
  }
  return { type: 'unknown' }
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
 * RoutePolyline Component
 *
 * Renders route polylines on the map with tap-to-select segment support.
 * Uses Mapbox ShapeSource + LineLayer for native rendering.
 *
 * Acceptance Criteria (US-042):
 * - AC1: Route polyline displayed on map, When: User taps segment, Then: Segment highlights visually
 * - AC2: Segment highlighted, When: onSegmentSelect callback provided, Then: Callback receives segment geometry
 * - AC3: Tap on overlay segment, When: Gesture detected, Then: Returns overlay segment geometry
 */
export const RoutePolyline: FC<RoutePolylineProps> = ({
  polylines,
  onSegmentSelect,
  selectedSegmentId,
  testID = 'route-polyline',
}) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme
  const [activeSegment, setActiveSegment] = useState<string | null>(null)

  // Use semantic spacing for stroke widths
  const highlightStrokeWidth = semantic.space.sm // 8px
  const normalStrokeWidth = semantic.space.sm / 2 // 4px

  const handlePress = useCallback(
    (segmentId: string, coordinates: { latitude: number; longitude: number }[]) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      setActiveSegment(segmentId)

      if (onSegmentSelect && coordinates.length > 0) {
        const { type, legIndex } = parseSegmentId(segmentId)
        const bounds = calculateBounds(coordinates)
        const geometry = encodeCoordinates(coordinates)

        onSegmentSelect({
          geometry,
          bounds,
          legIndex,
          segmentType: type as SegmentSelectData['segmentType'],
          segmentId,
        })
      }
    },
    [onSegmentSelect],
  )

  // Store stable callback refs per polyline to avoid re-creating closures
  const handlePressRef = useRef(handlePress)
  handlePressRef.current = handlePress

  if (!mapboxAvailable) {
    return null
  }

  return (
    <>
      {polylines.map((polyline, index) => {
        // Skip polylines with invalid coordinates
        if (!polyline.coordinates || polyline.coordinates.length < 2) {
          return null
        }

        const isHighlighted = selectedSegmentId === polyline.id || activeSegment === polyline.id
        const strokeColor = isHighlighted ? semantic.color.tertiary.default : polyline.strokeColor
        const strokeWidth = isHighlighted
          ? highlightStrokeWidth
          : (polyline.strokeWidth ?? normalStrokeWidth)

        // Build unique IDs: always incorporate index to guarantee uniqueness
        // Mapbox ShapeSource/LineLayer require globally unique ids,
        // and polylines can share logical ids (e.g. "leg-0" across renders)
        const uniqueKey = polyline.id ? `${polyline.id}-${index}` : `route-polyline-${index}`
        const shapeId = `shape-${uniqueKey}`
        const layerId = `layer-${uniqueKey}`

        const feature = buildLineFeature(polyline.coordinates)

        return (
          <ShapeSource
            key={uniqueKey}
            id={shapeId}
            shape={feature}
            onPress={() => handlePressRef.current(polyline.id ?? '', polyline.coordinates)}
            testID={`${testID}--segment-${polyline.id ?? index}`}
          >
            <LineLayer
              id={layerId}
              style={{
                lineColor: strokeColor,
                lineWidth: strokeWidth,
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
