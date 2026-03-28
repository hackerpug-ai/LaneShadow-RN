import { defineSchema, defineTable } from 'convex/server'
import { favoriteRoadValidator } from '../models/favorite-roads'
import { orgMembershipValidator } from '../models/org-memberships'
import { orgValidator } from '../models/orgs'
import { savedRouteValidator } from '../models/saved-routes'
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
})
