/**
 * REDHAT-FIX-003 / RUX-004 Integration Tests: On-route tag label/distance + tap→details + paging
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL doFit seam, selectedOption derivation, and
 * handleRouteTagPress wiring. Only the native map boundary (rnmapbox /
 * MapboxMapView), Convex/network hooks, and unrelated UI are mocked.
 *
 * The RouteTag component itself is stubbed with an adapter that uses the REAL
 * pure `buildRouteTagText` helper to render the archetype + distance text —
 * the real RouteTag renders via Mapbox MarkerView which the jsdom harness
 * cannot anchor, so the adapter surfaces the same observable text + testID
 * the production component produces. The wiring under test (index.tsx passing
 * archetype + distanceMeters + onPress) is exercised through real code.
 *
 * RouteDetailsSheet / SaveRouteSheet are stubbed as conditional adapters that
 * render their testID only when `isVisible`/`visible` is true — mirroring the
 * production `if (!visible) return null` contract — so presence/absence is
 * observable.
 *
 * AC-1 (tagShowsLabelAndDistance + tagTapOpensDetails + tagFollowsPaging):
 *   - route-tag present with archetype label + distance text (e.g. /Scenic.*78mi/)
 *   - tapping route-tag opens route-details-sheet (NOT save-route-sheet)
 *   - paging to a second route leaves exactly ONE route-tag
 */

import { cleanup, fireEvent, render, waitFor } from '@testing-library/react-native'
import { createElement } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { setupHomeScreenMocks } from '../../../test-helpers/index-screen'
import { MOCK_SEMANTIC } from '../../../test-helpers/mock-semantic'

// ---------------------------------------------------------------------------
// Shared boundary mocks (convex, router, native map, contexts, hooks, stores,
// sibling UI). Registered at file scope so vi.mock() applies before the
// dynamic `await import('./index')` in beforeEach. See test-helpers/index-screen.
// ---------------------------------------------------------------------------

const {
  mockUseQuery,
  mockUseMutation,
  mockUseActiveSessionRoute,
  mockUseRideFlow,
  mockFitToCoordinates,
  mockSetCameraPosition,
  mockMapRef,
} = setupHomeScreenMocks()

// ---------------------------------------------------------------------------
// Scenario-specific hooks (return shapes differ per suite)
// ---------------------------------------------------------------------------

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

vi.mock('../../../hooks/use-semantic-theme', () => ({
  useSemanticTheme: () => ({ semantic: MOCK_SEMANTIC }),
}))

// ---------------------------------------------------------------------------
// Scenario-specific component adapters
// ---------------------------------------------------------------------------

vi.mock('../../../components/map/map-planning-indicator', () => ({
  MapPlanningIndicator: () => null,
}))

// ---------------------------------------------------------------------------
// Mock: RouteTag — adapter that uses the REAL pure buildRouteTagText helper to
// surface the archetype + distance text + testID the production component
// produces. The real RouteTag anchors via Mapbox MarkerView which jsdom cannot
// position; this adapter renders the same observable text through a tappable
// TouchableOpacity so press wiring is also exercised.
// ---------------------------------------------------------------------------

vi.mock('../../../components/map/route-tag', async (importOriginal) => {
  const { createElement } = require('react')
  const { TouchableOpacity, Text } = require('react-native')
  const original = await importOriginal<any>()
  return {
    ...original,
    RouteTag: (props: any) => {
      const tagText = original.buildRouteTagText({
        archetype: props.archetype,
        distanceMeters: props.distanceMeters,
      })
      return createElement(
        TouchableOpacity,
        {
          testID: props.testID ?? `route-tag-${props.routeId}`,
          onPress: () => props.onPress?.(props.routeId),
          accessibilityRole: 'button',
        },
        createElement(Text, null, tagText),
      )
    },
  }
})

// ---------------------------------------------------------------------------
// Mock: RouteDetailsSheet / SaveRouteSheet — conditional adapters that render
// their testID only when visible (mirrors production `if (!visible) return null`).
// ---------------------------------------------------------------------------

vi.mock('../../../components/sheets/route-details-sheet', () => {
  const { createElement } = require('react')
  return {
    RouteDetailsSheet: (props: any) =>
      props.isVisible
        ? createElement('View', { testID: props.testID ?? 'route-details-sheet' })
        : null,
  }
})

vi.mock('../../../components/ui/save-favorite-sheet', () => {
  const { createElement } = require('react')
  return {
    SaveRouteSheet: (props: any) =>
      props.visible ? createElement('View', { testID: 'save-route-sheet' }) : null,
  }
})

vi.mock('../../../components/chat', () => ({ ChatInput: () => null }))
vi.mock('../../../components/ui/chat-transcript', () => ({ ChatTranscript: () => null }))

const mockFlowDispatch = vi.fn()

// ---------------------------------------------------------------------------
// Fixtures — real-encoded polylines (same encoding as RUX-002 fixtures)
// ---------------------------------------------------------------------------

// Multi-point polyline decoding to 3 coords:
//   [{lat:37.7749,lng:-122.4194}, {lat:37.6849,lng:-122.4294}, {lat:37.5936,lng:-122.4394}]
const multiPointPolyline = 'c|peFf`ejVnqPn}@ryPn}@'
// Second multi-point polyline decoding to 3 coords (different geometry):
//   [{lat:37.7749,lng:-122.4194}, {lat:37.8049,lng:-122.4654}, {lat:37.8549,lng:-122.4894}]
const secondPolyline = 'c|peFf`ejVozDn~GowH~tC'

const createRouteOption = (
  id: string,
  label: string,
  encodedPolyline: string,
  distanceMeters: number,
  durationSeconds: number,
) => ({
  routeOptionId: id,
  label,
  rationale: `${label} route`,
  stats: { distanceMeters, durationSeconds, legsCount: 1 },
  map: {
    bounds: {
      northeast: { lat: 37.85, lng: -122.42 },
      southwest: { lat: 37.59, lng: -122.49 },
    },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: encodedPolyline,
    },
    legs: [
      {
        start: { lat: 37.77, lng: -122.42, label: 'San Francisco', placeId: 'start' },
        end: { lat: 37.59, lng: -122.44, label: 'Destination', placeId: 'end' },
        distanceMeters,
        durationSeconds,
        geometry: {
          format: 'polyline' as const,
          encoding: 'google',
          precision: 5,
          value: encodedPolyline,
        },
        legIndex: 0,
        steps: [],
      },
    ],
  },
  overlaysPreview: {
    windSummary: 'low' as const,
    rainSummary: 'none' as const,
    temperatureSummary: 'mild' as const,
    conditionsStatus: 'ok' as const,
  },
})

// Scenic route: 125_000m → Math.round(125000/1609.34) === 78mi
const scenicRoute = createRouteOption(
  'route-scenic',
  'Scenic Coastal',
  multiPointPolyline,
  125_000,
  7200,
)
// Second route for paging (Twisties, different distance).
const twistiesRoute = createRouteOption(
  'route-twisties',
  'Twisties Loop',
  secondPolyline,
  64_000,
  3600,
)

/** Build a ROUTE_RESULTS flowState with the given options + selected id. */
const buildFlowState = (options: any[], selectedId?: string | null) => ({
  phase: 'ROUTE_RESULTS' as const,
  sessionId: 'test-session',
  routeOptions: { planId: 'test-plan', options },
  selectedRouteId: selectedId ?? options[0]?.routeOptionId ?? null,
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RUX-004: On-route tag label/distance, tap→details, paging', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockFitToCoordinates.mockClear()
    mockSetCameraPosition.mockClear()
    mockMapRef.current.fitToCoordinates = mockFitToCoordinates
    mockMapRef.current.setCameraPosition = mockSetCameraPosition

    // No agent-active route: the carousel/flow selectedRouteId drives the tag
    // via `selectedOption`, so paging swaps the rendered tag.
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: null,
      routePlan: null,
      newestRoutePlanId: null,
    })

    mockUseQuery.mockReturnValue([])
    mockUseMutation.mockReturnValue(vi.fn())

    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1a: route-tag shows archetype label + distance
  // ─────────────────────────────────────────────────────────────────────────
  it('tagShowsLabelAndDistance', async () => {
    mockUseRideFlow.mockReturnValue({
      state: buildFlowState([scenicRoute, twistiesRoute], scenicRoute.routeOptionId),
      dispatch: mockFlowDispatch,
    })

    const { findByTestId, getByText } = render(createElement(HomeMapScreen))

    // The route-tag renders inside the mounted map layer; wait for it.
    const tag = await findByTestId('route-tag')
    expect(tag).toBeTruthy()

    // The tag label includes the capitalised archetype and the rounded mileage.
    // 125_000m / 1609.34 = 77.67 → Math.round === 78
    // Observable via the rendered Text content (non-degenerate: real label + distance).
    const tagLabel = getByText(/Scenic.*78mi/)
    expect(tagLabel).toBeTruthy()
    // Negative controls: no placeholder mileage, no zero-for-nonzero.
    expect(getByText(/Scenic.*78mi/).props.children).toMatch(/Scenic.*78mi/)
    expect(() => getByText(/--mi/)).toThrow()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1b: tapping route-tag opens RouteDetailsSheet (not SaveRouteSheet)
  // ─────────────────────────────────────────────────────────────────────────
  it('tagTapOpensDetails', async () => {
    mockUseRideFlow.mockReturnValue({
      state: buildFlowState([scenicRoute, twistiesRoute], scenicRoute.routeOptionId),
      dispatch: mockFlowDispatch,
    })

    const { findByTestId, queryByTestId } = render(createElement(HomeMapScreen))

    const tag = await findByTestId('route-tag')

    // Before tap: neither sheet is open.
    expect(queryByTestId('route-details-sheet')).toBeNull()
    expect(queryByTestId('save-route-sheet')).toBeNull()

    fireEvent.press(tag)

    // After tap: the details sheet is open…
    await waitFor(() => {
      expect(queryByTestId('route-details-sheet')).not.toBeNull()
    })
    // …and the save sheet is NOT (save lives inside the details sheet).
    expect(queryByTestId('save-route-sheet')).toBeNull()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-1c: paging to a second route leaves exactly ONE route-tag
  // ─────────────────────────────────────────────────────────────────────────
  it('tagFollowsPaging', async () => {
    let currentState = buildFlowState([scenicRoute, twistiesRoute], scenicRoute.routeOptionId)
    mockUseRideFlow.mockReturnValue({ state: currentState, dispatch: mockFlowDispatch })

    const { queryAllByTestId, findByTestId, rerender, getByText } = render(
      createElement(HomeMapScreen),
    )

    // Wait for the first tag to mount.
    await findByTestId('route-tag')
    expect(queryAllByTestId('route-tag').length).toBe(1)

    // Page to the second route (selectedRouteId changes).
    currentState = buildFlowState([scenicRoute, twistiesRoute], twistiesRoute.routeOptionId)
    mockUseRideFlow.mockReturnValue({ state: currentState, dispatch: mockFlowDispatch })
    rerender(createElement(HomeMapScreen))

    // Exactly ONE tag remains — now showing the paged route's archetype.
    await waitFor(() => {
      expect(queryAllByTestId('route-tag').length).toBe(1)
    })
    // The single remaining tag carries the paged route's archetype + distance.
    // 64_000m / 1609.34 = 39.77 → Math.round === 40
    expect(getByText(/Twisties.*40mi/)).toBeTruthy()
  })
})
