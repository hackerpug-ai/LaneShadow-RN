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

  const duration = route.map.legs.reduce(
    (sum, leg) => sum + leg.duration.value,
    0
  )
  const distance = route.map.legs.reduce(
    (sum, leg) => sum + leg.distance.value,
    0
  )

  return (
    <TouchableOpacity
      onPress={() => onSelect(route.routeOptionId)}
      style={[
        styles.container,
        {
          backgroundColor: isSelected
            ? semantic.color.primary.container
            : semantic.color.card.default,
          borderColor: isSelected
            ? semantic.color.primary.default
            : semantic.color.outline.default,
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
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
    >
      {/* Route label */}
      <Text
        style={[
          semantic.type.title.sm,
          {
            color: isSelected
              ? semantic.color.onPrimaryContainer.default
              : semantic.color.onCard.default,
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
                  ? semantic.color.onPrimaryContainer.secondary
                  : semantic.color.onCard.secondary,
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
                  ? semantic.color.onPrimaryContainer.secondary
                  : semantic.color.onCard.secondary,
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
