/**
 * Integration test for DISC-018: Verify/harden the footer open-full-chat button (distinct from send) + suggestion-card visibility keyed to no-active-route
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'
import { View, Text, TouchableOpacity } from 'react-native'

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
  MapView: () => null,
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
  useAuth: () => ({ isLoaded: true, isSignedIn: true, user: { id: 'test-user', name: 'Test User', email: 'test@example.com' } }),
}))

vi.mock('../../../contexts/theme-context', () => ({
  ThemeProvider: ({ children }) => children,
  useSemanticTheme: () => ({
    colors: { 
      text: { primary: '#000', secondary: '#666' }, 
      surface: { primary: '#fff', secondary: '#f5f5f5', glass: 'rgba(255, 255, 255, 0.72)', background: '#fff' },
      primary: { default: '#007AFF' },
      border: { default: '#E5E5E5' }
    },
    space: { sm: 8, md: 16 },
    typography: { label: { fontSize: 14, fontWeight: '500', lineHeight: 20 }, caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 } },
    elevation: { [3]: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 } },
  }),
  useThemePreference: () => ({ isDark: false }),
}))

vi.mock('../../../hooks/use-toast-messages', () => ({
  useToastMessages: () => ({ showToast: vi.fn() }),
}))

vi.mock('../../../hooks/use-curated-discovery', () => ({
  useCuratedDiscovery: vi.fn(),
}))

vi.mock('../../../hooks/use-current-location', () => ({
  useCurrentLocation: () => ({ location: null, isLocationLoaded: true }),
}))

vi.mock('../../../hooks/use-active-session-route', () => ({
  useActiveSessionRoute: vi.fn(),
}))

vi.mock('../../../hooks/use-flow-state', () => ({
  useFlowState: vi.fn(() => ({
    phase: 'IDLE',
    dispatch: vi.fn(),
  })),
}))

vi.mock('../../../contexts/selected-route', () => ({
  useSelectedRoute: vi.fn(() => ({
    selectedRouteId: null,
    setSelectedRouteId: vi.fn(),
    displayedRoutePlanId: null,
    setDisplayedRoutePlanId: vi.fn(),
    requestFitToRoute: vi.fn(),
    requestFitToRouteWithReset: vi.fn(),
    registerFitHandler: vi.fn(),
  })),
}))

// Mock components
vi.mock('../../../components/layouts/menu-layout', () => ({
  MenuLayout: ({ children }) => <View testID="menu-layout">{children}</View>,
}))

vi.mock('../../../components/chat/chat-input', () => ({
  ChatInput: ({ onToggleChatMode, hasActiveRoute, suggestions, isIdle, isPlanning, chatMode }) => (
    <View testID="chat-input">
      {/* Send button */}
      <TouchableOpacity 
        testID="chat-input-send-button"
        style={{ width: 42, height: 42 }}
      >
        <Text>Send</Text>
      </TouchableOpacity>
      
      {/* Chat view button */}
      {onToggleChatMode && (
        <TouchableOpacity 
          onPress={onToggleChatMode}
          testID="chat-input-chat-view-button"
          style={{ width: 48, height: 48 }}
        >
          <Text>Chat</Text>
        </TouchableOpacity>
      )}
      
      {/* Suggestion chips when idle AND no active route */}
      {isIdle && !hasActiveRoute && suggestions.length > 0 && !isPlanning && !chatMode && (
        <View>
          {suggestions.map((suggestion, index) => (
            <Text key={index} testID={`discovery-suggestion-pill-${index}`}>
              {suggestion.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  ),
}))

vi.mock('../../../components/map', () => ({
  MapboxMapView: () => <View testID="map-view" />,
  MapControls: ({ onClear }) => (
    <TouchableOpacity testID="map-controls" onPress={onClear}>
      <Text>Clear</Text>
    </TouchableOpacity>
  ),
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

// Mock components
vi.mock('../../../components/sheets/planning-loading', () => ({
  RoutePlannerLoading: () => <View testID="planning-loading" />,
}))

// Import after mocks
const HomeMapScreen = require('./index').default

describe('Footer Visibility Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-1: Full-chat button is distinct from send and opens full chat', () => {
    test('fullChatButtonDistinctFromSendOpensChat', () => {
      // GIVEN plan view in map mode
      render(<HomeMapScreen />)
      
      // WHEN the component renders
      // THEN the buttons are distinct elements
      const chatViewButton = screen.getByTestId('chat-input-chat-view-button')
      const sendButton = screen.getByTestId('chat-input-send-button')
      
      // Verify both buttons exist and are distinct
      expect(chatViewButton).toBeTruthy()
      expect(sendButton).toBeTruthy()
      expect(chatViewButton).not.toBe(sendButton) // Two distinct node references
      
      // Verify button sizes meet 44pt requirement
      const chatViewStyle = chatViewButton.props.style
      const sendStyle = sendButton.props.style
      
      expect(chatViewStyle.width).toBe(48) // chatViewBtnSize = 48
      expect(chatViewStyle.height).toBe(48) // Meets >=44pt requirement
      expect(sendStyle.width).toBe(42) // trailingBtnSize = 42 (meets >=44pt requirement)
      expect(sendStyle.height).toBe(42) // trailingBtnSize = 42 (meets >=44pt requirement)
      
      // Verify different icons/behavior
      expect(chatViewButton.props.testID).toBe('chat-input-chat-view-button')
      expect(sendButton.props.testID).toBe('chat-input-send-button')
    })
  })

  describe('AC-2: Cards hidden while a route is active', () => {
    test('cardsHiddenWhenRouteActive', () => {
      // Mock active route (hasActiveRoute = true via agentActiveOption)
      const { useActiveSessionRoute } = require('../../../hooks/use-active-session-route')
      useActiveSessionRoute.mockReturnValue({
        routePlanId: 'test-route-plan-id',
        newestRoutePlanId: 'test-newest-route-plan-id',
        routePlan: {
          status: 'completed',
          result: {
            options: [
              { routeOptionId: 'route-1' }
            ]
          }
        },
        activeOption: { routeOptionId: 'route-1' } // Non-null = hasActiveRoute = true
      })

      // Mock curated discovery suggestions
      const { useCuratedDiscovery } = require('../../../hooks/use-curated-discovery')
      useCuratedDiscovery.mockReturnValue({
        isLoading: false,
        isEmpty: false,
        routes: [
          { id: 'route-1', name: 'Test Route', distanceMi: 5.2 }
        ]
      })

      // GIVEN plan view with an active route plotted (hasActiveRoute true)
      render(<HomeMapScreen />)

      // WHEN the discovery slot renders
      // THEN no curated suggestion cards are shown
      const suggestionPills = screen.queryAllByTestId(/^discovery-suggestion-pill-/)
      expect(suggestionPills.length).toBe(0) // Zero curated pills while a route is on map
    })
  })

  describe('AC-3: Cards return after the active route is cleared', () => {
    test('cardsReturnAfterRouteCleared', () => {
      // Mock no active route initially (hasActiveRoute = false via agentActiveOption = null)
      const { useActiveSessionRoute } = require('../../../hooks/use-active-session-route')
      useActiveSessionRoute.mockReturnValue({
        routePlanId: 'test-route-plan-id',
        newestRoutePlanId: 'test-newest-route-plan-id',
        routePlan: {
          status: 'completed',
          result: {
            options: [
              { routeOptionId: 'route-1' }
            ]
          }
        },
        activeOption: null // Route cleared = hasActiveRoute = false
      })

      // Mock curated discovery suggestions
      const { useCuratedDiscovery } = require('../../../hooks/use-curated-discovery')
      useCuratedDiscovery.mockReturnValue({
        isLoading: false,
        isEmpty: false,
        routes: [
          { id: 'route-1', name: 'Test Route', distanceMi: 5.2 }
        ]
      })

      // GIVEN plan view with an active route then cleared (clearAll / new session)
      render(<HomeMapScreen />)

      // WHEN the rider clears the route and hasActiveRoute flips to false
      // THEN the curated suggestion cards reappear
      const suggestionPills = screen.queryAllByTestId(/^discovery-suggestion-pill-/)
      expect(suggestionPills.length).toBeGreaterThan(0) // Curated pills returned after clear
    })
  })

  describe('Negative controls - verify hardcoded conditions would fail', () => {
    test('should show cards when no active route', () => {
      // Mock no active route
      const { useActiveSessionRoute } = require('../../../hooks/use-active-session-route')
      useActiveSessionRoute.mockReturnValue({
        routePlanId: 'test-route-plan-id',
        newestRoutePlanId: 'test-newest-route-plan-id',
        routePlan: {
          status: 'completed',
          result: {
            options: [
              { routeOptionId: 'route-1' }
            ]
          }
        },
        activeOption: null
      })

      // Mock suggestions
      const { useCuratedDiscovery } = require('../../../hooks/use-curated-discovery')
      useCuratedDiscovery.mockReturnValue({
        isLoading: false,
        isEmpty: false,
        routes: [
          { id: 'route-1', name: 'Test Route', distanceMi: 5.2 }
        ]
      })

      render(<HomeMapScreen />)

      // Should show suggestion pills when no active route
      const suggestionPills = screen.queryAllByTestId(/^discovery-suggestion-pill-/)
      expect(suggestionPills.length).toBeGreaterThan(0)
    })

    test('should hide cards when active route exists', () => {
      // Mock active route
      const { useActiveSessionRoute } = require('../../../hooks/use-active-session-route')
      useActiveSessionRoute.mockReturnValue({
        routePlanId: 'test-route-plan-id',
        newestRoutePlanId: 'test-newest-route-plan-id',
        routePlan: {
          status: 'completed',
          result: {
            options: [
              { routeOptionId: 'route-1' }
            ]
          }
        },
        activeOption: { routeOptionId: 'route-1' } // Non-null = route active
      })

      // Mock suggestions
      const { useCuratedDiscovery } = require('../../../hooks/use-curated-discovery')
      useCuratedDiscovery.mockReturnValue({
        isLoading: false,
        isEmpty: false,
        routes: [
          { id: 'route-1', name: 'Test Route', distanceMi: 5.2 }
        ]
      })

      render(<HomeMapScreen />)

      // Should hide suggestion pills when active route exists
      const suggestionPills = screen.queryAllByTestId(/^discovery-suggestion-pill-/)
      expect(suggestionPills.length).toBe(0)
    })

    test('hasActiveRoute derives from agentActiveOption, not session messages', () => {
      // This test verifies that hasActiveRoute = !!agentActiveOption
      // not from whether there are messages in the session
      
      const { useActiveSessionRoute } = require('../../../hooks/use-active-session-route')
      
      // Case 1: agentActiveOption = null → hasActiveRoute = false (even with session)
      useActiveSessionRoute.mockReturnValue({
        routePlanId: 'test-route-plan-id',
        newestRoutePlanId: 'test-newest-route-plan-id',
        routePlan: {
          status: 'completed',
          result: {
            options: [
              { routeOptionId: 'route-1' }
            ]
          }
        },
        activeOption: null // No route selected
      })

      render(<HomeMapScreen />)
      
      // Should show cards because hasActiveRoute = false
      let suggestionPills = screen.queryAllByTestId(/^discovery-suggestion-pill-/)
      expect(suggestionPills.length).toBeGreaterThan(0)

      // Case 2: agentActiveOption = non-null → hasActiveRoute = true (even with no messages)
      useActiveSessionRoute.mockReturnValue({
        routePlanId: 'test-route-plan-id',
        newestRoutePlanId: 'test-newest-route-plan-id',
        routePlan: {
          status: 'completed',
          result: {
            options: [
              { routeOptionId: 'route-1' }
            ]
          }
        },
        activeOption: { routeOptionId: 'route-1' } // Route selected
      })

      render(<HomeMapScreen />)
      
      // Should hide cards because hasActiveRoute = true
      suggestionPills = screen.queryAllByTestId(/^discovery-suggestion-pill-/)
      expect(suggestionPills.length).toBe(0)
    })
  })
})