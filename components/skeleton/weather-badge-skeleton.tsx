/**
 * WeatherBadgeSkeleton Component
 *
 * Pulse animation for weather badge placeholders.
 * Mimics the shape of WeatherPill: pill shape with icon circle + text bar.
 * Uses opacity pulse animation (0.6 -> 1.0, 1000ms cycle) with native driver.
 * Falls back to static placeholder on reduce-motion preference.
 *
 * Accessibility: screen reader announces "Loading" via accessibilityLabel.
 */

import React, { useEffect, useRef, useState } from 'react'
import { Animated, AccessibilityInfo, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WeatherBadgeSkeletonProps = {
  /** Show compact variant - defaults to false */
  compact?: boolean
  /** Additional style overrides */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PULSE_MIN = 0.6
const PULSE_MAX = 1.0
const PULSE_DURATION_MS = 500

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const WeatherBadgeSkeleton = ({
  compact = false,
  style,
  testID,
}: WeatherBadgeSkeletonProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Track reduce-motion preference
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {
        // If API unavailable, leave false (animations enabled)
      })
  }, [])

  const opacity = useRef(new Animated.Value(PULSE_MAX)).current

  useEffect(() => {
    if (reduceMotion) return

    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: PULSE_MIN,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: PULSE_MAX,
          duration: PULSE_DURATION_MS,
          useNativeDriver: true,
        }),
      ])
    ).start()

    return () => {
      opacity.stopAnimation()
    }
  }, [opacity, reduceMotion])

  const iconSize = compact ? 12 : 16
  const textWidth = compact ? 40 : 60

  return (
    <Animated.View
      testID={testID ?? 'weather-badge-skeleton'}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[
        styles.pill,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          opacity: reduceMotion ? 1 : opacity,
          borderRadius: semantic.radius.full,
        },
        style,
      ]}
    >
      {/* Icon circle placeholder */}
      <Animated.View
        style={[
          styles.iconCircle,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: iconSize / 2,
            backgroundColor: semantic.color.muted.default,
          },
        ]}
      />
      {/* Text bar placeholder */}
      <Animated.View
        style={[
          styles.textBar,
          {
            width: textWidth,
            height: compact ? 10 : 13,
            borderRadius: semantic.radius.sm,
            backgroundColor: semantic.color.muted.default,
          },
        ]}
      />
    </Animated.View>
  )
}

WeatherBadgeSkeleton.displayName = 'WeatherBadgeSkeleton'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    // borderRadius is set inline via semantic.radius.full
    alignSelf: 'flex-start',
  },
  iconCircle: {
    // Dimensions set inline
  },
  textBar: {
    // Dimensions set inline
  },
})
