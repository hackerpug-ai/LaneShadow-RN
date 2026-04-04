/**
 * Unit tests for empty-state.tsx
 *
 * Acceptance Criteria:
 * - AC1: 0 saved routes -> shows 64px icon, 'No saved routes yet' heading,
 *         descriptive text, 'Plan your first route' button
 * - AC2: User taps 'Plan your first route' button -> onCtaPress callback invoked
 * - AC3: Dark mode -> all text, icon, button use semantic theme tokens and are legible
 * - AC4: No onCtaPress callback -> CTA button is hidden, no crash
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'
import { PaperProvider, MD3DarkTheme } from 'react-native-paper'
import type { ExtendedTheme } from '../../styles/types'

// ---------------------------------------------------------------------------
// Mock semantic theme (dark mode)
// ---------------------------------------------------------------------------

const mockSemanticTheme: ExtendedTheme['semantic'] = {
  color: {
    primary: { default: '#6750A4' },
    secondary: { default: '#625B71' },
    tertiary: { default: '#7D5260' },
    success: { default: '#22c55e' },
    warning: { default: '#f59e0b' },
    danger: { default: '#ef4444' },
    info: { default: '#3b82f6' },
    surface: { default: '#141218' },
    surfaceVariant: { default: '#2B2930' },
    background: { default: '#141218' },
    onSurface: {
      default: '#E6E0E9',
      muted: '#938F99',
      subtle: '#79747E',
      disabled: '#4A4458',
    },
    onPrimary: { default: '#FFFFFF' },
    onSecondary: { default: '#FFFFFF' },
    secondaryContainer: { default: '#4A4458' },
    onSecondaryContainer: { default: '#E8DEF8', muted: '#938F99', subtle: '#79747E' },
    border: { default: '#49454F' },
    input: { default: '#49454F' },
    ring: { default: '#6750A4' },
    locationPoiFill: { default: '#EDEDED' },
    locationPoiRing: { default: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8' },
    card: { default: '#1C1B1F' },
    popover: { default: '#1C1B1F' },
    accent: { default: '#FF6B35' },
    orange: { default: '#fb923c' },
    muted: { default: '#938F99' },
    divider: { default: '#49454F' },
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
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 5 },
  },
}

// Mock useSemanticTheme hook
vi.mock('../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// react-native-paper and @expo/vector-icons are already stubbed globally via
// __mocks__/ (wired in vitest.config.ts + vitest.env.js). The stubs provide
// Text, PaperProvider, MD3DarkTheme, MaterialCommunityIcons, etc. No per-test
// override needed.

// Mock Button to avoid deep import chains (expo-font, etc.)
vi.mock('./button', () => {
  const { Pressable, Text } = require('react-native')
  const { createElement } = require('react')
  return {
    Button: ({
      children,
      onPress,
      testID,
      style,
    }: {
      children?: unknown
      onPress?: () => void
      testID?: string
      style?: unknown
    }) =>
      createElement(
        Pressable,
        { onPress, testID, style, accessibilityRole: 'button' },
        typeof children === 'string' ? createElement(Text, null, children) : children
      ),
  }
})

// ---------------------------------------------------------------------------
// Import after mocks are registered
// ---------------------------------------------------------------------------

import { EmptyState } from './empty-state'
import type { EmptyStateProps } from './empty-state'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const renderWithPaper = (ui: React.ReactElement) =>
  render(<PaperProvider theme={MD3DarkTheme}>{ui}</PaperProvider>)

const defaultProps: EmptyStateProps = {
  icon: 'map-marker-path',
  headline: 'No saved routes yet',
  body: 'Plan a route and save it to see it here.',
  ctaLabel: 'Plan your first route',
  onCtaPress: vi.fn(),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EmptyState', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Shows icon, heading, descriptive text, and CTA button
   */
  describe('AC1: renders icon, headline, body, and CTA', () => {
    it('renders the icon wrapper', () => {
      const { getByTestId } = renderWithPaper(<EmptyState {...defaultProps} />)
      expect(getByTestId('empty-state-icon')).toBeTruthy()
    })

    it('renders the icon with size 64', () => {
      const { getByTestId } = renderWithPaper(<EmptyState {...defaultProps} />)
      const iconWrapper = getByTestId('empty-state-icon')
      // The icon is the first child of the wrapper
      const icon = iconWrapper.children[0]
      expect(icon.props.size).toBe(64)
    })

    it('renders the icon with the muted onSurface color', () => {
      const { getByTestId } = renderWithPaper(<EmptyState {...defaultProps} />)
      const iconWrapper = getByTestId('empty-state-icon')
      const icon = iconWrapper.children[0]
      expect(icon.props.color).toBe(mockSemanticTheme.color.onSurface.muted)
    })

    it('renders the headline text', () => {
      const { getByText } = renderWithPaper(<EmptyState {...defaultProps} />)
      expect(getByText('No saved routes yet')).toBeTruthy()
    })

    it('renders the body text', () => {
      const { getByText } = renderWithPaper(<EmptyState {...defaultProps} />)
      expect(getByText('Plan a route and save it to see it here.')).toBeTruthy()
    })

    it('renders the CTA button with ctaLabel text', () => {
      const { getByText } = renderWithPaper(<EmptyState {...defaultProps} />)
      expect(getByText('Plan your first route')).toBeTruthy()
    })

    it('renders with default testID empty-state when none provided', () => {
      const { getByTestId } = renderWithPaper(
        <EmptyState
          icon="map-marker-path"
          headline="No saved routes yet"
          body="Plan a route."
          ctaLabel="Plan your first route"
          onCtaPress={vi.fn()}
        />
      )
      expect(getByTestId('empty-state')).toBeTruthy()
    })

    it('renders with custom testID when provided', () => {
      const { getByTestId } = renderWithPaper(
        <EmptyState {...defaultProps} testID="saved-routes-empty-state" />
      )
      expect(getByTestId('saved-routes-empty-state')).toBeTruthy()
    })
  })

  /**
   * AC2: User taps CTA button -> onCtaPress is invoked
   */
  describe('AC2: CTA button invokes onCtaPress', () => {
    it('calls onCtaPress when CTA button is pressed', () => {
      const onCtaPress = vi.fn()
      const { getByTestId } = renderWithPaper(
        <EmptyState {...defaultProps} onCtaPress={onCtaPress} testID="empty-state" />
      )
      fireEvent.press(getByTestId('empty-state-cta'))
      expect(onCtaPress).toHaveBeenCalledTimes(1)
    })
  })

  /**
   * AC3: Semantic tokens are used for colors (dark mode legibility)
   */
  describe('AC3: uses semantic theme tokens for dark mode', () => {
    it('headline text uses semantic.color.onSurface.default', () => {
      const { getByText } = renderWithPaper(<EmptyState {...defaultProps} />)
      const headline = getByText('No saved routes yet')
      const flatStyle = Array.isArray(headline.props.style)
        ? Object.assign({}, ...headline.props.style.flat().filter(Boolean))
        : headline.props.style
      expect(flatStyle.color).toBe(mockSemanticTheme.color.onSurface.default)
    })

    it('body text uses semantic.color.onSurface.subtle', () => {
      const { getByText } = renderWithPaper(<EmptyState {...defaultProps} />)
      const body = getByText('Plan a route and save it to see it here.')
      const flatStyle = Array.isArray(body.props.style)
        ? Object.assign({}, ...body.props.style.flat().filter(Boolean))
        : body.props.style
      expect(flatStyle.color).toBe(mockSemanticTheme.color.onSurface.subtle)
    })

    it('icon color uses semantic.color.onSurface.muted', () => {
      const { getByTestId } = renderWithPaper(<EmptyState {...defaultProps} />)
      const iconWrapper = getByTestId('empty-state-icon')
      const icon = iconWrapper.children[0]
      expect(icon.props.color).toBe(mockSemanticTheme.color.onSurface.muted)
    })
  })

  /**
   * AC4: No onCtaPress -> CTA button is hidden, no crash
   */
  describe('AC4: CTA hidden when onCtaPress is not provided', () => {
    it('renders without crashing when onCtaPress is omitted', () => {
      const { getByTestId } = renderWithPaper(
        <EmptyState
          icon="map-marker-path"
          headline="No saved routes yet"
          body="Plan a route and save it to see it here."
          ctaLabel="Plan your first route"
        />
      )
      expect(getByTestId('empty-state')).toBeTruthy()
    })

    it('does not render the CTA button when onCtaPress is undefined', () => {
      const { queryByTestId } = renderWithPaper(
        <EmptyState
          icon="map-marker-path"
          headline="No saved routes yet"
          body="Plan a route and save it to see it here."
          ctaLabel="Plan your first route"
        />
      )
      expect(queryByTestId('empty-state-cta')).toBeNull()
    })

    it('does not render the CTA button when neither ctaLabel nor onCtaPress provided', () => {
      const { queryByTestId } = renderWithPaper(
        <EmptyState
          icon="map-marker-path"
          headline="No saved routes yet"
          body="Plan a route and save it to see it here."
        />
      )
      expect(queryByTestId('empty-state-cta')).toBeNull()
    })
  })
})
