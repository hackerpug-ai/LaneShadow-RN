/**
 * SkeletonWrapper Component
 *
 * Higher-order wrapper that shows a skeleton placeholder while loading,
 * then cross-fades to the real content using Reanimated FadeIn/FadeOut.
 *
 * Usage:
 *   <SkeletonWrapper loading={isLoading} skeleton={<CardSkeleton />}>
 *     <MyRealContent />
 *   </SkeletonWrapper>
 *
 * When `loading` is true, the skeleton is visible.
 * When `loading` transitions to false, the skeleton fades out (300ms) and
 * the content fades in (300ms).
 *
 * Accessibility:
 *   - When loading: announces "Loading" on the skeleton
 *   - When loaded: the content's own accessibility is used
 *   - Respects reduce-motion: transitions are instant (no animation)
 *
 * Following react-rules.md: named export, no unnecessary useCallback/useMemo.
 */

import type React from 'react'
import { useEffect, useState } from 'react'
import { AccessibilityInfo, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native'
import Animated, { FadeIn } from 'react-native-reanimated'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SkeletonWrapperProps = {
  /** Whether content is still loading */
  loading: boolean
  /** Skeleton element to show while loading */
  skeleton: React.ReactNode
  /** Content to show when loaded */
  children: React.ReactNode
  /** Fade transition duration in ms - defaults to 300 */
  fadeDuration?: number
  /** Additional style overrides for the wrapper */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_FADE_DURATION_MS = 300

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const SkeletonWrapper = ({
  loading,
  skeleton,
  children,
  fadeDuration = DEFAULT_FADE_DURATION_MS,
  style,
  testID,
}: SkeletonWrapperProps): React.ReactNode => {
  // Track reduce-motion preference
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => setReduceMotion(enabled))
      .catch(() => {
        // If API unavailable, leave false (animations enabled)
      })
  }, [])

  // When reduce-motion is preferred, skip animated transitions
  const fadeConfig = reduceMotion ? { duration: 0 } : { duration: fadeDuration }

  return (
    <View testID={testID ?? 'skeleton-wrapper'} style={[styles.wrapper, style]}>
      {loading ? (
        <Animated.View
          entering={FadeIn.duration(fadeConfig.duration)}
          accessibilityLabel="Loading"
          accessibilityRole="progressbar"
          testID="skeleton-wrapper-loading"
        >
          {skeleton}
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(fadeConfig.duration)}
          testID="skeleton-wrapper-content"
        >
          {children}
        </Animated.View>
      )}
    </View>
  )
}

SkeletonWrapper.displayName = 'SkeletonWrapper'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  wrapper: {
    // Layout determined by children
  },
})
