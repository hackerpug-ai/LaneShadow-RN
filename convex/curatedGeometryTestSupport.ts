import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Doc } from './_generated/dataModel'
import { mutation } from './_generated/server'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'

const TEPUSQUET_SUMMARY =
  'Highway 101 in Santa Maria, CA. Exit Betteravia Road heading East. Betteravia Road becomes Foxen Canyon Road. Foxen Canyon Road becomes Santa Maria Mesa Road. Santa Maria Mesa Road merges into Tepusquet Canyon Road. Head North on Tepusquet Canyon Road. Follow this all the way up the mountain and back down until you reach highway 166. Follow 166 West until you reach highway 101 again.'

async function insertTestRoute(
  ctx: any,
  row: {
    routeId: string
    name: string
    lengthMiles: number
    centroidLat?: number
    centroidLng?: number
    quarantine?: { reason: 'zero_length' | 'length_outlier' | 'test_row'; flaggedAt: number }
    rideWorthiness?: {
      verdict: 'ride' | 'marginal' | 'not_a_ride'
      reason: string
      model: string
      classifiedAt: number
    }
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
    await ctx.db.patch(existing._id, {
      name: row.name,
      lengthMiles: row.lengthMiles,
      centroidLat,
      centroidLng,
      compositeScore: 85,
      rideWorthiness: row.rideWorthiness ?? {
        verdict: 'ride',
        reason: 'spike seed',
        model: 'test',
        classifiedAt: nowMs,
      },
      quarantine: row.quarantine,
      retiredAt: undefined,
      duplicateOf: undefined,
    })
    await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
      id: existing._id,
    })
    return { routeId: row.routeId, id: existing._id, created: false, refreshed: true }
  }

  const centroidLat = row.centroidLat ?? 34.95
  const centroidLng = row.centroidLng ?? -120.42
  const nowMs = Date.now()
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
    compositeScore: 85,
    curvatureScore: 90,
    scenicScore: 80,
    technicalScore: 85,
    trafficScore: 75,
    remotenessScore: 70,
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
  })

  await geospatial.insert(
    ctx,
    docId,
    { latitude: centroidLat, longitude: centroidLng },
    { state: 'California', primaryArchetype: 'twisties' },
    85,
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
