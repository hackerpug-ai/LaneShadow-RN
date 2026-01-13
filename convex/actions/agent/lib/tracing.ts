'use node'

import { traceable } from 'langsmith/traceable'

import { LANGSMITH_TRACING } from '../../../lib/env'

// -----------------------------------------------------------------------------
// Run Configuration (for LangGraph/LangChain invocations)
// -----------------------------------------------------------------------------

/**
 * LangGraph/LangChain invoke configuration with optional tracing metadata.
 *
 * When LANGSMITH_TRACING=true and LANGSMITH_API_KEY is set, LangChain
 * automatically traces all runs. This config adds custom metadata/tags.
 *
 * @see https://docs.langchain.com/langsmith/trace-with-langgraph
 */
export type RunConfig = {
  /** Custom run name for this invocation */
  runName?: string
  /** Tags to attach to this run (searchable in LangSmith) */
  tags?: Array<string>
  /** Metadata to attach to this run (visible in LangSmith UI) */
  metadata?: Record<string, unknown>
}

export type BuildRunConfigOptions = {
  /** Custom run name (e.g., 'planRide-{requestId}') */
  runName?: string
  /** Tags to attach to all runs */
  tags?: Array<string>
  /** Metadata to attach to all runs */
  metadata?: Record<string, unknown>
}

/**
 * Builds a run config for LangGraph/LangChain invocations.
 *
 * LangSmith auto-traces when env vars are set:
 * - LANGSMITH_TRACING=true
 * - LANGSMITH_API_KEY=<key>
 * - LANGSMITH_PROJECT=<project> (optional, defaults to 'default')
 *
 * This function adds custom metadata/tags to runs without manually creating tracers.
 * Returns undefined if tracing is disabled (no overhead).
 *
 * @see https://docs.langchain.com/langsmith/trace-with-langgraph
 *
 * @example
 * const config = buildRunConfig({
 *   runName: `planRide-${requestId}`,
 *   tags: ['planRide', 'v1'],
 *   metadata: { userId, clerkUserId }
 * })
 * await graph.invoke(state, config)
 */
export const buildRunConfig = (options?: BuildRunConfigOptions): RunConfig | undefined => {
  // Skip config entirely if tracing is disabled (no overhead)
  if (!LANGSMITH_TRACING) {
    return undefined
  }

  return {
    runName: options?.runName,
    tags: options?.tags,
    metadata: options?.metadata,
  }
}

// -----------------------------------------------------------------------------
// Cost Tracking (for non-LLM runs like tools)
// -----------------------------------------------------------------------------

/**
 * Usage metadata for cost tracking in LangSmith.
 *
 * **LLM costs are automatic** for LangChain modules (ChatOpenAI, etc.) -
 * LangSmith has built-in pricing for OpenAI, Anthropic, Gemini.
 *
 * Use this for **non-LLM runs** (tools, API calls, etc.) where you want
 * to track custom costs.
 *
 * @see https://docs.langchain.com/langsmith/cost-tracking
 */
export type UsageMetadata = {
  /** Total cost for this run (in dollars) - use for non-LLM runs */
  total_cost?: number

  // LLM-specific fields (auto-populated by LangChain for supported providers)
  /** Number of input tokens */
  input_tokens?: number
  /** Number of output tokens */
  output_tokens?: number
  /** Total tokens (input + output) */
  total_tokens?: number
  /** Cost of input tokens (in dollars) */
  input_cost?: number
  /** Cost of output tokens (in dollars) */
  output_cost?: number
  /** Breakdown of input token types */
  input_token_details?: Record<string, number>
  /** Breakdown of output token types */
  output_token_details?: Record<string, number>
  /** Breakdown of input costs by type */
  input_cost_details?: Record<string, number>
  /** Breakdown of output costs by type */
  output_cost_details?: Record<string, number>
}

/**
 * Result wrapper that includes usage metadata for cost tracking.
 *
 * When returned from a traced function, LangSmith extracts `usage_metadata`
 * and records it for cost tracking.
 *
 * @see https://docs.langchain.com/langsmith/cost-tracking
 *
 * @example
 * // For a tool/API call with custom cost
 * const result = await weatherApi.fetch(points)
 * return withUsageMetadata(result, { total_cost: 0.001 })
 */
export type WithUsageMetadata<T> = T & {
  usage_metadata: UsageMetadata
}

/**
 * Wraps a result with usage metadata for LangSmith cost tracking.
 *
 * **Note**: LLM costs are automatic for LangChain modules. Use this only
 * for non-LLM runs (tools, external API calls) where you want to track costs.
 *
 * @see https://docs.langchain.com/langsmith/cost-tracking
 *
 * @example
 * // Track cost for an external API call
 * const weatherData = await fetchWeatherApi(points)
 * return withUsageMetadata(weatherData, { total_cost: 0.0015 })
 *
 * @example
 * // Track cost for a tool call
 * const routeData = await routingProvider.compile(sketch)
 * return withUsageMetadata(routeData, { total_cost: estimatedCost })
 */
export const withUsageMetadata = <T>(result: T, usage: UsageMetadata): WithUsageMetadata<T> => {
  return {
    ...result,
    usage_metadata: usage,
  }
}

/**
 * Creates usage metadata for a tool/non-LLM run with a total cost.
 *
 * @example
 * const usage = toolCost(0.0015)
 * // Returns: { total_cost: 0.0015 }
 */
export const toolCost = (totalCost: number): UsageMetadata => ({
  total_cost: totalCost,
})

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

/**
 * Check if LangSmith tracing is enabled.
 * Useful for conditional logging or diagnostics.
 */
export const isTracingEnabled = (): boolean => {
  return LANGSMITH_TRACING
}

// -----------------------------------------------------------------------------
// traceableTool helper (wraps functions with LangSmith spans)
// -----------------------------------------------------------------------------

export type TraceableToolOptions = {
  name: string
  runType?: 'tool' | 'chain' | 'retriever'
  metadata?: Record<string, unknown>
  tags?: Array<string>
}

/**
 * Wraps an async function so it emits a LangSmith span.
 * No-op when tracing is disabled (LANGSMITH_TRACING !== true).
 *
 * @see https://docs.langchain.com/langsmith/cost-tracking
 */
export const traceableToolAsync = <TArgs extends Array<unknown>, TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  options: TraceableToolOptions
): ((...args: TArgs) => Promise<TReturn>) => {
  if (!LANGSMITH_TRACING) {
    return fn
  }

  // traceable returns TraceableFunction which extends the original function signature
  const traced = traceable(fn, {
    name: options.name,
    run_type: options.runType ?? 'tool',
    metadata: options.metadata,
    tags: options.tags,
  })

  // Cast to preserve the original function signature for callers
  return traced as unknown as (...args: TArgs) => Promise<TReturn>
}

/**
 * Wraps a sync function so it emits a LangSmith span.
 * The wrapped function becomes async. No-op when tracing is disabled.
 *
 * @see https://docs.langchain.com/langsmith/cost-tracking
 */
export const traceableToolSync = <TArgs extends Array<unknown>, TReturn>(
  fn: (...args: TArgs) => TReturn,
  options: TraceableToolOptions
): ((...args: TArgs) => Promise<TReturn>) => {
  // Wrap sync function as async
  const asyncFn = async (...args: TArgs): Promise<TReturn> => fn(...args)

  if (!LANGSMITH_TRACING) {
    return asyncFn
  }

  const traced = traceable(asyncFn, {
    name: options.name,
    run_type: options.runType ?? 'tool',
    metadata: options.metadata,
    tags: options.tags,
  })

  return traced as unknown as (...args: TArgs) => Promise<TReturn>
}
