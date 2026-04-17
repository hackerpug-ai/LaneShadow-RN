/**
 * LabelSkeleton Component
 *
 * Shimmer effect for text placeholders with short/medium/long width variants.
 * Uses left-to-right shimmer sweep animation (1500ms cycle) with native driver.
 * Falls back to static placeholder on reduce-motion preference.
 *
 * Accessibility: screen reader announces "Loading" via accessibilityLabel.
 */

import type React from 'react'
import { useEffect, useRef, useState } from 'react'
import {
  AccessibilityInfo,
  Animated,
  type StyleProp,
  StyleSheet,
  type ViewStyle,
} from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type LabelSkeletonWidth = 'short' | 'medium' | 'long'

export type LabelSkeletonProps = {
  /** Width variant - defaults to 'medium' */
  width?: LabelSkeletonWidth
  /** Height in pixels - defaults to 28 (matches heading.lg lineHeight) */
  height?: number
  /** Border radius in pixels - defaults to theme radius.md */
  borderRadius?: number
  /** Additional style overrides */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WIDTH_MAP: Record<LabelSkeletonWidth, number> = {
  short: 80,
  medium: 160,
  long: 240,
} as const

const SHIMMER_DURATION_MS = 1500
const DEFAULT_HEIGHT = 28

/** Shimmer overlay color: white at 10% opacity (design token) */
const SHIMMER_OVERLAY_COLOR = 'rgba(255,255,255,0.10)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const LabelSkeleton = ({
  width = 'medium',
  height = DEFAULT_HEIGHT,
  borderRadius,
  style,
  testID,
}: LabelSkeletonProps): React.ReactNode => {
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

  const resolvedWidth = WIDTH_MAP[width]
  const resolvedRadius = borderRadius ?? semantic.radius.md

  // Shimmer translateX animation: -width to +width (sweep across)
  const translateX = useRef(new Animated.Value(-resolvedWidth)).current

  useEffect(() => {
    if (reduceMotion) return

    Animated.loop(
      Animated.timing(translateX, {
        toValue: resolvedWidth,
        duration: SHIMMER_DURATION_MS,
        useNativeDriver: true,
      }),
    ).start()

    return () => {
      translateX.stopAnimation()
    }
  }, [translateX, resolvedWidth, reduceMotion])

  // Shimmer overlay: white 10% opacity, sweeps left-to-right
  const shimmerStyle = {
    transform: [{ translateX }],
  }

  return (
    <Animated.View
      testID={testID ?? 'label-skeleton'}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      style={[
        styles.container,
        {
          width: resolvedWidth,
          height,
          borderRadius: resolvedRadius,
          backgroundColor: semantic.color.surfaceVariant.default,
        },
        style,
      ]}
    >
      {!reduceMotion && (
        <Animated.View
          style={[
            styles.shimmer,
            {
              width: resolvedWidth,
              height,
              borderRadius: resolvedRadius,
              backgroundColor: SHIMMER_OVERLAY_COLOR,
            },
            shimmerStyle,
          ]}
        />
      )}
    </Animated.View>
  )
}

LabelSkeleton.displayName = 'LabelSkeleton'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
})
