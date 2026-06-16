'use node'

/**
 * Minimal tracing utilities for LangSmith observability.
 *
 * This is a simplified implementation for testing purposes.
 * In production, this would integrate with LangSmith tracing.
 */

export type TraceConfig = {
  name: string
  runType: 'tool' | 'agent' | 'llm' | 'chain'
  tags?: string[]
}

/**
 * Wrap an async tool function with tracing metadata.
 */
export const traceableToolAsync = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: TraceConfig,
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    // In production, this would create a LangSmith span
    // For testing, we just call the function directly
    return fn(...args)
  }
}

/**
 * Wrap a sync tool function with tracing metadata.
 */
export const traceableToolSync = <T extends any[], R>(
  fn: (...args: T) => R,
  config: TraceConfig,
): ((...args: T) => Promise<R>) => {
  return async (...args: T): Promise<R> => {
    // In production, this would create a LangSmith span
    // For testing, we wrap sync function in Promise
    return Promise.resolve(fn(...args))
  }
}
