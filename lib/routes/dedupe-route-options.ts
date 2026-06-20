/**
 * deduplicateRouteOptions
 *
 * Pure reducer that collapses efficiency-variant duplicates from a route options array.
 *
 * Deduplication key: label + distanceMeters + overviewGeometry
 * When two routes are byte-identical on this key, only the first occurrence is kept.
 *
 * This is a safety net for client-side dedup; the backend (DATA-009) also reduces
 * duplicates at the source. The carousel pages through genuinely distinct routes only.
 *
 * Returns a new array with duplicates removed; input is never mutated.
 * Preserves input order. Handles undefined/null geometry safely (no throw).
 */

import type { PlannedRouteOptionView } from '../../shared/types/routes'

/**
 * Generates a dedup key for a route option based on label + distance + geometry.
 * Returns a string that uniquely identifies a distinct route.
 *
 * @param option The route option to generate a key for
 * @returns A string key that combines label, distance, and geometry
 */
function getDedupeKey(option: PlannedRouteOptionView): string {
  const label = option.label || ''
  const distance = option.stats.distanceMeters ?? 0
  const geometry = option.map.overviewGeometry ?? 'UNDEFINED'

  // Create a composite key: label|distance|geometry
  // This uniquely identifies a distinct route while being agnostic to efficiency variants
  return `${label}|${distance}|${geometry}`
}

/**
 * Deduplicates route options by collapsing efficiency variants (routes with the same
 * label, distance, and overviewGeometry) into a single entry. First occurrence wins.
 *
 * @param options The array of route options (may contain duplicates)
 * @returns A new array with duplicates removed; order preserved
 */
export function deduplicateRouteOptions(
  options: PlannedRouteOptionView[],
): PlannedRouteOptionView[] {
  if (!options || options.length === 0) {
    return []
  }

  // Track which dedup keys we've already seen
  const seenKeys = new Set<string>()
  const distinct: PlannedRouteOptionView[] = []

  // Iterate through options; only include the first occurrence of each key
  for (const option of options) {
    const key = getDedupeKey(option)

    if (!seenKeys.has(key)) {
      seenKeys.add(key)
      distinct.push(option)
    }
  }

  return distinct
}
