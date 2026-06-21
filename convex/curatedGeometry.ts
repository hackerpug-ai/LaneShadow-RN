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
  format: v.union(v.literal('polyline'), v.literal('multipolyline')),
  encoding: v.string(),
  precision: v.number(),
  value: v.optional(v.string()), // single-line form
  segments: v.optional(v.array(v.string())), // multipolyline form (Overpass full route)
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

type GeocodeResult = { segments: string[]; coordCount: number }
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

const MAX_CENTROID_MI = 40 // drop a way whose midpoint is farther than this from the route centroid
const MIN_SPAN_MI = 0.5 // a real route covers at least this many miles total
const MAX_SEGMENTS = 400 // cap stored segments (Convex doc-size guard); keep the longest

const STATE_ABBR: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS',
  Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA',
  Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT',
  Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV',
  Wisconsin: 'WI', Wyoming: 'WY', 'District of Columbia': 'DC',
}
function stateAbbr(state: string): string | null {
  const s = state.replace(/-/g, ' ').trim() // catalog uses "New-York", "North-Carolina"
  return STATE_ABBR[s] ?? (s.length === 2 ? s.toUpperCase() : null)
}

const segLen = (w: [number, number][]): number => {
  let t = 0
  for (let i = 1; i < w.length; i++) t += haversineMi(w[i - 1][0], w[i - 1][1], w[i][0], w[i][1])
  return t
}

/**
 * Ordered Overpass filter candidates (OSM `ref` or `name`) for a curated route. We extract
 * highway designators (US 50, MO 47, lettered Hwy N, …) and fall back to a name match.
 */
function buildOverpassFilters(
  name: string,
  state: string,
  highwayNumber: string | null,
): Array<{ key: 'ref' | 'name'; value: string }> {
  const out: Array<{ key: 'ref' | 'name'; value: string }> = []
  const add = (key: 'ref' | 'name', value: string) => {
    const v2 = value.trim().replace(/\s+/g, ' ')
    if (v2 && !out.some((o) => o.key === key && o.value === v2)) out.push({ key, value: v2 })
  }
  const abbr = stateAbbr(state)
  const cleaned = name
    .replace(/\s+-\s+.*$/, '')
    .replace(/\s+from\s+.*$/i, '')
    .replace(/\s+between\s+.*$/i, '')
    .replace(/^the\s+/i, '')
    .trim()

  let m = name.match(/\b(?:US|U\.S\.)\s*-?\s*(\d+)\b/i)
  if (m) add('ref', `US ${m[1]}`)
  if (abbr) {
    m = name.match(new RegExp(`\\b${abbr}\\s*-?\\s*(\\d+)\\b`, 'i'))
    if (m) add('ref', `${abbr} ${m[1]}`)
  }
  m = cleaned.match(/\b(?:State Route|State Highway|Route|Rte|Rt|Hwy|Highway|SR)\s*-?\s*(\d+)\b/i)
  if (m && abbr) add('ref', `${abbr} ${m[1]}`)
  m = cleaned.match(/\b(?:Route|Rte|Rt|Hwy|Highway)\s+([A-Z]{1,2})\b/)
  if (m) {
    if (abbr) add('ref', `${abbr} ${m[1]}`)
    add('ref', m[1])
  }
  if (highwayNumber) {
    if (abbr) add('ref', `${abbr} ${highwayNumber}`)
    add('ref', `US ${highwayNumber}`)
    add('ref', highwayNumber)
  }
  add('name', cleaned)
  return out.slice(0, 4)
}

/**
 * Query Overpass for ALL highway ways matching a ref/name within the bbox → [lat,lng][][]
 * (one entry per OSM way). Sleeps 2s BEFORE the call (polite: ≤1 req/2s on the public API).
 */
async function fetchOverpassWays(
  filter: { key: 'ref' | 'name'; value: string },
  bbox: string,
): Promise<[number, number][][] | null> {
  await new Promise((r) => setTimeout(r, 2000))
  const clause =
    filter.key === 'ref'
      ? `["ref"="${filter.value.replace(/"/g, '')}"]`
      : `["name"~"${filter.value.replace(/[\\"]/g, '')}",i]`
  const q = `[out:json][timeout:25];way["highway"]${clause}(${bbox});out geom;`
  let res: Response
  try {
    res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'LaneShadow/1.0 (curated route geometry; justin@formulist.ai)',
      },
      body: `data=${encodeURIComponent(q)}`,
    })
  } catch {
    return null
  }
  if (!res.ok) return null
  const data = (await res.json()) as {
    elements?: Array<{ type: string; geometry?: Array<{ lat: number; lon: number }> }>
  }
  const ways = (data.elements ?? [])
    .filter((e) => e.type === 'way' && Array.isArray(e.geometry) && e.geometry.length > 1)
    .map((e) => (e.geometry ?? []).map((p) => [p.lat, p.lon] as [number, number]))
  return ways.length ? ways : null
}

/**
 * Geocode a curated route via Overpass within its OWN bbox, returning the FULL route as a
 * MultiLineString (every matching OSM way as a segment). VALIDATES before accepting: drop
 * ways whose midpoint is >MAX_CENTROID_MI from the centroid, require total span ≥ MIN_SPAN_MI,
 * cap to MAX_SEGMENTS. A wrong/empty match can't be saved (→ null → `unresolved`).
 */
async function geocodeRouteGeometry(
  name: string,
  state: string,
  highwayNumber: string | null,
  bounds: Bounds,
  centroidLat: number,
  centroidLng: number,
): Promise<GeocodeResult | null> {
  // Overpass bbox = S,W,N,E (+ ~0.1° margin).
  const bbox = `${bounds.swLat - 0.1},${bounds.swLng - 0.1},${bounds.neLat + 0.1},${bounds.neLng + 0.1}`
  for (const filter of buildOverpassFilters(name, state, highwayNumber)) {
    const ways = await fetchOverpassWays(filter, bbox)
    if (!ways) continue
    const near = ways.filter((w) => {
      const mid = w[Math.floor(w.length / 2)]
      return haversineMi(mid[0], mid[1], centroidLat, centroidLng) <= MAX_CENTROID_MI
    })
    if (!near.length) continue
    const totalSpan = near.reduce((s, w) => s + segLen(w), 0)
    if (totalSpan < MIN_SPAN_MI) continue
    near.sort((a, b) => segLen(b) - segLen(a))
    const kept = near.slice(0, MAX_SEGMENTS)
    return {
      segments: kept.map((w) => polyline.encode(w)),
      coordCount: kept.reduce((s, w) => s + w.length, 0),
    }
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
                format: 'multipolyline',
                encoding: 'polyline',
                precision: 5,
                segments: geo.segments,
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
