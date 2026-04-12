/**
 * Tests for routeFeedback.ts - User feedback on curated routes
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ConvexError } from 'convex/values'
import type { Id } from '../_generated/dataModel'
import {
  recordRouteFeedbackHandler,
  recordRouteFeedbackInputValidator,
  routeFeedbackActionValidator,
} from '../db/routeFeedback'

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const makeFeedbackInput = (overrides: Record<string, unknown> = {}) => ({
  routeId: 'test-route-1',
  action: 'save' as const,
  rating: undefined,
  locationLat: undefined,
  locationLng: undefined,
  archetypeFilter: undefined,
  ...overrides,
})

// ---------------------------------------------------------------------------
// Mock context
// ---------------------------------------------------------------------------

let mockInsertCalls: { table: string; fields: object }[]
let mockFeedbackId: Id<'route_feedback'>

const mockCtx = {
  db: {
    insert: async (table: string, fields: object) => {
      mockInsertCalls.push({ table, fields })
      return mockFeedbackId
    },
  },
}

beforeEach(() => {
  mockInsertCalls = []
  mockFeedbackId = 'test-feedback-id' as Id<'route_feedback'>
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('routeFeedback', () => {
  describe('AC-001: Valid Feedback Recorded', () => {
    it('should record save action', async () => {
      const input = makeFeedbackInput({ action: 'save' })
      const result = await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(result.feedbackId).toBe(mockFeedbackId)
      expect(mockInsertCalls).toHaveLength(1)
      expect(mockInsertCalls[0]).toMatchObject({
        table: 'route_feedback',
        fields: {
          routeId: 'test-route-1',
          userId: 'user-123',
          action: 'save',
          timestamp: expect.any(Number),
        },
      })
    })

    it('should record hide action', async () => {
      const input = makeFeedbackInput({ action: 'hide' })
      const result = await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(result.feedbackId).toBe(mockFeedbackId)
      expect(mockInsertCalls[0].fields).toMatchObject({
        action: 'hide',
        userId: 'user-123',
      })
    })

    it('should record complete action', async () => {
      const input = makeFeedbackInput({ action: 'complete' })
      const result = await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(result.feedbackId).toBe(mockFeedbackId)
      expect(mockInsertCalls[0].fields).toMatchObject({
        action: 'complete',
        userId: 'user-123',
      })
    })

    it('should use userId from auth parameter', async () => {
      const input = makeFeedbackInput({ action: 'save' })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'auth-user-456')

      expect(mockInsertCalls[0].fields).toMatchObject({
        userId: 'auth-user-456',
      })
    })

    it('should generate server timestamp', async () => {
      const before = Date.now()
      const input = makeFeedbackInput({ action: 'save' })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      const after = Date.now()

      expect(mockInsertCalls[0].fields).toMatchObject({
        timestamp: expect.any(Number),
      })
      const timestamp = mockInsertCalls[0].fields as { timestamp: number }
      expect(timestamp.timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp.timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('AC-002: Rating Required for Rate Action', () => {
    it('should record rate action with valid rating', async () => {
      const input = makeFeedbackInput({ action: 'rate', rating: 5 })
      const result = await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(result.feedbackId).toBe(mockFeedbackId)
      expect(mockInsertCalls[0].fields).toMatchObject({
        action: 'rate',
        rating: 5,
      })
    })

    it('should accept rating of 1', async () => {
      const input = makeFeedbackInput({ action: 'rate', rating: 1 })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(mockInsertCalls[0].fields).toMatchObject({ rating: 1 })
    })

    it('should reject rate action with missing rating', async () => {
      const input = makeFeedbackInput({ action: 'rate', rating: undefined })

      await expect(
        recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      ).rejects.toThrow(ConvexError)
      await expect(
        recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      ).rejects.toThrow('INVALID_RATING')
    })

    it('should reject rate action with rating below 1', async () => {
      const input = makeFeedbackInput({ action: 'rate', rating: 0 })

      await expect(
        recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      ).rejects.toThrow('INVALID_RATING')
    })

    it('should reject rate action with rating above 5', async () => {
      const input = makeFeedbackInput({ action: 'rate', rating: 6 })

      await expect(
        recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      ).rejects.toThrow('INVALID_RATING')
    })
  })

  describe('AC-003: Rating Forbidden for Non-Rate Actions', () => {
    it('should reject save action with rating', async () => {
      const input = makeFeedbackInput({ action: 'save', rating: 3 })

      await expect(
        recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      ).rejects.toThrow('RATING_ONLY_ALLOWED_ON_RATE')
    })

    it('should reject hide action with rating', async () => {
      const input = makeFeedbackInput({ action: 'hide', rating: 4 })

      await expect(
        recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      ).rejects.toThrow('RATING_ONLY_ALLOWED_ON_RATE')
    })

    it('should reject complete action with rating', async () => {
      const input = makeFeedbackInput({ action: 'complete', rating: 5 })

      await expect(
        recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      ).rejects.toThrow('RATING_ONLY_ALLOWED_ON_RATE')
    })
  })

  describe('AC-004: Server-Side Authority for userId and Timestamp', () => {
    it('should use userId from parameter, not from input', async () => {
      const input = makeFeedbackInput({ action: 'save' })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'auth-user-789')

      expect(mockInsertCalls[0].fields).toMatchObject({
        userId: 'auth-user-789',
      })
    })

    it('should generate timestamp, not accept from input', async () => {
      const before = Date.now()
      const input = makeFeedbackInput({ action: 'save' })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')
      const after = Date.now()

      const timestamp = mockInsertCalls[0].fields as { timestamp: number }
      expect(timestamp.timestamp).toBeGreaterThanOrEqual(before)
      expect(timestamp.timestamp).toBeLessThanOrEqual(after)
    })
  })

  describe('Optional Fields', () => {
    it('should record locationLat when provided', async () => {
      const input = makeFeedbackInput({ action: 'save', locationLat: 37.7749 })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(mockInsertCalls[0].fields).toMatchObject({
        locationLat: 37.7749,
      })
    })

    it('should record locationLng when provided', async () => {
      const input = makeFeedbackInput({ action: 'save', locationLng: -122.4194 })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(mockInsertCalls[0].fields).toMatchObject({
        locationLng: -122.4194,
      })
    })

    it('should record archetypeFilter when provided', async () => {
      const input = makeFeedbackInput({ action: 'save', archetypeFilter: 'twisties' })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(mockInsertCalls[0].fields).toMatchObject({
        archetypeFilter: 'twisties',
      })
    })

    it('should record all optional fields together', async () => {
      const input = makeFeedbackInput({
        action: 'save',
        locationLat: 37.7749,
        locationLng: -122.4194,
        archetypeFilter: 'coastal',
      })
      await recordRouteFeedbackHandler(mockCtx as any, input, 'user-123')

      expect(mockInsertCalls[0].fields).toMatchObject({
        locationLat: 37.7749,
        locationLng: -122.4194,
        archetypeFilter: 'coastal',
      })
    })
  })
})
