/**
 * Tests for swipe-to-delete on saved route cards (US-029)
 *
 * Acceptance Criteria:
 * - AC1: Swiping left on a route card reveals red delete area with trash icon
 * - AC2: Completing swipe or tapping delete area opens delete confirmation dialog
 * - AC3: Confirming delete triggers soft-delete + undo toast flow
 * - AC4: Partial swipe below threshold snaps card back (Swipeable built-in)
 * - AC5: Delete area uses semantic.color.danger.default, icon is white trash can
 */

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import type { SavedRouteListItemView } from '../../../../server/types/routes'
import SavedRoutesScreen from '../saved-routes'
import { SwipeableRouteCard } from '../saved-routes.components'

/* eslint-disable @typescript-eslint/no-require-imports */

const mockPush = vi.fn()
const mockBack = vi.fn()

// Track Swipeable instances
const mockSwipeableClose = vi.fn()
const mockSwipeableInstances: {
  close: Mock
  renderRightActions: (() => unknown) | null
  onSwipeableOpen: ((direction: string) => void) | null
}[] = []

vi.mock('react-native', () => ({
  FlatList: 'FlatList',
  Pressable: 'Pressable',
  RefreshControl: 'RefreshControl',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  TextInput: 'TextInput',
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
  Button: 'Button',
  Dialog: {
    Title: 'Dialog.Title',
    Content: 'Dialog.Content',
    Actions: 'Dialog.Actions',
  },
  Portal: ({ children }: { children: unknown }) => children,
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))
vi.mock('@expo/vector-icons/MaterialCommunityIcons', () => ({
  default: 'MaterialCommunityIcons',
}))

vi.mock('react-native-gesture-handler', () => {
  const React = require('react')
  return {
    Swipeable: React.forwardRef(function MockSwipeable(
      props: Record<string, unknown>,
      ref: React.Ref<unknown>,
    ) {
      const instance = {
        close: mockSwipeableClose,
        renderRightActions: props.renderRightActions as (() => unknown) | null,
        onSwipeableOpen: props.onSwipeableOpen as ((direction: string) => void) | null,
      }
      mockSwipeableInstances.push(instance)

      React.useImperativeHandle(ref, () => instance)

      return React.createElement(
        'Swipeable',
        { ...props, testID: 'swipeable-wrapper' },
        props.children,
      )
    }),
  }
})

const mockShowNotification = vi.fn()
const mockHideNotification = vi.fn()
vi.mock('react-native-notifier', () => ({
  Notifier: {
    showNotification: (...args: unknown[]) => mockShowNotification(...args),
    hideNotification: (...args: unknown[]) => mockHideNotification(...args),
  },
}))

vi.mock('../../../../hooks/use-semantic-theme', () => ({
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

const mockSoftDeleteRun = vi.fn().mockResolvedValue({ scheduledDeletionId: 'sched_123' })
const mockUndoDeleteRun = vi.fn().mockResolvedValue(null)

const mockHookReturn = {
  data: undefined as { routes: Record<string, unknown>[] } | undefined,
  isLoading: true,
}

vi.mock('../../../../hooks/use-saved-routes', () => ({
  useSavedRoutesList: () => mockHookReturn,
  useSoftDeleteRoute: () => ({
    run: mockSoftDeleteRun,
    isRunning: false,
    error: null,
    resetError: vi.fn(),
  }),
  useUndoDeleteRoute: () => ({
    run: mockUndoDeleteRun,
    isRunning: false,
    error: null,
    resetError: vi.fn(),
  }),
}))

vi.mock('../../../../lib/notifier-helpers', () => ({
  showSuccessNotification: vi.fn(),
  showErrorNotification: vi.fn(),
}))

vi.mock('../../../../components/ui/saved-route-card', () => ({
  SavedRouteCard: 'SavedRouteCard',
}))
vi.mock('../../../../components/ui/saved-route-card.utils', () => ({
  formatDate: (ts: number) => new Date(ts).toLocaleDateString(),
}))
vi.mock('../../../../components/ui/skeleton', () => ({ Skeleton: 'Skeleton' }))
vi.mock('../../../../components/ui/empty-state', () => ({
  EmptyState: 'EmptyState',
}))
vi.mock('../../../../components/ui/route-search-bar', () => ({
  RouteSearchBar: 'RouteSearchBar',
}))
vi.mock('../../../../components/ui/date-range-picker', () => ({
  DateRangePicker: 'DateRangePicker',
}))
vi.mock('../../../../components/ui/delete-route-dialog', () => ({
  DeleteRouteDialog: 'DeleteRouteDialog',
}))

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

beforeEach(() => {
  vi.clearAllMocks()
  mockSwipeableInstances.length = 0
  mockHookReturn.data = undefined
  mockHookReturn.isLoading = true
})

// ---------------------------------------------------------------------------
// AC1: Swipe left reveals red delete area with trash icon
// ---------------------------------------------------------------------------
describe('AC1: Swipe reveals delete action', () => {
  it('should wrap each route card in a Swipeable with renderRightActions', () => {
    const routes = [
      makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' }),
      makeRoute({ savedRouteId: 'route-2', name: 'Evening Ride' }),
    ]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const renderItem = flatList.props.renderItem

    // Render first item
    let itemTree: renderer.ReactTestRenderer
    act(() => {
      itemTree = renderer.create(renderItem({ item: routes[0], index: 0 }))
    })

    // Should find a Swipeable wrapper
    const swipeables = itemTree!.root.findAllByProps({ testID: 'swipeable-wrapper' })
    expect(swipeables.length).toBe(1)

    // Should have renderRightActions prop
    expect(swipeables[0].props.renderRightActions).toBeDefined()
  })

  it('should render delete action with trash icon when renderRightActions is called', () => {
    const routes = [makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' })]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
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

    // Render the right actions
    let actionsTree: renderer.ReactTestRenderer
    act(() => {
      actionsTree = renderer.create(rightActions())
    })

    // Should have delete action button
    const deleteAction = actionsTree!.root.findByProps({ testID: 'swipe-delete-action' })
    expect(deleteAction).toBeDefined()

    // Should have trash icon
    const icon = actionsTree!.root.findByType(
      'MaterialCommunityIcons' as unknown as React.ComponentClass,
    )
    expect(icon.props.name).toBe('trash-can-outline')
  })
})

// ---------------------------------------------------------------------------
// AC2: Completing swipe or tapping delete area opens confirmation dialog
// ---------------------------------------------------------------------------
describe('AC2: Swipe/tap triggers delete confirmation dialog', () => {
  it('should open delete dialog when delete action is tapped', () => {
    const routes = [makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' })]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    // Initially dialog should not be visible
    const dialog = tree!.root.findByProps({ testID: 'swipe-delete-route-dialog' })
    expect(dialog.props.visible).toBe(false)

    // Render a list item and tap its delete action
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
    act(() => {
      deleteAction.props.onPress()
    })

    // After tapping delete action, dialog should be visible with the route name
    const updatedDialog = tree!.root.findByProps({ testID: 'swipe-delete-route-dialog' })
    expect(updatedDialog.props.visible).toBe(true)
    expect(updatedDialog.props.routeName).toBe('Morning Ride')
  })
})

// ---------------------------------------------------------------------------
// AC3: Confirming delete triggers soft-delete + undo toast
// ---------------------------------------------------------------------------
describe('AC3: Delete confirmation triggers soft-delete + undo toast', () => {
  it('should call softDelete.run and show undo notification on confirm', async () => {
    const routes = [makeRoute({ savedRouteId: 'route-1', name: 'Morning Ride' })]
    mockHookReturn.data = { routes }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    // Open the delete dialog by simulating swipe action tap
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
    act(() => {
      deleteAction.props.onPress()
    })

    // Now confirm the delete via dialog
    const dialog = tree!.root.findByProps({ testID: 'swipe-delete-route-dialog' })
    await act(async () => {
      await dialog.props.onConfirm()
    })

    // Should have called soft delete with the route id
    expect(mockSoftDeleteRun).toHaveBeenCalledWith({
      savedRouteId: 'route-1',
    })

    // Should have shown undo notification
    expect(mockShowNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Route deleted',
        description: 'Tap to undo.',
      }),
    )
  })
})

// ---------------------------------------------------------------------------
// AC5: Delete area uses semantic danger color and white icon
// ---------------------------------------------------------------------------
describe('AC5: Semantic theme tokens used for delete area', () => {
  it('should use danger color for background and white for icon', () => {
    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        React.createElement(SwipeableRouteCard, {
          onDelete: vi.fn(),
          children: React.createElement('View'),
        }),
      )
    })

    const swipeable = tree!.root.findByProps({ testID: 'swipeable-wrapper' })
    const rightActions = swipeable.props.renderRightActions

    let actionsTree: renderer.ReactTestRenderer
    act(() => {
      actionsTree = renderer.create(rightActions())
    })

    const deleteAction = actionsTree!.root.findByProps({ testID: 'swipe-delete-action' })

    // Background should use danger color (from mock: #EF4444)
    const bgStyle = deleteAction.props.style.find(
      (s: Record<string, unknown>) => s?.backgroundColor,
    )
    expect(bgStyle.backgroundColor).toBe('#EF4444')

    // Icon should use onSecondary (white from mock: #fff)
    const icon = actionsTree!.root.findByType(
      'MaterialCommunityIcons' as unknown as React.ComponentClass,
    )
    expect(icon.props.color).toBe('#fff')
  })
})
