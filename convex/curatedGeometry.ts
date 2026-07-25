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

import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server'
import { reevaluateExistingGeometry } from './curatedGeometryGate'
import { geospatial } from './geospatialIndex'
import { requireFounder, requireIdentity, requireOperator } from './guards'

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
  v.literal('retired'),
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
  geometryStatus: 'generated' | 'unresolved' | 'failed' | 'review' | 'retired' | null
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
  geometryStatus: 'generated' | 'unresolved' | 'failed' | 'review' | 'retired'
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
 * REDHAT-FIX-02: List eligible route IDs for whole-catalog classification.
 * Returns a paginated batch of routeIds that are candidates for ride-worthiness
 * classification, plus a total eligible count.
 */
export const listEligibleRouteIdsForClassification = internalQuery({
  args: {
    limit: v.number(),
    cursor: v.union(v.string(), v.null()),
  },
  handler: async (ctx, { limit, cursor }) => {
    const page = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId')
      .paginate({ cursor, numItems: Math.min(limit, 200) })

    const ids = page.page.map((r) => r.routeId)

    // To get total eligible count without scanning the whole table,
    // we use a large first-page estimate. This is approximate but
    // avoids the cost of a full table scan.
    return {
      ids,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
      totalEligible: page.isDone ? ids.length : undefined,
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

  // Scale-aware score threshold: the catalog may contain rows on the legacy
  // 0–100 scale (compositeScore > 1, pre-S3-T1 normalization) or the normalized
  // 0–1 scale (≤ 1, post-S3-T1). The read-path norm() helper
  // (curatedRoutes.ts:129) uses the same >1 discriminator. Without this, the
  // state-normalization pass (which calls recomputeRiderReadyForRoute) would
  // silently flip score-normalized rows to riderReady=false (0.88 >= 50 → false).
  const passesScoreGate =
    doc.compositeScore > 1 ? doc.compositeScore >= 50 : doc.compositeScore >= 0.5

  return (
    gatePass &&
    doc.name.length > 0 &&
    passesScoreGate &&
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

/**
 * S4-T4 / UC-VER-03: persist a stored ride-worthiness verdict as at-rest evidence.
 * Verdict is never computed at read-time — this is the only write path for classifier output.
 * After patch, recompute riderReady so not_a_ride immediately withholds rider-ready.
 */
export const persistRideWorthiness = internalMutation({
  args: {
    id: v.id('curated_routes'),
    rideWorthiness: v.object({
      verdict: v.union(v.literal('ride'), v.literal('marginal'), v.literal('not_a_ride')),
      reason: v.string(),
      model: v.string(),
      classifiedAt: v.number(),
      evidenceComplete: v.boolean(),
    }),
  },
  handler: async (ctx, { id, rideWorthiness }) => {
    await ctx.db.patch(id, { rideWorthiness })
    await recomputeRiderReady(ctx, id)
  },
})

/** Load fields needed by the ride-worthiness classifier (S4-T4). */
export const getRouteForClassification = internalQuery({
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
      source: doc.source,
      lengthMiles: doc.lengthMiles,
      highwayNumber: doc.highwayNumber ?? null,
      primaryArchetype: doc.primaryArchetype,
      oneLiner: doc.oneLiner,
      summary: doc.summary,
      description: doc.description ?? null,
      geometryStatus: doc.geometryStatus ?? null,
      compositeScore: doc.compositeScore,
      rideWorthiness: doc.rideWorthiness ?? null,
      riderReady: doc.riderReady ?? false,
      retiredAt: doc.retiredAt ?? null,
    }
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

// ---------------------------------------------------------------------------
// AC-6: Pre-existing geometry re-evaluation sweep
// ---------------------------------------------------------------------------

type SweepPage = {
  rows: Array<{
    routeId: string
    verification: {
      routeId: string
      verdict: 'pass' | 'review'
      failedCondition?: 'ratio' | 'anchors' | 'degenerate'
      geometryStatus: 'generated' | 'review'
      anchorCount: number
      anchors: Array<{ lat: number; lng: number; formatted: string; distanceFromCentroid: number }>
      pointCount: number
      degenerate: boolean
      ratio: number | null
      claimedMiles: number | null
      routedMiles: number
    }
  }>
  continueCursor: string
  isDone: boolean
}

/**
 * Internal query: paginated scan of curated_route_geometry rows that HAVE a
 * verification block. Used by the pre-existing sweep to re-evaluate legacy rows
 * against the enhanced gate.
 */
export const listGeometryWithVerification = internalQuery({
  args: {
    cursor: v.union(v.string(), v.null()),
    batchSize: v.number(),
  },
  handler: async (ctx, { cursor, batchSize }): Promise<SweepPage> => {
    const page = await ctx.db
      .query('curated_route_geometry')
      .paginate({ cursor, numItems: batchSize })
    return {
      rows: page.page
        .filter((r) => r.verification !== undefined)
        .map((r) => ({
          routeId: r.routeId,
          verification: r.verification!,
        })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

/**
 * Internal mutation: flip a geometry row's verification verdict.
 * Used by the pre-existing sweep to downgrade rows that fail the enhanced gate.
 */
export const flipGeometryVerdict = internalMutation({
  args: {
    routeId: v.string(),
    verdict: v.union(v.literal('pass'), v.literal('review')),
    failedCondition: v.optional(
      v.union(v.literal('ratio'), v.literal('anchors'), v.literal('degenerate')),
    ),
  },
  handler: async (ctx, { routeId, verdict, failedCondition }) => {
    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    if (!geomRow?.verification) return false

    const geometryStatus = verdict === 'pass' ? 'generated' : 'review'
    await ctx.db.patch(geomRow._id, {
      verification: {
        ...geomRow.verification,
        verdict,
        failedCondition,
        geometryStatus,
      },
    })

    // Also update the route doc geometryStatus + riderReady
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    if (route) {
      await ctx.db.patch(route._id, { geometryStatus })
      if (geometryStatus !== 'generated') {
        await ctx.db.patch(route._id, { riderReady: false })
      } else {
        await recomputeRiderReady(ctx, route._id)
      }
    }

    return true
  },
})

type SweepReport = { scanned: number; flipped: number; unchanged: number }

/**
 * AC-6: Pre-existing geometry re-evaluation sweep.
 *
 * Scans ALL curated_route_geometry rows with a verification block and
 * re-evaluates them against the enhanced gate (including anchor-region check).
 * Rows that fail the enhanced gate are flipped to verdict='review'.
 *
 *   npx convex run curatedGeometry:reevaluatePreexistingGeometry '{}'
 */
export const reevaluatePreexistingGeometry = internalAction({
  args: { batchSize: v.optional(v.number()) },
  handler: async (ctx, { batchSize }): Promise<SweepReport> => {
    const size = batchSize ?? 50
    let cursor: string | null = null
    let isDone = false
    let scanned = 0
    let flipped = 0
    let unchanged = 0

    while (!isDone) {
      const page: SweepPage = await ctx.runQuery(
        internal.curatedGeometry.listGeometryWithVerification,
        { cursor, batchSize: size },
      )

      for (const row of page.rows) {
        scanned++
        const verification = row.verification

        // Get route to check quarantine status
        const route = await ctx.runQuery(internal.curatedGeometry.getRouteForReconstruct, {
          routeId: row.routeId,
        })

        const isQuarantined = route?.quarantine != null

        const newVerdict = reevaluateExistingGeometry({
          ratio: verification.ratio,
          pointCount: verification.pointCount,
          routedMiles: verification.routedMiles,
          anchorCount: verification.anchorCount,
          anchors: verification.anchors,
          quarantine: isQuarantined,
        })

        if (newVerdict.verdict !== verification.verdict) {
          await ctx.runMutation(internal.curatedGeometry.flipGeometryVerdict, {
            routeId: row.routeId,
            verdict: newVerdict.verdict,
            failedCondition: newVerdict.failedCondition,
          })
          flipped++
        } else {
          unchanged++
        }
      }

      cursor = page.continueCursor
      isDone = page.isDone
    }

    return { scanned, flipped, unchanged }
  },
})

// ---------------------------------------------------------------------------
// REDHAT-FIX-02: durable classifier_runs checkpoint/resume state
// (defined here, not in actions/rideWorthinessClassifier.ts, because Convex
// forbids mutations/queries inside a 'use node' module.)
// ---------------------------------------------------------------------------

/** Begin a new whole-catalog classifier run. */
export const beginClassifierRun = internalMutation({
  args: { runId: v.string(), startedAt: v.number() },
  handler: async (ctx, { runId, startedAt }) => {
    const existing = await ctx.db
      .query('classifier_runs')
      .withIndex('by_runId', (q) => q.eq('runId', runId))
      .unique()
    if (existing) return existing
    const id = await ctx.db.insert('classifier_runs', {
      runId,
      status: 'running',
      cursor: undefined,
      processedCount: 0,
      failedCount: 0,
      totalEligible: undefined,
      isDone: false,
      startedAt,
      updatedAt: startedAt,
    })
    return { _id: id, runId }
  },
})

/** Load a run by runId (for resume). */
export const getClassifierRun = internalQuery({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    return ctx.db
      .query('classifier_runs')
      .withIndex('by_runId', (q) => q.eq('runId', runId))
      .unique()
  },
})

/** Persist durable progress after each page (durable checkpoint). */
export const updateClassifierRunProgress = internalMutation({
  args: {
    runId: v.string(),
    cursor: v.union(v.string(), v.null()),
    processedCount: v.number(),
    failedCount: v.number(),
    totalEligible: v.optional(v.number()),
    isDone: v.boolean(),
  },
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query('classifier_runs')
      .withIndex('by_runId', (q) => q.eq('runId', args.runId))
      .unique()
    if (!run) return
    await ctx.db.patch(run._id, {
      cursor: args.cursor ?? undefined,
      processedCount: args.processedCount,
      failedCount: args.failedCount,
      totalEligible: args.totalEligible,
      isDone: args.isDone,
      updatedAt: Date.now(),
    })
  },
})

/** Mark a run completed with final counters derived from the persisted run. */
export const completeClassifierRun = internalMutation({
  args: {
    runId: v.string(),
    processedCount: v.number(),
    failedCount: v.number(),
    totalEligible: v.optional(v.number()),
  },
  handler: async (ctx, { runId, processedCount, failedCount, totalEligible }) => {
    const run = await ctx.db
      .query('classifier_runs')
      .withIndex('by_runId', (q) => q.eq('runId', runId))
      .unique()
    if (!run) return null
    await ctx.db.patch(run._id, {
      status: 'completed',
      isDone: true,
      processedCount,
      failedCount,
      totalEligible,
      updatedAt: Date.now(),
    })
    return { runId, status: 'completed' as const, processedCount, failedCount, totalEligible }
  },
})

// ---------------------------------------------------------------------------
// S5-T1: coverageReport, batch acceptance, low-yield escalation, fixtures
// ---------------------------------------------------------------------------

/** PRD expected-yield assumptions — comparison context ONLY, never committed targets. */
export const PRD_YIELD_ASSUMPTIONS = [
  {
    lever: 'promote',
    leverNumber: 1,
    provenance: 'scraped_promoted' as const,
    assumptionLabel: 'unproven',
    assumptionRate: null as number | null,
    escalationFloor: null as number | null,
  },
  {
    lever: 'reconstruct',
    leverNumber: 2,
    provenance: 'ai_reconstructed' as const,
    assumptionLabel: '~67%',
    assumptionRate: 0.67,
    escalationFloor: 0.4,
  },
  {
    lever: 'reroute',
    leverNumber: 3,
    provenance: 'name_routed' as const,
    assumptionLabel: '~40-55%',
    assumptionRate: 0.475,
    escalationFloor: 0.4,
  },
] as const

const POLY_41MI_S5 =
  'oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@sq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@sq@k~@uq@'

type LeverReportRow = {
  lever: string
  leverNumber: number
  provenance: string
  candidateCount: number
  passCount: number
  realizedRate: number
  passRate: number
  assumptionLabel: string
  assumptionIsTarget: boolean
  escalationFloor: number | null
}

function emptyTerminalStates() {
  return {
    recovered: 0,
    queued: 0,
    retirement_eligible: 0,
    cost_blocked: 0,
    skipped: 0,
    generated: 0,
    review: 0,
    unresolved: 0,
    failed: 0,
  }
}

function buildLeverRows(
  counts: Record<string, { candidates: number; passCount: number }>,
): LeverReportRow[] {
  return PRD_YIELD_ASSUMPTIONS.map((a) => {
    const c = counts[a.provenance] ?? { candidates: 0, passCount: 0 }
    const realizedRate = c.candidates > 0 ? c.passCount / c.candidates : 0
    return {
      lever: a.lever,
      leverNumber: a.leverNumber,
      provenance: a.provenance,
      candidateCount: c.candidates,
      passCount: c.passCount,
      realizedRate,
      passRate: realizedRate,
      assumptionLabel: a.assumptionLabel,
      assumptionIsTarget: false,
      escalationFloor: a.escalationFloor,
    }
  })
}

async function upsertBatchArtifact(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  row: {
    runId: string
    artifactKind: 'coverage_report' | 'acceptance'
    [key: string]: unknown
  },
) {
  const existing = await ctx.db
    .query('batch_acceptance_artifacts')
    .withIndex('by_runId_and_kind', (q) =>
      q.eq('runId', row.runId).eq('artifactKind', row.artifactKind),
    )
    .first()
  const now = Date.now()
  const doc = {
    ...row,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }
  if (existing) {
    await ctx.db.replace(existing._id, doc as any)
    return existing._id
  }
  return await ctx.db.insert('batch_acceptance_artifacts', doc as any)
}

/** Persist a coverage report produced by a full-batch run (internal). */
export const persistCoverageReport = internalMutation({
  args: {
    runId: v.string(),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    totalCostUSD: v.number(),
    maxCostUSD: v.optional(v.union(v.number(), v.null())),
    batchStopReason: v.optional(v.union(v.string(), v.null())),
    riderReadyCount: v.number(),
    levers: v.array(
      v.object({
        lever: v.string(),
        leverNumber: v.number(),
        provenance: v.string(),
        candidateCount: v.number(),
        passCount: v.number(),
        realizedRate: v.number(),
        passRate: v.number(),
        assumptionLabel: v.string(),
        assumptionIsTarget: v.boolean(),
        escalationFloor: v.union(v.number(), v.null()),
      }),
    ),
    terminalStates: v.any(),
    provenanceCounts: v.any(),
    pageTotals: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    await upsertBatchArtifact(ctx, {
      runId: args.runId,
      artifactKind: 'coverage_report',
      isDone: args.isDone,
      continueCursor: args.continueCursor,
      totalCostUSD: args.totalCostUSD,
      maxCostUSD: args.maxCostUSD ?? null,
      batchStopReason: args.batchStopReason ?? null,
      riderReadyCount: args.riderReadyCount,
      levers: args.levers,
      terminalStates: args.terminalStates,
      provenanceCounts: args.provenanceCounts,
      pageTotals: args.pageTotals,
      decision: null,
      acceptedAt: null,
      retirementUnlockedAt: null,
    })
    return { runId: args.runId, persisted: true }
  },
})

/**
 * Live coverage report over the catalog (optionally scoped by routeIdPrefix)
 * or the persisted report for a runId.
 */
export const coverageReport = query({
  args: {
    runId: v.optional(v.string()),
    routeIdPrefix: v.optional(v.string()),
    routeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireOperator(ctx)

    if (args.runId && !args.routeIds && !args.routeIdPrefix) {
      const persisted = await ctx.db
        .query('batch_acceptance_artifacts')
        .withIndex('by_runId_and_kind', (q) =>
          q.eq('runId', args.runId!).eq('artifactKind', 'coverage_report'),
        )
        .first()
      if (persisted) {
        return {
          runId: persisted.runId,
          source: 'persisted' as const,
          isDone: persisted.isDone ?? false,
          continueCursor: persisted.continueCursor ?? null,
          totalCostUSD: persisted.totalCostUSD ?? 0,
          maxCostUSD: persisted.maxCostUSD ?? null,
          batchStopReason: persisted.batchStopReason ?? null,
          riderReadyCount: persisted.riderReadyCount ?? 0,
          levers: persisted.levers ?? [],
          terminalStates: persisted.terminalStates ?? emptyTerminalStates(),
          provenanceCounts: persisted.provenanceCounts ?? {},
          pageTotals: persisted.pageTotals ?? null,
          assumptionNote:
            'PRD per-lever expected yields are assumptions for comparison only — not committed catalog targets.',
        }
      }
    }

    const prefix = args.routeIdPrefix
    const idSet = args.routeIds ? new Set(args.routeIds) : null
    const leverCounts: Record<string, { candidates: number; passCount: number }> = {
      scraped_promoted: { candidates: 0, passCount: 0 },
      ai_reconstructed: { candidates: 0, passCount: 0 },
      name_routed: { candidates: 0, passCount: 0 },
    }
    const terminalStates = emptyTerminalStates()
    const provenanceCounts: Record<string, number> = {}
    let riderReadyCount = 0
    let generatedCount = 0
    let notARideRiderReady = false
    let shadowRiderReady = false

    const matchesScope = (routeId: string) => {
      if (idSet) return idSet.has(routeId)
      if (prefix) return routeId.startsWith(prefix)
      return true
    }

    // Prefer exact routeIds lookup when provided (isolated test pools).
    if (idSet) {
      for (const routeId of idSet) {
        const row = await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
          .first()
        if (!row) continue
        const status = (row.geometryStatus ?? 'unresolved') as keyof typeof terminalStates
        if (status in terminalStates) {
          terminalStates[status] = (terminalStates[status] ?? 0) + 1
        }
        if (row.geometryStatus === 'generated') generatedCount += 1
        // Gate-derived riderReady only — never infer from geometryStatus alone
        if (row.riderReady === true) riderReadyCount += 1

        const prov = row.geometryProvenance as string | undefined
        if (prov) {
          provenanceCounts[prov] = (provenanceCounts[prov] ?? 0) + 1
          if (leverCounts[prov]) {
            leverCounts[prov].candidates += 1
            const geom = await ctx.db
              .query('curated_route_geometry')
              .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
              .first()
            const pass =
              row.geometryStatus === 'generated' && geom?.verification?.verdict === 'pass'
            if (pass) leverCounts[prov].passCount += 1
          }
        }

        if (row.routeId.includes('not-a-ride') || row.routeId.includes('not_a_ride')) {
          if (row.riderReady === true) notARideRiderReady = true
        }
        if (row.duplicateOf != null || row.routeId.includes('shadow')) {
          if (row.riderReady === true) shadowRiderReady = true
        }
      }
    } else {
      const statuses = ['generated', 'review', 'unresolved', 'failed'] as const
      for (const status of statuses) {
        const rows = await ctx.db
          .query('curated_routes')
          .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', status))
          .take(500)
        for (const row of rows) {
          if (!matchesScope(row.routeId)) continue
          terminalStates[status] = (terminalStates[status] ?? 0) + 1
          if (status === 'generated') generatedCount += 1
          if (row.riderReady === true) riderReadyCount += 1

          const prov = row.geometryProvenance as string | undefined
          if (prov) {
            provenanceCounts[prov] = (provenanceCounts[prov] ?? 0) + 1
            if (leverCounts[prov]) {
              leverCounts[prov].candidates += 1
              const geom = await ctx.db
                .query('curated_route_geometry')
                .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
                .first()
              const pass = status === 'generated' && geom?.verification?.verdict === 'pass'
              if (pass) leverCounts[prov].passCount += 1
            }
          }

          if (row.routeId.includes('not-a-ride') || row.routeId.includes('not_a_ride')) {
            if (row.riderReady === true) notARideRiderReady = true
          }
          if (row.duplicateOf != null || row.routeId.includes('shadow')) {
            if (row.riderReady === true) shadowRiderReady = true
          }
        }
      }
    }

    const levers = buildLeverRows(leverCounts)
    return {
      source: 'live' as const,
      runId: args.runId ?? null,
      isDone: true,
      continueCursor: null,
      totalCostUSD: 0,
      riderReadyCount,
      generatedCount,
      levers,
      terminalStates,
      provenanceCounts,
      negativeControl: { notARideRiderReady, shadowRiderReady },
      assumptionNote:
        'PRD per-lever expected yields are assumptions for comparison only — not committed catalog targets.',
    }
  },
})

export const getBatchAcceptance = query({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    await requireOperator(ctx)
    const row = await ctx.db
      .query('batch_acceptance_artifacts')
      .withIndex('by_runId_and_kind', (q) => q.eq('runId', runId).eq('artifactKind', 'acceptance'))
      .first()
    if (!row) {
      return {
        runId,
        decision: null,
        acceptedAt: null,
        retirementUnlockedAt: null,
        escalations: [],
        resolution: null,
      }
    }
    return {
      runId,
      decision: row.decision ?? null,
      acceptedAt: row.acceptedAt ?? null,
      retirementUnlockedAt: row.retirementUnlockedAt ?? null,
      escalations: row.escalations ?? [],
      resolution: row.resolution ?? null,
      observedRates: row.observedRates ?? null,
      reason: row.reason ?? null,
    }
  },
})

export const retirementLockStatus = query({
  args: { runId: v.optional(v.string()) },
  handler: async (ctx, { runId }) => {
    await requireOperator(ctx)
    if (!runId) {
      // Global: locked unless any acceptance has unlocked retirement
      const rows = await ctx.db
        .query('batch_acceptance_artifacts')
        .withIndex('by_artifactKind', (q) => q.eq('artifactKind', 'acceptance'))
        .take(50)
      const unlocked = rows.find((r) => r.retirementUnlockedAt != null)
      return {
        locked: !unlocked,
        retirementUnlockedAt: unlocked?.retirementUnlockedAt ?? null,
        runId: unlocked?.runId ?? null,
      }
    }
    const row = await ctx.db
      .query('batch_acceptance_artifacts')
      .withIndex('by_runId_and_kind', (q) => q.eq('runId', runId).eq('artifactKind', 'acceptance'))
      .first()
    return {
      locked: row?.retirementUnlockedAt == null,
      retirementUnlockedAt: row?.retirementUnlockedAt ?? null,
      decision: row?.decision ?? null,
      runId,
    }
  },
})

function detectLowYieldEscalations(levers: LeverReportRow[]) {
  const escalations: Array<{
    lever: string
    leverNumber: number
    observedRate: number
    realizedRate: number
    passCount: number
    candidates: number
    candidateCount: number
    assumptionLabel: string
    escalationFloor: number
    reason: string
  }> = []
  for (const lever of levers) {
    if (lever.escalationFloor == null) continue
    if (lever.candidateCount <= 0) continue
    if (lever.realizedRate < lever.escalationFloor) {
      escalations.push({
        lever: lever.lever,
        leverNumber: lever.leverNumber,
        observedRate: lever.realizedRate,
        realizedRate: lever.realizedRate,
        passCount: lever.passCount,
        candidates: lever.candidateCount,
        candidateCount: lever.candidateCount,
        assumptionLabel: lever.assumptionLabel,
        escalationFloor: lever.escalationFloor,
        reason: `${lever.lever} realized rate ${(lever.realizedRate * 100).toFixed(1)}% is below escalation floor ${(lever.escalationFloor * 100).toFixed(0)}% (assumption ${lever.assumptionLabel})`,
      })
    }
  }
  return escalations
}

export const requestBatchAcceptance = mutation({
  args: {
    runId: v.string(),
    decision: v.union(v.literal('accept'), v.literal('reject')),
  },
  handler: async (ctx, { runId, decision }) => {
    await requireFounder(ctx)

    const report = await ctx.db
      .query('batch_acceptance_artifacts')
      .withIndex('by_runId_and_kind', (q) =>
        q.eq('runId', runId).eq('artifactKind', 'coverage_report'),
      )
      .first()

    if (!report) {
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: `No coverage report for runId=${runId}`,
      })
    }

    if (report.isDone === false) {
      const result = {
        runId,
        decision: null as null,
        acceptedAt: null as null,
        retirementUnlockedAt: null as null,
        reason: 'incomplete_run: isDone=false — cannot accept a partial batch',
        rejectionReason: 'incomplete_run',
        escalations: [] as unknown[],
      }
      await upsertBatchArtifact(ctx, {
        runId,
        artifactKind: 'acceptance',
        decision: null,
        acceptedAt: null,
        retirementUnlockedAt: null,
        reason: result.reason,
        escalations: [],
        observedRates: report.levers,
      })
      return result
    }

    const levers = (report.levers ?? []) as LeverReportRow[]
    const escalations = detectLowYieldEscalations(levers)

    if (decision === 'accept' && escalations.length > 0) {
      const payload = {
        runId,
        decision: 'escalation_required' as const,
        acceptedAt: null as null,
        retirementUnlockedAt: null as null,
        escalations,
        observedRates: levers,
        reason: escalations.map((e) => e.reason).join('; '),
      }
      await upsertBatchArtifact(ctx, {
        artifactKind: 'acceptance',
        ...payload,
      })
      return payload
    }

    if (decision === 'reject') {
      const payload = {
        runId,
        decision: 'rejected' as const,
        acceptedAt: null as null,
        retirementUnlockedAt: null as null,
        escalations: [],
        observedRates: levers,
        reason: 'founder_rejected',
      }
      await upsertBatchArtifact(ctx, {
        artifactKind: 'acceptance',
        ...payload,
      })
      return payload
    }

    // Clean accept
    const now = Date.now()
    const payload = {
      runId,
      decision: 'accepted' as const,
      acceptedAt: now,
      retirementUnlockedAt: now,
      escalations: [],
      observedRates: levers,
      reason: 'founder_accepted',
    }
    await upsertBatchArtifact(ctx, {
      artifactKind: 'acceptance',
      ...payload,
    })
    return payload
  },
})

export const resolveBatchEscalation = mutation({
  args: {
    runId: v.string(),
    decision: v.union(v.literal('accept'), v.literal('reject')),
    rationale: v.string(),
  },
  handler: async (ctx, { runId, decision, rationale }) => {
    await requireFounder(ctx)
    if (!rationale || rationale.trim().length < 1) {
      throw new ConvexError({
        code: 'INVALID_ARGUMENT',
        message: 'rationale is required for founder escalation resolution',
      })
    }

    const existing = await ctx.db
      .query('batch_acceptance_artifacts')
      .withIndex('by_runId_and_kind', (q) => q.eq('runId', runId).eq('artifactKind', 'acceptance'))
      .first()

    if (!existing || existing.decision !== 'escalation_required') {
      throw new ConvexError({
        code: 'INVALID_STATE',
        message: `No open escalation for runId=${runId}`,
      })
    }

    const now = Date.now()
    const resolvedAt = new Date(now).toISOString()
    const accepted = decision === 'accept'
    const resolution = {
      decision: accepted ? 'accepted' : 'rejected',
      rationale: rationale.trim(),
      resolvedAt,
      resolvedAtMs: now,
    }

    await ctx.db.patch(existing._id, {
      decision: accepted ? 'accepted' : 'rejected',
      acceptedAt: accepted ? now : null,
      retirementUnlockedAt: accepted ? now : null,
      resolution,
      reason: `escalation_resolved:${decision}`,
      updatedAt: now,
    })

    return {
      runId,
      decision: resolution.decision,
      rationale: resolution.rationale,
      resolvedAt,
      acceptedAt: accepted ? now : null,
      retirementUnlockedAt: accepted ? now : null,
    }
  },
})

/** Test-only: patch riderReadyCount on a report without touching lever rates. */
export const patchBatchReportRiderReadyOnly = mutation({
  args: {
    runId: v.string(),
    riderReadyCount: v.number(),
  },
  handler: async (ctx, { runId, riderReadyCount }) => {
    await requireFounder(ctx)
    const report = await ctx.db
      .query('batch_acceptance_artifacts')
      .withIndex('by_runId_and_kind', (q) =>
        q.eq('runId', runId).eq('artifactKind', 'coverage_report'),
      )
      .first()
    if (!report) {
      throw new ConvexError({ code: 'NOT_FOUND', message: `No report for ${runId}` })
    }
    await ctx.db.patch(report._id, { riderReadyCount, updatedAt: Date.now() })
    return { runId, riderReadyCount }
  },
})

// ---------- Fixture helpers ----------

async function upsertS5Route(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  row: {
    routeId: string
    name: string
    geometryStatus: 'generated' | 'unresolved' | 'failed' | 'review' | 'retired'
    geometryProvenance?: 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'
    riderReady?: boolean
    routePolyline?: string
    summary?: string
    rideWorthinessVerdict?: 'ride' | 'marginal' | 'not_a_ride'
    duplicateOf?: string
    verificationVerdict?: 'pass' | 'review'
  },
) {
  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
    .first()
  const nowMs = Date.now()
  const centroidLat = 34.95
  const centroidLng = -120.42
  const base = {
    name: row.name,
    lengthMiles: 41,
    centroidLat,
    centroidLng,
    boundsNeLat: centroidLat + 0.3,
    boundsNeLng: centroidLng + 0.3,
    boundsSwLat: centroidLat - 0.3,
    boundsSwLng: centroidLng - 0.3,
    location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
    compositeScore: 85,
    curvatureScore: 90,
    scenicScore: 80,
    technicalScore: 85,
    trafficScore: 75,
    remotenessScore: 70,
    routePolyline: row.routePolyline,
    geometryStatus: row.geometryStatus,
    geometryProvenance: row.geometryProvenance,
    riderReady: row.riderReady ?? false,
    state: 'California',
    summary: row.summary ?? 'S5-T1 fixture route',
    retiredAt: undefined,
    duplicateOf: row.duplicateOf,
    quarantine: undefined,
    rideWorthiness: {
      verdict: row.rideWorthinessVerdict ?? ('ride' as const),
      reason: 's5t1 seed',
      model: 'test',
      classifiedAt: nowMs,
    },
  }

  let docId = existing?._id
  if (existing) {
    await ctx.db.patch(existing._id, base)
  } else {
    docId = await ctx.db.insert('curated_routes', {
      routeId: row.routeId,
      source: 'editorial',
      primaryArchetype: 'twisties',
      secondaryTags: ['test', 's5t1'],
      oneLiner: 'S5-T1 fixture',
      badges: [],
      season: 'year_round',
      contentVersion: 1,
      seededAt: nowMs,
      ...base,
    })
    try {
      await geospatial.insert(
        ctx as any,
        docId!,
        { latitude: centroidLat, longitude: centroidLng },
        { state: 'California', primaryArchetype: 'twisties' },
        85,
      )
    } catch {
      /* may exist */
    }
  }

  if (row.geometryStatus === 'generated' || row.geometryStatus === 'review') {
    const geomExisting = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
      .first()
    const verification = {
      routeId: row.routeId,
      verdict: row.verificationVerdict ?? (row.geometryStatus === 'generated' ? 'pass' : 'review'),
      provenance: row.geometryProvenance,
      geometry: POLY_41MI_S5,
      geometryStatus:
        row.geometryStatus === 'generated' ? ('generated' as const) : ('review' as const),
      anchorCount: 2,
      anchors: [] as Array<{
        lat: number
        lng: number
        formatted: string
        distanceFromCentroid: number
      }>,
      pointCount: 50,
      degenerate: false,
      ratio: 1.0,
      claimedMiles: 41,
      routedMiles: 41,
    }
    const geomDoc = {
      routeId: row.routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: POLY_41MI_S5,
      provenance: row.geometryProvenance,
      verification,
    }
    if (geomExisting) {
      await ctx.db.replace(geomExisting._id, geomDoc)
    } else {
      await ctx.db.insert('curated_route_geometry', geomDoc)
    }
  }

  // Recompute riderReady from truth for generated pass rows
  if (docId && row.geometryStatus === 'generated' && row.verificationVerdict !== 'review') {
    await recomputeRiderReady(ctx as any, docId)
  } else if (docId) {
    await ctx.db.patch(docId, { riderReady: row.riderReady ?? false })
  }

  return { routeId: row.routeId, id: docId }
}

export const seedS5T1GateBatch = mutation({
  args: {
    prefix: v.optional(v.string()),
    count: v.optional(v.number()),
    runId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFounder(ctx)
    const prefix = args.prefix ?? 'test:s5t1-gate'
    const count = args.count ?? 4
    const routeIds: string[] = []
    for (let i = 0; i < count; i++) {
      const routeId = `${prefix}-${String(i).padStart(3, '0')}`
      await upsertS5Route(ctx, {
        routeId,
        name: `S5 Gate ${i}`,
        geometryStatus: 'unresolved',
        // No polyline for most so L1 fails and L2 costs — first one has polyline for mix
        routePolyline: i === 0 ? POLY_41MI_S5 : undefined,
        summary: 'S5-T1 gate batch cost burn reconstruct candidate.',
      })
      routeIds.push(routeId)
    }
    return { routeIds, count: routeIds.length, runId: args.runId ?? null }
  },
})

export const seedS5T1MixedProvenanceBatch = mutation({
  args: {},
  handler: async (ctx) => {
    await requireFounder(ctx)
    const specs: Array<Parameters<typeof upsertS5Route>[1]> = [
      {
        routeId: 'test:s5t1-lever1-pass',
        name: 'Lever1 Pass',
        geometryStatus: 'generated',
        geometryProvenance: 'scraped_promoted',
        verificationVerdict: 'pass',
        riderReady: true,
        routePolyline: POLY_41MI_S5,
      },
      {
        routeId: 'test:s5t1-lever1-fail',
        name: 'Lever1 Fail',
        geometryStatus: 'review',
        geometryProvenance: 'scraped_promoted',
        verificationVerdict: 'review',
        riderReady: false,
        routePolyline: POLY_41MI_S5,
      },
      {
        routeId: 'test:s5t1-lever2-pass',
        name: 'Lever2 Pass',
        geometryStatus: 'generated',
        geometryProvenance: 'ai_reconstructed',
        verificationVerdict: 'pass',
        riderReady: true,
      },
      {
        routeId: 'test:s5t1-lever2-fail',
        name: 'Lever2 Fail',
        geometryStatus: 'review',
        geometryProvenance: 'ai_reconstructed',
        verificationVerdict: 'review',
        riderReady: false,
      },
      {
        routeId: 'test:s5t1-lever3-pass',
        name: 'Lever3 Pass',
        geometryStatus: 'generated',
        geometryProvenance: 'name_routed',
        verificationVerdict: 'pass',
        riderReady: true,
      },
      {
        routeId: 'test:s5t1-lever3-fail',
        name: 'Lever3 Fail',
        geometryStatus: 'review',
        geometryProvenance: 'name_routed',
        verificationVerdict: 'review',
        riderReady: false,
      },
      {
        routeId: 'test:s5t1-not-a-ride',
        name: 'Not A Ride Generated',
        geometryStatus: 'generated',
        geometryProvenance: 'scraped_promoted',
        verificationVerdict: 'pass',
        rideWorthinessVerdict: 'not_a_ride',
        riderReady: false,
      },
      {
        routeId: 'test:s5t1-shadow-dup',
        name: 'Shadow Duplicate',
        geometryStatus: 'generated',
        geometryProvenance: 'scraped_promoted',
        verificationVerdict: 'pass',
        duplicateOf: 'test:s5t1-lever1-pass',
        riderReady: false,
      },
    ]

    for (const spec of specs) {
      await upsertS5Route(ctx, spec)
    }

    // Force riderReady via recompute for truth
    for (const routeId of [
      'test:s5t1-lever1-pass',
      'test:s5t1-lever2-pass',
      'test:s5t1-lever3-pass',
      'test:s5t1-not-a-ride',
      'test:s5t1-shadow-dup',
    ]) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (doc) await recomputeRiderReady(ctx as any, doc._id)
    }

    // Count actual ready
    let ready = 0
    let generated = 0
    for (const spec of specs) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', spec.routeId))
        .first()
      if (doc?.geometryStatus === 'generated') generated += 1
      if (doc?.riderReady === true) ready += 1
    }

    return {
      seeded: specs.map((s) => s.routeId),
      expectedRiderReadyCount: ready,
      generatedCount: generated,
    }
  },
})

export const seedS5T1LowYieldReport = mutation({
  args: {
    runId: v.string(),
    reconstruct: v.object({
      candidates: v.number(),
      passCount: v.number(),
    }),
    riderReadyCount: v.optional(v.number()),
    isDone: v.optional(v.boolean()),
    continueCursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFounder(ctx)
    const reconRate =
      args.reconstruct.candidates > 0 ? args.reconstruct.passCount / args.reconstruct.candidates : 0
    const levers = buildLeverRows({
      scraped_promoted: { candidates: 10, passCount: 5 },
      ai_reconstructed: {
        candidates: args.reconstruct.candidates,
        passCount: args.reconstruct.passCount,
      },
      name_routed: { candidates: 10, passCount: 5 },
    })
    // Patch reconstruct rates explicitly
    const recon = levers.find((l) => l.lever === 'reconstruct')!
    recon.candidateCount = args.reconstruct.candidates
    recon.passCount = args.reconstruct.passCount
    recon.realizedRate = reconRate
    recon.passRate = reconRate

    await upsertBatchArtifact(ctx, {
      runId: args.runId,
      artifactKind: 'coverage_report',
      isDone: args.isDone ?? true,
      continueCursor: args.continueCursor ?? null,
      totalCostUSD: 1.25,
      maxCostUSD: 10,
      batchStopReason: args.isDone === false ? 'cost_exceeded' : 'completed',
      riderReadyCount: args.riderReadyCount ?? args.reconstruct.passCount + 10,
      levers,
      terminalStates: {
        recovered: args.reconstruct.passCount + 10,
        queued: 5,
        retirement_eligible: 2,
        cost_blocked: 0,
        skipped: 0,
      },
      provenanceCounts: {
        scraped_promoted: 10,
        ai_reconstructed: args.reconstruct.candidates,
        name_routed: 10,
      },
      decision: null,
      acceptedAt: null,
      retirementUnlockedAt: null,
    })

    // Clear any prior acceptance for this run
    const prior = await ctx.db
      .query('batch_acceptance_artifacts')
      .withIndex('by_runId_and_kind', (q) =>
        q.eq('runId', args.runId).eq('artifactKind', 'acceptance'),
      )
      .first()
    if (prior) await ctx.db.delete(prior._id)

    return {
      runId: args.runId,
      reconstructRate: reconRate,
      levers,
      isDone: args.isDone ?? true,
    }
  },
})

export const seedS5T1CostStopPool = mutation({
  args: {
    count: v.number(),
    prefix: v.optional(v.string()),
    runId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireFounder(ctx)
    const prefix = args.prefix ?? 'test:s5t1-cost'
    const routeIds: string[] = []
    for (let i = 0; i < args.count; i++) {
      const routeId = `${prefix}-${String(i).padStart(2, '0')}`
      await upsertS5Route(ctx, {
        routeId,
        name: `S5 Cost ${i}`,
        geometryStatus: 'unresolved',
        // No polyline → L1 fails → L2 burns cost
        summary: 'S5-T1 cost-stop reconstruct candidate corridor.',
      })
      routeIds.push(routeId)
    }
    return { routeIds, count: routeIds.length, runId: args.runId ?? null }
  },
})

export const getS5T1RouteSnapshot = query({
  args: { routeIds: v.array(v.string()) },
  handler: async (ctx, { routeIds }) => {
    await requireOperator(ctx)
    const routes = []
    for (const routeId of routeIds) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (!doc) {
        routes.push({ routeId, missing: true })
        continue
      }
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      routes.push({
        routeId,
        geometryStatus: doc.geometryStatus ?? null,
        geometryProvenance: doc.geometryProvenance ?? null,
        riderReady: doc.riderReady ?? false,
        verificationVerdict: geom?.verification?.verdict ?? null,
        verificationAttemptedAt: geom?._creationTime ?? null,
      })
    }
    return { routes }
  },
})

export const teardownS5T1Fixtures = mutation({
  args: {
    prefixes: v.optional(v.array(v.string())),
    runIds: v.optional(v.array(v.string())),
    routeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireFounder(ctx)
    const removed: string[] = []
    const prefixes = args.prefixes ?? ['test:s5t1-']
    const exact = new Set(args.routeIds ?? [])

    // Exact + known fixture route ids
    for (const id of [
      'test:s5t1-lever1-pass',
      'test:s5t1-lever1-fail',
      'test:s5t1-lever2-pass',
      'test:s5t1-lever2-fail',
      'test:s5t1-lever3-pass',
      'test:s5t1-lever3-fail',
      'test:s5t1-not-a-ride',
      'test:s5t1-shadow-dup',
    ]) {
      exact.add(id)
    }

    const deleteRoute = async (routeId: string) => {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (!doc) return
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (geom) await ctx.db.delete(geom._id)
      // artifacts
      const arts = await ctx.db
        .query('curation_artifacts')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .take(50)
      for (const a of arts) await ctx.db.delete(a._id)
      try {
        await geospatial.remove(ctx as any, doc._id)
      } catch {
        /* ok */
      }
      await ctx.db.delete(doc._id)
      removed.push(routeId)
    }

    for (const id of exact) await deleteRoute(id)

    for (const status of ['unresolved', 'generated', 'review', 'failed'] as const) {
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', status))
        .take(200)
      for (const row of rows) {
        if (prefixes.some((p) => row.routeId.startsWith(p))) {
          await deleteRoute(row.routeId)
        }
      }
    }

    if (args.runIds) {
      for (const runId of args.runIds) {
        const arts = await ctx.db
          .query('batch_acceptance_artifacts')
          .withIndex('by_runId', (q) => q.eq('runId', runId))
          .take(20)
        for (const a of arts) await ctx.db.delete(a._id)
      }
    }

    return { removed, count: removed.length }
  },
})

// ---------------------------------------------------------------------------
// S5-T2: Fail-closed retirement — eligibility, explicit confirm, reversible un-retire
// ---------------------------------------------------------------------------

const POLY_SEED =
  'oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@'

type LeverFailureReason = { lever: 1 | 2 | 3; reason: string }

type WaterfallArtifactEvidence = {
  artifactType: string
  lever?: number
  terminalState?: string
  failedCondition?: string
  provenance?: string
  leversRun?: number[]
}

/**
 * Extract durable lever-failure evidence from curation_artifacts.
 *
 * Two shapes are accepted:
 * 1. Per-lever seed/legacy rows (`lever` 1|2|3 on waterfall_result)
 * 2. Production summary from recordTerminalArtifact (no `lever`, has
 *    terminalState + leversRun covering exhausted waterfall)
 *
 * When ANY per-lever rows exist, eligibility is driven by per-lever evidence
 * only (keeps fail-closed negative control when one lever artifact is removed).
 * Otherwise fall back to production summary shape.
 */
export function extractLeverEvidence(arts: WaterfallArtifactEvidence[]): {
  leverFailureReasons: LeverFailureReason[]
  hasPassLever: boolean
  passLevers: number[]
} {
  const failureByLever = new Map<number, string>()
  const passLevers: number[] = []
  let sawPerLeverRow = false

  for (const a of arts) {
    if (a.artifactType !== 'waterfall_result') continue
    if (a.lever == null || a.lever < 1 || a.lever > 3) continue
    sawPerLeverRow = true

    // A recovered terminal is a lever PASS
    if (a.terminalState === 'recovered') {
      if (!passLevers.includes(a.lever)) passLevers.push(a.lever)
      continue
    }

    if (
      a.terminalState === 'retirement_eligible' ||
      a.terminalState === 'queued' ||
      (a.failedCondition != null && a.failedCondition.length > 0)
    ) {
      if (!failureByLever.has(a.lever)) {
        failureByLever.set(a.lever, a.failedCondition ?? 'fail')
      }
    }
  }

  // Prefer per-lever evidence when present (seed / expanded terminal rows)
  if (sawPerLeverRow) {
    const leverFailureReasons: LeverFailureReason[] = ([1, 2, 3] as const)
      .filter((l) => failureByLever.has(l))
      .map((l) => ({ lever: l, reason: failureByLever.get(l) ?? 'fail' }))

    return {
      leverFailureReasons,
      hasPassLever: passLevers.length > 0,
      passLevers,
    }
  }

  // Production summary path: waterfall_result without per-lever field
  // Prefer the newest all-failed / recovered summary when multiple exist.
  const summaries = arts
    .filter(
      (a) =>
        a.artifactType === 'waterfall_result' &&
        (a.lever == null || a.lever < 1 || a.lever > 3) &&
        Array.isArray(a.leversRun) &&
        a.leversRun.length > 0,
    )
    .slice()

  let hasPassFromSummary = false
  let bestFailure: {
    levers: number[]
    reason: string
  } | null = null

  for (const a of summaries) {
    const levers = (a.leversRun ?? []).filter((l) => l === 1 || l === 2 || l === 3)
    if (a.terminalState === 'recovered') {
      hasPassFromSummary = true
      continue
    }
    // All-lever residual terminals written by production waterfall
    if (a.terminalState === 'retirement_eligible' || a.terminalState === 'queued') {
      const unique = [...new Set(levers)]
      if (!bestFailure || unique.length > bestFailure.levers.length) {
        bestFailure = {
          levers: unique,
          reason: a.failedCondition ?? 'fail',
        }
      }
    }
  }

  const leverFailureReasons: LeverFailureReason[] = bestFailure
    ? ([1, 2, 3] as const)
        .filter((l) => bestFailure!.levers.includes(l))
        .map((l) => ({ lever: l, reason: bestFailure!.reason }))
    : []

  return {
    leverFailureReasons,
    hasPassLever: hasPassFromSummary,
    passLevers: hasPassFromSummary ? [1] : [],
  }
}

export function isEligibleForRetirement(args: {
  leverFailureReasons: LeverFailureReason[]
  hasPassLever: boolean
  verificationVerdict: string | null | undefined
  geometryStatus: string | null | undefined
  rideWorthinessVerdict: string | null | undefined
}): boolean {
  // Gate PASS geometry is never retirement-eligible
  if (args.verificationVerdict === 'pass') return false
  if (args.hasPassLever) return false
  // Fail-closed: require durable terminal failure for ALL three levers
  if (args.leverFailureReasons.length !== 3) return false
  const levers = new Set(args.leverFailureReasons.map((r) => r.lever))
  if (!levers.has(1) || !levers.has(2) || !levers.has(3)) return false
  // Marginal alone is not eligibility — need all-lever failures (already enforced above).
  // geometryStatus=review alone is also insufficient (enforced by lever count).
  void args.geometryStatus
  void args.rideWorthinessVerdict
  return true
}

/**
 * Shared retirement gate used by curatedGeometry.retireRoute and
 * reviewQueue.retireDisposition — confirmed + non-empty reason + eligibility.
 */
export function assertRetirementConfirmation(args: { confirmed: boolean; reason: string }): string {
  if (args.confirmed !== true) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Retirement requires explicit founder confirmation (confirmed=true)',
    })
  }
  const trimmed = args.reason.trim()
  if (trimmed.length < 1) {
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Retirement requires a non-empty reason',
    })
  }
  return trimmed
}

async function upsertS5T2Route(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  args: {
    routeId: string
    name: string
    geometryStatus: 'generated' | 'unresolved' | 'failed' | 'review' | 'retired'
    riderReady: boolean
    lengthMiles?: number
    rideWorthinessVerdict?: 'ride' | 'marginal' | 'not_a_ride'
    retiredAt?: number
    retirementReason?: string
  },
) {
  const nowMs = Date.now()
  const centroidLat = 34.95
  const centroidLng = -120.42
  const lengthMiles = args.lengthMiles ?? 41

  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q) => q.eq('routeId', args.routeId))
    .first()

  const base = {
    routeId: args.routeId,
    source: 'editorial' as const,
    name: args.name,
    primaryArchetype: 'twisties' as const,
    secondaryTags: ['test', 's5t2'],
    oneLiner: 'S5-T2 retirement seed',
    summary: 'S5-T2 retirement seed summary',
    badges: [] as string[],
    season: 'year_round' as const,
    contentVersion: 1,
    seededAt: nowMs,
    lengthMiles,
    centroidLat,
    centroidLng,
    boundsNeLat: centroidLat + 0.3,
    boundsNeLng: centroidLng + 0.3,
    boundsSwLat: centroidLat - 0.3,
    boundsSwLng: centroidLng - 0.3,
    location: {
      type: 'Point' as const,
      coordinates: [centroidLng, centroidLat] as [number, number],
    },
    compositeScore: 85,
    curvatureScore: 90,
    scenicScore: 80,
    technicalScore: 85,
    trafficScore: 75,
    remotenessScore: 70,
    state: 'California',
    geometryStatus: args.geometryStatus,
    riderReady: args.riderReady,
    retiredAt: args.retiredAt,
    retirementReason: args.retirementReason,
    rideWorthiness: {
      verdict: args.rideWorthinessVerdict ?? ('not_a_ride' as const),
      reason: args.rideWorthinessVerdict === 'marginal' ? 'marginal classifier' : 'no_rescue',
      model: 'test',
      evidenceComplete: true,
      classifiedAt: nowMs,
    },
  }

  let docId = existing?._id
  if (existing) {
    await ctx.db.patch(existing._id, {
      geometryStatus: args.geometryStatus,
      riderReady: args.riderReady,
      retiredAt: args.retiredAt,
      retirementReason: args.retirementReason,
      name: args.name,
      lengthMiles,
      rideWorthiness: base.rideWorthiness,
    })
  } else {
    docId = await ctx.db.insert('curated_routes', base)
  }
  return docId!
}

async function seedLeverFailureArtifacts(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  routeId: string,
  reasons: { lever: 1 | 2 | 3; reason: string }[],
) {
  const now = Date.now()
  // Clear prior lever terminal artifacts for idempotent re-seed
  const existing = await ctx.db
    .query('curation_artifacts')
    .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
    .take(100)
  for (const a of existing) {
    if (a.artifactType === 'waterfall_result' && a.lever != null) {
      await ctx.db.delete(a._id)
    }
  }

  for (const r of reasons) {
    await ctx.db.insert('curation_artifacts', {
      routeId,
      artifactType: 'waterfall_result',
      terminalState: 'retirement_eligible',
      failedCondition: r.reason,
      lever: r.lever,
      leversRun: [r.lever],
      costUsd: 0,
      attemptedAt: now,
      createdAt: now,
    })
  }

  // Summary terminal artifact (all levers)
  await ctx.db.insert('curation_artifacts', {
    routeId,
    artifactType: 'waterfall_result',
    terminalState: 'retirement_eligible',
    leversRun: [1, 2, 3],
    failedCondition: reasons[reasons.length - 1]?.reason,
    costUsd: 0,
    attemptedAt: now,
    createdAt: now + 1,
  })
}

async function seedPassGeometry(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  routeId: string,
) {
  const existingGeom = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
    .first()

  const geomDoc = {
    routeId,
    format: 'polyline' as const,
    encoding: 'utf-8',
    precision: 5,
    value: POLY_SEED,
    provenance: 'ai_reconstructed' as const,
    verification: {
      routeId,
      verdict: 'pass' as const,
      provenance: 'ai_reconstructed',
      geometry: POLY_SEED,
      geometryStatus: 'generated' as const,
      anchorCount: 2,
      anchors: [],
      pointCount: 80,
      degenerate: false,
      ratio: 1.0,
      claimedMiles: 41,
      routedMiles: 41,
    },
  }
  if (existingGeom) {
    await ctx.db.replace(existingGeom._id, geomDoc)
  } else {
    await ctx.db.insert('curated_route_geometry', geomDoc)
  }

  const now = Date.now()
  await ctx.db.insert('curation_artifacts', {
    routeId,
    artifactType: 'waterfall_result',
    terminalState: 'recovered',
    provenance: 'ai_reconstructed',
    lever: 2,
    leversRun: [1, 2],
    costUsd: 0.07,
    attemptedAt: now,
    createdAt: now,
  })
}

async function seedReviewCandidateGeometry(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  routeId: string,
  failedCondition: 'ratio' | 'anchors' | 'degenerate' = 'ratio',
) {
  const existingGeom = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
    .first()

  const geomDoc = {
    routeId,
    format: 'polyline' as const,
    encoding: 'utf-8',
    precision: 5,
    value: POLY_SEED,
    provenance: undefined,
    verification: {
      routeId,
      verdict: 'review' as const,
      failedCondition,
      geometry: POLY_SEED,
      geometryStatus: 'review' as const,
      anchorCount: 2,
      anchors: [],
      pointCount: 50,
      degenerate: false,
      ratio: 2.0,
      claimedMiles: 41,
      routedMiles: 82,
    },
  }
  if (existingGeom) {
    await ctx.db.replace(existingGeom._id, geomDoc)
  } else {
    await ctx.db.insert('curated_route_geometry', geomDoc)
  }

  const now = Date.now()
  await ctx.db.insert('curation_artifacts', {
    routeId,
    artifactType: 'review_candidate',
    terminalState: 'queued',
    failedCondition,
    bestCandidateGeometry: POLY_SEED,
    createdAt: now,
    attemptedAt: now,
  })
}

/**
 * Seed ONLY a production-shaped waterfall_result summary (no per-lever `lever` field).
 * Mirrors recordTerminalArtifact from waterfallOrchestrator.
 */
async function seedProductionWaterfallSummary(
  ctx: { db: import('./_generated/server').MutationCtx['db'] },
  args: {
    routeId: string
    terminalState: 'retirement_eligible' | 'queued'
    leversRun: number[]
    failedCondition?: string
  },
) {
  const now = Date.now()
  // Clear prior waterfall_result rows for idempotent re-seed
  const existing = await ctx.db
    .query('curation_artifacts')
    .withIndex('by_routeId', (q) => q.eq('routeId', args.routeId))
    .take(100)
  for (const a of existing) {
    if (a.artifactType === 'waterfall_result') {
      await ctx.db.delete(a._id)
    }
  }

  // Production shape: NO `lever` field — only terminalState + leversRun + failedCondition
  await ctx.db.insert('curation_artifacts', {
    routeId: args.routeId,
    artifactType: 'waterfall_result',
    terminalState: args.terminalState,
    leversRun: args.leversRun,
    failedCondition: args.failedCondition ?? 'degenerate',
    costUsd: 0,
    attemptedAt: now,
    createdAt: now,
  })
}

/** Public test-support seed for S5-T2 scenarios. */
export const seedS5T2RetirementFixtures = mutation({
  args: {
    scenario: v.union(
      v.literal('all-levers-failed-vs-pass'),
      v.literal('founder-confirmation-required'),
      v.literal('retired-route-surface'),
      v.literal('retire-unretire-preserves-record'),
      v.literal('production-summary-all-failed'),
    ),
    allFailedRouteId: v.optional(v.string()),
    passRouteId: v.optional(v.string()),
    reviewOnlyRouteId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOperator(ctx)
    const allFailedId = args.allFailedRouteId ?? 'test:s5t2-all-failed'
    const passId = args.passRouteId ?? 'test:s5t2-lever2-pass'
    const reviewOnlyId = args.reviewOnlyRouteId ?? 'test:s5t2-review-only'

    const failureReasons = [
      { lever: 1 as const, reason: 'ratio' },
      { lever: 2 as const, reason: 'anchors' },
      { lever: 3 as const, reason: 'degenerate' },
    ]

    // FIX-S5-T2-01: production-shaped summary only (no per-lever seed rows)
    if (args.scenario === 'production-summary-all-failed') {
      // allFailedId: summary retirement_eligible + leversRun [1,2,3]
      await upsertS5T2Route(ctx, {
        routeId: allFailedId,
        name: `S5-T2 Prod Summary ${allFailedId}`,
        geometryStatus: 'review',
        riderReady: false,
        rideWorthinessVerdict: 'not_a_ride',
      })
      await seedReviewCandidateGeometry(ctx, allFailedId, 'ratio')
      await seedProductionWaterfallSummary(ctx, {
        routeId: allFailedId,
        terminalState: 'retirement_eligible',
        leversRun: [1, 2, 3],
        failedCondition: 'degenerate',
      })

      // passId reused as queued-after-all-levers residual
      await upsertS5T2Route(ctx, {
        routeId: passId,
        name: `S5-T2 Prod Queued ${passId}`,
        geometryStatus: 'review',
        riderReady: false,
        rideWorthinessVerdict: 'not_a_ride',
      })
      await seedReviewCandidateGeometry(ctx, passId, 'anchors')
      await seedProductionWaterfallSummary(ctx, {
        routeId: passId,
        terminalState: 'queued',
        leversRun: [1, 2, 3],
        failedCondition: 'anchors',
      })

      // reviewOnlyId reused as partial leversRun (missing lever 3) — not eligible
      await upsertS5T2Route(ctx, {
        routeId: reviewOnlyId,
        name: `S5-T2 Prod Partial ${reviewOnlyId}`,
        geometryStatus: 'review',
        riderReady: false,
        rideWorthinessVerdict: 'marginal',
      })
      await seedReviewCandidateGeometry(ctx, reviewOnlyId, 'ratio')
      await seedProductionWaterfallSummary(ctx, {
        routeId: reviewOnlyId,
        terminalState: 'retirement_eligible',
        leversRun: [1, 2],
        failedCondition: 'ratio',
      })

      return {
        scenario: args.scenario,
        allFailedRouteId: allFailedId,
        passRouteId: passId,
        reviewOnlyRouteId: reviewOnlyId,
      }
    }

    // Always seed the all-failed candidate for every scenario
    await upsertS5T2Route(ctx, {
      routeId: allFailedId,
      name: `S5-T2 All Failed ${allFailedId}`,
      geometryStatus: 'review',
      riderReady: false,
      rideWorthinessVerdict: 'not_a_ride',
    })
    await seedReviewCandidateGeometry(ctx, allFailedId, 'ratio')
    await seedLeverFailureArtifacts(ctx, allFailedId, failureReasons)

    if (args.scenario === 'all-levers-failed-vs-pass') {
      await upsertS5T2Route(ctx, {
        routeId: passId,
        name: `S5-T2 Lever2 Pass ${passId}`,
        geometryStatus: 'generated',
        riderReady: true,
        rideWorthinessVerdict: 'ride',
      })
      await seedPassGeometry(ctx, passId)

      // Review-only: geometryStatus=review WITHOUT per-lever terminal artifacts
      await upsertS5T2Route(ctx, {
        routeId: reviewOnlyId,
        name: `S5-T2 Review Only ${reviewOnlyId}`,
        geometryStatus: 'review',
        riderReady: false,
        rideWorthinessVerdict: 'marginal',
      })
      await seedReviewCandidateGeometry(ctx, reviewOnlyId, 'anchors')
      // Explicitly do NOT seed lever terminal artifacts
    }

    return {
      scenario: args.scenario,
      allFailedRouteId: allFailedId,
      passRouteId: args.scenario === 'all-levers-failed-vs-pass' ? passId : null,
      reviewOnlyRouteId: args.scenario === 'all-levers-failed-vs-pass' ? reviewOnlyId : null,
    }
  },
})

export const teardownS5T2Fixtures = mutation({
  args: {
    prefixes: v.optional(v.array(v.string())),
    routeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { prefixes, routeIds }) => {
    await requireOperator(ctx)
    const prefixList = prefixes ?? ['test:s5t2-']
    const removed: string[] = []
    const seen = new Set<string>()

    const deleteRoute = async (routeId: string) => {
      if (seen.has(routeId)) return
      const row = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (!row) return
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (geom) await ctx.db.delete(geom._id)
      const arts = await ctx.db
        .query('curation_artifacts')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .take(100)
      for (const a of arts) await ctx.db.delete(a._id)
      await ctx.db.delete(row._id)
      seen.add(routeId)
      removed.push(routeId)
    }

    // Prefer exact routeIds (stable under parallel suites)
    if (routeIds) {
      for (const id of routeIds) await deleteRoute(id)
    }

    for (const status of ['unresolved', 'generated', 'review', 'failed', 'retired'] as const) {
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', status))
        .take(400)
      for (const row of rows) {
        if (!prefixList.some((p) => row.routeId.startsWith(p))) continue
        await deleteRoute(row.routeId)
      }
    }

    return { removed, count: removed.length }
  },
})

export const removeLeverTerminalArtifact = mutation({
  args: {
    routeId: v.string(),
    lever: v.union(v.literal(1), v.literal(2), v.literal(3)),
  },
  handler: async (ctx, { routeId, lever }) => {
    await requireOperator(ctx)
    const arts = await ctx.db
      .query('curation_artifacts')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .take(100)
    let removed = 0
    for (const a of arts) {
      if (a.artifactType === 'waterfall_result' && a.lever === lever) {
        await ctx.db.delete(a._id)
        removed += 1
      }
    }
    return { routeId, lever, removed }
  },
})

export const listRetirementCandidates = query({
  args: {
    limit: v.optional(v.number()),
    routeIdPrefix: v.optional(v.string()),
  },
  handler: async (ctx, { limit, routeIdPrefix }) => {
    await requireIdentity(ctx)
    const take = Math.min(limit ?? 50, 200)

    // Scan review + unresolved residuals. When a prefix is supplied, expand the
    // scan window so test/operator filters are not truncated by stale review rows.
    const statuses = ['review', 'unresolved', 'failed', 'retired'] as const
    const scanPerStatus = routeIdPrefix ? 800 : take * 3
    let rows: Array<import('./_generated/dataModel').Doc<'curated_routes'>> = []
    for (const status of statuses) {
      const batch = await ctx.db
        .query('curated_routes')
        .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', status))
        .take(scanPerStatus)
      rows = rows.concat(batch)
    }

    if (routeIdPrefix) {
      // Exact id short-circuit (operator paste of a full routeId)
      const exact = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeIdPrefix))
        .first()
      if (exact && !rows.some((r) => r.routeId === exact.routeId)) {
        rows = [exact, ...rows]
      }
      rows = rows.filter((r) => r.routeId.startsWith(routeIdPrefix))
    }

    const candidates = []
    for (const row of rows.slice(0, take)) {
      const arts = await ctx.db
        .query('curation_artifacts')
        .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
        .take(100)

      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
        .first()

      const evidence = extractLeverEvidence(arts)
      const eligible = isEligibleForRetirement({
        leverFailureReasons: evidence.leverFailureReasons,
        hasPassLever: evidence.hasPassLever,
        verificationVerdict: geom?.verification?.verdict ?? null,
        geometryStatus: row.geometryStatus ?? null,
        rideWorthinessVerdict: row.rideWorthiness?.verdict ?? null,
      })

      // Only surface rows that have at least some lever evidence OR are eligible
      // (tests look for specific routeIds; include all scanned with explicit eligible flag)
      let bestCandidateGeometry: string | null = geom?.value ?? geom?.verification?.geometry ?? null
      if (!bestCandidateGeometry) {
        const candidate = arts
          .filter((a) => a.artifactType === 'review_candidate')
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
        bestCandidateGeometry = candidate?.bestCandidateGeometry ?? null
      }

      candidates.push({
        routeId: row.routeId,
        name: row.name,
        geometryStatus: row.geometryStatus ?? null,
        eligible,
        leverFailureReasons: evidence.leverFailureReasons,
        classifierVerdict: row.rideWorthiness?.verdict ?? null,
        classifier: row.rideWorthiness
          ? {
              verdict: row.rideWorthiness.verdict,
              reason: row.rideWorthiness.reason,
              model: row.rideWorthiness.model,
            }
          : null,
        bestCandidateGeometry,
        retiredAt: row.retiredAt ?? null,
        retirementReason: row.retirementReason ?? null,
        riderReady: row.riderReady ?? false,
      })
    }

    const eligibleCandidateCount = candidates.filter((c) => c.eligible).length
    return { candidates, eligibleCandidateCount, length: candidates.length }
  },
})

export const getRetirementEvidence = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) {
      return {
        routeId,
        routeDocExists: false,
        candidateAbsent: true,
      }
    }

    const arts = await ctx.db
      .query('curation_artifacts')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .take(100)

    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const evidence = extractLeverEvidence(arts)
    const eligible = isEligibleForRetirement({
      leverFailureReasons: evidence.leverFailureReasons,
      hasPassLever: evidence.hasPassLever,
      verificationVerdict: geom?.verification?.verdict ?? null,
      geometryStatus: route.geometryStatus ?? null,
      rideWorthinessVerdict: route.rideWorthiness?.verdict ?? null,
    })

    const dispositions = arts
      .filter((a) => a.artifactType === 'disposition')
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))

    const retireDispositions = dispositions.filter((d) => d.disposition === 'retire')
    const hasRetireReason =
      (route.retirementReason != null && route.retirementReason.length > 0) ||
      retireDispositions.some((d) => (d.reason ?? '').length > 0)

    return {
      routeId,
      routeDocId: route._id,
      routeDocExists: true,
      sameId: true,
      geometryStatus: route.geometryStatus ?? null,
      riderReady: route.riderReady ?? false,
      retiredAt: route.retiredAt != null ? new Date(route.retiredAt).toISOString() : null,
      retirementReason: route.retirementReason ?? null,
      retirementReasonHistoryRetained: hasRetireReason,
      verification: geom?.verification
        ? {
            verdict: geom.verification.verdict,
            geometryStatus: geom.verification.geometryStatus,
          }
        : null,
      eligible,
      leverFailureReasons: evidence.leverFailureReasons,
      leverFailureEvidenceCount: evidence.leverFailureReasons.length,
      dispositionCount: dispositions.length,
      dispositionAuditCount: dispositions.length,
      dispositions,
      geometryCandidateRetained: geom != null,
      candidateAbsent: !eligible,
      classifierVerdict: route.rideWorthiness?.verdict ?? null,
    }
  },
})

/**
 * Explicit Founder-confirmed retirement. NEVER auto-called from batch/classifier.
 * Requires confirmed===true and non-empty reason; route must be all-lever-failed eligible.
 */
export const retireRoute = mutation({
  args: {
    routeId: v.string(),
    reason: v.string(),
    confirmed: v.boolean(),
  },
  handler: async (ctx, { routeId, reason, confirmed }) => {
    await requireOperator(ctx)
    const trimmed = assertRetirementConfirmation({ confirmed, reason })

    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: `Route not found: ${routeId}`,
      })
    }

    const arts = await ctx.db
      .query('curation_artifacts')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .take(100)
    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const evidence = extractLeverEvidence(arts)
    const eligible = isEligibleForRetirement({
      leverFailureReasons: evidence.leverFailureReasons,
      hasPassLever: evidence.hasPassLever,
      verificationVerdict: geom?.verification?.verdict ?? null,
      geometryStatus: route.geometryStatus ?? null,
      rideWorthinessVerdict: route.rideWorthiness?.verdict ?? null,
    })
    if (!eligible) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: `Route ${routeId} is not retirement-eligible (requires terminal failures for levers 1/2/3 with no lever PASS)`,
      })
    }

    const retiredAt = Date.now()
    await ctx.db.patch(route._id, {
      geometryStatus: 'retired',
      retiredAt,
      retirementReason: trimmed,
      riderReady: false,
    })

    await ctx.db.insert('curation_artifacts', {
      routeId,
      artifactType: 'disposition',
      disposition: 'retire',
      terminalState: 'retirement_eligible',
      reason: trimmed,
      confirmed: true,
      attemptedAt: retiredAt,
      createdAt: retiredAt,
    })

    return {
      routeId,
      disposition: 'retire' as const,
      geometryStatus: 'retired' as const,
      retiredAt: new Date(retiredAt).toISOString(),
      retirementReason: trimmed,
      riderReady: false,
      confirmed: true,
    }
  },
})

/**
 * Reversible un-retire: clears exclusion state, preserves route + evidence, recomputes riderReady.
 * Does NOT set riderReady=true without qualifying geometry/classifier evidence.
 */
export const unretireRoute = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireOperator(ctx)

    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: `Route not found: ${routeId}`,
      })
    }

    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    // Restore pre-retirement status from verification evidence — never forge generated
    const restoreStatus =
      geom?.verification?.verdict === 'pass' && geom.verification.geometryStatus === 'generated'
        ? ('generated' as const)
        : ('review' as const)

    // Clear exclusion only; keep retirementReason as historical evidence on the doc
    await ctx.db.patch(route._id, {
      geometryStatus: restoreStatus,
      retiredAt: undefined,
      riderReady: false,
    })

    // Recompute from current evidence (will stay false without gate-PASS + other predicates)
    await recomputeRiderReady(ctx, route._id)

    const now = Date.now()
    await ctx.db.insert('curation_artifacts', {
      routeId,
      artifactType: 'disposition',
      disposition: 'unretire',
      reason: route.retirementReason ?? undefined,
      attemptedAt: now,
      createdAt: now,
    })

    const updated = await ctx.db.get(route._id)
    return {
      routeId,
      disposition: 'unretire' as const,
      geometryStatus: updated?.geometryStatus ?? restoreStatus,
      retiredAt: null,
      riderReady: updated?.riderReady ?? false,
      routeDocId: route._id,
    }
  },
})

/** Operator-gated public recompute for tests / founder tools. */
export const recomputeRiderReadyPublic = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireOperator(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: `Route not found: ${routeId}`,
      })
    }
    await recomputeRiderReady(ctx, route._id)
    const updated = await ctx.db.get(route._id)
    return {
      routeId,
      riderReady: updated?.riderReady ?? false,
      geometryStatus: updated?.geometryStatus ?? null,
      retiredAt: updated?.retiredAt ?? null,
    }
  },
})
