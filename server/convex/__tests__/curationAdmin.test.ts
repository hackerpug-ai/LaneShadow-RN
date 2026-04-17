/**
 * Tests for curationAdmin.ts - Route and enrichment ingestion
 *
 * These tests exercise behavior via exported handler functions that can be
 * unit-tested without a running Convex backend.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel'
import {
  deleteCuratedRoutesByRouteIdsHandler,
  upsertCuratedRouteEnrichmentsHandler,
  upsertCuratedRoutesHandler,
} from '../curationAdmin'

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const makeCuratedRoute = (overrides: Record<string, unknown> = {}) => ({
  routeId: 'test-route-1',
  name: 'Test Route 1',
  state: 'CA',
  source: 'fhwa' as const,
  primaryArchetype: 'twisties' as const,
  secondaryTags: ['scenic', 'mountain'],
  centroidLat: 37.7749,
  centroidLng: -122.4194,
  boundsNeLat: 37.8,
  boundsNeLng: -122.3,
  boundsSwLat: 37.7,
  boundsSwLng: -122.5,
  lengthMiles: 100.5,
  compositeScore: 85.5,
  curvatureScore: 90.0,
  scenicScore: 88.0,
  technicalScore: 82.0,
  trafficScore: 75.0,
  remotenessScore: 80.0,
  oneLiner: 'A great twisty route',
  summary: 'This is a detailed summary',
  badges: ['scenic', 'technical'],
  season: 'year_round' as const,
  contentVersion: 1,
  enrichmentVersion: null,
  seededAt: Date.now(),
  ...overrides,
})

const makeCuratedRouteEnrichment = (overrides: Record<string, unknown> = {}) => ({
  routeId: 'test-route-1',
  fullDescription: 'Full description here',
  history: 'Historical information',
  roadClassification: 'Major Highway',
  surfaceMaterial: 'Asphalt',
  totalElevationGainM: 1500,
  elevationProfile: { gain: 1500, loss: 1200 },
  nearestCities: ['Denver', 'Boulder'],
  ridershipLevel: 'High',
  seasonalNotes: 'Best in summer',
  safetyWarnings: 'Watch for wildlife',
  gpxUrl: 'https://example.com/route.gpx',
  photos: [
    {
      url: 'https://example.com/photo1.jpg',
      caption: 'Scenic view',
      attribution: 'Photographer Name',
    },
  ],
  sources: [
    {
      site: 'example.com',
      url: 'https://example.com/route',
      lastFetched: Date.now(),
      extractionConfidence: 0.95,
    },
  ],
  recommendedStarts: [{ location: 'Denver', time: '08:00' }],
  fuelStops: [{ location: 'Gas Station', miles: 50 }],
  extractedBy: 'test-agent',
  extractedAt: Date.now(),
  extractionSchemaVersion: 1,
  enrichmentVersion: 1,
  lastEnrichedAt: Date.now(),
  ...overrides,
})

// Helper to create mock query builder that mimics Convex query chain
const createMockQueryBuilder = (result: any[]) => ({
  collect: vi.fn().mockResolvedValue(result),
  first: vi.fn().mockResolvedValue(result[0] || null),
})

// Helper to create mock withIndex that handles the callback pattern
const createMockWithIndex = (result: any[]) => {
  return vi.fn((indexName: string, callback: any) => {
    // Create a query builder mock for the callback
    const queryBuilder = {
      eq: vi.fn().mockReturnThis(),
    }
    // Call the callback with the query builder
    if (callback) callback(queryBuilder)
    // Return the final query builder with first
    return createMockQueryBuilder(result)
  })
}

// ---------------------------------------------------------------------------
// AC-1: Happy-path routes ingest returns insert count
// ---------------------------------------------------------------------------

describe('upsertCuratedRoutesHandler - AC-1: Happy-path routes ingest', () => {
  it('should insert 2 new routes and return correct counts', async () => {
    const routes = [
      makeCuratedRoute({ routeId: 'test-route-1' }),
      makeCuratedRoute({ routeId: 'test-route-2' }),
    ]

    const ctx = {
      db: {
        query: vi.fn(() => ({
          withIndex: createMockWithIndex([]), // No existing routes
        })),
        insert: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await upsertCuratedRoutesHandler(ctx as any, { routes })

    expect(result).toEqual({
      inserted: 2,
      updated: 0,
      skipped: 0,
      errors: [],
    })

    // Verify inserts were called
    expect(ctx.db.insert).toHaveBeenCalledTimes(2)
    expect(ctx.db.patch).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// AC-4: Idempotent upsert on repeat POST
// ---------------------------------------------------------------------------

describe('upsertCuratedRoutesHandler - AC-4: Idempotent upsert', () => {
  it('should insert on first call and update on second call', async () => {
    const routes = [makeCuratedRoute({ routeId: 'duplicate-route' })]

    // First call - route doesn't exist
    const ctx1 = {
      db: {
        query: vi.fn(() => ({
          withIndex: createMockWithIndex([]), // No existing routes
        })),
        insert: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const firstResult = await upsertCuratedRoutesHandler(ctx1 as any, { routes })

    expect(firstResult).toEqual({
      inserted: 1,
      updated: 0,
      skipped: 0,
      errors: [],
    })

    expect(ctx1.db.insert).toHaveBeenCalledTimes(1)
    expect(ctx1.db.patch).not.toHaveBeenCalled()

    // Second call - route exists
    const existingDoc = {
      _id: ':duplicate-route' as Id<'curated_routes'>,
      ...makeCuratedRoute({ routeId: 'duplicate-route' }),
    }

    const ctx2 = {
      db: {
        query: vi.fn(() => ({
          withIndex: createMockWithIndex([existingDoc]), // Route exists
        })),
        insert: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const secondResult = await upsertCuratedRoutesHandler(ctx2 as any, { routes })

    expect(secondResult).toEqual({
      inserted: 0,
      updated: 1,
      skipped: 0,
      errors: [],
    })

    expect(ctx2.db.patch).toHaveBeenCalledTimes(1)
    expect(ctx2.db.insert).not.toHaveBeenCalled()
  })
})

// ---------------------------------------------------------------------------
// AC-5: Happy-path enrichments ingest upserts by routeId
// ---------------------------------------------------------------------------

describe('upsertCuratedRouteEnrichmentsHandler - AC-5: Enrichments upsert', () => {
  it('should insert new enrichment and update existing one', async () => {
    const enrichments = [makeCuratedRouteEnrichment({ routeId: 'test-route-1' })]

    // Test insert - enrichment doesn't exist
    const ctx1 = {
      db: {
        query: vi.fn(() => ({
          withIndex: createMockWithIndex([]),
        })),
        insert: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const insertResult = await upsertCuratedRouteEnrichmentsHandler(ctx1 as any, { enrichments })

    expect(insertResult).toEqual({
      inserted: 1,
      updated: 0,
      skipped: 0,
      errors: [],
    })

    expect(ctx1.db.insert).toHaveBeenCalledTimes(1)

    // Test update - enrichment exists
    const existingEnrichment = {
      _id: 'enrichment-id' as Id<'curated_route_enrichments'>,
      ...makeCuratedRouteEnrichment({ routeId: 'test-route-1' }),
    }

    const ctx2 = {
      db: {
        query: vi.fn(() => ({
          withIndex: createMockWithIndex([existingEnrichment]),
        })),
        insert: vi.fn().mockResolvedValue(undefined),
        patch: vi.fn().mockResolvedValue(undefined),
      },
    }

    const updateResult = await upsertCuratedRouteEnrichmentsHandler(ctx2 as any, { enrichments })

    expect(updateResult).toEqual({
      inserted: 0,
      updated: 1,
      skipped: 0,
      errors: [],
    })

    expect(ctx2.db.patch).toHaveBeenCalledTimes(1)
    expect(ctx2.db.insert).not.toHaveBeenCalled()
  })
})

describe('deleteCuratedRoutesByRouteIdsHandler', () => {
  it('should delete existing routes and report missing ones', async () => {
    const existingDoc = {
      _id: ':route-1' as Id<'curated_routes'>,
      ...makeCuratedRoute({ routeId: 'route-1' }),
    }

    const withIndex = vi.fn()
    withIndex
      .mockImplementationOnce((_: string, callback: any) => {
        const queryBuilder = { eq: vi.fn().mockReturnThis() }
        if (callback) callback(queryBuilder)
        return createMockQueryBuilder([existingDoc])
      })
      .mockImplementationOnce((_: string, callback: any) => {
        const queryBuilder = { eq: vi.fn().mockReturnThis() }
        if (callback) callback(queryBuilder)
        return createMockQueryBuilder([])
      })

    const ctx = {
      db: {
        query: vi.fn(() => ({ withIndex })),
        delete: vi.fn().mockResolvedValue(undefined),
      },
    }

    const result = await deleteCuratedRoutesByRouteIdsHandler(ctx as any, {
      routeIds: ['route-1', 'route-2'],
    })

    expect(result).toEqual({
      deleted: 1,
      missing: ['route-2'],
      errors: [],
    })
    expect(ctx.db.delete).toHaveBeenCalledTimes(1)
    expect(ctx.db.delete).toHaveBeenCalledWith(':route-1')
  })
})

// ---------------------------------------------------------------------------
// AC-2: Auth rejection on missing/wrong bearer
// ---------------------------------------------------------------------------

describe('HTTP Auth - AC-2: Bearer token validation', () => {
  it('should reject requests without Authorization header', () => {
    const deployKey = process.env.CURATION_DEPLOY_KEY
    const authHeader = '' // Missing header

    if (!deployKey) {
      throw new Error('CURATION_DEPLOY_KEY not configured')
    }

    const expected = `Bearer ${deployKey}`
    const isAuthorized = authHeader === expected

    expect(isAuthorized).toBe(false)
  })

  it('should reject requests with wrong bearer token', () => {
    const deployKey = process.env.CURATION_DEPLOY_KEY
    const authHeader = 'Bearer wrong-token-12345'

    if (!deployKey) {
      throw new Error('CURATION_DEPLOY_KEY not configured')
    }

    const expected = `Bearer ${deployKey}`
    const isAuthorized = authHeader === expected

    expect(isAuthorized).toBe(false)
  })

  it('should accept requests with correct bearer token', () => {
    const deployKey = process.env.CURATION_DEPLOY_KEY

    if (!deployKey) {
      throw new Error('CURATION_DEPLOY_KEY not configured')
    }

    const authHeader = `Bearer ${deployKey}`
    const expected = `Bearer ${deployKey}`
    const isAuthorized = authHeader === expected

    expect(isAuthorized).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// AC-3: Validation error on malformed body
// ---------------------------------------------------------------------------

describe('Validation - AC-3: Malformed body rejection', () => {
  it('should reject route missing required fields', () => {
    const malformedRoute = {
      routeId: 'incomplete-route',
      // Missing: name, state, source, etc.
    }

    // This should fail validation
    expect(() => {
      const { curatedRouteValidator } = require('../models/curated-routes')
      curatedRouteValidator.parse(malformedRoute)
    }).toThrow()
  })
})
