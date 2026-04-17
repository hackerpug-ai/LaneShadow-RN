/**
 * Error codes for Protomaps-related errors
 */
export type ProtomapsErrorCode =
  | "R2_AUTH_FAILED"
  | "PMTILES_NOT_FOUND"
  | "NETWORK_ERROR"
  | "DECODE_ERROR"
  | "INVALID_URL";

/**
 * Custom error class for Protomaps-related errors
 */
export class ProtomapsError extends Error {
  readonly name = "ProtomapsError";
  readonly code: ProtomapsErrorCode;
  readonly originalError?: unknown;

  constructor(message: string, code: ProtomapsErrorCode, originalError?: unknown) {
    super(message);
    this.code = code;
    this.originalError = originalError;
  }
}

/**
 * Type guard to check if an error is a ProtomapsError instance
 */
export function isProtomapsError(error: unknown): error is ProtomapsError {
  return error instanceof ProtomapsError;
}

/**
 * Check if a ProtomapsError is retryable (only NETWORK_ERROR is retryable)
 */
export function isRetryableProtomapsError(error: unknown): boolean {
  return isProtomapsError(error) && error.code === "NETWORK_ERROR";
}
