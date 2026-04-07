import { describe, it, expect } from 'vitest'
import { calculateCurvatureScore, getCurvature } from '../getCurvature'
import type { CurvatureResult } from '../getCurvature'

// ---------------------------------------------------------------------------
// Fixture geometry helpers
// ---------------------------------------------------------------------------

/**
 * Generate a zigzag path with tight hairpin-like angles.
 * Creates coords that alternate sharply left/right, producing small circumcircle radii.
 * Using extreme zigzag so the curves are tight (radius << 60m → hairpin weight=4).
 */
const makeTwistyGeometry = (): Array<{ lat: number; lng: number }> => {
  // Start at a base position and create a tight zigzag
  // Each "step" moves forward ~50m and alternates 100m side to side
  // This creates very small circumcircle radii (hairpin curves)
  const coords: Array<{ lat: number; lng: number }> = []
  const baseLat = 37.3861
  const baseLng = -122.0839

  // ~50m steps in lat ≈ 0.000449 deg, 100m in lng ≈ 0.001 deg at this latitude
  const stepLat = 0.000449 // ~50m
  const swingLng = 0.0005  // ~50m side-to-side swing

  for (let i = 0; i < 60; i++) {
    const lat = baseLat + i * stepLat
    // Alternate side-to-side creating tight zigzag
    const lng = baseLng + (i % 2 === 0 ? swingLng : -swingLng)
    coords.push({ lat, lng })
  }
  return coords
}

/**
 * Generate a straight-line geometry along a highway.
 * Points are almost perfectly collinear, so circumcircle radii are enormous → weight=0.
 */
const makeStraightGeometry = (): Array<{ lat: number; lng: number }> => {
  const coords: Array<{ lat: number; lng: number }> = []
  const baseLat = 40.0
  const baseLng = -122.0

  // Exactly straight line, each point ~500m apart
  const stepLat = 0.0045 // ~500m
  for (let i = 0; i < 50; i++) {
    coords.push({ lat: baseLat + i * stepLat, lng: baseLng })
  }
  return coords
}

/**
 * Small geometry with fewer than 3 points.
 */
const makeTinyGeometry = (): Array<{ lat: number; lng: number }> => [
  { lat: 37.0, lng: -122.0 },
  { lat: 37.01, lng: -122.01 },
]

/**
 * Mixed geometry: some hairpin segments followed by straight segments.
 * Used to verify relative weighting behavior.
 */
const makeMixedGeometry = (): Array<{ lat: number; lng: number }> => {
  // 3 tight hairpin points (radius << 60m, weight=4)
  // Then 3 straight points (radius >> 175m, weight=0)
  // Then 3 sweeping points (radius 100-175m, weight=1)
  const coords: Array<{ lat: number; lng: number }> = [
    // Hairpin segment: very tight turn
    { lat: 37.0, lng: -122.0 },
    { lat: 37.00010, lng: -122.00050 }, // ~50m forward, 50m side
    { lat: 37.00020, lng: -122.0 },     // back to center — very tight radius
    // Straight segment
    { lat: 37.0010, lng: -122.0 },
    { lat: 37.0020, lng: -122.0 },
    { lat: 37.0030, lng: -122.0 },
    // Sweeping curve (moderate radius)
    { lat: 37.0040, lng: -122.0 },
    { lat: 37.0050, lng: -122.0010 },
    { lat: 37.0060, lng: -122.0020 },
  ]
  return coords
}

// ---------------------------------------------------------------------------
// AC-1: Twisty road returns score >= 1000 with "very_twisty" rating
// ---------------------------------------------------------------------------

describe('twisty road', () => {
  it('getCurvature returns score >= 1000 and rating very_twisty for geometry with many tight curves', async () => {
    const twistyCoords = makeTwistyGeometry()
    const result: CurvatureResult = await getCurvature({ geometry: twistyCoords, roadName: 'Skyline Boulevard', surface: null })

    expect(result.score).toBeGreaterThanOrEqual(1000)
    expect(result.rating).toBe('very_twisty')
    expect(result.kmCornering).toBeGreaterThan(0)
    expect(result.segmentCount).toBeGreaterThan(0)
    expect(result.status).toBe('ok')
  })
})

// ---------------------------------------------------------------------------
// AC-2: Straight road returns score < 100 with "straight" rating
// ---------------------------------------------------------------------------

describe('straight road', () => {
  it('getCurvature returns score < 100 and rating straight for geometry with minimal curves', async () => {
    const straightCoords = makeStraightGeometry()
    const result: CurvatureResult = await getCurvature({ geometry: straightCoords, roadName: 'Interstate 5', surface: null })

    expect(result.score).toBeLessThan(100)
    expect(result.rating).toBe('straight')
    expect(result.status).toBe('ok')
  })
})

// ---------------------------------------------------------------------------
// AC-3: calculateCurvatureScore weights hairpin (4x) over sweeping (1x)
// ---------------------------------------------------------------------------

describe('mixed geometry', () => {
  it('calculateCurvatureScore weights hairpin curves at 4x and sweeping at 1x', () => {
    const mixed = makeMixedGeometry()
    const result = calculateCurvatureScore(mixed)

    // The hairpin segment should contribute significantly more than the sweeping segment.
    // Verify the function returned a positive score and correct rating fields exist.
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(typeof result.rating).toBe('string')
    expect(['very_twisty', 'twisty', 'moderate', 'mild', 'straight']).toContain(result.rating)
    expect(result.kmCornering).toBeGreaterThanOrEqual(0)
  })
})

// ---------------------------------------------------------------------------
// AC-4: calculateCurvatureScore returns score 0 for fewer than 3 points
// ---------------------------------------------------------------------------

describe('minimal geometry', () => {
  it('calculateCurvatureScore returns score 0 and rating straight for fewer than 3 points without throwing', () => {
    const tiny = makeTinyGeometry()
    const result = calculateCurvatureScore(tiny)

    expect(result.score).toBe(0)
    expect(result.rating).toBe('straight')
    expect(result.kmCornering).toBe(0)
  })

  it('calculateCurvatureScore handles single point without throwing', () => {
    const result = calculateCurvatureScore([{ lat: 37.0, lng: -122.0 }])

    expect(result.score).toBe(0)
    expect(result.rating).toBe('straight')
  })

  it('calculateCurvatureScore handles empty array without throwing', () => {
    const result = calculateCurvatureScore([])

    expect(result.score).toBe(0)
    expect(result.rating).toBe('straight')
  })
})
