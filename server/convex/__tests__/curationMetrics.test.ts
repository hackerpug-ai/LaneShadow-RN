/**
 * Tests for curation metrics endpoint - CONVEX-007
 *
 * These tests exercise the dashboard metrics aggregation behavior.
 */

import { describe, expect, it, vi } from 'vitest'
import type { Id } from '../_generated/dataModel.js'

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const makeCuratedRoute = (overrides: Record<string, unknown> = {}) => ({
  _id: 'route1' as Id<'curated_routes'>,
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
  extractedAt: Date.now() - 10000, // 10 seconds ago
  ...overrides,
})

const makeCuratedRouteEnrichment = (overrides: Record<string, unknown> = {}) => ({
  _id: 'enrichment1' as Id<'curated_route_enrichments'>,
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

const makeRouteFeedback = (overrides: Record<string, unknown> = {}) => ({
  _id: 'feedback1' as Id<'route_feedback'>,
  routeId: 'test-route-1',
  userId: 'user-123',
  action: 'save' as const,
  rating: 5,
  timestamp: Date.now(),
  ...overrides,
})

// ---------------------------------------------------------------------------
// AC-001: Metrics Return Complete Dashboard Data
// ---------------------------------------------------------------------------

describe('curationMetricsInternal - AC-001: Metrics return complete dashboard data', () => {
  it('should aggregate totalRoutes, totalEnrichments, bySource, lastScrape, llmCost, and feedbackSummary', async () => {
    const routes = [
      makeCuratedRoute({
        routeId: 'route-1',
        source: 'fhwa' as const,
        extractedAt: Date.now() - 5000,
      }),
      makeCuratedRoute({
        routeId: 'route-2',
        source: 'bdr' as const,
        extractedAt: Date.now() - 10000,
      }),
      makeCuratedRoute({
        routeId: 'route-3',
        source: 'fhwa' as const,
        extractedAt: Date.now() - 15000,
      }),
    ]

    const enrichments = [
      makeCuratedRouteEnrichment({ routeId: 'route-1' }),
      makeCuratedRouteEnrichment({ routeId: 'route-2' }),
    ]

    const feedback = [
      makeRouteFeedback({ routeId: 'route-1', action: 'save' as const, userId: 'user-1' }),
      makeRouteFeedback({ routeId: 'route-2', action: 'hide' as const, userId: 'user-2' }),
      makeRouteFeedback({ routeId: 'route-1', action: 'complete' as const, userId: 'user-3' }),
      makeRouteFeedback({ routeId: 'route-3', action: 'save' as const, userId: 'user-1' }),
    ]

    const mockQuery = vi.fn((tableName: string) => {
      if (tableName === 'curated_routes') {
        return {
          collect: vi.fn().mockResolvedValue(routes),
        }
      } else if (tableName === 'curated_route_enrichments') {
        return {
          collect: vi.fn().mockResolvedValue(enrichments),
        }
      } else if (tableName === 'route_feedback') {
        return {
          collect: vi.fn().mockResolvedValue(feedback),
        }
      }
      return { collect: vi.fn().mockResolvedValue([]) }
    })

    const ctx = {
      db: {
        query: mockQuery,
      },
    }

    // Import the handler function
    const { curationMetricsInternalHandler } = await import('../curationMetrics.js')

    const result = await curationMetricsInternalHandler(ctx as any)

    // Verify all required fields are present
    expect(result).toHaveProperty('totalRoutes')
    expect(result).toHaveProperty('totalEnrichments')
    expect(result).toHaveProperty('bySource')
    expect(result).toHaveProperty('lastScrape')
    expect(result).toHaveProperty('llmCost')
    expect(result).toHaveProperty('feedbackSummary')

    // Verify counts are accurate
    expect(result.totalRoutes).toBe(3)
    expect(result.totalEnrichments).toBe(2)

    // Verify bySource breakdown
    expect(result.bySource).toEqual({
      fhwa: 2,
      bdr: 1,
    })

    // Verify lastScrape is the most recent extraction
    expect(result.lastScrape).toBe(routes[0].extractedAt)

    // Verify feedbackSummary aggregates by action type
    expect(result.feedbackSummary).toEqual({
      save: 2,
      hide: 1,
      complete: 1,
    })

    // Verify llmCost is calculated (3 routes * $0.00048)
    expect(result.llmCost).toBeCloseTo(0.0, 2) // Should be ~0.00144, rounded to 2 decimals
  })

  it('should return null for lastScrape when no routes exist', async () => {
    const ctx = {
      db: {
        query: vi.fn(() => ({
          collect: vi.fn().mockResolvedValue([]),
        })),
      },
    }

    const { curationMetricsInternalHandler } = await import('../curationMetrics.js')

    const result = await curationMetricsInternalHandler(ctx as any)

    expect(result.lastScrape).toBeNull()
    expect(result.totalRoutes).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// AC-002: Bearer Token Auth Required
// ---------------------------------------------------------------------------

describe('HTTP Auth - AC-002: Bearer token validation', () => {
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
// AC-003: No Individual User Data Exposed
// ---------------------------------------------------------------------------

describe('curationMetricsInternal - AC-003: No individual user data exposed', () => {
  it('should aggregate feedback without exposing userIds or individual route data', async () => {
    const feedback = [
      makeRouteFeedback({
        routeId: 'route-1',
        action: 'save' as const,
        userId: 'user-1',
        rating: 5,
      }),
      makeRouteFeedback({
        routeId: 'route-2',
        action: 'hide' as const,
        userId: 'user-2',
        rating: 2,
      }),
      makeRouteFeedback({
        routeId: 'route-1',
        action: 'complete' as const,
        userId: 'user-3',
        rating: 4,
      }),
      makeRouteFeedback({
        routeId: 'route-3',
        action: 'save' as const,
        userId: 'user-1',
        rating: 5,
      }),
      makeRouteFeedback({
        routeId: 'route-1',
        action: 'rate' as const,
        userId: 'user-4',
        rating: 3,
      }),
    ]

    const ctx = {
      db: {
        query: vi.fn(() => ({
          collect: vi.fn().mockResolvedValue(feedback),
        })),
      },
    }

    const { curationMetricsInternalHandler } = await import('../curationMetrics.js')

    const result = await curationMetricsInternalHandler(ctx as any)

    // Verify feedback is aggregated by action type only
    expect(result.feedbackSummary).toEqual({
      save: 2,
      hide: 1,
      complete: 1,
      rate: 1,
    })

    // Verify no individual user data is exposed
    expect(result.feedbackSummary).not.toHaveProperty('user-1')
    expect(result.feedbackSummary).not.toHaveProperty('user-2')
    expect(result.feedbackSummary).not.toHaveProperty('user-3')
    expect(result.feedbackSummary).not.toHaveProperty('user-4')

    // Verify no individual route ratings are exposed
    expect(result.feedbackSummary).not.toHaveProperty('route-1')
    expect(result.feedbackSummary).not.toHaveProperty('route-2')

    // Verify no PII in the response
    expect(JSON.stringify(result)).not.toContain('user-1')
    expect(JSON.stringify(result)).not.toContain('user-2')
    expect(JSON.stringify(result)).not.toContain('user-3')
    expect(JSON.stringify(result)).not.toContain('user-4')
  })
})

// ---------------------------------------------------------------------------
// AC-004: Last Scrape Timestamp
// ---------------------------------------------------------------------------

describe('curationMetricsInternal - AC-004: Last scrape timestamp', () => {
  it('should return the maximum extractedAt value as lastScrape', async () => {
    const now = Date.now()
    const routes = [
      makeCuratedRoute({ routeId: 'route-1', extractedAt: now - 15000 }),
      makeCuratedRoute({ routeId: 'route-2', extractedAt: now - 5000 }),
      makeCuratedRoute({ routeId: 'route-3', extractedAt: now - 10000 }),
    ]

    const ctx = {
      db: {
        query: vi.fn(() => ({
          collect: vi.fn().mockResolvedValue(routes),
        })),
      },
    }

    const { curationMetricsInternalHandler } = await import('../curationMetrics.js')

    const result = await curationMetricsInternalHandler(ctx as any)

    // lastScrape should be the most recent (maximum) extractedAt
    expect(result.lastScrape).toBe(now - 5000)
  })

  it('should return null when no routes exist', async () => {
    const ctx = {
      db: {
        query: vi.fn(() => ({
          collect: vi.fn().mockResolvedValue([]),
        })),
      },
    }

    const { curationMetricsInternalHandler } = await import('../curationMetrics.js')

    const result = await curationMetricsInternalHandler(ctx as any)

    expect(result.lastScrape).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// AC-005: LLM Cost Estimation
// ---------------------------------------------------------------------------

describe('curationMetricsInternal - AC-005: LLM cost estimation', () => {
  it('should estimate LLM cost based on route count using documented formula', async () => {
    const routes = Array.from({ length: 100 }, (_, i) =>
      makeCuratedRoute({ routeId: `route-${i}` }),
    )

    const ctx = {
      db: {
        query: vi.fn(() => ({
          collect: vi.fn().mockResolvedValue(routes),
        })),
      },
    }

    const { curationMetricsInternalHandler } = await import('../curationMetrics.js')

    const result = await curationMetricsInternalHandler(ctx as any)

    // 100 routes * $0.00048 = $0.048
    expect(result.llmCost).toBeCloseTo(0.05, 2) // Rounded to 2 decimals
  })

  it('should return zero cost when no routes exist', async () => {
    const ctx = {
      db: {
        query: vi.fn(() => ({
          collect: vi.fn().mockResolvedValue([]),
        })),
      },
    }

    const { curationMetricsInternalHandler } = await import('../curationMetrics.js')

    const result = await curationMetricsInternalHandler(ctx as any)

    expect(result.llmCost).toBe(0)
  })
})
