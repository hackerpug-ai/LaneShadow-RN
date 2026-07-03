/**
 * REDHAT-FIX-003 / RUX-007 Integration Tests: Curated card tap loading + no chat message
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL handleSelectCuratedRoute wiring. Only the native
 * map boundary (rnmapbox / MapboxMapView), Convex/network hooks, and unrelated
 * UI are mocked.
 *
 * The `createCuratedPlan` Convex mutation is driven by a CONTROLLABLE promise
 * so the test can observe the indicator WHILE pending and AFTER resolve.
 * MapPlanningIndicator is stubbed as a conditional adapter that renders its
 * testID only when `visible` — mirroring the production
 * `if (!visible) return null` contract.
 *
 * ChatInput is stubbed as a faithful adapter that renders the discovery pills
 * index.tsx passes via `suggestions` and invokes the real `onSelectRoute`
 * prop — the same contract the production ChatInput honours. This exercises
 * the index.tsx → handleSelectCuratedRoute → createCuratedPlan wiring (NOT the
 * handleSendMessage / sendPlanningMessage chat-send path).
 *
 * AC-2 (cardTapShowsThenHidesMapPlanningIndicator + cardTapDoesNotAppendChatMessage):
 *   - map-planning-indicator present while createCuratedPlan pending, absent after resolve
 *   - transcript message count delta === 0 (sendPlanningMessage NOT invoked;
 *     createCuratedPlan IS invoked — the curated path, not the chat path)
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

// Capture the chat-send spy so the "no chat message" assertion is observable.
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

// MapPlanningIndicator: conditional adapter — renders testID only when visible
// (mirrors production `if (!visible) return null`).
vi.mock('../../../components/map/map-planning-indicator', () => {
  const { createElement } = require('react')
  return {
    MapPlanningIndicator: (props: any) =>
      props.visible
        ? createElement('View', { testID: props.testID ?? 'map-planning-indicator' })
        : null,
  }
})

vi.mock('../../../components/map/map-toast-stack', () => ({ MapToastStack: () => null }))
vi.mock('../../../components/map/route-summary-carousel', () => ({
  RouteSummaryCarousel: () => null,
}))
vi.mock('../../../components/map/route-tag', () => ({ RouteTag: () => null }))
vi.mock('../../../components/map/search-result-marker', () => ({
  SearchResultMarker: () => null,
}))
vi.mock('../../../components/map/weather-pills-row', () => ({ WeatherPillsRow: () => null }))

// ChatInput: faithful adapter — renders the discovery pills index.tsx passes
// via `suggestions` and invokes the real `onSelectRoute(routeId)` prop on
// press (the production contract). This exercises the index.tsx →
// handleSelectCuratedRoute wiring under test.
vi.mock('../../../components/chat', () => {
  const { createElement } = require('react')
  const { TouchableOpacity, View, Text } = require('react-native')
  return {
    ChatInput: (props: any) => {
      const suggestions: any[] = props.suggestions ?? []
      return createElement(View, { testID: props.testID ?? 'chat-input' }, [
        ...suggestions
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
          ),
      ])
    },
  }
})

// ChatTranscript: adapter that surfaces the rendered message count so the
// "transcript count delta === 0" is observable when the transcript mounts.
vi.mock('../../../components/ui/chat-transcript', () => {
  const { createElement } = require('react')
  return {
    ChatTranscript: (props: any) =>
      createElement('View', {
        testID: `chat-transcript-count-${props.messages?.length ?? 0}`,
      }),
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
// Fixtures — a curated discovery route (centroid-style single point)
// ---------------------------------------------------------------------------

const CURATED_ROUTE = {
  id: 'curated-1',
  name: 'Skyline Drive',
  lat: 36.85,
  lng: -121.4,
  archetype: 'scenic' as const,
  score: 0.82,
  distanceMi: 12,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RUX-007: Curated card tap shows/hides indicator + no chat message', () => {
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

    // No agent-active route so MapPlanningIndicator's `!hasAgentRoute` term stays true.
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
  // AC-2a: indicator shown while createCuratedPlan pending, hidden after resolve
  // ─────────────────────────────────────────────────────────────────────────
  it('cardTapShowsThenHidesMapPlanningIndicator', async () => {
    const { queryByTestId, findByTestId } = render(createElement(HomeMapScreen))

    // The discovery pill renders from the curated route index.tsx resolved.
    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Before tap: no planning indicator.
    expect(queryByTestId('map-planning-indicator')).toBeNull()

    // Tap the curated discovery pill → handleSelectCuratedRoute →
    // setMapPlanningVisible(true) (chatMode is false) → mutation pending.
    fireEvent.press(pill)

    // WHILE pending: the indicator is shown.
    await waitFor(() => {
      expect(queryByTestId('map-planning-indicator')).not.toBeNull()
    })

    // Resolve the curated-plan mutation → finally block clears the indicator.
    resolveCreateCuratedPlan({ routePlanId: 'plan-curated-1' })

    // AFTER resolve: the indicator is gone (finally clears it explicitly).
    await waitFor(() => {
      expect(queryByTestId('map-planning-indicator')).toBeNull()
    })

    // And the curated-plan mutation was actually invoked (not a no-op).
    expect(mockCreateCuratedPlan).toHaveBeenCalledTimes(1)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2b: tapping a curated card does NOT append a chat transcript message
  // ─────────────────────────────────────────────────────────────────────────
  it('cardTapDoesNotAppendChatMessage', async () => {
    const { findByTestId } = render(createElement(HomeMapScreen))

    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Tap the curated discovery pill (the direct-plot path).
    fireEvent.press(pill)

    // Allow the async handleSelectCuratedRoute to run + the mutation to enqueue.
    resolveCreateCuratedPlan({ routePlanId: 'plan-curated-1' })
    await waitFor(() => {
      expect(mockCreateCuratedPlan).toHaveBeenCalledTimes(1)
    })

    // THEN: the chat-send path was NOT taken — no transcript message appended.
    // sendPlanningMessage is the production mechanism that writes a
    // session_messages row; the curated path uses createCuratedPlan instead.
    expect(mockSendPlanningMessage).not.toHaveBeenCalled()

    // Belt-and-braces: the curated mutation carried the real curated payload
    // (routeId + centroid + archetype + score), proving the curated branch —
    // not a chat-message round-trip — executed.
    const callArgs = mockCreateCuratedPlan.mock.calls[0][0] as Record<string, unknown>
    expect(callArgs.routeId).toBe(CURATED_ROUTE.id)
    expect(callArgs.compositeScore).toBe(CURATED_ROUTE.score)
  })
})
