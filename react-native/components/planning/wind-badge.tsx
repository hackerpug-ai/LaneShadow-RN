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
import type { WindSummary } from '../../../server/models/saved-routes'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Badge } from '../ui/badge'

export type WindBadgeProps = {
  windLevel: WindSummary
  testID?: string
}

// Known wind levels this UI version understands (strict from schema)
type WindLevelKnown = 'low' | 'moderate' | 'high' | 'unavailable'

// Accept any string for forward compatibility (backend may add new types)
export type WindLevel = WindLevelKnown | (string & {})

/**
 * Wind badge component that displays wind condition with color coding
 * Follows extensible enum pattern with Partial mapping
 */
export const WindBadge = ({ windLevel, testID }: WindBadgeProps) => {
  const { semantic } = useSemanticTheme()

  // Partial map: only define labels we know
  // TypeScript error if schema type is removed/changed
  const LABELS: Partial<Record<WindLevelKnown, string>> = {
    low: 'Low',
    moderate: 'Moderate',
    high: 'High',
    unavailable: 'Unavailable',
  }

  // Partial map: only define badge variants we know
  const BADGE_VARIANTS: Partial<
    Record<WindLevelKnown, 'success' | 'warning' | 'destructive' | 'secondary'>
  > = {
    low: 'success',
    moderate: 'warning',
    high: 'destructive',
    unavailable: 'secondary',
  }

  // Safe getter with dev warning + graceful fallback
  const getLabel = (level: WindLevel): string => {
    const mapped = LABELS[level as WindLevelKnown]
    if (mapped) return mapped

    // Unknown type (new backend value) - warn in dev, show fallback
    if (__DEV__) {
    }

    // Graceful fallback: CAPS_CASE with underscores converted to spaces
    return level.toUpperCase().replace(/_/g, ' ')
  }

  // Safe getter for badge variant
  const getBadgeVariant = (): 'success' | 'warning' | 'destructive' | 'secondary' => {
    const mapped = BADGE_VARIANTS[windLevel as WindLevelKnown]
    return mapped || 'secondary'
  }

  // Safe getter for icon (all levels use same icon)
  const _getWindIcon = (): string => {
    return 'weather-windy'
  }

  return (
    <View style={styles.container} testID={testID}>
      <Badge variant={getBadgeVariant()}>{getLabel(windLevel)}</Badge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
})
