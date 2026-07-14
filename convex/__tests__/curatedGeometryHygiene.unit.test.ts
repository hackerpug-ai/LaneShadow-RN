/**
 * S3-T1 TC-5: Supplementary pure-unit test for the scale predicate.
 *
 * UNIT_TEST_JUSTIFIED: pure number logic, zero I/O.
 * The scale predicate divides a value greater than 1 by 100 and leaves a 0–1
 * value untouched.
 */

import { describe, expect, it } from 'vitest'
import { normalizeScore } from '../curatedGeometryHygiene'

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
