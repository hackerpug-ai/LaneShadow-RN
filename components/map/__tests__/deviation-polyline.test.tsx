/**
 * Component tests for DeviationPolyline (DESIGN-426)
 *
 * Tests the DeviationPolyline component with Mapbox ShapeSource + LineLayer:
 * - Rendering segments with type-based colors
 * - Active/inactive state stroke width variation
 * - Coordinate conversion from Google [lat, lng] to Mapbox [lng, lat]
 * - Segment skipping for insufficient coordinates
 *
 * === Acceptance Criteria ===
 * - AC1: DeviationPolyline renders Mapbox LineLayer segments
 * - AC2: Original route segments render in gray/muted color
 * - AC3: Detour path segments render in orange
 * - AC4: Reconnect point segments render in green
 * - AC5: Active state increases stroke width
 */

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react-native'
import { DeviationPolyline } from '../deviation-polyline'
import type { DeviationSegment } from '../deviation-polyline'
import { ThemeProvider } from 'react-native-paper'
import type { ExtendedTheme } from '../../../styles/types'

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
    deviationOriginalRoute: { default: '#9CA3AF' },
    deviationDetourPath: { default: '#FF6B35' },
    deviationReconnectPoint: { default: '#31A362' },
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

// Create standard test segments with enough coordinates for LineString
const createMockSegments = (): DeviationSegment[] => [
  {
    type: 'original',
    coordinates: [
      { latitude: 37.7749, longitude: -122.4194 },
      { latitude: 37.7849, longitude: -122.4094 },
    ],
  },
  {
    type: 'detour',
    coordinates: [
      { latitude: 37.7849, longitude: -122.4094 },
      { latitude: 37.7799, longitude: -122.4144 },
      { latitude: 37.7849, longitude: -122.3994 },
    ],
  },
  {
    type: 'reconnect',
    coordinates: [
      { latitude: 37.7849, longitude: -122.3994 },
      { latitude: 37.7949, longitude: -122.3894 },
    ],
  },
]

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
)

describe('DeviationPolyline Component', () => {
  describe('Rendering (AC1, AC3)', () => {
    it('renders_segments_with_type_based_colors', () => {
      const segments = createMockSegments()
      const { UNSAFE_root } = render(
        <TestWrapper>
          <DeviationPolyline segments={segments} />
        </TestWrapper>
      )

      // Each segment should render a ShapeSource + LineLayer pair
      const shapeSources = UNSAFE_root.findAllByType('ShapeSource')
      const lineLayers = UNSAFE_root.findAllByType('LineLayer')

      expect(shapeSources).toHaveLength(3)
      expect(lineLayers).toHaveLength(3)

      // Verify original segment uses muted/gray color
      const originalLayer = lineLayers.find(
        (layer: any) => layer.props.id === 'deviation-original-0-layer'
      )
      expect(originalLayer).toBeDefined()
      expect(originalLayer.props.style.lineColor).toBe('#9CA3AF')

      // Verify detour segment uses orange color
      const detourLayer = lineLayers.find(
        (layer: any) => layer.props.id === 'deviation-detour-1-layer'
      )
      expect(detourLayer).toBeDefined()
      expect(detourLayer.props.style.lineColor).toBe('#FF6B35')

      // Verify reconnect segment uses green/success color
      const reconnectLayer = lineLayers.find(
        (layer: any) => layer.props.id === 'deviation-reconnect-2-layer'
      )
      expect(reconnectLayer).toBeDefined()
      expect(reconnectLayer.props.style.lineColor).toBe('#31A362')
    })

    it('should use custom testID when provided', () => {
      const segments = createMockSegments()
      const { getByTestId } = render(
        <TestWrapper>
          <DeviationPolyline segments={segments} testID="custom-deviation" />
        </TestWrapper>
      )

      expect(getByTestId('custom-deviation-original-0')).toBeDefined()
      expect(getByTestId('custom-deviation-detour-1')).toBeDefined()
      expect(getByTestId('custom-deviation-reconnect-2')).toBeDefined()
    })

    it('should use default testID when not provided', () => {
      const segments = createMockSegments()
      const { getByTestId } = render(
        <TestWrapper>
          <DeviationPolyline segments={segments} />
        </TestWrapper>
      )

      expect(getByTestId('deviation-original-0')).toBeDefined()
      expect(getByTestId('deviation-detour-1')).toBeDefined()
      expect(getByTestId('deviation-reconnect-2')).toBeDefined()
    })
  })

  describe('Active State (AC5)', () => {
    it('should increase stroke width when active', () => {
      const segments = createMockSegments()
      const { UNSAFE_root } = render(
        <TestWrapper>
          <DeviationPolyline segments={segments} isActive={true} strokeWidth={4} />
        </TestWrapper>
      )

      const lineLayers = UNSAFE_root.findAllByType('LineLayer')
      // Active state: strokeWidth (4) + 2 = 6
      lineLayers.forEach((layer: any) => {
        expect(layer.props.style.lineWidth).toBe(6)
      })
    })

    it('should use base stroke width when inactive', () => {
      const segments = createMockSegments()
      const { UNSAFE_root } = render(
        <TestWrapper>
          <DeviationPolyline segments={segments} isActive={false} strokeWidth={4} />
        </TestWrapper>
      )

      const lineLayers = UNSAFE_root.findAllByType('LineLayer')
      // Inactive: just strokeWidth (4)
      lineLayers.forEach((layer: any) => {
        expect(layer.props.style.lineWidth).toBe(4)
      })
    })
  })

  describe('Coordinate Conversion', () => {
    it('should convert coordinates to Mapbox [lng, lat] format', () => {
      const segments: DeviationSegment[] = [
        {
          type: 'detour',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
        },
      ]

      const { UNSAFE_root } = render(
        <TestWrapper>
          <DeviationPolyline segments={segments} />
        </TestWrapper>
      )

      const shapeSource = UNSAFE_root.findByType('ShapeSource')
      const shape = shapeSource.props.shape as any

      expect(shape.type).toBe('FeatureCollection')
      expect(shape.features[0].geometry.type).toBe('LineString')

      const coords = shape.features[0].geometry.coordinates
      expect(coords).toHaveLength(2)

      // Google [37.7749, -122.4194] -> Mapbox [-122.4194, 37.7749]
      expect(coords[0][0]).toBe(-122.4194)
      expect(coords[0][1]).toBe(37.7749)

      // Google [37.7849, -122.4094] -> Mapbox [-122.4094, 37.7849]
      expect(coords[1][0]).toBe(-122.4094)
      expect(coords[1][1]).toBe(37.7849)
    })
  })

  describe('Edge Cases', () => {
    it('should skip segments with fewer than 2 coordinates', () => {
      const segments: DeviationSegment[] = [
        {
          type: 'original',
          coordinates: [], // Empty - should be skipped
        },
        {
          type: 'detour',
          coordinates: [{ latitude: 37.7749, longitude: -122.4194 }], // Single point - should be skipped
        },
        {
          type: 'reconnect',
          coordinates: [
            { latitude: 37.7749, longitude: -122.4194 },
            { latitude: 37.7849, longitude: -122.4094 },
          ],
        },
      ]

      const { UNSAFE_root } = render(
        <TestWrapper>
          <DeviationPolyline segments={segments} />
        </TestWrapper>
      )

      // Only the reconnect segment with 2+ coordinates should render
      const shapeSources = UNSAFE_root.findAllByType('ShapeSource')
      expect(shapeSources).toHaveLength(1)
    })

    it('should render nothing when segments array is empty', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <DeviationPolyline segments={[]} />
        </TestWrapper>
      )

      const shapeSources = UNSAFE_root.findAllByType('ShapeSource')
      expect(shapeSources).toHaveLength(0)
    })
  })
})
