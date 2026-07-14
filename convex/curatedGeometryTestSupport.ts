import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { mutation, query } from './_generated/server'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'

const TEPUSQUET_SUMMARY =
  'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia Road becomes Foxen Canyon Road. Foxen Canyon Road becomes Santa Maria Mesa Road. Santa Maria Mesa Road merges into Tepusquet Canyon Road. Head North on Tepusquet Canyon Road. Follow this all the way up the mountain and back down until you reach highway 166. Follow 166 West until you reach highway 101 again.'

type ScoreOverrides = {
  compositeScore?: number
  curvatureScore?: number
  scenicScore?: number
  technicalScore?: number
  trafficScore?: number
  remotenessScore?: number
}

async function insertTestRoute(
  ctx: any,
  row: {
    routeId: string
    name: string
    lengthMiles: number
    centroidLat?: number
    centroidLng?: number
    name_lower?: string
    geometryStatus?: 'generated' | 'unresolved' | 'failed' | 'review'
    quarantine?: { reason: 'zero_length' | 'length_outlier' | 'test_row'; flaggedAt: number }
    rideWorthiness?: {
      verdict: 'ride' | 'marginal' | 'not_a_ride'
      reason: string
      model: string
      classifiedAt: number
    }
    scores?: ScoreOverrides
  },
) {
  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
    .first()

  if (existing) {
    const nowMs = Date.now()
    const centroidLat = row.centroidLat ?? 34.95
    const centroidLng = row.centroidLng ?? -120.42
    const scores = row.scores ?? {}
    await ctx.db.patch(existing._id, {
      name: row.name,
      lengthMiles: row.lengthMiles,
      centroidLat,
      centroidLng,
      compositeScore: scores.compositeScore ?? 85,
      curvatureScore: scores.curvatureScore,
      scenicScore: scores.scenicScore,
      technicalScore: scores.technicalScore,
      trafficScore: scores.trafficScore,
      remotenessScore: scores.remotenessScore,
      rideWorthiness: row.rideWorthiness ?? {
        verdict: 'ride',
        reason: 'spike seed',
        model: 'test',
        classifiedAt: nowMs,
      },
      quarantine: row.quarantine,
      retiredAt: undefined,
      duplicateOf: undefined,
      ...(row.name_lower != null ? { name_lower: row.name_lower } : {}),
      ...(row.geometryStatus != null ? { geometryStatus: row.geometryStatus } : {}),
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: existing._id,
    })
    return { routeId: row.routeId, id: existing._id, created: false, refreshed: true }
  }

  const centroidLat = row.centroidLat ?? 34.95
  const centroidLng = row.centroidLng ?? -120.42
  const nowMs = Date.now()
  const scores = row.scores ?? {}
  const docId = await ctx.db.insert('curated_routes', {
    routeId: row.routeId,
    name: row.name,
    state: 'California',
    source: row.routeId.startsWith('motorcycleroads:') ? 'motorcycleroads' : 'editorial',
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
    oneLiner: row.routeId.includes('tepusquet') ? '' : 'Test route',
    summary: row.routeId.includes('tepusquet') ? TEPUSQUET_SUMMARY : 'Test route summary',
    badges: [],
    season: 'year_round',
    contentVersion: 1,
    seededAt: nowMs,
    location: { type: 'Point', coordinates: [centroidLng, centroidLat] },
    rideWorthiness: row.rideWorthiness ?? {
      verdict: 'ride',
      reason: 'spike seed',
      model: 'test',
      classifiedAt: nowMs,
    },
    quarantine: row.quarantine,
    ...(row.name_lower != null ? { name_lower: row.name_lower } : {}),
    ...(row.geometryStatus != null ? { geometryStatus: row.geometryStatus } : {}),
  })

  await geospatial.insert(
    ctx,
    docId,
    { latitude: centroidLat, longitude: centroidLng },
    { state: 'California', primaryArchetype: 'twisties' },
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
        classifiedAt: nowMs,
      },
      retiredAt: undefined,
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

/** Seed 3 editorial rows with out-of-scale (0–100) composite + dimension scores. */
export const seedEditorialScoreRows = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return [
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-score-90',
        name: 'Hygiene Score 90',
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
        routeId: 'test:hyg-score-72',
        name: 'Hygiene Score 72',
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
      await insertTestRoute(ctx, {
        routeId: 'test:hyg-score-85',
        name: 'Hygiene Score 85',
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
    ]
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
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:cherohala-shadow-a',
        name: 'Cherohala Skyway',
        name_lower: 'cherohala skyway',
        lengthMiles: 41,
        centroidLat: CHEROHALA_LAT,
        centroidLng: CHEROHALA_LNG,
        scores: { compositeScore: 0.85 },
      }),
      await insertTestRoute(ctx, {
        routeId: 'test:cherohala-shadow-b',
        name: 'Cherohala Skyway',
        name_lower: 'cherohala skyway',
        lengthMiles: 41,
        centroidLat: CHEROHALA_LAT,
        centroidLng: CHEROHALA_LNG,
        scores: { compositeScore: 0.8 },
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
