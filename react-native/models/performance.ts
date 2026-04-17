import { v } from 'convex/values'

export const performanceValidator = v.object({
  processType: v.string(), // 'agent_run' for now, extensible later
  agent: v.string(), // 'orchestrator', 'routing', 'search', 'enrichment'
  model: v.string(), // 'claude-opus-4-6', 'claude-sonnet-4-6', etc.
  sessionId: v.optional(v.string()),
  input: v.optional(v.string()), // truncated user message or tool query
  output: v.optional(v.string()), // truncated response or result summary
  steps: v.number(), // how many ReAct steps were used
  toolCalls: v.number(), // total tool calls made
  tools: v.array(v.string()), // list of tools called (e.g. ['geocode', 'compileSketch'])
  durationMs: v.number(), // wall clock time
  inputTokens: v.optional(v.number()),
  outputTokens: v.optional(v.number()),
  cacheReadTokens: v.optional(v.number()),
  totalCostUsd: v.optional(v.number()), // from BudgetTracker
  success: v.boolean(),
  error: v.optional(v.string()),
  createdAt: v.number(),
})
