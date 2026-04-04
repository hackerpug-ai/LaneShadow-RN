import { Infer, v } from 'convex/values'
import { planInputValidator } from './saved-routes'

export const ROUTE_PLAN_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const
export type RoutePlanStatus = (typeof ROUTE_PLAN_STATUS)[keyof typeof ROUTE_PLAN_STATUS]

export const routePlanStatusValidator = v.union(
  v.literal('pending'),
  v.literal('running'),
  v.literal('completed'),
  v.literal('failed'),
  v.literal('cancelled')
)

export const ROUTE_PLAN_PHASE = {
  READING: 'reading',
  FINDING: 'finding',
  WEATHER: 'weather',
  BUILDING: 'building',
} as const
export type RoutePlanPhase = (typeof ROUTE_PLAN_PHASE)[keyof typeof ROUTE_PLAN_PHASE]

export const routePlanPhaseValidator = v.union(
  v.literal('reading'),
  v.literal('finding'),
  v.literal('weather'),
  v.literal('building')
)

export const routePlanValidator = v.object({
  clerkUserId: v.string(),
  planInput: planInputValidator,
  startLabel: v.optional(v.string()),
  endLabel: v.optional(v.string()),
  status: routePlanStatusValidator,
  statusMessage: v.optional(v.string()),
  phase: v.optional(routePlanPhaseValidator),
  result: v.optional(v.any()),
  errorCode: v.optional(v.string()),
  errorMessage: v.optional(v.string()),
  scheduledActionId: v.optional(v.id('_scheduled_functions')),
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
  acknowledged: v.optional(v.boolean()),
})
export type RoutePlan = Infer<typeof routePlanValidator>
