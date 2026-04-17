import { type Infer, v } from 'convex/values'

export const WAYPOINT_KIND = {
  ON_ROUTE: 'on_route',
  OFF_ROUTE: 'off_route',
} as const
export type WaypointKind = (typeof WAYPOINT_KIND)[keyof typeof WAYPOINT_KIND]

export const waypointKindValidator = v.union(v.literal('on_route'), v.literal('off_route'))

export const WAYPOINT_STATUS = {
  PENDING: 'pending',
  EVALUATING: 'evaluating',
  READY: 'ready',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  APPLIED: 'applied',
} as const
export type WaypointStatus = (typeof WAYPOINT_STATUS)[keyof typeof WAYPOINT_STATUS]

export const waypointStatusValidator = v.union(
  v.literal('pending'),
  v.literal('evaluating'),
  v.literal('ready'),
  v.literal('approved'),
  v.literal('rejected'),
  v.literal('applied'),
)

export const detourInfoValidator = v.object({
  distanceKm: v.number(),
  durationMinutes: v.number(),
  reason: v.optional(v.string()),
})

export const waypointValidator = v.object({
  routePlanId: v.id('route_plans'),
  kind: waypointKindValidator,
  status: waypointStatusValidator,
  location: v.object({
    lat: v.number(),
    lng: v.number(),
  }),
  name: v.optional(v.string()),
  description: v.optional(v.string()),
  order: v.optional(v.number()), // For on-route sequencing
  detourInfo: v.optional(detourInfoValidator), // For off-route waypoints
  createdAt: v.number(),
  updatedAt: v.number(),
})

export type Waypoint = Infer<typeof waypointValidator>
