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
    const page = await ctx.db.query('curated_routes').paginate({ cursor, numItems: batchSize })
    return {
      routes: page.page.map((r) => ({
        id: r._id,
        routeId: r.routeId,
        name: r.name,
        state: r.state,
        highwayNumber: r.highwayNumber ?? null,
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

type GeocodeResult = { value: string; coordCount: number }

/**
 * One Nominatim lookup → LineString polyline. Sleeps 1.1s BEFORE the call so every
 * HTTP request (across all candidate attempts) is spaced ≥1/s per Nominatim policy.
 */
async function fetchLineString(query: string): Promise<GeocodeResult | null> {
  await new Promise((r) => setTimeout(r, 1100))
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&polygon_geojson=1&limit=1`
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

  // Nominatim GeoJSON is [lng, lat]; polyline.encode wants [lat, lng].
  let coords: [number, number][] = []
  if (geo.type === 'LineString') {
    coords = (geo.coordinates as [number, number][]).map(([lng, lat]) => [lat, lng])
  } else if (geo.type === 'MultiLineString') {
    coords = (geo.coordinates as [number, number][][]).flat().map(([lng, lat]) => [lat, lng])
  } else {
    return null // Point / Polygon — not a drivable line
  }
  if (coords.length < 2) return null
  return { value: polyline.encode(coords), coordCount: coords.length }
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

/**
 * Geocode a curated route, trying each candidate query until one yields a Line/
 * MultiLineString of ≥2 points. Returns null when none resolve (→ `unresolved`, no fake line).
 */
async function geocodeRouteGeometry(
  name: string,
  state: string,
  highwayNumber?: string | null,
): Promise<GeocodeResult | null> {
  for (const q of buildGeocodeCandidates(name, state, highwayNumber)) {
    const hit = await fetchLineString(q)
    if (hit) return hit
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
          const geo = await geocodeRouteGeometry(route.name, route.state, route.highwayNumber)
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
