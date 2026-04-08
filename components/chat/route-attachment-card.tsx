/**
 * RouteAttachmentCard - Displays route options in chat
 *
 * Shows route summary cards for each route option.
 * Tapping a card opens the route directions bottom sheet.
 * Long-pressing selects the route and highlights its polyline on the map.
 *
 * Features:
 * - Single-line layout with start/end locations, distance, and duration
 * - Visual selection state
 * - Tap to view directions, long-press to select
 * - Waypoint summary badge with count and detour time
 * - Enrichment status indicator for progressive enhancement
 * - Elevation badge in weather section
 * - Crossfade transition for label updates (fallback → enriched)
 */

import React, { useState } from 'react'
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionsView } from '../../types/routes'
import { RouteDirectionsSheet } from '../sheets/route-directions-sheet'
import { Badge } from '../ui/badge'
/**
 * Waypoint summary data structure
 */
export interface WaypointSummary {
  count: number
  detourTimeSeconds?: number
}

type RouteAttachmentCardProps = {
  route: PlannedRouteOptionsView['options'][0]
  isSelected: boolean
  onSelect: (routeId: string) => void
  testID?: string
  /** Visual variant: 'compact' for map overlay, 'full' for chat transcript */
  variant?: 'compact' | 'full'
  /** Waypoint summary for routes with stops */
  waypointSummary?: WaypointSummary
  /** Elevation gain in feet (for elevation badge) */
  elevationGainFt?: number
}

/**
 * Parse route label to extract start and end locations
 * Handles formats like:
 * - "San Francisco to Santa Cruz"
 * - "SF → SC"
 * - "Highway 280 to Skyline Blvd"
 */
const parseRouteLabel = (label: string): { start: string; end: string } => {
  // Try arrow format first (handle both → and → characters)
  const arrowMatch = label.match(/^(.+?)\s*[→→]\s*(.+)$/)
  if (arrowMatch) {
    return { start: arrowMatch[1].trim(), end: arrowMatch[2].trim() }
  }

  // Try "to" format
  const toMatch = label.match(/^(.+?)\s+to\s+(.+)$/)
  if (toMatch) {
    return { start: toMatch[1].trim(), end: toMatch[2].trim() }
  }

  // Fallback: use entire label as start, empty end
  return { start: label, end: '' }
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
 * Format elevation gain for badge display
 */
const formatElevation = (feet: number): string => {
  if (feet < 1000) {
    return `${Math.round(feet / 100) * 100}ft`
  }
  const kft = Math.round(feet / 100) / 10
  return `${kft.toFixed(1)}kft`
}

/**
 * Format detour time for waypoint badge
 */
const formatDetourTime = (seconds: number): string => {
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) {
    return `+${minutes}m`
  }
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return remainingMins > 0 ? `+${hours}h ${remainingMins}m` : `+${hours}h`
}

/**
 * Main component - minimal one-line design
 */
export const RouteAttachmentCard = ({
  route,
  isSelected,
  onSelect,
  testID = 'route-attachment-card',
  variant = 'compact',
  waypointSummary,
  elevationGainFt,
}: RouteAttachmentCardProps) => {
  const { semantic } = useSemanticTheme()
  const [directionsVisible, setDirectionsVisible] = useState(false)

  const { start, end } = parseRouteLabel(route.label)
  const duration = route.stats.durationSeconds
  const distance = route.stats.distanceMeters

  const handlePress = () => {
    setDirectionsVisible(true)
  }

  const handleLongPress = () => {
    onSelect(route.routeOptionId)
  }

  const isCompact = variant === 'compact'

  return (
    <>
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
                ? semantic.color.surface.default + 'E6' // 90% opacity - more transparent for compact
                : semantic.color.surfaceVariant.default, // Full variant gets surface variant
            borderColor: isSelected
              ? semantic.color.primary.default
              : semantic.color.border.default + '66', // 40% opacity
            borderRadius: isCompact ? semantic.radius.sm : semantic.radius.md,
            paddingHorizontal: isCompact ? semantic.space.sm : semantic.space.md,
            paddingVertical: isCompact ? semantic.space.xs : semantic.space.sm,
            ...semantic.elevation[isCompact ? 1 : 2],
          },
        ]}
        testID={testID}
        accessible={true}
        accessibilityLabel={`Route from ${start} to ${end}, ${formatDuration(
          duration
        )}, ${formatDistance(distance)}`}
        accessibilityHint="Tap to view directions, long press to select route"
        accessibilityRole="button"
        accessibilityState={{ selected: isSelected }}
      >
        <View style={[styles.content, isCompact ? styles.compactContent : styles.fullContent]}>
          {/* Header row with label, waypoint badge, and elevation badge (full variant) */}
          {!isCompact && (
            <View style={styles.headerRow}>
              <Text
                style={[
                  semantic.type.body.md,
                  styles.routeLabel,
                  {
                    color: isSelected
                      ? semantic.color.primary.default
                      : semantic.color.onSurface.default,
                  },
                ]}
                numberOfLines={1}
              >
                {route.label}
              </Text>

              {/* Waypoint summary badge */}
              {waypointSummary && waypointSummary.count > 0 && (
                <View style={styles.headerBadges}>
                  <Badge
                    variant="secondary"
                    testID={`${testID}-waypoint-badge`}
                    style={{ marginLeft: semantic.space.xs }}
                  >
                    {waypointSummary.count} stop{waypointSummary.count !== 1 ? 's' : ''}
                    {waypointSummary.detourTimeSeconds && ` • ${formatDetourTime(waypointSummary.detourTimeSeconds)}`}
                  </Badge>
                </View>
              )}

              {/* Elevation badge */}
              {elevationGainFt !== undefined && elevationGainFt > 0 && (
                <View style={styles.headerBadges}>
                  <Badge
                    variant="info"
                    testID={`${testID}-elevation-badge`}
                    style={{ marginLeft: semantic.space.xs }}
                  >
                    ↗ {formatElevation(elevationGainFt)}
                  </Badge>
                </View>
              )}
            </View>
          )}

          {/* Start and end locations */}
          <View style={styles.routeInfo}>
            {/* Start location */}
            <Text
              style={[
                semantic.type.body.sm,
                styles.locationText,
                {
                  color: isSelected
                    ? semantic.color.primary.default
                    : semantic.color.onSurface.default,
                  maxWidth: isCompact ? 80 : 120,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {start}
            </Text>

            {/* Arrow separator */}
            <Text
              style={[
                semantic.type.label.sm,
                {
                  color: isSelected
                    ? semantic.color.primary.default
                    : semantic.color.onSurface.muted,
                  marginHorizontal: semantic.space.xs,
                },
              ]}
            >
              →
            </Text>

            {/* End location */}
            <Text
              style={[
                semantic.type.body.sm,
                styles.locationText,
                {
                  color: isSelected
                    ? semantic.color.primary.default
                    : semantic.color.onSurface.default,
                  maxWidth: isCompact ? 80 : 120,
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {end}
            </Text>
          </View>

          {/* Stats row */}
          <View style={styles.stats}>
            {/* Distance */}
            <Text
              style={[
                semantic.type.body.sm,
                {
                  color: isSelected
                    ? semantic.color.primary.default
                    : semantic.color.onSurface.default,
                },
              ]}
            >
              {formatDistance(distance)}
            </Text>

            {/* Bullet separator */}
            <Text
              style={[
                semantic.type.label.sm,
                {
                  color: isSelected
                    ? semantic.color.primary.default
                    : semantic.color.onSurface.muted,
                  marginHorizontal: semantic.space.xs,
                },
              ]}
            >
              •
            </Text>

            {/* Duration */}
            <Text
              style={[
                semantic.type.body.sm,
                {
                  color: isSelected
                    ? semantic.color.primary.default
                    : semantic.color.onSurface.default,
                },
              ]}
            >
              {formatDuration(duration)}
            </Text>

            {/* Legs count (full variant only) */}
            {!isCompact && (
              <>
                <Text
                  style={[
                    semantic.type.label.sm,
                    {
                      color: isSelected
                        ? semantic.color.primary.default
                        : semantic.color.onSurface.muted,
                      marginHorizontal: semantic.space.xs,
                    },
                  ]}
                >
                  •
                </Text>
                <Text
                  style={[
                    semantic.type.body.sm,
                    {
                      color: isSelected
                        ? semantic.color.primary.default
                        : semantic.color.onSurface.default,
                    },
                  ]}
                >
                  {route.stats.legsCount} leg{route.stats.legsCount !== 1 ? 's' : ''}
                </Text>
              </>
            )}
          </View>

          {/* Rationale snippet (full variant only) */}
          {!isCompact && route.rationale && (
            <Text
              style={[
                semantic.type.body.sm,
                styles.rationale,
                {
                  color: semantic.color.onSurface.subtle,
                },
              ]}
              numberOfLines={2}
            >
              {route.rationale}
            </Text>
          )}

          {/* Enrichment highlights (full variant only) */}
          {!isCompact && route.enrichment?.highlights && route.enrichment.highlights.length > 0 && (
            <View style={[styles.highlightsContainer, { marginTop: semantic.space.xs }]}>
              {route.enrichment.highlights.slice(0, 3).map((highlight, i) => (
                <Text
                  key={i}
                  style={[
                    semantic.type.body.sm,
                    styles.highlight,
                    { color: semantic.color.onSurface.subtle },
                  ]}
                  numberOfLines={1}
                >
                  • {highlight}
                </Text>
              ))}
            </View>
          )}
        </View>
      </TouchableOpacity>

    {/* Route directions sheet */}
    <RouteDirectionsSheet
      isVisible={directionsVisible}
      onClose={() => setDirectionsVisible(false)}
      routeLabel={route.label}
      legs={route.map.legs}
      destinationLabel={end}
      testID={`${testID}-directions`}
    />
    </>
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
  compactContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
    gap: 0,
  },
  fullContent: {
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  headerBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeLabel: {
    fontWeight: '600',
    flexShrink: 1,
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'nowrap',
  },
  locationText: {
    flexShrink: 1,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  rationale: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  highlightsContainer: {
    gap: 4,
  },
  highlight: {
    fontSize: 12,
    lineHeight: 16,
  },
  selectedBorder: {
    borderWidth: 1.5,
  },
  defaultBorder: {
    borderWidth: 1,
  },
})
