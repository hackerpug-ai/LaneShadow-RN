/**
 * Route Details Sheet Component
 * Displays detailed information about a selected route option
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components
 * - Supports save functionality with loading state
 */

import { StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import type { PlannedRouteOptionView } from '../../../server/types/routes'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import { WindBadge } from '../planning/wind-badge'
import { Button } from '../ui/button'
import { IconSymbol } from '../ui/icon-symbol'
import { StatRow } from '../ui/stat-row'
import { BottomSheetWrapper } from './bottom-sheet-wrapper'

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

export type RouteDetailsSheetProps = {
  isVisible: boolean
  onClose: () => void
  route: PlannedRouteOptionView | null
  onSave?: () => void
  isSaving?: boolean
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
 * Route details sheet component that displays detailed route information
 */
export const RouteDetailsSheet = ({
  isVisible,
  onClose,
  route,
  onSave,
  isSaving = false,
  testID,
}: RouteDetailsSheetProps) => {
  const { semantic } = useSemanticTheme()

  if (!route) {
    return null
  }

  return (
    <BottomSheetWrapper isVisible={isVisible} onClose={onClose} preset="half" testID={testID}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text variant="titleLarge" style={{ color: semantic.color.onSurface.default }}>
            Route Details
          </Text>
          <View
            style={[
              styles.badge,
              { backgroundColor: `${semantic.color.primary.default}1F` }, // Add 12% alpha
            ]}
          >
            <IconSymbol name="routes" size={14} color={semantic.color.primary.default} />
            <Text style={[styles.badgeText, { color: semantic.color.primary.default }]}>
              {route.label}
            </Text>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          testID={`${testID}-scroll-view`}
        >
          {/* Rationale Section */}
          <View style={styles.section}>
            <Text
              variant="labelMedium"
              style={[styles.sectionLabel, { color: semantic.color.onSurface.subtle }]}
            >
              About this route
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.rationale, { color: semantic.color.onSurface.default }]}
            >
              {route.rationale}
            </Text>
          </View>

          {/* Stats Section */}
          <View style={styles.section}>
            <Text
              variant="labelMedium"
              style={[styles.sectionLabel, { color: semantic.color.onSurface.subtle }]}
            >
              Route Statistics
            </Text>
            <View
              style={[
                styles.statsCard,
                { backgroundColor: addOpacity(semantic.color.surface.default, 0.8) },
              ]}
            >
              <StatRow
                icon="map-marker-distance"
                value={formatDistance(route.stats.distanceMeters)}
                testID={`${testID}-stat-distance`}
              />
              <StatRow
                icon="clock-outline"
                value={formatDuration(route.stats.durationSeconds)}
                testID={`${testID}-stat-duration`}
              />
              <StatRow
                icon="vector-polyline"
                value={`${route.stats.legsCount} legs`}
                testID={`${testID}-stat-legs`}
              />
            </View>
          </View>

          {/* Conditions Section */}
          <View style={styles.section}>
            <Text
              variant="labelMedium"
              style={[styles.sectionLabel, { color: semantic.color.onSurface.subtle }]}
            >
              Conditions
            </Text>
            <View
              style={[
                styles.conditionsCard,
                { backgroundColor: addOpacity(semantic.color.surface.default, 0.8) },
              ]}
            >
              <View style={styles.conditionRow}>
                <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
                  Wind
                </Text>
                <WindBadge
                  windLevel={route.overlaysPreview.windSummary}
                  testID={`${testID}-wind-badge`}
                />
              </View>
              <View style={styles.conditionRow}>
                <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.default }}>
                  Status
                </Text>
                <View style={styles.statusRow}>
                  <IconSymbol
                    name={
                      route.overlaysPreview.conditionsStatus === 'ok'
                        ? 'check-circle'
                        : 'alert-circle'
                    }
                    size={16}
                    color={
                      route.overlaysPreview.conditionsStatus === 'ok'
                        ? semantic.color.success.default
                        : semantic.color.warning.default
                    }
                  />
                  <Text
                    variant="bodySmall"
                    style={{
                      color:
                        route.overlaysPreview.conditionsStatus === 'ok'
                          ? semantic.color.success.default
                          : semantic.color.warning.default,
                    }}
                  >
                    {route.overlaysPreview.conditionsStatus === 'ok'
                      ? 'Good conditions'
                      : 'Data unavailable'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Actions */}
        {onSave && (
          <View style={styles.actions}>
            <Button
              variant="default"
              size="lg"
              onPress={onSave}
              disabled={isSaving}
              testID={`${testID}-save-button`}
              icon={
                <IconSymbol
                  name="content-save"
                  size={20}
                  color={semantic.color.onPrimary.default}
                />
              }
            >
              {isSaving ? 'Saving...' : 'Save Route'}
            </Button>
          </View>
        )}
      </View>
    </BottomSheetWrapper>
  )
}

RouteDetailsSheet.displayName = 'RouteDetailsSheet'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rationale: {
    lineHeight: 22,
  },
  statsCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  conditionsCard: {
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  conditionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actions: {
    paddingTop: 8,
  },
})
