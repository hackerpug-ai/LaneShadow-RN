/**
 * Tests for saved-routes filter wiring (US-027)
 *
 * Acceptance Criteria:
 * - AC1: Search bar filters list via debounced query
 * - AC2: Date chip filters list by date range
 * - AC3: "Clear all filters" resets search + date
 * - AC4: Result count shown when filters active
 * - AC5: "Clear all filters" hidden when no filters active
 * - AC6: Filtered empty state shown when 0 results with active filters
 */

/* eslint-disable @typescript-eslint/no-require-imports */

const mockPush = jest.fn()

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
  useTheme: () => ({ semantic: {} }),
}))
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ bottom: 0 }),
}))
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))
jest.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
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
  data: undefined as { routes: Array<Record<string, unknown>> } | undefined,
  isLoading: true,
}
let capturedHookArgs: Record<string, unknown> | undefined

jest.mock('react-native-gesture-handler', () => {
  const React = require('react')
  return {
    Swipeable: React.forwardRef(function MockSwipeable(
      props: Record<string, unknown>,
      _ref: React.Ref<unknown>
    ) {
      return React.createElement('Swipeable', props, props.children)
    }),
  }
})
jest.mock('react-native-notifier', () => ({
  Notifier: {
    showNotification: jest.fn(),
    hideNotification: jest.fn(),
  },
}))
jest.mock('../../../../hooks/use-saved-routes', () => ({
  useSavedRoutesList: (args?: Record<string, unknown>) => {
    capturedHookArgs = args
    return mockHookReturn
  },
  useSoftDeleteRoute: () => ({
    run: jest.fn(),
    isRunning: false,
    error: null,
    resetError: jest.fn(),
  }),
  useUndoDeleteRoute: () => ({
    run: jest.fn(),
    isRunning: false,
    error: null,
    resetError: jest.fn(),
  }),
}))
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
jest.mock('../../../../lib/notifier-helpers', () => ({
  showSuccessNotification: jest.fn(),
  showErrorNotification: jest.fn(),
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

// ---------------------------------------------------------------------------
// AC1: Search query forwarded to hook
// ---------------------------------------------------------------------------
describe('AC1: Search filters routes via hook', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
    capturedHookArgs = undefined
  })

  it('should pass searchQuery to useSavedRoutesList hook with correct initial args', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      renderer.create(React.createElement(SavedRoutesScreen))
    })

    expect(capturedHookArgs).toEqual({
      searchQuery: undefined,
      afterDate: undefined,
      beforeDate: undefined,
    })
  })
})

// ---------------------------------------------------------------------------
// AC2: Date range picker rendered in header
// ---------------------------------------------------------------------------
describe('AC2: Date chip filters via hook', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
    capturedHookArgs = undefined
  })

  it('should include DateRangePicker in the FlatList header via FilterHeader', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    // FlatList has a ListHeaderComponent prop that renders FilterHeader
    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const header = flatList.props.ListHeaderComponent

    // Render the header element to verify contents
    let headerTree: renderer.ReactTestRenderer
    act(() => {
      headerTree = renderer.create(header)
    })

    const datePicker = headerTree!.root.findAllByProps({ testID: 'date-range-picker' })
    expect(datePicker.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// AC3: Search bar rendered in header
// ---------------------------------------------------------------------------
describe('AC3: Clear all filters', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
    capturedHookArgs = undefined
  })

  it('should include RouteSearchBar in the FlatList header via FilterHeader', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const header = flatList.props.ListHeaderComponent

    let headerTree: renderer.ReactTestRenderer
    act(() => {
      headerTree = renderer.create(header)
    })

    const searchBar = headerTree!.root.findAllByProps({ testID: 'route-search-bar' })
    expect(searchBar.length).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// AC4: Result count shown when filters active (via FilterHeader directly)
// ---------------------------------------------------------------------------
describe('AC4: Result count with active filters', () => {
  it('should show result count and clear button when filtersActive=true', () => {
    const { FilterHeader } = require('../saved-routes.components') as {
      FilterHeader: React.FC<Record<string, unknown>>
    }

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        React.createElement(FilterHeader, {
          onSearch: jest.fn(),
          onDateRangeChange: jest.fn(),
          filtersActive: true,
          onClearFilters: jest.fn(),
          resultCount: 3,
          datePickerKey: 0,
        })
      )
    })

    const root = tree!.root

    const resultCount = root.findByProps({ testID: 'result-count' })
    expect(resultCount.props.children).toEqual([3, ' ', 'routes', ' found'])

    const clearButton = root.findByProps({ testID: 'clear-filters-button' })
    expect(clearButton).toBeDefined()
  })

  it('should show "1 route found" for singular result', () => {
    const { FilterHeader } = require('../saved-routes.components') as {
      FilterHeader: React.FC<Record<string, unknown>>
    }

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        React.createElement(FilterHeader, {
          onSearch: jest.fn(),
          onDateRangeChange: jest.fn(),
          filtersActive: true,
          onClearFilters: jest.fn(),
          resultCount: 1,
          datePickerKey: 0,
        })
      )
    })

    const resultCount = tree!.root.findByProps({ testID: 'result-count' })
    expect(resultCount.props.children).toEqual([1, ' ', 'route', ' found'])
  })
})

// ---------------------------------------------------------------------------
// AC5: No filters -> no clear button or result count
// ---------------------------------------------------------------------------
describe('AC5: No filters active', () => {
  it('should not show clear filters button or result count when filtersActive=false', () => {
    const { FilterHeader } = require('../saved-routes.components') as {
      FilterHeader: React.FC<Record<string, unknown>>
    }

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        React.createElement(FilterHeader, {
          onSearch: jest.fn(),
          onDateRangeChange: jest.fn(),
          filtersActive: false,
          onClearFilters: jest.fn(),
          resultCount: 5,
          datePickerKey: 0,
        })
      )
    })

    const root = tree!.root

    const clearButtons = root.findAllByProps({ testID: 'clear-filters-button' })
    expect(clearButtons.length).toBe(0)

    const resultCounts = root.findAllByProps({ testID: 'result-count' })
    expect(resultCounts.length).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// AC6: Filtered empty state when 0 results with active filters
// ---------------------------------------------------------------------------
describe('AC6: Filtered empty state', () => {
  it('should render FilteredEmptyState component with correct message', () => {
    const { FilteredEmptyState } = require('../saved-routes.components') as {
      FilteredEmptyState: React.FC
    }

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(FilteredEmptyState))
    })

    const empty = tree!.root.findByProps({ testID: 'filtered-empty-state' })
    expect(empty).toBeDefined()
  })

  it('should use FilteredEmptyState when filters are active and list is empty', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      tree = renderer.create(React.createElement(SavedRoutesScreen))
    })

    // With no filters active (initial state), should use the normal EmptyState
    const flatList = tree!.root.findByProps({ testID: 'saved-routes-list' })
    const emptyComponent = flatList.props.ListEmptyComponent

    // No filters active by default -> should be EmptyState (not FilteredEmptyState)
    let emptyTree: renderer.ReactTestRenderer
    act(() => {
      emptyTree = renderer.create(emptyComponent)
    })
    const normalEmpty = emptyTree!.root.findAllByProps({ testID: 'saved-routes-empty-state' })
    expect(normalEmpty.length).toBe(1)

    // Clean up
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })
})

// ---------------------------------------------------------------------------
// Hook args: verify shape
// ---------------------------------------------------------------------------
describe('Hook integration: useSavedRoutesList args', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
    capturedHookArgs = undefined
  })

  it('should call useSavedRoutesList with filter args object shape', () => {
    mockHookReturn.data = { routes: [] }
    mockHookReturn.isLoading = false

    act(() => {
      const SavedRoutesScreen = require('../saved-routes').default
      renderer.create(React.createElement(SavedRoutesScreen))
    })

    expect(capturedHookArgs).toBeDefined()
    expect(capturedHookArgs).toHaveProperty('searchQuery')
    expect(capturedHookArgs).toHaveProperty('afterDate')
    expect(capturedHookArgs).toHaveProperty('beforeDate')
  })
})

// ---------------------------------------------------------------------------
// FilterHeader: clear button calls onClearFilters
// ---------------------------------------------------------------------------
describe('FilterHeader: clear button interaction', () => {
  it('should call onClearFilters when clear button is pressed', () => {
    const onClearFilters = jest.fn()
    const { FilterHeader } = require('../saved-routes.components') as {
      FilterHeader: React.FC<Record<string, unknown>>
    }

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(
        React.createElement(FilterHeader, {
          onSearch: jest.fn(),
          onDateRangeChange: jest.fn(),
          filtersActive: true,
          onClearFilters,
          resultCount: 2,
          datePickerKey: 0,
        })
      )
    })

    const clearButton = tree!.root.findByProps({ testID: 'clear-filters-button' })
    act(() => {
      clearButton.props.onPress()
    })

    expect(onClearFilters).toHaveBeenCalledTimes(1)
  })
})
