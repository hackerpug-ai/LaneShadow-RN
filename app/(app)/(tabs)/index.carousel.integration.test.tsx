/**
 * RUX-001 Integration Tests: Route Summary Carousel
 *
 * Scenario-backed integration tests that render the real plan-view screen
 * (index.tsx) with real RouteSummaryCarousel, RouteAttachmentCard, and
 * deduplicateRouteOptions — NOT the carousel component directly.
 *
 * Only the native map boundary (rnmapbox), Convex/network hooks, and
 * unrelated UI components are mocked. The carousel, its card child, and
 * the dedupe reducer run through real code.
 *
 * AC-1: Single carousel card pages between distinct routes (>=2 routes).
 * AC-2: Single distinct route hides the carousel arrows.
 * AC-3: Prev arrow disabled at first route, next disabled at last; disabled press is no-op.
 * AC-4: Covered by lib/routes/dedupe-route-options.test.ts (unit test).
 */

import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: Convex / network boundary — these cannot run in the test harness.
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()
const mockLocalSearchParams = vi.fn(() => ({}))
let mockAutoSendFromChatInput = false
let mockToasts: any[] = []

vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSegments: () => ['app', 'tabs', 'index'],
  useLocalSearchParams: () => mockLocalSearchParams(),
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

// ── useRideFlow: controllable mock ──────────────────────────────────────
// The real hook returns [state, dispatch] from useReducer. We mock it so
// each test can set the exact flowState the carousel reads.

const mockFlowDispatch = vi.fn()

const mockUseRideFlow = vi.fn()
vi.mock('../../../hooks/use-ride-flow', () => ({
  useRideFlow: (...args: unknown[]) => mockUseRideFlow(...args),
}))

// ── useRouteComparison: provides selectRoute that the carousel calls ────

const mockSelectRoute = vi.fn()
vi.mock('../../../hooks/use-route-comparison', () => ({
  useRouteComparison: () => ({
    polylines: [],
    selectRoute: mockSelectRoute,
  }),
}))

vi.mock('../../../hooks/use-toast-messages', () => ({
  useToastMessages: () => ({
    toasts: mockToasts,
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
// ── RouteSummaryCarousel is NOT mocked — it renders through real code ────
vi.mock('../../../components/map/route-tag', () => ({ RouteTag: () => null }))
vi.mock('../../../components/map/search-result-marker', () => ({
  SearchResultMarker: () => null,
}))
vi.mock('../../../components/map/weather-pills-row', () => ({ WeatherPillsRow: () => null }))

// ---------------------------------------------------------------------------
// Mock: chat / input / transcript / menu — not under test
// ---------------------------------------------------------------------------

vi.mock('../../../components/chat', () => {
  const React = require('react')
  return {
    ChatInput: (props: any) => {
      const didSendRef = React.useRef(false)
      React.useEffect(() => {
        if (mockAutoSendFromChatInput && !didSendRef.current) {
          didSendRef.current = true
          void props.onSend('plan a scenic route')
        }
      }, [props.onSend])
      return null
    },
  }
})
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

// ---------------------------------------------------------------------------
// Mock: RouteAttachmentCard children that require native modules / sheets
// (the card itself is NOT mocked — it renders through real code)
// ---------------------------------------------------------------------------

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

// ── deduplicateRouteOptions is NOT mocked — real dedupe runs ────────────

// ---------------------------------------------------------------------------
// NOTE: HomeMapScreen, RouteSummaryCarousel, RouteAttachmentCard, and
// deduplicateRouteOptions are NOT mocked — they render through real code.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Test fixtures — proper PlannedRouteOptionView shape
// ---------------------------------------------------------------------------

const createRouteOption = (
  id: string,
  label: string,
  distanceMeters: number,
  durationSeconds: number,
  startLabel: string = 'San Francisco',
  endLabel: string = 'Half Moon Bay',
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
    bounds: { north: 37.8, south: 37.7, east: -122.4, west: -122.5 },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: `encoded_${id}`,
    },
    legs: [
      {
        start: { lat: 37.77, lng: -122.42, label: startLabel, placeId: 'start' },
        end: { lat: 37.46, lng: -122.43, label: endLabel, placeId: 'end' },
        distanceMeters,
        durationSeconds,
        geometry: {
          format: 'polyline' as const,
          encoding: 'google',
          precision: 5,
          value: `encoded_${id}`,
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

const routeA = createRouteOption('route-efficient', 'Efficient', 103_000, 5400)
const routeB = createRouteOption('route-scenic', 'Scenic Coastal', 125_000, 7200)
const routeC = createRouteOption('route-twisties', 'Twisties', 140_000, 8100)

/** Build a ROUTE_RESULTS flowState with the given route options. */
const buildFlowState = (options: (typeof routeA)[], selectedId?: string | null) => ({
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
      value: 'encoded_route-efficient',
    },
    legs: [
      {
        geometry: {
          format: 'polyline' as const,
          encoding: 'google',
          precision: 5,
          value: 'encoded_route-efficient',
        },
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

describe('RUX-001: Route Summary Carousel', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
  })

  beforeEach(async () => {
    vi.clearAllMocks()

    // Default: active route session returning an active option so hasActiveRoute is true
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: MOCK_ACTIVE_OPTION,
      routePlan: MOCK_ROUTE_PLAN,
      newestRoutePlanId: 'plan-1',
    })

    // Default: ride-flow in ROUTE_RESULTS with two distinct routes
    mockUseRideFlow.mockReturnValue({
      state: buildFlowState([routeA, routeB]),
      dispatch: mockFlowDispatch,
    })

    mockUseQuery.mockReturnValue(undefined)
    mockUseMutation.mockReturnValue(vi.fn())
    mockLocalSearchParams.mockReturnValue({})
    mockAutoSendFromChatInput = false
    mockToasts = []

    // Lazy-import inside each test to avoid module-level require issues
    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1: Single carousel card pages between distinct routes
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-1: pagesBetweenDistinctRoutes', () => {
    it('bridgesChatPlannedRouteToMapAndCarousel', async () => {
      // GIVEN: the rider sends from the home chat input, which raises the
      // map planning overlay before Convex publishes the completed route plan.
      const actualRideFlow = await vi.importActual<typeof import('../../../hooks/use-ride-flow')>(
        '../../../hooks/use-ride-flow',
      )
      const bridgedRoute = {
        ...routeA,
        map: {
          ...routeA.map,
          bounds: {
            northeast: { lat: 37.8, lng: -122.4 },
            southwest: { lat: 37.7, lng: -122.5 },
          },
        },
      }
      mockUseRideFlow.mockImplementation(() => actualRideFlow.useRideFlow())
      mockLocalSearchParams.mockReturnValue({ sessionId: 'planning-session-1' })
      mockAutoSendFromChatInput = true
      mockToasts = [
        {
          id: 'route-response-toast',
          content: 'Route ready',
          timestamp: new Date(),
        },
      ]
      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: bridgedRoute,
        routePlan: {
          ...MOCK_ROUTE_PLAN,
          status: 'running',
          result: undefined,
        },
        newestRoutePlanId: 'plan-1',
      })

      const { queryByTestId } = render(createElement(HomeMapScreen))

      // THEN: a completed chat-planned route is not hidden behind the stale
      // map-planning state, a non-terminal plan status, or a temporarily
      // unavailable plan options array; the map marker and carousel are both
      // backed by the active route.
      await waitFor(() => {
        expect(queryByTestId('route-on-map-marker')).not.toBeNull()
        expect(queryByTestId('route-carousel-container')).not.toBeNull()
      })
    })

    it('pagesBetweenDistinctRoutes', async () => {
      // GIVEN: plan view in ROUTE_RESULTS with 2 distinct routes
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeB], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { queryAllByTestId, getByTestId, queryByTestId } = render(createElement(HomeMapScreen))

      // THEN: exactly one route-summary-card is shown
      await waitFor(() => {
        expect(queryByTestId('route-carousel-container')).not.toBeNull()
      })
      const cards = queryAllByTestId('route-summary-card')
      expect(cards).toHaveLength(1)

      // The card shows the first route (compact: start→end labels)
      const card = getByTestId('route-summary-card')
      expect(card).toBeTruthy()

      // Snapshot the first route's a11y label so we can prove it changed.
      const initialLabel = card.props.accessibilityLabel as string
      expect(initialLabel).toMatch(/64\.0mi/)
      expect(initialLabel).toMatch(/1h 30m/)

      // WHEN: the rider presses the next arrow
      const nextArrow = getByTestId('route-carousel-next-arrow')
      expect(nextArrow).toBeTruthy()

      await act(async () => {
        fireEvent.press(nextArrow)
      })

      // THEN: selectRoute is called with the second route's ID
      // (onRouteChange → selectRoute on the real screen)
      expect(mockSelectRoute).toHaveBeenCalledWith('route-scenic')

      // THEN: the same single card now reflects the paged route (route-scenic)
      const pagedCard = getByTestId('route-summary-card')
      const pagedLabel = pagedCard.props.accessibilityLabel as string
      expect(pagedLabel).not.toBe(initialLabel)
      expect(pagedLabel).toMatch(/77\.7mi/)
      expect(pagedLabel).toMatch(/2h 0m/)

      // THEN: exactly one card is still shown (no stack of cards)
      const cardsAfter = queryAllByTestId('route-summary-card')
      expect(cardsAfter).toHaveLength(1)

      // THEN: the card is still present (not vanished)
      expect(queryByTestId('route-summary-card')).not.toBeNull()

      // Negative control: the old vertical stack (multiple cards) is NOT rendered
      // The carousel only ever shows one card at a time
      expect(queryAllByTestId('route-summary-card').length).toBeLessThanOrEqual(1)
    })

    it('shows exactly one card with 3 distinct routes — never multiple stacked cards', async () => {
      // GIVEN: 3 distinct routes
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeB, routeC], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { queryAllByTestId, queryByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        expect(queryByTestId('route-carousel-container')).not.toBeNull()
      })

      // THEN: only one card renders at a time
      expect(queryAllByTestId('route-summary-card')).toHaveLength(1)
    })

    it('renders an empty-leg curated route card without crashing', async () => {
      const curatedRoute = {
        ...routeA,
        routeOptionId: 'route-curated-centroid',
        label: 'Centroid Loop',
        stats: { ...routeA.stats, legsCount: 0 },
        map: {
          ...routeA.map,
          legs: [],
        },
      }

      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([curatedRoute], curatedRoute.routeOptionId),
        dispatch: mockFlowDispatch,
      })
      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: {
          ...curatedRoute,
          map: {
            ...curatedRoute.map,
            bounds: {
              northeast: { lat: 37.8, lng: -122.4 },
              southwest: { lat: 37.7, lng: -122.5 },
            },
          },
        },
        routePlan: MOCK_ROUTE_PLAN,
        newestRoutePlanId: 'plan-1',
      })

      const { getByTestId, getByText, queryByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        expect(queryByTestId('route-carousel-container')).not.toBeNull()
      })

      expect(getByTestId('route-summary-card')).toBeTruthy()
      expect(getByText('Curated route')).toBeTruthy()
      expect(getByText('Centroid Loop')).toBeTruthy()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2: Single distinct route hides the carousel arrows
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-2: singleRouteHidesArrows', () => {
    it('singleRouteHidesArrows', async () => {
      // GIVEN: options that dedupe to exactly ONE distinct route
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { queryByTestId, getByTestId } = render(createElement(HomeMapScreen))

      // Wait for the carousel to render
      await waitFor(() => {
        expect(queryByTestId('route-carousel-container')).not.toBeNull()
      })

      // THEN: the card shows WITHOUT prev/next arrows
      expect(getByTestId('route-summary-card')).toBeTruthy()
      expect(queryByTestId('route-carousel-prev-arrow')).toBeNull()
      expect(queryByTestId('route-carousel-next-arrow')).toBeNull()
    })

    it('card renders even with one route', async () => {
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { queryByTestId, getByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        expect(queryByTestId('route-carousel-container')).not.toBeNull()
      })

      // THEN: the card is visible
      expect(getByTestId('route-summary-card')).toBeTruthy()
    })

    it('deduped identical variants hide arrows', async () => {
      // GIVEN: two options that share label+distance+geometry → dedupe to ONE
      const routeDup = createRouteOption('route-efficient-dup', 'Efficient', 103_000, 5400)

      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeDup], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { queryByTestId, getByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        expect(queryByTestId('route-carousel-container')).not.toBeNull()
      })

      // After dedupe, only one distinct route → no arrows
      expect(getByTestId('route-summary-card')).toBeTruthy()
      expect(queryByTestId('route-carousel-prev-arrow')).toBeNull()
      expect(queryByTestId('route-carousel-next-arrow')).toBeNull()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: Prev arrow disabled at first route, next disabled at last
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-3: arrowsDisabledAtEnds', () => {
    it('arrowsDisabledAtEnds', async () => {
      // GIVEN: >=3 distinct routes, paged to the FIRST route
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeB, routeC], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { getByTestId } = render(createElement(HomeMapScreen))

      // Wait for the carousel to render
      await waitFor(() => {
        expect(getByTestId('route-carousel-prev-arrow')).toBeTruthy()
      })

      const prevArrow = getByTestId('route-carousel-prev-arrow')
      const nextArrow = getByTestId('route-carousel-next-arrow')

      // THEN: at the FIRST index, prev arrow is disabled
      expect(prevArrow.props.accessibilityState.disabled).toBe(true)

      // AND: pressing the disabled prev arrow is a no-op (selectRoute not called)
      mockSelectRoute.mockClear()
      await act(async () => {
        fireEvent.press(prevArrow)
      })
      expect(mockSelectRoute).not.toHaveBeenCalled()

      // WHEN: press next to advance to index 1
      await act(async () => {
        fireEvent.press(nextArrow)
      })
      expect(mockSelectRoute).toHaveBeenCalledWith('route-scenic')
      mockSelectRoute.mockClear()

      // At index 1, prev is now enabled
      expect(prevArrow.props.accessibilityState.disabled).toBe(false)

      // WHEN: press next again to reach the LAST index (2)
      await act(async () => {
        fireEvent.press(nextArrow)
      })
      expect(mockSelectRoute).toHaveBeenCalledWith('route-twisties')
      mockSelectRoute.mockClear()

      // THEN: at the LAST index, next arrow is disabled
      expect(nextArrow.props.accessibilityState.disabled).toBe(true)

      // AND: pressing the disabled next arrow is a no-op on selectedRouteId
      await act(async () => {
        fireEvent.press(nextArrow)
      })
      expect(mockSelectRoute).not.toHaveBeenCalled()
    })

    it('prev arrow is enabled at non-first index', async () => {
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeB], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { getByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        expect(getByTestId('route-carousel-prev-arrow')).toBeTruthy()
      })

      const prevArrow = getByTestId('route-carousel-prev-arrow')
      const nextArrow = getByTestId('route-carousel-next-arrow')

      // At first index, prev is disabled
      expect(prevArrow.props.accessibilityState.disabled).toBe(true)

      // Press next to advance
      await act(async () => {
        fireEvent.press(nextArrow)
      })

      // Now prev should be enabled
      expect(prevArrow.props.accessibilityState.disabled).toBe(false)
    })

    it('next arrow is enabled at non-last index', async () => {
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState([routeA, routeB], routeA.routeOptionId),
        dispatch: mockFlowDispatch,
      })

      const { getByTestId } = render(createElement(HomeMapScreen))

      await waitFor(() => {
        expect(getByTestId('route-carousel-next-arrow')).toBeTruthy()
      })

      const nextArrow = getByTestId('route-carousel-next-arrow')

      // At first index, next is enabled
      expect(nextArrow.props.accessibilityState.disabled).toBe(false)
    })
  })
})
