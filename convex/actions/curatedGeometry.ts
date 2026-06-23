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

/**
 * Geocode "{name}, {state}" via Nominatim. Returns the centroid + bounding box,
 * or null if no result. Respects Nominatim usage policy (≤1 req/s, User-Agent).
 */
async function geocodeViaNominatim(name: string, state: string): Promise<NominatimResult> {
  const abbr = stateAbbr(state)
  const query = `${name}, ${abbr ?? state.replace(/-/g, ' ')}`
  const url =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=0`

  // Nominatim usage policy: ≤1 req/s, identify with User-Agent
  await new Promise((r) => setTimeout(r, 1100))

  let res: Response
  try {
    res = await fetch(url, {
      headers: {
        'User-Agent': 'LaneShadow/1.0 (curated route geometry; justin@formulist.ai)',
        'Accept-Language': 'en',
      },
    })
  } catch {
    return null // network error
  }
  if (!res.ok) return null

  const data = (await res.json()) as Array<{
    lat: string
    lon: string
    boundingbox?: [string, string, string, string] // [south, north, west, east]
  }>

  if (!data.length) return null

  const r = data[0]
  const bb = r.boundingbox
  return {
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    boundingbox: bb
      ? [parseFloat(bb[0]), parseFloat(bb[1]), parseFloat(bb[2]), parseFloat(bb[3])]
      : undefined,
  }
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
  _highwayNumber: string | null,
  bounds: Bounds,
): Promise<GeocodeRouteResult | null> {
  // Step 1: Geocode "{name}, {state}" via Nominatim
  const geo = await geocodeViaNominatim(name, state)

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
      const geo = await geocodeRouteGeometry(route.name, route.state, route.highwayNumber, {
        neLat: route.boundsNeLat,
        neLng: route.boundsNeLng,
        swLat: route.boundsSwLat,
        swLng: route.boundsSwLng,
      })
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
          const geo = await geocodeRouteGeometry(route.name, route.state, route.highwayNumber, {
            neLat: route.boundsNeLat,
            neLng: route.boundsNeLng,
            swLat: route.boundsSwLat,
            swLng: route.boundsSwLng,
          })
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
 * DATA-011 test-setup helper: reset up to `count` curated routes to
 * unprocessed state so the sample backfill has exactly that many rows
 * to process. Clears geometryStatus on the route doc and deletes the
 * corresponding side-table geometry row.
 *
 * This is a TEST-SETUP action only — the production backfill action
 * (`backfill`) remains unchanged. Call before `--sample=25` to ensure
 * there are at least 25 unprocessed routes.
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
