/**
 * Logger type definitions for LaneShadow.
 *
 * This module provides shared types for frontend logging.
 * Backend (Convex) logs via console.log - captured via MCP.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogCategory =
  // Convex functions (backend)
  | 'convex.query'
  | 'convex.mutation'
  | 'convex.action'
  // AI/Agent (backend)
  | 'agent.start'
  | 'agent.step'
  | 'agent.complete'
  | 'agent.error'
  | 'llm.request'
  | 'llm.response'
  // External APIs (backend)
  | 'api.weather'
  | 'api.routing'
  | 'api.places'
  // Frontend
  | 'ui.action'
  | 'ui.navigation'
  | 'ui.error'
  | 'ui.lifecycle'
  // System
  | 'system.startup'
  | 'system.auth'
  | 'system.error'

/**
 * Log entry structure written to JSONL files.
 * Backend logs use the same structure via console.log.
 */
export interface LogEntry {
  timestamp: string // ISO 8601 UTC
  level: LogLevel
  platform: 'frontend' | 'backend'
  environment: string
  sessionId?: string
  userId?: string
  requestId?: string
  function?: string
  category: LogCategory
  message: string
  data?: Record<string, unknown>
  error?: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  duration?: number
}

/**
 * Helper to create a structured log entry for console.log on Convex.
 * Usage in Convex: console.log(createBackendLogEntry('info', 'convex.action', 'planRide started', { requestId }))
 */
export function createBackendLogEntry(
  level: LogLevel,
  category: LogCategory,
  message: string,
  data?: Record<string, unknown>,
  error?: Error
): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    platform: 'backend',
    environment: process.env.NODE_ENV || 'unknown',
    category,
    message,
    data,
    ...(error && {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    }),
  }

  return JSON.stringify(entry)
}
