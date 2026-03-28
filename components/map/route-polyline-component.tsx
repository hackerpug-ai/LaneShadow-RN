import * as Haptics from 'expo-haptics'
import type { GestureHandlerGestureEvent } from 'react-native-gesture-handler'
import { LongPressGestureHandler, State } from 'react-native-gesture-handler'
import type { FC } from 'react'
import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Polyline } from 'react-native-maps'

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
  polylines: Array<BuiltPolyline>
  onSegmentSelect?: (segment: SegmentSelectData) => void
  selectedSegmentId?: string
}

/**
 * Calculate bounding box from coordinates
 */
const calculateBounds = (coordinates: Array<{ latitude: number; longitude: number }>) => {
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
 * Encode coordinates to polyline string (simplified - for production use proper encoding)
 */
const encodeCoordinates = (coordinates: Array<{ latitude: number; longitude: number }>): string => {
  // For now, return a simplified representation
  // In production, this should use proper polyline encoding
  return JSON.stringify(coordinates)
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

const styles = StyleSheet.create({
  gestureWrapper: {
    flex: 1,
  },
})

/**
 * RoutePolyline Component
 *
 * Renders route polylines with long-press gesture support for segment selection.
 *
 * Acceptance Criteria (US-042):
 * - AC1: Route polyline displayed on map, When: User long-presses for 500ms+, Then: Segment highlights visually
 * - AC2: Segment highlighted, When: onSegmentSelect callback provided, Then: Callback receives segment geometry
 * - AC3: Long-press on overlay segment, When: Gesture detected, Then: Returns overlay segment geometry
 * - AC4: User releases early (<500ms), When: Gesture cancelled, Then: No highlight, no callback
 */
export const RoutePolyline: FC<RoutePolylineProps> = ({
  polylines,
  onSegmentSelect,
  selectedSegmentId,
}) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null)

  const handleLongPress = useMemo(
    () =>
      (segmentId: string, coordinates: Array<{ latitude: number; longitude: number }>) =>
      ({ nativeEvent }: GestureHandlerGestureEvent) => {
        const state = nativeEvent.state

        if (state === State.ACTIVE) {
          // Long-press completed (>= 500ms)
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
        } else if (state === State.CANCELLED || state === State.FAILED) {
          // Gesture cancelled or failed - clear active segment
          setActiveSegment(null)
        }
      },
    [onSegmentSelect]
  )

  return (
    <>
      {polylines.map((polyline) => {
        const isHighlighted =
          selectedSegmentId === polyline.id || activeSegment === polyline.id
        const strokeColor = isHighlighted ? '#6750A4' : polyline.strokeColor
        const strokeWidth = isHighlighted ? 8 : polyline.strokeWidth ?? 4

        return (
          <LongPressGestureHandler
            key={polyline.id ?? `${polyline.coordinates[0]?.latitude}-${polyline.coordinates[0]?.longitude}`}
            onHandlerStateChange={handleLongPress(
              polyline.id ?? '',
              polyline.coordinates
            )}
            minDurationMs={500}
          >
            <View style={styles.gestureWrapper}>
              <Polyline
                coordinates={polyline.coordinates}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
              />
            </View>
          </LongPressGestureHandler>
        )
      })}
    </>
  )
}
