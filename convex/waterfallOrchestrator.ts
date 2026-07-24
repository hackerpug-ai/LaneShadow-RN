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

import { ConvexError, v } from 'convex/values'
import { api, internal } from './_generated/api'
import type { ActionCtx } from './_generated/server'
import { action, internalMutation, mutation } from './_generated/server'
import { PRD_YIELD_ASSUMPTIONS } from './curatedGeometry'
import { geospatial } from './geospatialIndex'
import {
  assertTestSubjectOrThrow,
  requireIdentity,
  requireOperator,
  requireOperatorAction,
} from './guards'

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

type TerminalState = 'recovered' | 'queued' | 'retirement_eligible' | 'cost_blocked'

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
    cost_blocked: number
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
    await requireOperator(ctx)
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
    await requireOperator(ctx)
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
    await requireOperator(ctx)
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
    routeIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { prefixes, routeIds }) => {
    await requireOperator(ctx)
    const exact: string[] = [...WATERFALL_ROUTE_IDS]
    if (routeIds) {
      for (const id of routeIds) {
        if (!exact.includes(id)) exact.push(id)
      }
    }
    const prefixList = prefixes ?? [
      'test:s4t5-passed',
      'test:s4t5-cost',
      'test:s4t5-review',
      'test:s4t5-disp',
    ]

    const removed: string[] = []
    const deleted = new Set<string>()

    const deleteByRouteId = async (routeId: string) => {
      if (deleted.has(routeId)) return
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
      // Batch-delete curation artifacts — use take to avoid .collect() of many rows
      let artCursor: string | null = null
      let artDone = false
      while (!artDone) {
        const artPage = await ctx.db
          .query('curation_artifacts')
          .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
          .paginate({ cursor: artCursor, numItems: 50 })
        for (const a of artPage.page) await ctx.db.delete(a._id)
        artCursor = artPage.continueCursor
        artDone = artPage.isDone
      }
      try {
        await geospatial.remove(ctx, doc._id)
      } catch {
        /* may not be indexed */
      }
      await ctx.db.delete(doc._id)
      removed.push(routeId)
      deleted.add(routeId)
    }

    for (const id of exact) await deleteByRouteId(id)

    // Prefix sweep — LEAN: bounded small takes per status to stay under 16MB.
    // Test fixtures are limited in number; 50 per status × 4 statuses = 200 max.
    const MAX_PER_STATUS = 50
    for (const prefix of prefixList) {
      for (const status of ['unresolved', 'generated', 'review', 'failed'] as const) {
        const rows = await ctx.db
          .query('curated_routes')
          .withIndex('by_geometry_status', (q: any) => q.eq('geometryStatus', status))
          .take(MAX_PER_STATUS)
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

async function executeWaterfall(
  ctx: ActionCtx,
  routeIds: string[],
  options: {
    maxCost?: number | null
    costPerReconstruct?: number
    maxRetries?: number
    lever2FixedGeometry?: {
      routedMiles: number
      pointCount?: number
      anchorCount?: number
      claimedMiles?: number | null
    }
    simulateRateLimitFailures?: number
    skipSleep?: boolean
  },
): Promise<WaterfallReport> {
  const maxCost = options.maxCost ?? null
  const costPer = options.costPerReconstruct ?? COST_PER_RECONSTRUCT_USD
  const maxRetries = options.maxRetries ?? DEFAULT_MAX_RETRIES
  const backoffScheduleSeconds = computeBackoffDelaysSeconds(maxRetries)
  const sleep = options.skipSleep
    ? async () => {
        /* no-op for tests */
      }
    : undefined
  let remainingRateLimitSim = options.simulateRateLimitFailures ?? 0

  let totalCostUsd = 0
  let batchStopReason: WaterfallReport['batchStopReason'] = 'completed'
  let costExceededMessage: string | null = null

  const routes: RouteWaterfallResult[] = []
  const perLeverCounts = { lever1: 0, lever2: 0, lever3: 0 }
  const perStateCounts = {
    recovered: 0,
    queued: 0,
    retirement_eligible: 0,
    cost_blocked: 0,
    skipped: 0,
  }

  for (const routeId of routeIds) {
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
      // FIX-09: the cost-limited route still ends in exactly one durable
      // terminal state (cost_blocked) — a restart can distinguish an
      // untouched route from an interrupted/cost-blocked one, and the
      // exactly-one-terminal-state invariant holds.
      const costBlocked: RouteWaterfallResult = {
        routeId,
        terminalState: 'cost_blocked',
        skipped: false,
        reprocessed: false,
        leversRun,
        provenance: undefined,
        failedCondition: 'cost_exceeded',
        costUsd: 0,
      }
      routes.push(costBlocked)
      perStateCounts.cost_blocked += 1
      await recordTerminalArtifact(ctx, costBlocked)
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
          if (options.lever2FixedGeometry) {
            return ctx.runAction(
              api.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry,
              {
                routeId,
                routedMiles: options.lever2FixedGeometry.routedMiles,
                pointCount: options.lever2FixedGeometry.pointCount,
                anchorCount: options.lever2FixedGeometry.anchorCount,
                claimedMiles: options.lever2FixedGeometry.claimedMiles,
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
      // FIX-09: Charge cost even on L2 failure — the provider was invoked
      // and the attempt consumed budget. Fail-closed cost accounting.
      costUsd += costPer
      totalCostUsd += costPer
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
      // FIX-09: Lever 3 exception → EXACTLY ONE terminal state: retirement_eligible.
      // Do NOT also queue REVIEW — the route is retired, not queued.
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
      // NOTE: recordReviewArtifact intentionally NOT called here —
      // the route ends in retirement_eligible, not queued.
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
    routes.filter((r) => !r.skipped).length < routeIds.length
  ) {
    // already set
  }

  const processed = routes.filter((r) => !r.skipped && r.terminalState !== 'cost_blocked').length
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
}

/**
 * REDHAT-FIX-01: production waterfall entry. The deterministic test seams
 * (lever2FixedGeometry, simulateRateLimitFailures, skipSleep) are NOT accepted
 * here — a production closeout must exercise real Lever-2 reconstruction.
 */
export const runSampleWaterfall = action({
  args: {
    routeIds: v.array(v.string()),
    maxCost: v.optional(v.number()),
    costPerReconstruct: v.optional(v.number()),
    maxRetries: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // REDHAT-FIX-13: provider-costing waterfall is operator-only. An ordinary
    // authenticated rider cannot trigger paid Google/LLM recovery work.
    await requireOperatorAction(ctx)
    return executeWaterfall(ctx, args.routeIds, args)
  },
})

/**
 * Test-only seam variant. The deterministic Lever-2 geometry injection,
 * rate-limit simulation, and sleep-skip seams live HERE — not on the
 * production `runSampleWaterfall` entry. Requires a test-prefix identity
 * (REDHAT-FIX-01): unreachable from a production closeout identity.
 */
export const runSampleWaterfallWithSeams = action({
  args: {
    routeIds: v.array(v.string()),
    maxCost: v.optional(v.number()),
    costPerReconstruct: v.optional(v.number()),
    maxRetries: v.optional(v.number()),
    lever2FixedGeometry: v.optional(lever2FixedGeometryValidator),
    simulateRateLimitFailures: v.optional(v.number()),
    skipSleep: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    assertTestSubjectOrThrow(identity.clerkUserId)
    return executeWaterfall(ctx, args.routeIds, args)
  },
})

// ---------------------------------------------------------------------------
// S5-T1: Full-batch (--all) with couch gate + coverageReport + cursor resume
// ---------------------------------------------------------------------------

type CouchGateSnapshot = {
  allowed: boolean
  overallVerdict: 'pass' | 'fail' | null
  reason: string | null
  sampleId: string | null
}

function parseContinueCursor(cursor: string | undefined | null): number {
  if (!cursor) return 0
  // Formats: "idx:N" or bare integer string
  const m = /^idx:(\d+)$/.exec(cursor)
  if (m) return parseInt(m[1], 10)
  const n = parseInt(cursor, 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function encodeContinueCursor(index: number): string {
  return `idx:${index}`
}

function buildCoverageFromWaterfall(
  report: WaterfallReport,
  opts: {
    startIndex: number
    routeIds: string[]
    priorCostUSD?: number
    priorPageTotals?: Array<Record<string, unknown>>
  },
) {
  const endIndex = opts.startIndex + report.routes.length
  const isDone = report.batchStopReason === 'completed' && endIndex >= opts.routeIds.length
  // If we stopped for cost mid-list, continueCursor points at next unprocessed index.
  // The last route may be cost_blocked — resume from that index so it can retry.
  let nextIndex = endIndex
  if (report.batchStopReason === 'cost_exceeded') {
    const costBlockedIdx = report.routes.findIndex((r) => r.terminalState === 'cost_blocked')
    if (costBlockedIdx >= 0) {
      nextIndex = opts.startIndex + costBlockedIdx
    }
  }
  const continueCursor =
    !isDone && nextIndex < opts.routeIds.length
      ? encodeContinueCursor(nextIndex)
      : encodeContinueCursor(nextIndex)

  const leverPass: Record<string, { candidates: number; passCount: number }> = {
    scraped_promoted: { candidates: 0, passCount: 0 },
    ai_reconstructed: { candidates: 0, passCount: 0 },
    name_routed: { candidates: 0, passCount: 0 },
  }
  // Approximate per-lever candidates from leversRun counts + provenance on recovered
  leverPass.scraped_promoted.candidates = report.perLeverCounts.lever1
  leverPass.ai_reconstructed.candidates = report.perLeverCounts.lever2
  leverPass.name_routed.candidates = report.perLeverCounts.lever3
  for (const r of report.routes) {
    if (r.provenance === 'scraped_promoted' && r.terminalState === 'recovered' && !r.skipped) {
      leverPass.scraped_promoted.passCount += 1
    }
    if (r.provenance === 'ai_reconstructed' && r.terminalState === 'recovered' && !r.skipped) {
      leverPass.ai_reconstructed.passCount += 1
    }
    if (r.provenance === 'name_routed' && r.terminalState === 'recovered' && !r.skipped) {
      leverPass.name_routed.passCount += 1
    }
  }

  const levers = PRD_YIELD_ASSUMPTIONS.map((a) => {
    const c = leverPass[a.provenance] ?? { candidates: 0, passCount: 0 }
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

  const provenanceCounts: Record<string, number> = {}
  for (const r of report.routes) {
    if (r.provenance) {
      provenanceCounts[r.provenance] = (provenanceCounts[r.provenance] ?? 0) + 1
    }
  }

  const riderReadyCount = report.routes.filter(
    (r) => r.terminalState === 'recovered' && !r.skipped,
  ).length

  const totalCostUSD = (opts.priorCostUSD ?? 0) + report.totalCostUsd
  const pageTotals = [
    ...(opts.priorPageTotals ?? []),
    {
      startIndex: opts.startIndex,
      endIndex,
      processed: report.processed,
      skipped: report.skipped,
      totalCostUsd: report.totalCostUsd,
      batchStopReason: report.batchStopReason,
    },
  ]

  return {
    isDone,
    continueCursor,
    totalCostUSD,
    levers,
    terminalStates: report.perStateCounts,
    provenanceCounts,
    riderReadyCount,
    pageTotals,
    nextIndex,
  }
}

async function executeFullBatch(
  ctx: ActionCtx,
  args: {
    routeIds: string[]
    maxCost?: number | null
    costPerReconstruct?: number
    maxRetries?: number
    cursor?: string | null
    runId?: string
    lever2FixedGeometry?: {
      routedMiles: number
      pointCount?: number
      anchorCount?: number
      claimedMiles?: number | null
    }
    simulateRateLimitFailures?: number
    skipSleep?: boolean
  },
) {
  const gate = (await ctx.runQuery(api.couchVerdict.couchGateStatus, {})) as CouchGateSnapshot
  if (!gate.allowed) {
    throw new ConvexError({
      code: 'COUCH_GATE_BLOCKED',
      message:
        gate.reason ?? 'Couch gate blocked --all until recordCouchVerdict({overallVerdict:"pass"})',
    })
  }

  const startIndex = parseContinueCursor(args.cursor)
  const remaining = args.routeIds.slice(startIndex)
  const runId = args.runId ?? `full-batch-${Date.now()}`

  // Load prior cumulative cost from persisted report (resume)
  let priorCostUSD = 0
  let priorPageTotals: Array<Record<string, unknown>> = []
  if (args.cursor) {
    const prior = (await ctx.runQuery(api.curatedGeometry.coverageReport, {
      runId,
    })) as {
      source?: string
      totalCostUSD?: number
      pageTotals?: Array<Record<string, unknown>>
    }
    if (prior?.source === 'persisted') {
      priorCostUSD = prior.totalCostUSD ?? 0
      priorPageTotals = prior.pageTotals ?? []
    }
  }

  const report = await executeWaterfall(ctx, remaining, {
    maxCost: args.maxCost ?? null,
    costPerReconstruct: args.costPerReconstruct,
    maxRetries: args.maxRetries,
    lever2FixedGeometry: args.lever2FixedGeometry,
    simulateRateLimitFailures: args.simulateRateLimitFailures,
    skipSleep: args.skipSleep,
  })

  const coverage = buildCoverageFromWaterfall(report, {
    startIndex,
    routeIds: args.routeIds,
    priorCostUSD,
    priorPageTotals,
  })

  await ctx.runMutation(internal.curatedGeometry.persistCoverageReport, {
    runId,
    isDone: coverage.isDone,
    continueCursor: coverage.continueCursor,
    totalCostUSD: coverage.totalCostUSD,
    maxCostUSD: args.maxCost ?? null,
    batchStopReason: report.batchStopReason,
    riderReadyCount: coverage.riderReadyCount,
    levers: coverage.levers,
    terminalStates: coverage.terminalStates,
    provenanceCounts: coverage.provenanceCounts,
    pageTotals: coverage.pageTotals,
  })

  const routesMutated = report.routes.filter((r) => !r.skipped).length

  return {
    mode: 'all' as const,
    runId,
    gate: { allowed: true as const, overallVerdict: gate.overallVerdict },
    ...report,
    // Per-page spend (circuit-breaker unit) vs cumulative across resumes
    pageCostUSD: report.totalCostUsd,
    totalCostUsd: report.totalCostUsd,
    totalCostUSD: report.totalCostUsd,
    cumulativeCostUSD: coverage.totalCostUSD,
    continueCursor: coverage.continueCursor,
    isDone: coverage.isDone,
    coverageReport: {
      runId,
      isDone: coverage.isDone,
      continueCursor: coverage.continueCursor,
      totalCostUSD: coverage.totalCostUSD,
      pageCostUSD: report.totalCostUsd,
      levers: coverage.levers,
      terminalStates: coverage.terminalStates,
      provenanceCounts: coverage.provenanceCounts,
      riderReadyCount: coverage.riderReadyCount,
      pageTotals: coverage.pageTotals,
      assumptionNote:
        'PRD per-lever expected yields are assumptions for comparison only — not committed catalog targets.',
    },
    routesMutated,
    reprocessedCount: report.reprocessed,
  }
}

/**
 * Production full-batch entry. STRICTLY blocked until couchGateStatus.allowed.
 * Persists coverageReport; supports --max-cost and --cursor resume.
 */
export const runFullBatch = action({
  args: {
    routeIds: v.array(v.string()),
    maxCost: v.optional(v.number()),
    costPerReconstruct: v.optional(v.number()),
    maxRetries: v.optional(v.number()),
    cursor: v.optional(v.string()),
    runId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireOperatorAction(ctx)
    return executeFullBatch(ctx, args)
  },
})

/**
 * Test-only full-batch with deterministic seams. Couch gate still enforced.
 * Requires test-prefix identity (REDHAT-FIX-01).
 */
export const runFullBatchWithSeams = action({
  args: {
    routeIds: v.array(v.string()),
    maxCost: v.optional(v.number()),
    costPerReconstruct: v.optional(v.number()),
    maxRetries: v.optional(v.number()),
    cursor: v.optional(v.string()),
    runId: v.optional(v.string()),
    lever2FixedGeometry: v.optional(lever2FixedGeometryValidator),
    simulateRateLimitFailures: v.optional(v.number()),
    skipSleep: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx)
    assertTestSubjectOrThrow(identity.clerkUserId)
    // Still operator-gated for cost work
    await requireOperatorAction(ctx)
    return executeFullBatch(ctx, args)
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
      v.union(
        v.literal('recovered'),
        v.literal('queued'),
        v.literal('retirement_eligible'),
        v.literal('cost_blocked'),
      ),
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
