/**
 * CardSkeleton Component
 *
 * Shimmer effect for card content placeholders.
 * Mimics the layout of RouteAttachmentCard: badge row, title, description, stats.
 * Uses left-to-right shimmer sweep animation (1500ms cycle) with native driver.
 *
 * Accessibility: screen reader announces "Loading" via accessibilityLabel.
 */

import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  type LayoutChangeEvent,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { LabelSkeleton } from './label-skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type CardSkeletonProps = {
  /** Show compact variant - reduces padding and gaps */
  compact?: boolean
  /** Show best badge placeholder */
  showBestBadge?: boolean
  /** Show weather badge placeholder */
  showWeatherBadge?: boolean
  /** Additional style overrides */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHIMMER_DURATION_MS = 1500

/** Shimmer overlay color: white at 10% opacity (design token) */
const SHIMMER_OVERLAY_COLOR = 'rgba(255,255,255,0.10)'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const CardSkeleton = ({
  compact = false,
  showBestBadge = true,
  showWeatherBadge = true,
  style,
  testID,
}: CardSkeletonProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  // Capture actual rendered width for shimmer range via onLayout
  const [cardWidth, setCardWidth] = useState(300)

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setCardWidth(event.nativeEvent.layout.width)
  }, [])

  // Shimmer animation for card body
  const translateX = useRef(new Animated.Value(-300)).current

  useEffect(() => {
    // Update animation range when card width changes
    translateX.setValue(-cardWidth)

    Animated.loop(
      Animated.timing(translateX, {
        toValue: cardWidth,
        duration: SHIMMER_DURATION_MS,
        useNativeDriver: true,
      }),
    ).start()

    return () => {
      translateX.stopAnimation()
    }
  }, [translateX, cardWidth])

  const shimmerStyle = {
    transform: [{ translateX }],
  }

  return (
    <Animated.View
      testID={testID ?? 'card-skeleton'}
      accessibilityLabel="Loading"
      accessibilityRole="progressbar"
      onLayout={handleLayout}
      style={[
        styles.card,
        {
          backgroundColor: semantic.color.surfaceVariant.default,
          borderColor: semantic.color.border.default,
          gap: compact ? 6 : 10,
          padding: compact ? 10 : 14,
        },
        style,
      ]}
    >
      {/* Badge row */}
      {(showBestBadge || showWeatherBadge) && (
        <View style={styles.badgeRow}>
          {showBestBadge && (
            <View
              style={[
                styles.bestBadge,
                {
                  backgroundColor: semantic.color.muted.default,
                  borderRadius: semantic.radius.lg,
                },
              ]}
            >
              <LabelSkeleton
                width="short"
                height={12}
                borderRadius={semantic.radius.sm}
                testID="card-skeleton-best-badge"
              />
            </View>
          )}
          {showWeatherBadge && (
            <View
              style={[
                styles.weatherBadge,
                {
                  backgroundColor: semantic.color.muted.default,
                  borderRadius: semantic.radius.lg,
                },
              ]}
            >
              <View
                style={[
                  styles.weatherIconCircle,
                  {
                    backgroundColor: semantic.color.surfaceVariant.pressed,
                    borderRadius: 7,
                  },
                ]}
              />
              <View
                style={[
                  styles.weatherTextBar,
                  {
                    backgroundColor: semantic.color.surfaceVariant.pressed,
                    borderRadius: semantic.radius.sm,
                  },
                ]}
              />
            </View>
          )}
        </View>
      )}

      {/* Title placeholder */}
      <View
        style={[
          styles.titleBar,
          {
            backgroundColor: semantic.color.muted.default,
            borderRadius: semantic.radius.sm,
            height: compact ? 14 : 16,
          },
        ]}
      />

      {/* Description placeholders (only in non-compact) */}
      {!compact && (
        <View style={styles.descriptionGroup}>
          <View
            style={[
              styles.descriptionBar,
              {
                backgroundColor: semantic.color.muted.default,
                borderRadius: semantic.radius.sm,
                height: 14,
              },
            ]}
          />
          <View
            style={[
              styles.descriptionBar,
              {
                backgroundColor: semantic.color.muted.default,
                borderRadius: semantic.radius.sm,
                height: 14,
                width: '60%',
              },
            ]}
          />
        </View>
      )}

      {/* Stats placeholder */}
      <View
        style={[
          styles.statBar,
          {
            backgroundColor: semantic.color.muted.default,
            borderRadius: semantic.radius.sm,
            height: compact ? 11 : 13,
          },
        ]}
      />

      {/* Shimmer overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          {
            backgroundColor: SHIMMER_OVERLAY_COLOR,
          },
          shimmerStyle,
        ]}
        pointerEvents="none"
      />
    </Animated.View>
  )
}

CardSkeleton.displayName = 'CardSkeleton'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bestBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weatherIconCircle: {
    width: 14,
    height: 14,
  },
  weatherTextBar: {
    width: 40,
    height: 12,
  },
  titleBar: {
    width: '70%',
  },
  descriptionGroup: {
    gap: 6,
  },
  descriptionBar: {
    width: '100%',
  },
  statBar: {
    width: '85%',
    marginTop: 2,
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
})
