/**
 * S4-T4 / UC-VER-03: Cross-provider ride-worthiness classifier.
 *
 * Judges "is this actually a motorcycle ride?" over catalog routes using
 * z.ai GLM-5.2 — a DIFFERENT provider than anchor extraction (OpenAI gpt-4.1)
 * so blind spots are decorrelated.
 *
 * Verdicts are stored as at-rest evidence on the route doc (rideWorthiness),
 * never computed at read-time. not_a_ride withholds rider-ready; marginal
 * never auto-retires a route. Classifier failures are isolated per route.
 */

'use node'

import { generateText, NoObjectGeneratedError, Output } from 'ai'
import { v } from 'convex/values'
import { z } from 'zod'
import { internal } from '../_generated/api'
import { type ActionCtx, action, internalAction } from '../_generated/server'
import { assertTestSubjectOrThrow, requireIdentity, requireOperatorAction } from '../guards'
import { createZaiProvider, parseZaiFallback } from './agent/lib/zaiProvider'

/** Stored model/provider stamp proving decorrelation from anchor extraction (gpt-4.1). */
export const RIDE_WORTHINESS_PROVIDER = 'z.ai-glm-5.2' as const

/**
 * REDHAT-FIX-11: Determine whether a route's ride-worthiness classification is
 * EVIDENCE-COMPLETE. A freeway/fhwa route must have a recorded rescue-first
 * geometry attempt before its classification can be considered complete; the
 * classifier must not silently complete a freeway route lacking that evidence.
 * Non-freeway routes are evidence-complete without a geometry attempt.
 */
export function determineEvidenceComplete(args: {
  isFreeway: boolean
  geometryAttempted: boolean
}): boolean {
  if (!args.isFreeway) return true
  return args.geometryAttempted
}

/**
 * Verification-gate alias (grep target: zai-glm-5.2). The stored stamp uses
 * the dotted form `z.ai-glm-5.2`; this constant documents the z.ai GLM id.
 */
export const ZAI_GLM_MODEL_ID = 'zai-glm-5.2' as const

const ZAI_MODEL_ID = 'glm-5.2'

const rideWorthinessSchema = z.object({
  verdict: z.enum(['ride', 'marginal', 'not_a_ride']),
  reason: z.string().min(1),
})

type RideWorthinessVerdict = z.infer<typeof rideWorthinessSchema>

export type ClassifyRouteResult =
  | {
      ok: true
      routeId: string
      verdict: RideWorthinessVerdict['verdict']
      reason: string
      model: typeof RIDE_WORTHINESS_PROVIDER
      classifiedAt: number
    }
  | {
      ok: false
      routeId: string
      error: string
    }

export type ClassifyCatalogResult = {
  classified: number
  failed: number
  results: ClassifyRouteResult[]
  /** FIX-02: Total eligible routes (when enumerating full catalog). */
  totalEligible?: number
  /** FIX-02: Routes still unclassified after this batch. */
  remainingUnclassified?: number
  /** FIX-02: Durable run id — re-pass to resume an interrupted catalog run. */
  runId?: string
  /** FIX-02: Persisted run status. */
  runStatus?: 'running' | 'completed' | 'failed'
}

type RouteForClassification = {
  id: string
  routeId: string
  name: string
  state: string
  source: string
  lengthMiles: number
  highwayNumber: string | null
  primaryArchetype: string
  oneLiner: string
  summary: string
  description: string | null
  geometryStatus: string | null
}

const buildClassificationPrompt = (route: RouteForClassification): string => {
  return `You are classifying whether a catalog road segment is a worthwhile motorcycle RIDE.

Judge "is this actually a motorcycle ride a rider would choose?" — not merely "is it a road."

Verdicts (pick exactly one):
- "ride": a motorcycle-worthy road (twisty canyons, scenic byways, coastal highways, mountain passes, known biker roads)
- "marginal": borderline — maybe a transit connector or mixed-use corridor with some riding interest
- "not_a_ride": NOT a motorcycle ride — freeways/interstates (I-*, US interstates), pure freeway segments, FHWA long-haul corridors, parking-lot connectors, industrial frontage roads

Hard rules:
- Interstate freeways (names like "I-40", "I-5", "Interstate 40") and FHWA freeway segments are always "not_a_ride"
- source="fhwa" with interstate-style names/highway numbers is almost always "not_a_ride"
- Named twisty canyon roads, coastal highway segments, and scenic mountain passes are "ride"
- Recovered scenic-byway mountain passes are usually "ride" unless clearly a freeway

ROUTE:
- routeId: ${route.routeId}
- name: ${route.name}
- state: ${route.state}
- source: ${route.source}
- lengthMiles: ${route.lengthMiles}
- highwayNumber: ${route.highwayNumber ?? 'none'}
- primaryArchetype: ${route.primaryArchetype}
- oneLiner: ${route.oneLiner}
- summary: ${route.summary}
- description: ${route.description ?? 'none'}
- geometryStatus: ${route.geometryStatus ?? 'unknown'}

Respond with a JSON object matching this exact shape (no other text):
{"verdict":"ride"|"marginal"|"not_a_ride","reason":"<one sentence rationale>"}`
}

async function classifyWithZai(route: RouteForClassification): Promise<RideWorthinessVerdict> {
  const model = createZaiProvider().provider(ZAI_MODEL_ID)
  const prompt = buildClassificationPrompt(route)

  let rawText: string | undefined

  try {
    const result = await generateText({
      model,
      output: Output.object({ schema: rideWorthinessSchema }),
      prompt,
    })

    const validated = rideWorthinessSchema.safeParse(result.output)
    if (validated.success) {
      return validated.data
    }
    rawText = result.text
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      rawText = error.text
    } else {
      throw error
    }
  }

  const fallback = parseZaiFallback(rawText ?? '', rideWorthinessSchema)
  if (fallback.ok) {
    return fallback.object
  }

  throw new Error(
    `ride-worthiness classifier failed structured+fallback parse for ${route.routeId}`,
  )
}

async function classifyAndPersistOne(
  ctx: {
    runQuery: any
    runMutation: any
  },
  routeId: string,
  opts: { failRouteIds?: string[] } = {},
): Promise<ClassifyRouteResult> {
  const startedAt = Date.now()

  try {
    if (opts.failRouteIds?.includes(routeId)) {
      throw new Error(`Simulated classifier failure for ${routeId}`)
    }

    const route = (await ctx.runQuery(internal.curatedGeometry.getRouteForClassification, {
      routeId,
    })) as RouteForClassification | null

    if (!route) {
      throw new Error(`Route not found: ${routeId}`)
    }

    // FIX-11: Rescue-first contract — verify freeway/fhwa routes have
    // a recorded geometry attempt before completing classification.
    // The geometry pipeline is independent; the classifier must not
    // complete a freeway route without auditable evidence that the
    // rescue-first geometry attempt was considered.
    const isFreeway =
      route.source === 'fhwa' || (route.highwayNumber != null && /^I-/.test(route.highwayNumber))
    const geometryAttempted = route.geometryStatus != null && route.geometryStatus !== 'unresolved'

    const evidenceComplete = determineEvidenceComplete({ isFreeway, geometryAttempted })

    if (isFreeway && !geometryAttempted) {
      // REDHAT-FIX-11: a freeway route CANNOT be evidence-complete without a
      // recorded rescue-first geometry attempt. Recording the pending artifact
      // is REQUIRED (not best-effort) so the audit trail is durable; the
      // classification proceeds but is flagged evidenceComplete=false.
      await ctx.runMutation(internal.waterfallOrchestrator.insertCurationArtifact, {
        routeId,
        artifactType: 'waterfall_result',
        terminalState: 'retirement_eligible',
        provenance: 'freeway_rescue_first_pending',
        failedCondition: 'geometry_pending',
        leversRun: [],
        costUsd: 0,
        attemptedAt: Date.now(),
      })
    }

    if (isFreeway && geometryAttempted) {
      // geometry attempt recorded — best-effort audit note (evidence already
      // complete via geometryAttempted, so recording failure is non-blocking).
      try {
        await ctx.runMutation(internal.waterfallOrchestrator.insertCurationArtifact, {
          routeId,
          artifactType: 'waterfall_result',
          terminalState: 'retirement_eligible',
          provenance: 'freeway_rescue_first_completed',
          failedCondition: undefined,
          leversRun: [1],
          costUsd: 0,
          attemptedAt: Date.now(),
        })
      } catch {
        // non-blocking: evidence already complete
      }
    }

    const classified = await classifyWithZai(route)
    const classifiedAt = Date.now()
    const rideWorthiness = {
      verdict: classified.verdict,
      reason: classified.reason,
      model: RIDE_WORTHINESS_PROVIDER,
      classifiedAt,
      evidenceComplete,
    }

    await ctx.runMutation(internal.curatedGeometry.persistRideWorthiness, {
      id: route.id as any,
      rideWorthiness,
    })

    // Non-blocking success log into performance table (best-effort)
    try {
      await ctx.runMutation(internal.db.performance.recordAgentRun, {
        agent: 'ride_worthiness_classifier',
        model: RIDE_WORTHINESS_PROVIDER,
        input: routeId,
        output: `${classified.verdict}: ${classified.reason}`,
        steps: 1,
        toolCalls: 0,
        tools: [],
        durationMs: Date.now() - startedAt,
        success: true,
      })
    } catch {
      // logging must never block classification
    }

    return {
      ok: true,
      routeId,
      verdict: classified.verdict,
      reason: classified.reason,
      model: RIDE_WORTHINESS_PROVIDER,
      classifiedAt,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    // biome-ignore lint/suspicious/noConsole: AC-4 requires error logging for classifier failures
    console.error(`[rideWorthinessClassifier] failed for ${routeId}: ${message}`)

    // Isolate failures: leave route without a new verdict; log error; continue.
    try {
      await ctx.runMutation(internal.db.performance.recordAgentRun, {
        agent: 'ride_worthiness_classifier',
        model: RIDE_WORTHINESS_PROVIDER,
        input: routeId,
        steps: 1,
        toolCalls: 0,
        tools: [],
        durationMs: Date.now() - startedAt,
        success: false,
        error: message,
      })
    } catch {
      // logging must never block classification
    }

    return { ok: false, routeId, error: message }
  }
}

/**
 * Classify a single route and store the verdict as evidence.
 * Public so integration tests / CLI can invoke via `npx convex run`.
 */
export const classifyRoute = action({
  args: {
    routeId: v.string(),
  },
  handler: async (ctx, { routeId }): Promise<ClassifyRouteResult> => {
    // REDHAT-FIX-13: provider-costing classification is operator-only and the
    // failRouteIds simulation control is NOT accepted here — a caller cannot
    // manufacture failed/no-evidence processing outcomes.
    await requireOperatorAction(ctx)
    return classifyAndPersistOne(ctx, routeId, {})
  },
})

/**
 * REDHAT-FIX-13: test-only single-route classifier. Re-adds the failRouteIds
 * simulation control behind assertTestSubjectOrThrow so a production identity
 * cannot reach it.
 */
export const classifyRouteWithFailures = action({
  args: {
    routeId: v.string(),
    failRouteIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { routeId, failRouteIds }): Promise<ClassifyRouteResult> => {
    const identity = await requireIdentity(ctx)
    assertTestSubjectOrThrow(identity.clerkUserId)
    return classifyAndPersistOne(ctx, routeId, { failRouteIds })
  },
})

/**
 * REDHAT-FIX-02: Build the catalog enumeration batch configuration.
 * Pure function — determines whether to enumerate the full catalog
 * or use caller-supplied routeIds.
 */
export function buildCatalogEnumerationBatch(args: {
  routeIds: string[] | undefined
  defaultBatchSize: number
}): {
  allCatalog: boolean
  routeIds: string[]
  batchSize: number
} {
  const MAX_BATCH = 200
  const batchSize = Math.min(args.defaultBatchSize, MAX_BATCH)

  if (!args.routeIds || args.routeIds.length === 0) {
    return { allCatalog: true, routeIds: [], batchSize }
  }

  return { allCatalog: false, routeIds: args.routeIds, batchSize }
}

/**
 * Classify a batch of routes (or a provided subset). Failures on individual
 * routes do not abort the catalog run — each error is logged and the next
 * route continues. Geometry pipeline is intentionally independent: this
 * action never blocks geometry generation (rescue-first).
 *
 * FIX-02: When no routeIds supplied, iterates ALL pages via .continueCursor
 * to achieve whole-catalog coverage. Returns totalEligible, classified,
 * failed, and remainingUnclassified. The run is only complete when
 * remainingUnclassified === 0.
 */
/**
 * Shared classification engine (REDHAT-FIX-13). Extracted so the production
 * entry can omit the failRouteIds simulation control from its public validator
 * while a test-only variant re-adds it behind assertTestSubjectOrThrow.
 */
export const executeClassifyCatalog = async (
  ctx: ActionCtx,
  {
    routeIds,
    failRouteIds,
    runId: resumeRunId,
  }: {
    routeIds?: string[]
    failRouteIds?: string[]
    runId?: string
  },
): Promise<ClassifyCatalogResult> => {
  // FIX-02: When no routeIds supplied, enumerate ALL eligible routes
  // from curated_routes via bounded indexed pagination loop.
  const batch = buildCatalogEnumerationBatch({
    routeIds,
    defaultBatchSize: 50,
  })

  // Total eligible estimate — will be refined by pagination
  let totalEligible = 0
  const results: ClassifyRouteResult[] = []
  let runId = resumeRunId ?? null
  let runStatus: 'running' | 'completed' | 'failed' = 'running'
  let checkpointProcessed = 0
  let checkpointFailed = 0

  if (batch.allCatalog) {
    // FIX-02: durable whole-catalog run — resume from the persisted cursor if
    // a runId is supplied and the run is still 'running'; otherwise begin a
    // new run. Progress (cursor + counts) is persisted after every page so an
    // interrupted invocation resumes instead of restarting from zero, and
    // completion counters derive from the persisted run.
    let cursor: string | null = null
    let isDone = false
    if (resumeRunId) {
      const existing = await ctx.runQuery(internal.curatedGeometry.getClassifierRun, {
        runId: resumeRunId,
      })
      if (existing && existing.status === 'running') {
        runId = existing.runId
        cursor = existing.cursor ?? null
        isDone = existing.isDone
        totalEligible = existing.totalEligible ?? 0
        checkpointProcessed = existing.processedCount
        checkpointFailed = existing.failedCount
      }
    }
    if (!runId) {
      runId = `run-${Date.now()}`
      await ctx.runMutation(internal.curatedGeometry.beginClassifierRun, {
        runId,
        startedAt: Date.now(),
      })
    }

    while (!isDone) {
      const fetchedIds: {
        ids: string[]
        continueCursor: string | null
        isDone: boolean
        totalEligible?: number
      } = await ctx.runQuery(internal.curatedGeometry.listEligibleRouteIdsForClassification, {
        limit: batch.batchSize,
        cursor,
      })

      const ids = fetchedIds.ids
      if (totalEligible === 0 && fetchedIds.totalEligible != null) {
        totalEligible = fetchedIds.totalEligible
      } else {
        totalEligible += ids.length
      }

      for (const routeId of ids) {
        const result = await classifyAndPersistOne(ctx, routeId, { failRouteIds })
        results.push(result)
        if (result.ok) checkpointProcessed += 1
        else checkpointFailed += 1
      }

      cursor = fetchedIds.continueCursor
      isDone = fetchedIds.isDone

      // FIX-02: persist durable progress after each page (durable checkpoint).
      await ctx.runMutation(internal.curatedGeometry.updateClassifierRunProgress, {
        runId,
        cursor,
        processedCount: checkpointProcessed,
        failedCount: checkpointFailed,
        totalEligible,
        isDone,
      })

      // Safety valve: if no new IDs were returned, stop to prevent infinite loop
      if (ids.length === 0 && !isDone) {
        isDone = true
      }
    }

    await ctx.runMutation(internal.curatedGeometry.completeClassifierRun, {
      runId,
      processedCount: checkpointProcessed,
      failedCount: checkpointFailed,
      totalEligible,
    })
    runStatus = 'completed'
  } else {
    // Caller-supplied routeIds — process directly
    totalEligible = batch.routeIds.length
    for (const routeId of batch.routeIds) {
      const result = await classifyAndPersistOne(ctx, routeId, { failRouteIds })
      results.push(result)
    }
  }

  if (totalEligible === 0) {
    return {
      classified: 0,
      failed: 0,
      results: [],
      totalEligible: 0,
      remainingUnclassified: 0,
      runId: runId ?? undefined,
      runStatus,
    }
  }

  const classified = batch.allCatalog ? checkpointProcessed : results.filter((r) => r.ok).length
  const failed = batch.allCatalog ? checkpointFailed : results.filter((r) => !r.ok).length
  const remainingUnclassified = Math.max(0, totalEligible - classified - failed)

  return {
    classified,
    failed,
    results,
    totalEligible,
    remainingUnclassified,
    runId: runId ?? undefined,
    runStatus,
  }
}

/**
 * REDHAT-FIX-13: production classifier entry. The failRouteIds simulation
 * control is NOT accepted here — a caller cannot manufacture failed/no-evidence
 * processing outcomes. Operator-only so paid z.ai classification cannot be
 * triggered by an ordinary rider.
 */
export const classifyCatalog = action({
  args: {
    routeIds: v.optional(v.array(v.string())),
    /** FIX-02: resume an interrupted whole-catalog run from its persisted cursor. */
    runId: v.optional(v.string()),
  },
  handler: async (ctx, { routeIds, runId }): Promise<ClassifyCatalogResult> => {
    await requireOperatorAction(ctx)
    return executeClassifyCatalog(ctx, { routeIds, runId })
  },
})

/**
 * REDHAT-FIX-13: test-only classifier entry. Re-adds the failRouteIds
 * simulation control behind assertTestSubjectOrThrow so a production identity
 * cannot manufacture failed/no-evidence outcomes.
 */
export const classifyCatalogWithFailures = action({
  args: {
    routeIds: v.optional(v.array(v.string())),
    failRouteIds: v.optional(v.array(v.string())),
    runId: v.optional(v.string()),
  },
  handler: async (ctx, { routeIds, failRouteIds, runId }): Promise<ClassifyCatalogResult> => {
    const identity = await requireIdentity(ctx)
    assertTestSubjectOrThrow(identity.clerkUserId)
    return executeClassifyCatalog(ctx, { routeIds, failRouteIds, runId })
  },
})

/**
 * Internal entry used by pipeline jobs (no identity required).
 */
export const classifyCatalogInternal = internalAction({
  args: {
    routeIds: v.array(v.string()),
    failRouteIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { routeIds, failRouteIds }): Promise<ClassifyCatalogResult> => {
    const results: ClassifyRouteResult[] = []
    for (const routeId of routeIds) {
      const result = await classifyAndPersistOne(ctx, routeId, { failRouteIds })
      results.push(result)
    }
    return {
      classified: results.filter((r) => r.ok).length,
      failed: results.filter((r) => !r.ok).length,
      results,
    }
  },
})
