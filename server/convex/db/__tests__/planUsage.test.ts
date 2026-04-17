/**
 * Tests for planUsage rate limiting operations
 *
 * Test Strategy:
 * - One test per acceptance criterion
 * - Test happy path and edge cases
 * - Mock ctx appropriately
 * - Verify db operations called correctly
 * - Test atomic increment operations
 */

import { describe, expect, it, vi } from 'vitest'
import { ConvexError } from 'convex/values'
import type { Doc, Id } from '../../_generated/dataModel'
import type { MutationCtx, QueryCtx } from '../../_generated/server'
import {
  checkUsage,
  incrementUsage,
  getCurrentMonth,
} from '../planUsage'

// Mock types for testing
type MockQuery = (table: string) => {
  withIndex: (indexName: string, fn: (q: any) => any) => {
    unique: () => Promise<Doc<'plan_usage'> | null>
  }
}
type MockGet = (id: Id<'plan_usage'>) => Promise<Doc<'plan_usage'> | null>
type MockInsert = (
  table: string,
  fields: object
) => Promise<Id<'plan_usage'>>
type MockPatch = (
  id: Id<'plan_usage'>,
  patch: object
) => Promise<void>

describe('planUsage', () => {
  describe('getCurrentMonth utility', () => {
    it('should return current month in YYYY-MM format', () => {
      // Arrange
      const now = new Date('2026-04-03T12:00:00Z')

      // Act
      const month = getCurrentMonth(now)

      // Assert
      expect(month).toBe('2026-04')
    })

    it('should handle month boundaries correctly', () => {
      // Arrange
      const testCases = [
        { date: '2026-01-15T00:00:00Z', expected: '2026-01' },
        { date: '2026-12-31T23:59:59Z', expected: '2026-12' },
        { date: '2026-04-01T00:00:00Z', expected: '2026-04' },
      ]

      // Act & Assert
      testCases.forEach(({ date, expected }) => {
        expect(getCurrentMonth(new Date(date))).toBe(expected)
      })
    })
  })

  describe('AC1: Given user has 0 plans this month, when check called, then returns { count: 0, limit: 5, allowed: true }', () => {
    it('should return zero count and allowed true for new user', async () => {
      // Arrange
      const clerkUserId = 'user_new123'
      const month = '2026-04'

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(null),
        }),
      })

      const mockCtx = {
        db: {
          query: mockQuery,
        },
      } as unknown as QueryCtx

      // Act
      const result = await checkUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(result).toEqual({
        count: 0,
        limit: 5,
        allowed: true,
        remaining: 5,
      })
      expect(mockQuery).toHaveBeenCalledWith('plan_usage')
      expect(mockQuery).toHaveBeenCalledTimes(1)
    })
  })

  describe('AC2: Given user has 5 plans this month, when check called, then returns { count: 5, limit: 5, allowed: false }', () => {
    it('should return full count and not allowed when at limit', async () => {
      // Arrange
      const clerkUserId = 'user_limit123'
      const month = '2026-04'

      const mockRecord: Doc<'plan_usage'> = {
        _id: 'plan_usage_123' as Id<'plan_usage'>,
        _creationTime: Date.now(),
        clerkUserId: clerkUserId as Id<'users'>,
        month,
        planCount: 5,
      }

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(mockRecord),
        }),
      })

      const mockCtx = {
        db: {
          query: mockQuery,
        },
      } as unknown as QueryCtx

      // Act
      const result = await checkUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(result).toEqual({
        count: 5,
        limit: 5,
        allowed: false,
        remaining: 0,
      })
    })

    it('should return not allowed when over limit', async () => {
      // Arrange
      const clerkUserId = 'user_overlimit123'
      const month = '2026-04'

      const mockRecord: Doc<'plan_usage'> = {
        _id: 'plan_usage_456' as Id<'plan_usage'>,
        _creationTime: Date.now(),
        clerkUserId: clerkUserId as Id<'users'>,
        month,
        planCount: 6,
      }

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(mockRecord),
        }),
      })

      const mockCtx = {
        db: {
          query: mockQuery,
        },
      } as unknown as QueryCtx

      // Act
      const result = await checkUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(result).toEqual({
        count: 6,
        limit: 5,
        allowed: false,
        remaining: 0,
      })
    })

    it('should return correct remaining count', async () => {
      // Arrange
      const clerkUserId = 'user_partial123'
      const month = '2026-04'

      const mockRecord: Doc<'plan_usage'> = {
        _id: 'plan_usage_789' as Id<'plan_usage'>,
        _creationTime: Date.now(),
        clerkUserId: clerkUserId as Id<'users'>,
        month,
        planCount: 3,
      }

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(mockRecord),
        }),
      })

      const mockCtx = {
        db: {
          query: mockQuery,
        },
      } as unknown as QueryCtx

      // Act
      const result = await checkUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(result).toEqual({
        count: 3,
        limit: 5,
        allowed: true,
        remaining: 2,
      })
    })
  })

  describe('AC3: Given user creates a plan, when increment called, then creates or updates monthly record', () => {
    it('should create new monthly record for first plan of month', async () => {
      // Arrange
      const clerkUserId = 'user_firstplan123'
      const month = '2026-04'
      const newId = 'plan_usage_new' as Id<'plan_usage'>

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(null),
        }),
      })

      const mockInsert = vi.fn<MockInsert>().mockResolvedValue(newId)

      const mockCtx = {
        db: {
          query: mockQuery,
          insert: mockInsert,
        },
      } as unknown as MutationCtx

      // Act
      const result = await incrementUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(mockQuery).toHaveBeenCalledWith('plan_usage')
      expect(mockInsert).toHaveBeenCalledWith('plan_usage', {
        clerkUserId,
        month,
        planCount: 1,
      })
      expect(result).toEqual({
        count: 1,
        limit: 5,
        allowed: true,
        remaining: 4,
      })
    })

    it('should increment existing monthly record', async () => {
      // Arrange
      const clerkUserId = 'user_increment123'
      const month = '2026-04'
      const existingId = 'plan_usage_existing' as Id<'plan_usage'>

      const mockRecord: Doc<'plan_usage'> = {
        _id: existingId,
        _creationTime: Date.now(),
        clerkUserId: clerkUserId as Id<'users'>,
        month,
        planCount: 2,
      }

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(mockRecord),
        }),
      })

      const mockPatch = vi.fn<MockPatch>().mockResolvedValue(undefined)

      const mockCtx = {
        db: {
          query: mockQuery,
          patch: mockPatch,
        },
      } as unknown as MutationCtx

      // Act
      const result = await incrementUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(mockQuery).toHaveBeenCalledWith('plan_usage')
      expect(mockPatch).toHaveBeenCalledWith(existingId, {
        planCount: 3,
      })
      expect(result).toEqual({
        count: 3,
        limit: 5,
        allowed: true,
        remaining: 2,
      })
    })

    it('should handle increment at limit boundary', async () => {
      // Arrange
      const clerkUserId = 'user_boundary123'
      const month = '2026-04'
      const existingId = 'plan_usage_boundary' as Id<'plan_usage'>

      const mockRecord: Doc<'plan_usage'> = {
        _id: existingId,
        _creationTime: Date.now(),
        clerkUserId: clerkUserId as Id<'users'>,
        month,
        planCount: 4,
      }

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(mockRecord),
        }),
      })

      const mockPatch = vi.fn<MockPatch>().mockResolvedValue(undefined)

      const mockCtx = {
        db: {
          query: mockQuery,
          patch: mockPatch,
        },
      } as unknown as MutationCtx

      // Act
      const result = await incrementUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(mockPatch).toHaveBeenCalledWith(existingId, {
        planCount: 5,
      })
      expect(result).toEqual({
        count: 5,
        limit: 5,
        allowed: false,
        remaining: 0,
      })
    })

    it('should handle increment over limit', async () => {
      // Arrange
      const clerkUserId = 'user_over123'
      const month = '2026-04'
      const existingId = 'plan_usage_over' as Id<'plan_usage'>

      const mockRecord: Doc<'plan_usage'> = {
        _id: existingId,
        _creationTime: Date.now(),
        clerkUserId: clerkUserId as Id<'users'>,
        month,
        planCount: 5,
      }

      const mockQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(mockRecord),
        }),
      })

      const mockPatch = vi.fn<MockPatch>().mockResolvedValue(undefined)

      const mockCtx = {
        db: {
          query: mockQuery,
          patch: mockPatch,
        },
      } as unknown as MutationCtx

      // Act
      const result = await incrementUsage(mockCtx, clerkUserId, month)

      // Assert
      expect(mockPatch).toHaveBeenCalledWith(existingId, {
        planCount: 6,
      })
      expect(result).toEqual({
        count: 6,
        limit: 5,
        allowed: false,
        remaining: 0,
      })
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle different months independently', async () => {
      // Arrange - April has 5 plans, May should start fresh
      const clerkUserId = 'user_multimonth123'
      const aprilMonth = '2026-04'
      const mayMonth = '2026-05'

      const aprilRecord: Doc<'plan_usage'> = {
        _id: 'plan_usage_april' as Id<'plan_usage'>,
        _creationTime: Date.now(),
        clerkUserId: clerkUserId as Id<'users'>,
        month: aprilMonth,
        planCount: 5,
      }

      // Test April (at limit)
      const mockAprilQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(aprilRecord),
        }),
      })

      const mockAprilCtx = {
        db: {
          query: mockAprilQuery,
        },
      } as unknown as QueryCtx

      // Test May (new month, no record)
      const mockMayQuery = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(null),
        }),
      })

      const mockMayCtx = {
        db: {
          query: mockMayQuery,
        },
      } as unknown as QueryCtx

      // Act
      const aprilResult = await checkUsage(mockAprilCtx, clerkUserId, aprilMonth)
      const mayResult = await checkUsage(mockMayCtx, clerkUserId, mayMonth)

      // Assert
      expect(aprilResult.allowed).toBe(false)
      expect(aprilResult.count).toBe(5)

      expect(mayResult.allowed).toBe(true)
      expect(mayResult.count).toBe(0)
    })

    it('should handle concurrent users independently', async () => {
      // Arrange - User 1 has 5 plans, User 2 has 0
      const user1 = 'user_concurrent1'
      const user2 = 'user_concurrent2'
      const month = '2026-04'

      const user1Record: Doc<'plan_usage'> = {
        _id: 'plan_usage_user1' as Id<'plan_usage'>,
        _creationTime: Date.now(),
        clerkUserId: user1 as Id<'users'>,
        month,
        planCount: 5,
      }

      // Test User 1 (at limit)
      const mockUser1Query = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(user1Record),
        }),
      })

      const mockUser1Ctx = {
        db: {
          query: mockUser1Query,
        },
      } as unknown as QueryCtx

      // Test User 2 (new user, no record)
      const mockUser2Query = vi.fn<MockQuery>().mockReturnValue({
        withIndex: vi.fn().mockReturnValue({
          unique: vi.fn().mockResolvedValue(null),
        }),
      })

      const mockUser2Ctx = {
        db: {
          query: mockUser2Query,
        },
      } as unknown as QueryCtx

      // Act
      const user1Result = await checkUsage(mockUser1Ctx, user1, month)
      const user2Result = await checkUsage(mockUser2Ctx, user2, month)

      // Assert
      expect(user1Result.allowed).toBe(false)
      expect(user1Result.count).toBe(5)

      expect(user2Result.allowed).toBe(true)
      expect(user2Result.count).toBe(0)
    })
  })
})
