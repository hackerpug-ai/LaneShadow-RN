import { describe, it, expect } from 'vitest'
import { getServerErrorCode, getUserFacingError } from './convex-error'

describe('convex-error helpers', () => {
  it('extracts server error code from Error.message', () => {
    const code = getServerErrorCode(new Error('AUTH_REQUIRED'))
    expect(code).toBe('AUTH_REQUIRED')
  })

  it('returns null for unknown errors', () => {
    const code = getServerErrorCode(new Error('something else'))
    expect(code).toBeNull()
  })

  it('maps server error to user-facing message', () => {
    const result = getUserFacingError(new Error('SESSION_REQUIRED'))
    expect(result.code).toBe('SESSION_REQUIRED')
    expect(result.message.length).toBeGreaterThan(0)
  })

  it('falls back to error message for non-server errors', () => {
    const result = getUserFacingError(new Error('network failed'))
    expect(result.code).toBeNull()
    expect(result.message).toBe('network failed')
  })
})
