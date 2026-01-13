/**
 * Centralized server error codes and human-readable messages.
 *
 * Convention: server functions/actions throw `new Error('<CODE>')` where CODE
 * is a key of `ServerErrorCode`. Prefer one canonical code per failure mode so
 * the client can map failures deterministically.
 */
export const SERVER_ERROR_MESSAGES = {
  AUTH_REQUIRED: 'User authentication is required to perform this action.',
  SESSION_REQUIRED: 'An active session is required. Please sign in again.',
  USER_NOT_FOUND: 'User record could not be found.',
  NO_FIELDS_TO_UPDATE: 'Provide at least one field to update.',
  NOT_FOUND: 'Requested resource was not found or not accessible.',
  INVALID_INPUT: 'The provided input is invalid for this operation.',
  LLM_SKETCH_INVALID: 'The generated route sketch is invalid.',
  LLM_SKETCH_AMBIGUOUS: 'The generated route sketch is ambiguous.',
  ROUTING_COMPILE_FAILED: 'Failed to compile the route sketch with the provider.',
  CONDITIONS_LOOKUP_FAILED: 'Failed to fetch or map conditions data.',
} as const

export type ServerErrorCode = keyof typeof SERVER_ERROR_MESSAGES

export const getErrorMessage = (code: ServerErrorCode): string => {
  return SERVER_ERROR_MESSAGES[code] ?? 'An unexpected error occurred.'
}
