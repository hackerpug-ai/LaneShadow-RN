import { v } from 'convex/values'
import { internalQuery } from './_generated/server'

// ---------------------------------------------------------------------------
// Handler functions for unit testing
// ---------------------------------------------------------------------------

export const curationMetricsInternalHandler = async (ctx: any) => {
  // Full-table scan — acceptable at launch volume (<5k routes)
  const routes = await ctx.db.query('curated_routes').collect()
  const enrichments = await ctx.db.query('curated_route_enrichments').collect()
  const feedback = await ctx.db.query('route_feedback').collect()

  // bySource breakdown
  const bySource: Record<string, number> = {}
  for (const route of routes) {
    bySource[route.source] = (bySource[route.source] ?? 0) + 1
  }

  // lastScrape = max extractedAt
  const lastScrape = routes.length > 0 ? Math.max(...routes.map((r: any) => r.extractedAt)) : null

  // LLM cost estimate: qwen-3-235b-a22b-instruct-2507 ~$0.60/1M input + $1.20/1M output
  // Average: ~200 input tokens + ~300 output tokens per route
  // ~= (200/1M)*0.60 + (300/1M)*1.20 = $0.000120 + $0.000360 = ~$0.00048 per route extraction
  const llmCost = routes.length * 0.00048

  // Feedback summary by action type
  const feedbackSummary: Record<string, number> = {}
  for (const fb of feedback) {
    feedbackSummary[fb.action] = (feedbackSummary[fb.action] ?? 0) + 1
  }

  return {
    totalRoutes: routes.length,
    totalEnrichments: enrichments.length,
    bySource,
    lastScrape,
    llmCost: Math.round(llmCost * 100) / 100,
    feedbackSummary,
  }
}

// ---------------------------------------------------------------------------
// Internal query for Convex backend
// ---------------------------------------------------------------------------

export const curationMetricsInternal = internalQuery({
  args: {},
  returns: v.object({
    totalRoutes: v.number(),
    totalEnrichments: v.number(),
    bySource: v.record(v.string(), v.number()),
    lastScrape: v.union(v.number(), v.null()),
    llmCost: v.number(),
    feedbackSummary: v.record(v.string(), v.number()),
  }),
  handler: curationMetricsInternalHandler,
})
