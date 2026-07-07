/**
 * REDHAT-FIX-003 / DTL-001 Integration Tests: Discovery tap navigates to detail, camera fits, typed send
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL goToCuratedRoute, doFit, and
 * handleSendMessage wiring. Only the native map boundary (rnmapbox /
 * MapboxMapView), Convex/network hooks, and unrelated UI are mocked.
 *
 * The discovery pill tap path (goToCuratedRoute → router.push the
 * curated-route detail screen) is driven end-to-end: the test taps the real
 * `discovery-suggestion-pill-{routeId}`, then asserts router.push was called
 * with the detail-page path — exactly the production navigation order.
 *
 * ChatInput is a faithful adapter: it renders the discovery pills index.tsx
 * passes via `suggestions` (invoking the real `onSelectRoute`), plus a text
 * input + send button that invoke the real `onSend` — the production
 * ChatInput contract.
 *
 * AC-3 (tapNavigatesToCuratedDetail + cameraFitsTappedRouteIncludingCentroid + typedMessageStillSends):
 *   - tapping discovery-suggestion-pill pushes /curated-route/{id} with no chat message
 *   - centroid route → setCameraPosition zoom 12; multi-point → fitToCoordinates coords.length > 1
 *   - typed send → sendPlanningMessage invoked once with the typed text
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
  mockUseActiveSessionRoute,
  mockUseRideFlow,
  mockFitToCoordinates,
  mockSetCameraPosition,
  mockMapRef,
  mockSetSelectedRouteId,
  mockSetDisplayedRoutePlanId,
  mockRouterPush,
} = setupHomeScreenMocks()

// ---------------------------------------------------------------------------
// Scenario-specific hooks (return shapes differ per suite)
// ---------------------------------------------------------------------------

const mockSendPlanningMessage = vi.fn()
vi.mock('../../../hooks/use-chat-planning', () => ({
  useChatPlanning: () => ({
    sendPlanningMessage: mockSendPlanningMessage,
    cancel: vi.fn(),
    sessionId: null,
    resetSession: vi.fn(),
  }),
}))

const mockUseCuratedDiscovery = vi.fn()
vi.mock('../../../hooks/use-curated-discovery', () => ({
  useCuratedDiscovery: (...args: unknown[]) => mockUseCuratedDiscovery(...args),
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
vi.mock('../../../components/map/route-tag', () => ({ RouteTag: () => null }))
vi.mock('../../../components/sheets/route-details-sheet', () => ({
  RouteDetailsSheet: () => null,
}))
vi.mock('../../../components/ui/save-favorite-sheet', () => ({
  SaveRouteSheet: () => null,
}))

// ChatInput: faithful adapter — renders discovery pills from `suggestions`
// (invoking the real `onSelectRoute(routeId)`) AND a text input + send button
// (invoking the real `onSend(text)`). Honours the production ChatInput contract
// so the index.tsx wiring under test is exercised through real handler props.
vi.mock('../../../components/chat', () => {
  const { createElement, useState } = require('react')
  const { TouchableOpacity, View, Text, TextInput } = require('react-native')
  return {
    ChatInput: (props: any) => {
      const [text, setText] = useState('')
      const suggestions: any[] = props.suggestions ?? []
      const pills = suggestions
        .filter((s) => s?.routeId)
        .map((s) =>
          createElement(
            TouchableOpacity,
            {
              key: `discovery-suggestion-pill-${s.routeId}`,
              testID: `discovery-suggestion-pill-${s.routeId}`,
              onPress: () => props.onSelectRoute?.(s.routeId),
              accessibilityRole: 'button',
            },
            createElement(Text, null, s.label ?? s.routeId),
          ),
        )
      return createElement(View, { testID: props.testID ?? 'chat-input' }, [
        ...pills,
        createElement(TextInput, {
          key: 'chat-input-field',
          testID: 'chat-input-field',
          value: text,
          onChangeText: (t: string) => setText(t),
        }),
        createElement(
          TouchableOpacity,
          {
            key: 'chat-send-button',
            testID: 'chat-send-button',
            onPress: () => {
              if (text.trim().length > 0) props.onSend?.(text)
            },
            accessibilityRole: 'button',
          },
          createElement(Text, null, 'Send'),
        ),
      ])
    },
  }
})

vi.mock('../../../components/ui/chat-transcript', () => ({ ChatTranscript: () => null }))

const mockFlowDispatch = vi.fn()

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CURATED_ROUTE = {
  id: 'curated-1',
  name: 'Skyline Drive',
  lat: 36.85,
  lng: -121.4,
  archetype: 'scenic' as const,
  score: 0.82,
  distanceMi: 78,
}

// Multi-point polyline → 3 coords (renders home-route-polyline--segment-*).
const multiPointPolyline = 'c|peFf`ejVnqPn}@ryPn}@'
// Centroid polyline → 1 coord [{lat:36.85, lng:-121.40}] (doFit centroid branch).
const centroidPolyline = 'og|_F~|}cV'

/** A resolved curated active option as useActiveSessionRoute would return it. */
const buildCuratedActiveOption = (encodedPolyline: string, legsCount: number) => ({
  routeOptionId: `curated-${CURATED_ROUTE.id}`,
  label: 'Skyline Drive',
  rationale: 'Scenic curated route',
  stats: { distanceMeters: 125_000, durationSeconds: 7200, legsCount },
  map: {
    bounds: {
      northeast: { lat: 37.85, lng: -122.42 },
      southwest: { lat: 36.84, lng: -121.41 },
    },
    overviewGeometry: {
      format: 'polyline' as const,
      encoding: 'google',
      precision: 5,
      value: encodedPolyline,
    },
    legs:
      legsCount > 0
        ? [
            {
              geometry: {
                format: 'polyline' as const,
                encoding: 'google',
                precision: 5,
                value: encodedPolyline,
              },
              legIndex: 0,
              startLabel: 'Start',
              endLabel: 'End',
              distanceMeters: 125_000,
              durationSeconds: 7200,
            },
          ]
        : [],
    overlays: {},
  },
  overlaysPreview: {
    windSummary: 'low',
    rainSummary: 'none',
    temperatureSummary: 'mild',
    conditionsStatus: 'ok',
  },
})

const buildCompletedPlan = (option: any, planId: string) => ({
  _id: planId,
  status: 'completed',
  startLabel: 'Start',
  endLabel: 'End',
  planInput: {
    start: { lat: 36.85, lng: -121.4, label: 'Start' },
    end: { lat: 37.0, lng: -122.0, label: 'End' },
  },
  result: { options: [option] },
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DTL-001: Discovery tap navigates to detail, camera fits, typed send', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendPlanningMessage.mockClear()
    mockRouterPush.mockClear()
    mockFitToCoordinates.mockClear()
    mockSetCameraPosition.mockClear()
    mockMapRef.current.fitToCoordinates = mockFitToCoordinates
    mockMapRef.current.setCameraPosition = mockSetCameraPosition

    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: null,
      routePlan: null,
      newestRoutePlanId: null,
    })
    mockUseCuratedDiscovery.mockReturnValue({
      isLoading: false,
      isEmpty: false,
      routes: [CURATED_ROUTE],
    })
    mockUseRideFlow.mockReturnValue({
      state: { phase: 'IDLE' as const, sessionId: 'test-session' },
      dispatch: mockFlowDispatch,
    })
    mockUseQuery.mockReturnValue([])

    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3a: tapping a discovery pill navigates to the curated-route detail page
  // ─────────────────────────────────────────────────────────────────────────
  it('tapNavigatesToCuratedDetail', async () => {
    // Start with no active route; the discovery pill is rendered from
    // useCuratedDiscovery.
    const { findByTestId } = render(createElement(HomeMapScreen))

    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Tap → goToCuratedRoute → router.push the detail page.
    fireEvent.press(pill)

    // THEN: router.push was called with the curated-route detail path.
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
      expect(mockRouterPush).toHaveBeenCalledWith(`/(app)/curated-route/${CURATED_ROUTE.id}`)
    })

    // AND: no chat message was appended — the chat-send path was NOT taken.
    expect(mockSendPlanningMessage).not.toHaveBeenCalled()
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3b: camera fits the tapped route — centroid (zoom 12) AND multi-point
  // ─────────────────────────────────────────────────────────────────────────
  it('cameraFitsTappedRouteIncludingCentroid', async () => {
    // ── Centroid branch: a centroid-only curated route frames at zoom 12 ──
    const centroidOption = buildCuratedActiveOption(centroidPolyline, 0)
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: centroidOption,
      routePlan: buildCompletedPlan(centroidOption, 'plan-curated-1'),
      newestRoutePlanId: 'plan-curated-1',
    })

    const { rerender } = render(createElement(HomeMapScreen))

    // doFit takes the centroid branch → setCameraPosition with zoom 12.
    await waitFor(() => {
      expect(mockSetCameraPosition).toHaveBeenCalled()
    })
    const centroidCall =
      mockSetCameraPosition.mock.calls[mockSetCameraPosition.mock.calls.length - 1]
    expect(centroidCall[0].zoom).toBe(12)
    expect(centroidCall[0].coordinates.latitude).toBeCloseTo(36.85, 1)
    expect(centroidCall[0].coordinates.longitude).toBeCloseTo(-121.4, 1)

    // ── Multi-point branch: a multi-point route fits via fitToCoordinates ──
    mockSetCameraPosition.mockClear()
    mockFitToCoordinates.mockClear()

    const multiPointOption = buildCuratedActiveOption(multiPointPolyline, 1)
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: multiPointOption,
      routePlan: buildCompletedPlan(multiPointOption, 'plan-curated-2'),
      newestRoutePlanId: 'plan-curated-2',
    })
    rerender(createElement(HomeMapScreen))

    // doFit takes the multi-point branch → fitToCoordinates with >1 coord.
    await waitFor(() => {
      expect(mockFitToCoordinates).toHaveBeenCalled()
    })
    const fitCall = mockFitToCoordinates.mock.calls[mockFitToCoordinates.mock.calls.length - 1]
    const coords = fitCall[0] as Array<{ latitude: number; longitude: number }>
    expect(coords.length).toBeGreaterThan(1)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3d: clear route resets route state and recenters on rider
  // ─────────────────────────────────────────────────────────────────────────
  it('clearRouteRecentersOnCurrentLocation', async () => {
    const multiPointOption = buildCuratedActiveOption(multiPointPolyline, 1)
    mockUseActiveSessionRoute.mockReturnValue({
      activeOption: multiPointOption,
      routePlan: buildCompletedPlan(multiPointOption, 'plan-curated-clear'),
      newestRoutePlanId: 'plan-curated-clear',
    })

    const { getByTestId } = render(createElement(HomeMapScreen))

    await waitFor(() => {
      expect(getByTestId('control-clear')).toBeTruthy()
    })
    mockSetCameraPosition.mockClear()

    fireEvent.press(getByTestId('control-clear'))

    expect(mockSetSelectedRouteId).toHaveBeenCalledWith(null)
    expect(mockSetDisplayedRoutePlanId).toHaveBeenCalledWith(null)
    expect(mockFlowDispatch).toHaveBeenCalledWith({ type: 'NEW_SESSION' })
    expect(mockSetCameraPosition).toHaveBeenCalledWith({
      coordinates: { latitude: 37.7749, longitude: -122.4194 },
      zoom: 12.5,
      duration: 300,
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-3c: typing a message and pressing send still sends it
  // ─────────────────────────────────────────────────────────────────────────
  it('typedMessageStillSends', async () => {
    const { findByTestId } = render(createElement(HomeMapScreen))

    const input = await findByTestId('chat-input-field')
    const sendButton = await findByTestId('chat-send-button')

    // Type a real message (non-empty so the adapter routes it to onSend).
    fireEvent.changeText(input, 'twisties near Asheville')

    // Before send: no chat message has been sent.
    expect(mockSendPlanningMessage).not.toHaveBeenCalled()

    // Press send → handleSendMessage → sendPlanningMessage(message).
    fireEvent.press(sendButton)

    // THEN: the chat-send path fires exactly once with the typed text.
    // (In production this appends a session_messages row → transcript N+1.)
    expect(mockSendPlanningMessage).toHaveBeenCalledTimes(1)
    expect(mockSendPlanningMessage.mock.calls[0][0]).toBe('twisties near Asheville')
  })
})
