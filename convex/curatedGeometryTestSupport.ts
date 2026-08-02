import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { action, mutation, query } from './_generated/server'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'

const TEPUSQUET_SUMMARY =
  'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia Road becomes Foxen Canyon Road. Foxen Canyon Road becomes Santa Maria Mesa Road. Santa Maria Mesa Road merges into Tepusquet Canyon Road. Head North on Tepusquet Canyon Road. Follow this all the way up the mountain and back down until you reach highway 166. Follow 166 West until you reach highway 101 again.'

/**
 * Cassette validator for the AC-5 repair-round replay. Mirrors the shape of
 * `cassetteValidator` in convex/actions/curatedGeometryReconstruct.ts — the
 * public wrapper has to re-declare it because Convex validators are values,
 * not types, and the action module is `'use node'`.
 */
const reconstructCassetteValidator = v.object({
  exchanges: v.array(
    v.object({
      seq: v.number(),
      provider: v.union(
        v.literal('google_routes'),
        v.literal('google_geocoding'),
        v.literal('anthropic'),
        v.literal('other'),
      ),
      url: v.string(),
      method: v.string(),
      requestBody: v.optional(v.string()),
      status: v.number(),
      responseBody: v.string(),
    }),
  ),
})

type ScoreOverrides = {
  compositeScore?: number
  curvatureScore?: number
  scenicScore?: number
  technicalScore?: number
  trafficScore?: number
  remotenessScore?: number
}

type CuratedSource =
  | 'fhwa'
  | 'scenic_byways'
  | 'motorcycleroads'
  | 'bestbikingroads'
  | 'rider_mag'
  | 'bdr'
  | 'editorial'

type RideWorthinessSeed = {
  verdict: 'ride' | 'marginal' | 'not_a_ride'
  reason: string
  model: string
  classifiedAt: number
}

async function insertTestRoute(
  ctx: any,
  row: {
    routeId: string
    name: string
    lengthMiles: number
    centroidLat?: number
    centroidLng?: number
    oneLiner?: string
    summary?: string
    name_lower?: string
    geometryStatus?: 'generated' | 'unresolved' | 'failed' | 'review'
    quarantine?: { reason: 'zero_length' | 'length_outlier' | 'test_row'; flaggedAt: number }
    state?: string
    source?: CuratedSource
    highwayNumber?: string
    candidateIdentifiers?: string[]
    /**
     * When true, omit/clear rideWorthiness so the classifier can write first
     * verdict. When false/undefined and rideWorthiness is also undefined, seed
     * a default 'ride' spike verdict (legacy test behavior).
     */
    clearRideWorthiness?: boolean
    rideWorthiness?: RideWorthinessSeed
    retiredAt?: number | null
    scores?: ScoreOverrides
  },
) {
  const resolveSource = (): CuratedSource => {
    if (row.source) return row.source
    if (row.routeId.startsWith('motorcycleroads:')) return 'motorcycleroads'
    return 'editorial'
  }

  const resolveRideWorthiness = (nowMs: number): RideWorthinessSeed | undefined => {
    if (row.clearRideWorthiness) return undefined
    if (row.rideWorthiness) return row.rideWorthiness
    return {
      verdict: 'ride',
      reason: 'spike seed',
      model: 'test',
      classifiedAt: nowMs,
    }
  }

  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
    .first()

  if (existing) {
    const nowMs = Date.now()
    const centroidLat = row.centroidLat ?? 34.95
    const centroidLng = row.centroidLng ?? -120.42
    const scores = row.scores ?? {}
    const rideWorthiness = resolveRideWorthiness(nowMs)
    await ctx.db.patch(existing._id, {
      name: row.name,
      lengthMiles: row.lengthMiles,
      centroidLat,
      centroidLng,
      // Keep centroid-derived fields consistent when a re-seed moves the route,
      // otherwise the row keeps stale bounds/location from its first seeding.
      boundsNeLat: centroidLat + 0.3,
      boundsNeLng: centroidLng + 0.3,
      boundsSwLat: centroidLat - 0.3,
      boundsSwLng: centroidLng - 0.3,
      location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
      compositeScore: scores.compositeScore ?? 85,
      // Score fields are REQUIRED by the schema — patching them with an
      // undefined override deletes the field and the write is rejected. Only
      // patch a score when the caller actually supplied one.
      ...(scores.curvatureScore != null ? { curvatureScore: scores.curvatureScore } : {}),
      ...(scores.scenicScore != null ? { scenicScore: scores.scenicScore } : {}),
      ...(scores.technicalScore != null ? { technicalScore: scores.technicalScore } : {}),
      ...(scores.trafficScore != null ? { trafficScore: scores.trafficScore } : {}),
      ...(scores.remotenessScore != null ? { remotenessScore: scores.remotenessScore } : {}),
      // undefined clears the field (classifier tests need unclassified rows)
      rideWorthiness,
      quarantine: row.quarantine,
      retiredAt: row.retiredAt === null ? undefined : row.retiredAt,
      duplicateOf: undefined,
      source: resolveSource(),
      ...(row.oneLiner != null ? { oneLiner: row.oneLiner } : {}),
      ...(row.summary != null ? { summary: row.summary } : {}),
      ...(row.name_lower != null ? { name_lower: row.name_lower } : {}),
      ...(row.geometryStatus != null ? { geometryStatus: row.geometryStatus } : {}),
      ...(row.state != null ? { state: row.state } : {}),
      ...(row.highwayNumber != null ? { highwayNumber: row.highwayNumber } : {}),
      ...(row.candidateIdentifiers != null
        ? { candidateIdentifiers: row.candidateIdentifiers }
        : {}),
    })
    // Keep the geospatial index in step with a moved centroid.
    await geospatial.insert(
      ctx,
      existing._id,
      { latitude: centroidLat, longitude: centroidLng },
      { state: row.state ?? 'California', primaryArchetype: 'twisties' },
      scores.compositeScore ?? 85,
    )
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: existing._id,
    })
    return { routeId: row.routeId, id: existing._id, created: false, refreshed: true }
  }

  const centroidLat = row.centroidLat ?? 34.95
  const centroidLng = row.centroidLng ?? -120.42
  const nowMs = Date.now()
  const scores = row.scores ?? {}
  const rideWorthiness = resolveRideWorthiness(nowMs)
  const docId = await ctx.db.insert('curated_routes', {
    routeId: row.routeId,
    name: row.name,
    state: row.state ?? 'California',
    source: resolveSource(),
    primaryArchetype: 'twisties',
    secondaryTags: ['test'],
    centroidLat,
    centroidLng,
    boundsNeLat: centroidLat + 0.3,
    boundsNeLng: centroidLng + 0.3,
    boundsSwLat: centroidLat - 0.3,
    boundsSwLng: centroidLng - 0.3,
    lengthMiles: row.lengthMiles,
    compositeScore: scores.compositeScore ?? 85,
    curvatureScore: scores.curvatureScore ?? 90,
    scenicScore: scores.scenicScore ?? 80,
    technicalScore: scores.technicalScore ?? 85,
    trafficScore: scores.trafficScore ?? 75,
    remotenessScore: scores.remotenessScore ?? 70,
    oneLiner: row.oneLiner ?? (row.routeId.includes('tepusquet') ? '' : 'Test route'),
    summary:
      row.summary ?? (row.routeId.includes('tepusquet') ? TEPUSQUET_SUMMARY : 'Test route summary'),
    badges: [],
    season: 'year_round',
    contentVersion: 1,
    seededAt: nowMs,
    location: { type: 'Point', coordinates: [centroidLng, centroidLat] },
    ...(rideWorthiness != null ? { rideWorthiness } : {}),
    quarantine: row.quarantine,
    ...(row.retiredAt != null ? { retiredAt: row.retiredAt } : {}),
    ...(row.name_lower != null ? { name_lower: row.name_lower } : {}),
    ...(row.geometryStatus != null ? { geometryStatus: row.geometryStatus } : {}),
    ...(row.highwayNumber != null ? { highwayNumber: row.highwayNumber } : {}),
    ...(row.candidateIdentifiers != null ? { candidateIdentifiers: row.candidateIdentifiers } : {}),
  })

  await geospatial.insert(
    ctx,
    docId,
    { latitude: centroidLat, longitude: centroidLng },
    { state: row.state ?? 'California', primaryArchetype: 'twisties' },
    scores.compositeScore ?? 85,
  )

  return { routeId: row.routeId, id: docId, created: true }
}

export const seedPoCRoute = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'motorcycleroads:twist-of-tepusquet-loop',
      name: 'Twist of Tepusquet Loop',
      lengthMiles: 41,
    })
  },
})

export const seedBoundaryRatioRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const rows = [
      { routeId: 'test:ratio-100', name: 'Ratio 1.00', lengthMiles: 41 },
      { routeId: 'test:ratio-061', name: 'Ratio 0.61', lengthMiles: 100 },
      { routeId: 'test:ratio-159', name: 'Ratio 1.59', lengthMiles: 100 },
      { routeId: 'test:ratio-059', name: 'Ratio 0.59', lengthMiles: 100 },
      { routeId: 'test:ratio-161', name: 'Ratio 1.61', lengthMiles: 100 },
    ]
    const results = []
    for (const row of rows) {
      results.push(await insertTestRoute(ctx, row))
    }
    return results
  },
})

export const seedDegenerateRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:degenerate-2pt',
        name: 'Degenerate 2pt',
        lengthMiles: 40,
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:degenerate-10pt-50mi',
        name: 'Degenerate 10pt/50mi',
        lengthMiles: 50,
      }),
    ]
  },
})

export const seedQuarantinedLengthRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:quarantined-null-length',
      name: 'Quarantined null length',
      lengthMiles: 0,
      quarantine: { reason: 'zero_length', flaggedAt: Date.now() },
    })
  },
})

/**
 * AC-4 CASE A: quarantined route carrying a REAL out-of-band ratio.
 *
 * claimed 100mi vs routed 22mi → real ratio 0.22 (far outside the 0.6–1.6 band).
 * The ratio is computed and non-null; the quarantine flag is what skips the band
 * check. Twinned with `seedUnquarantinedOutOfBandRatioRow` below — the two rows
 * are IDENTICAL except for the quarantine flag, which is the only variable.
 */
export const seedQuarantinedOutOfBandRatioRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:quarantined-ratio-022',
      name: 'Quarantined ratio 0.22',
      lengthMiles: 100,
      quarantine: { reason: 'length_outlier', flaggedAt: Date.now() },
    })
  },
})

/**
 * AC-4 CASE B: the discriminating twin — IDENTICAL geometry and claimed length
 * to `seedQuarantinedOutOfBandRatioRow` (real ratio 0.22) but with NO quarantine
 * flag. Deleting the quarantine branch collapses CASE A onto this row.
 */
export const seedUnquarantinedOutOfBandRatioRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:unquarantined-ratio-022',
      name: 'Unquarantined ratio 0.22',
      lengthMiles: 100,
      // quarantine intentionally omitted — this is the discriminator
    })
  },
})

/**
 * AC-4 CASE C: quarantined route with 3-point geometry — proves quarantine does
 * NOT bypass the degenerate check.
 */
export const seedQuarantinedDegenerateRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:quarantined-degenerate-3pt',
      name: 'Quarantined degenerate 3pt',
      lengthMiles: 100,
      quarantine: { reason: 'length_outlier', flaggedAt: Date.now() },
    })
  },
})

export const seedAnchorTestRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:single-anchor',
        name: 'Single anchor',
        lengthMiles: 41,
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:mixed-anchors',
        name: 'Mixed anchors',
        lengthMiles: 41,
      }),
      // AC-2 CASE 1 fixture `anchors-sufficient-in-region`: 2 anchors within
      // 150mi of centroid (34.95, -120.42), claimed 41mi routed 41mi → ratio 1.0.
      await insertTestRoute(ctx, {
        routeId: 'test:anchors-sufficient',
        name: 'Sufficient Anchors',
        lengthMiles: 41,
        centroidLat: 34.95,
        centroidLng: -120.42,
      }),
    ]
  },
})

export const teardownPoCRoute = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', 'motorcycleroads:twist-of-tepusquet-loop'))
      .first()

    if (doc) {
      await geospatial.remove(ctx, doc._id)
      const geomRow = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
        .first()
      if (geomRow) await ctx.db.delete(geomRow._id)
      await ctx.db.delete(doc._id)
    }
    return { status: 'deleted' }
  },
})

const POC_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'

async function getPoCRouteDoc(ctx: {
  db: { query: (table: 'curated_routes') => any }
}): Promise<Doc<'curated_routes'> | null> {
  return ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', POC_ROUTE_ID))
    .first()
}

export const recomputeRiderReadyForPoC = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const doc = await getPoCRouteDoc(ctx)
    if (!doc) throw new Error(`Missing PoC route: ${POC_ROUTE_ID}`)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, { id: doc._id })
    const refreshed = (await ctx.db.get(doc._id)) as Doc<'curated_routes'> | null
    return { routeId: POC_ROUTE_ID, riderReady: refreshed?.riderReady ?? false }
  },
})

export const restorePoCRouteAllGood = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const doc = await getPoCRouteDoc(ctx)
    if (!doc) throw new Error(`Missing PoC route: ${POC_ROUTE_ID}`)
    const nowMs = Date.now()
    await ctx.db.patch(doc._id, {
      name: 'Twist of Tepusquet Loop',
      compositeScore: 85,
      lengthMiles: 41,
      rideWorthiness: {
        verdict: 'ride',
        reason: 'spike seed',
        model: 'test',
        evidenceComplete: true,
        classifiedAt: nowMs,
      },
      retiredAt: null,
      duplicateOf: undefined,
      quarantine: undefined,
      geometryStatus: 'generated',
    })

    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', POC_ROUTE_ID))
      .first()

    if (geomRow?.verification) {
      await ctx.db.patch(geomRow._id, {
        verification: {
          ...geomRow.verification,
          verdict: 'pass',
          geometryStatus: 'generated',
          failedCondition: undefined,
        },
      })
    }

    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, { id: doc._id })
    const refreshed = (await ctx.db.get(doc._id)) as Doc<'curated_routes'> | null
    return { routeId: POC_ROUTE_ID, riderReady: refreshed?.riderReady ?? false }
  },
})

type FlipKey = 'geometry' | 'name' | 'score' | 'length' | 'rideWorthiness' | 'retired' | 'duplicate'

export const flipPoCRiderReadyInput = mutation({
  args: {
    input: v.union(
      v.literal('geometry'),
      v.literal('name'),
      v.literal('score'),
      v.literal('length'),
      v.literal('rideWorthiness'),
      v.literal('retired'),
      v.literal('duplicate'),
    ),
  },
  handler: async (ctx, { input }) => {
    await requireIdentity(ctx)
    const doc = await getPoCRouteDoc(ctx)
    if (!doc) throw new Error(`Missing PoC route: ${POC_ROUTE_ID}`)

    switch (input as FlipKey) {
      case 'geometry': {
        await ctx.db.patch(doc._id, { geometryStatus: 'review' })
        const geomRow = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', POC_ROUTE_ID))
          .first()
        if (geomRow?.verification) {
          await ctx.db.patch(geomRow._id, {
            verification: {
              ...geomRow.verification,
              verdict: 'review',
              geometryStatus: 'review',
              failedCondition: 'ratio',
            },
          })
        }
        break
      }
      case 'name':
        await ctx.db.patch(doc._id, { name: '' })
        break
      case 'score':
        await ctx.db.patch(doc._id, { compositeScore: 10 })
        break
      case 'length':
        await ctx.db.patch(doc._id, { lengthMiles: 0 })
        break
      case 'rideWorthiness':
        await ctx.db.patch(doc._id, {
          rideWorthiness: {
            verdict: 'not_a_ride',
            reason: 'flip test',
            model: 'test',
            evidenceComplete: true,
            classifiedAt: Date.now(),
          },
        })
        break
      case 'retired':
        await ctx.db.patch(doc._id, { retiredAt: Date.now() })
        break
      case 'duplicate':
        await ctx.db.patch(doc._id, { duplicateOf: 'shadow:duplicate-test' })
        break
      default:
        break
    }

    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, { id: doc._id })
    const refreshed = (await ctx.db.get(doc._id)) as Doc<'curated_routes'> | null
    return { flipped: input, riderReady: refreshed?.riderReady ?? false }
  },
})

export const teardownAllTestRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const testRouteIds = [
      'test:ratio-061',
      'test:ratio-159',
      'test:ratio-059',
      'test:ratio-161',
      'test:ratio-100',
      'test:degenerate-2pt',
      'test:degenerate-10pt-50mi',
      'test:quarantined-null-length',
      'test:single-anchor',
      'test:mixed-anchors',
      'test:anchors-sufficient',
      'test:quarantined-ratio-022',
      'test:unquarantined-ratio-022',
      'test:quarantined-degenerate-3pt',
    ]

    let deleted = 0
    for (const routeId of testRouteIds) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (doc) {
        await geospatial.remove(ctx, doc._id)
        const geomRow = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
          .first()
        if (geomRow) await ctx.db.delete(geomRow._id)
        await ctx.db.delete(doc._id)
        deleted++
      }
    }
    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// HYG (Sprint 03 catalog hygiene): editorial score-scale seeders
// ---------------------------------------------------------------------------

/** Query a test route by routeId for integration test verification. */
export const getTestRoute = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    return doc
  },
})

/**
 * Deterministic centroid jitter from a seed string so concurrent hygiene seeds
 * do not all write the same geospatial `pointsByFilterKey` cell (OCC storms).
 * Pure — exported for unit tests.
 */
export function hygieneCentroidForSeed(seed: string): { lat: number; lng: number } {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  // Keep within a small CA corridor around the legacy default (34.95, -120.42)
  const lat = 34.9 + ((h >>> 0) % 1000) / 10000
  const lng = -120.5 + ((h >>> 8) % 1000) / 10000
  return { lat, lng }
}

/**
 * Seed 3 editorial rows with out-of-scale (0–100) composite + dimension scores.
 *
 * Always runId-namespaced (optional arg; auto-generated if omitted) so concurrent
 * test/hygiene callers do not collide on fixed routeIds or the same geospatial
 * filter-key document (see OCC on pointsByFilterKey). Prefer
 * seedEditorialScoreRowsNamespaced when the caller already has a runId.
 */
export const seedEditorialScoreRows = mutation({
  args: { runId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const runId =
      args.runId ?? `auto-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    const rows: Array<{
      routeId: string
      name: string
      scores: {
        compositeScore: number
        curvatureScore: number
        scenicScore: number
        technicalScore: number
        trafficScore: number
        remotenessScore: number
      }
    }> = [
      {
        routeId: `test:hyg:${runId}:score-90`,
        name: `Hygiene Score 90 (${runId})`,
        scores: {
          compositeScore: 90,
          curvatureScore: 88,
          scenicScore: 84,
          technicalScore: 80,
          trafficScore: 76,
          remotenessScore: 70,
        },
      },
      {
        routeId: `test:hyg:${runId}:score-72`,
        name: `Hygiene Score 72 (${runId})`,
        scores: {
          compositeScore: 72,
          curvatureScore: 70,
          scenicScore: 65,
          technicalScore: 60,
          trafficScore: 55,
          remotenessScore: 50,
        },
      },
      {
        routeId: `test:hyg:${runId}:score-85`,
        name: `Hygiene Score 85 (${runId})`,
        scores: {
          compositeScore: 85,
          curvatureScore: 82,
          scenicScore: 78,
          technicalScore: 74,
          trafficScore: 70,
          remotenessScore: 65,
        },
      },
    ]
    return Promise.all(
      rows.map(async (row) => {
        const { lat, lng } = hygieneCentroidForSeed(row.routeId)
        return insertTestRoute(ctx, {
          routeId: row.routeId,
          name: row.name,
          lengthMiles: 41,
          centroidLat: lat,
          centroidLng: lng,
          scores: row.scores,
        })
      }),
    )
  },
})

/** Seed 1 already-in-scale control row (compositeScore 0.85, all dimensions ≤ 1). */
export const seedInScaleControlRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:hyg-score-inscale',
      name: 'Hygiene In-Scale Control',
      lengthMiles: 41,
      scores: {
        compositeScore: 0.85,
        curvatureScore: 0.88,
        scenicScore: 0.84,
        technicalScore: 0.8,
        trafficScore: 0.76,
        remotenessScore: 0.7,
      },
    })
  },
})

/**
 * REDHAT-FIX-001: Seed 3 mixed-scale rows for the mixed-scale dimension guard tests.
 *
 * - test:hyg-mixed-001: compositeScore=0.85 (in-scale), curvatureScore=88 (out-of-scale),
 *   scenicScore=0.84 (in-scale), technicalScore=75 (out-of-scale),
 *   trafficScore=0.76 (in-scale), remotenessScore=70 (out-of-scale) — MIXED scale.
 * - test:hyg-mixed-all-inscale: ALL score fields ≤1 — in-scale control, must be untouched.
 * - test:hyg-mixed-all-out: ALL score fields >1 — out-of-scale regression guard.
 */
export const seedMixedScaleRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-mixed-001',
        name: 'Mixed Scale Row',
        lengthMiles: 41,
        scores: {
          compositeScore: 0.85,
          curvatureScore: 88,
          scenicScore: 0.84,
          technicalScore: 75,
          trafficScore: 0.76,
          remotenessScore: 70,
        },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-mixed-all-inscale',
        name: 'All In-Scale Control',
        lengthMiles: 41,
        scores: {
          compositeScore: 0.9,
          curvatureScore: 0.88,
          scenicScore: 0.84,
          technicalScore: 0.8,
          trafficScore: 0.76,
          remotenessScore: 0.7,
        },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-mixed-all-out',
        name: 'All Out-Of-Scale Regression',
        lengthMiles: 41,
        scores: {
          compositeScore: 90,
          curvatureScore: 88,
          scenicScore: 84,
          technicalScore: 80,
          trafficScore: 76,
          remotenessScore: 70,
        },
      }),
    ]
  },
})

// ---------------------------------------------------------------------------
// REDHAT-FIX-003: runId-namespaced seed/teardown for concurrent-dev isolation
// (F-4: prevents concurrent test runs from colliding on shared dev deployment)
// ---------------------------------------------------------------------------

/**
 * Seed 2 editorial rows namespaced by runId for concurrency-isolation tests.
 * routeId pattern: test:hyg:{runId}:score-90 / test:hyg:{runId}:score-72
 */
export const seedEditorialScoreRowsNamespaced = mutation({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: `test:hyg:${runId}:score-90`,
        name: `Hygiene Score 90 (${runId})`,
        lengthMiles: 41,
        scores: {
          compositeScore: 90,
          curvatureScore: 88,
          scenicScore: 84,
          technicalScore: 80,
          trafficScore: 76,
          remotenessScore: 70,
        },
      }),
      await insertTestRoute(ctx, {
        routeId: `test:hyg:${runId}:score-72`,
        name: `Hygiene Score 72 (${runId})`,
        lengthMiles: 41,
        scores: {
          compositeScore: 72,
          curvatureScore: 70,
          scenicScore: 65,
          technicalScore: 60,
          trafficScore: 55,
          remotenessScore: 50,
        },
      }),
    ]
  },
})

/**
 * Seed 2 editorial rows with custom scores namespaced by runId.
 * Used by concurrency tests that need distinct values per namespace (alpha/beta).
 * routeId pattern: test:hyg:{runId}:score-85 / test:hyg:{runId}:score-70
 */
export const seedCustomScoreRowsNamespaced = mutation({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: `test:hyg:${runId}:score-85`,
        name: `Hygiene Score 85 (${runId})`,
        lengthMiles: 41,
        scores: {
          compositeScore: 85,
          curvatureScore: 82,
          scenicScore: 78,
          technicalScore: 74,
          trafficScore: 70,
          remotenessScore: 65,
        },
      }),
      await insertTestRoute(ctx, {
        routeId: `test:hyg:${runId}:score-70`,
        name: `Hygiene Score 70 (${runId})`,
        lengthMiles: 41,
        scores: {
          compositeScore: 70,
          curvatureScore: 68,
          scenicScore: 62,
          technicalScore: 58,
          trafficScore: 52,
          remotenessScore: 48,
        },
      }),
    ]
  },
})

/**
 * Teardown hygiene test rows for a specific runId namespace only.
 * Deletes rows whose routeId starts with `test:hyg:{runId}:`.
 * Does NOT touch rows from other runIds — safe for concurrent test runs.
 */
export const teardownHygieneScoreRowsByRunId = mutation({
  args: { runId: v.string() },
  handler: async (ctx, { runId }) => {
    await requireIdentity(ctx)
    const prefix = `test:hyg:${runId}:`
    const upperBound = `${prefix}\uffff`
    const rows = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.gte('routeId', prefix).lt('routeId', upperBound))
      .collect()

    let deleted = 0
    for (const doc of rows) {
      await geospatial.remove(ctx, doc._id)
      const geomRow = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
        .first()
      if (geomRow) await ctx.db.delete(geomRow._id)
      await ctx.db.delete(doc._id)
      deleted++
    }
    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// REDHAT-FIX-004: paginated seed helpers for multi-batch cursor-loop tests
// ---------------------------------------------------------------------------

/**
 * Seed 10 out-of-scale rows + 1 in-scale control for multi-batch pagination tests.
 * routeId prefix: test:hyg-pag-*
 * With batchSize=3, ceil(10/3)=4 batches are needed.
 */
export const seedPaginatedScoreRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const scores = [95, 88, 92, 76, 84, 98, 70, 82, 94, 86]
    const results = []
    for (let i = 0; i < scores.length; i++) {
      const num = String(i + 1).padStart(2, '0')
      const composite = scores[i]
      const results_item = await insertTestRoute(ctx, {
        routeId: `test:hyg-pag-${num}`,
        name: `Paginated Score ${composite}`,
        lengthMiles: 41,
        scores: {
          compositeScore: composite,
          curvatureScore: composite - 2,
          scenicScore: composite - 4,
          technicalScore: composite - 6,
          trafficScore: composite - 8,
          remotenessScore: composite - 10,
        },
      })
      results.push(results_item)
    }
    // In-scale control row — scanned but NOT normalized across batches
    results.push(
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-pag-inscale',
        name: 'Paginated In-Scale Control',
        lengthMiles: 41,
        scores: {
          compositeScore: 0.85,
          curvatureScore: 0.88,
          scenicScore: 0.84,
          technicalScore: 0.8,
          trafficScore: 0.76,
          remotenessScore: 0.7,
        },
      }),
    )
    return results
  },
})

/** Teardown all paginated test rows (test:hyg-pag-*). */
export const teardownPaginatedScoreRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const prefix = 'test:hyg-pag-'
    const upperBound = `${prefix}\uffff`
    const rows = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.gte('routeId', prefix).lt('routeId', upperBound))
      .collect()

    let deleted = 0
    for (const doc of rows) {
      await geospatial.remove(ctx, doc._id)
      const geomRow = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
        .first()
      if (geomRow) await ctx.db.delete(geomRow._id)
      await ctx.db.delete(doc._id)
      deleted++
    }
    return { status: 'deleted', count: deleted }
  },
})

/** Teardown all hygiene test rows and reset scoreScaleNormalizedAt. */
export const teardownHygieneScoreRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const hygieneRouteIds = [
      'test:hyg-score-90',
      'test:hyg-score-72',
      'test:hyg-score-85',
      'test:hyg-score-inscale',
      'test:hyg-mixed-001',
      'test:hyg-mixed-all-inscale',
      'test:hyg-mixed-all-out',
      'test:hyg-pag-inscale',
    ]

    let deleted = 0
    for (const routeId of hygieneRouteIds) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (doc) {
        await geospatial.remove(ctx, doc._id)
        const geomRow = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
          .first()
        if (geomRow) await ctx.db.delete(geomRow._id)
        await ctx.db.delete(doc._id)
        deleted++
      }
    }
    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// S3-T2: Dedup group seed/teardown helpers
// ---------------------------------------------------------------------------

const CHEROHALA_LAT = 35.34
const CHEROHALA_LNG = -83.93

/**
 * Seed 3 rows named 'Cherohala Skyway' at the same centroid (~35.34, -83.93).
 * The highest-score row (0.91) has geometryStatus='generated' (gate-passing).
 * RouteIds: test:cherohala-canonical, test:cherohala-shadow-a, test:cherohala-shadow-b
 */
export const seedDedupeGroup = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:cherohala-canonical',
        name: 'Cherohala Skyway',
        name_lower: 'cherohala skyway',
        lengthMiles: 41,
        centroidLat: CHEROHALA_LAT,
        centroidLng: CHEROHALA_LNG,
        geometryStatus: 'generated',
        scores: { compositeScore: 0.91 },
        highwayNumber: 'us-129',
        state: 'Test Shadow State',
        candidateIdentifiers: ['cherohala-candidate-unique', 'nc-143'],
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:cherohala-shadow-a',
        name: 'Cherohala Skyway',
        name_lower: 'cherohala skyway',
        lengthMiles: 41,
        centroidLat: CHEROHALA_LAT,
        centroidLng: CHEROHALA_LNG,
        scores: { compositeScore: 0.85 },
        highwayNumber: 'us-129',
        state: 'Test Shadow State',
        candidateIdentifiers: ['cherohala-candidate-unique', 'nc-143'],
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:cherohala-shadow-b',
        name: 'Cherohala Skyway',
        name_lower: 'cherohala skyway',
        lengthMiles: 41,
        centroidLat: CHEROHALA_LAT,
        centroidLng: CHEROHALA_LNG,
        scores: { compositeScore: 0.8 },
        highwayNumber: 'us-129',
        state: 'Test Shadow State',
        candidateIdentifiers: ['cherohala-candidate-unique', 'nc-143'],
      }),
    ]
  },
})

/**
 * Seed 2 rows named 'Deals Gap Loop' at the same centroid.
 * One with compositeScore=0.88 + geometryStatus='review' (NOT gate-passing),
 * one with compositeScore=0.80 + geometryStatus='generated' (gate-passing).
 * The gate-passing lower-score row should be selected as canonical.
 */
export const seedPrecedenceGroup = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:deals-highscore-review',
        name: 'Deals Gap Loop',
        name_lower: 'deals gap loop',
        lengthMiles: 41,
        centroidLat: 35.35,
        centroidLng: -83.94,
        geometryStatus: 'review',
        scores: { compositeScore: 0.88 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:deals-lowscore-passing',
        name: 'Deals Gap Loop',
        name_lower: 'deals gap loop',
        lengthMiles: 41,
        centroidLat: 35.35,
        centroidLng: -83.94,
        geometryStatus: 'generated',
        scores: { compositeScore: 0.8 },
      }),
    ]
  },
})

/**
 * Seed 4 control rows that should NOT merge:
 * - 2 distinct names ('Blue Ridge Parkway', 'Tail of the Dragon')
 * - 2 same-name 'Cherohala Skyway' but >2000mi apart (NC vs CA)
 */
export const seedNoMergeControl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:distinct-blueridge',
        name: 'Blue Ridge Parkway',
        name_lower: 'blue ridge parkway',
        lengthMiles: 41,
        centroidLat: 35.5,
        centroidLng: -82.5,
        scores: { compositeScore: 0.9 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:distinct-tail',
        name: 'Tail of the Dragon',
        name_lower: 'tail of the dragon',
        lengthMiles: 41,
        centroidLat: 35.48,
        centroidLng: -83.92,
        scores: { compositeScore: 0.92 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:cherohala-far-nc',
        name: 'Cherohala Skyway',
        name_lower: 'cherohala skyway',
        lengthMiles: 41,
        centroidLat: 35.3,
        centroidLng: -83.9,
        scores: { compositeScore: 0.87 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:cherohala-far-ca',
        name: 'Cherohala Skyway',
        name_lower: 'cherohala skyway',
        lengthMiles: 41,
        centroidLat: 34.9,
        centroidLng: -120.4,
        scores: { compositeScore: 0.7 },
      }),
    ]
  },
})

/**
 * Teardown all dedupe test rows.
 * Deletes rows whose routeId starts with test:cherohala-, test:deals-, test:distinct-.
 */
export const teardownDedupeRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const prefixes = ['test:cherohala-', 'test:deals-', 'test:distinct-']

    let deleted = 0
    for (const prefix of prefixes) {
      const upperBound = `${prefix}\uffff`
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.gte('routeId', prefix).lt('routeId', upperBound))
        .collect()

      for (const doc of rows) {
        await geospatial.remove(ctx, doc._id)
        const geomRow = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
          .first()
        if (geomRow) await ctx.db.delete(geomRow._id)
        await ctx.db.delete(doc._id)
        deleted++
      }
    }
    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// S3-T3: Length-outlier, test-row, and dirty-state seed/teardown helpers
// ---------------------------------------------------------------------------

/**
 * Seed 2 rows with length outliers for fixLengthOutliers tests.
 * - test:hyg-len-zero: lengthMiles=0 (zero_length outlier)
 * - test:hyg-len-5000: lengthMiles=5000 (length_outlier)
 * Both with normal scores (compositeScore=0.85).
 */
export const seedLengthOutlierRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-len-zero',
        name: 'Length Zero Route',
        lengthMiles: 0,
        scores: { compositeScore: 0.85 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-len-5000',
        name: 'Length 5000 Route',
        lengthMiles: 5000,
        scores: { compositeScore: 0.85 },
      }),
    ]
  },
})

/**
 * Seed 1 test-named row for quarantineTestRows tests.
 * - test:hyg-testrow: name='Test Route CO-04', lengthMiles=41
 */
export const seedTestRowForQuarantine = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:hyg-testrow',
      name: 'Test Route CO-04',
      lengthMiles: 41,
      scores: { compositeScore: 0.85 },
    })
  },
})

/**
 * Seed 4 rows with dirty state strings for normalizeStates tests.
 * - test:hyg-state-ny: state='New-York' (dashed)
 * - test:hyg-state-nc: state='North-Carolina' (dashed)
 * - test:hyg-state-tri: state='Alabama / Mississippi / Tennessee' (multi-state)
 * - test:hyg-state-canon: state='North Carolina' (already canonical control)
 */
export const seedDirtyStateRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-state-ny',
        name: 'Dirty State NY',
        lengthMiles: 41,
        state: 'New-York',
        scores: { compositeScore: 0.85 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-state-nc',
        name: 'Dirty State NC',
        lengthMiles: 41,
        state: 'North-Carolina',
        scores: { compositeScore: 0.85 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-state-tri',
        name: 'Dirty State Tri',
        lengthMiles: 41,
        state: 'Alabama / Mississippi / Tennessee',
        scores: { compositeScore: 0.85 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-state-canon',
        name: 'Canonical State NC',
        lengthMiles: 41,
        state: 'North Carolina',
        scores: { compositeScore: 0.85 },
      }),
    ]
  },
})

/**
 * Seed 3 rows that WOULD be rider-ready (gate-passing geometry + compositeScore
 * on the 0–100 scale) so the quarantine→riderReady exclusion can be verified
 * end-to-end. Without quarantine these rows recompute riderReady=true; after
 * the hygiene handlers quarantine them, riderReady MUST flip to false.
 *
 * - test:hyg-rr-outlier: lengthMiles=5000 (>1000 → length_outlier quarantine)
 * - test:hyg-rr-testrow: name='Test Route CO-04' (→ test_row quarantine)
 * - test:hyg-rr-control: lengthMiles=41, normal name — stays rider-ready (control)
 *
 * Each row gets a gate-passing curated_route_geometry side-table entry
 * (verification.verdict='pass', geometryStatus='generated') so the predicate
 * sees gatePass=true.
 */
export const seedRiderReadyCandidates = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)

    const candidates = [
      {
        routeId: 'test:hyg-rr-outlier',
        name: 'Rider Ready Outlier',
        lengthMiles: 5000,
        geometryStatus: 'generated' as const,
      },
      {
        routeId: 'test:hyg-rr-testrow',
        name: 'Test Route CO-04',
        lengthMiles: 41,
        geometryStatus: 'generated' as const,
      },
      {
        routeId: 'test:hyg-rr-control',
        name: 'Rider Ready Control',
        lengthMiles: 41,
        geometryStatus: 'generated' as const,
      },
    ]

    const results = []
    for (const c of candidates) {
      // insertTestRoute defaults compositeScore to 85 (>= 50 threshold)
      const result = await insertTestRoute(ctx, {
        routeId: c.routeId,
        name: c.name,
        lengthMiles: c.lengthMiles,
        geometryStatus: c.geometryStatus,
      })

      // Insert gate-passing geometry in the side table
      const existingGeom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', c.routeId))
        .first()

      const geomDoc = {
        routeId: c.routeId,
        format: 'polyline' as const,
        encoding: 'utf-8',
        precision: 5,
        value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        verification: {
          routeId: c.routeId,
          verdict: 'pass' as const,
          geometryStatus: 'generated' as const,
          geometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
          anchorCount: 2,
          anchors: [
            { lat: 34.95, lng: -120.42, formatted: 'Start', distanceFromCentroid: 0 },
            { lat: 34.96, lng: -120.43, formatted: 'End', distanceFromCentroid: 1 },
          ],
          pointCount: 5,
          degenerate: false,
          ratio: 1.0,
          claimedMiles: c.lengthMiles,
          routedMiles: c.lengthMiles,
        },
      }

      if (existingGeom) {
        await ctx.db.replace(existingGeom._id, geomDoc)
      } else {
        await ctx.db.insert('curated_route_geometry', geomDoc)
      }

      // Recompute riderReady — should be true (gate-passing, score≥50, etc.)
      await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
        id: result.id,
      })
      results.push(result)
    }
    return results
  },
})

/**
 * Seed 1 row for the length-recovery test (S3-T3 AC-4).
 * - test:hyg-len-recover: lengthMiles=0, not yet quarantined.
 *
 * The test runs fixLengthOutliers to quarantine it, then calls
 * persistGeometryVerified with routedMiles=22.0 to verify the auto-clear.
 */
export const seedLengthRecoveryRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:hyg-len-recover',
      name: 'Length Recovery Row',
      lengthMiles: 0,
    })
  },
})

/**
 * Seed 1 row for the score×state cross-pass regression test (REDHAT H-1).
 *
 * - test:hyg-cross-001: compositeScore=88 (0–100 scale, needs ÷100),
 *   state='North-Carolina' (dirty, needs canonicalization),
 *   geometryStatus='generated' + gate-passing geometry side-table entry.
 *
 * This row is designed to be processed by BOTH normalizeEditorialScores
 * (÷100 → 0.88) AND normalizeStates (state canonicalization triggers
 * recomputeRiderReadyForRoute). Without the scale-aware predicate fix,
 * the recompute would evaluate 0.88 >= 50 → false → riderReady silently
 * flipped to false. With the fix, 0.88 >= 0.5 → true → riderReady preserved.
 */
export const seedScoreStateCrossPassRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)

    const routeId = 'test:hyg-cross-001'
    const result = await insertTestRoute(ctx, {
      routeId,
      name: 'Cross Pass Regression Row',
      lengthMiles: 41,
      state: 'North-Carolina',
      geometryStatus: 'generated' as const,
      scores: { compositeScore: 88 },
    })

    // Insert gate-passing geometry in the side table
    const existingGeom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
      .first()

    const geomDoc = {
      routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      verification: {
        routeId,
        verdict: 'pass' as const,
        geometryStatus: 'generated' as const,
        geometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        anchorCount: 2,
        anchors: [
          { lat: 34.95, lng: -120.42, formatted: 'Start', distanceFromCentroid: 0 },
          { lat: 34.96, lng: -120.43, formatted: 'End', distanceFromCentroid: 1 },
        ],
        pointCount: 5,
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

    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    return result
  },
})

/**
 * Teardown all S3-T3 quarantine + state hygiene test rows.
 * Deletes rows whose routeId starts with test:hyg-len-, test:hyg-testrow, test:hyg-state-.
 */
export const teardownQuarantineStateRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const prefixes = [
      'test:hyg-len-',
      'test:hyg-testrow',
      'test:hyg-state-',
      'test:hyg-rr-',
      'test:hyg-cross-',
    ]

    let deleted = 0
    for (const prefix of prefixes) {
      const upperBound = `${prefix}\uffff`
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.gte('routeId', prefix).lt('routeId', upperBound))
        .collect()

      for (const doc of rows) {
        await geospatial.remove(ctx, doc._id)
        const geomRow = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
          .first()
        if (geomRow) await ctx.db.delete(geomRow._id)
        await ctx.db.delete(doc._id)
        deleted++
      }
    }
    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// S4-T1: Deterministic geometry gate — seed/teardown helpers
// ---------------------------------------------------------------------------

/** Haversine distance helper for seed data (mirrors curatedGeometryGate). */
function haversineHelper(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
): number {
  const R = 3958.8
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const la1 = toRad(p1.lat)
  const la2 = toRad(p2.lat)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.asin(Math.sqrt(a))
  return R * c
}

/**
 * AC-5 CASE 1 — `repair-round-two-attempts-better-second`.
 *
 * A REAL route description (Highway 1 through Big Sur, Carmel → San Simeon)
 * carrying a claimed length of 100mi. Nothing here designs the outcome: the
 * anchors come from the live LLM, the distances come from Google Routes, and
 * the recorded exchange log is whatever those providers returned.
 *
 * This route was SELECTED for this case because its recorded behaviour exhibits
 * the property the AC needs — the first attempt lands outside the 0.6–1.6 band
 * and the feedback-driven repair attempt lands inside it. The property is read
 * off the recording; it is never dictated onto it.
 */
export const seedRepairRoundRoute = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:repair-round',
      name: 'Repair Round Test',
      lengthMiles: 100,
      centroidLat: 34.6,
      centroidLng: -119.3,
      oneLiner: 'Highway 33 out-and-back over Pine Mountain',
      summary:
        'Start in Ojai, CA and ride north on Highway 33 through Wheeler Gorge. Continue past the Rose Valley turnoff and climb over Pine Mountain Summit. Drop down through the Cuyama badlands to Ventucopa, CA. Turn around and retrace the same road back to Ojai.',
    })
  },
})

/**
 * AC-5 CASE 2 — `repair-round-exhausted-to-review`.
 *
 * The REAL Latigo Canyon Road climb (a genuine ~10mi road) carrying a claimed
 * length of 100mi. The claim is the lie; the road is real and short.
 *
 * SELECTED because its recording exhibits the both-attempts-fail property: the
 * repair round honestly refuses to fabricate mileage the description does not
 * support, so both recorded attempts land far below the band and the 2-attempt
 * budget exhausts to verdict='review'. The routed lengths are the provider's
 * own values.
 */
export const seedRepairExhaustedRoute = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:repair-exhausted',
      name: 'Repair Exhausted Test',
      lengthMiles: 100,
      centroidLat: 34.06,
      centroidLng: -118.79,
      oneLiner: 'Latigo Canyon Road climb',
      summary:
        'Start on Pacific Coast Highway at Latigo Canyon Road in Malibu, CA. Turn inland and climb Latigo Canyon Road through the switchbacks. Follow Latigo Canyon Road all the way up to Kanan Dume Road.',
    })
  },
})

/**
 * Seed a pre-existing geometry row with verdict='pass' but OFF-REGION anchors
 * for the AC-6 sweep test. The anchors are >300mi from the route centroid,
 * so the enhanced gate should flip this row to verdict='review'.
 */
export const seedPreexistingOffRegionGeometry = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)

    const routeId = 'test:preexisting-offregion'
    const result = await insertTestRoute(ctx, {
      routeId,
      name: 'Pre-existing Off Region',
      lengthMiles: 41,
      centroidLat: 34.95,
      centroidLng: -120.42,
      geometryStatus: 'generated',
    })

    // Insert geometry with verdict='pass' but anchors 300mi from centroid
    const existingGeom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
      .first()

    // Anchors at ~300mi from centroid (off-region, >150mi threshold)
    const farPoint1 = { lat: 39.2, lng: -120.42 } // ~300mi north
    const farPoint2 = { lat: 39.3, lng: -120.42 } // ~307mi north
    const dist1 = haversineHelper({ lat: 34.95, lng: -120.42 }, farPoint1)
    const dist2 = haversineHelper({ lat: 34.95, lng: -120.42 }, farPoint2)

    const geomDoc = {
      routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      verification: {
        routeId,
        verdict: 'pass' as const,
        geometryStatus: 'generated' as const,
        geometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        anchorCount: 2,
        anchors: [
          {
            lat: farPoint1.lat,
            lng: farPoint1.lng,
            formatted: 'Off-region 1',
            distanceFromCentroid: dist1,
          },
          {
            lat: farPoint2.lat,
            lng: farPoint2.lng,
            formatted: 'Off-region 2',
            distanceFromCentroid: dist2,
          },
        ],
        pointCount: 50,
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

    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })

    return { ...result, routeId }
  },
})

/** Query the verification block for a route by routeId. */
export const getGeometryVerification = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    return geomRow?.verification ?? null
  },
})

/**
 * Public wrapper for the PRODUCTION `reconstructForRoute` action (AC-5).
 *
 * Needed only because internal actions can't be reached via `npx convex run`.
 * It adds no logic: the repair round, the routing budget and the attempt
 * selection all execute inside production code. `cassette` replays a recorded
 * provider exchange log; `recordCassette` captures one from the live providers.
 */
export const runReconstructForRoute = action({
  args: {
    routeId: v.string(),
    cassette: v.optional(reconstructCassetteValidator),
    recordCassette: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<unknown> => {
    await requireIdentity(ctx)
    return ctx.runAction(internal.actions.curatedGeometryReconstruct.reconstructForRoute, args)
  },
})

/** Teardown all S4-T1 test rows. */
export const teardownS4T1TestRoutes = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const routeIds = ['test:repair-round', 'test:repair-exhausted', 'test:preexisting-offregion']

    let deleted = 0
    for (const routeId of routeIds) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (doc) {
        await geospatial.remove(ctx, doc._id)
        const geomRow = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
          .first()
        if (geomRow) await ctx.db.delete(geomRow._id)
        await ctx.db.delete(doc._id)
        deleted++
      }
    }
    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// S4-T4 / UC-VER-03: ride-worthiness classifier fixtures
// ---------------------------------------------------------------------------

const S4T4_ROUTE_IDS = [
  'test:ver-twisty-1',
  'test:ver-twisty-2',
  'test:ver-freeway-fhwa',
  'test:ver-recovered-row',
  'test:ver-freeway-i40',
  'test:ver-geom-good-not-ride',
  'test:ver-error-1',
  'test:ver-error-2',
  'test:ver-error-3',
  'test:ver-error-4',
  'test:ver-error-5',
  'test:ver-marginal-no-retire',
  'test:ver-decorrelate-1',
] as const

/** AC-1: 2 twisties + 1 FHWA freeway + 1 recovered row (unclassified). */
export const seedCatalogWithMixedRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:ver-twisty-1',
        name: 'Twisty Canyon Road',
        source: 'motorcycleroads',
        lengthMiles: 41,
        geometryStatus: 'generated',
        state: 'California',
        oneLiner: 'Legendary canyon twisties for motorcycles',
        summary:
          'A classic motorcycle canyon road with tight switchbacks, elevation changes, and almost no straight freeway segments.',
        clearRideWorthiness: true,
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:ver-twisty-2',
        name: 'Pacific Coast Highway Segment',
        source: 'editorial',
        lengthMiles: 28,
        geometryStatus: 'generated',
        state: 'California',
        oneLiner: 'Coastal motorcycle highway segment',
        summary:
          'A scenic Pacific Coast Highway stretch favored by motorcyclists for ocean views and sweeping curves.',
        clearRideWorthiness: true,
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:ver-freeway-fhwa',
        name: 'I-40 Arizona Segment',
        source: 'fhwa',
        lengthMiles: 245,
        geometryStatus: 'unresolved',
        state: 'Arizona',
        highwayNumber: 'i-40',
        oneLiner: 'Interstate freeway corridor',
        summary:
          'FHWA interstate freeway segment of I-40 across Arizona — long-haul limited-access freeway, not a motorcycle ride destination.',
        clearRideWorthiness: true,
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:ver-recovered-row',
        name: 'Recovered Mountain Pass',
        source: 'scenic_byways',
        lengthMiles: 35,
        geometryStatus: 'review',
        state: 'Colorado',
        oneLiner: 'Recovered scenic mountain pass',
        summary:
          'A recovered scenic-byways mountain pass with elevation and curves suitable for motorcycle touring.',
        clearRideWorthiness: true,
      }),
    ]
  },
})

/** AC-2: FHWA freeway segment for not_a_ride classification. */
export const seedFHWAFreewayRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:ver-freeway-i40',
      name: 'I-40 Arizona',
      source: 'fhwa',
      highwayNumber: 'i-40',
      lengthMiles: 245,
      geometryStatus: 'unresolved',
      state: 'Arizona',
      oneLiner: 'Interstate 40 freeway',
      summary:
        'FHWA I-40 Arizona interstate freeway — limited-access long-haul corridor, not a motorcycle recreation ride.',
      clearRideWorthiness: true,
    })
  },
})

/**
 * AC-3: gate-passing geometry + pre-seeded not_a_ride verdict.
 * Seeds geometry side-table with pass verification so riderReady depends on verdict.
 */
export const seedValidGeometryNotARide = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: 'test:ver-geom-good-not-ride',
      name: 'Valid Geometry Not A Ride',
      lengthMiles: 41,
      geometryStatus: 'generated',
      state: 'Arizona',
      oneLiner: 'Valid geometry non-ride',
      summary: 'A road with gate-passing geometry that is not a motorcycle ride.',
      rideWorthiness: {
        verdict: 'not_a_ride',
        reason: 'Classified as non-motorcycle road',
        model: 'openrouter/deepseek/deepseek-v4-pro',
        classifiedAt: 1_718_000_000_000,
      },
      scores: { compositeScore: 85 },
    })

    const existingGeom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', result.routeId))
      .first()

    const geomDoc = {
      routeId: result.routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      verification: {
        routeId: result.routeId,
        verdict: 'pass' as const,
        geometryStatus: 'generated' as const,
        geometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
        anchorCount: 2,
        anchors: [
          { lat: 34.95, lng: -120.42, formatted: 'A', distanceFromCentroid: 1 },
          { lat: 34.96, lng: -120.41, formatted: 'B', distanceFromCentroid: 2 },
        ],
        pointCount: 50,
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

    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })

    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      ...result,
      riderReady: refreshed?.riderReady ?? false,
      rideWorthiness: refreshed?.rideWorthiness ?? null,
    }
  },
})

/** AC-4: five routes for classifier error isolation (route 3 forced to fail). */
export const seedRoutesForErrorTesting = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const rows = [
      { routeId: 'test:ver-error-1', name: 'Error Test Route 1' },
      { routeId: 'test:ver-error-2', name: 'Error Test Route 2' },
      { routeId: 'test:ver-error-3', name: 'Error Test Route 3 (will fail)' },
      { routeId: 'test:ver-error-4', name: 'Error Test Route 4' },
      { routeId: 'test:ver-error-5', name: 'Error Test Route 5' },
    ]
    const results = []
    for (const row of rows) {
      results.push(
        await insertTestRoute(ctx, {
          routeId: row.routeId,
          name: row.name,
          lengthMiles: 41,
          geometryStatus: 'generated',
          oneLiner: 'Classifier error-isolation fixture',
          summary: 'Twisty canyon-style motorcycle test road used for classifier error handling.',
          clearRideWorthiness: true,
        }),
      )
    }
    return results
  },
})

/** AC-6: single twisty route for cross-provider decorrelation (isolated from AC-1). */
export const seedDecorrelationRoute = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:ver-decorrelate-1',
      name: 'Decorrelation Canyon Road',
      source: 'motorcycleroads',
      lengthMiles: 41,
      geometryStatus: 'generated',
      state: 'California',
      oneLiner: 'Twisty canyon for provider decorrelation check',
      summary:
        'A classic motorcycle canyon road used to verify the ride-worthiness classifier stamps OpenRouter deepseek/deepseek-v4-pro rather than the anchor extraction gpt-4.1 provider.',
      clearRideWorthiness: true,
    })
  },
})

/** AC-5: marginal verdict + low score must never auto-retire. */
export const seedMarginalVerdictRoute = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return insertTestRoute(ctx, {
      routeId: 'test:ver-marginal-no-retire',
      name: 'Marginal Verdict Route',
      lengthMiles: 41,
      scores: { compositeScore: 0.45 },
      retiredAt: null,
      rideWorthiness: {
        verdict: 'marginal',
        reason: 'Borderline motorcycle road',
        model: 'openrouter/deepseek/deepseek-v4-pro',
        classifiedAt: 1_718_000_000_000,
      },
    })
  },
})

/**
 * Public wrapper for recomputeRiderReadyForRoute (AC-5).
 * Confirms marginal verdict paths recompute riderReady without setting retiredAt.
 */
export const recomputeRiderReadyForRoutePublic = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!doc) throw new Error(`Route not found: ${routeId}`)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, { id: doc._id })
    const refreshed = (await ctx.db.get(doc._id)) as Doc<'curated_routes'> | null
    return {
      routeId,
      riderReady: refreshed?.riderReady ?? false,
      retiredAt: refreshed?.retiredAt ?? null,
      rideWorthiness: refreshed?.rideWorthiness ?? null,
      compositeScore: refreshed?.compositeScore ?? null,
    }
  },
})

/**
 * S6-T6 / UC-SURF-06 Maestro mid-flow quarantine flip (public_api).
 *
 * Sets quarantine on an arbitrary routeId (e.g. cherohala-skyway — same slug the
 * curated-saved-reachability deep-link uses) then runs the real recompute path so
 * riderReady becomes false. Fail-closed: throws if riderReady is still true.
 *
 * Invoked mid-flow by `.maestro/scripts/mid-flow-quarantine-route.sh` via
 * `npx convex run` (see curated-saved-reachability.yaml).
 */
export const quarantineRouteByRouteIdPublic = mutation({
  args: {
    routeId: v.string(),
    reason: v.optional(
      v.union(v.literal('zero_length'), v.literal('length_outlier'), v.literal('test_row')),
    ),
  },
  handler: async (ctx, { routeId, reason }) => {
    await requireIdentity(ctx)
    const doc = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!doc) throw new Error(`Route not found: ${routeId}`)
    await ctx.db.patch(doc._id, {
      quarantine: {
        reason: reason ?? 'length_outlier',
        flaggedAt: Date.now(),
      },
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, { id: doc._id })
    const refreshed = (await ctx.db.get(doc._id)) as Doc<'curated_routes'> | null
    if (refreshed?.riderReady !== false) {
      throw new Error(
        `quarantine flip failed: riderReady=${String(refreshed?.riderReady)} for ${routeId}`,
      )
    }
    return {
      routeId,
      riderReady: false as const,
      quarantine: refreshed?.quarantine ?? null,
      geometryStatus: refreshed?.geometryStatus ?? null,
    }
  },
})

/** Query recent classifier performance rows (error logs) for AC-4. */
export const listClassifierPerformanceLogs = query({
  args: {
    routeId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { routeId, limit }) => {
    await requireIdentity(ctx)
    const take = Math.min(limit ?? 50, 100)
    const rows = await ctx.db.query('performance').order('desc').take(200)
    return rows
      .filter((r) => r.agent === 'ride_worthiness_classifier')
      .filter((r) => (routeId ? r.input === routeId : true))
      .slice(0, take)
      .map((r) => ({
        agent: r.agent,
        model: r.model,
        input: r.input ?? null,
        success: r.success,
        error: r.error ?? null,
        createdAt: r.createdAt,
      }))
  },
})

/**
 * Teardown S4-T4 ride-worthiness classifier fixtures.
 * Pass routeIds to limit cleanup (avoids cross-file races when vitest runs files in parallel).
 */
export const teardownS4T4TestRoutes = mutation({
  args: {
    routeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { routeIds }) => {
    await requireIdentity(ctx)
    const targets = routeIds && routeIds.length > 0 ? routeIds : [...S4T4_ROUTE_IDS]
    let deleted = 0
    for (const routeId of targets) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (doc) {
        await geospatial.remove(ctx, doc._id)
        const geomRow = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', doc.routeId))
          .first()
        if (geomRow) await ctx.db.delete(geomRow._id)
        await ctx.db.delete(doc._id)
        deleted++
      }
    }
    return { status: 'deleted', count: deleted }
  },
})

/**
 * REDHAT-FIX-15 test support: artificially mutate a route's stored geometry so
 * its per-route geometry hash changes. Used to prove couchGateStatus invalidates
 * a prior approval on catalog/geometry drift (a PASS cannot remain an unlock
 * after a sampled route's geometry changes). Test-support only.
 */
export const simulateGeometryDrift = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!geom) {
      return { routeId, drifted: false, reason: 'no geometry row' }
    }
    const driftedValue = `${geom.value ?? ''}__drift_${Date.now()}`
    await ctx.db.patch(geom._id, { value: driftedValue })
    return { routeId, drifted: true }
  },
})

// ---------------------------------------------------------------------------
// S6-T1 fixtures: 7-input riderReady composition + retired/shadow twins + gate
// ---------------------------------------------------------------------------

const S6T1_POC_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'
const S6T1_RETIRED_ID = 'test:retired-twin'
const S6T1_SHADOW_ID = 'test:shadow-twin'
const S6T1_MISSING_CLASSIFIER_ID = 'test:missing-classifier-twin'
const S6T1_EMPTY_NAME_ID = 'test:empty-name-twin'
const S6T1_INVALID_SCORE_ID = 'test:invalid-score-twin'
const S6T1_ZERO_LENGTH_ID = 'test:zero-length-twin'
const S6T1_MISSING_GEOM_ID = 'test:missing-geom-twin'
const S6T1_GEO_PREFIX = 'test:s6t1-geo-'

async function upsertGatePassingGeometry(
  ctx: any,
  routeId: string,
  lengthMiles: number,
  pointCount = 50,
) {
  const existingGeom = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
    .first()

  const geomDoc = {
    routeId,
    format: 'polyline' as const,
    encoding: 'utf-8',
    precision: 5,
    value: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
    verification: {
      routeId,
      verdict: 'pass' as const,
      geometryStatus: 'generated' as const,
      geometry: '_p~iF~ps|U_ulLnnqC_mqNvxq`@',
      anchorCount: 2,
      anchors: [
        { lat: 34.95, lng: -120.42, formatted: 'Start', distanceFromCentroid: 0 },
        { lat: 34.96, lng: -120.43, formatted: 'End', distanceFromCentroid: 1 },
      ],
      pointCount,
      degenerate: false,
      ratio: 1.0,
      claimedMiles: lengthMiles,
      routedMiles: lengthMiles,
    },
  }

  if (existingGeom) {
    await ctx.db.replace(existingGeom._id, geomDoc)
  } else {
    await ctx.db.insert('curated_route_geometry', geomDoc)
  }
}

/**
 * AC-1 fixture: all 7 riderReady inputs valid.
 * compositeScore=0.85 (0–1 scale), gate pass, real name, length 41,
 * classifier ride, not retired, not shadow.
 *
 * Optional routeId/name for isolated parallel AC runs (default = PoC route).
 */
export const seedS6T1AllSevenInputs = mutation({
  args: {
    routeId: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const routeId = args.routeId ?? S6T1_POC_ROUTE_ID
    const name = args.name ?? 'Twist of Tepusquet Loop'
    const result = await insertTestRoute(ctx, {
      routeId,
      name,
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 all-seven-inputs fixture',
        model: 'test',
        classifiedAt: Date.now(),
      },
      retiredAt: null,
      summary: routeId.includes('tepusquet') ? TEPUSQUET_SUMMARY : 'S6-T1 all-seven-inputs fixture',
    })

    // Explicitly clear retirement/shadow/quarantine so recompute sees nulls
    await ctx.db.patch(result.id, {
      retiredAt: null,
      duplicateOf: undefined,
      quarantine: undefined,
      name,
      compositeScore: 0.85,
      lengthMiles: 41,
      geometryStatus: 'generated',
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 all-seven-inputs fixture',
        model: 'test',
        evidenceComplete: true,
        classifiedAt: Date.now(),
      },
    })

    await upsertGatePassingGeometry(ctx, routeId, 41, 50)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })

    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      routeId,
      id: result.id,
      riderReady: refreshed?.riderReady ?? false,
      name: refreshed?.name,
      compositeScore: refreshed?.compositeScore,
      lengthMiles: refreshed?.lengthMiles,
      rideWorthiness: refreshed?.rideWorthiness ?? null,
      retiredAt: refreshed?.retiredAt ?? null,
      duplicateOf: refreshed?.duplicateOf ?? null,
    }
  },
})

/** AC-3: identical to all-7 but retiredAt set (single discriminator). */
export const seedRetiredTwinRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: S6T1_RETIRED_ID,
      name: 'Retired Twin Loop',
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 retired twin',
        model: 'test',
        classifiedAt: Date.now(),
      },
      retiredAt: Date.now(),
    })

    await upsertGatePassingGeometry(ctx, S6T1_RETIRED_ID, 41, 50)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T1_RETIRED_ID,
      riderReady: refreshed?.riderReady ?? false,
      retiredAt: refreshed?.retiredAt ?? null,
      name: refreshed?.name,
      compositeScore: refreshed?.compositeScore,
    }
  },
})

/** AC-3: identical to all-7 but duplicateOf set (shadow twin). */
export const seedShadowTwinRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: S6T1_SHADOW_ID,
      name: 'Shadow Twin Loop',
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 shadow twin',
        model: 'test',
        classifiedAt: Date.now(),
      },
      retiredAt: null,
    })

    await ctx.db.patch(result.id, {
      duplicateOf: S6T1_POC_ROUTE_ID,
      retiredAt: null,
      quarantine: undefined,
    })
    await upsertGatePassingGeometry(ctx, S6T1_SHADOW_ID, 41, 50)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T1_SHADOW_ID,
      riderReady: refreshed?.riderReady ?? false,
      duplicateOf: refreshed?.duplicateOf ?? null,
      name: refreshed?.name,
      compositeScore: refreshed?.compositeScore,
    }
  },
})

/** AC-3/TC-3: all inputs valid except classifier absent → riderReady false. */
export const seedMissingClassifierTwinRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: S6T1_MISSING_CLASSIFIER_ID,
      name: 'Missing Classifier Twin',
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      clearRideWorthiness: true,
      retiredAt: null,
    })

    await ctx.db.patch(result.id, {
      rideWorthiness: undefined,
      retiredAt: null,
      duplicateOf: undefined,
      quarantine: undefined,
    })
    await upsertGatePassingGeometry(ctx, S6T1_MISSING_CLASSIFIER_ID, 41, 50)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T1_MISSING_CLASSIFIER_ID,
      riderReady: refreshed?.riderReady ?? false,
      rideWorthiness: refreshed?.rideWorthiness ?? null,
    }
  },
})

/** AC-3/TC-3: all inputs valid except empty name → riderReady false. */
export const seedEmptyNameTwinRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: S6T1_EMPTY_NAME_ID,
      name: 'Empty Name Twin Placeholder',
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 empty name twin',
        model: 'test',
        classifiedAt: Date.now(),
      },
      retiredAt: null,
    })

    await ctx.db.patch(result.id, {
      name: '   ',
      name_lower: '',
      retiredAt: null,
      duplicateOf: undefined,
      quarantine: undefined,
    })
    await upsertGatePassingGeometry(ctx, S6T1_EMPTY_NAME_ID, 41, 50)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T1_EMPTY_NAME_ID,
      riderReady: refreshed?.riderReady ?? false,
      name: refreshed?.name ?? null,
    }
  },
})

/**
 * AC-3/TC-3: all inputs valid except compositeScore invalid on 0–1 scale
 * (below 0.5 threshold) → riderReady false.
 */
export const seedInvalidCompositeScoreTwinRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: S6T1_INVALID_SCORE_ID,
      name: 'Invalid Score Twin',
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 invalid score twin',
        model: 'test',
        classifiedAt: Date.now(),
      },
      retiredAt: null,
    })

    // 0.1 is on 0–1 scale but fails the ≥0.5 score gate (invalid for riderReady)
    await ctx.db.patch(result.id, {
      compositeScore: 0.1,
      retiredAt: null,
      duplicateOf: undefined,
      quarantine: undefined,
    })
    await upsertGatePassingGeometry(ctx, S6T1_INVALID_SCORE_ID, 41, 50)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T1_INVALID_SCORE_ID,
      riderReady: refreshed?.riderReady ?? false,
      compositeScore: refreshed?.compositeScore ?? null,
    }
  },
})

/** AC-3/TC-3: all inputs valid except lengthMiles <= 0 → riderReady false. */
export const seedZeroLengthTwinRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: S6T1_ZERO_LENGTH_ID,
      name: 'Zero Length Twin',
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 zero length twin',
        model: 'test',
        classifiedAt: Date.now(),
      },
      retiredAt: null,
    })

    // Clear quarantine so lengthMiles alone is the discriminator (not quarantine).
    await ctx.db.patch(result.id, {
      lengthMiles: 0,
      retiredAt: null,
      duplicateOf: undefined,
      quarantine: undefined,
    })
    await upsertGatePassingGeometry(ctx, S6T1_ZERO_LENGTH_ID, 41, 50)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T1_ZERO_LENGTH_ID,
      riderReady: refreshed?.riderReady ?? false,
      lengthMiles: refreshed?.lengthMiles ?? null,
      quarantine: refreshed?.quarantine ?? null,
    }
  },
})

/**
 * AC-3/TC-3: all inputs valid except missing/failing geometry verification
 * → riderReady false.
 */
export const seedMissingGeometryTwinRow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const result = await insertTestRoute(ctx, {
      routeId: S6T1_MISSING_GEOM_ID,
      name: 'Missing Geometry Twin',
      lengthMiles: 41,
      geometryStatus: 'generated',
      scores: { compositeScore: 0.85 },
      rideWorthiness: {
        verdict: 'ride',
        reason: 'S6-T1 missing geom twin',
        model: 'test',
        classifiedAt: Date.now(),
      },
      retiredAt: null,
    })

    await ctx.db.patch(result.id, {
      retiredAt: null,
      duplicateOf: undefined,
      quarantine: undefined,
    })
    // Intentionally do NOT upsert gate-passing geometry — missing verification
    // is the single discriminator.
    const existingGeom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', S6T1_MISSING_GEOM_ID))
      .first()
    if (existingGeom) {
      await ctx.db.delete(existingGeom._id)
    }

    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: result.id,
    })
    const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
    const geomAfter = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', S6T1_MISSING_GEOM_ID))
      .first()
    return {
      routeId: S6T1_MISSING_GEOM_ID,
      riderReady: refreshed?.riderReady ?? false,
      hasGeometry: geomAfter != null,
      geometryVerification: geomAfter?.verification ?? null,
    }
  },
})

/** AC-5: N rider-ready routes with geometry for re-index parity gate. */
export const seedS6T1GeospatialReindexFixtures = mutation({
  args: { count: v.optional(v.number()) },
  handler: async (ctx, { count }) => {
    await requireIdentity(ctx)
    const n = count ?? 3
    const seeded = []
    for (let i = 0; i < n; i++) {
      const routeId = `${S6T1_GEO_PREFIX}${i}`
      const result = await insertTestRoute(ctx, {
        routeId,
        name: `S6T1 Geo Fixture ${i}`,
        lengthMiles: 41,
        geometryStatus: 'generated',
        scores: { compositeScore: 0.85 - i * 0.01 },
        rideWorthiness: {
          verdict: 'ride',
          reason: 'S6-T1 geo fixture',
          model: 'test',
          classifiedAt: Date.now(),
        },
        retiredAt: null,
        centroidLat: 34.95 + i * 0.02,
        centroidLng: -120.42 + i * 0.02,
      })
      await ctx.db.patch(result.id, {
        retiredAt: null,
        duplicateOf: undefined,
        quarantine: undefined,
      })
      await upsertGatePassingGeometry(ctx, routeId, 41, 50)
      await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
        id: result.id,
      })
      const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
      seeded.push({
        routeId,
        riderReady: refreshed?.riderReady ?? false,
      })
    }
    return { count: n, seeded, routeIdPrefix: S6T1_GEO_PREFIX }
  },
})

/**
 * AC-5 negative control: delete one geometry row while leaving riderReady=true
 * so pointCount !== riderReadyCount.
 */
export const forceS6T1GeospatialDivergence = mutation({
  args: { routeIdPrefix: v.string() },
  handler: async (ctx, { routeIdPrefix }) => {
    await requireIdentity(ctx)
    const page = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q: any) =>
        q.gte('routeId', routeIdPrefix).lt('routeId', `${routeIdPrefix}\uffff`),
      )
      .take(100)
    const scoped = page.filter((r) => r.riderReady === true)
    if (scoped.length === 0) {
      return { diverged: false, reason: 'no riderReady rows in prefix' }
    }
    const victim = scoped[0]
    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', victim.routeId))
      .first()
    if (geom) {
      await ctx.db.delete(geom._id)
    }
    // Intentionally do NOT recompute — leave riderReady=true with missing geometry point
    return {
      diverged: true,
      routeId: victim.routeId,
      riderReady: victim.riderReady ?? false,
    }
  },
})

/** Teardown S6-T1 fixture routeIds. Optional routeIds overrides the default set. */
export const teardownS6T1Fixtures = mutation({
  args: {
    routeIds: v.optional(v.array(v.string())),
    /** When true, also delete the shared PoC route (default false — avoids parallel races). */
    includePoC: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const defaultIds = [
      S6T1_RETIRED_ID,
      S6T1_SHADOW_ID,
      S6T1_MISSING_CLASSIFIER_ID,
      S6T1_EMPTY_NAME_ID,
      S6T1_INVALID_SCORE_ID,
      S6T1_ZERO_LENGTH_ID,
      S6T1_MISSING_GEOM_ID,
      'test:s6t1-trigger',
      ...Array.from({ length: 10 }, (_, i) => `${S6T1_GEO_PREFIX}${i}`),
    ]
    const ids = [...(args.routeIds ?? defaultIds)]
    if (args.includePoC) ids.push(S6T1_POC_ROUTE_ID)

    let deleted = 0
    for (const routeId of ids) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (!doc) continue
      await geospatial.remove(ctx, doc._id)
      const geomRow = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (geomRow) await ctx.db.delete(geomRow._id)
      await ctx.db.delete(doc._id)
      deleted++
    }

    // Clear gate rows for S6-T1 prefixes
    const gateIds = ['geospatial_reindex_surf', `geospatial_reindex_surf:${S6T1_GEO_PREFIX}`]
    for (const gateId of gateIds) {
      const gate = await ctx.db
        .query('surf_migration_gates')
        .withIndex('by_gateId', (q: any) => q.eq('gateId', gateId))
        .first()
      if (gate) await ctx.db.delete(gate._id)
    }

    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// S6-T2 fixtures: mixed catalog, state shadows, excluded trio, thin region
// ---------------------------------------------------------------------------

const S6T2_PREFIX = 'test:s6t2-'
const S6T2_RIDER_READY_1 = 'test:s6t2-rider-ready-1'
const S6T2_RIDER_READY_2 = 'test:s6t2-rider-ready-2'
const S6T2_CENTROID_1 = 'test:s6t2-centroid-only-1'
const S6T2_CENTROID_2 = 'test:s6t2-centroid-only-2'
const S6T2_CENTROID_3 = 'test:s6t2-centroid-only-3'
const S6T2_CA_READY_1 = 'test:s6t2-ca-rider-ready-1'
const S6T2_CA_READY_2 = 'test:s6t2-ca-rider-ready-2'
const S6T2_CA_QUARANTINED = 'test:s6t2-ca-quarantined'
const S6T2_CA_RETIRED = 'test:s6t2-ca-retired'
const S6T2_CA_SHADOW = 'test:s6t2-ca-shadow'
const S6T2_EXCL_QUARANTINED = 'test:s6t2-quarantined'
const S6T2_EXCL_SHADOW = 'test:s6t2-shadow'
const S6T2_EXCL_RETIRED = 'test:s6t2-retired'
const S6T2_WY_READY_1 = 'test:s6t2-wy-rider-ready-1'
const S6T2_WY_READY_2 = 'test:s6t2-wy-rider-ready-2'

async function seedAllSevenReadyRoute(
  ctx: any,
  row: {
    routeId: string
    name: string
    state: string
    centroidLat: number
    centroidLng: number
    compositeScore?: number
  },
) {
  const result = await insertTestRoute(ctx, {
    routeId: row.routeId,
    name: row.name,
    state: row.state,
    lengthMiles: 41,
    centroidLat: row.centroidLat,
    centroidLng: row.centroidLng,
    geometryStatus: 'generated',
    scores: { compositeScore: row.compositeScore ?? 0.85 },
    rideWorthiness: {
      verdict: 'ride',
      reason: 'S6-T2 rider-ready fixture',
      model: 'test',
      classifiedAt: Date.now(),
    },
    retiredAt: null,
  })
  await ctx.db.patch(result.id, {
    retiredAt: null,
    duplicateOf: undefined,
    quarantine: undefined,
    name: row.name,
    compositeScore: row.compositeScore ?? 0.85,
    lengthMiles: 41,
    geometryStatus: 'generated',
    state: row.state,
  })
  await upsertGatePassingGeometry(ctx, row.routeId, 41, 50)
  await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
    id: result.id,
  })
  const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
  return {
    routeId: row.routeId,
    id: result.id,
    riderReady: refreshed?.riderReady ?? false,
    state: refreshed?.state,
    compositeScore: refreshed?.compositeScore,
  }
}

/** Centroid-only: no geometry side-table row → recompute yields riderReady=false. */
async function seedCentroidOnlyRoute(
  ctx: any,
  row: {
    routeId: string
    name: string
    state: string
    centroidLat: number
    centroidLng: number
    compositeScore?: number
  },
) {
  const result = await insertTestRoute(ctx, {
    routeId: row.routeId,
    name: row.name,
    state: row.state,
    lengthMiles: 41,
    centroidLat: row.centroidLat,
    centroidLng: row.centroidLng,
    geometryStatus: 'unresolved',
    scores: { compositeScore: row.compositeScore ?? 0.9 },
    rideWorthiness: {
      verdict: 'ride',
      reason: 'S6-T2 centroid-only fixture',
      model: 'test',
      classifiedAt: Date.now(),
    },
    retiredAt: null,
  })
  const existingGeom = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
    .first()
  if (existingGeom) await ctx.db.delete(existingGeom._id)

  await ctx.db.patch(result.id, {
    geometryStatus: 'unresolved',
    retiredAt: null,
    duplicateOf: undefined,
    quarantine: undefined,
    compositeScore: row.compositeScore ?? 0.9,
  })
  await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
    id: result.id,
  })
  const refreshed = (await ctx.db.get(result.id)) as Doc<'curated_routes'> | null
  return {
    routeId: row.routeId,
    id: result.id,
    riderReady: refreshed?.riderReady ?? false,
    geometryStatus: refreshed?.geometryStatus,
  }
}

/**
 * AC-1/AC-2 mixed catalog: 2 rider-ready (generated geometry) + 3 centroid-only.
 */
export const seedS6T2MixedCatalog = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const ready = [
      await seedAllSevenReadyRoute(ctx, {
        routeId: S6T2_RIDER_READY_1,
        name: 'S6T2 Rider Ready One',
        state: 'California',
        centroidLat: 34.95,
        centroidLng: -120.42,
        compositeScore: 0.997,
      }),
      await seedAllSevenReadyRoute(ctx, {
        routeId: S6T2_RIDER_READY_2,
        name: 'S6T2 Rider Ready Two',
        state: 'California',
        centroidLat: 34.96,
        centroidLng: -120.41,
        compositeScore: 0.996,
      }),
    ]
    const centroidOnly = [
      await seedCentroidOnlyRoute(ctx, {
        routeId: S6T2_CENTROID_1,
        name: 'S6T2 Centroid Only One',
        state: 'California',
        centroidLat: 34.94,
        centroidLng: -120.43,
        compositeScore: 0.99,
      }),
      await seedCentroidOnlyRoute(ctx, {
        routeId: S6T2_CENTROID_2,
        name: 'S6T2 Centroid Only Two',
        state: 'California',
        centroidLat: 34.93,
        centroidLng: -120.44,
        compositeScore: 0.97,
      }),
      await seedCentroidOnlyRoute(ctx, {
        routeId: S6T2_CENTROID_3,
        name: 'S6T2 Centroid Only Three',
        state: 'California',
        centroidLat: 34.92,
        centroidLng: -120.45,
        compositeScore: 0.95,
      }),
    ]
    return {
      ready,
      centroidOnly,
      readyIds: ready.map((r) => r.routeId),
      centroidOnlyIds: centroidOnly.map((r) => r.routeId),
    }
  },
})

/**
 * AC-3 state-with-non-rider-ready-shadow: 2 CA ready + quarantined/retired/shadow + centroid gap.
 */
export const seedS6T2StateWithShadows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const ready = [
      await seedAllSevenReadyRoute(ctx, {
        routeId: S6T2_CA_READY_1,
        name: 'S6T2 CA Ready One',
        state: 'California',
        centroidLat: 35.0,
        centroidLng: -120.5,
        compositeScore: 0.995,
      }),
      await seedAllSevenReadyRoute(ctx, {
        routeId: S6T2_CA_READY_2,
        name: 'S6T2 CA Ready Two',
        state: 'California',
        centroidLat: 35.01,
        centroidLng: -120.49,
        compositeScore: 0.994,
      }),
    ]

    const quarantined = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T2_CA_QUARANTINED,
      name: 'S6T2 CA Quarantined',
      state: 'California',
      centroidLat: 35.02,
      centroidLng: -120.48,
      compositeScore: 0.91,
    })
    await ctx.db.patch(quarantined.id, {
      quarantine: { reason: 'length_outlier', flaggedAt: Date.now() },
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: quarantined.id,
    })
    const qRef = (await ctx.db.get(quarantined.id)) as Doc<'curated_routes'> | null

    const retired = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T2_CA_RETIRED,
      name: 'S6T2 CA Retired',
      state: 'California',
      centroidLat: 35.03,
      centroidLng: -120.47,
      compositeScore: 0.9,
    })
    await ctx.db.patch(retired.id, { retiredAt: Date.now() })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: retired.id,
    })
    const rRef = (await ctx.db.get(retired.id)) as Doc<'curated_routes'> | null

    const shadow = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T2_CA_SHADOW,
      name: 'S6T2 CA Shadow',
      state: 'California',
      centroidLat: 35.04,
      centroidLng: -120.46,
      compositeScore: 0.89,
    })
    await ctx.db.patch(shadow.id, { duplicateOf: S6T2_CA_READY_1 })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: shadow.id,
    })
    const sRef = (await ctx.db.get(shadow.id)) as Doc<'curated_routes'> | null

    const centroidGap = await seedCentroidOnlyRoute(ctx, {
      routeId: `${S6T2_PREFIX}ca-centroid-gap`,
      name: 'S6T2 CA Centroid Gap',
      state: 'California',
      centroidLat: 35.05,
      centroidLng: -120.45,
      compositeScore: 0.98,
    })

    return {
      ready,
      nonReady: [
        { ...quarantined, riderReady: qRef?.riderReady ?? false, kind: 'quarantined' },
        { ...retired, riderReady: rRef?.riderReady ?? false, kind: 'retired' },
        { ...shadow, riderReady: sRef?.riderReady ?? false, kind: 'shadow' },
        { ...centroidGap, kind: 'centroid-only' },
      ],
      readyIds: ready.map((r) => r.routeId),
      nonReadyIds: [
        S6T2_CA_QUARANTINED,
        S6T2_CA_RETIRED,
        S6T2_CA_SHADOW,
        `${S6T2_PREFIX}ca-centroid-gap`,
      ],
    }
  },
})

/** AC-4/TC-4 excluded trio: quarantined + shadow + retired with otherwise valid geometry. */
export const seedS6T2ExcludedTrio = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)

    const quarantined = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T2_EXCL_QUARANTINED,
      name: 'S6T2 Excluded Quarantined',
      state: 'California',
      centroidLat: 36.0,
      centroidLng: -121.0,
      compositeScore: 0.92,
    })
    await ctx.db.patch(quarantined.id, {
      quarantine: { reason: 'length_outlier', flaggedAt: Date.now() },
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: quarantined.id,
    })

    const shadow = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T2_EXCL_SHADOW,
      name: 'S6T2 Excluded Shadow',
      state: 'California',
      centroidLat: 36.01,
      centroidLng: -121.01,
      compositeScore: 0.91,
    })
    await ctx.db.patch(shadow.id, { duplicateOf: S6T2_RIDER_READY_1 })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: shadow.id,
    })

    const retired = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T2_EXCL_RETIRED,
      name: 'S6T2 Excluded Retired',
      state: 'California',
      centroidLat: 36.02,
      centroidLng: -121.02,
      compositeScore: 0.9,
    })
    await ctx.db.patch(retired.id, { retiredAt: Date.now() })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: retired.id,
    })

    const rows = []
    for (const id of [quarantined.id, shadow.id, retired.id]) {
      const doc = (await ctx.db.get(id)) as Doc<'curated_routes'> | null
      rows.push({
        routeId: doc?.routeId,
        riderReady: doc?.riderReady ?? false,
        retiredAt: doc?.retiredAt ?? null,
        duplicateOf: doc?.duplicateOf ?? null,
        quarantine: doc?.quarantine ?? null,
      })
    }
    return {
      rows,
      excludedIds: [S6T2_EXCL_QUARANTINED, S6T2_EXCL_SHADOW, S6T2_EXCL_RETIRED],
    }
  },
})

/** AC-5 thin region: 2 WY rider-ready + 5 WY non-ready (centroid-only). */
export const seedS6T2ThinRegion = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    // Scores near 1.0 so fixtures survive Mode-3 top-N window (filteredTake)
    // before state filter — catalog has hundreds of higher-scored ready rows.
    const ready = [
      await seedAllSevenReadyRoute(ctx, {
        routeId: S6T2_WY_READY_1,
        name: 'S6T2 WY Ready One',
        state: 'Wyoming',
        centroidLat: 43.0,
        centroidLng: -107.5,
        compositeScore: 0.999,
      }),
      await seedAllSevenReadyRoute(ctx, {
        routeId: S6T2_WY_READY_2,
        name: 'S6T2 WY Ready Two',
        state: 'Wyoming',
        centroidLat: 43.05,
        centroidLng: -107.45,
        compositeScore: 0.998,
      }),
    ]
    const nonReady = []
    for (let i = 1; i <= 5; i++) {
      nonReady.push(
        await seedCentroidOnlyRoute(ctx, {
          routeId: `${S6T2_PREFIX}wy-non-ready-${i}`,
          name: `S6T2 WY Non Ready ${i}`,
          state: 'Wyoming',
          centroidLat: 43.1 + i * 0.01,
          centroidLng: -107.4 - i * 0.01,
          compositeScore: 0.99 - i * 0.01,
        }),
      )
    }
    return {
      ready,
      nonReady,
      readyIds: ready.map((r) => r.routeId),
      nonReadyIds: nonReady.map((r) => r.routeId),
    }
  },
})

/** Pure non-ready thin region for empty-result honest absence. */
export const seedS6T2ThinRegionOnlyNonReady = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const nonReady = []
    for (let i = 1; i <= 5; i++) {
      nonReady.push(
        await seedCentroidOnlyRoute(ctx, {
          routeId: `${S6T2_PREFIX}thin-only-non-${i}`,
          name: `S6T2 Thin Only Non ${i}`,
          state: 'Wyoming',
          centroidLat: 44.0 + i * 0.01,
          centroidLng: -108.0 - i * 0.01,
          compositeScore: 0.99,
        }),
      )
    }
    return {
      nonReady,
      nonReadyIds: nonReady.map((r) => r.routeId),
      readyIds: [] as string[],
    }
  },
})

export const teardownS6T2Fixtures = mutation({
  args: {
    routeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const defaultIds = [
      S6T2_RIDER_READY_1,
      S6T2_RIDER_READY_2,
      S6T2_CENTROID_1,
      S6T2_CENTROID_2,
      S6T2_CENTROID_3,
      S6T2_CA_READY_1,
      S6T2_CA_READY_2,
      S6T2_CA_QUARANTINED,
      S6T2_CA_RETIRED,
      S6T2_CA_SHADOW,
      `${S6T2_PREFIX}ca-centroid-gap`,
      S6T2_EXCL_QUARANTINED,
      S6T2_EXCL_SHADOW,
      S6T2_EXCL_RETIRED,
      S6T2_WY_READY_1,
      S6T2_WY_READY_2,
      ...Array.from({ length: 5 }, (_, i) => `${S6T2_PREFIX}wy-non-ready-${i + 1}`),
      ...Array.from({ length: 5 }, (_, i) => `${S6T2_PREFIX}thin-only-non-${i + 1}`),
    ]
    const ids = args.routeIds ?? defaultIds
    let deleted = 0
    for (const routeId of ids) {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (!doc) continue
      await geospatial.remove(ctx, doc._id)
      const geomRow = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (geomRow) await ctx.db.delete(geomRow._id)
      await ctx.db.delete(doc._id)
      deleted++
    }
    return { status: 'deleted', count: deleted }
  },
})

// ---------------------------------------------------------------------------
// S6-T5 fixtures: saved-route reachability + canonical redirect
// ---------------------------------------------------------------------------

const S6T5_SAVED_FLIP = 'test:s6t5-saved-flip'
const S6T5_SAVED_UNRECOVERED = 'test:s6t5-saved-unrecovered'
const S6T5_CANONICAL = 'test:s6t5-canonical'
const S6T5_SHADOW = 'test:s6t5-shadow'
const S6T5_CHAIN_A = 'test:s6t5-chain-A'
const S6T5_CHAIN_B = 'test:s6t5-chain-B'
const S6T5_PROGRESSION = 'test:s6t5-progression'
const S6T5_PROGRESSION_CANONICAL = 'test:s6t5-progression-canonical'

const S6T5_ROUTE_IDS = [
  S6T5_SAVED_FLIP,
  S6T5_SAVED_UNRECOVERED,
  S6T5_CANONICAL,
  S6T5_SHADOW,
  S6T5_CHAIN_A,
  S6T5_CHAIN_B,
  S6T5_PROGRESSION,
  S6T5_PROGRESSION_CANONICAL,
] as const

async function deleteCuratedRouteByRouteId(ctx: any, routeId: string): Promise<boolean> {
  const doc = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
    .first()
  if (!doc) return false
  await geospatial.remove(ctx, doc._id)
  const geomRow = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
    .first()
  if (geomRow) await ctx.db.delete(geomRow._id)
  // Remove saved_routes that bookmark this curated doc (by_curated_route index).
  const saved = await ctx.db
    .query('saved_routes')
    .withIndex('by_curated_route', (q: any) => q.eq('curatedRouteRef', doc._id))
    .collect()
  for (const row of saved) {
    await ctx.db.delete(row._id)
  }
  await ctx.db.delete(doc._id)
  return true
}

async function insertSavedBookmark(
  ctx: any,
  identity: { clerkUserId: string },
  curatedDocId: any,
  name: string,
) {
  const now = Date.now()
  const savedRouteId = await ctx.db.insert('saved_routes', {
    ownerType: 'user' as const,
    ownerId: identity.clerkUserId,
    createdByUserId: identity.clerkUserId,
    visibility: 'private' as const,
    name,
    curatedRouteRef: curatedDocId,
    createdAt: now,
    updatedAt: now,
  })
  return savedRouteId
}

/**
 * AC-1 fixture: curated route saved by the rider, then driven non-ready via
 * persistRideWorthiness(verdict='not_a_ride') so riderReady flips false.
 */
export const seedS6T5SavedFlipNonReady = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    await deleteCuratedRouteByRouteId(ctx, S6T5_SAVED_FLIP)

    const ready = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T5_SAVED_FLIP,
      name: 'S6T5 Saved Flip',
      state: 'California',
      centroidLat: 35.1,
      centroidLng: -120.6,
      compositeScore: 0.88,
    })

    const savedRouteId = await insertSavedBookmark(
      ctx,
      identity,
      ready.id,
      'S6T5 bookmark — saved flip',
    )

    // Real classifier write path (internal) + recompute → riderReady false.
    await ctx.runMutation(internal.curatedGeometry.persistRideWorthiness, {
      id: ready.id,
      rideWorthiness: {
        verdict: 'not_a_ride' as const,
        reason: 'S6-T5 AC-1 post-save quarantine flip',
        model: 'test',
        classifiedAt: Date.now(),
        evidenceComplete: true,
      },
    })

    const refreshed = (await ctx.db.get(ready.id)) as Doc<'curated_routes'> | null
    const saved = (await ctx.db.get(savedRouteId)) as Doc<'saved_routes'> | null
    return {
      routeId: S6T5_SAVED_FLIP,
      curatedDocId: ready.id,
      savedRouteId,
      curatedRouteRef: saved?.curatedRouteRef ?? null,
      riderReady: refreshed?.riderReady ?? false,
      geometryStatus: refreshed?.geometryStatus ?? null,
      rideWorthiness: refreshed?.rideWorthiness ?? null,
    }
  },
})

/**
 * AC-2 fixture: saved route with no plottable geometry (geometryStatus unresolved,
 * no curated_route_geometry row, no in-row routePolyline).
 */
export const seedS6T5SavedUnrecovered = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    await deleteCuratedRouteByRouteId(ctx, S6T5_SAVED_UNRECOVERED)

    const unrecovered = await seedCentroidOnlyRoute(ctx, {
      routeId: S6T5_SAVED_UNRECOVERED,
      name: 'S6T5 Saved Unrecovered',
      state: 'California',
      centroidLat: 35.12,
      centroidLng: -120.62,
      compositeScore: 0.87,
    })
    // Explicitly clear any legacy in-row polyline so resolveDetailRoutePolyline → null.
    await ctx.db.patch(unrecovered.id, {
      routePolyline: undefined,
      geometryStatus: 'unresolved',
    })

    const savedRouteId = await insertSavedBookmark(
      ctx,
      identity,
      unrecovered.id,
      'S6T5 bookmark — unrecovered',
    )
    const refreshed = (await ctx.db.get(unrecovered.id)) as Doc<'curated_routes'> | null
    const geomRow = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', S6T5_SAVED_UNRECOVERED))
      .first()

    return {
      routeId: S6T5_SAVED_UNRECOVERED,
      curatedDocId: unrecovered.id,
      savedRouteId,
      curatedRouteRef: unrecovered.id,
      riderReady: refreshed?.riderReady ?? false,
      geometryStatus: refreshed?.geometryStatus ?? null,
      hasGeometryRow: geomRow != null,
      hasInRowPolyline: refreshed?.routePolyline != null,
    }
  },
})

/**
 * AC-3 fixture: canonical + shadow (duplicateOf → canonical) + saved bookmark on shadow.
 * Read-path must redirect detail to canonical WITHOUT mutating saved_routes.curatedRouteRef.
 */
export const seedS6T5ShadowOfCanonical = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    await deleteCuratedRouteByRouteId(ctx, S6T5_SHADOW)
    await deleteCuratedRouteByRouteId(ctx, S6T5_CANONICAL)

    const canonical = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T5_CANONICAL,
      name: 'S6T5 Canonical',
      state: 'California',
      centroidLat: 35.2,
      centroidLng: -120.7,
      compositeScore: 0.93,
    })

    const shadow = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T5_SHADOW,
      name: 'S6T5 Shadow',
      state: 'California',
      centroidLat: 35.21,
      centroidLng: -120.71,
      compositeScore: 0.5,
    })
    await ctx.db.patch(shadow.id, {
      duplicateOf: S6T5_CANONICAL,
      // Shadow has no usable geometry status for the rider — status may differ.
      geometryStatus: 'unresolved',
    })
    // Drop shadow geometry so a missed redirect cannot accidentally look "ok".
    const shadowGeom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', S6T5_SHADOW))
      .first()
    if (shadowGeom) await ctx.db.delete(shadowGeom._id)
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: shadow.id,
    })

    const savedRouteId = await insertSavedBookmark(
      ctx,
      identity,
      shadow.id,
      'S6T5 bookmark — shadow of canonical',
    )
    const savedBefore = (await ctx.db.get(savedRouteId)) as Doc<'saved_routes'> | null
    const canonRef = (await ctx.db.get(canonical.id)) as Doc<'curated_routes'> | null
    const shadowRef = (await ctx.db.get(shadow.id)) as Doc<'curated_routes'> | null

    return {
      canonicalRouteId: S6T5_CANONICAL,
      shadowRouteId: S6T5_SHADOW,
      canonicalDocId: canonical.id,
      shadowDocId: shadow.id,
      savedRouteId,
      curatedRouteRef: savedBefore?.curatedRouteRef ?? null,
      canonicalGeometryStatus: canonRef?.geometryStatus ?? null,
      shadowGeometryStatus: shadowRef?.geometryStatus ?? null,
      shadowDuplicateOf: shadowRef?.duplicateOf ?? null,
      canonicalRiderReady: canonRef?.riderReady ?? false,
    }
  },
})

/**
 * AC-3 chain-guard fixture: corrupted A↔B duplicateOf cycle (single-hop max).
 */
export const seedS6T5CanonicalChainGuard = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    await deleteCuratedRouteByRouteId(ctx, S6T5_CHAIN_A)
    await deleteCuratedRouteByRouteId(ctx, S6T5_CHAIN_B)

    const a = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T5_CHAIN_A,
      name: 'S6T5 Chain A',
      state: 'California',
      centroidLat: 35.3,
      centroidLng: -120.8,
      compositeScore: 0.7,
    })
    const b = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T5_CHAIN_B,
      name: 'S6T5 Chain B',
      state: 'California',
      centroidLat: 35.31,
      centroidLng: -120.81,
      compositeScore: 0.71,
    })
    await ctx.db.patch(a.id, { duplicateOf: S6T5_CHAIN_B })
    await ctx.db.patch(b.id, { duplicateOf: S6T5_CHAIN_A })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: a.id,
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: b.id,
    })

    return {
      chainA: S6T5_CHAIN_A,
      chainB: S6T5_CHAIN_B,
      aDuplicateOf: S6T5_CHAIN_B,
      bDuplicateOf: S6T5_CHAIN_A,
    }
  },
})

/**
 * AC-4 fixture: ready saved route that will progress quarantine → retire → shadow.
 * Companion canonical used for the final shadow-merge hop.
 */
export const seedS6T5StatusProgression = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx)
    await deleteCuratedRouteByRouteId(ctx, S6T5_PROGRESSION)
    await deleteCuratedRouteByRouteId(ctx, S6T5_PROGRESSION_CANONICAL)

    const progression = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T5_PROGRESSION,
      name: 'S6T5 Progression',
      state: 'California',
      centroidLat: 35.4,
      centroidLng: -120.9,
      compositeScore: 0.91,
    })
    const canonical = await seedAllSevenReadyRoute(ctx, {
      routeId: S6T5_PROGRESSION_CANONICAL,
      name: 'S6T5 Progression Canonical',
      state: 'California',
      centroidLat: 35.41,
      centroidLng: -120.91,
      compositeScore: 0.94,
    })

    const savedRouteId = await insertSavedBookmark(
      ctx,
      identity,
      progression.id,
      'S6T5 bookmark — status progression',
    )
    const refreshed = (await ctx.db.get(progression.id)) as Doc<'curated_routes'> | null

    return {
      routeId: S6T5_PROGRESSION,
      canonicalRouteId: S6T5_PROGRESSION_CANONICAL,
      curatedDocId: progression.id,
      canonicalDocId: canonical.id,
      savedRouteId,
      curatedRouteRef: progression.id,
      riderReady: refreshed?.riderReady ?? false,
      geometryStatus: refreshed?.geometryStatus ?? null,
    }
  },
})

/** AC-4 stage 1: quarantine length_outlier → riderReady false (real recompute). */
export const advanceS6T5ProgressionQuarantine = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', S6T5_PROGRESSION))
      .unique()
    if (!route) throw new Error(`missing ${S6T5_PROGRESSION}`)
    await ctx.db.patch(route._id, {
      quarantine: { reason: 'length_outlier', flaggedAt: Date.now() },
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: route._id,
    })
    const refreshed = (await ctx.db.get(route._id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T5_PROGRESSION,
      stage: 'quarantine',
      riderReady: refreshed?.riderReady ?? false,
      quarantine: refreshed?.quarantine ?? null,
      geometryStatus: refreshed?.geometryStatus ?? null,
    }
  },
})

/**
 * AC-4 stage 2: retire with honest status fields (geometryStatus retired + reason + retiredAt).
 * Mirrors retireRoute field writes; used after quarantine so detail stays reachable.
 */
export const advanceS6T5ProgressionRetire = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', S6T5_PROGRESSION))
      .unique()
    if (!route) throw new Error(`missing ${S6T5_PROGRESSION}`)
    const retiredAt = Date.now()
    const retirementReason = 'S6-T5 AC-4 founder retirement after quarantine'
    await ctx.db.patch(route._id, {
      geometryStatus: 'retired',
      retiredAt,
      retirementReason,
      riderReady: false,
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: route._id,
    })
    const refreshed = (await ctx.db.get(route._id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T5_PROGRESSION,
      stage: 'retire',
      riderReady: refreshed?.riderReady ?? false,
      geometryStatus: refreshed?.geometryStatus ?? null,
      retiredAt: refreshed?.retiredAt ?? null,
      retirementReason: refreshed?.retirementReason ?? null,
    }
  },
})

/**
 * AC-4 stage 3: unretire exclusion then shadow-merge onto progression canonical.
 * Sets duplicateOf so getCuratedRouteDetail must redirect to the canonical row.
 */
export const advanceS6T5ProgressionShadow = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', S6T5_PROGRESSION))
      .unique()
    if (!route) throw new Error(`missing ${S6T5_PROGRESSION}`)
    await ctx.db.patch(route._id, {
      retiredAt: null,
      retirementReason: undefined,
      geometryStatus: 'unresolved',
      quarantine: undefined,
      duplicateOf: S6T5_PROGRESSION_CANONICAL,
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: route._id,
    })
    const refreshed = (await ctx.db.get(route._id)) as Doc<'curated_routes'> | null
    return {
      routeId: S6T5_PROGRESSION,
      stage: 'shadow',
      duplicateOf: refreshed?.duplicateOf ?? null,
      riderReady: refreshed?.riderReady ?? false,
      geometryStatus: refreshed?.geometryStatus ?? null,
      canonicalRouteId: S6T5_PROGRESSION_CANONICAL,
    }
  },
})

/** Read-back for AC-3 immutability: saved_routes row by id (no mutation). */
export const getS6T5SavedRouteSnapshot = query({
  args: { savedRouteId: v.id('saved_routes') },
  handler: async (ctx, { savedRouteId }) => {
    await requireIdentity(ctx)
    const doc = await ctx.db.get(savedRouteId)
    if (!doc) return null
    return {
      _id: doc._id,
      curatedRouteRef: doc.curatedRouteRef ?? null,
      name: doc.name,
      ownerId: doc.ownerId,
      updatedAt: doc.updatedAt,
      createdAt: doc.createdAt,
      deletedAt: doc.deletedAt ?? null,
    }
  },
})

export const teardownS6T5Fixtures = mutation({
  args: {
    routeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const ids = args.routeIds ?? [...S6T5_ROUTE_IDS]
    let deleted = 0
    for (const routeId of ids) {
      if (await deleteCuratedRouteByRouteId(ctx, routeId)) deleted++
    }
    return { status: 'deleted', count: deleted }
  },
})
