'use node'
import type { RouteIndex, RouteIndexPoint } from '../../../../models/saved-routes'
import type { WeatherProvider, WindSample } from '../providers/weatherProvider'

const MAX_PROBES = 25

const selectRepresentativePoints = (points: Array<RouteIndexPoint>): Array<RouteIndexPoint> => {
  if (points.length <= MAX_PROBES) {
    return points
  }

  const selected: Array<RouteIndexPoint> = []
  const lastIndex = points.length - 1
  const slots = MAX_PROBES - 1

  for (let i = 0; i <= slots; i += 1) {
    const idx = Math.round((i * lastIndex) / slots)
    const p = points[idx]
    if (!selected.find((s) => s.distanceFromStartMeters === p.distanceFromStartMeters)) {
      selected.push(p)
    }
  }

  return selected.sort((a, b) => a.distanceFromStartMeters - b.distanceFromStartMeters)
}

export type ProbedWindPoint = {
  distanceFromStartMeters: number
  lat: number
  lng: number
  wind: WindSample
}

export type ProbeConditionsParams = {
  routeIndex: RouteIndex
  departureTimeMs: number
  weatherProvider: WeatherProvider
}

/**
 * Throws on provider failure; caller (planRide) must catch and downgrade to soft-fail.
 */
export const probeConditions = async ({
  routeIndex,
  departureTimeMs,
  weatherProvider,
}: ProbeConditionsParams): Promise<Array<ProbedWindPoint>> => {
  const selected = selectRepresentativePoints(routeIndex.sampledPoints)
  if (!selected.length) return []

  const samples = await weatherProvider.getWindAtPoints({
    points: selected,
    departureTimeMs,
  })

  return selected.map((point, idx) => ({
    distanceFromStartMeters: point.distanceFromStartMeters,
    lat: point.lat,
    lng: point.lng,
    wind: samples[idx],
  }))
}
