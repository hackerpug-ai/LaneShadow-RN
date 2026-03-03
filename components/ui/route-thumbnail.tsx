/**
 * RouteThumbnail Component
 *
 * Small route preview thumbnail with route line visualization
 * Follows the design system thumbnail patterns
 */

import { StyleSheet, View } from 'react-native'
import { useTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

export type RouteThumbnailProps = {
  /** Width of the thumbnail */
  width?: number
  /** Height of the thumbnail */
  height?: number
  /** Rotation of the route line in degrees */
  rotation?: number
  /** Top position offset of route line */
  routeTop?: number
  /** Left position offset of route line */
  routeLeft?: number
  /** Route line width */
  routeWidth?: number
  /** Route line height */
  routeHeight?: number
}

/**
 * RouteThumbnail component for route preview thumbnails
 * Displays a small thumbnail with a route line visualization
 */
export const RouteThumbnail = ({
  width = 96,
  height = 96,
  rotation = -10,
  routeTop = 20,
  routeLeft = 15,
  routeWidth = 60,
  routeHeight = 50,
}: RouteThumbnailProps) => {
  const theme = useTheme<ExtendedTheme>()
  const { semantic } = theme

  return (
    <View
      style={[
        styles.thumbnail,
        {
          width,
          height,
        },
      ]}
    >
      <View
        style={[
          styles.route,
          {
            top: routeTop,
            left: routeLeft,
            width: routeWidth,
            height: routeHeight,
            borderColor: semantic.color.primary.default,
            transform: [{ rotate: `${rotation}deg` }],
          },
        ]}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  thumbnail: {
    backgroundColor: 'linear-gradient(135deg, #1a1d21 0%, #0d1117 100%)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  route: {
    position: 'absolute',
    borderWidth: 2,
    borderRadius: 10,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
})
