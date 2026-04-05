/**
 * Unit tests for useActiveSessionRoute hook (task #256)
 *
 * Verifies the reactive subscription chain:
 *   session → latest routing_card message → route_plans.getPlanById
 *
 * Uses vi.mock to stub convex/react and contexts/selected-route so tests
 * run outside a React Native / Convex provider tree.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// ---------------------------------------------------------------------------
// Mock convex/react — must be defined before imports that use it
// ---------------------------------------------------------------------------

// Track what args each useQuery call receives so tests can assert on them
const mockQueryResults: Map<string, unknown> = new Map()

vi.mock('convex/react', () => ({
  useQuery: vi.fn((queryRef: unknown, args: unknown) => {
    // Return a value keyed by args JSON for test control
    const key = JSON.stringify(args)
    return mockQueryResults.get(key) ?? mockQueryResults.get('__default__')
  }),
}))

// ---------------------------------------------------------------------------
// Mock the contexts/selected-route module
// ---------------------------------------------------------------------------

let mockSelectedRouteId: string | null = null
let mockSetSelectedRouteId: (id: string | null) => void = vi.fn()

vi.mock('../contexts/selected-route', () => ({
  useSelectedRoute: () => ({
    selectedRouteId: mockSelectedRouteId,
    setSelectedRouteId: mockSetSelectedRouteId,
  }),
}))

// ---------------------------------------------------------------------------
// Imports after mocks
// ---------------------------------------------------------------------------

import { useActiveSessionRoute } from './use-active-session-route'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type MockMessage = {
  _id: string
  kind: string
  createdAt: number
  attachments?: Array<{ routePlanId?: string }>
}

function makePlanDoc(routeOptionIds: string[] = ['opt-1']) {
  return {
    _id: 'plan-1',
    status: 'completed' as const,
    result: {
      planId: 'plan-1',
      options: routeOptionIds.map((id, i) => ({
        routeOptionId: id,
        label: `Route ${i + 1}`,
        rationale: 'Test route',
        stats: { distanceMeters: 1000, durationSeconds: 300, legsCount: 1 },
        map: {
          bounds: { north: 1, south: 0, east: 1, west: 0 },
          overviewGeometry: { value: 'abc' },
          legs: [],
        },
        overlaysPreview: {
          windSummary: {} as never,
          rainSummary: {} as never,
          temperatureSummary: {} as never,
          conditionsStatus: 'ok' as const,
        },
      })),
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useActiveSessionRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockQueryResults.clear()
    mockSelectedRouteId = null
    mockSetSelectedRouteId = vi.fn()
  })

  describe('loading state', () => {
    it('returns loading result (undefined routePlan) while sessions list is loading', () => {
      // useQuery returns undefined by default = loading
      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.routePlan).toBeUndefined()
      expect(result.current.options).toEqual([])
      expect(result.current.activeOption).toBeNull()
    })

    it('returns loading result while messages query is loading', () => {
      // sessions loaded but messages still pending
      mockQueryResults.set('{}', [{ _id: 'sess-1' }])
      mockQueryResults.set(JSON.stringify({ sessionId: 'sess-1' }), undefined)

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.routePlan).toBeUndefined()
      expect(result.current.options).toEqual([])
    })
  })

  describe('empty/no-session state', () => {
    it('returns null routePlan when sessions list is empty', () => {
      mockQueryResults.set('{}', []) // empty sessions list

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.routePlan).toBeNull()
      expect(result.current.options).toEqual([])
      expect(result.current.activeOption).toBeNull()
    })

    it('returns null routePlan when no routing_card message exists', () => {
      mockQueryResults.set('{}', [{ _id: 'sess-1' }])
      // messages list has only a user message, no routing_card
      const msgs: MockMessage[] = [
        { _id: 'msg-1', kind: 'user', createdAt: 1 },
        { _id: 'msg-2', kind: 'assistant_text', createdAt: 2 },
      ]
      mockQueryResults.set(JSON.stringify({ sessionId: 'sess-1' }), msgs)

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.routePlan).toBeNull()
      expect(result.current.options).toEqual([])
      expect(result.current.activeOption).toBeNull()
    })
  })

  describe('active option selection', () => {
    it('returns activeOption = options[0] when no selectedRouteId is set', () => {
      const planDoc = makePlanDoc(['opt-1', 'opt-2'])

      mockQueryResults.set('{}', [{ _id: 'sess-1' }])
      const msgs: MockMessage[] = [
        {
          _id: 'msg-3',
          kind: 'routing_card',
          createdAt: 3,
          attachments: [{ routePlanId: 'plan-1' }],
        },
      ]
      mockQueryResults.set(JSON.stringify({ sessionId: 'sess-1' }), msgs)
      mockQueryResults.set(JSON.stringify({ routePlanId: 'plan-1' }), planDoc)

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.activeOption?.routeOptionId).toBe('opt-1')
    })

    it('returns the matching option when selectedRouteId matches an option', () => {
      mockSelectedRouteId = 'opt-2'
      const planDoc = makePlanDoc(['opt-1', 'opt-2', 'opt-3'])

      mockQueryResults.set('{}', [{ _id: 'sess-1' }])
      const msgs: MockMessage[] = [
        {
          _id: 'msg-3',
          kind: 'routing_card',
          createdAt: 3,
          attachments: [{ routePlanId: 'plan-1' }],
        },
      ]
      mockQueryResults.set(JSON.stringify({ sessionId: 'sess-1' }), msgs)
      mockQueryResults.set(JSON.stringify({ routePlanId: 'plan-1' }), planDoc)

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.activeOption?.routeOptionId).toBe('opt-2')
    })

    it('falls back to options[0] when selectedRouteId does not match any option', () => {
      mockSelectedRouteId = 'opt-999' // non-existent
      const planDoc = makePlanDoc(['opt-1', 'opt-2'])

      mockQueryResults.set('{}', [{ _id: 'sess-1' }])
      const msgs: MockMessage[] = [
        {
          _id: 'msg-3',
          kind: 'routing_card',
          createdAt: 3,
          attachments: [{ routePlanId: 'plan-1' }],
        },
      ]
      mockQueryResults.set(JSON.stringify({ sessionId: 'sess-1' }), msgs)
      mockQueryResults.set(JSON.stringify({ routePlanId: 'plan-1' }), planDoc)

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.activeOption?.routeOptionId).toBe('opt-1')
    })
  })

  describe('latest routing_card selection', () => {
    it('picks the newest routing_card when multiple exist', () => {
      const planDocOld = makePlanDoc(['old-opt-1'])
      const planDocNew = makePlanDoc(['new-opt-1'])

      mockQueryResults.set('{}', [{ _id: 'sess-1' }])
      // ascending order (oldest first); hook reverses to find newest
      const msgs: MockMessage[] = [
        {
          _id: 'msg-1',
          kind: 'routing_card',
          createdAt: 1,
          attachments: [{ routePlanId: 'old-plan' }],
        },
        {
          _id: 'msg-2',
          kind: 'routing_card',
          createdAt: 2,
          attachments: [{ routePlanId: 'new-plan' }],
        },
      ]
      mockQueryResults.set(JSON.stringify({ sessionId: 'sess-1' }), msgs)
      mockQueryResults.set(JSON.stringify({ routePlanId: 'old-plan' }), planDocOld)
      mockQueryResults.set(JSON.stringify({ routePlanId: 'new-plan' }), planDocNew)

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.activeOption?.routeOptionId).toBe('new-opt-1')
    })
  })

  describe('selectRoute callback', () => {
    it('exposes selectedRouteId from context', () => {
      mockSelectedRouteId = 'some-route'

      const { result } = renderHook(() => useActiveSessionRoute())

      expect(result.current.selectedRouteId).toBe('some-route')
    })

    it('calls setSelectedRouteId when selectRoute is invoked', () => {
      mockSelectedRouteId = null

      const { result } = renderHook(() => useActiveSessionRoute())

      act(() => {
        result.current.selectRoute('opt-42')
      })

      expect(mockSetSelectedRouteId).toHaveBeenCalledWith('opt-42')
    })
  })

  describe('explicit sessionId prop', () => {
    it('skips listSessions query when sessionId is provided', () => {
      const planDoc = makePlanDoc(['opt-a'])
      const msgs: MockMessage[] = [
        {
          _id: 'msg-1',
          kind: 'routing_card',
          createdAt: 1,
          attachments: [{ routePlanId: 'plan-x' }],
        },
      ]
      mockQueryResults.set(JSON.stringify({ sessionId: 'pinned-session' }), msgs)
      mockQueryResults.set(JSON.stringify({ routePlanId: 'plan-x' }), planDoc)

      const { result } = renderHook(() =>
        useActiveSessionRoute('pinned-session' as never)
      )

      expect(result.current.activeOption?.routeOptionId).toBe('opt-a')
    })
  })
})
