import { Infer, v } from 'convex/values'

export const ROUTE_ENRICHMENT_STATUS = {
  PENDING: 'pending',
  RUNNING: 'running',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed',
} as const
export type RouteEnrichmentStatus = (typeof ROUTE_ENRICHMENT_STATUS)[keyof typeof ROUTE_ENRICHMENT_STATUS]

export const routeEnrichmentStatusValidator = v.union(
  v.literal('pending'),
  v.literal('running'),
  v.literal('completed'),
  v.literal('cancelled'),
  v.literal('failed')
)

export const ROUTE_ENRICHMENT_PHASE = {
  FAST: 'fast',
  EXTENDED: 'extended',
} as const
export type RouteEnrichmentPhase = (typeof ROUTE_ENRICHMENT_PHASE)[keyof typeof ROUTE_ENRICHMENT_PHASE]

export const routeEnrichmentPhaseValidator = v.union(v.literal('fast'), v.literal('extended'))

export const routeEnrichmentValidator = v.object({
  routePlanId: v.id('route_plans'),
  planningSessionId: v.id('planning_sessions'),
  clerkUserId: v.string(),

  // Content fingerprint for cache invalidation
  contentFingerprint: v.string(),

  // Enrichment phase
  phase: routeEnrichmentPhaseValidator,

  // Status tracking
  status: routeEnrichmentStatusValidator,

  // Scheduled job ID for cancellation
  scheduledJobId: v.optional(v.id('_scheduled_functions')),

  // Results (merged into route options)
  enrichments: v.optional(
    v.array(
      v.object({
        routeOptionId: v.string(),
        label: v.string(),
        rationale: v.string(),
        highlights: v.array(v.string()),
        elevation: v.optional(v.any()),
        weather: v.optional(v.any()),
      })
    )
  ),

  // Error tracking
  error: v.optional(v.string()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
  completedAt: v.optional(v.number()),
})

export type RouteEnrichment = Infer<typeof routeEnrichmentValidator>
