'use node'

import polyline from '@mapbox/polyline'
import type { ToolCall } from '@mariozechner/pi-ai'
import { validateToolCall } from '@mariozechner/pi-ai'
import { v } from 'convex/values'
import { internal } from '../../../_generated/api'
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

export const CURATED_ROUTE_DISCOVERY_CANDIDATE_LIMIT = 200
const CURATED_ROUTE_GEOMETRY_LOOKUP_BATCH_SIZE = 25

function normalizeRequestedLimit(limit: unknown): number {
  if (typeof limit !== 'number' || !Number.isFinite(limit)) {
    return 10
  }
  return Math.min(Math.max(Math.trunc(limit), 1), CURATED_ROUTE_DISCOVERY_CANDIDATE_LIMIT)
}

function hasRenderableCuratedGeometry(
  g:
    | {
        format: 'polyline' | 'multipolyline'
        precision: number
        value?: string | null
        segments?: string[] | null
      }
    | null
    | undefined,
): boolean {
  if (!g) return false

  const precision = g.precision ?? 5

  try {
    if (g.format === 'multipolyline' && Array.isArray(g.segments)) {
      return g.segments.some((segment) => polyline.decode(segment, precision).length >= 2)
    }

    if (g.value) {
      return polyline.decode(g.value, precision).length >= 2
    }
  } catch {
    return false
  }

  return false
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

  const requestedLimit = normalizeRequestedLimit(args.intent.limit)

  // Build query parameters for listCuratedRoutes. Fetch the full supported
  // candidate window, then choose plottable routes from it. This keeps discovery
  // from returning an unresolved centroid-only top score when real generated
  // geometry exists a little deeper in the ranked catalog.
  const queryArgs: any = {
    limit: CURATED_ROUTE_DISCOVERY_CANDIDATE_LIMIT,
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

  // Internal query (same handler as public listCuratedRoutes, no second
  // requireIdentity). Entry auth is already enforced by sendMessage /
  // agent requireIdentity; re-entering the public gate re-threw
  // UNAUTHENTICATED on residual identity races. Internal is not client-callable.
  const candidateRoutes = await ctx.runQuery(
    internal.curatedRoutes.listCuratedRoutesInternal,
    queryArgs,
  )

  if (candidateRoutes.length === 0) {
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

  // Fetch real side-table geometry in ranked batches and stop as soon as we
  // have enough routes with decodable line geometry for the requested result
  // count. SURF hard-gate (S6-T2): never pad with non-plottable / centroid-only
  // candidates — honest empty/partial is the only allowed thin-supply response.
  const generatedCandidates = candidateRoutes.filter((r: any) => r.geometryStatus === 'generated')
  const geometryByRouteId = new Map<string, any>()
  const plottableRoutes: any[] = []

  for (
    let i = 0;
    i < generatedCandidates.length && plottableRoutes.length < requestedLimit;
    i += CURATED_ROUTE_GEOMETRY_LOOKUP_BATCH_SIZE
  ) {
    const batch = generatedCandidates.slice(i, i + CURATED_ROUTE_GEOMETRY_LOOKUP_BATCH_SIZE)
    const geometryRows = await ctx.runQuery(internal.curatedGeometry.getGeometryForRoutes, {
      routeIds: batch.map((route: any) => route.routeId),
    })

    for (const geometry of geometryRows as any[]) {
      geometryByRouteId.set(geometry.routeId, geometry)
    }

    for (const route of batch) {
      if (hasRenderableCuratedGeometry(geometryByRouteId.get(route.routeId))) {
        plottableRoutes.push(route)
      }
      if (plottableRoutes.length >= requestedLimit) {
        break
      }
    }
  }

  // No centroid pad: if zero plottable rider-ready routes, return honest chat.
  if (plottableRoutes.length === 0) {
    const searchQuery = args.intent.archetypes?.join(', ') || 'routes'
    const location =
      args.intent.state || args.intent.center
        ? `in ${args.intent.state || 'your area'}`
        : 'near you'

    return {
      type: 'chat',
      message: `I couldn't find any ${searchQuery} routes ${location} with plottable geometry. Try a different search or broaden your criteria.`,
    }
  }

  const curatedRoutes = plottableRoutes.slice(0, requestedLimit)
  // Persist a route_plans row for the curated routes.
  //
  // REDHAT-FIX-005 / M-3: when the caller supplies a `center` (nearest-sort),
  // use it. When `center` is absent (best-sort discovery), fall back to the
  // FIRST returned route's centroid — a real coordinate — instead of the
  // Atlantic-Ocean sentinel {lat:0,lng:0}. planInput.start/end require real
  // lat/lng (routeStopValidator: shared/models/saved-routes.ts:75-80), so the
  // fallback cannot simply be omitted; it must be a meaningful coordinate.
  // Using the first route's centroid ties the persisted planInput to the
  // actual discovery result rather than a fabricated origin.
  const centerPoint =
    args.intent.center ??
    (curatedRoutes[0]
      ? { lat: curatedRoutes[0].centroidLat, lng: curatedRoutes[0].centroidLng }
      : { lat: 0, lng: 0 })
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
        // REDHAT-FIX-001 / DATA-008b: guard absent distanceMi to undefined
        // (not a fabricated real 0). best-sort options omit distanceMi; only
        // nearest-sort carries a real distance. scores block (below) untouched.
        distanceMeters: route.distanceMi != null ? route.distanceMi * 1609.344 : undefined,
        // REDHAT-FIX-005: mirror the != null guard philosophy for the remaining
        // curated-absent stats. Curated routes carry NO duration / legs data,
        // so the option must OMIT these keys (undefined) rather than fabricate
        // a real 0 — the SAME anti-pattern as the original CRITICAL
        // distanceMeters: 0 bug. Convex JSON serialization drops undefined
        // keys, so consumers reading option.stats.durationSeconds / legsCount
        // get undefined (the honest "unavailable" signal), never a misleading
        // real 0.
        durationSeconds: undefined, // Not available for curated routes
        legsCount: undefined, // Not available for curated routes
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
        // S6-T2: curatedRoutes are already plottable (multi-point geometry looked up
        // above). buildCuratedMapGeometry is fail-closed — never encodes a 1-point centroid.
        ...buildCuratedMapGeometry(route, geometryByRouteId.get(route.routeId)),
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

/**
 * DATA-011 / S6-T2: build map geometry + bounds for a curated route option.
 * Requires multi-point generated geometry from the curated_route_geometry side table.
 * Fail-closed: never encodes a 1-point centroid polyline into the discovery response.
 * Callers (runDiscoverCuratedRoutes) must pre-filter via hasRenderableCuratedGeometry.
 */
export function buildCuratedMapGeometry(
  route: any,
  g:
    | {
        format: 'polyline' | 'multipolyline'
        encoding?: string | null
        precision: number
        value?: string | null
        segments?: string[] | null
      }
    | null
    | undefined,
): {
  overviewGeometry: {
    format: 'polyline'
    encoding: string
    precision: number
    value: string
  }
  overviewSegments?: string[]
  bounds: { north: number; south: number; east: number; west: number }
} {
  if (g) {
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
          overviewGeometry: {
            format: 'polyline',
            encoding: 'polyline',
            precision,
            value: longest,
          },
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
        return {
          overviewGeometry: {
            format: 'polyline',
            encoding: g.encoding ?? 'polyline',
            precision,
            value: g.value,
          },
          bounds: { north, south, east, west },
        }
      }
    }
  }

  // S6-T2: no centroid slice/fallback in the discovery response path.
  // Upstream hasRenderableCuratedGeometry already excludes non-plottable rows;
  // reaching here is a programming error, not a soft fallback.
  const routeId = typeof route?.routeId === 'string' ? route.routeId : 'unknown'
  throw new Error(
    `buildCuratedMapGeometry: multi-point geometry required for route ${routeId}; centroid fallback removed (S6-T2)`,
  )
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
