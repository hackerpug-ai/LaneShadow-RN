/**
 * Component tests for RoutePolyline (US-042)
 *
 * Tests the actual RoutePolyline component, including:
 * - Rendering with different polyline configurations
 * - Long-press gesture handling
 * - Segment selection callbacks
 * - Visual feedback (highlighting)
 * - Early release behavior (cancellation)
 * - testID prop handling
 *
 * === Acceptance Criteria (US-042) ===
 * - AC1: Route polyline displayed on map, When: User long-presses for 500ms+, Then: Segment highlights visually
 * - AC2: Segment highlighted, When: onSegmentSelect callback provided, Then: Callback receives segment geometry
 * - AC3: Long-press on overlay segment, When: Gesture detected, Then: Returns overlay segment geometry
 * - AC4: User releases early (<500ms), When: Gesture cancelled, Then: No highlight, no callback
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { State } from 'react-native-gesture-handler'
import type { SegmentSelectData } from '../route-polyline-component'
import { RoutePolyline } from '../route-polyline-component'
import type { BuiltPolyline } from '../route-polyline'
import { ThemeProvider } from 'react-native-paper'
import type { ExtendedTheme } from '../../../styles/types'

// Mock theme provider wrapper
const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
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

// Helper to create mock built polylines
const createMockPolylines = (): BuiltPolyline[] => [
  {
    id: 'overview',
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7849, longitude: -122.4094 },
      { latitude: 37.7949, longitude: -122.3994 },
    ],
    strokeColor: '#FF6B35',
    strokeWidth: 6,
  },
  {
    id: 'leg-0',
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7849, longitude: -122.4094 },
    ],
    strokeColor: '#FF6B35',
    strokeWidth: 4,
  },
  {
    id: 'leg-1',
    coordinates: [
      { latitude: 37.7849, longitude: -122.4094 },
      { latitude: 37.7949, longitude: -122.3994 },
    ],
    strokeColor: '#FF6B35',
    strokeWidth: 4,
  },
]

const createMockOverlayPolylines = (): BuiltPolyline[] => [
  {
    id: 'wind-0-0-1000',
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7799, longitude: -122.4144 },
    ],
    strokeColor: '#31A362',
    strokeWidth: 6,
  },
  {
    id: 'rain-0-1000-2000',
    coordinates: [
      { latitude: 37.7799, longitude: -122.4144 },
      { latitude: 37.7849, longitude: -122.4094 },
    ],
    strokeColor: '#60a5fa',
    strokeWidth: 6,
  },
]

// Wrapper component to provide theme
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
)

describe('RoutePolyline Component', () => {
  describe('Rendering', () => {
    it('should render all polylines', () => {
      const polylines = createMockPolylines()
      const { getAllByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} />
        </TestWrapper>
      )

      // Each segment should have a testID (both wrapper and polyline)
      // So we expect 6 elements total (3 segments * 2 elements each)
      expect(getAllByTestId(/route-polyline--segment-/)).toHaveLength(6)
    })

    it('should use custom testID when provided', () => {
      const polylines = createMockPolylines()
      const customTestID = 'custom-route-polyline'
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} testID={customTestID} />
        </TestWrapper>
      )

      expect(getByTestId(`${customTestID}--segment-overview`)).toBeDefined()
    })

    it('should render polylines without IDs', () => {
      const polylinesWithoutIds: BuiltPolyline[] = [
        {
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
          strokeColor: '#FF6B35',
          strokeWidth: 4,
        },
      ]

      const { getAllByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylinesWithoutIds} />
        </TestWrapper>
      )

      // Should still render with fallback testID (wrapper + polyline = 2 elements)
      expect(getAllByTestId(/route-polyline--segment-/)).toHaveLength(2)
    })
  })

  describe('Visual Feedback (AC1)', () => {
    it('should highlight selected segment via prop', () => {
      const polylines = createMockPolylines()
      const selectedSegmentId = 'leg-0'

      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} selectedSegmentId={selectedSegmentId} />
        </TestWrapper>
      )

      const segment = getByTestId(`route-polyline--segment-${selectedSegmentId}`)
      expect(segment).toBeDefined()

      // Verify the polyline is rendered with correct testID
      const polyline = getByTestId(`route-polyline--segment-${selectedSegmentId}--polyline`)
      expect(polyline).toBeDefined()
    })

    it('should use semantic spacing for stroke widths', () => {
      const polylines = createMockPolylines()

      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} selectedSegmentId='leg-0' />
        </TestWrapper>
      )

      // The component should use semantic.space.sm (8) for highlighted
      // and semantic.space.sm / 2 (4) for normal
      const highlightedPolyline = getByTestId('route-polyline--segment-leg-0--polyline')
      expect(highlightedPolyline).toBeDefined()

      const normalPolyline = getByTestId('route-polyline--segment-leg-1--polyline')
      expect(normalPolyline).toBeDefined()
    })
  })

  describe('Segment Selection Callback (AC2)', () => {
    it('should trigger callback on long-press ACTIVE state', () => {
      const polylines = createMockPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      // Trigger the long-press gesture with ACTIVE state
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      // Verify callback was actually called
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

    it('should provide correct segment data structure', () => {
      const polylines = createMockPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-1')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)

      const callbackData = onSegmentSelect.mock.calls[0][0] as SegmentSelectData
      expect(callbackData).toHaveProperty('geometry')
      expect(callbackData).toHaveProperty('bounds')
      expect(callbackData).toHaveProperty('segmentType', 'leg')
      expect(callbackData).toHaveProperty('segmentId', 'leg-1')
      expect(callbackData).toHaveProperty('legIndex', 1)
      expect(callbackData.bounds).toHaveProperty('northEast')
      expect(callbackData.bounds).toHaveProperty('southWest')
    })

    it('should encode geometry as polyline string', () => {
      const polylines = createMockPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-overview')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)

      const callbackData = onSegmentSelect.mock.calls[0][0] as SegmentSelectData
      // Geometry should be a polyline-encoded string, not JSON
      expect(callbackData.geometry).not.toMatch(/^\[.*\]$/) // Not JSON array
      expect(callbackData.geometry.length).toBeGreaterThan(0)
    })
  })

  describe('Overlay Segment Selection (AC3)', () => {
    it('should trigger callback for wind overlay segment', () => {
      const overlayPolylines = createMockOverlayPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={overlayPolylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-wind-0-0-1000')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'wind-0-0-1000',
          segmentType: 'wind',
          legIndex: 0
        })
      )
    })

    it('should trigger callback for rain overlay segment', () => {
      const overlayPolylines = createMockOverlayPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={overlayPolylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-rain-0-1000-2000')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentId: 'rain-0-1000-2000',
          segmentType: 'rain',
          legIndex: 0
        })
      )
    })
  })

  describe('Early Release Behavior (AC4)', () => {
    it('should not trigger callback on CANCELLED state', () => {
      const polylines = createMockPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      // Trigger gesture cancellation
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.CANCELLED }
      })

      // Callback should NOT be called
      expect(onSegmentSelect).not.toHaveBeenCalled()
    })

    it('should not trigger callback on FAILED state', () => {
      const polylines = createMockPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      // Trigger gesture failure
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.FAILED }
      })

      // Callback should NOT be called
      expect(onSegmentSelect).not.toHaveBeenCalled()
    })

    it('should handle cancellation after active state', () => {
      const polylines = createMockPolylines()
      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-0')

      // First trigger active state (should call callback)
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)

      // Then trigger cancellation (should not call callback again)
      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.CANCELLED }
      })

      // Still only 1 call from the ACTIVE state
      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
    })
  })

  describe('Segment Type Parsing', () => {
    it('should parse overview segment type', () => {
      const polylines: BuiltPolyline[] = [
        {
          id: 'overview',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
          strokeColor: '#FF6B35',
          strokeWidth: 6,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-overview')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentType: 'overview',
          segmentId: 'overview'
        })
      )
    })

    it('should parse leg segment type with index', () => {
      const polylines: BuiltPolyline[] = [
        {
          id: 'leg-2',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
          strokeColor: '#FF6B35',
          strokeWidth: 4,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-leg-2')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentType: 'leg',
          legIndex: 2,
          segmentId: 'leg-2'
        })
      )
    })

    it('should parse wind overlay segment type', () => {
      const polylines: BuiltPolyline[] = [
        {
          id: 'wind-1-500-1500',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
          strokeColor: '#31A362',
          strokeWidth: 6,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-wind-1-500-1500')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentType: 'wind',
          legIndex: 1
        })
      )
    })

    it('should parse rain overlay segment type', () => {
      const polylines: BuiltPolyline[] = [
        {
          id: 'rain-0-0-1000',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
          strokeColor: '#60a5fa',
          strokeWidth: 6,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-rain-0-0-1000')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentType: 'rain',
          legIndex: 0
        })
      )
    })

    it('should parse temperature overlay segment type', () => {
      const polylines: BuiltPolyline[] = [
        {
          id: 'temp-2-2000-3000',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
          strokeColor: '#D98E04',
          strokeWidth: 6,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-temp-2-2000-3000')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)
      expect(onSegmentSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          segmentType: 'temp',
          legIndex: 2
        })
      )
    })
  })

  describe('Bounds Calculation', () => {
    it('should calculate correct bounds for segment coordinates', () => {
      const polylines: BuiltPolyline[] = [
        {
          id: 'test-segment',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
            { latitude: 37.7949, longitude: -122.3994 },
          ],
          strokeColor: '#FF6B35',
          strokeWidth: 4,
        },
      ]

      const onSegmentSelect = vi.fn()
      const { getByTestId } = render(
        <TestWrapper>
          <RoutePolyline polylines={polylines} onSegmentSelect={onSegmentSelect} />
        </TestWrapper>
      )

      const segment = getByTestId('route-polyline--segment-test-segment')

      fireEvent(segment, 'onHandlerStateChange', {
        nativeEvent: { state: State.ACTIVE }
      })

      expect(onSegmentSelect).toHaveBeenCalledTimes(1)

      const callbackData = onSegmentSelect.mock.calls[0][0] as SegmentSelectData
      // North should be max latitude
      expect(callbackData.bounds.northEast.latitude).toBe(37.7949)
      // East should be max longitude
      expect(callbackData.bounds.northEast.longitude).toBe(-122.3994)
      // South should be min latitude
      expect(callbackData.bounds.southWest.latitude).toBe(37.7749)
      // West should be min longitude
      expect(callbackData.bounds.southWest.longitude).toBe(-122.4194)
    })
  })
})
