import { Infer, v } from 'convex/values'

export const PLANNING_SESSION_STATUS = {
  ACTIVE: 'active',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
} as const
export type PlanningSessionStatus = (typeof PLANNING_SESSION_STATUS)[keyof typeof PLANNING_SESSION_STATUS]

export const planningSessionStatusValidator = v.union(
  v.literal('active'),
  v.literal('completed'),
  v.literal('archived')
)

export const lastKnownLocationValidator = v.object({
  lat: v.number(),
  lng: v.number(),
  updatedAt: v.number(),
})
export type LastKnownLocation = Infer<typeof lastKnownLocationValidator>

export const planningSessionValidator = v.object({
  clerkUserId: v.string(),
  title: v.string(),
  status: planningSessionStatusValidator,
  createdAt: v.number(),
  updatedAt: v.number(),
  lastKnownLocation: v.optional(lastKnownLocationValidator),
  deletedAt: v.optional(v.number()),
})
export type PlanningSession = Infer<typeof planningSessionValidator>
