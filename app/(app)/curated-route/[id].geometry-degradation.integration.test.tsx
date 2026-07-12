/**
 * DESIGN-003 integration tests: geometry graceful degradation in the map
 * section of `app/(app)/curated-route/[id].tsx`.
 *
 * Renders the REAL curated-route detail screen with the REAL
 * `useCuratedRouteDetail` hook. Only the boundary (Convex useQuery/useAction,
 * expo-router, native map, theme, safe-area) is mocked — the screen, the hook,
 * the real Badge/MapboxMapView contract, and ErrorBoundary run for real.
 *
 * REDHAT-FIX-002 / H2: honest painted-line oracle requires map-settled +
 * line-paint-ready (≥2 coords necessary but not sufficient alone). Blank map
 * with valid coords must fail the oracle.
 *
 * AC coverage (jsdom-testable logic; full-render against live dev + simulator
 * is PHASE 3.5 — the maestro flows `.maestro/uc-dtl-03-*.yaml`):
 *   AC-1 (PRIMARY)  polylinePresentRendersPolylineAndHidesApproximateBadge
 *       → WITH routePolyline: `curated-route-detail-polyline` probe renders,
 *         `curated-detail-approximate-badge` is ABSENT.
 *   AC-2            noPolylineRendersSingleCentroidMarkerAndApproximateBadge
 *       → WITHOUT routePolyline (centroid present): `curated-detail-approximate-badge`
 *         renders with literal text 'Approximate location', polyline probe ABSENT.
 *         (Camera zoom 11 is asserted via the MapboxMapView mock's recorded props.)
 *   AC-3            nullCentroidGracefulNoCrash
 *       → routePolyline null AND centroid null: header name length ≥ 1,
 *         no exception thrown, at least one non-map section renders.
 *
 * Service: vitest (jsdom). The real map rendering (polyline drawn, marker
 * placed, camera zoom 11) is verified on-device in PHASE 3.5.
 */

import { cleanup, render } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_SEMANTIC } from '../../../test-helpers/mock-semantic'

// ---------------------------------------------------------------------------
// Boundary spies (hoisted so the mock factories can reference them).
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockGetCurrentWeather = vi.fn()

// Controls whether the MapboxMapView mock fires onMapReady / exposes settle +
// paint oracles. REDHAT-FIX-002 AC-2: blank map with valid coords must fail.
let autoMapSettle = true

// Records the last props passed to MapboxMapView so camera/marker assertions
// are possible without probing the (mocked-away) native children.
const mapboxPropsLog: Array<{
  markers?: Array<{ coordinates: { latitude: number; longitude: number } }>
  camera?: { center: [number, number]; zoom: number }
  polylines?: unknown[]
  preferPolylineViewport?: boolean
  onMapReady?: () => void
}> = []

const fitToCoordinatesSpy = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useAction: () => mockGetCurrentWeather,
  // DESIGN-004: useSaveCuratedRoute calls useMutation — include a no-op stub.
  useMutation: () => vi.fn(),
}))

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'wasatch-ridge-traverse' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: (p: { children: React.ReactNode }) => p.children,
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

// MapboxMapView — record props + render children so the polyline probe and the
// approximate-badge (both rendered as siblings inside the map section) are
// reachable. Mocked WITHOUT importOriginal: the real map module pulls in
// @rnmapbox/maps + react-native-worklets which crash under jsdom.
// Surfaces map-settled + mapbox-road-polyline-layer oracles when settled with
// drawable polylines (mirrors real MapboxMapView REDHAT-FIX-001/002 contract).
vi.mock('../../../components/map', () => {
  const React = require('react')
  const { View } = require('react-native')
  const MapboxMapView = React.forwardRef(
    (
      props: {
        children?: React.ReactNode
        markers?: unknown
        camera?: unknown
        polylines?: Array<{ coordinates?: unknown[] }>
        preferPolylineViewport?: boolean
        onMapReady?: () => void
      },
      ref: React.Ref<{ fitToCoordinates: (coords: unknown) => void }>,
    ) => {
      mapboxPropsLog.push({
        markers: props?.markers as never,
        camera: props?.camera as never,
        polylines: props?.polylines as never,
        preferPolylineViewport: props?.preferPolylineViewport,
        onMapReady: props?.onMapReady,
      })
      React.useImperativeHandle(ref, () => ({
        fitToCoordinates: (coords: unknown) => fitToCoordinatesSpy(coords),
      }))
      const [settled, setSettled] = React.useState(false)
      React.useEffect(() => {
        if (!autoMapSettle) return
        props.onMapReady?.()
        setSettled(true)
      }, [props.onMapReady])
      const hasDrawable = (props.polylines ?? []).some((p) => (p?.coordinates?.length ?? 0) >= 2)
      return React.createElement(
        View,
        { testID: 'mapbox-map-view-mock' },
        settled
          ? React.createElement(View, {
              testID: 'map-settled',
              accessibilityLabel: 'map-settled',
            })
          : null,
        settled && hasDrawable
          ? React.createElement(View, {
              testID: 'mapbox-road-polyline-layer',
              accessibilityLabel: 'mapbox-road-polyline-layer',
            })
          : null,
        props?.children ?? null,
      )
    },
  )
  MapboxMapView.displayName = 'MapboxMapView'
  return { MapboxMapView }
})

vi.mock('../../../components/map/map-header-overlay', () => ({
  MapHeaderOverlay: () => null,
}))

// DESIGN-004: the screen now imports SAVE-001 hooks + SAVE-002 deeplink.
// Mock both so the DESIGN-003 assertions (geometry degradation) are unaffected.
vi.mock('../../../hooks/use-save-curated-route', () => ({
  useSaveCuratedRoute: () => ({ save: vi.fn(), isLoading: false }),
  useIsCuratedRouteSaved: () => ({ isSaved: false }),
}))

vi.mock('../../../lib/maps-deeplink', () => ({
  openRouteInMaps: vi.fn(),
}))

// Button — mock as a leaf text node (parity with the DESIGN-002 suite).
vi.mock('../../../components/ui/button', () => {
  const React = require('react')
  const Button = (props: { children?: React.ReactNode; testID?: string }) =>
    React.createElement('Text', { testID: props.testID }, props.children)
  return { Button }
})

// ---------------------------------------------------------------------------
// Fixtures — match getCuratedRouteDetail return shape (DATA-006).
// ---------------------------------------------------------------------------

const WEATHER_OK = {
  tempF: 64,
  condition: 'CLEAR' as const,
  severity: 'normal' as const,
  dayOfWeek: 'SATURDAY',
}

const buildDetail = (overrides: Record<string, unknown> = {}) => ({
  routeId: 'wasatch-ridge-traverse',
  name: 'Wasatch Ridge Traverse',
  state: 'UT',
  primaryArchetype: 'scenic',
  centroidLat: 40.6,
  centroidLng: -111.6,
  compositeScore: 0.81,
  curvatureScore: 0.8,
  scenicScore: 0.9,
  technicalScore: 0.7,
  trafficScore: 0.3,
  remotenessScore: 0.6,
  lengthMiles: 47,
  summary: 'A high-alpine traverse along the Wasatch Crest.',
  routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  bounds: { north: 40.8, south: 40.4, east: -111.4, west: -111.8 },
  headline: 'A high-alpine traverse along the Wasatch Crest.',
  ...overrides,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DESIGN-003: geometry graceful degradation', () => {
  let CuratedRouteDetailScreen: React.ComponentType<unknown>

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
    mapboxPropsLog.length = 0
    fitToCoordinatesSpy.mockClear()
    autoMapSettle = true
  })

  beforeEach(async () => {
    mockUseQuery.mockReset()
    mockGetCurrentWeather.mockReset()
    mockGetCurrentWeather.mockResolvedValue(WEATHER_OK)
    autoMapSettle = true
    const mod = await import('./[id]')
    CuratedRouteDetailScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1 (PRIMARY): WITH polyline → polyline renders, NO 'Approximate location' badge
  // ─────────────────────────────────────────────────────────────────────────
  it('polylinePresentRendersPolylineAndHidesApproximateBadge', async () => {
    // GIVEN a route WITH routePolyline
    mockUseQuery.mockReturnValue(buildDetail())

    const { getByTestId, queryByTestId, queryByText } = render(
      createElement(CuratedRouteDetailScreen),
    )

    // THEN: the polyline probe renders (polyline branch taken).
    expect(getByTestId('curated-route-detail-polyline')).toBeTruthy()

    // AND: the 'Approximate location' badge is ABSENT (mutual exclusion).
    expect(queryByTestId('curated-detail-approximate-badge')).toBeNull()
    expect(queryByText('Approximate location')).toBeNull()

    // AND: MapboxMapView received a non-empty polylines array.
    const lastMapCall = mapboxPropsLog[mapboxPropsLog.length - 1]
    expect(lastMapCall).toBeTruthy()
    expect((lastMapCall.polylines ?? []).length).toBeGreaterThan(0)

    // AND: MapboxMapView received NO markers (centroid marker must NOT show
    // when a polyline is present — the badge AND the centroid are exclusive
    // to the no-polyline branch per the design enrichment).
    expect((lastMapCall.markers ?? []).length).toBe(0)

    // REDHAT-FIX-002: honest paint oracle after settle + ≥2 coords.
    expect(getByTestId('map-settled')).toBeTruthy()
    expect(getByTestId('mapbox-road-polyline-layer')).toBeTruthy()
    expect(getByTestId('curated-route-detail-line-painted')).toBeTruthy()
    // Transparent real-line probe retired as PRIMARY (must not reappear).
    expect(queryByTestId('curated-route-detail-real-line')).toBeNull()

    // REDHAT-FIX-001 AC-2: fit runs only after map-ready with ≥2 coords.
    expect(fitToCoordinatesSpy).toHaveBeenCalledTimes(1)
    const fitted = fitToCoordinatesSpy.mock.calls[0]?.[0] as Array<{
      latitude: number
      longitude: number
    }>
    expect(fitted.length).toBeGreaterThanOrEqual(2)
    expect(lastMapCall.preferPolylineViewport).toBe(true)
    const strokeWidth = (lastMapCall.polylines as Array<{ strokeWidth?: number }>)[0]?.strokeWidth
    expect(strokeWidth).toBeGreaterThanOrEqual(4)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // REDHAT-FIX-002 AC-2: ≥2 coords + blank/unsettled map → oracle ABSENT
  // ─────────────────────────────────────────────────────────────────────────
  it('honestPaintedLineOracleAbsentWhenMapNotSettledDespiteValidCoords', async () => {
    // GIVEN valid ≥2-point polyline but Mapbox never settles / paints
    autoMapSettle = false
    mockUseQuery.mockReturnValue(buildDetail())

    const { queryByTestId, getByTestId } = render(createElement(CuratedRouteDetailScreen))

    // String-presence probe may still mount from coord string alone.
    expect(getByTestId('curated-route-detail-polyline')).toBeTruthy()

    // Honest paint/settle oracles MUST be absent — coords alone are not enough.
    expect(queryByTestId('map-settled')).toBeNull()
    expect(queryByTestId('mapbox-road-polyline-layer')).toBeNull()
    expect(queryByTestId('curated-route-detail-line-painted')).toBeNull()
    expect(queryByTestId('curated-route-detail-real-line')).toBeNull()

    // Fit must not run without settle.
    expect(fitToCoordinatesSpy).not.toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2: WITHOUT polyline → single centroid marker + literal badge + zoom 11
  // ─────────────────────────────────────────────────────────────────────────
  it('noPolylineRendersSingleCentroidMarkerAndApproximateBadge', async () => {
    // GIVEN a route WITHOUT routePolyline, centroid present
    mockUseQuery.mockReturnValue(
      buildDetail({
        routePolyline: null,
        name: 'Blue Ridge Overlook',
        centroidLat: 35.4,
        centroidLng: -83.2,
      }),
    )

    const { getByTestId, getByText, queryByTestId } = render(
      createElement(CuratedRouteDetailScreen),
    )

    // THEN: the approximate-location badge renders with literal text.
    const badge = getByTestId('curated-detail-approximate-badge')
    expect(badge).toBeTruthy()
    expect(getByText('Approximate location')).toBeTruthy()

    // AND: the polyline probe is ABSENT.
    expect(queryByTestId('curated-route-detail-polyline')).toBeNull()

    // AND: exactly ONE centroid marker was passed to MapboxMapView.
    const lastMapCall = mapboxPropsLog[mapboxPropsLog.length - 1]
    expect(lastMapCall).toBeTruthy()
    const markers = lastMapCall.markers ?? []
    expect(markers.length).toBe(1)
    expect(markers[0].coordinates.latitude).toBe(35.4)
    expect(markers[0].coordinates.longitude).toBe(-83.2)

    // AND: no polylines were passed.
    expect((lastMapCall.polylines ?? []).length).toBe(0)

    // AND: camera zoom is 11, centered on the centroid (Mapbox format [lng, lat]).
    expect(lastMapCall.camera).toBeTruthy()
    expect(lastMapCall.camera?.zoom).toBe(11)
    expect(lastMapCall.camera?.center[0]).toBe(-83.2) // lng
    expect(lastMapCall.camera?.center[1]).toBe(35.4) // lat

    // REDHAT-FIX-002 AC-3: centroid-only route must NOT render paint oracle.
    // Map may settle, but no drawable road line → no paint-ready oracle.
    expect(queryByTestId('curated-route-detail-line-painted')).toBeNull()
    expect(queryByTestId('mapbox-road-polyline-layer')).toBeNull()
    expect(queryByTestId('curated-route-detail-real-line')).toBeNull()
  })

  it('degenerateOnePointPolylineOmitsPaintedLineOracle', async () => {
    // GIVEN a route whose polyline decodes to exactly one point (< 2 threshold)
    mockUseQuery.mockReturnValue(
      buildDetail({
        routePolyline: '_uxvF~zchT',
        name: 'Degenerate One Point',
      }),
    )

    const { queryByTestId } = render(createElement(CuratedRouteDetailScreen))

    // THEN: string-presence polyline probe may still render, but honest paint
    // oracle must not (coords ≥2 is necessary).
    expect(queryByTestId('curated-route-detail-line-painted')).toBeNull()
    expect(queryByTestId('mapbox-road-polyline-layer')).toBeNull()
    expect(queryByTestId('curated-route-detail-real-line')).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: both null → graceful no-crash
  // ─────────────────────────────────────────────────────────────────────────
  it('nullCentroidGracefulNoCrash', async () => {
    // GIVEN a route with neither polyline nor centroid
    mockUseQuery.mockReturnValue(
      buildDetail({
        routePolyline: null,
        centroidLat: null,
        centroidLng: null,
        name: 'Mystery Route',
      }),
    )

    // WHEN rendered — no exception thrown (this will throw if the screen
    // does not handle null centroid, e.g. uncaught TypeError on .toFixed).
    let screen: ReturnType<typeof render>
    expect(() => {
      screen = render(createElement(CuratedRouteDetailScreen))
    }).not.toThrow()

    // THEN: header name renders with non-empty text.
    const name = screen.getByTestId('curated-route-detail-name')
    expect(name).toBeTruthy()
    const nameText = name.props.children
    expect(typeof nameText === 'string' ? nameText.length : 1).toBeGreaterThan(0)

    // AND: at least one non-map section renders (header section is the proof).
    expect(screen.getByTestId('curated-detail-header')).toBeTruthy()

    // AND: neither the badge nor the polyline probe leaks into this branch
    // (no geometry → no geometry UI).
    expect(screen.queryByTestId('curated-detail-approximate-badge')).toBeNull()
    expect(screen.queryByTestId('curated-route-detail-polyline')).toBeNull()

    // REDHAT-FIX-002 AC-3: honest paint oracle absent for null polyline.
    expect(screen.queryByTestId('curated-route-detail-line-painted')).toBeNull()
    expect(screen.queryByTestId('mapbox-road-polyline-layer')).toBeNull()
    expect(screen.queryByTestId('curated-route-detail-real-line')).toBeNull()

    // AND: MapboxMapView received NO markers and NO polylines (graceful no-op).
    const lastMapCall = mapboxPropsLog[mapboxPropsLog.length - 1]
    expect(lastMapCall).toBeTruthy()
    expect((lastMapCall.markers ?? []).length).toBe(0)
    expect((lastMapCall.polylines ?? []).length).toBe(0)
  })
})
