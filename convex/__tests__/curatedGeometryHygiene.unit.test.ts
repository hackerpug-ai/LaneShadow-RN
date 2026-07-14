/**
 * S3-T1 TC-5: Supplementary pure-unit test for the scale predicate.
 *
 * UNIT_TEST_JUSTIFIED: pure number logic, zero I/O.
 * The scale predicate divides a value greater than 1 by 100 and leaves a 0–1
 * value untouched.
 */

import { describe, expect, it } from 'vitest'
import { computeNormalizedScores, normalizeScore } from '../curatedGeometryHygiene'

describe('TC-5: scale predicate (pure unit)', () => {
  describe('scale', () => {
    it('divides a value greater than 1 by 100', () => {
      expect(normalizeScore(90)).toBeCloseTo(0.9, 10)
      expect(normalizeScore(72)).toBeCloseTo(0.72, 10)
      expect(normalizeScore(85)).toBeCloseTo(0.85, 10)
      expect(normalizeScore(100)).toBeCloseTo(1.0, 10)
      expect(normalizeScore(50)).toBeCloseTo(0.5, 10)
    })

    it('leaves a 0–1 value untouched (value>1 guard)', () => {
      expect(normalizeScore(0.9)).toBe(0.9)
      expect(normalizeScore(0.85)).toBe(0.85)
      expect(normalizeScore(0)).toBe(0)
      expect(normalizeScore(1)).toBe(1)
      expect(normalizeScore(0.5)).toBe(0.5)
    })

    it('does NOT divide a value of exactly 1.0 (boundary guard)', () => {
      // 1.0 is NOT > 1, so it must not be divided
      expect(normalizeScore(1)).toBe(1)
      expect(normalizeScore(1)).not.toBeCloseTo(0.01, 10)
    })

    it('handles edge case: value just above 1', () => {
      expect(normalizeScore(1.001)).toBeCloseTo(0.01001, 10)
    })
  })
})

/**
 * REDHAT-FIX-001 TC-4: Supplementary pure-unit test for computeNormalizedScores
 * with mixed-scale input.
 *
 * UNIT_TEST_JUSTIFIED: pure number logic, zero I/O.
 * Verifies that the per-dimension gate correctly identifies rows where ANY
 * score field > 1 (not just compositeScore), and that in-scale dimensions
 * within a mixed-scale row are left byte-for-byte unchanged.
 */
describe('TC-4: computeNormalizedScores mixed-scale (pure unit)', () => {
  describe('mixed-scale', () => {
    it('returns object with in-scale values unchanged and out-of-scale ÷100', () => {
      const result = computeNormalizedScores({
        compositeScore: 0.85,
        curvatureScore: 88,
        scenicScore: 0.84,
        technicalScore: 75,
        trafficScore: 0.76,
        remotenessScore: 70,
        // scoreScaleNormalizedAt absent
      })

      expect(result).not.toBeNull()

      // In-scale dimensions — unchanged
      expect(result!.compositeScore).toBe(0.85)
      expect(result!.scenicScore).toBe(0.84)
      expect(result!.trafficScore).toBe(0.76)

      // Out-of-scale dimensions — ÷100
      expect(result!.curvatureScore).toBeCloseTo(0.88, 10)
      expect(result!.technicalScore).toBeCloseTo(0.75, 10)
      expect(result!.remotenessScore).toBeCloseTo(0.7, 10)

      // scoreScaleNormalizedAt stamped
      expect(result!.scoreScaleNormalizedAt).toBeGreaterThan(0)
    })

    it('returns null when ALL score fields are in-scale (≤1)', () => {
      const result = computeNormalizedScores({
        compositeScore: 0.9,
        curvatureScore: 0.88,
        scenicScore: 0.84,
        technicalScore: 0.8,
        trafficScore: 0.76,
        remotenessScore: 0.7,
        // scoreScaleNormalizedAt absent
      })

      expect(result).toBeNull()
    })

    it('returns null when scoreScaleNormalizedAt is already set (idempotent)', () => {
      const result = computeNormalizedScores({
        compositeScore: 90,
        curvatureScore: 88,
        scenicScore: 84,
        technicalScore: 80,
        trafficScore: 76,
        remotenessScore: 70,
        scoreScaleNormalizedAt: Date.now(),
      })

      expect(result).toBeNull()
    })
  })
})
