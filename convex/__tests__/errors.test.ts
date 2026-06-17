import { describe, expect, it } from 'vitest'
import { ERROR_CODES } from '../errors'

describe('ERROR_CODES', () => {
  it('AC-1: exposes UNAUTHENTICATED and FORBIDDEN entries', () => {
    expect(ERROR_CODES.UNAUTHENTICATED).toBe('UNAUTHENTICATED')
    expect(ERROR_CODES.FORBIDDEN).toBe('FORBIDDEN')
  })
})
