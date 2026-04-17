// Set env variables before imports
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { runEnrichmentJobHandler } from '../runEnrichmentJob'

process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'
process.env.CLERK_WEBHOOK_SECRET = 'test-secret'

'use node'

// Mock Id type for tests
type Id<T> = string

const CLERK_USER_ID = 'user_test_123'
const ENRICHMENT_ID = 'route_enrichments_id_abc' as Id<'route_enrichments'>
const ROUTE_PLAN_ID = 'route_plans_id_xyz' as Id<'route_plans'>
const PLANNING_SESSION_ID = 'planning_sessions_id_123' as Id<'planning_sessions'>

describe('runEnrichmentJob', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('AC-1: Status updates to running when job starts', () => {
    it('should update enrichment status to running when job starts', async () => {
      const mockEnrichment = {
        _id: ENRICHMENT_ID,
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast' as const,
        status: 'pending' as const,
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      }

      const mockRoutePlan = {
        result: {
          provider: 'google',
          bounds: { north: 37.8, south: 37.7, east: -122.4, west: -122.5 },
          origin: { lat: 37.7749, lng: -122.4194 },
          destination: { lat: 37.8199, lng: -122.4783 },
          waypoints: [],
          overviewGeometry: {
            format: 'polyline' as const,
            encoding: 'utf-8',
            precision: 5,
            value: 'encoded_polyline_here',
          },
          legs: [
            {
              legIndex: 0,
              start: { lat: 37.7749, lng: -122.4194 },
              end: { lat: 37.8199, lng: -122.4783 },
              distanceMeters: 8500,
              durationSeconds: 900,
              geometry: {
                format: 'polyline' as const,
                encoding: 'utf-8',
                precision: 5,
                value: 'leg_polyline',
              },
            },
          ],
          annotations: [
            {
              id: 'place_1',
              annotationKind: 'place' as const,
              label: 'Golden Gate Bridge',
              lat: 37.8199,
              lng: -122.4783,
            },
          ],
          overlays: {},
        },
        planInput: {
          start: { lat: 37.7749, lng: -122.4194 },
          end: { lat: 37.8199, lng: -122.4783 },
          departureTime: Date.now() + 3600000,
          preferences: {
            scenicBias: 'default' as const,
          },
        },
      }

      const updateStatusCalls: any[] = []
      const completeEnrichmentCalls: any[] = []
      const mergeEnrichmentCalls: any[] = []

      // Mock ctx.runQuery
      const mockRunQuery = vi.fn((func, args) => {
        // Call the function with args and return expected result
        if (args && 'enrichmentId' in args) {
          return Promise.resolve(mockEnrichment)
        }
        if (args && 'routePlanId' in args) {
          return Promise.resolve(mockRoutePlan)
        }
        return Promise.resolve(null)
      })

      // Mock ctx.runMutation
      const mockRunMutation = vi.fn((func, args) => {
        // Track all mutation calls
        if (args && 'status' in args && args.status === 'running') {
          updateStatusCalls.push(args)
        }
        if (args && 'enrichmentId' in args && 'enrichments' in args) {
          // completeEnrichment mutation
          completeEnrichmentCalls.push(args)
        }
        return Promise.resolve(undefined)
      })

      const mockCtx = {
        runQuery: mockRunQuery,
        runMutation: mockRunMutation,
      }

      // Run the job
      await runEnrichmentJobHandler(mockCtx as any, {
        // @ts-ignore - Using mock IDs for testing
        enrichmentId: ENRICHMENT_ID,
        phase: 'fast',
      })

      // Verify status was updated to running
      expect(updateStatusCalls).toHaveLength(1)
      expect(updateStatusCalls[0]).toEqual({
        enrichmentId: ENRICHMENT_ID,
        status: 'running',
      })

      // Verify enrichment was completed
      expect(completeEnrichmentCalls).toHaveLength(1)
      expect(completeEnrichmentCalls[0].enrichmentId).toBe(ENRICHMENT_ID)
      expect(completeEnrichmentCalls[0].enrichments).toBeDefined()
      expect(completeEnrichmentCalls[0].enrichments).toHaveLength(1)
      expect(completeEnrichmentCalls[0].enrichments[0].label).toContain('km Route')

      // Verify merge was called (even though we don't track mergeEnrichmentCalls in this test)
      expect(mockRunMutation).toHaveBeenCalled()
    })
  })

  describe('AC-2: Job exits immediately when already cancelled', () => {
    it('should return early if enrichment is already cancelled', async () => {
      const mockEnrichment = {
        _id: ENRICHMENT_ID,
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast' as const,
        status: 'cancelled' as const,
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      }

      const updateStatusCalls: any[] = []

      const mockRunQuery = vi.fn((func, args) => {
        if (args && 'enrichmentId' in args) {
          return Promise.resolve(mockEnrichment)
        }
        return Promise.resolve(null)
      })

      const mockRunMutation = vi.fn((func, args) => {
        if (args && 'status' in args) {
          updateStatusCalls.push(args)
        }
        return Promise.resolve(undefined)
      })

      const mockCtx = {
        runQuery: mockRunQuery,
        runMutation: mockRunMutation,
      }

      // Run the job
      await runEnrichmentJobHandler(mockCtx as any, {
        // @ts-ignore - Using mock IDs for testing
        enrichmentId: ENRICHMENT_ID,
        phase: 'fast',
      })

      // Should not update status - should return early
      expect(updateStatusCalls).toHaveLength(0)
    })

    it('should return early if enrichment is not found', async () => {
      const mockRunQuery = vi.fn(() => Promise.resolve(null))
      const updateStatusCalls: any[] = []

      const mockRunMutation = vi.fn((name, args) => {
        if (name === 'updateStatus') {
          updateStatusCalls.push(args)
          return Promise.resolve(undefined)
        }
        return Promise.resolve(undefined)
      })

      const mockCtx = {
        runQuery: mockRunQuery,
        runMutation: mockRunMutation,
      }

      // Run the job
      await runEnrichmentJobHandler(mockCtx as any, {
        // @ts-ignore - Using mock IDs for testing
        enrichmentId: ENRICHMENT_ID,
        phase: 'fast',
      })

      // Should not update status - should return early
      expect(updateStatusCalls).toHaveLength(0)
    })
  })

  describe('AC-3: Enrichment results saved when job completes', () => {
    it('should save enrichment results with proper structure', async () => {
      const mockEnrichment = {
        _id: ENRICHMENT_ID,
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast' as const,
        status: 'pending' as const,
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      }

      const mockRoutePlan = {
        result: {
          provider: 'google',
          bounds: { north: 37.8, south: 37.7, east: -122.4, west: -122.5 },
          origin: { lat: 37.7749, lng: -122.4194 },
          destination: { lat: 37.8199, lng: -122.4783 },
          waypoints: [],
          overviewGeometry: {
            format: 'polyline' as const,
            encoding: 'utf-8',
            precision: 5,
            value: 'encoded_polyline_here',
          },
          legs: [
            {
              legIndex: 0,
              start: { lat: 37.7749, lng: -122.4194 },
              end: { lat: 37.8199, lng: -122.4783 },
              distanceMeters: 8500,
              durationSeconds: 900,
              geometry: {
                format: 'polyline' as const,
                encoding: 'utf-8',
                precision: 5,
                value: 'leg_polyline',
              },
            },
          ],
          annotations: [
            {
              id: 'place_1',
              annotationKind: 'place' as const,
              label: 'Golden Gate Bridge',
              lat: 37.8199,
              lng: -122.4783,
            },
          ],
          overlays: {},
        },
        planInput: {
          start: { lat: 37.7749, lng: -122.4194 },
          end: { lat: 37.8199, lng: -122.4783 },
          departureTime: Date.now() + 3600000,
          preferences: {
            scenicBias: 'high' as const,
          },
        },
      }

      const completeEnrichmentCalls: any[] = []
      const mergeEnrichmentCalls: any[] = []

      const mockRunQuery = vi.fn((func, args) => {
        if (args && 'enrichmentId' in args) {
          return Promise.resolve(mockEnrichment)
        }
        if (args && 'routePlanId' in args) {
          return Promise.resolve(mockRoutePlan)
        }
        return Promise.resolve(mockEnrichment) // Second call for cancellation check
      })

      const mockRunMutation = vi.fn((func, args) => {
        if (args && 'enrichmentId' in args && 'enrichments' in args) {
          // completeEnrichment mutation
          completeEnrichmentCalls.push(args)
        }
        if (args && 'routePlanId' in args && 'enrichments' in args) {
          // mergeEnrichment mutation
          mergeEnrichmentCalls.push(args)
        }
        return Promise.resolve(undefined)
      })

      const mockCtx = {
        runQuery: mockRunQuery,
        runMutation: mockRunMutation,
      }

      // Run the job
      await runEnrichmentJobHandler(mockCtx as any, {
        // @ts-ignore - Using mock IDs for testing
        enrichmentId: ENRICHMENT_ID,
        phase: 'fast',
      })

      // Verify enrichment was saved to route_enrichments table
      expect(completeEnrichmentCalls).toHaveLength(1)
      const savedEnrichment = completeEnrichmentCalls[0]

      expect(savedEnrichment.enrichmentId).toBe(ENRICHMENT_ID)
      expect(savedEnrichment.enrichments).toBeDefined()
      expect(savedEnrichment.enrichments).toHaveLength(1)

      // Verify enrichment was merged into route_plans table
      expect(mergeEnrichmentCalls).toHaveLength(1)
      const mergedEnrichment = mergeEnrichmentCalls[0]

      expect(mergedEnrichment.routePlanId).toBe(ROUTE_PLAN_ID)
      expect(mergedEnrichment.enrichments).toBeDefined()
      expect(mergedEnrichment.enrichments).toHaveLength(1)

      const enrichment = savedEnrichment.enrichments[0]
      expect(enrichment.routeOptionId).toBeDefined()
      expect(enrichment.label).toContain('Scenic')
      expect(enrichment.rationale).toBeDefined()
      expect(enrichment.highlights).toBeDefined()
      expect(enrichment.highlights).toContain('Golden Gate Bridge')
    })
  })

  describe('AC-4: Error saved and status failed when exception thrown', () => {
    it('should mark enrichment as failed when route plan is not found', async () => {
      const mockEnrichment = {
        _id: ENRICHMENT_ID,
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast' as const,
        status: 'pending' as const,
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      }

      const failEnrichmentCalls: any[] = []

      const mockRunQuery = vi.fn((func, args) => {
        if (args && 'enrichmentId' in args) {
          return Promise.resolve(mockEnrichment)
        }
        if (args && 'routePlanId' in args) {
          return Promise.resolve(null) // Route plan not found
        }
        return Promise.resolve(null)
      })

      const mockRunMutation = vi.fn((func, args) => {
        if (args && 'error' in args) {
          failEnrichmentCalls.push(args)
        }
        return Promise.resolve(undefined)
      })

      const mockCtx = {
        runQuery: mockRunQuery,
        runMutation: mockRunMutation,
      }

      // Run the job
      await runEnrichmentJobHandler(mockCtx as any, {
        // @ts-ignore - Using mock IDs for testing
        enrichmentId: ENRICHMENT_ID,
        phase: 'fast',
      })

      // Verify enrichment was marked as failed
      expect(failEnrichmentCalls).toHaveLength(1)
      expect(failEnrichmentCalls[0].enrichmentId).toBe(ENRICHMENT_ID)
      expect(failEnrichmentCalls[0].error).toContain('Route plan not found')
    })

    it('should handle unexpected errors and save error message', async () => {
      const mockEnrichment = {
        _id: ENRICHMENT_ID,
        routePlanId: ROUTE_PLAN_ID,
        clerkUserId: CLERK_USER_ID,
        contentFingerprint: 'abc123',
        phase: 'fast' as const,
        status: 'pending' as const,
        createdAt: Date.now() - 5000,
        updatedAt: Date.now() - 5000,
      }

      const failEnrichmentCalls: any[] = []

      const mockRunQuery = vi.fn((func, args) => {
        if (args && 'enrichmentId' in args) {
          return Promise.resolve(mockEnrichment)
        }
        // Simulate unexpected error
        throw new Error('Database connection failed')
      })

      const mockRunMutation = vi.fn((func, args) => {
        if (args && 'error' in args) {
          failEnrichmentCalls.push(args)
        }
        return Promise.resolve(undefined)
      })

      const mockCtx = {
        runQuery: mockRunQuery,
        runMutation: mockRunMutation,
      }

      // Run the job
      await runEnrichmentJobHandler(mockCtx as any, {
        // @ts-ignore - Using mock IDs for testing
        enrichmentId: ENRICHMENT_ID,
        phase: 'fast',
      })

      // Verify enrichment was marked as failed
      expect(failEnrichmentCalls).toHaveLength(1)
      expect(failEnrichmentCalls[0].enrichmentId).toBe(ENRICHMENT_ID)
      expect(failEnrichmentCalls[0].error).toContain('Database connection failed')
    })
  })
})
