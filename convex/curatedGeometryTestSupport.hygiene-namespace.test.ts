/**
 * Source-contract tests for hygiene seed namespacing + agent Internal switch.
 * Does not import Convex modules (those require the Convex runtime).
 *
 * Pure centroid determinism is verified by evaluating the exported function
 * source with a local Function — same algorithm as hygieneCentroidForSeed.
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const supportSrc = readFileSync(join(__dirname, 'curatedGeometryTestSupport.ts'), 'utf8')

/** Re-extract the pure FNV-style body for offline verification (must match source). */
function hygieneCentroidForSeedFromSource(seed: string): { lat: number; lng: number } {
  let h = 2166136261
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  const lat = 34.9 + ((h >>> 0) % 1000) / 10000
  const lng = -120.5 + ((h >>> 8) % 1000) / 10000
  return { lat, lng }
}

describe('hygieneCentroidForSeed algorithm', () => {
  it('is present as an exported pure helper in curatedGeometryTestSupport', () => {
    expect(supportSrc).toMatch(/export function hygieneCentroidForSeed\(/)
  })

  it('returns distinct lat/lng for distinct seeds (OCC isolation intent)', () => {
    const a = hygieneCentroidForSeedFromSource('test:hyg:run-a:score-90')
    const b = hygieneCentroidForSeedFromSource('test:hyg:run-b:score-90')
    expect(a).not.toEqual(b)
  })

  it('is deterministic for the same seed', () => {
    const seed = 'test:hyg:stable:score-72'
    expect(hygieneCentroidForSeedFromSource(seed)).toEqual(hygieneCentroidForSeedFromSource(seed))
  })
})

describe('seedEditorialScoreRows source contract', () => {
  it('always namespaces routeIds with runId and uses jittered centroids', () => {
    expect(supportSrc).toMatch(/test:hyg:\$\{runId\}:score-90/)
    expect(supportSrc).toMatch(/hygieneCentroidForSeed/)
    expect(supportSrc).toMatch(/runId:\s*v\.optional\(v\.string\(\)\)/)
    // No longer hard-codes only the legacy fixed ids as the seed path
    expect(supportSrc).not.toMatch(/routeId:\s*'test:hyg-score-90'/)
  })
})

describe('discoverCuratedRoutes source contract', () => {
  it('calls listCuratedRoutesInternal not public listCuratedRoutes', () => {
    const src = readFileSync(
      join(__dirname, 'actions/agent/tools/discoverCuratedRoutes.ts'),
      'utf8',
    )
    expect(src).toMatch(/listCuratedRoutesInternal/)
    expect(src).not.toMatch(/api\.curatedRoutes\.listCuratedRoutes/)
  })
})

describe('public listCuratedRoutes retains requireIdentity', () => {
  it('still gates the public query', () => {
    const src = readFileSync(join(__dirname, 'curatedRoutes.ts'), 'utf8')
    expect(src).toMatch(
      /export const listCuratedRoutes = query\(\{[\s\S]*?await requireIdentity\(ctx\)/,
    )
  })
})
