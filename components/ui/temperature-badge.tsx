/**
 * TemperatureBadge Component
 *
 * Badge for temperature indicators with semantic colors
 * Follows the design system badge patterns
 */

import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Badge } from './badge'
import { IconSymbol } from './icon-symbol'

export type TemperatureSummary = 'cold' | 'mild' | 'warm' | 'hot' | 'unavailable'

export type TemperatureBadgeProps = {
  /** Temperature level */
  temperatureSummary: TemperatureSummary
  /** Optional temperature value in Fahrenheit */
  temperatureValue?: number
  /** Test ID for testing */
  testID?: string
}

// Known temperature levels this UI version understands (strict from schema)
type TemperatureLevelKnown = 'cold' | 'mild' | 'warm' | 'hot' | 'unavailable'

// Accept any string for forward compatibility (backend may add new types)
export type TemperatureLevel = TemperatureLevelKnown | (string & {})

/**
 * Temperature badge component that displays temperature with color coding
 * Follows extensible enum pattern with Partial mapping
 */
export const TemperatureBadge = ({
  temperatureSummary,
  temperatureValue,
  testID,
}: TemperatureBadgeProps) => {
  const { semantic } = useSemanticTheme()

  // Partial map: only define labels we know
  const LABELS: Partial<Record<TemperatureLevelKnown, string>> = {
    cold: 'Cold',
    mild: 'Mild',
    warm: 'Warm',
    hot: 'Hot',
    unavailable: 'Unknown',
  }

  // Partial map: only define badge variants we know
  const BADGE_VARIANTS: Partial<
    Record<TemperatureLevelKnown, 'success' | 'info' | 'warning' | 'destructive' | 'secondary'>
  > = {
    cold: 'info',
    mild: 'success',
    warm: 'warning',
    hot: 'destructive',
    unavailable: 'secondary',
  }

  // Partial map: opacity levels for badge backgrounds
  const BADGE_OPACITY: Partial<Record<TemperatureLevelKnown, number>> = {
    cold: 0.15,
    mild: 0.15,
    warm: 0.15,
    hot: 0.15,
    unavailable: 0.08,
  }

  // Partial map: only define icons we know
  const ICONS: Partial<Record<TemperatureLevelKnown, React.ReactNode>> = {
    cold: (
      <IconSymbol
        name="snowflake-thermometer"
        size={14}
        color={semantic.color.onSurface.subtle ?? 'transparent'}
      />
    ),
    mild: (
      <IconSymbol
        name="thermometer"
        size={14}
        color={semantic.color.onSurface.subtle ?? 'transparent'}
      />
    ),
    warm: (
      <IconSymbol
        name="thermometer-low"
        size={14}
        color={semantic.color.onSurface.subtle ?? 'transparent'}
      />
    ),
    hot: (
      <IconSymbol
        name="thermometer-high"
        size={14}
        color={semantic.color.onSurface.subtle ?? 'transparent'}
      />
    ),
    unavailable: (
      <IconSymbol
        name="help-circle-outline"
        size={14}
        color={semantic.color.onSurface.subtle ?? 'transparent'}
      />
    ),
  }

  // Safe getter with dev warning + graceful fallback
  const getLabel = (level: TemperatureLevel): string => {
    const mapped = LABELS[level as TemperatureLevelKnown]
    if (mapped) return mapped

    // Unknown type (new backend value) - warn in dev, show fallback
    if (__DEV__) {
      console.warn(
        `⚠️ Unmapped temperature level: "${level}" - add to LABELS in temperature-badge.tsx`,
      )
    }

    // Graceful fallback: CAPS_CASE with underscores converted to spaces
    return level.toUpperCase().replace(/_/g, ' ')
  }

  // Safe getter for badge variant
  const getBadgeVariant = (): 'success' | 'info' | 'warning' | 'destructive' | 'secondary' => {
    const mapped = BADGE_VARIANTS[temperatureSummary as TemperatureLevelKnown]
    return mapped || 'secondary'
  }

  // Safe getter for badge opacity
  const getBadgeOpacity = (): number => {
    const mapped = BADGE_OPACITY[temperatureSummary as TemperatureLevelKnown]
    return mapped ?? 1
  }

  // Safe getter for icon
  const getIcon = (): React.ReactNode => {
    return ICONS[temperatureSummary as TemperatureLevelKnown]
  }

  const displayLabel =
    temperatureValue !== undefined ? `${temperatureValue}°` : getLabel(temperatureSummary)

  return (
    <View style={styles.container} testID={testID}>
      <Badge variant={getBadgeVariant()} opacity={getBadgeOpacity()} icon={getIcon()}>
        {displayLabel}
      </Badge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
})
