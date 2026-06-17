/**
 * Temperature Range Summary Component
 *
 * Displays high/low temperature range for a route.
 * Shows thermal color coding for extreme temperatures.
 *
 * Acceptance Criteria:
 * - AC1: Route with 62F-85F shows 'High 85°F / Low 62°F'
 * - AC2: Consistent ~70F shows 'Around 70°F'
 * - AC3: Unavailable data shows 'Temperature data unavailable' in muted style
 * - AC4: Extreme temps (<40F or >90F) show warning styling with appropriate colors
 */

import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import {
  calculateTempRange,
  formatTempRange,
  hasExtremeTemp,
} from '../../shared/lib/weather/temp-calculator'
import type { TemperatureOverlay } from '../../shared/models/saved-routes'
import { IconSymbol } from '../ui/icon-symbol'

export type TempRangeSummaryProps = {
  /** Temperature overlay data with segments by leg */
  temperatureOverlay: TemperatureOverlay | undefined
  /** Test ID for testing */
  testID?: string
}

/**
 * Temperature range summary component
 *
 * Displays temperature range information in the route summary.
 * Shows high/low, consistent temperature, or unavailable message.
 */
export const TempRangeSummary = ({ temperatureOverlay, testID }: TempRangeSummaryProps) => {
  const { semantic } = useSemanticTheme()

  // Calculate temperature range
  const result = calculateTempRange(temperatureOverlay)
  const displayText = formatTempRange(result)
  const extreme = hasExtremeTemp(result)

  // Determine text color based on extreme status (AC4)
  const getTextColor = (): string => {
    if (result.status === 'unavailable') {
      return semantic.color.onSurface.muted ?? semantic.color.onSurface.default
    }
    if (extreme === 'cold') {
      return semantic.color.info.default // blue for cold
    }
    if (extreme === 'hot') {
      return semantic.color.danger.default // red for hot
    }
    return semantic.color.onSurface.default
  }

  return (
    <View
      style={[
        styles.container,
        {
          gap: semantic.space.sm,
          opacity: result.status === 'unavailable' ? 0.6 : 1,
        },
      ]}
      testID={testID}
    >
      <IconSymbol name="thermometer" size={16} color={getTextColor()} />
      <Text variant="bodySmall" style={{ color: getTextColor() }}>
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
