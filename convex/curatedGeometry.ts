/**
 * DATA-011: curated route geometry — queries, mutations, and side-table helpers.
 *
 * The generation actions (generateForRoute, backfill) live in
 * `convex/actions/curatedGeometry.ts` (uses `'use node'` to import the Google Routes
 * provider). This file contains only the data-access layer that both the actions
 * and other modules (discoverCuratedRoutes, curatedGeometryQa) share.
 *
 * Architecture: generated geometry lives in the `curated_route_geometry` SIDE TABLE
 * (keyed by routeId) so the browse/scoring queries that scan many curated_routes docs
 * stay under Convex's 16MB single-execution read limit. Only the small `geometryStatus`
 * field stays on the route doc itself.
 */

import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, internalQuery } from './_generated/server'

// ---------------------------------------------------------------------------
// Validators (shared with actions/curatedGeometry.ts via re-export)
// ---------------------------------------------------------------------------

export const GEOMETRY_VALUE = v.object({
  format: v.union(v.literal('polyline'), v.literal('multipolyline')),
  encoding: v.string(),
  precision: v.number(),
  value: v.optional(v.string()), // single-line form (Google Routes overview)
  segments: v.optional(v.array(v.string())), // multipolyline form (legacy Overpass)
})

export const GEOMETRY_STATUS = v.union(
  v.literal('generated'),
  v.literal('unresolved'),
  v.literal('failed'),
  v.literal('review'),
)

export const VERIFICATION_VALIDATOR = v.object({
  routeId: v.string(),
  verdict: v.union(v.literal('pass'), v.literal('review')),
  failedCondition: v.optional(
    v.union(v.literal('ratio'), v.literal('anchors'), v.literal('degenerate')),
  ),
  provenance: v.optional(v.string()),
  geometry: v.optional(v.string()),
  geometryStatus: v.union(v.literal('generated'), v.literal('review')),
  anchorCount: v.number(),
  anchors: v.array(
    v.object({
      lat: v.number(),
      lng: v.number(),
      formatted: v.string(),
      distanceFromCentroid: v.number(),
    }),
  ),
  pointCount: v.number(),
  degenerate: v.boolean(),
  ratio: v.union(v.number(), v.null()),
  claimedMiles: v.union(v.number(), v.null()),
  routedMiles: v.number(),
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BackfillRouteRow = {
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
  geometryStatus: 'generated' | 'unresolved' | 'failed' | 'review' | null
}

export type BackfillPage = {
  routes: BackfillRouteRow[]
  continueCursor: string
  isDone: boolean
}

export type BackfillReport = {
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

export type GenerateForRouteResult = {
  routeId: string
  name: string
  state: string
  geometryStatus: 'generated' | 'unresolved' | 'failed' | 'review'
  coordCount?: number
  error?: string
}

// ---------------------------------------------------------------------------
// State abbreviation helper (shared with actions/curatedGeometry.ts)
// ---------------------------------------------------------------------------

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

export function stateAbbr(state: string): string | null {
  const s = state.replace(/-/g, ' ').trim() // catalog uses "New-York", "North-Carolina"
  return STATE_ABBR[s] ?? (s.length === 2 ? s.toUpperCase() : null)
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

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
    //
    // CRITICAL: In Convex, neither `q.eq(q.field('geometryStatus'), undefined)` nor
    // `q.eq(q.field('geometryStatus'), null)` reliably matches absent optional fields.
    // The working pattern is to exclude all known values with q.neq, which leaves only
    // unprocessed (absent) rows.
    //
    // ORDERING: Scan via the `by_composite_score` index (desc) so the backfill always
    // processes the HIGHEST-SCORED unprocessed routes first. This makes `--top=N` and
    // `--sample=N` honor "top-N by composite_score" semantics. The `.filter()`
    // post-reads and prunes the processed rows (generated/unresolved/failed); the index
    // only controls scan direction. Same index+filter+paginate pattern as
    // `listAllRoutesForReset` below.
    const page = await ctx.db
      .query('curated_routes')
      .withIndex('by_composite_score')
      .order('desc')
      .filter((q) =>
        q.and(
          q.neq(q.field('geometryStatus'), 'generated'),
          q.neq(q.field('geometryStatus'), 'unresolved'),
          q.neq(q.field('geometryStatus'), 'failed'),
        ),
      )
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
 * Internal query: list curated routes that have already been processed
 * (geometryStatus is set) so the sample-gate reset can reclaim them for
 * re-processing. Unprocessed rows (geometryStatus absent) are left untouched.
 * Returns only {id, routeId} to keep reads small. Paginated via the
 * by_composite_score index.
 */
export const listAllRoutesForReset = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.number(),
  },
  handler: async (ctx, { cursor, batchSize }) => {
    const page = await ctx.db
      .query('curated_routes')
      .withIndex('by_composite_score')
      .order('desc')
      .paginate({ cursor, numItems: batchSize })
    return {
      rows: page.page
        .filter((r) => r.geometryStatus !== undefined && r.geometryStatus !== null)
        .map((r) => ({ id: r._id, routeId: r.routeId })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
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

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/**
 * Upsert one route's geometry into the curated_route_geometry SIDE TABLE (keyed by
 * routeId). The large geometry never touches the curated_routes doc — only the
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
 * resumable backfill. Used to reset QA-failing rows.
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

// ---------------------------------------------------------------------------
// VER-01 gate persistence + riderReady seam
// ---------------------------------------------------------------------------

export async function computeRiderReadyFromDoc(
  doc: {
    routeId: string
    name: string
    compositeScore: number
    lengthMiles: number
    rideWorthiness?: {
      verdict: 'ride' | 'marginal' | 'not_a_ride'
    } | null
    retiredAt?: number | null
    duplicateOf?: string | null
    quarantine?: { reason: string } | null
  },
  verification: {
    verdict: 'pass' | 'review'
    geometryStatus: 'generated' | 'review'
  } | null,
): Promise<boolean> {
  const gatePass = verification?.verdict === 'pass' && verification.geometryStatus === 'generated'
  const rideVerdict = doc.rideWorthiness?.verdict
  const rideWorthinessOk =
    rideVerdict === 'ride' || rideVerdict === 'marginal' || rideVerdict === undefined

  return (
    gatePass &&
    doc.name.length > 0 &&
    doc.compositeScore >= 50 &&
    doc.lengthMiles > 0 &&
    rideWorthinessOk &&
    doc.retiredAt == null &&
    doc.duplicateOf == null &&
    doc.quarantine == null
  )
}

async function recomputeRiderReady(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  id: import('./_generated/dataModel').Id<'curated_routes'>,
): Promise<void> {
  const doc = await ctx.db.get(id)
  if (!doc) return

  const geomRow = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
    .first()

  const riderReady = await computeRiderReadyFromDoc(doc, geomRow?.verification ?? null)
  await ctx.db.patch(id, { riderReady })
}

export const persistGeometryVerified = internalMutation({
  args: {
    id: v.id('curated_routes'),
    routeId: v.string(),
    verification: VERIFICATION_VALIDATOR,
  },
  handler: async (ctx, { id, routeId, verification }) => {
    const existing = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const provenance =
      verification.geometryStatus === 'generated' && verification.provenance === 'ai_reconstructed'
        ? ('ai_reconstructed' as const)
        : undefined

    const geomDoc = {
      routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: verification.geometry,
      provenance,
      verification,
    }

    if (existing) {
      await ctx.db.replace(existing._id, geomDoc)
    } else {
      await ctx.db.insert('curated_route_geometry', geomDoc)
    }

    await ctx.db.patch(id, {
      geometryStatus: verification.geometryStatus,
      geometryProvenance: provenance,
    })

    if (verification.geometryStatus === 'generated') {
      // S3-T3 AC-4 hook: auto-clear a zero_length quarantine when a sane routed
      // length arrives through the persist/recompute path. The quarantine was
      // set by fixLengthOutliers because lengthMiles was ≤0; now that a real
      // measured routedMiles within [1, 1000] is available, store it as truth
      // and clear the quarantine so recomputeRiderReady sees quarantine==null.
      const route = await ctx.db.get(id)
      if (
        route?.quarantine?.reason === 'zero_length' &&
        verification.routedMiles > 0 &&
        verification.routedMiles <= 1000
      ) {
        await ctx.db.patch(id, {
          quarantine: undefined,
          lengthMiles: verification.routedMiles,
        })
      }
      await recomputeRiderReady(ctx, id)
    } else {
      await ctx.db.patch(id, { riderReady: false })
    }
  },
})

export const recomputeRiderReadyForRoute = internalMutation({
  args: { id: v.id('curated_routes') },
  handler: async (ctx, { id }) => {
    await recomputeRiderReady(ctx, id)
  },
})

export const getVerificationForRoute = internalQuery({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    if (!geomRow?.verification) return null

    return {
      ...geomRow.verification,
      riderReady: route?.riderReady ?? false,
    }
  },
})

export const getRouteForReconstruct = internalQuery({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
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
      lengthMiles: doc.lengthMiles,
      centroidLat: doc.centroidLat,
      centroidLng: doc.centroidLng,
      oneLiner: doc.oneLiner,
      summary: doc.summary,
      description: doc.description,
      quarantine: doc.quarantine ?? null,
    }
  },
})

export const getRouteForReading = internalQuery({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!doc) return null
    return {
      routeId: doc.routeId,
      riderReady: doc.riderReady ?? false,
      geometryStatus: doc.geometryStatus ?? null,
      name: doc.name,
    }
  },
})

// ---------------------------------------------------------------------------
// Migration action (16MB-read fix — no external API calls, stays in default runtime)
// ---------------------------------------------------------------------------

type MigratePage = {
  rows: Array<{ id: import('./_generated/dataModel').Id<'curated_routes'>; routeId: string }>
  continueCursor: string
  isDone: boolean
}

/**
 * Internal query: page of curated_routes that STILL carry in-doc geometry (status
 * 'generated'). Returns only {id, routeId} so the migrating action stays tiny.
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
 * + idempotent (re-running skips already-moved rows).
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
