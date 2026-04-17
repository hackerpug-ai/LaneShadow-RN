/**
 * Tests for planRideOrchestrator enrichment integration
 *
 * Tests the integration of background enrichment into the executePlanHandler
 * following TDD principles: RED → GREEN → REFACTOR
 */

import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../../../../../convex/_generated/dataModel'
import type { PlanInput } from '../../../../../models/saved-routes'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildPlanInput = (overrides?: Partial<PlanInput>): PlanInput => ({
  start: { lat: 37.7749, lng: -122.4194, label: 'San Francisco' },
  end: { lat: 34.0522, lng: -118.2437, label: 'Los Angeles' },
  departureTime: 1_700_000_000_000,
  preferences: {
    scenicBias: 'high',
    avoidHighways: true,
  },
  ...overrides,
})

const mockRoutePlanId = 'route_plans_mock_id' as Id<'route_plans'>
const mockClerkUserId = 'user_test_123'
const mockEnrichmentId = 'route_enrichments_mock_id' as Id<'route_enrichments'>
const mockScheduledJobId = 'scheduled_functions_mock_id' as Id<'_scheduled_functions'>

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('executePlanHandler - Enrichment Integration', () => {
  describe('AC-1: Orchestrator generates content fingerprint for route plan', () => {
    it('should generate content fingerprint from plan input', async () => {
      // Verify that generateContentFingerprint can be called and returns a valid fingerprint
      const planInput = buildPlanInput()
      const { generateContentFingerprint } = await import('../enrichmentCache.js')

      const fingerprint = generateContentFingerprint(planInput)

      expect(fingerprint).toBeDefined()
      expect(typeof fingerprint).toBe('string')
      expect(fingerprint).toMatch(/^[a-f0-9]{32}$/) // MD5 hash format
    })
  })

  describe('AC-2: Checks cache for existing enrichment before scheduling new job', () => {
    it('should call findByContentFingerprint query with generated fingerprint', async () => {
      // This test verifies the cache check behavior
      // We'll mock the context and verify the correct query is called

      const planInput = buildPlanInput()
      const { generateContentFingerprint } = await import('../enrichmentCache.js')
      const fingerprint = generateContentFingerprint(planInput)

      const mockCtx = {
        runQuery: vi.fn().mockResolvedValue(null), // Cache miss
        runMutation: vi.fn().mockResolvedValue(mockEnrichmentId),
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(mockScheduledJobId),
        },
      }

      // Import the handler we're testing
      const { executePlanHandler } = await import('../../planRide.js')

      // Mock the orchestrator to return a simple result
      const mockOrchestrator = vi.fn().mockResolvedValue([
        {
          routeSnapshot: {
            provider: 'google',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            origin: { lat: 0, lng: 0 },
            destination: { lat: 1, lng: 1 },
            waypoints: [],
            overviewGeometry: {
              format: 'polyline' as const,
              encoding: 'encoded_polyline',
              precision: 5,
              value: 'test',
            },
            legs: [],
            annotations: [],
            overlays: {},
          },
          sketch: { label: 'Route 1', rationale: '' },
        },
      ])

      // Mock the plan record
      let callCount = 0
      mockCtx.runQuery.mockImplementation((ref: any, args: any) => {
        callCount++
        // First call is to get the plan, second call is cache check
        if (args?.routePlanId && callCount === 1) {
          return Promise.resolve({
            _id: mockRoutePlanId,
            planInput,
            clerkUserId: mockClerkUserId,
            status: 'running',
          })
        }
        if (args?.routePlanId && callCount > 1) {
          // Cancellation check
          return Promise.resolve({
            _id: mockRoutePlanId,
            planInput,
            clerkUserId: mockClerkUserId,
            status: 'running',
          })
        }
        // Cache check call
        if (args?.contentFingerprint !== undefined) {
          return Promise.resolve(null) // Cache miss
        }
        return Promise.resolve(null)
      })

      // Call the handler
      await executePlanHandler(mockCtx as any, { routePlanId: mockRoutePlanId }, mockOrchestrator)

      // Verify cache was checked with the correct fingerprint
      const cacheCheckCalls = mockCtx.runQuery.mock.calls.filter(
        (call) => call[1]?.contentFingerprint !== undefined,
      )

      // This will fail until we implement the cache check
      expect(cacheCheckCalls.length).toBeGreaterThan(0)

      if (cacheCheckCalls.length > 0) {
        const [, args] = cacheCheckCalls[0]
        expect(args).toEqual({
          contentFingerprint: fingerprint,
          phase: 'fast',
        })
      }
    })
  })

  describe('AC-3: Schedules background enrichment job when cache miss', () => {
    it('should schedule enrichment job with 100ms delay when no cached enrichment exists', async () => {
      const planInput = buildPlanInput()
      let queryCallCount = 0
      let _mutationCallCount = 0

      const mockCtx = {
        runQuery: vi.fn().mockImplementation((ref: any, args: any) => {
          queryCallCount++
          if (args?.routePlanId && queryCallCount === 1) {
            return Promise.resolve({
              _id: mockRoutePlanId,
              planInput,
              clerkUserId: mockClerkUserId,
              status: 'running',
            })
          }
          if (args?.routePlanId && queryCallCount > 1) {
            return Promise.resolve({
              _id: mockRoutePlanId,
              planInput,
              clerkUserId: mockClerkUserId,
              status: 'running',
            })
          }
          return Promise.resolve(null) // Cache miss
        }),
        runMutation: vi.fn().mockImplementation((ref: any, args: any) => {
          _mutationCallCount++
          // createEnrichment should return enrichmentId
          if (args?.routePlanId && args?.clerkUserId && args?.contentFingerprint) {
            return Promise.resolve({ enrichmentId: mockEnrichmentId })
          }
          // All other mutations return generic success
          return Promise.resolve({ _id: mockRoutePlanId, status: 'running' })
        }),
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(mockScheduledJobId),
        },
      }

      const { executePlanHandler } = await import('../../planRide.js')

      const mockOrchestrator = vi.fn().mockResolvedValue([
        {
          routeSnapshot: {
            provider: 'google',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            origin: { lat: 0, lng: 0 },
            destination: { lat: 1, lng: 1 },
            waypoints: [],
            overviewGeometry: {
              format: 'polyline' as const,
              encoding: 'encoded_polyline',
              precision: 5,
              value: 'test',
            },
            legs: [],
            annotations: [],
            overlays: {},
          },
          sketch: { label: 'Route 1', rationale: '' },
        },
      ])

      await executePlanHandler(mockCtx as any, { routePlanId: mockRoutePlanId }, mockOrchestrator)

      // Verify scheduler.runAfter was called with 100ms delay
      const schedulerCalls = mockCtx.scheduler.runAfter.mock.calls
      expect(schedulerCalls.length).toBeGreaterThan(0)

      const [delayMs, _jobFunc, jobArgs] = schedulerCalls[0]
      expect(delayMs).toBe(100)
      expect(jobArgs).toEqual({
        enrichmentId: mockEnrichmentId,
        phase: 'fast',
      })
    })
  })

  describe('AC-4: Returns immediate results with fallback labels', () => {
    it('should return results immediately without waiting for enrichment', async () => {
      const planInput = buildPlanInput()
      const mockCtx = {
        runQuery: vi.fn().mockResolvedValue(null),
        runMutation: vi.fn().mockResolvedValue({}),
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(mockScheduledJobId),
        },
      }

      const { executePlanHandler } = await import('../../planRide.js')

      const mockOrchestrator = vi.fn().mockResolvedValue([
        {
          routeSnapshot: {
            provider: 'google',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            origin: { lat: 0, lng: 0 },
            destination: { lat: 1, lng: 1 },
            waypoints: [],
            overviewGeometry: {
              format: 'polyline' as const,
              encoding: 'encoded_polyline',
              precision: 5,
              value: 'test',
            },
            legs: [],
            annotations: [],
            overlays: {},
          },
          sketch: { label: 'Route 1', rationale: '' },
        },
      ])

      mockCtx.runQuery.mockImplementation((ref: any, args: any) => {
        if (args?.routePlanId) {
          return Promise.resolve({
            _id: mockRoutePlanId,
            planInput,
            clerkUserId: mockClerkUserId,
            status: 'running',
          })
        }
        return Promise.resolve(null)
      })

      // Execute should complete without waiting for enrichment
      await executePlanHandler(mockCtx as any, { routePlanId: mockRoutePlanId }, mockOrchestrator)

      // Verify the orchestrator was called (results returned)
      expect(mockOrchestrator).toHaveBeenCalled()

      // Verify enrichment was scheduled asynchronously (not awaited)
      expect(mockCtx.scheduler.runAfter).toHaveBeenCalled()

      // The key test: scheduler.runAfter should be called AFTER the orchestrator completes
      // This ensures non-blocking behavior
      const orchestratorCallOrder = mockOrchestrator.mock.invocationCallOrder[0]
      const schedulerCallOrder = mockCtx.scheduler.runAfter.mock.invocationCallOrder[0]
      expect(orchestratorCallOrder).toBeLessThan(schedulerCallOrder)
    })
  })

  describe('AC-5: Stores scheduledJobId in enrichment record', () => {
    it('should update enrichment record with scheduled job ID after scheduling', async () => {
      const planInput = buildPlanInput()
      let queryCallCount = 0

      const mockCtx = {
        runQuery: vi.fn().mockImplementation((ref: any, args: any) => {
          queryCallCount++
          if (args?.routePlanId && queryCallCount === 1) {
            return Promise.resolve({
              _id: mockRoutePlanId,
              planInput,
              clerkUserId: mockClerkUserId,
              status: 'running',
            })
          }
          if (args?.routePlanId && queryCallCount > 1) {
            return Promise.resolve({
              _id: mockRoutePlanId,
              planInput,
              clerkUserId: mockClerkUserId,
              status: 'running',
            })
          }
          return Promise.resolve(null)
        }),
        runMutation: vi
          .fn()
          .mockResolvedValueOnce({ _id: mockRoutePlanId, status: 'running' })
          .mockResolvedValueOnce({ _id: mockRoutePlanId, status: 'running' })
          .mockResolvedValue({ enrichmentId: mockEnrichmentId })
          .mockResolvedValueOnce({ _id: mockRoutePlanId, status: 'completed' }),
        scheduler: {
          runAfter: vi.fn().mockResolvedValue(mockScheduledJobId),
        },
      }

      const { executePlanHandler } = await import('../../planRide.js')

      const mockOrchestrator = vi.fn().mockResolvedValue([
        {
          routeSnapshot: {
            provider: 'google',
            bounds: { north: 1, south: 0, east: 1, west: 0 },
            origin: { lat: 0, lng: 0 },
            destination: { lat: 1, lng: 1 },
            waypoints: [],
            overviewGeometry: {
              format: 'polyline' as const,
              encoding: 'encoded_polyline',
              precision: 5,
              value: 'test',
            },
            legs: [],
            annotations: [],
            overlays: {},
          },
          sketch: { label: 'Route 1', rationale: '' },
        },
      ])

      await executePlanHandler(mockCtx as any, { routePlanId: mockRoutePlanId }, mockOrchestrator)

      // Verify updateEnrichment was called with scheduledJobId
      const updateEnrichmentCalls = mockCtx.runMutation.mock.calls.filter((call) => {
        // Check if any argument has scheduledJobId
        return call.some((arg: any) => arg?.scheduledJobId === mockScheduledJobId)
      })

      expect(updateEnrichmentCalls.length).toBeGreaterThan(0)
    })
  })
})
