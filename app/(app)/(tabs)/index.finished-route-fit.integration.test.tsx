/**
 * RUX-008 Integration Tests: Auto-plot + camera-fit a finished route
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL doFit seam, RoutePolyline, and the real
 * chat→map mount/unmount gating (`mapMounted`). Only the native map boundary
 * (rnmapbox / MapboxMapView), Convex/network hooks, and unrelated UI are
 * mocked.
 *
 * Faithfulness: the MapboxMapView forwardRef mock only sets the imperative
 * `mapRef` WHEN the component is actually rendered. The parent renders
 * MapboxMapView only when `mapMounted && initialCameraReady`. While
 * `chatMode === true`, `mapMounted` is false → the map is unmounted → React
 * nulls `ref.current` → `doFit` defers via `pendingFitRef`. This faithfully
 * reproduces the production bug where a route finishing in chat mode is left
 * stranded until a manual toggle.
 *
 * AC-2: A completed multi-point route flips to map and fits the WHOLE route.
 * AC-3: Centroid-only route frames once; the guard prevents re-yanking.
 */

import { cleanup, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: Convex / network boundary — cannot run in the test harness.
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
}))

// Controllable per-test local search params (so we can start in chat mode).
let localSearchParams: Record<string, string | undefined> = {}
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSegments: () => ['app', 'tabs', 'index'],
  useLocalSearchParams: () => localSearchParams,
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
// Mock: @rnmapbox/maps — ShapeSource/LineLayer render real Views so the real
// RoutePolyline produces segment testIDs the tests can query.
// ---------------------------------------------------------------------------

vi.mock('@rnmapbox/maps', () => {
  const { createElement } = require('react')
  return {
    ShapeSource: (props: any) => createElement('View', { testID: props.testID }, props.children),
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

// Fit-spy handle — the imperative map ref exposed via the components/map mock.
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
  mockRegisterFitHandler._lastHandler = handler
})
;(mockRegisterFitHandler as any)._lastHandler = null
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
// Mock: hooks requiring Convex / native services
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

const mockFlowDispatch = vi.fn()
const mockUseRideFlow = vi.fn()
vi.mock('../../../hooks/use-ride-flow', () => ({
  useRideFlow: (...args: unknown[]) => mockUseRideFlow(...args),
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
// Mock: semantic theme (real components consume this shape)
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
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000',
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
// Mock: native map boundary — MapboxMapView exposes the fit-spy via forwardRef
// ONLY when actually rendered. The parent renders it only while
// `mapMounted && initialCameraReady`, so while chatMode is true the ref is
// null and doFit faithfully defers.
// ---------------------------------------------------------------------------

vi.mock('../../../components/map', () => {
  const { forwardRef } = require('react')
  return {
    MapboxMapView: forwardRef((props: any, ref: any) => {
      if (typeof ref === 'function') ref(mockMapRef.current)
      else if (ref && typeof ref === 'object') ref.current = mockMapRef.current
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

// Capture the real onToggleChatMode handler so tests can enter chat mode via
// the SAME callback the production toggle button uses (faithful — avoids the
// chatParam='1' deep-link path, which re-asserts chatMode and would mask the
// auto-switch under test).
let chatToggleHandler: (() => void) | null = null
vi.mock('../../../components/chat', () => ({
  ChatInput: (props: any) => {
    chatToggleHandler = props.onToggleChatMode
    return null
  },
}))
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

vi.mock('../../../lib/get-current-location', () => ({ getCurrentLocation: vi.fn() }))

// ---------------------------------------------------------------------------
// Fixtures — real-encoded polylines (same encoding as RUX-002 fixtures)
// ---------------------------------------------------------------------------

// Multi-point polyline: decodes to 3 coords
//   [{lat:37.7749,lng:-122.4194}, {lat:37.6849,lng:-122.4294}, {lat:37.5936,lng:-122.4394}]
const multiPointPolyline = 'c|peFf`ejVnqPn}@ryPn}@'
// Centroid polyline: decodes to 1 coord [{lat:36.85, lng:-121.40}]
const centroidPolyline = 'og|_F~|}cV'

const buildMultiPointOption = () =>
  ({
    routeOptionId: 'route-multipoint',
    label: 'Twisties',
    rationale: 'Scenic twisties route',
    stats: { distanceMeters: 103_000, durationSeconds: 5400, legsCount: 1 },
    map: {
      bounds: {
        northeast: { lat: 37.85, lng: -122.42 },
        southwest: { lat: 37.59, lng: -122.49 },
      },
      overviewGeometry: {
        format: 'polyline' as const,
        encoding: 'google',
        precision: 5,
        value: multiPointPolyline,
      },
      legs: [
        {
          geometry: {
            format: 'polyline' as const,
            encoding: 'google',
            precision: 5,
            value: multiPointPolyline,
          },
          legIndex: 0,
          startLabel: 'Asheville',
          endLabel: 'Blue Ridge',
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
  }) as any

const buildCentroidOption = () =>
  ({
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
        value: centroidPolyline,
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
  }) as any

const buildCompletedPlan = (planId: string, option: any) =>
  ({
    _id: planId,
    status: 'completed',
    startLabel: 'Asheville',
    endLabel: 'Blue Ridge',
    planInput: {
      start: { lat: 35.5951, lng: -82.5515, label: 'Asheville' },
      end: { lat: 35.4595, lng: -82.5315, label: 'Blue Ridge' },
    },
    result: { options: [option] },
  }) as any

/** Build a ROUTE_RESULTS flowState with the given option selected. */
const buildFlowState = (option: any) => ({
  phase: 'ROUTE_RESULTS' as const,
  sessionId: 'test-session',
  routeOptions: {
    planId: 'test-plan',
    options: [option],
  },
  selectedRouteId: option.routeOptionId,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RUX-008: Finished-Route Auto-Plot + Camera-Fit', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
    localSearchParams = {}
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockFitToCoordinates.mockClear()
    mockSetCameraPosition.mockClear()
    mockMapRef.current.fitToCoordinates = mockFitToCoordinates
    mockMapRef.current.setCameraPosition = mockSetCameraPosition
    chatToggleHandler = null
    localSearchParams = {}

    mockUseQuery.mockReturnValue(undefined)
    mockUseMutation.mockReturnValue(vi.fn())

    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2: A completed multi-point route flips to map and fits the WHOLE route
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-2: finishedMultiPointRouteAutoPlotsAndFitsWholeRoute', () => {
    it('finishedMultiPointRouteAutoPlotsAndFitsWholeRoute', async () => {
      // GIVEN: rider in MAP mode, an agent discovery in PLANNING (no completed
      // plan yet). flowState is PLANNING so the completion bridge will fire
      // once the plan resolves.
      localSearchParams = {}

      const multiPointOption = buildMultiPointOption()
      const completedPlan = buildCompletedPlan('plan-multipoint-1', multiPointOption)

      // Phase 1: agent still planning — no active route yet.
      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: null,
        routePlan: null,
        newestRoutePlanId: null,
      })
      mockUseRideFlow.mockReturnValue({
        state: { phase: 'PLANNING' as const, sessionId: 'test-session' },
        dispatch: mockFlowDispatch,
      })

      const { rerender } = render(createElement(HomeMapScreen))

      // Wait for the map layer to mount in map mode (mapMounted && camera ready).
      await waitFor(
        () => {
          expect(chatToggleHandler).not.toBeNull()
        },
        { timeout: 3000 },
      )

      // WHEN: the rider enters chat mode via the real toggle callback (the same
      // path the production button uses — NOT the chatParam deep-link, which
      // would re-assert chatMode and mask the auto-switch under test).
      chatToggleHandler!()

      // Let the chat→unmount transition settle (chatMode effect defers the
      // mapMounted=false flip by CHAT_TRANSITION_MS+60 ≈ 320ms). After it
      // fires the map is unmounted → mapRef.current is null → doFit defers.
      await new Promise((resolve) => setTimeout(resolve, 500))

      // WHEN: the agent route completes WHILE the rider is in chat mode. The
      // multi-point plan resolves for the first time.
      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: multiPointOption,
        routePlan: completedPlan,
        newestRoutePlanId: 'plan-multipoint-1',
      })
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState(multiPointOption),
        dispatch: mockFlowDispatch,
      })
      // Clear any fit calls captured during the initial map-mode mount so the
      // assertion is scoped to the completion-in-chat fit.
      mockFitToCoordinates.mockClear()
      mockSetCameraPosition.mockClear()

      rerender(createElement(HomeMapScreen))

      // THEN: the app auto-switches from chat to map (chatMode flips false) →
      // the map remounts → doFit flushes via the pending-fit seam and takes the
      // multi-point branch: fitToCoordinates called with coords.length > 1
      // (whole route), NOT the centroid setCameraPosition branch.
      //
      // fitToCoordinates can only run once mapRef.current is available, which
      // only happens after the map remounts — which only happens after chatMode
      // flips false. So this assertion transitively proves the auto-switch.
      await waitFor(
        () => {
          expect(mockFitToCoordinates).toHaveBeenCalled()
        },
        { timeout: 5000 },
      )

      const fitCalls = mockFitToCoordinates.mock.calls
      expect(fitCalls.length).toBeGreaterThanOrEqual(1)
      const coords = fitCalls[fitCalls.length - 1][0] as Array<{
        latitude: number
        longitude: number
      }>
      expect(coords.length).toBeGreaterThan(1)

      // THEN: the centroid branch was NOT taken for a multi-point route.
      expect(mockSetCameraPosition).not.toHaveBeenCalled()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: Centroid-only route frames once; guard prevents re-yanking
  // ─────────────────────────────────────────────────────────────────────────
  describe('AC-3: centroidRouteFramesOnceAndDoesNotReYank', () => {
    it('centroidRouteFramesOnceAndDoesNotReYank', async () => {
      // GIVEN: rider in MAP mode (no chat param → chatMode false, map mounted),
      // with a centroid-only completed plan.
      localSearchParams = {}

      const centroidOption = buildCentroidOption()
      const completedPlan = buildCompletedPlan('plan-centroid-1', centroidOption)

      mockUseActiveSessionRoute.mockReturnValue({
        activeOption: centroidOption,
        routePlan: completedPlan,
        newestRoutePlanId: 'plan-centroid-1',
      })
      mockUseRideFlow.mockReturnValue({
        state: buildFlowState(centroidOption),
        dispatch: mockFlowDispatch,
      })

      const { rerender } = render(createElement(HomeMapScreen))

      // THEN: doFit takes the centroid branch — setCameraPosition zoom 12,
      // centered on the single decoded coordinate.
      await waitFor(
        () => {
          expect(mockSetCameraPosition).toHaveBeenCalled()
        },
        { timeout: 4000 },
      )

      const cameraCalls = mockSetCameraPosition.mock.calls
      const lastCall = cameraCalls[cameraCalls.length - 1]
      expect(lastCall).toBeDefined()
      const cameraArgs = lastCall[0]
      expect(cameraArgs.zoom).toBe(12)
      expect(cameraArgs.coordinates.latitude).toBeCloseTo(36.85, 1)
      expect(cameraArgs.coordinates.longitude).toBeCloseTo(-121.4, 1)

      // Capture the fit call count after the initial frame, then re-render
      // with the SAME plan id. The lastFittedPlanIdRef guard must prevent a
      // re-fit (no re-yanking).
      const fitCountAfterFrame = mockSetCameraPosition.mock.calls.length
      const fitToCoordsCountAfterFrame = mockFitToCoordinates.mock.calls.length

      rerender(createElement(HomeMapScreen))

      // Allow any pending microtasks/effects to settle.
      await new Promise((resolve) => setTimeout(resolve, 50))

      // THEN: no additional fit calls — the guard prevented re-fitting on a
      // re-render of the same (already-fitted) plan.
      expect(mockSetCameraPosition.mock.calls.length).toBe(fitCountAfterFrame)
      expect(mockFitToCoordinates.mock.calls.length).toBe(fitToCoordsCountAfterFrame)
    })
  })
})
