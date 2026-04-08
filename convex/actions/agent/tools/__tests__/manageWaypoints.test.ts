// Set env variables before imports
process.env.GOOGLE_MAPS_API_KEY = 'test-api-key'
process.env.CLERK_WEBHOOK_SECRET = 'test-secret'

'use node'

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  addWaypoint,
  listWaypoints,
  applyWaypointDecisions,
  presentDeviationOptions,
  optimizeWaypointOrder,
  type AddWaypointResult,
  type WaypointApprovalResult,
  isAddWaypointError,
  isWaypointApprovalError,
} from '../manageWaypoints'

// Mock Id type for tests
type Id<T> = string

const mockRoutePlanId: Id<'route_plans'> = 'mock-route-plan-id'
const mockWaypointId: Id<'waypoints'> = 'mock-waypoint-id'

describe('manageWaypoints', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('addWaypoint', () => {
    it('should add waypoint from coordinates', async () => {
      const result = await addWaypoint({
        // @ts-ignore - Using mock ID for testing
        routePlanId: mockRoutePlanId,
        location: {
          type: 'coordinates',
          lat: 37.7749,
          lng: -122.4194,
        },
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.waypoint.location.lat).toBe(37.7749)
        expect(result.waypoint.location.lng).toBe(-122.4194)
        expect(result.waypoint.kind).toBe('on_route')
      }
    })

    it('should add waypoint from natural language', async () => {
      global.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({
          status: 'OK',
          results: [{
            geometry: { location: { lat: 37.8199, lng: -122.4783 } },
            formatted_address: 'Golden Gate Bridge, San Francisco, CA',
            place_id: 'test-place-id',
            types: ['establishment'],
          }],
        }),
      })) as any

      const result = await addWaypoint({
        // @ts-ignore - Using mock ID for testing
        routePlanId: mockRoutePlanId,
        location: {
          type: 'natural_language',
          query: 'Golden Gate Bridge',
        },
        locationBias: {
          lat: 37.7749,
          lng: -122.4194,
        },
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.waypoint.name).toBeDefined()
        expect(result.waypoint.location.lat).toBeGreaterThan(0)
      }
    })

    it('should handle geocoding failures gracefully', async () => {
      global.fetch = vi.fn(async () => ({
        ok: true,
        json: async () => ({
          status: 'ZERO_RESULTS',
          results: [],
        }),
      })) as any

      const result = await addWaypoint({
        // @ts-ignore - Using mock ID for testing
        routePlanId: mockRoutePlanId,
        location: {
          type: 'natural_language',
          query: 'NonexistentPlaceThatDefinitelyDoesNotExist12345',
        },
      })

      if (isAddWaypointError(result)) {
        expect(result.error).toBeDefined()
        expect(result.reason).toBeDefined()
      } else {
        expect(true).toBe(false)
      }
    })
  })

  describe('listWaypoints', () => {
    it('should list waypoints for route plan', async () => {
      const result = await listWaypoints({
        // @ts-ignore - Using mock ID for testing
        routePlanId: mockRoutePlanId,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(Array.isArray(result.waypoints)).toBe(true)
      }
    })
  })

  describe('applyWaypointDecisions', () => {
    it('should approve and reject waypoints', async () => {
      const result = await applyWaypointDecisions({
        // @ts-ignore - Using mock IDs for testing
        routePlanId: mockRoutePlanId,
        // @ts-ignore - Using mock IDs for testing
        approvedWaypointIds: [mockWaypointId],
        rejectedWaypointIds: [],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.approvedCount).toBe(1)
        expect(result.rejectedCount).toBe(0)
      }
    })

    it('should enforce maximum waypoint limit', async () => {
      const result = await applyWaypointDecisions({
        // @ts-ignore - Using mock IDs for testing
        routePlanId: mockRoutePlanId,
        // @ts-ignore - Using mock IDs for testing
        approvedWaypointIds: [
          // @ts-ignore - Using mock IDs for testing
          'wp1' as Id<'waypoints'>,
          // @ts-ignore - Using mock IDs for testing
          'wp2' as Id<'waypoints'>,
          // @ts-ignore - Using mock IDs for testing
          'wp3' as Id<'waypoints'>,
          // @ts-ignore - Using mock IDs for testing
          'wp4' as Id<'waypoints'>,
        ],
        rejectedWaypointIds: [],
      })

      if (isWaypointApprovalError(result)) {
        expect(result.error).toContain('Maximum is 3')
      } else {
        expect(true).toBe(false)
      }
    })
  })

  describe('presentDeviationOptions', () => {
    it('should present deviation options for waypoint', async () => {
      const result = await presentDeviationOptions({
        // @ts-ignore - Using mock ID for testing
        waypointId: mockWaypointId,
      })

      expect(result.success).toBe(true)
    })
  })

  describe('optimizeWaypointOrder', () => {
    it('should optimize waypoint order', async () => {
      const result = await optimizeWaypointOrder({
        // @ts-ignore - Using mock IDs for testing
        routePlanId: mockRoutePlanId,
        // @ts-ignore - Using mock IDs for testing
        waypointIds: [
          // @ts-ignore - Using mock IDs for testing
          'wp1' as Id<'waypoints'>,
          // @ts-ignore - Using mock IDs for testing
          'wp2' as Id<'waypoints'>,
          // @ts-ignore - Using mock IDs for testing
          'wp3' as Id<'waypoints'>,
        ],
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.optimizedOrder).toBeDefined()
        expect(result.optimizedOrder?.length).toBe(3)
      }
    })
  })
})
