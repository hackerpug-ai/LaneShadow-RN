/**
 * S4-T5: Resumable --sample waterfall orchestrator.
 *
 * Lever cascade: 1 promote → 2 reconstruct → 3 re-route until gate-pass.
 * Cost circuit-breaker (~$0.07/reconstruct), rate-limit exponential backoff,
 * resume skips already-PASSed (geometryStatus==='generated') routes.
 *
 * Every processed route ends in exactly one terminal state:
 *   recovered | queued | retirement_eligible
 */

import { v } from 'convex/values'
import { api, internal } from './_generated/api'
import type { ActionCtx } from './_generated/server'
import { action, internalMutation, mutation } from './_generated/server'
import { geospatial } from './geospatialIndex'
import { requireIdentity } from './guards'

/** Estimated USD cost per Lever-2 reconstruct (LLM + geocode + routes). */
export const COST_PER_RECONSTRUCT_USD = 0.07

/** Max attempts including the first try. Backoff applies between attempts. */
export const DEFAULT_MAX_RETRIES = 5

/**
 * Exponential backoff schedule in seconds: base * 2^i for i in [0, maxRetries-2].
 * With defaults: [1, 2, 4, 8] for 5 total attempts (4 backoffs).
 */
export function computeBackoffDelaysSeconds(
  maxRetries: number = DEFAULT_MAX_RETRIES,
  baseSeconds: number = 1,
): number[] {
  if (maxRetries < 2) return []
  const delays: number[] = []
  for (let i = 0; i < maxRetries - 1; i++) {
    delays.push(baseSeconds * 2 ** i)
  }
  return delays
}

export type RateLimitError = Error & { status?: number; isRateLimit?: boolean }

export function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false
  const e = err as RateLimitError
  if (e.isRateLimit === true) return true
  if (e.status === 429 || e.status === 503) return true
  const msg = String((e as Error).message ?? err)
  return /\b429\b/.test(msg) || /rate.?limit/i.test(msg) || /\b503\b/.test(msg)
}

/**
 * Retry `fn` with exponential backoff on rate-limit errors.
 * Returns { result, attempts, backoffDelays } for evidence.
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  opts: {
    maxRetries?: number
    baseSeconds?: number
    /** Inject sleep for tests; default uses real setTimeout. */
    sleep?: (ms: number) => Promise<void>
  } = {},
): Promise<{ result: T; attempts: number; backoffDelays: number[] }> {
  const maxRetries = opts.maxRetries ?? DEFAULT_MAX_RETRIES
  const baseSeconds = opts.baseSeconds ?? 1
  const sleep = opts.sleep ?? ((ms: number) => new Promise((r) => setTimeout(r, ms)))
  const schedule = computeBackoffDelaysSeconds(maxRetries, baseSeconds)
  let lastErr: unknown
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      return {
        result,
        attempts: attempt,
        backoffDelays: schedule.slice(0, attempt - 1),
      }
    } catch (err) {
      lastErr = err
      if (!isRateLimitError(err) || attempt >= maxRetries) {
        throw err
      }
      const delaySec = schedule[attempt - 1] ?? baseSeconds * 2 ** (attempt - 1)
      await sleep(delaySec * 1000)
    }
  }
  throw lastErr
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TerminalState = 'recovered' | 'queued' | 'retirement_eligible'

type RouteWaterfallResult = {
  routeId: string
  terminalState: TerminalState
  skipped: boolean
  reprocessed: boolean
  leversRun: number[]
  provenance?: 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'
  lever1Failed?: boolean
  lever2Failed?: boolean
  failedCondition?: string | null
  costUsd: number
}

type WaterfallReport = {
  routes: RouteWaterfallResult[]
  processed: number
  skipped: number
  reprocessed: number
  totalCostUsd: number
  maxCostUsd: number | null
  batchStopReason: 'completed' | 'cost_exceeded' | null
  costExceededMessage: string | null
  perLeverCounts: { lever1: number; lever2: number; lever3: number }
  perStateCounts: {
    recovered: number
    queued: number
    retirement_eligible: number
    skipped: number
  }
  backoffScheduleSeconds: number[]
  maxRetries: number
}

// ---------------------------------------------------------------------------
// Seeds (public_api seed_method for fixtures)
// ---------------------------------------------------------------------------

/** Gate-passing ~41mi polyline used by Lever 1 tests (same as S4-T2 POLY_41MI). */
const POLY_41MI =
  'oditE~o~}Uk~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@sq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@sq@k~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@uq@k~@uq@i~@uq@k~@uq@k~@uq@i~@sq@k~@uq@'

const WATERFALL_ROUTE_IDS = [
  'test:lever1-pass',
  'test:lever2-pass',
  'test:review-candidate',
] as const

async function upsertWaterfallRoute(
  ctx: any,
  row: {
    routeId: string
    name: string
    lengthMiles: number
    routePolyline?: string
    summary?: string
    centroidLat?: number
    centroidLng?: number
    state?: string
    geometryStatus?: 'generated' | 'unresolved' | 'failed' | 'review'
    geometryProvenance?: 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'
    compositeScore?: number
  },
) {
  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
    .first()

  const centroidLat = row.centroidLat ?? 34.95
  const centroidLng = row.centroidLng ?? -120.42
  const nowMs = Date.now()
  const compositeScore = row.compositeScore ?? 85

  const base = {
    name: row.name,
    lengthMiles: row.lengthMiles,
    centroidLat,
    centroidLng,
    boundsNeLat: centroidLat + 0.3,
    boundsNeLng: centroidLng + 0.3,
    boundsSwLat: centroidLat - 0.3,
    boundsSwLng: centroidLng - 0.3,
    location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
    compositeScore,
    curvatureScore: 90,
    scenicScore: 80,
    technicalScore: 85,
    trafficScore: 75,
    remotenessScore: 70,
    routePolyline: row.routePolyline,
    geometryStatus: row.geometryStatus ?? 'unresolved',
    geometryProvenance: row.geometryProvenance,
    riderReady: row.geometryStatus === 'generated',
    state: row.state ?? 'California',
    summary: row.summary ?? 'S4-T5 waterfall test route',
    retiredAt: undefined,
    duplicateOf: undefined,
    quarantine: undefined,
  }

  if (existing) {
    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
      .first()
    if (geom && row.geometryStatus !== 'generated') {
      await ctx.db.delete(geom._id)
    }
    await ctx.db.patch(existing._id, base)
    try {
      await geospatial.insert(
        ctx,
        existing._id,
        { latitude: centroidLat, longitude: centroidLng },
        { state: row.state ?? 'California', primaryArchetype: 'twisties' },
        compositeScore,
      )
    } catch {
      /* index may already hold the point */
    }
    return { routeId: row.routeId, id: existing._id, created: false }
  }

  const docId = await ctx.db.insert('curated_routes', {
    routeId: row.routeId,
    source: 'editorial',
    primaryArchetype: 'twisties',
    secondaryTags: ['test', 's4t5'],
    oneLiner: 'S4-T5 waterfall test route',
    badges: [],
    season: 'year_round',
    contentVersion: 1,
    seededAt: nowMs,
    rideWorthiness: {
      verdict: 'ride' as const,
      reason: 's4t5 seed',
      model: 'test',
      classifiedAt: nowMs,
    },
    ...base,
  })

  await geospatial.insert(
    ctx,
    docId,
    { latitude: centroidLat, longitude: centroidLng },
    { state: row.state ?? 'California', primaryArchetype: 'twisties' },
    compositeScore,
  )

  return { routeId: row.routeId, id: docId, created: true }
}

export const seedWaterfallFixtures = mutation({
  args: {},
  handler: async (ctx) => {
    await requireIdentity(ctx)
    return {
      lever1Pass: await upsertWaterfallRoute(ctx, {
        routeId: 'test:lever1-pass',
        name: 'Waterfall Lever 1 Passing',
        routePolyline: POLY_41MI,
        lengthMiles: 41,
        compositeScore: 85,
        geometryStatus: 'unresolved',
      }),
      lever2Pass: await upsertWaterfallRoute(ctx, {
        routeId: 'test:lever2-pass',
        name: 'Waterfall Lever 2 Reconstruct',
        // No in-row polyline → Lever 1 fails → Lever 2
        summary: 'Highway 101 in Santa Maria through the Santa Ynez Valley coastal corridor.',
        lengthMiles: 41,
        compositeScore: 85,
        geometryStatus: 'unresolved',
      }),
      reviewCandidate: await upsertWaterfallRoute(ctx, {
        routeId: 'test:review-candidate',
        name: 'Review Candidate',
        // No polyline, unparseable name → all levers fail → REVIEW
        lengthMiles: 10,
        compositeScore: 85,
        geometryStatus: 'unresolved',
      }),
    }
  },
})

/** Seed N already-PASSed routes for resume tests. */
export const seedPassedSampleRoutes = mutation({
  args: {
    count: v.number(),
    prefix: v.optional(v.string()),
  },
  handler: async (ctx, { count, prefix }) => {
    await requireIdentity(ctx)
    const p = prefix ?? 'test:s4t5-passed'
    const seeded: string[] = []
    for (let i = 0; i < count; i++) {
      const routeId = `${p}-${String(i).padStart(3, '0')}`
      await upsertWaterfallRoute(ctx, {
        routeId,
        name: `Passed Sample ${i}`,
        routePolyline: POLY_41MI,
        lengthMiles: 41,
        geometryStatus: 'generated',
        geometryProvenance: 'scraped_promoted',
      })
      // Side-table geometry so verification is consistent
      const existing = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      const geomDoc = {
        routeId,
        format: 'polyline' as const,
        encoding: 'utf-8',
        precision: 5,
        value: POLY_41MI,
        provenance: 'scraped_promoted' as const,
        verification: {
          routeId,
          verdict: 'pass' as const,
          provenance: 'scraped_promoted',
          geometry: POLY_41MI,
          geometryStatus: 'generated' as const,
          anchorCount: 2,
          anchors: [],
          pointCount: 50,
          degenerate: false,
          ratio: 1.0,
          claimedMiles: 41,
          routedMiles: 41,
        },
      }
      if (existing) {
        await ctx.db.replace(existing._id, geomDoc)
      } else {
        await ctx.db.insert('curated_route_geometry', geomDoc)
      }
      seeded.push(routeId)
    }
    return { seeded, count: seeded.length }
  },
})

/** Seed N unresolved routes that will burn Lever-2 cost (no polyline). */
export const seedCostBurnRoutes = mutation({
  args: {
    count: v.number(),
    prefix: v.optional(v.string()),
  },
  handler: async (ctx, { count, prefix }) => {
    await requireIdentity(ctx)
    const p = prefix ?? 'test:s4t5-cost'
    const seeded: string[] = []
    for (let i = 0; i < count; i++) {
      const routeId = `${p}-${String(i).padStart(3, '0')}`
      await upsertWaterfallRoute(ctx, {
        routeId,
        name: `Cost Burn ${i}`,
        // No polyline → L1 fails → L2 attempts (cost)
        summary: 'Cost circuit-breaker reconstruct candidate.',
        lengthMiles: 41,
        geometryStatus: 'unresolved',
      })
      seeded.push(routeId)
    }
    return { seeded, count: seeded.length }
  },
})

export const teardownWaterfallFixtures = mutation({
  args: {
    prefixes: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { prefixes }) => {
    await requireIdentity(ctx)
    const exact = [...WATERFALL_ROUTE_IDS]
    const prefixList = prefixes ?? [
      'test:s4t5-passed',
      'test:s4t5-cost',
      'test:s4t5-review',
      'test:s4t5-disp',
    ]

    const removed: string[] = []

    const deleteByRouteId = async (routeId: string) => {
      const doc = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (!doc) return
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .first()
      if (geom) await ctx.db.delete(geom._id)
      const arts = await ctx.db
        .query('curation_artifacts')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
        .collect()
      for (const a of arts) await ctx.db.delete(a._id)
      try {
        await geospatial.remove(ctx, doc._id)
      } catch {
        /* may not be indexed */
      }
      await ctx.db.delete(doc._id)
      removed.push(routeId)
    }

    for (const id of exact) await deleteByRouteId(id)

    // Prefix sweep (bounded)
    for (const prefix of prefixList) {
      // Scan a page of editorial test rows by routeId prefix via known indices is hard;
      // use a modest take from geometry_status unresolved/generated with filter.
      for (const status of ['unresolved', 'generated', 'review', 'failed'] as const) {
        const rows = await ctx.db
          .query('curated_routes')
          .withIndex('by_geometry_status', (q: any) => q.eq('geometryStatus', status))
          .take(300)
        for (const row of rows) {
          if (row.routeId.startsWith(prefix)) {
            await deleteByRouteId(row.routeId)
          }
        }
      }
    }

    return { removed, count: removed.length }
  },
})

// ---------------------------------------------------------------------------
// Waterfall action
// ---------------------------------------------------------------------------

const lever2FixedGeometryValidator = v.object({
  routedMiles: v.number(),
  pointCount: v.optional(v.number()),
  anchorCount: v.optional(v.number()),
  claimedMiles: v.optional(v.union(v.number(), v.null())),
})

export const runSampleWaterfall = action({
  args: {
    routeIds: v.array(v.string()),
    maxCost: v.optional(v.number()),
    costPerReconstruct: v.optional(v.number()),
    maxRetries: v.optional(v.number()),
    /** When set, Lever 2 uses production fixed-geometry reconstruct (deterministic). */
    lever2FixedGeometry: v.optional(lever2FixedGeometryValidator),
    /**
     * Test seam: force Lever 2 to throw rate-limit errors N times before succeeding
     * (or exhausting retries). Does not call external APIs.
     */
    simulateRateLimitFailures: v.optional(v.number()),
    /** When true, sleep is a no-op so backoff tests finish instantly. */
    skipSleep: v.optional(v.boolean()),
  },
  handler: async (ctx, args): Promise<WaterfallReport> => {
    await requireIdentity(ctx)

    const maxCost = args.maxCost ?? null
    const costPer = args.costPerReconstruct ?? COST_PER_RECONSTRUCT_USD
    const maxRetries = args.maxRetries ?? DEFAULT_MAX_RETRIES
    const backoffScheduleSeconds = computeBackoffDelaysSeconds(maxRetries)
    const sleep = args.skipSleep
      ? async () => {
          /* no-op for tests */
        }
      : undefined
    let remainingRateLimitSim = args.simulateRateLimitFailures ?? 0

    let totalCostUsd = 0
    let batchStopReason: WaterfallReport['batchStopReason'] = 'completed'
    let costExceededMessage: string | null = null

    const routes: RouteWaterfallResult[] = []
    const perLeverCounts = { lever1: 0, lever2: 0, lever3: 0 }
    const perStateCounts = {
      recovered: 0,
      queued: 0,
      retirement_eligible: 0,
      skipped: 0,
    }

    for (const routeId of args.routeIds) {
      // Cost circuit-breaker: stop before starting a route that would need L2
      // when the next reconstruct would exceed budget. Checked again before L2.

      const routeMeta = await ctx.runQuery(api.curatedGeometryReconstruct.getRouteForReading, {
        routeId,
      })

      // Resume: skip already-PASSed
      if (routeMeta?.geometryStatus === 'generated') {
        const skipped: RouteWaterfallResult = {
          routeId,
          terminalState: 'recovered',
          skipped: true,
          reprocessed: false,
          leversRun: [],
          provenance: undefined,
          costUsd: 0,
        }
        routes.push(skipped)
        perStateCounts.skipped += 1
        continue
      }

      const leversRun: number[] = []
      let lever1Failed = false
      let lever2Failed = false
      let costUsd = 0
      let terminalState: TerminalState = 'retirement_eligible'
      let provenance: RouteWaterfallResult['provenance']
      let failedCondition: string | null | undefined
      let bestCandidateGeometry: string | null = null

      // ----- Lever 1: promote -----
      leversRun.push(1)
      perLeverCounts.lever1 += 1
      const l1Wrapped = await withExponentialBackoff(
        async () => {
          return ctx.runAction(api.curatedGeometryReconstruct.promoteForRoute, { routeId })
        },
        { maxRetries, sleep },
      )
      const l1 = l1Wrapped.result as {
        disposition: string
        provenance?: string
        failedCondition?: string
        geometry?: string
      }

      if (l1.disposition === 'generated') {
        terminalState = 'recovered'
        provenance = 'scraped_promoted'
        const result: RouteWaterfallResult = {
          routeId,
          terminalState,
          skipped: false,
          reprocessed: false,
          leversRun,
          provenance,
          costUsd: 0,
        }
        routes.push(result)
        perStateCounts.recovered += 1
        await recordTerminalArtifact(ctx, result)
        continue
      }
      lever1Failed = true
      if (l1.geometry) bestCandidateGeometry = l1.geometry

      // ----- Cost check before Lever 2 -----
      if (maxCost != null && totalCostUsd + costPer > maxCost) {
        batchStopReason = 'cost_exceeded'
        costExceededMessage = `cost_exceeded: totalCost $${totalCostUsd.toFixed(2)} + next $${costPer.toFixed(2)} would exceed maxCost $${maxCost.toFixed(2)}`
        // Stop the batch; this route was not fully processed (L2 not attempted).
        break
      }

      // ----- Lever 2: reconstruct -----
      leversRun.push(2)
      perLeverCounts.lever2 += 1

      try {
        if (remainingRateLimitSim > 0) {
          // Pure rate-limit exercise path (AC-4) — only once per batch
          let failuresLeft = remainingRateLimitSim
          remainingRateLimitSim = 0
          await withExponentialBackoff(
            async () => {
              if (failuresLeft > 0) {
                failuresLeft -= 1
                const err = new Error('Google API 429 rate limit') as RateLimitError
                err.status = 429
                err.isRateLimit = true
                throw err
              }
              return { ok: true }
            },
            { maxRetries, sleep },
          )
        }

        const l2Wrapped = await withExponentialBackoff(
          async () => {
            if (args.lever2FixedGeometry) {
              return ctx.runAction(
                api.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry,
                {
                  routeId,
                  routedMiles: args.lever2FixedGeometry.routedMiles,
                  pointCount: args.lever2FixedGeometry.pointCount,
                  anchorCount: args.lever2FixedGeometry.anchorCount,
                  claimedMiles: args.lever2FixedGeometry.claimedMiles,
                },
              )
            }
            return ctx.runAction(api.curatedGeometryReconstruct.reconstructForRoute, {
              routeId,
            })
          },
          { maxRetries, sleep },
        )
        costUsd += costPer
        totalCostUsd += costPer

        const l2 = l2Wrapped.result as {
          verdict: string
          provenance?: string
          failedCondition?: string
          geometry?: string
        }

        if (l2.geometry) bestCandidateGeometry = l2.geometry

        if (l2.verdict === 'pass') {
          terminalState = 'recovered'
          provenance = 'ai_reconstructed'
          const result: RouteWaterfallResult = {
            routeId,
            terminalState,
            skipped: false,
            reprocessed: false,
            leversRun,
            provenance,
            lever1Failed,
            costUsd,
          }
          routes.push(result)
          perStateCounts.recovered += 1
          await recordTerminalArtifact(ctx, result)
          continue
        }
        lever2Failed = true
        failedCondition = l2.failedCondition ?? 'ratio'
      } catch (err) {
        lever2Failed = true
        failedCondition = isRateLimitError(err) ? 'rate_limit_exhausted' : 'anchors'
      }

      // ----- Lever 3: re-route -----
      leversRun.push(3)
      perLeverCounts.lever3 += 1

      try {
        const l3Wrapped = await withExponentialBackoff(
          async () => {
            return ctx.runAction(api.curatedGeometryReconstruct.rerouteForRoute, { routeId })
          },
          { maxRetries, sleep },
        )
        const l3 = l3Wrapped.result as {
          disposition: string
          provenance?: string
          failedCondition?: string
          geometry?: string
        }

        if (l3.geometry) bestCandidateGeometry = l3.geometry

        if (l3.disposition === 'generated') {
          terminalState = 'recovered'
          provenance = 'name_routed'
          const result: RouteWaterfallResult = {
            routeId,
            terminalState,
            skipped: false,
            reprocessed: false,
            leversRun,
            provenance,
            lever1Failed,
            lever2Failed,
            costUsd,
          }
          routes.push(result)
          perStateCounts.recovered += 1
          await recordTerminalArtifact(ctx, result)
          continue
        }

        // REVIEW queue (terminal) — keep best candidate geometry across levers
        terminalState = 'queued'
        failedCondition = l3.failedCondition ?? failedCondition ?? 'anchors'
        const result: RouteWaterfallResult = {
          routeId,
          terminalState,
          skipped: false,
          reprocessed: false,
          leversRun,
          lever1Failed,
          lever2Failed,
          failedCondition,
          costUsd,
        }
        routes.push(result)
        perStateCounts.queued += 1
        await recordTerminalArtifact(ctx, result)
        await recordReviewArtifact(ctx, routeId, failedCondition, bestCandidateGeometry)
      } catch {
        terminalState = 'retirement_eligible'
        const result: RouteWaterfallResult = {
          routeId,
          terminalState,
          skipped: false,
          reprocessed: false,
          leversRun,
          lever1Failed,
          lever2Failed,
          failedCondition: failedCondition ?? 'anchors',
          costUsd,
        }
        routes.push(result)
        perStateCounts.retirement_eligible += 1
        await recordTerminalArtifact(ctx, result)
        if (bestCandidateGeometry) {
          await recordReviewArtifact(ctx, routeId, failedCondition, bestCandidateGeometry)
        }
      }

      // Post-route cost check (stop after exceeding)
      if (maxCost != null && totalCostUsd >= maxCost) {
        batchStopReason = 'cost_exceeded'
        costExceededMessage = `cost_exceeded: totalCost $${totalCostUsd.toFixed(2)} >= maxCost $${maxCost.toFixed(2)}`
        break
      }
    }

    // If we broke early due to cost before finishing all routeIds
    if (
      batchStopReason === 'cost_exceeded' &&
      routes.filter((r) => !r.skipped).length < args.routeIds.length
    ) {
      // already set
    }

    const processed = routes.filter((r) => !r.skipped).length
    const skipped = routes.filter((r) => r.skipped).length
    const reprocessed = routes.filter((r) => r.reprocessed).length

    return {
      routes,
      processed,
      skipped,
      reprocessed,
      totalCostUsd,
      maxCostUsd: maxCost,
      batchStopReason,
      costExceededMessage,
      perLeverCounts,
      perStateCounts,
      backoffScheduleSeconds,
      maxRetries,
    }
  },
})

async function recordTerminalArtifact(ctx: ActionCtx, result: RouteWaterfallResult) {
  await ctx.runMutation(internal.waterfallOrchestrator.insertCurationArtifact, {
    routeId: result.routeId,
    artifactType: 'waterfall_result',
    terminalState: result.terminalState,
    provenance: result.provenance,
    failedCondition: result.failedCondition ?? undefined,
    leversRun: result.leversRun,
    costUsd: result.costUsd,
  })
}

async function recordReviewArtifact(
  ctx: ActionCtx,
  routeId: string,
  failedCondition: string | null | undefined,
  bestCandidateGeometry: string | null,
) {
  await ctx.runMutation(internal.waterfallOrchestrator.insertCurationArtifact, {
    routeId,
    artifactType: 'review_candidate',
    terminalState: 'queued',
    failedCondition: failedCondition ?? undefined,
    bestCandidateGeometry: bestCandidateGeometry ?? undefined,
    leversRun: [1, 2, 3],
    costUsd: 0,
  })
}

export const insertCurationArtifact = internalMutation({
  args: {
    routeId: v.string(),
    artifactType: v.union(
      v.literal('review_candidate'),
      v.literal('disposition'),
      v.literal('waterfall_result'),
    ),
    terminalState: v.optional(
      v.union(v.literal('recovered'), v.literal('queued'), v.literal('retirement_eligible')),
    ),
    provenance: v.optional(v.string()),
    failedCondition: v.optional(v.string()),
    bestCandidateGeometry: v.optional(v.string()),
    disposition: v.optional(v.union(v.literal('approve'), v.literal('retry'), v.literal('retire'))),
    lever: v.optional(v.number()),
    leversRun: v.optional(v.array(v.number())),
    costUsd: v.optional(v.number()),
    attemptedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert('curation_artifacts', {
      routeId: args.routeId,
      artifactType: args.artifactType,
      terminalState: args.terminalState,
      provenance: args.provenance,
      failedCondition: args.failedCondition,
      bestCandidateGeometry: args.bestCandidateGeometry,
      disposition: args.disposition,
      lever: args.lever,
      leversRun: args.leversRun,
      costUsd: args.costUsd,
      attemptedAt: args.attemptedAt ?? Date.now(),
      createdAt: Date.now(),
    })
    return { id }
  },
})

/**
 * AC-4 evidence action: exercise exponential backoff against simulated 429s.
 * Returns the observed backoff delay schedule (seconds).
 */
export const exerciseRateLimitBackoff = action({
  args: {
    failCount: v.number(),
    maxRetries: v.optional(v.number()),
    skipSleep: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const maxRetries = args.maxRetries ?? DEFAULT_MAX_RETRIES
    const schedule = computeBackoffDelaysSeconds(maxRetries)
    let failuresLeft = args.failCount
    let attempts = 0
    const observedDelays: number[] = []

    const sleep = args.skipSleep
      ? async (ms: number) => {
          observedDelays.push(ms / 1000)
        }
      : async (ms: number) => {
          observedDelays.push(ms / 1000)
          await new Promise((r) => setTimeout(r, Math.min(ms, 5))) // cap real wait
        }

    try {
      const wrapped = await withExponentialBackoff(
        async () => {
          attempts += 1
          if (failuresLeft > 0) {
            failuresLeft -= 1
            const err = new Error('Google API 429 Too Many Requests') as RateLimitError
            err.status = 429
            err.isRateLimit = true
            throw err
          }
          return { ok: true as const }
        },
        { maxRetries, sleep },
      )
      return {
        success: true,
        attempts: wrapped.attempts,
        backoffDelays: wrapped.backoffDelays,
        observedDelays,
        schedule,
        maxRetries,
      }
    } catch (err) {
      return {
        success: false,
        attempts,
        backoffDelays: observedDelays,
        observedDelays,
        schedule,
        maxRetries,
        error: String((err as Error).message ?? err),
      }
    }
  },
})
