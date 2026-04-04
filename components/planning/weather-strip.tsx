/**
 * WeatherStrip Component
 *
 * Compact horizontal strip that displays all three weather indicators
 * (wind/rain/temp) with the worst condition highlighted as primary concern.
 *
 * Follows the design system badge patterns and semantic theming.
 * Displays in compact mode showing worst + '+2' for other warnings,
 * expands on tap to show all badges.
 */

import { useState } from 'react'
import { StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { RainBadge } from '../ui/rain-badge'
import { TemperatureBadge } from '../ui/temperature-badge'
import { WindBadge } from './wind-badge'
import { getWorstRainLevel } from '../../models/saved-routes'
import { getWorstTemperatureLevel } from '../../models/saved-routes'
import type { RouteOverlays } from '../../models/saved-routes'

/**
 * Severity level for comparing weather conditions
 * Higher numbers = more severe conditions
 */
const SEVERITY_ORDER: Record<string, number> = {
  // Rain severity
  heavy: 5,
  moderateRain: 4,
  light: 3,
  none: 2,
  // Wind severity
  high: 4,
  moderateWind: 3,
  low: 2,
  // Temperature severity
  hot: 4,
  warm: 3,
  cold: 2,
  mild: 1,
  // Fallback
  unavailable: 0,
}

/**
 * Get worst wind level from WindOverlay
 * Returns 'unavailable' if overlay is missing or empty
 */
const getWorstWindLevel = (overlay?: RouteOverlays['wind']): string => {
  if (!overlay?.byLeg?.length) return 'unavailable'

  const levels: string[] = []
  for (const leg of overlay.byLeg) {
    for (const segment of leg.segments) {
      levels.push(segment.level)
    }
  }

  if (levels.length === 0) return 'unavailable'

  if (levels.includes('high')) return 'high'
  if (levels.includes('moderate')) return 'moderate'
  if (levels.includes('low')) return 'low'

  return 'unavailable'
}

/**
 * Determine the worst condition across all overlays
 * Returns the type and level of the most severe weather condition
 */
const getWorstCondition = (
  overlays: RouteOverlays
): { type: 'rain' | 'wind' | 'temp'; level: string } | null => {
  const rainLevel = getWorstRainLevel(overlays.rain)
  const windLevel = getWorstWindLevel(overlays.wind)
  const tempLevel = getWorstTemperatureLevel(overlays.temperature)

  const rainSeverity = SEVERITY_ORDER[rainLevel] ?? 0
  const windSeverity = SEVERITY_ORDER[windLevel] ?? 0
  const tempSeverity = SEVERITY_ORDER[tempLevel] ?? 0

  // All conditions are favorable (none, low, mild)
  if (
    rainLevel === 'none' &&
    windLevel === 'low' &&
    tempLevel === 'mild'
  ) {
    return null // Good conditions
  }

  // Find the worst condition by severity
  const maxSeverity = Math.max(rainSeverity, windSeverity, tempSeverity)

  // Priority: rain > wind > temperature when severity is tied
  if (rainSeverity === maxSeverity && rainSeverity > 0) {
    return { type: 'rain', level: rainLevel }
  }
  if (windSeverity === maxSeverity && windSeverity > 0) {
    return { type: 'wind', level: windLevel }
  }
  if (tempSeverity === maxSeverity && tempSeverity > 0) {
    return { type: 'temp', level: tempLevel }
  }

  // All unavailable or edge case
  return null
}

/**
 * Count how many conditions have warnings (not favorable)
 */
const countWarnings = (overlays: RouteOverlays): number => {
  const rainLevel = getWorstRainLevel(overlays.rain)
  const windLevel = getWorstWindLevel(overlays.wind)
  const tempLevel = getWorstTemperatureLevel(overlays.temperature)

  let count = 0
  if (rainLevel !== 'none' && rainLevel !== 'unavailable') count++
  if (windLevel === 'moderate' || windLevel === 'high') count++
  if (tempLevel === 'cold' || tempLevel === 'hot' || tempLevel === 'warm') count++

  return count
}

export type WeatherStripProps = {
  /** Route overlays containing wind, rain, and temperature data */
  overlays: RouteOverlays
  /** Test ID for testing */
  testID?: string
}

/**
 * WeatherStrip component
 *
 * Shows a compact horizontal strip of weather badges with the worst
 * condition highlighted. Tap to expand and show all badges.
 */
export const WeatherStrip = ({ overlays, testID }: WeatherStripProps) => {
  const { semantic } = useSemanticTheme()
  const [isExpanded, setIsExpanded] = useState(false)

  const worst = getWorstCondition(overlays)
  const warningCount = countWarnings(overlays)

  const rainLevel = getWorstRainLevel(overlays.rain)
  const windLevel = getWorstWindLevel(overlays.wind)
  const tempLevel = getWorstTemperatureLevel(overlays.temperature)

  const isGoodConditions =
    rainLevel === 'none' &&
    windLevel === 'low' &&
    tempLevel === 'mild'

  return (
    <TouchableWithoutFeedback
      onPress={() => setIsExpanded(!isExpanded)}
      testID={testID || 'weather-strip'}
    >
      <View style={[styles.container, { backgroundColor: addOpacity(semantic.color.success.default, 0.08) }]}>
        {isGoodConditions ? (
          <View style={styles.goodConditionsBadge} testID="weather-strip-good-conditions">
            <GoodConditionsBadge semantic={semantic} />
          </View>
        ) : (
          <>
            {/* Worst condition badge */}
            <View style={styles.badgeContainer}>
              {worst?.type === 'rain' && (
                <RainBadge
                  rainSummary={rainLevel as any}
                  testID="weather-strip-rain-badge"
                />
              )}
              {worst?.type === 'wind' && (
                <WindBadge
                  windLevel={windLevel as any}
                  testID="weather-strip-wind-badge"
                />
              )}
              {worst?.type === 'temp' && (
                <TemperatureBadge
                  temperatureSummary={tempLevel as any}
                  testID="weather-strip-temp-badge"
                />
              )}
            </View>

            {/* Additional warnings indicator */}
            {!isExpanded && warningCount > 1 && (
              <View style={styles.additionalIndicator} testID="weather-strip-additional-warnings">
                <AdditionalWarningBadge count={warningCount - 1} semantic={semantic} />
              </View>
            )}

            {/* Expanded: show all badges */}
            {isExpanded && (
              <View style={styles.expandedBadges}>
                {rainLevel !== 'none' && worst?.type !== 'rain' && (
                  <RainBadge
                    rainSummary={rainLevel as any}
                    testID="weather-strip-rain-badge"
                  />
                )}
                {windLevel !== 'low' && worst?.type !== 'wind' && (
                  <WindBadge
                    windLevel={windLevel as any}
                    testID="weather-strip-wind-badge"
                  />
                )}
                {tempLevel !== 'mild' && worst?.type !== 'temp' && (
                  <TemperatureBadge
                    temperatureSummary={tempLevel as any}
                    testID="weather-strip-temp-badge"
                  />
                )}
              </View>
            )}
          </>
        )}
      </View>
    </TouchableWithoutFeedback>
  )
}

/**
 * Add opacity to a hex color
 */
const addOpacity = (hexColor: string, opacity: number): string => {
  // Remove # if present
  const hex = hexColor.replace('#', '')

  // Parse RGB
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * Good conditions badge showing all weather is favorable
 */
const GoodConditionsBadge = ({ semantic }: { semantic: any }) => (
  <View style={[goodStyles.badge, { backgroundColor: addOpacity(semantic.color.success.default, 0.15) }]}>
    <Text style={[goodStyles.icon, { color: semantic.color.success.default }]}>✓</Text>
    <Text style={[goodStyles.label, { color: semantic.color.success.default }]}>Good conditions</Text>
  </View>
)

/**
 * Additional warnings badge showing +N for more warnings
 */
const AdditionalWarningBadge = ({ count, semantic }: { count: number; semantic: any }) => (
  <View style={[warningStyles.badge, { backgroundColor: addOpacity(semantic.color.warning.default, 0.15) }]}>
    <Text style={[warningStyles.label, { color: semantic.color.warning.default }]}>+{count}</Text>
  </View>
)

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  additionalIndicator: {
    marginLeft: 2,
  },
  expandedBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 6,
  },
  goodConditionsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
})

const goodStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  icon: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
})

const warningStyles = StyleSheet.create({
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
})
