/**
 * Founder top-50 surface eligibility predicates (pure).
 *
 * Human gate (Sprint 05): top-50 export must not include test/seed fixtures.
 * Prefix-scoped harness exports may intentionally include test: rows.
 */

/**
 * Explicit fixture markers used by S5-T3 / S4 seed paths and retirement fixtures.
 * Includes seed: prefix so founder exports scrub seed-named contamination.
 */
export const TEST_SEED_ROUTE_MARKERS = [
  'test:',
  'seed:',
  'test:couch-',
  'test:ai-recon',
  'test:s5t',
] as const

/**
 * Production-prefixed fixture routeIds that must never appear on unscoped founder
 * surfaces (coverageReport / top-50). REDHAT-FIX-08: twist-of-tepusquet-loop is a
 * known spike-seed fixture with motorcycleroads: prefix that would otherwise pollute.
 */
export const KNOWN_FIXTURE_ROUTE_IDS = new Set<string>(['motorcycleroads:twist-of-tepusquet-loop'])

/**
 * Normalize compositeScore to a 0–1 scale for ranking.
 * Values > 1 are treated as 0–100 integer scale (divide by 100).
 * Values in [0, 1] are left as-is. Non-finite → 0.
 */
export function normalizeCompositeScore(score: number): number {
  if (typeof score !== 'number' || !Number.isFinite(score)) return 0
  if (score > 1) return Math.min(score / 100, 1)
  if (score < 0) return 0
  return score
}

/**
 * True when a route is a test or seed fixture that must never appear on the
 * unscoped founder top-50 / retirement-candidate / coverageReport surface.
 * REDHAT-FIX-08: also excludes known production-prefixed fixture routeIds.
 */
export function isTestSeedRoute(routeId: string, name?: string | null): boolean {
  if (typeof routeId !== 'string' || routeId.length === 0) return false
  if (KNOWN_FIXTURE_ROUTE_IDS.has(routeId)) return true
  if (routeId.startsWith('test:')) return true
  if (routeId.startsWith('seed:')) return true
  for (const marker of TEST_SEED_ROUTE_MARKERS) {
    if (routeId.startsWith(marker) || routeId.includes(marker)) return true
  }
  if (name != null && typeof name === 'string' && /fixture/i.test(name)) return true
  // Spike-seed tags sometimes appear as secondaryTags-only; name/oneLiner heuristics:
  if (
    name != null &&
    typeof name === 'string' &&
    /s5t1 fixture|s5-t1 fixture|spike seed/i.test(name)
  ) {
    return true
  }
  return false
}
