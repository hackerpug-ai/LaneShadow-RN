import { defineSchema, defineTable } from 'convex/server'
import { UserValidator } from '../models/users'

/**
 * Convex Database Schema for React Native + Convex Template
 *
 * Define all tables here using validators derived from models/
 * See models/README.md for Zod-first pattern explanation
 */
export default defineSchema({
  /**
   * Users table - Demo table showing the pattern
   * Every user has an email (indexed for quick lookups), name, and creation timestamp
   */
  users: defineTable(UserValidator).index('by_email', ['email']),

  // Add your tables below following the same pattern
  // Example:
  // posts: defineTable(PostV).index('by_user_id', ['userId']),
})
