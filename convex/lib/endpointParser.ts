/**
 * Deterministic A-to-B / road-name endpoint parser for Lever 3 (UC-REC-03).
 *
 * Zero LLM. Pure regex extraction over route names.
 * Extracted from the retired Nominatim path's module-local `parseRouteEndpoints`
 * and extended for highway-ref + "from X to Y" patterns.
 */

export type AtoBParse = {
  kind: 'ato_b'
  endpoints: [string, string]
  /** Always false — this parser never calls an LLM. */
  usedLlm: false
}

export type HighwayParse = {
  kind: 'highway'
  highwayNumber: string
  region: string
  /** Geocodeable endpoint labels derived from the highway structure. */
  endpoints: [string, string]
  usedLlm: false
}

export type RouteNameParse = AtoBParse | HighwayParse

export type ParseRouteNameResult = RouteNameParse | null

/**
 * Strip parenthetical cruft and normalize whitespace.
 */
function cleanName(name: string): string {
  return name
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Highway-ref pattern: "Route 680 — Alameda County", "Hwy 246 - Roswell area",
 * "US 9W : Fort Montgomery - Rockleigh" is handled as A-to-B after prefix drop.
 */
function parseHighway(name: string): HighwayParse | null {
  const cleaned = cleanName(name)
  // "Route 680 — Alameda County" / "Hwy 1 – Big Sur" / "Rt 66 — Route 66 Museum area"
  const hwy = cleaned.match(
    /^(?:US|SR|Hwy|CA|I|Interstate|Route|Rt)\.?\s*([A-Za-z]?\d+[A-Za-z]?)\s*[-–—:]\s*(.+)$/i,
  )
  if (!hwy) return null
  const highwayNumber = hwy[1]
  const region = hwy[2].trim()
  if (!region || region.length < 2) return null
  // Endpoint labels for geocoding: southern + northern extents of the highway
  // in the named region. Callers append state for region bias.
  return {
    kind: 'highway',
    highwayNumber,
    region,
    endpoints: [
      `Route ${highwayNumber} south, ${region}`,
      `Route ${highwayNumber} north, ${region}`,
    ],
    usedLlm: false,
  }
}

/**
 * A-to-B / from-to / dash-separated place chains.
 *
 * Examples:
 *   "from San Francisco to Santa Cruz" → [San Francisco, Santa Cruz]
 *   "San Francisco to Santa Cruz — Coastal Run" → [San Francisco, Santa Cruz]
 *   "Naples to Key West" → [Naples, Key West]
 *   "US 9W : Fort Montgomery - Rockleigh" → [Fort Montgomery, Rockleigh]
 *   "Hwy 246 - Roswell to Capitan" → [Roswell, Capitan]
 */
function parseAtoB(name: string): AtoBParse | null {
  let s = cleanName(name)

  // Prefer explicit "from X to Y" (optionally with a trailing dash description).
  const fromTo = s.match(/^from\s+(.+?)\s+to\s+(.+?)(?:\s*[-–—].*)?$/i)
  if (fromTo) {
    const a = fromTo[1].trim()
    // Drop trailing " — description" from the second capture if present.
    const b = fromTo[2].replace(/\s*[-–—].*$/, '').trim()
    if (a.length > 1 && b.length > 1) {
      return { kind: 'ato_b', endpoints: [a, b], usedLlm: false }
    }
  }

  // "X to Y — description" / "X to Y"
  const plainTo = s.match(/^(.+?)\s+to\s+(.+?)(?:\s*[-–—].*)?$/i)
  if (plainTo) {
    const a = plainTo[1]
      // Drop a leading highway-ref token: "Hwy 246 - Roswell to Capitan" handled below.
      .replace(/^(?:US|SR|Hwy|CA|VA|WV|NC|CT|I|Route|Rt)\.?\s*\w+\s*[-–—]\s*/i, '')
      .trim()
    const b = plainTo[2].replace(/\s*[-–—].*$/, '').trim()
    if (a.length > 1 && b.length > 1 && !/^(?:US|SR|Hwy|Route|Rt)\b/i.test(a)) {
      return { kind: 'ato_b', endpoints: [a, b], usedLlm: false }
    }
  }

  // Drop a leading "<ref or label> :" prefix — take the part after the last " : ".
  const colonParts = s.split(/\s+:\s+/)
  if (colonParts.length >= 2) s = colonParts[colonParts.length - 1]

  // Drop a leading highway-ref token when there was no colon
  //   ("Hwy 246 - Roswell to Capitan" -> "Roswell to Capitan").
  s = s.replace(/^(?:US|SR|Hwy|CA|VA|WV|NC|CT|Route|Rt)\.?\s*\w+\s*[-–—]\s*/i, '')

  // After prefix drop, try "to" again.
  const afterPrefixTo = s.match(/^(.+?)\s+to\s+(.+?)(?:\s*[-–—].*)?$/i)
  if (afterPrefixTo) {
    const a = afterPrefixTo[1].trim()
    const b = afterPrefixTo[2].replace(/\s*[-–—].*$/, '').trim()
    if (a.length > 1 && b.length > 1) {
      return { kind: 'ato_b', endpoints: [a, b], usedLlm: false }
    }
  }

  // Split on " - " / " – " / " — ".
  const parts = s
    .split(/\s+[-–—]\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 1)
  if (parts.length < 2) return null

  // First + last token bound the road (for 3+ town chains, the ends are the route ends).
  return {
    kind: 'ato_b',
    endpoints: [parts[0], parts[parts.length - 1]],
    usedLlm: false,
  }
}

/**
 * Parse a curated route name into A-to-B endpoints or a highway-ref structure.
 * Returns null when the name has no recoverable structure (e.g. "Cherohala Skyway").
 *
 * Guarantees: `usedLlm` is always false; no network, no LLM, pure string logic.
 */
export function parseRouteName(name: string): ParseRouteNameResult {
  if (!name?.trim()) return null

  // Highway-ref with region is more specific than a bare dash split on the same string.
  const hwy = parseHighway(name)
  if (hwy) return hwy

  return parseAtoB(name)
}

/**
 * Back-compat shape used by the retired Nominatim path and CAP-GEO-06 hop docs.
 * Returns [start, end] place tokens, or null.
 */
export function parseRouteEndpoints(name: string): [string, string] | null {
  const parsed = parseRouteName(name)
  if (!parsed) return null
  return parsed.endpoints
}

/**
 * Build the Google Geocoding `bounds` viewport string for a centroid ±1.2°.
 * Format: `swLat,swLng|neLat,neLng` (Google Geocoding API).
 */
export function geocodeBoundsForCentroid(centroid: { lat: number; lng: number }): string {
  const d = 1.2
  const round = (n: number) => Math.round(n * 1e6) / 1e6
  return `${round(centroid.lat - d)},${round(centroid.lng - d)}|${round(centroid.lat + d)},${round(centroid.lng + d)}`
}
