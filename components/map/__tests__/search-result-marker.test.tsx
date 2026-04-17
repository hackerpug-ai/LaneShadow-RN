/**
 * Component tests for SearchResultMarker (CLR-009)
 *
 * Tests the migrated SearchResultMarker using @rnmapbox/maps MarkerView:
 * - AC-3: Renders numbered circle marker at converted coordinate
 * - AC-4: Selected state fills outer circle with info color
 */

import { render } from '@testing-library/react-native'
import { ThemeProvider } from 'react-native-paper'
import { describe, expect, it, vi } from 'vitest'
import type { ExtendedTheme } from '../../../styles/types'
import { SearchResultMarker } from '../search-result-marker'

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
    0: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 24,
      elevation: 5,
    },
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

describe('SearchResultMarker', () => {
  const defaultCoordinate = { latitude: 37.7749, longitude: -122.4194 }

  describe('AC-3: renders numbered circle marker at converted coordinates', () => {
    it('renders_numbered_circle_marker_at_converted_coordinates', () => {
      const { getByTestId, UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-1"
            coordinate={defaultCoordinate}
            index={1}
            name="Test Place"
          />
        </TestWrapper>,
      )

      // MarkerView should render with coordinate in [lng, lat] format
      const container = getByTestId('search-result-marker-sr-1')
      expect(container).toBeDefined()

      // Verify MarkerView received the converted coordinate prop
      // latLngToMapbox({ latitude: 37.7749, longitude: -122.4194 }) => [-122.4194, 37.7749]
      const markerViewInstances = UNSAFE_root.findAllByType('MarkerView')
      expect(markerViewInstances).toHaveLength(1)
      const markerCoordinate = markerViewInstances[0].props.coordinate as [number, number]
      expect(markerCoordinate[0]).toBe(-122.4194) // longitude
      expect(markerCoordinate[1]).toBe(37.7749) // latitude
    })

    it('displays the correct index number', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-5"
            coordinate={defaultCoordinate}
            index={5}
            name="Fifth Result"
          />
        </TestWrapper>,
      )

      // The index number should appear in the rendered output
      const textElements = UNSAFE_root.findAllByType('Text')
      const indexText = textElements.find((el) => (el.props as { children: number }).children === 5)
      expect(indexText).toBeDefined()
    })

    it('uses custom testID when provided', () => {
      const { getByTestId } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-custom"
            coordinate={defaultCoordinate}
            index={1}
            name="Custom"
            testID="custom-search-marker"
          />
        </TestWrapper>,
      )

      expect(getByTestId('custom-search-marker')).toBeDefined()
    })
  })

  describe('AC-4: selected state applies info color fill', () => {
    it('selected_state_applies_info_color_fill', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-sel"
            coordinate={defaultCoordinate}
            index={2}
            name="Selected Place"
            isSelected={true}
          />
        </TestWrapper>,
      )

      // When selected, the inner circle fill should use info color (#2B9AEB)
      // and the outer circle fill should also be info color
      const circleElements = UNSAFE_root.findAllByType('Circle')

      // There should be 2 Circle elements (outer ring and inner circle)
      expect(circleElements.length).toBeGreaterThanOrEqual(2)

      // Outer circle: fill should be info color when selected
      const outerCircle = circleElements[0]
      expect(outerCircle.props.fill).toBe('#2B9AEB')
      expect(outerCircle.props.strokeWidth).toBe(2)
      expect(outerCircle.props.strokeDasharray).toBeUndefined()

      // Inner circle: fill should be info color when selected
      const innerCircle = circleElements[1]
      expect(innerCircle.props.fill).toBe('#2B9AEB')
    })

    it('default state uses hollow circle with dashed border', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-default"
            coordinate={defaultCoordinate}
            index={3}
            name="Default Place"
            isSelected={false}
          />
        </TestWrapper>,
      )

      const circleElements = UNSAFE_root.findAllByType('Circle')
      expect(circleElements.length).toBeGreaterThanOrEqual(2)

      // Outer circle: fill should be info color with opacity (hex appended 26)
      const outerCircle = circleElements[0]
      expect(outerCircle.props.fill).toBe('#2B9AEB26')
      expect(outerCircle.props.strokeDasharray).toBe('4 3')

      // Inner circle: fill should be surface color when not selected
      const innerCircle = circleElements[1]
      expect(innerCircle.props.fill).toBe('#1B1715')
    })

    it('selected state inverts text color to onPrimary', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-inv"
            coordinate={defaultCoordinate}
            index={4}
            name="Inverted Place"
            isSelected={true}
          />
        </TestWrapper>,
      )

      // When selected, text color should be onPrimary (#FFFFFF)
      const textElements = UNSAFE_root.findAllByType('Text')
      const indexText = textElements.find((el) => (el.props as { children: number }).children === 4)
      expect(indexText).toBeDefined()
      // Style is an array: [styles.indexText, { color, fontSize, fontWeight }]
      const styleArr = indexText!.props.style as Record<string, unknown>[]
      const colorStyle = styleArr.find((s: Record<string, unknown>) => s && 'color' in s)
      expect((colorStyle as Record<string, unknown>)?.color).toBe('#FFFFFF')
    })

    it('default state uses info color for text', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-def-text"
            coordinate={defaultCoordinate}
            index={6}
            name="Default Text Place"
            isSelected={false}
          />
        </TestWrapper>,
      )

      // When not selected, text color should be info color (#2B9AEB)
      const textElements = UNSAFE_root.findAllByType('Text')
      const indexText = textElements.find((el) => (el.props as { children: number }).children === 6)
      expect(indexText).toBeDefined()
      // Style is an array: [styles.indexText, { color, fontSize, fontWeight }]
      const styleArr = indexText!.props.style as Record<string, unknown>[]
      const colorStyle = styleArr.find((s: Record<string, unknown>) => s && 'color' in s)
      expect((colorStyle as Record<string, unknown>)?.color).toBe('#2B9AEB')
    })

    it('selected state applies scale transform', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-scale"
            coordinate={defaultCoordinate}
            index={7}
            name="Scaled Place"
            isSelected={true}
          />
        </TestWrapper>,
      )

      // The container View (child of Pressable) should have the scale transform
      const viewElements = UNSAFE_root.findAllByType('View')
      const containerView = viewElements.find((el: any) => {
        const style = el.props.style
        if (!style) return false
        // Style may be an array of style objects
        const merged = Array.isArray(style) ? Object.assign({}, ...style.filter(Boolean)) : style
        return merged.transform?.some(
          (t: unknown) => typeof t === 'object' && t !== null && 'scale' in t,
        )
      })
      expect(containerView).toBeDefined()
      // Merge style array to access transform
      const mergedStyle = Array.isArray(containerView!.props.style)
        ? Object.assign({}, ...containerView!.props.style.filter(Boolean))
        : containerView!.props.style
      expect(mergedStyle.transform).toEqual([{ scale: 1.15 }])
    })
  })

  describe('Press interaction', () => {
    it('fires onPress with marker id', () => {
      const onPress = vi.fn()
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-press"
            coordinate={defaultCoordinate}
            index={8}
            name="Pressable Place"
            onPress={onPress}
          />
        </TestWrapper>,
      )

      // onPress is on the Pressable child of MarkerView
      const pressableElement = UNSAFE_root.findAllByType('Pressable')[0]
      expect(pressableElement).toBeDefined()
      expect(typeof pressableElement.props.onPress).toBe('function')

      pressableElement.props.onPress()

      expect(onPress).toHaveBeenCalledTimes(1)
      expect(onPress).toHaveBeenCalledWith('sr-press')
    })

    it('does not attach onPress handler when no callback provided', () => {
      const { UNSAFE_root } = render(
        <TestWrapper>
          <SearchResultMarker
            id="sr-no-press"
            coordinate={defaultCoordinate}
            index={9}
            name="No Press Place"
          />
        </TestWrapper>,
      )

      const pressableElement = UNSAFE_root.findAllByType('Pressable')[0]
      expect(pressableElement.props.onPress).toBeUndefined()
    })
  })
})
