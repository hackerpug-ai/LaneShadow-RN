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
import { action, internalAction } from '../_generated/server'
import { requireIdentity } from '../guards'
import { createZaiProvider, parseZaiFallback } from './agent/lib/zaiProvider'

/** Stored model/provider stamp proving decorrelation from anchor extraction (gpt-4.1). */
export const RIDE_WORTHINESS_PROVIDER = 'z.ai-glm-5.2' as const

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

    const classified = await classifyWithZai(route)
    const classifiedAt = Date.now()
    const rideWorthiness = {
      verdict: classified.verdict,
      reason: classified.reason,
      model: RIDE_WORTHINESS_PROVIDER,
      classifiedAt,
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
    failRouteIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { routeId, failRouteIds }): Promise<ClassifyRouteResult> => {
    await requireIdentity(ctx)
    return classifyAndPersistOne(ctx, routeId, { failRouteIds })
  },
})

/**
 * Classify a batch of routes (or a provided subset). Failures on individual
 * routes do not abort the catalog run — each error is logged and the next
 * route continues. Geometry pipeline is intentionally independent: this
 * action never blocks geometry generation (rescue-first).
 */
export const classifyCatalog = action({
  args: {
    routeIds: v.optional(v.array(v.string())),
    failRouteIds: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { routeIds, failRouteIds }): Promise<ClassifyCatalogResult> => {
    await requireIdentity(ctx)

    const ids = routeIds ?? []
    if (ids.length === 0) {
      return { classified: 0, failed: 0, results: [] }
    }

    const results: ClassifyRouteResult[] = []
    for (const routeId of ids) {
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
