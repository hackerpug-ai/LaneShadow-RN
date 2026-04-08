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
 *
 * Note: Uses clerkUserId (string) instead of v.id('users') for consistency
 * with saved_routes pattern. This allows storing Clerk user IDs directly
 * without requiring a separate users table lookup.
 */
export const favoriteRoadValidator = v.object({
  /**
   * Clerk user ID who owns this favorite road
   * Stored as string for consistency with saved_routes.ownerId pattern
   */
  clerkUserId: v.string(),

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
   */
  updatedAt: v.number(),
})

export type FavoriteRoad = Infer<typeof favoriteRoadValidator>
