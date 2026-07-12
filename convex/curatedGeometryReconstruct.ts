/**
 * Public wrappers for reconstruct + verification reads (integration tests + CLI).
 * Core 'use node' logic lives in convex/actions/curatedGeometryReconstruct.ts.
 */

import { v } from 'convex/values'
import { internal } from './_generated/api'
import { action, query } from './_generated/server'
import type { ReconstructPersistResult } from './actions/curatedGeometryReconstruct'
import { requireIdentity } from './guards'

export const reconstructForRoute = action({
  args: { routeId: v.string() },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(internal.actions.curatedGeometryReconstruct.reconstructForRoute, args)
  },
})

export const reconstructForRouteWithFixedGeometry = action({
  args: {
    routeId: v.string(),
    routedMiles: v.number(),
    pointCount: v.optional(v.number()),
    anchorCount: v.optional(v.number()),
    claimedMiles: v.optional(v.union(v.number(), v.null())),
  },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(
      internal.actions.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry,
      args,
    )
  },
})

export const reconstructForRouteWithFixedAnchors = action({
  args: {
    routeId: v.string(),
    anchorCount: v.number(),
    claimedMiles: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(
      internal.actions.curatedGeometryReconstruct.reconstructForRouteWithFixedAnchors,
      args,
    )
  },
})

export const reconstructForRouteWithMixedAnchors = action({
  args: {
    routeId: v.string(),
    inRegionCount: v.number(),
    offRegionCount: v.number(),
  },
  handler: async (ctx, args): Promise<ReconstructPersistResult> => {
    await requireIdentity(ctx)
    return ctx.runAction(
      internal.actions.curatedGeometryReconstruct.reconstructForRouteWithMixedAnchors,
      args,
    )
  },
})

export const getVerificationForRoute = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    if (!geomRow?.verification) return null

    const sideProvenance = geomRow.provenance
    return {
      ...geomRow.verification,
      provenance: geomRow.verification.provenance ?? sideProvenance,
      riderReady: route?.riderReady ?? false,
    }
  },
})

export const getRouteForReading = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!doc) return null
    return {
      routeId: doc.routeId,
      riderReady: doc.riderReady ?? false,
      geometryStatus: doc.geometryStatus ?? null,
      name: doc.name,
    }
  },
})
