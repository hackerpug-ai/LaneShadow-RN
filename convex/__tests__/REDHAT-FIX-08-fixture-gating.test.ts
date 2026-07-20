/**
 * REDHAT-FIX-08: Gate waterfall/review fixture seams to operator/founder.
 *
 * seedWaterfallFixtures, teardownWaterfallFixtures, seedReviewQueueEntry,
 * seedPassedSampleRoutes, and seedCostBurnRoutes must NOT be callable by
 * any authenticated user — they must require operator/founder role.
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('FIX-08: Fixture mutations gate to operator/founder', () => {
  it('seedWaterfallFixtures uses requireOperator or requireFounder', () => {
    const source = readFileSync(resolve(__dirname, '../waterfallOrchestrator.ts'), 'utf-8')

    // Find the seedWaterfallFixtures handler
    const seedStart = source.indexOf('seedWaterfallFixtures = mutation')
    expect(seedStart).toBeGreaterThan(-1)
    const seedSection = source.slice(seedStart, seedStart + 400)

    // After fix: uses requireOperator or requireFounder, NOT just requireIdentity
    const usesOperatorOrFounder =
      seedSection.includes('requireOperator') || seedSection.includes('requireFounder')
    const usesRequireIdentity = seedSection.includes('requireIdentity')

    // RED phase: only requireIdentity — FAILS
    expect(usesOperatorOrFounder).toBe(true)
    // After fix: should NOT use bare requireIdentity
    expect(usesRequireIdentity).toBe(false)
  })

  it('teardownWaterfallFixtures uses requireOperator or requireFounder', () => {
    const source = readFileSync(resolve(__dirname, '../waterfallOrchestrator.ts'), 'utf-8')

    const teardownStart = source.indexOf('teardownWaterfallFixtures = mutation')
    expect(teardownStart).toBeGreaterThan(-1)
    const teardownSection = source.slice(teardownStart, teardownStart + 400)

    const usesOperatorOrFounder =
      teardownSection.includes('requireOperator') || teardownSection.includes('requireFounder')
    const usesRequireIdentity = teardownSection.includes('requireIdentity')

    expect(usesOperatorOrFounder).toBe(true)
    expect(usesRequireIdentity).toBe(false)
  })

  it('seedReviewQueueEntry uses requireOperator or requireFounder', () => {
    const source = readFileSync(resolve(__dirname, '../reviewQueue.ts'), 'utf-8')

    const seedStart = source.indexOf('seedReviewQueueEntry = mutation')
    expect(seedStart).toBeGreaterThan(-1)
    const seedSection = source.slice(seedStart, seedStart + 400)

    const usesOperatorOrFounder =
      seedSection.includes('requireOperator') || seedSection.includes('requireFounder')
    const usesRequireIdentity = seedSection.includes('requireIdentity')

    expect(usesOperatorOrFounder).toBe(true)
    expect(usesRequireIdentity).toBe(false)
  })

  it('seedPassedSampleRoutes and seedCostBurnRoutes are also gated', () => {
    const source = readFileSync(resolve(__dirname, '../waterfallOrchestrator.ts'), 'utf-8')

    for (const fnName of ['seedPassedSampleRoutes', 'seedCostBurnRoutes']) {
      const fnStart = source.indexOf(`${fnName} = mutation`)
      expect(fnStart).toBeGreaterThan(-1)
      const fnSection = source.slice(fnStart, fnStart + 400)

      const usesOperatorOrFounder =
        fnSection.includes('requireOperator') || fnSection.includes('requireFounder')
      const usesRequireIdentity = fnSection.includes('requireIdentity')

      // RED phase: only requireIdentity — FAILS
      expect(usesOperatorOrFounder).toBe(true)
      expect(usesRequireIdentity).toBe(false)
    }
  })
})
