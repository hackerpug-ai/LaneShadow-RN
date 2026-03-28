/**
 * Unit tests for favorite-road-card.tsx
 *
 * Acceptance Criteria:
 * - AC1: Given favorite road data, when card renders, then shows name and mini map preview
 * - AC2: Given card rendered, when user taps delete, then confirmation dialog shown
 * - AC3: Given delete confirmed, when favoriteRoads.remove called, then card removed from list
 * - AC4: Given card rendered, when mini map displays, then shows road segment geometry
 */

import React from 'react'
import { render, fireEvent } from '@testing-library/react-native'

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

// Mock useSemanticTheme hook
jest.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock react-native-paper Text
jest.mock('react-native-paper', () => {
  const { View, Text: RNText, Pressable } = require('react-native')
  const { createElement } = require('react')

  const Text = ({ children, style, ...props }) =>
    createElement(RNText, { style, ...props }, children)

  return { Text }
})

// Mock RouteThumbnail component
jest.mock('../route-thumbnail', () => ({
  RouteThumbnail: ({ width, height, testID }: any) => {
    const { View } = require('react-native')
    return React.createElement(View, { testID, style: { width, height } })
  },
}))

// Mock Card component
jest.mock('../card', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')

  return {
    Card: ({ children, testID, style }: any) =>
      createElement(View, { testID, style }, children),
  }
})

// Mock Button component
jest.mock('../button', () => {
  const { Pressable } = require('react-native')
  const { createElement } = require('react')

  return {
    Button: ({ children, onPress, testID, accessibilityLabel, icon, ...props }: any) => {
      // Render as a pressable view with testID
      return createElement(
        Pressable,
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

// ---------------------------------------------------------------------------
// Import after mocks
// ---------------------------------------------------------------------------

import { FavoriteRoadCard } from '../favorite-road-card'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockFavorite: any = {
  _id: 'favorite123',
  _creationTime: 1234567890,
  userId: 'user123',
  name: 'Scenic Coastal Drive',
  geometry: 'encoded_polyline_string',
  bounds: {
    north: 37.7749,
    south: 37.7549,
    east: -122.4194,
    west: -122.4394,
  },
  createdAt: 1234567890,
}

const defaultProps = {
  favorite: mockFavorite,
  onDelete: jest.fn(),
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('FavoriteRoadCard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
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

      expect(getByTestId('route-thumbnail')).toBeTruthy()
    })

    it('should render thumbnail with correct size (60x60)', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      const thumbnail = getByTestId('route-thumbnail')
      expect(thumbnail.props.style).toEqual(
        expect.objectContaining({
          width: 60,
          height: 60,
        })
      )
    })

    it('should display "Favorite road" caption', () => {
      const { getByText } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByText('Favorite road')).toBeTruthy()
    })
  })

  /**
   * AC2: Given card rendered, when user taps delete, then confirmation dialog shown
   */
  describe('AC2: Delete confirmation dialog', () => {
    it('should show delete button', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByTestId('delete-button')).toBeTruthy()
    })

    it('should have accessibility label for delete button', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      expect(getByTestId('delete-button').props.accessibilityLabel).toBe(
        'Delete favorite'
      )
    })

    it('should show confirmation dialog when delete button is pressed', () => {
      const { getByTestId, queryByTestId } = render(
        <FavoriteRoadCard {...defaultProps} />
      )

      // Dialog should not be visible initially
      expect(queryByTestId('delete-favorite-dialog')).toBeNull()

      // Press delete button
      fireEvent.press(getByTestId('delete-button'))

      // Dialog should now be visible
      expect(getByTestId('delete-favorite-dialog')).toBeTruthy()
    })

    it('should include road name in dialog message', () => {
      const { getByTestId, getByText } = render(
        <FavoriteRoadCard {...defaultProps} />
      )

      fireEvent.press(getByTestId('delete-button'))

      expect(getByText(/Scenic Coastal Drive/)).toBeTruthy()
    })

    it('should dismiss dialog when cancel is pressed', () => {
      const { getByTestId, queryByTestId } = render(
        <FavoriteRoadCard {...defaultProps} />
      )

      // Open dialog
      fireEvent.press(getByTestId('delete-button'))
      expect(getByTestId('delete-favorite-dialog')).toBeTruthy()

      // Press cancel
      fireEvent.press(getByTestId('delete-favorite-dialog-cancel'))

      // Dialog should be dismissed
      expect(queryByTestId('delete-favorite-dialog')).toBeNull()
    })
  })

  /**
   * AC3: Given delete confirmed, when favoriteRoads.remove called, then card removed from list
   */
  describe('AC3: Delete confirmation', () => {
    it('should call onDelete when delete is confirmed', () => {
      const mockOnDelete = jest.fn()
      const { getByTestId } = render(
        <FavoriteRoadCard {...defaultProps} onDelete={mockOnDelete} />
      )

      // Open dialog
      fireEvent.press(getByTestId('delete-button'))

      // Confirm delete
      fireEvent.press(getByTestId('delete-favorite-dialog-confirm'))

      expect(mockOnDelete).toHaveBeenCalledTimes(1)
    })

    it('should close dialog after confirmation', () => {
      const { getByTestId, queryByTestId } = render(
        <FavoriteRoadCard {...defaultProps} />
      )

      // Open dialog
      fireEvent.press(getByTestId('delete-button'))
      expect(getByTestId('delete-favorite-dialog')).toBeTruthy()

      // Confirm delete
      fireEvent.press(getByTestId('delete-favorite-dialog-confirm'))

      // Dialog should be closed
      expect(queryByTestId('delete-favorite-dialog')).toBeNull()
    })
  })

  /**
   * AC4: Given card rendered, when mini map displays, then shows road segment geometry
   */
  describe('AC4: Mini map geometry display', () => {
    it('should render RouteThumbnail with bounds for geometry display', () => {
      const { getByTestId } = render(<FavoriteRoadCard {...defaultProps} />)

      const thumbnail = getByTestId('route-thumbnail')
      expect(thumbnail).toBeTruthy()
    })

    it('should handle favorite roads without bounds', () => {
      const favoriteWithoutBounds = {
        ...mockFavorite,
        bounds: undefined,
      }

      const { getByTestId, getByText } = render(
        <FavoriteRoadCard
          favorite={favoriteWithoutBounds}
          onDelete={jest.fn()}
        />
      )

      // Should still render thumbnail
      expect(getByTestId('route-thumbnail')).toBeTruthy()
      // Should still show name
      expect(getByText('Scenic Coastal Drive')).toBeTruthy()
    })
  })
})
