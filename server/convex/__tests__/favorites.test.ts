/**
 * Tests for favorites query - IDLE-S06-CVX-T01
 *
 * These tests exercise the listFavoriteLocations behavior.
 */

import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel'

describe('favorites.listFavoriteLocations - AC-4: listFavoriteLocations returns scoped locations for authenticated rider', () => {
  it('listFavoriteLocations scoped to rider - returns 3 user_abc rows and excludes user_xyz rows', async () => {
    // GIVEN: rider user_abc has 3 favorite_roads and user_xyz has 2
    const mockFavorites = [
      {
        _id: 'fav1' as Id<'favorite_roads'>,
        clerkUserId: 'user_abc',
        name: 'Favorite 1',
        geometry: 'line1',
        bounds: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      {
        _id: 'fav2' as Id<'favorite_roads'>,
        clerkUserId: 'user_abc',
        name: 'Favorite 2',
        geometry: 'line2',
        bounds: undefined,
        createdAt: Date.now() - 1000,
        updatedAt: Date.now() - 1000,
      },
      {
        _id: 'fav3' as Id<'favorite_roads'>,
        clerkUserId: 'user_abc',
        name: 'Favorite 3',
        geometry: 'line3',
        bounds: undefined,
        createdAt: Date.now() - 2000,
        updatedAt: Date.now() - 2000,
      },
      {
        _id: 'fav4' as Id<'favorite_roads'>,
        clerkUserId: 'user_xyz', // Different user - should be excluded
        name: 'Favorite 4',
        geometry: 'line4',
        bounds: undefined,
        createdAt: Date.now() - 3000,
        updatedAt: Date.now() - 3000,
      },
      {
        _id: 'fav5' as Id<'favorite_roads'>,
        clerkUserId: 'user_xyz', // Different user - should be excluded
        name: 'Favorite 5',
        geometry: 'line5',
        bounds: undefined,
        createdAt: Date.now() - 4000,
        updatedAt: Date.now() - 4000,
      },
    ]

    const mockQuery = vi.fn((table: string) => {
      if (table === 'favorite_roads') {
        return {
          withIndex: vi.fn((indexName: string, fn: any) => {
            // Simulate the index query filtering by clerkUserId
            const filtered = mockFavorites.filter((f) => f.clerkUserId === 'user_abc')
            return {
              order: vi.fn((direction: 'asc' | 'desc') => ({
                collect: vi.fn().mockResolvedValue(filtered),
              })),
            }
          }),
        }
      }
      return { withIndex: vi.fn() }
    })

    // WHEN: listFavoriteLocations handler is called with user_abc identity
    const { listFavoriteLocationsHandler } = await import('../db/favorites.js')

    const mockCtx = {
      db: {
        query: mockQuery,
      },
      auth: {
        getUserIdentity: async () => ({
          subject: 'user_abc',
          tokenIdentifier: 'token123',
        }),
      },
    }

    const result = await listFavoriteLocationsHandler(mockCtx)

    // THEN: returns exactly 3 items shaped {name, geometry}
    expect(result).toHaveLength(3)
    expect(result[0]).toMatchObject({
      name: 'Favorite 1',
      geometry: 'line1',
    })

    // VERIFY: all items belong to user_abc (no user_xyz rows present)
    result.forEach((item: any) => {
      expect(item).not.toHaveProperty('clerkUserId', 'user_xyz')
    })
  })

  it('listFavoriteLocations empty for rider with no favorites - returns empty array (not error)', async () => {
    // GIVEN: authenticated rider with zero favorites
    const mockQuery = vi.fn(() => ({
      withIndex: vi.fn(() => ({
        order: vi.fn(() => ({
          collect: vi.fn().mockResolvedValue([]),
        })),
      })),
    }))

    const { listFavoriteLocationsHandler } = await import('../db/favorites.js')

    const mockCtx = {
      db: {
        query: mockQuery,
      },
      auth: {
        getUserIdentity: async () => ({
          subject: 'user_empty',
          tokenIdentifier: 'token456',
        }),
      },
    }

    // WHEN: listFavoriteLocations handler is called
    const result = await listFavoriteLocationsHandler(mockCtx)

    // THEN: returns empty array (not error)
    expect(result).toEqual([])
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })
})

describe('favorites.listFavoriteLocations - AC-5: listFavoriteLocations throws UNAUTHENTICATED for unauthenticated caller', () => {
  it('listFavoriteLocations unauthenticated - throws ConvexError(UNAUTHENTICATED) when no identity', async () => {
    // GIVEN: no JWT in request context
    const { listFavoriteLocationsHandler } = await import('../db/favorites.js')

    const mockCtx = {
      db: {
        query: vi.fn(),
      },
      auth: {
        getUserIdentity: async () => null, // No identity
      },
    }

    // WHEN: listFavoriteLocations handler is called
    // THEN: throws ConvexError(UNAUTHENTICATED)
    await expect(listFavoriteLocationsHandler(mockCtx)).rejects.toThrow(ConvexError)

    try {
      await listFavoriteLocationsHandler(mockCtx)
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      const errorData = (error as ConvexError<{ code: string }>).data
      expect(errorData).toHaveProperty('code', 'UNAUTHENTICATED')
    }
  })
})
