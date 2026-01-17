/**
 * Route Timeline Component
 * Visual timeline showing start and end points connected by a vertical line
 *
 * Designed to be displayed to the left of input fields in a horizontal row layout
 * Follows project patterns: semantic theme, composition over inheritance
 */

import { View, StyleSheet } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RouteStop } from '../../types/routes'

type RouteTimelineProps = {
  startPoint?: RouteStop | null
  endPoint?: RouteStop | null
}

export const RouteTimeline = ({ startPoint, endPoint }: RouteTimelineProps) => {
  const { semantic } = useSemanticTheme()

  // Show timeline if at least one point exists
  const showTimeline = startPoint || endPoint

  return (
    <View style={[styles.timelineContainer, { paddingHorizontal: semantic.space.md }]}>
      {/* Vertical line connecting start to end */}
      {showTimeline && (
        <View
          style={[
            styles.timelineLine,
            {
              width: 2,
              backgroundColor: semantic.color.primary.default, // Changed to primary color
              opacity: 0.5, // Add opacity for gradient effect
            },
          ]}
        />
      )}

      {/* Start dot (top) - hollow with primary border */}
      {startPoint && (
        <View
          style={[
            styles.timelineDot,
            styles.dotTop,
            {
              width: 12,
              height: 12,
              borderRadius: semantic.radius.full,
              backgroundColor: 'transparent', // Transparent background
              borderWidth: 2,
              borderColor: semantic.color.primary.default, // Primary border
            },
          ]}
        />
      )}

      {/* End dot (bottom) - filled with muted color */}
      {endPoint && (
        <View
          style={[
            styles.timelineDot,
            styles.dotBottom,
            {
              width: 12,
              height: 12,
              borderRadius: semantic.radius.full,
              backgroundColor: `${semantic.color.onSurface.muted}50`, // 50% opacity of muted text color
            },
          ]}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  timelineContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    position: 'relative',
    height: 104, // Height to span both input fields (48px each + 8px gap)
  },
  timelineLine: {
    position: 'absolute',
    top: 6, // Center with 12px dot
    bottom: 6,
    left: 19, // Center horizontally (16px padding + 12px dot / 2 - 1px line / 2)
  },
  timelineDot: {
    position: 'absolute',
    left: 16, // Align with padding
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  dotTop: {
    top: 0,
  },
  dotBottom: {
    bottom: 0,
  },
})
