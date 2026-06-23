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
  throttled: boolean
  resolveRate: number
  continueCursor: string | null
  isDone: boolean
  perRoute: Array<Record<string, unknown>>
}

type GenerateForRouteResult = {
  routeId: string
  name: string
  state: string
  geometryStatus: 'generated' | 'unresolved' | 'failed'
  coordCount?: number
  error?: string
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
 * Upsert one route's geometry into the curated_route_geometry SIDE TABLE (keyed by
 * routeId). The large MultiLineString never touches the curated_routes doc — only the
 * small geometryStatus does — so the browse/scoring queries that scan many route docs
 * stay under Convex's 16MB single-execution read limit (DATA-011 16MB-read fix).
 */
async function upsertGeometry(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  routeId: string,
  geometry: {
    format: 'polyline' | 'multipolyline'
    encoding: string
    precision: number
    value?: string
    segments?: string[]
  },
): Promise<void> {
  const existing = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
    .first()
  const row = { routeId, ...geometry }
  if (existing) {
    await ctx.db.replace(existing._id, row)
  } else {
    await ctx.db.insert('curated_route_geometry', row)
  }
}

/**
 * Internal mutation: persist one route's generated geometry to the side table + stamp the
 * small status on the route doc. The route doc itself stays lean (no geometry in-doc).
 */
export const patchRouteGeometry = internalMutation({
  args: {
    id: v.id('curated_routes'),
    routeId: v.string(),
    routeGeometry: v.optional(GEOMETRY_VALUE),
    geometryStatus: GEOMETRY_STATUS,
  },
  handler: async (ctx, { id, routeId, routeGeometry, geometryStatus }) => {
    // Only the status lives on the route doc; clear any legacy in-doc geometry.
    await ctx.db.patch(id, { geometryStatus, routeGeometry: undefined })
    if (routeGeometry) await upsertGeometry(ctx, routeId, routeGeometry)
  },
})

/**
 * Internal mutation: clear a route's geometry (delete the side-table row + unset
 * geometryStatus on the doc) so it falls back to the centroid AND is re-queued for the
 * resumable backfill. Used to reset QA-failing rows (the wrong same-name-road matches
 * the QA caught).
 */
export const clearGeometry = internalMutation({
  args: { id: v.id('curated_routes') },
  handler: async (ctx, { id }) => {
    const doc = await ctx.db.get(id)
    if (doc) {
      const existing = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
        .first()
      if (existing) await ctx.db.delete(existing._id)
    }
    await ctx.db.patch(id, { geometryStatus: undefined, routeGeometry: undefined })
  },
})

type GeometryRow = {
  routeId: string
  format: 'polyline' | 'multipolyline'
  encoding: string
  precision: number
  value: string | null
  segments: string[] | null
}

/**
 * Internal query: fetch generated geometry for a small set of routeIds (the ~10 a
 * discovery actually plots) from the side table. Keeps the read off the wide
 * curated_routes scan path entirely.
 */
export const getGeometryForRoutes = internalQuery({
  args: { routeIds: v.array(v.string()) },
  handler: async (ctx, { routeIds }): Promise<GeometryRow[]> => {
    const out: GeometryRow[] = []
    for (const routeId of routeIds) {
      const row = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (row) {
        out.push({
          routeId,
          format: row.format,
          encoding: row.encoding,
          precision: row.precision,
          value: row.value ?? null,
          segments: row.segments ?? null,
        })
      }
    }
    return out
  },
})

/**
 * Internal query: fetch a single curated route by routeId for geometry generation.
 * Returns the fields needed by geocodeRouteGeometry, or null if not found.
 */
export const getRouteForGeneration = internalQuery({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }): Promise<BackfillRouteRow | null> => {
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!doc) return null
    return {
      id: doc._id,
      routeId: doc.routeId,
      name: doc.name,
      state: doc.state,
      highwayNumber: doc.highwayNumber ?? null,
      centroidLat: doc.centroidLat,
      centroidLng: doc.centroidLng,
      boundsNeLat: doc.boundsNeLat,
      boundsNeLng: doc.boundsNeLng,
      boundsSwLat: doc.boundsSwLat,
      boundsSwLng: doc.boundsSwLng,
      geometryStatus: doc.geometryStatus ?? null,
    }
  },
})

/**
 * Internal action: generate geometry for a single curated route by routeId.
 *
 * This is the per-route action that the driver script and tests call directly.
 * It reads the route, geocodes via Overpass, and persists the result.
 *
 * Run: npx convex run curatedGeometry:generateForRoute '{"routeId":"brp-nc"}'
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
        route.centroidLat,
        route.centroidLng,
      )
      if (geo) {
        await ctx.runMutation(internal.curatedGeometry.patchRouteGeometry, {
          id: route.id,
          routeId: route.routeId,
          routeGeometry: {
            format: 'multipolyline',
            encoding: 'polyline',
            precision: 5,
            segments: geo.segments,
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

type MigratePage = {
  rows: Array<{ id: import('./_generated/dataModel').Id<'curated_routes'>; routeId: string }>
  continueCursor: string
  isDone: boolean
}

/**
 * Internal query: page of curated_routes that STILL carry in-doc geometry (status
 * 'generated'). Returns only {id, routeId} so the migrating action stays tiny; the
 * per-row mutation re-reads the single doc to move its geometry. Small batchSize keeps
 * each page read (full docs incl. geometry) well under the 16MB limit.
 */
export const listGeometryInDoc = internalQuery({
  args: { cursor: v.union(v.string(), v.null()), batchSize: v.number() },
  handler: async (ctx, { cursor, batchSize }): Promise<MigratePage> => {
    const page = await ctx.db
      .query('curated_routes')
      .filter((q) => q.eq(q.field('geometryStatus'), 'generated'))
      .paginate({ cursor, numItems: batchSize })
    return {
      rows: page.page.map((r) => ({ id: r._id, routeId: r.routeId })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

/**
 * Internal mutation: move ONE route's in-doc geometry to the side table + clear it from
 * the doc (keeping geometryStatus). Idempotent — a row already migrated (no in-doc
 * geometry) is a no-op returning false.
 */
export const moveGeometryToSideTable = internalMutation({
  args: { id: v.id('curated_routes') },
  handler: async (ctx, { id }): Promise<boolean> => {
    const doc = await ctx.db.get(id)
    if (!doc?.routeGeometry) return false
    await upsertGeometry(ctx, doc.routeId, doc.routeGeometry)
    await ctx.db.patch(id, { routeGeometry: undefined }) // keep geometryStatus
    return true
  },
})

type MigrateReport = { scanned: number; moved: number; skipped: number }

/**
 * DATA-011 16MB-read fix migration: copy every in-doc geometry into the side table and
 * clear it from the route doc, so the wide browse/scoring scans read lean docs. Resumable
 * + idempotent (re-running skips already-moved rows). This is the action that actually
 * unblocks the 16MB read error.
 *   npx convex run curatedGeometry:migrateGeometryToSideTable '{}'
 */
export const migrateGeometryToSideTable = internalAction({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, { batchSize }): Promise<MigrateReport> => {
    const size = batchSize ?? 50
    let cursor: string | null = null
    let isDone = false
    let scanned = 0
    let moved = 0
    let skipped = 0
    while (!isDone) {
      const page: MigratePage = await ctx.runQuery(internal.curatedGeometry.listGeometryInDoc, {
        cursor,
        batchSize: size,
      })
      for (const r of page.rows) {
        scanned++
        const ok = await ctx.runMutation(internal.curatedGeometry.moveGeometryToSideTable, {
          id: r.id,
        })
        if (ok) moved++
        else skipped++
      }
      cursor = page.continueCursor
      isDone = page.isDone
    }
    return { scanned, moved, skipped }
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
  'District of Columbia': 'DC',
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

class OverpassThrottled extends Error {
  constructor() {
    super('OVERPASS_THROTTLED')
    this.name = 'OverpassThrottled'
  }
}

/**
 * Query Overpass for ALL highway ways matching a ref/name within the bbox → [lat,lng][][]
 * (one entry per OSM way). Sleeps 2s before the call (polite). Retries on throttle (429/5xx/
 * network) with backoff; if STILL throttled after retries, throws OverpassThrottled so the
 * caller can leave the row unprocessed (re-queued) rather than mismark it as unresolved.
 * Returns null only for a genuine empty/no-match response.
 */
async function fetchOverpassWays(
  filter: { key: 'ref' | 'name'; value: string },
  bbox: string,
): Promise<[number, number][][] | null> {
  const clause =
    filter.key === 'ref'
      ? `["ref"="${filter.value.replace(/"/g, '')}"]`
      : `["name"~"${filter.value.replace(/[\\"]/g, '')}",i]`
  const q = `[out:json][timeout:25];way["highway"]${clause}(${bbox});out geom;`
  const backoffs = [2000, 8000, 20000] // first attempt waits 2s (polite); retries back off
  for (let attempt = 0; attempt < backoffs.length; attempt++) {
    await new Promise((r) => setTimeout(r, backoffs[attempt]))
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
      continue // network error → retry
    }
    if (res.status === 429 || res.status === 504 || res.status >= 500) continue // throttled → retry
    if (!res.ok) return null // other client error → genuine miss
    const data = (await res.json()) as {
      elements?: Array<{ type: string; geometry?: Array<{ lat: number; lon: number }> }>
    }
    const ways = (data.elements ?? [])
      .filter((e) => e.type === 'way' && Array.isArray(e.geometry) && e.geometry.length > 1)
      .map((e) => (e.geometry ?? []).map((p) => [p.lat, p.lon] as [number, number]))
    return ways.length ? ways : null
  }
  throw new OverpassThrottled() // exhausted retries
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
    let throttled = false
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
              routeId: route.routeId,
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
          if (e instanceof Error && e.message === 'OVERPASS_THROTTLED') {
            // Persistent throttle: do NOT mark the row — leave it unprocessed (re-queued)
            // and stop this run cleanly so the resumable driver retries it later.
            processed--
            throttled = true
            break
          }
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
        // Rate-limiting is handled per HTTP call inside fetchOverpassWays (with backoff).
      }

      if (throttled) break
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
