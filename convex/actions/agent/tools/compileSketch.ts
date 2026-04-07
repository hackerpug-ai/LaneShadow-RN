'use node'
import type { RouteSketch } from '../../../../models/route-sketch'
import type { PlanInput } from '../../../../models/saved-routes'
import { retryOnce, withTimeout } from '../lib/reliability'
import { traceableToolAsync } from '../lib/tracing'
import { createRoutingProvider, type ProviderRouteResponse } from '../providers/routingProvider'

const MAX_SEGMENTS_FOR_PER_SEGMENT_COMPILATION = 10

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

const buildWaypoints = (planInput: PlanInput, sketch: RouteSketch): Waypoint[] => {
  const via: Waypoint[] = []

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

export type SegmentCompileResult =
  | { status: 'ok'; segmentIndex: number; route: ProviderRouteResponse }
  | { status: 'failed'; segmentIndex: number; error: string }

export type SegmentCompilationResult = {
  allSucceeded: boolean
  segments: SegmentCompileResult[]
  stitchedRoute?: ProviderRouteResponse
  failedSegments: SegmentCompileResult[]
}

const mergeBounds = (
  bounds: { north: number; south: number; east: number; west: number }[]
): { north: number; south: number; east: number; west: number } => ({
  north: Math.max(...bounds.map((b) => b.north)),
  south: Math.min(...bounds.map((b) => b.south)),
  east: Math.max(...bounds.map((b) => b.east)),
  west: Math.min(...bounds.map((b) => b.west)),
})

export const stitchSegments = (results: SegmentCompileResult[]): ProviderRouteResponse => {
  const ok = results.filter(
    (r): r is Extract<SegmentCompileResult, { status: 'ok' }> => r.status === 'ok'
  )

  if (ok.length === 0) {
    throw new Error('All segments failed — cannot stitch')
  }

  return {
    provider: 'google',
    bounds: mergeBounds(ok.map((r) => r.route.bounds)),
    overviewGeometry: {
      format: 'polyline',
      encoding: 'google_encoded_polyline',
      precision: 5,
      value: ok.map((r) => r.route.overviewGeometry.value).join(''),
    },
    legs: ok.flatMap((r, i) =>
      r.route.legs.map((leg) => ({
        ...leg,
        legIndex: i,
      }))
    ),
  }
}

export const compileSegments = async (params: {
  planInput: PlanInput
  sketch: RouteSketch
  locationBias?: { lat: number; lng: number }
}): Promise<SegmentCompileResult[]> => {
  const { sketch, locationBias } = params

  if (sketch.segments.length > MAX_SEGMENTS_FOR_PER_SEGMENT_COMPILATION) {
    throw new Error(
      `Too many segments: ${sketch.segments.length} exceeds the per-segment compilation limit of ${MAX_SEGMENTS_FOR_PER_SEGMENT_COMPILATION}`
    )
  }

  const provider = createRoutingProvider()

  const settledResults = await Promise.allSettled(
    sketch.segments.map((segment) =>
      provider.routeSegment({ segment, anchorPoints: sketch.anchorPoints, locationBias })
    )
  )

  return settledResults.map((result, idx) => {
    if (result.status === 'fulfilled') {
      return { status: 'ok', segmentIndex: idx, route: result.value }
    }
    const error = result.reason instanceof Error ? result.reason.message : String(result.reason)
    return { status: 'failed', segmentIndex: idx, error }
  })
}
