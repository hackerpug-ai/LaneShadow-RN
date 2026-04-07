import { vi, describe, it, expect, afterEach } from 'vitest'
import { searchAlongRoute } from '../searchAlongRoute'
import type { PlaceResult } from '../searchAlongRoute'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const SAMPLE_POLYLINE = 'u{~vFvyys@fS]'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const setupFetch = (jsonPayload: unknown, ok = true, status = 200) => {
  ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn(async () => ({
    ok,
    status,
    json: async () => jsonPayload,
  }))
}

const setupFetchError = (error: Error) => {
  ;(globalThis as unknown as { fetch: unknown }).fetch = vi.fn(async () => {
    throw error
  })
}

const assertIsArray = (result: unknown): result is PlaceResult[] => {
  return Array.isArray(result)
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('searchAlongRoute', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('basic search: returns 1-5 places with name and address for valid polyline and query', async () => {
    setupFetch({
      places: [
        {
          displayName: { text: "Shell Gas Station" },
          formattedAddress: "123 Main St, Springfield",
          types: ["gas_station"],
        },
        {
          displayName: { text: "Chevron" },
          formattedAddress: "456 Elm Ave, Springfield",
          types: ["gas_station"],
        },
      ],
    })

    const result = await searchAlongRoute({
      routePolyline: SAMPLE_POLYLINE,
      query: "gas station",
    })

    expect(assertIsArray(result)).toBe(true)
    if (!assertIsArray(result)) return

    expect(result.length).toBeGreaterThanOrEqual(1)
    expect(result.length).toBeLessThanOrEqual(5)

    for (const place of result) {
      expect(typeof place.name).toBe('string')
      expect(place.name.length).toBeGreaterThan(0)
      expect(typeof place.address).toBe('string')
      expect(place.address.length).toBeGreaterThan(0)
    }

    expect(result[0].name).toBe("Shell Gas Station")
    expect(result[0].address).toBe("123 Main St, Springfield")
  })

  it('offset search: returns places biased toward origin offset with detour time when offset provided', async () => {
    setupFetch({
      places: [
        {
          displayName: { text: "Alice's Restaurant" },
          formattedAddress: "789 Oak Rd, Midpoint",
          types: ["restaurant"],
        },
      ],
      routingSummaries: [
        { legs: [{ duration: "180s", distanceMeters: 350 }] },
      ],
    })

    const result = await searchAlongRoute({
      routePolyline: SAMPLE_POLYLINE,
      query: "restaurant",
      originOffset: 2,
    })

    expect(assertIsArray(result)).toBe(true)
    if (!assertIsArray(result)) return

    expect(result.length).toBeGreaterThanOrEqual(1)

    const place = result[0]
    expect(place.name).toBe("Alice's Restaurant")
    // detourMinutes should be present when routingSummaries are provided
    expect(place.detourMinutes).toBeDefined()
    expect(typeof place.detourMinutes).toBe('number')
    expect(place.detourMinutes).toBe(3) // 180s = 3 minutes

    // Verify the fetch was called with routing parameters including origin
    const fetchMock = (globalThis as unknown as { fetch: ReturnType<typeof vi.fn> }).fetch
    const callBody = JSON.parse(fetchMock.mock.calls[0][1].body as string) as Record<string, unknown>
    expect(callBody.routingParameters).toBeDefined()
    expect((callBody.routingParameters as Record<string, unknown>).origin).toBeDefined()
  })

  it('no results: returns empty array for queries with no matching places', async () => {
    setupFetch({ places: [] })

    const result = await searchAlongRoute({
      routePolyline: SAMPLE_POLYLINE,
      query: "scuba shop",
    })

    expect(assertIsArray(result)).toBe(true)
    if (!assertIsArray(result)) return

    expect(result.length).toBe(0)
  })

  it('api error: returns error status without throwing on API failure', async () => {
    setupFetch({ error: { message: 'API Error' } }, false, 403)

    const result = await searchAlongRoute({
      routePolyline: SAMPLE_POLYLINE,
      query: "gas station",
    })

    expect(result).toEqual({ status: 'error', reason: 'places_api_error' })
  })

  it('api error: returns error status on network failure without throwing', async () => {
    setupFetchError(new Error('Network timeout'))

    const result = await searchAlongRoute({
      routePolyline: SAMPLE_POLYLINE,
      query: "gas station",
    })

    expect(result).toEqual({ status: 'error', reason: 'places_api_error' })
  })
})
