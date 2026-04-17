/**
 * Logger configuration for LaneShadow.
 *
 * Environment-aware logging setup.
 */

import type { LogLevel } from './types'

interface LoggerConfig {
  enabled: boolean
  level: LogLevel
  includeConsole: boolean
}

const getLogLevel = (): LogLevel => {
  const level = process.env.LOG_LEVEL?.toLowerCase()
  if (level === 'debug' || level === 'info' || level === 'warn' || level === 'error') {
    return level
  }
  return 'info' // Default
}

export const config: LoggerConfig = {
  enabled: process.env.LOG_ENABLED === 'true' || process.env.NODE_ENV !== 'production',
  level: getLogLevel(),
  includeConsole: process.env.LOG_INCLUDE_CONSOLE !== 'false',
}

export const shouldLog = (level: LogLevel): boolean => {
  if (!config.enabled) return false
  const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
  return levels.indexOf(level) >= levels.indexOf(config.level)
}
