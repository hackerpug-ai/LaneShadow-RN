/**
 * Tests for planRideOrchestrator favorites integration
 *
 * Tests US-047: Integrate Favorites with Planning Graph
 * Following TDD principles: RED → GREEN → REFACTOR
 */

import { describe, it, expect } from 'vitest'
import {
  filterFavoritesByDistance,
  type FavoriteRoadForPlanning,
} from '../planRideOrchestrator'

// ---------------------------------------------------------------------------
// Test Data
// ---------------------------------------------------------------------------

const makeFavorite = (overrides: Partial<FavoriteRoadForPlanning>): FavoriteRoadForPlanning => ({
  id: 'fav_test',
  geometry: 'test_geometry',
  bounds: {
    north: 37.8,
    south: 37.7,
    east: -122.4,
    west: -122.5,
  },
  ...overrides,
})

// San Francisco to Los Angeles route bounds (approximate)
const SF_LA_ROUTE_BOUNDS = {
  north: 37.8,
  south: 34.0,
  east: -118.2,
  west: -122.5,
}

// Bay Area route bounds
const BAY_AREA_BOUNDS = {
  north: 37.9,
  south: 37.3,
  east: -121.8,
  west: -122.6,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('planRideOrchestrator - Favorites Integration', () => {
  describe('AC-6: Calculate distance from route corridor for each favorite', () => {
    it('should filter favorites based on distance calculation', () => {
      const favorites: FavoriteRoadForPlanning[] = [
        // Very close to route center
        makeFavorite({
          id: 'very_close',
          bounds: {
            north: 37.5,
            south: 37.4,
            east: -122.2,
            west: -122.3,
          },
        }),
        // Further away but still within 50km
        makeFavorite({
          id: 'moderate_distance',
          bounds: {
            north: 37.6,
            south: 37.5,
            east: -122.0,
            west: -122.1,
          },
        }),
      ]

      const result = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)

      // Both should be included as they're within 50km
      expect(result.nearbyFavorites).toHaveLength(2)
      expect(result.excludedFavorites).toHaveLength(0)
    })

    it('should use haversine formula for accurate distance calculation', () => {
      // Test that distance calculation accounts for Earth's curvature
      const favorites: FavoriteRoadForPlanning[] = [
        // Point at same latitude but different longitude
        makeFavorite({
          id: 'same_lat',
          bounds: {
            north: 37.5,
            south: 37.4,
            east: -121.5,
            west: -121.6,
          },
        }),
      ]

      const result = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)

      // Should be excluded as it's about 70km away (same lat, ~1 degree longitude)
      expect(result.nearbyFavorites).toHaveLength(0)
      expect(result.excludedFavorites).toHaveLength(1)
      expect(result.excludedFavorites[0].reason).toBe('too_far')
    })
  })

  describe('AC-7: Exclude favorites when distance > 50km', () => {
    describe('filterFavoritesByDistance', () => {
      it('should include favorites within 50km threshold', () => {
        const favorites: FavoriteRoadForPlanning[] = [
          // Skyline Blvd - within Bay Area
          makeFavorite({
            id: 'skyline',
            bounds: {
              north: 37.4,
              south: 37.3,
              east: -122.2,
              west: -122.3,
            },
          }),
          // Page Mill Rd - within Bay Area
          makeFavorite({
            id: 'page_mill',
            bounds: {
              north: 37.38,
              south: 37.35,
              east: -122.1,
              west: -122.15,
            },
          }),
        ]

        const result = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)

        expect(result.nearbyFavorites).toHaveLength(2)
        expect(result.nearbyFavorites.map(f => f.id)).toEqual(['skyline', 'page_mill'])
        expect(result.excludedFavorites).toHaveLength(0)
      })

      it('should exclude favorites beyond 50km threshold', () => {
        const favorites: FavoriteRoadForPlanning[] = [
          // Skyline Blvd - within Bay Area
          makeFavorite({
            id: 'skyline',
            bounds: {
              north: 37.4,
              south: 37.3,
              east: -122.2,
              west: -122.3,
            },
          }),
          // LA favorite - far away (>50km from Bay Area)
          makeFavorite({
            id: 'pch',
            bounds: {
              north: 34.1,
              south: 34.0,
              east: -118.3,
              west: -118.4,
            },
          }),
        ]

        const result = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)

        expect(result.nearbyFavorites).toHaveLength(1)
        expect(result.nearbyFavorites[0].id).toBe('skyline')
        expect(result.excludedFavorites).toHaveLength(1)
        expect(result.excludedFavorites[0]).toEqual({
          id: 'pch',
          reason: 'too_far',
        })
      })

      it('should handle favorites with no bounds', () => {
        const favorites: FavoriteRoadForPlanning[] = [
          makeFavorite({
            id: 'no_bounds',
            bounds: undefined,
          }),
        ]

        const result = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)

        expect(result.nearbyFavorites).toHaveLength(0)
        expect(result.excludedFavorites).toHaveLength(1)
        expect(result.excludedFavorites[0]).toEqual({
          id: 'no_bounds',
          reason: 'no_bounds',
        })
      })

      it('should handle empty favorites array', () => {
        const result = filterFavoritesByDistance([], BAY_AREA_BOUNDS, 50)

        expect(result.nearbyFavorites).toHaveLength(0)
        expect(result.excludedFavorites).toHaveLength(0)
      })

      it('should respect custom threshold', () => {
        const favorites: FavoriteRoadForPlanning[] = [
          // Close favorite - within both thresholds
          makeFavorite({
            id: 'close',
            bounds: {
              north: 37.5,
              south: 37.4,
              east: -122.2,
              west: -122.3,
            },
          }),
          // Distant favorite - outside 20km but within 50km
          makeFavorite({
            id: 'distant',
            bounds: {
              north: 37.8,
              south: 37.7,
              east: -121.8,
              west: -121.9,
            },
          }),
        ]

        // With 20km threshold, only close favorite should be included
        const result20 = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 20)
        expect(result20.nearbyFavorites).toHaveLength(1)
        expect(result20.nearbyFavorites[0].id).toBe('close')
        expect(result20.excludedFavorites).toHaveLength(1)

        // With 50km threshold, both should be included
        const result50 = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)
        expect(result50.nearbyFavorites).toHaveLength(2)
        expect(result50.excludedFavorites).toHaveLength(0)
      })

      it('should handle multiple favorites with mixed distances', () => {
        const favorites: FavoriteRoadForPlanning[] = [
          // Within threshold
          makeFavorite({
            id: 'near1',
            bounds: {
              north: 37.5,
              south: 37.4,
              east: -122.2,
              west: -122.3,
            },
          }),
          // Within threshold
          makeFavorite({
            id: 'near2',
            bounds: {
              north: 37.45,
              south: 37.35,
              east: -122.15,
              west: -122.25,
            },
          }),
          // Beyond threshold
          makeFavorite({
            id: 'far1',
            bounds: {
              north: 36.5,
              south: 36.4,
              east: -120.0,
              west: -120.1,
            },
          }),
          // No bounds
          makeFavorite({
            id: 'no_bounds',
            bounds: undefined,
          }),
        ]

        const result = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)

        expect(result.nearbyFavorites).toHaveLength(2)
        expect(result.nearbyFavorites.map(f => f.id)).toEqual(['near1', 'near2'])

        expect(result.excludedFavorites).toHaveLength(2)
        expect(result.excludedFavorites).toContainEqual({
          id: 'far1',
          reason: 'too_far',
        })
        expect(result.excludedFavorites).toContainEqual({
          id: 'no_bounds',
          reason: 'no_bounds',
        })
      })
    })
  })

  describe('AC-10: Return excludedFavorites list with reasons', () => {
    it('should provide clear reason codes for excluded favorites', () => {
      const favorites: FavoriteRoadForPlanning[] = [
        makeFavorite({
          id: 'too_far_fav',
          bounds: {
            north: 40.0,
            south: 39.9,
            east: -105.0,
            west: -105.1,
          },
        }),
        makeFavorite({
          id: 'no_bounds_fav',
          bounds: undefined,
        }),
      ]

      const result = filterFavoritesByDistance(favorites, BAY_AREA_BOUNDS, 50)

      expect(result.excludedFavorites).toHaveLength(2)

      const tooFar = result.excludedFavorites.find(e => e.id === 'too_far_fav')
      expect(tooFar).toBeDefined()
      expect(tooFar?.reason).toBe('too_far')

      const noBounds = result.excludedFavorites.find(e => e.id === 'no_bounds_fav')
      expect(noBounds).toBeDefined()
      expect(noBounds?.reason).toBe('no_bounds')
    })
  })
})
