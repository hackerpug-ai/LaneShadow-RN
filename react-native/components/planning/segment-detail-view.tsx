/**
 * SegmentDetailView Component
 *
 * Expandable detail view showing segment-by-segment weather breakdown
 * for the selected route. Each segment row displays distance, duration,
 * and weather indicators with warning highlighting for concerning conditions.
 *
 * Follows the design system and Collapsible component patterns.
 */

import { useState } from 'react'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Text } from 'react-native-paper'
import type { RouteLeg, RouteOverlays } from '../../../server/models/saved-routes'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { IconSymbol } from '../ui/icon-symbol'
import { RainBadge } from '../ui/rain-badge'
import { TemperatureBadge } from '../ui/temperature-badge'
import { WindBadge } from './wind-badge'

export type SegmentDetailViewProps = {
  /** Route legs to display as segments */
  legs: RouteLeg[]
  /** Weather overlay data for each leg */
  overlays: RouteOverlays
  /** Whether to start expanded (for testing) */
  defaultExpanded?: boolean
  /** Test ID for testing */
  testID?: string
}

/**
 * Get the worst rain level for a specific leg from overlay data
 */
const getLegRainLevel = (overlays: RouteOverlays, legIndex: number): string => {
  const rainLeg = overlays.rain?.byLeg.find((l) => l.legIndex === legIndex)
  if (!rainLeg?.segments.length) return 'none'

  // Check for heavy rain first
  if (rainLeg.segments.some((s) => s.level === 'heavy')) return 'heavy'
  if (rainLeg.segments.some((s) => s.level === 'moderate')) return 'moderate'
  if (rainLeg.segments.some((s) => s.level === 'light')) return 'light'
  return 'none'
}

/**
 * Get the worst wind level for a specific leg from overlay data
 */
const getLegWindLevel = (overlays: RouteOverlays, legIndex: number): string => {
  const windLeg = overlays.wind?.byLeg.find((l) => l.legIndex === legIndex)
  if (!windLeg?.segments.length) return 'low'

  if (windLeg.segments.some((s) => s.level === 'high')) return 'high'
  if (windLeg.segments.some((s) => s.level === 'moderate')) return 'moderate'
  return 'low'
}

/**
 * Get the worst temperature level for a specific leg from overlay data
 */
const getLegTemperatureLevel = (overlays: RouteOverlays, legIndex: number): string => {
  const tempLeg = overlays.temperature?.byLeg.find((l) => l.legIndex === legIndex)
  if (!tempLeg?.segments.length) return 'mild'

  if (tempLeg.segments.some((s) => s.level === 'hot')) return 'hot'
  if (tempLeg.segments.some((s) => s.level === 'warm')) return 'warm'
  if (tempLeg.segments.some((s) => s.level === 'cold')) return 'cold'
  return 'mild'
}

/**
 * Check if a leg has concerning weather that should be highlighted
 */
const hasConcerningWeather = (overlays: RouteOverlays, legIndex: number): boolean => {
  const rainLevel = getLegRainLevel(overlays, legIndex)
  const windLevel = getLegWindLevel(overlays, legIndex)
  const tempLevel = getLegTemperatureLevel(overlays, legIndex)

  return (
    rainLevel === 'heavy' ||
    rainLevel === 'moderate' ||
    windLevel === 'high' ||
    windLevel === 'moderate' ||
    tempLevel === 'hot' ||
    tempLevel === 'cold'
  )
}

/**
 * Format distance in miles for display
 */
const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371
  if (miles < 1) {
    return `${Math.round(miles * 10) / 10}mi`
  }
  return `${Math.round(miles)}mi`
}

/**
 * Format duration in minutes for display
 */
const formatDuration = (seconds: number): string => {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `${minutes}min`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
}

/**
 * Segment row component displaying a single leg with weather info
 */
const SegmentRow = ({
  leg,
  overlays,
  legIndex,
}: {
  leg: RouteLeg
  overlays: RouteOverlays
  legIndex: number
}) => {
  const { semantic } = useSemanticTheme()
  const isConcerning = hasConcerningWeather(overlays, leg.legIndex)
  const rainLevel = getLegRainLevel(overlays, leg.legIndex)
  const windLevel = getLegWindLevel(overlays, leg.legIndex)
  const tempLevel = getLegTemperatureLevel(overlays, leg.legIndex)

  return (
    <View
      style={[
        styles.segmentRow,
        isConcerning && styles.segmentRowConcerning,
        isConcerning && { backgroundColor: `${semantic.color.warning.default}15` },
      ]}
      testID={`segment-row-${legIndex}`}
    >
      {/* Concerning indicator */}
      {isConcerning && (
        <View
          style={[styles.warningIndicator, { backgroundColor: semantic.color.warning.default }]}
          testID={`segment-row-${legIndex}-warning`}
        />
      )}

      {/* Leg number */}
      <Text style={styles.legNumber}>{legIndex + 1}</Text>

      {/* Distance and duration */}
      <Text style={styles.distance}>
        {formatDistance(leg.distanceMeters)}, {formatDuration(leg.durationSeconds)}
      </Text>

      {/* Weather badges */}
      <View style={styles.weatherBadges}>
        {rainLevel !== 'none' && (
          <RainBadge rainSummary={rainLevel as any} testID={`segment-row-${legIndex}-rain-badge`} />
        )}
        {windLevel !== 'low' && (
          <WindBadge windLevel={windLevel as any} testID={`segment-row-${legIndex}-wind-badge`} />
        )}
        {tempLevel !== 'mild' && (
          <TemperatureBadge
            temperatureSummary={tempLevel as any}
            testID={`segment-row-${legIndex}-temp-badge`}
          />
        )}
      </View>
    </View>
  )
}

/**
 * SegmentDetailView component
 *
 * Shows expandable list of route segments with weather conditions.
 * For single-leg routes, always shows the segment without collapse controls.
 * For multi-leg routes, shows collapsed by default with tap to expand.
 */
export const SegmentDetailView = ({
  legs,
  overlays,
  defaultExpanded = false,
  testID = 'segment-detail-view',
}: SegmentDetailViewProps) => {
  const { semantic } = useSemanticTheme()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  // Single leg: always expanded, no collapse controls
  if (legs.length === 1) {
    return (
      <View style={styles.container} testID={testID}>
        <SegmentRow leg={legs[0]} overlays={overlays} legIndex={0} />
      </View>
    )
  }

  // Multi-leg: collapsible with chevron indicator
  return (
    <View style={styles.container} testID={testID}>
      <TouchableOpacity
        style={[styles.header, { gap: semantic.space.sm }]}
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={0.7}
        testID="segment-detail-toggle"
      >
        <View style={{ transform: [{ rotate: isExpanded ? '90deg' : '0deg' }] }}>
          <IconSymbol
            name="chevron-right"
            size={18}
            weight="medium"
            color={semantic.color.onSurface.muted || semantic.color.onSurface.default}
          />
        </View>
        <Text style={{ fontWeight: '600' }}>View segment details</Text>
      </TouchableOpacity>

      {isExpanded && (
        <ScrollView style={styles.segmentsList}>
          {legs.map((leg) => (
            <SegmentRow key={leg.legIndex} leg={leg} overlays={overlays} legIndex={leg.legIndex} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentsList: {
    marginTop: 8,
    marginLeft: 24,
  },
  segmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    marginBottom: 6,
  },
  segmentRowConcerning: {
    borderLeftWidth: 3,
  },
  warningIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  legNumber: {
    minWidth: 20,
    fontWeight: '600',
  },
  distance: {
    flex: 1,
  },
  weatherBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
})
