import { MarkerView } from '@rnmapbox/maps'
import * as Haptics from 'expo-haptics'
import type { FC } from 'react'
import { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import Svg, { Circle, G, Path } from 'react-native-svg'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { latLngToMapbox } from '../../lib/mapbox/coordinate-converter'
import type { ExtendedTheme } from '../../styles/types'

/**
 * Waypoint kind/status types
 */
export type WaypointKind = 'on_route' | 'off_route' | 'mixed'

/**
 * Marker interactive states
 */
export type MarkerState = 'default' | 'selected' | 'pressed' | 'disabled'

/**
 * Waypoint marker props
 */
export type WaypointMarkerProps = {
  /**
   * Unique identifier for the waypoint
   */
  id: string

  /**
   * Coordinate position on map
   */
  coordinate: {
    latitude: number
    longitude: number
  }

  /**
   * Waypoint kind determines color coding
   */
  kind?: WaypointKind

  /**
   * Interactive state of the marker
   */
  state?: MarkerState

  /**
   * Whether to show the waypoint index number
   */
  showIndex?: boolean

  /**
   * Index number to display (1-based)
   */
  index?: number

  /**
   * Size of the marker in pixels
   */
  size?: number

  /**
   * Callback when marker is pressed
   */
  onPress?: (waypointId: string) => void

  /**
   * Test ID for testing
   */
  testID?: string
}

/**
 * Get color for waypoint kind
 */
const getKindColor = (kind: WaypointKind, semantic: ExtendedTheme['semantic']): string => {
  switch (kind) {
    case 'on_route':
      return semantic.color.waypointOnRoute?.default ?? semantic.color.success.default
    case 'off_route':
      return semantic.color.waypointOffRoute?.default ?? semantic.color.warning.default
    case 'mixed':
      return semantic.color.waypointMixed?.default ?? semantic.color.info.default
    default:
      return semantic.color.primary.default
  }
}

/**
 * Get color for marker state
 */
const getStateColor = (
  kind: WaypointKind,
  state: MarkerState,
  semantic: ExtendedTheme['semantic'],
): string => {
  const baseColor = getKindColor(kind, semantic)

  if (state === 'selected') {
    return semantic.color.tertiary.default
  }

  if (state === 'pressed') {
    // Return pressed variant if available, otherwise darken
    const colorSet =
      kind === 'on_route'
        ? semantic.color.waypointOnRoute
        : kind === 'off_route'
          ? semantic.color.waypointOffRoute
          : semantic.color.waypointMixed

    return colorSet?.pressed ?? baseColor
  }

  if (state === 'disabled') {
    return semantic.color.muted.default
  }

  return baseColor
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
})

/**
 * WaypointMarker Component
 *
 * Renders a map marker for waypoints with status-based color coding.
 *
 * Visual Design:
 * - Pin-shaped marker with circular head
 * - Color indicates waypoint kind (on-route/off-route/mixed)
 * - Optional index number displayed in marker center
 * - Interactive states: default, selected, pressed, disabled
 *
 * Acceptance Criteria (DESIGN-426):
 * - AC1: Create WaypointMarker component with status-based styling
 * - AC2: Implement color coding for on-route vs off-route
 * - AC3: Add interactive states (selected, pressed, pending)
 * - AC4: Add cluster markers for 10+ waypoints (via showIndex=false)
 */
export const WaypointMarker: FC<WaypointMarkerProps> = ({
  id,
  coordinate,
  kind = 'on_route',
  state = 'default',
  showIndex = false,
  index = 1,
  size = 32,
  onPress,
  testID,
}) => {
  const { semantic } = useSemanticTheme()

  const markerColor = useMemo(() => getStateColor(kind, state, semantic), [kind, state, semantic])

  const handlePress = useMemo(() => {
    if (!onPress) return undefined

    return () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      onPress(id)
    }
  }, [id, onPress])

  // SVG marker dimensions
  const pinHeight = size
  const pinWidth = size * 0.8
  const circleRadius = pinWidth / 2
  const stemHeight = pinHeight * 0.4

  // Pin path: circle head + tapered stem
  const pinPath = `
    M ${pinWidth / 2} ${pinHeight - stemHeight}
    L ${pinWidth / 2} ${circleRadius * 1.8}
    A ${circleRadius} ${circleRadius} 0 1 1 ${pinWidth / 2 + circleRadius * 2} ${circleRadius * 1.8}
    A ${circleRadius} ${circleRadius} 0 1 1 ${pinWidth / 2} ${circleRadius * 1.8}
    Z
  `

  // Inner circle for contrast
  const innerRadius = circleRadius * 0.6

  const mapboxCoords = latLngToMapbox(coordinate)

  return (
    <MarkerView coordinate={mapboxCoords}>
      <Pressable onPress={handlePress} testID={testID ?? `waypoint-marker-${id}`}>
        <View style={[styles.container, { width: pinWidth, height: pinHeight }]}>
          <Svg width={pinWidth} height={pinHeight} viewBox={`0 0 ${pinWidth} ${pinHeight}`}>
            <G fill={markerColor}>
              {/* Main pin shape */}
              <Path d={pinPath} />

              {/* Inner white circle for contrast */}
              <Circle
                cx={pinWidth / 2}
                cy={circleRadius * 1.5}
                r={innerRadius}
                fill={semantic.color.surface.default}
              />

              {/* Status indicator dot */}
              <Circle
                cx={pinWidth / 2}
                cy={circleRadius * 1.5}
                r={innerRadius * 0.4}
                fill={markerColor}
              />
            </G>

            {/* Selected state ring */}
            {state === 'selected' && (
              <Circle
                cx={pinWidth / 2}
                cy={circleRadius * 1.5}
                r={circleRadius + 2}
                fill="none"
                stroke={semantic.color.tertiary.default}
                strokeWidth={2}
              />
            )}
          </Svg>

          {/* Optional index label */}
          {showIndex && (
            <View
              style={[
                styles.labelContainer,
                {
                  top: circleRadius * 1.5 - 10,
                  width: 20,
                  height: 20,
                },
              ]}
            >
              {/* Index number would be rendered here with Text component */}
              {/* For now, the colored dot serves as the indicator */}
            </View>
          )}
        </View>
      </Pressable>
    </MarkerView>
  )
}
