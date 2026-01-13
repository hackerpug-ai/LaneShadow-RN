'use node'

import { v } from 'convex/values'
import { action } from '../../_generated/server'

import {
  boundsValidator,
  conditionsStatusValidator,
  planInputValidator,
  polylineGeometryValidator,
  routeLegValidator,
  windSummaryValidator,
} from '../../../models/saved-routes'
import type { PlannedRouteOptionsView } from '../../../types/routes'
import { requireIdentity, requireSession } from '../../guards'
import { runPlanningGraph } from './graphs/planningGraph'

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
  }),
  overlaysPreview: v.object({
    windSummary: windSummaryValidator,
    conditionsStatus: conditionsStatusValidator,
  }),
})

const plannedRouteOptionsViewValidator = v.object({
  planId: v.string(),
  options: v.array(plannedRouteOptionValidator),
})

export const planRide = action({
  args: { planInput: planInputValidator },
  returns: plannedRouteOptionsViewValidator,
  handler: async (ctx, args): Promise<PlannedRouteOptionsView> => {
    const session = await requireSession(ctx)

    // Pass userId for LangSmith tracing observability
    const result = await runPlanningGraph({
      planInput: args.planInput,
      clerkUserId: session.user.clerkUserId,
      userId: session.user._id,
    })

    // Hard-fail if LLM or all routes failed
    if (result.error) {
      throw new Error(result.error)
    }

    if (!result.options.length) {
      throw new Error('LLM_SKETCH_INVALID')
    }

    return {
      planId: result.planId,
      options: result.options,
    }
  },
})
