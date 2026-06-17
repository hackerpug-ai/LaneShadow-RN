'use node'
import type {
  RouteIndex,
  RouteSnapshot,
  WindLegendItem,
  WindOverlay,
  WindOverlayByLeg,
  WindOverlaySegment,
} from '../../../../shared/models/saved-routes'
import { traceableToolSync } from '../lib/tracing'
import type { ProbedWindPoint } from './probeConditions'

const MODEL_VERSION = 'open-meteo:v1'

const legend: WindLegendItem[] = [
  { level: 'low', label: 'Low', range: { min: 0, max: 6, unit: 'm/s' } },
  { level: 'moderate', label: 'Moderate', range: { min: 6, max: 10, unit: 'm/s' } },
  { level: 'high', label: 'High', range: { min: 10, unit: 'm/s' } },
]

const toMps = (value: number, unit: 'km/h' | 'm/s'): number => {
  return unit === 'km/h' ? value / 3.6 : value
}

const degToRad = (deg: number): number => (deg * Math.PI) / 180
const radToDeg = (rad: number): number => (rad * 180) / Math.PI

const normalizeDeg = (deg: number): number => {
  const d = deg % 360
  return d < 0 ? d + 360 : d
}

const bearingBetween = (
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
): number => {
  const lat1 = degToRad(from.lat)
  const lat2 = degToRad(to.lat)
  const dLon = degToRad(to.lng - from.lng)
  const y = Math.sin(dLon) * Math.cos(lat2)
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)
  const brng = radToDeg(Math.atan2(y, x))
  return normalizeDeg(brng)
}

const levelFromWind = (
  windSpeed: number,
  windDirection: number,
  routeBearing: number,
  gust?: number,
) => {
  const angleDiff = degToRad(Math.abs(normalizeDeg(windDirection - routeBearing)))
  const crosswind = Math.abs(windSpeed * Math.sin(angleDiff))
  const gustMps = gust ?? 0

  // Thresholds in m/s (POC; tune as needed)
  if (crosswind >= 10 || gustMps >= 12) return 'high'
  if (crosswind >= 6) return 'moderate'
  return 'low'
}

const buildLegOffsets = (
  routeSnapshot: RouteSnapshot,
): { legIndex: number; start: number; distance: number }[] => {
  const offsets: { legIndex: number; start: number; distance: number }[] = []
  let cumulative = 0
  routeSnapshot.legs.forEach((leg) => {
    offsets.push({ legIndex: leg.legIndex, start: cumulative, distance: leg.distanceMeters })
    cumulative += leg.distanceMeters
  })
  return offsets
}

const findLegForDistance = (
  distance: number,
  offsets: { legIndex: number; start: number; distance: number }[],
): { legIndex: number; start: number; distance: number } | null => {
  for (const leg of offsets) {
    if (distance >= leg.start && distance <= leg.start + leg.distance) return leg
  }
  return null
}

export type MapConditionsParams = {
  routeSnapshot: RouteSnapshot
  routeIndex: RouteIndex
  probed: ProbedWindPoint[]
}

/**
 * Throws on mapping failures; caller (planRide) should catch and return
 * conditionsStatus='unavailable' and omit overlays per soft-fail contract.
 */
const mapConditionsImpl = ({
  routeSnapshot,
  routeIndex,
  probed,
}: MapConditionsParams): WindOverlay => {
  if (!probed.length) {
    throw new Error('CONDITIONS_LOOKUP_FAILED')
  }

  const offsets = buildLegOffsets(routeSnapshot)

  // Precompute route bearings from routeIndex points (same cardinality as sampled points - 1)
  const bearings: number[] = []
  for (let i = 0; i < routeIndex.sampledPoints.length - 1; i += 1) {
    const a = routeIndex.sampledPoints[i]
    const b = routeIndex.sampledPoints[i + 1]
    bearings.push(bearingBetween({ lat: a.lat, lng: a.lng }, { lat: b.lat, lng: b.lng }))
  }

  const byLegMap: Map<number, WindOverlaySegment[]> = new Map()

  const sortedProbed = [...probed].sort(
    (a, b) => a.distanceFromStartMeters - b.distanceFromStartMeters,
  )

  const getBearingAtDistance = (distance: number): number => {
    if (routeIndex.sampledPoints.length < 2) return 0
    // Find nearest segment in sampledPoints for bearing
    for (let i = 0; i < routeIndex.sampledPoints.length - 1; i += 1) {
      const startD = routeIndex.sampledPoints[i].distanceFromStartMeters
      const endD = routeIndex.sampledPoints[i + 1].distanceFromStartMeters
      if (distance >= startD && distance <= endD) {
        return bearings[i] ?? 0
      }
    }
    return bearings[bearings.length - 1] ?? 0
  }

  // Group segments per leg
  for (let i = 0; i < sortedProbed.length; i += 1) {
    const current = sortedProbed[i]
    const next = sortedProbed[i + 1]
    const legInfo = findLegForDistance(current.distanceFromStartMeters, offsets)
    if (!legInfo) {
      continue
    }
    const legStart = legInfo.start
    const legEnd = legInfo.start + legInfo.distance

    const startMeters = current.distanceFromStartMeters - legStart
    const endMeters =
      next && next.distanceFromStartMeters <= legEnd
        ? next.distanceFromStartMeters - legStart
        : legInfo.distance

    if (endMeters < startMeters) {
      continue
    }

    const windSpeedMps = toMps(current.wind.windSpeed, current.wind.unit)
    const windGustMps =
      current.wind.windGust !== undefined
        ? toMps(current.wind.windGust, current.wind.unit)
        : undefined
    const bearing = getBearingAtDistance(current.distanceFromStartMeters)
    const level = levelFromWind(windSpeedMps, current.wind.windDirectionDeg, bearing, windGustMps)

    const segment: WindOverlaySegment = {
      startMeters,
      endMeters,
      level,
      reason:
        current.wind.windGust !== undefined
          ? `crosswind≈${windSpeedMps.toFixed(1)}m/s gust≈${(windGustMps ?? 0).toFixed(1)}m/s`
          : `crosswind≈${windSpeedMps.toFixed(1)}m/s`,
    }

    const list = byLegMap.get(legInfo.legIndex) ?? []
    list.push(segment)
    byLegMap.set(legInfo.legIndex, list)
  }

  // Merge adjacent segments with the same level per leg
  const mergeSegments = (segments: WindOverlaySegment[]): WindOverlaySegment[] => {
    const sorted = segments.sort((a, b) => a.startMeters - b.startMeters)
    const merged: WindOverlaySegment[] = []
    for (const seg of sorted) {
      const last = merged[merged.length - 1]
      if (last && last.level === seg.level && Math.abs(last.endMeters - seg.startMeters) < 1e-6) {
        last.endMeters = seg.endMeters
        // keep earliest reason; could be enhanced to keep strongest
      } else {
        merged.push({ ...seg })
      }
    }
    return merged
  }

  const byLeg: WindOverlayByLeg[] = []
  for (const [legIndex, segments] of byLegMap.entries()) {
    const merged = mergeSegments(segments)
    if (merged.length) {
      byLeg.push({ legIndex, segments: merged })
    }
  }

  return {
    generatedAt: Date.now(),
    modelVersion: MODEL_VERSION,
    legend,
    byLeg,
  }
}

export const mapConditions = traceableToolSync(mapConditionsImpl, {
  name: 'mapConditions',
  runType: 'tool',
  tags: ['planRide', 'conditions'],
})
