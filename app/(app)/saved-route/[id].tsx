/**
 * Route Detail Screen
 *
 * Full-screen view of a saved route with map, stats, and route highlights.
 * Accessed via navigation from saved routes list.
 */

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { MapboxMapView } from '../../../components/map'
import { MapHeaderOverlay } from '../../../components/map/map-header-overlay'
import { OverlayToggle } from '../../../components/map/overlay-toggle'
import { buildRoutePolylines } from '../../../components/map/route-polyline'
import { Button } from '../../../components/ui/button'
import { DeleteRouteDialog } from '../../../components/ui/delete-route-dialog'
import { IconSymbol } from '../../../components/ui/icon-symbol'
import { RenameRouteDialog } from '../../../components/ui/rename-route-dialog'
import { RouteLegTimeline } from '../../../components/ui/route-leg-timeline'
import { StatRow } from '../../../components/ui/stat-row'
import { useThemePreference } from '../../../contexts/theme-preference'
import { useSavedRouteDetail } from '../../../hooks/use-saved-routes'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import type { RouteOverlays } from '../../../shared/models/saved-routes'
import { formatDistance, formatDuration, formatSavedDate } from '../saved-route.utils/utils'
import { useRouteActions } from './use-route-actions'

const Z_INDEX_HEADER_ACTIONS = 30

// ---------------------------------------------------------------------------
// SAVE-001: reopen-path discriminator
// ---------------------------------------------------------------------------
// A saved_routes row is EITHER a planned save (planInput + routeSnapshot +
// routeIndex) OR a curated bookmark (curatedRouteRef). The planned detail
// below reads data.routeSnapshot.legs / data.planInput — accessing those on a
// curated row would throw. This helper lets the screen branch BEFORE touching
// any planned-only field: a curated row redirects to the curated detail screen
// (which dereferences via getCuratedRouteDetail), avoiding the legs/PlanInput
// error entirely.
//
// `curatedRouteRef` is optional on the detail view today (the DATA-003 planned
// read-path returns null for curated rows); the narrow cast below is forward-
// compatible with the curated read-path extension.
type SavedRouteDetailMaybeCurated = {
  curatedRouteRef?: string
  planInput?: unknown
}

export type SavedRouteReopenTarget =
  | { kind: 'curated'; routeId: string }
  | { kind: 'planned' }
  | { kind: 'none' }

export const getSavedRouteReopenTarget = (
  data: SavedRouteDetailMaybeCurated | null | undefined,
): SavedRouteReopenTarget => {
  if (!data) return { kind: 'none' }
  if (typeof data.curatedRouteRef === 'string' && data.curatedRouteRef.length > 0) {
    return { kind: 'curated', routeId: data.curatedRouteRef }
  }
  return { kind: 'planned' }
}

const SavedRouteDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useSavedRouteDetail(id ?? null)
  const [selectedOverlay, setSelectedOverlay] = useState<'wind' | 'rain' | 'temperature' | ''>('')

  const actions = useRouteActions(id ?? null)

  // SAVE-001: reopen path — a curated bookmark (curatedRouteRef present) must
  // NOT enter the planned path below (it reads data.routeSnapshot.legs /
  // data.planInput, which are absent for curated rows). Redirect to the
  // curated detail screen, which dereferences via getCuratedRouteDetail.
  const reopenTarget = getSavedRouteReopenTarget(data as SavedRouteDetailMaybeCurated | null)
  const isCuratedBookmark = reopenTarget.kind === 'curated'
  useEffect(() => {
    if (reopenTarget.kind === 'curated') {
      router.replace(`/(app)/curated-route/${reopenTarget.routeId}`)
    }
  }, [reopenTarget, router])

  const polylines = useMemo(() => {
    // Guard: do NOT touch data.routeSnapshot for a curated row (absent → throw).
    if (!data || isCuratedBookmark) return []
    return buildRoutePolylines({
      route: {
        overviewGeometry: data.routeSnapshot.overviewGeometry,
        legs: data.routeSnapshot.legs,
        overlays: data.routeSnapshot.overlays,
      },
      variant: 'selected',
      showLegs: true,
      showWindOverlay: selectedOverlay === 'wind',
      showRainOverlay: selectedOverlay === 'rain',
      showTemperatureOverlay: selectedOverlay === 'temperature',
      semantic,
    })
  }, [data, isCuratedBookmark, semantic, selectedOverlay])

  if (isLoading) {
    return (
      <SafeAreaView
        testID="route-detail-loading"
        style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      >
        <ActivityIndicator
          size="large"
          color={semantic.color.primary.default}
          style={styles.loader}
        />
      </SafeAreaView>
    )
  }

  // SAVE-001: curated bookmark — show a loader while the redirect fires.
  // CRITICAL: this branch runs BEFORE the planned path so data.planInput /
  // data.routeSnapshot are never accessed for a curated row.
  if (isCuratedBookmark) {
    return (
      <SafeAreaView
        testID="route-detail-curated-redirect"
        style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      >
        <ActivityIndicator
          size="large"
          color={semantic.color.primary.default}
          style={styles.loader}
        />
      </SafeAreaView>
    )
  }

  if (!data) {
    return (
      <SafeAreaView
        testID="route-detail-not-found"
        style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      >
        <MapHeaderOverlay
          title="Route Detail"
          leftAction={{
            icon: 'arrow-left',
            onPress: () => router.back(),
            testID: 'route-detail-back',
          }}
          testID="route-detail-header"
        />
        <View style={styles.centered}>
          <IconSymbol
            name="map-marker-question"
            size={48}
            color={semantic.color.onSurface.subtle ?? ''}
          />
          <Text
            variant="bodyLarge"
            style={[
              styles.notFoundText,
              {
                color: semantic.color.onSurface.default,
                marginTop: semantic.space.md,
                marginBottom: semantic.space.xs,
              },
            ]}
            testID="route-not-found-message"
          >
            Route not found
          </Text>
          <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.subtle }}>
            This route may have been deleted.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const overlays: RouteOverlays = data.routeSnapshot.overlays
  const overlayAvailability = {
    wind: Boolean(overlays.wind),
    rain: Boolean(overlays.rain),
    temperature: Boolean(overlays.temperature),
  }
  const totalDistance = data.routeSnapshot.legs.reduce((s, l) => s + l.distanceMeters, 0)
  const totalDuration = data.routeSnapshot.legs.reduce((s, l) => s + l.durationSeconds, 0)
  const legsCount = data.routeSnapshot.legs.length
  const annotations = data.routeSnapshot.annotations
  const routeProvenance = data.routeProvenance

  return (
    <SafeAreaView
      testID="route-detail-screen"
      style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      edges={['top']}
    >
      <View style={styles.root}>
        {/* Map section */}
        <View style={styles.mapSection} accessibilityLabel={`Route map for ${data.name}`}>
          <MapboxMapView theme={isDark ? 'dark' : 'light'} polylines={polylines} />
          {overlayAvailability.wind ||
          overlayAvailability.rain ||
          overlayAvailability.temperature ? (
            <OverlayToggle
              testID="overlay-toggle"
              value={selectedOverlay}
              availability={overlayAvailability}
              onValueChange={setSelectedOverlay}
            />
          ) : null}
          <MapHeaderOverlay
            title={data.name}
            leftAction={{
              icon: 'arrow-left',
              onPress: () => router.back(),
              testID: 'route-detail-back',
            }}
            testID="route-detail-header"
          />
          {/* Action buttons - absolutely positioned at top-right of map */}
          <View
            style={[
              styles.headerActions,
              {
                top: insets.top,
                right: semantic.space.lg,
                gap: semantic.space.xs,
              },
            ]}
          >
            <Button
              icon="pencil"
              size="icon"
              variant="glass"
              onPress={actions.openRenameDialog}
              testID="route-detail-rename"
              accessibilityLabel="Rename route"
            />
            <Button
              icon="trash-can-outline"
              size="icon"
              variant="glass"
              onPress={actions.openDeleteDialog}
              testID="route-detail-delete"
              accessibilityLabel="Delete route"
            />
          </View>
        </View>

        {/* Info section */}
        <ScrollView
          style={styles.infoSection}
          contentContainerStyle={{
            paddingHorizontal: semantic.space.lg,
            paddingTop: semantic.space.md,
            paddingBottom: semantic.space.xl,
          }}
          showsVerticalScrollIndicator={false}
          testID="route-detail-scroll"
        >
          {/* Saved date caption */}
          <Text
            variant="bodySmall"
            style={{ color: semantic.color.onSurface.subtle, marginBottom: semantic.space.md }}
            testID="route-detail-saved-date"
          >
            Saved {formatSavedDate(data.snapshotMeta.savedAt)}
          </Text>

          {/* Stats section */}
          <SectionHeader label="Statistics" semantic={semantic} />
          <View
            style={[
              styles.statsCard,
              {
                backgroundColor: semantic.color.surfaceVariant.default,
                borderRadius: semantic.radius.lg,
                padding: semantic.space.lg,
                gap: semantic.space.md,
              },
            ]}
          >
            <StatRow icon="map-marker-distance" value={formatDistance(totalDistance)} />
            <StatRow icon="clock-outline" value={formatDuration(totalDuration)} />
            <StatRow icon="vector-polyline" value={`${legsCount} segments`} />
          </View>

          {routeProvenance &&
            (routeProvenance.sourceLabel ||
              routeProvenance.designation ||
              routeProvenance.description) && (
              <>
                <SectionHeader label="Route Source" semantic={semantic} />
                <View
                  style={[
                    styles.statsCard,
                    {
                      backgroundColor: semantic.color.surfaceVariant.default,
                      borderRadius: semantic.radius.lg,
                      padding: semantic.space.lg,
                      gap: semantic.space.sm,
                    },
                  ]}
                  testID="route-detail-provenance"
                >
                  {routeProvenance.sourceLabel ? (
                    <Text
                      variant="titleMedium"
                      style={{ color: semantic.color.onSurface.default }}
                      testID="route-detail-provenance-source-label"
                    >
                      {routeProvenance.sourceLabel}
                    </Text>
                  ) : null}
                  {routeProvenance.designation ? (
                    <Text
                      variant="bodyMedium"
                      style={{ color: semantic.color.onSurface.default }}
                      testID="route-detail-provenance-designation"
                    >
                      {routeProvenance.designation}
                    </Text>
                  ) : null}
                  {routeProvenance.description ? (
                    <Text
                      variant="bodyMedium"
                      style={{ color: semantic.color.onSurface.subtle }}
                      testID="route-detail-provenance-description"
                    >
                      {routeProvenance.description}
                    </Text>
                  ) : null}
                </View>
              </>
            )}

          {/* Highlights section */}
          {annotations.length > 0 && (
            <>
              <SectionHeader label="Highlights" semantic={semantic} />
              <View style={{ gap: semantic.space.xs }}>
                {annotations.map((a) => (
                  <View key={a.id} style={[styles.bulletRow, { gap: semantic.space.sm }]}>
                    <Text variant="bodyMedium" style={{ color: semantic.color.onSurface.subtle }}>
                      {'\u2022'}
                    </Text>
                    <Text
                      variant="bodyMedium"
                      style={[styles.bulletText, { color: semantic.color.onSurface.default }]}
                    >
                      {a.label}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Route Segments timeline section */}
          {data.routeSnapshot.legs.length > 0 && (
            <>
              <SectionHeader label="Route Segments" semantic={semantic} />
              <RouteLegTimeline
                legs={data.routeSnapshot.legs}
                planInput={data.planInput}
                overlays={overlays}
                testID="route-leg-timeline"
              />
            </>
          )}
        </ScrollView>
      </View>

      {/* Rename dialog */}
      <RenameRouteDialog
        visible={actions.renameDialogVisible}
        currentName={data.name}
        onRename={actions.handleRename}
        onDismiss={actions.closeRenameDialog}
        testID="route-detail-rename-dialog"
      />

      {/* Delete confirmation dialog */}
      <DeleteRouteDialog
        visible={actions.deleteDialogVisible}
        routeName={data.name}
        onConfirm={actions.handleDeleteConfirm}
        onDismiss={actions.closeDeleteDialog}
        testID="route-detail-delete-dialog"
      />
    </SafeAreaView>
  )
}

export default SavedRouteDetailScreen

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

type SectionHeaderProps = {
  label: string
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

const SectionHeader = ({ label, semantic }: SectionHeaderProps) => (
  <Text
    variant="labelMedium"
    style={{
      color: semantic.color.onSurface.subtle,
      textTransform: 'uppercase',
      marginTop: semantic.space.lg,
      marginBottom: semantic.space.sm,
    }}
  >
    {label}
  </Text>
)

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  root: {
    flex: 1,
  },
  mapSection: {
    flex: 0.5,
  },
  headerActions: {
    position: 'absolute',
    top: 0,
    flexDirection: 'row',
    zIndex: Z_INDEX_HEADER_ACTIONS,
  },
  infoSection: {
    flex: 0.5,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {},
  statsCard: {},
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletText: {
    flex: 1,
  },
})
