import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'

import { useRouteComparison } from './use-route-comparison'
import type { RideFlowState } from './use-ride-flow'

// Mock useSemanticTheme so route-polyline can read semantic.color.* without
// needing the real styles/theme.ts pipeline (which depends on RNP's runtime
// theme assembly that is not wired through the vitest environment).
vi.mock('./use-semantic-theme', () => ({
  useSemanticTheme: () => ({
    semantic: {
      color: {
        routeSelected: { default: '#FF6B35' },
        routeAlternate: { default: '#60a5fa' },
        onSurface: { default: '#E6E0E9', muted: '#938F99' },
      },
    },
  }),
  useTheme: () => ({
    semantic: {
      color: {
        routeSelected: { default: '#FF6B35' },
        routeAlternate: { default: '#60a5fa' },
        onSurface: { default: '#E6E0E9', muted: '#938F99' },
      },
    },
  }),
}))

describe('useRouteComparison', () => {
  it('should return empty polylines for idle state', () => {
    const mockDispatch = vi.fn()

    const { result } = renderHook(() =>
      useRouteComparison(
        { phase: 'IDLE', sessionId: null, routeOptions: null, selectedRouteId: null },
        mockDispatch
      )
    )

    expect(result.current.polylines).toEqual([])
    expect(result.current.selectedRouteId).toBe(null)
  })

  it('should return polylines for route results state', () => {
    const mockDispatch = vi.fn()
    const mockState: RideFlowState = {
      phase: 'ROUTE_RESULTS',
      sessionId: 'test-session',
      routeOptions: {
        planId: 'test-plan',
        options: [
          {
            routeOptionId: 'route-1',
            label: 'Route 1',
            map: {
              overviewGeometry: { value: 'encoded-polyline' },
              bounds: { north: 0, south: 0, east: 0, west: 0 },
              legs: [],
            },
          } as any,
        ],
      },
      selectedRouteId: null,
    }

    const { result } = renderHook(() =>
      useRouteComparison(mockState, mockDispatch)
    )

    expect(result.current.polylines.length).toBe(1)
    expect(result.current.polylines[0].routeOptionId).toBe('route-1')
  })

  it('should provide selectRoute function', () => {
    const mockDispatch = vi.fn()

    const { result } = renderHook(() =>
      useRouteComparison(
        { phase: 'IDLE', sessionId: null, routeOptions: null, selectedRouteId: null },
        mockDispatch
      )
    )

    act(() => {
      result.current.selectRoute('test-route-id')
    })

    expect(mockDispatch).toHaveBeenCalledWith({
      type: 'SELECT_ROUTE',
      routeId: 'test-route-id',
    })
  })
})
