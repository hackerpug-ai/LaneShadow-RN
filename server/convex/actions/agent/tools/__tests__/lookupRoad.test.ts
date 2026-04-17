import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { recordProtomapsFallbackHandler } from '../../../monitoring'
import type { LookupRoadResult, RoadMatch } from '../lookupRoad'
import { lookupRoad } from '../lookupRoad'

// Mock the monitoring module before importing
vi.mock('../../../monitoring', () => ({
  recordProtomapsFallbackHandler: vi.fn(),
  recordProtomapsFailureHandler: vi.fn(),
  recordProtomapsQueryHandler: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type OverpassWay = {
  type: string
  id: number
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

const makeWay = (
  id: number,
  tags: Record<string, string>,
  geometry: { lat: number; lon: number }[] = [
    { lat: 37.5, lon: -119.5 },
    { lat: 37.6, lon: -119.4 },
  ],
): OverpassWay => ({
  type: 'way',
  id,
  tags,
  geometry,
})

const makeOverpassResponse = (elements: OverpassWay[]) => ({
  ok: true,
  status: 200,
  json: async () => ({ elements }),
  text: async () => JSON.stringify({ elements }),
})

const setupFetch = (response: ReturnType<typeof makeOverpassResponse>) => {
  ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => response)
}

const setupFetchTimeout = () => {
  // Throw a timeout error immediately to avoid waiting for real OVERPASS_TIMEOUT_MS (8s)
  ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => {
    throw new Error('TIMEOUT:overpass')
  })
}

const BBOX = {
  south: 37.0,
  west: -120.0,
  north: 38.0,
  east: -119.0,
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('lookupRoad', () => {
  const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  // AC-1: lookupRoad returns exists=true with highway class, surface type,
  // simplified geometry for valid road in bbox
  it('AC-1: returns exists=true with highway class, surface, and geometry for a matched road', async () => {
    const elements = [
      makeWay(1, {
        name: 'Highway 1',
        highway: 'primary',
        surface: 'asphalt',
      }),
    ]
    setupFetch(makeOverpassResponse(elements))

    const result = await lookupRoad({ roadName: 'Highway 1', bbox: BBOX })

    expect(result.exists).toBe(true)
    expect(result.status).toBe('found')

    // Type-narrow to the "found" variant
    if (result.status !== 'found') throw new Error('Expected status: found')

    expect(Array.isArray(result.matches)).toBe(true)
    expect(result.matches.length).toBeGreaterThan(0)

    const match: RoadMatch = result.matches[0]
    expect(match.name).toBe('Highway 1')
    expect(match.highway).toBe('primary')
    expect(match.surface).toBe('asphalt')
    expect(Array.isArray(match.geometry)).toBe(true)
    expect(match.geometry.length).toBeGreaterThan(0)

    // geometry points should be lat/lng pairs
    for (const point of match.geometry) {
      expect(Number.isFinite(point.lat)).toBe(true)
      expect(Number.isFinite(point.lng)).toBe(true)
    }
  })

  // AC-2: lookupRoad returns exists=false with name suggestions for non-existent road
  it('AC-2: returns exists=false with name suggestions on miss, using broader regex fallback', async () => {
    // First call: exact name — no match
    // Second call: broader regex (first word) — returns suggestions
    const suggestionElements = [
      makeWay(10, { name: 'Highway Route 35', highway: 'secondary' }),
      makeWay(11, { name: 'Highway Bypass North', highway: 'tertiary' }),
    ]

    let callCount = 0
    ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => {
      callCount++
      if (callCount === 1) {
        // Exact query returns nothing
        return makeOverpassResponse([])
      }
      // Broader regex query returns suggestions
      return makeOverpassResponse(suggestionElements)
    })

    const result = await lookupRoad({ roadName: 'Highway 99', bbox: BBOX })

    expect(result.exists).toBe(false)
    expect(result.status).toBe('not_found')

    // Type-narrow to the "not_found" variant
    if (result.status !== 'not_found') throw new Error('Expected status: not_found')

    expect(Array.isArray(result.suggestions)).toBe(true)
    expect(result.suggestions.length).toBeGreaterThan(0)
    // Suggestions should be road names
    for (const suggestion of result.suggestions) {
      expect(typeof suggestion).toBe('string')
      expect(suggestion.length).toBeGreaterThan(0)
    }
  })

  // AC-3: lookupRoad returns unverified status without throwing on Overpass timeout
  it('AC-3: returns unverified status without throwing on Overpass timeout', async () => {
    setupFetchTimeout()

    const result: LookupRoadResult = await lookupRoad({ roadName: 'Scenic Drive', bbox: BBOX })

    expect(result.exists).toBeNull()
    expect(result.status).toBe('unverified')

    // Type-narrow to the "unverified" variant
    if (result.status !== 'unverified') throw new Error('Expected status: unverified')
    expect(result.reason).toBe('overpass_timeout')
  })

  // AC-4: lookupRoad returns max 5 ways sorted by highway class for multiple matches
  it('AC-4: returns max 5 ways sorted by highway class priority', async () => {
    const elements = [
      makeWay(1, { name: 'Coastal Drive', highway: 'unclassified' }),
      makeWay(2, { name: 'Coastal Drive', highway: 'tertiary' }),
      makeWay(3, { name: 'Coastal Drive', highway: 'primary' }),
      makeWay(4, { name: 'Coastal Drive', highway: 'secondary' }),
      makeWay(5, { name: 'Coastal Drive', highway: 'motorway' }),
      makeWay(6, { name: 'Coastal Drive', highway: 'trunk' }),
      makeWay(7, { name: 'Coastal Drive', highway: 'primary' }),
    ]
    setupFetch(makeOverpassResponse(elements))

    const result = await lookupRoad({ roadName: 'Coastal Drive', bbox: BBOX })

    expect(result.exists).toBe(true)

    // Type-narrow to the "found" variant
    if (result.status !== 'found') throw new Error('Expected status: found')

    expect(result.matches.length).toBeLessThanOrEqual(5)

    // Should be sorted by highway class priority (higher-class first)
    const highwayOrder = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary', 'unclassified']
    const resultHighways = result.matches.map((m) => m.highway)

    // Verify sorting: each highway should rank <= the next in priority
    for (let i = 0; i < resultHighways.length - 1; i++) {
      const rankA = highwayOrder.indexOf(resultHighways[i])
      const rankB = highwayOrder.indexOf(resultHighways[i + 1])
      expect(rankA).toBeLessThanOrEqual(rankB)
    }
  })

  // AC-5: lookupRoad records Protomaps fallback events with structured logging
  it('AC-5: records Protomaps fallback events with tool name, reason, and bbox', async () => {
    // Mock fetch to simulate Overpass fallback (Protomaps will fail first)
    const elements = [
      makeWay(1, {
        name: 'Test Road',
        highway: 'primary',
        surface: 'asphalt',
      }),
    ]
    setupFetch(makeOverpassResponse(elements))

    // Mock Protomaps provider to throw an error (forcing fallback)
    vi.doMock('../providers/protomapsProvider', async () => {
      const actual = await vi.importActual<any>('../providers/protomapsProvider')
      return {
        ...actual,
        createProtomapsProvider: () => ({
          init: vi.fn().mockRejectedValue(new Error('Protomaps tiles not available for region')),
          queryWaysByName: vi.fn(),
        }),
      }
    })

    // Call lookupRoad - it should fall back to Overpass and record the event
    const result = await lookupRoad({ roadName: 'Test Road', bbox: BBOX })

    // Verify the result (should still work via Overpass fallback)
    expect(result.exists).toBe(true)
    if (result.status !== 'found') throw new Error('Expected status: found')
    expect(result.matches.length).toBeGreaterThan(0)

    // Verify recordProtomapsFallbackHandler was called with correct arguments
    expect(recordProtomapsFallbackHandler).toHaveBeenCalledTimes(1)
    const callArgs = (recordProtomapsFallbackHandler as any).mock.calls[0]
    expect(callArgs[0]).toBeNull() // ctx is null in handler call
    expect(callArgs[1]).toMatchObject({
      tool: 'lookupRoad',
      reason: expect.any(String), // The actual error message may vary
      bbox: JSON.stringify(BBOX),
    })

    // Verify console.warn was called with structured context
    expect(consoleWarnSpy).toHaveBeenCalled()
    const warnCall = consoleWarnSpy.mock.calls.find((call) =>
      call[0]?.includes?.('[lookupRoad] Protomaps failed, falling back to Overpass'),
    )
    expect(warnCall).toBeDefined()
    if (warnCall && warnCall[1]) {
      expect(warnCall[1]).toMatchObject({
        fallbackReason: expect.any(String),
        bbox: JSON.stringify(BBOX),
        timestamp: expect.any(String),
      })
    }
  })
})
