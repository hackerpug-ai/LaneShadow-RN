/**
 * Unit tests for route-option-card.tsx
 *
 * Favorite Indicator Acceptance Criteria (US-048):
 * - AC1: Shows favorite indicator badge when favorites are included
 * - AC2: Shows "0 favorites" badge when count is zero (with muted styling)
 * - AC3: Does not show indicator when includeFavorites is false
 * - AC4: Badge shows correct count (singular vs plural)
 * - AC5: Tapping badge expands to show favorite names
 * - AC6: Accessibility label announces favorite count
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'

// ---------------------------------------------------------------------------
// Mock all modules before importing the component under test
// ---------------------------------------------------------------------------

// Mock useSemanticTheme hook
vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock react-native-paper Text
vi.mock('react-native-paper', () => {
  const { createElement } = require('react')

  const Text = ({ children, style, ...props }) =>
    createElement('Text', { style, ...props }, children)

  return { Text }
})

// Mock Badge component
vi.mock('../../ui/badge', () => ({
  Badge: ({ children, variant, testID }: any) => {
    const { createElement } = require('react')
    const isOutline = variant === 'outline'
    return createElement('View', {
      testID,
      style: {
        backgroundColor: isOutline ? 'transparent' : '#B87333',
        borderWidth: isOutline ? 1 : 0,
        borderColor: '#3A3431',
        borderRadius: 9999,
        paddingHorizontal: 10,
        paddingVertical: 2,
        flexDirection: 'row',
        alignItems: 'center',
      },
    }, children)
  },
}))

// Mock IconSymbol component
vi.mock('../../ui/icon-symbol', () => ({
  IconSymbol: ({ name, size, color, testID }: any) => {
    const { createElement } = require('react')
    return createElement('View', { testID: testID || `icon-${name}`, style: { width: size, height: size, backgroundColor: color } })
  },
}))

// Mock WindBadge component
vi.mock('../wind-badge', () => ({
  WindBadge: ({ windLevel, testID }: any) => {
    const { createElement } = require('react')
    return createElement('Text', { testID }, windLevel || 'Unknown')
  },
}))

// Mock RainBadge component
vi.mock('../../ui/rain-badge', () => ({
  RainBadge: ({ rainSummary, testID }: any) => {
    const { createElement } = require('react')
    return createElement('Text', { testID }, rainSummary || 'Unknown')
  },
}))

// Mock TemperatureBadge component
vi.mock('../../ui/temperature-badge', () => ({
  TemperatureBadge: ({ temperatureSummary, temperatureValue, testID }: any) => {
    const { createElement } = require('react')
    return createElement('Text', { testID }, `${temperatureValue}°F`)
  },
}))

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { render, fireEvent } from '@testing-library/react-native'
import { RouteOptionCard } from '../route-option-card'

// ---------------------------------------------------------------------------
// Mock semantic theme
// ---------------------------------------------------------------------------

const mockSemanticTheme = {
  color: {
    primary: { default: '#B87333' },
    secondary: { default: '#1A1C1F' },
    tertiary: { default: '#2B9AEB' },
    success: { default: '#31A362' },
    warning: { default: '#D98E04' },
    danger: { default: '#E35D6A' },
    error: { default: '#E35D6A' },
    info: { default: '#2B9AEB' },
    surface: { default: '#2B2725' },
    surfaceVariant: { default: '#34302D' },
    background: { default: '#1B1715' },
    onSurface: {
      default: 'rgba(255,255,255,0.92)',
      muted: 'rgba(255,255,255,0.72)',
      subtle: 'rgba(255,255,255,0.55)',
      disabled: '#6B7280',
    },
    onPrimary: { default: '#0E0F11' },
    onSecondary: { default: '#F8F7F6' },
    secondaryContainer: { default: '#36302B' },
    onSecondaryContainer: {
      default: '#1E1E1E',
      muted: '#5C4A3B',
      subtle: '#7C6A5B',
    },
    border: { default: '#3A3431' },
    input: { default: '#24272B' },
    ring: { default: '#B87333' },
    card: { default: '#24272B' },
    popover: { default: '#24272B' },
    accent: { default: '#407C5D' },
    orange: { default: '#FF6B35' },
    muted: { default: '#1A1C1F' },
    divider: { default: 'rgba(255,255,255,0.08)' },
    scrim: { default: 'rgba(0,0,0,0.55)' },
    routeSelected: { default: '#B87333' },
    routeAlternate: { default: 'rgba(255,255,255,0.45)' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 },
  type: {
    label: {
      sm: { fontSize: 12, lineHeight: 18, fontWeight: '500' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const },
      md: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' as const },
    },
    heading: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '600' as const },
      md: { fontSize: 18, lineHeight: 27, fontWeight: '600' as const },
      lg: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 36, lineHeight: 44, fontWeight: '400' as const },
      md: { fontSize: 45, lineHeight: 52, fontWeight: '400' as const },
      lg: { fontSize: 57, lineHeight: 64, fontWeight: '400' as const },
    },
  },
  elevation: {
    0: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
    1: { shadowColor: '#000000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2, elevation: 1 },
    2: { shadowColor: '#000000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 },
    3: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 3 },
    4: { shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 4 },
    5: { shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.35, shadowRadius: 24, elevation: 5 },
  },
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const createMockRouteOption = (overrides?: any) => ({
  routeOptionId: 'route-1',
  label: 'Scenic Route',
  rationale: 'Best views',
  stats: {
    distanceMeters: 15000,
    durationSeconds: 1800,
    legsCount: 2,
  },
  map: {
    bounds: {
      northeast: { lat: 37.7749, lng: -122.4094 },
      southwest: { lat: 37.7549, lng: -122.4394 },
    },
    overviewGeometry: { encodedPolyline: 'test' },
    legs: [],
  },
  overlaysPreview: {
    windSummary: 'moderate',
    rainSummary: 'none',
    temperatureSummary: 'mild',
    conditionsStatus: 'ok' as const,
  },
  ...overrides,
})

const defaultProps = {
  routeOption: createMockRouteOption(),
  isSelected: false,
  onSelect: vi.fn(),
  testID: 'route-card-1',
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RouteOptionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC1: Shows favorite indicator badge when favorites are included', () => {
    it('should render favorite badge when includeFavorites is true and count > 0', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline Boulevard', 'Coastal Highway'] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      expect(getByTestId('route-card-1-favorite-badge')).toBeTruthy()
    })

    it('should display favorite count in badge', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline Boulevard', 'Coastal Highway'] },
      })

      const { getByText } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      expect(getByText('2 favorites')).toBeTruthy()
    })
  })

  describe('AC2: Shows "0 favorites" badge when count is zero (with muted styling)', () => {
    it('should render badge when count is 0', () => {
      const routeWithZeroFavorites = createMockRouteOption({
        favorites: { count: 0, names: [] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithZeroFavorites} includeFavorites={true} />
      )

      expect(getByTestId('route-card-1-favorite-badge')).toBeTruthy()
    })

    it('should display "0 favorites" text', () => {
      const routeWithZeroFavorites = createMockRouteOption({
        favorites: { count: 0, names: [] },
      })

      const { getByText } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithZeroFavorites} includeFavorites={true} />
      )

      expect(getByText('0 favorites')).toBeTruthy()
    })

    it('should apply muted styling (outline variant) when count is 0', () => {
      const routeWithZeroFavorites = createMockRouteOption({
        favorites: { count: 0, names: [] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithZeroFavorites} includeFavorites={true} />
      )

      const badge = getByTestId('route-card-1-favorite-badge-inner')
      // When count === 0, Badge should use outline variant for muted appearance
      expect(badge.props.style.backgroundColor).toBe('transparent')
    })

    it('should apply normal styling (default variant) when count > 0', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline', 'Coastal'] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      const badge = getByTestId('route-card-1-favorite-badge-inner')
      // When count > 0, Badge should use default variant with solid background
      expect(badge.props.style.backgroundColor).toBe('#B87333')
    })
  })

  describe('AC3: Does not show indicator when includeFavorites is false', () => {
    it('should not render favorite badge when includeFavorites is false', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline Boulevard', 'Coastal Highway'] },
      })

      const { queryByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={false} />
      )

      expect(queryByTestId('route-card-1-favorite-badge')).toBeNull()
    })

    it('should not render favorite badge when includeFavorites is undefined (default)', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline Boulevard', 'Coastal Highway'] },
      })

      const { queryByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} />
        // includeFavorites defaults to false
      )

      expect(queryByTestId('route-card-1-favorite-badge')).toBeNull()
    })
  })

  describe('AC4: Badge shows correct count (singular vs plural)', () => {
    it('should display "1 favorite" (singular) when count is 1', () => {
      const routeWithOneFavorite = createMockRouteOption({
        favorites: { count: 1, names: ['Skyline Boulevard'] },
      })

      const { getByText } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithOneFavorite} includeFavorites={true} />
      )

      expect(getByText('1 favorite')).toBeTruthy()
      expect(() => getByText('1 favorites')).toThrow()
    })

    it('should display "2 favorites" (plural) when count is 2', () => {
      const routeWithTwoFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline', 'Coastal'] },
      })

      const { getByText } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithTwoFavorites} includeFavorites={true} />
      )

      expect(getByText('2 favorites')).toBeTruthy()
    })

    it('should display "5 favorites" (plural) when count is 5', () => {
      const routeWithFiveFavorites = createMockRouteOption({
        favorites: { count: 5, names: ['A', 'B', 'C', 'D', 'E'] },
      })

      const { getByText } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFiveFavorites} includeFavorites={true} />
      )

      expect(getByText('5 favorites')).toBeTruthy()
    })
  })

  describe('AC5: Tapping badge expands to show favorite names', () => {
    it('should not show favorite list initially', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline Boulevard', 'Coastal Highway'] },
      })

      const { queryByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      expect(queryByTestId('route-card-1-favorite-list')).toBeNull()
    })

    it('should expand favorite list when badge is pressed', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline Boulevard', 'Coastal Highway'] },
      })

      const { getByTestId, queryByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      // Press the badge
      fireEvent.press(getByTestId('route-card-1-favorite-badge'))

      // Favorite list should now be visible
      expect(queryByTestId('route-card-1-favorite-list')).toBeTruthy()
    })

    it('should display all favorite names in expanded list', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 3, names: ['Skyline Boulevard', 'Coastal Highway', 'Mountain Pass'] },
      })

      const { getByTestId, getByText } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      // Press the badge to expand
      fireEvent.press(getByTestId('route-card-1-favorite-badge'))

      // All names should be visible (with bullet points)
      expect(getByText('• Skyline Boulevard')).toBeTruthy()
      expect(getByText('• Coastal Highway')).toBeTruthy()
      expect(getByText('• Mountain Pass')).toBeTruthy()
    })

    it('should collapse favorite list when badge is pressed again', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline', 'Coastal'] },
      })

      const { getByTestId, queryByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      // First press expands
      fireEvent.press(getByTestId('route-card-1-favorite-badge'))
      expect(queryByTestId('route-card-1-favorite-list')).toBeTruthy()

      // Second press collapses
      fireEvent.press(getByTestId('route-card-1-favorite-badge'))
      expect(queryByTestId('route-card-1-favorite-list')).toBeNull()
    })

    it('should not show favorite list when count is 0 (no names to display)', () => {
      const routeWithZeroFavorites = createMockRouteOption({
        favorites: { count: 0, names: [] },
      })

      const { getByTestId, queryByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithZeroFavorites} includeFavorites={true} />
      )

      // Press the badge even though count is 0
      fireEvent.press(getByTestId('route-card-1-favorite-badge'))

      // List should still not appear (no names to show)
      expect(queryByTestId('route-card-1-favorite-list')).toBeNull()
    })
  })

  describe('AC6: Accessibility label announces favorite count', () => {
    it('should have accessibility label for 0 favorites', () => {
      const routeWithZeroFavorites = createMockRouteOption({
        favorites: { count: 0, names: [] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithZeroFavorites} includeFavorites={true} />
      )

      const badge = getByTestId('route-card-1-favorite-badge')
      expect(badge.props.accessibilityLabel).toBe('Route includes 0 favorites')
    })

    it('should have accessibility label for 1 favorite (singular)', () => {
      const routeWithOneFavorite = createMockRouteOption({
        favorites: { count: 1, names: ['Skyline Boulevard'] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithOneFavorite} includeFavorites={true} />
      )

      const badge = getByTestId('route-card-1-favorite-badge')
      expect(badge.props.accessibilityLabel).toBe('Route includes 1 favorite')
    })

    it('should have accessibility label for 2 favorites (plural)', () => {
      const routeWithTwoFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline', 'Coastal'] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithTwoFavorites} includeFavorites={true} />
      )

      const badge = getByTestId('route-card-1-favorite-badge')
      expect(badge.props.accessibilityLabel).toBe('Route includes 2 favorites')
    })

    it('should have accessibilityRole set to text', () => {
      const routeWithFavorites = createMockRouteOption({
        favorites: { count: 2, names: ['Skyline', 'Coastal'] },
      })

      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithFavorites} includeFavorites={true} />
      )

      const badge = getByTestId('route-card-1-favorite-badge')
      expect(badge.props.accessibilityRole).toBe('text')
    })
  })

  describe('Edge cases', () => {
    it('should handle undefined favorites gracefully', () => {
      const routeWithoutFavorites = createMockRouteOption()
      // No favorites property

      const { queryByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithoutFavorites} includeFavorites={true} />
      )

      // Should still render badge with count 0
      expect(queryByTestId('route-card-1-favorite-badge')).toBeTruthy()
    })

    it('should handle favorites with count but no names', () => {
      const routeWithCountOnly = createMockRouteOption({
        favorites: { count: 3, names: [] }, // Count says 3 but no names
      })

      const { getByText, queryByTestId, getByTestId } = render(
        <RouteOptionCard {...defaultProps} routeOption={routeWithCountOnly} includeFavorites={true} />
      )

      // Should show count
      expect(getByText('3 favorites')).toBeTruthy()

      // Press to expand - list should not appear since names array is empty
      fireEvent.press(getByTestId('route-card-1-favorite-badge'))
      // The favorite list should NOT appear when names array is empty
      expect(queryByTestId('route-card-1-favorite-list')).toBeNull()
    })
  })

  describe('Card selection and loading states', () => {
    it('should call onSelect with routeOptionId when pressed', () => {
      const mockOnSelect = vi.fn()
      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} onSelect={mockOnSelect} />
      )

      fireEvent.press(getByTestId('route-card-1'))

      expect(mockOnSelect).toHaveBeenCalledTimes(1)
      expect(mockOnSelect).toHaveBeenCalledWith('route-1')
    })

    it('should not call onSelect when loading', () => {
      const mockOnSelect = vi.fn()
      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} onSelect={mockOnSelect} isLoading={true} />
      )

      fireEvent.press(getByTestId('route-card-1'))

      expect(mockOnSelect).not.toHaveBeenCalled()
    })

    it('should display loading indicator when selected and loading', () => {
      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} isSelected={true} isLoading={true} />
      )

      // Should show loading icon
      expect(getByTestId('icon-loading')).toBeTruthy()
    })

    it('should display checkmark when selected and not loading', () => {
      const { getByTestId } = render(
        <RouteOptionCard {...defaultProps} isSelected={true} isLoading={false} />
      )

      // Should show checkmark icon
      expect(getByTestId('icon-check-circle')).toBeTruthy()
    })
  })
})
