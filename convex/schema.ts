import { defineSchema, defineTable } from 'convex/server'
import { favoriteRoadValidator } from '../models/favorite-roads'
import { orgMembershipValidator } from '../models/org-memberships'
import { orgValidator } from '../models/orgs'
import { planUsageValidator } from '../models/plan-usage'
import { planningSessionValidator } from '../models/planning-sessions'
import { routePlanValidator } from '../models/route-plans'
import { savedRouteValidator } from '../models/saved-routes'
import { sessionMessageValidator } from '../models/session-messages'
import { userValidator } from '../models/users'

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
    .index('by_clerkUserId_and_status', ['clerkUserId', 'status']),

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
   * Separate table allows pagination and avoids document size limits
   */
  session_messages: defineTable(sessionMessageValidator)
    .index('by_sessionId', ['sessionId']),
})
