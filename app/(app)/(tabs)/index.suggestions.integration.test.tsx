/**
 * Integration test for DISC-017: Discovery slot shows curated cards only — never generic IDLE_SUGGESTIONS prompts
 */

import { render, screen, waitFor } from '@testing-library/react-native'
import { describe, expect, it, vi } from 'vitest'

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
    colors: { text: { primary: '#000', secondary: '#666' }, surface: { primary: '#fff', secondary: '#f5f5f5', glass: 'rgba(255, 255, 255, 0.72)', background: '#fff' } },
    typography: { label: { fontSize: 14, fontWeight: '500', lineHeight: 20 }, caption: { fontSize: 12, fontWeight: '400', lineHeight: 16 } },
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

// Mock components
vi.mock('../../../components/layouts/menu-layout', () => ({
  MenuLayout: ({ children }) => <View testID="menu-layout">{children}</View>,
}))

vi.mock('../../../components/chat', () => ({
  ChatInput: ({ suggestions, testID }) => (
    <View testID={testID}>
      {suggestions?.map((suggestion, index) => (
        <Text key={index} testID={`suggestion-${index}`}>
          {suggestion}
        </Text>
      ))}
    </View>
  ),
}))

vi.mock('../../../components/map', () => ({
  MapboxMapView: () => <View testID="map-view" />,
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

// Import after mocks
const HomeMapScreen = require('./index').default

describe('DISC-017: Discovery slot behavior', () => {
  it('RED phase: demonstrates current bug - shows IDLE_SUGGESTIONS when curated routes empty', async () => {
    // ARRANGE: Mock hook to return empty routes (current bug scenario)
    const { useCuratedDiscovery } = require('../../../hooks/use-curated-discovery')
    useCuratedDiscovery.mockReturnValue({
      routes: [], // Empty but resolved
      isLoading: false,
      isEmpty: true,
    })

    // ACT: Render the component
    render(<HomeMapScreen />)

    // ASSERT: This demonstrates the current bug - shows IDLE_SUGGESTIONS when it shouldn't
    await waitFor(() => {
      // Currently BUGGY: Shows IDLE_SUGGESTIONS when empty (should show 'no nearby routes' message)
      expect(screen.getByText('Plan a scenic ride')).toBeTruthy()
      expect(screen.getByText('Ride to the coast')).toBeTruthy()
      
      // Should NOT show curated pills when none exist
      expect(screen.queryByTestId('suggestion-0')).toBeNull()
    })
  })
})