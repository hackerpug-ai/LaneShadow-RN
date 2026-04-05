'use node'

import { randomUUID } from 'crypto'
import { v } from 'convex/values'
import { action, internalAction } from '../../_generated/server'

import {
  boundsValidator,
  conditionsStatusValidator,
  planInputValidator,
  polylineGeometryValidator,
  rainSummaryValidator,
  routeLegValidator,
  routeOverlaysValidator,
  temperatureSummaryValidator,
  windSummaryValidator,
} from '../../../models/saved-routes'
import type { PlannedRouteOptionsView } from '../../../types/routes'
import { requireSession } from '../../guards'
import { internal } from '../../_generated/api'
import { backend } from '../../lib/logger'
import { ERROR_CODES } from '../../errors'
import type { Id } from '../../_generated/dataModel'
import { ROUTE_PLAN_STATUS } from '../../../models/route-plans'
import { planRideOrchestrator } from './lib/planRideOrchestrator'
import type { OrchestratorResult } from './lib/planRideOrchestrator'
import { getConversationalError } from '../../lib/conversationalErrors'

const plannedRouteOptionValidator = v.object({
  routeOptionId: v.string(),
  label: v.string(),
  rationale: v.string(),
  stats: v.object({
    distanceMeters: v.number(),
    durationSeconds: v.number(),
    legsCount: v.number(),
  }),
  map: v.object({
    bounds: boundsValidator,
    overviewGeometry: polylineGeometryValidator,
    legs: v.array(routeLegValidator),
    overlays: v.optional(routeOverlaysValidator),
  }),
  overlaysPreview: v.object({
    windSummary: windSummaryValidator,
    rainSummary: rainSummaryValidator,
    temperatureSummary: temperatureSummaryValidator,
    maxTemperatureF: v.optional(v.number()),
    conditionsStatus: conditionsStatusValidator,
  }),
})

const plannedRouteOptionsViewValidator = v.object({
  planId: v.string(),
  options: v.array(plannedRouteOptionValidator),
})

/**
 * Build user prompt from PlanInput for agent.
 * @internal Exported for testing only
 */
export const buildUserPrompt = (planInput: any): string => {
  const parts = [
    'Plan a scenic motorcycle route.',
    '',
    'Route Details:',
    `- Start: ${planInput.start.label ?? `${planInput.start.lat},${planInput.start.lng}`}`,
    `- End: ${planInput.end.label ?? `${planInput.end.lat},${planInput.end.lng}`}`,
    `- Departure: ${new Date(planInput.departureTime).toISOString()}`,
    '',
    'Preferences:',
    `- Scenic bias: ${planInput.preferences?.scenicBias ?? 'default'}`,
    `- Avoid highways: ${planInput.preferences?.avoidHighways ? 'yes' : 'no'}`,
    `- Avoid tolls: ${planInput.preferences?.avoidTolls ? 'yes' : 'no'}`,
    '',
    'Generate 2-3 route options using the available tools.',
    'For each route: call compileSketch then normalizeRoute.',
    'After processing all routes, reply with "Done."',
  ]
  return parts.join('\n')
}

/**
 * Map orchestrator results to PlannedRouteOptionsView.
 * @internal Exported for testing only
 */
export const buildOptionsFromResults = (
  results: OrchestratorResult[],
  planId: string
): PlannedRouteOptionsView => ({
  planId,
  options: results.map((result, idx) => {
    const snap = result.routeSnapshot
    const sketch = result.sketch
    return {
      routeOptionId: randomUUID(),
      label: sketch?.label ?? `Route ${idx + 1}`,
      rationale: sketch?.rationale ?? '',
      stats: {
        distanceMeters: snap.legs.reduce((s: number, l: any) => s + (l.distanceMeters ?? 0), 0),
        durationSeconds: snap.legs.reduce((s: number, l: any) => s + (l.durationSeconds ?? 0), 0),
        legsCount: snap.legs.length,
      },
      map: {
        bounds: snap.bounds,
        overviewGeometry: snap.overviewGeometry,
        legs: snap.legs,
        overlays: snap.overlays ?? {},
      },
      overlaysPreview: {
        windSummary: 'unavailable',
        rainSummary: 'unavailable',
        temperatureSummary: 'unavailable',
        conditionsStatus: 'unavailable',
      },
    }
  }),
})

/**
 * Plan a motorcycle ride route using the deterministic orchestrator.
 *
 * @param ctx - Convex action context
 * @param args.planInput - Route planning input including start/end points, departure time, and preferences
 * @returns Promise<PlannedRouteOptionsView> - Generated route options with geometry and conditions
 * @throws {Error} ERROR_CODES.SESSION_REQUIRED if user is not authenticated
 * @throws {Error} ERROR_CODES.AGENT_TIMEOUT if orchestrator does not respond within 55 seconds
 * @throws {Error} ERROR_CODES.NO_ROUTES_GENERATED if orchestrator produces no route options
 */
export const planRide = action({
  args: { planInput: planInputValidator, devBypassKey: v.optional(v.string()) },
  returns: plannedRouteOptionsViewValidator,
  handler: async (ctx, args): Promise<PlannedRouteOptionsView> => {
    const session = await requireSession(ctx, args.devBypassKey)

    backend.info('convex.action', 'planRide started', {
      userId: session.user._id,
      start: args.planInput.start,
      end: args.planInput.end,
      departureTime: args.planInput.departureTime,
    })

    // Timeout guard
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(ERROR_CODES.AGENT_TIMEOUT))
      }, 55000)
    })

    try {
      const results = await Promise.race([
        planRideOrchestrator({
          planInput: args.planInput,
          departureTimeMs: args.planInput.departureTime,
        }),
        timeoutPromise,
      ])

      if (!results.length) {
        throw new Error(ERROR_CODES.NO_ROUTES_GENERATED)
      }

      const result = buildOptionsFromResults(results, randomUUID())

      backend.info('convex.action', 'planRide completed successfully', {
        userId: session.user._id,
        optionsCount: result.options.length,
        planId: result.planId,
      })

      return result
    } catch (error) {
      backend.error('convex.action', 'Route planning failed', error as Error, {
        userId: session.user._id,
      })

      // Convert error to conversational error for chat interface
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorValues = Object.values(ERROR_CODES)
      const errorCode = errorValues.includes(errorMessage as typeof ERROR_CODES[keyof typeof ERROR_CODES])
        ? (errorMessage as typeof ERROR_CODES[keyof typeof ERROR_CODES])
        : ERROR_CODES.GENERATION_FAILED

      const conversationalError = getConversationalError(errorCode, {
        userId: session.user._id,
      })

      // Return conversational error instead of throwing
      throw new Error(JSON.stringify({
        error: conversationalError,
        originalError: errorMessage,
      }))
    }
  },
})

// ---------------------------------------------------------------------------
// executePlan - internalAction for async scheduled route planning
// ---------------------------------------------------------------------------

/**
 * Context shape for executePlanHandler (testable without Convex runtime).
 * @internal
 */
type ExecutePlanCtx = {
  runQuery: (ref: unknown, args: unknown) => Promise<unknown>
  runMutation: (ref: unknown, args: unknown) => Promise<unknown>
}

/**
 * Testable handler for executePlan.
 * Accepts injected orchestrator function so unit tests can mock it.
 * @internal Exported for testing only
 */
export const executePlanHandler = async (
  ctx: ExecutePlanCtx,
  args: { routePlanId: Id<'route_plans'> },
  orchestratorFn: typeof planRideOrchestrator = planRideOrchestrator
): Promise<void> => {
  const { routePlanId } = args

  console.info('[planRide] executePlanHandler started', { routePlanId })

  // Step 1: Read the plan record
  const plan = await ctx.runQuery(
    (internal as any).db.routePlans.getPlanByIdInternal,
    { routePlanId }
  ) as any

  console.info('[planRide] Plan retrieved', { planId: plan?._id, status: plan?.status })

  // Step 2: Early return if plan is null or cancelled
  if (!plan || plan.status === ROUTE_PLAN_STATUS.CANCELLED) {
    return
  }

  // Step 3: Update status to 'running'
  // Note: Auth was already validated in createPlan mutation that scheduled this job.
  // Background jobs (internalAction via scheduler) have no JWT context.
  await ctx.runMutation(
    (internal as any).db.routePlans.updatePlanStatus,
    { routePlanId, status: ROUTE_PLAN_STATUS.RUNNING, statusMessage: 'Starting route planning...' }
  )

  try {
    // Step 4: Update status message
    await ctx.runMutation(
      (internal as any).db.routePlans.updatePlanStatus,
      { routePlanId, status: ROUTE_PLAN_STATUS.RUNNING, statusMessage: 'Generating route options...' }
    )

    // Step 5: Check for cancellation before running orchestrator
    const checkCancelled = async (): Promise<boolean> => {
      const current = await ctx.runQuery(
        (internal as any).db.routePlans.getPlanByIdInternal,
        { routePlanId }
      ) as any
      return current?.status === ROUTE_PLAN_STATUS.CANCELLED
    }

    if (await checkCancelled()) {
      return
    }

    // Step 6: Timeout guard (240 seconds for background job)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error('[planRide] Orchestrator timeout after 240 seconds')
        reject(new Error(ERROR_CODES.AGENT_TIMEOUT))
      }, 240_000)
    })

    console.info('[planRide] Starting planRideOrchestrator...')

    // Step 7: Run orchestrator - race against timeout
    const results = await Promise.race([
      orchestratorFn({
        planInput: plan.planInput,
        departureTimeMs: plan.planInput.departureTime,
      }),
      timeoutPromise,
    ])

    console.info('[planRide] Orchestrator completed, routes:', results.length)

    // Check cancellation after orchestrator completes
    if (await checkCancelled()) {
      return
    }

    if (results.length === 0) {
      throw new Error(ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE)
    }

    await ctx.runMutation(
      (internal as any).db.routePlans.updatePlanStatus,
      { routePlanId, status: ROUTE_PLAN_STATUS.RUNNING, statusMessage: 'Finalizing route...' }
    )

    const result: PlannedRouteOptionsView = buildOptionsFromResults(results, randomUUID())

    const firstOption = result.options[0]
    const firstLeg = firstOption?.map?.legs?.[0]
    console.info('[planRide] Writing completed result to DB:', {
      optionsCount: result.options.length,
      firstOptionLabel: firstOption?.label,
      firstLegKeys: firstLeg ? Object.keys(firstLeg) : [],
      firstLegHasGeometry: !!firstLeg?.geometry,
      firstLegGeometry: firstLeg?.geometry
        ? { format: firstLeg.geometry.format, encoding: firstLeg.geometry.encoding, hasValue: !!firstLeg.geometry.value, valueLen: firstLeg.geometry.value?.length }
        : 'MISSING',
    })

    await ctx.runMutation(
      (internal as any).db.routePlans.updatePlanStatus,
      {
        routePlanId,
        status: ROUTE_PLAN_STATUS.COMPLETED,
        result,
        statusMessage: 'Route ready!',
      }
    )
  } catch (error) {
    // On any failure, write 'failed' to DB - never leave plan stuck in 'running'
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error('[planRide] Error during execution:', {
      routePlanId,
      error: errorMessage,
      errorStack: error instanceof Error ? error.stack : undefined,
    })

    // Determine error code for conversational error
    let errorCode: typeof ERROR_CODES[keyof typeof ERROR_CODES] = ERROR_CODES.GENERATION_FAILED
    if (errorMessage === ERROR_CODES.AGENT_TIMEOUT) {
      errorCode = ERROR_CODES.AGENT_TIMEOUT
    } else if (errorMessage === ERROR_CODES.NO_ROUTES_GENERATED) {
      errorCode = ERROR_CODES.NO_ROUTES_GENERATED
    } else if (errorMessage === ERROR_CODES.INVALID_AGENT_RESPONSE_STRUCTURE) {
      errorCode = ERROR_CODES.NO_ROUTES_GENERATED
    }

    const conversationalError = getConversationalError(errorCode)

    await ctx.runMutation(
      (internal as any).db.routePlans.updatePlanStatus,
      {
        routePlanId,
        status: ROUTE_PLAN_STATUS.FAILED,
        errorCode: errorCode,
        errorMessage: conversationalError.message,
        statusMessage: conversationalError.message,
      }
    )
  }
}

/**
 * Execute a scheduled route plan job.
 * Reads from route_plans, runs the deterministic orchestrator, and writes results back.
 *
 * @param args.routePlanId - The ID of the route plan to execute
 */
export const executePlan = internalAction({
  args: { routePlanId: v.id('route_plans') },
  returns: v.null(),
  handler: async (ctx, args): Promise<null> => {
    await executePlanHandler(ctx as unknown as ExecutePlanCtx, args)
    return null
  },
})
