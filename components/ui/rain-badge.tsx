/**
 * RainBadge Component
 *
 * Badge for rain intensity indicators with semantic colors
 * Follows the design system badge patterns
 */

import { IconSymbol } from './icon-symbol'
import { StyleSheet, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { Badge } from './badge'

export type RainSummary = 'none' | 'light' | 'moderate' | 'heavy' | 'unavailable'

export type RainBadgeProps = {
  /** Rain intensity level */
  rainSummary: RainSummary
  /** Test ID for testing */
  testID?: string
}

// Known rain levels this UI version understands (strict from schema)
type RainLevelKnown = 'none' | 'light' | 'moderate' | 'heavy' | 'unavailable'

// Accept any string for forward compatibility (backend may add new types)
export type RainLevel = RainLevelKnown | (string & {})

/**
 * Rain badge component that displays rain intensity with color coding
 * Follows extensible enum pattern with Partial mapping
 */
export const RainBadge = ({ rainSummary, testID }: RainBadgeProps) => {
  const { semantic } = useSemanticTheme()

  // Partial map: only define labels we know
  const LABELS: Partial<Record<RainLevelKnown, string>> = {
    none: 'No rain',
    light: 'Light rain',
    moderate: 'Moderate rain',
    heavy: 'Heavy rain',
    unavailable: 'Unknown',
  }

  // Partial map: only define badge variants we know
  const BADGE_VARIANTS: Partial<
    Record<RainLevelKnown, 'success' | 'info' | 'destructive' | 'secondary'>
  > = {
    none: 'success',
    light: 'info',
    moderate: 'info',
    heavy: 'destructive',
    unavailable: 'secondary',
  }

  // Partial map: opacity levels for badge backgrounds
  const BADGE_OPACITY: Partial<Record<RainLevelKnown, number>> = {
    none: 0.15,
    light: 0.15,
    moderate: 0.2,
    heavy: 0.15,
    unavailable: 0.08,
  }

  // Partial map: only define icons we know
  const ICONS: Partial<Record<RainLevelKnown, React.ReactNode>> = {
    none: <IconSymbol name="check-circle-outline" size={14} />,
    light: <IconSymbol name="water-outline" size={14} />,
    moderate: <IconSymbol name="water" size={14} />,
    heavy: <IconSymbol name="weather-pouring" size={14} />,
    unavailable: <IconSymbol name="help-circle-outline" size={14} />,
  }

  // Safe getter with dev warning + graceful fallback
  const getLabel = (level: RainLevel): string => {
    const mapped = LABELS[level as RainLevelKnown]
    if (mapped) return mapped

    // Unknown type (new backend value) - warn in dev, show fallback
    if (__DEV__) {
      console.warn(`⚠️ Unmapped rain level: "${level}" - add to LABELS in rain-badge.tsx`)
    }

    // Graceful fallback: CAPS_CASE with underscores converted to spaces
    return level.toUpperCase().replace(/_/g, ' ')
  }

  // Safe getter for badge variant
  const getBadgeVariant = (): 'success' | 'info' | 'destructive' | 'secondary' => {
    const mapped = BADGE_VARIANTS[rainSummary as RainLevelKnown]
    return mapped || 'secondary'
  }

  // Safe getter for badge opacity
  const getBadgeOpacity = (): number => {
    const mapped = BADGE_OPACITY[rainSummary as RainLevelKnown]
    return mapped ?? 1
  }

  // Safe getter for icon
  const getIcon = (): React.ReactNode => {
    return ICONS[rainSummary as RainLevelKnown]
  }

  return (
    <View style={styles.container} testID={testID}>
      <Badge variant={getBadgeVariant()} opacity={getBadgeOpacity()} icon={getIcon()}>
        {getLabel(rainSummary)}
      </Badge>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
  },
})
