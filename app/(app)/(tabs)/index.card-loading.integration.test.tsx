/**
 * REDHAT-FIX-003 / RUX-007 Integration Tests: Curated card tap loading + no chat message
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL handleSelectCuratedRoute wiring. Only the native
 * map boundary (rnmapbox / MapboxMapView), Convex/network hooks, and unrelated
 * UI are mocked.
 *
 * The `createCuratedPlan` Convex mutation is driven by a CONTROLLABLE promise
 * so the test can observe the indicator WHILE pending and AFTER resolve.
 * MapPlanningIndicator is stubbed as a conditional adapter that renders its
 * testID only when `visible` — mirroring the production
 * `if (!visible) return null` contract.
 *
 * ChatInput is stubbed as a faithful adapter that renders the discovery pills
 * index.tsx passes via `suggestions` and invokes the real `onSelectRoute`
 * prop — the same contract the production ChatInput honours. This exercises
 * the index.tsx → handleSelectCuratedRoute → createCuratedPlan wiring (NOT the
 * handleSendMessage / sendPlanningMessage chat-send path).
 *
 * AC-2 (cardTapShowsThenHidesMapPlanningIndicator + cardTapDoesNotAppendChatMessage):
 *   - map-planning-indicator present while createCuratedPlan pending, absent after resolve
 *   - transcript message count delta === 0 (sendPlanningMessage NOT invoked;
 *     createCuratedPlan IS invoked — the curated path, not the chat path)
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

// Capture the chat-send spy so the "no chat message" assertion is observable.
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

// MapPlanningIndicator: conditional adapter — renders testID only when visible
// (mirrors production `if (!visible) return null`).
vi.mock('../../../components/map/map-planning-indicator', () => {
  const { createElement } = require('react')
  return {
    MapPlanningIndicator: (props: any) =>
      props.visible
        ? createElement('View', { testID: props.testID ?? 'map-planning-indicator' })
        : null,
  }
})

vi.mock('../../../components/map/route-tag', () => ({ RouteTag: () => null }))
vi.mock('../../../components/sheets/route-details-sheet', () => ({
  RouteDetailsSheet: () => null,
}))
vi.mock('../../../components/ui/save-favorite-sheet', () => ({
  SaveRouteSheet: () => null,
}))

// ChatInput: faithful adapter — renders the discovery pills index.tsx passes
// via `suggestions` and invokes the real `onSelectRoute(routeId)` prop on
// press (the production contract). This exercises the index.tsx →
// handleSelectCuratedRoute wiring under test.
vi.mock('../../../components/chat', () => {
  const { createElement } = require('react')
  const { TouchableOpacity, View, Text } = require('react-native')
  return {
    ChatInput: (props: any) => {
      const suggestions: any[] = props.suggestions ?? []
      return createElement(View, { testID: props.testID ?? 'chat-input' }, [
        ...suggestions
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
          ),
      ])
    },
  }
})

// ChatTranscript: adapter that surfaces the rendered message count so the
// "transcript count delta === 0" is observable when the transcript mounts.
vi.mock('../../../components/ui/chat-transcript', () => {
  const { createElement } = require('react')
  return {
    ChatTranscript: (props: any) =>
      createElement('View', {
        testID: `chat-transcript-count-${props.messages?.length ?? 0}`,
      }),
  }
})

const mockFlowDispatch = vi.fn()

// ---------------------------------------------------------------------------
// Controllable createCuratedPlan mutation
// ---------------------------------------------------------------------------

let resolveCreateCuratedPlan: (value: { routePlanId: string }) => void = () => {}
const mockCreateCuratedPlan = vi.fn(
  () =>
    new Promise<{ routePlanId: string }>((resolve) => {
      resolveCreateCuratedPlan = resolve
    }),
)

// ---------------------------------------------------------------------------
// Fixtures — a curated discovery route (centroid-style single point)
// ---------------------------------------------------------------------------

const CURATED_ROUTE = {
  id: 'curated-1',
  name: 'Skyline Drive',
  lat: 36.85,
  lng: -121.4,
  archetype: 'scenic' as const,
  score: 0.82,
  distanceMi: 12,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RUX-007: Curated card tap shows/hides indicator + no chat message', () => {
  let HomeMapScreen: any

  afterEach(() => {
    cleanup()
  })

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSendPlanningMessage.mockClear()
    mockCreateCuratedPlan.mockClear()
    resolveCreateCuratedPlan = () => {}
    mockFitToCoordinates.mockClear()
    mockSetCameraPosition.mockClear()
    mockMapRef.current.fitToCoordinates = mockFitToCoordinates
    mockMapRef.current.setCameraPosition = mockSetCameraPosition

    // No agent-active route so MapPlanningIndicator's `!hasAgentRoute` term stays true.
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
    mockUseMutation.mockReturnValue(mockCreateCuratedPlan)

    const mod = await import('./index')
    HomeMapScreen = mod.default
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2a: indicator shown while createCuratedPlan pending, hidden after resolve
  // ─────────────────────────────────────────────────────────────────────────
  it('cardTapShowsThenHidesMapPlanningIndicator', async () => {
    const { queryByTestId, findByTestId } = render(createElement(HomeMapScreen))

    // The discovery pill renders from the curated route index.tsx resolved.
    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Before tap: no planning indicator.
    expect(queryByTestId('map-planning-indicator')).toBeNull()

    // Tap the curated discovery pill → handleSelectCuratedRoute →
    // setMapPlanningVisible(true) (chatMode is false) → mutation pending.
    fireEvent.press(pill)

    // WHILE pending: the indicator is shown.
    await waitFor(() => {
      expect(queryByTestId('map-planning-indicator')).not.toBeNull()
    })

    // Resolve the curated-plan mutation → finally block clears the indicator.
    resolveCreateCuratedPlan({ routePlanId: 'plan-curated-1' })

    // AFTER resolve: the indicator is gone (finally clears it explicitly).
    await waitFor(() => {
      expect(queryByTestId('map-planning-indicator')).toBeNull()
    })

    // And the curated-plan mutation was actually invoked (not a no-op).
    expect(mockCreateCuratedPlan).toHaveBeenCalledTimes(1)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2b: tapping a curated card does NOT append a chat transcript message
  // ─────────────────────────────────────────────────────────────────────────
  it('cardTapDoesNotAppendChatMessage', async () => {
    const { findByTestId } = render(createElement(HomeMapScreen))

    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Tap the curated discovery pill (the direct-plot path).
    fireEvent.press(pill)

    // Allow the async handleSelectCuratedRoute to run + the mutation to enqueue.
    resolveCreateCuratedPlan({ routePlanId: 'plan-curated-1' })
    await waitFor(() => {
      expect(mockCreateCuratedPlan).toHaveBeenCalledTimes(1)
    })

    // THEN: the chat-send path was NOT taken — no transcript message appended.
    // sendPlanningMessage is the production mechanism that writes a
    // session_messages row; the curated path uses createCuratedPlan instead.
    expect(mockSendPlanningMessage).not.toHaveBeenCalled()

    // Belt-and-braces: the curated mutation carried the real curated payload
    // (routeId + centroid + archetype + score), proving the curated branch —
    // not a chat-message round-trip — executed.
    const callArgs = mockCreateCuratedPlan.mock.calls[0][0] as Record<string, unknown>
    expect(callArgs.routeId).toBe(CURATED_ROUTE.id)
    expect(callArgs.compositeScore).toBe(CURATED_ROUTE.score)
  })
})
