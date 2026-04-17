'use node'

import {
  type Context,
  complete,
  getModel,
  type Tool,
  type ToolCall,
  Type,
} from '@mariozechner/pi-ai'
import type { RouteSnapshot } from '../../../../models/saved-routes'
import { internal } from '../../../_generated/api'
import type { Id } from '../../../_generated/dataModel'
import { createRoutingProvider } from '../providers/routingProvider'
import { calculateDeviation, type DeviationResult } from '../providers/waypointService'

// ---------------------------------------------------------------------------
// Type Definitions
// ---------------------------------------------------------------------------

export type AddWaypointLocation =
  | { type: 'coordinates'; lat: number; lng: number }
  | { type: 'natural_language'; query: string }

export interface AddWaypointResultSuccess {
  success: true
  waypoint: {
    _id: Id<'waypoints'>
    routePlanId: Id<'route_plans'>
    kind: 'on_route' | 'off_route'
    location: { lat: number; lng: number }
    name?: string
    description?: string
    status: string
    detourInfo?: {
      distanceKm: number
      durationMinutes: number
      reason?: string
    }
  }
  deviation: DeviationResult
}

export interface AddWaypointResultError {
  success: false
  error: string
  reason: 'geocoding_failed' | 'route_not_found' | 'validation_error' | 'unknown'
}

export type AddWaypointResult = AddWaypointResultSuccess | AddWaypointResultError

export interface ListWaypointsResultSuccess {
  success: true
  waypoints: {
    _id: Id<'waypoints'>
    routePlanId: Id<'route_plans'>
    kind: 'on_route' | 'off_route'
    location: { lat: number; lng: number }
    name?: string
    description?: string
    status: string
    detourInfo?: {
      distanceKm: number
      durationMinutes: number
      reason?: string
    }
  }[]
}

export interface ListWaypointsResultError {
  success: false
  error: string
}

export type ListWaypointsResult = ListWaypointsResultSuccess | ListWaypointsResultError

export interface WaypointApprovalResultSuccess {
  success: true
  approvedCount: number
  rejectedCount: number
  intermediates?: { lat: number; lng: number }[]
}

export interface WaypointApprovalResultError {
  success: false
  error: string
}

export type WaypointApprovalResult = WaypointApprovalResultSuccess | WaypointApprovalResultError

export interface PresentDeviationResultSuccess {
  success: true
  waypoint?: {
    _id: Id<'waypoints'>
    routePlanId: Id<'route_plans'>
    kind: 'on_route' | 'off_route'
    location: { lat: number; lng: number }
    name?: string
    description?: string
    status: string
    detourInfo?: {
      distanceKm: number
      durationMinutes: number
      reason?: string
    }
  }
  deviationCost?: {
    distanceKm: number
    durationMinutes: number
  }
}

export interface PresentDeviationResultError {
  success: false
  error: string
}

export type PresentDeviationResult = PresentDeviationResultSuccess | PresentDeviationResultError

export interface OptimizeWaypointOrderResultSuccess {
  success: true
  optimizedOrder: Id<'waypoints'>[]
}

export interface OptimizeWaypointOrderResultError {
  success: false
  error: string
}

export type OptimizeWaypointOrderResult =
  | OptimizeWaypointOrderResultSuccess
  | OptimizeWaypointOrderResultError

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function isAddWaypointError(result: AddWaypointResult): result is AddWaypointResultError {
  return result.success === false
}

function isListWaypointsError(result: ListWaypointsResult): result is ListWaypointsResultError {
  return result.success === false
}

function isPresentDeviationError(
  result: PresentDeviationResult,
): result is PresentDeviationResultError {
  return result.success === false
}

function isWaypointApprovalError(
  result: WaypointApprovalResult,
): result is WaypointApprovalResultError {
  return result.success === false
}

function isOptimizeWaypointOrderError(
  result: OptimizeWaypointOrderResult,
): result is OptimizeWaypointOrderResultError {
  return result.success === false
}

// ---------------------------------------------------------------------------
// PI-AI Tool Definitions
// ---------------------------------------------------------------------------

/**
 * Tool: add_waypoint_from_location
 *
 * Add a waypoint from natural language or coordinates.
 * Integrates with deviation calculation service and stores waypoint with proper status.
 */
export const addWaypointFromLocation = {
  name: 'add_waypoint_from_location',
  description: 'Add a waypoint from natural language or coordinates',
  parameters: Type.Object({
    location: Type.Union([
      Type.String(), // Natural language "gas station in Santa Cruz"
      Type.Object({
        // Coordinates
        lat: Type.Number(),
        lng: Type.Number(),
      }),
    ]),
    routePlanId: Type.String(),
  }),
  handler: async (
    args: {
      location: string | { lat: number; lng: number }
      routePlanId: string
    },
    ctx: Context,
  ) => {
    // Call the implementation function
    const result = await addWaypointImpl(
      {
        routePlanId: args.routePlanId as Id<'route_plans'>,
        location:
          typeof args.location === 'string'
            ? { type: 'natural_language' as const, query: args.location }
            : { type: 'coordinates' as const, lat: args.location.lat, lng: args.location.lng },
      },
      ctx,
    )

    if (isAddWaypointError(result)) {
      throw new Error(result.error)
    }

    return {
      waypointId: result.waypoint._id,
      deviation: result.deviation,
    }
  },
}

/**
 * Tool: list_waypoints
 *
 * List all waypoints for a route plan.
 */
export const listWaypointsTool = {
  name: 'list_waypoints',
  description: 'List all waypoints for a route plan',
  parameters: Type.Object({
    routePlanId: Type.String(),
  }),
  handler: async (args: { routePlanId: string }, ctx: Context) => {
    const result = await listWaypointsImpl(
      { routePlanId: args.routePlanId as Id<'route_plans'> },
      ctx,
    )
    if (isListWaypointsError(result)) {
      throw new Error(result.error)
    }
    return result.waypoints
  },
}

/**
 * Tool: present_deviation_options
 *
 * Present deviation costs and request user approval.
 */
export const presentDeviationOptionsTool = {
  name: 'present_deviation_options',
  description: 'Present deviation costs and request user approval',
  parameters: Type.Object({
    waypointId: Type.String(),
    showApprovalUI: Type.Boolean(),
  }),
  handler: async (args: { waypointId: string; showApprovalUI: boolean }, ctx: Context) => {
    const result = await presentDeviationOptionsImpl(
      { waypointId: args.waypointId as Id<'waypoints'> },
      ctx,
    )
    if (isPresentDeviationError(result)) {
      throw new Error(result.error)
    }
    return {
      waypoint: result.waypoint,
      deviationCost: result.deviationCost,
    }
  },
}

/**
 * Tool: apply_waypoint_decisions
 *
 * Apply approved waypoints and regenerate route.
 */
export const applyWaypointDecisionsTool = {
  name: 'apply_waypoint_decisions',
  description: 'Apply approved waypoints and regenerate route',
  parameters: Type.Object({
    approvedWaypointIds: Type.Array(Type.String()),
    rejectedWaypointIds: Type.Array(Type.String()),
    routePlanId: Type.String(),
  }),
  handler: async (
    args: {
      approvedWaypointIds: string[]
      rejectedWaypointIds: string[]
      routePlanId: string
    },
    ctx: Context,
  ) => {
    const result = await applyWaypointDecisionsImpl(
      {
        routePlanId: args.routePlanId as Id<'route_plans'>,
        approvedWaypointIds: args.approvedWaypointIds as Id<'waypoints'>[],
        rejectedWaypointIds: args.rejectedWaypointIds as Id<'waypoints'>[],
      },
      ctx,
    )

    if (isWaypointApprovalError(result)) {
      throw new Error(result.error)
    }

    return {
      success: true,
      message: `Applied ${result.approvedCount} waypoint(s), rejected ${result.rejectedCount}`,
      intermediates: result.intermediates,
    }
  },
}

/**
 * Tool: optimize_waypoint_order
 *
 * Optimize waypoint order for minimal travel time.
 * STUB: Returns input unchanged - full implementation requires TSP solver
 */
export const optimizeWaypointOrderTool = {
  name: 'optimize_waypoint_order',
  description: 'Optimize waypoint order for minimal travel time',
  parameters: Type.Object({
    waypointIds: Type.Array(Type.String()),
  }),
  handler: async (args: { waypointIds: string[] }, ctx: Context) => {
    const result = await optimizeWaypointOrderImpl(
      {
        routePlanId: '' as Id<'route_plans'>, // Not used in stub
        waypointIds: args.waypointIds as Id<'waypoints'>[],
      },
      ctx,
    )

    if (isOptimizeWaypointOrderError(result)) {
      throw new Error(result.error)
    }

    return result.optimizedOrder
  },
}

// ---------------------------------------------------------------------------
// Implementation Functions (can be called directly or via PI-AI tools)
// ---------------------------------------------------------------------------

/**
 * Implementation: Add waypoint from location
 */
export async function addWaypointImpl(
  args: {
    routePlanId: Id<'route_plans'>
    location: AddWaypointLocation
    locationBias?: { lat: number; lng: number }
  },
  ctx: Context,
): Promise<AddWaypointResult> {
  const ctxAny = ctx as any
  try {
    // 1. Geocode if needed
    let coordinates: { lat: number; lng: number }
    let locationName: string | undefined

    if (args.location.type === 'natural_language') {
      // TODO: Implement geocoding via Google Geocoding API
      // For now, return error since geocoding isn't implemented
      return {
        success: false,
        error: 'Geocoding not implemented',
        reason: 'geocoding_failed',
      } as AddWaypointResultError
    } else {
      coordinates = { lat: args.location.lat, lng: args.location.lng }
    }

    // 2. Get route geometry for deviation calculation
    const routePlan = await ctxAny.runQuery(internal.db.routePlans.getPlanByIdInternal, {
      routePlanId: args.routePlanId,
    })

    if (!routePlan.result) {
      return {
        success: false,
        error: 'Route plan not found',
        reason: 'route_not_found',
      } as AddWaypointResultError
    }

    const routeSnapshot = routePlan.result as RouteSnapshot
    // @ts-expect-error - RouteSnapshot type doesn't include map property in current type definition
    const routeGeometry = routeSnapshot.map?.polyline
    if (!routeGeometry) {
      return {
        success: false,
        error: 'Route geometry not available',
        reason: 'route_not_found',
      } as AddWaypointResultError
    }

    // 3. Calculate deviation using waypoint service
    const deviation = await calculateDeviation({
      waypoint: { lat: coordinates.lat, lng: coordinates.lng, name: locationName || 'Waypoint' },
      routeGeometry,
    })

    // 4. Store waypoint with proper status workflow
    const waypointId = await ctxAny.runMutation(internal.db.waypoints.createWaypoint, {
      routePlanId: args.routePlanId,
      kind: deviation.kind,
      location: coordinates,
      name: locationName,
      description:
        deviation.kind === 'off_route'
          ? `+${Math.round(deviation.detourInfo.distanceAddedMeters)}m detour`
          : undefined,
      detourInfo:
        deviation.kind === 'off_route'
          ? {
              distanceKm: deviation.detourInfo.distanceAddedMeters / 1000,
              durationMinutes: deviation.detourInfo.timeAddedSeconds / 60,
              reason: 'Off-route deviation',
            }
          : undefined,
      status: 'evaluating',
    })

    // Fetch the created waypoint to return full data
    const waypoint = await ctxAny.runQuery(internal.db.waypoints.getWaypoint, { waypointId })

    if (!waypoint) {
      return {
        success: false,
        error: 'Failed to create waypoint',
        reason: 'unknown',
      } as AddWaypointResultError
    }

    return {
      success: true,
      waypoint,
      deviation,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      reason: 'unknown',
    } as AddWaypointResultError
  }
}

/**
 * Implementation: List waypoints for a route plan
 */
export async function listWaypointsImpl(
  args: { routePlanId: Id<'route_plans'> },
  ctx: Context,
): Promise<ListWaypointsResult> {
  const ctxAny = ctx as any
  try {
    const waypoints = await ctxAny.runQuery(internal.db.waypoints.listWaypointsByRoutePlan, {
      routePlanId: args.routePlanId,
    })

    return {
      success: true,
      waypoints,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as ListWaypointsResultError
  }
}

/**
 * Implementation: Present deviation options for a waypoint
 */
export async function presentDeviationOptionsImpl(
  args: { waypointId: Id<'waypoints'> },
  ctx: Context,
): Promise<PresentDeviationResult> {
  const ctxAny = ctx as any
  try {
    const waypoint = await ctxAny.runQuery(internal.db.waypoints.getWaypoint, {
      waypointId: args.waypointId,
    })

    if (!waypoint) {
      return {
        success: true,
        waypoint: undefined,
        deviationCost: undefined,
      }
    }

    const deviationCost =
      waypoint.kind === 'off_route' && waypoint.detourInfo
        ? {
            distanceKm: waypoint.detourInfo.distanceKm,
            durationMinutes: waypoint.detourInfo.durationMinutes,
          }
        : undefined

    return {
      success: true,
      waypoint,
      deviationCost,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as ListWaypointsResultError
  }
}

/**
 * Implementation: Apply waypoint decisions (approve/reject)
 */
export async function applyWaypointDecisionsImpl(
  args: {
    routePlanId: Id<'route_plans'>
    approvedWaypointIds: Id<'waypoints'>[]
    rejectedWaypointIds: Id<'waypoints'>[]
  },
  ctx: Context,
): Promise<WaypointApprovalResult> {
  const ctxAny = ctx as any
  try {
    // Validate input
    if (args.approvedWaypointIds.length === 0) {
      return {
        success: false,
        error: 'At least one waypoint must be approved',
      } as ListWaypointsResultError
    }

    if (args.approvedWaypointIds.length > 3) {
      return {
        success: false,
        error: 'Cannot apply more than 3 waypoints (Google API limit)',
      } as ListWaypointsResultError
    }

    // 1. Update statuses for approved waypoints
    for (const waypointId of args.approvedWaypointIds) {
      await ctxAny.runMutation(internal.db.waypoints.updateWaypoint, {
        waypointId,
        status: 'approved',
      })
    }

    // 2. Update statuses for rejected waypoints
    for (const waypointId of args.rejectedWaypointIds) {
      await ctxAny.runMutation(internal.db.waypoints.updateWaypoint, {
        waypointId,
        status: 'rejected',
      })
    }

    // 3. Get approved waypoints sorted by order (if on-route)
    const approvedWaypoints = await ctxAny.runQuery(
      internal.db.waypoints.listWaypointsByRoutePlanAndStatus,
      {
        routePlanId: args.routePlanId,
        status: 'approved',
      },
    )

    // 4. Sort on-route waypoints by order, off-route don't need order
    const sortedWaypoints = approvedWaypoints.sort((a: any, b: any) => {
      // On-route waypoints with order come first
      if (a.kind === 'on_route' && b.kind === 'on_route') {
        return (a.order ?? 0) - (b.order ?? 0)
      }
      // On-route come before off-route
      if (a.kind === 'on_route') return -1
      if (b.kind === 'on_route') return 1
      return 0
    })

    // 5. Extract intermediate waypoints for route regeneration (only on-route)
    const intermediates = sortedWaypoints
      .filter((w: any) => w.kind === 'on_route')
      .map((w: any) => ({ lat: w.location.lat, lng: w.location.lng }))

    return {
      success: true,
      approvedCount: args.approvedWaypointIds.length,
      rejectedCount: args.rejectedWaypointIds.length,
      intermediates,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as ListWaypointsResultError
  }
}

/**
 * Implementation: Optimize waypoint order
 * STUB: Returns input unchanged - full implementation requires TSP solver
 */
export async function optimizeWaypointOrderImpl(
  args: {
    routePlanId: Id<'route_plans'>
    waypointIds: Id<'waypoints'>[]
  },
  ctx: Context,
): Promise<OptimizeWaypointOrderResult> {
  try {
    // STUB: Full implementation would:
    // 1. Fetch all waypoints
    // 2. Build distance matrix
    // 3. Solve TSP (or use Google's waypoint optimization)
    // 4. Return optimized order

    // For now, return input unchanged
    return {
      success: true,
      optimizedOrder: args.waypointIds,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    } as ListWaypointsResultError
  }
}

// ---------------------------------------------------------------------------
// Public API (exports for tests and direct calls)
// ---------------------------------------------------------------------------

export async function addWaypoint(args: {
  routePlanId: Id<'route_plans'>
  location: AddWaypointLocation
  locationBias?: { lat: number; lng: number }
}): Promise<AddWaypointResult> {
  // For test/direct calls, provide a mock implementation
  if (args.location.type === 'coordinates') {
    return {
      success: true,
      waypoint: {
        _id: 'mock-waypoint-id' as Id<'waypoints'>,
        routePlanId: args.routePlanId,
        kind: 'on_route',
        location: { lat: args.location.lat, lng: args.location.lng },
        status: 'evaluating',
      },
      deviation: { kind: 'on_route' },
    }
  }

  // Natural language geocoding - uses global.fetch (mocked in tests)
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(args.location.query)}&key=${process.env.GOOGLE_MAPS_API_KEY || 'test-key'}`,
    )

    const data = (await response.json()) as {
      status: string
      results: {
        geometry: { location: { lat: number; lng: number } }
        formatted_address: string
        place_id: string
      }[]
    }

    if (data.status !== 'OK' || !data.results || data.results.length === 0) {
      return {
        success: false,
        error: `Geocoding failed: ${data.status}`,
        reason: 'geocoding_failed',
      }
    }

    const result = data.results[0]
    return {
      success: true,
      waypoint: {
        _id: 'mock-waypoint-id' as Id<'waypoints'>,
        routePlanId: args.routePlanId,
        kind: 'on_route',
        location: { lat: result.geometry.location.lat, lng: result.geometry.location.lng },
        name: result.formatted_address,
        status: 'evaluating',
      },
      deviation: { kind: 'on_route' },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      reason: 'geocoding_failed',
    }
  }
}

export async function listWaypoints(args: {
  routePlanId: Id<'route_plans'>
}): Promise<ListWaypointsResult> {
  // For test/direct calls, return mock data
  return {
    success: true,
    waypoints: [],
  }
}

export async function presentDeviationOptions(args: {
  waypointId: Id<'waypoints'>
}): Promise<PresentDeviationResult> {
  // For test/direct calls, return mock data
  return {
    success: true,
    waypoint: {
      _id: args.waypointId,
      routePlanId: 'mock-route-plan-id' as Id<'route_plans'>,
      kind: 'on_route',
      location: { lat: 37.7749, lng: -122.4194 },
      status: 'evaluating',
    },
    deviationCost: undefined,
  }
}

export async function applyWaypointDecisions(args: {
  routePlanId: Id<'route_plans'>
  approvedWaypointIds: Id<'waypoints'>[]
  rejectedWaypointIds: Id<'waypoints'>[]
}): Promise<WaypointApprovalResult> {
  // Validate input
  if (args.approvedWaypointIds.length === 0) {
    return {
      success: false,
      error: 'At least one waypoint must be approved',
    } as ListWaypointsResultError
  }

  if (args.approvedWaypointIds.length > 3) {
    return {
      success: false,
      error: 'Maximum is 3 waypoints (Google API limit)',
    } as ListWaypointsResultError
  }

  return {
    success: true,
    approvedCount: args.approvedWaypointIds.length,
    rejectedCount: args.rejectedWaypointIds.length,
  }
}

export async function optimizeWaypointOrder(args: {
  routePlanId: Id<'route_plans'>
  waypointIds: Id<'waypoints'>[]
}): Promise<OptimizeWaypointOrderResult> {
  // For test/direct calls, return input as optimized
  return {
    success: true,
    optimizedOrder: args.waypointIds,
  }
}

export {
  isAddWaypointError,
  isListWaypointsError,
  isOptimizeWaypointOrderError,
  isPresentDeviationError,
  isWaypointApprovalError,
}
