/**
 * REDHAT-FIX-003 / DISC-016 Integration Tests: Discovery tap plots route, camera fits, typed send
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL handleSelectCuratedRoute, doFit, and
 * handleSendMessage wiring. Only the native map boundary (rnmapbox /
 * MapboxMapView), Convex/network hooks, and unrelated UI are mocked.
 *
 * The discovery pill tap path (handleSelectCuratedRoute → createCuratedPlan →
 * convex resolves → useActiveSessionRoute → RoutePolyline/doFit) is driven
 * end-to-end: the test taps the real `discovery-suggestion-pill-{routeId}`,
 * lets the mocked mutation resolve, then simulates Convex resolving the new
 * route_plan by updating useActiveSessionRoute — exactly the production
 * resolution order.
 *
 * ChatInput is a faithful adapter: it renders the discovery pills index.tsx
 * passes via `suggestions` (invoking the real `onSelectRoute`), plus a text
 * input + send button that invoke the real `onSend` — the production
 * ChatInput contract.
 *
 * AC-3 (tapPlotsRouteWithoutChatMessage + cameraFitsTappedRouteIncludingCentroid + typedMessageStillSends):
 *   - tapping discovery-suggestion-pill renders home-route-polyline segments with no chat message
 *   - centroid route → setCameraPosition zoom 12; multi-point → fitToCoordinates coords.length > 1
 *   - typed send → sendPlanningMessage invoked once with the typed text
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: Convex / network boundary
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
  FadeInDown: { duration: () => ({ springify: () => undefined }) },
  default: { View: (props: any) => props.children },
  Animated: { View: (props: any) => props.children },
}))

vi.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}))

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Medium: 'Medium' },
}))

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
// Mock: hooks requiring Convex / native services
// ---------------------------------------------------------------------------

const mockUseActiveSessionRoute = vi.fn()
vi.mock('../../../hooks/use-active-session-route', () => ({
  useActiveSessionRoute: (...args: unknown[]) => mockUseActiveSessionRoute(...args),
}))

const mockSendPlanningMessage = vi.fn()
vi.mock('../../../hooks/use-chat-planning', () => ({
  useChatPlanning: () => ({
    sendPlanningMessage: mockSendPlanningMessage,
    cancel: vi.fn(),
    sessionId: null,
    resetSession: vi.fn(),
  }),
}))

const mockUseCuratedDiscovery = vi.fn()
vi.mock('../../../hooks/use-curated-discovery', () => ({
  useCuratedDiscovery: (...args: unknown[]) => mockUseCuratedDiscovery(...args),
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
// Mock: semantic theme
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
// Mock: native map boundary — forwardRef exposes the imperative map handle.
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

// ChatInput: faithful adapter — renders discovery pills from `suggestions`
// (invoking the real `onSelectRoute(routeId)`) AND a text input + send button
// (invoking the real `onSend(text)`). Honours the production ChatInput contract
// so the index.tsx wiring under test is exercised through real handler props.
vi.mock('../../../components/chat', () => {
  const { createElement, useState } = require('react')
  const { TouchableOpacity, View, Text, TextInput } = require('react-native')
  return {
    ChatInput: (props: any) => {
      const [text, setText] = useState('')
      const suggestions: any[] = props.suggestions ?? []
      const pills = suggestions
        .filter((s) => s?.routeId)
        .map((s) =>
          createElement(
            TouchableOpacity,
            {
              key: `discovery-suggestion-pill-${s.routeId}`,
              testID: `discovery-suggestion-pill-${s.routeId}`,
              onPress: () => props.onSelectRoute?.(s.routeId),
              accessibilityRole: 'button',
            },
            createElement(Text, null, s.label ?? s.routeId),
          ),
        )
      return createElement(View, { testID: props.testID ?? 'chat-input' }, [
        ...pills,
        createElement(TextInput, {
          key: 'chat-input-field',
          testID: 'chat-input-field',
          value: text,
          onChangeText: (t: string) => setText(t),
        }),
        createElement(
          TouchableOpacity,
          {
            key: 'chat-send-button',
            testID: 'chat-send-button',
            onPress: () => {
              if (text.trim().length > 0) props.onSend?.(text)
            },
            accessibilityRole: 'button',
          },
          createElement(Text, null, 'Send'),
        ),
      ])
    },
  }
})

vi.mock('../../../components/ui/chat-transcript', () => ({ ChatTranscript: () => null }))
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
// Controllable createCuratedPlan mutation
// ---------------------------------------------------------------------------

let resolveCreateCuratedPlan: (value: { routePlanId: string }) => void = () => {}
const mockCreateCuratedPlan = vi.fn(
  () =>
    new Promise<{ routePlanId: string }>((resolve) => {
      resolveCreateCuratedPlan = resolve
    }),
)

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CURATED_ROUTE = {
  id: 'curated-1',
  name: 'Skyline Drive',
  lat: 36.85,
  lng: -121.4,
  archetype: 'scenic' as const,
  score: 0.82,
  distanceMi: 78,
}

// Multi-point polyline → 3 coords (renders home-route-polyline--segment-*).
const multiPointPolyline = 'c|peFf`ejVnqPn}@ryPn}@'
// Centroid polyline → 1 coord [{lat:36.85, lng:-121.40}] (doFit centroid branch).
const centroidPolyline = 'og|_F~|}cV'

/** A resolved curated active option as useActiveSessionRoute would return it. */
const buildCuratedActiveOption = (encodedPolyline: string, legsCount: number) => ({
  routeOptionId: `curated-${CURATED_ROUTE.id}`,
  label: 'Skyline Drive',
  rationale: 'Scenic curated route',
  stats: { distanceMeters: 125_000, durationSeconds: 7200, legsCount },
  map: {
    bounds: {
      northeast: { lat: 37.85, lng: -122.42 },
      southwest: { lat: 36.84, lng: -121.41 },
    },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: encodedPolyline,
    },
    legs:
      legsCount > 0
        ? [
            {
              geometry: {
                format: 'polyline' as const,
                encoding: 'google',
                precision: 5,
                value: encodedPolyline,
              },
              legIndex: 0,
              startLabel: 'Start',
              endLabel: 'End',
              distanceMeters: 125_000,
              durationSeconds: 7200,
            },
          ]
        : [],
    overlays: {},
  },
  overlaysPreview: {
    windSummary: 'low',
    rainSummary: 'none',
    temperatureSummary: 'mild',
    conditionsStatus: 'ok',
  },
})

const buildCompletedPlan = (option: any, planId: string) => ({
  _id: planId,
  status: 'completed',
  startLabel: 'Start',
  endLabel: 'End',
  planInput: {
    start: { lat: 36.85, lng: -121.4, label: 'Start' },
    end: { lat: 37.0, lng: -122.0, label: 'End' },
  },
  result: { options: [option] },
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DISC-016: Discovery tap plots route, camera fits, typed send', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendPlanningMessage.mockClear()
    mockCreateCuratedPlan.mockClear()
    resolveCreateCuratedPlan = () => {}
    mockFitToCoordinates.mockClear()
    mockSetCameraPosition.mockClear()
    mockMapRef.current.fitToCoordinates = mockFitToCoordinates
    mockMapRef.current.setCameraPosition = mockSetCameraPosition

    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: null,
      routePlan: null,
      newestRoutePlanId: null,
    })
    mockUseCuratedDiscovery.mockReturnValue({
      isLoading: false,
      isEmpty: false,
      routes: [CURATED_ROUTE],
    })
    mockUseRideFlow.mockReturnValue({
      state: { phase: 'IDLE' as const, sessionId: 'test-session' },
      dispatch: mockFlowDispatch,
    })
    mockUseQuery.mockReturnValue([])
    mockUseMutation.mockReturnValue(mockCreateCuratedPlan)

    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3a: tapping a discovery pill plots the route WITHOUT a chat message
  // ─────────────────────────────────────────────────────────────────────────
  it('tapPlotsRouteWithoutChatMessage', async () => {
    // Start with no active route; the discovery pill is rendered from
    // useCuratedDiscovery.
    const { findByTestId, queryAllByTestId, rerender } = render(createElement(HomeMapScreen))

    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Tap → handleSelectCuratedRoute → createCuratedPlan resolves.
    fireEvent.press(pill)
    resolveCreateCuratedPlan({ routePlanId: 'plan-curated-1' })

    // Wait for the curated-plan mutation to fire (proves the curated path ran).
    await waitFor(() => {
      expect(mockCreateCuratedPlan).toHaveBeenCalledTimes(1)
    })

    // Simulate Convex resolving the new route_plan: useActiveSessionRoute now
    // returns the curated option (multi-point geometry so the polyline plots).
    const multiPointOption = buildCuratedActiveOption(multiPointPolyline, 1)
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: multiPointOption,
      routePlan: buildCompletedPlan(multiPointOption, 'plan-curated-1'),
      newestRoutePlanId: 'plan-curated-1',
    })
    rerender(createElement(HomeMapScreen))

    // THEN: the route's polyline segments render on the map.
    await waitFor(() => {
      expect(queryAllByTestId(/home-route-polyline--segment-/).length).toBeGreaterThanOrEqual(1)
    })

    // AND: no chat message was appended — the chat-send path was NOT taken.
    // (createCuratedPlan was; that is the direct-plot path, not the chat path.)
    expect(mockSendPlanningMessage).not.toHaveBeenCalled()
    expect(mockCreateCuratedPlan).toHaveBeenCalledTimes(1)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3b: camera fits the tapped route — centroid (zoom 12) AND multi-point
  // ─────────────────────────────────────────────────────────────────────────
  it('cameraFitsTappedRouteIncludingCentroid', async () => {
    // ── Centroid branch: a centroid-only curated route frames at zoom 12 ──
    const centroidOption = buildCuratedActiveOption(centroidPolyline, 0)
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: centroidOption,
      routePlan: buildCompletedPlan(centroidOption, 'plan-curated-1'),
      newestRoutePlanId: 'plan-curated-1',
    })

    const { rerender } = render(createElement(HomeMapScreen))

    // doFit takes the centroid branch → setCameraPosition with zoom 12.
    await waitFor(() => {
      expect(mockSetCameraPosition).toHaveBeenCalled()
    })
    const centroidCall =
      mockSetCameraPosition.mock.calls[mockSetCameraPosition.mock.calls.length - 1]
    expect(centroidCall[0].zoom).toBe(12)
    expect(centroidCall[0].coordinates.latitude).toBeCloseTo(36.85, 1)
    expect(centroidCall[0].coordinates.longitude).toBeCloseTo(-121.4, 1)

    // ── Multi-point branch: a multi-point route fits via fitToCoordinates ──
    mockSetCameraPosition.mockClear()
    mockFitToCoordinates.mockClear()

    const multiPointOption = buildCuratedActiveOption(multiPointPolyline, 1)
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: multiPointOption,
      routePlan: buildCompletedPlan(multiPointOption, 'plan-curated-2'),
      newestRoutePlanId: 'plan-curated-2',
    })
    rerender(createElement(HomeMapScreen))

    // doFit takes the multi-point branch → fitToCoordinates with >1 coord.
    await waitFor(() => {
      expect(mockFitToCoordinates).toHaveBeenCalled()
    })
    const fitCall = mockFitToCoordinates.mock.calls[mockFitToCoordinates.mock.calls.length - 1]
    const coords = fitCall[0] as Array<{ latitude: number; longitude: number }>
    expect(coords.length).toBeGreaterThan(1)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3c: typing a message and pressing send still sends it
  // ─────────────────────────────────────────────────────────────────────────
  it('typedMessageStillSends', async () => {
    const { findByTestId } = render(createElement(HomeMapScreen))

    const input = await findByTestId('chat-input-field')
    const sendButton = await findByTestId('chat-send-button')

    // Type a real message (non-empty so the adapter routes it to onSend).
    fireEvent.changeText(input, 'twisties near Asheville')

    // Before send: no chat message has been sent.
    expect(mockSendPlanningMessage).not.toHaveBeenCalled()

    // Press send → handleSendMessage → sendPlanningMessage(message).
    fireEvent.press(sendButton)

    // THEN: the chat-send path fires exactly once with the typed text.
    // (In production this appends a session_messages row → transcript N+1.)
    expect(mockSendPlanningMessage).toHaveBeenCalledTimes(1)
    expect(mockSendPlanningMessage.mock.calls[0][0]).toBe('twisties near Asheville')

    // AND: the curated direct-plot path was NOT taken by the typed send.
    expect(mockCreateCuratedPlan).not.toHaveBeenCalled()
  })
})
