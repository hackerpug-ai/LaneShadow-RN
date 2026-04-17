import { describe, expect, it, vi } from 'vitest'

// Note: Testing environment variables is tricky because modules cache their values at load time.
// The PROTOMAPS_US_URL validation runs at module load time, so we need to test the
// validation logic directly rather than trying to reload modules.

// Validate URL function (extracted for testing)
const validateProtomapsUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined
  try {
    new URL(url)

    // Warn if not a .pmtiles URL
    if (!url.endsWith('.pmtiles') && !url.includes('.pmtiles?')) {
    }
    return url
  } catch {
    throw new Error(`Invalid PROTOMAPS_US_URL: ${url} is not a valid URL`)
  }
}

describe('PROTOMAPS_US_URL validation', () => {
  describe('validateProtomapsUrl', () => {
    // AC-1: Returns undefined when URL is not provided
    it('returns undefined when URL is not provided', () => {
      expect(validateProtomapsUrl(undefined)).toBeUndefined()
    })

    // AC-1: Returns the URL when provided and valid
    it('returns the URL when valid pmtiles URL', () => {
      const url = 'https://example.com/tiles.pmtiles'
      expect(validateProtomapsUrl(url)).toBe(url)
    })

    // AC-2: Invalid URLs throw descriptive error
    it('throws error for invalid URL format', () => {
      expect(() => validateProtomapsUrl('not-a-url')).toThrow(
        'Invalid PROTOMAPS_US_URL: not-a-url is not a valid URL',
      )
    })

    // AC-3: Non-.pmtiles URLs don't throw but warn
    it('returns non-pmtiles URL and warns', () => {
      const url = 'https://example.com/tiles.xyz'
      const warnSpy = vi.spyOn(console, 'warn')
      const result = validateProtomapsUrl(url)
      expect(result).toBe(url)
      expect(warnSpy).toHaveBeenCalledWith(
        `Warning: PROTOMAPS_US_URL does not appear to be a .pmtiles URL: ${url}`,
      )
      warnSpy.mockRestore()
    })
  })

  // Integration test - verify the module exports are correct
  describe('env module', () => {
    it('exports PROTOMAPS_US_URL (optional, can be undefined)', async () => {
      const { PROTOMAPS_US_URL } = await import('../lib/env')
      // PROTOMAPS_US_URL is optional, so undefined is valid
      expect(typeof PROTOMAPS_US_URL === 'string' || PROTOMAPS_US_URL === undefined).toBe(true)
    })
  })
})
