import { v } from 'convex/values'

import { query } from '../_generated/server'
import { requireIdentity } from '../guards'

// ---------------------------------------------------------------------------
// Exported validators
// ---------------------------------------------------------------------------

export const favoriteLocationOutputValidator = v.object({
  id: v.string(),
  lat: v.number(),
  lng: v.number(),
  label: v.string(),
  bounds: v.optional(
    v.object({
      north: v.number(),
      south: v.number(),
      east: v.number(),
      west: v.number(),
    }),
  ),
})

const parsePointGeometry = (geometry: string): { lat: number; lng: number } => {
  const parsed = JSON.parse(geometry) as {
    coordinates?: [number, number]
  }
  const coordinates = parsed.coordinates
  if (!Array.isArray(coordinates) || coordinates.length < 2) {
    throw new Error('Invalid favorite location geometry')
  }

  return {
    lng: coordinates[0],
    lat: coordinates[1],
  }
}

// ---------------------------------------------------------------------------
// Exported handler (for testing without Convex runtime)
// ---------------------------------------------------------------------------

/**
 * Handler for listing favorite locations for the authenticated rider.
 * Extracted for testing purposes.
 *
 * AC-5: Require authentication - throws UNAUTHENTICATED if no identity
 * AC-4: Use withIndex to query by clerkUserId (no filter() allowed)
 */
export const listFavoriteLocationsHandler = async (ctx: any) => {
  // AC-5: Require authentication - throws UNAUTHENTICATED if no identity
  const { clerkUserId } = await requireIdentity(ctx)

  // AC-4: Use withIndex to query by clerkUserId (no filter() allowed)
  const favorites = await ctx.db
    .query('favorite_roads')
    .withIndex('by_clerkUserId', (q: any) => q.eq('clerkUserId', clerkUserId))
    .order('desc')
    .collect()

  // Return only the fields needed by the client
  return favorites.map((fav: any) => {
    const { lat, lng } = parsePointGeometry(fav.geometry)

    return {
      id: String(fav._id),
      lat,
      lng,
      label: fav.name,
      ...(fav.bounds ? { bounds: fav.bounds } : {}),
    }
  })
}

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
  handler: listFavoriteLocationsHandler,
})
