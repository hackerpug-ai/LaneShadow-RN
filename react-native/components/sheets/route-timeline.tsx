/**
 * Route Timeline Component
 * Visual timeline showing start and end points connected by a vertical line
 *
 * Designed to be displayed to the left of input fields in a horizontal row layout
 * Follows project patterns: semantic theme, composition over inheritance
 */

import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { RouteStop } from '../../types/routes'

type RouteTimelineProps = {
  startPoint?: RouteStop | null
  endPoint?: RouteStop | null
}

const withAlpha = (color: string, alpha: number): string => {
  // Supports hex, rgb(), rgba(). Falls back to the original string.
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const isShort = hex.length === 3 || hex.length === 4
    const isLong = hex.length === 6 || hex.length === 8
    if (!isShort && !isLong) return color

    const expand = (v: string) => v + v
    const toInt = (v: string) => Number.parseInt(v, 16)

    const r = toInt(isShort ? expand(hex[0] ?? '0') : hex.slice(0, 2) || '00')
    const g = toInt(isShort ? expand(hex[1] ?? '0') : hex.slice(2, 4) || '00')
    const b = toInt(isShort ? expand(hex[2] ?? '0') : hex.slice(4, 6) || '00')
    return `rgba(${r},${g},${b},${alpha})`
  }

  const rgbMatch = color.match(/^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/)
  if (rgbMatch) {
    const [, r, g, b] = rgbMatch
    return `rgba(${r},${g},${b},${alpha})`
  }

  const rgbaMatch = color.match(/^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/)
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch
    return `rgba(${r},${g},${b},${alpha})`
  }

  return color
}

export const RouteTimeline = ({ startPoint, endPoint }: RouteTimelineProps) => {
  const { semantic } = useSemanticTheme()

  return (
    <View style={[styles.timelineContainer, { paddingTop: semantic.space.lg }]}>
      {/* Start dot (top) - always visible, hollow with primary border */}
      <View
        style={[
          styles.timelineDot,
          {
            width: semantic.space.md, // 12
            height: semantic.space.md, // 12
            borderRadius: semantic.radius.full,
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderColor: semantic.color.primary.default,
          },
        ]}
        testID="timeline-start-dot"
        accessibilityLabel={startPoint ? 'Start location selected' : 'Start location'}
      />

      {/* Vertical gradient line connecting start to end (always visible) */}
      <LinearGradient
        colors={[
          semantic.color.primary.default,
          withAlpha(semantic.color.primary.default, 0.5),
          withAlpha(semantic.color.onSurface.muted ?? semantic.color.onSurface.default, 0.3),
        ]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.timelineLine}
      />

      {/* End dot (bottom) - always visible, filled with muted color */}
      <View
        style={[
          styles.timelineDot,
          {
            width: semantic.space.md, // 12
            height: semantic.space.md, // 12
            borderRadius: semantic.radius.full,
            backgroundColor: withAlpha(
              semantic.color.onSurface.muted ?? semantic.color.onSurface.default,
              0.5,
            ),
          },
        ]}
        testID="timeline-end-dot"
        accessibilityLabel={endPoint ? 'Destination selected' : 'Destination'}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  timelineContainer: {
    width: 24,
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
    alignSelf: 'stretch',
  },
  timelineLine: {
    width: 2, // w-0.5 (2px)
    flex: 1,
    marginVertical: 4, // my-1 (4px)
    borderRadius: 9999,
  },
  timelineDot: {
    // keep empty: dot visuals are controlled inline to match the design
  },
})
