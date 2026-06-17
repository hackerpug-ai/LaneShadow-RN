import { ConvexError } from 'convex/values'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ERROR_CODES } from '../errors'

vi.mock('../_generated/server', () => ({
  action: (config: { handler: unknown }) => config,
}))

const mockFetch = vi.fn()
global.fetch = mockFetch as typeof fetch

const MAPBOX_TEST_TOKEN = 'pk.test.mapbox-token'

const loadPlacesModule = async () => {
  vi.resetModules()
  process.env.MAPBOX_ACCESS_TOKEN = MAPBOX_TEST_TOKEN
  return await import('../actions/places.js')
}

describe('places autocomplete contract', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
  })

  it('returns exactly three place suggestions when Mapbox returns five suggestions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [
          {
            mapbox_id: 'mbx.1',
            name: 'Big Sur Bakery',
            full_address: 'Big Sur, CA, USA',
            place_formatted: 'Big Sur, CA',
            feature_type: 'poi',
            distance: 120,
          },
          {
            mapbox_id: 'mbx.2',
            name: 'Big Sur River Inn',
            full_address: 'Big Sur, CA, USA',
            place_formatted: 'Big Sur, CA',
            feature_type: 'poi',
            distance: 140,
          },
          {
            mapbox_id: 'mbx.3',
            name: 'Big Sur Station',
            full_address: 'Big Sur, CA, USA',
            place_formatted: 'Big Sur, CA',
            feature_type: 'poi',
            distance: 160,
          },
          {
            mapbox_id: 'mbx.4',
            name: 'Big Sur Campground',
            full_address: 'Big Sur, CA, USA',
            place_formatted: 'Big Sur, CA',
            feature_type: 'poi',
            distance: 180,
          },
          {
            mapbox_id: 'mbx.5',
            name: 'Big Sur Lodge',
            full_address: 'Big Sur, CA, USA',
            place_formatted: 'Big Sur, CA',
            feature_type: 'poi',
            distance: 200,
          },
        ],
      }),
    })

    const { getSuggestPlacesHandler } = await loadPlacesModule()

    const result = await getSuggestPlacesHandler(
      {},
      { query: 'Big Sur', sessionToken: 'session-1' },
    )

    expect(result).toEqual([
      {
        id: 'mbx.1',
        name: 'Big Sur Bakery',
        label: 'Big Sur, CA, USA',
        secondaryText: 'Big Sur, CA',
        featureType: 'poi',
        distanceMeters: 120,
      },
      {
        id: 'mbx.2',
        name: 'Big Sur River Inn',
        label: 'Big Sur, CA, USA',
        secondaryText: 'Big Sur, CA',
        featureType: 'poi',
        distanceMeters: 140,
      },
      {
        id: 'mbx.3',
        name: 'Big Sur Station',
        label: 'Big Sur, CA, USA',
        secondaryText: 'Big Sur, CA',
        featureType: 'poi',
        distanceMeters: 160,
      },
    ])
  })

  it('returns an empty list and skips fetch for trimmed one-character queries', async () => {
    const { getSuggestPlacesHandler } = await loadPlacesModule()

    const result = await getSuggestPlacesHandler({}, { query: ' B ', sessionToken: 'session-2' })

    expect(result).toEqual([])
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('forwards query, session token, limit, country, language, and proximity to Mapbox suggest', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ suggestions: [] }),
    })

    const { getSuggestPlacesHandler } = await loadPlacesModule()

    await getSuggestPlacesHandler(
      {},
      {
        query: '  Santa   Cruz  ',
        proximity: { lat: 36.97, lng: -122.03 },
        sessionToken: 'session-3',
      },
    )

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [requestUrl] = mockFetch.mock.calls[0] as [string, RequestInit | undefined]
    const url = new URL(requestUrl)

    expect(url.searchParams.get('q')).toBe('Santa Cruz')
    expect(url.searchParams.get('session_token')).toBe('session-3')
    expect(url.searchParams.get('limit')).toBe('3')
    expect(url.searchParams.get('country')).toBe('US')
    expect(url.searchParams.get('language')).toBe('en')
    expect(url.searchParams.get('proximity')).toBe('-122.03,36.97')
    expect(url.searchParams.get('access_token')).toBe(MAPBOX_TEST_TOKEN)
  })

  it('returns selected place coordinates using Mapbox coordinate order [lng, lat]', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        features: [
          {
            properties: {
              mapbox_id: 'mbx.selected',
              name: 'Santa Cruz Beach Boardwalk',
              full_address: '400 Beach St, Santa Cruz, CA 95060, USA',
              feature_type: 'poi',
            },
            geometry: {
              coordinates: [-122.0186, 36.9644],
            },
          },
        ],
      }),
    })

    const { getRetrievePlaceHandler } = await loadPlacesModule()

    const result = await getRetrievePlaceHandler(
      {},
      { mapboxId: 'mbx.selected', sessionToken: 'session-4' },
    )

    expect(result).toEqual({
      id: 'mbx.selected',
      name: 'Santa Cruz Beach Boardwalk',
      label: '400 Beach St, Santa Cruz, CA 95060, USA',
      lat: 36.9644,
      lng: -122.0186,
      featureType: 'poi',
    })

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const [requestUrl] = mockFetch.mock.calls[0] as [string, RequestInit | undefined]
    const url = new URL(requestUrl)
    expect(url.searchParams.get('session_token')).toBe('session-4')
  })

  it('throws typed Convex errors without leaking tokens on suggest and retrieve failures', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: `MAPBOX_ACCESS_TOKEN ${MAPBOX_TEST_TOKEN}`,
    })

    const { getSuggestPlacesHandler, getRetrievePlaceHandler } = await loadPlacesModule()

    const suggestError = await getSuggestPlacesHandler(
      {},
      { query: 'Big Sur', sessionToken: 'session-5' },
    ).catch((error) => error)

    expect(suggestError).toMatchObject({
      data: {
        code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      },
    })
    expect(suggestError).toBeInstanceOf(ConvexError)
    expect(String(suggestError)).not.toContain(MAPBOX_TEST_TOKEN)
    expect(String(suggestError)).not.toContain('MAPBOX_ACCESS_TOKEN')

    mockFetch.mockReset()
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: `MAPBOX_ACCESS_TOKEN ${MAPBOX_TEST_TOKEN}`,
    })

    const retrieveError = await getRetrievePlaceHandler(
      {},
      { mapboxId: 'mbx.selected', sessionToken: 'session-5' },
    ).catch((error) => error)

    expect(retrieveError).toMatchObject({
      data: {
        code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
      },
    })
    expect(retrieveError).toBeInstanceOf(ConvexError)
    expect(String(retrieveError)).not.toContain(MAPBOX_TEST_TOKEN)
    expect(String(retrieveError)).not.toContain('MAPBOX_ACCESS_TOKEN')
  })

  it('throws typed Convex errors for malformed Search Box payloads', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        suggestions: [{ mapbox_id: 'mbx.malformed' }],
      }),
    })

    const { getSuggestPlacesHandler } = await loadPlacesModule()

    const error = await getSuggestPlacesHandler(
      {},
      { query: 'Big Sur', sessionToken: 'session-6' },
    ).catch((caughtError) => caughtError)

    expect(error).toMatchObject({
      data: {
        code: ERROR_CODES.GEOCODE_UPSTREAM_ERROR,
        message: 'Mapbox Search Box suggest returned malformed data',
      },
    })
    expect(error).toBeInstanceOf(ConvexError)
    expect(String(error)).not.toContain(MAPBOX_TEST_TOKEN)
  })
})
