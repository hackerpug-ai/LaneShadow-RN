/**
 * Curated Route Detail Screen (DESIGN-002 — six-section lean body).
 *
 * Full-screen view of a single curated route. Six sections top→bottom:
 *   1. header      — name (title.lg) + archetype Badge (variant=secondary)
 *   2. summary     — body.md content.secondary, or italic "No description yet"
 *   3. scores      — DESIGN-001 ScoreDimensionBarSection (composite + 5 bars)
 *   4. map         — ~40% top, non-scrolling (polyline-guarded; DESIGN-003 owns degradation)
 *   5. conditions  — basic weather via getCurrentWeather action on centroid;
 *                    per-section "conditions unavailable" on failure (NEVER a
 *                    screen-level error — isolated try/catch state)
 *   6. actions     — Save + Ride It buttons (RENDERED here; WIRED by DESIGN-004)
 *
 * Layout mirrors `app/(app)/saved-route/[id].tsx`: top ~40% map (non-scrolling
 * flex sibling) + bottom ~60% ScrollView body. The actions row is INSIDE the
 * ScrollView so it scrolls with the body on long pages (NOT pinned/absolute).
 *
 * Reached by tapping a curated-route chat card OR its map pin on the plan
 * view (both `router.push('/(app)/curated-route/{id}')` via the shared
 * `goToCuratedRoute(id)` helper on the plan tab).
 *
 * Backward-compat testIDs preserved from DTL-001 (consumed by the DTL-001
 * maestro flow + fallback test):
 *   - `curated-route-detail-name`     — the name Text (leaf inside header section)
 *   - `curated-route-detail-polyline` — polyline-presence probe (inside map section)
 *   - `curated-route-detail-fallback` — null/error fallback node (unchanged)
 *   - `curated-route-detail-loading`  — loading skeleton (unchanged)
 * The six section ROOT Views carry the canonical `curated-detail-*` testIDs.
 */

import { useAction } from 'convex/react'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorBoundary } from '../../../components/logging/error-boundary'
import {
  MapboxMapView,
  type MapboxMapViewHandle,
  type MapboxPolyline,
} from '../../../components/map'
import { MapHeaderOverlay } from '../../../components/map/map-header-overlay'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import {
  type ScoreDimension,
  ScoreDimensionBarSection,
} from '../../../components/ui/score-dimension-bar'
import { useThemePreference } from '../../../contexts/theme-preference'
import { api } from '../../../convex/_generated/api'
import {
  type CuratedRouteDetail,
  useCuratedRouteDetail,
} from '../../../hooks/use-curated-route-detail'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { decodePolylineGeometry } from '../../../shared/lib/polyline'

// ─── Weather action result shape (mirrors convex/actions/weather.ts returns) ─

type WeatherResult = {
  tempF: number
  condition: string
  severity: string
  dayOfWeek: string
}

// ─── Score-dimension catalog (fixed order; null scores filtered by the section) ─

type ScoredDetail = Pick<
  CuratedRouteDetail,
  'curvatureScore' | 'scenicScore' | 'technicalScore' | 'trafficScore' | 'remotenessScore'
>

const buildScoreDimensions = (detail: ScoredDetail): ScoreDimension[] => [
  { key: 'curvature', label: 'Curvature', score: detail.curvatureScore },
  { key: 'scenic', label: 'Scenic', score: detail.scenicScore },
  { key: 'technical', label: 'Technical', score: detail.technicalScore },
  { key: 'traffic', label: 'Traffic', score: detail.trafficScore },
  { key: 'remoteness', label: 'Remoteness', score: detail.remotenessScore },
]

// ─── Pure presentational helpers ─────────────────────────────────────────────

/** Title-case a UiArchetype slug ('scenic' → 'Scenic') for the Badge label. */
const titleCaseArchetype = (archetype: string): string =>
  archetype.length === 0 ? archetype : archetype.charAt(0).toUpperCase() + archetype.slice(1)

/** A summary is "present" only when it's a non-blank string. */
const hasSummary = (summary: string | null | undefined): boolean =>
  Boolean(summary && summary.trim().length > 0)

// ─── Body (the six sections) ─────────────────────────────────────────────────

const PolylineGuardedBody = ({ id }: { id: string }) => {
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
  const { detail, isLoading } = useCuratedRouteDetail(id)

  // Per-section weather: useAction returns a stable action caller; the
  // effect fires on the centroid (never on the whole screen). Failure is
  // captured in `weatherError` and surfaces ONLY in the conditions section —
  // it NEVER unmounts the screen or blocks the other five sections.
  const getCurrentWeather = useAction(api.actions.weather.getCurrentWeather)
  const [weather, setWeather] = useState<WeatherResult | null>(null)
  const [weatherError, setWeatherError] = useState(false)

  useEffect(() => {
    // No detail yet → nothing to fetch. (Hooks stay unconditional above; this
    // guard is inside the effect body so hook call order is stable.)
    if (!detail) return
    let cancelled = false
    setWeatherError(false)
    setWeather(null)
    getCurrentWeather({ lat: detail.centroidLat, lng: detail.centroidLng })
      .then((result) => {
        if (!cancelled) setWeather(result as WeatherResult)
      })
      .catch(() => {
        if (!cancelled) setWeatherError(true)
      })
    return () => {
      cancelled = true
    }
  }, [detail, getCurrentWeather])

  // ─── DESIGN-003 geometry state (polyline / centroid+badge / null-safe) ─────
  //
  // Three branches keyed off the loaded detail:
  //   1. routePolyline present (~55%) → render polyline, camera fits bounds,
  //      NO approximate badge, NO centroid marker.
  //   2. routePolyline null + centroid present (~45%) → ONE centroid marker +
  //      'Approximate location' outline badge centered below the map + camera
  //      zoom 11 centered on the centroid.
  //   3. Both null → graceful (no crash, map stays at default, no badge).
  //
  // `hasPolyline` is the single discriminator for the polyline branch (state 1).
  const hasPolyline = Boolean(detail?.routePolyline)

  // Centroid coordinates are valid only when BOTH lat + lng are finite numbers.
  // Guards state 3 (null centroid) against an uncaught TypeError when building
  // the camera center tuple [lng, lat] (Mapbox format).
  const centroid =
    detail && Number.isFinite(detail.centroidLat) && Number.isFinite(detail.centroidLng)
      ? { latitude: detail.centroidLat, longitude: detail.centroidLng }
      : null

  // State 2 discriminator: no polyline + a usable centroid.
  const showApproximateBadge = !hasPolyline && centroid !== null

  const polylines: MapboxPolyline[] = useMemo(() => {
    if (!detail?.routePolyline) return []
    return [
      {
        id: `curated-${detail.routeId}`,
        coordinates: decodePolylineGeometry(detail.routePolyline),
        // copper-500 is the brand primary in the active palette; using the
        // semantic token keeps the stroke theme-aware (dark/light) instead
        // of hardcoding the hex per the design enrichment.
        strokeColor: semantic.color.primary.default,
        strokeWidth: 4,
      },
    ]
  }, [detail, semantic.color.primary.default])

  // Centroid marker — ONE pin in state 2 only (state 1 fits the polyline bounds
  // and the polyline carries the geometry; state 3 has nothing to show).
  const centroidMarkers = useMemo(() => {
    if (hasPolyline || !centroid || !detail) return []
    return [
      {
        id: `curated-centroid-${detail.routeId}`,
        coordinates: centroid,
      },
    ]
  }, [hasPolyline, centroid, detail])

  // Camera for state 2: zoom 11 centered on the centroid (no padding). State 1
  // fits the polyline bounds via the imperative ref effect below.
  const centroidCamera = useMemo(() => {
    if (hasPolyline || !centroid) return undefined
    return {
      center: [centroid.longitude, centroid.latitude] as [number, number],
      zoom: 11,
      pitch: 0,
      heading: 0,
    }
  }, [hasPolyline, centroid])

  // Imperative fit-bounds for state 1: when a polyline resolves, call the
  // map's fitToCoordinates once. (Default fitToCoordinates padding matches the
  // existing wrapper's; the camera prop is left undefined so the imperative
  // call is the source of truth.) Phase 3.5 verifies the fit on-device.
  const mapRef = useRef<MapboxMapViewHandle | null>(null)
  useEffect(() => {
    if (!hasPolyline || polylines.length === 0) return
    const coords = polylines[0].coordinates
    if (coords.length === 0) return
    mapRef.current?.fitToCoordinates(coords)
  }, [hasPolyline, polylines])

  // Loading → shared skeleton.
  if (isLoading) {
    return (
      <View
        testID="curated-route-detail-loading"
        style={[styles.centered, { backgroundColor: semantic.color.background.default }]}
      >
        <ActivityIndicator
          size="large"
          color={semantic.color.primary.default}
          style={styles.loader}
        />
      </View>
    )
  }

  // Null/absent row → graceful fallback (replaces the whole body).
  if (!detail) {
    return <CuratedRouteFallback semantic={semantic} />
  }

  const sectionGap = { gap: semantic.space.xl }

  return (
    <View style={styles.bodyRoot}>
      {/* ─── MAP section (~40% top, non-scrolling) ─────────────────────────── */}
      <View
        testID="curated-detail-map"
        style={[styles.mapSection, { backgroundColor: semantic.color.background.default }]}
        accessibilityLabel={`Route map for ${detail.name}`}
      >
        <MapboxMapView
          ref={mapRef}
          theme={isDark ? 'dark' : 'light'}
          polylines={polylines}
          markers={centroidMarkers}
          camera={centroidCamera}
        />
        {/* Polyline-presence marker so AC-1's "polyline layer rendered" can be
            asserted independently of the native map children. Rendered ONLY in
            state 1 (polyline present) — never in state 2/3. */}
        {hasPolyline ? (
          <View testID="curated-route-detail-polyline" style={styles.polylineProbe} />
        ) : null}
        {/* DESIGN-003 state 2: 'Approximate location' outline badge, centered
            BELOW the map. Mutually exclusive with the polyline branch — nulls
            the moment a real polyline resolves (no fade). The Badge atom
            applies the exact design-enrichment tokens (borderWidth 1, border
            semantic.color.border.default, text semantic.color.onSurface.default,
            radius semantic.radius.full, type.label.sm). */}
        {showApproximateBadge ? (
          <View
            testID="curated-detail-approximate-badge-wrap"
            style={[styles.approximateBadgeWrap, { bottom: semantic.space.sm }]}
            pointerEvents="none"
          >
            <Badge variant="outline" testID="curated-detail-approximate-badge">
              Approximate location
            </Badge>
          </View>
        ) : null}
      </View>

      {/* ─── BODY (~60%, scrollable) ──────────────────────────────────────── */}
      <ScrollView
        testID="curated-detail-scroll"
        style={styles.bodyScroll}
        contentContainerStyle={{
          paddingHorizontal: semantic.space.lg,
          paddingTop: semantic.space.lg,
          paddingBottom: semantic.space.xl,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={sectionGap}>
          {/* 1. Header — name + archetype Badge */}
          <View
            testID="curated-detail-header"
            style={[styles.headerRow, { gap: semantic.space.sm }]}
          >
            <Text
              testID="curated-route-detail-name"
              style={[
                semantic.type.title.lg,
                styles.headerName,
                { color: semantic.color.onSurface.default },
              ]}
            >
              {detail.name}
            </Text>
            <Badge variant="secondary" testID="curated-detail-archetype">
              {titleCaseArchetype(detail.primaryArchetype)}
            </Badge>
          </View>

          {/* 2. Summary — body.md content.secondary, or italic "No description yet" */}
          <View testID="curated-detail-summary">
            {hasSummary(detail.summary) ? (
              <Text style={[semantic.type.body.md, { color: semantic.color.onSurface.subtle }]}>
                {detail.summary}
              </Text>
            ) : (
              <Text
                testID="curated-detail-summary-empty"
                style={[
                  semantic.type.body.md,
                  { color: semantic.color.onSurface.subtle, fontStyle: 'italic' },
                ]}
              >
                No description yet
              </Text>
            )}
          </View>

          {/* 3. Scores — compose DESIGN-001's ScoreDimensionBarSection */}
          <View testID="curated-detail-scores">
            <ScoreDimensionBarSection
              compositeScore={detail.compositeScore}
              dimensions={buildScoreDimensions(detail)}
            />
          </View>

          {/* 4. Conditions — per-section weather (isolated error, never screen-level) */}
          <View testID="curated-detail-conditions">
            {weatherError ? (
              <Text
                style={[
                  semantic.type.body.md,
                  { color: semantic.color.onSurface.subtle, fontStyle: 'italic' },
                ]}
              >
                conditions unavailable
              </Text>
            ) : weather ? (
              <View style={[styles.conditionsRow, { gap: semantic.space.md }]}>
                <Text style={[semantic.type.body.md, { color: semantic.color.onSurface.default }]}>
                  {weather.tempF}°F
                </Text>
                <Text style={[semantic.type.body.md, { color: semantic.color.onSurface.subtle }]}>
                  {weather.condition}
                </Text>
              </View>
            ) : (
              <ActivityIndicator color={semantic.color.primary.default} />
            )}
          </View>

          {/* 5. Actions — Save + Ride It (RENDERED here, WIRED by DESIGN-004) */}
          <View
            testID="curated-detail-actions"
            style={[styles.actionsRow, { gap: semantic.space.md }]}
          >
            <Button
              variant="outline"
              onPress={() => {}}
              testID="curated-detail-save"
              style={styles.actionButton}
            >
              Save
            </Button>
            <Button
              variant="default"
              onPress={() => {}}
              testID="curated-detail-ride"
              style={styles.actionButton}
            >
              Ride It
            </Button>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

type FallbackProps = {
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

/**
 * "Route not found" fallback — centered, in body.md / onSurface.muted.
 * Used both by the explicit null-check AND by the ErrorBoundary so a throwing
 * query (DATA-006 ConvexError NOT_FOUND) surfaces the SAME node, never an
 * uncaught error.
 */
const CuratedRouteFallback = ({ semantic }: FallbackProps) => (
  <View
    testID="curated-route-detail-fallback"
    style={[styles.centered, { backgroundColor: semantic.color.background.default }]}
  >
    <Text
      style={[
        semantic.type.body.md,
        { color: semantic.color.onSurface.muted ?? semantic.color.onSurface.subtle ?? '' },
      ]}
    >
      Route not found
    </Text>
  </View>
)

const CuratedRouteDetailScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const { semantic } = useSemanticTheme()

  const headerAction = useMemo(
    () => ({
      icon: 'arrow-left' as const,
      onPress: () => router.back(),
      testID: 'curated-route-detail-back',
    }),
    [router],
  )

  return (
    <SafeAreaView
      testID="curated-route-detail-screen"
      style={[styles.safe, { backgroundColor: semantic.color.background.default }]}
      edges={['top']}
    >
      <MapHeaderOverlay
        title="Route Detail"
        leftAction={headerAction}
        testID="curated-route-detail-header"
      />
      {/* ErrorBoundary: a throwing getCuratedRouteDetail (DATA-006 NOT_FOUND)
          renders the SAME fallback as the explicit null-check — no uncaught
          error reaches the top-level boundary. NOTE: this boundary does NOT
          swallow per-section weather failures — those are isolated inside
          PolylineGuardedBody's conditions section. */}
      <ErrorBoundary fallback={<CuratedRouteFallback semantic={semantic} />}>
        <PolylineGuardedBody id={id ?? ''} />
      </ErrorBoundary>
    </SafeAreaView>
  )
}

export default CuratedRouteDetailScreen

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  bodyRoot: {
    flex: 1,
  },
  // ~40% map (non-scrolling flex sibling above the body, mirroring saved-route).
  mapSection: {
    flex: 0.4,
  },
  // ~60% body.
  bodyScroll: {
    flex: 0.6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  headerName: {
    flexShrink: 1,
  },
  conditionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  polylineProbe: {
    height: 1,
    marginTop: 8,
    backgroundColor: 'transparent',
  },
  // DESIGN-003 state 2: badge wrapper centered BELOW the map viewport.
  // Position absolute over the map's bottom edge so the map's flex sizing
  // is unaffected; the badge floats centered with semantic breathing room.
  // (Inline `bottom: semantic.space.sm` — keeps the offset theme-aware.)
  approximateBadgeWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
