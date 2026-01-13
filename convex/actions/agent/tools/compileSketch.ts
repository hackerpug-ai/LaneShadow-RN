'use node'
import type { RouteSketch } from '../../../../models/route-sketch'
import type { PlanInput } from '../../../../models/saved-routes'
import { retryOnce, withTimeout } from '../lib/reliability'
import { traceableToolAsync } from '../lib/tracing'
import { createRoutingProvider, type ProviderRouteResponse } from '../providers/routingProvider'

type Waypoint = {
  lat: number
  lng: number
  label?: string
}

const toWaypoint = (lat: number, lng: number, label?: string): Waypoint => ({
  lat,
  lng,
  label,
})

const buildWaypoints = (planInput: PlanInput, sketch: RouteSketch): Array<Waypoint> => {
  const via: Array<Waypoint> = []

  // Prefer anchorPoints with coordinates; ignore anchors without coords for now (would require geocoding).
  sketch.anchorPoints.forEach((anchor) => {
    if (anchor.lat !== undefined && anchor.lng !== undefined) {
      via.push(toWaypoint(anchor.lat, anchor.lng, anchor.name))
    }
  })

  return [
    toWaypoint(planInput.start.lat, planInput.start.lng, planInput.start.label),
    ...via,
  ].concat(toWaypoint(planInput.end.lat, planInput.end.lng, planInput.end.label))
}

export type CompileSketchResult = ProviderRouteResponse

const ROUTING_TIMEOUT_MS = 25_000

const compileSketchImpl = async (params: {
  planInput: PlanInput
  sketch: RouteSketch
}): Promise<CompileSketchResult> => {
  const provider = createRoutingProvider()
  try {
    // Map sketch + plan input to provider-level waypoints; provider may use this in the future
    const waypoints = buildWaypoints(params.planInput, params.sketch)
    // For the mock provider, waypoints are not yet consumed, but keep the call signature future-proof
    void waypoints

    const runOnce = () =>
      withTimeout(
        () =>
          provider.routeFromSketch({
            planInput: params.planInput,
            sketch: params.sketch,
          }),
        { ms: ROUTING_TIMEOUT_MS, label: 'routing' }
      )

    return await retryOnce(runOnce)
  } catch (error) {
    console.error('compileSketch failed', error)
    throw new Error('ROUTING_COMPILE_FAILED')
  }
}

export const compileSketch = traceableToolAsync(compileSketchImpl, {
  name: 'compileSketch',
  runType: 'tool',
  tags: ['planRide', 'routing'],
})
