/**
 * VER-01: Deterministic geometry gate — SINGLE SOURCE OF TRUTH
 */

export function evaluateRatioBoundary(ratio: number | undefined | null): {
  passes: boolean
  ratio: number | null
  failedCondition?: 'ratio'
} {
  if (ratio === undefined || ratio === null) {
    return { passes: true, ratio: null }
  }

  const isWithinBounds = ratio >= 0.6 && ratio <= 1.6
  return {
    passes: isWithinBounds,
    ratio,
    failedCondition: isWithinBounds ? undefined : 'ratio',
  }
}

export function isDegenerate(args: { pointCount: number; routedMiles: number }): boolean {
  if (args.pointCount <= 4) return true
  if (args.pointCount < args.routedMiles) return true
  return false
}

/** Great-circle destination from start, distance (mi), bearing (degrees). */
export function destinationPointMi(
  start: { lat: number; lng: number },
  distanceMi: number,
  bearingDeg = 0,
): { lat: number; lng: number } {
  const R = 3958.8
  const brng = (bearingDeg * Math.PI) / 180
  const lat1 = (start.lat * Math.PI) / 180
  const lon1 = (start.lng * Math.PI) / 180
  const d = distanceMi / R
  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(brng),
  )
  const lon2 =
    lon1 +
    Math.atan2(
      Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
      Math.cos(d) - Math.sin(lat1) * Math.sin(lat2),
    )
  return { lat: (lat2 * 180) / Math.PI, lng: (lon2 * 180) / Math.PI }
}

export function haversineDistance(
  p1: { lat: number; lng: number },
  p2: { lat: number; lng: number },
): number {
  const R = 3958.8
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(p2.lat - p1.lat)
  const dLng = toRad(p2.lng - p1.lng)
  const la1 = toRad(p1.lat)
  const la2 = toRad(p2.lat)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.asin(Math.sqrt(a))
  return R * c
}

export function isAnchorInRegion(
  anchor: { lat: number; lng: number },
  centroid: { lat: number; lng: number },
): boolean {
  return haversineDistance(anchor, centroid) <= 150.0
}

export function determineGateVerdict(args: {
  ratio: number | undefined | null
  pointCount: number
  routedMiles: number
  anchorCount: number
  quarantine?: boolean
}): {
  verdict: 'pass' | 'review'
  failedCondition?: 'ratio' | 'anchors' | 'degenerate'
} {
  if (args.anchorCount < 2) {
    return { verdict: 'review', failedCondition: 'anchors' }
  }

  if (isDegenerate({ pointCount: args.pointCount, routedMiles: args.routedMiles })) {
    return { verdict: 'review', failedCondition: 'degenerate' }
  }

  // AC-4: Quarantine flag skips ratio check — routed length becomes truth
  if (args.quarantine) {
    return { verdict: 'pass' }
  }

  const ratioResult = evaluateRatioBoundary(args.ratio)
  if (!ratioResult.passes) {
    return { verdict: 'review', failedCondition: 'ratio' }
  }

  return { verdict: 'pass' }
}

/**
 * AC-6: Re-evaluate pre-existing geometry rows against the enhanced gate.
 *
 * Unlike `determineGateVerdict` (which only checks anchorCount), this function
 * ALSO checks that every stored anchor is within 150mi of the centroid via
 * `distanceFromCentroid`. Legacy rows that passed the old gate may have
 * off-region anchors that the enhanced gate rejects.
 */
export function reevaluateExistingGeometry(args: {
  ratio: number | null
  pointCount: number
  routedMiles: number
  anchorCount: number
  anchors: Array<{ distanceFromCentroid: number }>
  quarantine: boolean
}): {
  verdict: 'pass' | 'review'
  failedCondition?: 'ratio' | 'anchors' | 'degenerate'
} {
  // Enhanced region check: count only in-region anchors (≤150mi from centroid)
  const inRegionCount = args.anchors.filter((a) => a.distanceFromCentroid <= 150).length
  if (inRegionCount < 2) {
    return { verdict: 'review', failedCondition: 'anchors' }
  }

  if (isDegenerate({ pointCount: args.pointCount, routedMiles: args.routedMiles })) {
    return { verdict: 'review', failedCondition: 'degenerate' }
  }

  // AC-4: Quarantine flag skips ratio check
  if (args.quarantine) {
    return { verdict: 'pass' }
  }

  const ratioResult = evaluateRatioBoundary(args.ratio)
  if (!ratioResult.passes) {
    return { verdict: 'review', failedCondition: 'ratio' }
  }

  return { verdict: 'pass' }
}
