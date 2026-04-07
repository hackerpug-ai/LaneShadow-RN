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
 * 3-point hairpin geometry producing circumcircle radius ~23m (< 60m → weight=4).
 * Forward step ~10m, side swing ~50m, back to center.
 */
const makeHairpinOnlyGeometry = (): Array<{ lat: number; lng: number }> => [
  { lat: 37.0, lng: -122.0 },
  { lat: 37.00010, lng: -122.00050 }, // ~45m segment, tight turn
  { lat: 37.00020, lng: -122.0 },     // back to center — radius ~23m
]

/**
 * 3-point sweeping geometry producing circumcircle radius ~114m (100-175m → weight=1).
 * Gentle curve with larger steps.
 */
const makeSweepingOnlyGeometry = (): Array<{ lat: number; lng: number }> => [
  { lat: 37.0, lng: -122.0 },
  { lat: 37.0010, lng: -122.0010 }, // ~142m segment, gentle arc
  { lat: 37.0020, lng: -122.0 },    // radius ~114m
]

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
  it('weights hairpin at 4x over sweeping at 1x', () => {
    // hairpinOnly: 3 points with circumcircle radius ~23m → weight=4
    // sweepingOnly: 3 points with circumcircle radius ~114m → weight=1
    // Even though the sweeping segment is ~3x longer, the 4x weight means
    // hairpin score must exceed sweeping score.
    const hairpinOnly = makeHairpinOnlyGeometry()
    const sweepingOnly = makeSweepingOnlyGeometry()

    const h = calculateCurvatureScore(hairpinOnly)
    const s = calculateCurvatureScore(sweepingOnly)

    // Sweeping weight=1 must produce a positive score (not treated as straight/weight=0)
    expect(s.score).toBeGreaterThan(0)
    // Hairpin weight=4 must produce a higher score than sweeping weight=1
    expect(h.score).toBeGreaterThan(s.score)
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
