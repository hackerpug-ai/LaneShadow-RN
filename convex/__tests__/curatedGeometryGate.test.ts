/**
 * TC-8: SUPPLEMENTARY pure gate math (unit)
 *
 * Tests the deterministic gate module in isolation without I/O.
 * Verifies ratio boundaries, degenerate detection, region filtering, and null-length handling.
 */

import { describe, expect, it } from 'vitest'
import {
  destinationPointMi,
  determineGateVerdict,
  evaluateRatioBoundary,
  haversineDistance,
  isAnchorInRegion,
  isDegenerate,
} from '../curatedGeometryGate'

describe('curatedGeometryGate (pure math unit tests)', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // TC-8 Case 1: Ratio boundaries (inclusive [0.6, 1.6])
  // ─────────────────────────────────────────────────────────────────────────
  describe('ratio boundaries (inclusive)', () => {
    it('0.60 admits (lower boundary inclusive)', () => {
      const result = evaluateRatioBoundary(0.6)
      expect(result.passes).toBe(true)
      expect(result.ratio).toBe(0.6)
    })

    it('0.61 admits (inside range)', () => {
      const result = evaluateRatioBoundary(0.61)
      expect(result.passes).toBe(true)
    })

    it('0.59 reviews (below range)', () => {
      const result = evaluateRatioBoundary(0.59)
      expect(result.passes).toBe(false)
      expect(result.failedCondition).toBe('ratio')
    })

    it('1.00 admits (center)', () => {
      const result = evaluateRatioBoundary(1.0)
      expect(result.passes).toBe(true)
    })

    it('1.59 admits (upper boundary inclusive)', () => {
      const result = evaluateRatioBoundary(1.59)
      expect(result.passes).toBe(true)
    })

    it('1.60 admits (upper boundary inclusive)', () => {
      const result = evaluateRatioBoundary(1.6)
      expect(result.passes).toBe(true)
      expect(result.ratio).toBe(1.6)
    })

    it('1.61 reviews (above range)', () => {
      const result = evaluateRatioBoundary(1.61)
      expect(result.passes).toBe(false)
      expect(result.failedCondition).toBe('ratio')
    })

    it('null claimed length skips ratio (quarantine)', () => {
      const result = evaluateRatioBoundary(undefined)
      expect(result.passes).toBe(true) // quarantine skips ratio, decided by degenerate+region
      expect(result.ratio).toBeNull()
      expect(result.failedCondition).toBeUndefined()
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-8 Case 2: Degenerate detection (<=4 points OR points < routedMiles)
  // ─────────────────────────────────────────────────────────────────────────
  describe('degenerate detection', () => {
    it('2-point line is degenerate', () => {
      const result = isDegenerate({ pointCount: 2, routedMiles: 40 })
      expect(result).toBe(true)
    })

    it('3-point line is degenerate (<=4)', () => {
      const result = isDegenerate({ pointCount: 3, routedMiles: 100 })
      expect(result).toBe(true)
    })

    it('4-point line is degenerate (boundary inclusive)', () => {
      const result = isDegenerate({ pointCount: 4, routedMiles: 100 })
      expect(result).toBe(true)
    })

    it('50 points over 40 miles is not degenerate (>4 and >= 1 pt/mi)', () => {
      const result = isDegenerate({ pointCount: 50, routedMiles: 40 })
      expect(result).toBe(false)
    })

    it('10 points over 50 miles is degenerate (<1 pt/mi)', () => {
      const result = isDegenerate({ pointCount: 10, routedMiles: 50 })
      expect(result).toBe(true) // 10 < 50
    })

    it('10 points over 5 miles is not degenerate (>1 pt/mi)', () => {
      const result = isDegenerate({ pointCount: 10, routedMiles: 5 })
      expect(result).toBe(false) // 10 >= 5
    })

    it('100 points over 41 miles is not degenerate', () => {
      const result = isDegenerate({ pointCount: 100, routedMiles: 41 })
      expect(result).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-8 Case 3: Region filtering (150.0 vs 150.1 mi from centroid)
  // ─────────────────────────────────────────────────────────────────────────
  describe('region filtering (150mi boundary)', () => {
    const centroid = { lat: 34.95, lng: -120.42 }

    it('anchor at 150.0 mi is in region', () => {
      let miles = 150.0
      let anchor = destinationPointMi(centroid, miles, 0)
      let dist = haversineDistance(anchor, centroid)
      while (dist > 150.0 && miles > 149.0) {
        miles -= 0.01
        anchor = destinationPointMi(centroid, miles, 0)
        dist = haversineDistance(anchor, centroid)
      }
      expect(dist).toBeLessThanOrEqual(150.0)
      expect(dist).toBeGreaterThan(149.0)
      expect(isAnchorInRegion(anchor, centroid)).toBe(true)
    })

    it('anchor at 149.9 mi is in region', () => {
      const anchor = destinationPointMi(centroid, 149.9, 90)
      expect(haversineDistance(anchor, centroid)).toBeCloseTo(149.9, 0)
      expect(isAnchorInRegion(anchor, centroid)).toBe(true)
    })

    it('anchor at 150.1 mi is out of region', () => {
      const anchor = destinationPointMi(centroid, 150.1, 180)
      expect(haversineDistance(anchor, centroid)).toBeCloseTo(150.1, 0)
      expect(isAnchorInRegion(anchor, centroid)).toBe(false)
    })
  })

  // ─────────────────────────────────────────────────────────────────────────
  // TC-8 Case 4: Complete gate verdict logic
  // ─────────────────────────────────────────────────────────────────────────
  describe('complete gate verdict', () => {
    it('pass: ratio 1.00, 100 points, 40 routed miles', () => {
      const result = determineGateVerdict({
        ratio: 1.0,
        pointCount: 100,
        routedMiles: 40,
        anchorCount: 2,
      })
      expect(result.verdict).toBe('pass')
      expect(result.failedCondition).toBeUndefined()
    })

    it('review: ratio 0.59 (out of bounds), with sufficient points', () => {
      const result = determineGateVerdict({
        ratio: 0.59,
        pointCount: 100,
        routedMiles: 40,
        anchorCount: 2,
      })
      expect(result.verdict).toBe('review')
      expect(result.failedCondition).toBe('ratio')
    })

    it('review: 2-point degenerate line', () => {
      const result = determineGateVerdict({
        ratio: 1.0,
        pointCount: 2,
        routedMiles: 40,
        anchorCount: 2,
      })
      expect(result.verdict).toBe('review')
      expect(result.failedCondition).toBe('degenerate')
    })

    it('review: 1 anchor (below minimum)', () => {
      const result = determineGateVerdict({
        ratio: 1.0,
        pointCount: 100,
        routedMiles: 40,
        anchorCount: 1,
      })
      expect(result.verdict).toBe('review')
      expect(result.failedCondition).toBe('anchors')
    })

    it('review: multiple failures (anchors checked first)', () => {
      const result = determineGateVerdict({
        ratio: 0.59, // out of bounds
        pointCount: 2, // degenerate
        routedMiles: 40,
        anchorCount: 1, // too few — checked first
      })
      expect(result.verdict).toBe('review')
      // Anchors are checked first in the gate logic
      expect(result.failedCondition).toBe('anchors')
    })
  })
})
