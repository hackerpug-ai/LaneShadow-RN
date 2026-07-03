/**
 * REDHAT-FIX-003 / DISC-020 Integration Tests: Curated card score %, re-render→map, centroid fallback
 *
 * Three scenario-backed integration tests closing the DISC-020 HIGH finding.
 *
 * Tests 1–2 render the REAL `RoutingCard` component in its `completed` branch,
 * which renders the REAL `CuratedRouteCard` when an option carries
 * `scores.composite`. Only Convex (useQuery), the selected-route context,
 * react-native-reanimated, and the sibling RouteAttachmentCard are mocked.
 *
 * Test 3 renders the REAL plan-view screen (`app/(app)/(tabs)/index.tsx`) with
 * a centroid-only curated route active, exercising the REAL `doFit` centroid
 * fallback → `setCameraPosition` zoom 12. The screen's native map boundary,
 * Convex/network hooks, and unrelated UI are mocked (same harness as the
 * index.*.integration tests).
 *
 * AC-4 (curatedCardShowsScoreAsPercentOnZeroToOneScale + earlierCuratedCardReRendersAndReturnsToMap + centroidOnlyCuratedPlotsViaFallback):
 *   - compositeScore 0.82 renders as the normalised percentage text `82/100`
 *     (Math.round(0.82*100) === 82) — NOT the raw decimal `0.82`, NOT `0/100`
 *   - pressing an earlier curated card calls setSelectedRouteId +
 *     setDisplayedRoutePlanId and the onViewOnMap handler (the chatMode→map flip)
 *   - a centroid-only curated route frames via the doFit fallback at zoom 12
 *
 * NOTE on score format: the production CuratedRouteCard renders the score as
 * `${Math.round(compositeScore * 100)}/100` (e.g. `82/100`), not the literal
 * `82%` quoted in the parent AC text. The behaviour under test — that a 0..1
 * composite is normalised via Math.round(x*100) and never shown as the raw
 * decimal or as 0 for a non-zero route — is what these assertions verify
 * against the real component contract. (Test-only task; no source changes.)
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// ---------------------------------------------------------------------------
// Mock: react-native — extend the global harness mock with the reduce-motion
// API RoutingCard reads on mount.
// ---------------------------------------------------------------------------

vi.mock('react-native', async (importOriginal) => {
  const actual = await importOriginal<any>()
  return {
    ...actual,
    AccessibilityInfo: {
      ...actual.AccessibilityInfo,
      isReduceMotionEnabled: () => Promise.resolve(false),
    },
  }
})

vi.mock('react-native-reanimated', () => {
  const { View } = require('react-native')
  const { createElement } = require('react')
  const AnimatedView = (props: Record<string, unknown>) => createElement(View, props)
  return {
    __esModule: true,
    default: { View: AnimatedView },
    useSharedValue: (initial: unknown) => ({ value: initial }),
    useAnimatedStyle: () => ({}),
    withRepeat: (_a: unknown) => undefined,
    withSequence: (..._args: unknown[]) => undefined,
    withTiming: (_val: unknown) => undefined,
    FadeIn: { duration: () => undefined },
    FadeOut: { duration: () => undefined },
    FadeInDown: { duration: () => ({ springify: () => undefined }) },
  }
})

// ---------------------------------------------------------------------------
// Mock: react-native-paper — spread the global harness mock and add the Icon
// export the global mock omits (CuratedRouteCard renders <Icon source=… />).
// ---------------------------------------------------------------------------

vi.mock('react-native-paper', async (importOriginal) => {
  const original = await importOriginal<any>()
  return {
    ...original,
    Icon: (props: any) => createElement('View', { testID: `paper-icon-${props.source}` }),
  }
})

// ---------------------------------------------------------------------------
// Mock: Convex / network boundary
// ---------------------------------------------------------------------------

// Declared via vi.hoisted so the mock factories below can reference them at
// factory-eval time (the RoutingCard static import triggers these factories
// before top-level `const` declarations would normally initialise).
const spies = vi.hoisted(() => ({
  mockUseQuery: vi.fn(),
  mockUseMutation: vi.fn(),
}))
const mockUseQuery = spies.mockUseQuery
const mockUseMutation = spies.mockUseMutation

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useMutation: (...args: unknown[]) => mockUseMutation(...args),
}))

vi.mock('expo-router', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSegments: () => ['app', 'tabs', 'index'],
  useLocalSearchParams: () => ({}),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: (p: any) => p.children,
}))

vi.mock('@clerk/clerk-expo', () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
}))

vi.mock('expo-haptics', () => ({
  impactAsync: vi.fn(),
  ImpactFeedbackStyle: { Medium: 'Medium' },
}))

vi.mock('@rnmapbox/maps', () => {
  const { createElement } = require('react')
  return {
    ShapeSource: (props: any) => createElement('View', { testID: props.testID }, props.children),
    LineLayer: () => null,
  }
})

// ---------------------------------------------------------------------------
// Mock: selected-route context — spies are observable across both render targets.
// Hoisted so the factory (invoked during RoutingCard's static import) can resolve them.
// ---------------------------------------------------------------------------

const routeSpies = vi.hoisted(() => ({
  mockSetSelectedRouteId: vi.fn(),
  mockSetDisplayedRoutePlanId: vi.fn(),
  mockRequestFitToRouteWithReset: vi.fn(),
  mockRegisterFitHandler: vi.fn(),
}))
const mockSetSelectedRouteId = routeSpies.mockSetSelectedRouteId
const mockSetDisplayedRoutePlanId = routeSpies.mockSetDisplayedRoutePlanId
const mockRequestFitToRouteWithReset = routeSpies.mockRequestFitToRouteWithReset

const mockFitToCoordinates = vi.fn()
const mockSetCameraPosition = vi.fn()
const mockMapRef = {
  current: {
    fitToCoordinates: mockFitToCoordinates,
    setCameraPosition: mockSetCameraPosition,
    recenterToUser: vi.fn(),
    zoomBy: vi.fn(),
  },
}

vi.mock('../../../contexts/selected-route', () => ({
  useSelectedRoute: () => ({
    selectedRouteId: null,
    setSelectedRouteId: routeSpies.mockSetSelectedRouteId,
    displayedRoutePlanId: null,
    setDisplayedRoutePlanId: routeSpies.mockSetDisplayedRoutePlanId,
    requestFitToRoute: vi.fn(),
    requestFitToRouteWithReset: routeSpies.mockRequestFitToRouteWithReset,
    registerFitHandler: routeSpies.mockRegisterFitHandler,
  }),
}))

vi.mock('../../../contexts/search-results', () => ({
  useSearchResults: () => ({
    results: [],
    selectedResultId: null,
    setSelectedResultId: vi.fn(),
    clearResults: vi.fn(),
  }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

// ---------------------------------------------------------------------------
// Mock: hooks requiring Convex / native services (needed by the screen render)
// ---------------------------------------------------------------------------

const mockUseActiveSessionRoute = vi.fn()
vi.mock('../../../hooks/use-active-session-route', () => ({
  useActiveSessionRoute: (...args: unknown[]) => mockUseActiveSessionRoute(...args),
}))

vi.mock('../../../hooks/use-chat-planning', () => ({
  useChatPlanning: () => ({
    sendPlanningMessage: vi.fn(),
    cancel: vi.fn(),
    sessionId: null,
    resetSession: vi.fn(),
  }),
}))

vi.mock('../../../hooks/use-curated-discovery', () => ({
  useCuratedDiscovery: () => ({ isLoading: false, isEmpty: true, routes: [] }),
}))

vi.mock('../../../hooks/use-current-location', () => ({
  useCurrentLocation: () => ({ location: { lat: 37.7749, lng: -122.4194 }, loading: false }),
}))

vi.mock('../../../hooks/use-is-route-saved', () => ({
  useIsRouteSaved: () => false,
}))

vi.mock('../../../hooks/use-plan-ride', () => ({
  usePlanInit: () => ({ data: null }),
  usePlanRide: () => ({
    planRide: vi.fn(),
    isRunning: false,
    error: null,
    resetError: vi.fn(),
    cancelPlanning: vi.fn(),
  }),
}))

const mockFlowDispatch = vi.fn()
const mockUseRideFlow = vi.fn()
vi.mock('../../../hooks/use-ride-flow', () => ({
  useRideFlow: (...args: unknown[]) => mockUseRideFlow(...args),
}))

vi.mock('../../../hooks/use-toast-messages', () => ({
  useToastMessages: () => ({ toasts: [], dismissToast: vi.fn(), clearAll: vi.fn() }),
}))

vi.mock('../../../stores/chat-session-store', () => ({
  useChatSessionStore: (selector: any) =>
    selector({
      defaultCamera: null,
      bySession: {},
      lastViewedSessionId: null,
      _hydrated: true,
      setCamera: vi.fn(),
      setLastViewedSession: vi.fn(),
    }),
}))

// ---------------------------------------------------------------------------
// Mock: semantic theme (real CuratedRouteCard + screen consume this shape)
// ---------------------------------------------------------------------------

const MOCK_SEMANTIC = {
  color: {
    primary: {
      default: '#D4A373',
      pressed: '#C49060',
      disabled: '#6B5439',
      hover: '#D4A373',
      focus: '#D4A373',
    },
    secondary: {
      default: '#1A1C1F',
      pressed: '#2A2C2F',
      disabled: '#0D0E10',
      hover: '#1A1C1F',
      focus: '#1A1C1F',
    },
    tertiary: {
      default: '#2B9AEB',
      pressed: '#1B8ADB',
      disabled: '#164D6B',
      hover: '#2B9AEB',
      focus: '#2B9AEB',
    },
    success: {
      default: '#31A362',
      pressed: '#219352',
      disabled: '#185232',
      hover: '#31A362',
      focus: '#31A362',
    },
    warning: {
      default: '#D98E04',
      pressed: '#C97E00',
      disabled: '#6B4700',
      hover: '#D98E04',
      focus: '#D98E04',
    },
    warningContainer: { default: '#2B2210', pressed: '#2B2210', disabled: '#2B2210' },
    onWarningContainer: { default: '#FFD080', pressed: '#FFD080', disabled: '#FFD080' },
    danger: {
      default: '#E35D6A',
      pressed: '#D34D5A',
      disabled: '#722E35',
      hover: '#E35D6A',
      focus: '#E35D6A',
    },
    info: {
      default: '#2B9AEB',
      pressed: '#1B8ADB',
      disabled: '#164D6B',
      hover: '#2B9AEB',
      focus: '#2B9AEB',
    },
    surface: {
      default: '#1B1715',
      pressed: '#2B2725',
      disabled: '#0D0B0A',
      hover: '#1B1715',
      focus: '#1B1715',
      glass: 'rgba(27,23,21,0.72)',
    },
    surfaceVariant: {
      default: '#2B2725',
      pressed: '#3B3735',
      disabled: '#1B1715',
      hover: '#2B2725',
      focus: '#2B2725',
    },
    background: {
      default: '#0b0b0c',
      pressed: '#0b0b0c',
      disabled: '#0b0b0c',
      hover: '#0b0b0c',
      focus: '#0b0b0c',
    },
    onSurface: {
      default: '#F5F0EB',
      pressed: '#F5F0EB',
      disabled: '#5A5650',
      hover: '#F5F0EB',
      focus: '#F5F0EB',
      muted: '#9CA3AF',
      subtle: '#6B7280',
    },
    onPrimary: {
      default: '#FFFFFF',
      pressed: '#FFFFFF',
      disabled: '#FFFFFF',
      hover: '#FFFFFF',
      focus: '#FFFFFF',
    },
    onSecondary: {
      default: '#F5F0EB',
      pressed: '#F5F0EB',
      disabled: '#F5F0EB',
      hover: '#F5F0EB',
      focus: '#F5F0EB',
    },
    secondaryContainer: { default: '#2B2725', pressed: '#2B2725', disabled: '#2B2725' },
    onSecondaryContainer: {
      default: '#F5F0EB',
      pressed: '#F5F0EB',
      disabled: '#F5F0EB',
      muted: '#9CA3AF',
      subtle: '#6B7280',
    },
    border: {
      default: '#2B2725',
      pressed: '#2B2725',
      disabled: '#2B2725',
      hover: '#2B2725',
      focus: '#2B2725',
      glass: 'rgba(43,39,37,0.5)',
    },
    input: { default: '#2B2725', pressed: '#2B2725', disabled: '#2B2725' },
    ring: { default: '#B87333', pressed: '#B87333', disabled: '#B87333' },
    locationPoiFill: { default: '#EDEDED', pressed: '#EDEDED', disabled: '#EDEDED' },
    locationPoiRing: { default: '#B87333', pressed: '#B87333', disabled: '#B87333' },
    locationPoiMuted: { default: '#A3A3A3', pressed: '#A3A3A3', disabled: '#A3A3A3' },
    locationPoiBg: { default: '#F3EFE8', pressed: '#F3EFE8', disabled: '#F3EFE8' },
    card: { default: '#24272B', pressed: '#24272B', disabled: '#24272B' },
    popover: { default: '#24272B', pressed: '#24272B', disabled: '#24272B' },
    accent: { default: '#88C7A6', pressed: '#78B796', disabled: '#446353' },
    orange: { default: '#FF6B35', pressed: '#EF5B25', disabled: '#7F3518' },
    muted: { default: '#938F99', pressed: '#938F99', disabled: '#938F99' },
    divider: { default: '#CAC4D0', pressed: '#CAC4D0', disabled: '#CAC4D0' },
    scrim: { default: '#000000', pressed: '#000000', disabled: '#000000' },
    routeSelected: { default: '#FF6B35', pressed: '#FF6B35', disabled: '#FF6B35' },
    routeAlternate: { default: '#60a5fa', pressed: '#60a5fa', disabled: '#60a5fa' },
  },
  space: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, '2xl': 32, '3xl': 48, '4xl': 64 },
  radius: { none: 0, sm: 4, md: 8, lg: 12, xl: 16, '2xl': 20, full: 9999 },
  type: {
    label: {
      sm: { fontSize: 11, lineHeight: 16, fontWeight: '500' as const },
      md: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
      lg: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
    },
    body: {
      sm: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
      md: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
      lg: { fontSize: 16, lineHeight: 24, fontWeight: '400' as const },
    },
    title: {
      sm: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
      md: { fontSize: 18, lineHeight: 28, fontWeight: '500' as const },
      lg: { fontSize: 22, lineHeight: 28, fontWeight: '500' as const },
    },
    heading: {
      sm: { fontSize: 20, lineHeight: 28, fontWeight: '600' as const },
      md: { fontSize: 24, lineHeight: 32, fontWeight: '600' as const },
      lg: { fontSize: 28, lineHeight: 36, fontWeight: '600' as const },
    },
    display: {
      sm: { fontSize: 32, lineHeight: 40, fontWeight: '700' as const },
      md: { fontSize: 40, lineHeight: 48, fontWeight: '700' as const },
      lg: { fontSize: 48, lineHeight: 56, fontWeight: '700' as const },
    },
  },
  elevation: {
    0: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    1: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 1,
    },
    2: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 2,
    },
    3: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },
    4: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 4,
    },
    5: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.4,
      shadowRadius: 32,
      elevation: 5,
    },
  },
  control: { minTouchTarget: 44, minHeight: 40 },
  opacity: { pressed: 0.7, disabled: 0.5, focus: 1, overlay: 0.5 },
  borderWidth: { thin: 1, medium: 2, thick: 4 },
}

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

// ---------------------------------------------------------------------------
// Mock: sibling card + native map boundary (RoutingCard imports
// RouteAttachmentCard; the screen imports MapboxMapView). Mocked so the real
// CuratedRouteCard + the real doFit seam are the code under test.
// ---------------------------------------------------------------------------

vi.mock('../route-attachment-card', () => {
  const { createElement } = require('react')
  return {
    RouteAttachmentCard: (props: any) =>
      createElement('View', { testID: props.testID ?? 'route-attachment-card' }),
  }
})

vi.mock('../../../components/map', () => {
  const { forwardRef } = require('react')
  return {
    MapboxMapView: forwardRef((props: any, ref: any) => {
      if (typeof ref === 'function') ref(mockMapRef.current)
      else if (ref && typeof ref === 'object') ref.current = mockMapRef.current
      if (props?.children) return props.children
      return null
    }),
  }
})

vi.mock('../../../components/map/map-controls', () => ({ MapControls: () => null }))
vi.mock('../../../components/map/map-header-overlay', () => ({ MapHeaderOverlay: () => null }))
vi.mock('../../../components/map/map-planning-indicator', () => ({
  MapPlanningIndicator: () => null,
}))
vi.mock('../../../components/map/map-toast-stack', () => ({ MapToastStack: () => null }))
vi.mock('../../../components/map/route-summary-carousel', () => ({
  RouteSummaryCarousel: () => null,
}))
vi.mock('../../../components/map/route-tag', () => ({ RouteTag: () => null }))
vi.mock('../../../components/map/search-result-marker', () => ({
  SearchResultMarker: () => null,
}))
vi.mock('../../../components/map/weather-pills-row', () => ({ WeatherPillsRow: () => null }))

vi.mock('../../../components/chat', () => ({ ChatInput: () => null }))
vi.mock('../../../components/layouts/menu-layout', () => ({
  MenuLayout: (p: any) => p.children,
}))
vi.mock('../../../components/sheets/plan-ride-sheet', () => ({ PlanRideSheet: () => null }))
vi.mock('../../../components/sheets/planning-error-sheet', () => ({
  PlanningErrorSheet: () => null,
}))
vi.mock('../../../components/sheets/planning-loading', () => ({ RoutePlannerLoading: () => null }))
vi.mock('../../../components/sheets/route-details-sheet', () => ({
  RouteDetailsSheet: () => null,
}))
vi.mock('../../../components/ui/chat-transcript', () => ({ ChatTranscript: () => null }))
vi.mock('../../../components/ui/motorcycle-plus-icon', () => ({
  MotorcyclePlusIcon: () => null,
}))
vi.mock('../../../components/ui/save-favorite-sheet', () => ({
  SaveRouteSheet: () => null,
}))
vi.mock('../../../components/sheets/route-directions-sheet', () => ({
  RouteDirectionsSheet: () => null,
}))
vi.mock('./route-mini-map', () => ({
  RouteMiniMap: () => null,
}))
vi.mock('../../../components/ui/badge', () => ({
  Badge: ({ children, testID }: any) => createElement('View', { testID }, children),
}))

vi.mock('../../../lib/get-current-location', () => ({ getCurrentLocation: vi.fn() }))

// ---------------------------------------------------------------------------
// REAL component under test (tests 1–2)
// ---------------------------------------------------------------------------

import type { RoutingCardProps } from '../routing-card'
import { RoutingCard } from '../routing-card'

// ---------------------------------------------------------------------------
// Fixtures — completed route_plan with curated options carrying real scores
// ---------------------------------------------------------------------------

const BASE_MESSAGE: RoutingCardProps['message'] = {
  _id: 'session_messages:msg1' as any,
  createdAt: Date.now(),
  content: 'Planning your route…',
  status: 'running',
}

const buildCuratedOption = (id: string, label: string, composite: number) => ({
  routeOptionId: id,
  label,
  rationale: `${label} — curated pick`,
  stats: { distanceMeters: 78_000, durationSeconds: 5400, legsCount: 1 },
  map: {
    bounds: { northeast: { lat: 37.85, lng: -122.42 }, southwest: { lat: 37.59, lng: -122.49 } },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: 'c|peFf`ejVnqPn}@ryPn}@',
    },
    legs: [],
  },
  scores: { composite },
  overlaysPreview: {
    windSummary: 'low' as const,
    rainSummary: 'none' as const,
    temperatureSummary: 'mild' as const,
    conditionsStatus: 'ok' as const,
  },
})

const buildCompletedPlan = (options: any[]) => ({
  _id: 'route_plans:plan1',
  status: 'completed',
  startLabel: 'Asheville',
  endLabel: 'Blue Ridge',
  planInput: {
    start: { lat: 35.5951, lng: -82.5515, label: 'Asheville' },
    end: { lat: 35.4595, lng: -82.5315, label: 'Blue Ridge' },
  },
  result: { options },
})

// Centroid-only curated active option for the screen-render test (1 coord).
const centroidCuratedOption = {
  routeOptionId: 'curated-skyline',
  label: 'Skyline Drive',
  rationale: 'Scenic curated route',
  stats: { distanceMeters: 12_000, durationSeconds: 1200, legsCount: 0 },
  map: {
    bounds: { northeast: { lat: 36.86, lng: -121.39 }, southwest: { lat: 36.84, lng: -121.41 } },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: 'og|_F~|}cV',
    },
    legs: [],
    overlays: {},
  },
  overlaysPreview: {
    windSummary: 'none',
    rainSummary: 'none',
    temperatureSummary: 'mild',
    conditionsStatus: 'unavailable',
  },
} as any

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DISC-020: Curated card score %, re-render→map, centroid fallback', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockSetSelectedRouteId.mockClear()
    mockSetDisplayedRoutePlanId.mockClear()
    mockRequestFitToRouteWithReset.mockClear()
    mockFitToCoordinates.mockClear()
    mockSetCameraPosition.mockClear()
    mockMapRef.current.fitToCoordinates = mockFitToCoordinates
    mockMapRef.current.setCameraPosition = mockSetCameraPosition
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-4a: compositeScore 0.82 renders as the normalised percentage text
  // ─────────────────────────────────────────────────────────────────────────
  it('curatedCardShowsScoreAsPercentOnZeroToOneScale', () => {
    const option = buildCuratedOption('opt-scenic', 'Scenic Coastal', 0.82)
    mockUseQuery.mockReturnValue(buildCompletedPlan([option]))

    const { getByText, queryByText } = render(
      <RoutingCard
        message={BASE_MESSAGE}
        attachments={[{ type: 'route_options', routePlanId: 'route_plans:plan1' as any }]}
      />,
    )

    // THEN: the score is normalised via Math.round(0.82 * 100) === 82 and
    // rendered on the 0..100 scale. The real component contract renders
    // `82/100` (see curated-route-card.tsx buildRouteTagText-equivalent).
    expect(getByText('82/100')).toBeTruthy()

    // Negative controls — the failure modes the normalisation guards against:
    //   • raw decimal shown (DATA-008b not applied) → would render `0.82`
    //   • zero-for-nonzero (treated as already-percent) → would render `0/100`
    expect(queryByText('0.82')).toBeNull()
    expect(queryByText('0/100')).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-4b: pressing an earlier curated card re-selects it and returns to map
  // ─────────────────────────────────────────────────────────────────────────
  it('earlierCuratedCardReRendersAndReturnsToMap', () => {
    const first = buildCuratedOption('opt-scenic', 'Scenic Coastal', 0.82)
    const earlier = buildCuratedOption('opt-twisties', 'Twisties Loop', 0.74)
    mockUseQuery.mockReturnValue(buildCompletedPlan([first, earlier]))

    const onViewOnMap = vi.fn()
    const { getByTestId } = render(
      <RoutingCard
        message={BASE_MESSAGE}
        attachments={[{ type: 'route_options', routePlanId: 'route_plans:plan1' as any }]}
        onViewOnMap={onViewOnMap}
      />,
    )

    // The "earlier" (second) curated card is present and tappable.
    const earlierCard = getByTestId('routing-card-route-opt-twisties')
    expect(earlierCard).toBeTruthy()

    // Press it → CuratedRouteCard.handlePress fires onSelect() then onViewOnMap().
    fireEvent.press(earlierCard)

    // THEN: the selected-route context is updated to the pressed route…
    expect(mockSetSelectedRouteId).toHaveBeenCalledWith('opt-twisties')
    expect(mockSetDisplayedRoutePlanId).toHaveBeenCalledWith('route_plans:plan1')
    expect(mockRequestFitToRouteWithReset).toHaveBeenCalledTimes(1)

    // …AND the chatMode→map flip handler fires (returns the rider to the map).
    expect(onViewOnMap).toHaveBeenCalledTimes(1)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-4c: a centroid-only curated route plots via the doFit fallback (zoom 12)
  // ─────────────────────────────────────────────────────────────────────────
  it('centroidOnlyCuratedPlotsViaFallback', async () => {
    // Drive the REAL plan-view screen with a centroid-only curated route
    // resolved via useActiveSessionRoute (the production resolution path for a
    // tapped curated discovery pill).
    mockUseQuery.mockReturnValue([])
    mockUseMutation.mockReturnValue(vi.fn())
    mockUseRideFlow.mockReturnValue({
      state: { phase: 'IDLE' as const, sessionId: 'test-session' },
      dispatch: mockFlowDispatch,
    })
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: centroidCuratedOption,
      routePlan: {
        _id: 'plan-curated-skyline',
        status: 'completed',
        startLabel: 'Start',
        endLabel: 'End',
        planInput: {
          start: { lat: 36.85, lng: -121.4, label: 'Start' },
          end: { lat: 37.0, lng: -122.0, label: 'End' },
        },
        result: { options: [centroidCuratedOption] },
      },
      newestRoutePlanId: 'plan-curated-skyline',
    })

    const mod = await import('../../../app/(app)/(tabs)/index')
    const HomeMapScreen = mod.default

    render(createElement(HomeMapScreen))

    // THEN: doFit decodes the single-coordinate geometry and takes the
    // centroid fallback branch → setCameraPosition with zoom 12.
    await waitFor(() => {
      expect(mockSetCameraPosition).toHaveBeenCalled()
    })
    const cameraCall = mockSetCameraPosition.mock.calls[mockSetCameraPosition.mock.calls.length - 1]
    expect(cameraCall[0].zoom).toBe(12)
    expect(cameraCall[0].coordinates.latitude).toBeCloseTo(36.85, 1)
    expect(cameraCall[0].coordinates.longitude).toBeCloseTo(-121.4, 1)
  })
})
