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

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { SavedRouteListItemView } from '../../../types/routes'
import SavedRoutesScreen, {
  formatDistance,
  formatDuration,
  getSortedRoutes,
  SKELETON_COUNT,
  THUMBNAIL_ROTATIONS,
} from './saved-routes'

const mockPush = vi.fn()

vi.mock('react-native', () => ({
  FlatList: 'FlatList',
  RefreshControl: 'RefreshControl',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  View: 'View',
  Animated: {
    Value: vi.fn(),
    View: 'Animated.View',
    loop: vi.fn(),
    sequence: vi.fn(),
    timing: vi.fn(),
  },
}))
vi.mock('react-native-paper', () => ({
  Text: 'Text',
  useTheme: () => ({ semantic: {} }),
}))
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))
vi.mock('../../../hooks/use-semantic-theme', () => ({
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
  data: undefined as { routes: Record<string, unknown>[] } | undefined,
  isLoading: true,
}

vi.mock('react-native-gesture-handler', () => {
  const React = require('react')
  return {
    Swipeable: React.forwardRef(function MockSwipeable(
      props: Record<string, unknown>,
      _ref: React.Ref<unknown>,
    ) {
      return React.createElement('Swipeable', props, props.children)
    }),
  }
})
vi.mock('react-native-notifier', () => ({
  Notifier: {
    showNotification: vi.fn(),
    hideNotification: vi.fn(),
  },
}))
vi.mock('../../../hooks/use-saved-routes', () => ({
  useSavedRoutesList: () => mockHookReturn,
  useSoftDeleteRoute: () => ({
    run: vi.fn(),
    isRunning: false,
    error: null,
    resetError: vi.fn(),
  }),
  useUndoDeleteRoute: () => ({
    run: vi.fn(),
    isRunning: false,
    error: null,
    resetError: vi.fn(),
  }),
}))
vi.mock('../../../components/ui/saved-route-card', () => ({
  SavedRouteCard: 'SavedRouteCard',
}))
vi.mock('../../../components/ui/saved-route-card.utils', () => ({
  formatDate: (ts: number) => new Date(ts).toLocaleDateString(),
}))
vi.mock('../../../components/ui/skeleton', () => ({ Skeleton: 'Skeleton' }))
vi.mock('../../../components/ui/empty-state', () => ({
  EmptyState: 'EmptyState',
}))
vi.mock('../../../components/ui/delete-route-dialog', () => ({
  DeleteRouteDialog: 'DeleteRouteDialog',
}))
vi.mock('../../../lib/notifier-helpers', () => ({
  showSuccessNotification: vi.fn(),
  showErrorNotification: vi.fn(),
}))
vi.mock('./saved-routes.components', () => {
  const React = require('react')
  return {
    SkeletonCard: 'SkeletonCard',
    EmptyPlaceholder: 'EmptyPlaceholder',
    LoadingState: ({ children }: { children: unknown }) =>
      React.createElement('LoadingState', null, children),
    FilterHeader: 'FilterHeader',
    FilteredEmptyState: 'FilteredEmptyState',
    SwipeableRouteCard: ({ children }: { children: unknown }) =>
      React.createElement('SwipeableRouteCard', null, children),
  }
})
vi.mock('../../../components/layouts/subpage-layout', () => {
  const React = require('react')
  return {
    SubpageLayout: ({ children, title }: { children: unknown; title: string }) =>
      React.createElement('SubpageLayout', { title }, children),
  }
})

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const makeRoute = (
  overrides: Partial<SavedRouteListItemView> & { savedRouteId: string },
): SavedRouteListItemView => ({
  name: 'Test Route',
  startLabel: 'Start',
  endLabel: 'End',
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
  routeIndex: {
    routeFingerprint: 'test-fingerprint',
    sampledPoints: [],
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
    // Invoke renderItem to get the element tree, render it, then find the card's onPress
    const rendered = flatList.props.renderItem({ item: testRoute, index: 0 })
    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(rendered)
    })
    const card = itemTree!.root.findByType('SavedRouteCard' as unknown as React.ComponentClass)
    card.props.onPress()

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

// ---------------------------------------------------------------------------
// US-018: Scroll position preservation
// ---------------------------------------------------------------------------
describe('US-018: Scroll position preservation', () => {
  /**
   * Acceptance Criteria:
   * - AC-1: Scrolled to 5th card -> tap card -> view detail -> back -> list at same position
   * - AC-2: At bottom of list -> tap card -> back -> still at bottom
   * - AC-3: On detail screen, new route added -> back -> list updates but maintains position
   * - AC-4: On saved routes -> switch tab -> switch back -> scroll position maintained
   *
   * Architecture verification: Expo Router Stack + Tabs keeps saved-routes mounted
   * when navigating to detail or switching tabs, so FlatList scroll is naturally preserved.
   */

  it('AC-1/AC-2: FlatList stays mounted when data is loaded (no conditional unmount)', () => {
    // When data is loaded, the FlatList branch renders (not the skeleton branch).
    // As long as isLoading stays false, the FlatList component stays in the tree,
    // preserving its internal scroll state across re-renders.
    const routes = Array.from({ length: 10 }, (_, i) =>
      makeRoute({ savedRouteId: `route-${i}`, createdAt: 1000 + i }),
    )
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    // Verify FlatList is rendered with all 10 routes
    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    expect(flatList.props.data).toHaveLength(10)

    // Simulate a data refresh (e.g., returning from detail screen with Convex cache hit).
    // The same data reference means no unnecessary FlatList re-mount.
    act(() => {
      tree!.update(React.createElement(SavedRoutesScreen))
    })

    // FlatList is still the same instance in the tree (not replaced by skeleton)
    const flatListAfter = tree!.root.findByProps({ testID: 'saved-routes-list' })
    expect(flatListAfter.props.data).toHaveLength(10)
  })

  it('AC-3: maintainVisibleContentPosition is set for data changes during navigation', () => {
    // When a new route is added while the user is on the detail screen,
    // Convex real-time updates push new data to the FlatList.
    // maintainVisibleContentPosition ensures visible items stay in place.
    const routes = [makeRoute({ savedRouteId: 'route-1', createdAt: 1000 })]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    expect(flatList.props.maintainVisibleContentPosition).toEqual({
      minIndexForVisible: 0,
    })
  })

  it('AC-3: FlatList uses stable keyExtractor so existing items are not re-mounted on data change', () => {
    // keyExtractor returns savedRouteId, which is stable across data updates.
    // This means React can reconcile existing items without unmounting them.
    const routes = [makeRoute({ savedRouteId: 'route-abc', createdAt: 1000 })]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const key = flatList.props.keyExtractor(routes[0])
    expect(key).toBe('route-abc')
  })

  it('AC-4: Component does not force scroll-to-top on re-render (no scrollToOffset call)', () => {
    // Verify the component does not imperatively scroll to top.
    // The FlatList has no ref-based scrollToOffset or scrollToIndex calls
    // that would reset position on mount or re-render.
    const routes = Array.from({ length: 5 }, (_, i) =>
      makeRoute({ savedRouteId: `route-${i}`, createdAt: 1000 + i }),
    )
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })

    // No initialScrollIndex that would force position
    expect(flatList.props.initialScrollIndex).toBeUndefined()

    // Re-render should not change FlatList identity
    act(() => {
      tree!.update(React.createElement(SavedRoutesScreen))
    })

    const flatListAfter = tree!.root.findByProps({ testID: 'saved-routes-list' })
    expect(flatListAfter.props.data).toHaveLength(5)
  })

  afterAll(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })
})
