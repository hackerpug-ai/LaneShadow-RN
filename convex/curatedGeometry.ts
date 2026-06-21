/**
 * DATA-011: curated route geometry backfill (name-anchored).
 *
 * Generates a real per-route LineString for each curated route by geocoding its
 * name+state against Nominatim (`polygon_geojson=1`, keyless/free) and encoding the
 * returned road geometry as a `@mapbox/polyline` string. Routes whose name does not
 * resolve to a single OSM way are marked `unresolved` (NO fabricated line — Supreme Rule).
 *
 * Architecture (per SPRINT-RUN-STATUS fix): this is an INTERNAL ACTION (admin-auth via
 * `npx convex run`), NOT an external ConvexHttpClient script calling an internal mutation.
 * The action can `fetch` Nominatim AND call internal query/mutation in the same file.
 * Default Convex runtime (no `use node`) so query/mutation can co-locate with the action.
 *
 * Run the sample for human review:
 *   npx convex run curatedGeometry:backfill '{"sample":25}'
 * Run the full backfill (one-time, ~5.6k × 1.1s ≈ 1.7h; cursored — loop the CLI on
 * the returned continueCursor, or raise sample):
 *   npx convex run curatedGeometry:backfill '{"sample":250,"cursor":"<continueCursor>"}'
 */

import polyline from '@mapbox/polyline'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, internalQuery } from './_generated/server'

const GEOMETRY_VALUE = v.object({
  format: v.literal('polyline'),
  encoding: v.string(),
  precision: v.number(),
  value: v.string(),
})

const GEOMETRY_STATUS = v.union(
  v.literal('generated'),
  v.literal('unresolved'),
  v.literal('failed'),
)

// Explicit types break the Convex self-reference inference cycle (TS7022/7023):
// `backfill` references `internal.curatedGeometry.*` (same module), so its handler
// return type must be annotated rather than inferred.
type BackfillRouteRow = {
  id: import('./_generated/dataModel').Id<'curated_routes'>
  routeId: string
  name: string
  state: string
  highwayNumber: string | null
  centroidLat: number
  centroidLng: number
  boundsNeLat: number
  boundsNeLng: number
  boundsSwLat: number
  boundsSwLng: number
  geometryStatus: 'generated' | 'unresolved' | 'failed' | null
}

type BackfillPage = {
  routes: BackfillRouteRow[]
  continueCursor: string
  isDone: boolean
}

type BackfillReport = {
  processed: number
  generated: number
  unresolved: number
  failed: number
  resolveRate: number
  continueCursor: string | null
  isDone: boolean
  perRoute: Array<Record<string, unknown>>
}

/**
 * Internal query: one page of curated routes (id + the fields the geocoder needs).
 * Uses the real `.paginate()` API so the cursor is a string|null (fixes the prior
 * "invalid type: map" cursor bug).
 */
export const listForGeometryBackfill = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.number(),
  },
  handler: async (ctx, { cursor, batchSize }): Promise<BackfillPage> => {
    // Resumable + idempotent: only ever return rows that have NOT been processed yet
    // (geometryStatus unset). Re-running the backfill from cursor=null thus skips every
    // already-generated/unresolved row and continues where a prior (possibly aborted)
    // run left off — no re-geocoding, no lost-cursor problem.
    const page = await ctx.db
      .query('curated_routes')
      .filter((q) => q.eq(q.field('geometryStatus'), undefined))
      .paginate({ cursor, numItems: batchSize })
    return {
      routes: page.page.map((r) => ({
        id: r._id,
        routeId: r.routeId,
        name: r.name,
        state: r.state,
        highwayNumber: r.highwayNumber ?? null,
        centroidLat: r.centroidLat,
        centroidLng: r.centroidLng,
        boundsNeLat: r.boundsNeLat,
        boundsNeLng: r.boundsNeLng,
        boundsSwLat: r.boundsSwLat,
        boundsSwLng: r.boundsSwLng,
        geometryStatus: r.geometryStatus ?? null,
      })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

/**
 * Internal mutation: patch one route's generated geometry + status.
 */
export const patchRouteGeometry = internalMutation({
  args: {
    id: v.id('curated_routes'),
    routeGeometry: v.optional(GEOMETRY_VALUE),
    geometryStatus: GEOMETRY_STATUS,
  },
  handler: async (ctx, { id, routeGeometry, geometryStatus }) => {
    const patch: Record<string, unknown> = { geometryStatus }
    if (routeGeometry) patch.routeGeometry = routeGeometry
    await ctx.db.patch(id, patch)
  },
})

/**
 * Internal mutation: clear a route's geometry (remove routeGeometry + unset geometryStatus)
 * so it falls back to the centroid AND is re-queued for the resumable backfill. Used to
 * reset QA-failing rows (the wrong same-name-road matches the QA caught).
 */
export const clearGeometry = internalMutation({
  args: { id: v.id('curated_routes') },
  handler: async (ctx, { id }) => {
    await ctx.db.patch(id, { geometryStatus: undefined, routeGeometry: undefined })
  },
})

type GeocodeResult = { value: string; coordCount: number }
type Bounds = { neLat: number; neLng: number; swLat: number; swLng: number }

const R_MI = 3958.7613
function haversineMi(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R_MI * Math.asin(Math.min(1, Math.sqrt(s)))
}

/**
 * One Nominatim lookup → decoded [lat,lng] coords. `viewbox` + `bounded=1` constrain the
 * result to the route's own area so a same-named road elsewhere can't match (the precision
 * bug the QA caught). Sleeps 1.1s BEFORE the call (≤1 req/s per Nominatim policy).
 */
async function fetchLineString(query: string, viewbox: string): Promise<[number, number][] | null> {
  await new Promise((r) => setTimeout(r, 1100))
  const url =
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}` +
    `&format=jsonv2&polygon_geojson=1&limit=1&countrycodes=us&bounded=1&viewbox=${viewbox}`
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'LaneShadow/1.0 (curated route geometry backfill; justin@formulist.ai)',
      'Accept-Language': 'en',
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<{ geojson?: { type: string; coordinates: unknown } }>
  if (!Array.isArray(data) || data.length === 0) return null
  const geo = data[0]?.geojson
  if (!geo) return null

  // Nominatim GeoJSON is [lng, lat]; we want [lat, lng].
  let coords: [number, number][] = []
  if (geo.type === 'LineString') {
    coords = (geo.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng])
  } else if (geo.type === 'MultiLineString') {
    coords = (geo.coordinates as [number, number][][]).flat().map(([lng, lat]) => [lat, lng])
  } else {
    return null // Point / Polygon — not a drivable line
  }
  if (coords.length < 2) return null
  return coords
}

/**
 * Build an ordered, de-duped list of Nominatim query candidates for a curated route.
 * Many curated names carry nicknames ("Route 86 - Ride the Eagle"), ranges ("HWY 160
 * from Alton to Donaphin"), or county qualifiers that block a single-way match — so we
 * try the raw name, a cleaned name, and an extracted highway designator in priority order.
 */
function buildGeocodeCandidates(
  name: string,
  state: string,
  highwayNumber?: string | null,
): string[] {
  const candidates: string[] = []
  const add = (q: string) => {
    const t = q.trim().replace(/\s+/g, ' ')
    if (t && !candidates.includes(t)) candidates.push(t)
  }

  add(`${name}, ${state}`)

  const cleaned = name
    .replace(/\s+-\s+.*$/, '') // strip " - <nickname/descriptor>"
    .replace(/\s+from\s+.*$/i, '') // strip " from X to Y"
    .replace(/\s+between\s+.*$/i, '') // strip " between X and Y"
    .replace(/^the\s+/i, '')
    .trim()
  if (cleaned && cleaned !== name) add(`${cleaned}, ${state}`)

  const hw = cleaned.match(
    /\b(?:Route|Highway|Hwy|HWY|US|SR|MO|State Road|County Road|CR)\s*-?\s*([A-Za-z0-9]+)\b/,
  )
  if (hw) {
    add(`${state} Route ${hw[1]}`)
    add(`Highway ${hw[1]}, ${state}`)
  }
  if (highwayNumber) {
    add(`${state} Route ${highwayNumber}`)
    add(`Highway ${highwayNumber}, ${state}`)
  }
  return candidates.slice(0, 4) // cap attempts per route
}

const MAX_CENTROID_MI = 40 // reject a match whose midpoint is farther than this from the route centroid
const MIN_SPAN_MI = 0.2 // reject degenerate point-like geometry

/** Nominatim viewbox = "x1,y1,x2,y2" (lng,lat of two opposite corners) + ~0.15° margin. */
function buildViewbox(b: Bounds): string {
  const m = 0.15
  return `${b.swLng - m},${b.swLat - m},${b.neLng + m},${b.neLat + m}`
}

/**
 * Geocode a curated route within its OWN area (viewbox+bounded) and VALIDATE the result
 * before accepting it: the midpoint must be within MAX_CENTROID_MI of the route centroid
 * and the line must span ≥ MIN_SPAN_MI. This bakes the QA into the persist decision — a
 * same-named road elsewhere or a degenerate point can never be saved. Returns null → `unresolved`.
 */
async function geocodeRouteGeometry(
  name: string,
  state: string,
  highwayNumber: string | null,
  bounds: Bounds,
  centroidLat: number,
  centroidLng: number,
): Promise<GeocodeResult | null> {
  const viewbox = buildViewbox(bounds)
  for (const q of buildGeocodeCandidates(name, state, highwayNumber)) {
    const coords = await fetchLineString(q, viewbox)
    if (!coords) continue
    const mid = coords[Math.floor(coords.length / 2)]
    if (haversineMi(mid[0], mid[1], centroidLat, centroidLng) > MAX_CENTROID_MI) continue // wrong location
    let span = 0
    for (let i = 1; i < coords.length; i++) {
      span += haversineMi(coords[i - 1][0], coords[i - 1][1], coords[i][0], coords[i][1])
    }
    if (span < MIN_SPAN_MI) continue // degenerate / point-like
    return { value: polyline.encode(coords), coordCount: coords.length }
  }
  return null
}

/**
 * Internal action: backfill geometry one route at a time, rate-limited to ≤1 req/s
 * (Nominatim usage policy). `sample` caps the number processed this run; `cursor`
 * resumes a prior run. Returns a per-route report for human review BEFORE the full run.
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
    const perRoute: Array<Record<string, unknown>> = []

    let curCursor: string | null = cursor ?? null
    let isDone = false

    while (processed < target && !isDone) {
      const remaining = target === Number.POSITIVE_INFINITY ? pageSize : target - processed
      const fetchN = Math.max(1, Math.min(pageSize, remaining))
      const page = await ctx.runQuery(internal.curatedGeometry.listForGeometryBackfill, {
        cursor: curCursor,
        batchSize: fetchN,
      })

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
            route.centroidLat,
            route.centroidLng,
          )
          if (geo) {
            await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
              id: route.id,
              routeGeometry: {
                format: 'polyline',
                encoding: 'polyline',
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
          await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
            id: route.id,
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
        // Rate-limiting is handled per HTTP call inside fetchLineString (≤1 req/s),
        // covering every candidate attempt — no extra per-route sleep needed.
      }

      curCursor = page.continueCursor
      isDone = page.isDone
    }

    return {
      processed,
      generated,
      unresolved,
      failed,
      resolveRate: processed > 0 ? generated / processed : 0,
      continueCursor: curCursor,
      isDone,
      perRoute,
    }
  },
})
