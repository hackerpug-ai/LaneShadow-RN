/**
 * Shared mock harness for the three `index.*` integration suites that render
 * the plan-view home screen (`app/(app)/(tabs)/index.tsx`).
 *
 * The boundary `vi.mock()` registrations (Convex, expo-router, native map,
 * contexts, hooks, stores, sibling UI) live at module top level here and are
 * hoisted by vitest when this module is imported. The mock handles are created
 * via `vi.hoisted()` so they exist at factory-eval time.
 *
 * `setupHomeScreenMocks()` wires the imperative map ref to the fit/camera
 * handles and returns every shared handle. Callers call it at file scope and
 * then set scenario-specific `mockReturnValue(...)` values per test. Only the
 * boundary registrations and handle declarations live here; per-suite return
 * wiring stays in each test file.
 *
 * `renderHomeScreen(component)` renders an already-imported screen component.
 * Callers obtain the component via `await import('./index')` in `beforeEach`
 * (deferred so the registered mocks apply), then pass it here.
 *
 * NOTE: `vi.mock()` paths are relative to THIS file (`test-helpers/`), so they
 * use `../` prefixes that resolve to the same absolute modules the test files
 * reach via `../../../`.
 *
 * NOTE: React helpers (`createElement`, `forwardRef`) are obtained via
 * `require('react')` inside the hoisted factories (top-level `import`
 * bindings are not yet initialised when vitest evaluates a hoisted factory).
 */

import { render } from '@testing-library/react-native'
import { type ComponentType, createElement } from 'react'
import { vi } from 'vitest'

const handles = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
  mockUseActiveSessionRoute: vi.fn(),
  mockUseRideFlow: vi.fn(),
  mockFitToCoordinates: vi.fn(),
  mockSetCameraPosition: vi.fn(),
  mockMapRef: {
    current: {
      fitToCoordinates: vi.fn(),
      setCameraPosition: vi.fn(),
      recenterToUser: vi.fn(),
      zoomBy: vi.fn(),
    },
  },
  mockSetSelectedRouteId: vi.fn(),
  mockSetDisplayedRoutePlanId: vi.fn(),
  mockRegisterFitHandler: vi.fn(),
  mockRequestFitToRouteWithReset: vi.fn(),
}))

vi.mock('convex/react', () => ({
  useQuery: handles.mockUseQuery,
  useMutation: handles.mockUseMutation,
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

vi.mock('../contexts/search-results', () => ({
  useSearchResults: () => ({
    results: [],
    selectedResultId: null,
    setSelectedRouteId: vi.fn(),
    clearResults: vi.fn(),
  }),
}))

vi.mock('../contexts/selected-route', () => ({
  useSelectedRoute: () => ({
    selectedRouteId: null,
    setSelectedRouteId: handles.mockSetSelectedRouteId,
    displayedRoutePlanId: null,
    setDisplayedRoutePlanId: handles.mockSetDisplayedRoutePlanId,
    requestFitToRoute: vi.fn(),
    requestFitToRouteWithReset: handles.mockRequestFitToRouteWithReset,
    registerFitHandler: handles.mockRegisterFitHandler,
  }),
}))

vi.mock('../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

vi.mock('../hooks/use-active-session-route', () => ({
  useActiveSessionRoute: (...args: unknown[]) => handles.mockUseActiveSessionRoute(...args),
}))

vi.mock('../hooks/use-current-location', () => ({
  useCurrentLocation: () => ({ location: { lat: 37.7749, lng: -122.4194 }, loading: false }),
}))

vi.mock('../hooks/use-is-route-saved', () => ({
  useIsRouteSaved: () => false,
}))

vi.mock('../hooks/use-plan-ride', () => ({
  usePlanInit: () => ({ data: null }),
  usePlanRide: () => ({
    planRide: vi.fn(),
    isRunning: false,
    error: null,
    resetError: vi.fn(),
    cancelPlanning: vi.fn(),
  }),
}))

vi.mock('../hooks/use-ride-flow', () => ({
  useRideFlow: (...args: unknown[]) => handles.mockUseRideFlow(...args),
}))

vi.mock('../hooks/use-toast-messages', () => ({
  useToastMessages: () => ({
    toasts: [],
    dismissToast: vi.fn(),
    clearAll: vi.fn(),
  }),
}))

vi.mock('../stores/chat-session-store', () => ({
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

vi.mock('../components/map', () => {
  const { forwardRef } = require('react')
  return {
    MapboxMapView: forwardRef((props: any, ref: any) => {
      if (typeof ref === 'function') ref(handles.mockMapRef.current)
      else if (ref && typeof ref === 'object') ref.current = handles.mockMapRef.current
      if (props?.children) return props.children
      return null
    }),
  }
})

vi.mock('../components/map/map-controls', () => {
  const { createElement } = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  return {
    MapControls: (props: any) =>
      createElement(
        TouchableOpacity,
        {
          testID: 'control-clear',
          onPress: props.onClear,
          accessibilityRole: 'button',
        },
        createElement(Text, null, 'Clear'),
      ),
  }
})
vi.mock('../components/map/map-header-overlay', () => ({ MapHeaderOverlay: () => null }))
vi.mock('../components/map/map-toast-stack', () => ({ MapToastStack: () => null }))
vi.mock('../components/map/route-summary-carousel', () => ({
  RouteSummaryCarousel: () => null,
}))
vi.mock('../components/map/search-result-marker', () => ({
  SearchResultMarker: () => null,
}))
vi.mock('../components/map/weather-pills-row', () => ({ WeatherPillsRow: () => null }))
vi.mock('../components/layouts/menu-layout', () => ({
  MenuLayout: (p: any) => p.children,
}))
vi.mock('../components/sheets/plan-ride-sheet', () => ({ PlanRideSheet: () => null }))
vi.mock('../components/sheets/planning-error-sheet', () => ({
  PlanningErrorSheet: () => null,
}))
vi.mock('../components/sheets/planning-loading', () => ({ RoutePlannerLoading: () => null }))
vi.mock('../components/ui/motorcycle-plus-icon', () => ({
  MotorcyclePlusIcon: () => null,
}))
vi.mock('../components/sheets/route-directions-sheet', () => ({
  RouteDirectionsSheet: () => null,
}))
vi.mock('../components/chat/cards/route-mini-map', () => ({
  RouteMiniMap: () => null,
}))
vi.mock('../components/ui/badge', () => {
  const { createElement } = require('react')
  return {
    Badge: ({ children, testID }: any) => createElement('View', { testID }, children),
  }
})

vi.mock('../lib/get-current-location', () => ({ getCurrentLocation: vi.fn() }))

export function setupHomeScreenMocks() {
  handles.mockMapRef.current.fitToCoordinates = handles.mockFitToCoordinates
  handles.mockMapRef.current.setCameraPosition = handles.mockSetCameraPosition
  return handles
}

export function renderHomeScreen(HomeMapScreen: ComponentType) {
  return render(createElement(HomeMapScreen))
}
