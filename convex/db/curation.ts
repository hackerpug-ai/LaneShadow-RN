/**
 * Curation Queries and Mutations
 *
 * Public-facing queries for lean sync, enrichment fetch, and staleness check.
 * Requires Clerk authentication for all endpoints.
 */

import { ConvexError, v } from 'convex/values'

import type { Doc } from '../_generated/dataModel'
import { internalQuery } from '../_generated/server'
import { requireIdentity } from '../guards'

// Import paginationOptsValidator from convex/server
import { paginationOptsValidator } from 'convex/server'

type CuratedRouteDoc = Doc<'curated_routes'>
type CuratedRouteEnrichmentDoc = Doc<'curated_route_enrichments'>

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const routeCardValidator = v.object({
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  source: v.string(),
  primaryArchetype: v.string(),
  secondaryTags: v.array(v.string()),
  centroidLat: v.number(),
  centroidLng: v.number(),
  boundsNeLat: v.number(),
  boundsNeLng: v.number(),
  boundsSwLat: v.number(),
  boundsSwLng: v.number(),
  lengthMiles: v.optional(v.number()),
  compositeScore: v.number(),
  curvatureScore: v.optional(v.number()),
  scenicScore: v.optional(v.number()),
  technicalScore: v.optional(v.number()),
  trafficScore: v.optional(v.number()),
  remotenessScore: v.optional(v.number()),
  oneLiner: v.optional(v.string()),
  summary: v.optional(v.string()),
  badges: v.optional(v.array(v.string())),
  season: v.optional(v.string()),
  contentVersion: v.number(),
  enrichmentVersion: v.optional(v.number()),
})

// ---------------------------------------------------------------------------
// Lean Sync Query (CONVEX-004)
// ---------------------------------------------------------------------------

export const leanSync = internalQuery({
  args: {
    state: v.optional(v.string()),
    since: v.optional(v.number()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(routeCardValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
    lastUpdated: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    let dbQuery = ctx.db.query('curated_routes') as any

    if (args.state) {
      dbQuery = dbQuery.withIndex('by_state', (q: any) => q.eq('state', args.state!))
    } else {
      dbQuery = dbQuery.withIndex('by_composite_score')
    }

    const result = await dbQuery.paginate({
      numItems: args.paginationOpts.numItems,
      cursor: args.paginationOpts.cursor
        ? ({ id: args.paginationOpts.cursor } as any)
        : undefined,
    })

    let page = result.page
    if (args.since) {
      // Delta sync: filter to routes with contentVersion > since
      page = page.filter((r) => r.contentVersion > args.since!)
    }

    return {
      page: page.map(toRouteCard),
      isDone: result.isDone,
      continueCursor: result.continueCursor ?? '',
      lastUpdated: Math.max(...page.map((r) => r.contentVersion), 0),
    }
  },
})

// ---------------------------------------------------------------------------
// Enrichment Fetch Query (CONVEX-004)
// ---------------------------------------------------------------------------

export const fetchEnrichments = internalQuery({
  args: {
    routeIds: v.array(v.string()),
  },
  returns: v.array(
    v.union(
      v.object({
        routeId: v.string(),
        enrichment: v.optional(
          v.object({
            fullDescription: v.optional(v.string()),
            history: v.optional(v.string()),
            photos: v.optional(
              v.array(
                v.object({
                  url: v.string(),
                  caption: v.string(),
                  attribution: v.string(),
                })
              )
            ),
            roadClassification: v.optional(v.array(v.string())),
            surfaceMaterial: v.optional(v.string()),
            totalElevationGainM: v.optional(v.number()),
            elevationProfile: v.optional(v.array(v.number())),
            nearestCities: v.optional(v.array(v.string())),
            recommendedStarts: v.optional(
              v.array(
                v.object({
                  lat: v.number(),
                  lng: v.number(),
                  name: v.string(),
                })
              )
            ),
          })
        ),
      }),
      v.null()
    )
  ),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const results: Array<{ routeId: string; enrichment: any } | null> = []

    for (const routeId of args.routeIds) {
      const doc = await ctx.db
        .query('curated_route_enrichments')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .unique()

      results.push(doc ? { routeId, enrichment: doc } : null)
    }

    return results
  },
})

// ---------------------------------------------------------------------------
// Missing Enrichments Check Query (CONVEX-004)
// ---------------------------------------------------------------------------

export const checkMissingEnrichments = internalQuery({
  args: {
    pairs: v.array(
      v.object({
        routeId: v.string(),
        version: v.number(),
      })
    ),
  },
  returns: v.array(v.string()),
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const stale: string[] = []

    for (const { routeId, version } of args.pairs) {
      const lean = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .unique()

      if (lean && (lean.enrichmentVersion ?? 0) > version) {
        stale.push(routeId)
      }
    }

    return stale
  },
})

// ---------------------------------------------------------------------------
// Dashboard Metrics Query (CONVEX-007)
// ---------------------------------------------------------------------------

export const dashboardMetrics = internalQuery({
  args: {},
  returns: v.object({
    totalRoutes: v.number(),
    totalEnrichments: v.number(),
    bySource: v.array(
      v.object({
        source: v.string(),
        count: v.number(),
      })
    ),
    lastScrape: v.optional(v.number()),
    llmCost: v.optional(v.number()),
    feedbackSummary: v.optional(
      v.object({
        save: v.number(),
        hide: v.number(),
        complete: v.number(),
        rate: v.number(),
      })
    ),
  }),
  handler: async (ctx) => {
    await requireIdentity(ctx)

    const routes = await ctx.db.query('curated_routes').collect()
    const enrichments = await ctx.db.query('curated_route_enrichments').collect()
    const feedback = await ctx.db.query('route_feedback').collect()

    // Count by source
    const bySourceMap = new Map<string, number>()
    for (const route of routes) {
      const count = bySourceMap.get(route.source) ?? 0
      bySourceMap.set(route.source, count + 1)
    }

    const bySource = Array.from(bySourceMap.entries()).map(([source, count]) => ({
      source,
      count,
    }))

    // Find last scrape timestamp (max contentVersion)
    const lastScrape = routes.length > 0
      ? Math.max(...routes.map((r) => r.contentVersion))
      : undefined

    // Aggregate feedback counts
    const feedbackSummary = {
      save: feedback.filter((f) => f.action === 'save').length,
      hide: feedback.filter((f) => f.action === 'hide').length,
      complete: feedback.filter((f) => f.action === 'complete').length,
      rate: feedback.filter((f) => f.action === 'rate').length,
    }

    // Estimate LLM cost (placeholder - actual cost calculation depends on usage)
    const llmCost = undefined

    return {
      totalRoutes: routes.length,
      totalEnrichments: enrichments.length,
      bySource,
      lastScrape,
      llmCost,
      feedbackSummary,
    }
  },
})

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function toRouteCard(doc: CuratedRouteDoc): any {
  return {
    routeId: doc.routeId,
    name: doc.name,
    state: doc.state,
    source: doc.source,
    primaryArchetype: doc.primaryArchetype,
    secondaryTags: doc.secondaryTags,
    centroidLat: doc.centroidLat,
    centroidLng: doc.centroidLng,
    boundsNeLat: doc.boundsNeLat,
    boundsNeLng: doc.boundsNeLng,
    boundsSwLat: doc.boundsSwLat,
    boundsSwLng: doc.boundsSwLng,
    lengthMiles: doc.lengthMiles,
    compositeScore: doc.compositeScore,
    curvatureScore: doc.curvatureScore,
    scenicScore: doc.scenicScore,
    technicalScore: doc.technicalScore,
    trafficScore: doc.trafficScore,
    remotenessScore: doc.remotenessScore,
    oneLiner: doc.oneLiner,
    summary: doc.summary,
    badges: doc.badges,
    season: doc.season,
    contentVersion: doc.contentVersion,
    enrichmentVersion: doc.enrichmentVersion,
  }
}
