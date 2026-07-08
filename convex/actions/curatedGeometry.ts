/**
 * DATA-011: curated route geometry generation actions (name-anchored).
 *
 * Generates a real per-route polyline for each curated route by:
 *   1. Geocoding "{name}, {state}" via Nominatim (free, keyless) to get a bounding box
 *   2. Deriving start/end endpoints from the geocode bounding box (or catalog bounds fallback)
 *   3. Routing start→end via the existing Google Routes provider (`routingProvider.ts`)
 *   4. Persisting the encoded overview polyline to the `curated_route_geometry` side table
 *
 * This file uses `'use node'` so it can import the Google Routes provider.
 * Queries and mutations live in `convex/curatedGeometry.ts` (default runtime).
 *
 * Run the sample for human review:
 *   npx convex run actions/curatedGeometry:backfill '{"sample":25}'
 * Run the full backfill:
 *   npx convex run actions/curatedGeometry:backfill '{"sample":250,"cursor":"<continueCursor>"}'
 * Generate a single route:
 *   npx convex run actions/curatedGeometry:generateForRoute '{"routeId":"brp-nc"}'
 */

'use node'

import polyline from '@mapbox/polyline'
import { v } from 'convex/values'
import type { RouteSketch } from '../../shared/models/route-sketch'
import type { PlanInput } from '../../shared/models/saved-routes'
import { internal } from '../_generated/api'
import { internalAction } from '../_generated/server'
import {
  type BackfillPage,
  type BackfillReport,
  type GenerateForRouteResult,
  stateAbbr,
} from '../curatedGeometry'
import {
  createRoutingProvider,
  type ProviderRouteResponse,
} from './agent/providers/routingProvider'

// ---------------------------------------------------------------------------
// Nominatim geocoding
// ---------------------------------------------------------------------------

type NominatimResult = {
  lat: number
  lng: number
  boundingbox?: [number, number, number, number] // [south, north, west, east]; absent for centroid-only results
} | null
type NominatimCandidate = NonNullable<NominatimResult> & { query: string }
type CatalogCenter = { lat: number; lng: number }

const MAX_NOMINATIM_CANDIDATE_DISTANCE_MI = 35

function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * 3958.7613 * Math.asin(Math.min(1, Math.sqrt(s)))
}

function normalizeNominatimQueries(
  name: string,
  state: string,
  highwayNumber: string | null,
): string[] {
  const abbr = stateAbbr(state)
  const stateText = abbr ?? state.replace(/-/g, ' ')
  const candidates = new Set<string>()
  const add = (value: string) => {
    const cleaned = value.replace(/\s+/g, ' ').trim()
    if (cleaned) candidates.add(`${cleaned}, ${stateText}`)
  }

  add(name)

  const beforeColon = name.split(':')[0]?.trim()
  if (beforeColon && beforeColon !== name) add(beforeColon)

  const withoutDashSubtitle = name.split(/\s--\s|\s*--\s*/)[0]?.trim()
  if (withoutDashSubtitle && withoutDashSubtitle !== name) add(withoutDashSubtitle)

  for (const parenthetical of name.matchAll(/\(([^)]*)\)/g)) {
    const tokens = parenthetical[1]
      .split(/[,/&]|\band\b/gi)
      .map((part) => part.trim())
      .filter(Boolean)
    for (const token of tokens) {
      if (/^\d+[A-Za-z]?$/.test(token)) {
        if (abbr) {
          add(`${abbr} ${token}`)
          add(`${abbr}-${token}`)
        }
        add(`Route ${token}`)
      }
    }
  }

  if (highwayNumber) add(`Route ${highwayNumber}`)

  return [...candidates]
}

/**
 * Geocode normalized "{route name}, {state}" candidates via Nominatim. Multiple
 * same-name roads can exist in one state, so when a catalog centroid is available
 * we choose the nearest candidate and reject far-away matches.
 */
async function geocodeViaNominatim(
  name: string,
  state: string,
  highwayNumber: string | null,
  center: CatalogCenter,
): Promise<NominatimResult> {
  const queries = normalizeNominatimQueries(name, state, highwayNumber)
  let nearest: NominatimCandidate | null = null
  let nearestDistanceMi = Number.POSITIVE_INFINITY

  for (const query of queries) {
    const candidates = await searchNominatim(query)
    for (const candidate of candidates) {
      const distanceMi = haversineMi(center.lat, center.lng, candidate.lat, candidate.lng)
      if (!nearest || distanceMi < nearestDistanceMi) {
        nearest = { ...candidate, query }
        nearestDistanceMi = distanceMi
      }
    }

    if (nearest && nearestDistanceMi <= MAX_NOMINATIM_CANDIDATE_DISTANCE_MI) {
      return nearest
    }
  }

  return nearest && nearestDistanceMi <= MAX_NOMINATIM_CANDIDATE_DISTANCE_MI ? nearest : null
}

async function searchNominatim(query: string): Promise<NonNullable<NominatimResult>[]> {
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&limit=8&addressdetails=0`

  // Nominatim usage policy: ≤1 req/s, identify with User-Agent.
  // Retry with backoff on 429/503 (transient rate-limiting). Previously a 429-empty
  // response was treated as "no result" and the route was permanently stamped
  // 'unresolved' — the root cause of ~91% of the catalog lacking geometry (verified
  // 2026-07-08; see .spec/prds/catalog-geometry-recovery/00-overview.md).
  const headers = {
    'User-Agent': 'LaneShadow/1.0 (curated route geometry; justin@formulist.ai)',
    'Accept-Language': 'en',
  }
  for (let attempt = 0; attempt < 3; attempt++) {
    await new Promise((r) => setTimeout(r, attempt === 0 ? 1100 : 4000 * attempt))

    let res: Response
    try {
      res = await fetch(url, { headers })
    } catch {
      continue // network error → retry
    }
    if (res.status === 429 || res.status === 503) continue // rate-limited → backoff + retry
    if (!res.ok) return []

    const data = (await res.json()) as Array<{
      lat: string
      lon: string
      boundingbox?: [string, string, string, string] // [south, north, west, east]
    }>

    if (!data.length) return []

    return data.map((r) => {
      const bb = r.boundingbox
      return {
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
        boundingbox: bb
          ? [parseFloat(bb[0]), parseFloat(bb[1]), parseFloat(bb[2]), parseFloat(bb[3])]
          : undefined,
      }
    })
  }
  return [] // exhausted retries
}

// ---------------------------------------------------------------------------
// Google Routes routing (via the existing routingProvider)
// ---------------------------------------------------------------------------

type Bounds = { neLat: number; neLng: number; swLat: number; swLng: number }

type RouteResult = {
  encodedPolyline: string // Google encoded polyline (precision 5)
  bounds: { north: number; south: number; east: number; west: number }
} | null

/**
 * Route between two endpoints via the existing Google Routes provider.
 * Constructs a minimal PlanInput + RouteSketch and calls routeFromSketch,
 * exactly as the agent route planning does.
 */
async function routeViaGoogleRoutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
): Promise<RouteResult> {
  let provider: ReturnType<typeof createRoutingProvider>
  try {
    provider = createRoutingProvider()
  } catch {
    return null // GOOGLE_MAPS_API_KEY missing
  }

  // Build minimal PlanInput + RouteSketch (same pattern as agent route planning)
  const planInput: PlanInput = {
    start: { lat: startLat, lng: startLng, label: 'Start' },
    end: { lat: endLat, lng: endLng, label: 'End' },
    departureTime: Date.now(),
    preferences: { scenicBias: 'default', avoidHighways: false, avoidTolls: false },
  }

  const sketch: RouteSketch = {
    label: 'Curated route geometry',
    rationale: 'Name-anchored geometry generation',
    segments: [{ roadName: 'Route', fromName: 'Start', toName: 'End' }],
    anchorPoints: [
      { name: 'Start', kind: 'junction', lat: startLat, lng: startLng },
      { name: 'End', kind: 'junction', lat: endLat, lng: endLng },
    ],
  }

  try {
    const response: ProviderRouteResponse = await provider.routeFromSketch({ planInput, sketch })
    return {
      encodedPolyline: response.overviewGeometry.value,
      bounds: response.bounds,
    }
  } catch {
    return null // routing failed (no route found, API error, etc.)
  }
}

// ---------------------------------------------------------------------------
// Core generation logic
// ---------------------------------------------------------------------------

type GeocodeRouteResult = { value: string; coordCount: number }

/**
 * Tier-2 endpoint parser: extract [start, end] place tokens from route names that
 * encode their endpoints. Validated 2026-07-08 (resolves 75% of the OD/highway-ref
 * stratum that full-string geocoding misses at 0%):
 *   "US 9W : Fort Montgomery - Rockleigh"               -> ["Fort Montgomery", "Rockleigh"]
 *   "Loop Wilkes-Barre : Nanticoke - Forkston - Pittston" -> ["Nanticoke", "Pittston"]
 *   "Hwy 246 - Roswell to Capitan"                      -> ["Roswell", "Capitan"]
 *   "Naples to Key West"                                -> ["Naples", "Key West"]
 * Returns null for clean single names ("Cherohala Skyway") — those have no endpoint
 * structure and go through the name-geocode → bounding-box path.
 */
function parseRouteEndpoints(name: string): [string, string] | null {
  let s = name
  // Drop trailing/inline parenthetical cruft: "(USA_TTC 1)", "(KY)".
  s = s.replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  // Drop a leading "<ref or label> :" prefix — take the part after the last " : ".
  const colonParts = s.split(/\s+:\s+/)
  if (colonParts.length >= 2) s = colonParts[colonParts.length - 1]
  // Drop a leading highway-ref token when there was no colon
  //   ("Hwy 246 - Roswell to Capitan" -> "Roswell to Capitan").
  s = s.replace(/^(?:US|SR|Hwy|CA|VA|WV|NC|CT|Route|Rt)\s*\w+\s*[-–—]\s*/i, '')
  // Split on " - " / " – " / " — " / " to ".
  const parts = s
    .split(/\s+[-–—]\s+|\s+to\s+/i)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
  if (parts.length < 2) return null
  // First + last token bound the road (for 3+ town chains, the ends are the route ends).
  return [parts[0], parts[parts.length - 1]]
}

/**
 * Tier-2: geocode a single place token (an endpoint town/junction) via Nominatim,
 * preferring the candidate nearest the catalog center to disambiguate same-name towns.
 * No distance cap — endpoints legitimately sit far from a long route's centroid; the
 * downstream Google-Routes step + the QA suspect_far check catch garbage.
 */
async function geocodePlace(
  token: string,
  state: string,
  center: CatalogCenter,
): Promise<{ lat: number; lng: number } | null> {
  const abbr = stateAbbr(state)
  const stateText = abbr ?? state.replace(/-/g, ' ')
  // Prefer the state-scoped query; fall back to the bare token.
  for (const query of [`${token}, ${stateText}`, token]) {
    let best: { lat: number; lng: number } | null = null
    let bestD = Number.POSITIVE_INFINITY
    for (const c of await searchNominatim(query)) {
      const d = haversineMi(center.lat, center.lng, c.lat, c.lng)
      if (d < bestD) {
        best = { lat: c.lat, lng: c.lng }
        bestD = d
      }
    }
    if (best) return best
  }
  return null
}

/**
 * Generate geometry for a curated route:
 *   1. Geocode "{name}, {state}" via Nominatim → get bounding box
 *   2. Derive start/end from bounding box (or catalog bounds fallback)
 *   3. Route start→end via Google Routes → encoded overview polyline
 *   4. Return the polyline + coordinate count (or null if unresolvable)
 *
 * Deterministic fallback: if geocoding or routing fails, returns null.
 * The caller stamps `geometryStatus: 'unresolved'` or `'failed'` and writes
 * NO geometry — the reader falls back to the centroid (Supreme Rule: no fake line).
 */
async function geocodeRouteGeometry(
  name: string,
  state: string,
  highwayNumber: string | null,
  bounds: Bounds,
  center: CatalogCenter,
): Promise<GeocodeRouteResult | null> {
  // Tier 2 (validated 2026-07-08 — resolves 75% of OD/highway-ref names that full-string
  // geocoding misses): if the name encodes endpoints ("US 9W : Fort Montgomery - Rockleigh",
  // "Naples to Key West"), geocode the two endpoint places separately and route between
  // them. The endpoint towns resolve individually even though the full string does not.
  const endpoints = parseRouteEndpoints(name)
  if (endpoints) {
    const [aTok, bTok] = endpoints
    const a = await geocodePlace(aTok, state, center)
    const b = await geocodePlace(bTok, state, center)
    if (a && b) {
      const route = await routeViaGoogleRoutes(a.lat, a.lng, b.lat, b.lng)
      if (route) {
        const decoded = polyline.decode(route.encodedPolyline, 5) as [number, number][]
        if (decoded.length > 1) {
          return { value: route.encodedPolyline, coordCount: decoded.length }
        }
      }
    }
    // endpoint-parsing didn't yield a usable route — fall through to name-geocode
  }

  // Tier 1 / existing path: Geocode "{name}, {state}" via Nominatim → bounding box
  const geo = await geocodeViaNominatim(name, state, highwayNumber, center)

  // CRITICAL (Supreme Rule: no fake line): If Nominatim returns null (no result),
  // the route name is unresolvable. Return null → caller stamps 'unresolved' and
  // writes NO geometry. NEVER fall back to catalog bounds to fabricate a route line —
  // a diagonal line across the bounding box of an unresolvable name is a fake success.
  if (!geo) return null

  let startLat: number
  let startLng: number
  let endLat: number
  let endLng: number

  if (geo.boundingbox) {
    // Nominatim returned a result WITH a bounding box — use it to derive endpoints.
    const [south, north, west, east] = geo.boundingbox
    startLat = south
    startLng = west // SW corner
    endLat = north
    endLng = east // NE corner
  } else {
    // Nominatim returned a result but WITHOUT a bounding box (centroid-only result).
    // The spec says: "if only a centroid resolves, anchor endpoints from the catalog
    // boundsNe/Sw". This is the ONLY acceptable use of catalog bounds as fallback —
    // we have a real geocoded location, just no extent, so we borrow the catalog's
    // known bounding box for endpoint derivation.
    startLat = bounds.swLat
    startLng = bounds.swLng
    endLat = bounds.neLat
    endLng = bounds.neLng
  }

  // Step 2: Route start→end via Google Routes
  const route = await routeViaGoogleRoutes(startLat, startLng, endLat, endLng)
  if (!route) return null

  // Decode polyline to count coordinates and verify >1 (real line, not a point)
  const decoded = polyline.decode(route.encodedPolyline, 5) as [number, number][]
  if (decoded.length <= 1) return null // single point, not a real line

  return {
    value: route.encodedPolyline,
    coordCount: decoded.length,
  }
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Internal action: generate geometry for a single curated route by routeId.
 *
 * This is the per-route action that the driver script and tests call directly.
 * It reads the route, geocodes via Nominatim, routes via Google Routes, and
 * persists the result.
 *
 * Run: npx convex run actions/curatedGeometry:generateForRoute '{"routeId":"brp-nc"}'
 */
export const generateForRoute = internalAction({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }): Promise<GenerateForRouteResult> => {
    const route = await ctx.runQuery(internal.curatedGeometry.getRouteForGeneration, { routeId })
    if (!route) {
      return {
        routeId,
        name: '',
        state: '',
        geometryStatus: 'failed',
        error: `Route not found: ${routeId}`,
      }
    }
    // Skip already-processed routes (idempotent)
    if (route.geometryStatus === 'generated') {
      return {
        routeId: route.routeId,
        name: route.name,
        state: route.state,
        geometryStatus: 'generated',
      }
    }

    try {
      const geo = await geocodeRouteGeometry(
        route.name,
        route.state,
        route.highwayNumber,
        {
          neLat: route.boundsNeLat,
          neLng: route.boundsNeLng,
          swLat: route.boundsSwLat,
          swLng: route.boundsSwLng,
        },
        { lat: route.centroidLat, lng: route.centroidLng },
      )
      if (geo) {
        await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
          id: route.id,
          routeId: route.routeId,
          routeGeometry: {
            format: 'polyline',
            encoding: 'google_encoded_polyline',
            precision: 5,
            value: geo.value,
          },
          geometryStatus: 'generated',
        })
        return {
          routeId: route.routeId,
          name: route.name,
          state: route.state,
          geometryStatus: 'generated',
          coordCount: geo.coordCount,
        }
      } else {
        await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
          id: route.id,
          routeId: route.routeId,
          geometryStatus: 'unresolved',
        })
        return {
          routeId: route.routeId,
          name: route.name,
          state: route.state,
          geometryStatus: 'unresolved',
        }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
        id: route.id,
        routeId: route.routeId,
        geometryStatus: 'failed',
      })
      return {
        routeId: route.routeId,
        name: route.name,
        state: route.state,
        geometryStatus: 'failed',
        error: errorMsg,
      }
    }
  },
})

/**
 * Internal action: backfill geometry one route at a time, rate-limited
 * (Nominatim usage policy: ≤1 req/s). `sample` caps the number processed this run;
 * `cursor` resumes a prior run. Returns a per-route report for human review
 * BEFORE the full run.
 *
 * Run: npx convex run actions/curatedGeometry:backfill '{"sample":25}'
 */
export const backfill = internalAction({
  args: {
    sample: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, { sample, cursor, batchSize }): Promise<BackfillReport> => {
    const target = sample ?? Number.POSITIVE_INFINITY
    const pageSize = batchSize ?? 25
    let processed = 0
    let generated = 0
    let unresolved = 0
    let failed = 0
    const throttled = false
    const perRoute: Array<Record<string, unknown>> = []

    let curCursor: string | null = cursor ?? null
    let isDone = false

    while (processed < target && !isDone) {
      const remaining = target === Number.POSITIVE_INFINITY ? pageSize : target - processed
      const fetchN = Math.max(1, Math.min(pageSize, remaining))
      const page: BackfillPage = await ctx.runQuery(
        internal.curatedGeometry.listForGeometryBackfill,
        {
          cursor: curCursor,
          batchSize: fetchN,
        },
      )

      for (const route of page.routes) {
        if (processed >= target) break
        processed++
        try {
          const geo = await geocodeRouteGeometry(
            route.name,
            route.state,
            route.highwayNumber,
            {
              neLat: route.boundsNeLat,
              neLng: route.boundsNeLng,
              swLat: route.boundsSwLat,
              swLng: route.boundsSwLng,
            },
            { lat: route.centroidLat, lng: route.centroidLng },
          )
          if (geo) {
            await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
              id: route.id,
              routeId: route.routeId,
              routeGeometry: {
                format: 'polyline',
                encoding: 'google_encoded_polyline',
                precision: 5,
                value: geo.value,
              },
              geometryStatus: 'generated',
            })
            generated++
            perRoute.push({
              routeId: route.routeId,
              name: route.name,
              state: route.state,
              status: 'generated',
              coordCount: geo.coordCount,
            })
          } else {
            await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
              id: route.id,
              routeId: route.routeId,
              geometryStatus: 'unresolved',
            })
            unresolved++
            perRoute.push({
              routeId: route.routeId,
              name: route.name,
              state: route.state,
              status: 'unresolved',
            })
          }
        } catch (e) {
          // Google Routes API doesn't throttle like Overpass, but network errors
          // or transient failures can still happen. Mark as 'failed' so the row
          // is NOT re-queued (avoid infinite retry loops). Use clearGeometry
          // + re-run to retry failed rows.
          await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
            id: route.id,
            routeId: route.routeId,
            geometryStatus: 'failed',
          })
          failed++
          perRoute.push({
            routeId: route.routeId,
            name: route.name,
            state: route.state,
            status: 'failed',
            error: e instanceof Error ? e.message : String(e),
          })
        }
      }

      curCursor = page.continueCursor
      isDone = page.isDone
    }

    return {
      processed,
      generated,
      unresolved,
      failed,
      throttled,
      resolveRate: processed > 0 ? generated / processed : 0,
      continueCursor: curCursor,
      isDone,
      perRoute,
    }
  },
})

/**
 * DATA-011 sample-gate helper: reset up to `count` already-processed
 * curated routes (geometryStatus set) to unprocessed state so the sample
 * backfill has exactly that many rows to process. Clears geometryStatus on the
 * route doc and deletes the corresponding side-table geometry row.
 *
 * Only rows with a geometryStatus ('generated', 'unresolved', or 'failed') are
 * reclaimed; unprocessed rows (geometryStatus absent) are left untouched. Call
 * before `--sample=25` when the dev deployment no longer has 25 unprocessed rows.
 *
 * Run: npx convex run actions/curatedGeometry:clearGeometryStatusForSample '{"count":25}'
 */
type ResetPage = {
  rows: Array<{ id: import('../_generated/dataModel').Id<'curated_routes'>; routeId: string }>
  continueCursor: string
  isDone: boolean
}

export const clearGeometryStatusForSample = internalAction({
  args: { count: v.number() },
  handler: async (ctx, { count }): Promise<{ cleared: number }> => {
    let cursor: string | null = null
    let isDone = false
    const ids: Array<{
      id: import('../_generated/dataModel').Id<'curated_routes'>
      routeId: string
    }> = []

    // Scan ALL routes (not just unprocessed) so we can reset already-processed ones
    while (!isDone && ids.length < count) {
      const page: ResetPage = await ctx.runQuery(internal.curatedGeometry.listAllRoutesForReset, {
        cursor,
        batchSize: 100,
      })
      for (const r of page.rows) {
        if (ids.length >= count) break
        ids.push({ id: r.id, routeId: r.routeId })
      }
      cursor = page.continueCursor
      isDone = page.isDone
    }

    for (const { id } of ids) {
      await ctx.runMutation(internal.curatedGeometry.clearGeometry, { id })
    }

    return { cleared: ids.length }
  },
})
