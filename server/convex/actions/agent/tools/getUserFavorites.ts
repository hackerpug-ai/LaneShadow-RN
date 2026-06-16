'use node'

/**
 * getUserFavorites — Agent tool for retrieving user's favorite roads in a region.
 *
 * Note: The full favorites schema (rating, rideCount, lastRidden) is defined in Epic 6.
 * This tool is built against the expected schema. Until Epic 6 ships, callers that
 * provide the favorites list from Epic 6 data will get real results; callers that
 * pass an empty array will get an empty response (no degraded experience).
 */

export type BoundingBox = {
  north: number
  south: number
  east: number
  west: number
}

export type UserFavorite = {
  roadName: string
  rating: number
  rideCount: number
  lastRidden: string
  lat: number
  lng: number
}

export type GetUserFavoritesArgs = {
  bbox: BoundingBox
}

type GetUserFavoritesResult = Pick<
  UserFavorite,
  'roadName' | 'rating' | 'rideCount' | 'lastRidden'
>[]

const MAX_RESULTS = 10

/**
 * Returns whether a point falls within the given bounding box.
 */
const isWithinBbox = (lat: number, lng: number, bbox: BoundingBox): boolean =>
  lat >= bbox.south && lat <= bbox.north && lng >= bbox.west && lng <= bbox.east

/**
 * Comparator for sorting favorites: rating desc, then rideCount desc, then lastRidden desc.
 */
const compareFavorites = (a: UserFavorite, b: UserFavorite): number => {
  if (b.rating !== a.rating) return b.rating - a.rating
  if (b.rideCount !== a.rideCount) return b.rideCount - a.rideCount
  return b.lastRidden.localeCompare(a.lastRidden)
}

/**
 * Filters and sorts a user's favorites within a bounding box, returning at most 10.
 *
 * The second argument `allFavorites` is injectable for testing and future Convex
 * query integration. In production, this list comes from the `favorite_roads` table
 * via the caller (the ridePlanningAgent action).
 */
export const getUserFavorites = async (
  args: GetUserFavoritesArgs,
  allFavorites: UserFavorite[],
): Promise<GetUserFavoritesResult> => {
  const { bbox } = args

  const inRegion = allFavorites.filter((f) => isWithinBbox(f.lat, f.lng, bbox))
  const sorted = inRegion.sort(compareFavorites)
  const capped = sorted.slice(0, MAX_RESULTS)

  return capped.map(({ roadName, rating, rideCount, lastRidden }) => ({
    roadName,
    rating,
    rideCount,
    lastRidden,
  }))
}
