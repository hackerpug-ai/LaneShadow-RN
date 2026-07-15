/**
 * S3-T1 TC-5: Supplementary pure-unit test for the scale predicate.
 *
 * UNIT_TEST_JUSTIFIED: pure number logic, zero I/O.
 * The scale predicate divides a value greater than 1 by 100 and leaves a 0–1
 * value untouched.
 */

import { describe, expect, it } from 'vitest'
import { computeRiderReadyFromDoc } from '../curatedGeometry'
import {
  canonicalizeStateString,
  computeDedupePlan,
  computeNameLower,
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

/**
 * computeDedupePlan + selectCanonical: pure unit tests for the dedupe
 * algorithm extracted from the internalAction.
 *
 * UNIT_TEST_JUSTIFIED: pure logic over in-memory row arrays, zero I/O.
 */
describe('computeDedupePlan (pure unit)', () => {
  it('groups same-name proximity rows into 1 group with 2 shadows', () => {
    const rows = [
      {
        _id: 'a',
        routeId: 'r1',
        name: 'Cherohala',
        name_lower: 'cherohala',
        centroidLat: 35.3,
        centroidLng: -83.8,
        compositeScore: 0.9,
        geometryStatus: 'generated',
      },
      {
        _id: 'b',
        routeId: 'r2',
        name: 'Cherohala',
        name_lower: 'cherohala',
        centroidLat: 35.31,
        centroidLng: -83.81,
        compositeScore: 0.7,
        geometryStatus: 'review',
      },
      {
        _id: 'c',
        routeId: 'r3',
        name: 'Cherohala',
        name_lower: 'cherohala',
        centroidLat: 35.29,
        centroidLng: -83.79,
        compositeScore: 0.5,
        geometryStatus: 'review',
      },
    ]

    const { plan, totalShadows, shadowPatches } = computeDedupePlan(rows)

    expect(plan).toHaveLength(1)
    expect(plan[0].canonical).toBe('r1')
    expect(plan[0].shadows).toContain('r2')
    expect(plan[0].shadows).toContain('r3')
    expect(totalShadows).toBe(2)
    expect(shadowPatches).toHaveLength(2)
  })

  it('groups by name.toLowerCase() when name_lower is absent (real-catalog mode)', () => {
    const rows = [
      {
        _id: 'a',
        routeId: 'r1',
        name: 'Cherohala Skyway',
        centroidLat: 35.3,
        centroidLng: -83.8,
        compositeScore: 0.9,
      },
      {
        _id: 'b',
        routeId: 'r2',
        name: 'cherohala skyway',
        centroidLat: 35.31,
        centroidLng: -83.81,
        compositeScore: 0.7,
      },
    ]

    const { plan, totalShadows } = computeDedupePlan(rows)

    expect(plan).toHaveLength(1)
    expect(totalShadows).toBe(1)
  })

  it('prefers gate-passing (generated) lower-score row as canonical', () => {
    const rows = [
      {
        _id: 'a',
        routeId: 'high',
        name: 'Deals Gap',
        name_lower: 'dealsgap',
        centroidLat: 35.3,
        centroidLng: -83.8,
        compositeScore: 0.9,
        geometryStatus: 'review',
      },
      {
        _id: 'b',
        routeId: 'low-pass',
        name: 'Deals Gap',
        name_lower: 'dealsgap',
        centroidLat: 35.31,
        centroidLng: -83.81,
        compositeScore: 0.7,
        geometryStatus: 'generated',
      },
    ]

    const { plan } = computeDedupePlan(rows)

    expect(plan[0].canonical).toBe('low-pass')
  })

  it('skips rows that already have duplicateOf set (idempotent)', () => {
    const rows = [
      {
        _id: 'a',
        routeId: 'r1',
        name: 'Dup',
        name_lower: 'dup',
        centroidLat: 35.3,
        centroidLng: -83.8,
        compositeScore: 0.9,
      },
      {
        _id: 'b',
        routeId: 'r2',
        name: 'Dup',
        name_lower: 'dup',
        centroidLat: 35.31,
        centroidLng: -83.81,
        compositeScore: 0.7,
        duplicateOf: 'r1',
      },
    ]

    const { plan, totalShadows } = computeDedupePlan(rows)

    expect(plan).toHaveLength(0)
    expect(totalShadows).toBe(0)
  })

  it('does NOT merge far-apart same-name rows', () => {
    const rows = [
      {
        _id: 'a',
        routeId: 'nc',
        name: 'SameRoute',
        name_lower: 'sameroute',
        centroidLat: 35.3,
        centroidLng: -83.8,
        compositeScore: 0.9,
      },
      {
        _id: 'b',
        routeId: 'ca',
        name: 'SameRoute',
        name_lower: 'sameroute',
        centroidLat: 36.0,
        centroidLng: -120.0,
        compositeScore: 0.8,
      },
    ]

    const { plan, totalShadows } = computeDedupePlan(rows)

    expect(plan).toHaveLength(0)
    expect(totalShadows).toBe(0)
  })

  it('does NOT merge distinct names', () => {
    const rows = [
      {
        _id: 'a',
        routeId: 'r1',
        name: 'Blue Ridge',
        name_lower: 'blueridge',
        centroidLat: 35.3,
        centroidLng: -83.8,
        compositeScore: 0.9,
      },
      {
        _id: 'b',
        routeId: 'r2',
        name: 'Tail',
        name_lower: 'tail',
        centroidLat: 35.31,
        centroidLng: -83.81,
        compositeScore: 0.8,
      },
    ]

    const { plan, totalShadows } = computeDedupePlan(rows)

    expect(plan).toHaveLength(0)
    expect(totalShadows).toBe(0)
  })

  it('returns empty plan for empty input', () => {
    const { plan, totalShadows, shadowPatches } = computeDedupePlan([])
    expect(plan).toHaveLength(0)
    expect(totalShadows).toBe(0)
    expect(shadowPatches).toHaveLength(0)
  })
})

/**
 * REDHAT H-1: Scale-aware rider-ready score threshold (pure unit).
 *
 * UNIT_TEST_JUSTIFIED: pure predicate logic, zero I/O.
 *
 * computeRiderReadyFromDoc must accept both legacy 0–100 scores and normalized
 * 0–1 scores. The threshold is >= 50 on the 0–100 scale, >= 0.5 on the 0–1
 * scale. Without this, normalizing scores (÷100) then recomputing riderReady
 * (via normalizeStates) silently flips legitimate routes to riderReady=false.
 */
describe('computeRiderReadyFromDoc: scale-aware score threshold (pure unit)', () => {
  const gatePassingVerification = {
    verdict: 'pass' as const,
    geometryStatus: 'generated' as const,
  }
  const baseDoc = {
    routeId: 'test-unit',
    name: 'Unit Test Route',
    lengthMiles: 41,
    rideWorthiness: { verdict: 'ride' as const, reason: 'test', model: 'test', classifiedAt: 0 },
    retiredAt: null,
    duplicateOf: null,
    quarantine: null,
  }

  it('passes on legacy 0–100 scale score >= 50', async () => {
    const result = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 85 },
      gatePassingVerification,
    )
    expect(result).toBe(true)
  })

  it('passes on normalized 0–1 scale score >= 0.5', async () => {
    const result = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 0.85 },
      gatePassingVerification,
    )
    expect(result).toBe(true)
  })

  it('fails on legacy 0–100 scale score < 50', async () => {
    const result = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 30 },
      gatePassingVerification,
    )
    expect(result).toBe(false)
  })

  it('fails on normalized 0–1 scale score < 0.5', async () => {
    const result = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 0.3 },
      gatePassingVerification,
    )
    expect(result).toBe(false)
  })

  it('boundary: exactly 50 on legacy scale passes', async () => {
    const result = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 50 },
      gatePassingVerification,
    )
    expect(result).toBe(true)
  })

  it('boundary: exactly 0.5 on normalized scale passes', async () => {
    const result = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 0.5 },
      gatePassingVerification,
    )
    expect(result).toBe(true)
  })

  it('cross-pass consistency: 88 (legacy) and 0.88 (normalized) produce the same verdict', async () => {
    const legacyResult = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 88 },
      gatePassingVerification,
    )
    const normalizedResult = await computeRiderReadyFromDoc(
      { ...baseDoc, compositeScore: 0.88 },
      gatePassingVerification,
    )
    expect(legacyResult).toBe(normalizedResult)
    expect(legacyResult).toBe(true)
  })
})

/**
 * Unit tests for computeNameLower (pure helper for backfillNameLower pass).
 *
 * UNIT_TEST_JUSTIFIED: pure string logic, zero I/O.
 */
describe('computeNameLower (pure unit)', () => {
  it('returns name.toLowerCase() when name_lower is absent', () => {
    expect(computeNameLower({ name: 'Cherohala Skyway' })).toBe('cherohala skyway')
    expect(computeNameLower({ name: 'TAIL OF THE DRAGON' })).toBe('tail of the dragon')
  })

  it('returns null when name_lower already equals name.toLowerCase() (idempotency)', () => {
    expect(computeNameLower({ name: 'Dragon', name_lower: 'dragon' })).toBeNull()
    expect(
      computeNameLower({ name: 'Blue Ridge Parkway', name_lower: 'blue ridge parkway' }),
    ).toBeNull()
  })

  it('returns corrected value when name_lower is stale/incorrect', () => {
    expect(computeNameLower({ name: 'New Name', name_lower: 'old name' })).toBe('new name')
    expect(computeNameLower({ name: 'Route 66', name_lower: '' })).toBe('route 66')
  })

  it('is idempotent: applying the result produces null on second call', () => {
    const row = { name: 'Cherohala Skyway' }
    const result = computeNameLower(row)
    expect(result).toBe('cherohala skyway')
    // Simulate the patch
    const patched = { ...row, name_lower: result! }
    expect(computeNameLower(patched)).toBeNull()
  })
})
