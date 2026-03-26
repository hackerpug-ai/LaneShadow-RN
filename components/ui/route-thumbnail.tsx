/**
 * RouteThumbnail Component
 *
 * Small route preview thumbnail with route line visualization.
 * Uses expo-linear-gradient for the dark background gradient.
 * Optionally accepts route bounds to derive rotation/positioning.
 */

import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { Bounds } from '../../types/routes'

export type RouteThumbnailProps = {
  /** Width of the thumbnail */
  width?: number
  /** Height of the thumbnail */
  height?: number
  /** Rotation of the route line in degrees (overridden when bounds provided) */
  rotation?: number
  /** Top position offset of route line */
  routeTop?: number
  /** Left position offset of route line */
  routeLeft?: number
  /** Route line width */
  routeWidth?: number
  /** Route line height */
  routeHeight?: number
  /** Optional route bounds to derive rotation and positioning */
  bounds?: Bounds
  /** Test ID for testing */
  testID?: string
}

export const MIN_ROUTE_DIMENSION = 20
export const ROUTE_PADDING = 16
export const DEFAULT_ROTATION = -10

/**
 * Derives rotation angle from route bounds.
 * Returns the angle (in degrees) of the diagonal from SW to NE corner.
 */
export const deriveRotationFromBounds = (bounds: Bounds): number => {
  const latSpan = Math.abs(bounds.north - bounds.south)
  const lngSpan = Math.abs(bounds.east - bounds.west)

  if (latSpan === 0 && lngSpan === 0) return DEFAULT_ROTATION

  const angle = Math.atan2(latSpan, lngSpan) * (180 / Math.PI)
  return -angle
}

/**
 * Derives route line dimensions from bounds, fitting within the thumbnail.
 */
export const deriveRouteDimensions = (
  bounds: Bounds,
  thumbnailWidth: number,
  thumbnailHeight: number
): { top: number; left: number; width: number; height: number } => {
  const latSpan = Math.abs(bounds.north - bounds.south)
  const lngSpan = Math.abs(bounds.east - bounds.west)

  const availableWidth = thumbnailWidth - ROUTE_PADDING * 2
  const availableHeight = thumbnailHeight - ROUTE_PADDING * 2

  if (latSpan === 0 && lngSpan === 0) {
    return {
      top: (thumbnailHeight - MIN_ROUTE_DIMENSION) / 2,
      left: (thumbnailWidth - MIN_ROUTE_DIMENSION) / 2,
      width: MIN_ROUTE_DIMENSION,
      height: MIN_ROUTE_DIMENSION,
    }
  }

  const aspect = lngSpan / latSpan
  let routeWidth: number
  let routeHeight: number

  if (aspect >= 1) {
    routeWidth = Math.max(availableWidth, MIN_ROUTE_DIMENSION)
    routeHeight = Math.max(availableWidth / aspect, MIN_ROUTE_DIMENSION)
  } else {
    routeHeight = Math.max(availableHeight, MIN_ROUTE_DIMENSION)
    routeWidth = Math.max(availableHeight * aspect, MIN_ROUTE_DIMENSION)
  }

  routeWidth = Math.min(routeWidth, availableWidth)
  routeHeight = Math.min(routeHeight, availableHeight)
  routeWidth = Math.max(routeWidth, MIN_ROUTE_DIMENSION)
  routeHeight = Math.max(routeHeight, MIN_ROUTE_DIMENSION)

  return {
    top: (thumbnailHeight - routeHeight) / 2,
    left: (thumbnailWidth - routeWidth) / 2,
    width: routeWidth,
    height: routeHeight,
  }
}

/**
 * RouteThumbnail component for route preview thumbnails.
 * Displays a small thumbnail with a route line visualization
 * over a dark gradient background.
 */
export const RouteThumbnail = ({
  width = 96,
  height = 96,
  rotation = DEFAULT_ROTATION,
  routeTop = 20,
  routeLeft = 15,
  routeWidth = 60,
  routeHeight = 50,
  bounds,
  testID,
}: RouteThumbnailProps) => {
  const { semantic } = useSemanticTheme()

  const derivedRotation = bounds
    ? deriveRotationFromBounds(bounds)
    : rotation
  const derivedDimensions = bounds
    ? deriveRouteDimensions(bounds, width, height)
    : { top: routeTop, left: routeLeft, width: routeWidth, height: routeHeight }

  return (
    <View
      testID={testID}
      style={[styles.container, { width, height, borderRadius: semantic.radius.lg }]}
    >
      <LinearGradient
        colors={[semantic.color.background.default, semantic.color.surface.default]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View
          testID="route-line"
          style={[
            styles.route,
            {
              top: derivedDimensions.top,
              left: derivedDimensions.left,
              width: derivedDimensions.width,
              height: derivedDimensions.height,
              borderColor: semantic.color.primary.default,
              borderRadius: semantic.radius.md,
              transform: [{ rotate: `${derivedRotation}deg` }],
            },
          ]}
        />
      </LinearGradient>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
  },
  route: {
    position: 'absolute',
    borderWidth: 2,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
})
