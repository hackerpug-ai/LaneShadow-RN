/**
 * Convex (backend) logging helper.
 *
 * Uses console.log with [LOG] prefix for structured logging - captured via MCP.
 * Import and use in Convex actions, mutations, queries.
 */

import type { LogCategory, LogLevel } from '../../../lib/logger/types'

/**
 * Log a structured message from Convex backend.
 * Logs are JSON-formatted with [LOG] prefix for easy filtering.
 */
export function logBackend(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, unknown>,
  error?: Error,
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    platform: 'backend',
    environment: process.env.NODE_ENV || 'unknown',
    category,
    message,
    ...(data && { data }),
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }),
  }

  // Log with [LOG] prefix for easy filtering - MCP can parse this
  console.info(`[LOG]${JSON.stringify(entry)}`)
}

/**
 * Convenience methods for common log levels.
 */
export const backend = {
  debug: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    logBackend('debug', category, message, data),
  info: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    logBackend('info', category, message, data),
  warn: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
    logBackend('warn', category, message, data),
  error: (category: LogCategory, message: string, error: Error, data?: Record<string, unknown>) =>
    logBackend('error', category, message, data, error),
}
