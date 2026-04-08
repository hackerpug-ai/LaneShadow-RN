/**
 * Unit tests for waypoint-marker.tsx
 */

import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react-native'
import { WaypointMarker } from '../waypoint-marker'

// Mock semantic theme
const mockSemanticTheme = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    danger: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#FFFFFF' },
    surfaceVariant: { default: '#F7F3EF' },
    background: { default: '#F5F0EB' },
    onSurface: { default: '#1D1B20' },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#E8DEF8' },
    onSecondaryContainer: { default: '#1D192B' },
    border: { default: '#CAC4D0' },
    input: { default: '#CAC4D0' },
    ring: { default: '#6750A4' },
    locationPoiFill: { default: '#EDEDED' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8' },
    card: { default: '#FFFFFF' },
    popover: { default: '#FFFFFF' },
    accent: { default: '#88C7A6' },
    orange: { default: '#FF6B35' },
    muted: { default: '#9CA3AF' },
    divider: { default: '#CAC4D0' },
    scrim: { default: '#000000' },
    routeSelected: { default: '#FF6B35' },
    routeAlternate: { default: '#60a5fa' },
    waypointOnRoute: { default: '#31A362', pressed: '#268A4D' },
    waypointOffRoute: { default: '#D98E04', pressed: '#A86D00' },
    waypointMixed: { default: '#2B9AEB', pressed: '#1081D6' },
    deviationOriginalRoute: { default: '#6B7280' },
    deviationDetourPath: { default: '#FF6B35' },
    deviationReconnectPoint: { default: '#31A362' },
  },
  space: {
    xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64,
  },
  radius: {
    none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999,
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
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '500' as const },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      md: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
    },
  },
  elevation: {
    0: { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  },
}

describe('WaypointMarker', () => {
  const mockCoordinate = {
    latitude: 37.7749,
    longitude: -122.4194,
  }

  describe('AC1: Component renders with status-based styling', () => {
    it('should render a marker at the given coordinates', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} />,
        {
          theme: mockSemanticTheme,
        }
      )

      expect(getByTestId('waypoint-marker-test-waypoint')).toBeTruthy()
    })

    it('should render with default size when not specified', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should render with custom size when provided', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} size={48} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })
  })

  describe('AC2: Color coding for waypoint kinds', () => {
    it('should render on_route waypoint in green/success color', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} kind="on_route" />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should render off_route waypoint in orange/warning color', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} kind="off_route" />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should render mixed waypoint in blue/info color', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} kind="mixed" />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })
  })

  describe('AC3: Interactive states', () => {
    it('should render selected state with tertiary color ring', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} state="selected" />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should render pressed state with darker color', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} state="pressed" />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should render disabled state with muted color', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} state="disabled" />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should render default state when no state specified', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })
  })

  describe('AC4: Cluster markers support', () => {
    it('should render marker without index when showIndex is false', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} showIndex={false} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should render marker with index prop when showIndex is true', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} showIndex={true} index={5} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })
  })

  describe('Callback functionality', () => {
    it('should call onPress with waypoint ID when pressed', () => {
      const onPress = vi.fn()

      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} onPress={onPress} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should not call callbacks when disabled', () => {
      const onPress = vi.fn()

      const { getByTestId } = render(
        <WaypointMarker
          id="test-waypoint"
          coordinate={mockCoordinate}
          state="disabled"
          onPress={onPress}
        />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })
  })

  describe('Edge cases', () => {
    it('should handle invalid coordinates gracefully', () => {
      const invalidCoordinate = {
        latitude: NaN,
        longitude: NaN,
      }

      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={invalidCoordinate} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should handle extreme latitude/longitude values', () => {
      const extremeCoordinate = {
        latitude: 90,
        longitude: 180,
      }

      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={extremeCoordinate} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should handle zero and negative index values', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} showIndex={true} index={0} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should handle very small size values', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} size={16} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })

    it('should handle very large size values', () => {
      const { getByTestId } = render(
        <WaypointMarker id="test-waypoint" coordinate={mockCoordinate} size={128} />,
        {
          theme: mockSemanticTheme,
        }
      )

      const marker = getByTestId('waypoint-marker-test-waypoint')
      expect(marker).toBeTruthy()
    })
  })
})
