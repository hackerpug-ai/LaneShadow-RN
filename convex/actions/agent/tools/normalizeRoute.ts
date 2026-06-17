'use node'

import type { RouteSketch } from '../../../../shared/models/route-sketch'
import type {
  PlanInput,
  RouteLeg,
  RouteSnapshot,
  RouteStop,
} from '../../../../shared/models/saved-routes'
import { traceableToolSync } from '../lib/tracing'
import type { ProviderRouteResponse } from '../providers/routingProvider'

type NormalizeRouteParams = {
  providerRoute: ProviderRouteResponse
  planInput: PlanInput
  sketch?: RouteSketch
}

const toRouteStop = (lat: number, lng: number, label?: string, placeId?: string): RouteStop => ({
  lat,
  lng,
  label,
  placeId,
})

const normalizeRouteImpl = ({
  providerRoute,
  planInput,
  sketch,
}: NormalizeRouteParams): RouteSnapshot => {
  const origin = toRouteStop(
    planInput.start.lat,
    planInput.start.lng,
    planInput.start.label,
    planInput.start.placeId,
  )
  const destination = toRouteStop(
    planInput.end.lat,
    planInput.end.lng,
    planInput.end.label,
    planInput.end.placeId,
  )

  // Build label map from sketch segments and anchor points
  // These are the LLM-generated names that should be preserved
  // Priority: presentation labels (fromLabel/toLabel) > basic names (fromName/toName)
  const labelMap = new Map<number, { startLabel?: string; endLabel?: string }>()

  if (sketch?.segments) {
    // Map segment index to the from/to names from LLM
    // Segment 0 goes from start → waypoint1, Segment 1 from waypoint1 → waypoint2, etc.
    sketch.segments.forEach((seg, idx) => {
      labelMap.set(idx, {
        startLabel: seg.fromLabel ?? seg.fromName,
        endLabel: seg.toLabel ?? seg.toName,
      })
    })
  }

  const legs: RouteLeg[] = providerRoute.legs.map((leg, idx) => {
    // First leg starts at origin, last leg ends at destination
    const isFirstLeg = idx === 0
    const isLastLeg = idx === providerRoute.legs.length - 1

    // Priority: origin/destination labels > LLM segment names > undefined
    const labels = labelMap.get(idx)
    const startLabel = isFirstLeg ? planInput.start.label : labels?.startLabel
    const endLabel = isLastLeg ? planInput.end.label : labels?.endLabel

    return {
      legIndex: leg.legIndex,
      start: toRouteStop(leg.start.lat, leg.start.lng, startLabel),
      end: toRouteStop(leg.end.lat, leg.end.lng, endLabel),
      distanceMeters: leg.distanceMeters,
      durationSeconds: leg.durationSeconds,
      geometry: {
        format: leg.geometry.format,
        encoding: leg.geometry.encoding,
        precision: leg.geometry.precision,
        value: leg.geometry.value,
      },
    }
  })

  return {
    provider: providerRoute.provider,
    bounds: providerRoute.bounds,
    origin,
    destination,
    waypoints: [], // PlanInput currently has no explicit intermediate waypoints; anchor points are not persisted as stops.
    overviewGeometry: providerRoute.overviewGeometry,
    legs,
    annotations: [],
    overlays: {},
  }
}

export const normalizeRoute = traceableToolSync(normalizeRouteImpl, {
  name: 'normalizeRoute',
  runType: 'tool',
  tags: ['planRide', 'routing'],
})
