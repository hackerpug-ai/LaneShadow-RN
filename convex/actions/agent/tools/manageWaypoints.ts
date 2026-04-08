'use node'

import { createGeocodingProvider, type GeocodeResult } from '../providers/geocodingProvider'
import { traceableToolAsync } from '../lib/tracing'

export type ConvexId<T> = string

const ON_ROUTE_THRESHOLD_METERS = 500
const MAX_WAYPOINTS_PER_ROUTE = 3

export type WaypointLocation =
  | { type: 'natural_language'; query: string }
  | { type: 'coordinates'; lat: number; lng: number }

export type WaypointKind = 'on_route' | 'off_route'

export type WaypointStatus = 'pending' | 'evaluating' | 'ready' | 'approved' | 'rejected' | 'applied'

export type DetourInfo = {
  distanceAddedMeters: number
  timeAddedSeconds: number
  reconnectPoint: { lat: number; lng: number }
  nearestPointOnRoute: { lat: number; lng: number; distanceFromRouteMeters: number }
}

export type Waypoint = {
  _id: ConvexId<'waypoints'>
  routePlanId: ConvexId<'route_plans'>
  kind: WaypointKind
  status: WaypointStatus
  location: { lat: number; lng: number }
  name?: string
  description?: string
  order?: number
  detourInfo?: DetourInfo
  createdAt: number
  updatedAt: number
}

export type AddWaypointResult =
  | { success: true; waypoint: Waypoint; needsApproval: boolean }
  | { success: false; error: string; reason: string }

export type WaypointApprovalResult =
  | { success: true; approvedCount: number; rejectedCount: number }
  | { success: false; error: string }

export type WaypointListResult =
  | { success: true; waypoints: Waypoint[] }
  | { success: false; error: string }

export function isAddWaypointError(result: AddWaypointResult): result is Extract<AddWaypointResult, { success: false }> {
  return !result.success
}

export function isWaypointApprovalError(result: WaypointApprovalResult): result is Extract<WaypointApprovalResult, { success: false }> {
  return !result.success
}

const geocodeLocation = async (
  location: WaypointLocation,
  locationBias?: { lat: number; lng: number }
): Promise<{ lat: number; lng: number; name: string }> => {
  if (location.type === 'coordinates') {
    return {
      lat: location.lat,
      lng: location.lng,
      name: `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`,
    }
  }

  try {
    const provider = createGeocodingProvider()
    const results = await provider.geocode(location.query, locationBias)

    if (results.length === 0) {
      throw new Error(`No results found for "${location.query}"`)
    }

    const best = results[0]
    return {
      lat: best.lat,
      lng: best.lng,
      name: best.label,
    }
  } catch (error) {
    throw new Error(`Geocoding failed: ${error instanceof Error ? error.message : String(error)}`)
  }
}

const calculateDeviation = async (
  waypoint: { lat: number; lng: number },
  routeGeometry: { polyline: string } | null
): Promise<{ kind: WaypointKind; detourInfo?: DetourInfo }> => {
  if (!routeGeometry || !routeGeometry.polyline) {
    return { kind: 'on_route' }
  }

  return { kind: 'on_route' }
}

const addWaypointImpl = async (params: {
  routePlanId: ConvexId<'route_plans'>
  location: WaypointLocation
  routeGeometry?: { polyline: string } | null
  locationBias?: { lat: number; lng: number }
}): Promise<AddWaypointResult> => {
  try {
    const geocoded = await geocodeLocation(params.location, params.locationBias)
    const deviation = await calculateDeviation(geocoded, params.routeGeometry ?? null)

    const waypoint: Waypoint = {
      _id: 'waypoint-placeholder' as ConvexId<'waypoints'>,
      routePlanId: params.routePlanId,
      kind: deviation.kind,
      status: deviation.kind === 'off_route' ? 'ready' : 'evaluating',
      location: { lat: geocoded.lat, lng: geocoded.lng },
      name: geocoded.name,
      detourInfo: deviation.detourInfo,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    return {
      success: true,
      waypoint,
      needsApproval: deviation.kind === 'off_route',
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      reason: 'Failed to add waypoint',
    }
  }
}

const listWaypointsImpl = async (params: {
  routePlanId: ConvexId<'route_plans'>
  status?: WaypointStatus
}): Promise<WaypointListResult> => {
  try {
    return {
      success: true,
      waypoints: [],
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const applyWaypointDecisionsImpl = async (params: {
  routePlanId: ConvexId<'route_plans'>
  approvedWaypointIds: ConvexId<'waypoints'>[]
  rejectedWaypointIds: ConvexId<'waypoints'>[]
}): Promise<WaypointApprovalResult> => {
  try {
    const totalApproved = params.approvedWaypointIds.length
    if (totalApproved > MAX_WAYPOINTS_PER_ROUTE) {
      return {
        success: false,
        error: `Cannot add ${totalApproved} waypoints. Maximum is ${MAX_WAYPOINTS_PER_ROUTE}.`,
      }
    }

    return {
      success: true,
      approvedCount: totalApproved,
      rejectedCount: params.rejectedWaypointIds.length,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const presentDeviationOptionsImpl = async (params: {
  waypointId: ConvexId<'waypoints'>
}): Promise<{ success: boolean; waypoint?: Waypoint; error?: string }> => {
  try {
    return {
      success: true,
      waypoint: undefined,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

const optimizeWaypointOrderImpl = async (params: {
  routePlanId: ConvexId<'route_plans'>
  waypointIds: ConvexId<'waypoints'>[]
}): Promise<{ success: boolean; optimizedOrder?: ConvexId<'waypoints'>[]; error?: string }> => {
  try {
    return {
      success: true,
      optimizedOrder: params.waypointIds,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export const addWaypoint = traceableToolAsync(addWaypointImpl, {
  name: 'addWaypoint',
  runType: 'tool',
  tags: ['waypoints', 'geocoding', 'deviation'],
})

export const listWaypoints = traceableToolAsync(listWaypointsImpl, {
  name: 'listWaypoints',
  runType: 'tool',
  tags: ['waypoints'],
})

export const applyWaypointDecisions = traceableToolAsync(applyWaypointDecisionsImpl, {
  name: 'applyWaypointDecisions',
  runType: 'tool',
  tags: ['waypoints', 'approval'],
})

export const presentDeviationOptions = traceableToolAsync(presentDeviationOptionsImpl, {
  name: 'presentDeviationOptions',
  runType: 'tool',
  tags: ['waypoints', 'ui'],
})

export const optimizeWaypointOrder = traceableToolAsync(optimizeWaypointOrderImpl, {
  name: 'optimizeWaypointOrder',
  runType: 'tool',
  tags: ['waypoints', 'optimization'],
})
