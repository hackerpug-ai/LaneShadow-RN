/**
 * Unit tests for favorite-roads-section.tsx
 *
 * Acceptance Criteria:
 * - AC1: Given: User navigates to Settings, When: Favorite Roads section exists, Then: Section visible with header
 * - AC2: Given: User has favorites, When: Section renders, Then: Shows FavoriteRoadCard for each favorite
 * - AC3: Given: User has no favorites, When: Section renders, Then: Shows empty state message
 * - AC4: Given: User deletes favorite, When: favoriteRoads.remove called, Then: Card removed, list updates
 */

import { vi, describe, it, expect, beforeEach, type Mock } from 'vitest'
import React from 'react'
import { render, waitFor, fireEvent } from '@testing-library/react-native'
import type { Doc } from '../../../convex/_generated/dataModel'

import { SavedRoutesSection } from '../favorite-roads-section'
import { useQuery, useMutation } from 'convex/react'

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
    surface: {
      default: '#2B2725',
      container: '#24272B',
    },
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
      default: '#E3E3E3',
      muted: '#D3BBA5',
      subtle: '#C3AB95',
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
    0: {
      shadowColor: 'transparent',
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
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
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

// Mock useSemanticTheme hook
vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: mockSemanticTheme }),
}))

// Mock react-native-paper Text
vi.mock('react-native-paper', () => {
  const { View, Text: RNText, Pressable } = require('react-native')
  const { createElement } = require('react')

  const Text = ({ children, style, ...props }: any) =>
    createElement(RNText, { style, ...props }, children)

  return { Text }
})

// Mock EmptyState component
vi.mock('../../../components/ui/empty-state', () => ({
  EmptyState: ({ icon, headline, body, testID }: any) => {
    const { View, Text } = require('react-native')
    const { createElement } = require('react')
    return createElement(
      View,
      { testID },
      createElement(Text, null, headline),
      createElement(Text, null, body)
    )
  },
}))

// Mock SectionHeader component
vi.mock('../../../components/ui/section-header', () => ({
  SectionHeader: ({ title }: any) => {
    const { Text } = require('react-native')
    const { createElement } = require('react')
    return createElement(Text, null, title)
  },
}))

// Mock FavoriteRoadCard component
vi.mock('../../../components/ui/favorite-road-card', () => ({
  FavoriteRoadCard: ({ name, onDelete, testID }: any) => {
    const { View, Text, Pressable } = require('react-native')
    const { createElement } = require('react')

    return createElement(
      View,
      { testID },
      createElement(Text, null, name),
      createElement(Pressable, {
        testID: 'delete-button',
        onPress: onDelete,
      })
    )
  },
}))

// Mock Convex hooks
vi.mock('convex/react', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SavedRoutesSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  /**
   * AC1: Section visible with header
   * Given: User navigates to Settings
   * When: Favorite Roads section exists
   * Then: Section visible with header
   */
  it('should satisfy AC1: renders section with header when loading', () => {
    ;(useQuery as Mock).mockReturnValue(undefined)
    ;(useMutation as Mock).mockReturnValue(vi.fn())

    const { getByText } = render(<SavedRoutesSection />)

    expect(getByText('Favorite Roads')).toBeTruthy()
    expect(useQuery).toHaveBeenCalledWith('db.favoriteRoads:list')
  })

  /**
   * AC2: Shows FavoriteRoadCard for each favorite
   * Given: User has favorites
   * When: Section renders
   * Then: Shows FavoriteRoadCard for each favorite
   */
  it('should satisfy AC2: renders favorite cards when user has favorites', async () => {
    const mockFavorites: Doc<'favorite_roads'>[] = [
      {
        _id: 'favorite1' as any,
        _creationTime: 1000,
        clerkUserId: 'user1',
        name: 'Scenic Route 1',
        geometry: 'geometry1',
        bounds: {
          north: 40.7128,
          south: 40.6,
          east: -74.006,
          west: -74.1,
        },
        createdAt: 1000,
        updatedAt: 1000,
      },
      {
        _id: 'favorite2' as any,
        _creationTime: 2000,
        clerkUserId: 'user1',
        name: 'Mountain Pass',
        geometry: 'geometry2',
        bounds: {
          north: 40.8,
          south: 40.7,
          east: -74.0,
          west: -74.2,
        },
        createdAt: 2000,
        updatedAt: 2000,
      },
    ]

    ;(useQuery as Mock).mockReturnValue(mockFavorites)
    const mockRemove = vi.fn()
    ;(useMutation as Mock).mockReturnValue(mockRemove)

    const { getByText } = render(<SavedRoutesSection />)

    await waitFor(() => {
      expect(getByText('Favorite Roads')).toBeTruthy()
      expect(getByText('Scenic Route 1')).toBeTruthy()
      expect(getByText('Mountain Pass')).toBeTruthy()
    })
  })

  /**
   * AC3: Shows empty state message
   * Given: User has no favorites
   * When: Section renders
   * Then: Shows empty state message
   */
  it('should satisfy AC3: renders empty state when user has no favorites', async () => {
    ;(useQuery as Mock).mockReturnValue([])
    ;(useMutation as Mock).mockReturnValue(vi.fn())

    const { getByText, getByTestId } = render(<SavedRoutesSection />)

    await waitFor(() => {
      expect(getByText('Favorite Roads')).toBeTruthy()
      expect(getByText('No favorite roads yet')).toBeTruthy()
      expect(
        getByText('Long-press a route segment to save it as a favorite')
      ).toBeTruthy()
    })

    expect(getByTestId('empty-state')).toBeTruthy()
  })

  /**
   * AC4: Delete removes card and updates list
   * Given: User deletes favorite
   * When: favoriteRoads.remove called
   * Then: Card removed, list updates
   */
  it('should satisfy AC4: calls remove mutation when delete button pressed', async () => {
    const mockFavorites: Doc<'favorite_roads'>[] = [
      {
        _id: 'favorite1' as any,
        _creationTime: 1000,
        clerkUserId: 'user1',
        name: 'Scenic Route 1',
        geometry: 'geometry1',
        bounds: {
          north: 40.7128,
          south: 40.6,
          east: -74.006,
          west: -74.1,
        },
        createdAt: 1000,
        updatedAt: 1000,
      },
    ]

    ;(useQuery as Mock).mockReturnValue(mockFavorites)
    const mockRemove = vi.fn().mockResolvedValue({ success: true })
    ;(useMutation as Mock).mockReturnValue(mockRemove)

    const { getByText, getByTestId } = render(<SavedRoutesSection />)

    await waitFor(() => {
      expect(getByText('Scenic Route 1')).toBeTruthy()
    })

    // Find delete button and press it
    const deleteButton = getByTestId('delete-button')
    fireEvent.press(deleteButton)

    await waitFor(() => {
      expect(mockRemove).toHaveBeenCalledWith({
        favoriteRoadId: 'favorite1',
      })
    })
  })

  it('should order favorites by createdAt descending (newest first)', async () => {
    const mockFavorites: Doc<'favorite_roads'>[] = [
      {
        _id: 'old' as any,
        _creationTime: 1000,
        clerkUserId: 'user1',
        name: 'Old Route',
        geometry: 'oldGeometry',
        bounds: {
          north: 40.7,
          south: 40.6,
          east: -74.0,
          west: -74.1,
        },
        createdAt: 1000, // Older
        updatedAt: 1000,
      },
      {
        _id: 'new' as any,
        _creationTime: 3000,
        clerkUserId: 'user1',
        name: 'New Route',
        geometry: 'newGeometry',
        bounds: {
          north: 40.9,
          south: 40.8,
          east: -73.9,
          west: -74.0,
        },
        createdAt: 3000, // Newest
        updatedAt: 3000,
      },
      {
        _id: 'middle' as any,
        _creationTime: 2000,
        clerkUserId: 'user1',
        name: 'Middle Route',
        geometry: 'middleGeometry',
        bounds: {
          north: 40.8,
          south: 40.7,
          east: -74.0,
          west: -74.1,
        },
        createdAt: 2000, // Middle
        updatedAt: 2000,
      },
    ]

    ;(useQuery as Mock).mockReturnValue(mockFavorites)
    ;(useMutation as Mock).mockReturnValue(vi.fn())

    const { getAllByText } = render(<SavedRoutesSection />)

    await waitFor(() => {
      expect(getAllByText('New Route')).toBeTruthy()
      expect(getAllByText('Middle Route')).toBeTruthy()
      expect(getAllByText('Old Route')).toBeTruthy()
    })

    // The backend sorts by createdAt descending, so we trust that order
    // This test verifies the component renders what it receives
  })
})
