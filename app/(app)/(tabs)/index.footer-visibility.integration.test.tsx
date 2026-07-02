/**
 * Integration tests for DISC-018 footer controls and discovery-card visibility.
 */

import { cleanup, render, screen } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import HomeMapScreen from './index'

const mocks = vi.hoisted(() => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useCuratedDiscovery: vi.fn(),
  useActiveSessionRoute: vi.fn(),
  useRideFlow: vi.fn(),
  flowDispatch: vi.fn(),
}))

vi.mock('convex/react', () => ({
  useQuery: mocks.useQuery,
  useMutation: mocks.useMutation,
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSegments: () => ['app', 'tabs', 'index'],
  useLocalSearchParams: () => ({}),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: (props: any) => props.children,
}))

vi.mock('react-native-reanimated', () => ({
  useSharedValue: (initial: number) => ({ value: initial }),
  useAnimatedStyle: () => ({}),
  withTiming: vi.fn((value: number) => value),
  FadeInDown: { duration: () => ({ springify: () => undefined }) },
  default: { View: (props: any) => createElement('View', props, props.children) },
}))

vi.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}))

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Medium: 'Medium' },
}))

vi.mock('../../../lib/get-current-location', () => ({
  getCurrentLocation: vi.fn(),
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

vi.mock('../../../hooks/use-active-session-route', () => ({
  useActiveSessionRoute: (...args: unknown[]) => mocks.useActiveSessionRoute(...args),
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
  useCuratedDiscovery: (...args: unknown[]) => mocks.useCuratedDiscovery(...args),
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
  useRideFlow: (...args: unknown[]) => mocks.useRideFlow(...args),
}))

vi.mock('../../../hooks/use-route-comparison', () => ({
  useRouteComparison: () => ({ polylines: [], selectRoute: vi.fn() }),
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        surface: { default: 'surface' },
        border: { default: 'border' },
        onSurface: { default: 'on-surface' },
      },
      space: { sm: 8, md: 16 },
      type: { body: { md: {} } },
      elevation: { 3: {} },
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

vi.mock('../../../components/layouts/menu-layout', () => ({
  MenuLayout: (props: any) => createElement('View', { testID: 'menu-layout' }, props.children),
}))

vi.mock('../../../components/chat', () => ({
  ChatInput: (props: any) =>
    createElement(
      'View',
      { testID: props.testID },
      createElement('TouchableOpacity', {
        testID: 'chat-input-send-button',
        style: { width: 42, height: 42 },
      }),
      props.onToggleChatMode
        ? createElement('TouchableOpacity', {
            testID: 'chat-input-chat-view-button',
            onPress: props.onToggleChatMode,
            style: { width: 48, height: 48 },
          })
        : null,
      props.state.phase === 'IDLE' &&
        !props.hasActiveRoute &&
        props.suggestions.length > 0 &&
        !props.isPlanning &&
        !props.chatMode
        ? createElement(
            'View',
            null,
            props.suggestions.map((suggestion: any, index: number) =>
              createElement(
                'Text',
                { key: index, testID: `discovery-suggestion-pill-${index}` },
                typeof suggestion === 'string' ? suggestion : suggestion.label,
              ),
            ),
          )
        : null,
    ),
}))

vi.mock('../../../components/map', () => ({
  MapboxMapView: (props: any) => createElement('View', { testID: 'map-view' }, props.children),
}))

vi.mock('../../../components/map/map-controls', () => ({
  MapControls: () => createElement('View', { testID: 'map-controls' }),
}))

vi.mock('../../../components/map/map-header-overlay', () => ({
  MapHeaderOverlay: () => createElement('View', { testID: 'map-header-overlay' }),
}))

vi.mock('../../../components/map/map-planning-indicator', () => ({
  MapPlanningIndicator: () => createElement('View', { testID: 'map-planning-indicator' }),
}))

vi.mock('../../../components/map/map-toast-stack', () => ({
  MapToastStack: () => createElement('View', { testID: 'map-toast-stack' }),
}))

vi.mock('../../../components/map/route-polyline', () => ({
  buildRoutePolylines: () => [],
}))

vi.mock('../../../components/map/route-polyline-component', () => ({
  RoutePolyline: () => createElement('View', { testID: 'route-polyline' }),
}))

vi.mock('../../../components/map/route-summary-carousel', () => ({
  RouteSummaryCarousel: () => createElement('View', { testID: 'route-summary-carousel' }),
}))

vi.mock('../../../components/map/route-tag', () => ({
  RouteTag: () => createElement('View', { testID: 'route-tag' }),
}))

vi.mock('../../../components/map/search-result-marker', () => ({
  SearchResultMarker: () => createElement('View', { testID: 'search-result-marker' }),
}))

vi.mock('../../../components/map/weather-pills-row', () => ({
  WeatherPillsRow: () => createElement('View', { testID: 'weather-pills-row' }),
}))

vi.mock('../../../components/sheets/plan-ride-sheet', () => ({
  PlanRideSheet: () => createElement('View', { testID: 'plan-ride-sheet' }),
}))

vi.mock('../../../components/sheets/planning-error-sheet', () => ({
  PlanningErrorSheet: () => createElement('View', { testID: 'planning-error-sheet' }),
}))

vi.mock('../../../components/sheets/planning-loading', () => ({
  RoutePlannerLoading: () => createElement('View', { testID: 'planning-loading' }),
}))

vi.mock('../../../components/sheets/route-details-sheet', () => ({
  RouteDetailsSheet: () => createElement('View', { testID: 'route-details-sheet' }),
}))

vi.mock('../../../components/ui/chat-transcript', () => ({
  ChatTranscript: () => createElement('View', { testID: 'chat-transcript' }),
}))

vi.mock('../../../components/ui/motorcycle-plus-icon', () => ({
  MotorcyclePlusIcon: () => createElement('View', { testID: 'motorcycle-plus-icon' }),
}))

vi.mock('../../../components/ui/save-favorite-sheet', () => ({
  SaveRouteSheet: () => createElement('View', { testID: 'save-route-sheet' }),
}))

const setActiveRoute = (hasActiveRoute: boolean) => {
  mocks.useActiveSessionRoute.mockReturnValue({
    activeOption: hasActiveRoute
      ? {
          routeOptionId: 'route-1',
          map: {
            overviewGeometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
            legs: [],
          },
          stats: {
            distanceMeters: 8400,
          },
        }
      : null,
    routePlan: {
      status: 'completed',
      result: { options: [{ routeOptionId: 'route-1' }] },
    },
    newestRoutePlanId: 'test-route-plan-id',
  })
}

describe('Footer Visibility Integration Tests', () => {
  beforeEach(() => {
    mocks.useQuery.mockReturnValue([])
    mocks.useMutation.mockReturnValue(vi.fn())
    mocks.useRideFlow.mockReturnValue({
      state: { phase: 'IDLE' },
      dispatch: mocks.flowDispatch,
    })
    mocks.useCuratedDiscovery.mockReturnValue({
      isLoading: false,
      isEmpty: false,
      routes: [{ id: 'route-1', name: 'Test Route', distanceMi: 5.2 }],
    })
    setActiveRoute(false)
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the full-chat button as a distinct footer control from send', () => {
    render(<HomeMapScreen />)

    const chatViewButton = screen.getByTestId('chat-input-chat-view-button')
    const sendButton = screen.getByTestId('chat-input-send-button')

    expect(chatViewButton).toBeTruthy()
    expect(sendButton).toBeTruthy()
    expect(chatViewButton).not.toBe(sendButton)
    expect(chatViewButton.props.style).toMatchObject({ width: 48, height: 48 })
    expect(sendButton.props.style).toMatchObject({ width: 42, height: 42 })
  })

  it('hides curated suggestion cards while a route is active', () => {
    setActiveRoute(true)

    render(<HomeMapScreen />)

    expect(screen.queryAllByTestId(/^discovery-suggestion-pill-/)).toHaveLength(0)
  })

  it('shows curated suggestion cards when no route is active', () => {
    setActiveRoute(false)

    render(<HomeMapScreen />)

    expect(screen.getByText('Test Route · 5mi')).toBeTruthy()
    expect(screen.queryAllByTestId(/^discovery-suggestion-pill-/).length).toBeGreaterThan(0)
  })
})
