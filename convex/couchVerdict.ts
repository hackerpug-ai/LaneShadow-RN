/**
 * S4-T6 / VER-05: Couch verdict recording + --all gate.
 *
 * recordCouchVerdict persists per-route (true|off|wrong) + overall pass/fail.
 * A single 'wrong' forces overall fail (reject pass).
 * couchGateStatus / runAllWaterfall block full-batch until overallVerdict=pass.
 */

import { ConvexError, v } from 'convex/values'
import { api, internal } from './_generated/api'
import { action, internalMutation, mutation, query } from './_generated/server'
import { geospatial } from './geospatialIndex'
import { requireFounder, requireIdentity, requireOperator } from './guards'

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
    const identity = await requireOperator(ctx)

    if (routeVerdicts.length === 0) {
      throw new ConvexError({
        code: 'EMPTY_ROUTE_VERDICTS',
        message: 'routeVerdicts must not be empty',
      })
    }

    // FIX-03/04: Load frozen manifest — reject if not found or not frozen
    const manifest = await ctx.db
      .query('couch_samples')
      .withIndex('by_sampleId', (q) => q.eq('sampleId', sampleId))
      .first()

    if (!manifest) {
      throw new ConvexError({
        code: 'MANIFEST_NOT_FOUND',
        message: `No couch sample found for sampleId '${sampleId}' — verdict requires a frozen manifest`,
      })
    }

    if (manifest.status !== 'frozen') {
      throw new ConvexError({
        code: 'MANIFEST_NOT_FROZEN',
        message: `Couch sample '${sampleId}' status is '${manifest.status ?? 'draft'}', not 'frozen' — verdict requires a frozen immutable manifest`,
      })
    }

    // FIX-03/04: Verify exact membership (same set, no missing, no extras, no duplicates)
    const manifestRouteIds = new Set((manifest.routes ?? []).map((r: any) => r.routeId))
    const verdictRouteIds = new Set(routeVerdicts.map((r) => r.routeId))

    // Check for missing routes (in manifest but not in verdict)
    const missing = [...manifestRouteIds].filter((id) => !verdictRouteIds.has(id))
    if (missing.length > 0) {
      throw new ConvexError({
        code: 'VERDICT_MISSING_ROUTES',
        message: `Verdict is missing ${missing.length} route(s) from the frozen manifest: ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? '...' : ''}`,
      })
    }

    // Check for extra routes (in verdict but not in manifest)
    const extra = [...verdictRouteIds].filter((id) => !manifestRouteIds.has(id))
    if (extra.length > 0) {
      throw new ConvexError({
        code: 'VERDICT_EXTRA_ROUTES',
        message: `Verdict contains ${extra.length} route(s) not in the frozen manifest: ${extra.slice(0, 3).join(', ')}${extra.length > 3 ? '...' : ''}`,
      })
    }

    // Check for duplicate routeIds in verdict
    if (verdictRouteIds.size !== routeVerdicts.length) {
      throw new ConvexError({
        code: 'VERDICT_DUPLICATE_ROUTES',
        message: 'Verdict contains duplicate routeIds — each route must have exactly one verdict',
      })
    }

    const resolved = resolveOverallVerdict(overallVerdict, routeVerdicts)
    if (resolved.rejected) {
      throw new ConvexError({
        code: 'WRONG_FORCES_FAIL',
        message: resolved.reason ?? 'wrong forces fail',
      })
    }

    // FIX-03/04: APPEND-ONLY — always INSERT a new verdict, never replace
    const doc = {
      sampleId,
      overallVerdict: resolved.overallVerdict,
      routeVerdicts,
      recordedAt: Date.now(),
      recordedBy: identity.clerkUserId,
      // FIX-03/04: Bind to frozen manifest
      manifestHash: manifest.manifestHash,
      catalogVersion: manifest.catalogVersion,
    }

    await ctx.db.insert('couch_verdicts', doc)

    return {
      sampleId,
      overallVerdict: resolved.overallVerdict,
      routeVerdicts,
      recordedAt: doc.recordedAt,
      recordedBy: doc.recordedBy,
      manifestHash: doc.manifestHash,
      catalogVersion: doc.catalogVersion,
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
      // FIX-03/04: APPEND-ONLY — return latest verdict by recordedAt for this sampleId
      const rows = await ctx.db
        .query('couch_verdicts')
        .withIndex('by_sampleId', (q) => q.eq('sampleId', sampleId))
        .take(100)
      if (rows.length === 0) return null
      return rows.sort((a, b) => b.recordedAt - a.recordedAt)[0]
    }
    // Latest by recordedAt across all samples
    const rows = await ctx.db.query('couch_verdicts').take(50)
    if (rows.length === 0) return null
    return rows.sort((a, b) => b.recordedAt - a.recordedAt)[0]
  },
})

/**
 * Gate status for full-batch (--all).
 *
 * FIX-03/04: Only allowed when the latest pass verdict is bound to a CURRENT
 * active/frozen manifest whose catalogVersion matches the live catalog.
 * If the manifest's geometry/catalog version has drifted since the verdict, block.
 */
export const couchGateStatus = query({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    // FIX-04: bind the unlock to the SINGLE current active manifest = the latest
    // frozen couch_sample. A historical pass on an older manifest cannot remain
    // eligible after a newer sample is frozen (which happens on geometry/catalog
    // change). catalogVersion is derived from the active manifest, not hardcoded.
    const frozenSamples = await ctx.db.query('couch_samples').collect()
    const activeManifest = frozenSamples
      .filter((s) => s.status === 'frozen')
      .sort((a, b) => (b.frozenAt ?? b.createdAt) - (a.frozenAt ?? a.createdAt))[0]

    if (!activeManifest) {
      return {
        allowed: false,
        overallVerdict: null as 'pass' | 'fail' | null,
        reason: 'Couch gate blocked: no frozen manifest (active sample) exists',
        sampleId: null as string | null,
        manifestHash: null as string | null,
      }
    }

    const activeManifestHash = activeManifest.manifestHash ?? null
    const activeCatalogVersion = activeManifest.catalogVersion ?? null

    // Latest pass verdict bound to THIS active manifest (sampleId + manifestHash
    // + catalogVersion). Uses the by_sampleId index then filters in-memory.
    const verdicts = await ctx.db
      .query('couch_verdicts')
      .withIndex('by_sampleId', (q) => q.eq('sampleId', activeManifest.sampleId))
      .collect()
    const boundPass = verdicts
      .filter(
        (v) =>
          v.overallVerdict === 'pass' &&
          (!activeManifestHash || !v.manifestHash || v.manifestHash === activeManifestHash) &&
          (!activeCatalogVersion || !v.catalogVersion || v.catalogVersion === activeCatalogVersion),
      )
      .sort((a, b) => b.recordedAt - a.recordedAt)[0]

    if (!boundPass) {
      return {
        allowed: false,
        overallVerdict: null,
        reason: `Couch gate blocked: no pass verdict bound to the current active manifest ${activeManifest.sampleId}`,
        sampleId: activeManifest.sampleId,
        manifestHash: activeManifestHash,
      }
    }

    return {
      allowed: true,
      overallVerdict: 'pass' as const,
      reason: null as string | null,
      sampleId: activeManifest.sampleId,
      recordedAt: boundPass.recordedAt,
      manifestHash: activeManifestHash,
    }
  },
})

/**
 * FIX-08: Clear couch verdicts — internalMutation.
 * Use clearCouchVerdictsPublic instead.
 */
export const clearCouchVerdicts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('couch_verdicts').take(100)
    for (const r of rows) {
      await ctx.db.delete(r._id)
    }
    return { cleared: rows.length }
  },
})

/** FIX-08: Public founder-gated wrapper for clearCouchVerdicts. */
export const clearCouchVerdictsPublic = mutation({
  args: {},
  handler: async (ctx): Promise<{ cleared: number }> => {
    await requireFounder(ctx)
    const result: { cleared: number } = await ctx.runMutation(
      internal.couchVerdict.clearCouchVerdicts,
      {},
    )
    return result
  },
})

// ---------------------------------------------------------------------------
// --all waterfall gate (blocks until couch pass)
// ---------------------------------------------------------------------------

const POLY_41MI =
  'oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@sq@k~@uq@'

const ALL_BATCH_PREFIX = 'test:couch-all-'

export const seedAllBatchFixtures = internalMutation({
  args: {},
  handler: async (ctx) => {
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
        evidenceComplete: true,
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

export const teardownAllBatchFixtures = internalMutation({
  args: {},
  handler: async (ctx) => {
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

/** FIX-08: Public founder-gated wrappers for all-batch fixtures. */
export const seedAllBatchFixturesPublic = mutation({
  args: {},
  handler: async (ctx): Promise<{ routeId: string; created: boolean }> => {
    await requireFounder(ctx)
    const result: { routeId: string; created: boolean } = await ctx.runMutation(
      internal.couchVerdict.seedAllBatchFixtures,
      {},
    )
    return result
  },
})

export const teardownAllBatchFixturesPublic = mutation({
  args: {},
  handler: async (ctx): Promise<{ removed: string[]; count: number }> => {
    await requireFounder(ctx)
    const result: { removed: string[]; count: number } = await ctx.runMutation(
      internal.couchVerdict.teardownAllBatchFixtures,
      {},
    )
    return result
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
