/**
 * Integration tests for planUsage rate limiting in createPlan flow
 *
 * Test Strategy:
 * - Test full flow from plan creation through rate limit check to error message
 * - Test conversational error scenarios
 * - Test full flow end-to-end
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { ConvexError } from 'convex/values'
import type { Id } from '../../_generated/dataModel'
import { ERROR_CODES } from '../../errors'
import { getConversationalError } from '../../lib/conversationalErrors'

// ---------------------------------------------------------------------------
// Test fixtures
// ---------------------------------------------------------------------------

const CLERK_USER_ID = 'user_integration_123'
const PLAN_ID = 'route_plans_integration' as Id<'route_plans'>
const SCHEDULED_ACTION_ID = 'sched_action_integration' as Id<'_scheduled_functions'>

const basePlanInput = {
  start: { label: 'Start City', lat: 37.7749, lng: -122.4194 },
  end: { label: 'End City', lat: 34.0522, lng: -118.2437 },
  departureTime: 1711670400000,
  preferences: { scenicBias: 'default' as const },
} as any

// Mock plan usage record for a user at limit
const createUsageCheckMock = (allowed: boolean, count: number) => {
  return {
    count,
    limit: 5,
    allowed,
    remaining: Math.max(0, 5 - count),
  }
}

// ---------------------------------------------------------------------------
// Integration Tests
// ---------------------------------------------------------------------------

describe('planUsage integration with createPlan', () => {
  let originalCheckUsage: any
  let originalIncrementUsage: any

  beforeEach(async () => {
    // Import and store original functions
    const planUsageModule = await import('../planUsage')
    originalCheckUsage = planUsageModule.checkUsage
    originalIncrementUsage = planUsageModule.incrementUsage
  })

  afterEach(() => {
    // Restore original functions
    vi.restoreAllMocks()
  })

  describe('AC1: Given user has 5 plans this month, when attempts 6th plan, then conversational upsell message returned', () => {
    it('should throw RATE_LIMIT_EXCEEDED when user has reached monthly limit', async () => {
      // Arrange - User at limit (5 plans)
      const mockCheckUsage = vi.fn().mockResolvedValue(
        createUsageCheckMock(false, 5)
      )

      const ctx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(null),
              }),
            }),
          }),
          insert: vi.fn(),
          patch: vi.fn(),
        },
        scheduler: {
          runAfter: vi.fn(),
        },
      }

      // Mock checkUsage to be called from routePlans
      const planUsageModule = await import('../planUsage')
      vi.spyOn(planUsageModule, 'checkUsage').mockImplementation(mockCheckUsage)

      // Import createPlanHandler after mocking
      const { createPlanHandler } = await import('../routePlans')

      // Act & Assert
      await expect(
        createPlanHandler(
          ctx as any,
          { planInput: basePlanInput, startLabel: 'Start City', endLabel: 'End City' },
          CLERK_USER_ID
        )
      ).rejects.toThrow(ConvexError)

      await expect(
        createPlanHandler(
          ctx as any,
          { planInput: basePlanInput },
          CLERK_USER_ID
        )
      ).rejects.toThrow(ERROR_CODES.RATE_LIMIT_EXCEEDED)

      // Verify checkUsage was called
      expect(mockCheckUsage).toHaveBeenCalled()

      // Verify plan was NOT created
      expect(ctx.db.insert).not.toHaveBeenCalled()
    })

    it('should return conversational error message for rate limit exceeded', () => {
      // Act
      const conversationalError = getConversationalError(ERROR_CODES.RATE_LIMIT_EXCEEDED)

      // Assert
      expect(conversationalError.code).toBe(ERROR_CODES.RATE_LIMIT_EXCEEDED)
      expect(conversationalError.message).toContain('monthly limit')
      expect(conversationalError.suggestion).toContain('Upgrade to Premium')
      expect(conversationalError.canRetry).toBe(false)
    })
  })

  describe('AC2: Given rate limit OK, when plan created successfully, then usage incremented', () => {
    it('should check usage, create plan, and increment usage when under limit', async () => {
      // Arrange - User has 3 plans (2 remaining)
      const mockCheckUsage = vi.fn().mockResolvedValue(
        createUsageCheckMock(true, 3)
      )

      const mockIncrementUsage = vi.fn().mockResolvedValue(
        createUsageCheckMock(true, 4)
      )

      const ctx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(null),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue(PLAN_ID),
          patch: vi.fn().mockResolvedValue(undefined),
        },
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(SCHEDULED_ACTION_ID),
        },
      }

      // Mock checkUsage and incrementUsage
      const planUsageModule = await import('../planUsage')
      vi.spyOn(planUsageModule, 'checkUsage').mockImplementation(mockCheckUsage)
      vi.spyOn(planUsageModule, 'incrementUsage').mockImplementation(mockIncrementUsage)

      // Import createPlanHandler after mocking
      const { createPlanHandler } = await import('../routePlans')

      // Act
      const result = await createPlanHandler(
        ctx as any,
        { planInput: basePlanInput, startLabel: 'Start City', endLabel: 'End City' },
        CLERK_USER_ID
      )

      // Assert
      expect(mockCheckUsage).toHaveBeenCalled()

      // Verify plan was created
      expect(ctx.db.insert).toHaveBeenCalledWith(
        'route_plans',
        expect.objectContaining({
          clerkUserId: CLERK_USER_ID,
          status: 'pending',
          planInput: basePlanInput,
        })
      )

      // Verify usage was incremented
      expect(mockIncrementUsage).toHaveBeenCalled()

      // Verify execution was scheduled
      expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
        0,
        expect.anything(),
        { routePlanId: PLAN_ID }
      )

      expect(result).toEqual({ routePlanId: PLAN_ID })
    })
  })

  describe('AC3: Low confidence parse returns helpful clarification message', () => {
    it('should return conversational error for low confidence parse', () => {
      // Act
      const conversationalError = getConversationalError(ERROR_CODES.LOW_CONFIDENCE_PARSE)

      // Assert
      expect(conversationalError.code).toBe(ERROR_CODES.LOW_CONFIDENCE_PARSE)
      expect(conversationalError.message).toContain('trouble understanding')
      expect(conversationalError.suggestion).toContain('more details')
      expect(conversationalError.canRetry).toBe(true)
    })
  })

  describe('AC4: Network timeout returns retry suggestion message', () => {
    it('should return conversational error for network timeout', () => {
      // Act
      const conversationalError = getConversationalError(ERROR_CODES.NETWORK_TIMEOUT)

      // Assert
      expect(conversationalError.code).toBe(ERROR_CODES.NETWORK_TIMEOUT)
      expect(conversationalError.message).toContain('too long')
      expect(conversationalError.suggestion).toContain('try again')
      expect(conversationalError.canRetry).toBe(true)
    })

    it('should return conversational error for agent timeout', () => {
      // Act
      const conversationalError = getConversationalError(ERROR_CODES.AGENT_TIMEOUT)

      // Assert
      expect(conversationalError.code).toBe(ERROR_CODES.AGENT_TIMEOUT)
      expect(conversationalError.message).toContain('longer than expected')
      expect(conversationalError.suggestion).toContain('try again')
      expect(conversationalError.canRetry).toBe(true)
    })
  })

  describe('AC5: Integration test - Full flow from plan creation through rate limit check to error message', () => {
    it('should test complete rate limiting flow end-to-end for successful plan creation', async () => {
      // Test - User with 4 plans (1 remaining) should succeed
      const mockCheckUsage = vi.fn().mockResolvedValue(
        createUsageCheckMock(true, 4)
      )

      const mockIncrementUsage = vi.fn().mockResolvedValue(
        createUsageCheckMock(true, 5)
      )

      // Mock functions
      const planUsageModule = await import('../planUsage')
      vi.spyOn(planUsageModule, 'checkUsage').mockImplementation(mockCheckUsage)
      vi.spyOn(planUsageModule, 'incrementUsage').mockImplementation(mockIncrementUsage)

      // Import createPlanHandler after mocking
      const { createPlanHandler } = await import('../routePlans')

      const ctx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(null),
              }),
            }),
          }),
          insert: vi.fn().mockResolvedValue(PLAN_ID),
          patch: vi.fn().mockResolvedValue(undefined),
        },
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(SCHEDULED_ACTION_ID),
        },
      }

      // Act - Plan creation should succeed
      const result = await createPlanHandler(
        ctx as any,
        { planInput: basePlanInput },
        CLERK_USER_ID
      )

      // Assert - Plan created successfully
      expect(result).toEqual({ routePlanId: PLAN_ID })
      expect(mockCheckUsage).toHaveBeenCalledTimes(1)
      expect(mockIncrementUsage).toHaveBeenCalledTimes(1)
    })

    it('should test complete rate limiting flow end-to-end for rate limit exceeded', async () => {
      // Test - User with 5 plans (at limit) should fail
      const mockCheckUsage = vi.fn().mockResolvedValue(
        createUsageCheckMock(false, 5)
      )

      // Mock functions
      const planUsageModule = await import('../planUsage')
      vi.spyOn(planUsageModule, 'checkUsage').mockImplementation(mockCheckUsage)

      // Import createPlanHandler after mocking
      const { createPlanHandler } = await import('../routePlans')

      const ctx = {
        db: {
          query: vi.fn().mockReturnValue({
            withIndex: vi.fn().mockReturnValue({
              filter: vi.fn().mockReturnValue({
                first: vi.fn().mockResolvedValue(null),
              }),
            }),
          }),
          insert: vi.fn(),
          patch: vi.fn(),
        },
        scheduler: {
          runAfter: vi.fn(),
        },
      }

      // Act & Assert - Plan creation should fail
      await expect(
        createPlanHandler(
          ctx as any,
          { planInput: basePlanInput },
          CLERK_USER_ID
        )
      ).rejects.toThrow(ERROR_CODES.RATE_LIMIT_EXCEEDED)

      // Verify plan was NOT created
      expect(ctx.db.insert).not.toHaveBeenCalled()
    })
  })

  describe('Edge cases and additional conversational errors', () => {
    it('should handle weather unavailable error', () => {
      // Act
      const conversationalError = getConversationalError(ERROR_CODES.WEATHER_UNAVAILABLE)

      // Assert
      expect(conversationalError.code).toBe(ERROR_CODES.WEATHER_UNAVAILABLE)
      expect(conversationalError.message).toContain('unavailable')
      expect(conversationalError.suggestion).toContain('still plan your route')
      expect(conversationalError.canRetry).toBe(true)
    })

    it('should handle no routes generated error', () => {
      // Act
      const conversationalError = getConversationalError(ERROR_CODES.NO_ROUTES_GENERATED)

      // Assert
      expect(conversationalError.code).toBe(ERROR_CODES.NO_ROUTES_GENERATED)
      expect(conversationalError.message).toContain('find any routes')
      expect(conversationalError.suggestion).toContain('adjusting your preferences')
      expect(conversationalError.canRetry).toBe(true)
    })

    it('should handle generation failed error', () => {
      // Act
      const conversationalError = getConversationalError(ERROR_CODES.GENERATION_FAILED)

      // Assert
      expect(conversationalError.code).toBe(ERROR_CODES.GENERATION_FAILED)
      expect(conversationalError.message).toContain('generate a route plan')
      expect(conversationalError.suggestion).toContain('different approach')
      expect(conversationalError.canRetry).toBe(true)
    })

    it('should handle unknown error with fallback message', () => {
      // Act
      const conversationalError = getConversationalError('UNKNOWN_ERROR_CODE')

      // Assert
      expect(conversationalError.code).toBe('UNKNOWN_ERROR')
      expect(conversationalError.message).toContain('unexpected')
      expect(conversationalError.suggestion).toContain('try again')
      expect(conversationalError.canRetry).toBe(true)
    })
  })
})
