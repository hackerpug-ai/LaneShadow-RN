'use node'

import type { PlanInput, RouteSnapshot } from '../../../../models/saved-routes'
import { createWeatherProvider } from '../providers/weatherProvider'
import { compileSketch } from '../tools/compileSketch'
import { computeRouteIndex } from '../tools/computeRouteIndex'
import { findScenicWaypoints, type RouteVariant } from '../tools/findScenicWaypoints'
import { mapConditions } from '../tools/mapConditions'
import { normalizeRoute } from '../tools/normalizeRoute'
import { probeConditions } from '../tools/probeConditions'

export type OrchestratorResult = {
  routeSnapshot: RouteSnapshot
  sketch: any
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Deterministic route planning orchestrator. Replaces pi agent session.
 *
 * Steps:
 * 1. Generate route variants with different routing preferences (deterministic, no external APIs)
 * 2. Build RouteSketch objects from variants (deterministic, no LLM)
 * 3. Compile + normalize all variants in parallel (Promise.allSettled — partial failures ok)
 * 4. Probe weather conditions in parallel (try/catch — failures non-fatal)
 *
 * Note: enrichRoute (US-052) will be wired in after it exists.
 *
 * @param params.planInput - Route planning input (start, end, departure time, preferences)
 * @param params.departureTimeMs - Departure timestamp in milliseconds
 * @returns Array of OrchestratorResult (routeSnapshot + sketch), at least one entry
 * @throws {Error} 'NO_ROUTES_GENERATED' if all variant compilations fail
 */
export const planRideOrchestrator = async (params: {
  planInput: PlanInput
  departureTimeMs: number
}): Promise<OrchestratorResult[]> => {
  const { planInput, departureTimeMs } = params

  // Step 1: Generate route variants with different routing preferences
  // No external API calls - fully deterministic
  const variants = await findScenicWaypoints({
    start: planInput.start,
    end: planInput.end,
    preferences: planInput.preferences,
  })

  // Step 2: Build RouteSketch + compile + normalize in parallel
  // Promise.allSettled ensures one variant failure does not block the others
  const compiled = await Promise.allSettled(
    variants.map(async (variant) => {
      const sketch = buildSketchFromVariant(variant)
      // Use variant-specific preferences for routing diversity
      const variantPlanInput = variant.preferences
        ? { ...planInput, preferences: variant.preferences }
        : planInput
      const providerRoute = await compileSketch({ planInput: variantPlanInput, sketch })
      const routeSnapshot = await normalizeRoute({
        providerRoute,
        planInput: variantPlanInput,
        sketch,
      })
      return { routeSnapshot, sketch }
    }),
  )

  const successful = compiled
    .filter(
      (r): r is PromiseFulfilledResult<{ routeSnapshot: RouteSnapshot; sketch: any }> =>
        r.status === 'fulfilled',
    )
    .map((r) => r.value)

  // Log failures so we can debug NO_ROUTES_GENERATED
  const failed = compiled.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
  let failedVariantIndex = 0
  for (const failedVariant of failed) {
    // biome-ignore lint/suspicious/noConsole: warn lines are the required production signal for failed variants
    console.warn('[planRideOrchestrator] route variant failed', {
      failedVariantIndex: failedVariantIndex++,
      errorCode:
        failedVariant.reason &&
        typeof failedVariant.reason === 'object' &&
        'code' in failedVariant.reason
          ? failedVariant.reason.code
          : undefined,
      errorMessage:
        failedVariant.reason instanceof Error
          ? failedVariant.reason.message
          : String(failedVariant.reason),
    })
  }

  if (successful.length === 0) {
    throw new Error('NO_ROUTES_GENERATED')
  }

  // Step 3: Probe weather conditions — parallel, best-effort (failure not fatal per variant)
  const weatherProvider = createWeatherProvider()

  const withConditions = await Promise.all(
    successful.map(async ({ routeSnapshot, sketch }) => {
      try {
        const routeIndex = await computeRouteIndex(routeSnapshot)
        const probed = await probeConditions({ routeIndex, departureTimeMs, weatherProvider })
        const windOverlay = await mapConditions({ routeSnapshot, routeIndex, probed })
        const updatedSnapshot: RouteSnapshot = {
          ...routeSnapshot,
          overlays: { ...routeSnapshot.overlays, wind: windOverlay },
        }
        return { routeSnapshot: updatedSnapshot, sketch }
      } catch {
        return { routeSnapshot, sketch }
      }
    }),
  )

  const _conditionsCount = withConditions.filter(
    (r) => r.routeSnapshot.overlays?.wind !== undefined,
  ).length

  // Note: enrichRoute (US-052) will be wired in after it exists.
  // For now, build fallback labels from variant IDs.
  return withConditions.map(({ routeSnapshot, sketch }, idx) => ({
    routeSnapshot,
    sketch: {
      ...sketch,
      label: sketch.label || `Route ${idx + 1}`,
      rationale: sketch.rationale ?? '',
    },
  }))
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a RouteSketch from a RouteVariant.
 * Deterministic — no LLM involved.
 * Exported for testing.
 */
export const buildSketchFromVariant = (variant: RouteVariant): any => ({
  label: variant.id.replace(/-/g, ' '),
  rationale: '',
  segments: [],
  anchorPoints: [], // No waypoints - Google Routes API creates routes based on preferences only
})
