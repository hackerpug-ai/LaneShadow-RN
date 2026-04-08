'use node'

import { v } from 'convex/values'
import { internalAction } from '../../../_generated/server'
import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'
import type { RouteSnapshot } from '../../../../models/saved-routes'
import type { PlanInput } from '../../../../models/saved-routes'

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
 * Calls the enrichRoute implementation to generate route labels and rationales.
 * Fast phase: Basic route descriptions and highlights
 * Extended phase: Would include elevation, weather, and extended analysis
 */
async function runEnrichmentPhase(params: {
  phase: 'fast' | 'extended'
  routePlan: RouteSnapshot
  planInput: PlanInput
}): Promise<Array<{
  routeOptionId: string
  label: string
  rationale: string
  highlights: string[]
}>> {
  const { phase, routePlan } = params

  // For now, implement basic enrichment logic
  // In production, this would use the enrichRoute tool or AI service
  const enrichments: Array<{
    routeOptionId: string
    label: string
    rationale: string
    highlights: string[]
  }> = []

  // Generate a basic label based on route characteristics
  const distanceKm = Math.round(
    routePlan.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0) / 1000
  )
  const durationMin = Math.round(
    routePlan.legs.reduce((sum, leg) => sum + leg.durationSeconds, 0) / 60
  )

  let label = `${distanceKm} km Route`
  let rationale = `Direct route covering ${distanceKm} km in approximately ${durationMin} minutes.`

  // Add scenic bias context if present
  const scenicBias = params.planInput.preferences?.scenicBias
  if (scenicBias === 'high') {
    label = 'Scenic ' + label
    rationale = `Prioritizes scenic roads and natural beauty. ${rationale}`
  }

  // Generate highlights from annotations
  const highlights = routePlan.annotations
    .filter((a) => a.annotationKind === 'place')
    .map((a) => a.label)
    .slice(0, 3) // Limit to top 3 highlights

  enrichments.push({
    routeOptionId: routePlan.provider || 'default',
    label,
    rationale,
    highlights,
  })

  return enrichments
}
