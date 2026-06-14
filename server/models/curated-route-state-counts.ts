/**
 * Curated Route State Counts
 *
 * Denormalized summary table tracking the count of routes per state.
 * This is used by listCuratedRouteStates to return state summaries without
 * reading all 5,654+ full curated_routes documents, which would exceed
 * the 16MB single-execution read limit.
 *
 * The summary is kept in sync via an internal mutation that is called
 * whenever routes are upserted.
 */

import { v } from 'convex/values'

/**
 * Curated route state count validator
 *
 * Stores the normalized state name and count of routes in that state.
 */
export const curatedRouteStateCountValidator = v.object({
  // Normalized state name (canonical spelling)
  stateName: v.string(),
  // Count of routes in this state
  routeCount: v.number(),
  // Timestamp of last update
  updatedAt: v.number(),
})

export type CuratedRouteStateCount = {
  stateName: string
  routeCount: number
  updatedAt: number
}
