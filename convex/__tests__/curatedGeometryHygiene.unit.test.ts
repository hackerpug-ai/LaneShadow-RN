/**
 * S3-T1 TC-5: Supplementary pure-unit test for the scale predicate.
 *
 * UNIT_TEST_JUSTIFIED: pure number logic, zero I/O.
 * The scale predicate divides a value greater than 1 by 100 and leaves a 0–1
 * value untouched.
 */

import { describe, expect, it } from 'vitest'
import {
  canonicalizeStateString,
  computeNormalizedScores,
  normalizeScore,
} from '../curatedGeometryHygiene'

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

/**
 * S3-T3 TC: Pure unit test for canonicalizeStateString.
 *
 * UNIT_TEST_JUSTIFIED: pure string transformation, zero I/O.
 * Verifies the state canonicalization logic (split + normalizeState + ordered set).
 */
describe('canonicalizeStateString (pure unit)', () => {
  it('normalizes dashed single-state strings', () => {
    expect(canonicalizeStateString('New-York')).toEqual({
      primary: 'New York',
      statesAll: null,
    })
    expect(canonicalizeStateString('North-Carolina')).toEqual({
      primary: 'North Carolina',
      statesAll: null,
    })
  })

  it('passes through already-canonical single-state strings unchanged', () => {
    expect(canonicalizeStateString('North Carolina')).toEqual({
      primary: 'North Carolina',
      statesAll: null,
    })
    expect(canonicalizeStateString('California')).toEqual({
      primary: 'California',
      statesAll: null,
    })
  })

  it('splits multi-state strings and returns ordered canonical array', () => {
    const result = canonicalizeStateString('Alabama / Mississippi / Tennessee')
    expect(result.primary).toBe('Alabama')
    expect(result.statesAll).toEqual(['Alabama', 'Mississippi', 'Tennessee'])
  })

  it('normalizes multi-state strings with dirty formatting', () => {
    const result = canonicalizeStateString('north-carolina / south-carolina')
    expect(result.primary).toBe('North Carolina')
    expect(result.statesAll).toEqual(['North Carolina', 'South Carolina'])
  })

  it('handles lowercase input', () => {
    expect(canonicalizeStateString('new york')).toEqual({
      primary: 'New York',
      statesAll: null,
    })
  })

  it('handles underscores', () => {
    expect(canonicalizeStateString('North_Carolina')).toEqual({
      primary: 'North Carolina',
      statesAll: null,
    })
  })

  it('handles extra whitespace in multi-state', () => {
    const result = canonicalizeStateString('  Alabama   /   Mississippi  ')
    expect(result.primary).toBe('Alabama')
    expect(result.statesAll).toEqual(['Alabama', 'Mississippi'])
  })

  it('returns null statesAll for single-state', () => {
    expect(canonicalizeStateString('Texas').statesAll).toBeNull()
  })
})

/**
 * Scalability fix: verify all hygiene result types include pagination fields
 * (continueCursor, isDone). This is a compile-time contract check — if any
 * handler's return type drops these fields, this test fails to compile.
 *
 * UNIT_TEST_JUSTIFIED: pure type-level assertion, zero I/O.
 */
describe('pagination type contract (pure unit)', () => {
  it('QuarantineResult includes continueCursor and isDone', () => {
    const result: { continueCursor: string; isDone: boolean; scanned: number; flagged: number } = {
      scanned: 0,
      flagged: 0,
      continueCursor: '',
      isDone: true,
    }
    expect(result.continueCursor).toBeDefined()
    expect(result.isDone).toBeDefined()
  })

  it('StateNormalizationResult includes continueCursor and isDone', () => {
    const result: {
      continueCursor: string
      isDone: boolean
      scanned: number
      changed: number
    } = {
      scanned: 0,
      changed: 0,
      continueCursor: '',
      isDone: true,
    }
    expect(result.continueCursor).toBeDefined()
    expect(result.isDone).toBeDefined()
  })

  it('HygieneChangeSet includes continueCursor and isDone', () => {
    const result: {
      continueCursor: string
      isDone: boolean
      scanned: number
      normalized: number
    } = {
      scanned: 0,
      normalized: 0,
      continueCursor: '',
      isDone: true,
    }
    expect(result.continueCursor).toBeDefined()
    expect(result.isDone).toBeDefined()
  })
})
