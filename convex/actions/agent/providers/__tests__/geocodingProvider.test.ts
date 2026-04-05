import { vi, describe, it, expect, afterEach, type Mock } from 'vitest'

// Mock the env module before importing the provider.
// This prevents requireEnv() from throwing on missing Clerk secrets,
// and sets a known value for GOOGLE_MAPS_API_KEY.
vi.mock('../../../../../lib/env', () => ({ GOOGLE_MAPS_API_KEY: 'test-geocode-key' }))

import { createGeocodingProvider } from '../geocodingProvider'

const makeSampleResults = (count = 2) =>
  Array.from({ length: count }, (_, i) => ({
    formatted_address: `Address ${i + 1}`,
    place_id: `place_${i + 1}`,
    types: ['locality'],
    geometry: {
      location: { lat: 37.0 + i * 0.1, lng: -122.0 - i * 0.1 },
    },
  }))

const makeOkFetch = (results: any[], status = 'OK'): Mock =>
  vi.fn(async () => ({
    ok: true,
    json: async () => ({ status, results }),
  }))

describe('geocoding provider', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('happy path: maps Google results to GeocodeResult[]', async () => {
    const fetchMock = makeOkFetch(makeSampleResults(2))
    ;(global.fetch as Mock) = fetchMock

    const provider = createGeocodingProvider()
    const results = await provider.geocode('Santa Cruz')

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(results).toHaveLength(2)
    expect(results[0]).toMatchObject({
      lat: 37.0,
      lng: -122.0,
      label: 'Address 1',
      placeId: 'place_1',
      types: ['locality'],
    })
    expect(results[1]).toMatchObject({
      lat: 37.1,
      lng: -122.1,
      label: 'Address 2',
      placeId: 'place_2',
      types: ['locality'],
    })
  })

  it('returns [] when status is ZERO_RESULTS', async () => {
    ;(global.fetch as Mock) = makeOkFetch([], 'ZERO_RESULTS')

    const provider = createGeocodingProvider()
    const results = await provider.geocode('Nowhere Land')

    expect(results).toEqual([])
  })

  it('includes location and radius params when bias is provided', async () => {
    const fetchMock = makeOkFetch(makeSampleResults(1))
    ;(global.fetch as Mock) = fetchMock

    const provider = createGeocodingProvider()
    await provider.geocode('coffee shop', { lat: 37.77, lng: -122.42 })

    const [calledUrl] = fetchMock.mock.calls[0]
    const urlStr = String(calledUrl)
    expect(urlStr).toContain('location=37.77%2C-122.42')
    expect(urlStr).toContain('radius=50000')
  })

  it('omits location and radius params when no bias is provided', async () => {
    const fetchMock = makeOkFetch(makeSampleResults(1))
    ;(global.fetch as Mock) = fetchMock

    const provider = createGeocodingProvider()
    await provider.geocode('Santa Cruz')

    const [calledUrl] = fetchMock.mock.calls[0]
    const urlStr = String(calledUrl)
    expect(urlStr).not.toContain('location=')
    expect(urlStr).not.toContain('radius=')
  })

  it('URL-encodes the query string', async () => {
    const fetchMock = makeOkFetch(makeSampleResults(1))
    ;(global.fetch as Mock) = fetchMock

    const provider = createGeocodingProvider()
    await provider.geocode('San Francisco, CA')

    const [calledUrl] = fetchMock.mock.calls[0]
    const urlStr = String(calledUrl)
    // encodeURIComponent('San Francisco, CA') = 'San%20Francisco%2C%20CA'
    expect(urlStr).toContain('San%20Francisco%2C%20CA')
  })

  it('returns [] on network error (does not throw)', async () => {
    ;(global.fetch as Mock) = vi.fn().mockRejectedValueOnce(new Error('Network failure'))

    const provider = createGeocodingProvider()
    const results = await provider.geocode('Santa Cruz')

    expect(results).toEqual([])
  })

  it('returns [] on timeout (does not throw)', async () => {
    ;(global.fetch as Mock) = vi.fn().mockRejectedValueOnce(new Error('TIMEOUT:geocode'))

    const provider = createGeocodingProvider()
    const results = await provider.geocode('Santa Cruz')

    expect(results).toEqual([])
  })

  it('throws when GOOGLE_MAPS_API_KEY is missing', () => {
    // Use the apiKeyOverride parameter to pass an empty string, simulating a
    // missing env variable. This avoids ESM mock hoisting complexity.
    expect(() => createGeocodingProvider('')).toThrow(/GOOGLE_MAPS_API_KEY/)
  })

  it('caps results at 5 when more are returned', async () => {
    ;(global.fetch as Mock) = makeOkFetch(makeSampleResults(10))

    const provider = createGeocodingProvider()
    const results = await provider.geocode('highway')

    expect(results).toHaveLength(5)
  })
})
