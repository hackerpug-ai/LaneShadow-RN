/**
 * REDHAT-FIX-003 / DTL-001 Integration Tests: Discovery pill tap navigates to detail + no chat message
 *
 * Scenario-backed integration tests that render the REAL plan-view screen
 * (index.tsx) with the REAL goToCuratedRoute wiring. Only the native map
 * boundary (rnmapbox / MapboxMapView), Convex/network hooks, and unrelated
 * UI are mocked.
 *
 * ChatInput is stubbed as a faithful adapter that renders the discovery pills
 * index.tsx passes via `suggestions` and invokes the real `onSelectRoute`
 * prop — the same contract the production ChatInput honours. This exercises
 * the index.tsx → goToCuratedRoute → router.push wiring (NOT the
 * handleSendMessage / sendPlanningMessage chat-send path).
 *
 * AC-2 (pillTapNavigatesToCuratedDetail + pillTapDoesNotAppendChatMessage):
 *   - tapping a discovery-suggestion-pill pushes /(app)/curated-route/{id}
 *   - transcript message count delta === 0 (sendPlanningMessage NOT invoked;
 *     router.push IS invoked — the curated detail path, not the chat path)
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
  mockRouterPush,
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
// goToCuratedRoute wiring under test.
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

describe('DTL-001: Discovery pill tap navigates to detail + no chat message', () => {
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

    // No agent-active route so discovery pills render.
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
  // AC-2a: tapping a discovery pill pushes the curated-route detail page
  // ─────────────────────────────────────────────────────────────────────────
  it('pillTapNavigatesToCuratedDetail', async () => {
    const { findByTestId } = render(createElement(HomeMapScreen))

    // The discovery pill renders from the curated route index.tsx resolved.
    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Tap the curated discovery pill → goToCuratedRoute → router.push.
    fireEvent.press(pill)

    // THEN: router.push was called with the curated-route detail path.
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
      expect(mockRouterPush).toHaveBeenCalledWith(`/(app)/curated-route/${CURATED_ROUTE.id}`)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // AC-2b: tapping a curated pill does NOT append a chat transcript message
  // ─────────────────────────────────────────────────────────────────────────
  it('pillTapDoesNotAppendChatMessage', async () => {
    const { findByTestId } = render(createElement(HomeMapScreen))

    const pill = await findByTestId(`discovery-suggestion-pill-${CURATED_ROUTE.id}`)

    // Tap the curated discovery pill (the detail-navigation path).
    fireEvent.press(pill)

    // Allow the navigation to settle.
    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledTimes(1)
    })

    // THEN: the chat-send path was NOT taken — no transcript message appended.
    expect(mockSendPlanningMessage).not.toHaveBeenCalled()
  })
})
