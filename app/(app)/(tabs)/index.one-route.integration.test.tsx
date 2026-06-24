/**
 * RUX-002 Integration Tests: Plot only the currently-paged route's polyline
 *
 * Scenario-backed integration tests that render the real plan-view screen
 * (index.tsx) with real RoutePolyline, buildRoutePolylines, and
 * useRouteComparison — NOT the components directly.
 *
 * Only the native map boundary (rnmapbox), Convex/network hooks, and
 * unrelated UI components are mocked. The polyline builder and comparison
 * hook run through real code.
 *
 * AC-1: Only the selected route's polyline is plotted.
 * AC-2: Paging swaps the plotted route and re-fits the camera.
 * AC-3: Centroid-only paged route frames at zoom 12 without crashing.
 */

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: Convex / network boundary — these cannot run in the test harness.
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSegments: () => ['app', 'tabs', 'index'],
  useLocalSearchParams: () => ({}),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: (p: any) => p.children,
}))

vi.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: () => ({}),
  withTiming: vi.fn((v: number) => v),
  FadeInDown: {
    duration: () => ({ springify: () => undefined }),
  },
  default: {
    View: (props: any) => props.children,
  },
  Animated: {
    View: (props: any) => props.children,
  },
}))

vi.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}))

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Medium: 'Medium' },
}))

// ---------------------------------------------------------------------------
// Mock: @rnmapbox/maps — ShapeSource/LineLayer must render real Views
// so RoutePolyline (real code) produces segment testIDs that the
// integration tests can query.
// ---------------------------------------------------------------------------

vi.mock('@rnmapbox/maps', () => {
  const { createElement } = require('react')
  return {
    ShapeSource: (props: any) =>
      createElement('View', { testID: props.testID }, props.children),
    LineLayer: () => null,
  }
})

// ---------------------------------------------------------------------------
// Mock: contexts
// ---------------------------------------------------------------------------

vi.mock('../../../contexts/search-results', () => ({
  useSearchResults: () => ({
    results: [],
    selectedResultId: null,
    setSelectedResultId: vi.fn(),
    clearResults: vi.fn(),
  }),
}))

const mockFitToCoordinates = vi.fn()
const mockSetCameraPosition = vi.fn()
const mockMapRef = {
  current: {
    fitToCoordinates: mockFitToCoordinates,
    setCameraPosition: mockSetCameraPosition,
    recenterToUser: vi.fn(),
    zoomBy: vi.fn(),
  },
}

const mockSetSelectedRouteId = vi.fn()
const mockSetDisplayedRoutePlanId = vi.fn()
const mockRegisterFitHandler = vi.fn((handler: any) => {
  // Capture the fit handler so tests can invoke it manually
  mockRegisterFitHandler._lastHandler = handler
})
mockRegisterFitHandler._lastHandler = null as any
const mockRequestFitToRouteWithReset = vi.fn()

vi.mock('../../../contexts/selected-route', () => ({
  useSelectedRoute: () => ({
    selectedRouteId: null,
    setSelectedRouteId: mockSetSelectedRouteId,
    displayedRoutePlanId: null,
    setDisplayedRoutePlanId: mockSetDisplayedRoutePlanId,
    requestFitToRoute: vi.fn(),
    requestFitToRouteWithReset: mockRequestFitToRouteWithReset,
    registerFitHandler: mockRegisterFitHandler,
  }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

// ---------------------------------------------------------------------------
// Mock: hooks that require Convex / native services
// ---------------------------------------------------------------------------

const mockUseActiveSessionRoute = vi.fn()
vi.mock('../../../hooks/use-active-session-route', () => ({
  useActiveSessionRoute: (...args: unknown[]) => mockUseActiveSessionRoute(...args),
}))

vi.mock('../../../hooks/use-chat-planning', () => ({
  useChatPlanning: () => ({
    sendPlanningMessage: vi.fn(),
    cancel: vi.fn(),
    sessionId: null,
    resetSession: vi.fn(),
  }),
}))

vi.mock('../../../hooks/use-curated-discovery', () => ({
  useCuratedDiscovery: () => ({
    isLoading: false,
    isEmpty: true,
    routes: [],
  }),
}))

vi.mock('../../../hooks/use-current-location', () => ({
  useCurrentLocation: () => ({ location: { lat: 37.7749, lng: -122.4194 }, loading: false }),
}))

vi.mock('../../../hooks/use-is-route-saved', () => ({
  useIsRouteSaved: () => false,
}))

vi.mock('../../../hooks/use-plan-ride', () => ({
  usePlanInit: () => ({ data: null }),
  usePlanRide: () => ({
    planRide: vi.fn(),
    isRunning: false,
    error: null,
    resetError: vi.fn(),
    cancelPlanning: vi.fn(),
  }),
}))

// ── useRideFlow: controllable mock ──────────────────────────────────────

const mockFlowDispatch = vi.fn()

const mockUseRideFlow = vi.fn()
vi.mock('../../../hooks/use-ride-flow', () => ({
  useRideFlow: (...args: unknown[]) => mockUseRideFlow(...args),
}))

// ── useRouteComparison: NOT mocked — runs real code so we can verify
// that only the selected route's polylines are produced

const mockSelectRoute = vi.fn()

vi.mock('../../../hooks/use-toast-messages', () => ({
  useToastMessages: () => ({
    toasts: [],
    dismissToast: vi.fn(),
    clearAll: vi.fn(),
  }),
}))

vi.mock('../../../stores/chat-session-store', () => ({
  useChatSessionStore: (selector: any) =>
    selector({
      defaultCamera: null,
      bySession: {},
      lastViewedSessionId: null,
      _hydrated: true,
      setCamera: vi.fn(),
      setLastViewedSession: vi.fn(),
    }),
}))

// ---------------------------------------------------------------------------
// Mock: useSemanticTheme — comprehensive semantic theme for real components
// ---------------------------------------------------------------------------

const MOCK_SEMANTIC = {
  color: {
    primary: {
      default: '#D4A373',
      pressed: '#C49060',
      disabled: '#6B5439',
      hover: '#D4A373',
      focus: '#D4A373',
    },
    secondary: {
      default: '#1A1C1F',
      pressed: '#2A2C2F',
      disabled: '#0D0E10',
      hover: '#1A1C1F',
      focus: '#1A1C1F',
    },
    tertiary: {
      default: '#2B9AEB',
      pressed: '#1B8ADB',
      disabled: '#164D6B',
      hover: '#2B9AEB',
      focus: '#2B9AEB',
    },
    success: {
      default: '#31A362',
      pressed: '#219352',
      disabled: '#185232',
      hover: '#31A362',
      focus: '#31A362',
    },
    warning: {
      default: '#D98E04',
      pressed: '#C97E00',
      disabled: '#6B4700',
      hover: '#D98E04',
      focus: '#D98E04',
    },
    warningContainer: { default: '#2B2210', pressed: '#2B2210', disabled: '#2B2210' },
    onWarningContainer: { default: '#FFD080', pressed: '#FFD080', disabled: '#FFD080' },
    danger: {
      default: '#E35D6A',
      pressed: '#D34D5A',
      disabled: '#722E35',
      hover: '#E35D6A',
      focus: '#E35D6A',
    },
    info: {
      default: '#2B9AEB',
      pressed: '#1B8ADB',
      disabled: '#164D6B',
      hover: '#2B9AEB',
      focus: '#2B9AEB',
    },
    surface: {
      default: '#1B1715',
      pressed: '#2B2725',
      disabled: '#0D0B0A',
      hover: '#1B1715',
      focus: '#1B1715',
      glass: 'rgba(27,23,21,0.72)',
    },
    surfaceVariant: {
      default: '#2B2725',
      pressed: '#3B3735',
      disabled: '#1B1715',
      hover: '#2B2725',
      focus: '#2B2725',
    },
    background: {
      default: '#0b0b0c',
      pressed: '#0b0b0c',
      disabled: '#0b0b0c',
      hover: '#0b0b0c',
      focus: '#0b0b0c',
    },
    onSurface: {
      default: '#F5F0EB',
      pressed: '#F5F0EB',
      disabled: '#5A5650',
      hover: '#F5F0EB',
      focus: '#F5F0EB',
      muted: '#9CA3AF',
      subtle: '#6B7280',
    },
    onPrimary: {
      default: '#FFFFFF',
      pressed: '#FFFFFF',
      disabled: '#FFFFFF',
      hover: '#FFFFFF',
      focus: '#FFFFFF',
    },
    onSecondary: {
      default: '#F5F0EB',
      pressed: '#F5F0EB',
      disabled: '#F5F0EB',
      hover: '#F5F0EB',
      focus: '#F5F0EB',
    },
    secondaryContainer: { default: '#2B2725', pressed: '#2B2725', disabled: '#2B2725' },
    onSecondaryContainer: {
      default: '#F5F0EB',
      pressed: '#F5F0EB',
      disabled: '#F5F0EB',
      muted: '#9CA3AF',
      subtle: '#6B7280',
    },
    border: {
      default: '#2B2725',
      pressed: '#2B2725',
      disabled: '#2B2725',
      hover: '#2B2725',
      focus: '#2B2725',
      glass: 'rgba(43,39,37,0.5)',
    },
    input: { default: '#2B2725', pressed: '#2B2725', disabled: '#2B2725' },
    ring: { default: '#B87333', pressed: '#B87333', disabled: '#B87333' },
    locationPoiFill: { default: '#EDEDED', pressed: '#EDEDED', disabled: '#EDEDED' },
    locationPoiRing: { default: '#B87333', pressed: '#B87333', disabled: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3', pressed: '#A3A3A3', disabled: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8', pressed: '#F3EFE8', disabled: '#F3EFE8' },
    card: { default: '#24272B', pressed: '#24272B', disabled: '#24272B' },
    popover: { default: '#24272B', pressed: '#24272B', disabled: '#24272B' },
    accent: { default: '#88C7A6', pressed: '#78B796', disabled: '#446353' },
    orange: { default: '#FF6B35', pressed: '#EF5B25', disabled: '#7F3518' },
    muted: { default: '#938F99', pressed: '#938F99', disabled: '#938F99' },
    divider: { default: '#CAC4D0', pressed: '#CAC4D0', disabled: '#CAC4D0' },
    scrim: { default: '#000000', pressed: '#000000', disabled: '#000000' },
    routeSelected: { default: '#FF6B35', pressed: '#FF6B35', disabled: '#FF6B35' },
    routeAlternate: { default: '#60a5fa', pressed: '#60a5fa', disabled: '#60a5fa' },
    waypointOnRoute: { default: '#31A362' },
    waypointOffRoute: { default: '#E35D6A' },
    waypointMixed: { default: '#D98E04' },
    enrichmentFast: { default: '#31A362' },
    enrichmentExtended: { default: '#2B9AEB' },
    enrichmentCached: { default: '#9CA3AF' },
    deviationOriginalRoute: { default: '#9CA3AF' },
    deviationDetourPath: { default: '#FF6B35' },
    deviationReconnectPoint: { default: '#31A362' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 },
  type: {
    label: {
      sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
      md: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
      md: { fontSize: 18, lineHeight: 28, fontWeight: '500' as const },
      lg: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
    },
    heading: {
      sm: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
      md: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
      lg: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      md: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const },
      lg: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const },
    },
  },
  elevation: {
    0: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.4,
      shadowRadius: 32,
      elevation: 5,
    },
  },
  control: { minTouchTarget: 44, minHeight: 40 },
  opacity: { pressed: 0.7, disabled: 0.5, focus: 1, overlay: 0.5 },
  borderWidth: { thin: 1, medium: 2, thick: 4 },
}

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

// ---------------------------------------------------------------------------
// Mock: map native boundary — MapboxMapView is stubbed but renders children
// so RoutePolyline (real) renders inside it.
// ---------------------------------------------------------------------------

vi.mock('../../../components/map', () => {
  const { forwardRef } = require('react')
  return {
    MapboxMapView: forwardRef((props: any, ref: any) => {
      // Expose the mock map ref to the component via forwardRef
      if (typeof ref === 'function') {
        ref(mockMapRef.current)
      } else if (ref && typeof ref === 'object') {
        ref.current = mockMapRef.current
      }
      if (props?.children) return props.children
      return null
    }),
  }
})

vi.mock('../../../components/map/map-controls', () => ({ MapControls: () => null }))
vi.mock('../../../components/map/map-header-overlay', () => ({ MapHeaderOverlay: () => null }))
vi.mock('../../../components/map/map-planning-indicator', () => ({
  MapPlanningIndicator: () => null,
}))
vi.mock('../../../components/map/map-toast-stack', () => ({ MapToastStack: () => null }))
vi.mock('../../../components/map/route-summary-carousel', () => ({
  RouteSummaryCarousel: () => null,
}))
vi.mock('../../../components/map/route-tag', () => ({ RouteTag: () => null }))
vi.mock('../../../components/map/search-result-marker', () => ({
  SearchResultMarker: () => null,
}))
vi.mock('../../../components/map/weather-pills-row', () => ({ WeatherPillsRow: () => null }))

// ---------------------------------------------------------------------------
// Mock: chat / input / transcript / menu — not under test
// ---------------------------------------------------------------------------

vi.mock('../../../components/chat', () => ({ ChatInput: () => null }))
vi.mock('../../../components/layouts/menu-layout', () => ({
  MenuLayout: (p: any) => p.children,
}))
vi.mock('../../../components/sheets/plan-ride-sheet', () => ({ PlanRideSheet: () => null }))
vi.mock('../../../components/sheets/planning-error-sheet', () => ({
  PlanningErrorSheet: () => null,
}))
vi.mock('../../../components/sheets/planning-loading', () => ({ RoutePlannerLoading: () => null }))
vi.mock('../../../components/sheets/route-details-sheet', () => ({
  RouteDetailsSheet: () => null,
}))
vi.mock('../../../components/ui/chat-transcript', () => ({ ChatTranscript: () => null }))
vi.mock('../../../components/ui/motorcycle-plus-icon', () => ({
  MotorcyclePlusIcon: () => null,
}))
vi.mock('../../../components/ui/save-favorite-sheet', () => ({
  SaveRouteSheet: () => null,
}))

vi.mock('../../../components/sheets/route-directions-sheet', () => ({
  RouteDirectionsSheet: () => null,
}))

vi.mock('../../../components/chat/cards/route-mini-map', () => ({
  RouteMiniMap: () => null,
}))

vi.mock('../../../components/ui/badge', () => ({
  Badge: ({ children, testID }: any) => createElement('View', { testID }, children),
}))

// ---------------------------------------------------------------------------
// Mock: libraries that cannot run in jsdom
// ---------------------------------------------------------------------------

vi.mock('../../../lib/get-current-location', () => ({ getCurrentLocation: vi.fn() }))

// ---------------------------------------------------------------------------
// NOTE: HomeMapScreen, RoutePolyline, buildRoutePolylines, and
// useRouteComparison are NOT mocked — they render through real code.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Test fixtures — proper PlannedRouteOptionView shape with real-encoded polylines
// ---------------------------------------------------------------------------

// Pre-encoded polylines for realistic test data.
// Route A: San Francisco → Half Moon Bay (multi-point, 3 coords)
// Route B: San Francisco → Sausalito (multi-point, 3 coords, different geometry)
//
// Generated via @mapbox/polyline.encode([lat, lng] pairs).
// The polyline library uses [latitude, longitude] order per Google's format.
// decodePolylineGeometry maps decoded pairs → { latitude, longitude } objects.
//
// routeA decodes to: [{lat:37.7749,lng:-122.4194}, {lat:37.6849,lng:-122.4294}, {lat:37.5936,lng:-122.4394}]
// routeB decodes to: [{lat:37.7749,lng:-122.4194}, {lat:37.8049,lng:-122.4654}, {lat:37.8549,lng:-122.4894}]
const routeAPolyline = 'c|peFf`ejVnqPn}@ryPn}@'
const routeBPolyline = 'c|peFf`ejVozDn~GowH~tC'

const createRouteOption = (
  id: string,
  label: string,
  encodedPolyline: string,
  distanceMeters: number,
  durationSeconds: number,
  startLabel = 'San Francisco',
  endLabel = 'Destination',
) => ({
  routeOptionId: id,
  label,
  rationale: `${label} route`,
  stats: {
    distanceMeters,
    durationSeconds,
    legsCount: 1,
  },
  map: {
    bounds: {
      northeast: { lat: 37.85, lng: -122.42 },
      southwest: { lat: 37.59, lng: -122.49 },
    },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: encodedPolyline,
    },
    legs: [
      {
        start: { lat: 37.77, lng: -122.42, label: startLabel, placeId: 'start' },
        end: { lat: 37.59, lng: -122.44, label: endLabel, placeId: 'end' },
        distanceMeters,
        durationSeconds,
        geometry: {
          format: 'polyline' as const,
          encoding: 'google',
          precision: 5,
          value: encodedPolyline,
        },
        legIndex: 0,
        steps: [],
      },
    ],
  },
  overlaysPreview: {
    windSummary: 'low' as const,
    rainSummary: 'none' as const,
    temperatureSummary: 'mild' as const,
    conditionsStatus: 'ok' as const,
  },
})

// Create a centroid-only route (single coordinate, no multi-point geometry)
const createCentroidRouteOption = (
  id: string,
  label: string,
  lat: number,
  lng: number,
  distanceMeters: number,
  durationSeconds: number,
) => {
  // Pre-encoded single-point polyline that decodes to 1 coordinate.
  // For lat=36.85, lng=-121.40 → encoded: og|_F~|}cV
  // This decodes to 1 coordinate: {latitude: 36.85, longitude: -121.40}
  const centroidPolyline = 'og|_F~|}cV'

  return {
    routeOptionId: id,
    label,
    rationale: `${label} route`,
    stats: {
      distanceMeters,
      durationSeconds,
      legsCount: 0,
    },
    map: {
      bounds: {
        northeast: { lat: lat + 0.01, lng: lng + 0.01 },
        southwest: { lat: lat - 0.01, lng: lng - 0.01 },
      },
      overviewGeometry: {
        format: 'polyline' as const,
        encoding: 'google',
        precision: 5,
        value: centroidPolyline,
      },
      legs: [],
    },
    overlaysPreview: {
      windSummary: 'none' as const,
      rainSummary: 'none' as const,
      temperatureSummary: 'mild' as const,
      conditionsStatus: 'unavailable' as const,
    },
  }
}

const routeA = createRouteOption('route-efficient', 'Efficient', routeAPolyline, 103_000, 5400)
const routeB = createRouteOption('route-scenic', 'Scenic Coastal', routeBPolyline, 125_000, 7200)
const centroidRoute = createCentroidRouteOption('route-centroid', 'Centroid Spot', 36.85, -121.40, 5000, 300)

/** Build a ROUTE_RESULTS flowState with the given route options. */
const buildFlowState = (options: any[], selectedId?: string | null) => ({
  phase: 'ROUTE_RESULTS' as const,
  sessionId: 'test-session',
  routeOptions: {
    planId: 'test-plan',
    options,
  },
  selectedRouteId: selectedId ?? options[0]?.routeOptionId ?? null,
})

const MOCK_ACTIVE_OPTION = {
  routeOptionId: 'route-efficient',
  label: 'Efficient',
  rationale: 'Fastest route',
  stats: { distanceMeters: 103_000, durationSeconds: 5400, legsCount: 1 },
  map: {
    bounds: {
      northeast: { lat: 37.8, lng: -122.4 },
      southwest: { lat: 37.7, lng: -122.5 },
    },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: routeAPolyline,    },
    legs: [
      {
        geometry: {
          format: 'polyline' as const,
          encoding: 'google',
          precision: 5,
          value: routeAPolyline,        },
        legIndex: 0,
        startLabel: 'San Francisco',
        endLabel: 'Half Moon Bay',
        distanceMeters: 103_000,
        durationSeconds: 5400,
      },
    ],
    overlays: {},
  },
  overlaysPreview: {
    windSummary: 'low',
    rainSummary: 'none',
    temperatureSummary: 'mild',
    conditionsStatus: 'ok',
  },
} as any

const MOCK_ROUTE_PLAN = {
  _id: 'plan-1',
  status: 'completed',
  startLabel: 'San Francisco',
  endLabel: 'Half Moon Bay',
  planInput: {
    start: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
    end: { lat: 37.4636, lng: -122.4286, label: 'Half Moon Bay' },
  },
  result: {
    options: [MOCK_ACTIVE_OPTION],
  },
} as any

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RUX-002: One Route Plot', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockFitToCoordinates.mockClear()
    mockSetCameraPosition.mockClear()
    mockMapRef.current.fitToCoordinates = mockFitToCoordinates
    mockMapRef.current.setCameraPosition = mockSetCameraPosition

    // Default: active route session returning an active option so hasActiveRoute is true
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: MOCK_ACTIVE_OPTION,
      routePlan: MOCK_ROUTE_PLAN,
      newestRoutePlanId: 'plan-1',
    })

    // Default: ride-flow in ROUTE_RESULTS with two distinct routes
    mockUseRideFlow.mockReturnValue({
      state: buildFlowState([routeA, routeB], routeA.routeOptionId),
      dispatch: mockFlowDispatch,
    })

    mockUseQuery.mockReturnValue(undefined)
    mockUseMutation.mockReturnValue(vi.fn())

    // Lazy-import inside each test to avoid module-level require issues
    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1: Only the selected route's polyline is plotted
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-1: plotsOnlySelectedRoute', () => {
    it('plotsOnlySelectedRoute', async () => {
      // GIVEN: plan view in ROUTE_RESULTS with two distinct routes, first selected
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeB], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { queryAllByTestId } = render(createElement(HomeMapScreen))

      // THEN: polyline segments render for the SELECTED route
      // RoutePolyline renders ShapeSources with testID pattern:
      //   `${testID}--segment-${polyline.id ?? index}`
      // The overview polyline id is `${routeId}-overview` when built via useRouteComparison
      await waitFor(() => {
        const segments = queryAllByTestId(/home-route-polyline--segment-/)
        expect(segments.length).toBeGreaterThanOrEqual(1)
      })

      const polylineSegments = queryAllByTestId(/home-route-polyline--segment-/)

      // THEN: no polyline segment IDs should contain the non-selected route's ID
      // The selected route is 'route-efficient', the non-selected is 'route-scenic'
      for (const segment of polylineSegments) {
        const testId = segment.props.testID as string
        expect(testId).not.toMatch(/route-scenic/)
      }

      // THEN: at least one segment has the selected route's ID in it
      const selectedSegments = polylineSegments.filter((s) =>
        (s.props.testID as string).includes('route-efficient'),
      )
      expect(selectedSegments.length).toBeGreaterThanOrEqual(1)
    })

    it('only the selected route has segments — never both routes', async () => {
      // GIVEN: two routes available, first selected
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeB], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { queryAllByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        const segments = queryAllByTestId(/home-route-polyline--segment-/)
        expect(segments.length).toBeGreaterThanOrEqual(1)
      })

      // THEN: segments belong to only ONE route (the selected one)
      const segments = queryAllByTestId(/home-route-polyline--segment-/)
      const routeIds = new Set(
        segments.map((s) => {
          const testId = s.props.testID as string
          // Extract route ID from segment testID pattern
          // Pattern: home-route-polyline--segment-{routeId}-overview or {routeId}-leg-0
          const match = testId.match(/segment-(route-\w+)-/)
          return match ? match[1] : 'unknown'
        }),
      )

      // Exactly one unique route ID appears in the rendered segments
      expect(routeIds.size).toBe(1)
      expect(routeIds.has('route-efficient')).toBe(true)
      expect(routeIds.has('route-scenic')).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2: Paging swaps the plotted route and re-fits the camera
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-2: pagingSwapsPlottedRouteAndRefits', () => {
    it('pagingSwapsPlottedRouteAndRefits', async () => {
      // GIVEN: two distinct routes, first selected and plotted
      let currentState = buildFlowState([routeA, routeB], routeA.routeOptionId)

      mockUseRideFlow.mockReturnValue({
        state: currentState,
        dispatch: mockFlowDispatch,
      })

      const { queryAllByTestId, rerender } = render(createElement(HomeMapScreen))

      // THEN: polyline segments for the first route are present
      await waitFor(() => {
        const segments = queryAllByTestId(/home-route-polyline--segment-/)
        expect(segments.length).toBeGreaterThanOrEqual(1)
      })

      const initialSegments = queryAllByTestId(/home-route-polyline--segment-/)
      const hasRouteEfficient = initialSegments.some((s) =>
        (s.props.testID as string).includes('route-efficient'),
      )
      expect(hasRouteEfficient).toBe(true)

      // WHEN: the rider pages to the second route (selectedRouteId changes)
      currentState = buildFlowState([routeA, routeB], routeB.routeOptionId)
      mockUseRideFlow.mockReturnValue({
        state: currentState,
        dispatch: mockFlowDispatch,
      })

      rerender(createElement(HomeMapScreen))

      // THEN: the plotted polyline segments now correspond to the second route
      await waitFor(() => {
        const pagedSegments = queryAllByTestId(/home-route-polyline--segment-/)
        const hasRouteScenic = pagedSegments.some((s) =>
          (s.props.testID as string).includes('route-scenic'),
        )
        expect(hasRouteScenic).toBe(true)
      })

      // THEN: the map handle receives a fit call for the paged route
      // (fitToCoordinates with the second route's coords, or setCameraPosition for centroid)
      await waitFor(() => {
        const fitCalled = mockFitToCoordinates.mock.calls.length > 0 || mockSetCameraPosition.mock.calls.length > 0
        expect(fitCalled).toBe(true)
      })
    })

    it('fit is called with the paged route coordinates not the old route', async () => {
      // GIVEN: two routes, first selected
      let currentState = buildFlowState([routeA, routeB], routeA.routeOptionId)

      mockUseRideFlow.mockReturnValue({
        state: currentState,
        dispatch: mockFlowDispatch,
      })

      const { rerender, queryAllByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        const segments = queryAllByTestId(/home-route-polyline--segment-/)
        expect(segments.length).toBeGreaterThanOrEqual(1)
      })

      // WHEN: page to the second route
      mockFitToCoordinates.mockClear()
      mockSetCameraPosition.mockClear()

      currentState = buildFlowState([routeA, routeB], routeB.routeOptionId)
      mockUseRideFlow.mockReturnValue({
        state: currentState,
        dispatch: mockFlowDispatch,
      })

      rerender(createElement(HomeMapScreen))

      // THEN: a fit call was made with coordinates from the paged route
      // Route B starts at latitude 37.8549 (Sausalito) vs Route A ends at 37.5936 (HMB)
      await waitFor(() => {
        const allFitCalls = mockFitToCoordinates.mock.calls
        const allCameraCalls = mockSetCameraPosition.mock.calls
        const anyCall = allFitCalls.length > 0 || allCameraCalls.length > 0
        expect(anyCall).toBe(true)

        // Verify the coordinates belong to the paged route (route B / Sausalito)
        if (allFitCalls.length > 0) {
          const coords = allFitCalls[allFitCalls.length - 1][0] as Array<{ latitude: number; longitude: number }>
          // Route B coords should include points around lat 37.80-37.85
          const hasSausalitoArea = coords.some(
            (c) => c.latitude > 37.79 && c.latitude < 37.86,
          )
          expect(hasSausalitoArea).toBe(true)
        }
      })
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: Centroid-only paged route frames at zoom 12 without crashing
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-3: centroidPagedRouteFramesAtZoom12', () => {
    it('centroidPagedRouteFramesAtZoom12', async () => {
      // GIVEN: a centroid-only route (single coordinate, no multi-point geometry)
      // We need the agentActiveOption to be set so doFit has a route to fit
      const centroidActiveOption = {
        routeOptionId: 'route-centroid',
        label: 'Centroid Spot',
        rationale: 'Curated route',
        stats: { distanceMeters: 5000, durationSeconds: 300, legsCount: 0 },
        map: {
          bounds: {
            northeast: { lat: 36.86, lng: -121.39 },
            southwest: { lat: 36.84, lng: -121.41 },
          },
          overviewGeometry: {
            format: 'polyline' as const,
            encoding: 'google',
            precision: 5,
            value: 'og|_F~|}cV', // Pre-encoded single coord at lat=36.85, lng=-121.40
          },
          legs: [],
          overlays: {},
        },
        overlaysPreview: {
          windSummary: 'none',
          rainSummary: 'none',
          temperatureSummary: 'mild',
          conditionsStatus: 'unavailable',
        },
      } as any

      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: centroidActiveOption,
        routePlan: {
          ...MOCK_ROUTE_PLAN,
          _id: 'plan-centroid',
          result: { options: [centroidActiveOption] },
        },
        newestRoutePlanId: 'plan-centroid',
      })

      // Set flow state with the centroid route selected
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([centroidRoute], centroidRoute.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      // WHEN: it becomes the selected/plotted route
      const { queryByTestId } = render(createElement(HomeMapScreen))

      // THEN: the component renders without crashing
      // (RoutePolyline skips single-coordinate polylines, so no segment testIDs,
      //  but the route-on-map-marker confirms the route is active)
      await waitFor(() => {
        expect(queryByTestId('route-on-map-marker')).toBeTruthy()
      })

      // THEN: doFit takes the centroid branch — setCameraPosition zoom 12
      await waitFor(() => {
        expect(mockSetCameraPosition).toHaveBeenCalled()
      })

      // THEN: setCameraPosition was called with zoom 12 centered on the centroid
      const cameraCalls = mockSetCameraPosition.mock.calls
      const lastCall = cameraCalls[cameraCalls.length - 1]
      expect(lastCall).toBeDefined()
      const cameraArgs = lastCall[0]

      // Verify zoom 12
      expect(cameraArgs.zoom).toBe(12)

      // Verify coordinates near the centroid
      expect(cameraArgs.coordinates.latitude).toBeCloseTo(36.85, 0)
      expect(cameraArgs.coordinates.longitude).toBeCloseTo(-121.40, 0)
    })

    it('centroid route does not call fitToCoordinates (wrong branch)', async () => {
      // GIVEN: a centroid-only route
      const centroidActiveOption = {
        routeOptionId: 'route-centroid',
        label: 'Centroid Spot',
        stats: { distanceMeters: 5000, durationSeconds: 300, legsCount: 0 },
        map: {
          bounds: {
            northeast: { lat: 36.86, lng: -121.39 },
            southwest: { lat: 36.84, lng: -121.41 },
          },
          overviewGeometry: {
            format: 'polyline' as const,
            encoding: 'google',
            precision: 5,
            value: 'og|_F~|}cV', // Single coord at lat=36.85, lng=-121.40
          },
          legs: [],
          overlays: {},
        },
        overlaysPreview: {
          windSummary: 'none',
          rainSummary: 'none',
          temperatureSummary: 'mild',
          conditionsStatus: 'unavailable',
        },
      } as any

      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: centroidActiveOption,
        routePlan: {
          ...MOCK_ROUTE_PLAN,
          _id: 'plan-centroid',
          result: { options: [centroidActiveOption] },
        },
        newestRoutePlanId: 'plan-centroid',
      })

      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([centroidRoute], centroidRoute.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      render(createElement(HomeMapScreen))

      // THEN: setCameraPosition is called (centroid branch)
      await waitFor(() => {
        expect(mockSetCameraPosition).toHaveBeenCalled()
      })

      // Verify fitToCoordinates was NOT called with a 1-element array
      // for the centroid route — that would be the wrong branch
      for (const call of mockFitToCoordinates.mock.calls) {
        const coords = call[0] as Array<{ latitude: number; longitude: number }>
        // If called, it should be with more than 1 coordinate (multi-point route)
        // A centroid route should never call fitToCoordinates with 1 coord
        if (coords.length === 1) {
          expect.fail('fitToCoordinates called with single coordinate — should use setCameraPosition')
        }
      }
    })
  })
})
