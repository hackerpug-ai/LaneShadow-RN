/**
 * Route Option Card Component
 * Displays individual route option with selection state
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components
 * - Supports selection state with visual feedback
 * - Supports loading state during map updates
 * - Shows favorite inclusion indicator when favorites are used
 */

import { Pressable, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useState } from 'react'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionView } from '../../types/routes'
import { Badge } from '../ui/badge'
import { IconSymbol } from '../ui/icon-symbol'
import { RainBadge } from '../ui/rain-badge'

/**
 * Add opacity to a hex color
 */
const addOpacity = (hexColor: string, opacity: number): string => {
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}
import { TemperatureBadge } from '../ui/temperature-badge'
import { WindBadge } from './wind-badge'

export type RouteOptionCardProps = {
  routeOption: PlannedRouteOptionView
  isSelected: boolean
  isLoading?: boolean
  onSelect: (routeOptionId: string) => void
  testID?: string
}

/**
 * Route option card component that displays route information
 */
export const RouteOptionCard = ({
  routeOption,
  isSelected,
  isLoading = false,
  onSelect,
  testID,
}: RouteOptionCardProps) => {
  const { semantic } = useSemanticTheme()
  const [showFavorites, setShowFavorites] = useState(false)

  const handlePress = () => {
    if (!isLoading) {
      onSelect(routeOption.routeOptionId)
    }
  }

  const favoriteCount = routeOption.favorites?.count ?? 0
  const favoriteNames = routeOption.favorites?.names ?? []

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
      disabled={isLoading}
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.surface.default,
          borderColor: isSelected ? semantic.color.primary.default : semantic.color.border.default,
          borderWidth: isSelected ? 2 : 1,
          borderRadius: semantic.radius.lg,
          padding: semantic.space.md,
          opacity: isLoading ? 0.6 : 1,
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
              {isLoading ? (
                <IconSymbol name="loading" size={20} color={semantic.color.primary.default} />
              ) : (
                <IconSymbol name="check-circle" size={20} color={semantic.color.primary.default} />
              )}
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

        <View style={styles.weatherRow}>
          <View style={styles.weatherItem}>
            <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
              Wind
            </Text>
            <WindBadge
              windLevel={routeOption.overlaysPreview.windSummary}
              testID={`${testID}-wind-badge`}
            />
          </View>

          <View style={styles.weatherItem}>
            <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
              Rain
            </Text>
            <RainBadge
              rainSummary={routeOption.overlaysPreview.rainSummary}
              testID={`${testID}-rain-badge`}
            />
          </View>

          <View style={styles.weatherItem}>
            <Text variant="bodySmall" style={{ color: semantic.color.onSurface.muted }}>
              Temp
            </Text>
            <TemperatureBadge
              temperatureSummary={routeOption.overlaysPreview.temperatureSummary}
              temperatureValue={routeOption.overlaysPreview.maxTemperatureF}
              testID={`${testID}-temperature-badge`}
            />
          </View>
        </View>
      </View>

      {/* Favorite inclusion indicator */}
      {favoriteCount > 0 && (
        <View style={[styles.favoriteSection, { marginTop: semantic.space.sm }]}>
          <Pressable
            onPress={() => setShowFavorites(!showFavorites)}
            style={styles.favoriteBadgePressable}
            testID={`${testID}-favorite-badge`}
          >
            <Badge variant="default" testID={`${testID}-favorite-badge-inner`}>
              <IconSymbol name="heart" size={12} color={semantic.color.onPrimary.default} />
              <Text
                variant="labelSmall"
                style={{ color: semantic.color.onPrimary.default, marginLeft: 4 }}
              >
                {favoriteCount} favorite{favoriteCount > 1 ? 's' : ''}
              </Text>
            </Badge>
          </Pressable>

          {/* Expandable favorite names list */}
          {showFavorites && favoriteNames.length > 0 && (
            <View
              style={[
                styles.favoriteList,
                {
                  backgroundColor: addOpacity(semantic.color.surface.default, 0.5),
                  borderRadius: semantic.radius.md,
                  padding: semantic.space.sm,
                  marginTop: semantic.space.xs,
                },
              ]}
              testID={`${testID}-favorite-list`}
            >
              {favoriteNames.map((name) => (
                <Text
                  key={name}
                  variant="bodySmall"
                  style={{ color: semantic.color.onSurface.muted, marginBottom: 2 }}
                >
                  • {name}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  statRow: {
    alignItems: 'center',
    flex: 1,
  },
  weatherRow: {
    alignItems: 'center',
    flex: 3,
    flexDirection: 'row',
    gap: 8,
  },
  weatherItem: {
    alignItems: 'center',
    flex: 1,
  },
  favoriteSection: {
    marginTop: 4,
  },
  favoriteBadgePressable: {
    alignSelf: 'flex-start',
  },
  favoriteList: {
    marginTop: 4,
  },
})
