/**
 * Curated Routes — Public browse queries
 *
 * listCuratedRoutes: Clerk-gated query supporting bbox, nearest-center,
 * state, and archetype filtering over the 5,654-row curated catalog.
 */

import { v } from 'convex/values'
import { query } from './_generated/server'
import { requireIdentity } from './guards'
import { geospatial } from './geospatialIndex'
import {
  uiArchetypeToDbSet,
  dbArchetypeToUi,
  type UiArchetype,
  type DbArchetype,
} from './util/archetypeMap'
import { normalizeState, clampLength, stateVariants } from './util/dataNormalization'

const argsValidator = v.object({
  bbox: v.optional(v.object({
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
  })),
  center: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  state: v.optional(v.string()),
  archetypes: v.optional(v.array(v.string())),
  sort: v.optional(v.union(v.literal('best'), v.literal('nearest'))),
  limit: v.optional(v.number()),
})

const returnValidator = v.array(v.object({
  routeId: v.string(),
  name: v.string(),
  state: v.string(),
  primaryArchetype: v.string(),
  centroidLat: v.number(),
  centroidLng: v.number(),
  compositeScore: v.number(),
  curvatureScore: v.optional(v.number()),
  scenicScore: v.optional(v.number()),
  technicalScore: v.optional(v.number()),
  trafficScore: v.optional(v.number()),
  remotenessScore: v.optional(v.number()),
  lengthMiles: v.optional(v.number()),
  distanceMi: v.optional(v.number()),
  summary: v.optional(v.string()),
}))

const norm = (v: number) => (v > 1 ? v / 100 : v)

function buildRouteCard(route: any, distanceMi?: number) {
  return {
    routeId: route.routeId,
    name: route.name,
    state: normalizeState(route.state),
    primaryArchetype: dbArchetypeToUi(route.primaryArchetype as DbArchetype),
    centroidLat: route.centroidLat,
    centroidLng: route.centroidLng,
    compositeScore: norm(route.compositeScore),
    curvatureScore: route.curvatureScore !== undefined ? norm(route.curvatureScore) : undefined,
    scenicScore: route.scenicScore !== undefined ? norm(route.scenicScore) : undefined,
    technicalScore: route.technicalScore !== undefined ? norm(route.technicalScore) : undefined,
    trafficScore: route.trafficScore !== undefined ? norm(route.trafficScore) : undefined,
    remotenessScore: route.remotenessScore !== undefined ? norm(route.remotenessScore) : undefined,
    lengthMiles: clampLength(route.lengthMiles),
    distanceMi,
    summary: route.summary,
  }
}

export const listCuratedRoutes = query({
  args: argsValidator,
  returns: returnValidator,
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const effectiveLimit = Math.min(args.limit ?? 50, 200)

    let dbArchetypeSet: Set<string> | undefined
    if (args.archetypes && args.archetypes.length > 0) {
      dbArchetypeSet = new Set<string>()
      for (const ui of args.archetypes) {
        for (const db of uiArchetypeToDbSet(ui as UiArchetype)) {
          dbArchetypeSet.add(db)
        }
      }
    }

    const archetypeGeoFilter = dbArchetypeSet
      ? (q: any) => q.in('primaryArchetype', [...dbArchetypeSet])
      : undefined

    const matchesArchetype = (route: any) =>
      !dbArchetypeSet || dbArchetypeSet.has(route.primaryArchetype)

    // Mode 1: bbox query (geospatial rectangle)
    if (args.bbox && args.sort !== 'nearest') {
      const geoResults = await geospatial.query(ctx, {
        shape: {
          type: 'rectangle',
          rectangle: {
            west: args.bbox.west,
            east: args.bbox.east,
            south: args.bbox.south,
            north: args.bbox.north,
          },
        },
        filter: archetypeGeoFilter,
        limit: effectiveLimit * 2,
      })

      const routes = await Promise.all(
        geoResults.results.map((r) => ctx.db.get(r.key as any)),
      )

      return routes
        .filter((r): r is NonNullable<typeof r> => r !== null && matchesArchetype(r))
        .map((r) => buildRouteCard(r))
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, effectiveLimit)
    }

    // Mode 2: nearest query (geospatial nearest)
    if (args.center || args.sort === 'nearest') {
      const center = args.center ??
        (args.bbox
          ? {
              lat: (args.bbox.north + args.bbox.south) / 2,
              lng: (args.bbox.east + args.bbox.west) / 2,
            }
          : undefined)

      if (!center) {
        throw new Error('Center point required for sort=nearest')
      }

      const nearestResults = await geospatial.nearest(ctx, {
        point: { latitude: center.lat, longitude: center.lng },
        limit: effectiveLimit,
        filter: archetypeGeoFilter,
      })

      const routes = await Promise.all(
        nearestResults.map((r) => ctx.db.get(r.key as any)),
      )

      return routes
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .map((r, i) => {
          const dist = nearestResults[i]
          return buildRouteCard(r, dist ? dist.distance * 0.000621371 : undefined)
        })
        .sort((a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0))
    }

    // Mode 3: state-only query (by_state index, both spelling variants)
    if (args.state && !args.bbox && !args.center) {
      const variants = stateVariants(args.state)
      const all: any[] = []

      for (const variant of variants) {
        const batch = await ctx.db
          .query('curated_routes')
          .withIndex('by_state', (q) => q.eq('state', variant))
          .take(effectiveLimit * 2)
        all.push(...batch)
      }

      const seen = new Set<string>()
      return all
        .filter((r) => {
          if (seen.has(r._id)) return false
          seen.add(r._id)
          return matchesArchetype(r)
        })
        .map((r) => buildRouteCard(r))
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, effectiveLimit)
    }

    // Mode 4: no geography — best sort via by_composite_score index
    const topRoutes = await ctx.db
      .query('curated_routes')
      .withIndex('by_composite_score')
      .order('desc')
      .take(dbArchetypeSet ? effectiveLimit * 3 : effectiveLimit)

    return topRoutes
      .filter(matchesArchetype)
      .map((r) => buildRouteCard(r))
      .slice(0, effectiveLimit)
  },
})
