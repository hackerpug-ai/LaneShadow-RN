import { type Infer, v } from 'convex/values'
import { z } from 'zod'

export const tripLegValidator = v.object({
  legIndex: v.number(),
  from: v.string(),
  to: v.string(),
  via: v.string(),
  distanceNote: v.string(),
  character: v.string(),
  googleMapsQuery: v.string(),
  confidence: v.union(v.literal('high'), v.literal('medium'), v.literal('low')),
  status: v.union(v.literal('generated'), v.literal('validated'), v.literal('failed')),
  failureReason: v.optional(v.string()),
  persistedWaypoint: v.optional(v.string()),
})
export type TripLeg = Infer<typeof tripLegValidator>

export const tripPlanValidator = v.object({
  label: v.string(),
  rationale: v.string(),
  legs: v.array(tripLegValidator),
  totalDistanceNote: v.string(),
  totalTimeNote: v.string(),
  generationAttempt: v.number(),
  failedLegIndexes: v.optional(v.array(v.number())),
  warnings: v.array(v.string()),
})
export type TripPlan = Infer<typeof tripPlanValidator>

export const agentTripLegSchema = z.object({
  legIndex: z.number(),
  from: z.string(),
  to: z.string(),
  via: z.string(),
  distanceNote: z.string(),
  character: z.string(),
  googleMapsQuery: z.string(),
  confidence: z.union([z.literal('high'), z.literal('medium'), z.literal('low')]),
  status: z.union([z.literal('generated'), z.literal('validated'), z.literal('failed')]),
  failureReason: z.string().optional(),
  persistedWaypoint: z.string().optional(),
})

export const agentTripPlanSchema = z.object({
  label: z.string(),
  rationale: z.string(),
  legs: z.array(agentTripLegSchema),
  totalDistanceNote: z.string(),
  totalTimeNote: z.string(),
  generationAttempt: z.number(),
  failedLegIndexes: z.array(z.number()).optional(),
  warnings: z.array(z.string()),
})
