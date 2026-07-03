/**
 * REDHAT-FIX-003 / RUX-004 Integration Tests: On-route tag label/distance + tap→details + paging
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL doFit seam, selectedOption derivation, and
 * handleRouteTagPress wiring. Only the native map boundary (rnmapbox /
 * MapboxMapView), Convex/network hooks, and unrelated UI are mocked.
 *
 * The RouteTag component itself is stubbed with an adapter that uses the REAL
 * pure `buildRouteTagText` helper to render the archetype + distance text —
 * the real RouteTag renders via Mapbox MarkerView which the jsdom harness
 * cannot anchor, so the adapter surfaces the same observable text + testID
 * the production component produces. The wiring under test (index.tsx passing
 * archetype + distanceMeters + onPress) is exercised through real code.
 *
 * RouteDetailsSheet / SaveRouteSheet are stubbed as conditional adapters that
 * render their testID only when `isVisible`/`visible` is true — mirroring the
 * production `if (!visible) return null` contract — so presence/absence is
 * observable.
 *
 * AC-1 (tagShowsLabelAndDistance + tagTapOpensDetails + tagFollowsPaging):
 *   - route-tag present with archetype label + distance text (e.g. /Scenic.*78mi/)
 *   - tapping route-tag opens route-details-sheet (NOT save-route-sheet)
 *   - paging to a second route leaves exactly ONE route-tag
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
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

// rnmapbox: ShapeSource/LineLayer render real Views so RoutePolyline (real)
// produces segment testIDs the tests can query.
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
const mockRegisterFitHandler = vi.fn()
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
// Mock: native map boundary — MapboxMapView exposes the ref via forwardRef
// ONLY when actually rendered (while mapMounted && initialCameraReady).
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
vi.mock('../../../components/map/search-result-marker', () => ({
  SearchResultMarker: () => null,
}))
vi.mock('../../../components/map/weather-pills-row', () => ({ WeatherPillsRow: () => null }))

// ---------------------------------------------------------------------------
// Mock: RouteTag — adapter that uses the REAL pure buildRouteTagText helper to
// surface the archetype + distance text + testID the production component
// produces. The real RouteTag anchors via Mapbox MarkerView which jsdom cannot
// position; this adapter renders the same observable text through a tappable
// TouchableOpacity so press wiring is also exercised.
// ---------------------------------------------------------------------------

vi.mock('../../../components/map/route-tag', async (importOriginal) => {
  const { createElement } = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  const original = await importOriginal<any>()
  return {
    ...original,
    RouteTag: (props: any) => {
      const tagText = original.buildRouteTagText({
        archetype: props.archetype,
        distanceMeters: props.distanceMeters,
      })
      return createElement(
        TouchableOpacity,
        {
          testID: props.testID ?? `route-tag-${props.routeId}`,
          onPress: () => props.onPress?.(props.routeId),
          accessibilityRole: 'button',
        },
        createElement(Text, null, tagText),
      )
    },
  }
})

// ---------------------------------------------------------------------------
// Mock: RouteDetailsSheet / SaveRouteSheet — conditional adapters that render
// their testID only when visible (mirrors production `if (!visible) return null`).
// ---------------------------------------------------------------------------

vi.mock('../../../components/sheets/route-details-sheet', () => {
  const { createElement } = require('react')
  return {
    RouteDetailsSheet: (props: any) =>
      props.isVisible
        ? createElement('View', { testID: props.testID ?? 'route-details-sheet' })
        : null,
  }
})

vi.mock('../../../components/ui/save-favorite-sheet', () => {
  const { createElement } = require('react')
  return {
    SaveRouteSheet: (props: any) =>
      props.visible ? createElement('View', { testID: 'save-route-sheet' }) : null,
  }
})

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

// Multi-point polyline decoding to 3 coords:
//   [{lat:37.7749,lng:-122.4194}, {lat:37.6849,lng:-122.4294}, {lat:37.5936,lng:-122.4394}]
const multiPointPolyline = 'c|peFf`ejVnqPn}@ryPn}@'
// Second multi-point polyline decoding to 3 coords (different geometry):
//   [{lat:37.7749,lng:-122.4194}, {lat:37.8049,lng:-122.4654}, {lat:37.8549,lng:-122.4894}]
const secondPolyline = 'c|peFf`ejVozDn~GowH~tC'

const createRouteOption = (
  id: string,
  label: string,
  encodedPolyline: string,
  distanceMeters: number,
  durationSeconds: number,
) => ({
  routeOptionId: id,
  label,
  rationale: `${label} route`,
  stats: { distanceMeters, durationSeconds, legsCount: 1 },
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
        start: { lat: 37.77, lng: -122.42, label: 'San Francisco', placeId: 'start' },
        end: { lat: 37.59, lng: -122.44, label: 'Destination', placeId: 'end' },
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

// Scenic route: 125_000m → Math.round(125000/1609.34) === 78mi
const scenicRoute = createRouteOption(
  'route-scenic',
  'Scenic Coastal',
  multiPointPolyline,
  125_000,
  7200,
)
// Second route for paging (Twisties, different distance).
const twistiesRoute = createRouteOption(
  'route-twisties',
  'Twisties Loop',
  secondPolyline,
  64_000,
  3600,
)

/** Build a ROUTE_RESULTS flowState with the given options + selected id. */
const buildFlowState = (options: any[], selectedId?: string | null) => ({
  phase: 'ROUTE_RESULTS' as const,
  sessionId: 'test-session',
  routeOptions: { planId: 'test-plan', options },
  selectedRouteId: selectedId ?? options[0]?.routeOptionId ?? null,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RUX-004: On-route tag label/distance, tap→details, paging', () => {
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

    // No agent-active route: the carousel/flow selectedRouteId drives the tag
    // via `selectedOption`, so paging swaps the rendered tag.
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: null,
      routePlan: null,
      newestRoutePlanId: null,
    })

    mockUseQuery.mockReturnValue([])
    mockUseMutation.mockReturnValue(vi.fn())

    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1a: route-tag shows archetype label + distance
  // ─────────────────────────────────────────────────────────────────────────
  it('tagShowsLabelAndDistance', async () => {
    mockUseRideFlow.mockReturnValue({
      state: buildFlowState([scenicRoute, twistiesRoute], scenicRoute.routeOptionId),
      dispatch: mockFlowDispatch,
    })

    const { findByTestId, getByText } = render(createElement(HomeMapScreen))

    // The route-tag renders inside the mounted map layer; wait for it.
    const tag = await findByTestId('route-tag')
    expect(tag).toBeTruthy()

    // The tag label includes the capitalised archetype and the rounded mileage.
    // 125_000m / 1609.34 = 77.67 → Math.round === 78
    // Observable via the rendered Text content (non-degenerate: real label + distance).
    const tagLabel = getByText(/Scenic.*78mi/)
    expect(tagLabel).toBeTruthy()
    // Negative controls: no placeholder mileage, no zero-for-nonzero.
    expect(getByText(/Scenic.*78mi/).props.children).toMatch(/Scenic.*78mi/)
    expect(() => getByText(/--mi/)).toThrow()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1b: tapping route-tag opens RouteDetailsSheet (not SaveRouteSheet)
  // ─────────────────────────────────────────────────────────────────────────
  it('tagTapOpensDetails', async () => {
    mockUseRideFlow.mockReturnValue({
      state: buildFlowState([scenicRoute, twistiesRoute], scenicRoute.routeOptionId),
      dispatch: mockFlowDispatch,
    })

    const { findByTestId, queryByTestId } = render(createElement(HomeMapScreen))

    const tag = await findByTestId('route-tag')

    // Before tap: neither sheet is open.
    expect(queryByTestId('route-details-sheet')).toBeNull()
    expect(queryByTestId('save-route-sheet')).toBeNull()

    fireEvent.press(tag)

    // After tap: the details sheet is open…
    await waitFor(() => {
      expect(queryByTestId('route-details-sheet')).not.toBeNull()
    })
    // …and the save sheet is NOT (save lives inside the details sheet).
    expect(queryByTestId('save-route-sheet')).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1c: paging to a second route leaves exactly ONE route-tag
  // ─────────────────────────────────────────────────────────────────────────
  it('tagFollowsPaging', async () => {
    let currentState = buildFlowState([scenicRoute, twistiesRoute], scenicRoute.routeOptionId)
    mockUseRideFlow.mockReturnValue({ state: currentState, dispatch: mockFlowDispatch })

    const { queryAllByTestId, findByTestId, rerender, getByText } = render(
      createElement(HomeMapScreen),
    )

    // Wait for the first tag to mount.
    await findByTestId('route-tag')
    expect(queryAllByTestId('route-tag').length).toBe(1)

    // Page to the second route (selectedRouteId changes).
    currentState = buildFlowState([scenicRoute, twistiesRoute], twistiesRoute.routeOptionId)
    mockUseRideFlow.mockReturnValue({ state: currentState, dispatch: mockFlowDispatch })
    rerender(createElement(HomeMapScreen))

    // Exactly ONE tag remains — now showing the paged route's archetype.
    await waitFor(() => {
      expect(queryAllByTestId('route-tag').length).toBe(1)
    })
    // The single remaining tag carries the paged route's archetype + distance.
    // 64_000m / 1609.34 = 39.77 → Math.round === 40
    expect(getByText(/Twisties.*40mi/)).toBeTruthy()
  })
})
