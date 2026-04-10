/**
 * RouteDetailsSkeleton Component
 *
 * Multi-section skeleton for route details sheet.
 * Composes LabelSkeleton, WeatherBadgeSkeleton, and CardSkeleton to create
 * a full route details loading state with:
 *   - Route title area (label + badges)
 *   - Weather strip (3 weather badge skeletons)
 *   - Stats section (3 stat row skeletons)
 *   - Route description card skeleton
 *
 * Accessibility: screen reader announces "Loading" via accessibilityLabel.
 */

import React from 'react'
import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { LabelSkeleton } from './label-skeleton'
import { WeatherBadgeSkeleton } from './weather-badge-skeleton'
import { CardSkeleton } from './card-skeleton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RouteDetailsSkeletonProps = {
  /** Number of weather badges to show - defaults to 3 */
  weatherCount?: number
  /** Number of stat rows to show - defaults to 3 */
  statRowCount?: number
  /** Show route card skeleton - defaults to true */
  showRouteCard?: boolean
  /** Additional style overrides */
  style?: StyleProp<ViewStyle>
  /** Test ID for testing */
  testID?: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const RouteDetailsSkeleton = ({
  weatherCount = 3,
  statRowCount = 3,
  showRouteCard = true,
  style,
  testID,
}: RouteDetailsSkeletonProps): React.ReactNode => {
  const { semantic } = useSemanticTheme()

  return (
    <View
      testID={testID ?? 'route-details-skeleton'}
      accessibilityLabel="Loading route details"
      accessibilityRole="progressbar"
      style={[styles.container, { gap: semantic.space.lg }, style]}
    >
      {/* Route title section */}
      <View style={[styles.titleSection, { gap: semantic.space.md }]}>
        <LabelSkeleton width="long" testID="route-details-skeleton-title" />
        <View style={styles.badgeRow}>
          <LabelSkeleton
            width="short"
            height={20}
            borderRadius={semantic.radius.sm}
            testID="route-details-skeleton-badge-1"
          />
          <LabelSkeleton
            width="medium"
            height={20}
            borderRadius={semantic.radius.sm}
            testID="route-details-skeleton-badge-2"
          />
        </View>
      </View>

      {/* Weather strip section */}
      <View style={styles.section}>
        <LabelSkeleton
          width="short"
          height={14}
          testID="route-details-skeleton-weather-label"
        />
        <View style={styles.weatherStrip}>
          {Array.from({ length: weatherCount }).map((_, i) => (
            <WeatherBadgeSkeleton
              key={i}
              compact
              testID={`route-details-skeleton-weather-${i}`}
            />
          ))}
        </View>
      </View>

      {/* Stats section */}
      <View style={[styles.section, { gap: semantic.space.sm }]}>
        <LabelSkeleton
          width="short"
          height={14}
          testID="route-details-skeleton-stats-label"
        />
        {Array.from({ length: statRowCount }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.statRow,
              {
                gap: semantic.space.sm,
              },
            ]}
          >
            {/* Icon circle */}
            <View
              style={[
                styles.statIcon,
                {
                  backgroundColor: semantic.color.muted.default,
                  borderRadius: semantic.radius.sm,
                },
              ]}
            />
            {/* Stat text */}
            <LabelSkeleton
              width={i === 0 ? 'medium' : 'short'}
              height={14}
              testID={`route-details-skeleton-stat-${i}`}
            />
          </View>
        ))}
      </View>

      {/* Route card */}
      {showRouteCard && (
        <View style={styles.section}>
          <CardSkeleton
            compact
            showBestBadge={false}
            showWeatherBadge={false}
            testID="route-details-skeleton-card"
          />
        </View>
      )}
    </View>
  )
}

RouteDetailsSkeleton.displayName = 'RouteDetailsSkeleton'

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  titleSection: {
    // gap applied inline
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  section: {
    gap: 8,
  },
  weatherStrip: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIcon: {
    width: 18,
    height: 18,
  },
})
