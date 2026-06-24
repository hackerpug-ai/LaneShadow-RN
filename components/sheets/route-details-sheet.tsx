/**
 * Route Details Sheet Component
 * Displays detailed information about a selected route option
 *
 * Follows project standards:
 * - Uses semantic theme tokens
 * - Uses existing UI components
 * - Supports save functionality with loading state
 * - Multi-stop snap points with pinned action footer (RUX-005)
 */

import { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useSemanticTheme } from '../../hooks/use-semantic-theme'
import type { PlannedRouteOptionView } from '../../shared/types/routes'
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
  onRide?: () => void
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
 *
 * RUX-005: Uses multi-stop snap points (60%→90%) with pinned footer to ensure
 * action buttons are always reachable. Footer is positioned above safe area insets
 * to prevent clipping on notched devices.
 */
export const RouteDetailsSheet = ({
  isVisible,
  onClose,
  route,
  onSave,
  onRide,
  isSaving = false,
  testID,
}: RouteDetailsSheetProps) => {
  const { semantic } = useSemanticTheme()
  const insets = useSafeAreaInsets()

  if (!route) {
    return null
  }

  return (
    <BottomSheetWrapper
      isVisible={isVisible}
      onClose={onClose}
      snapPoints={['60%', '90%']}
      testID={testID}
      wrapChildren={false}
      showHandle={true}
      footer={
        onSave || onRide ? (
          <View
            testID="route-details-sheet-footer"
            style={[
              styles.footer,
              {
                paddingHorizontal: semantic.space.lg,
                paddingTop: semantic.space.md,
                paddingBottom: semantic.space.lg + insets.bottom,
                borderTopColor: `${semantic.color.border.default}33`,
                backgroundColor: semantic.color.surface.default,
              },
            ]}
          >
            <View style={styles.footerButtons}>
              {onSave && (
                <Button
                  variant="secondary"
                  size="lg"
                  onPress={onSave}
                  disabled={isSaving}
                  testID="route-details-sheet-save-button"
                  style={styles.footerButton}
                  icon={
                    <IconSymbol
                      name="content-save"
                      size={20}
                      color={semantic.color.onSecondary.default}
                    />
                  }
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </Button>
              )}
              {onRide && (
                <Button
                  variant="default"
                  size="lg"
                  onPress={onRide}
                  testID="route-details-sheet-ride-button"
                  style={styles.footerButton}
                  icon={
                    <IconSymbol
                      name="navigation"
                      size={20}
                      color={semantic.color.onPrimary.default}
                    />
                  }
                >
                  Ride It
                </Button>
              )}
            </View>
          </View>
        ) : null
      }
    >
      <View style={styles.container}>
        {/* Fixed header */}
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: semantic.space.lg,
              paddingTop: semantic.space.md,
              paddingBottom: semantic.space.sm,
              borderBottomColor: `${semantic.color.border.default}33`,
            },
          ]}
        >
          <View style={styles.headerRow}>
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
        </View>

        {/* Scrollable content */}
        <View style={styles.scrollWrapper}>
          <BottomSheetScrollView
            contentContainerStyle={[styles.scrollContent, { paddingHorizontal: semantic.space.lg }]}
            showsVerticalScrollIndicator={true}
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
          </BottomSheetScrollView>
        </View>
      </View>
    </BottomSheetWrapper>
  )
}

RouteDetailsSheet.displayName = 'RouteDetailsSheet'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'column',
  },
  header: {
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
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
  scrollWrapper: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12, // Matches semantic.space.md; StyleSheet cannot reference hook values
    paddingBottom: 120, // Clears pinned footer + safe-area; dynamic value applied at runtime
  },
  section: {
    marginBottom: 20, // Matches semantic.space.lg + semantic.space.sm; structural spacing
  },
  sectionLabel: {
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
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
  footer: {
    borderTopWidth: 1,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8, // Matches semantic.space.sm; structural gap between action buttons
  },
  footerButton: {
    flex: 1,
  },
})
