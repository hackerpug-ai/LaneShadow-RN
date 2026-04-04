import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useChatSession } from './use-chat-session'
import type { RideFlowState } from './use-ride-flow'

describe('useChatSession', () => {
  it('should return empty messages for idle state', () => {
    const { result } = renderHook(() =>
      useChatSession(null, { phase: 'IDLE', sessionId: null, routeOptions: null, selectedRouteId: null })
    )

    expect(result.current.messages).toEqual([])
    expect(result.current.isEmpty).toBe(true)
  })

  it('should return messages for route results state', () => {
    const mockState: RideFlowState = {
      phase: 'ROUTE_RESULTS',
      sessionId: 'test-session',
      routeOptions: {
        planId: 'test-plan',
        options: [],
      },
      selectedRouteId: null,
    }

    const { result } = renderHook(() =>
      useChatSession('test-session', mockState)
    )

    expect(result.current.messages.length).toBeGreaterThan(0)
    expect(result.current.isEmpty).toBe(false)
  })
})
