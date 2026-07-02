/**
 * RouteAttachmentCard - Displays route options in chat
 *
 * REDESIGNED: Full-width layout with proper spacing
 * - Uses full available width
 * - Clear visual hierarchy
 * - No scrunched text
 * - Weather only when it matters
 *
 * Features:
 * - Three-row layout (route info / rationale / stats+badges)
 * - Each row has space to breathe
 * - Tap to view on map, long-press to select
 */

import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionsView } from '../../shared/types/routes'
import { RouteDirectionsSheet } from '../sheets/route-directions-sheet'
import { Badge } from '../ui/badge'
import { IconSymbol } from '../ui/icon-symbol'
import { RouteMiniMap } from './cards/route-mini-map'

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
 * Main component - spacious full-width layout
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
  const { semantic } = useSemanticTheme()
  const [directionsVisible, setDirectionsVisible] = useState(false)

  const duration = route.stats.durationSeconds
  const distance = route.stats.distanceMeters

  // Extract start and end location names from the legs
  const legs = route.map.legs
  const routeLabelFallback = route.label?.trim() || 'Route overview'

  // Helper to format a location label with coordinate fallback
  const formatLocationLabel = (
    label: string | undefined,
    placeId: string | undefined,
    lat: number | undefined,
    lng: number | undefined,
    fallback: string,
  ): string => {
    if (label) return label
    if (placeId) return placeId
    if (typeof lat === 'number' && typeof lng === 'number') {
      return `${lat.toFixed(4)}, ${lng.toFixed(4)}`
    }
    return fallback
  }

  const startLabel = formatLocationLabel(
    legs[0]?.start.label,
    legs[0]?.start.placeId,
    legs[0]?.start.lat,
    legs[0]?.start.lng,
    legs.length === 0 ? 'Curated route' : 'Route start',
  )
  const endLabel = formatLocationLabel(
    legs[legs.length - 1]?.end.label,
    legs[legs.length - 1]?.end.placeId,
    legs[legs.length - 1]?.end.lat,
    legs[legs.length - 1]?.end.lng,
    routeLabelFallback,
  )

  const handlePress = () => {
    if (variant === 'full') {
      onSelect(route.routeOptionId)
      onViewOnMap?.()
    } else {
      setDirectionsVisible(true)
    }
  }

  const handleLongPress = () => {
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
              ? `${semantic.color.primary.default}33`
              : isCompact
                ? `${semantic.color.surface.default}E6`
                : semantic.color.surfaceVariant.default,
            borderColor: isSelected
              ? semantic.color.primary.default
              : `${semantic.color.border.default}66`,
            borderRadius: isCompact ? semantic.radius.sm : semantic.radius.md,
            paddingHorizontal: isCompact ? semantic.space.sm : semantic.space.md,
            paddingVertical: isCompact ? semantic.space.xs : semantic.space.md,
            ...semantic.elevation[isCompact ? 1 : 2],
          },
        ]}
        testID={testID}
        accessible={true}
        accessibilityLabel={`Route from ${startLabel} to ${endLabel}, ${formatDuration(duration)}, ${formatDistance(distance)}`}
        accessibilityHint={
          variant === 'full'
            ? 'Tap to view on map, long press to select route'
            : 'Tap to view directions, long press to select route'
        }
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        {/* Mini-map preview (full variant only, when map data exists) */}
        {!isCompact && route.map?.overviewGeometry?.value && route.map?.bounds && (
          <RouteMiniMap
            overviewGeometry={route.map.overviewGeometry}
            bounds={{
              southwest: {
                lat: route.map.bounds.south,
                lng: route.map.bounds.west,
              },
              northeast: {
                lat: route.map.bounds.north,
                lng: route.map.bounds.east,
              },
            }}
            testID={`${testID}-mini-map`}
          />
        )}

        {/* Spacious layout with room to breathe */}
        <View style={styles.content}>
          {/* Row 1: Start → End (prominent) */}
          <View style={styles.routeHeader}>
            <Text
              style={[
                styles.startLabel,
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
              size={18}
              color={
                isSelected
                  ? semantic.color.primary.default
                  : (semantic.color.onSurface.muted ?? 'transparent')
              }
            />

            <Text
              style={[
                styles.endLabel,
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

          {/* Full variant: show more details */}
          {!isCompact && (
            <>
              {/* Row 2: Route description */}
              <Text
                style={[
                  styles.routeDescription,
                  {
                    color: semantic.color.onSurface.subtle,
                  },
                ]}
                numberOfLines={2}
              >
                {route.label}
              </Text>

              {/* Row 3: Stats and badges */}
              <View style={styles.statsRow}>
                {/* Left: Stats */}
                <View style={styles.statsSection}>
                  <View style={styles.statItem}>
                    <IconSymbol
                      name="map-marker-distance"
                      size={14}
                      color={semantic.color.onSurface.muted ?? 'transparent'}
                    />
                    <Text style={[styles.statText, { color: semantic.color.onSurface.subtle }]}>
                      {formatDistance(distance)}
                    </Text>
                  </View>

                  <View style={styles.statItem}>
                    <IconSymbol
                      name="clock-outline"
                      size={14}
                      color={semantic.color.onSurface.muted ?? 'transparent'}
                    />
                    <Text style={[styles.statText, { color: semantic.color.onSurface.subtle }]}>
                      {formatDuration(duration)}
                    </Text>
                  </View>
                </View>

                {/* Right: Badges */}
                <View style={styles.badgesSection}>
                  {/* Weather warnings only */}
                  {route.overlaysPreview.rainSummary !== 'none' &&
                    route.overlaysPreview.rainSummary !== 'unavailable' && (
                      <View
                        style={[
                          styles.weatherBadge,
                          { backgroundColor: `${semantic.color.danger.default}20` },
                        ]}
                      >
                        <IconSymbol
                          name="weather-rainy"
                          size={12}
                          color={semantic.color.danger.default}
                        />
                        <Text style={[styles.badgeText, { color: semantic.color.danger.default }]}>
                          {route.overlaysPreview.rainSummary}
                        </Text>
                      </View>
                    )}

                  {route.overlaysPreview.windSummary === 'high' && (
                    <View
                      style={[
                        styles.weatherBadge,
                        { backgroundColor: `${semantic.color.warning.default}20` },
                      ]}
                    >
                      <IconSymbol
                        name="weather-windy"
                        size={12}
                        color={semantic.color.warning.default}
                      />
                      <Text style={[styles.badgeText, { color: semantic.color.warning.default }]}>
                        High wind
                      </Text>
                    </View>
                  )}

                  {/* Favorites */}
                  {includeFavorites && (route.favorites?.count ?? 0) > 0 && (
                    <Badge variant="default" testID={`${testID}-favorite-badge`}>
                      <IconSymbol name="heart" size={10} color={semantic.color.onPrimary.default} />
                      <Text style={{ color: semantic.color.onPrimary.default, marginLeft: 2 }}>
                        {route.favorites?.count ?? 0}
                      </Text>
                    </Badge>
                  )}
                </View>
              </View>
            </>
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
          destinationLabel={endLabel}
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
    gap: 8,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  startLabel: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
  },
  endLabel: {
    flex: 1,
    fontWeight: '700',
    fontSize: 16,
  },
  routeDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 13,
    fontWeight: '500',
  },
  badgesSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weatherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
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
