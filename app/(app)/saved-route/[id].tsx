/**
 * Route Detail Screen
 *
 * Full-screen view of a saved route with map, stats, and route highlights.
 * Accessed via navigation from saved routes list.
 *
 * Header uses `SubpageLayout size="compact"` (finite 44pt bar with back button,
 * route name as the title, and rename + delete icon actions on the right).
 * Below the header, the map (top, non-scrolling) and the info ScrollView.
 */

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { Text } from 'react-native-paper'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { MapboxMapView, type MapboxMapViewHandle } from '../../../components/map'
import { OverlayToggle } from '../../../components/map/overlay-toggle'
import { buildRoutePolylines } from '../../../components/map/route-polyline'
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
  curatedRouteId?: string | null
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
  // Use curatedRouteId (public slug) for the redirect, NOT curatedRouteRef (internal _id)
  if (typeof data.curatedRouteId === 'string' && data.curatedRouteId.length > 0) {
    return { kind: 'curated', routeId: data.curatedRouteId }
  }
  return { kind: 'planned' }
}

const SavedRouteDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
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

  // Fit map to route geometry bounds — mirrors the curated-route screen pattern.
  // Without this, the map renders with no center coordinate and falls back to
  // a global/world view instead of framing the route polyline.
  const mapRef = useRef<MapboxMapViewHandle | null>(null)
  useEffect(() => {
    if (polylines.length === 0) return
    const coords = polylines[0].coordinates
    if (coords.length === 0) return
    mapRef.current?.fitToCoordinates(coords)
  }, [polylines])

  if (isLoading) {
    return (
      <SubpageLayout title="Route Detail" size="compact" testID="route-detail-loading">
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={semantic.color.primary.default}
            style={styles.loader}
          />
        </View>
      </SubpageLayout>
    )
  }

  // SAVE-001: curated bookmark — show a loader while the redirect fires.
  // CRITICAL: this branch runs BEFORE the planned path so data.planInput /
  // data.routeSnapshot are never accessed for a curated row.
  if (isCuratedBookmark) {
    return (
      <SubpageLayout title="Route Detail" size="compact" testID="route-detail-curated-redirect">
        <View style={styles.centered}>
          <ActivityIndicator
            size="large"
            color={semantic.color.primary.default}
            style={styles.loader}
          />
        </View>
      </SubpageLayout>
    )
  }

  if (!data) {
    return (
      <SubpageLayout title="Route Detail" size="compact" testID="route-detail-not-found">
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
      </SubpageLayout>
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
    <SubpageLayout
      title={data.name}
      size="compact"
      rightActions={[
        {
          icon: 'pencil',
          onPress: actions.openRenameDialog,
          testID: 'route-detail-rename',
          accessibilityLabel: 'Rename route',
        },
        {
          icon: 'trash-can-outline',
          onPress: actions.openDeleteDialog,
          testID: 'route-detail-delete',
          accessibilityLabel: 'Delete route',
        },
      ]}
      testID="route-detail-screen"
    >
      <View style={styles.root}>
        {/* Map section */}
        <View style={styles.mapSection} accessibilityLabel={`Route map for ${data.name}`}>
          <MapboxMapView ref={mapRef} theme={isDark ? 'dark' : 'light'} polylines={polylines} />
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
    </SubpageLayout>
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
  root: {
    flex: 1,
  },
  mapSection: {
    flex: 0.5,
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
