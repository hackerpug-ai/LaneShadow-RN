import { describe, expect, it } from 'vitest'
import { getUserFavorites, type UserFavorite } from '../getUserFavorites'

// Bay Area bounding box used across tests
const BAY_AREA_BBOX = {
  north: 37.9,
  south: 37.3,
  east: -121.8,
  west: -122.6,
}

// Helper to build a mock favorite
const makeFavorite = (overrides: Partial<UserFavorite>): UserFavorite => ({
  roadName: 'Test Road',
  rating: 3,
  rideCount: 1,
  lastRidden: '2026-01-01',
  lat: 37.5,
  lng: -122.2,
  ...overrides,
})

describe('getUserFavorites', () => {
  describe('with favorites', () => {
    it('returns all 3 favorites sorted by rating descending', async () => {
      const favorites: UserFavorite[] = [
        makeFavorite({
          roadName: 'Skyline Blvd',
          rating: 5,
          rideCount: 12,
          lastRidden: '2026-03-15',
          lat: 37.4,
          lng: -122.2,
        }),
        makeFavorite({
          roadName: 'Page Mill Rd',
          rating: 4,
          rideCount: 5,
          lastRidden: '2026-02-01',
          lat: 37.38,
          lng: -122.1,
        }),
        makeFavorite({
          roadName: 'Alpine Rd',
          rating: 3,
          rideCount: 2,
          lastRidden: '2026-01-10',
          lat: 37.45,
          lng: -122.15,
        }),
      ]

      const result = await getUserFavorites({ bbox: BAY_AREA_BBOX }, favorites)

      expect(result).toHaveLength(3)
      expect(result[0].roadName).toBe('Skyline Blvd')
      expect(result[1].roadName).toBe('Page Mill Rd')
      expect(result[2].roadName).toBe('Alpine Rd')
    })
  })

  describe('no favorites', () => {
    it('returns empty array for users with no favorites — does NOT throw', async () => {
      const result = await getUserFavorites({ bbox: BAY_AREA_BBOX }, [])

      expect(result).toEqual([])
    })
  })

  describe('region filter', () => {
    it('returns only favorites within the Bay Area bbox, not other regions', async () => {
      const favorites: UserFavorite[] = [
        // Bay Area — inside bbox
        makeFavorite({ roadName: 'Skyline Blvd', rating: 5, lat: 37.4, lng: -122.2 }),
        // LA — outside bbox
        makeFavorite({ roadName: 'Pacific Coast Hwy', rating: 4, lat: 34.0, lng: -118.5 }),
        // Denver — outside bbox
        makeFavorite({ roadName: 'Red Rocks Rd', rating: 3, lat: 39.7, lng: -105.2 }),
      ]

      const result = await getUserFavorites({ bbox: BAY_AREA_BBOX }, favorites)

      expect(result).toHaveLength(1)
      expect(result[0].roadName).toBe('Skyline Blvd')
    })
  })

  describe('max limit', () => {
    it('returns max 10 results sorted by rating then ride count when 15 exist in the region', async () => {
      const favorites: UserFavorite[] = Array.from({ length: 15 }, (_, i) =>
        makeFavorite({
          roadName: `Road ${i + 1}`,
          rating: 15 - i, // ratings 15 down to 1
          rideCount: i + 1,
          lat: 37.5,
          lng: -122.2,
        }),
      )

      const result = await getUserFavorites({ bbox: BAY_AREA_BBOX }, favorites)

      expect(result).toHaveLength(10)
      // Should be sorted by rating descending — top rated first
      expect(result[0].roadName).toBe('Road 1')
      expect(result[0].rating).toBe(15)
      expect(result[9].rating).toBe(6)
    })
  })
})
