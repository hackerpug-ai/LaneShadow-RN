import { v } from 'convex/values'
import { internalMutation } from '../_generated/server'

export const recordAgentRun = internalMutation({
  args: {
    agent: v.string(),
    model: v.string(),
    sessionId: v.optional(v.string()),
    input: v.optional(v.string()),
    output: v.optional(v.string()),
    steps: v.number(),
    toolCalls: v.number(),
    tools: v.array(v.string()),
    durationMs: v.number(),
    inputTokens: v.optional(v.number()),
    outputTokens: v.optional(v.number()),
    cacheReadTokens: v.optional(v.number()),
    totalCostUsd: v.optional(v.number()),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('performance', {
      processType: 'agent_run',
      ...args,
      createdAt: Date.now(),
    })
  },
})
