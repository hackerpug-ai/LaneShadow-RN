/**
 * Tests for favoriteRoads CRUD operations
 *
 * Test Strategy:
 * - One test per acceptance criterion
 * - Test happy path and error cases
 * - Mock ctx appropriately
 * - Verify db operations called correctly
 */

import { describe, expect, it, vi } from 'vitest'
import { ConvexError } from 'convex/values'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'
import {
  insertHandler,
  listHandler,
  removeHandler,
  insertFavoriteRoadInputValidator,
} from '../favoriteRoads'

// Mock types for testing
type MockInsert = (
  table: string,
  fields: object
) => Promise<Id<'favorite_roads'>>
type MockGet = (id: Id<'favorite_roads'>) => Promise<Doc<'favorite_roads'> | null>
type MockQuery = (
  table: string
) => {
  withIndex: (indexName: string, fn: (q: any) => any) => {
    order: (direction: 'asc' | 'desc') => {
      collect: () => Promise<Array<Doc<'favorite_roads'>>>
    }
  }
}
type MockDelete = (id: Id<'favorite_roads'>) => Promise<void>
type MockGetUserIdentity = () => Promise<{ subject: string; tokenIdentifier: string | null }>

describe('favoriteRoads', () => {
  describe('AC1: Given user is authenticated, when calling insert with valid favorite road, then favorite created and returned with ID', () => {
    it('should create favorite road and return with ID', async () => {
      // Arrange
      const mockFavoriteId = 'favorite_123' as Id<'favorite_roads'>
      const clerkUserId = 'user_abc123'
      const mockInsert = vi.fn<MockInsert>().mockResolvedValue(mockFavoriteId)
      const mockGetUserIdentity = vi.fn<MockGetUserIdentity>().mockResolvedValue({
        subject: clerkUserId,
        tokenIdentifier: null,
      })

      const mockCtx = {
        db: {
          insert: mockInsert,
        },
        auth: {
          getUserIdentity: mockGetUserIdentity,
        },
      } as unknown as MutationCtx

      const args = {
        name: 'Scenic Route 66',
        geometry: 'encoded_polyline_string',
        bounds: {
          north: 37.7749,
          south: 37.7549,
          east: -122.4194,
          west: -122.4394,
        },
      }

      // Act
      const result = await insertHandler(mockCtx, args, clerkUserId)

      // Assert
      expect(mockInsert).toHaveBeenCalledTimes(1)
      expect(mockInsert).toHaveBeenCalledWith('favorite_roads', {
        userId: clerkUserId,
        name: args.name,
        geometry: args.geometry,
        bounds: args.bounds,
        createdAt: expect.any(Number),
      })
      expect(result).toEqual({
        favoriteRoadId: mockFavoriteId,
      })
    })

    it('should create favorite road without optional bounds', async () => {
      // Arrange
      const mockFavoriteId = 'favorite_456' as Id<'favorite_roads'>
      const clerkUserId = 'user_def456'
      const mockInsert = vi.fn<MockInsert>().mockResolvedValue(mockFavoriteId)

      const mockCtx = {
        db: {
          insert: mockInsert,
        },
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue({
            subject: clerkUserId,
            tokenIdentifier: null,
          }),
        },
      } as unknown as MutationCtx

      const args = {
        name: 'Highway 101',
        geometry: 'another_encoded_polyline',
      }

      // Act
      const result = await insertHandler(mockCtx, args, clerkUserId)

      // Assert
      expect(mockInsert).toHaveBeenCalledWith('favorite_roads', {
        userId: clerkUserId,
        name: args.name,
        geometry: args.geometry,
        bounds: undefined,
        createdAt: expect.any(Number),
      })
      expect(result).toEqual({
        favoriteRoadId: mockFavoriteId,
      })
    })
  })

  describe('AC2: Given user has favorites, when calling list by userId, then all user favorites returned ordered by createdAt', () => {
    it('should return user favorites ordered by createdAt descending (newest first)', async () => {
      // Arrange
      const clerkUserId = 'user_list123'
      const now = Date.now()

      const mockFavorites: Array<Doc<'favorite_roads'>> = [
        {
          _id: 'favorite_1' as Id<'favorite_roads'>,
          _creationTime: now,
          userId: clerkUserId as Id<'users'>,
          name: 'Oldest Favorite',
          geometry: 'encoded_1',
          bounds: undefined,
          createdAt: now - 10000, // 10 seconds ago
        },
        {
          _id: 'favorite_2' as Id<'favorite_roads'>,
          _creationTime: now,
          userId: clerkUserId as Id<'users'>,
          name: 'Newest Favorite',
          geometry: 'encoded_2',
          bounds: {
            north: 37.7749,
            south: 37.7549,
            east: -122.4194,
            west: -122.4394,
          },
          createdAt: now - 1000, // 1 second ago
        },
        {
          _id: 'favorite_3' as Id<'favorite_roads'>,
          _creationTime: now,
          userId: clerkUserId as Id<'users'>,
          name: 'Middle Favorite',
          geometry: 'encoded_3',
          bounds: undefined,
          createdAt: now - 5000, // 5 seconds ago
        },
      ]

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([
              mockFavorites[0],
              mockFavorites[1],
              mockFavorites[2],
            ]),
          }),
        }),
      })

      const mockCtx = {
        db: {
          query: mockQuery,
        },
      } as unknown as QueryCtx

      // Act
      const result = await listHandler(mockCtx, clerkUserId)

      // Assert
      expect(mockQuery).toHaveBeenCalledWith('favorite_roads')
      expect(result).toHaveLength(3)
      // Verify descending order by createdAt (newest first)
      expect(result[0].name).toBe('Newest Favorite')
      expect(result[1].name).toBe('Middle Favorite')
      expect(result[2].name).toBe('Oldest Favorite')
    })

    it('should return empty array when user has no favorites', async () => {
      // Arrange
      const clerkUserId = 'user_empty123'

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            collect: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const mockCtx = {
        db: {
          query: mockQuery,
        },
      } as unknown as QueryCtx

      // Act
      const result = await listHandler(mockCtx, clerkUserId)

      // Assert
      expect(result).toEqual([])
    })
  })

  describe('AC3: Given user has favorite, when calling remove with favorite ID, then favorite permanently deleted', () => {
    it('should permanently delete favorite road owned by user', async () => {
      // Arrange
      const clerkUserId = 'user_delete123'
      const favoriteId = 'favorite_to_delete' as Id<'favorite_roads'>

      const mockFavorite: Doc<'favorite_roads'> = {
        _id: favoriteId,
        _creationTime: Date.now(),
        userId: clerkUserId as Id<'users'>,
        name: 'Delete Me',
        geometry: 'encoded_delete',
        bounds: undefined,
        createdAt: Date.now(),
      }

      const mockGet = vi.fn<MockGet>().mockResolvedValue(mockFavorite)
      const mockDelete = vi.fn<MockDelete>().mockResolvedValue(undefined)

      const mockCtx = {
        db: {
          get: mockGet,
          delete: mockDelete,
        },
      } as unknown as MutationCtx

      const args = { favoriteRoadId: favoriteId }

      // Act
      const result = await removeHandler(mockCtx, args, clerkUserId)

      // Assert
      expect(mockGet).toHaveBeenCalledWith(favoriteId)
      expect(mockDelete).toHaveBeenCalledWith(favoriteId)
      expect(result).toEqual({ success: true })
    })

    it('should throw error when trying to delete another users favorite', async () => {
      // Arrange
      const clerkUserId = 'user_malicious123'
      const otherUserId = 'user_victim456'
      const favoriteId = 'favorite_protected' as Id<'favorite_roads'>

      const mockFavorite: Doc<'favorite_roads'> = {
        _id: favoriteId,
        _creationTime: Date.now(),
        userId: otherUserId as Id<'users'>,
        name: 'Protected Favorite',
        geometry: 'encoded_protected',
        bounds: undefined,
        createdAt: Date.now(),
      }

      const mockGet = vi.fn<MockGet>().mockResolvedValue(mockFavorite)

      const mockCtx = {
        db: {
          get: mockGet,
        },
      } as unknown as MutationCtx

      const args = { favoriteRoadId: favoriteId }

      // Act & Assert
      await expect(removeHandler(mockCtx, args, clerkUserId)).rejects.toThrow(ConvexError)
      await expect(removeHandler(mockCtx, args, clerkUserId)).rejects.toThrow(
        'Favorite road not found'
      )
    })

    it('should throw error when favorite does not exist', async () => {
      // Arrange
      const clerkUserId = 'user_notfound123'
      const favoriteId = 'favorite_nonexistent' as Id<'favorite_roads'>

      const mockGet = vi.fn<MockGet>().mockResolvedValue(null)

      const mockCtx = {
        db: {
          get: mockGet,
        },
      } as unknown as MutationCtx

      const args = { favoriteRoadId: favoriteId }

      // Act & Assert
      await expect(removeHandler(mockCtx, args, clerkUserId)).rejects.toThrow(ConvexError)
      await expect(removeHandler(mockCtx, args, clerkUserId)).rejects.toThrow(
        'Favorite road not found'
      )
    })
  })

  describe('AC4: Given unauthenticated user, when calling any mutation, then ConvexError thrown with 401', () => {
    it('insert should require authentication', async () => {
      // Arrange
      const mockCtx = {
        db: {
          insert: vi.fn(),
        },
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue(null),
        },
      } as unknown as MutationCtx

      const args = {
        name: 'Test',
        geometry: 'test_geom',
      }

      // Act & Assert
      await expect(insertHandler(mockCtx, args, '')).rejects.toThrow(ConvexError)
      await expect(insertHandler(mockCtx, args, '')).rejects.toThrow(
        'Authentication required'
      )
    })

    it('remove should require authentication', async () => {
      // Arrange
      const favoriteId = 'favorite_auth_test' as Id<'favorite_roads'>

      const mockCtx = {
        db: {
          get: vi.fn(),
          delete: vi.fn(),
        },
        auth: {
          getUserIdentity: vi.fn().mockResolvedValue(null),
        },
      } as unknown as MutationCtx

      const args = { favoriteRoadId: favoriteId }

      // Act & Assert
      await expect(removeHandler(mockCtx, args, '')).rejects.toThrow(ConvexError)
      await expect(removeHandler(mockCtx, args, '')).rejects.toThrow(
        'Authentication required'
      )
    })
  })

  describe('Validator exports', () => {
    it('should export insertFavoriteRoadInputValidator', () => {
      // Verify the validator is properly exported
      expect(insertFavoriteRoadInputValidator).toBeDefined()
    })
  })
})
