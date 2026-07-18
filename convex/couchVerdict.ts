/**
 * S4-T6 / VER-05: Couch verdict recording + --all gate.
 *
 * recordCouchVerdict persists per-route (true|off|wrong) + overall pass/fail.
 * A single 'wrong' forces overall fail (reject pass).
 * couchGateStatus / runAllWaterfall block full-batch until overallVerdict=pass.
 */

import { ConvexError, v } from 'convex/values'
import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'

const routeVerdictValidator = v.object({
  routeId: v.string(),
  verdict: v.union(v.literal('true'), v.literal('off'), v.literal('wrong')),
})

export type RouteVerdict = {
  routeId: string
  verdict: 'true' | 'off' | 'wrong'
}

/**
 * Pure rule: any 'wrong' route forces overall fail.
 * Pass + wrong is illegal (fabricated-but-passing).
 */
export function resolveOverallVerdict(
  overallVerdict: 'pass' | 'fail',
  routeVerdicts: RouteVerdict[],
): { overallVerdict: 'pass' | 'fail'; rejected: boolean; reason: string | null } {
  const hasWrong = routeVerdicts.some((r) => r.verdict === 'wrong')
  if (hasWrong && overallVerdict === 'pass') {
    return {
      overallVerdict: 'fail',
      rejected: true,
      reason: 'Cannot pass couch gate with any routeVerdict=wrong (fabricated-but-passing)',
    }
  }
  if (hasWrong) {
    return { overallVerdict: 'fail', rejected: false, reason: null }
  }
  return { overallVerdict, rejected: false, reason: null }
}

// ---------------------------------------------------------------------------
// recordCouchVerdict
// ---------------------------------------------------------------------------

export const recordCouchVerdict = mutation({
  args: {
    sampleId: v.string(),
    overallVerdict: v.union(v.literal('pass'), v.literal('fail')),
    routeVerdicts: v.array(routeVerdictValidator),
  },
  handler: async (ctx, { sampleId, overallVerdict, routeVerdicts }) => {
    const identity = await requireIdentity(ctx)

    if (routeVerdicts.length === 0) {
      throw new ConvexError({
        code: 'EMPTY_ROUTE_VERDICTS',
        message: 'routeVerdicts must not be empty',
      })
    }

    const resolved = resolveOverallVerdict(overallVerdict, routeVerdicts)
    if (resolved.rejected) {
      throw new ConvexError({
        code: 'WRONG_FORCES_FAIL',
        message: resolved.reason ?? 'wrong forces fail',
      })
    }

    const existing = await ctx.db
      .query('couch_verdicts')
      .withIndex('by_sampleId', (q) => q.eq('sampleId', sampleId))
      .first()

    const doc = {
      sampleId,
      overallVerdict: resolved.overallVerdict,
      routeVerdicts,
      recordedAt: Date.now(),
      recordedBy: identity.clerkUserId,
    }

    if (existing) {
      await ctx.db.replace(existing._id, doc)
    } else {
      await ctx.db.insert('couch_verdicts', doc)
    }

    return {
      sampleId,
      overallVerdict: resolved.overallVerdict,
      routeVerdicts,
      recordedAt: doc.recordedAt,
      recordedBy: doc.recordedBy,
    }
  },
})

export const getCouchVerdict = query({
  args: {
    sampleId: v.optional(v.string()),
  },
  handler: async (ctx, { sampleId }) => {
    await requireIdentity(ctx)
    if (sampleId) {
      return (
        (await ctx.db
          .query('couch_verdicts')
          .withIndex('by_sampleId', (q) => q.eq('sampleId', sampleId))
          .first()) ?? null
      )
    }
    // Latest by recordedAt
    const rows = await ctx.db.query('couch_verdicts').take(50)
    if (rows.length === 0) return null
    return rows.sort((a, b) => b.recordedAt - a.recordedAt)[0]
  },
})

/**
 * Gate status for full-batch (--all). Allowed only when a pass verdict exists.
 */
export const couchGateStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const passes = await ctx.db
      .query('couch_verdicts')
      .withIndex('by_overallVerdict', (q) => q.eq('overallVerdict', 'pass'))
      .take(5)

    if (passes.length === 0) {
      return {
        allowed: false,
        overallVerdict: null as 'pass' | 'fail' | null,
        reason: 'Couch gate blocked: no recordCouchVerdict({overallVerdict:"pass"}) yet',
        sampleId: null as string | null,
      }
    }

    const latest = passes.sort((a, b) => b.recordedAt - a.recordedAt)[0]
    return {
      allowed: true,
      overallVerdict: 'pass' as const,
      reason: null as string | null,
      sampleId: latest.sampleId,
      recordedAt: latest.recordedAt,
    }
  },
})

export const clearCouchVerdicts = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const rows = await ctx.db.query('couch_verdicts').take(100)
    for (const r of rows) {
      await ctx.db.delete(r._id)
    }
    return { cleared: rows.length }
  },
})

// ---------------------------------------------------------------------------
// --all waterfall gate (blocks until couch pass)
// ---------------------------------------------------------------------------

const POLY_41MI =
  'oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@sq@k~@uq@'

const ALL_BATCH_PREFIX = 'test:couch-all-'

export const seedAllBatchFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const routeId = `${ALL_BATCH_PREFIX}001`
    const existing = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const centroidLat = 35.1
    const centroidLng = -120.5
    const nowMs = Date.now()
    const base = {
      name: 'Couch All Batch 001',
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
      routePolyline: POLY_41MI,
      geometryStatus: 'unresolved' as const,
      geometryProvenance: undefined,
      riderReady: false,
      state: 'California',
      summary: 'S4-T6 --all gate fixture with scrapable polyline for Lever 1.',
      retiredAt: undefined,
      duplicateOf: undefined,
      quarantine: undefined,
    }

    if (existing) {
      // Clear prior geometry so waterfall actually runs levers
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      if (geom) await ctx.db.delete(geom._id)
      await ctx.db.patch(existing._id, base)
      return { routeId, created: false }
    }

    const docId = await ctx.db.insert('curated_routes', {
      routeId,
      source: 'editorial',
      primaryArchetype: 'twisties',
      secondaryTags: ['test', 's4t6', 'all-batch'],
      oneLiner: 'Couch all-batch fixture',
      badges: [],
      season: 'year_round',
      contentVersion: 1,
      seededAt: nowMs,
      rideWorthiness: {
        verdict: 'ride' as const,
        reason: 's4t6 all-batch seed',
        model: 'test',
        classifiedAt: nowMs,
      },
      ...base,
    })

    try {
      await geospatial.insert(
        ctx,
        docId,
        { latitude: centroidLat, longitude: centroidLng },
        { state: 'California', primaryArchetype: 'twisties' },
        85,
      )
    } catch {
      /* index may exist */
    }

    return { routeId, created: true }
  },
})

export const teardownAllBatchFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    const removed: string[] = []
    for (const status of ['generated', 'unresolved', 'review', 'failed'] as const) {
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', status))
        .take(100)
      for (const row of rows) {
        if (!row.routeId.startsWith(ALL_BATCH_PREFIX)) continue
        const geom = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
          .first()
        if (geom) await ctx.db.delete(geom._id)
        try {
          await geospatial.remove(ctx, row._id)
        } catch {
          /* ok */
        }
        await ctx.db.delete(row._id)
        removed.push(row.routeId)
      }
    }
    return { removed, count: removed.length }
  },
})

/**
 * Full-batch entry point. STRICTLY blocked until couchGateStatus.allowed.
 * After pass, delegates to the S4-T5 waterfall orchestrator.
 */
type CouchGateSnapshot = {
  allowed: boolean
  overallVerdict: 'pass' | 'fail' | null
  reason: string | null
  sampleId: string | null
  recordedAt?: number
}

type RunAllWaterfallResult = {
  mode: 'all'
  gate: { allowed: true; overallVerdict: 'pass' | 'fail' | null }
  routes: unknown[]
  processed: number
  skipped: number
  reprocessed: number
  totalCostUsd: number
  maxCostUsd: number | null
  batchStopReason: string | null
  costExceededMessage: string | null
  perLeverCounts: { lever1: number; lever2: number; lever3: number }
  perStateCounts: Record<string, number>
  backoffScheduleSeconds: number[]
  maxRetries: number
}

export const runAllWaterfall = action({
  args: {
    routeIds: v.array(v.string()),
    maxCost: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<RunAllWaterfallResult> => {
    await requireIdentity(ctx)

    const gate = (await ctx.runQuery(api.couchVerdict.couchGateStatus, {})) as CouchGateSnapshot
    if (!gate.allowed) {
      throw new ConvexError({
        code: 'COUCH_GATE_BLOCKED',
        message:
          gate.reason ??
          'Couch gate blocked --all until recordCouchVerdict({overallVerdict:"pass"})',
      })
    }

    // Reuse S4-T5 waterfall for the gated full batch
    const report = await ctx.runAction(api.waterfallOrchestrator.runSampleWaterfall, {
      routeIds: args.routeIds,
      maxCost: args.maxCost ?? 10,
    })

    return {
      mode: 'all' as const,
      gate: { allowed: true as const, overallVerdict: gate.overallVerdict },
      ...report,
    }
  },
})
