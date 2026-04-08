'use node'

import { v } from 'convex/values'
import { internalAction } from '../../../_generated/server'
import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'
import type { RouteSnapshot , PlanInput, RouteLeg } from '../../../../models/saved-routes'
import { enrichRoute, type EnrichRouteInput } from '../tools/enrichRoute'

/**
 * Background enrichment job runner
 *
 * Executes enrichment phases asynchronously, checking for cancellation
 * and updating the enrichment record with results.
 */
export const runEnrichmentJobHandler = async (
  ctx: any,
  args: { enrichmentId: Id<'route_enrichments'>; phase: 'fast' | 'extended' }
): Promise<null> => {
    const enrichment = await ctx.runQuery(
      internal.db.routeEnrichments.getById,
      { enrichmentId: args.enrichmentId }
    )

    // Early return if cancelled or not found
    if (!enrichment || enrichment.status === 'cancelled') {
      return null
    }

    // Update status to running
    await ctx.runMutation(
      internal.db.routeEnrichments.updateStatus,
      { enrichmentId: args.enrichmentId, status: 'running' }
    )

    try {
      // Get route plan details
      const routePlan = await ctx.runQuery(
        internal.db.routePlans.getPlanByIdInternal,
        { routePlanId: enrichment.routePlanId }
      )

      if (!routePlan) {
        throw new Error('Route plan not found')
      }

      // Run enrichment based on phase
      const results = await runEnrichmentPhase({
        phase: args.phase,
        routePlan: routePlan.result,
        planInput: routePlan.planInput,
      })

      // Check for cancellation again
      const current = await ctx.runQuery(
        internal.db.routeEnrichments.getById,
        { enrichmentId: args.enrichmentId }
      )

      if (current?.status === 'cancelled') {
        return null
      }

      // Save results to route_enrichments table
      await ctx.runMutation(
        internal.db.routeEnrichments.completeEnrichment,
        { enrichmentId: args.enrichmentId, enrichments: results }
      )

      // Merge enrichment into route_plans table for reactive UI updates
      await ctx.runMutation(
        internal.db.routePlans.mergeEnrichment,
        {
          routePlanId: enrichment.routePlanId,
          enrichments: results,
        }
      )

      console.log(`Enrichment ${args.phase} completed for routePlan ${enrichment.routePlanId}`)
    } catch (error) {
      await ctx.runMutation(
        internal.db.routeEnrichments.failEnrichment,
        {
          enrichmentId: args.enrichmentId,
          error: error instanceof Error ? error.message : String(error),
        }
      )
    }

    return null
}

export const runEnrichmentJob = internalAction({
  args: {
    enrichmentId: v.id('route_enrichments'),
    phase: v.union(v.literal('fast'), v.literal('extended')),
  },
  returns: v.null(),
  handler: runEnrichmentJobHandler,
})

/**
 * Run enrichment phase logic
 *
 * Calls the enrichRoute tool to generate route labels, rationales, highlights, and leg labels.
 * Fast phase: Basic route descriptions and highlights with leg labeling
 * Extended phase: Would include elevation, weather, and extended analysis
 */
async function runEnrichmentPhase(params: {
  phase: 'fast' | 'extended'
  routePlan: RouteSnapshot
  planInput: PlanInput
}): Promise<{
  routeOptionId: string
  label: string
  rationale: string
  highlights: string[]
  legLabels?: string[]
}[]> {
  const { phase, routePlan, planInput } = params

  // Extract leg context for AI labeling
  const legContext = routePlan.legs.map((leg, idx) => ({
    index: idx,
    fromName: leg.start.label,
    toName: leg.end.label,
    distance: leg.distanceMeters,
  }))

  // Extract waypoints from route for AI context
  const waypoints = routePlan.legs.map((leg, idx) => ({
    name: leg.start.label || `Point ${idx}`,
    type: 'waypoint',
  }))

  // Add the end point as the last waypoint
  if (routePlan.legs.length > 0) {
    const lastLeg = routePlan.legs[routePlan.legs.length - 1]
    waypoints.push({
      name: lastLeg.end.label || 'Destination',
      type: 'waypoint',
    })
  }

  // Call enrichRoute tool with leg context
  const enrichInput: EnrichRouteInput = {
    routes: [
      {
        waypoints,
        legContext,
        stats: {
          distanceMeters: routePlan.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
          durationSeconds: routePlan.legs.reduce((sum, leg) => sum + leg.durationSeconds, 0),
        },
        preferences: planInput.preferences,
      },
    ],
  }

  const enrichments = await enrichRoute(enrichInput)

  return [
    {
      routeOptionId: routePlan.provider || 'default',
      label: enrichments[0].label,
      rationale: enrichments[0].rationale,
      highlights: enrichments[0].highlights,
      legLabels: enrichments[0].legLabels,
    },
  ]
}
