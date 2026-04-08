import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'
import { favoriteRoadValidator } from '../models/favorite-roads'
import { orgMembershipValidator } from '../models/org-memberships'
import { orgValidator } from '../models/orgs'
import { planUsageValidator } from '../models/plan-usage'
import { planningSessionValidator } from '../models/planning-sessions'
import { routePlanValidator } from '../models/route-plans'
import { planInputValidator } from '../models/saved-routes'
import { savedRouteValidator } from '../models/saved-routes'
import { sessionMessageValidator } from '../models/session-messages'
import { tripPlanValidator } from '../models/trip-plan'
import { userValidator } from '../models/users'
import { performanceValidator } from '../models/performance'
import { osmNodeValidator, osmWayValidator, osmImportJobValidator } from '../models/osm-data'
import { routeEnrichmentValidator } from '../models/route-enrichments'

/**
 * Convex Database Schema for React Native + Convex Template
 *
 * Define all tables here using validators derived from models/
 * See models/README.md for validator-first (Convex `v`) patterns
 */
export default defineSchema({
  /**
   * Users table - Demo table showing the pattern
   * Every user has an email (indexed for quick lookups), name, and creation timestamp
   */
  users: defineTable(userValidator)
    .index('by_email', ['email'])
    .index('by_clerkUserId', ['clerkUserId']),

  orgs: defineTable(orgValidator).index('by_clerkOrgId', ['clerkOrgId']),

  org_memberships: defineTable(orgMembershipValidator)
    .index('by_userId_and_orgId', ['userId', 'orgId'])
    .index('by_orgId', ['orgId'])
    .index('by_userId', ['userId']),

  saved_routes: defineTable(savedRouteValidator)
    .index('by_ownerType_and_ownerId', ['ownerType', 'ownerId'])
    .index('by_createdByUserId', ['createdByUserId']),

  /**
   * Favorite roads table - Stores user's favorite road segments
   * Indexed by userId for efficient user-specific queries
   * Indexed by createdAt for chronological ordering
   */
  favorite_roads: defineTable(favoriteRoadValidator)
    .index('by_userId', ['userId'])
    .index('by_createdAt', ['createdAt']),

  route_plans: defineTable(routePlanValidator)
    .index('by_clerkUserId_and_status', ['clerkUserId', 'status'])
    .index('by_planningSessionId_and_status', ['planningSessionId', 'status']),

  /**
   * Plan usage table - Tracks monthly route plan usage per user for rate limiting
   * Free tier: 5 plans per month
   * Indexed by clerkUserId and month for efficient usage queries
   */
  plan_usage: defineTable(planUsageValidator).index(
    'by_clerkUserId_and_month',
    ['clerkUserId', 'month']
  ),

  /**
   * Planning sessions table - Agentic conversational planning sessions
   * Indexed by clerkUserId for user session lookup
   * Indexed by clerkUserId and updatedAt for chronological ordering
   */
  planning_sessions: defineTable(planningSessionValidator)
    .index('by_clerkUserId', ['clerkUserId'])
    .index('by_clerkUserId_and_updatedAt', ['clerkUserId', 'updatedAt']),

  /**
   * Session messages table - Messages within planning sessions
   * Indexed by sessionId for efficient message retrieval
   * Indexed by sessionId and status for fast "is anything streaming/running?" lookups
   * Separate table allows pagination and avoids document size limits
   */
  session_messages: defineTable(sessionMessageValidator)
    .index('by_sessionId', ['sessionId'])
    .index('by_sessionId_and_status', ['sessionId', 'status']),

  performance: defineTable(performanceValidator)
    .index('by_processType', ['processType'])
    .index('by_agent_and_createdAt', ['agent', 'createdAt'])
    .index('by_createdAt', ['createdAt']),

  /**
   * OSM nodes table - Scenic waypoints (viewpoints, peaks, mountain passes)
   * Indexed by s2Token for efficient spatial queries
   * Indexed by osmId for deduplication during import
   */
  osm_nodes: defineTable(osmNodeValidator)
    .index('by_osmId', ['osmId'])
    .index('by_s2Token', ['s2Token'])
    .index('by_type', ['type']),

  /**
   * OSM ways table - Road segments with simplified geometry
   * Indexed by s2Tokens for spatial bbox queries (ways can span multiple cells)
   * Indexed by name for exact road name lookups
   * Indexed by highwayClass for filtering by road type
   */
  osm_ways: defineTable(osmWayValidator)
    .index('by_osmId', ['osmId'])
    .index('by_name', ['name'])
    .index('by_highwayClass', ['highwayClass']),

  /**
   * OSM import jobs table - Tracks ETL import progress
   * Indexed by status for job queue queries
   */
  osm_import_jobs: defineTable(osmImportJobValidator)
    .index('by_status', ['status']),

  /**
   * Trip plans table - Stores no-tool LLM trip plan generation records
   * Indexed by clerkUserId for user trip plan lookups
   */
  trip_plans: defineTable({
    clerkUserId: v.string(),
    planInput: planInputValidator,
    status: v.union(
      v.literal('pending'),
      v.literal('generating'),
      v.literal('needs_retry'),
      v.literal('completed'),
      v.literal('failed')
    ),
    result: v.optional(tripPlanValidator),
    attemptCount: v.number(),
    error: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['clerkUserId']),

  /**
   * Route enrichments table - Tracks background enrichment jobs with cache support
   * Indexed by routePlanId for finding enrichments for a specific route plan
   * Indexed by contentFingerprint and phase for cache lookup and invalidation
   */
  route_enrichments: defineTable(routeEnrichmentValidator)
    .index('by_routePlanId', ['routePlanId'])
    .index('by_contentFingerprint_and_phase', ['contentFingerprint', 'phase']),
})
