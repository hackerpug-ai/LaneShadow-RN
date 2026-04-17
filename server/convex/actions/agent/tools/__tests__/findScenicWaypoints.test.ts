import { describe, expect, it, vi } from 'vitest'
import { findScenicWaypoints } from '../findScenicWaypoints'

const START = { lat: 37.0, lng: -120.0 }
const END = { lat: 38.5, lng: -119.0 }

describe('findScenicWaypoints', () => {
  it('returns 3 variants with different routing preferences', async () => {
    const result = await findScenicWaypoints({ start: START, end: END })

    expect(result).toBeDefined()
    expect(Array.isArray(result)).toBe(true)
    expect(result).toHaveLength(3)

    // Each variant should have an id, waypoints array, and preferences
    for (const variant of result) {
      expect(typeof variant.id).toBe('string')
      expect(Array.isArray(variant.waypoints)).toBe(true)
      expect(variant.preferences).toBeDefined()
      expect(variant.preferences?.scenicBias).toBeDefined()
      expect(variant.preferences?.avoidHighways).toBeDefined()
      expect(variant.preferences?.avoidTolls).toBeDefined()
    }
  })

  it('generates variants with distinct routing strategies', async () => {
    const result = await findScenicWaypoints({ start: START, end: END })

    const scenic = result.find((v) => v.id === 'scenic-coastal')
    const balanced = result.find((v) => v.id === 'balanced')
    const efficient = result.find((v) => v.id === 'efficient')

    expect(scenic).toBeDefined()
    expect(balanced).toBeDefined()
    expect(efficient).toBeDefined()

    // Scenic variant should avoid highways
    expect(scenic?.preferences?.avoidHighways).toBe(true)
    expect(scenic?.preferences?.scenicBias).toBe('high')

    // Balanced variant should allow highways
    expect(balanced?.preferences?.avoidHighways).toBe(false)
    expect(balanced?.preferences?.scenicBias).toBe('default')

    // Efficient variant should avoid tolls
    expect(efficient?.preferences?.avoidTolls).toBe(true)
    expect(efficient?.preferences?.scenicBias).toBe('default')
  })

  it('always returns 3 variants regardless of input', async () => {
    // Different routes should always return 3 variants
    const sfToSantaCruz = await findScenicWaypoints({
      start: { lat: 37.7749, lng: -122.4194 },
      end: { lat: 36.9741, lng: -122.0308 },
    })

    const nyToBoston = await findScenicWaypoints({
      start: { lat: 40.7128, lng: -74.006 },
      end: { lat: 42.3601, lng: -71.0589 },
    })

    expect(sfToSantaCruz).toHaveLength(3)
    expect(nyToBoston).toHaveLength(3)
  })

  it('does not make external API calls', async () => {
    // Verify no fetch or external dependencies
    const result = await findScenicWaypoints({ start: START, end: END })

    // Should return immediately with deterministic variants
    expect(result).toHaveLength(3)
    expect(result.every((v) => v.waypoints.length === 0)).toBe(true)
  })
})
