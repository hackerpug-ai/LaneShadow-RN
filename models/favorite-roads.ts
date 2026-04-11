import { Infer, v } from 'convex/values'

/**
 * Bounds validator for geographic bounding box
 * Used for efficient map viewport queries
 */
export const boundsValidator = v.object({
  north: v.number(),
  south: v.number(),
  east: v.number(),
  west: v.number(),
})

export type Bounds = Infer<typeof boundsValidator>

/**
 * Favorite road validator
 * Represents a user's favorite road segment with geometry and metadata
 */
export const favoriteRoadValidator = v.object({
  /**
   * Reference to the user who owns this favorite road
   * TODO: Migrate existing data from clerkUserId string to userId id('users')
   * Making both fields optional during migration period
   */
  userId: v.optional(v.id('users')),
  clerkUserId: v.optional(v.string()),

  /**
   * User-defined name for this favorite road
   */
  name: v.string(),

  /**
   * Encoded polyline string representing the road geometry
   * Same format as RouteSnapshot.overviewGeometry
   */
  geometry: v.string(),

  /**
   * Optional geographic bounding box for efficient viewport queries
   */
  bounds: v.optional(boundsValidator),

  /**
   * Unix timestamp when this favorite road was created
   */
  createdAt: v.number(),

  /**
   * Unix timestamp when this favorite road was last updated
   * TODO: Add updatedAt to all new records
   */
  updatedAt: v.optional(v.number()),
})

export type FavoriteRoad = Infer<typeof favoriteRoadValidator>
