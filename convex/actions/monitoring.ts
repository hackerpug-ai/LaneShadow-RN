/**
 * Monitoring Actions
 *
 * Structured logging for Protomaps operations including failures,
 * fallbacks to Overpass, and query performance metrics.
 */

'use node'

import { v } from 'convex/values'
import { internalAction } from '../_generated/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProtomapsFailureArgs {
  operation: string
  error: string
  context: {
    hasR2Endpoint: boolean
    hasR2KeyId: boolean
    hasR2Secret: boolean
    hasR2Bucket: boolean
  }
}

interface ProtomapsFallbackArgs {
  tool: string
  reason: string
  bbox?: string
}

interface ProtomapsQueryArgs {
  operation: string
  durationMs: number
  tilesFetched: number
  resultCount: number
  bbox?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface LogEntry {
  timestamp: string
  level: 'error' | 'warn' | 'info'
  category: string
  message: string
  data: unknown
}

const logMessage = (
  level: 'error' | 'warn' | 'info',
  category: string,
  message: string,
  data: unknown
): void => {
  const logEntry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    category,
    message,
    data,
  }

  const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.info
  consoleFn('[LOG]', JSON.stringify(logEntry))
}

// ---------------------------------------------------------------------------
// Handlers (exported for testing)
// ---------------------------------------------------------------------------

/**
 * Testable handler for recordProtomapsFailure.
 * @internal Exported for testing only
 */
export const recordProtomapsFailureHandler = async (
  _ctx: any,
  args: ProtomapsFailureArgs
): Promise<void> => {
  logMessage('error', 'protomaps.error', `Protomaps failure: ${args.operation}`, args)
}

/**
 * Testable handler for recordProtomapsFallback.
 * @internal Exported for testing only
 */
export const recordProtomapsFallbackHandler = async (
  _ctx: any,
  args: ProtomapsFallbackArgs
): Promise<void> => {
  logMessage('warn', 'protomaps.fallback', `Protomaps fallback: ${args.tool}`, args)
}

/**
 * Testable handler for recordProtomapsQuery.
 * @internal Exported for testing only
 */
export const recordProtomapsQueryHandler = async (
  _ctx: any,
  args: ProtomapsQueryArgs
): Promise<void> => {
  logMessage('info', 'protomaps.query', `Protomaps query: ${args.operation}`, args)
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

/**
 * Record Protomaps operation failures
 *
 * Logs R2/presigned URL failures with configuration context for debugging.
 */
export const recordProtomapsFailure = internalAction({
  args: {
    operation: v.string(),
    error: v.string(),
    context: v.object({
      hasR2Endpoint: v.boolean(),
      hasR2KeyId: v.boolean(),
      hasR2Secret: v.boolean(),
      hasR2Bucket: v.boolean(),
    }),
  },
  handler: recordProtomapsFailureHandler,
})

/**
 * Record Protomaps fallback to Overpass
 *
 * Logs when tools fall back to Overpass API due to Protomaps unavailability.
 */
export const recordProtomapsFallback = internalAction({
  args: {
    tool: v.string(),
    reason: v.string(),
    bbox: v.optional(v.string()),
  },
  handler: recordProtomapsFallbackHandler,
})

/**
 * Record Protomaps query performance metrics
 *
 * Logs query performance for monitoring and optimization.
 */
export const recordProtomapsQuery = internalAction({
  args: {
    operation: v.string(),
    durationMs: v.number(),
    tilesFetched: v.number(),
    resultCount: v.number(),
    bbox: v.optional(v.string()),
  },
  handler: recordProtomapsQueryHandler,
})
