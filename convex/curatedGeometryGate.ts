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
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
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

  const ratioResult = evaluateRatioBoundary(args.ratio)
  if (!ratioResult.passes) {
    return { verdict: 'review', failedCondition: 'ratio' }
  }

  return { verdict: 'pass' }
}