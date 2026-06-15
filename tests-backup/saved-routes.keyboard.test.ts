/**
 * Tests for saved-routes keyboard handling (US-033)
 *
 * Acceptance Criteria:
 * - AC1: FlatList has keyboardShouldPersistTaps="handled"
 * - AC2: Tapping a route card while keyboard is visible navigates on first tap
 * - AC3: Scrolling list dismisses keyboard (default FlatList behavior)
 * - AC4: No regression when keyboard is not visible
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { afterEach, describe, expect, it, vi } from 'vitest'
import SavedRoutesScreen from '../saved-routes'

const mockPush = vi.fn()

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
}))
vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))
vi.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))
vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
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
        title: { lg: { fontSize: 24, lineHeight: 32, fontWeight: '700' } },
        body: { md: { fontSize: 14, lineHeight: 20 }, sm: { fontSize: 12, lineHeight: 16 } },
        label: { sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' } },
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
vi.mock('../../../../hooks/use-saved-routes', () => ({
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
vi.mock('../../../../lib/notifier-helpers', () => ({
  showSuccessNotification: vi.fn(),
  showErrorNotification: vi.fn(),
}))

// ---------------------------------------------------------------------------
// AC1 + AC3: FlatList has keyboardShouldPersistTaps="handled"
// ---------------------------------------------------------------------------
describe('US-033: keyboardShouldPersistTaps on FlatList', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should have keyboardShouldPersistTaps="handled" on the FlatList', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    expect(flatList.props.keyboardShouldPersistTaps).toBe('handled')
  })

  it('should NOT use keyboardShouldPersistTaps="always"', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    expect(flatList.props.keyboardShouldPersistTaps).not.toBe('always')
  })
})
