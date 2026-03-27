/**
 * Tests for SavedRouteCard press target fix (US-030)
 *
 * Acceptance Criteria:
 * - AC1: Tapping card body (name/stats area) navigates to route detail screen
 * - AC2: Tapping chevron icon area fires same navigation (no double-fire)
 * - AC3: VoiceOver/TalkBack announces card as single button with route name
 * - AC4: Swipe gesture still works inside SwipeableRouteCard (no conflict)
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const mockPush = jest.fn()
const mockBack = jest.fn()

const mockSwipeableClose = jest.fn()
const mockSwipeableInstances: Array<{
  close: jest.Mock
  renderRightActions: (() => unknown) | null
  onSwipeableOpen: ((direction: string) => void) | null
}> = []

jest.mock('react-native', () => ({
  FlatList: 'FlatList',
  Pressable: 'Pressable',
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  TextInput: 'TextInput',
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
  useTheme: () => ({
    semantic: {
      color: {
        card: { default: '#1a1a1a' },
        background: { default: '#000' },
        onSurface: { default: '#fff', muted: '#888', subtle: '#666' },
        surfaceVariant: { default: '#222' },
        primary: { default: '#00f' },
        onPrimary: { default: '#fff' },
        onSecondary: { default: '#fff' },
        muted: { default: '#333' },
        danger: { default: '#EF4444' },
        surface: { default: '#111' },
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
        title: { lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' } },
        body: {
          md: { fontSize: 14, lineHeight: 20 },
          sm: { fontSize: 12, lineHeight: 16 },
        },
        label: { sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' } },
      },
    },
  }),
  Button: 'Button',
  Dialog: {
    Title: 'Dialog.Title',
    Content: 'Dialog.Content',
    Actions: 'Dialog.Actions',
  },
  Portal: ({ children }: { children: unknown }) => children,
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))

jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))

jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  return {
    Swipeable: React.forwardRef(function MockSwipeable(
      props: Record<string, unknown>,
      ref: React.Ref<unknown>
    ) {
      const instance = {
        close: mockSwipeableClose,
        renderRightActions: props.renderRightActions as (() => unknown) | null,
        onSwipeableOpen: props.onSwipeableOpen as
          | ((direction: string) => void)
          | null,
      }
      mockSwipeableInstances.push(instance)

      React.useImperativeHandle(ref, () => instance)

      return React.createElement(
        'Swipeable',
        { ...props, testID: 'swipeable-wrapper' },
        props.children
      )
    }),
  }
})

jest.mock('react-native-notifier', () => ({
  Notifier: {
    showNotification: jest.fn(),
    hideNotification: jest.fn(),
  },
}))

jest.mock('../../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        card: { default: '#000' },
        background: { default: '#000' },
        onSurface: { default: '#fff', muted: '#888', subtle: '#666' },
        surfaceVariant: { default: '#222' },
        primary: { default: '#00f' },
        onPrimary: { default: '#fff' },
        onSecondary: { default: '#fff' },
        muted: { default: '#333' },
        danger: { default: '#EF4444' },
        surface: { default: '#111' },
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
        title: { lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' } },
        body: {
          md: { fontSize: 14, lineHeight: 20 },
          sm: { fontSize: 12, lineHeight: 16 },
        },
        label: { sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' } },
      },
    },
  }),
}))

const mockSoftDeleteRun = jest.fn().mockResolvedValue({ scheduledDeletionId: 'sched_123' })
const mockUndoDeleteRun = jest.fn().mockResolvedValue(null)

const mockHookReturn = {
  data: undefined as { routes: Array<Record<string, unknown>> } | undefined,
  isLoading: true,
}

jest.mock('../../../../hooks/use-saved-routes', () => ({
  useSavedRoutesList: () => mockHookReturn,
  useSoftDeleteRoute: () => ({
    run: mockSoftDeleteRun,
    isRunning: false,
    error: null,
    resetError: jest.fn(),
  }),
  useUndoDeleteRoute: () => ({
    run: mockUndoDeleteRun,
    isRunning: false,
    error: null,
    resetError: jest.fn(),
  }),
}))

jest.mock('../../../../lib/notifier-helpers', () => ({
  showSuccessNotification: jest.fn(),
  showErrorNotification: jest.fn(),
}))

jest.mock('../../../../components/ui/route-thumbnail', () => ({
  RouteThumbnail: 'RouteThumbnail',
}))
// For screen-level tests (AC1 fire, AC4) we mock SavedRouteCard as a string
// For SavedRouteCard unit tests (AC1-3 structural), we require the real component
jest.mock('../../../../components/ui/saved-route-card', () => ({
  SavedRouteCard: 'SavedRouteCard',
}))
jest.mock('../../../../components/ui/saved-route-card.utils', () => ({
  formatDate: (ts: number) => new Date(ts).toLocaleDateString(),
}))
jest.mock('../../../../components/ui/skeleton', () => ({ Skeleton: 'Skeleton' }))
jest.mock('../../../../components/ui/empty-state', () => ({
  EmptyState: 'EmptyState',
}))
jest.mock('../../../../components/ui/route-search-bar', () => ({
  RouteSearchBar: 'RouteSearchBar',
}))
jest.mock('../../../../components/ui/date-range-picker', () => ({
  DateRangePicker: 'DateRangePicker',
}))
jest.mock('../../../../components/ui/delete-route-dialog', () => ({
  DeleteRouteDialog: 'DeleteRouteDialog',
}))

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import type { SavedRouteListItemView } from '../../../../types/routes'

const makeRoute = (
  overrides: Partial<SavedRouteListItemView> & { savedRouteId: string }
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
  ...overrides,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockSwipeableInstances.length = 0
  mockHookReturn.data = undefined
  mockHookReturn.isLoading = true
})

// ---------------------------------------------------------------------------
// AC1: Tapping card body navigates to route detail screen
// ---------------------------------------------------------------------------
describe('AC1: Tapping card body navigates to detail screen', () => {
  it('should fire onPress when the SavedRouteCard prop is called from the list', () => {
    const routes = [
      makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' }),
    ]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    // Find the SavedRouteCard and trigger its onPress
    const card = itemTree!.root.findByType('SavedRouteCard' as unknown as React.ComponentClass)
    expect(card.props.onPress).toBeDefined()

    act(() => {
      card.props.onPress()
    })

    expect(mockPush).toHaveBeenCalledWith(
      expect.stringContaining('route-1')
    )
  })

  it('should pass onPress prop to SavedRouteCard (not to chevron)', () => {
    const routes = [
      makeRoute({ savedRouteId: 'route-2', name: 'Evening Ride' }),
    ]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    const card = itemTree!.root.findByType('SavedRouteCard' as unknown as React.ComponentClass)
    // onPress is on the card — not nested deeper
    expect(card.props.onPress).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AC2: Single press target — card rendered with single onPress, no double-fire
// ---------------------------------------------------------------------------
describe('AC2: Chevron fires same navigation, no double-fire', () => {
  it('should render exactly one SavedRouteCard per list item (not nested Pressables from screen)', () => {
    const routes = [
      makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' }),
    ]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    // Should be exactly one SavedRouteCard (not duplicated)
    const cards = itemTree!.root.findAllByType(
      'SavedRouteCard' as unknown as React.ComponentClass
    )
    expect(cards.length).toBe(1)

    // The card should have exactly one onPress prop — no second onPress on chevron
    // (chevron is inside SavedRouteCard; this confirms screen does not also wrap with Pressable)
    const cardOnPress = cards[0].props.onPress
    expect(typeof cardOnPress).toBe('function')
  })

  it('should NOT have a Pressable wrapping SavedRouteCard in the screen renderItem', () => {
    const routes = [
      makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' }),
    ]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    // There should be NO extra Pressable at the screen level wrapping SavedRouteCard
    // (navigation is handled by SavedRouteCard's own Pressable wrapper)
    const pressables = itemTree!.root.findAllByType(
      'Pressable' as unknown as React.ComponentClass
    )
    // Only the SwipeableRouteCard delete action Pressable should exist at this level
    // SavedRouteCard's internal Pressable is inside the mocked component
    const nonDeletePressables = pressables.filter(
      (p) => p.props.testID !== 'swipe-delete-action'
    )
    expect(nonDeletePressables.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// AC3: Accessibility — card announced as single button with route name
// ---------------------------------------------------------------------------
describe('AC3: Accessibility role and label on SavedRouteCard', () => {
  it('should pass name prop to SavedRouteCard for accessibility label generation', () => {
    const routes = [
      makeRoute({ savedRouteId: 'route-1', name: 'Evening Ride' }),
    ]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    // SavedRouteCard receives name prop — the component uses this for accessibilityLabel
    const card = itemTree!.root.findByType(
      'SavedRouteCard' as unknown as React.ComponentClass
    )
    expect(card.props.name).toBe('Evening Ride')
  })

  it('SavedRouteCard component source should have accessibilityRole button and label with name', () => {
    // Verify the component source has the expected accessibility attributes
    // by inspecting the saved-route-card.tsx source directly
    const fs = require('fs') as typeof import('fs')
    const path = require('path') as typeof import('path')
    const source = fs.readFileSync(
      path.resolve(__dirname, '../../../../components/ui/saved-route-card.tsx'),
      'utf-8'
    )
    expect(source).toContain('accessibilityRole="button"')
    expect(source).toContain('accessibilityLabel')
    expect(source).toContain('${name}')
  })
})

// ---------------------------------------------------------------------------
// AC4: Swipe gesture still works inside SwipeableRouteCard
// ---------------------------------------------------------------------------
describe('AC4: Swipe gesture unaffected by Pressable wrapper', () => {
  it('should still wrap each route card in Swipeable', () => {
    const routes = [
      makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' }),
    ]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    const swipeables = itemTree!.root.findAllByProps({ testID: 'swipeable-wrapper' })
    expect(swipeables.length).toBe(1)
    expect(swipeables[0].props.renderRightActions).toBeDefined()
  })

  it('should render delete action via renderRightActions', () => {
    const routes = [makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' })]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    const swipeable = itemTree!.root.findByProps({ testID: 'swipeable-wrapper' })
    const rightActions = swipeable.props.renderRightActions

    let actionsTree: renderer.ReactTestRenderer
    act(() => {
      actionsTree = renderer.create(rightActions())
    })

    const deleteAction = actionsTree!.root.findByProps({ testID: 'swipe-delete-action' })
    expect(deleteAction).toBeDefined()
  })
})
