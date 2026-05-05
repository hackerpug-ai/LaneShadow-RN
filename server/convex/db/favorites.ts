import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireIdentity } from '../guards'

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const favoriteLocationOutputValidator = v.object({
  name: v.string(),
  geometry: v.string(),
  bounds: v.optional(
    v.object({
      north: v.number(),
      south: v.number(),
      east: v.number(),
      west: v.number(),
    }),
  ),
})

// ---------------------------------------------------------------------------
// Exported Convex functions
// ---------------------------------------------------------------------------

/**
 * List favorite locations for the authenticated rider.
 * Returns locations scoped to the calling clerkUserId.
 */
export const listFavoriteLocations = query({
  args: {},
  returns: v.array(favoriteLocationOutputValidator),
  handler: async (ctx) => {
    // AC-5: Require authentication - throws UNAUTHENTICATED if no identity
    const { clerkUserId } = await requireIdentity(ctx)

    // AC-4: Use withIndex to query by clerkUserId (no filter() allowed)
    const favorites = await ctx.db
      .query('favorite_roads')
      .withIndex('by_clerkUserId', (q) => q.eq('clerkUserId', clerkUserId))
      .order('desc')
      .collect()

    // Return only the fields needed by the client
    return favorites.map((fav) => ({
      name: fav.name,
      geometry: fav.geometry,
      bounds: fav.bounds,
    }))
  },
})
