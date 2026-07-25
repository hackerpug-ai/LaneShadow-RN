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
 * True when a route is a test or seed fixture that must never appear on the
 * unscoped founder top-50 / retirement-candidate surface.
 */
export function isTestSeedRoute(routeId: string, name?: string | null): boolean {
  if (typeof routeId !== 'string' || routeId.length === 0) return false
  if (routeId.startsWith('test:')) return true
  if (routeId.startsWith('seed:')) return true
  for (const marker of TEST_SEED_ROUTE_MARKERS) {
    if (routeId.startsWith(marker) || routeId.includes(marker)) return true
  }
  if (name != null && typeof name === 'string' && /fixture/i.test(name)) return true
  return false
}
