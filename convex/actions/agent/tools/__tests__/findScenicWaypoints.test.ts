import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { computeBbox, findScenicWaypoints } from '../findScenicWaypoints'
import type { RouteVariant } from '../findScenicWaypoints'
import { recordProtomapsFallbackHandler } from '../../../monitoring'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeNode = (
  id: number,
  lat: number,
  lon: number,
  tags: Record<string, string>
) => ({
  type: 'node',
  id,
  lat,
  lon,
  tags,
})

const makeOverpassResponse = (elements: ReturnType<typeof makeNode>[]) => ({
  ok: true,
  status: 200,
  json: async () => ({ elements }),
  text: async () => JSON.stringify({ elements }),
})

const setupFetch = (response: ReturnType<typeof makeOverpassResponse>) => {
  ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => response)
}

const setupFetchError = (error: Error) => {
  ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => {
    throw error
  })
}

const START = { lat: 37.0, lng: -120.0 }
const END = { lat: 38.5, lng: -119.0 }

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('findScenicWaypoints', () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it('returns clustered variants from valid Overpass response', async () => {
    const elements = [
      makeNode(1, 37.2, -120.1, { 'tourism': 'viewpoint', 'name': 'Eagle View' }),
      makeNode(2, 37.6, -119.8, { 'mountain_pass': 'yes', 'name': 'Tioga Pass' }),
      makeNode(3, 38.0, -119.5, { 'natural': 'peak', 'name': 'Mount Dana' }),
      makeNode(4, 38.3, -119.2, { 'mountain_pass': 'yes', 'name': 'Sonora Pass' }),
    ]

    setupFetch(makeOverpassResponse(elements))

    const result = await findScenicWaypoints({ start: START, end: END })

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result.length).toBeGreaterThanOrEqual(1)

    // Each variant should have an id and waypoints array
    for (const variant of result) {
      expect(typeof variant.id).toBe('string')
      expect(Array.isArray(variant.waypoints)).toBe(true)
    }

    // At least one variant should have real waypoints with names
    const allWaypoints = result.flatMap((v: RouteVariant) => v.waypoints)
    expect(allWaypoints.length).toBeGreaterThan(0)
    for (const wp of allWaypoints) {
      expect(typeof wp.name).toBe('string')
      expect(wp.name.length).toBeGreaterThan(0)
      expect(Number.isFinite(wp.lat)).toBe(true)
      expect(Number.isFinite(wp.lng)).toBe(true)
    }
  })

  it('scores passes higher than viewpoints', async () => {
    const elements = [
      makeNode(1, 37.5, -119.5, { 'tourism': 'viewpoint', 'name': 'Scenic Overlook' }),
      makeNode(2, 37.6, -119.6, { 'mountain_pass': 'yes', 'name': 'High Pass' }),
      makeNode(3, 37.7, -119.7, { 'natural': 'peak', 'name': 'Summit Peak' }),
    ]

    setupFetch(makeOverpassResponse(elements))

    const result = await findScenicWaypoints({ start: START, end: END })

    const allWaypoints = result.flatMap((v: RouteVariant) => v.waypoints)

    const pass = allWaypoints.find((w) => w.name === 'High Pass')
    const peak = allWaypoints.find((w) => w.name === 'Summit Peak')
    const viewpoint = allWaypoints.find((w) => w.name === 'Scenic Overlook')

    expect(pass?.score).toBe(3)
    expect(peak?.score).toBe(2)
    expect(viewpoint?.score).toBe(1)
  })

  it('returns fallback on Overpass network error', async () => {
    setupFetchError(new Error('Network error'))

    const result = await findScenicWaypoints({ start: START, end: END })

    expect(result).toEqual([{ id: 'direct-scenic', waypoints: [] }])
  })

  it('returns fallback on Overpass timeout', async () => {
    // Simulate a timeout by having fetch reject with a timeout-like error
    ;(globalThis as { fetch: unknown }).fetch = vi.fn(async () => {
      await new Promise((_, reject) =>
        setTimeout(() => reject(new Error('TIMEOUT:overpass')), 10)
      )
    })

    const result = await findScenicWaypoints({ start: START, end: END })

    expect(result).toEqual([{ id: 'direct-scenic', waypoints: [] }])
  })

  it('returns fallback when <2 nodes in response', async () => {
    // Only 1 valid node — below MIN_VALID_NODES threshold
    const elements = [
      makeNode(1, 37.5, -119.5, { 'tourism': 'viewpoint', 'name': 'Single View' }),
    ]

    setupFetch(makeOverpassResponse(elements))

    const result = await findScenicWaypoints({ start: START, end: END })

    expect(result).toEqual([{ id: 'direct-scenic', waypoints: [] }])
  })

  it('skips nodes with no name tag', async () => {
    const elements = [
      // No name tag — should be skipped
      makeNode(1, 37.2, -120.1, { 'tourism': 'viewpoint' }),
      // Empty name tag — should be skipped
      makeNode(2, 37.3, -120.0, { 'natural': 'peak', 'name': '' }),
      // Valid nodes with names
      makeNode(3, 37.8, -119.8, { 'mountain_pass': 'yes', 'name': 'Valid Pass' }),
      makeNode(4, 38.1, -119.5, { 'natural': 'peak', 'name': 'Named Peak' }),
    ]

    setupFetch(makeOverpassResponse(elements))

    const result = await findScenicWaypoints({ start: START, end: END })

    const allWaypoints = result.flatMap((v: RouteVariant) => v.waypoints)

    // Only the 2 named nodes should appear
    expect(allWaypoints.every((w) => w.name.length > 0)).toBe(true)
    expect(allWaypoints.some((w) => w.name === 'Valid Pass')).toBe(true)
    expect(allWaypoints.some((w) => w.name === 'Named Peak')).toBe(true)
  })

  it('computes bbox with correct padding', () => {
    const start = { lat: 37.0, lng: -120.0 }
    const end = { lat: 38.5, lng: -119.0 }

    const bbox = computeBbox(start, end)

    // Padding is 0.5 degrees on each side
    expect(bbox.south).toBeCloseTo(37.0 - 0.5, 5)
    expect(bbox.west).toBeCloseTo(-120.0 - 0.5, 5)
    expect(bbox.north).toBeCloseTo(38.5 + 0.5, 5)
    expect(bbox.east).toBeCloseTo(-119.0 + 0.5, 5)
  })

  it('records monitoring event when Protomaps fails and falls back to Overpass', async () => {
    const elements = [
      makeNode(1, 37.2, -120.1, { 'tourism': 'viewpoint', 'name': 'Eagle View' }),
      makeNode(2, 37.6, -119.8, { 'mountain_pass': 'yes', 'name': 'Tioga Pass' }),
    ]

    setupFetch(makeOverpassResponse(elements))

    // Mock the monitoring handler
    const mockHandler = vi.fn()
    vi.spyOn(await import('../../../monitoring'), 'recordProtomapsFallbackHandler').mockImplementation(mockHandler)

    const result = await findScenicWaypoints({ start: START, end: END })

    // Should return valid results from Overpass fallback
    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)

    // Should have called the monitoring handler
    expect(mockHandler).toHaveBeenCalledTimes(1)
    expect(mockHandler).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        tool: 'findScenicWaypoints',
        reason: expect.any(String),
        bbox: expect.stringContaining('south'),
      })
    )
  })
})
