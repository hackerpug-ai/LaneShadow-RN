/**
 * Curated Route Detail Screen (DESIGN-002 — six-section lean body).
 *
 * Full-screen view of a single curated route. Header uses `SubpageLayout`
 * (compact size — finite 44pt bar with back button + "Route Detail" title).
 * Below the header, six body sections top→bottom:
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
 *   - `curated-route-detail-real-line` — ≥2 decoded polyline points (S1-T3 plot gate)
 *   - `curated-route-detail-fallback` — null/error fallback node (unchanged)
 *   - `curated-route-detail-loading`  — loading skeleton (unchanged)
 * The six section ROOT Views carry the canonical `curated-detail-*` testIDs.
 */

import { useAction } from 'convex/react'
import { useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { SubpageLayout } from '../../../components/layouts/subpage-layout'
import { ErrorBoundary } from '../../../components/logging/error-boundary'
import {
  MapboxMapView,
  type MapboxMapViewHandle,
  type MapboxPolyline,
} from '../../../components/map'
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
import { useIsCuratedRouteSaved, useSaveCuratedRoute } from '../../../hooks/use-save-curated-route'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { openRouteInMaps } from '../../../lib/maps-deeplink'
import { decodePolylineGeometry } from '../../../shared/lib/polyline'

// ─── Weather action result shape (mirrors convex/actions/weather.ts returns) ─

type WeatherResult = {
  tempF: number
  condition: string
  severity: string
  dayOfWeek: string
}

// ─── Score-dimension catalog (fixed order; null scores filtered by the section) ─
//
// NOTE: `curvatureScore` in the DB is actually `technical_score` from the LLM
// extraction pipeline (stages.py:908 reuses technical_score for curvatureScore).
// Showing it as a separate "Curvature" bar was misleading — it duplicated the
// Technical bar under a false label. Removed until real curvature data exists.

type ScoredDetail = Pick<
  CuratedRouteDetail,
  'scenicScore' | 'technicalScore' | 'trafficScore' | 'remotenessScore'
>

const buildScoreDimensions = (detail: ScoredDetail): ScoreDimension[] => [
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

// ─── DESIGN-004: Save status state machine ───────────────────────────────────
//
// Explicit four-state machine for the Save button:
//   idle    — not saved, tappable 'Save' label.
//   loading — ActivityIndicator replaces the label (dimensions stable); onPress
//             disabled to prevent double-save.
//   saved   — checkmark + 'Saved' + Badge variant='success' IN PLACE; NO
//             navigation away (stays on the same route path).
//   error   — save failed; restores the tappable 'Save' label (never stuck
//             loading). Tapping retries.
//
// Pre-populated from useIsCuratedRouteSaved: if the route is already bookmarked
// the button starts in `saved`. onError / null-result → `error` (renders 'Save').
type SaveStatus = 'idle' | 'loading' | 'saved' | 'error'

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

  // S1-T3: discriminate a drawable road line (≥2 coords) from a centroid dot or
  // degenerate 0/1-point polyline string — the Maestro plot gate keys off this.
  const hasRealRoadLine = (polylines[0]?.coordinates.length ?? 0) >= 2

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

  // Seed the camera near the route so the first user-location fix does not
  // steal the viewport before Mapbox style load + fitToCoordinates run.
  const polylineInitialCamera = useMemo(() => {
    if (!hasRealRoadLine || polylines.length === 0) return undefined
    const coords = polylines[0].coordinates
    if (coords.length < 2) return undefined
    const lats = coords.map((c) => c.latitude)
    const lngs = coords.map((c) => c.longitude)
    return {
      center: [
        (Math.min(...lngs) + Math.max(...lngs)) / 2,
        (Math.min(...lats) + Math.max(...lats)) / 2,
      ] as [number, number],
      zoom: 10,
      pitch: 0,
      heading: 0,
    }
  }, [hasRealRoadLine, polylines])

  const [isMapStyleReady, setIsMapStyleReady] = useState(false)
  const handleMapReady = useCallback(() => {
    setIsMapStyleReady(true)
  }, [])

  // Imperative fit-bounds for state 1: only after Mapbox style/map-ready so
  // fitBounds is not a no-op on an unloaded map (REDHAT-FIX-001 / H1).
  const mapRef = useRef<MapboxMapViewHandle | null>(null)
  useEffect(() => {
    if (!isMapStyleReady || !hasRealRoadLine || polylines.length === 0) return
    const coords = polylines[0].coordinates
    if (coords.length < 2) return
    mapRef.current?.fitToCoordinates(coords)
  }, [isMapStyleReady, hasRealRoadLine, polylines])

  // ─── DESIGN-004: Save + Ride It actions wiring ──────────────────────────
  //
  // Hooks are called unconditionally (BEFORE the isLoading/!detail early
  // returns) to respect rules-of-hooks. The identifiers pass `detail?.*`
  // (optional chaining) so they are safe when detail is still loading.
  //
  // IDENTIFIER RECONCILIATION (SAVE-001 follow-up):
  //   useSaveCuratedRoute({curatedRouteId}) expects the Convex `_id`
  //   (`Id<'curated_routes'>`). DATA-006's getCuratedRouteDetail returns
  //   `routeId` (the string slug) but NOT `_id`. We wire `detail.routeId`
  //   (the only identifier available); the live save needs `_id` resolution
  //   — a Convex read-path change outside this task's WRITE scope.
  //   The wiring is correct; the `_id` source is the gap.
  const { isSaved: isAlreadySaved } = useIsCuratedRouteSaved({
    curatedRouteId: detail?._id ?? null,
  })
  const { save } = useSaveCuratedRoute({
    curatedRouteId: detail?._id ?? '',
    name: detail?.name ?? '',
  })

  // Status state machine. Initialized to 'idle'; the effect below syncs to
  // 'saved' when useIsCuratedRouteSaved reports the route is already bookmarked
  // (e.g. user previously saved, or deep-linked to an already-saved route).
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  useEffect(() => {
    if (isAlreadySaved) {
      setSaveStatus((prev) => (prev === 'idle' || prev === 'error' ? 'saved' : prev))
    }
  }, [isAlreadySaved])

  // Save handler: idle/error → loading → saved (success) | error (failure).
  // Guarded against double-press (loading/saved are no-ops). The SAVE-001 hook
  // catches ConvexErrors internally and returns null on failure — we treat
  // null as the error path (restores tappable 'Save', never stuck loading).
  const handleSave = useCallback(async () => {
    if (saveStatus === 'loading' || saveStatus === 'saved') return
    setSaveStatus('loading')
    try {
      const result = await save()
      setSaveStatus(result ? 'saved' : 'error')
    } catch {
      setSaveStatus('error')
    }
  }, [saveStatus, save])

  // Ride It handler: hand off to SAVE-002's openRouteInMaps with the centroid +
  // name. Never hardcodes a maps URL. Null-safe guard mirrors the deeplink
  // util's own AC-4 (graceful no-op on null centroid).
  const handleRideIt = useCallback(() => {
    if (!detail) return
    void openRouteInMaps({
      lat: detail.centroidLat,
      lng: detail.centroidLng,
      name: detail.name,
    })
  }, [detail])

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
          initialCamera={polylineInitialCamera}
          preferPolylineViewport={hasRealRoadLine}
          onMapReady={handleMapReady}
        />
        {/* Polyline-presence marker so AC-1's "polyline layer rendered" can be
            asserted independently of the native map children. Rendered ONLY in
            state 1 (polyline present) — never in state 2/3. */}
        {hasPolyline ? (
          <View
            testID="curated-route-detail-polyline"
            collapsable={false}
            style={styles.polylineProbe}
          />
        ) : null}
        {hasRealRoadLine && isMapStyleReady ? (
          <View
            testID="curated-route-detail-real-line"
            collapsable={false}
            accessibilityLabel="curated-route-detail-real-line"
            style={styles.polylineProbe}
          />
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
              subtitle="Estimated"
              disclaimer="Scores are AI-generated estimates based on route descriptions — not road measurements."
            />
          </View>

          {/* 3b. Route Facts — real measured data from FHWA / highway datasets */}
          <RouteFactsSection detail={detail} semantic={semantic} />

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

          {/* 5. Actions — Save + Ride It (WIRED by DESIGN-004)
           *
           * Save button: variant='default' (filled copper primary).
           *   idle    → 'Save' label, tappable.
           *   loading → ActivityIndicator replaces label (dimensions stable);
           *             onPress disabled (prevents double-save).
           *   saved   → '✓ Saved' + Badge variant='success' IN PLACE; NO
           *             navigation away (stays on this route path).
           *   error   → restores tappable 'Save' (never stuck loading).
           *
           * Ride It button: variant='outline' (border.default border,
           *   onSurface.default text, transparent fill) — visually distinct
           *   from Save's filled primary. onPress → openRouteInMaps (SAVE-002).
           *
           * Both buttons flex:1 in a gap-md row. testIDs match the
           * REQUIREMENT-CONTRACT v1 + the uc-dtl-04 maestro flows. */}
          <View
            testID="curated-detail-actions"
            style={[styles.actionsRow, { gap: semantic.space.md }]}
          >
            <Button
              variant="default"
              onPress={handleSave}
              disabled={saveStatus === 'loading' || saveStatus === 'saved'}
              testID="save-curated-button"
              accessibilityLabel={
                saveStatus === 'saved' ? 'Saved' : saveStatus === 'loading' ? 'Saving' : 'Save'
              }
              style={styles.actionButton}
            >
              {saveStatus === 'loading' ? (
                <View testID="save-curated-loading" style={styles.saveLoadingWrap}>
                  <ActivityIndicator size="small" color={semantic.color.onPrimary.default} />
                </View>
              ) : saveStatus === 'saved' ? (
                <View style={[styles.savedContent, { gap: semantic.space.xs }]}>
                  <Text
                    testID="save-curated-saved-label"
                    style={{ color: semantic.color.onPrimary.default }}
                  >
                    ✓ Saved
                  </Text>
                  <Badge variant="success" testID="save-curated-saved-badge">
                    Saved
                  </Badge>
                </View>
              ) : (
                'Save'
              )}
            </Button>
            <Button
              variant="outline"
              onPress={handleRideIt}
              testID="ride-it-button"
              accessibilityLabel="Ride It — open in maps"
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

// ─── Route Facts: real measured data section ──────────────────────────────────

type RouteFactsDetail = Pick<
  CuratedRouteDetail,
  'elevationGainM' | 'surface' | 'aadt' | 'pavementIri'
>

type Semantic = ReturnType<typeof useSemanticTheme>['semantic']

const formatElevationFt = (m: number): string => {
  const ft = Math.round(m * 3.28084)
  return `${ft.toLocaleString('en-US')} ft`
}

const formatAadt = (aadt: number): string =>
  `${Math.round(aadt).toLocaleString('en-US')} vehicles/day`

const formatIri = (iri: number): string => {
  const label = iri < 1.5 ? 'Smooth' : iri < 2.7 ? 'Fair' : 'Rough'
  return `${iri.toFixed(1)} m/km \u00B7 ${label}`
}

const titleCaseSurface = (surface: string): string =>
  surface.length === 0 ? surface : surface.charAt(0).toUpperCase() + surface.slice(1)

type FactRow = { label: string; value: string }

const buildFactRows = (detail: RouteFactsDetail): FactRow[] => {
  const rows: FactRow[] = []
  if (typeof detail.elevationGainM === 'number') {
    rows.push({ label: 'Elevation gain', value: formatElevationFt(detail.elevationGainM) })
  }
  if (typeof detail.surface === 'string' && detail.surface.length > 0) {
    rows.push({ label: 'Surface', value: titleCaseSurface(detail.surface) })
  }
  if (typeof detail.aadt === 'number') {
    rows.push({ label: 'Traffic (AADT)', value: formatAadt(detail.aadt) })
  }
  if (typeof detail.pavementIri === 'number') {
    rows.push({ label: 'Pavement', value: formatIri(detail.pavementIri) })
  }
  return rows
}

const RouteFactsSection = ({
  detail,
  semantic,
}: {
  detail: RouteFactsDetail
  semantic: Semantic
}): React.ReactNode => {
  const rows = buildFactRows(detail)
  if (rows.length === 0) return null

  return (
    <View testID="curated-detail-facts">
      <Text
        style={[
          semantic.type.label.sm,
          {
            color: semantic.color.onSurface.subtle,
            textTransform: 'uppercase',
            marginBottom: semantic.space.sm,
          },
        ]}
      >
        Route Facts
      </Text>
      <View
        style={[
          styles.factsCard,
          {
            backgroundColor: semantic.color.surfaceVariant.default,
            borderRadius: semantic.radius.lg,
            padding: semantic.space.lg,
            gap: semantic.space.sm,
          },
        ]}
      >
        {rows.map((row) => (
          <View key={row.label} style={[styles.factRow, { gap: semantic.space.md }]}>
            <Text
              style={[semantic.type.body.md, { color: semantic.color.onSurface.subtle, flex: 1 }]}
            >
              {row.label}
            </Text>
            <Text
              style={[semantic.type.body.md, { color: semantic.color.onSurface.default }]}
              accessibilityLabel={`${row.label}: ${row.value}`}
            >
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

type FallbackProps = {
  semantic: ReturnType<typeof useSemanticTheme>['semantic']
}

/**
 * "Route not found" fallback — centered, in body.md / onSurface.muted.
 * Primary path: getCuratedRouteDetail returns null for an absent routeId
 * (no throw → no RN LogBox redbox). ErrorBoundary still covers unexpected
 * render failures with the SAME node.
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
  const { semantic } = useSemanticTheme()

  return (
    <SubpageLayout title="Route Detail" size="compact" testID="curated-route-detail-screen">
      {/* ErrorBoundary: unexpected render failures share the null-detail
          fallback. Absent routeIds do not throw (query returns null). This
          boundary does NOT swallow per-section weather failures — those are
          isolated inside PolylineGuardedBody's conditions section. */}
      <ErrorBoundary fallback={<CuratedRouteFallback semantic={semantic} />}>
        <PolylineGuardedBody id={id ?? ''} />
      </ErrorBoundary>
    </SubpageLayout>
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
  factsCard: {},
  factRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
  },
  // DESIGN-004: loading indicator wrapper — centered to keep button dimensions
  // stable (no layout shift when the label is replaced by the spinner).
  saveLoadingWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // DESIGN-004: saved-state inline content — checkmark + 'Saved' + success
  // Badge in a gap-xs row.
  savedContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  // Maestro assertVisible needs non-zero layout + opacity ≥0.01 (not pure
  // transparent zero-hit boxes). Keep nearly invisible so the map stays clear.
  polylineProbe: {
    height: 2,
    marginTop: 8,
    opacity: 0.01,
    backgroundColor: 'rgba(184, 115, 51, 0.02)',
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
