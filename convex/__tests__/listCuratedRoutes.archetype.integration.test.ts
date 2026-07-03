/**
 * REDHAT-FIX-002 / DATA-002 AC-3: archetype gate DB write-back purity.
 *
 * Proves the archetype mapping gate in listCuratedRoutes is read-path only:
 * exercising it with archetypes=['scenic'] performs ZERO write-back to the
 * stored curated_routes.primaryArchetype values.
 *
 * listCuratedRoutesInternal is the internal query that bypasses Clerk — it
 * returns the same route cards as listCuratedRoutes (output of buildRouteCard),
 * so a card's `primaryArchetype` is a deterministic function of the stored DB
 * value. If the stored value mutated, the card output would change. Comparing
 * card outputs before/after exercising the gate IS therefore a valid write-back
 * purity test.
 *
 * Strategy (sample ≥20 rows by routeId, exercise, re-sample, compare):
 *   1. pre-sample  20 cards via listCuratedRoutesInternal {limit:20,sort:'best'}
 *   2. exercise    the archetype gate via listCuratedRoutesInternal {archetypes:['scenic']}
 *   3. post-sample the same 20 cards via listCuratedRoutesInternal {limit:20,sort:'best'}
 *   4. assert all 20 primaryArchetype values byte-identical (zero mutations)
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const SAMPLE_SIZE = 20

type RouteCard = {
  routeId: string
  primaryArchetype: string
  state: string
}

/**
 * Run listCuratedRoutesInternal (the internal query that bypasses Clerk) against
 * the live dev deployment via `npx convex run`. Returns the JSON array of route
 * cards. Throws on non-zero exit so a deployment regression surfaces as a test
 * failure rather than a silent false-positive.
 */
const runInternal = (args: Record<string, unknown>): RouteCard[] => {
  const stdout = execFileSync(
    'npx',
    ['convex', 'run', 'curatedRoutes:listCuratedRoutesInternal', JSON.stringify(args)],
    {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 30000,
      stdio: ['pipe', 'pipe', 'pipe'],
    },
  )
  return JSON.parse(stdout) as RouteCard[]
}

describe('REDHAT-FIX-002 AC-1: archetype gate DB write-back purity', () => {
  it('gatePerformsNoDbWriteBack', () => {
    // GIVEN: a sample of 20 curated_routes rows on live dev (snapshot primaryArchetype per routeId)
    const preSample = runInternal({ limit: SAMPLE_SIZE, sort: 'best' })
    expect(preSample.length, 'pre-sample must contain >= 20 rows').toBeGreaterThanOrEqual(
      SAMPLE_SIZE,
    )
    const preById = new Map(preSample.map((c) => [c.routeId, c.primaryArchetype]))

    // WHEN: the archetype mapping gate is exercised via listCuratedRoutes with archetypes=['scenic']
    runInternal({ archetypes: ['scenic'], limit: SAMPLE_SIZE, sort: 'best' })

    // Re-read the same 20 rows (identical args to the initial sample — by_composite_score is stable)
    const postSample = runInternal({ limit: SAMPLE_SIZE, sort: 'best' })
    expect(postSample.length, 'post-sample must contain >= 20 rows').toBeGreaterThanOrEqual(
      SAMPLE_SIZE,
    )

    // THEN: the full 20-row sample is present in both snapshots AND every primaryArchetype is byte-identical
    const matched = postSample.filter((c) => preById.has(c.routeId))
    expect(matched.length, 'must compare the full 20-row sample').toBeGreaterThanOrEqual(
      SAMPLE_SIZE,
    )

    let changed = 0
    for (const card of matched) {
      const before = preById.get(card.routeId)
      if (before !== card.primaryArchetype) changed += 1
    }
    expect(changed, 'no sampled primaryArchetype may mutate (read-path only)').toBe(0)

    // Explicit per-route equality (negative control: any write-back or migration
    // normalizing the stored DB enum fails here).
    for (const card of matched) {
      expect(card.primaryArchetype).toBe(preById.get(card.routeId))
    }
  }, 120000)
})
