/**
 * Minimal smoke test for the DISC-018 footer harness.
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

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    KeyboardAvoidingView:
      actual.KeyboardAvoidingView ??
      ((props: any) => createElement(actual.View, props, props.children)),
  }
})

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

vi.mock('react-native-paper', () => ({
  Icon: (props: any) => createElement('View', { testID: `paper-icon-${props.source}` }),
  Text: (props: any) => createElement('Text', props, props.children),
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
        primary: { default: 'primary', pressed: 'primary-pressed' },
        surface: { default: 'surface' },
        surfaceVariant: { default: 'surface-variant' },
        border: { default: 'border' },
        onPrimary: { default: 'on-primary' },
        onSurface: { default: 'on-surface', muted: 'on-surface-muted' },
        accent: { default: 'accent' },
      },
      space: { sm: 8, md: 16 },
      radius: { md: 12, full: 999 },
      type: { body: { sm: {}, md: {} } },
      elevation: { 2: {}, 3: {} },
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

describe('Footer minimal harness', () => {
  beforeEach(() => {
    mocks.useQuery.mockReturnValue([])
    mocks.useMutation.mockReturnValue(vi.fn())
    mocks.useActiveSessionRoute.mockReturnValue({
      activeOption: null,
      routePlan: null,
      newestRoutePlanId: null,
    })
    mocks.useRideFlow.mockReturnValue({
      state: { phase: 'IDLE' },
      dispatch: mocks.flowDispatch,
    })
    mocks.useCuratedDiscovery.mockReturnValue({
      isLoading: false,
      isEmpty: true,
      routes: [],
    })
  })

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  it('renders the footer chat controls without collection-time harness errors', () => {
    render(<HomeMapScreen />)

    expect(screen.getByTestId('chat-input')).toBeTruthy()
    expect(screen.getByTestId('chat-input-send-button')).toBeTruthy()
    expect(screen.getByTestId('chat-input-chat-view-button')).toBeTruthy()
  })
})
