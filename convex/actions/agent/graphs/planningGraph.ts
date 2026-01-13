'use node'

import { LangChainTracer } from '@langchain/core/tracers/tracer_langchain'
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import { ChatOpenAI } from '@langchain/openai'
import { randomUUID } from 'crypto'
import { z } from 'zod'

import type { RouteSketch } from '../../../../models/route-sketch'
import {
  agentRouteSketchSchema,
  isRouteSketchWithinLimits,
  MAX_ROUTE_SKETCH_SEGMENTS,
} from '../../../../models/route-sketch'
import type {
  ConditionsStatus,
  PlanInput,
  RouteSnapshot,
  WindSummary,
} from '../../../../models/saved-routes'
import { WIND_SUMMARY } from '../../../../models/saved-routes'
import type { PlannedRouteOptionView } from '../../../../types/routes'
import {
  LANGSMITH_API_KEY,
  LANGSMITH_PROJECT,
  LANGSMITH_TRACING,
  OPENAI_API_KEY,
} from '../../../lib/env'
import { retryOnce, withTimeout } from '../lib/reliability'
import { createWeatherProvider } from '../providers/weatherProvider'
import { compileSketch } from '../tools/compileSketch'
import { computeRouteIndex } from '../tools/computeRouteIndex'
import { mapConditions } from '../tools/mapConditions'
import { normalizeRoute } from '../tools/normalizeRoute'
import { probeConditions } from '../tools/probeConditions'

// -----------------------------------------------------------------------------
// LLM Structured Output Schema
// -----------------------------------------------------------------------------

export const sketchesResponseSchema = z.object({
  sketches: z.array(agentRouteSketchSchema).min(1).max(3),
})

// -----------------------------------------------------------------------------
// Graph State Annotation
// -----------------------------------------------------------------------------

export const PlanningState = Annotation.Root({
  // Inputs
  planInput: Annotation<PlanInput>,

  // Intermediate state
  planId: Annotation<string>,
  sketches: Annotation<Array<RouteSketch>>,

  // Output
  options: Annotation<Array<PlannedRouteOptionView>>,

  // Error tracking
  error: Annotation<string | null>,
})

export type PlanningStateType = typeof PlanningState.State

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const LLM_TIMEOUT_MS = 25_000

// -----------------------------------------------------------------------------
// Node: Generate Sketches (LLM - probabilistic)
// -----------------------------------------------------------------------------

export const buildSystemPrompt = (): string => {
  return [
    'You are a deterministic motorcycle route sketcher.',
    'Return 2–3 scenic route sketches.',
    'Each sketch must include label, rationale, segments (roadName/fromName/toName/viaNames), and anchorPoints (kind, name, optional lat/lng).',
    `Never exceed ${MAX_ROUTE_SKETCH_SEGMENTS} segments.`,
  ].join(' ')
}

export const buildUserPrompt = (planInput: PlanInput): string => {
  return ['Plan a scenic motorcycle route.', 'Input:', JSON.stringify(planInput)].join('\n')
}

export const generateSketches = async (
  state: PlanningStateType
): Promise<Partial<PlanningStateType>> => {
  if (!OPENAI_API_KEY) {
    return { error: 'LLM_SKETCH_INVALID', sketches: [] }
  }

  const model = new ChatOpenAI({
    model: 'gpt-4o',
    temperature: 0,
    apiKey: OPENAI_API_KEY,
  })

  const structuredModel = model.withStructuredOutput(sketchesResponseSchema)

  const runOnce = async (): Promise<Array<RouteSketch>> => {
    const result = await structuredModel.invoke([
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(state.planInput) },
    ])

    // Cast to RouteSketch[] after Zod validation (LangChain types widen the structured output)
    const sketches = result.sketches as Array<RouteSketch>
    const valid = sketches.filter((sketch) => isRouteSketchWithinLimits(sketch))
    if (!valid.length) {
      throw new Error('LLM_SKETCH_INVALID')
    }
    return valid
  }

  try {
    // First attempt with timeout
    let sketches = await withTimeout(runOnce, { ms: LLM_TIMEOUT_MS, label: 'llm' })

    // Repair attempt if too few sketches
    if (sketches.length < 2) {
      sketches = await withTimeout(runOnce, { ms: LLM_TIMEOUT_MS, label: 'llm-repair' })
    }

    return {
      sketches: sketches.slice(0, 3),
      planId: randomUUID(),
    }
  } catch (error) {
    // Retry once for transient failures
    try {
      const recovered = await retryOnce(() =>
        withTimeout(runOnce, { ms: LLM_TIMEOUT_MS, label: 'llm-retry' })
      )
      return {
        sketches: recovered.slice(0, 3),
        planId: randomUUID(),
      }
    } catch {
      return { error: 'LLM_SKETCH_INVALID', sketches: [] }
    }
  }
}

// -----------------------------------------------------------------------------
// Node: Process Routes (deterministic)
// -----------------------------------------------------------------------------

export const worstWindLevel = (snapshot: RouteSnapshot): WindSummary => {
  const wind = snapshot.overlays.wind
  if (!wind) return WIND_SUMMARY.UNAVAILABLE

  const priority: Record<Exclude<WindSummary, 'unavailable'>, number> = {
    [WIND_SUMMARY.LOW]: 1,
    [WIND_SUMMARY.MODERATE]: 2,
    [WIND_SUMMARY.HIGH]: 3,
  }
  let maxLevel: Exclude<WindSummary, 'unavailable'> = WIND_SUMMARY.LOW
  wind.byLeg.forEach((leg) => {
    leg.segments.forEach((seg) => {
      const level = seg.level as Exclude<WindSummary, 'unavailable'>
      if (level in priority && priority[level] > priority[maxLevel]) {
        maxLevel = level
      }
    })
  })
  return maxLevel
}

export const sumStats = (snapshot: RouteSnapshot) => {
  let distanceMeters = 0
  let durationSeconds = 0
  snapshot.legs.forEach((leg) => {
    distanceMeters += leg.distanceMeters
    durationSeconds += leg.durationSeconds
  })
  return { distanceMeters, durationSeconds, legsCount: snapshot.legs.length }
}

export const processRoutes = async (
  state: PlanningStateType
): Promise<Partial<PlanningStateType>> => {
  // Skip if we have an error or no sketches
  if (state.error || !state.sketches?.length) {
    return { options: [] }
  }

  const options: Array<PlannedRouteOptionView> = []

  for (const sketch of state.sketches) {
    try {
      // Deterministic: Compile sketch with routing provider
      const providerRoute = await compileSketch({ planInput: state.planInput, sketch })

      // Deterministic: Normalize to RouteSnapshot
      const routeSnapshot = normalizeRoute({ providerRoute, planInput: state.planInput })

      // Deterministic: Compute RouteIndex
      const routeIndex = computeRouteIndex(routeSnapshot)

      // Deterministic: Probe conditions (soft-fail)
      let conditionsStatus: ConditionsStatus = 'ok'
      let windSummary: WindSummary = WIND_SUMMARY.UNAVAILABLE

      try {
        const weatherProvider = createWeatherProvider()
        const probed = await probeConditions({
          routeIndex,
          departureTimeMs: state.planInput.departureTime,
          weatherProvider,
        })
        const windOverlay = mapConditions({
          routeSnapshot,
          routeIndex,
          probed,
        })
        routeSnapshot.overlays = { ...routeSnapshot.overlays, wind: windOverlay }
        windSummary = worstWindLevel(routeSnapshot)
        conditionsStatus = 'ok'
      } catch (error) {
        // Soft-fail: conditions unavailable, but route is still valid
        console.warn('conditions unavailable', error)
        conditionsStatus = 'unavailable'
        windSummary = WIND_SUMMARY.UNAVAILABLE
        routeSnapshot.overlays = { ...routeSnapshot.overlays, wind: undefined }
      }

      // Build option
      const stats = sumStats(routeSnapshot)
      options.push({
        routeOptionId: randomUUID(),
        label: sketch.label,
        rationale: sketch.rationale,
        stats,
        map: {
          bounds: routeSnapshot.bounds,
          overviewGeometry: routeSnapshot.overviewGeometry,
          legs: routeSnapshot.legs,
        },
        overlaysPreview: {
          windSummary,
          conditionsStatus,
        },
      })
    } catch (error) {
      // Skip this sketch if compilation/normalization fails
      console.warn('Failed to process sketch', sketch.label, error)
    }
  }

  return { options }
}

// -----------------------------------------------------------------------------
// Graph Factory (for testing)
// -----------------------------------------------------------------------------

export const createPlanningGraph = () => {
  return new StateGraph(PlanningState)
    .addNode('generateSketches', generateSketches)
    .addNode('processRoutes', processRoutes)
    .addEdge(START, 'generateSketches')
    .addEdge('generateSketches', 'processRoutes')
    .addEdge('processRoutes', END)
}

// -----------------------------------------------------------------------------
// Compiled Graph (singleton for production)
// -----------------------------------------------------------------------------

const planningGraph = createPlanningGraph().compile()

// -----------------------------------------------------------------------------
// Observability: LangSmith Tracing
// @see https://docs.langchain.com/oss/javascript/langgraph/observability
// -----------------------------------------------------------------------------

const createTracer = (): LangChainTracer | undefined => {
  if (!LANGSMITH_TRACING || !LANGSMITH_API_KEY) {
    return undefined
  }
  return new LangChainTracer({
    projectName: LANGSMITH_PROJECT,
  })
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

export type PlanningGraphInput = {
  planInput: PlanInput
  clerkUserId: string
  userId: string
  /** Optional request ID for tracing correlation */
  requestId?: string
}

export type PlanningGraphOutput = {
  planId: string
  options: Array<PlannedRouteOptionView>
  error: string | null
}

export const runPlanningGraph = async (input: PlanningGraphInput): Promise<PlanningGraphOutput> => {
  const tracer = createTracer()
  const runId = input.requestId ?? randomUUID()

  // Build invoke config with optional tracing
  const invokeConfig = tracer
    ? {
        callbacks: [tracer],
        tags: ['planRide', 'v1'],
        metadata: {
          userId: input.userId,
          clerkUserId: input.clerkUserId,
          requestId: runId,
          startLat: input.planInput.start.lat,
          startLng: input.planInput.start.lng,
          endLat: input.planInput.end.lat,
          endLng: input.planInput.end.lng,
        },
        runName: `planRide-${runId}`,
      }
    : undefined

  const result = await planningGraph.invoke(
    {
      planInput: input.planInput,
      planId: '',
      sketches: [],
      options: [],
      error: null,
    },
    invokeConfig
  )

  return {
    planId: result.planId,
    options: result.options,
    error: result.error,
  }
}
