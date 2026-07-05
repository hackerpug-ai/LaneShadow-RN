/**
 * DTL-001 AC-4 integration test: graceful 'Route not found' fallback.
 *
 * Renders the REAL `app/(app)/curated-route/[id].tsx` screen with the REAL
 * `useCuratedRouteDetail` hook. Only the boundary (Convex useQuery, expo-router,
 * native map, theme, safe-area) is mocked — the component-under-test and its
 * hook run for real.
 *
 * AC-4 (two complementary cases):
 *   - nullDataRendersFallback: getCuratedRouteDetail resolves to null/undefined
 *     (bad id that the backend returns no row for) → the screen's null-guard
 *     renders `curated-route-detail-fallback` with literal 'Route not found'.
 *   - throwingQueryRendersFallback: getCuratedRouteDetail THROWS (DATA-006
 *     throws ConvexError NOT_FOUND for an unknown id) → the screen's
 *     ErrorBoundary catches it and renders the SAME fallback. No uncaught
 *     error reaches the top-level error boundary.
 *
 * Service: vitest (jsdom). The live-Convex variant of AC-4 runs in PHASE 3.5;
 * this jsdom test pins the fallback contract for the component tier.
 */

import { cleanup, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_SEMANTIC } from '../../../test-helpers/mock-semantic'

// ---------------------------------------------------------------------------
// Boundary mocks (hoisted). Only the convex client, router, native map,
// safe-area and theme are stubbed — the screen + hook under test are real.
// ---------------------------------------------------------------------------

const mockUseQuery = vi.fn()
const mockRouterPush = vi.fn()
const mockRouterBack = vi.fn()

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
  // DESIGN-004: useSaveCuratedRoute calls useMutation — include a no-op stub.
  useMutation: () => vi.fn(),
  useAction: () => vi.fn(),
}))

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'bad-curated-id' }),
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack, replace: vi.fn() }),
}))

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaView: (p: any) => p.children,
}))

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

vi.mock('../../../contexts/theme-preference', () => ({
  useThemePreference: () => ({ isDark: false, mode: 'light' }),
}))

// MapboxMapView — render children (polyline layer) so success-path child count
// could be asserted by a sibling test; here it just must not crash.
vi.mock('../../../components/map', () => {
  const { forwardRef } = require('react')
  return {
    MapboxMapView: forwardRef((props: any, _ref: any) => (props?.children ? props.children : null)),
  }
})

vi.mock('../../../components/map/map-header-overlay', () => ({
  MapHeaderOverlay: () => null,
}))

// DESIGN-004: the screen now imports SAVE-001 hooks + SAVE-002 deeplink.
// Mock both so the DTL-001 fallback assertions are unaffected by the new wiring.
vi.mock('../../../hooks/use-save-curated-route', () => ({
  useSaveCuratedRoute: () => ({ save: vi.fn(), isLoading: false }),
  useIsCuratedRouteSaved: () => ({ isSaved: false }),
}))

vi.mock('../../../lib/maps-deeplink', () => ({
  openRouteInMaps: vi.fn(),
}))

describe('DTL-001 AC-4: curated-route detail fallback', () => {
  let CuratedRouteDetailScreen: any

  afterEach(() => {
    cleanup()
    vi.clearAllMocks()
  })

  beforeEach(async () => {
    mockUseQuery.mockReset()
    // Default: query resolved to null (bad id returned no row).
    mockUseQuery.mockReturnValue(null)
    // Dynamic import so the hoisted vi.mock() registrations apply first.
    const mod = await import('./[id]')
    CuratedRouteDetailScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  it('nullDataRendersFallback: query resolves null → Route not found', async () => {
    mockUseQuery.mockReturnValue(null)

    const { getByTestId, getByText } = render(createElement(CuratedRouteDetailScreen))

    // AC-4 THEN: `curated-route-detail-fallback` node renders with the literal
    // 'Route not found' text — no uncaught error, no blank screen.
    await waitFor(() => getByTestId('curated-route-detail-fallback'))
    expect(getByTestId('curated-route-detail-fallback')).toBeTruthy()
    expect(getByText('Route not found')).toBeTruthy()
  })

  // ─────────────────────────────────────────────────────────────────────────
  it('throwingQueryRendersFallback: query throws → ErrorBoundary → Route not found', {
    retry: 0,
  }, async () => {
    // DATA-006 throws ConvexError({ code: 'NOT_FOUND' }) for an unknown id.
    // Simulate that at the client boundary.
    mockUseQuery.mockImplementation(() => {
      throw new Error('Curated route not found: bad-curated-id')
    })

    // The screen wraps its query in an ErrorBoundary whose fallback is the
    // SAME `curated-route-detail-fallback` node — so a throwing query must
    // surface the literal fallback text, never an uncaught error.
    const { getByTestId, getByText } = render(createElement(CuratedRouteDetailScreen))

    await waitFor(() => getByTestId('curated-route-detail-fallback'))
    expect(getByTestId('curated-route-detail-fallback')).toBeTruthy()
    expect(getByText('Route not found')).toBeTruthy()
  })
})
