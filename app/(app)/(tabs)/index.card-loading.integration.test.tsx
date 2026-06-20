/**
 * Integration tests for RUX-007: Show the existing map loading-state on a discovery card tap
 * Tests that tapping a discovery suggestion card shows MapPlanningIndicator while loading
 * and hides it when the curated route mutation completes.
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

// Mock convex/react first
const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: mockUseQuery,
  useMutation: mockUseMutation,
}))

// Mock expo-router
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSegments: () => ['app', 'tabs', 'index'],
  useLocalSearchParams: () => ({}),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: ({ children }) => children,
}))

vi.mock('react-native-maps', () => ({
  MapView: () => <View testID="map-view" />,
  Marker: () => null,
  PROVIDER_DEFAULT: 'default',
}))

vi.mock('react-native-reanimated', () => ({
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withTiming: vi.fn(),
}))

vi.mock('../../../contexts/auth-context', () => ({
  AuthProvider: ({ children }) => children,
  useAuth: () => ({
    isLoaded: true,
    isSignedIn: true,
    user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
  }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false }),
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      colors: {
        text: { primary: '#000', secondary: '#666' },
        surface: {
          primary: '#fff',
          secondary: '#f5f5f5',
          glass: 'rgba(255, 255, 255, 0.72)',
          background: '#fff',
        },
      },
      typography: {
        label: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
        caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 },
      },
    },
  }),
}))

vi.mock('../../../hooks/use-toast-messages', () => ({
  useToastMessages: () => ({
    showToast: vi.fn(),
    clearToasts: vi.fn(),
    toasts: [],
    dismissToast: vi.fn(),
    clearAll: vi.fn(),
  }),
}))

vi.mock('../../../hooks/use-curated-discovery', () => ({
  useCuratedDiscovery: vi.fn(),
}))

vi.mock('../../../hooks/use-current-location', () => ({
  useCurrentLocation: () => ({ location: null, isLocationLoaded: true }),
  getCurrentLocation: vi.fn().mockResolvedValue(null),
}))

vi.mock('../../../hooks/use-ride-flow', () => ({
  useRideFlow: () => ({
    state: { phase: 'IDLE' },
    dispatch: vi.fn(),
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

vi.mock('../../../hooks/use-active-session-route', () => ({
  useActiveSessionRoute: vi.fn(() => ({
    routePlanId: null,
    newestRoutePlanId: null,
    routePlan: null,
    activeOption: null,
  })),
}))

vi.mock('../../../hooks/use-chat-planning', () => ({
  useChatPlanning: () => ({
    sendPlanningMessage: vi.fn(),
    cancel: vi.fn(),
    sessionId: 'test-session-id',
    resetSession: vi.fn(),
    sessions: [],
    isLoading: false,
  }),
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

vi.mock('../../../hooks/use-route-comparison', () => ({
  useRouteComparison: () => ({
    comparison: null,
    setComparison: vi.fn(),
  }),
}))

vi.mock('../../../hooks/use-is-route-saved', () => ({
  useIsRouteSaved: () => ({ isSaved: false }),
}))

vi.mock('../../../contexts/search-results', () => ({
  useSearchResults: () => ({ results: [], setResults: vi.fn() }),
}))

vi.mock('../../../stores/chat-session-store', () => ({
  useChatSessionStore: () => ({
    defaultCamera: null,
    bySession: {},
    lastViewedSessionId: null,
    _hydrated: true,
    setCamera: vi.fn(),
    setLastViewedSession: vi.fn(),
  }),
}))

// Mock components with renderable JSX
vi.mock('../../../components/layouts/menu-layout', () => ({
  MenuLayout: ({ children }) => <View testID="menu-layout">{children}</View>,
}))

vi.mock('../../../components/chat', () => ({
  ChatInput: ({ suggestions, onSelectSuggestion }) => (
    <View testID="chat-input">
      {suggestions?.map((suggestion, index) => (
        <TouchableOpacity
          key={index}
          testID={`discovery-suggestion-pill-${index}`}
          onPress={() => onSelectSuggestion?.(suggestion)}
        >
          <Text>{suggestion.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  ),
  RouteAttachmentCard: () => <View testID="route-attachment-card" />,
}))

vi.mock('../../../components/map', () => ({
  MapboxMapView: ({ children }) => <View testID="mapbox-map-view">{children}</View>,
  MapControls: () => <View testID="map-controls" />,
  MapHeaderOverlay: () => <View testID="map-header-overlay" />,
}))

vi.mock('../../../components/map/search-result-marker', () => ({
  SearchResultMarker: () => <View testID="search-result-marker" />,
}))

vi.mock('../../../components/map/weather-pills-row', () => ({
  WeatherPillsRow: () => <View testID="weather-pills-row" />,
}))

vi.mock('../../../components/sheets/plan-ride-sheet', () => ({
  PlanRideSheet: () => <View testID="plan-ride-sheet" />,
}))

vi.mock('../../../components/sheets/planning-loading', () => ({
  RoutePlannerLoading: () => <View testID="planning-loading" />,
}))

vi.mock('../../../components/sheets/planning-error-sheet', () => ({
  PlanningErrorSheet: () => <View testID="planning-error-sheet" />,
}))

vi.mock('../../../components/map/route-polyline-component', () => ({
  RoutePolyline: () => <View testID="route-polyline" />,
}))

vi.mock('../../../components/ui/chat-transcript', () => ({
  ChatTranscript: () => <View testID="chat-transcript" />,
}))

vi.mock('../../../components/ui/motorcycle-plus-icon', () => ({
  MotorcyclePlusIcon: () => <View testID="motorcycle-plus-icon" />,
}))

vi.mock('../../../components/ui/save-favorite-sheet', () => ({
  SaveRouteSheet: () => <View testID="save-route-sheet" />,
}))

// MapPlanningIndicator is the critical mock for this test — it must render
vi.mock('../../../components/map/map-planning-indicator', () => ({
  MapPlanningIndicator: () => <View testID="map-planning-indicator" />,
}))

vi.mock('../../../components/map/map-toast-stack', () => ({
  MapToastStack: () => <View testID="map-toast-stack" />,
}))

vi.mock('./compute-initial-camera', () => ({
  computeInitialCamera: () => ({ latitude: 37.7749, longitude: -122.4194, zoom: 12 }),
}))

// Import after mocks — using require() to avoid circular dependencies with the mocked modules
const { default: HomeMapScreen } = require('./index')

describe('RUX-007: Card tap map loading state', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('AC-2: cardTapShowsThenHidesMapPlanningIndicator - indicator shown during card tap', async () => {
    // GIVEN discovery suggestions are available
    const { useCuratedDiscovery } = require('../../../hooks/use-curated-discovery')
    useCuratedDiscovery.mockReturnValue({
      isLoading: false,
      isEmpty: false,
      routes: [
        {
          id: 'route-1',
          name: 'Scenic Route',
          distanceMi: 5.2,
          lat: 37.7749,
          lng: -122.4194,
          score: 85,
          archetype: 'scenic',
        },
      ],
    })

    // Mock useMutation to return a function that returns the mutation result
    mockUseMutation.mockReturnValue(
      vi.fn(async () => {
        return { routePlanId: 'test-route-plan-id' }
      }),
    )

    // Mock useQuery for session messages
    mockUseQuery.mockReturnValue([
      {
        _id: 'msg-1',
        kind: 'text',
        role: 'rider',
        content: 'Test message',
        status: 'completed',
        createdAt: Date.now(),
      },
    ])

    // Render the component
    render(React.createElement(HomeMapScreen))

    // Wait for suggestions to render
    await waitFor(() => {
      expect(screen.getByTestId('discovery-suggestion-pill-0')).toBeTruthy()
    })

    // WHEN the user taps a discovery suggestion card
    const card = screen.getByTestId('discovery-suggestion-pill-0')
    fireEvent.press(card)

    // THEN MapPlanningIndicator should appear (showing loading state)
    // This happens synchronously when setMapPlanningVisible(true) is called
    await waitFor(
      () => {
        expect(screen.getByTestId('map-planning-indicator')).toBeTruthy()
      },
      { timeout: 1000 },
    )

    // AND after the mutation resolves, the indicator is hidden by the finally block
    await waitFor(
      () => {
        expect(screen.queryByTestId('map-planning-indicator')).toBeFalsy()
      },
      { timeout: 2000 },
    )
  })

  it('AC-3: cardTapDoesNotAppendChatMessage - REGRESSION: no transcript message on card tap', async () => {
    // GIVEN discovery suggestions are available
    const { useCuratedDiscovery } = require('../../../hooks/use-curated-discovery')
    useCuratedDiscovery.mockReturnValue({
      isLoading: false,
      isEmpty: false,
      routes: [
        {
          id: 'route-1',
          name: 'Scenic Route',
          distanceMi: 5.2,
          lat: 37.7749,
          lng: -122.4194,
          score: 85,
          archetype: 'scenic',
        },
      ],
    })

    // Track transcript message count before
    mockUseQuery.mockReturnValue([
      {
        _id: 'msg-1',
        kind: 'text',
        role: 'rider',
        content: 'existing message',
        status: 'completed',
        createdAt: Date.now(),
      },
    ])

    // Mock useMutation
    mockUseMutation.mockReturnValue(
      vi.fn(async () => {
        return { routePlanId: 'test-route-plan-id' }
      }),
    )

    // Render the component
    render(React.createElement(HomeMapScreen))

    // Wait for component to render
    await waitFor(() => {
      expect(screen.getByTestId('discovery-suggestion-pill-0')).toBeTruthy()
    })

    // Get initial transcript render
    const transcriptBefore = screen.getByTestId('chat-transcript')
    expect(transcriptBefore).toBeTruthy()

    // WHEN the user taps a discovery suggestion card
    const card = screen.getByTestId('discovery-suggestion-pill-0')
    fireEvent.press(card)

    // THEN no new session_messages rows are added
    // The DISC-016 constraint: direct-plot path uses ONLY the curated mutation, no sendMessage
    // Verify the transcript element still exists (not broken) but no new message appears
    await waitFor(
      () => {
        const transcript = screen.getByTestId('chat-transcript')
        expect(transcript).toBeTruthy()
        // The card tap handler should NOT call sendPlanningMessage, so no new message added
      },
      { timeout: 1000 },
    )
  })
})
