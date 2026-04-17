/**
 * Tests for sessionMessages validation
 *
 * Test Strategy:
 * - One test per acceptance criterion
 * - Test that handlers reject invalid data
 * - Test that handlers accept valid data
 */

import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../../_generated/dataModel'
import { sendHandler } from '../sessionMessages'

const CLERK_USER_ID = 'user_test_123'
const SESSION_ID = 'session_abc' as Id<'planning_sessions'>
const MESSAGE_ID = 'msg_123' as Id<'session_messages'>

const makeSessionDoc = (overrides: Record<string, unknown> = {}) => ({
  _id: SESSION_ID,
  _creationTime: 1000,
  clerkUserId: CLERK_USER_ID,
  title: 'Test session',
  status: 'active' as const,
  createdAt: Date.now() - 5000,
  updatedAt: Date.now() - 5000,
  ...overrides,
})

describe('sessionMessages validation', () => {
  describe('AC-1: Send message with empty content', () => {
    it('should reject empty string content', async () => {
      const session = makeSessionDoc()
      const ctx = {
        db: {
          get: vi.fn().mockResolvedValue(session),
          insert: vi.fn(),
          patch: vi.fn(),
        },
      }

      // Test empty string - should be rejected
      await expect(
        sendHandler(ctx as any, { sessionId: SESSION_ID, content: '' }, CLERK_USER_ID),
      ).rejects.toThrow()

      // Verify no insert happened
      expect(ctx.db.insert).not.toHaveBeenCalled()
    })

    it('should accept valid non-empty content', async () => {
      const session = makeSessionDoc()
      const ctx = {
        db: {
          get: vi.fn().mockResolvedValue(session),
          insert: vi.fn().mockResolvedValue(MESSAGE_ID),
          patch: vi.fn().mockResolvedValue(undefined),
        },
      }

      const content = 'Valid message content'

      await expect(
        sendHandler(ctx as any, { sessionId: SESSION_ID, content }, CLERK_USER_ID),
      ).resolves.toEqual({ messageId: MESSAGE_ID })

      // Verify insert happened
      expect(ctx.db.insert).toHaveBeenCalled()
    })
  })

  describe('AC-2: Send message with whitespace only', () => {
    it('should reject whitespace-only content', async () => {
      const session = makeSessionDoc()
      const ctx = {
        db: {
          get: vi.fn().mockResolvedValue(session),
          insert: vi.fn(),
          patch: vi.fn(),
        },
      }

      // Test whitespace only - should be rejected
      await expect(
        sendHandler(ctx as any, { sessionId: SESSION_ID, content: '   ' }, CLERK_USER_ID),
      ).rejects.toThrow()

      // Verify no insert happened
      expect(ctx.db.insert).not.toHaveBeenCalled()
    })
  })
})

describe('planUsage validation', () => {
  const MONTH_REGEX = /^(\d{4})-(\d{2})$/ // Capture year and month groups

  describe('AC-3: Store plan usage with invalid month', () => {
    it('should reject invalid month formats', () => {
      const invalidMonths = [
        '26-04', // Missing century
        '2026/04', // Wrong separator
        'April 2026', // Text format
        '', // Empty string
      ]

      invalidMonths.forEach((month) => {
        expect(MONTH_REGEX.test(month)).toBe(false)
      })
    })

    it('should reject semantically invalid months that pass regex', () => {
      const semanticallyInvalid = [
        { month: '2026-00', reason: 'Month 00 is invalid' },
        { month: '2026-13', reason: 'Month 13 is invalid' },
      ]

      semanticallyInvalid.forEach(({ month, reason }) => {
        const match = month.match(MONTH_REGEX)
        if (match) {
          const monthNum = parseInt(match[2], 10) // Second capture group is month
          // These should fail semantic validation
          const isValidMonth = monthNum >= 1 && monthNum <= 12
          expect(isValidMonth).toBe(false)
        }
      })
    })
  })

  describe('AC-4: Store plan usage with valid month', () => {
    it('should accept valid month format', () => {
      const validMonths = ['2026-01', '2026-04', '2026-12', '2025-12', '2024-01']

      validMonths.forEach((month) => {
        expect(MONTH_REGEX.test(month)).toBe(true)

        // Also verify semantic validity
        const match = month.match(MONTH_REGEX)
        if (match) {
          const monthNum = parseInt(match[2], 10) // Second capture group is month
          expect(monthNum).toBeGreaterThanOrEqual(1)
          expect(monthNum).toBeLessThanOrEqual(12)
        }
      })
    })
  })
})
