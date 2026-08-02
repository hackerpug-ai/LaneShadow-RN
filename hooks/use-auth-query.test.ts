/**
 * Proves useAuthQuery gates Convex useQuery on useConvexAuth — the real
 * shipped path that prevents requireIdentity UNAUTHENTICATED races.
 */
import { renderHook } from '@testing-library/react'
import React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('convex/react', () => ({
  ConvexProvider: ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
  useQuery: vi.fn(),
  useConvexAuth: vi.fn(),
}))

import { useConvexAuth, useQuery } from 'convex/react'
import { useAuthQuery } from './use-auth-query'

const mockUseQuery = vi.mocked(useQuery)
const mockUseConvexAuth = vi.mocked(useConvexAuth)

const QUERY_REF = { name: 'curatedRoutes:listCuratedRoutes' } as never

describe('useAuthQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips the underlying query while Convex auth is loading', () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: true, isAuthenticated: false })
    mockUseQuery.mockReturnValue(undefined)

    const { result } = renderHook(() =>
      useAuthQuery(QUERY_REF, { limit: 10, sort: 'best' }),
    )

    expect(mockUseQuery).toHaveBeenCalledWith(QUERY_REF, 'skip')
    expect(result.current.authLoading).toBe(true)
    expect(result.current.authRequired).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeUndefined()
  })

  it('skips the underlying query when Convex auth finished unauthenticated', () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: false })
    mockUseQuery.mockReturnValue(undefined)

    const { result } = renderHook(() =>
      useAuthQuery(QUERY_REF, { limit: 10, sort: 'best' }),
    )

    expect(mockUseQuery).toHaveBeenCalledWith(QUERY_REF, 'skip')
    expect(result.current.authRequired).toBe(true)
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.isLoading).toBe(false)
  })

  it('forwards real args when Convex auth is authenticated', () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: true })
    const payload = [{ routeId: 'r1' }]
    mockUseQuery.mockReturnValue(payload)

    const args = { limit: 5, sort: 'nearest' as const }
    const { result } = renderHook(() => useAuthQuery(QUERY_REF, args))

    expect(mockUseQuery).toHaveBeenCalledWith(QUERY_REF, args)
    expect(result.current.data).toEqual(payload)
    expect(result.current.authRequired).toBe(false)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('preserves an explicit caller skip even when authenticated', () => {
    mockUseConvexAuth.mockReturnValue({ isLoading: false, isAuthenticated: true })
    mockUseQuery.mockReturnValue(undefined)

    renderHook(() => useAuthQuery(QUERY_REF, 'skip'))

    expect(mockUseQuery).toHaveBeenCalledWith(QUERY_REF, 'skip')
  })
})
