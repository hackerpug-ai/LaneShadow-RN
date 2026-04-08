/**
 * Unit tests for favorite-road-card.tsx
 *
 * Acceptance Criteria:
 * - AC1: Given favorite road data, when card renders, then shows name and mini map preview
 * - AC2: Given card rendered, when mini map displays, then shows road bounds for positioning
 * - AC3: Given card rendered, when user taps delete, then onDelete callback triggered with ID
 * - AC4: Given card rendered, when user taps card, then onPress callback triggered with ID
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import React from 'react'

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { render, fireEvent } from '@testing-library/react-native'
import { FavoriteRoadCard } from '../favorite-road-card'

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

// Mock RouteThumbnail component
vi.mock('../route-thumbnail', () => ({
  RouteThumbnail: ({ width, height, testID }: any) => {
    const { createElement } = require('react')
    return createElement('View', { testID, style: { width, height } })
  },
}))

// Mock Button component
vi.mock('../button', () => {
  const { createElement } = require('react')

  return {
    Button: ({ children, onPress, testID, accessibilityLabel, icon, ...props }: any) => {
      return createElement(
        'Pressable',
        {
          onPress,
          testID,
          accessibilityLabel,
          accessibilityRole: 'button',
        },
        children || icon
      )
    },
  }
})

// Mock IconSymbol component
vi.mock('../icon-symbol', () => ({
  IconSymbol: ({ name, size, color, testID }: any) => {
    const { createElement } = require('react')
    return createElement('View', { testID: testID || `icon-${name}`, style: { width: size, height: size, backgroundColor: color } })
  },
}))

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
    onSecondaryContainer: { default: '#E3E3E3', muted: '#D3BBA5', subtle: '#C3AB95' },
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
// Helpers
// ---------------------------------------------------------------------------

const mockBounds = {
  north: 37.7749,
  south: 37.7549,
  east: -122.4194,
  west: -122.4394,
}

const defaultProps = {
  favoriteRoadId: 'favorite123',
  name: 'Scenic Coastal Drive',
  bounds: mockBounds,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FavoriteRoadCard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Given favorite road data, when card renders, then shows name and mini map preview
   */
  describe('AC1: Render with favorite road data', () => {
    it('should display the favorite road name', () => {
      const { getByText } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByText('Scenic Coastal Drive')).toBeTruthy()
    })

    it('should display the mini map preview', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByTestId('favorite-road-card-thumbnail')).toBeTruthy()
    })

    it('should render thumbnail with correct size (80x80)', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      const thumbnail = getByTestId('favorite-road-card-thumbnail')
      expect(thumbnail.props.style).toEqual(
        expect.objectContaining({
          width: 80,
          height: 80,
        })
      )
    })
  })

  /**
   * AC2: Given card rendered, when mini map displays, then shows road bounds for positioning
   */
  describe('AC2: Mini map uses bounds for positioning', () => {
    it('should render RouteThumbnail with bounds prop', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      const thumbnail = getByTestId('favorite-road-card-thumbnail')
      expect(thumbnail).toBeTruthy()
    })

    it('should handle different bounds values', () => {
      const differentBounds = {
        north: 40.5,
        south: 40.0,
        east: -105.0,
        west: -105.5,
      }

      const { getByTestId, getByText } = render(
        <FavoriteRoadCard
          {...defaultProps}
          bounds={differentBounds}
        />
      )

      // Should still render thumbnail
      expect(getByTestId('favorite-road-card-thumbnail')).toBeTruthy()
      // Should still show name
      expect(getByText('Scenic Coastal Drive')).toBeTruthy()
    })
  })

  /**
   * AC3: Given card rendered, when user taps delete, then onDelete callback triggered with ID
   */
  describe('AC3: Delete button triggers callback', () => {
    it('should show delete button', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByTestId('favorite-road-card-delete')).toBeTruthy()
    })

    it('should have accessibility label for delete button', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByTestId('favorite-road-card-delete').props.accessibilityLabel).toBe(
        'Delete favorite'
      )
    })

    it('should call onDelete with ID when delete button is pressed', () => {
      const mockOnDelete = vi.fn()
      const { getByTestId } = render(
        <FavoriteRoadCard {...defaultProps} onDelete={mockOnDelete} />
      )

      fireEvent.press(getByTestId('favorite-road-card-delete'))

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockOnDelete).toHaveBeenCalledWith('favorite123')
    })

    it('should not call onDelete when not provided', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      // Should not throw when delete is pressed without callback
      expect(() => {
        fireEvent.press(getByTestId('favorite-road-card-delete'))
      }).not.toThrow()
    })
  })

  /**
   * AC4: Given card rendered, when user taps card, then onPress callback triggered with ID
   */
  describe('AC4: Card press triggers callback', () => {
    it('should call onPress with ID when card is pressed', () => {
      const mockOnPress = vi.fn()
      const { getByTestId } = render(
        <FavoriteRoadCard {...defaultProps} onPress={mockOnPress} />
      )

      fireEvent.press(getByTestId('favorite-road-card'))

      expect(mockOnPress).toHaveBeenCalledTimes(1)
      expect(mockOnPress).toHaveBeenCalledWith('favorite123')
    })

    it('should not call onPress when not provided', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      // Should not throw when card is pressed without callback
      expect(() => {
        fireEvent.press(getByTestId('favorite-road-card'))
      }).not.toThrow()
    })

    it('should not trigger onPress when delete button is pressed', () => {
      const mockOnPress = vi.fn()
      const mockOnDelete = vi.fn()
      const { getByTestId } = render(
        <FavoriteRoadCard
          {...defaultProps}
          onPress={mockOnPress}
          onDelete={mockOnDelete}
        />
      )

      // Press delete button
      fireEvent.press(getByTestId('favorite-road-card-delete'))

      // Only delete should be called, not press
      expect(mockOnDelete).toHaveBeenCalledTimes(1)
      expect(mockOnPress).not.toHaveBeenCalled()
    })

    it('should have correct accessibility label', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByTestId('favorite-road-card').props.accessibilityLabel).toBe(
        'View Scenic Coastal Drive'
      )
    })
  })
})
