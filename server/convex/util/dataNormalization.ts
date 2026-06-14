/**
 * Normalize a state string: trim, replace dashes/hyphens with spaces,
 * and title-case each word. Both "North-Carolina" and "north carolina"
 * normalize to "North Carolina".
 */
export function normalizeState(s: string): string {
  return s
    .trim()
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Given a length in miles, return it only if it's a positive number
 * within a reasonable ceiling. Otherwise return undefined.
 * Values <=0 or >ceiling (default 1000) return undefined.
 */
export function clampLength(mi: number | undefined | null, ceiling = 1000): number | undefined {
  if (mi == null || typeof mi !== 'number' || isNaN(mi) || mi <= 0 || mi > ceiling) {
    return undefined
  }
  return mi
}

/**
 * Given a raw state string from the DB, return all spelling variants
 * to probe in the by_state index. E.g. "North Carolina" → ["North Carolina", "North-Carolina"].
 * This ensures a state filter matches both spellings.
 */
export function stateVariants(s: string): string[] {
  const normalized = normalizeState(s)
  const dashed = normalized.replace(/ /g, '-')
  // Return both the space and dash variants (deduplicated)
  const variants = [normalized]
  if (dashed !== normalized) {
    variants.push(dashed)
  }
  return variants
}