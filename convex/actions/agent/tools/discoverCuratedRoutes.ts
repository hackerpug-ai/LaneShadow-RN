'use node'

import polyline from '@mapbox/polyline'
import type { ToolCall } from '@mariozechner/pi-ai'
import { validateToolCall } from '@mariozechner/pi-ai'
import { v } from 'convex/values'
import { api, internal } from '../../../_generated/api'
import { uiArchetypeToDbSet } from '../../../util/archetypeMap'
import type { AgentContext } from '../ridePlanningAgent'

export const discoverCuratedRoutesArgsValidator = v.object({
  intent: v.object({
    archetypes: v.optional(v.array(v.string())),
    state: v.optional(v.string()),
    center: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    sort: v.optional(v.union(v.literal('best'), v.literal('nearest'))),
    limit: v.optional(v.number()),
  }),
})

export const discoverCuratedRoutesResultValidator = v.union(
  v.object({
    type: v.literal('routes'),
    routePlanId: v.id('route_plans'),
  }),
  v.object({
    type: v.literal('chat'),
    message: v.string(),
  }),
  v.object({
    type: v.literal('error'),
    message: v.string(),
    routePlanId: v.optional(v.id('route_plans')),
  }),
)

export const discoverCuratedRoutesSchema = {
  name: 'discoverCuratedRoutes',
  description:
    'Find curated motorcycle routes based on archetypes, location, and preferences. Returns existing curated routes with scores and geometry information.',
  parameters: discoverCuratedRoutesArgsValidator,
}

async function runDiscoverCuratedRoutes(
  ctx: AgentContext,
  args: { intent: any },
): Promise<DiscoverCuratedRoutesResult> {
  // Rate-limit check (limit configurable via RATE_LIMIT_OVERRIDE env var; 0 = unlimited)
  const usage = await ctx.runQuery(internal.db.planUsage.checkUsageInternal, {
    clerkUserId: ctx.clerkUserId,
  })

  if (!usage.allowed) {
    return {
      type: 'chat',
      message: `You've reached your monthly limit of ${usage.limit} route discoveries. Upgrade to Premium for unlimited discoveries!`,
    }
  }

  // Map UI archetypes to DB archetype set
  const dbArchetypeSet = new Set<string>()
  if (args.intent.archetypes && args.intent.archetypes.length > 0) {
    for (const ui of args.intent.archetypes) {
      const dbMappings = uiArchetypeToDbSet(ui as any)
      for (const db of dbMappings) {
        dbArchetypeSet.add(db)
      }
    }
  }

  // Build query parameters for listCuratedRoutes
  const queryArgs: any = {
    limit: args.intent.limit ?? 10,
    sort: args.intent.sort ?? 'best',
  }

  if (args.intent.state) {
    queryArgs.state = args.intent.state
  }

  if (args.intent.center) {
    queryArgs.center = args.intent.center
  }

  if (dbArchetypeSet.size > 0) {
    queryArgs.archetypes = args.intent.archetypes!
  }

  // Call the curated routes API
  const curatedRoutes = await ctx.runQuery(api.curatedRoutes.listCuratedRoutes, queryArgs)

  if (curatedRoutes.length === 0) {
    // No matches found - return conversational response
    const searchQuery = args.intent.archetypes?.join(', ') || 'routes'
    const location =
      args.intent.state || args.intent.center
        ? `in ${args.intent.state || 'your area'}`
        : 'near you'

    return {
      type: 'chat',
      message: `I couldn't find any ${searchQuery} routes ${location}. Try a different search or broaden your criteria.`,
    }
  }

  // Persist a route_plans row for the curated routes
  // Use the centroid as both start and end since this is a single-point discovery, not a trip
  const centerPoint = args.intent.center || { lat: 0, lng: 0 }
  const planInput = {
    start: {
      lat: centerPoint.lat,
      lng: centerPoint.lng,
      label: 'Curated discovery',
    },
    end: {
      lat: centerPoint.lat,
      lng: centerPoint.lng,
      label: curatedRoutes[0]?.name || 'Discovery',
    },
    departureTime: Date.now(),
    preferences: { scenicBias: 'default' as const, avoidHighways: false, avoidTolls: false },
  }

  const { routePlanId } = await ctx.runMutation(internal.db.routePlans.createForAgentInternal, {
    clerkUserId: ctx.clerkUserId,
    planningSessionId: ctx.planningSessionId,
    planInput,
    startLabel: 'Curated discovery',
    endLabel: curatedRoutes[0]?.name || 'Discovery',
  })

  // Build the result options from curated routes
  const options = curatedRoutes.map((route: any) => {
    return {
      routeOptionId: `curated-${route.routeId}`,
      label: route.name,
      rationale: route.summary || `Curated ${route.primaryArchetype} route in ${route.state}`,
      stats: {
        distanceMeters: (route.distanceMi || 0) * 1609.344, // Convert miles to meters
        durationSeconds: 0, // Not available for curated routes
        legsCount: 0, // Not available for curated routes
      },
      // DATA-008b: listCuratedRoutes returns FLAT score fields (compositeScore,
      // scenicScore, curvatureScore, technicalScore, trafficScore, remotenessScore
      // — all already normalized to 0–1 by buildRouteCard's norm()). The previous
      // route.score / route.scores?.* reads returned undefined → composite 0 and
      // all-zero bars on chat cards. Map the flat fields onto the option's
      // dimension slots (catalog dimensions → option dimension keys).
      scores: {
        composite: route.compositeScore ?? 0,
        dimensions: {
          scenery: route.scenicScore ?? 0,
          curvature: route.curvatureScore ?? 0,
          elevation: route.technicalScore ?? 0, // catalog "technical" slot
          traffic: route.trafficScore ?? 0,
          pavement: route.remotenessScore ?? 0, // catalog "remoteness" slot
        },
      },
      map: {
        // DATA-011: use the name-anchored generated LineString when present; otherwise
        // fall back to the centroid point (existing behavior — no regression).
        ...buildCuratedMapGeometry(route),
        legs: [], // No detailed legs for curated routes
        overlays: {},
      },
      overlaysPreview: {
        windSummary: 'unavailable',
        rainSummary: 'unavailable',
        temperatureSummary: 'unavailable',
        conditionsStatus: 'unavailable',
      },
    }
  })

  // Update the route plan with completed status
  await ctx.runMutation(internal.db.routePlans.updatePlanStatus, {
    routePlanId,
    status: 'completed',
    result: {
      planId: routePlanId,
      options,
    },
  })

  return { type: 'routes', routePlanId }
}

// Helper function to encode centroid as polyline (single point fallback)
function encodeCentroidToPolyline(lat: number, lng: number): string {
  return polyline.encode([[lat, lng]])
}

/**
 * DATA-011: build the map geometry + bounds for a curated route option.
 * Prefers the name-anchored generated LineString (geometryStatus === 'generated');
 * decodes it to derive real bounds. Falls back to the centroid point + ±0.5° bounds
 * when no generated geometry exists (unresolved/un-backfilled) — never a fake line.
 */
function buildCuratedMapGeometry(route: any): {
  overviewGeometry: string
  overviewSegments?: string[]
  bounds: { north: number; south: number; east: number; west: number }
} {
  const g = route.routeGeometry
  if (route.geometryStatus === 'generated' && g) {
    const precision = g.precision ?? 5

    // multipolyline (Overpass full route): one encoded polyline per OSM way segment.
    if (g.format === 'multipolyline' && Array.isArray(g.segments) && g.segments.length > 0) {
      let north = -90
      let south = 90
      let east = -180
      let west = 180
      let pts = 0
      let longest = g.segments[0] as string
      let longestN = -1
      for (const seg of g.segments as string[]) {
        const dec = polyline.decode(seg, precision) as [number, number][]
        if (dec.length > longestN) {
          longestN = dec.length
          longest = seg
        }
        for (const [lat, lng] of dec) {
          pts++
          if (lat > north) north = lat
          if (lat < south) south = lat
          if (lng > east) east = lng
          if (lng < west) west = lng
        }
      }
      if (pts >= 2) {
        // overviewGeometry = the longest segment (single-line fallback for consumers that
        // only read overviewGeometry); overviewSegments = the full set for the map render.
        return {
          overviewGeometry: longest,
          overviewSegments: g.segments,
          bounds: { north, south, east, west },
        }
      }
    }

    // single-line (legacy 'polyline' form)
    if (g.value) {
      const decoded = polyline.decode(g.value, precision) as [number, number][] // [lat, lng]
      if (decoded.length >= 2) {
        let north = -90
        let south = 90
        let east = -180
        let west = 180
        for (const [lat, lng] of decoded) {
          if (lat > north) north = lat
          if (lat < south) south = lat
          if (lng > east) east = lng
          if (lng < west) west = lng
        }
        return { overviewGeometry: g.value, bounds: { north, south, east, west } }
      }
    }
  }
  return {
    overviewGeometry: encodeCentroidToPolyline(route.centroidLat, route.centroidLng),
    bounds: {
      north: route.centroidLat + 0.5,
      south: route.centroidLat - 0.5,
      east: route.centroidLng + 0.5,
      west: route.centroidLng - 0.5,
    },
  }
}

export async function executeDiscoverCuratedRoutes(
  ctx: AgentContext,
  call: ToolCall,
): Promise<DiscoverCuratedRoutesResult> {
  const validated = validateToolCall([discoverCuratedRoutesSchema], call) as any
  const intent = validated.intent

  return runDiscoverCuratedRoutes(ctx, { intent })
}

// Export types
export type DiscoverCuratedRoutesResult = any
