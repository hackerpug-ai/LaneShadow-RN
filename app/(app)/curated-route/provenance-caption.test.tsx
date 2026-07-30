/**
 * S6-T4 / UC-SURF-05 — provenance caption leaf on curated-route detail.
 *
 * Renders the REAL `app/(app)/curated-route/[id].tsx` screen with the REAL
 * `useCuratedRouteDetail` hook and (once GREEN) the provenance caption leaf.
 * Only the boundary (Convex useQuery/useAction, expo-router, native map,
 * theme, safe-area) is mocked.
 *
 * AC coverage:
 *   AC-1  ai_reconstructed → exact literal reconstruction copy + testID
 *   AC-2  name_routed → exact literal road-name copy + testID
 *   AC-3  scraped_promoted + pre-provenance → no caption node; detail still live
 *   AC-4  caption is plain muted Text (not Badge, not warning color)
 *
 * Service: vitest-react-native (jsdom).
 */

import { cleanup, render } from '@testing-library/react-native'
import { createElement } from 'react'
import { StyleSheet } from 'react-native'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_SEMANTIC } from '../../../test-helpers/mock-semantic'

// ---------------------------------------------------------------------------
// Boundary spies (hoisted so the mock factories can reference them).
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockGetCurrentWeather = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  useAction: () => mockGetCurrentWeather,
  useMutation: () => vi.fn(),
}))

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'seeded-route-id' }),
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
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

vi.mock('../../../components/map', () => ({
  MapboxMapView: (props: { children?: React.ReactNode }) => props?.children ?? null,
}))

vi.mock('../../../components/map/map-header-overlay', () => ({
  MapHeaderOverlay: () => null,
}))

vi.mock('../../../hooks/use-save-curated-route', () => ({
  useSaveCuratedRoute: () => ({ save: vi.fn(), isLoading: false }),
  useIsCuratedRouteSaved: () => ({ isSaved: false }),
}))

vi.mock('../../../lib/maps-deeplink', () => ({
  openRouteInMaps: vi.fn(),
}))

vi.mock('../../../components/ui/button', () => {
  const React = require('react')
  const Button = (props: { children?: React.ReactNode; testID?: string }) =>
    React.createElement('Text', { testID: props.testID }, props.children)
  return { Button }
})

// ---------------------------------------------------------------------------
// Fixtures — match getCuratedRouteDetail return shape (incl. geometryProvenance)
// ---------------------------------------------------------------------------

const WEATHER_OK = {
  tempF: 64,
  condition: 'CLEAR' as const,
  severity: 'normal' as const,
  dayOfWeek: 'SATURDAY',
}

const AI_RECONSTRUCTED_COPY = 'Route line reconstructed from the ride description'
const NAME_ROUTED_COPY = 'Route line generated from the road name'

const buildDetail = (overrides: Record<string, unknown> = {}) => ({
  _id: 'jd7seededcuratedroute0000001',
  routeId: 'seeded-route-id',
  name: 'Seeded Ridge Loop',
  state: 'TN',
  primaryArchetype: 'scenic',
  centroidLat: 35.4,
  centroidLng: -84.1,
  compositeScore: 0.81,
  curvatureScore: 0.8,
  scenicScore: 0.9,
  technicalScore: 0.7,
  trafficScore: 0.3,
  remotenessScore: 0.6,
  lengthMiles: 47,
  summary: 'A quiet ridge run through the southern highlands.',
  routePolyline: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
  bounds: { north: 35.6, south: 35.2, east: -83.9, west: -84.3 },
  headline: 'A quiet ridge run through the southern highlands.',
  ...overrides,
})

const flattenStyle = (style: unknown): Record<string, unknown> => {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyle))
  if (typeof style === 'number') {
    const resolved = StyleSheet.flatten(style as { __registeredStyle: unknown })
    return resolved ?? {}
  }
  return style as Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('S6-T4 provenance caption (UC-SURF-05)', () => {
  let CuratedRouteDetailScreen: React.ComponentType<unknown>

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(async () => {
    mockUseQuery.mockReset()
    mockGetCurrentWeather.mockReset()
    mockGetCurrentWeather.mockResolvedValue(WEATHER_OK)
    const mod = await import('./[id]')
    CuratedRouteDetailScreen = mod.default
  })

  // ── AC-1 ─────────────────────────────────────────────────────────────────
  it('AC-1: ai_reconstructed caption rendered with exact literal copy', () => {
    mockUseQuery.mockReturnValue(
      buildDetail({
        name: 'Von Hoak Loop',
        geometryProvenance: 'ai_reconstructed',
      }),
    )

    const { getByTestId, queryByText } = render(createElement(CuratedRouteDetailScreen))

    const caption = getByTestId('curated-detail-provenance')
    expect(caption).toBeTruthy()
    expect(caption.props.children).toBe(AI_RECONSTRUCTED_COPY)
    // Not a warning badge / Approximate location chrome.
    expect(queryByText('Approximate location')).toBeNull()
  })

  // ── AC-2 ─────────────────────────────────────────────────────────────────
  it('AC-2: name_routed caption rendered with exact literal copy', () => {
    mockUseQuery.mockReturnValue(
      buildDetail({
        name: 'Blue Ridge Parkway Spur',
        geometryProvenance: 'name_routed',
      }),
    )

    const { getByTestId, queryByText } = render(createElement(CuratedRouteDetailScreen))

    const caption = getByTestId('curated-detail-provenance')
    expect(caption).toBeTruthy()
    expect(caption.props.children).toBe(NAME_ROUTED_COPY)
    // Must not show the ai_reconstructed copy.
    expect(queryByText(AI_RECONSTRUCTED_COPY)).toBeNull()
  })

  // ── AC-3 ─────────────────────────────────────────────────────────────────
  it('AC-3: NO caption for scraped_promoted (detail still live)', () => {
    mockUseQuery.mockReturnValue(
      buildDetail({
        name: 'Cherohala Skyway',
        geometryProvenance: 'scraped_promoted',
      }),
    )

    const { getByText, queryByTestId, queryByText } = render(
      createElement(CuratedRouteDetailScreen),
    )
    expect(getByText('Cherohala Skyway')).toBeTruthy()
    expect(queryByTestId('curated-detail-provenance')).toBeNull()
    expect(queryByText(/Route line/)).toBeNull()
  })

  it('AC-3: NO caption for pre-provenance (detail still live)', () => {
    mockUseQuery.mockReturnValue(
      buildDetail({
        name: 'Legacy Ridge Run',
        // geometryProvenance intentionally omitted (pre-provenance / unset)
      }),
    )

    const { getByText, queryByTestId, queryByText } = render(
      createElement(CuratedRouteDetailScreen),
    )
    expect(getByText('Legacy Ridge Run')).toBeTruthy()
    expect(queryByTestId('curated-detail-provenance')).toBeNull()
    expect(queryByText(/Route line/)).toBeNull()
  })

  // ── AC-4 ─────────────────────────────────────────────────────────────────
  it('AC-4: caption styled calm/muted Text, not Badge/warning', () => {
    mockUseQuery.mockReturnValue(
      buildDetail({
        name: 'Von Hoak Loop',
        geometryProvenance: 'ai_reconstructed',
      }),
    )

    const { getByTestId, queryByTestId } = render(createElement(CuratedRouteDetailScreen))

    const caption = getByTestId('curated-detail-provenance')

    // Node type is Text (host), not Badge.
    // react-native-paper Text mock wraps RN Text → type string 'Text'.
    expect(caption.type).toBe('Text')

    // Approximate-location badge may be absent when polyline is present;
    // provenance itself must never be implemented as that badge.
    expect(queryByTestId('curated-detail-approximate-badge')).toBeNull()

    const style = flattenStyle(caption.props.style)

    // Color = semantic.color.onSurface.subtle (token path; mock resolves #6B7280).
    expect(style.color).toBe(MOCK_SEMANTIC.color.onSurface.subtle)
    // Must not use warning / danger / alert colors.
    expect(style.color).not.toBe(MOCK_SEMANTIC.color.warning.default)
    expect(style.color).not.toBe(MOCK_SEMANTIC.color.danger.default)

    // Typography = semantic.type.body.sm (weight 400, small body size).
    expect(style.fontSize).toBe(MOCK_SEMANTIC.type.body.sm.fontSize)
    expect(style.fontWeight).toBe(MOCK_SEMANTIC.type.body.sm.fontWeight)
    // Not bold/large.
    expect(style.fontWeight).not.toBe('700')
    expect(style.fontWeight).not.toBe('600')
  })
})
