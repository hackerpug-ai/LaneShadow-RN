/**
 * Centralized error codes for Convex functions.
 * All error codes must be defined here and referenced elsewhere.
 */
export const ERROR_CODES = {
  AGENT_RESPONSE_INVALID: 'AGENT_RESPONSE_INVALID',
  NO_ROUTES_GENERATED: 'NO_ROUTES_GENERATED',
  AGENT_TIMEOUT: 'AGENT_TIMEOUT',
  INVALID_AGENT_RESPONSE_STRUCTURE: 'INVALID_AGENT_RESPONSE_STRUCTURE',
} as const

/**
 * Type alias for error code values
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
