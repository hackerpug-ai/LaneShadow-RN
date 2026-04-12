/**
 * Curation queries for public API endpoints
 *
 * Provides lean sync, enrichment fetch, and staleness check functionality
 * for the mobile client to sync curated route data.
 */

import { ConvexError, v } from 'convex/values'
import { paginationOptsValidator } from 'convex/server'
import type { Doc } from '../_generated/dataModel'
import { query } from '../_generated/server'

type CuratedRouteDoc = Doc<'curated_routes'>
type CuratedRouteEnrichmentDoc = Doc<'curated_route_enrichments'>

/**
 * Route card projection - lean fields only (no enrichment data)
 * This is what the lean sync endpoint returns
 */
export const toRouteCard = (route: CuratedRouteDoc) => ({
  routeId: route.routeId,
  name: route.name,
  state: route.state,
  source: route.source,
  primaryArchetype: route.primaryArchetype,
  secondaryTags: route.secondaryTags,
  centroidLat: route.centroidLat,
  centroidLng: route.centroidLng,
  boundsNeLat: route.boundsNeLat,
  boundsNeLng: route.boundsNeLng,
  boundsSwLat: route.boundsSwLat,
  boundsSwLng: route.boundsSwLng,
  lengthMiles: route.lengthMiles,
  compositeScore: route.compositeScore,
  curvatureScore: route.curvatureScore,
  scenicScore: route.scenicScore,
  technicalScore: route.technicalScore,
  trafficScore: route.trafficScore,
  remotenessScore: route.remotenessScore,
  oneLiner: route.oneLiner,
  summary: route.summary,
  badges: route.badges,
  season: route.season,
  contentVersion: route.contentVersion,
  seededAt: route.seededAt,
})

/**
 * Lean sync query - returns all routes or delta sync with pagination
 *
 * AC-001: Full Lean Sync Returns All Routes
 * AC-002: Delta Sync Filters by contentVersion
 */
export const leanSync = query({
  args: {
    state: v.optional(v.string()),
    since: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.any()), // Array of route cards
    isDone: v.boolean(),
    continueCursor: v.string(),
    lastUpdated: v.number(),
  }),
  handler: async (ctx, args) => {
    // AC-005: Authentication Required
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError('UNAUTHORIZED')
    }

    // Use index for state filtering if provided
    const result = await (args.state
      ? ctx.db
          .query('curated_routes')
          .withIndex('by_state', (q) => q.eq('state', args.state!))
          .paginate(args.paginationOpts)
      : ctx.db
          .query('curated_routes')
          .withIndex('by_composite_score')
          .paginate(args.paginationOpts))

    let page = result.page

    // AC-002: Delta sync - filter by contentVersion
    // Note: This is an in-memory filter after pagination, which is acceptable
    // because pagination is on the index scan, not a full table scan
    if (args.since) {
      page = page.filter((r) => r.contentVersion > args.since!)
    }

    // Calculate lastUpdated timestamp from the page
    const lastUpdated = page.length > 0
      ? Math.max(...page.map((r) => r.contentVersion))
      : 0

    return {
      page: page.map(toRouteCard),
      isDone: result.isDone,
      continueCursor: result.continueCursor,
      lastUpdated,
    }
  },
})

/**
 * Enrichment fetch query - returns enrichments for requested routeIds
 *
 * AC-003: Enrichment Fetch Handles Missing Data
 */
export const fetchEnrichments = query({
  args: {
    routeIds: v.array(v.string()),
  },
  returns: v.record(v.string(), v.any()), // Record<string, CuratedRouteEnrichment | null>
  handler: async (ctx, args) => {
    // AC-005: Authentication Required
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError('UNAUTHORIZED')
    }

    // AC-003: Enrichment fetch enforces max 50 routeIds
    if (args.routeIds.length > 50) {
      throw new ConvexError('MAX_50_ROUTE_IDS')
    }

    const results: Record<string, CuratedRouteEnrichmentDoc | null> = {}

    // Fetch enrichments for each requested routeId
    for (const routeId of args.routeIds) {
      const enrichment = await ctx.db
        .query('curated_route_enrichments')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .unique()

      // AC-003: Returns null for missing enrichments
      results[routeId] = enrichment ?? null
    }

    return results
  },
})

/**
 * Staleness check query - identifies routes with stale enrichment versions
 *
 * AC-004: Staleness Check Works
 */
export const checkStaleEnrichments = query({
  args: {
    pairs: v.array(
      v.object({
        routeId: v.string(),
        version: v.number(),
      })
    ),
  },
  returns: v.array(v.string()), // Array of stale routeIds
  handler: async (ctx, args) => {
    // AC-005: Authentication Required
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new ConvexError('UNAUTHORIZED')
    }

    const stale: string[] = []

    for (const { routeId, version } of args.pairs) {
      const route = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .unique()

      // AC-004: Route is stale if enrichmentVersion > cached version
      if (route && (route.enrichmentVersion ?? 0) > version) {
        stale.push(routeId)
      }
    }

    return stale
  },
})
