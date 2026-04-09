/**
 * RouteAttachmentCard - Displays route options in chat
 *
 * REDESIGNED: Clear route information without overlap
 * - Shows descriptive route name prominently
 * - Shows rationale for route choice
 * - Essential stats in a single row
 * - Weather indicators with icons
 * - No redundant information
 * - Won't overlap with chat messages
 *
 * Features:
 * - Two-row layout (name+stats / rationale+badges)
 * - Visual selection state
 * - Tap to view directions, long-press to select
 * - Weather condition badges
 * - Favorite count when applicable
 */

import React, { useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionsView } from '../../types/routes'
import { RouteDirectionsSheet } from '../sheets/route-directions-sheet'
import { Badge } from '../ui/badge'
import { IconSymbol } from '../ui/icon-symbol'

type RouteAttachmentCardProps = {
  route: PlannedRouteOptionsView['options'][0]
  isSelected: boolean
  onSelect: (routeId: string) => void
  testID?: string
  /** Visual variant: 'compact' for map overlay, 'full' for chat transcript */
  variant?: 'compact' | 'full'
  /** Elevation gain in feet (for elevation badge) */
  elevationGainFt?: number
  /** Whether favorites were included in route planning */
  includeFavorites?: boolean
  /** Called when card is pressed in 'full' variant to navigate to map */
  onViewOnMap?: () => void
  /** Called when a leg is pressed in the directions sheet */
  onLegSelect?: (legIndex: number) => void
  /** Index of the currently selected leg */
  selectedLegIndex?: number
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
 * Get weather icon based on conditions
 */
const getWeatherIcon = (windSummary: string, rainSummary: string): string => {
  if (rainSummary.toLowerCase().includes('heavy') || rainSummary.toLowerCase().includes('rain')) {
    return 'weather-rainy'
  }
  if (windSummary.toLowerCase().includes('high') || windSummary.toLowerCase().includes('strong')) {
    return 'weather-windy'
  }
  return 'weather-partly-cloudy'
}

/**
 * Main component - clear two-row layout
 */
export const RouteAttachmentCard = ({
  route,
  isSelected,
  onSelect,
  testID = 'route-attachment-card',
  variant = 'compact',
  elevationGainFt,
  includeFavorites = false,
  onViewOnMap,
  onLegSelect,
  selectedLegIndex,
}: RouteAttachmentCardProps) => {
  console.info('[RouteAttachmentCard] Rendering', {
    routeId: route.routeOptionId,
    label: route.label,
    isSelected,
    variant,
  })

  const { semantic } = useSemanticTheme()
  const [directionsVisible, setDirectionsVisible] = useState(false)

  const duration = route.stats.durationSeconds
  const distance = route.stats.distanceMeters

  // Extract start and end location names from the legs
  const legs = route.map.legs
  const startLabel = legs[0]?.start.label || legs[0]?.start.placeId || 'Unknown'
  const endLabel = legs[legs.length - 1]?.end.label || legs[legs.length - 1]?.end.placeId || 'Unknown'

  const handlePress = () => {
    // In 'full' variant (chat context), navigate to map
    // In 'compact' variant (map context), show directions sheet
    if (variant === 'full') {
      console.info('[RouteAttachmentCard] Press in chat context - navigating to map', { routeId: route.routeOptionId })
      onSelect(route.routeOptionId)
      onViewOnMap?.()
    } else {
      console.info('[RouteAttachmentCard] Press in map context - opening directions sheet', { routeId: route.routeOptionId })
      setDirectionsVisible(true)
    }
  }

  const handleLongPress = () => {
    console.info('[RouteAttachmentCard] Long press - selecting route', { routeId: route.routeOptionId })
    onSelect(route.routeOptionId)
  }

  const isCompact = variant === 'compact'

  return (
    <View>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        delayLongPress={300}
        style={[
          styles.container,
          isSelected ? styles.selectedBorder : styles.defaultBorder,
          {
            backgroundColor: isSelected
              ? semantic.color.primary.default + '33' // 20% opacity
              : isCompact
                ? semantic.color.surface.default + 'E6' // 90% opacity
                : semantic.color.surfaceVariant.default,
            borderColor: isSelected
              ? semantic.color.primary.default
              : semantic.color.border.default + '66',
            borderRadius: isCompact ? semantic.radius.sm : semantic.radius.md,
            paddingHorizontal: isCompact ? semantic.space.sm : semantic.space.md,
            paddingVertical: isCompact ? semantic.space.xs : semantic.space.sm,
            ...semantic.elevation[isCompact ? 1 : 2],
          },
        ]}
        testID={testID}
        accessible={true}
        accessibilityLabel={`Route: ${route.label}, ${formatDuration(duration)}, ${formatDistance(distance)}`}
        accessibilityHint={variant === 'full' ? 'Tap to view on map, long press to select route' : 'Tap to view directions, long press to select route'}
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        {/* Two-row layout for chat, single-row for compact */}
        <View style={[styles.content, isCompact ? styles.compactContent : styles.fullContent]}>
          {/* Row 1: Start → End with route name */}
          <View style={styles.topRow}>
            <View style={styles.routeInfo}>
              <Text
                style={[
                  styles.locationLabel,
                  {
                    color: isSelected
                      ? semantic.color.primary.default
                      : semantic.color.onSurface.default,
                  },
                ]}
                numberOfLines={1}
              >
                {startLabel}
              </Text>

              <IconSymbol
                name="arrow-right"
                size={14}
                color={isSelected ? semantic.color.primary.default : semantic.color.onSurface.muted}
              />

              <Text
                style={[
                  styles.locationLabel,
                  {
                    color: isSelected
                      ? semantic.color.primary.default
                      : semantic.color.onSurface.default,
                  },
                ]}
                numberOfLines={1}
              >
                {endLabel}
              </Text>
            </View>

            {/* Stats on the right */}
            <View style={styles.quickStats}>
              <Text
                style={[
                  styles.quickStatText,
                  { color: isSelected ? semantic.color.primary.default : semantic.color.onSurface.subtle },
                ]}
              >
                {formatDistance(distance)} • {formatDuration(duration)}
              </Text>
            </View>
          </View>

          {/* Row 2: Route name + badges (full variant only) */}
          {!isCompact && (
            <View style={styles.bottomRow}>
              <Text
                style={[
                  styles.routeName,
                  {
                    color: semantic.color.onSurface.subtle,
                    flex: 1,
                  },
                ]}
                numberOfLines={1}
              >
                {route.label}
              </Text>

              <View style={styles.badgesSection}>
                {/* Weather indicator - simple and clear */}
                {(route.overlaysPreview.rainSummary !== 'none' || route.overlaysPreview.windSummary === 'high') && (
                  <View style={styles.badgesSection}>
                    {route.overlaysPreview.rainSummary !== 'none' && route.overlaysPreview.rainSummary !== 'unavailable' && (
                      <View
                        style={[
                          styles.weatherBadge,
                          {
                            backgroundColor: semantic.color.danger.default + '20',
                          },
                        ]}
                      >
                        <IconSymbol
                          name="weather-rainy"
                          size={12}
                          color={semantic.color.danger.default}
                        />
                        <Text
                          style={[
                            styles.weatherText,
                            { color: semantic.color.danger.default },
                          ]}
                        >
                          {route.overlaysPreview.rainSummary}
                        </Text>
                      </View>
                    )}

                    {route.overlaysPreview.windSummary === 'high' && (
                      <View
                        style={[
                          styles.weatherBadge,
                          {
                            backgroundColor: semantic.color.warning.default + '20',
                          },
                        ]}
                      >
                        <IconSymbol
                          name="weather-windy"
                          size={12}
                          color={semantic.color.warning.default}
                        />
                        <Text
                          style={[
                            styles.weatherText,
                            { color: semantic.color.warning.default },
                          ]}
                        >
                          High wind
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                {/* Favorites badge */}
                {includeFavorites && (route.favorites?.count ?? 0) > 0 && (
                  <Badge
                    variant="default"
                    testID={`${testID}-favorite-badge`}
                    style={{ marginLeft: 4 }}
                  >
                    <IconSymbol name="heart" size={10} color={semantic.color.onPrimary.default} />
                    <Text style={{ color: semantic.color.onPrimary.default, marginLeft: 2 }}>
                      {route.favorites?.count ?? 0}
                    </Text>
                  </Badge>
                )}

                {/* Elevation badge */}
                {elevationGainFt !== undefined && elevationGainFt > 0 && (
                  <Badge
                    variant="info"
                    testID={`${testID}-elevation-badge`}
                    style={{ marginLeft: 4 }}
                  >
                    ↗ {elevationGainFt >= 1000 ? `${Math.round(elevationGainFt / 100) / 10}kft` : `${Math.round(elevationGainFt / 100) * 100}ft`}
                  </Badge>
                )}
              </View>
            </View>
          )}
        </View>
      </TouchableOpacity>

    {/* Route directions sheet */}
    {directionsVisible && (
      <RouteDirectionsSheet
        isVisible={directionsVisible}
        onClose={() => setDirectionsVisible(false)}
        routeLabel={route.label}
        legs={route.map.legs}
        destinationLabel={route.label.split(' to ')[1] || route.label.split(' → ')[1] || ''}
        testID={`${testID}-directions`}
        onLegSelect={onLegSelect}
        selectedLegIndex={selectedLegIndex}
      />
    )}
  </View>
)
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignSelf: 'stretch',
  },
  content: {
    gap: 6,
  },
  compactContent: {
    gap: 0,
  },
  fullContent: {
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationLabel: {
    fontWeight: '600',
    fontSize: 14,
  },
  quickStats: {
    flexShrink: 0,
  },
  quickStatText: {
    fontSize: 12,
    fontWeight: '500',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  routeName: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  badgesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 4,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  weatherText: {
    fontSize: 11,
    fontWeight: '600',
  },
  selectedBorder: {
    borderWidth: 1.5,
  },
  defaultBorder: {
    borderWidth: 1,
  },
})
