/**
 * S4-T3 AC-3: Lever 2 routes via waypoints (via=true), thins anchors to ≤8
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Google Routes API with via-waypoints)
 * FLOW_REF: UC-REC-02
 */

import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildViaIntermediates,
  routeViaWaypoints,
  thinAnchorsForRouting,
} from '../actions/curatedGeometryReconstruct'
import { GOOGLE_MAPS_API_KEY } from '../lib/env'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T3/evidence')

const hasGoogleKey = Boolean(GOOGLE_MAPS_API_KEY)

// Real Central Coast CA anchors (in-region for Tepusquet centroid)
const SEVEN_ANCHORS = [
  { lat: 34.953, lng: -120.436, formatted: 'Santa Maria, CA', distanceFromCentroid: 1 },
  { lat: 34.894, lng: -120.435, formatted: 'Betteravia, CA', distanceFromCentroid: 5 },
  { lat: 34.82, lng: -120.28, formatted: 'Los Alamos, CA', distanceFromCentroid: 12 },
  { lat: 34.667, lng: -120.115, formatted: 'Los Olivos, CA', distanceFromCentroid: 25 },
  { lat: 34.596, lng: -120.138, formatted: 'Solvang, CA', distanceFromCentroid: 30 },
  { lat: 34.614, lng: -120.193, formatted: 'Buellton, CA', distanceFromCentroid: 28 },
  { lat: 34.639, lng: -120.458, formatted: 'Lompoc, CA', distanceFromCentroid: 25 },
]

describe('S4-T3 AC-3: Lever 2 via-waypoint routing + thinning', () => {
  it('TC-5: thinAnchorsForRouting keeps first/last and returns exactly 8 from 15', () => {
    const fifteen = Array.from({ length: 15 }, (_, i) => ({
      lat: 34.95 + i * 0.01,
      lng: -120.42 + i * 0.01,
      formatted: `Anchor ${i}`,
      distanceFromCentroid: i,
    }))
    const thinned = thinAnchorsForRouting(fifteen, 8)
    expect(thinned.length).toBe(8)
    expect(thinned[0]).toEqual(fifteen[0])
    expect(thinned[thinned.length - 1]).toEqual(fifteen[fourteenLast(fifteen)])
    expect(thinned.length).toBeLessThanOrEqual(8)
    // Must not use all 15
    expect(thinned.length).not.toBe(15)
  })

  it('MUST_OBSERVE: buildViaIntermediates marks every intermediate via=true', () => {
    const intermediates = buildViaIntermediates(SEVEN_ANCHORS)
    // origin + destination are separate; intermediates are the middle points
    expect(intermediates.length).toBe(SEVEN_ANCHORS.length - 2)
    expect(intermediates.every((i) => i.via === true)).toBe(true)
    expect(intermediates.some((i) => i.via === false)).toBe(false)
  })

  describe('CASE 1 — lever2-route-via-waypoints', () => {
    if (!hasGoogleKey) {
      it.skip('SKIP: GOOGLE_MAPS_API_KEY absent', () => {})
      return
    }

    it('TC-4: routes through 7 anchors with via=true; polyline length > 100; distanceMeters > 0', async () => {
      const intermediates = buildViaIntermediates(SEVEN_ANCHORS)
      expect(intermediates.every((i) => i.via === true)).toBe(true)

      const result = await routeViaWaypoints(SEVEN_ANCHORS)

      expect(result.encodedPolyline.length).toBeGreaterThan(100)
      expect(result.distanceMeters).toBeGreaterThan(0)
      expect(result.intermediates.every((i) => i.via === true)).toBe(true)

      mkdirSync(EVIDENCE_DIR, { recursive: true })
      writeFileSync(
        resolve(EVIDENCE_DIR, 'AC-3-via-waypoints.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            anchorCount: SEVEN_ANCHORS.length,
            intermediateCount: result.intermediates.length,
            allVia: result.intermediates.every((i) => i.via === true),
            encodedPolylineLength: result.encodedPolyline.length,
            distanceMeters: result.distanceMeters,
            routedMiles: result.distanceMeters / 1609.34,
            polylinePrefix: result.encodedPolyline.slice(0, 48),
          },
          null,
          2,
        ),
      )
    }, 60_000)
  })
})

function fourteenLast<T>(arr: T[]): number {
  return arr.length - 1
}
