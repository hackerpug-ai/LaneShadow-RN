import { describe, expect, it } from 'vitest'
import { summarizeForContext } from '../lib/summarizeForContext'

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeGeometry(size: number): string {
  // Simulate an encoded polyline string of a given byte length
  return 'a'.repeat(size)
}

function makeRouteOption(index: number, geometrySize = 100) {
  const geometry = makeGeometry(geometrySize)
  return {
    routeOptionId: `opt-${index}`,
    label: `Route ${index + 1}`,
    rationale: 'A nice scenic ride',
    stats: {
      distanceMeters: 80_000 + index * 10_000, // 80–100 km
      durationSeconds: 3600 + index * 600,       // 60–70 min
      legsCount: 2,
    },
    map: {
      bounds: { ne: { lat: 37.5, lng: -122 }, sw: { lat: 37, lng: -122.5 } },
      overviewGeometry: { format: 'encoded', encoding: 'polyline', value: geometry },
      legs: [
        {
          distanceMeters: 80_000,
          durationSeconds: 3600,
          geometry: { format: 'encoded', encoding: 'polyline', value: geometry },
          steps: [
            { instruction: 'Turn left', distanceMeters: 500, durationSeconds: 60 },
            { instruction: 'Continue straight', distanceMeters: 1000, durationSeconds: 90 },
          ],
          waypoints: [
            { lat: 37.1, lng: -122.1 },
            { lat: 37.2, lng: -122.2 },
          ],
        },
      ],
    },
    overlaysPreview: {
      windSummary: 'unavailable',
      rainSummary: 'unavailable',
      temperatureSummary: 'unavailable',
      conditionsStatus: 'unavailable',
    },
  }
}

function makeSuccessResult(optionCount = 2, geometrySize = 100) {
  const options = Array.from({ length: optionCount }, (_, i) => makeRouteOption(i, geometrySize))
  return {
    type: 'routes' as const,
    data: {
      planId: 'plan-uuid-123',
      options,
    },
    routePlanId: 'route_plans:abc123',
  }
}

// ---------------------------------------------------------------------------
// planRoute — success trimming
// ---------------------------------------------------------------------------

describe('summarizeForContext — planRoute success', () => {
  it('returns type routes with routePlanId preserved', () => {
    const result = makeSuccessResult()
    const summarized = summarizeForContext('planRoute', result) as any

    expect(summarized.type).toBe('routes')
    expect(summarized.routePlanId).toBe('route_plans:abc123')
  })

  it('produces a summary array with one entry per option', () => {
    const result = makeSuccessResult(3)
    const summarized = summarizeForContext('planRoute', result) as any

    expect(summarized.summary).toHaveLength(3)
  })

  it('summary entries contain label, distanceMi, durationMin as integers', () => {
    const result = makeSuccessResult(2)
    const summarized = summarizeForContext('planRoute', result) as any

    for (const entry of summarized.summary) {
      expect(typeof entry.label).toBe('string')
      expect(Number.isInteger(entry.distanceMi)).toBe(true)
      expect(Number.isInteger(entry.durationMin)).toBe(true)
    }
  })

  it('computes distanceMi correctly (rounded)', () => {
    const result = makeSuccessResult(1)
    // First option: distanceMeters = 80_000 → 80000/1609 ≈ 49.7 → rounded to 50
    const summarized = summarizeForContext('planRoute', result) as any
    expect(summarized.summary[0].distanceMi).toBe(Math.round(80_000 / 1609))
  })

  it('computes durationMin correctly (rounded)', () => {
    const result = makeSuccessResult(1)
    // First option: durationSeconds = 3600 → 60 min exactly
    const summarized = summarizeForContext('planRoute', result) as any
    expect(summarized.summary[0].durationMin).toBe(60)
  })

  it('does NOT include data.options (geometry dropped)', () => {
    const result = makeSuccessResult()
    const summarized = summarizeForContext('planRoute', result) as any

    expect(summarized.data).toBeUndefined()
  })

  it('geometry fields are absent in summarized output', () => {
    const result = makeSuccessResult()
    const json = JSON.stringify(summarizeForContext('planRoute', result))

    expect(json).not.toContain('overviewGeometry')
    expect(json).not.toContain('"geometry"')
    expect(json).not.toContain('"waypoints"')
    expect(json).not.toContain('"steps"')
  })

  it('includes highlights when present on option', () => {
    const result = makeSuccessResult(1)
    ;(result.data.options[0] as any).highlights = ['Mountain pass', 'Sweeping views']
    const summarized = summarizeForContext('planRoute', result) as any

    expect(summarized.summary[0].highlights).toEqual(['Mountain pass', 'Sweeping views'])
  })

  it('omits highlights field when not present', () => {
    const result = makeSuccessResult(1)
    const summarized = summarizeForContext('planRoute', result) as any

    expect('highlights' in summarized.summary[0]).toBe(false)
  })

  it('summarized JSON is less than 30% of original JSON byte length for large geometry', () => {
    // 3 routes, each with 100-element geometry arrays encoded as large strings
    const GEOMETRY_SIZE = 2000 // simulate a 2000-char encoded polyline per leg
    const result = makeSuccessResult(3, GEOMETRY_SIZE)

    const originalBytes = JSON.stringify(result).length
    const summarizedBytes = JSON.stringify(summarizeForContext('planRoute', result)).length

    expect(summarizedBytes / originalBytes).toBeLessThan(0.3)
  })

  it('summary index values are sequential starting at 0', () => {
    const result = makeSuccessResult(3)
    const summarized = summarizeForContext('planRoute', result) as any

    expect(summarized.summary.map((e: any) => e.index)).toEqual([0, 1, 2])
  })
})

// ---------------------------------------------------------------------------
// planRoute — error passes through
// ---------------------------------------------------------------------------

describe('summarizeForContext — planRoute error', () => {
  it('passes error result through unchanged', () => {
    const result = {
      type: 'error' as const,
      message: "I couldn't plan your route right now. Please try again.",
      routePlanId: 'route_plans:xyz',
    }
    expect(summarizeForContext('planRoute', result)).toEqual(result)
  })

  it('passes error without routePlanId through unchanged', () => {
    const result = { type: 'error' as const, message: 'Something went wrong.' }
    expect(summarizeForContext('planRoute', result)).toEqual(result)
  })
})

// ---------------------------------------------------------------------------
// planRoute — chat (rate-limit) passes through
// ---------------------------------------------------------------------------

describe('summarizeForContext — planRoute chat', () => {
  it('passes chat result through unchanged', () => {
    const result = {
      type: 'chat' as const,
      message: "You've reached your monthly limit.",
    }
    expect(summarizeForContext('planRoute', result)).toEqual(result)
  })
})

// ---------------------------------------------------------------------------
// Pass-through for other tool names
// ---------------------------------------------------------------------------

describe('summarizeForContext — pass-through tools', () => {
  it('geocode passes through unchanged', () => {
    const result = {
      results: [
        { lat: 36.97, lng: -122.03, label: 'Santa Cruz, CA', placeId: 'place_sc' },
      ],
    }
    expect(summarizeForContext('geocode', result)).toEqual(result)
  })

  it('fetchWeather passes through unchanged', () => {
    const result = {
      type: 'weather',
      data: { summary: 'Clear skies', temperature: '72F', conditions: 'clear' },
    }
    expect(summarizeForContext('fetchWeather', result)).toEqual(result)
  })

  it('saveRoute passes through unchanged', () => {
    const result = { type: 'confirmation', message: 'Route saved.' }
    expect(summarizeForContext('saveRoute', result)).toEqual(result)
  })

  it('searchFavorites passes through unchanged', () => {
    const result = { type: 'chat', message: 'Searching favorites...' }
    expect(summarizeForContext('searchFavorites', result)).toEqual(result)
  })

  it('unknown tool name passes through unchanged', () => {
    const result = { foo: 'bar', nested: { baz: [1, 2, 3] } }
    expect(summarizeForContext('someUnknownTool', result)).toEqual(result)
  })

  it('null result passes through unchanged for unknown tool', () => {
    expect(summarizeForContext('someUnknownTool', null)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// compileSketch — same summarization logic as planRoute
// ---------------------------------------------------------------------------

describe('summarizeForContext — compileSketch success', () => {
  it('compileSketch success result is summarized like planRoute (geometry dropped)', () => {
    const result = makeSuccessResult(2)
    const summarized = summarizeForContext('compileSketch', result) as any

    expect(summarized.type).toBe('routes')
    expect(summarized.routePlanId).toBe('route_plans:abc123')
    expect(summarized.summary).toHaveLength(2)
    expect(summarized.data).toBeUndefined()
  })

  it('compileSketch partial route preserves data.message in the summarized output', () => {
    const result = makeSuccessResult(1)
    ;(result.data as any).message = "I routed most of the trip but couldn't find a path for Bad Road."
    const summarized = summarizeForContext('compileSketch', result) as any

    expect(summarized.message).toBe("I routed most of the trip but couldn't find a path for Bad Road.")
  })

  it('compileSketch error passes through unchanged', () => {
    const result = {
      type: 'error' as const,
      message: "I couldn't plan your route right now. Please try again.",
      routePlanId: 'route_plans:xyz',
    }
    expect(summarizeForContext('compileSketch', result)).toEqual(result)
  })

  it('compileSketch chat (rate-limit) passes through unchanged', () => {
    const result = {
      type: 'chat' as const,
      message: "You've reached your monthly limit.",
    }
    expect(summarizeForContext('compileSketch', result)).toEqual(result)
  })

  it('compileSketch summarized JSON is less than 30% of original for large geometry', () => {
    const GEOMETRY_SIZE = 2000
    const result = makeSuccessResult(3, GEOMETRY_SIZE)

    const originalBytes = JSON.stringify(result).length
    const summarizedBytes = JSON.stringify(summarizeForContext('compileSketch', result)).length

    expect(summarizedBytes / originalBytes).toBeLessThan(0.3)
  })
})
