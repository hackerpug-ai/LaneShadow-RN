/**
 * Unit tests for scoreToPercent helper (AC-2).
 *
 * Acceptance Criteria:
 * - AC-2 (UNIT_TEST_JUSTIFIED — pure arithmetic, zero I/O):
 *   GIVEN the scoreToPercent helper
 *   WHEN invoked at boundaries (0, 0.5, 0.745, 1, null)
 *   THEN outputs are 0, 50, 75, 100, OMIT_SENTINEL respectively.
 *
 * The integration harness adds no signal at these boundaries — this is a pure
 * closed-form integer-rounding function (no network, no DB, no render, no side
 * effects).
 */

import { describe, expect, it } from 'vitest'

import { OMIT_SENTINEL, scoreToPercent } from '../score-dimension-bar'

describe('scoreToPercent (AC-2)', () => {
  it('returns 0 for score 0', () => {
    expect(scoreToPercent(0)).toBe(0)
  })

  it('returns 50 for score 0.5', () => {
    expect(scoreToPercent(0.5)).toBe(50)
  })

  it('rounds 0.745 to 75 (Math.round, not floor or ceil)', () => {
    // 0.745 * 100 = 74.5; Math.round(74.5) === 75
    expect(scoreToPercent(0.745)).toBe(75)
  })

  it('returns 100 for score 1', () => {
    expect(scoreToPercent(1)).toBe(100)
  })

  it('returns OMIT_SENTINEL for null (graceful omission)', () => {
    expect(scoreToPercent(null)).toBe(OMIT_SENTINEL)
  })

  it('returns OMIT_SENTINEL for undefined (graceful omission)', () => {
    expect(scoreToPercent(undefined)).toBe(OMIT_SENTINEL)
  })

  it('clamps rounding consistently for 0.0064 (~1, not 0)', () => {
    // Verifies Math.round semantics: 0.64 rounds to 1, not truncates to 0
    expect(scoreToPercent(0.0064)).toBe(1)
  })
})
