/**
 * RouteAttachmentCard - Displays route options in chat
 *
 * Shows route summary cards for each route option.
 * Tapping a card selects the route and highlights its polyline on the map.
 *
 * Features:
 * - Route name/label
 * - Duration and distance
 * - Visual selection state
 * - Tap to select
 */

import React from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionsView } from '../../types/routes'

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

type RouteAttachmentCardProps = {
  route: PlannedRouteOptionsView['options'][0]
  isSelected: boolean
  onSelect: (routeId: string) => void
  testID?: string
}

/**
 * Format duration (seconds to human-readable)
 */
const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

/**
 * Format distance (meters to human-readable)
 */
const formatDistance = (meters: number): string => {
  const miles = meters * 0.000621371

  if (miles < 1) {
    return `${Math.round(meters * 3.28084)}ft`
  }
  return `${miles.toFixed(1)}mi`
}

/**
 * Main component
 */
export const RouteAttachmentCard = ({
  route,
  isSelected,
  onSelect,
  testID = 'route-attachment-card',
}: RouteAttachmentCardProps) => {
  const { semantic } = useSemanticTheme()

  const duration = route.stats.durationSeconds
  const distance = route.stats.distanceMeters

  return (
    <TouchableOpacity
      onPress={() => onSelect(route.routeOptionId)}
      style={[
        styles.container,
        {
          backgroundColor: isSelected
            ? addOpacity(semantic.color.primary.default, 0.15)
            : semantic.color.card.default,
          borderColor: isSelected
            ? semantic.color.primary.default
            : semantic.color.border.default,
          borderWidth: isSelected ? 2 : 1,
          borderRadius: semantic.radius.md,
          padding: semantic.space.md,
        },
      ]}
      testID={testID}
      accessible={true}
      accessibilityLabel={`Route ${route.label}, ${formatDuration(
        duration
      )}, ${formatDistance(distance)}`}
      accessibilityHint="Double tap to view route details and highlight on map"
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      {/* Route label */}
      <Text
        style={[
          semantic.type.title.sm,
          {
            color: isSelected
              ? semantic.color.primary.default
              : semantic.color.onSurface.default,
            marginBottom: semantic.space.xs,
          },
        ]}
        numberOfLines={1}
      >
        {route.label}
      </Text>

      {/* Duration and distance */}
      <View style={styles.stats}>
        <View style={styles.stat}>
          <Text
            style={[
              semantic.type.body.sm,
              {
                color: isSelected
                  ? semantic.color.primary.default
                  : semantic.color.onSurface.muted,
              },
            ]}
          >
            {formatDuration(duration)}
          </Text>
        </View>
        <View style={styles.stat}>
          <Text
            style={[
              semantic.type.body.sm,
              {
                color: isSelected
                  ? semantic.color.primary.default
                  : semantic.color.onSurface.muted,
              },
            ]}
          >
            {formatDistance(distance)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 780,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
})
