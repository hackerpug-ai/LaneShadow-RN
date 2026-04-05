/**
 * Unit tests for typing-indicator.tsx
 *
 * Acceptance Criteria:
 * - AC1: Renders 3 dots by default
 * - AC2: Respects `size` prop (sm vs md dot diameter)
 * - AC3: Respects `color` prop override
 * - AC4: Accessibility label present
 *
 * Mock strategy:
 * - react-native-reanimated is stubbed to avoid native module requirements
 * - AccessibilityInfo.isReduceMotionEnabled is stubbed to return false
 * - useSemanticTheme is stubbed with a minimal token set
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render } from '@testing-library/react-native'
import type { ExtendedTheme } from '../../styles/types'

// ---------------------------------------------------------------------------
// Import component under test (after all mocks are set up)
// ---------------------------------------------------------------------------

import { TypingIndicator } from './typing-indicator'

// ---------------------------------------------------------------------------
// Mock: react-native — add isReduceMotionEnabled which the base stub omits
// ---------------------------------------------------------------------------

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-native')>()
  return {
    ...actual,
    AccessibilityInfo: {
      ...(actual as any).AccessibilityInfo,
      isReduceMotionEnabled: () => Promise.resolve(false),
    },
  }
})

// ---------------------------------------------------------------------------
// Mock: react-native-reanimated — all animation primitives are no-ops
// ---------------------------------------------------------------------------

vi.mock('react-native-reanimated', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')

  const useSharedValue = (initial: unknown) => ({ value: initial })
  const useAnimatedStyle = (fn: () => Record<string, unknown>) => {
    try { fn() } catch { /* ignore */ }
    return {}
  }
  const withRepeat = (_a: unknown) => undefined
  const withSequence = (..._args: unknown[]) => undefined
  const withTiming = (_val: unknown, _cfg?: unknown) => undefined
  const withDelay = (_delay: unknown, _animation: unknown) => undefined

  const AnimatedView = (props: Record<string, unknown>) =>
    createElement(View, props)
  AnimatedView.displayName = 'AnimatedView'

  return {
    __esModule: true,
    default: { View: AnimatedView },
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withSequence,
    withTiming,
    withDelay,
  }
})

// ---------------------------------------------------------------------------
// Mock: useSemanticTheme
// ---------------------------------------------------------------------------

const mockSemantic: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    surface: { default: '#FEF7FF' },
    surfaceVariant: { default: '#E7E0EC' },
    background: { default: '#FEF7FF' },
    onSurface: {
      default: '#1D1B20',
      muted: '#49454F',
      subtle: '#79747E',
    },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#E8DEF8' },
    onSecondaryContainer: { default: '#1D192B', muted: '#49454F', subtle: '#79747E' },
    border: { default: '#CAC4D0' },
    input: { default: '#CAC4D0' },
    ring: { default: '#6750A4' },
    card: { default: '#FFFFFF' },
    popover: { default: '#FFFFFF' },
    accent: { default: '#FF6B35' },
    orange: { default: '#fb923c' },
    muted: { default: '#938F99' },
    divider: { default: '#CAC4D0' },
    scrim: { default: '#000000' },
    routeSelected: { default: '#FF6B35' },
    routeAlternate: { default: '#60a5fa' },
    locationPoiFill: { default: '#EDEDED' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8' },
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
    0: { shadowColor: '#000', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 5 },
  },
}

vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemantic }),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TypingIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Renders 3 dots by default
   */
  describe('renders 3 dots', () => {
    it('should render exactly 3 dot elements', () => {
      const { getByTestId } = render(<TypingIndicator />)

      expect(getByTestId('typing-indicator-dot-0')).toBeTruthy()
      expect(getByTestId('typing-indicator-dot-1')).toBeTruthy()
      expect(getByTestId('typing-indicator-dot-2')).toBeTruthy()
    })

    it('should render the container element', () => {
      const { getByTestId } = render(<TypingIndicator />)

      expect(getByTestId('typing-indicator')).toBeTruthy()
    })
  })

  /**
   * AC2: Respects `size` prop
   */
  describe('size prop', () => {
    it('should apply sm size by default', () => {
      const { getByTestId } = render(<TypingIndicator />)

      const dot = getByTestId('typing-indicator-dot-0')
      // sm: diameter 4px
      const style = dot.props.style
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style
      expect(flatStyle.width).toBe(4)
      expect(flatStyle.height).toBe(4)
    })

    it('should apply sm size when size="sm"', () => {
      const { getByTestId } = render(<TypingIndicator size="sm" />)

      const dot = getByTestId('typing-indicator-dot-0')
      const style = dot.props.style
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style
      expect(flatStyle.width).toBe(4)
      expect(flatStyle.height).toBe(4)
    })

    it('should apply md size when size="md"', () => {
      const { getByTestId } = render(<TypingIndicator size="md" />)

      const dot = getByTestId('typing-indicator-dot-0')
      const style = dot.props.style
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style
      expect(flatStyle.width).toBe(6)
      expect(flatStyle.height).toBe(6)
    })

    it('should use correct gap for sm size', () => {
      const { getByTestId } = render(<TypingIndicator size="sm" />)

      const container = getByTestId('typing-indicator')
      const style = Array.isArray(container.props.style)
        ? Object.assign({}, ...container.props.style)
        : container.props.style
      expect(style.gap).toBe(3)
    })

    it('should use correct gap for md size', () => {
      const { getByTestId } = render(<TypingIndicator size="md" />)

      const container = getByTestId('typing-indicator')
      const style = Array.isArray(container.props.style)
        ? Object.assign({}, ...container.props.style)
        : container.props.style
      expect(style.gap).toBe(4)
    })
  })

  /**
   * AC3: Respects `color` prop override
   */
  describe('color prop', () => {
    it('should use default semantic color when no color is provided', () => {
      const { getByTestId } = render(<TypingIndicator />)

      const dot = getByTestId('typing-indicator-dot-0')
      const style = dot.props.style
      const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style
      // Default: semantic.color.onSurface.subtle = '#79747E'
      expect(flatStyle.backgroundColor).toBe('#79747E')
    })

    it('should use provided color override', () => {
      const customColor = '#FF0000'
      const { getByTestId } = render(<TypingIndicator color={customColor} />)

      const dot0 = getByTestId('typing-indicator-dot-0')
      const dot1 = getByTestId('typing-indicator-dot-1')
      const dot2 = getByTestId('typing-indicator-dot-2')

      const getColor = (el: ReturnType<typeof getByTestId>) => {
        const style = el.props.style
        const flatStyle = Array.isArray(style) ? Object.assign({}, ...style) : style
        return flatStyle.backgroundColor
      }

      expect(getColor(dot0)).toBe(customColor)
      expect(getColor(dot1)).toBe(customColor)
      expect(getColor(dot2)).toBe(customColor)
    })
  })

  /**
   * AC4: Accessibility label present
   */
  describe('accessibility', () => {
    it('should have accessibilityLabel "Assistant is typing"', () => {
      const { getByTestId } = render(<TypingIndicator />)

      const container = getByTestId('typing-indicator')
      expect(container.props.accessibilityLabel).toBe('Assistant is typing')
    })

    it('should have accessibilityRole "progressbar"', () => {
      const { getByTestId } = render(<TypingIndicator />)

      const container = getByTestId('typing-indicator')
      expect(container.props.accessibilityRole).toBe('progressbar')
    })
  })
})
