/**
 * Frontend logger for LaneShadow.
 *
 * Uses console.log with structured JSON output.
 * Logs are captured via Metro/Expo console and can be written to .temp/logs/
 * by a development script or MCP.
 *
 * Backend logs from Convex use the same format via console.log.
 */

import { config, shouldLog } from './config'
import type { LogCategory, LogEntry, LogLevel } from './types'

let sessionId: string | null = null

const logToConsole = (entry: LogEntry): void => {
  // Also log readable format in development
  if (__DEV__ && config.includeConsole) {
    const consoleMethod =
      entry.level === 'error' ? console.error : entry.level === 'warn' ? console.warn : console.log
    consoleMethod(
      `[${entry.level.toUpperCase()}] ${entry.category}: ${entry.message}`,
      entry.data ?? '',
      entry.error ?? '',
    )
  }
}

export const initLogger = (id?: string): void => {
  sessionId = id || sessionId
}

export const createLogger = (context?: { userId?: string }) => {
  const log = (
    level: LogLevel,
    category: LogCategory,
    message: string,
    data?: Record<string, unknown>,
    error?: Error,
  ): void => {
    if (!shouldLog(level)) return

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      platform: 'frontend',
      environment: process.env.NODE_ENV || 'unknown',
      sessionId: sessionId ?? undefined,
      userId: context?.userId,
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

    logToConsole(entry)
  }

  return {
    debug: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
      log('debug', category, message, data),
    info: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
      log('info', category, message, data),
    warn: (category: LogCategory, message: string, data?: Record<string, unknown>) =>
      log('warn', category, message, data),
    error: (category: LogCategory, message: string, error: Error, data?: Record<string, unknown>) =>
      log('error', category, message, data, error),
    flush: () => {
      // No-op - logs are written immediately to console
    },
    getSessionId: (): string | null => sessionId,
  }
}

// Export singleton
export const logger = createLogger()
