import type { ServerErrorCode } from './errors'
import { getErrorMessage, SERVER_ERROR_MESSAGES } from './errors'

const SERVER_ERROR_CODES = new Set<ServerErrorCode>(
  Object.keys(SERVER_ERROR_MESSAGES) as ServerErrorCode[]
)

const UNKNOWN_MESSAGE = 'Something went wrong. Please try again.'

export const getServerErrorCode = (error: unknown): ServerErrorCode | null => {
  if (!error) return null

  // Convex and actions typically throw Error instances with the code as the message.
  if (error instanceof Error && typeof error.message === 'string') {
    const trimmed = error.message.trim()
    if (SERVER_ERROR_CODES.has(trimmed as ServerErrorCode)) {
      return trimmed as ServerErrorCode
    }
  }

  // Sometimes we may get a plain string
  if (typeof error === 'string' && SERVER_ERROR_CODES.has(error as ServerErrorCode)) {
    return error as ServerErrorCode
  }

  return null
}

export const getUserFacingError = (
  error: unknown
): {
  code: ServerErrorCode | null
  message: string
} => {
  const code = getServerErrorCode(error)
  if (code) {
    return { code, message: getErrorMessage(code) }
  }

  // Preserve useful message if present
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim().length) {
    return { code: null, message: error.message.trim() }
  }

  if (typeof error === 'string' && error.trim().length) {
    return { code: null, message: error.trim() }
  }

  return { code: null, message: UNKNOWN_MESSAGE }
}
