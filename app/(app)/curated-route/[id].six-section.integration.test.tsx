/**
 * DESIGN-002 integration tests: six-section curated-route detail body.
 *
 * Renders the REAL `app/(app)/curated-route/[id].tsx` screen with the REAL
 * `useCuratedRouteDetail` hook. Only the boundary (Convex useQuery/useAction,
 * expo-router, native map, theme, safe-area) is mocked — the screen, the hook,
 * the real Button/Badge/ScoreDimensionBarSection, and ErrorBoundary run for real.
 *
 * AC coverage (jsdom-testable logic; full-render against live dev + simulator
 * is PHASE 3.5):
 *   AC-1  fullSixSectionsRenderForRouteWithGeometrySummaryWeather
 *        → all six section testIDs present + headline '81/100' + 5 score bars
 *          + polyline probe + 'Save'/'Ride It' labels.
 *   AC-2  nullSummaryShowsItalicMutedPlaceholder
 *        → 'No description yet' renders (NOT blank/undefined), italic style.
 *   AC-3  actionsScrollWithBodyNotPinned
 *        → curated-detail-actions is a DESCENDANT of the ScrollView (not a
 *          position:absolute sibling).
 *   AC-4  weatherFailureShowsConditionsUnavailableWithoutBlockingOthers
 *        → 'conditions unavailable' in conditions section AND the other five
 *          sections still render (header name, headline, Save label intact).
 *
 * Service: vitest (jsdom). The live-Convex + simulator variant runs in 3.5.
 */

import { cleanup, render, waitFor, within } from '@testing-library/react-native'
import { createElement } from 'react'
import { StyleSheet } from 'react-native'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_SEMANTIC } from '../../../test-helpers/mock-semantic'

// ---------------------------------------------------------------------------
// Boundary spies (hoisted so the mock factories can reference them).
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockGetCurrentWeather = vi.fn()
const mockRouterBack = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  // useAction returns the action-caller; the test swaps resolve/reject per AC.
  useAction: () => mockGetCurrentWeather,
  // DESIGN-004: useSaveCuratedRoute calls useMutation — include a no-op stub.
  useMutation: () => vi.fn(),
}))

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'wasatch-ridge-traverse' }),
  useRouter: () => ({ push: vi.fn(), back: mockRouterBack, replace: vi.fn() }),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: (p: { children: React.ReactNode }) => p.children,
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

// MapboxMapView — render children (polyline probe is asserted separately).
// Mocked WITHOUT importOriginal: the real map module pulls in
// @rnmapbox/maps + react-native-worklets which crash under jsdom. Only the
// rendered-children contract is needed (the polyline probe is a sibling View).
vi.mock('../../../components/map', () => ({
  MapboxMapView: (props: { children?: React.ReactNode }) => props?.children ?? null,
}))

vi.mock('../../../components/map/map-header-overlay', () => ({
  MapHeaderOverlay: () => null,
}))

// DESIGN-004: the screen now imports SAVE-001 hooks + SAVE-002 deeplink.
// Mock both so the DESIGN-002 assertions (section rendering, labels) are
// unaffected by the actions-row wiring (tested in [id].actions.integration).
vi.mock('../../../hooks/use-save-curated-route', () => ({
  useSaveCuratedRoute: () => ({ save: vi.fn(), isLoading: false }),
  useIsCuratedRouteSaved: () => ({ isSaved: false }),
}))

vi.mock('../../../lib/maps-deeplink', () => ({
  openRouteInMaps: vi.fn(),
}))

// Button — the real component renders its label via a Pressable render-prop
// ({({pressed}) => content(pressed)}), and the jsdom react-native mock does
// not invoke function-children. Mock it as a boundary (leaf UI primitive,
// design-system owned) while faithfully rendering the testID + label text so
// the AC's label-text assertions ('Save' / 'Ride It') stay meaningful. Only
// depends on `react` (safe to require); renders a host 'Text' node that RNTL
// matches via getByText.
vi.mock('../../../components/ui/button', () => {
  const React = require('react')
  const Button = (props: { children?: React.ReactNode; testID?: string }) =>
    React.createElement('Text', { testID: props.testID }, props.children)
  return { Button }
})

// ---------------------------------------------------------------------------
// Fixtures — match getCuratedRouteDetail return shape (DATA-006).
// ---------------------------------------------------------------------------

const WEATHER_OK = {
  tempF: 64,
  condition: 'CLEAR' as const,
  severity: 'normal' as const,
  dayOfWeek: 'SATURDAY',
}

const buildDetail = (overrides: Record<string, unknown> = {}) => ({
  routeId: 'wasatch-ridge-traverse',
  name: 'Wasatch Ridge Traverse',
  state: 'UT',
  primaryArchetype: 'scenic',
  centroidLat: 40.6,
  centroidLng: -111.6,
  compositeScore: 0.81,
  curvatureScore: 0.8,
  scenicScore: 0.9,
  technicalScore: 0.7,
  trafficScore: 0.3,
  remotenessScore: 0.6,
  lengthMiles: 47,
  summary: 'A high-alpine traverse along the Wasatch Crest.',
  routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  bounds: { north: 40.8, south: 40.4, east: -111.4, west: -111.8 },
  headline: 'A high-alpine traverse along the Wasatch Crest.',
  ...overrides,
})

// ---------------------------------------------------------------------------
// Helper: flatten an RNTL element's style (array-of-style-objects) into a
// single plain object so fontStyle / color assertions are deterministic.
// ---------------------------------------------------------------------------

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle))
  if (typeof style === 'number') {
    // Resolved StyleSheet id — RN's StyleSheet.flatten handles it.
    const resolved = StyleSheet.flatten(style as { __registeredStyle: unknown })
    return resolved ?? {}
  }
  return style as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DESIGN-002: six-section curated-route detail body', () => {
  let CuratedRouteDetailScreen: React.ComponentType<unknown>

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(async () => {
    mockUseQuery.mockReset()
    mockGetCurrentWeather.mockReset()
    // Defaults: detail loaded + weather succeeds.
    mockGetCurrentWeather.mockResolvedValue(WEATHER_OK)
    // Dynamic import so hoisted vi.mock() registrations apply first.
    const mod = await import('./[id]')
    CuratedRouteDetailScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1 (PRIMARY): all six sections render for a route WITH geometry+summary+weather
  // ─────────────────────────────────────────────────────────────────────────
  it('fullSixSectionsRenderForRouteWithGeometrySummaryWeather', async () => {
    mockUseQuery.mockReturnValue(buildDetail())

    const { getByTestId, getByText, queryByText } = render(createElement(CuratedRouteDetailScreen))

    // THEN: all six section root testIDs present.
    expect(getByTestId('curated-detail-header')).toBeTruthy()
    expect(getByTestId('curated-detail-summary')).toBeTruthy()
    expect(getByTestId('curated-detail-scores')).toBeTruthy()
    expect(getByTestId('curated-detail-map')).toBeTruthy()
    expect(getByTestId('curated-detail-conditions')).toBeTruthy()
    expect(getByTestId('curated-detail-actions')).toBeTruthy()

    // Header contains the literal route name.
    expect(getByText('Wasatch Ridge Traverse')).toBeTruthy()

    // Composite headline == '81/100' (Math.round(0.81*100)).
    expect(getByText('81/100')).toBeTruthy()

    // ScoreDimensionBar count == 5 (all dimensions present + non-null).
    const scores = getByTestId('curated-detail-scores')
    expect(within(scores).getByTestId('score-bar-curvature')).toBeTruthy()
    expect(within(scores).getByTestId('score-bar-scenic')).toBeTruthy()
    expect(within(scores).getByTestId('score-bar-technical')).toBeTruthy()
    expect(within(scores).getByTestId('score-bar-traffic')).toBeTruthy()
    expect(within(scores).getByTestId('score-bar-remoteness')).toBeTruthy()

    // Polyline layer present (DTL-001 probe survives the refactor).
    expect(getByTestId('curated-route-detail-polyline')).toBeTruthy()

    // Both action labels render literally.
    expect(getByText('Save')).toBeTruthy()
    expect(getByText('Ride It')).toBeTruthy()

    // Negative controls — the graceful-degradation texts must NOT appear for
    // a fully-populated route.
    // Flush the async weather resolution before asserting absence.
    await waitFor(() => {
      expect(queryByText('No description yet')).toBeNull()
      expect(queryByText('conditions unavailable')).toBeNull()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2: route with NO summary → italic muted 'No description yet'
  // ─────────────────────────────────────────────────────────────────────────
  it('nullSummaryShowsItalicMutedPlaceholder', async () => {
    mockUseQuery.mockReturnValue(buildDetail({ summary: null, headline: 'Wasatch Ridge Traverse' }))

    const { getByText, queryByText } = render(createElement(CuratedRouteDetailScreen))

    // THEN: the literal placeholder text renders (NOT blank, NOT 'undefined').
    const placeholder = getByText('No description yet')
    expect(placeholder).toBeTruthy()

    // AND: it is italic (same content.secondary color — italic face only).
    const style = flattenStyle(placeholder.props.style)
    expect(style.fontStyle).toBe('italic')

    // AND: the literal 'undefined' never leaks.
    expect(queryByText('undefined')).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3: long-content route → Save/Ride It scroll WITH the body (not pinned)
  // ─────────────────────────────────────────────────────────────────────────
  it('actionsScrollWithBodyNotPinned', async () => {
    const longSummary =
      'A very long description that pushes the actions row well below the fold. '.repeat(8)
    mockUseQuery.mockReturnValue(buildDetail({ summary: longSummary }))

    const { getByTestId } = render(createElement(CuratedRouteDetailScreen))

    // THEN: the actions section is a DESCENDANT of the ScrollView (jsdom does
    // not do real layout/scroll, but structural placement is assertable).
    // If actions were a position:absolute sibling OUTSIDE the ScrollView,
    // within(scroll) would NOT find it → this assertion would throw.
    const scroll = getByTestId('curated-detail-scroll')
    expect(within(scroll).getByTestId('curated-detail-actions')).toBeTruthy()

    // AND: both labels are reachable inside the scroll content.
    expect(within(scroll).getByText('Save')).toBeTruthy()
    expect(within(scroll).getByText('Ride It')).toBeTruthy()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-4: getCurrentWeather failure → 'conditions unavailable' (other 5 intact)
  // ─────────────────────────────────────────────────────────────────────────
  it('weatherFailureShowsConditionsUnavailableWithoutBlockingOthers', async () => {
    mockUseQuery.mockReturnValue(buildDetail())
    mockGetCurrentWeather.mockRejectedValue(new Error('Weather service unavailable'))

    const { getByText } = render(createElement(CuratedRouteDetailScreen))

    // THEN: the conditions section shows the literal fallback text.
    await waitFor(() => getByText('conditions unavailable'))
    expect(getByText('conditions unavailable')).toBeTruthy()

    // AND: the other five sections are still intact (NOT a screen-level error).
    expect(getByText('Wasatch Ridge Traverse')).toBeTruthy() // header name
    expect(getByText('81/100')).toBeTruthy() // scores headline
    expect(getByText('Save')).toBeTruthy() // actions still render
  })
})
