/**
 * Rain Timing Summary Component
 *
 * Displays human-readable rain timing information for a route.
 * Shows when rain is expected during the ride based on departure time and segment data.
 *
 * Acceptance Criteria:
 * - AC1: Route departing at 1pm with rain in segments 2-4 shows 'Rain expected 2-4pm'
 * - AC2: Route with no rain segments does not display rain timing section
 * - AC3: Entire route has rain shows 'Rain throughout ride'
 * - AC4: Rain data unavailable shows 'Rain data unavailable' in muted style
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { getRainTimingDisplay } from '../../shared/lib/weather/timing-calculator'
import type { RainOverlay, RouteLeg } from '../../shared/models/saved-routes'
import { IconSymbol } from '../ui/icon-symbol'

export type RainTimingSummaryProps = {
  /** Rain overlay data with segments by leg */
  rainOverlay: RainOverlay | undefined
  /** Route legs with duration information */
  legs: RouteLeg[]
  /** Departure time in milliseconds */
  departureTime: number
  /** Test ID for testing */
  testID?: string
}

/**
 * Rain timing summary component
 *
 * Displays rain timing information if rain is expected during the route.
 * Returns null (renders nothing) if there is no rain.
 */
export const RainTimingSummary = ({
  rainOverlay,
  legs,
  departureTime,
  testID,
}: RainTimingSummaryProps) => {
  const { semantic } = useSemanticTheme()

  // Calculate rain timing display text
  const displayText = getRainTimingDisplay(rainOverlay, legs, departureTime)

  // Don't render if no rain (AC2)
  if (!displayText) {
    return null
  }

  // Check if unavailable (AC4)
  const isUnavailable = displayText === 'Rain data unavailable'

  return (
    <View
      style={[
        styles.container,
        {
          gap: semantic.space.sm,
          opacity: isUnavailable ? 0.6 : 1,
        },
      ]}
      testID={testID}
    >
      <IconSymbol
        name="weather-rainy"
        size={16}
        color={semantic.color.onSurface.muted ?? 'transparent'}
      />
      <Text
        variant="bodySmall"
        style={{
          color: isUnavailable ? semantic.color.onSurface.muted : semantic.color.onSurface.default,
        }}
      >
        {displayText}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
