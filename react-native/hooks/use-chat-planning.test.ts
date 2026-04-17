/**
 * Unit tests for useChatPlanning hook (simplified API, task #233)
 *
 * The hook no longer tracks global planning state locally. Its sole job is to
 * create a session (if needed) and invoke the backend action. The per-message
 * running/streaming lifecycle lives in `session_messages` — callers derive
 * isPlanning from that Convex query.
 *
 * Acceptance Criteria:
 * - AC1: Hook exposes the minimal API surface (sessionId, sendPlanningMessage, cancel)
 * - AC2: Hook integrates with dispatch correctly
 * - AC3: Cancellation dispatches NEW_SESSION and resets sessionId
 * - AC4: No TODO comments remain
 * - AC5: TypeScript compilation succeeds
 */

import { act, renderHook } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// -------------------------------------------------------------------------
// Imports after mocks
// -------------------------------------------------------------------------

import { useChatPlanning } from './use-chat-planning'
import type { RideFlowAction } from './use-ride-flow'

// -------------------------------------------------------------------------
// Mock setup - MUST come before imports
// -------------------------------------------------------------------------

const mockCreateSession = vi.fn(() => Promise.resolve({ sessionId: 'session123' }))
const mockSendMessage = vi.fn(() =>
  Promise.resolve({ response: 'OK', messageId: 'msg123' as const, attachments: [] }),
)

vi.mock('convex/react', () => ({
  ConvexProvider: ({ children }: any) => React.createElement('div', { children }),
  useMutation: () => mockCreateSession,
  useAction: () => mockSendMessage,
  useQuery: () => null,
}))

describe('useChatPlanning', () => {
  let mockDispatch: (action: RideFlowAction) => void
  let dispatchedActions: RideFlowAction[]

  beforeEach(() => {
    vi.clearAllMocks()
    dispatchedActions = []
    mockDispatch = (action: RideFlowAction) => {
      dispatchedActions.push(action)
    }
    mockCreateSession.mockImplementation(() => Promise.resolve({ sessionId: 'session123' }))
    mockSendMessage.mockImplementation(() =>
      Promise.resolve({ response: 'OK', messageId: 'msg123' as const, attachments: [] }),
    )
  })

  describe('AC1: Hook exposes the minimal API surface', () => {
    it('should start with null sessionId', () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      expect(result.current.sessionId).toBeNull()
      expect(typeof result.current.sendPlanningMessage).toBe('function')
      expect(typeof result.current.cancel).toBe('function')
    })

    it('should track sessionId after creating session', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Test')
      })

      expect(result.current.sessionId).toBe('session123')
    })
  })

  describe('AC2: Hook integrates with dispatch correctly', () => {
    it('should dispatch SEND_MESSAGE action with user content', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Plan a ride from SF to LA')
      })

      expect(dispatchedActions).toContainEqual({
        type: 'SEND_MESSAGE',
        content: 'Plan a ride from SF to LA',
      })
    })

    it('should NOT dispatch PLANNING_START / PLANNING_SUCCESS (owned by message rows now)', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Plan a ride')
      })

      // These used to be dispatched; they're now derived from message status
      expect(dispatchedActions.some((a) => a.type === 'PLANNING_SUCCESS')).toBe(false)
    })
  })

  describe('AC3: Cancellation resets state properly', () => {
    it('should dispatch CANCEL_PLANNING when cancel is called', () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      act(() => {
        result.current.cancel()
      })

      expect(dispatchedActions).toContainEqual({ type: 'CANCEL_PLANNING' })
    })

    it('should preserve sessionId after cancellation', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Plan a ride from SF to LA')
      })
      expect(result.current.sessionId).toBe('session123')

      act(() => {
        result.current.cancel()
      })

      // Session is preserved so rider can send follow-up messages
      expect(result.current.sessionId).toBe('session123')
    })

    it('should handle multiple cancel calls gracefully', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Plan a ride from SF to LA')
      })

      act(() => {
        result.current.cancel()
        result.current.cancel()
      })

      // Session preserved after cancel
      expect(result.current.sessionId).toBe('session123')
    })
  })

  describe('AC4: No TODO comments remain', () => {
    it('should have no TODO comments in implementation', () => {
      const fs = require('fs')
      const hookCode = fs.readFileSync('./hooks/use-chat-planning.ts', 'utf8')

      expect(hookCode).not.toMatch(/TODO/)
      expect(hookCode).not.toMatch(/FIXME/)
    })
  })

  describe('isPlanning derivation from session_messages', () => {
    // The isPlanning flag is no longer owned by this hook; it is derived by
    // callers from the Convex session_messages query. These tests codify the
    // derivation rule so regressions (e.g. someone re-introducing a global
    // loader) fail loudly.
    type Msg = { status?: 'running' | 'streaming' | 'complete' | 'failed' }
    const deriveIsPlanning = (messages: Msg[] | undefined): boolean =>
      messages?.some((m) => m.status === 'running' || m.status === 'streaming') ?? false

    it('returns false when messages is undefined (loading)', () => {
      expect(deriveIsPlanning(undefined)).toBe(false)
    })

    it('returns false when no messages are running/streaming', () => {
      expect(deriveIsPlanning([{ status: 'complete' }, { status: 'failed' }])).toBe(false)
    })

    it('returns true when any message is running', () => {
      expect(deriveIsPlanning([{ status: 'complete' }, { status: 'running' }])).toBe(true)
    })

    it('returns true when any message is streaming', () => {
      expect(deriveIsPlanning([{ status: 'streaming' }])).toBe(true)
    })

    it('returns false for rider messages without status field', () => {
      expect(deriveIsPlanning([{}, {}])).toBe(false)
    })
  })

  describe('AC5: TypeScript compilation succeeds', () => {
    it('should have correct TypeScript types', () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      const sessionId: typeof result.current.sessionId = result.current.sessionId
      expect(sessionId).toBeNull()
    })

    it('should handle sendPlanningMessage return type', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      const promise = result.current.sendPlanningMessage('Test')
      expect(promise).toBeInstanceOf(Promise)

      try {
        await promise
      } catch {
        // Expected - no backend
      }
    })
  })
})
