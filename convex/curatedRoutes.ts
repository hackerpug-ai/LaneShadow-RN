/**
 * Curated Routes — Public browse queries
 *
 * listCuratedRoutes: Clerk-gated query supporting bbox, nearest-center,
 * state, and archetype filtering over the 5,654-row curated catalog.
 *
 * Also re-exports the Lever-3 deterministic name parser (UC-REC-03) so callers
 * can resolve A-to-B / road-name structure without an LLM.
 */

import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalQuery, query } from './_generated/server'
import { haversineDistance } from './curatedGeometryGate'
import { requireIdentity } from './guards'
import {
  type ParseRouteNameResult,
  parseRouteEndpoints,
  parseRouteName,
} from './lib/endpointParser'
import {
  type DbArchetype,
  dbArchetypeToUi,
  type UiArchetype,
  uiArchetypeToDbSet,
} from './util/archetypeMap'
import { clampLength, normalizeState } from './util/dataNormalization'

export type { ParseRouteNameResult }
/** Deterministic A-to-B / highway-ref parser (Lever 3). Named export for CAP-GEO-06. */
export { parseRouteEndpoints, parseRouteName }

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

export const listCuratedRoutesReturnValidator = v.array(
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
    // DATA-011 16MB-read fix: geometry is NOT returned on the (potentially wide) browse
    // list — it lives in the curated_route_geometry side table and is fetched on demand
    // for the ~10 routes a discovery actually plots. Only the small status stays here.
    geometryStatus: v.optional(
      v.union(
        v.literal('generated'),
        v.literal('unresolved'),
        v.literal('failed'),
        v.literal('review'),
        v.literal('retired'),
      ),
    ),
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
export const MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI = 20
export const isWithinNearestCuratedRouteDistance = (distanceMi: number | undefined): boolean =>
  (distanceMi ?? Number.POSITIVE_INFINITY) <= MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI

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
    // DATA-011 16MB-read fix: only the small status is returned; the actual geometry is
    // fetched from the curated_route_geometry side table by routeId in discoverCuratedRoutes.
    geometryStatus: route.geometryStatus,
  }
}

function stateCodeForName(name: string): string {
  return STATE_CODES[name] ?? name.slice(0, 2).toUpperCase()
}

/**
 * SURF hard-gate (S6-T2): every browse mode reads exclusively via
 * by_riderReady_and_composite_score. Status flags (retired/shadow/quarantine)
 * are excluded by stored riderReady=false on those rows; defense-in-depth
 * filters remain for geometryStatus/retiredAt/duplicateOf/quarantine.
 * NEVER reintroduce a read-time .filter(r => r.riderReady) as the primary gate.
 */
async function queryRiderReadyRoutes(ctx: any, take: number) {
  return ctx.db
    .query('curated_routes')
    .withIndex('by_riderReady_and_composite_score', (q: any) => q.eq('riderReady', true))
    .order('desc')
    .take(take)
}

function isSurfaceEligible(route: any): boolean {
  return (
    route.retiredAt == null &&
    route.geometryStatus !== 'retired' &&
    route.duplicateOf == null &&
    route.quarantine == null
  )
}

function inBbox(
  route: any,
  bbox: { north: number; south: number; east: number; west: number },
): boolean {
  return (
    route.centroidLat <= bbox.north &&
    route.centroidLat >= bbox.south &&
    route.centroidLng <= bbox.east &&
    route.centroidLng >= bbox.west
  )
}

async function listCuratedRoutesHandler(ctx: any, args: any) {
  const effectiveLimit = Math.min(args.limit ?? 50, 200)
  const sort = args.sort ?? 'best'
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

  const matchesArchetype = (route: any) =>
    !dbArchetypeSet || dbArchetypeSet.has(route.primaryArchetype)

  const matchesState = (route: any) =>
    !normalizedState || normalizeState(route.state) === normalizedState

  // Window size when post-filtering by state/archetype/bbox/distance.
  // Index already gates riderReady=true — never pad with non-ready rows.
  const filteredTake = Math.min(
    Math.max(effectiveLimit * 20, effectiveLimit),
    dbArchetypeSet || normalizedState || args.bbox || sort === 'nearest' ? 2000 : effectiveLimit,
  )

  // Mode 1: bbox — riderReady index + centroid-in-rectangle filter, ranked by score.
  if (args.bbox && sort !== 'nearest') {
    const ready = await queryRiderReadyRoutes(ctx, filteredTake)
    return ready
      .filter(
        (r: any) =>
          isSurfaceEligible(r) && matchesState(r) && matchesArchetype(r) && inBbox(r, args.bbox),
      )
      .map((r: any) => buildRouteCard(r))
      .sort((a: any, b: any) => b.compositeScore - a.compositeScore)
      .slice(0, effectiveLimit)
  }

  // Mode 2: nearest — riderReady index + haversine distance, capped at 20 mi.
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

    const ready = await queryRiderReadyRoutes(ctx, filteredTake)
    return ready
      .filter((r: any) => isSurfaceEligible(r) && matchesState(r) && matchesArchetype(r))
      .map((r: any) => {
        const distanceMi = haversineDistance(
          { lat: center.lat, lng: center.lng },
          { lat: r.centroidLat, lng: r.centroidLng },
        )
        return buildRouteCard(r, distanceMi)
      })
      .filter((route: any) => isWithinNearestCuratedRouteDistance(route.distanceMi))
      .sort((a: any, b: any) => (a.distanceMi ?? 0) - (b.distanceMi ?? 0))
      .slice(0, effectiveLimit)
  }

  // Mode 3: state-only — riderReady index + state filter (closes by_state gap).
  if (args.state && !args.bbox) {
    const ready = await queryRiderReadyRoutes(ctx, filteredTake)
    return ready
      .filter((r: any) => isSurfaceEligible(r) && matchesState(r) && matchesArchetype(r))
      .map((r: any) => buildRouteCard(r))
      .sort((a: any, b: any) => b.compositeScore - a.compositeScore)
      .slice(0, effectiveLimit)
  }

  // Mode 4: national best — riderReady-gated via by_riderReady_and_composite_score.
  const topRoutes = await queryRiderReadyRoutes(
    ctx,
    dbArchetypeSet ? Math.min(effectiveLimit * 10, 800) : effectiveLimit,
  )

  return topRoutes
    .filter((r: any) => matchesArchetype(r) && isSurfaceEligible(r))
    .map((r: any) => buildRouteCard(r))
    .slice(0, effectiveLimit)
}

export const listCuratedRoutes = query({
  args: argsValidator,
  returns: listCuratedRoutesReturnValidator,
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    return listCuratedRoutesHandler(ctx, args)
  },
})

export const listCuratedRoutesInternal = internalQuery({
  args: argsValidator,
  returns: listCuratedRoutesReturnValidator,
  handler: listCuratedRoutesHandler,
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

// ─── DATA-006: getCuratedRouteDetail ─────────────────────────────────────────
// Clerk-gated public detail query for a single curated route by routeId.
// Returns a LEAN detail payload: normalized 0–1 scores, an optional encoded
// polyline (`string | null`), computed bounds, a centroid (for the separate
// weather action), and a summary/name-derived headline. Reads NO enrichment
// (curated_route_enrichments is empty — no photos/elevation/description).

const routeDetailArgsValidator = v.object({
  routeId: v.string(),
})

const routeDetailReturnValidator = v.object({
  _id: v.id('curated_routes'),
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
  summary: v.optional(v.string()),
  // routePolyline: the stored encoded string, or null for the ~45% of routes lacking geometry.
  routePolyline: v.union(v.string(), v.null()),
  bounds: v.object({
    north: v.number(),
    south: v.number(),
    east: v.number(),
    west: v.number(),
  }),
  // Headline derives from a non-empty summary, falling back to the route name.
  // oneLiner is 0% populated in the catalog, so it is NEVER used as the headline.
  headline: v.string(),
  sourceLabel: v.optional(v.string()),
  sourceUrl: v.optional(v.string()),
  geometrySource: v.optional(v.string()),
  // ── Real measured data (from FHWA / highway datasets) ──
  elevationGainM: v.optional(v.number()),
  surface: v.optional(v.string()),
  aadt: v.optional(v.number()),
  pavementIri: v.optional(v.number()),
  // S5-T2: retired rows remain detail-reachable with status + reason
  geometryStatus: v.optional(
    v.union(
      v.literal('generated'),
      v.literal('unresolved'),
      v.literal('failed'),
      v.literal('review'),
      v.literal('retired'),
    ),
  ),
  retirementReason: v.optional(v.union(v.string(), v.null())),
  retiredAt: v.optional(v.union(v.number(), v.null())),
  riderReady: v.optional(v.boolean()),
  // S6-T4 / UC-SURF-05: project geometryProvenance so the detail caption can
  // branch on ai_reconstructed / name_routed. Projection-only (no schema change).
  geometryProvenance: v.optional(
    v.union(v.literal('scraped_promoted'), v.literal('ai_reconstructed'), v.literal('name_routed')),
  ),
})

/**
 * Prefer DATA-011 side-table geometry for detail plot (S1-T2 recovery stores
 * ai_reconstructed polylines here, not on curated_routes.routePolyline). Fall
 * back to legacy in-row routePolyline when no side-table value exists.
 */
function resolveDetailRoutePolyline(
  route: Doc<'curated_routes'>,
  geomRow: Doc<'curated_route_geometry'> | null,
): string | null {
  const sideValue = geomRow?.value?.trim()
  if (sideValue) return sideValue
  const firstSegment = geomRow?.segments?.find((s) => typeof s === 'string' && s.trim().length > 0)
  if (firstSegment) return firstSegment
  return route.routePolyline ?? null
}

/**
 * Lean detail projection used by getCuratedRouteDetail.
 * Exported for S6-T4 projection unit tests (geometryProvenance must not drop).
 */
export function buildRouteDetail(
  route: Doc<'curated_routes'>,
  geomRow: Doc<'curated_route_geometry'> | null = null,
) {
  const headline = route.summary && route.summary.trim().length > 0 ? route.summary : route.name

  return {
    _id: route._id,
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
    summary: route.summary,
    routePolyline: resolveDetailRoutePolyline(route, geomRow),
    bounds: {
      north: route.boundsNeLat,
      south: route.boundsSwLat,
      east: route.boundsNeLng,
      west: route.boundsSwLng,
    },
    headline,
    sourceLabel: route.sourceLabel,
    sourceUrl: route.sourceUrl,
    geometrySource: route.geometrySource,
    elevationGainM: route.elevationGainM,
    surface: route.surface,
    aadt: route.aadt,
    pavementIri: route.pavementIri,
    geometryStatus: route.geometryStatus,
    retirementReason: route.retirementReason ?? null,
    retiredAt: route.retiredAt ?? null,
    riderReady: route.riderReady ?? false,
    // S6-T4: surface rest geometryProvenance for the calm detail caption leaf.
    geometryProvenance: route.geometryProvenance,
  }
}

export const getCuratedRouteDetail = query({
  args: routeDetailArgsValidator,
  // null = honest not-found (S1-T3 AC-4). Do NOT throw ConvexError NOT_FOUND:
  // convex/react useQuery rethrows during render, which RN LogBox surfaces as a
  // full-screen "Render Error" even when an ErrorBoundary paints fallback UI.
  //
  // S6-T5 / UC-SURF-06: gate-INDEPENDENT. NEVER filter or throw on riderReady —
  // suggestions are gated; the rider's saved library is not. Shadow rows
  // (duplicateOf set) redirect once to the canonical row; a second hop is a
  // data-integrity fault and returns null (no infinite redirect loop).
  // saved_routes.curatedRouteRef is never mutated here (read-path only).
  returns: v.union(routeDetailReturnValidator, v.null()),
  handler: async (ctx, args) => {
    // Clerk gate — MUST run before any DB read (AC-5: unauthenticated → UNAUTHENTICATED).
    await requireIdentity(ctx)

    // Resolve via the by_routeId index (caller never needs the internal _id).
    // Side-table join is on-demand (single route) — browse list still omits geometry
    // to stay under the DATA-011 16MB read limit.
    let route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', args.routeId))
      .unique()

    if (!route) {
      return null
    }

    // S6-T5 AC-3: single-hop canonical redirect for duplicate-shadow rows.
    // STRICT: redirect at most ONCE — if the canonical also has duplicateOf set,
    // refuse (data integrity fault) rather than walk a chain.
    const shadowOf = route.duplicateOf
    if (shadowOf) {
      const canonical = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', shadowOf))
        .unique()
      if (!canonical || canonical.duplicateOf) {
        return null
      }
      route = canonical
    }

    // Geometry join uses the *resolved* routeId (canonical after redirect).
    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', route.routeId))
      .first()

    return buildRouteDetail(route, geomRow)
  },
})
