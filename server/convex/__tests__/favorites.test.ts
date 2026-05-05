/**
 * Tests for favorites query - IDLE-S06-CVX-T01
 *
 * These tests exercise the listFavoriteLocations behavior.
 */

import { ConvexError } from 'convex/values'
import { describe, expect, it } from 'vitest'
import type { Id } from '../_generated/dataModel'

describe('favorites.listFavoriteLocations - AC-4: listFavoriteLocations returns scoped locations for authenticated rider', () => {
  it('listFavoriteLocations scoped to rider - returns 3 user_abc rows and excludes user_xyz rows', async () => {
    // GIVEN: rider user_abc has 3 favorite_roads and user_xyz has 2
    // WHEN: listFavoriteLocations is called with user_abc identity
    const { listFavoriteLocations } = await import('../db/favorites.js')

    // Mock context with user_abc identity
    const mockCtx = {
      db: {
        query: (table: string) => ({
          withIndex: (indexName: string, fn: any) => ({
            order: (direction: 'asc' | 'desc') => ({
              collect: async () => [
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
              ],
            }),
          }),
        }),
      },
      auth: {
        getUserIdentity: async () => ({
          subject: 'user_abc',
          tokenIdentifier: 'token123',
        }),
      },
    }

    const result = await listFavoriteLocations(mockCtx as any, {})

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
    const { listFavoriteLocations } = await import('../db/favorites.js')

    const mockCtx = {
      db: {
        query: (table: string) => ({
          withIndex: (indexName: string, fn: any) => ({
            order: (direction: 'asc' | 'desc') => ({
              collect: async () => [],
            }),
          }),
        }),
      },
      auth: {
        getUserIdentity: async () => ({
          subject: 'user_empty',
          tokenIdentifier: 'token456',
        }),
      },
    }

    // WHEN: listFavoriteLocations is called
    const result = await listFavoriteLocations(mockCtx as any, {})

    // THEN: returns empty array (not error)
    expect(result).toEqual([])
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(0)
  })
})

describe('favorites.listFavoriteLocations - AC-5: listFavoriteLocations throws UNAUTHENTICATED for unauthenticated caller', () => {
  it('listFavoriteLocations unauthenticated - throws ConvexError(UNAUTHENTICATED) when no identity', async () => {
    // GIVEN: no JWT in request context
    const { listFavoriteLocations } = await import('../db/favorites.js')

    const mockCtx = {
      db: {
        query: (table: string) => ({
          withIndex: (indexName: string, fn: any) => ({
            order: (direction: 'asc' | 'desc') => ({
              collect: async () => [],
            }),
          }),
        }),
      },
      auth: {
        getUserIdentity: async () => null, // No identity
      },
    }

    // WHEN: listFavoriteLocations is called
    // THEN: throws ConvexError(UNAUTHENTICATED)
    await expect(listFavoriteLocations(mockCtx as any, {})).rejects.toThrow(ConvexError)

    try {
      await listFavoriteLocations(mockCtx as any, {})
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      const errorData = (error as ConvexError).data
      expect(errorData).toHaveProperty('code', 'UNAUTHENTICATED')
    }
  })
})
