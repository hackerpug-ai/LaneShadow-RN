/**
 * Curated Route Detail Screen
 *
 * Full-screen view of a single curated route: name + basic map.
 *
 * Reached by tapping a curated-route chat card OR its map pin on the plan
 * view (both `router.push('/(app)/curated-route/{id}')` via the shared
 * `goToCuratedRoute(id)` helper on the plan tab).
 *
 * Scaffold mirrors `app/(app)/saved-route/[id].tsx`:
 *   - `useLocalSearchParams<{ id: string }>()` for the route id (NEVER a
 *     query prop / global state)
 *   - shared loading skeleton (ActivityIndicator)
 *   - error/null fallback ('Route not found') that REPLACES the whole body
 *
 * Per DTL-001 scope: this screen renders the route name + a polyline-guarded
 * map (no crash when `routePolyline` is null). DESIGN-002 owns the full
 * six-section body; DESIGN-003 owns the graceful centroid-degradation UX.
 */

import { useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { Text } from 'react-native-paper'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ErrorBoundary } from '../../../components/logging/error-boundary'
import { MapboxMapView, type MapboxPolyline } from '../../../components/map'
import { MapHeaderOverlay } from '../../../components/map/map-header-overlay'
import { useThemePreference } from '../../../contexts/theme-preference'
import { useCuratedRouteDetail } from '../../../hooks/use-curated-route-detail'
import { useSemanticTheme } from '../../../hooks/use-semantic-theme'
import { decodePolylineGeometry } from '../../../shared/lib/polyline'

const PolylineGuardedBody = ({ id }: { id: string }) => {
  const { semantic } = useSemanticTheme()
  const { isDark } = useThemePreference()
  const { detail, isLoading } = useCuratedRouteDetail(id)

  // Loading → shared skeleton (reuses the saved-route detail loading pattern).
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

  // Decode the encoded polyline string (precision 5) when present. When null
  // (the ~45% of the catalog lacking geometry) we render no polyline layer —
  // a no-crash guard. DESIGN-003 replaces this with the centroid + badge UX.
  const polylines: MapboxPolyline[] = detail.routePolyline
    ? [
        {
          id: `curated-${detail.routeId}`,
          coordinates: decodePolylineGeometry(detail.routePolyline),
          strokeColor: semantic.color.primary.default,
          strokeWidth: 6,
        },
      ]
    : []

  return (
    <View style={styles.bodyRoot}>
      <View
        testID="curated-route-detail-map"
        style={[styles.mapSection, { backgroundColor: semantic.color.background.default }]}
        accessibilityLabel={`Route map for ${detail.name}`}
      >
        <MapboxMapView theme={isDark ? 'dark' : 'light'} polylines={polylines} />
      </View>

      {/* Name block — DESIGN-002 expands this into the six-section body. */}
      <View
        style={[
          styles.nameBlock,
          {
            paddingHorizontal: semantic.space.lg,
            paddingTop: semantic.space.lg,
            backgroundColor: semantic.color.background.default,
          },
        ]}
      >
        <Text
          testID="curated-route-detail-name"
          style={[semantic.type.title.lg, { color: semantic.color.onSurface.default }]}
        >
          {detail.name}
        </Text>
        {/* Polyline-presence marker so AC-1's "polyline layer rendered" can be
            asserted independently of the native map children. */}
        {polylines.length > 0 ? (
          <View testID="curated-route-detail-polyline" style={styles.polylineProbe} />
        ) : null}
      </View>
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
          error reaches the top-level boundary. */}
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
  mapSection: {
    flex: 1,
  },
  nameBlock: {
    paddingBottom: 24,
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
})
