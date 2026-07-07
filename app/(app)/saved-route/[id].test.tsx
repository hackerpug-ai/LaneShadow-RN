/**
 * SAVE-001 / AC-3: saved-route/[id] reopen path for curated bookmarks.
 *
 * GIVEN a saved_routes row with curatedRouteRef (curated bookmark),
 * WHEN the user opens /(app)/saved-route/[id],
 * THEN the screen redirects to /(app)/curated-route/{routeId} (which
 *      dereferences via getCuratedRouteDetail) and does NOT read planInput /
 *      routeSnapshot / routeIndex (no legs/PlanInput error).
 *
 * jsdom-testable: mocks the saved-route detail hook + heavy map/timeline modules.
 * Live reopen runs in PHASE 3.5 Maestro.
 */

/* eslint-disable @typescript-eslint/no-require-imports */

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockReplace = vi.fn()
const mockPush = vi.fn()
const mockBack = vi.fn()

// Configurable saved-route detail return.
let mockDetail: { data: unknown; isLoading: boolean } = {
  data: undefined,
  isLoading: false,
}

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: mockParamsId }),
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack }),
}))
let mockParamsId = 'sr-1'

vi.mock('../../../hooks/use-saved-routes', () => ({
  useSavedRouteDetail: () => mockDetail,
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        card: { default: '#000' },
        background: { default: '#000' },
        onSurface: { default: '#fff', muted: '#888', subtle: '#aaa' },
        primary: { default: '#000' },
        surfaceVariant: { default: '#111' },
        danger: { default: '#a00' },
        onSecondary: { default: '#fff' },
      },
      space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '4xl': 64 },
      radius: { lg: 16, md: 8 },
      type: {
        title: { lg: { fontSize: 24 } },
        body: { sm: { fontSize: 13 }, medium: { fontSize: 14 }, small: { fontSize: 12 } },
        label: { sm: { fontSize: 12 }, medium: { fontSize: 13 } },
      },
    },
  }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false }),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0 }),
}))

// The screen imports ScrollView from react-native-gesture-handler; the shared
// vitest stub doesn't export it, so provide a host-string stand-in.
vi.mock('react-native-gesture-handler', () => ({
  ScrollView: 'RNGHScrollView',
}))

vi.mock('./use-route-actions', () => ({
  useRouteActions: () => ({
    renameDialogVisible: false,
    deleteDialogVisible: false,
    openRenameDialog: vi.fn(),
    openDeleteDialog: vi.fn(),
    handleRename: vi.fn(),
    handleDeleteConfirm: vi.fn(),
    closeRenameDialog: vi.fn(),
    closeDeleteDialog: vi.fn(),
  }),
}))

// Stub the heavy modules that read planned-route data — these MUST NOT render
// for a curated row (if they do, planInput access would throw).
vi.mock('../../../components/map', () => ({
  MapboxMapView: 'MapboxMapView',
}))
vi.mock('../../../components/layouts/subpage-layout', () => ({
  SubpageLayout: 'SubpageLayout',
}))
vi.mock('../../../components/map/overlay-toggle', () => ({
  OverlayToggle: 'OverlayToggle',
}))
vi.mock('../../../components/map/route-polyline', () => ({
  buildRoutePolylines: vi.fn(() => []),
}))
vi.mock('../../../components/ui/button', () => ({ Button: 'Button' }))
vi.mock('../../../components/ui/delete-route-dialog', () => ({
  DeleteRouteDialog: 'DeleteRouteDialog',
}))
vi.mock('../../../components/ui/icon-symbol', () => ({ IconSymbol: 'IconSymbol' }))
vi.mock('../../../components/ui/rename-route-dialog', () => ({
  RenameRouteDialog: 'RenameRouteDialog',
}))
vi.mock('../../../components/ui/route-leg-timeline', () => ({
  RouteLegTimeline: 'RouteLegTimeline',
}))
vi.mock('../../../components/ui/stat-row', () => ({ StatRow: 'StatRow' }))
vi.mock('../saved-route.utils/utils', () => ({
  formatDistance: (m: number) => `${m}m`,
  formatDuration: (s: number) => `${s}s`,
  formatSavedDate: (t: number) => String(t),
}))

import SavedRouteDetailScreen, { getSavedRouteReopenTarget } from './[id]'

describe('SAVE-001 / AC-3: reopen pure helper — getSavedRouteReopenTarget', () => {
  it('returns curated target when curatedRouteRef is present', () => {
    const target = getSavedRouteReopenTarget({
      curatedRouteRef: 'wasatch-ridge-traverse',
      name: 'Wasatch Ridge Loop',
    } as never)
    expect(target).toEqual({ kind: 'curated', routeId: 'wasatch-ridge-traverse' })
  })

  it('returns planned target when planInput is present (no curatedRouteRef)', () => {
    const target = getSavedRouteReopenTarget({
      planInput: { start: { lat: 0, lng: 0 } },
      routeSnapshot: { legs: [] },
    } as never)
    expect(target.kind).toBe('planned')
  })

  it('returns none target for null/empty data', () => {
    expect(getSavedRouteReopenTarget(null).kind).toBe('none')
    expect(getSavedRouteReopenTarget(undefined).kind).toBe('none')
  })
})

describe('SAVE-001 / AC-3: saved-route/[id] redirects curated rows', () => {
  beforeEach(() => {
    mockReplace.mockClear()
    mockPush.mockClear()
    mockBack.mockClear()
    mockParamsId = 'sr-curated-1'
  })

  it('redirects to /(app)/curated-route/{routeId} when the saved row has curatedRouteRef', () => {
    mockDetail = {
      data: {
        savedRouteId: 'sr-curated-1',
        name: 'Wasatch Ridge Loop',
        curatedRouteRef: 'wasatch-ridge-traverse',
      },
      isLoading: false,
    }

    act(() => {
      renderer.create(React.createElement(SavedRouteDetailScreen))
    })

    // ── must observe: redirect to the curated detail screen ──
    expect(mockReplace).toHaveBeenCalledWith('/(app)/curated-route/wasatch-ridge-traverse')
  })

  it('does NOT render the planned-path map/legs for a curated row (no planInput read)', () => {
    mockDetail = {
      data: {
        savedRouteId: 'sr-curated-1',
        name: 'Wasatch Ridge Loop',
        curatedRouteRef: 'wasatch-ridge-traverse',
        // Deliberately NO planInput/routeSnapshot/routeIndex — accessing them would throw.
      },
      isLoading: false,
    }

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })

    // The planned-path map screen must NOT be rendered (it reads data.routeSnapshot).
    const mapNodes = tree!.root.findAllByType('MapboxMapView' as never)
    expect(mapNodes, 'curated row must NOT enter the planned map path').toHaveLength(0)
    const legNodes = tree!.root.findAllByType('RouteLegTimeline' as never)
    expect(legNodes, 'curated row must NOT render planned legs').toHaveLength(0)
  })

  it('keeps the planned path for a planned saved row (no redirect)', () => {
    mockParamsId = 'sr-planned-1'
    mockDetail = {
      data: {
        savedRouteId: 'sr-planned-1',
        name: 'Morning Commute',
        planInput: { start: { lat: 0, lng: 0, label: 'A' }, end: { lat: 1, lng: 1, label: 'B' } },
        routeSnapshot: {
          bounds: { north: 1, south: 0, east: 1, west: 0 },
          legs: [{ distanceMeters: 1000, durationSeconds: 60 }],
          annotations: [],
          overlays: {},
          overviewGeometry: { value: 'abc' },
        },
        routeIndex: { routeFingerprint: 'fp', sampledPoints: [] },
        snapshotMeta: { savedAt: 1 },
      },
      isLoading: false,
    }

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })

    // Planned row → NO curated redirect
    expect(mockReplace).not.toHaveBeenCalled()
    // Planned map path IS rendered
    const mapNodes = tree!.root.findAllByType('MapboxMapView' as never)
    expect(mapNodes.length).toBeGreaterThan(0)
  })
})
