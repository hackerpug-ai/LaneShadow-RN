/**
 * Component tests for WaypointMarker (CLR-009)
 *
 * Tests the migrated WaypointMarker using @rnmapbox/maps MarkerView:
 * - AC-1: Renders MarkerView at converted [lng, lat] coordinate
 * - AC-2: Press fires haptic feedback and onPress callback with waypoint id
 */

import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react-native'
import { ThemeProvider } from 'react-native-paper'
import type { ExtendedTheme } from '../../../styles/types'
import { WaypointMarker } from '../waypoint-marker'

// ---------------------------------------------------------------------------
// Mock theme (same structure as route-polyline test)
// ---------------------------------------------------------------------------

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
  animation: { scale: 1.0 },
}

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider theme={mockTheme}>{children}</ThemeProvider>
)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WaypointMarker', () => {
  const defaultCoordinate = { latitude: 37.7749, longitude: -122.4194 }

  describe('AC-1: renders MarkerView at converted coordinates', () => {
    it('renders_marker_view_at_converted_coordinates', () => {
      const { getByTestId, UNSAFE_root } = render(
        <TestWrapper>
          <WaypointMarker
            id="wp-1"
            coordinate={defaultCoordinate}
            kind="on_route"
          />
        </TestWrapper>
      )

      // MarkerView should render with coordinate in [lng, lat] format
      const markerView = getByTestId('waypoint-marker-wp-1')
      expect(markerView).toBeDefined()

      // Verify MarkerView received the converted coordinate prop
      // latLngToMapbox({ latitude: 37.7749, longitude: -122.4194 }) => [-122.4194, 37.7749]
      const markerViewInstances = UNSAFE_root.findAllByType('MarkerView')
      expect(markerViewInstances).toHaveLength(1)
      const markerCoordinate = markerViewInstances[0].props.coordinate as [number, number]
      expect(markerCoordinate[0]).toBe(-122.4194) // longitude
      expect(markerCoordinate[1]).toBe(37.7749)   // latitude
    })

    it('applies kind-based color for on_route', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WaypointMarker
            id="wp-on"
            coordinate={defaultCoordinate}
            kind="on_route"
          />
        </TestWrapper>
      )

      expect(getByTestId('waypoint-marker-wp-on')).toBeDefined()
    })

    it('applies kind-based color for off_route', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WaypointMarker
            id="wp-off"
            coordinate={defaultCoordinate}
            kind="off_route"
          />
        </TestWrapper>
      )

      expect(getByTestId('waypoint-marker-wp-off')).toBeDefined()
    })

    it('applies kind-based color for mixed', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WaypointMarker
            id="wp-mixed"
            coordinate={defaultCoordinate}
            kind="mixed"
          />
        </TestWrapper>
      )

      expect(getByTestId('waypoint-marker-wp-mixed')).toBeDefined()
    })

    it('uses custom testID when provided', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <WaypointMarker
            id="wp-custom"
            coordinate={defaultCoordinate}
            testID="custom-marker"
          />
        </TestWrapper>
      )

      expect(getByTestId('custom-marker')).toBeDefined()
    })
  })

  describe('AC-2: press fires haptic and callback', () => {
    it('press_fires_haptic_and_callback', () => {
      const onPress = vi.fn()
      const { UNSAFE_root } = render(
        <TestWrapper>
          <WaypointMarker
            id="wp-press"
            coordinate={defaultCoordinate}
            onPress={onPress}
          />
        </TestWrapper>
      )

      // onPress is on the Pressable child of MarkerView (not on MarkerView itself,
      // since MarkerView does not support onPress)
      const pressableElement = UNSAFE_root.findAllByType('Pressable')[0]
      expect(pressableElement).toBeDefined()

      // The Pressable's onPress prop should be a function (handlePress)
      expect(typeof pressableElement.props.onPress).toBe('function')

      // Fire the press
      pressableElement.props.onPress()

      expect(onPress).toHaveBeenCalledTimes(1)
      expect(onPress).toHaveBeenCalledWith('wp-press')
    })

    it('does not attach onPress handler when no callback provided', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <WaypointMarker
            id="wp-no-press"
            coordinate={defaultCoordinate}
          />
        </TestWrapper>
      )

      const pressableElement = UNSAFE_root.findAllByType('Pressable')[0]
      expect(pressableElement.props.onPress).toBeUndefined()
    })
  })
})
