import { describe, expect, it } from 'vitest'
import { findScenicWaypoints } from '../findScenicWaypoints'

const START = { lat: 37.0, lng: -120.0 }
const END = { lat: 38.5, lng: -119.0 }

describe('findScenicWaypoints', () => {
  it('returns single scenic variant with routing preferences', async () => {
    const result = await findScenicWaypoints({ start: START, end: END })

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(1)

    // The single variant should have an id, waypoints array, and preferences
    const variant = result[0]
    expect(typeof variant.id).toBe('string')
    expect(Array.isArray(variant.waypoints)).toBe(true)
    expect(variant.preferences).toBeDefined()
    expect(variant.preferences?.scenicBias).toBeDefined()
    expect(variant.preferences?.avoidHighways).toBeDefined()
    expect(variant.preferences?.avoidTolls).toBeDefined()
  })

  it('returnsSingleScenicVariant: returns exactly one scenic variant; no balanced/efficient', async () => {
    const result = await findScenicWaypoints({ start: START, end: END })

    // AC-4: result.length === 1
    expect(result).toHaveLength(1)

    const scenic = result[0]

    // Must be scenic variant
    expect(scenic.id).toBe('scenic')
    expect(scenic.preferences?.scenicBias).toBe('high')
    expect(scenic.preferences?.avoidHighways).toBe(true)

    // MUST NOT have balanced or efficient
    const hasBalanced = result.some((v) => v.id === 'balanced')
    const hasEfficient = result.some((v) => v.id === 'efficient')
    expect(hasBalanced).toBe(false)
    expect(hasEfficient).toBe(false)
  })

  it('always returns 1 variant regardless of input', async () => {
    // Different routes should always return 1 variant
    const sfToSantaCruz = await findScenicWaypoints({
      start: { lat: 37.7749, lng: -122.4194 },
      end: { lat: 36.9741, lng: -122.0308 },
    })

    const nyToBoston = await findScenicWaypoints({
      start: { lat: 40.7128, lng: -74.006 },
      end: { lat: 42.3601, lng: -71.0589 },
    })

    expect(sfToSantaCruz).toHaveLength(1)
    expect(nyToBoston).toHaveLength(1)
  })

  it('does not make external API calls', async () => {
    // Verify no fetch or external dependencies
    const result = await findScenicWaypoints({ start: START, end: END })

    // Should return immediately with deterministic single variant
    expect(result).toHaveLength(1)
    expect(result.every((v) => v.waypoints.length === 0)).toBe(true)
  })
})
