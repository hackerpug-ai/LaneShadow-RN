/**
 * Centralized server error codes and human-readable messages.
 * Add new codes here and reuse them across Convex functions/actions.
 */

export const SERVER_ERROR_MESSAGES = {
  AUTH_REQUIRED: 'User authentication is required to perform this action.',
  SESSION_REQUIRED: 'An active session is required. Please sign in again.',
  USER_NOT_FOUND: 'User record could not be found.',
  NO_FIELDS_TO_UPDATE: 'Provide at least one field to update.',
} as const

export type ServerErrorCode = keyof typeof SERVER_ERROR_MESSAGES

export const getErrorMessage = (code: ServerErrorCode): string => {
  return SERVER_ERROR_MESSAGES[code] ?? 'An unexpected error occurred.'
}
