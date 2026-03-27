/**
 * Tests for SavedRoutesScreen (US-010)
 *
 * Acceptance Criteria:
 * - AC-1: User has 3+ saved routes -> FlatList renders SavedRouteCard for each, newest first
 * - AC-2: Data loading -> 3 skeleton cards displayed
 * - AC-3: 0 saved routes -> ListEmptyComponent placeholder
 * - AC-4: Card tap -> onPress receives savedRouteId for navigation
 *
 * These tests validate the component's data transformation and rendering logic
 * by testing the pure functions and behaviors extracted from the screen component.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockPush = jest.fn()

jest.mock('react-native', () => ({
  FlatList: 'FlatList',
  RefreshControl: 'RefreshControl',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  View: 'View',
  Animated: {
    Value: jest.fn(),
    View: 'Animated.View',
    loop: jest.fn(),
    sequence: jest.fn(),
    timing: jest.fn(),
  },
}))
jest.mock('react-native-paper', () => ({
  Text: 'Text',
  useTheme: () => ({ semantic: {} }),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))
jest.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        card: { default: '#000' },
        background: { default: '#000' },
        onSurface: { default: '#fff', muted: '#888' },
        primary: { default: '#000' },
        muted: { default: '#333' },
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
      radius: { lg: 16, md: 8, sm: 4, none: 0, full: 9999 },
      type: {
        title: {
          lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
        },
      },
    },
  }),
}))

const mockHookReturn = {
  data: undefined as { routes: Array<Record<string, unknown>> } | undefined,
  isLoading: true,
}

jest.mock('../../../hooks/use-saved-routes', () => ({
  useSavedRoutesList: () => mockHookReturn,
}))
jest.mock('../../../components/ui/saved-route-card', () => ({
  SavedRouteCard: 'SavedRouteCard',
}))
jest.mock('../../../components/ui/saved-route-card.utils', () => ({
  formatDate: (ts: number) => new Date(ts).toLocaleDateString(),
}))
jest.mock('../../../components/ui/skeleton', () => ({ Skeleton: 'Skeleton' }))
jest.mock('./saved-routes.components', () => ({
  SkeletonCard: 'SkeletonCard',
  EmptyPlaceholder: 'EmptyPlaceholder',
}))

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import {
  formatDistance,
  formatDuration,
  THUMBNAIL_ROTATIONS,
  getSortedRoutes,
} from './saved-routes'
import SavedRoutesScreen from './saved-routes'
import type { SavedRouteListItemView } from '../../../types/routes'

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const makeRoute = (
  overrides: Partial<SavedRouteListItemView> & { savedRouteId: string }
): SavedRouteListItemView => ({
  name: 'Test Route',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  preview: {
    bounds: { north: 0, south: 0, east: 0, west: 0 },
    distanceMeters: 10000,
    durationSeconds: 1800,
  },
  capabilities: {
    canRead: true,
    canRename: true,
    canDelete: true,
  },
  ...overrides,
})

// ---------------------------------------------------------------------------
// AC-1: FlatList renders routes ordered newest first (by createdAt desc)
// ---------------------------------------------------------------------------
describe('getSortedRoutes', () => {
  it('should sort routes newest first by createdAt', () => {
    const routes: SavedRouteListItemView[] = [
      makeRoute({ savedRouteId: 'oldest', createdAt: 1000 }),
      makeRoute({ savedRouteId: 'newest', createdAt: 3000 }),
      makeRoute({ savedRouteId: 'middle', createdAt: 2000 }),
    ]

    const sorted = getSortedRoutes(routes)

    expect(sorted[0].savedRouteId).toBe('newest')
    expect(sorted[1].savedRouteId).toBe('middle')
    expect(sorted[2].savedRouteId).toBe('oldest')
  })

  it('should return empty array when given empty array', () => {
    expect(getSortedRoutes([])).toEqual([])
  })

  it('should not mutate the original array', () => {
    const routes = [
      makeRoute({ savedRouteId: 'a', createdAt: 1 }),
      makeRoute({ savedRouteId: 'b', createdAt: 2 }),
    ]
    const original = [...routes]
    getSortedRoutes(routes)
    expect(routes[0].savedRouteId).toBe(original[0].savedRouteId)
  })
})

// ---------------------------------------------------------------------------
// AC-2: Loading state shows 3 skeleton cards
// ---------------------------------------------------------------------------
describe('SKELETON_COUNT', () => {
  it('should define exactly 3 skeleton placeholders', () => {
    const { SKELETON_COUNT } = require('./saved-routes')
    expect(SKELETON_COUNT).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// AC-3: 0 saved routes -> empty state placeholder renders
// ---------------------------------------------------------------------------
describe('AC-3: Empty state rendering', () => {
  it('should pass empty data and ListEmptyComponent to FlatList when routes is empty', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })
    const root = tree!.root

    const flatList = root.findByProps({ testID: 'saved-routes-list' })
    expect(flatList.props.data).toEqual([])
    expect(flatList.props.ListEmptyComponent).toBeDefined()
  })

  afterAll(() => {
    // Reset mock state
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })
})

// ---------------------------------------------------------------------------
// AC-4: Card tap produces correct route path for navigation
// ---------------------------------------------------------------------------
describe('AC-4: Card tap navigates with savedRouteId', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  afterAll(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should call router.push with correct path when card is pressed', () => {
    const testRoute = makeRoute({ savedRouteId: 'route-abc-123', createdAt: 1000 })
    mockHookReturn.data = { routes: [testRoute] }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })
    const root = tree!.root

    const flatList = root.findByProps({ testID: 'saved-routes-list' })
    // Invoke renderItem to get the card element, then call its onPress
    const rendered = flatList.props.renderItem({ item: testRoute, index: 0 })
    rendered.props.onPress()

    expect(mockPush).toHaveBeenCalledWith('/(app)/saved-route/route-abc-123')
  })
})

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------
describe('formatDistance', () => {
  it('should format meters to miles with 1 decimal', () => {
    expect(formatDistance(16093)).toBe('10.0 mi')
  })

  it('should format short distances', () => {
    expect(formatDistance(1609)).toBe('1.0 mi')
  })

  it('should format zero distance', () => {
    expect(formatDistance(0)).toBe('0.0 mi')
  })
})

describe('formatDuration', () => {
  it('should format seconds to minutes for short durations', () => {
    expect(formatDuration(300)).toBe('5 min')
  })

  it('should format seconds to hours and minutes', () => {
    expect(formatDuration(3900)).toBe('1h 5m')
  })

  it('should format exact hours', () => {
    expect(formatDuration(7200)).toBe('2h 0m')
  })

  it('should format zero duration', () => {
    expect(formatDuration(0)).toBe('0 min')
  })
})

// ---------------------------------------------------------------------------
// Thumbnail rotation variation
// ---------------------------------------------------------------------------
describe('THUMBNAIL_ROTATIONS', () => {
  it('should have 5 rotation values', () => {
    expect(THUMBNAIL_ROTATIONS).toHaveLength(5)
  })

  it('should cycle per index with modulo', () => {
    expect(THUMBNAIL_ROTATIONS[0 % 5]).toBe(-12)
    expect(THUMBNAIL_ROTATIONS[1 % 5]).toBe(-8)
    expect(THUMBNAIL_ROTATIONS[2 % 5]).toBe(-5)
    expect(THUMBNAIL_ROTATIONS[3 % 5]).toBe(-10)
    expect(THUMBNAIL_ROTATIONS[4 % 5]).toBe(-7)
    // Cycle repeats
    expect(THUMBNAIL_ROTATIONS[5 % 5]).toBe(-12)
  })
})
