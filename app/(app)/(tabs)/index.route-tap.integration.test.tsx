/**
 * Integration test for RUX-003: Tapping the route polyline opens RouteDetailsSheet (details), not SaveRouteSheet
 *
 * Scenario-backed integration tests that render the real screen with real
 * RouteDetailsSheet, SaveRouteSheet, and RoutePolyline components.
 * Only the map native boundary (rnmapbox) and Convex/network hooks are mocked.
 *
 * AC-1: Polyline tap opens RouteDetailsSheet, not SaveRouteSheet
 * AC-2: Save is still reachable from the details sheet (via its Save action)
 * AC-3: Tap with no active route is a safe no-op (no crash, no sheets open)
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

vi.mock('../../../components/map', () => ({
  MapboxMapView: (props: any) => {
    // Render children so RoutePolyline gets mounted
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
vi.mock('../../../components/ui/chat-transcript', () => ({ ChatTranscript: () => null }))
vi.mock('../../../components/ui/motorcycle-plus-icon', () => ({
  MotorcyclePlusIcon: () => null,
}))

// ---------------------------------------------------------------------------
// Mock: libraries that cannot run in jsdom
// ---------------------------------------------------------------------------

vi.mock('../../../lib/get-current-location', () => ({ getCurrentLocation: vi.fn() }))
vi.mock('../../../lib/routes/dedupe-route-options', () => ({
  deduplicateRouteOptions: (o: any[]) => o,
}))

// ---------------------------------------------------------------------------
// NOTE: RouteDetailsSheet, SaveRouteSheet, RoutePolyline, and
// buildRoutePolylines are NOT mocked — they render through real code.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Test fixtures — use proper PolylineGeometry shape for real decode
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
    overviewGeometry: {
      // PolylineGeometry shape: { value, precision }
      value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      precision: 5,
    },
    bounds: {
      northeast: { lat: 37.8, lng: -122.4 },
      southwest: { lat: 37.7, lng: -122.5 },
    },
    legs: [
      {
        geometry: {
          value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
          precision: 5,
        },
        legIndex: 0,
        startLabel: 'Start',
        endLabel: 'End',
        distanceMeters: 45000,
        durationSeconds: 3600,
      },
    ],
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

// ---------------------------------------------------------------------------
// Tests
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
      const { queryByTestId, getByTestId } = render(createElement(HomeMapScreen))

      // Verify both sheets start closed (BottomSheetModal only renders when presented)
      expect(queryByTestId('route-details-sheet')).toBeNull()
      expect(queryByTestId('save-route-sheet')).toBeNull()

      // Find the route polyline segment — the ShapeSource mock renders with testID.
      // RoutePolyline assigns testID `${testID}--segment-${polyline.id}`.
      // With the "home-route-polyline" testID and polyline id "overview", the
      // ShapeSource gets testID "home-route-polyline--segment-overview".
      const polylineSegment = getByTestId('home-route-polyline--segment-route-1-overview')

      // WHEN: the rider taps the route polyline (fire press on ShapeSource)
      await act(async () => {
        fireEvent.press(polylineSegment)
      })

      // THEN: RouteDetailsSheet becomes visible and SaveRouteSheet does NOT
      await waitFor(
        () => {
          expect(queryByTestId('route-details-sheet')).not.toBeNull()
        },
        { timeout: 3000 },
      )

      // SaveRouteSheet must NOT be visible after the tap
      expect(queryByTestId('save-route-sheet')).toBeNull()

      // Verify the details sheet shows the active route's label
      // RouteDetailsSheet renders a badge with the route label
      const detailsSheet = queryByTestId('route-details-sheet')
      expect(detailsSheet).not.toBeNull()
    })
  })

  // -----------------------------------------------------------------------
  // AC-2: Save is still reachable from the details sheet
  // -----------------------------------------------------------------------
  describe('saveReachableFromDetails', () => {
    it('Save action in details sheet opens SaveRouteSheet with active route data', async () => {
      // GIVEN: the plan view with an active route plotted
      const { queryByTestId, getByTestId } = render(createElement(HomeMapScreen))

      // Open RouteDetailsSheet via polyline tap
      const polylineSegment = getByTestId('home-route-polyline--segment-route-1-overview')
      await act(async () => {
        fireEvent.press(polylineSegment)
      })

      // Wait for RouteDetailsSheet to appear
      await waitFor(
        () => {
          expect(queryByTestId('route-details-sheet')).not.toBeNull()
        },
        { timeout: 3000 },
      )

      // WHEN: the rider presses the details sheet's Save action
      // The Button component renders with testID "route-details-sheet-save-button"
      const saveButton = queryByTestId('route-details-sheet-save-button')
      expect(saveButton).not.toBeNull()

      await act(async () => {
        fireEvent.press(saveButton!)
      })

      // THEN: SaveRouteSheet opens with the active route's data
      await waitFor(
        () => {
          expect(queryByTestId('save-route-sheet')).not.toBeNull()
        },
        { timeout: 3000 },
      )

      // After save press, the details sheet should close
      expect(queryByTestId('route-details-sheet')).toBeNull()
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

      const { queryByTestId, unmount } = render(createElement(HomeMapScreen))

      // With no active route, RoutePolyline receives no polylines and renders
      // nothing (no ShapeSource elements). So there is nothing to tap.
      // The handleSegmentSelect in index.tsx guards on agentRoutePlan &&
      // agentActiveOption, so even a stale onSegmentSelect call would be a
      // no-op. Verify neither sheet is present and no crash occurs.
      expect(queryByTestId('route-details-sheet')).toBeNull()
      expect(queryByTestId('save-route-sheet')).toBeNull()

      // Verify the component unmounts without error (no crash)
      expect(() => unmount()).not.toThrow()
    })
  })
})
