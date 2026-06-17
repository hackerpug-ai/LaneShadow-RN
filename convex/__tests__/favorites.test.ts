import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel'

describe('favorites contract', () => {
  it('returns only the authenticated rider favorites in the mobile pin DTO shape', async () => {
    const mockFavorites = [
      {
        _id: 'fav1' as Id<'favorite_roads'>,
        clerkUserId: 'user_abc',
        name: 'Empire Grade',
        geometry: JSON.stringify({
          type: 'Point',
          coordinates: [-122.03, 36.97],
        }),
        bounds: undefined,
      },
      {
        _id: 'fav2' as Id<'favorite_roads'>,
        clerkUserId: 'user_abc',
        name: 'Bonny Doon',
        geometry: JSON.stringify({
          type: 'Point',
          coordinates: [-122.14, 37.04],
        }),
        bounds: { north: 37.05, south: 37.03, east: -122.13, west: -122.15 },
      },
      {
        _id: 'fav3' as Id<'favorite_roads'>,
        clerkUserId: 'user_xyz',
        name: 'Should Not Leak',
        geometry: JSON.stringify({
          type: 'Point',
          coordinates: [-121.9, 36.8],
        }),
        bounds: undefined,
      },
    ]

    const querySpy = vi.fn((table: string) => {
      expect(table).toBe('favorite_roads')
      return {
        withIndex: vi.fn((indexName: string) => {
          expect(indexName).toBe('by_clerkUserId')
          return {
            order: vi.fn(() => ({
              collect: vi
                .fn()
                .mockResolvedValue(
                  mockFavorites.filter((favorite) => favorite.clerkUserId === 'user_abc'),
                ),
            })),
          }
        }),
      }
    })

    const { listFavoriteLocationsHandler } = await import('../db/favorites.js')

    const result = await listFavoriteLocationsHandler({
      db: {
        query: querySpy,
      },
      auth: {
        getUserIdentity: async () => ({
          subject: 'user_abc',
          tokenIdentifier: 'token_123',
        }),
      },
    })

    expect(result).toMatchObject([
      {
        id: 'fav1',
        lat: 36.97,
        lng: -122.03,
        label: 'Empire Grade',
      },
      {
        id: 'fav2',
        lat: 37.04,
        lng: -122.14,
        label: 'Bonny Doon',
        bounds: { north: 37.05, south: 37.03, east: -122.13, west: -122.15 },
      },
    ])
    expect(result).toHaveLength(2)
    expect(result[0]).not.toHaveProperty('_id')
    expect(result[0]).not.toHaveProperty('name')
    expect(result[0]).not.toHaveProperty('geometry')
    expect(result[1]).not.toHaveProperty('_id')
    expect(result[1]).not.toHaveProperty('name')
    expect(result[1]).not.toHaveProperty('geometry')
  })

  it('throws UNAUTHENTICATED for an unauthenticated caller', async () => {
    const { listFavoriteLocationsHandler } = await import('../db/favorites.js')

    await expect(
      listFavoriteLocationsHandler({
        db: {
          query: vi.fn(),
        },
        auth: {
          getUserIdentity: async () => null,
        },
      }),
    ).rejects.toThrow(ConvexError)
  })

  it('keeps the favorite location contract aligned with the native clients', () => {
    const iosSource = readFileSync(
      resolve(__dirname, '../../../ios/LaneShadow/Services/ConvexClient+LaneShadow.swift'),
      'utf8',
    )
    const androidSource = readFileSync(
      resolve(
        __dirname,
        '../../../android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt',
      ),
      'utf8',
    )

    expect(iosSource).toContain('case listFavoriteLocations = "db/favorites:listFavoriteLocations"')
    expect(iosSource).toContain('let id: String')
    expect(iosSource).toContain('let lat: Double')
    expect(iosSource).toContain('let lng: Double')
    expect(iosSource).toContain('let label: String')
    expect(androidSource).toContain('name = "db/favorites:listFavoriteLocations"')
  })
})
