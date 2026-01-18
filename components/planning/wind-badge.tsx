/**
 * Wind Badge Component
 * Displays wind condition level with appropriate styling
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing Badge component
 * - Supports extensible wind levels
 */

import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { WindSummary } from '../../models/saved-routes'
import { Badge } from '../ui/badge'

export type WindBadgeProps = {
  windLevel: WindSummary
  testID?: string
}

/**
 * Wind badge component that displays wind condition with color coding
 */
export const WindBadge = ({ windLevel, testID }: WindBadgeProps) => {
  const { semantic } = useSemanticTheme()

  // Get badge variant based on wind level
  const getBadgeVariant = (): 'success' | 'warning' | 'destructive' | 'secondary' => {
    switch (windLevel) {
      case 'low':
        return 'success'
      case 'moderate':
        return 'warning'
      case 'high':
        return 'destructive'
      case 'unavailable':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  // Get wind icon based on level
  const getWindIcon = (): string => {
    switch (windLevel) {
      case 'low':
        return 'weather-windy'
      case 'moderate':
        return 'weather-windy'
      case 'high':
        return 'weather-windy'
      case 'unavailable':
        return 'weather-windy'
      default:
        return 'weather-windy'
    }
  }

  // Get display text for wind level
  const getWindText = (): string => {
    switch (windLevel) {
      case 'low':
        return 'Low'
      case 'moderate':
        return 'Moderate'
      case 'high':
        return 'High'
      case 'unavailable':
        return 'Unavailable'
      default:
        return 'Unknown'
    }
  }

  return (
    <View style={styles.container} testID={testID}>
      <Badge variant={getBadgeVariant()}>{getWindText()}</Badge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
})
