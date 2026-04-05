'use node'

/**
 * summarizeForContext — trim tool results to a compact LLM-facing shape.
 *
 * Heavy data (geometry, waypoints, leg steps) is dropped before results are
 * serialised into the LLM context. The full untrimmed result lives in
 * toolResultsTracker for frontend attachment purposes.
 *
 * Pure function — no side effects, no Convex runtime dependencies.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function roundInt(n: number): number {
  return Math.round(n)
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

// ---------------------------------------------------------------------------
// planRoute summarisation
// ---------------------------------------------------------------------------

type RouteSummaryEntry = {
  index: number
  label: string
  distanceMi: number
  durationMin: number
  highlights?: string[]
}

type PlanRouteSuccessSummary = {
  type: 'routes'
  routePlanId: unknown
  summary: RouteSummaryEntry[]
}

function summarizePlanRoute(result: Record<string, unknown>): unknown {
  const resultType = result['type']

  // Pass-through shapes that are already small
  if (resultType === 'error' || resultType === 'chat') {
    return result
  }

  // Success: { type: 'routes', data: { planId, options: [...] }, routePlanId }
  if (resultType === 'routes') {
    const data = result['data']
    const routePlanId = result['routePlanId']

    if (!isObject(data)) {
      // Unexpected shape — pass through unchanged
      return result
    }

    const options = data['options']
    if (!Array.isArray(options)) {
      return result
    }

    const summary: RouteSummaryEntry[] = options.map((option, index) => {
      if (!isObject(option)) {
        return { index, label: `Route ${index + 1}`, distanceMi: 0, durationMin: 0 }
      }

      // label may be on the option directly
      const label =
        typeof option['label'] === 'string' ? option['label'] : `Route ${index + 1}`

      // stats.distanceMeters / stats.durationSeconds
      const stats = isObject(option['stats']) ? option['stats'] : {}
      const distanceMeters =
        typeof stats['distanceMeters'] === 'number' ? stats['distanceMeters'] : 0
      const durationSeconds =
        typeof stats['durationSeconds'] === 'number' ? stats['durationSeconds'] : 0

      const distanceMi = roundInt(distanceMeters / 1609)
      const durationMin = roundInt(durationSeconds / 60)

      const entry: RouteSummaryEntry = { index, label, distanceMi, durationMin }

      // Include highlights if present (optional enrichment field)
      const highlights = option['highlights']
      if (Array.isArray(highlights) && highlights.length > 0) {
        entry.highlights = highlights as string[]
      }

      return entry
    })

    const summarized: PlanRouteSuccessSummary = {
      type: 'routes',
      routePlanId,
      summary,
    }

    return summarized
  }

  // Unknown type — pass through
  return result
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Trim a tool result to a compact shape suitable for inclusion in LLM context.
 *
 * For `planRoute` success results the geometry-heavy `data.options` array is
 * replaced with a `summary` array that contains only labels, distances, and
 * durations. All other tool results pass through unchanged.
 */
export function summarizeForContext(toolName: string, result: unknown): unknown {
  if (toolName === 'planRoute') {
    if (!isObject(result)) return result
    return summarizePlanRoute(result)
  }

  // geocode, fetchWeather, saveRoute, searchFavorites, and any unknown tools
  // pass through as-is.
  return result
}
