import type { FC } from 'react'
import { Polyline } from 'react-native-maps'

import { useSemanticTheme } from '../../hooks/use-semantic-theme'
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
  isActive: boolean
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
 * DeviationPolyline Component
 *
 * Renders deviation path visualization showing original route, detour path, and reconnection point.
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
        const segmentColor = getSegmentColor(segment.type, semantic, isActive)

        return (
          <Polyline
            key={`${segment.type}-${index}`}
            coordinates={segment.coordinates}
            strokeColor={segmentColor}
            strokeWidth={baseStrokeWidth}
            lineCap="round"
            lineJoin="round"
            testID={testID ? `${testID}-${segment.type}-${index}` : `deviation-${segment.type}-${index}`}
          />
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
  reconnectPoint: { latitude: number; longitude: number }
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
