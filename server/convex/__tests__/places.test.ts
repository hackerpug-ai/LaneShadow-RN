/**
 * Tests for places action - IDLE-S06-CVX-T01
 *
 * These tests exercise the Mapbox reverse-geocode behavior.
 */

import { ConvexError } from 'convex/values'
import { describe, expect, it, vi } from 'vitest'

// Mock fetch globally for testing
const mockFetch = vi.fn()
global.fetch = mockFetch as any

// We'll import the action after implementation
// For now, we'll write the test that should fail

describe('places.getReverseGeocode - AC-1: Reverse-geocode happy path returns city/state/label', () => {
  it('getReverseGeocode happy path - returns {city, state, label} for Santa Cruz coordinates', async () => {
    // GIVEN: a valid MAPBOX_ACCESS_TOKEN and Santa Cruz coordinates
    const lat = 36.97
    const lng = -122.03

    // Mock successful Mapbox API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            place_name: 'Santa Cruz, CA, USA',
            context: [
              { id: 'place.123', text: 'Santa Cruz' },
              { id: 'region.456', text: 'California', short_code: 'CA' },
            ],
          },
        ],
      }),
    })

    // WHEN: getReverseGeocode is called
    // This import will fail initially (RED phase)
    const { getReverseGeocode } = await import('../actions/places.js')

    const result = await getReverseGeocode(null, { lat, lng })

    // THEN: returns {city, state, label} with label containing city + state
    expect(result).toEqual({
      city: 'Santa Cruz',
      state: 'CA',
      label: expect.stringContaining('Santa Cruz'),
    })
    expect(result.label).toContain('CA')

    // VERIFY: fetch was called with correct parameters
    expect(mockFetch).toHaveBeenCalledTimes(1)
    const fetchUrl = mockFetch.mock.calls[0][0] as string
    expect(fetchUrl).toContain('mapbox.com')
    expect(fetchUrl).toContain('36.97')
    expect(fetchUrl).toContain('-122.03')

    // CRITICAL: verify token is never leaked in response
    expect(JSON.stringify(result)).not.toContain('pk.')
    expect(JSON.stringify(result)).not.toContain('sk.')
    expect(result.city).not.toContain('.')
    expect(result.state).not.toContain('.')
    expect(result.label).not.toContain('access_token')
  })
})

describe('places.getReverseGeocode - AC-2: Reverse-geocode propagates typed ConvexError on upstream HTTP failure', () => {
  it('getReverseGeocode upstream HTTP error - throws GEOCODE_UPSTREAM_ERROR without leaking token', async () => {
    // GIVEN: Mapbox API returns HTTP 500
    const lat = 36.97
    const lng = -122.03

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    })

    // WHEN: getReverseGeocode is called
    const { getReverseGeocode } = await import('../actions/places.js')

    // THEN: throws ConvexError(GEOCODE_UPSTREAM_ERROR)
    await expect(getReverseGeocode(null, { lat, lng })).rejects.toThrow(ConvexError)

    try {
      await getReverseGeocode(null, { lat, lng })
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      // Verify the error code is GEOCODE_UPSTREAM_ERROR
      const errorData = (error as ConvexError).data
      expect(errorData).toHaveProperty('code', 'GEOCODE_UPSTREAM_ERROR')

      // CRITICAL: message must NOT contain the token
      const errorMessage = (error as Error).message.toLowerCase()
      expect(errorMessage).not.toContain('pk.')
      expect(errorMessage).not.toContain('sk.')
    }
  })
})

describe('places.getReverseGeocode - AC-3: Reverse-geocode rejects coordinates outside valid range', () => {
  it('getReverseGeocode invalid coords - throws GEOCODE_INVALID_COORDS for lat=999,lng=999 with no HTTP fetch', async () => {
    // GIVEN: coordinates outside WGS84 valid range
    const lat = 999
    const lng = 999

    // Reset fetch mock to ensure no calls are made
    mockFetch.mockClear()

    // WHEN: getReverseGeocode is called
    const { getReverseGeocode } = await import('../actions/places.js')

    // THEN: throws ConvexError(GEOCODE_INVALID_COORDS) BEFORE any HTTP call
    await expect(getReverseGeocode(null, { lat, lng })).rejects.toThrow(ConvexError)

    try {
      await getReverseGeocode(null, { lat, lng })
    } catch (error) {
      expect(error).toBeInstanceOf(ConvexError)
      const errorData = (error as ConvexError).data
      expect(errorData).toHaveProperty('code', 'GEOCODE_INVALID_COORDS')
    }

    // CRITICAL: verify no HTTP call was made
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('getReverseGeocode invalid coords - rejects lat=91 (above 90)', async () => {
    const lat = 91
    const lng = 0

    mockFetch.mockClear()

    const { getReverseGeocode } = await import('../actions/places.js')

    await expect(getReverseGeocode(null, { lat, lng })).rejects.toThrow(ConvexError)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('getReverseGeocode invalid coords - rejects lat=-91 (below -90)', async () => {
    const lat = -91
    const lng = 0

    mockFetch.mockClear()

    const { getReverseGeocode } = await import('../actions/places.js')

    await expect(getReverseGeocode(null, { lat, lng })).rejects.toThrow(ConvexError)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('getReverseGeocode invalid coords - rejects lng=181 (above 180)', async () => {
    const lat = 0
    const lng = 181

    mockFetch.mockClear()

    const { getReverseGeocode } = await import('../actions/places.js')

    await expect(getReverseGeocode(null, { lat, lng })).rejects.toThrow(ConvexError)

    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('getReverseGeocode invalid coords - rejects lng=-181 (below -180)', async () => {
    const lat = 0
    const lng = -181

    mockFetch.mockClear()

    const { getReverseGeocode } = await import('../actions/places.js')

    await expect(getReverseGeocode(null, { lat, lng })).rejects.toThrow(ConvexError)

    expect(mockFetch).not.toHaveBeenCalled()
  })
})
