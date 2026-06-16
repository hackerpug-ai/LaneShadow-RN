/**
 * Curated Routes — Public browse queries
 *
 * listCuratedRoutes: Clerk-gated query supporting bbox, nearest-center,
 * state, and archetype filtering over the 5,654-row curated catalog.
 */

import { v } from 'convex/values'
import { query } from './_generated/server'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'
import {
  type DbArchetype,
  dbArchetypeToUi,
  type UiArchetype,
  uiArchetypeToDbSet,
} from './util/archetypeMap'
import { clampLength, normalizeState, stateVariants } from './util/dataNormalization'

const argsValidator = v.object({
  bbox: v.optional(
    v.object({
      north: v.number(),
      south: v.number(),
      east: v.number(),
      west: v.number(),
    }),
  ),
  center: v.optional(v.object({ lat: v.number(), lng: v.number() })),
  state: v.optional(v.string()),
  archetypes: v.optional(v.array(v.string())),
  sort: v.optional(v.union(v.literal('best'), v.literal('nearest'))),
  limit: v.optional(v.number()),
})

const returnValidator = v.array(
  v.object({
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
  }),
)

const stateSummaryReturnValidator = v.array(
  v.object({
    code: v.string(),
    name: v.string(),
    routeCount: v.number(),
  }),
)

const STATE_CODES: Record<string, string> = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  'New Hampshire': 'NH',
  'New Jersey': 'NJ',
  'New Mexico': 'NM',
  'New York': 'NY',
  'North Carolina': 'NC',
  'North Dakota': 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  'Rhode Island': 'RI',
  'South Carolina': 'SC',
  'South Dakota': 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  'West Virginia': 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

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

function buildGeoFilter(stateValues?: string[], dbArchetypeSet?: Set<string>) {
  if (stateValues && stateValues.length > 0) {
    return (q: any) =>
      stateValues.length === 1 ? q.eq('state', stateValues[0]) : q.in('state', stateValues)
  }

  if (dbArchetypeSet && dbArchetypeSet.size > 0) {
    return (q: any) => q.in('primaryArchetype', [...dbArchetypeSet])
  }

  return undefined
}

function stateCodeForName(name: string): string {
  return STATE_CODES[name] ?? name.slice(0, 2).toUpperCase()
}

export const listCuratedRoutes = query({
  args: argsValidator,
  returns: returnValidator,
  handler: async (ctx, args) => {
    await requireIdentity(ctx)

    const effectiveLimit = Math.min(args.limit ?? 50, 200)
    const sort = args.sort ?? 'best'
    const stateValues = args.state ? stateVariants(args.state) : undefined
    const normalizedState = args.state ? normalizeState(args.state) : undefined

    let dbArchetypeSet: Set<string> | undefined
    if (args.archetypes && args.archetypes.length > 0) {
      dbArchetypeSet = new Set<string>()
      for (const ui of args.archetypes) {
        for (const db of uiArchetypeToDbSet(ui as UiArchetype)) {
          dbArchetypeSet.add(db)
        }
      }
    }

    const geoFilter = buildGeoFilter(stateValues, dbArchetypeSet)

    const matchesArchetype = (route: any) =>
      !dbArchetypeSet || dbArchetypeSet.has(route.primaryArchetype)

    const matchesState = (route: any) =>
      !normalizedState || normalizeState(route.state) === normalizedState

    // Mode 1: bbox query (geospatial rectangle), ranked by score.
    if (args.bbox && sort !== 'nearest') {
      const geoResults = await (geospatial as any).query(ctx, {
        shape: {
          type: 'rectangle',
          rectangle: {
            west: args.bbox.west,
            east: args.bbox.east,
            south: args.bbox.south,
            north: args.bbox.north,
          },
        },
        filter: geoFilter,
        limit: effectiveLimit * 2,
      })

      const routes = await Promise.all(geoResults.results.map((r: any) => ctx.db.get(r.key as any)))

      return routes
        .filter(
          (r): r is NonNullable<typeof r> => r !== null && matchesState(r) && matchesArchetype(r),
        )
        .map((r) => buildRouteCard(r))
        .sort((a, b) => b.compositeScore - a.compositeScore)
        .slice(0, effectiveLimit)
    }

    // Mode 2: nearest query (geospatial nearest)
    if (sort === 'nearest') {
      const center =
        args.center ??
        (args.bbox
          ? {
              lat: (args.bbox.north + args.bbox.south) / 2,
              lng: (args.bbox.east + args.bbox.west) / 2,
            }
          : undefined)

      if (!center) {
        throw new Error('Center point required for sort=nearest')
      }

      const nearestResults = await (geospatial as any).nearest(ctx, {
        point: { latitude: center.lat, longitude: center.lng },
        limit: effectiveLimit * 3,
        filter: geoFilter,
      })

      const pairs = await Promise.all(
        nearestResults.map(async (r: any) => ({
          geo: r,
          route: await ctx.db.get(r.key as any),
        })),
      )

      return pairs
        .filter((p) => p.route !== null && matchesState(p.route) && matchesArchetype(p.route))
        .map((p) => buildRouteCard(p.route, p.geo.distance * 0.000621371))
        .sort((a, b) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0))
        .slice(0, effectiveLimit)
    }

    // Mode 3: state-only query (by_state index, both spelling variants)
    if (args.state && !args.bbox) {
      const all: any[] = []

      for (const variant of stateValues ?? []) {
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
      .take(dbArchetypeSet ? Math.min(effectiveLimit * 10, 2000) : effectiveLimit)

    return topRoutes
      .filter(matchesArchetype)
      .map((r) => buildRouteCard(r))
      .slice(0, effectiveLimit)
  },
})

export const listCuratedRouteStates = query({
  args: {},
  returns: stateSummaryReturnValidator,
  handler: async (ctx) => {
    await requireIdentity(ctx)

    // Read from denormalized state counts summary instead of reading all 5,654+ full documents
    // This avoids exceeding the 16MB single-execution read limit
    const stateCounts = await ctx.db.query('curated_route_state_counts').collect()

    return stateCounts
      .map((record) => ({
        code: stateCodeForName(record.stateName),
        name: record.stateName,
        routeCount: record.routeCount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  },
})
