/**
 * E2E tests for Home Map Long-Press Integration (US-050)
 *
 * Acceptance Criteria:
 * - AC1: HomeMap displays route with polylines, When: User long-presses a route segment, Then: Segment highlights with visual feedback
 * - AC2: Segment is long-pressed, When: Long-press completes (500ms), Then: Haptic feedback triggers
 * - AC3: Long-press completes, When: Segment selected, Then: SaveFavoriteSheet renders with segment geometry
 * - AC4: Multiple route segments, When: User long-presses different segment, Then: Only pressed segment highlights
 * - AC5: User pans map, When: User drags after long-press threshold, Then: Long-press doesn't trigger (gesture conflict)
 * - AC6: User taps segment, When: User short-taps (<500ms), Then: Segment doesn't highlight, no sheet
 * - AC7: Route is active navigation, When: User long-presses segment, Then: Highlight and sheet work as expected
 * - AC8: Route is planned (not active), When: User long-presses segment, Then: Highlight and sheet work as expected
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { State } from 'react-native-gesture-handler'
import * as Haptics from 'expo-haptics'
import type { BuiltPolyline } from '../../../../components/map/route-polyline'
import { RoutePolyline } from '../../../../components/map/route-polyline-component'
import { ThemeProvider } from 'react-native-paper'
import type { ExtendedTheme } from '../../../../styles/types'

// Mock theme provider wrapper
const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    warningContainer: { default: '#FFF8E7' },
    onWarningContainer: { default: '#5C3E00' },
    danger: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#1B1715' },
    surfaceVariant: { default: '#2B2725' },
    background: { default: '#1B1715' },
    onSurface: { default: '#F5F0EB', muted: '#9CA3AF', subtle: '#6B7280' },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#2B2725' },
    onSecondaryContainer: { default: '#F5F0EB', muted: '#9CA3AF', subtle: '#6B7280' },
    border: { default: '#2B2725' },
    input: { default: '#2B2725' },
    ring: { default: '#B87333' },
    locationPoiFill: { default: '#EDEDED' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8' },
    card: { default: '#24272B' },
    popover: { default: '#24272B' },
    accent: { default: '#88C7A6' },
    orange: { default: '#FF6B35' },
    muted: { default: '#938F99' },
    divider: { default: '#CAC4D0' },
    scrim: { default: '#000000' },
    routeSelected: { default: '#FF6B35' },
    routeAlternate: { default: '#60a5fa' },
  },
  space: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    '2xl': 32,
    '3xl': 48,
    '4xl': 64,
  },
  radius: {
    none: 0,
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    '2xl': 20,
    full: 9999,
  },
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
    0: { shadowColor: '#000000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 5 },
  },
}

const mockTheme = {
  ...mockSemanticTheme,
  dark: true,
  mode: 'adaptive' as const,
  roundness: 4,
  animation: {
    scale: 1.0,
  },
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
)

describe('HomeMap Long-Press Integration (US-050)', () => {
  const mockPolylines: BuiltPolyline[] = [
    {
      id: 'leg-0',
      coordinates: [
        { latitude: 37.7749, longitude: -122.4194 },
        { latitude: 37.7750, longitude: -122.4195 },
      ],
      strokeColor: '#6750A4',
      strokeWidth: 4,
    },
    {
      id: 'leg-1',
      coordinates: [
        { latitude: 37.7750, longitude: -122.4195 },
        { latitude: 37.7751, longitude: -122.4196 },
      ],
      strokeColor: '#6750A4',
      strokeWidth: 4,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC1 & AC3: RoutePolyline component renders and handles segment selection', () => {
    it('should render route polylines with proper testIDs', () => {
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      // Verify both segments are rendered
      expect(getByTestId('route-polyline--segment-leg-0')).toBeDefined()
      expect(getByTestId('route-polyline--segment-leg-1')).toBeDefined()
    })

    it('should trigger callback with segment geometry when long-pressed', () => {
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      // Simulate long-press gesture completing
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Verify callback was invoked with correct data
      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'leg-0',
          geometry: expect.any(String),
          bounds: expect.objectContaining({
            northEast: expect.any(Object),
            southWest: expect.any(Object)
          }),
          segmentType: 'leg',
          legIndex: 0
        })
      )
    })

    it('should provide encoded polyline geometry in callback', () => {
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      const callbackData = onSegmentSelect.mock.calls[0][0]
      // Geometry should be a polyline-encoded string (not JSON)
      expect(callbackData.geometry).not.toMatch(/^\[.*\]$/)
      expect(callbackData.geometry.length).toBeGreaterThan(0)
    })
  })

  describe('AC2 & AC4: Haptic feedback and segment highlighting', () => {
    it('should trigger haptic feedback on long-press completion', () => {
      const hapticSpy = vi.spyOn(Haptics, 'impactAsync')
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Verify haptic feedback was triggered
      expect(hapticSpy).toHaveBeenCalledWith(Haptics.ImpactFeedbackStyle.Medium)
    })

    it('should only highlight the selected segment', () => {
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            selectedSegmentId="leg-0"
            testID="route-polyline"
          />
        </TestWrapper>
      )

      // Both segments should be rendered
      const segment0 = getByTestId('route-polyline--segment-leg-0--polyline')
      const segment1 = getByTestId('route-polyline--segment-leg-1--polyline')

      expect(segment0).toBeDefined()
      expect(segment1).toBeDefined()

      // Trigger long-press on leg-1
      const segment1Wrapper = getByTestId('route-polyline--segment-leg-1')
      fireEvent(segment1Wrapper, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Callback should only be for leg-1
      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'leg-1'
        })
      )
    })

    it('should switch highlight when different segment is pressed', () => {
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      const segment0 = getByTestId('route-polyline--segment-leg-0')
      const segment1 = getByTestId('route-polyline--segment-leg-1')

      // Press leg-0 first
      fireEvent(segment0, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'leg-0'
        })
      )

      // Then press leg-1
      fireEvent(segment1, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Should have two calls, one for each segment
      expect(onSegmentSelect).toHaveBeenCalledTimes(2)
      expect(onSegmentSelect).toHaveBeenLastCalledWith(
        expect.objectContaining({
          segmentId: 'leg-1'
        })
      )
    })
  })

  describe('AC5 & AC6: Gesture conflicts and early release', () => {
    it('should not trigger callback when gesture is cancelled', () => {
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      // Simulate gesture cancellation (user drags beyond maxDist)
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.CANCELLED }
      })

      // Callback should NOT be invoked
      expect(onSegmentSelect).not.toHaveBeenCalled()
    })

    it('should not trigger callback when gesture fails', () => {
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      // Simulate gesture failure
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.FAILED }
      })

      // Callback should NOT be invoked
      expect(onSegmentSelect).not.toHaveBeenCalled()
    })

    it('should not trigger haptic feedback on cancelled gesture', () => {
      const hapticSpy = vi.spyOn(Haptics, 'impactAsync')
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={mockPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.CANCELLED }
      })

      // Haptic feedback should NOT be triggered
      expect(hapticSpy).not.toHaveBeenCalled()
    })
  })

  describe('AC7 & AC8: Active navigation and planned routes', () => {
    it('should handle overview polyline (active navigation)', () => {
      const activeRoutePolylines: BuiltPolyline[] = [
        {
          id: 'overview',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7750, longitude: -122.4195 },
          ],
          strokeColor: '#6750A4',
          strokeWidth: 6,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={activeRoutePolylines}
            onSegmentSelect={onSegmentSelect}
            testID="active-route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('active-route-polyline--segment-overview')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Should trigger callback with overview segment type
      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'overview',
          segmentType: 'overview'
        })
      )
    })

    it('should handle leg polylines (planned route)', () => {
      const plannedRoutePolylines: BuiltPolyline[] = [
        {
          id: 'leg-0',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7750, longitude: -122.4195 },
          ],
          strokeColor: '#6750A4',
          strokeWidth: 4,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={plannedRoutePolylines}
            onSegmentSelect={onSegmentSelect}
            testID="planned-route-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('planned-route-polyline--segment-leg-0')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Should trigger callback with leg segment type
      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'leg-0',
          segmentType: 'leg',
          legIndex: 0
        })
      )
    })

    it('should handle overlay segments (wind, rain, temp)', () => {
      const overlayPolylines: BuiltPolyline[] = [
        {
          id: 'wind-0-0-1000',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7750, longitude: -122.4195 },
          ],
          strokeColor: '#31A362',
          strokeWidth: 6,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={overlayPolylines}
            onSegmentSelect={onSegmentSelect}
            testID="overlay-polyline"
          />
        </TestWrapper>
      )

      const segment = getByTestId('overlay-polyline--segment-wind-0-0-1000')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Should trigger callback with wind segment type
      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'wind-0-0-1000',
          segmentType: 'wind',
          legIndex: 0
        })
      )
    })
  })

  describe('Bounds calculation accuracy', () => {
    it('should calculate correct bounds for segment coordinates', () => {
      const multiPointPolyline: BuiltPolyline[] = [
        {
          id: 'test-segment',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
            { latitude: 37.7949, longitude: -122.3994 },
          ],
          strokeColor: '#6750A4',
          strokeWidth: 4,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline
            polylines={multiPointPolyline}
            onSegmentSelect={onSegmentSelect}
            testID="bounds-test"
          />
        </TestWrapper>
      )

      const segment = getByTestId('bounds-test--segment-test-segment')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      const callbackData = onSegmentSelect.mock.calls[0][0]

      // Verify bounds calculation
      expect(callbackData.bounds.northEast.latitude).toBe(37.7949) // Max latitude
      expect(callbackData.bounds.northEast.longitude).toBe(-122.3994) // Max longitude
      expect(callbackData.bounds.southWest.latitude).toBe(37.7749) // Min latitude
      expect(callbackData.bounds.southWest.longitude).toBe(-122.4194) // Min longitude
    })
  })
})
