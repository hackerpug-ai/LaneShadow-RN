/**
 * GATE-FIX unit: founder top-50 must classify test/seed routeIds as ineligible.
 *
 * UNIT_TEST_JUSTIFIED: pure predicate with zero I/O — same classification
 * rules used by exportTop50Manifest founder-surface filter.
 *
 * TEST_TIER: unit
 */

import { describe, expect, it } from 'vitest'
import { isTestSeedRoute, normalizeCompositeScore } from '../lib/top50Eligibility'

/** Pure ranking mirror of top50Review.sortManifestRows (no geospatial import). */
function sortByNormalizedScore<T extends { compositeScore: number; routeId: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    const nb = normalizeCompositeScore(b.compositeScore)
    const na = normalizeCompositeScore(a.compositeScore)
    if (nb !== na) return nb - na
    return a.routeId.localeCompare(b.routeId)
  })
}

describe('isTestSeedRoute — founder-surface exclusion predicate', () => {
  it('classifies routeIds starting with test: as seed/fixture', () => {
    expect(isTestSeedRoute('test:s5t3-ready-000')).toBe(true)
    expect(isTestSeedRoute('test:couch-001')).toBe(true)
    expect(isTestSeedRoute('test:ai-recon-1')).toBe(true)
    expect(isTestSeedRoute('test:s5t1-lever1-pass')).toBe(true)
    expect(isTestSeedRoute('test:scraped-1')).toBe(true)
  })

  it('classifies routeIds starting with seed: as fixture contamination (REDHAT-FIX-03)', () => {
    expect(isTestSeedRoute('seed:fake')).toBe(true)
    expect(isTestSeedRoute('seed:fake-retire-01')).toBe(true)
    expect(isTestSeedRoute('seed:x')).toBe(true)
  })

  it('classifies names containing Fixture as seed/fixture', () => {
    expect(isTestSeedRoute('real-looking-id', 'S5T3 Fixture Ready 0')).toBe(true)
    expect(isTestSeedRoute('another-id', 'fixture seed route')).toBe(true)
  })

  it('REDHAT-FIX-08: excludes known production-prefixed fixture routeIds (tepusquet)', () => {
    // seedPoCRoute uses motorcycleroads:twist-of-tepusquet-loop without "fixture" in name
    expect(isTestSeedRoute('motorcycleroads:twist-of-tepusquet-loop')).toBe(true)
    expect(
      isTestSeedRoute('motorcycleroads:twist-of-tepusquet-loop', 'Twist of Tepusquet Loop'),
    ).toBe(true)
  })

  it('admits real catalog routeIds without Fixture names', () => {
    expect(isTestSeedRoute('pacific-coast-highway')).toBe(false)
    expect(isTestSeedRoute('cherohala-skyway', 'Cherohala Skyway')).toBe(false)
    expect(isTestSeedRoute('deal-gap', "The Dragon / Deal's Gap")).toBe(false)
    expect(isTestSeedRoute('motorcycleroads:cherohala')).toBe(false)
  })
})

describe('normalizeCompositeScore — REDHAT-FIX-08 scale fix', () => {
  it('maps 0–100 integers onto 0–1 and leaves decimals in place', () => {
    expect(normalizeCompositeScore(85)).toBe(0.85)
    expect(normalizeCompositeScore(0.9)).toBe(0.9)
    expect(normalizeCompositeScore(0.9)).toBeGreaterThan(normalizeCompositeScore(85))
    expect(normalizeCompositeScore(100)).toBe(1)
    expect(normalizeCompositeScore(0)).toBe(0)
    expect(normalizeCompositeScore(Number.NaN)).toBe(0)
  })

  it('normalized ranking ranks decimal 0.9 above integer 85', () => {
    const ordered = sortByNormalizedScore([
      { routeId: 'test:redhatfix08-score-int-85', compositeScore: 85 },
      { routeId: 'test:redhatfix08-score-dec-0.9', compositeScore: 0.9 },
    ])
    expect(ordered[0].routeId).toBe('test:redhatfix08-score-dec-0.9')
    expect(ordered[1].routeId).toBe('test:redhatfix08-score-int-85')
  })
})
