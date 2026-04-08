'use node'

import { v } from 'convex/values'
import { internalAction } from '../../../_generated/server'
import { internal } from '../../../_generated/api'

/**
 * Background enrichment job runner
 *
 * Executes enrichment phases asynchronously, checking for cancellation
 * and updating the enrichment record with results.
 */
export const runEnrichmentJob = internalAction({
  args: {
    enrichmentId: v.id('route_enrichments'),
    phase: v.union(v.literal('fast'), v.literal('extended')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
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

      // Save results
      await ctx.runMutation(
        internal.db.routeEnrichments.completeEnrichment,
        { enrichmentId: args.enrichmentId, enrichments: results }
      )

      // Trigger UI update via session message
      // Note: Session message schema doesn't currently support enrichment data
      // This will be added in a follow-up task
      if (routePlan.planningSessionId) {
        // TODO: Add enrichment data to session message attachment schema
        // For now, just log completion
        console.log(`Enrichment ${args.phase} completed for routePlan ${enrichment.routePlanId}`)
      }
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
  },
})

/**
 * Run enrichment phase logic
 *
 * This is a placeholder for the actual enrichment implementation.
 * In production, this would call the enrichRoute tool or similar.
 */
async function runEnrichmentPhase(params: {
  phase: 'fast' | 'extended'
  routePlan: any
  planInput: any
}): Promise<Array<{
  routeOptionId: string
  label: string
  rationale: string
  highlights: string[]
}>> {
  // TODO: Implement actual enrichment logic
  // For now, return empty results
  return []
}
