import { v } from 'convex/values'
import { internalMutation } from './_generated/server'
import { curatedRouteValidator } from '../models/curated-routes'
import { curatedRouteEnrichmentValidator } from '../models/curated-route-enrichments'

// ---------------------------------------------------------------------------
// Handler functions for unit testing
// ---------------------------------------------------------------------------

export const upsertCuratedRoutesHandler = async (
  ctx: any,
  { routes }: { routes: Array<any> }
) => {
  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: Array<{ routeId: string; message: string }> = []

  for (const route of routes) {
    try {
      // Check if route already exists by routeId
      // NOTE: curated_routes now has a by_routeId index
      const existing = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', route.routeId))
        .first()

      if (existing) {
        // Update existing route
        await ctx.db.patch(existing._id, route)
        updated++
      } else {
        // Insert new route
        await ctx.db.insert('curated_routes', route)
        inserted++
      }
    } catch (e: any) {
      errors.push({
        routeId: route.routeId,
        message: e?.message ?? 'unknown error',
      })
      skipped++
    }
  }

  return { inserted, updated, skipped, errors }
}

export const upsertCuratedRouteEnrichmentsHandler = async (
  ctx: any,
  { enrichments }: { enrichments: Array<any> }
) => {
  let inserted = 0
  let updated = 0
  let skipped = 0
  const errors: Array<{ routeId: string; message: string }> = []

  for (const enrichment of enrichments) {
    try {
      // Check if enrichment already exists by routeId
      // NOTE: curated_route_enrichments HAS a by_routeId index
      const existing = await ctx.db
        .query('curated_route_enrichments')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', enrichment.routeId))
        .first()

      if (existing) {
        // Update existing enrichment
        await ctx.db.patch(existing._id, enrichment)
        updated++
      } else {
        // Insert new enrichment
        await ctx.db.insert('curated_route_enrichments', enrichment)
        inserted++
      }
    } catch (e: any) {
      errors.push({
        routeId: enrichment.routeId,
        message: e?.message ?? 'unknown error',
      })
      skipped++
    }
  }

  return { inserted, updated, skipped, errors }
}

// ---------------------------------------------------------------------------
// Internal mutations for Convex backend
// ---------------------------------------------------------------------------

export const internalUpsertCuratedRoutes = internalMutation({
  args: { routes: v.array(curatedRouteValidator) },
  handler: upsertCuratedRoutesHandler,
})

export const internalUpsertCuratedRouteEnrichments = internalMutation({
  args: { enrichments: v.array(curatedRouteEnrichmentValidator) },
  handler: upsertCuratedRouteEnrichmentsHandler,
})
