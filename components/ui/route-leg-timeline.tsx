/**
 * RouteLegTimeline Component
 *
 * Displays a leg-by-leg breakdown of a saved route with per-leg stats
 * and weather badges. Uses the dot + gradient visual language from RouteTimeline
 * but with a different API designed for route detail display.
 *
 * Follows project patterns:
 * - Named exports
 * - useSemanticTheme() for ALL visual tokens
 * - No hardcoded colors, spacing, or font sizes
 * - testID props
 */

import { LinearGradient } from 'expo-linear-gradient'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { WindBadge } from '../planning/wind-badge'
import { RainBadge } from './rain-badge'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { getWorstRainLevel, RAIN_SUMMARY, WIND_SUMMARY } from '../../models/saved-routes'
import type { RouteLeg, RouteOverlays, PlanInput, RainOverlay, WindOverlay , WindSummary, RainSummary } from '../../models/saved-routes'

// ---------------------------------------------------------------------------
// withAlpha utility (same as route-timeline.tsx, colocated for independence)
// ---------------------------------------------------------------------------

const withAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('#')) {
    const hex = color.slice(1)
    const isShort = hex.length === 3 || hex.length === 4
    const isLong = hex.length === 6 || hex.length === 8
    if (!isShort && !isLong) return color

    const expand = (v: string) => v + v
    const toInt = (v: string) => Number.parseInt(v, 16)

    const r = toInt(isShort ? expand(hex[0] ?? '0') : (hex.slice(0, 2) || '00'))
    const g = toInt(isShort ? expand(hex[1] ?? '0') : (hex.slice(2, 4) || '00'))
    const b = toInt(isShort ? expand(hex[2] ?? '0') : (hex.slice(4, 6) || '00'))
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

// ---------------------------------------------------------------------------
// Per-leg weather derivation utilities
// ---------------------------------------------------------------------------

const getWorstRainForLeg = (rainOverlay: RainOverlay | undefined, legIndex: number): RainSummary => {
  if (!rainOverlay) return RAIN_SUMMARY.UNAVAILABLE
  const legData = rainOverlay.byLeg.find((l) => l.legIndex === legIndex)
  if (!legData) return RAIN_SUMMARY.UNAVAILABLE
  // Build a minimal single-leg overlay for reuse of getWorstRainLevel
  const singleLegOverlay: RainOverlay = {
    generatedAt: rainOverlay.generatedAt,
    modelVersion: rainOverlay.modelVersion,
    legend: rainOverlay.legend,
    byLeg: [legData],
  }
  return getWorstRainLevel(singleLegOverlay)
}

const getWorstWindForLeg = (windOverlay: WindOverlay | undefined, legIndex: number): WindSummary => {
  if (!windOverlay) return WIND_SUMMARY.UNAVAILABLE
  const legData = windOverlay.byLeg.find((l) => l.legIndex === legIndex)
  if (!legData || legData.segments.length === 0) return WIND_SUMMARY.UNAVAILABLE

  const WIND_ORDER: WindSummary[] = [WIND_SUMMARY.HIGH, WIND_SUMMARY.MODERATE, WIND_SUMMARY.LOW]
  for (const level of WIND_ORDER) {
    if (legData.segments.some((s) => s.level === level)) return level
  }
  return WIND_SUMMARY.LOW
}

// ---------------------------------------------------------------------------
// Format helpers
// ---------------------------------------------------------------------------

const formatLegDistance = (distanceMeters: number): string => {
  const miles = distanceMeters / 1609.344
  return `${miles.toFixed(1)} mi`
}

const formatLegDuration = (durationSeconds: number): string => {
  const totalMinutes = Math.round(durationSeconds / 60)
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
}

/**
 * Get a descriptive label for a route stop (start or end of a leg).
 * Uses fallback: AI label → generic leg label.
 * Never returns "waypoint" as a fallback.
 */
const getLegLabel = (
  stop: RouteLeg['start'] | RouteLeg['end'],
  legIndex: number,
  position: 'start' | 'end',
  isFirstLeg: boolean,
  isLastLeg: boolean
): string => {
  // Priority 1: Use AI-generated label if available
  if (stop.label) {
    return stop.label
  }

  // Priority 2: Generic but better than "waypoint"
  // For the very first point, use "Start"
  if (isFirstLeg && position === 'start') {
    return 'Start'
  }

  // For the very last point, use "Destination"
  if (isLastLeg && position === 'end') {
    return 'Destination'
  }

  // Otherwise, use a leg-based label
  return `${position === 'start' ? 'Start' : 'End'} of Leg ${legIndex + 1}`
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RouteLegTimelineProps = {
  legs: RouteLeg[]
  planInput: PlanInput
  overlays?: RouteOverlays
  testID?: string
}

// ---------------------------------------------------------------------------
// LegItem sub-component
// ---------------------------------------------------------------------------

type LegItemProps = {
  leg: RouteLeg
  index: number
  isFirst: boolean
  isLast: boolean
  startLabel: string | undefined
  endLabel: string | undefined
  rainOverlay: RainOverlay | undefined
  windOverlay: WindOverlay | undefined
}

const LegItem = ({
  leg,
  index,
  isFirst,
  isLast,
  startLabel,
  endLabel,
  rainOverlay,
  windOverlay,
}: LegItemProps) => {
  const { semantic } = useSemanticTheme()

  const legRain = getWorstRainForLeg(rainOverlay, leg.legIndex)
  const legWind = getWorstWindForLeg(windOverlay, leg.legIndex)

  // Use improved label logic - never shows "Waypoint X"
  const displayStartLabel = getLegLabel(leg.start, index, 'start', isFirst, isLast)
  const displayEndLabel = getLegLabel(leg.end, index, 'end', isFirst, isLast)

  return (
    <View
      style={[styles.legRow, { paddingVertical: semantic.space.md }]}
      testID={`leg-item-${index}`}
    >
      {/* Left column: timeline dots + connector */}
      <View style={[styles.leftColumn, { width: semantic.space.xl }]}>
        {/* Start dot */}
        <View
          style={[
            styles.dot,
            {
              width: semantic.space.md,
              height: semantic.space.md,
              borderRadius: semantic.radius.full,
              backgroundColor: 'transparent',
              borderWidth: 2,
              borderColor: semantic.color.primary.default,
            },
          ]}
          testID={`leg-start-dot-${index}`}
        />

        {/* Gradient connector line */}
        <LinearGradient
          colors={[
            semantic.color.primary.default,
            withAlpha(semantic.color.primary.default, 0.5),
            withAlpha(semantic.color.onSurface.muted ?? semantic.color.onSurface.default, 0.3),
          ]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.connector}
          testID={`leg-connector-${index}`}
        />

        {/* End dot - only show on last leg */}
        {isLast && (
          <View
            style={[
              styles.dot,
              {
                width: semantic.space.md,
                height: semantic.space.md,
                borderRadius: semantic.radius.full,
                backgroundColor: withAlpha(
                  semantic.color.onSurface.muted ?? semantic.color.onSurface.default,
                  0.5
                ),
              },
            ]}
            testID={`leg-end-dot-${index}`}
          />
        )}

        {/* Intermediate waypoint dot (not last) */}
        {!isLast && (
          <View
            style={[
              styles.dot,
              {
                width: semantic.space.md,
                height: semantic.space.md,
                borderRadius: semantic.radius.full,
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderColor: withAlpha(semantic.color.primary.default, 0.5),
              },
            ]}
            testID={`leg-waypoint-dot-${index}`}
          />
        )}
      </View>

      {/* Right content column */}
      <View style={[styles.rightContent, { paddingLeft: semantic.space.sm }]}>
        {/* Start location label */}
        <Text
          variant="bodySmall"
          style={{ color: semantic.color.onSurface.subtle, marginBottom: semantic.space.xs }}
          testID={`leg-start-label-${index}`}
        >
          {displayStartLabel}
        </Text>

        {/* Leg label */}
        <Text
          variant="bodySmall"
          style={{ color: semantic.color.onSurface.muted, marginBottom: semantic.space.xs }}
          testID={`leg-label-${index}`}
        >
          {`Leg ${index + 1}`}
        </Text>

        {/* Distance + Duration row */}
        <View style={[styles.statsRow, { gap: semantic.space.sm, marginBottom: semantic.space.xs }]}>
          <Text
            variant="bodySmall"
            style={{ color: semantic.color.onSurface.default }}
            testID={`leg-distance-${index}`}
          >
            {formatLegDistance(leg.distanceMeters)}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: semantic.color.onSurface.subtle }}
          >
            {'\u00B7'}
          </Text>
          <Text
            variant="bodySmall"
            style={{ color: semantic.color.onSurface.default }}
            testID={`leg-duration-${index}`}
          >
            {formatLegDuration(leg.durationSeconds)}
          </Text>
        </View>

        {/* Weather badges row */}
        <View style={[styles.badgesRow, { gap: semantic.space.xs, marginBottom: semantic.space.xs }]}>
          <WindBadge windLevel={legWind} testID={`leg-wind-badge-${index}`} />
          <RainBadge rainSummary={legRain} testID={`leg-rain-badge-${index}`} />
        </View>

        {/* End label shown below the last leg */}
        {isLast && displayEndLabel && (
          <Text
            variant="bodySmall"
            style={{ color: semantic.color.onSurface.subtle, marginTop: semantic.space.xs }}
            testID={`leg-end-label-${index}`}
          >
            {displayEndLabel}
          </Text>
        )}
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// RouteLegTimeline main component
// ---------------------------------------------------------------------------

export const RouteLegTimeline = ({ legs, planInput, overlays, testID }: RouteLegTimelineProps) => {
  if (!legs.length) return null

  return (
    <View testID={testID}>
      {legs.map((leg, index) => (
        <LegItem
          key={leg.legIndex}
          leg={leg}
          index={index}
          isFirst={index === 0}
          isLast={index === legs.length - 1}
          startLabel={leg.start.label}
          endLabel={leg.end.label}
          rainOverlay={overlays?.rain}
          windOverlay={overlays?.wind}
        />
      ))}
    </View>
  )
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  legRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  leftColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    flexShrink: 0,
  },
  dot: {
    // Inline styles handle visual tokens
  },
  connector: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    borderRadius: 9999,
  },
  rightContent: {
    flex: 1,
    flexDirection: 'column',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
})
