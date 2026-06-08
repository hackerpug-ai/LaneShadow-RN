/**
 * Unit tests for route-thumbnail.tsx
 *
 * Acceptance Criteria:
 * - AC1: Route with valid overviewGeometry -> thumbnail shows stylized route line at 96x96
 *         with dark gradient (expo-linear-gradient) and copper route color
 * - AC2: No geometry props -> falls back to default decorative route line with fixed gradient
 * - AC3: Very small area bounds -> route line still visible and centered
 * - AC4: Undefined/malformed geometry -> graceful fallback, no crash
 */

import { render } from '@testing-library/react-native'
import { MD3DarkTheme, PaperProvider } from 'react-native-paper'
import { describe, expect, it, vi } from 'vitest'
import type { Bounds } from '../../server/types/routes'
import type { ExtendedTheme } from '../../styles/types'
import { RouteThumbnail } from './route-thumbnail'

// Mock semantic theme for testing
const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    warningContainer: { default: 'FFF8E7' },
    onWarningContainer: { default: '#5C3E00' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    surface: { default: '#FEF7FF' },
    surfaceVariant: { default: '#E7E0EC' },
    background: { default: '#FEF7FF' },
    onSurface: {
      default: '#1D1B20',
      muted: '#49454F',
      subtle: '#79747E',
      disabled: '#9CA3AF',
    },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#E8DEF8' },
    onSecondaryContainer: { default: '#1D192B', muted: '#49454F', subtle: '#79747E' },
    border: { default: '#CAC4D0' },
    input: { default: '#CAC4D0' },
    ring: { default: '#6750A4' },
    locationPoiFill: { default: '#EDEDED' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8' },
    card: { default: '#FFFFFF' },
    popover: { default: '#FFFFFF' },
    accent: { default: '#FF6B35' },
    orange: { default: '#fb923c' },
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
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.3,
      shadowRadius: 24,
      elevation: 5,
    },
  },
}

// Mock useSemanticTheme hook
vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock expo-linear-gradient
vi.mock('expo-linear-gradient', () => {
  const { View } = require('react-native')
  return {
    LinearGradient: (props: Record<string, unknown>) => {
      return <View testID="linear-gradient" {...props} />
    },
  }
})

const renderWithPaper = (ui: React.ReactElement) => {
  return render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>)
}

describe('RouteThumbnail', () => {
  /**
   * AC1: Route with valid overviewGeometry
   * -> thumbnail shows stylized route line at 96x96 with dark gradient and copper route color
   */
  describe('AC1: valid geometry rendering', () => {
    const validBounds: Bounds = {
      north: 34.1,
      south: 33.9,
      east: -118.1,
      west: -118.4,
    }

    it('should render at default 96x96 size', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={validBounds} testID="thumbnail" />,
      )
      const thumbnail = getByTestId('thumbnail')
      const style = thumbnail.props.style
      // Flatten styles to check width/height
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style.flat()) : style
      expect(flatStyle.width).toBe(96)
      expect(flatStyle.height).toBe(96)
    })

    it('should use LinearGradient instead of CSS linear-gradient', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={validBounds} testID="thumbnail" />,
      )
      // LinearGradient should be present (mocked as View with testID)
      expect(getByTestId('linear-gradient')).toBeTruthy()
    })

    it('should render a route line view', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={validBounds} testID="thumbnail" />,
      )
      expect(getByTestId('route-line')).toBeTruthy()
    })

    it('should derive rotation from bounds when provided', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={validBounds} testID="thumbnail" />,
      )
      const routeLine = getByTestId('route-line')
      const flatStyle = Array.isArray(routeLine.props.style)
        ? Object.assign({}, ...routeLine.props.style.flat())
        : routeLine.props.style
      // Should have a transform with rotation
      expect(flatStyle.transform).toBeDefined()
      expect(flatStyle.transform).toEqual(
        expect.arrayContaining([expect.objectContaining({ rotate: expect.any(String) })]),
      )
    })

    it('should use semantic primary color for route line border', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={validBounds} testID="thumbnail" />,
      )
      const routeLine = getByTestId('route-line')
      const flatStyle = Array.isArray(routeLine.props.style)
        ? Object.assign({}, ...routeLine.props.style.flat())
        : routeLine.props.style
      expect(flatStyle.borderColor).toBe(mockSemanticTheme.color.primary.default)
    })
  })

  /**
   * AC2: No geometry props (backwards compatible)
   * -> Falls back to default decorative route line with fixed gradient
   */
  describe('AC2: no geometry props (backward compatible)', () => {
    it('should render without any props', () => {
      const { getByTestId } = renderWithPaper(<RouteThumbnail testID="thumbnail" />)
      expect(getByTestId('thumbnail')).toBeTruthy()
    })

    it('should use LinearGradient even without bounds', () => {
      const { getByTestId } = renderWithPaper(<RouteThumbnail testID="thumbnail" />)
      expect(getByTestId('linear-gradient')).toBeTruthy()
    })

    it('should render default decorative route line', () => {
      const { getByTestId } = renderWithPaper(<RouteThumbnail testID="thumbnail" />)
      expect(getByTestId('route-line')).toBeTruthy()
    })

    it('should use default rotation when no bounds provided', () => {
      const { getByTestId } = renderWithPaper(<RouteThumbnail testID="thumbnail" />)
      const routeLine = getByTestId('route-line')
      const flatStyle = Array.isArray(routeLine.props.style)
        ? Object.assign({}, ...routeLine.props.style.flat())
        : routeLine.props.style
      // Default rotation should be -10 degrees
      expect(flatStyle.transform).toEqual(expect.arrayContaining([{ rotate: '-10deg' }]))
    })
  })

  /**
   * AC3: Very small area bounds (< 0.01 degrees)
   * -> Route line is still visible and centered
   */
  describe('AC3: very small area bounds', () => {
    const tinyBounds: Bounds = {
      north: 34.0005,
      south: 33.9995,
      east: -118.0005,
      west: -118.0015,
    }

    it('should render without crashing for tiny bounds', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={tinyBounds} testID="thumbnail" />,
      )
      expect(getByTestId('thumbnail')).toBeTruthy()
    })

    it('should still show a visible route line for tiny bounds', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={tinyBounds} testID="thumbnail" />,
      )
      const routeLine = getByTestId('route-line')
      const flatStyle = Array.isArray(routeLine.props.style)
        ? Object.assign({}, ...routeLine.props.style.flat())
        : routeLine.props.style
      // Route line should have non-zero dimensions
      expect(flatStyle.width).toBeGreaterThan(0)
      expect(flatStyle.height).toBeGreaterThan(0)
    })
  })

  /**
   * AC4: Undefined or malformed geometry
   * -> Graceful fallback, no crash
   */
  describe('AC4: malformed geometry fallback', () => {
    it('should handle undefined bounds gracefully', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={undefined} testID="thumbnail" />,
      )
      expect(getByTestId('thumbnail')).toBeTruthy()
      expect(getByTestId('route-line')).toBeTruthy()
    })

    it('should handle bounds with zero span', () => {
      const zeroBounds: Bounds = {
        north: 34.0,
        south: 34.0,
        east: -118.0,
        west: -118.0,
      }
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={zeroBounds} testID="thumbnail" />,
      )
      expect(getByTestId('thumbnail')).toBeTruthy()
      expect(getByTestId('route-line')).toBeTruthy()
    })

    it('should handle inverted bounds (south > north)', () => {
      const invertedBounds: Bounds = {
        north: 33.0,
        south: 35.0,
        east: -120.0,
        west: -116.0,
      }
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail bounds={invertedBounds} testID="thumbnail" />,
      )
      expect(getByTestId('thumbnail')).toBeTruthy()
      expect(getByTestId('route-line')).toBeTruthy()
    })
  })

  /**
   * Custom size props
   */
  describe('custom sizing', () => {
    it('should accept custom width and height', () => {
      const { getByTestId } = renderWithPaper(
        <RouteThumbnail width={64} height={64} testID="thumbnail" />,
      )
      const thumbnail = getByTestId('thumbnail')
      const flatStyle = Array.isArray(thumbnail.props.style)
        ? Object.assign({}, ...thumbnail.props.style.flat())
        : thumbnail.props.style
      expect(flatStyle.width).toBe(64)
      expect(flatStyle.height).toBe(64)
    })
  })
})
