import { describe, expect, it } from 'vitest'
import {
  isProtomapsError,
  isRetryableProtomapsError,
  ProtomapsError,
  type ProtomapsErrorCode,
} from '../protomaps'

describe('ProtomapsError', () => {
  describe('AC-1: ProtomapsError class structure', () => {
    it('should create error with message and code', () => {
      const error = new ProtomapsError('Test error', 'R2_AUTH_FAILED')

      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('ProtomapsError')
      expect(error.message).toBe('Test error')
      expect(error.code).toBe('R2_AUTH_FAILED')
    })

    it('should create error with optional originalError', () => {
      const originalError = new Error('Original error')
      const error = new ProtomapsError('Test error', 'PMTILES_NOT_FOUND', originalError)

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('PMTILES_NOT_FOUND')
      expect(error.originalError).toBe(originalError)
    })

    it('should handle all error codes', () => {
      const codes: ProtomapsErrorCode[] = [
        'R2_AUTH_FAILED',
        'PMTILES_NOT_FOUND',
        'NETWORK_ERROR',
        'DECODE_ERROR',
        'INVALID_URL',
      ]

      codes.forEach((code) => {
        const error = new ProtomapsError(`Test ${code}`, code)
        expect(error.code).toBe(code)
      })
    })
  })

  describe('AC-2: isProtomapsError type guard', () => {
    it('should return true for ProtomapsError instances', () => {
      const error = new ProtomapsError('Test error', 'R2_AUTH_FAILED')
      expect(isProtomapsError(error)).toBe(true)
    })

    it('should return false for regular Error instances', () => {
      const error = new Error('Regular error')
      expect(isProtomapsError(error)).toBe(false)
    })

    it('should return false for non-error values', () => {
      expect(isProtomapsError(null)).toBe(false)
      expect(isProtomapsError(undefined)).toBe(false)
      expect(isProtomapsError('string')).toBe(false)
      expect(isProtomapsError(123)).toBe(false)
      expect(isProtomapsError({})).toBe(false)
    })

    it('should narrow type correctly', () => {
      const error: unknown = new ProtomapsError('Test', 'NETWORK_ERROR')

      if (isProtomapsError(error)) {
        // Type should be narrowed to ProtomapsError
        expect(error.code).toBe('NETWORK_ERROR')
        expect(error.name).toBe('ProtomapsError')
      } else {
        // Should never reach here
        expect(true).toBe(false)
      }
    })
  })

  describe('AC-3: isRetryableProtomapsError', () => {
    it('should return true for NETWORK_ERROR', () => {
      const error = new ProtomapsError('Network issue', 'NETWORK_ERROR')
      expect(isRetryableProtomapsError(error)).toBe(true)
    })

    it('should return false for non-retryable error codes', () => {
      const nonRetryableCodes: ProtomapsErrorCode[] = [
        'R2_AUTH_FAILED',
        'PMTILES_NOT_FOUND',
        'DECODE_ERROR',
        'INVALID_URL',
      ]

      nonRetryableCodes.forEach((code) => {
        const error = new ProtomapsError(`Test ${code}`, code)
        expect(isRetryableProtomapsError(error)).toBe(false)
      })
    })

    it('should return false for non-ProtomapsError instances', () => {
      const error = new Error('Regular error')
      expect(isRetryableProtomapsError(error)).toBe(false)
    })

    it('should return false for null and undefined', () => {
      expect(isRetryableProtomapsError(null)).toBe(false)
      expect(isRetryableProtomapsError(undefined)).toBe(false)
    })
  })
})
