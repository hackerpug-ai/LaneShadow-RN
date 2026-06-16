import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ConvexError } from 'convex/values'
import { afterEach, describe, expect, it, vi } from 'vitest'

const mockFetch = vi.fn()
global.fetch = mockFetch as typeof fetch

describe('places contract', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('exports the documented public reverseGeocode action and returns the mobile DTO', async () => {
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

    const places = await import('../actions/places.js')

    expect(places).toHaveProperty('reverseGeocode')

    const result = await places.getReverseGeocodeHandler({}, { lat: 36.97, lng: -122.03 })

    expect(result).toEqual({
      city: 'Santa Cruz',
      state: 'CA',
      label: 'Santa Cruz, CA, USA',
    })
  })

  it('retries one transient 503 from Mapbox and then succeeds', async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
      })
      .mockResolvedValueOnce({
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

    const { getReverseGeocodeHandler } = await import('../actions/places.js')

    const result = await getReverseGeocodeHandler({}, { lat: 36.97, lng: -122.03 })

    expect(result.label).toBe('Santa Cruz, CA, USA')
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })

  it('does not retry a non-transient 400 from Mapbox', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
    })

    const { getReverseGeocodeHandler } = await import('../actions/places.js')

    await expect(getReverseGeocodeHandler({}, { lat: 36.97, lng: -122.03 })).rejects.toThrow(
      ConvexError,
    )

    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('keeps the reverse geocode public endpoint aligned with the native clients', () => {
    const iosSource = readFileSync(
      resolve(__dirname, '../../../ios/LaneShadow/Services/ConvexClient+LaneShadow.swift'),
      'utf8',
    )
    const androidSource = readFileSync(
      resolve(
        __dirname,
        '../../../android/app/src/main/java/com/laneshadow/services/ConvexClientProvider.kt',
      ),
      'utf8',
    )

    expect(iosSource).toContain('case reverseGeocode = "actions/places:reverseGeocode"')
    expect(androidSource).toContain('name = "actions/places:reverseGeocode"')
  })
})
