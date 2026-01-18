/**
 * Route Option Card Component
 * Displays individual route option with selection state
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components
 * - Supports selection state with visual feedback
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionView } from '../../types/routes'
import { IconSymbol } from '../ui/icon-symbol'
import { WindBadge } from './wind-badge'

export type RouteOptionCardProps = {
  routeOption: PlannedRouteOptionView
  isSelected: boolean
  onSelect: (routeOptionId: string) => void
  testID?: string
}

/**
 * Route option card component that displays route information
 */
export const RouteOptionCard = ({
  routeOption,
  isSelected,
  onSelect,
  testID,
}: RouteOptionCardProps) => {
  const { semantic } = useSemanticTheme()

  const handlePress = () => {
    onSelect(routeOption.routeOptionId)
  }

  // Format distance for display
  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters}m`
    }
    return `${(meters / 1000).toFixed(1)}km`
  }

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return (
    <Pressable
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.surface.default,
          borderColor: isSelected ? semantic.color.primary.default : semantic.color.border.default,
          borderWidth: isSelected ? 2 : 1,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.md,
        },
      ]}
      testID={testID}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            variant="titleMedium"
            style={[styles.title, { color: semantic.color.onSurface.default }]}
          >
            {routeOption.label}
          </Text>
          {isSelected && (
            <View style={styles.checkmark}>
              <IconSymbol name="check-circle" size={20} color={semantic.color.primary.default} />
            </View>
          )}
        </View>

        <Text
          variant="bodyMedium"
          style={[styles.rationale, { color: semantic.color.onSurface.muted }]}
        >
          {routeOption.rationale}
        </Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statRow}>
          <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
            Distance
          </Text>
          <Text variant="labelMedium" style={{ color: semantic.color.onSurface.default }}>
            {formatDistance(routeOption.stats.distanceMeters)}
          </Text>
        </View>

        <View style={styles.statRow}>
          <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
            Duration
          </Text>
          <Text variant="labelMedium" style={{ color: semantic.color.onSurface.default }}>
            {formatDuration(routeOption.stats.durationSeconds)}
          </Text>
        </View>

        <View style={styles.windRow}>
          <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
            Wind
          </Text>
          <WindBadge
            windLevel={routeOption.overlaysPreview.windSummary}
            testID={`${testID}-wind-badge`}
          />
        </View>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  title: {
    flex: 1,
  },
  rationale: {
    lineHeight: 20,
  },
  checkmark: {
    marginLeft: 8,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statRow: {
    alignItems: 'center',
    flex: 1,
  },
  windRow: {
    alignItems: 'center',
    flex: 1,
  },
})
