/**
 * Route Comparison View Screen Component
 *
 * Screen displaying multiple route options for comparison and selection
 * Composes RouteOptionCard atoms and provides actions for viewing details and saving routes
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components
 * - Supports loading state
 */

import { MaterialCommunityIcons } from '@expo/vector-icons'
import { StyleSheet, View, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from 'react-native-paper'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionView } from '../../types/routes'
import { Button } from '../ui/button'
import { SectionHeader } from '../ui/section-header'

export type RouteComparisonViewProps = {
  routes: PlannedRouteOptionView[]
  selectedRouteId: string | null
  onRouteSelect: (routeId: string) => void
  onViewDetails: (routeId: string) => void
  onSave: (routeId: string) => void
  isLoading?: boolean
  testID?: string
}

/**
 * Format distance for display
 */
const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${meters}m`
  }
  return `${(meters / 1000).toFixed(1)}km`
}

/**
 * Format duration for display
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
 * Route comparison view screen for comparing and selecting routes
 * Shows route options with selection state, details button, and save action
 */
export const RouteComparisonView = ({
  routes,
  selectedRouteId,
  onRouteSelect,
  onViewDetails,
  onSave,
  isLoading = false,
  testID,
}: RouteComparisonViewProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  if (isLoading) {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: semantic.color.surface.default }]}
        testID={testID}
      >
        <ActivityIndicator size="large" color={semantic.color.primary.default} />
        <Text
          variant="bodyMedium"
          style={[styles.loadingText, { color: semantic.color.onSurface.subtle }]}
        >
          Loading routes...
        </Text>
      </View>
    )
  }

  if (routes.length === 0) {
    return (
      <View
        style={[styles.container, styles.centered, { backgroundColor: semantic.color.surface.default }]}
        testID={testID}
      >
        <MaterialCommunityIcons
          name="map-marker-off"
          size={48}
          color={semantic.color.onSurface.muted}
        />
        <Text
          variant="titleMedium"
          style={[styles.emptyTitle, { color: semantic.color.onSurface.default }]}
        >
          No Routes Available
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.emptyText, { color: semantic.color.onSurface.subtle }]}
        >
          Try adjusting your search criteria
        </Text>
      </View>
    )
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: semantic.color.surface.default,
          paddingBottom: insets.bottom + semantic.space.lg,
        },
      ]}
      testID={testID}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: semantic.space.lg },
        ]}
        showsVerticalScrollIndicator={false}
        testID={`${testID}-scroll-view`}
      >
        <SectionHeader
          title="Compare Routes"
          subtitle={`${routes.length} option${routes.length > 1 ? 's' : ''} available`}
        />

        <View style={styles.routesList}>
          {routes.map((route) => {
            const isSelected = route.routeOptionId === selectedRouteId

            return (
              <Pressable
                key={route.routeOptionId}
                onPress={() => onRouteSelect(route.routeOptionId)}
                accessibilityRole="button"
                accessibilityLabel={`Select ${route.label} route`}
                accessibilityState={{ selected: isSelected }}
                testID={`${testID}-route-${route.routeOptionId}`}
              >
                <View
                  style={[
                    styles.routeCard,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(184, 115, 51, 0.08)'
                        : '#24272B',
                      borderColor: isSelected ? semantic.color.primary.default : 'transparent',
                      borderWidth: isSelected ? 2 : 0,
                    },
                  ]}
                >
                  {/* Header */}
                  <View style={styles.routeHeader}>
                    <View style={styles.routeTitleRow}>
                      <View
                        style={[
                          styles.routeBadge,
                          {
                            backgroundColor: isSelected
                              ? 'rgba(184, 115, 51, 0.15)'
                              : 'rgba(255, 255, 255, 0.06)',
                          },
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="map-marker-path"
                          size={14}
                          color={isSelected ? '#B87333' : semantic.color.onSurface.muted}
                        />
                        <Text
                          style={[
                            styles.routeBadgeText,
                            { color: isSelected ? '#B87333' : semantic.color.onSurface.muted },
                          ]}
                        >
                          {route.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <MaterialCommunityIcons
                          name="check-circle"
                          size={20}
                          color={semantic.color.primary.default}
                          testID={`${testID}-route-${route.routeOptionId}-selected`}
                        />
                      )}
                    </View>
                  </View>

                  {/* Rationale */}
                  <Text
                    variant="bodyMedium"
                    style={[styles.rationale, { color: semantic.color.onSurface.default }]}
                    numberOfLines={2}
                  >
                    {route.rationale}
                  </Text>

                  {/* Stats */}
                  <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons
                        name="map-marker-distance"
                        size={16}
                        color={semantic.color.onSurface.muted}
                      />
                      <Text
                        variant="bodySmall"
                        style={{ color: semantic.color.onSurface.subtle }}
                      >
                        {formatDistance(route.stats.distanceMeters)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={16}
                        color={semantic.color.onSurface.muted}
                      />
                      <Text
                        variant="bodySmall"
                        style={{ color: semantic.color.onSurface.subtle }}
                      >
                        {formatDuration(route.stats.durationSeconds)}
                      </Text>
                    </View>
                    <View style={styles.statItem}>
                      <MaterialCommunityIcons
                        name="vector-polyline"
                        size={16}
                        color={semantic.color.onSurface.muted}
                      />
                      <Text
                        variant="bodySmall"
                        style={{ color: semantic.color.onSurface.subtle }}
                      >
                        {route.stats.legsCount} legs
                      </Text>
                    </View>
                  </View>

                  {/* Wind indicator */}
                  <View style={styles.windRow}>
                    <MaterialCommunityIcons
                      name="weather-windy"
                      size={14}
                      color={
                        route.overlaysPreview.windSummary === 'low'
                          ? '#22c55e'
                          : route.overlaysPreview.windSummary === 'moderate'
                            ? '#f59e0b'
                            : '#ef4444'
                      }
                    />
                    <Text
                      variant="bodySmall"
                      style={[
                        styles.windText,
                        {
                          color:
                            route.overlaysPreview.windSummary === 'low'
                              ? '#22c55e'
                              : route.overlaysPreview.windSummary === 'moderate'
                                ? '#f59e0b'
                                : '#ef4444',
                        },
                      ]}
                    >
                      {route.overlaysPreview.windSummary.charAt(0).toUpperCase() +
                        route.overlaysPreview.windSummary.slice(1)}{' '}
                      wind
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => onViewDetails(route.routeOptionId)}
                      icon={
                        <MaterialCommunityIcons
                          name="information-outline"
                          size={16}
                          color={semantic.color.onSurface.subtle}
                        />
                      }
                      testID={`${testID}-route-${route.routeOptionId}-details`}
                    >
                      Details
                    </Button>
                    <Button
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => onSave(route.routeOptionId)}
                      disabled={!isSelected}
                      icon={
                        <MaterialCommunityIcons
                          name="content-save"
                          size={16}
                          color={
                            isSelected
                              ? semantic.color.onPrimary.default
                              : semantic.color.onSurface.muted
                          }
                        />
                      }
                      testID={`${testID}-route-${route.routeOptionId}-save`}
                    >
                      Save
                    </Button>
                  </View>
                </View>
              </Pressable>
            )
          })}
        </View>
      </ScrollView>
    </View>
  )
}

RouteComparisonView.displayName = 'RouteComparisonView'

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  loadingText: {
    marginTop: 8,
  },
  emptyTitle: {
    marginTop: 12,
  },
  emptyText: {
    marginTop: 4,
  },
  routesList: {
    gap: 12,
    marginTop: 16,
  },
  routeCard: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  routeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  routeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  routeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rationale: {
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  windRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  windText: {
    textTransform: 'capitalize',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
})
