/**
 * Integration test for RUX-003: Tapping the route polyline opens RouteDetailsSheet (details), not SaveRouteSheet
 *
 * AC-1: Polyline tap opens RouteDetailsSheet, not SaveRouteSheet
 * AC-2: Save is still reachable from the details sheet (via its Save action)
 * AC-3: Tap with no active route is a safe no-op (no crash, no sheets open)
 */

import { act, cleanup, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: convex/react
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

vi.mock('../../../contexts/search-results', () => ({
  useSearchResults: () => ({
    results: [],
    selectedResultId: null,
    setSelectedResultId: vi.fn(),
    clearResults: vi.fn(),
  }),
}))

vi.mock('../../../contexts/selected-route', () => ({
  useSelectedRoute: () => ({
    selectedRouteId: null,
    setSelectedRouteId: vi.fn(),
    displayedRoutePlanId: null,
    setDisplayedRoutePlanId: vi.fn(),
    requestFitToRoute: vi.fn(),
    requestFitToRouteWithReset: vi.fn(),
    registerFitHandler: vi.fn(),
  }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

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

vi.mock('../../../hooks/use-ride-flow', () => ({
  useRideFlow: () => ({
    state: { phase: 'IDLE' },
    dispatch: vi.fn(),
  }),
}))

vi.mock('../../../hooks/use-route-comparison', () => ({
  useRouteComparison: () => ({
    polylines: [],
    selectRoute: vi.fn(),
  }),
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        background: { default: '#0b0b0c' },
        surface: { default: '#1a1a2e', secondary: '#2a2a4e', glass: 'rgba(26,26,46,0.72)' },
        onSurface: { default: '#ffffff', subtle: '#a0a0b0' },
        onPrimary: { default: '#ffffff' },
        primary: { default: '#D4A373' },
        border: { default: '#333355' },
        success: { default: '#4CAF50' },
        warning: { default: '#FF9800' },
      },
      space: { sm: 8, md: 16, lg: 24, xl: 32, '3xl': 48 },
      radius: { md: 8, lg: 12 },
    },
  }),
}))

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
// Mock: components — spy-based approach for prop verification
// ---------------------------------------------------------------------------

const RoutePolylineSpy = vi.fn(() => null)
const RouteDetailsSheetSpy = vi.fn(() => null)
const SaveRouteSheetSpy = vi.fn(() => null)

vi.mock('../../../components/map/route-polyline-component', () => ({
  RoutePolyline: RoutePolylineSpy,
}))
vi.mock('../../../components/map', () => ({
  MapboxMapView: (props: any) => {
    // Render children so RoutePolyline gets rendered
    if (props?.children) return props.children
    return null
  },
}))
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
vi.mock('../../../components/map/route-polyline', () => ({ buildRoutePolylines: () => [] }))
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
  RouteDetailsSheet: RouteDetailsSheetSpy,
}))
vi.mock('../../../components/ui/save-favorite-sheet', () => ({
  SaveRouteSheet: SaveRouteSheetSpy,
}))
vi.mock('../../../components/ui/chat-transcript', () => ({ ChatTranscript: () => null }))
vi.mock('../../../components/ui/motorcycle-plus-icon', () => ({
  MotorcyclePlusIcon: () => null,
}))
vi.mock('../../../lib/get-current-location', () => ({ getCurrentLocation: vi.fn() }))
vi.mock('../../../lib/routes/dedupe-route-options', () => ({
  deduplicateRouteOptions: (o: any[]) => o,
}))
vi.mock('../../../shared/lib/polyline', () => ({
  computeCumulativeDistances: vi.fn(() => [0, 1]),
  decodePolylineGeometry: vi.fn(() => [{ latitude: 0, longitude: 0 }]),
}))
vi.mock('../../../convex/_generated/api', () => ({
  api: {
    db: {
      planningSessions: { listSessions: 'x' },
      sessionMessages: { list: 'x' },
      routePlans: { createCuratedRoutePlan: 'x' },
      favoriteRoads: { list: 'x' },
    },
  },
}))
vi.mock('../../../convex/_generated/dataModel', () => ({
  Id: { planning_sessions: String },
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function lastProps(spy: vi.Mock): any {
  const calls = spy.mock.calls
  if (calls.length === 0) return undefined
  return calls[calls.length - 1][0]
}

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const MOCK_ACTIVE_OPTION = {
  routeOptionId: 'route-1',
  label: 'Scenic Coastal',
  rationale: 'A beautiful coastal route with ocean views',
  stats: {
    distanceMeters: 45000,
    durationSeconds: 3600,
    legsCount: 1,
  },
  map: {
    overviewGeometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    bounds: {
      northeast: { lat: 37.8, lng: -122.4 },
      southwest: { lat: 37.7, lng: -122.5 },
    },
    legs: [],
    overlays: {},
  },
  overlaysPreview: {
    windSummary: 'calm',
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

const MOCK_SEGMENT_SELECT_DATA = {
  geometry: 'encoded_polyline_string',
  bounds: {
    northEast: { latitude: 37.8, longitude: -122.4 },
    southWest: { latitude: 37.7, longitude: -122.5 },
  },
  legIndex: 0,
  segmentType: 'overview' as const,
  segmentId: 'overview-0',
}

// ---------------------------------------------------------------------------
// Tests — use dynamic import to avoid module-level require issues
// ---------------------------------------------------------------------------

describe('RUX-003: Route polyline tap behavior', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: MOCK_ACTIVE_OPTION,
      routePlan: MOCK_ROUTE_PLAN,
      newestRoutePlanId: 'plan-1',
    })
    mockUseQuery.mockReturnValue(undefined)
    mockUseMutation.mockReturnValue(vi.fn())

    // Lazy-import inside each test to avoid module-level require issues
    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // -----------------------------------------------------------------------
  // AC-1: Polyline tap opens RouteDetailsSheet, not SaveRouteSheet
  // -----------------------------------------------------------------------
  describe('tapOpensDetailsNotSave', () => {
    it('tapping the route polyline opens RouteDetailsSheet, not SaveRouteSheet', async () => {
      // GIVEN: plan view with an active route plotted and both sheets closed
      render(createElement(HomeMapScreen))

      // Verify both sheets start closed
      expect(lastProps(RouteDetailsSheetSpy)?.isVisible).toBeFalsy()
      expect(lastProps(SaveRouteSheetSpy)?.visible).toBeFalsy()

      // Capture onSegmentSelect from RoutePolyline props
      const onSegmentSelect = lastProps(RoutePolylineSpy)?.onSegmentSelect
      expect(onSegmentSelect).toBeDefined()

      // WHEN: the rider taps the route polyline (onSegmentSelect fires)
      await act(async () => {
        onSegmentSelect(MOCK_SEGMENT_SELECT_DATA)
      })

      // THEN: RouteDetailsSheet becomes visible and SaveRouteSheet does NOT
      await waitFor(() => {
        expect(lastProps(RouteDetailsSheetSpy)?.isVisible).toBe(true)
      })
      expect(lastProps(SaveRouteSheetSpy)?.visible).toBeFalsy()

      // Verify the details sheet has the route with the right label and testID
      expect(lastProps(RouteDetailsSheetSpy)?.route?.label).toBe('Scenic Coastal')
      expect(lastProps(RouteDetailsSheetSpy)?.testID).toBe('route-details-sheet')
    })
  })

  // -----------------------------------------------------------------------
  // AC-2: Save is still reachable from the details sheet
  // -----------------------------------------------------------------------
  describe('saveReachableFromDetails', () => {
    it('Save action in details sheet opens SaveRouteSheet with active route data', async () => {
      // GIVEN: the plan view with an active route plotted
      render(createElement(HomeMapScreen))

      // Open RouteDetailsSheet via polyline tap
      const onSegmentSelect = lastProps(RoutePolylineSpy)?.onSegmentSelect
      await act(async () => {
        onSegmentSelect(MOCK_SEGMENT_SELECT_DATA)
      })

      // Verify RouteDetailsSheet is open and has onSave callback
      await waitFor(() => {
        expect(lastProps(RouteDetailsSheetSpy)?.isVisible).toBe(true)
      })

      const onSaveCallback = lastProps(RouteDetailsSheetSpy)?.onSave
      expect(onSaveCallback).toBeDefined()

      // WHEN: the rider presses the details sheet's Save action (invoke onSave)
      await act(async () => {
        onSaveCallback()
      })

      // THEN: SaveRouteSheet opens with the active route's data
      await waitFor(() => {
        expect(lastProps(SaveRouteSheetSpy)?.visible).toBe(true)
      })

      // Verify the save sheet carries the active route's suggested name
      expect(lastProps(SaveRouteSheetSpy)?.routeData?.suggestedName).toBe(
        'San Francisco \u2192 Half Moon Bay',
      )

      // After save press, the details sheet should close
      expect(lastProps(RouteDetailsSheetSpy)?.isVisible).toBe(false)
    })
  })

  // -----------------------------------------------------------------------
  // AC-3: Tap with no active route is a safe no-op
  // -----------------------------------------------------------------------
  describe('tapNoRouteIsNoop', () => {
    it('segment-select with no active route opens neither sheet and does not crash', async () => {
      // GIVEN: plan view with NO active route
      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: null,
        routePlan: null,
        newestRoutePlanId: null,
      })

      // WHEN: rendering with no route and firing segment-select
      const result = render(createElement(HomeMapScreen))

      // Fire segment select (stale event with no route)
      // capturedOnSegmentSelect may be undefined if no RoutePolyline renders
      const onSegmentSelect = lastProps(RoutePolylineSpy)?.onSegmentSelect
      if (onSegmentSelect) {
        await act(async () => {
          onSegmentSelect(MOCK_SEGMENT_SELECT_DATA)
        })
      }

      // THEN: neither sheet opens and no crash occurs
      expect(lastProps(RouteDetailsSheetSpy)?.isVisible).toBeFalsy()
      expect(lastProps(SaveRouteSheetSpy)?.visible).toBeFalsy()

      // Verify the component unmounts without error (no crash)
      expect(() => result.unmount()).not.toThrow()
    })
  })
})
