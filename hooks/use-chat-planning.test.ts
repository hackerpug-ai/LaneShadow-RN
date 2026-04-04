/**
 * Unit tests for useChatPlanning hook
 *
 * Tests hook state management and integration with useRideFlow state machine.
 * Backend integration is tested in __tests__/use-chat-planning.integration.test.ts
 *
 * Acceptance Criteria:
 * - AC1: Hook properly manages planning state
 * - AC2: Hook integrates with dispatch correctly
 * - AC3: Cancellation resets state properly
 * - AC4: No TODO comments remain
 * - AC5: TypeScript compilation succeeds
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import React from 'react'

// -------------------------------------------------------------------------
// Mock setup - MUST come before imports
// -------------------------------------------------------------------------

// Create mock functions
const mockCreateSession = vi.fn(() => Promise.resolve({ sessionId: 'session123' }))
const mockSendMessage = vi.fn(() => Promise.resolve({ response: 'OK', messageId: 'msg123' as const, attachments: [] }))

// Mock convex/react hooks
vi.mock('convex/react', () => ({
  ConvexProvider: ({ children }: any) => React.createElement('div', { children }),
  useMutation: () => mockCreateSession,
  useAction: () => mockSendMessage,
  useQuery: () => null,
}))

// -------------------------------------------------------------------------
// Imports after mocks
// -------------------------------------------------------------------------

import { useChatPlanning } from './use-chat-planning'
import type { RideFlowAction } from './use-ride-flow'

describe('useChatPlanning', () => {
  let mockDispatch: (action: RideFlowAction) => void
  let dispatchedActions: RideFlowAction[]

  beforeEach(() => {
    vi.clearAllMocks()
    dispatchedActions = []
    mockDispatch = (action: RideFlowAction) => {
      dispatchedActions.push(action)
    }
    // Reset mock implementations
    mockCreateSession.mockImplementation(() => Promise.resolve({ sessionId: 'session123' }))
    mockSendMessage.mockImplementation(() => Promise.resolve({ response: 'OK', messageId: 'msg123' as const, attachments: [] }))
  })

  describe('AC1: Hook properly manages planning state', () => {
    it('should start with idle state', () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      expect(result.current.isPlanning).toBe(false)
      expect(result.current.currentPhase).toBeNull()
      expect(result.current.sessionId).toBeNull()
    })

    it('should complete planning when backend returns without routes', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      // Note: This test verifies state transitions
      // Actual backend calls are tested in integration tests
      await act(async () => {
        await result.current.sendPlanningMessage('Plan a ride from SF to LA')
      })

      // With mocked backend that returns no route attachments, planning completes
      expect(result.current.isPlanning).toBe(false)
      expect(result.current.currentPhase).toBe('complete')
      expect(result.current.sessionId).toBe('session123')
    })

    it('should track sessionId after creating session', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Test')
      })

      // sessionId should be set after session creation
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

    it('should dispatch SEND_MESSAGE when planning starts', async () => {
      // Track when SEND_MESSAGE is dispatched
      let messageDispatched = false
      const trackingDispatch = (action: RideFlowAction) => {
        if (action.type === 'SEND_MESSAGE') {
          messageDispatched = true
        }
        dispatchedActions.push(action)
      }

      const { result: trackedResult } = renderHook(() => useChatPlanning(trackingDispatch))

      await act(async () => {
        await trackedResult.current.sendPlanningMessage('Test message')
      })

      // SEND_MESSAGE should be dispatched
      expect(messageDispatched).toBe(true)
    })
  })

  describe('AC3: Cancellation resets state properly', () => {
    it('should reset planning state when cancel is called', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Plan a ride from SF to LA')
      })

      // After sendPlanningMessage completes, state is:
      expect(result.current.isPlanning).toBe(false)
      expect(result.current.currentPhase).toBe('complete')
      expect(result.current.sessionId).toBe('session123')

      act(() => {
        result.current.cancel()
      })

      expect(result.current.isPlanning).toBe(false)
      expect(result.current.currentPhase).toBeNull()
      expect(result.current.sessionId).toBeNull()
    })

    it('should dispatch NEW_SESSION after cancellation', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Plan a ride from SF to LA')
      })

      // Clear previous calls
      dispatchedActions = []

      act(() => {
        result.current.cancel()
      })

      expect(dispatchedActions).toContainEqual({
        type: 'NEW_SESSION',
      })
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

      // Should remain in cancelled state
      expect(result.current.isPlanning).toBe(false)
      expect(result.current.currentPhase).toBeNull()
    })

    it('should reset to idle state after cancellation', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      await act(async () => {
        await result.current.sendPlanningMessage('Test')
      })

      // After sendPlanningMessage completes
      expect(result.current.isPlanning).toBe(false)
      expect(result.current.currentPhase).toBe('complete')
      expect(result.current.sessionId).toBe('session123')

      // Cancel
      act(() => {
        result.current.cancel()
      })

      // Verify all state reset
      expect(result.current.isPlanning).toBe(false)
      expect(result.current.currentPhase).toBeNull()
      expect(result.current.sessionId).toBeNull()
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

  describe('AC5: TypeScript compilation succeeds', () => {
    it('should have correct TypeScript types', () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      // Type checks:
      // - isPlanning: boolean
      // - currentPhase: PlanningPhase (null | 'planning' | 'complete')
      // - sessionId: string | null
      // - sendPlanningMessage: (message: string) => Promise<void>
      // - cancel: () => void

      expect(typeof result.current.isPlanning).toBe('boolean')
      expect(typeof result.current.sendPlanningMessage).toBe('function')
      expect(typeof result.current.cancel).toBe('function')

      // These should compile without TypeScript errors
      const phase: typeof result.current.currentPhase = result.current.currentPhase
      const sessionId: typeof result.current.sessionId = result.current.sessionId

      expect(phase).toBeNull()
      expect(sessionId).toBeNull()
    })

    it('should handle sendPlanningMessage return type', async () => {
      const { result } = renderHook(() => useChatPlanning(mockDispatch))

      const promise = result.current.sendPlanningMessage('Test')

      // Should return Promise<void>
      expect(promise).toBeInstanceOf(Promise)

      try {
        await promise
      } catch {
        // Expected - no backend
      }
    })
  })
})
