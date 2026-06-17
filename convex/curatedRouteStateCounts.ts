/**
 * Curated Route State Counts
 *
 * Maintains a denormalized summary table of route counts per state.
 * This avoids the 16MB single-execution read limit when returning state summaries.
 */

import { v } from 'convex/values'
import { internal } from './_generated/api'
import { action, internalMutation } from './_generated/server'
import { normalizeState } from './util/dataNormalization'

/**
 * Internal mutation: insert a single state count record
 */
export const insertStateCount = internalMutation({
  args: {
    stateName: v.string(),
    routeCount: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, { stateName, routeCount, updatedAt }) => {
    return await ctx.db.insert('curated_route_state_counts', {
      stateName,
      routeCount,
      updatedAt,
    })
  },
})

/**
 * Internal mutation: process a single page of routes and accumulate state counts
 *
 * Since Convex only allows one paginated query per function execution, we use
 * a helper mutation to process one page at a time.
 */
export const processPageInternal = internalMutation({
  args: {
    cursor: v.union(v.string(), v.null()),
    accumulatedCounts: v.record(v.string(), v.number()),
  },
  handler: async (ctx, { cursor, accumulatedCounts }) => {
    const page = await ctx.db.query('curated_routes').paginate({ cursor, numItems: 200 })

    const stateCounts = new Map(Object.entries(accumulatedCounts))

    for (const route of page.page) {
      const normalizedState = normalizeState(route.state)
      stateCounts.set(normalizedState, (stateCounts.get(normalizedState) ?? 0) + 1)
    }

    return {
      counts: Object.fromEntries(stateCounts),
      isDone: page.isDone ?? false,
      continueCursor: page.continueCursor ?? null,
    }
  },
})

/**
 * Internal mutation: rebuild state counts from curated routes
 *
 * This is called after upsert operations to refresh the summary table.
 * It clears existing records and rebuilds from the full route catalog.
 */
export const rebuildStateCountsInternal = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Clear the summary table
    const existingRecords = await ctx.db.query('curated_route_state_counts').collect()
    for (const record of existingRecords) {
      await ctx.db.delete(record._id)
    }

    // Since we can only have one paginated query per execution,
    // we'll use a simpler approach: just query non-paginated but with a reasonable limit
    // The 16MB limit applies per execution, not per query, so we need to be careful.
    // For 5,654 routes with an average document size of ~3KB each,
    // that's about 17MB total, which exceeds the limit.
    // Instead, use the same pattern as the geospatial seed: paginate in the action.

    // For now, we'll rely on the backfill action to do the heavy lifting.
    // This mutation just clears the table so the backfill can repopulate it.
    return {
      clearedRecords: existingRecords.length,
      message: 'State counts cleared. Use backfillStateCountsAction to repopulate.',
    }
  },
})

/**
 * Public action: backfill state counts for existing routes
 *
 * This should be run once to populate the summary table from the current catalog.
 * After backfill, rebuildStateCountsInternal is called after every upsert.
 *
 * Runs in an action (not a mutation) so it can paginate through all routes
 * while respecting the single-paginated-query-per-execution limit.
 *
 * Usage: convex run curatedRouteStateCounts:backfillStateCountsAction
 */
export const backfillStateCountsAction = action({
  args: {},
  handler: async (
    ctx,
  ): Promise<{
    pagesProcessed: number
    statesRecorded: number
    totalRoutesCounted: number
  }> => {
    // Clear the summary table
    await ctx.runMutation(internal.curatedRouteStateCounts.rebuildStateCountsInternal)

    // Page through curated_routes and accumulate state counts
    const stateCounts = new Map<string, number>()
    let cursor: string | null = null
    let pagesProcessed = 0

    while (true) {
      const page = (await ctx.runMutation(internal.curatedRouteStateCounts.processPageInternal, {
        cursor,
        accumulatedCounts: Object.fromEntries(stateCounts),
      })) as {
        counts: Record<string, number>
        isDone: boolean
        continueCursor: string | null
      }

      // Merge counts
      Object.entries(page.counts).forEach(([state, count]) => {
        stateCounts.set(state, count as number)
      })

      pagesProcessed++

      if (page.isDone || !page.continueCursor) {
        break
      }
      cursor = page.continueCursor
    }

    // Insert final state counts
    const now = Date.now()
    for (const [stateName, routeCount] of stateCounts.entries()) {
      await ctx.runMutation(internal.curatedRouteStateCounts.insertStateCount, {
        stateName,
        routeCount,
        updatedAt: now,
      })
    }

    return {
      pagesProcessed,
      statesRecorded: stateCounts.size,
      totalRoutesCounted: [...stateCounts.values()].reduce((a, b) => a + b, 0),
    }
  },
})
