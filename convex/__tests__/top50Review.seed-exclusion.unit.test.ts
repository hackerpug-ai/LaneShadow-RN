/**
 * GATE-FIX unit: founder top-50 must classify test/seed routeIds as ineligible.
 *
 * UNIT_TEST_JUSTIFIED: pure predicate with zero I/O — same classification
 * rules used by exportTop50Manifest founder-surface filter.
 *
 * TEST_TIER: unit
 */

import { describe, expect, it } from 'vitest'
import { isTestSeedRoute } from '../lib/top50Eligibility'

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

  it('admits real catalog routeIds without Fixture names', () => {
    expect(isTestSeedRoute('pacific-coast-highway')).toBe(false)
    expect(isTestSeedRoute('cherohala-skyway', 'Cherohala Skyway')).toBe(false)
    expect(isTestSeedRoute('deal-gap', "The Dragon / Deal's Gap")).toBe(false)
    expect(isTestSeedRoute('motorcycleroads:cherohala')).toBe(false)
  })
})
