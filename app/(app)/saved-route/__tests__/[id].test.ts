/**
 * Tests for Route Detail Screen (US-015)
 *
 * Acceptance Criteria:
 * - AC1: User taps saved route card -> detail screen shows MapView with route polyline,
 *         header with route name, stats (distance/duration/legs), weather badges
 * - AC2: Data loading -> loading indicator shown
 * - AC3: Route has wind but no rain/temp -> WindBadge shows, RainBadge/TempBadge show 'unavailable'
 * - AC4: Invalid savedRouteId -> 'Route not found' message with back navigation
 * - AC5: User presses back -> navigates back to saved routes list
 *
 * Testing Strategy:
 * - Pure function unit tests for utils (formatDistance, formatDuration, deriveWindSummary)
 * - Component rendering tests via react-test-renderer with mocked hooks
 * - Weather derivation logic testing for AC3
 */

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

import React from 'react'
import renderer, { act } from 'react-test-renderer'
import { afterEach, beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { buildRoutePolylines } from '../../../../components/map/route-polyline'
import {
  buildSaveRoutePayload,
  SaveRouteSheet,
} from '../../../../components/ui/save-favorite-sheet'
import type {
  RainOverlay,
  RouteOverlays,
  TemperatureOverlay,
  WindOverlay,
} from '../../../../shared/models/saved-routes'
import { getWorstRainLevel, getWorstTemperatureLevel } from '../../../../shared/models/saved-routes'
import type { SavedRouteDetailView } from '../../../../shared/types/routes'
import {
  deriveWindSummary,
  formatDistance,
  formatDuration,
  formatSavedDate,
} from '../../saved-route.utils/utils'
import SavedRouteDetailScreen from '../[id]'

const mockBack = vi.fn()
const mockPush = vi.fn()
const mockSaveRouteMutation = vi.fn()

const mockHookReturn: {
  data: import('../../../../shared/types/routes').SavedRouteDetailView | null | undefined
  isLoading: boolean
} = {
  data: undefined,
  isLoading: true,
}

vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Platform: {
    OS: 'ios',
    select: (values: Record<string, unknown>) => values.ios ?? values.default,
  },
  Pressable: 'Pressable',
  StyleSheet: { create: (s: Record<string, unknown>) => s },
  TextInput: 'TextInput',
  TurboModuleRegistry: {
    getEnforcing: () => ({}),
    get: () => null,
  },
  View: 'View',
}))
vi.mock('react-native-gesture-handler', () => ({
  ScrollView: 'ScrollView',
}))
vi.mock('react-native-paper', () => ({
  Provider: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  Text: 'Text',
}))
vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: 'SafeAreaView',
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}))
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'test-route-id' }),
  useRouter: () => ({ back: mockBack, push: mockPush }),
}))
vi.mock('../../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        background: { default: '#000' },
        primary: { default: '#00f' },
        onSurface: { default: '#fff', subtle: '#888' },
        surface: { default: '#111' },
        surfaceVariant: { default: '#222' },
        card: { default: '#222' },
      },
      space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32 },
      radius: { lg: 16, md: 8, sm: 4 },
      type: { title: { md: { fontSize: 20 } } },
    },
  }),
}))
vi.mock('../../../../hooks/use-saved-routes', () => ({
  useSavedRouteDetail: () => mockHookReturn,
}))
vi.mock('convex/react', () => ({
  useMutation: () => mockSaveRouteMutation,
}))
vi.mock('../../../../components/map/overlay-toggle', () => ({
  OverlayToggle: 'OverlayToggle',
}))
vi.mock('../../../../components/map/map-header-overlay', () => ({
  MapHeaderOverlay: 'MapHeaderOverlay',
}))
vi.mock('../../../../components/map', () => ({
  MapboxMapView: 'MapboxMapView',
}))
vi.mock('../../../../components/map/map-view', () => ({
  MapViewWrapper: 'MapViewWrapper',
}))
vi.mock('../../../../components/map/route-polyline', () => ({
  buildRoutePolylines: vi.fn(() => []),
}))
vi.mock('../../../../components/planning/wind-badge', () => ({
  WindBadge: 'WindBadge',
}))
vi.mock('../../../../components/ui/rain-badge', () => ({
  RainBadge: 'RainBadge',
}))
vi.mock('../../../../components/ui/route-leg-timeline', () => ({
  RouteLegTimeline: 'RouteLegTimeline',
}))
vi.mock('../../../../components/ui/stat-row', () => ({
  StatRow: 'StatRow',
}))
vi.mock('../../../../components/ui/temperature-badge', () => ({
  TemperatureBadge: 'TemperatureBadge',
}))
vi.mock('../../../../models/saved-routes', () => ({
  getWorstRainLevel: vi.fn((v) => (v ? 'light' : 'unavailable')),
  getWorstTemperatureLevel: vi.fn((v) => (v ? 'warm' : 'unavailable')),
  getMaxTemperatureFahrenheit: vi.fn(() => 72),
}))
vi.mock('@expo/vector-icons', () => ({
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}))
vi.mock('../../../../components/ui/icon-symbol', () => ({
  IconSymbol: 'IconSymbol',
}))
vi.mock('../../../../components/ui/button', () => ({
  Button: ({ children, ...props }: { children?: React.ReactNode } & Record<string, unknown>) =>
    React.createElement('Button', props, children),
}))
vi.mock('../../../../components/ui/bottom-action-sheet', () => ({
  BottomActionSheet: ({
    children,
    visible,
    ...props
  }: { children?: React.ReactNode; visible?: boolean } & Record<string, unknown>) =>
    visible ? React.createElement('BottomActionSheet', props, children) : null,
}))
vi.mock('../../../../components/ui/bottom-sheet-input', () => ({
  BottomSheetInput: (props: Record<string, unknown>) =>
    React.createElement('BottomSheetInput', props),
}))
vi.mock('../../../../components/ui/delete-route-dialog', () => ({
  DeleteRouteDialog: 'DeleteRouteDialog',
}))
vi.mock('../../../../components/ui/rename-route-dialog', () => ({
  RenameRouteDialog: 'RenameRouteDialog',
}))
vi.mock('../use-route-actions', () => ({
  useRouteActions: () => ({
    renameDialogVisible: false,
    deleteDialogVisible: false,
    openRenameDialog: vi.fn(),
    closeRenameDialog: vi.fn(),
    openDeleteDialog: vi.fn(),
    closeDeleteDialog: vi.fn(),
    handleRename: vi.fn(),
    handleDeleteConfirm: vi.fn(),
    renameRunning: false,
    deleteRunning: false,
  }),
}))

const mockBuildRoutePolylines = buildRoutePolylines as Mock

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const makeMinimalOverviewGeometry = () => ({
  format: 'polyline' as const,
  encoding: 'ascii',
  precision: 5,
  value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
})

const makeMinimalLeg = (index: number) => ({
  legIndex: index,
  start: { lat: 40.0, lng: -111.0 },
  end: { lat: 40.1, lng: -111.1 },
  distanceMeters: 5000,
  durationSeconds: 600,
  geometry: makeMinimalOverviewGeometry(),
})

const makeWindOverlay = (level: string): WindOverlay => ({
  generatedAt: Date.now(),
  modelVersion: '1.0',
  legend: [],
  byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 5000, level }] }],
})

const makeRainOverlay = (level: string): RainOverlay => ({
  generatedAt: Date.now(),
  modelVersion: '1.0',
  legend: [],
  byLeg: [{ legIndex: 0, segments: [{ startMeters: 0, endMeters: 5000, level }] }],
})

const makeTemperatureOverlay = (tempC: number): TemperatureOverlay => ({
  generatedAt: Date.now(),
  modelVersion: '1.0',
  legend: [],
  byLeg: [
    {
      legIndex: 0,
      segments: [{ startMeters: 0, endMeters: 5000, level: 'warm', temperatureCelsius: tempC }],
    },
  ],
})

const makeSavedRouteDetail = (
  overrides?: Partial<{
    overlays: RouteOverlays
    routeProvenance: SavedRouteDetailView['routeProvenance']
  }>,
): SavedRouteDetailView => ({
  savedRouteId: 'test-route-id',
  name: 'Morning Commute',
  planInput: {
    start: { lat: 40.0, lng: -111.0 },
    end: { lat: 40.1, lng: -111.1 },
    departureTime: Date.now(),
    preferences: { scenicBias: 'default' },
  },
  routeSnapshot: {
    provider: 'mapbox',
    bounds: { north: 40.2, south: 39.9, east: -110.9, west: -111.2 },
    origin: { lat: 40.0, lng: -111.0 },
    destination: { lat: 40.1, lng: -111.1 },
    waypoints: [],
    overviewGeometry: makeMinimalOverviewGeometry(),
    legs: [makeMinimalLeg(0), makeMinimalLeg(1)],
    annotations: [
      { id: 'a1', annotationKind: 'place', label: 'Scenic overlook', lat: 40.05, lng: -111.05 },
      { id: 'a2', annotationKind: 'condition', label: 'Low wind area', lat: 40.06, lng: -111.06 },
    ],
    overlays: overrides?.overlays ?? {
      wind: makeWindOverlay('moderate'),
      rain: makeRainOverlay('light'),
      temperature: makeTemperatureOverlay(22),
    },
  },
  routeIndex: {
    routeFingerprint: 'abc123',
    sampledPoints: [{ lat: 40.0, lng: -111.0, distanceFromStartMeters: 0 }],
  },
  snapshotMeta: {
    savedAt: new Date('2026-03-20T12:00:00Z').getTime(),
    routingProvider: 'mapbox',
    overlays: { wind: { generatedAt: Date.now(), modelVersion: '1.0' } },
    conditionsStatus: 'ok',
    metaVersion: 1,
  },
  capabilities: { canRead: true, canRename: true, canDelete: true },
  routeProvenance: overrides?.routeProvenance,
})

// ---------------------------------------------------------------------------
// AC1: Detail screen shows stats, weather, route data
// ---------------------------------------------------------------------------

describe('AC1: Route detail screen data rendering', () => {
  beforeEach(() => {
    mockSaveRouteMutation.mockReset()
    mockSaveRouteMutation.mockResolvedValue({ savedRouteId: 'saved-route-id' })
  })

  it('should compute total distance from legs', () => {
    const detail = makeSavedRouteDetail()
    const totalMeters = detail.routeSnapshot.legs.reduce((s, l) => s + l.distanceMeters, 0)
    expect(totalMeters).toBe(10000)
    expect(formatDistance(totalMeters)).toBe('6.2 mi')
  })

  it('should compute total duration from legs', () => {
    const detail = makeSavedRouteDetail()
    const totalSeconds = detail.routeSnapshot.legs.reduce((s, l) => s + l.durationSeconds, 0)
    expect(totalSeconds).toBe(1200)
    expect(formatDuration(totalSeconds)).toBe('20 min')
  })

  it('should count legs correctly', () => {
    const detail = makeSavedRouteDetail()
    expect(detail.routeSnapshot.legs.length).toBe(2)
  })

  it('should have route name accessible from data', () => {
    const detail = makeSavedRouteDetail()
    expect(detail.name).toBe('Morning Commute')
  })

  it('should expose annotations for highlights section', () => {
    const detail = makeSavedRouteDetail()
    expect(detail.routeSnapshot.annotations).toHaveLength(2)
    expect(detail.routeSnapshot.annotations[0].label).toBe('Scenic overlook')
  })

  it('AC-5: scenic byways detail renders provenance without new flow', async () => {
    mockHookReturn.data = makeSavedRouteDetail({
      routeProvenance: {
        sourceLabel: "America's Byways",
        designation: 'National Scenic Byway',
        description: 'Drive through high desert and forests.',
        sourceUrl: 'https://fhwaapps.fhwa.dot.gov/bywaysp/StateMaps/Show/byway/2059',
      },
    })
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    await act(async () => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })

    const provenance = tree!.root.findByProps({ testID: 'route-detail-provenance' })
    expect(provenance).toBeTruthy()
    expect(
      tree!.root.findByProps({ testID: 'route-detail-provenance-source-label' }).props.children,
    ).toBe("America's Byways")
    expect(
      tree!.root.findByProps({ testID: 'route-detail-provenance-designation' }).props.children,
    ).toBe('National Scenic Byway')
    expect(
      tree!.root.findByProps({ testID: 'route-detail-provenance-description' }).props.children,
    ).toBe('Drive through high desert and forests.')
  })

  it('AC-4: Rider Magazine provenance stays in the existing detail card', async () => {
    mockHookReturn.data = makeSavedRouteDetail({
      routeProvenance: {
        sourceLabel: 'Rider Magazine',
        designation: 'Rider Magazine 50 Best Motorcycle Roads in America',
        description:
          'This legendary road follows California’s rugged coastline and offers world-class scenery and epic riding.',
        sourceUrl:
          'https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-07-pacific-coast-highway',
      },
    })
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    await act(async () => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })

    expect(
      tree!.root.findByProps({ testID: 'route-detail-provenance-source-label' }).props.children,
    ).toBe('Rider Magazine')
    expect(
      tree!.root.findByProps({ testID: 'route-detail-provenance-designation' }).props.children,
    ).toBe('Rider Magazine 50 Best Motorcycle Roads in America')
    expect(
      tree!.root.findByProps({ testID: 'route-detail-provenance-description' }).props.children,
    ).toContain('rugged coastline')
    expect(JSON.stringify(tree!.toJSON())).not.toContain('ground_truth')
    expect(JSON.stringify(tree!.toJSON())).not.toContain('alphabetical_by_state_order')
  })

  it('AC-5: Rider Magazine partial editorial data omits empty provenance rows cleanly', async () => {
    mockHookReturn.data = makeSavedRouteDetail({
      routeProvenance: {
        sourceLabel: 'Rider Magazine',
        sourceUrl:
          'https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-50-beartooth-highway',
      },
    })
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    await act(async () => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })

    expect(
      tree!.root.findByProps({ testID: 'route-detail-provenance-source-label' }).props.children,
    ).toBe('Rider Magazine')
    expect(
      tree!.root.findAllByProps({ testID: 'route-detail-provenance-designation' }),
    ).toHaveLength(0)
    expect(
      tree!.root.findAllByProps({ testID: 'route-detail-provenance-description' }),
    ).toHaveLength(0)
  })

  it('AC-4: real save payload preserves Rider provenance into the saved-route contract', async () => {
    const detail = makeSavedRouteDetail()
    const routeData = {
      suggestedName: 'Pacific Coast Highway',
      planInput: detail.planInput,
      routeSnapshot: detail.routeSnapshot,
      routeIndex: detail.routeIndex,
      snapshotMeta: detail.snapshotMeta,
      routeProvenance: {
        sourceLabel: 'Rider Magazine',
        designation: 'Rider Magazine 50 Best Motorcycle Roads in America',
        description:
          'This legendary road follows California’s rugged coastline and offers world-class scenery and epic riding.',
        sourceUrl:
          'https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-07-pacific-coast-highway',
      },
    }

    const payload = buildSaveRoutePayload('Pacific Coast Highway', routeData)

    expect(payload.routeProvenance).toEqual({
      sourceLabel: 'Rider Magazine',
      designation: 'Rider Magazine 50 Best Motorcycle Roads in America',
      description:
        'This legendary road follows California’s rugged coastline and offers world-class scenery and epic riding.',
      sourceUrl:
        'https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-07-pacific-coast-highway',
    })

    let tree: renderer.ReactTestRenderer
    await act(async () => {
      tree = renderer.create(
        React.createElement(SaveRouteSheet, {
          visible: true,
          onClose: vi.fn(),
          routeData,
          onSuccess: vi.fn(),
        }),
      )
    })

    const nameInput = tree!.root.findByProps({ testID: 'save-route-name-input' })
    const saveButton = tree!.root.findByProps({ testID: 'save-route-save-button' })

    await act(async () => {
      nameInput.props.onChangeText('Pacific Coast Highway')
    })

    await act(async () => {
      await saveButton.props.onPress()
    })

    expect(mockSaveRouteMutation).toHaveBeenCalledWith({
      name: 'Pacific Coast Highway',
      planInput: detail.planInput,
      routeSnapshot: detail.routeSnapshot,
      routeIndex: detail.routeIndex,
      snapshotMeta: detail.snapshotMeta,
      routeProvenance: {
        sourceLabel: 'Rider Magazine',
        designation: 'Rider Magazine 50 Best Motorcycle Roads in America',
        description:
          'This legendary road follows California’s rugged coastline and offers world-class scenery and epic riding.',
        sourceUrl:
          'https://ridermagazine.com/2024/12/17/50-best-motorcycle-roads-in-america/#rider-mag-route-07-pacific-coast-highway',
      },
    })
  })

  it('should format saved date from snapshotMeta.savedAt', () => {
    const detail = makeSavedRouteDetail()
    const formatted = formatSavedDate(detail.snapshotMeta.savedAt)
    expect(formatted).toMatch(/Mar\s+20,\s+2026/)
  })
})

// ---------------------------------------------------------------------------
// AC2: Loading state renders loading indicator
// ---------------------------------------------------------------------------

describe('AC2: Loading state behavior', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should render loading indicator when data is undefined and isLoading is true', () => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    // The loading branch renders a SafeAreaView with testID="route-detail-loading"
    const loadingView = root.findByProps({ testID: 'route-detail-loading' })
    expect(loadingView).toBeDefined()

    // Should contain an ActivityIndicator
    const indicator = root.findByType('ActivityIndicator' as any)
    expect(indicator).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AC3: Wind present, rain/temp unavailable
// ---------------------------------------------------------------------------

describe('AC3: Partial weather data - wind only', () => {
  it('should derive wind summary from overlay data', () => {
    const windOverlay = makeWindOverlay('moderate')
    expect(deriveWindSummary(windOverlay)).toBe('moderate')
  })

  it('should show rain as unavailable when no rain overlay exists', () => {
    const rainSummary = getWorstRainLevel(undefined)
    expect(rainSummary).toBe('unavailable')
  })

  it('should show temperature as unavailable when no temp overlay exists', () => {
    const tempSummary = getWorstTemperatureLevel(undefined)
    expect(tempSummary).toBe('unavailable')
  })

  it('should handle all three badges correctly for wind-only route', () => {
    const overlays: RouteOverlays = {
      wind: makeWindOverlay('high'),
      // rain and temperature are undefined
    }

    const wind = deriveWindSummary(overlays.wind)
    const rain = getWorstRainLevel(overlays.rain)
    const temp = getWorstTemperatureLevel(overlays.temperature)

    expect(wind).toBe('high')
    expect(rain).toBe('unavailable')
    expect(temp).toBe('unavailable')
  })

  it('should derive worst wind level across multiple segments', () => {
    const overlay: WindOverlay = {
      generatedAt: Date.now(),
      modelVersion: '1.0',
      legend: [],
      byLeg: [
        {
          legIndex: 0,
          segments: [
            { startMeters: 0, endMeters: 2500, level: 'low' },
            { startMeters: 2500, endMeters: 5000, level: 'high' },
          ],
        },
      ],
    }
    expect(deriveWindSummary(overlay)).toBe('high')
  })

  it('should return unavailable for empty wind overlay', () => {
    expect(deriveWindSummary(undefined)).toBe('unavailable')
    expect(deriveWindSummary({ generatedAt: 0, modelVersion: '1.0', legend: [], byLeg: [] })).toBe(
      'unavailable',
    )
  })
})

// ---------------------------------------------------------------------------
// AC4: Invalid savedRouteId renders not-found state
// ---------------------------------------------------------------------------

describe('AC4: Route not found', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should render not-found state when data is null and isLoading is false', () => {
    mockHookReturn.data = null
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    // The not-found branch renders a SafeAreaView with testID="route-detail-not-found"
    const notFoundView = root.findByProps({ testID: 'route-detail-not-found' })
    expect(notFoundView).toBeDefined()

    // Should display the "Route not found" message
    const message = root.findByProps({ testID: 'route-not-found-message' })
    expect(message).toBeDefined()
  })

  it('should render back button in not-found state for navigation', () => {
    mockHookReturn.data = null
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    // MapHeaderOverlay should have a leftAction with the back testID
    const header = root.findByProps({ testID: 'route-detail-not-found-back' })
    expect(header).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// AC5: Back navigation wired to router.back()
// ---------------------------------------------------------------------------

describe('AC5: Back navigation', () => {
  beforeEach(() => {
    mockBack.mockClear()
    mockPush.mockClear()
  })

  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should wire back button onPress to router.push(backTo) in not-found state', () => {
    mockHookReturn.data = null
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    // SubpageLayout renders the back button with testID `${testID}-back`
    const backButton = root.findByProps({ testID: 'route-detail-not-found-back' })
    backButton.props.onPress()

    expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)')
  })

  it('should wire back button onPress to router.push(backTo) in detail state', () => {
    mockHookReturn.data = makeSavedRouteDetail()
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    const backButton = root.findByProps({ testID: 'route-detail-screen-back' })
    backButton.props.onPress()

    expect(mockPush).toHaveBeenCalledWith('/(app)/(tabs)')
  })
})

// ---------------------------------------------------------------------------
// Utility function tests
// ---------------------------------------------------------------------------

describe('formatDistance', () => {
  it('should format meters to miles', () => {
    expect(formatDistance(1609.344)).toBe('1.0 mi')
    expect(formatDistance(8046.72)).toBe('5.0 mi')
  })

  it('should show raw meters for very short distances', () => {
    expect(formatDistance(50)).toBe('50m')
    expect(formatDistance(0)).toBe('0m')
  })
})

describe('formatDuration', () => {
  it('should format minutes only for less than one hour', () => {
    expect(formatDuration(300)).toBe('5 min')
    expect(formatDuration(1800)).toBe('30 min')
  })

  it('should format hours and minutes', () => {
    expect(formatDuration(3600)).toBe('1h 0m')
    expect(formatDuration(5400)).toBe('1h 30m')
  })
})

describe('formatSavedDate', () => {
  it('should format timestamp to readable date', () => {
    const ts = new Date('2026-01-15T12:00:00').getTime()
    expect(formatSavedDate(ts)).toMatch(/Jan\s+15,\s+2026/)
  })
})

// ---------------------------------------------------------------------------
// US-016: Overlay toggle on route detail map
// ---------------------------------------------------------------------------

describe('US-016 AC1: OverlayToggle renders with availability when route has overlay data', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should render OverlayToggle when route has wind and rain data', () => {
    mockHookReturn.data = makeSavedRouteDetail()
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    const toggle = root.findByProps({ testID: 'overlay-toggle' })
    expect(toggle).toBeDefined()
    expect(toggle.props.availability).toEqual({
      wind: true,
      rain: true,
      temperature: true,
    })
  })

  it('should pass onValueChange callback to OverlayToggle', () => {
    mockHookReturn.data = makeSavedRouteDetail()
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    const toggle = root.findByProps({ testID: 'overlay-toggle' })
    expect(typeof toggle.props.onValueChange).toBe('function')
  })

  it('should call buildRoutePolylines with showRainOverlay:true when rain overlay is selected', () => {
    mockHookReturn.data = makeSavedRouteDetail()
    mockHookReturn.isLoading = false
    mockBuildRoutePolylines.mockClear()

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    // Select rain overlay
    const toggle = root.findByProps({ testID: 'overlay-toggle' })
    act(() => {
      toggle.props.onValueChange('rain')
    })

    // Verify buildRoutePolylines was called with showRainOverlay: true
    const lastCall =
      mockBuildRoutePolylines.mock.calls[mockBuildRoutePolylines.mock.calls.length - 1][0]
    expect(lastCall).toEqual(expect.objectContaining({ showRainOverlay: true }))
  })

  it('should default to no overlay selected (empty string)', () => {
    mockHookReturn.data = makeSavedRouteDetail()
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    const toggle = root.findByProps({ testID: 'overlay-toggle' })
    expect(toggle.props.value).toBe('')
  })
})

describe('US-016 AC2: Rain toggle disabled when no rain data', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should show rain as unavailable when route has wind but no rain', () => {
    const windOnlyOverlays: RouteOverlays = {
      wind: makeWindOverlay('moderate'),
      // rain and temperature are undefined
    }
    mockHookReturn.data = makeSavedRouteDetail({ overlays: windOnlyOverlays })
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    const toggle = root.findByProps({ testID: 'overlay-toggle' })
    expect(toggle.props.availability).toEqual({
      wind: true,
      rain: false,
      temperature: false,
    })
  })
})

describe('US-016 AC3: Deselecting overlay reverts polyline to default', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should allow deselecting overlay by calling onValueChange with empty string', () => {
    mockHookReturn.data = makeSavedRouteDetail()
    mockHookReturn.isLoading = false
    mockBuildRoutePolylines.mockClear()

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    const toggle = root.findByProps({ testID: 'overlay-toggle' })

    // Select wind
    act(() => {
      toggle.props.onValueChange('wind')
    })

    const toggleAfterSelect = root.findByProps({ testID: 'overlay-toggle' })
    expect(toggleAfterSelect.props.value).toBe('wind')

    // Deselect
    mockBuildRoutePolylines.mockClear()
    act(() => {
      toggleAfterSelect.props.onValueChange('')
    })

    const toggleAfterDeselect = root.findByProps({ testID: 'overlay-toggle' })
    expect(toggleAfterDeselect.props.value).toBe('')

    // Verify buildRoutePolylines was called with all overlay flags false
    const lastCall =
      mockBuildRoutePolylines.mock.calls[mockBuildRoutePolylines.mock.calls.length - 1][0]
    expect(lastCall).toEqual(
      expect.objectContaining({
        showWindOverlay: false,
        showRainOverlay: false,
        showTemperatureOverlay: false,
      }),
    )
  })
})

describe('US-016 AC4: OverlayToggle hidden when no overlay data', () => {
  afterEach(() => {
    mockHookReturn.data = undefined
    mockHookReturn.isLoading = true
  })

  it('should not render OverlayToggle when route has no overlay data', () => {
    const noOverlays: RouteOverlays = {
      // all undefined
    }
    mockHookReturn.data = makeSavedRouteDetail({ overlays: noOverlays })
    mockHookReturn.isLoading = false

    let tree: renderer.ReactTestRenderer
    act(() => {
      tree = renderer.create(React.createElement(SavedRouteDetailScreen))
    })
    const root = tree!.root

    const toggles = root.findAllByProps({ testID: 'overlay-toggle' })
    expect(toggles).toHaveLength(0)
  })

  it('should not crash when rendering with no overlay data', () => {
    const noOverlays: RouteOverlays = {}
    mockHookReturn.data = makeSavedRouteDetail({ overlays: noOverlays })
    mockHookReturn.isLoading = false

    expect(() => {
      act(() => {
        renderer.create(React.createElement(SavedRouteDetailScreen))
      })
    }).not.toThrow()
  })
})
