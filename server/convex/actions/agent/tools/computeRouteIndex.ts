'use node'

import type { RouteIndex, RouteSnapshot } from '../../../../models/saved-routes'
import { traceableToolSync } from '../lib/tracing'

const FNV_OFFSET = 0x811c9dc5
const FNV_PRIME = 0x01000193
const MAX_SAMPLED_POINTS = 200

const fnv1a32 = (input: string): string => {
  let hash = FNV_OFFSET
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i)
    hash = (hash * FNV_PRIME) >>> 0
  }
  return hash.toString(16).padStart(8, '0')
}

const buildFingerprintInput = (route: RouteSnapshot): string => {
  const legParts = route.legs
    .map(
      (leg) =>
        `${leg.distanceMeters}|${leg.durationSeconds}|${leg.geometry.encoding}|${leg.geometry.precision}|${leg.geometry.value}`
    )
    .join(';')
  return `${route.provider}|${route.overviewGeometry.encoding}|${route.overviewGeometry.precision}|${route.overviewGeometry.value}|${legParts}`
}

const interpolatePoint = (
  start: { lat: number; lng: number },
  end: { lat: number; lng: number },
  t: number
): { lat: number; lng: number } => ({
  lat: start.lat + (end.lat - start.lat) * t,
  lng: start.lng + (end.lng - start.lng) * t,
})

type LegAllocation = {
  legIndex: number
  points: number
  startDistance: number
  legDistance: number
}

const allocatePointsPerLeg = (
  totalPoints: number,
  legs: { distanceMeters: number; legIndex: number }[]
): LegAllocation[] => {
  const totalDistance = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0)
  if (totalDistance === 0) {
    return legs.map((leg, idx) => ({
      legIndex: leg.legIndex,
      points: idx === 0 ? totalPoints : 0,
      startDistance: 0,
      legDistance: 0,
    }))
  }
  let remainingPoints = totalPoints
  const allocations: LegAllocation[] = []
  let cumulativeDistance = 0

  legs.forEach((leg, idx) => {
    const proportion = leg.distanceMeters / totalDistance
    let pointsForLeg = Math.max(1, Math.round(totalPoints * proportion))
    if (idx === legs.length - 1) {
      pointsForLeg = remainingPoints
    }
    remainingPoints -= pointsForLeg
    allocations.push({
      legIndex: leg.legIndex,
      points: pointsForLeg,
      startDistance: cumulativeDistance,
      legDistance: leg.distanceMeters,
    })
    cumulativeDistance += leg.distanceMeters
  })

  return allocations
}

const computeRouteIndexImpl = (routeSnapshot: RouteSnapshot): RouteIndex => {
  const fingerprintInput = buildFingerprintInput(routeSnapshot)
  const routeFingerprint = `fnv1a:${fnv1a32(fingerprintInput)}`

  const points: RouteIndex['sampledPoints'] = []

  const totalLegDistance = routeSnapshot.legs.reduce((sum, leg) => sum + leg.distanceMeters, 0)
  if (totalLegDistance === 0 || routeSnapshot.legs.length === 0) {
    points.push({
      lat: routeSnapshot.origin.lat,
      lng: routeSnapshot.origin.lng,
      distanceFromStartMeters: 0,
    })
    return { routeFingerprint, sampledPoints: points }
  }

  const allocations = allocatePointsPerLeg(
    MAX_SAMPLED_POINTS,
    routeSnapshot.legs.map((leg) => ({
      distanceMeters: leg.distanceMeters,
      legIndex: leg.legIndex,
    }))
  )

  allocations.forEach((allocation) => {
    const leg = routeSnapshot.legs.find((l) => l.legIndex === allocation.legIndex)
    if (!leg || allocation.points <= 0) return

    const startPoint = { lat: leg.start.lat, lng: leg.start.lng }
    const endPoint = { lat: leg.end.lat, lng: leg.end.lng }

    for (let i = 0; i < allocation.points; i += 1) {
      const t = allocation.points === 1 ? 0 : i / (allocation.points - 1)
      const position = interpolatePoint(startPoint, endPoint, t)
      const distanceFromStart = allocation.startDistance + leg.distanceMeters * t

      points.push({
        lat: position.lat,
        lng: position.lng,
        distanceFromStartMeters: distanceFromStart,
      })
    }
  })

  // Ensure first and last are present and ordered by distance
  points.sort((a, b) => a.distanceFromStartMeters - b.distanceFromStartMeters)
  const first = points[0]
  const last = points[points.length - 1]
  if (first.lat !== routeSnapshot.origin.lat || first.lng !== routeSnapshot.origin.lng) {
    points.unshift({
      lat: routeSnapshot.origin.lat,
      lng: routeSnapshot.origin.lng,
      distanceFromStartMeters: 0,
    })
  }
  if (last.lat !== routeSnapshot.destination.lat || last.lng !== routeSnapshot.destination.lng) {
    points.push({
      lat: routeSnapshot.destination.lat,
      lng: routeSnapshot.destination.lng,
      distanceFromStartMeters: totalLegDistance,
    })
  }

  // Bound output to MAX_SAMPLED_POINTS (including endpoints), deterministically.
  // This keeps overlay/analytics payloads small while preserving coverage.
  if (points.length > MAX_SAMPLED_POINTS) {
    const firstPoint = points[0]
    const lastPoint = points[points.length - 1]
    const interior = points.slice(1, -1)

    const targetInteriorCount = Math.max(0, MAX_SAMPLED_POINTS - 2)
    const selectedInterior: (typeof interior)[number][] = []

    if (interior.length <= targetInteriorCount) {
      selectedInterior.push(...interior)
    } else if (targetInteriorCount > 0) {
      const lastInteriorIndex = interior.length - 1
      const slots = targetInteriorCount - 1
      for (let i = 0; i < targetInteriorCount; i += 1) {
        const idx = slots === 0 ? 0 : Math.round((i * lastInteriorIndex) / slots)
        selectedInterior.push(interior[idx])
      }
    }

    const bounded = [firstPoint, ...selectedInterior, lastPoint]
    return { routeFingerprint, sampledPoints: bounded }
  }

  return { routeFingerprint, sampledPoints: points }
}

export const computeRouteIndex = traceableToolSync(computeRouteIndexImpl, {
  name: 'computeRouteIndex',
  runType: 'tool',
  tags: ['planRide', 'routing'],
})
