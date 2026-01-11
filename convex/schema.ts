import { defineSchema, defineTable } from 'convex/server'
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
  users: defineTable(userValidator).index('by_email', ['email']),

  saved_routes: defineTable(savedRouteValidator)
    .index('by_ownerType_and_ownerId', ['ownerType', 'ownerId'])
    .index('by_createdByUserId', ['createdByUserId']),
})
