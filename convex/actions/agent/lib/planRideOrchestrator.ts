'use node'

import { findScenicWaypoints, type RouteVariant } from '../tools/findScenicWaypoints'
import { compileSketch } from '../tools/compileSketch'
import { normalizeRoute } from '../tools/normalizeRoute'
import { computeRouteIndex } from '../tools/computeRouteIndex'
import { probeConditions } from '../tools/probeConditions'
import { mapConditions } from '../tools/mapConditions'
import { createWeatherProvider } from '../providers/weatherProvider'
import type { PlanInput, RouteSnapshot } from '../../../../models/saved-routes'
import type { ActionCtx } from '../../../_generated/server'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type FavoriteRoadForPlanning = {
  id: string
  geometry: string
  bounds?: { north: number; south: number; east: number; west: number }
}

export type OrchestratorResult = {
  routeSnapshot: RouteSnapshot
  sketch: any
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Deterministic route planning orchestrator. Replaces pi agent session.
 *
 * Steps:
 * 1. Discover scenic waypoints via Overpass (findScenicWaypoints)
 * 2. Build RouteSketch objects from waypoint variants (deterministic, no LLM)
 * 3. Compile + normalize all variants in parallel (Promise.allSettled — partial failures ok)
 * 4. Probe weather conditions in parallel (try/catch — failures non-fatal)
 *
 * Note: enrichRoute (US-052) will be wired in after it exists.
 *
 * @param params.planInput - Route planning input (start, end, departure time, preferences)
 * @param params.departureTimeMs - Departure timestamp in milliseconds
 * @param params.favorites - Optional array of favorite roads to influence routing
 * @returns Array of OrchestratorResult (routeSnapshot + sketch), at least one entry
 * @throws {Error} 'NO_ROUTES_GENERATED' if all variant compilations fail
 */
export const planRideOrchestrator = async (params: {
  planInput: PlanInput
  departureTimeMs: number
  favorites?: FavoriteRoadForPlanning[]
}): Promise<OrchestratorResult[]> => {
  const { planInput, departureTimeMs, favorites = [] } = params

  // Step 1: Filter favorites by distance from route corridor
  const routeBounds = {
    north: Math.max(planInput.start.lat, planInput.end.lat),
    south: Math.min(planInput.start.lat, planInput.end.lat),
    east: Math.max(planInput.start.lng, planInput.end.lng),
    west: Math.min(planInput.start.lng, planInput.end.lng),
  }

  const { nearbyFavorites, excludedFavorites } = filterFavoritesByDistance(
    favorites,
    routeBounds,
    50 // 50km threshold
  )

  if (favorites.length > 0) {
    console.info(`[planRideOrchestrator] Favorites: ${nearbyFavorites.length} nearby, ${excludedFavorites.length} excluded (too far)`)
    if (excludedFavorites.length > 0) {
      console.info(`[planRideOrchestrator] Excluded favorites:`, excludedFavorites.map(e => e.id))
    }
  }

  // Step 2: Discover scenic waypoints deterministically via Overpass
  // Then inject favorites into the variants so they influence routing
  const variants = await findScenicWaypoints({
    start: planInput.start,
    end: planInput.end,
    preferences: planInput.preferences,
  })

  // Inject nearby favorites into each variant as waypoints
  // This ensures they are included when the routing provider builds routes
  const variantsWithFavorites = nearbyFavorites.length > 0
    ? injectFavoritesIntoVariants(variants, nearbyFavorites)
    : variants

  console.info(`[planRideOrchestrator] ${variantsWithFavorites.length} variants discovered (including ${nearbyFavorites.length} favorites)`)

  // Step 3: Build RouteSketch + compile + normalize in parallel
  // Promise.allSettled ensures one variant failure does not block the others
  const compiled = await Promise.allSettled(
    variantsWithFavorites.map(async (variant) => {
      const sketch = buildSketchFromVariant(variant)
      const providerRoute = await compileSketch({ planInput, sketch })
      const routeSnapshot = await normalizeRoute({ providerRoute, planInput })
      return { routeSnapshot, sketch }
    })
  )

  const successful = compiled
    .filter(
      (r): r is PromiseFulfilledResult<{ routeSnapshot: RouteSnapshot; sketch: any }> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)

  // Log failures so we can debug NO_ROUTES_GENERATED
  const failed = compiled.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]
  for (const f of failed) {
    console.error(`[planRideOrchestrator] variant compile failed:`, f.reason?.message ?? f.reason)
  }

  console.info(
    `[planRideOrchestrator] ${variants.length} variants, ${successful.length} routes compiled, ${failed.length} failed`
  )

  if (successful.length === 0) {
    throw new Error('NO_ROUTES_GENERATED')
  }

  // Step 3: Probe weather conditions — parallel, best-effort (failure not fatal per variant)
  const weatherProvider = createWeatherProvider()

  const withConditions = await Promise.all(
    successful.map(async ({ routeSnapshot, sketch }) => {
      try {
        const routeIndex = await computeRouteIndex(routeSnapshot)
        const probed = await probeConditions({ routeIndex, departureTimeMs, weatherProvider })
        const windOverlay = await mapConditions({ routeSnapshot, routeIndex, probed })
        const updatedSnapshot: RouteSnapshot = {
          ...routeSnapshot,
          overlays: { ...routeSnapshot.overlays, wind: windOverlay },
        }
        return { routeSnapshot: updatedSnapshot, sketch }
      } catch {
        console.warn(
          '[planRideOrchestrator] conditions failed for one route, continuing without weather'
        )
        return { routeSnapshot, sketch }
      }
    })
  )

  const conditionsCount = withConditions.filter(
    (r) => r.routeSnapshot.overlays?.wind !== undefined
  ).length

  console.info(
    `[planRideOrchestrator] ${variants.length} variants, ${successful.length} succeeded, conditions: ${conditionsCount}/${successful.length}`
  )

  // Note: enrichRoute (US-052) will be wired in after it exists.
  // For now, build fallback labels from variant IDs.
  return withConditions.map(({ routeSnapshot, sketch }, idx) => ({
    routeSnapshot,
    sketch: {
      ...sketch,
      label: sketch.label || `Route ${idx + 1}`,
      rationale: sketch.rationale ?? '',
      includedFavorites: nearbyFavorites.map(f => f.id), // Pass included favorite IDs
      excludedFavorites, // Pass excluded favorites with reasons
    },
  }))
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Calculate approximate distance between two bounding boxes in kilometers.
 * Uses a simple haversine-like approximation for the center points.
 */
const calculateBoundsDistance = (
  bounds1: { north: number; south: number; east: number; west: number },
  bounds2: { north: number; south: number; east: number; west: number }
): number => {
  const center1 = {
    lat: (bounds1.north + bounds1.south) / 2,
    lng: (bounds1.east + bounds1.west) / 2,
  }
  const center2 = {
    lat: (bounds2.north + bounds2.south) / 2,
    lng: (bounds2.east + bounds2.west) / 2,
  }

  const R = 6371 // Earth's radius in km
  const dLat = ((center2.lat - center1.lat) * Math.PI) / 180
  const dLng = ((center2.lng - center1.lng) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((center1.lat * Math.PI) / 180) *
      Math.cos((center2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Filter favorites by distance from route corridor.
 * Favorites beyond 50km threshold are excluded.
 *
 * @param favorites - All user favorites
 * @param routeBounds - Bounds of the planned route
 * @param thresholdKm - Distance threshold in kilometers (default 50)
 * @returns Nearby favorites and excluded favorites with reasons
 */
export const filterFavoritesByDistance = (
  favorites: FavoriteRoadForPlanning[],
  routeBounds: { north: number; south: number; east: number; west: number },
  thresholdKm: number = 50
): {
  nearbyFavorites: FavoriteRoadForPlanning[]
  excludedFavorites: Array<{ id: string; reason: string }>
} => {
  const nearbyFavorites: FavoriteRoadForPlanning[] = []
  const excludedFavorites: Array<{ id: string; reason: string }> = []

  for (const fav of favorites) {
    if (!fav.bounds) {
      // If no bounds, can't determine distance - exclude
      excludedFavorites.push({ id: fav.id, reason: 'no_bounds' })
      continue
    }

    const distance = calculateBoundsDistance(fav.bounds, routeBounds)

    if (distance <= thresholdKm) {
      nearbyFavorites.push(fav)
    } else {
      excludedFavorites.push({ id: fav.id, reason: 'too_far' })
    }
  }

  return { nearbyFavorites, excludedFavorites }
}

/**
 * Inject favorite roads into route variants as waypoints.
 * Favorites are converted to waypoints and added to each variant's waypoint list.
 * This ensures the routing provider will route through these favorite areas.
 *
 * @param variants - Route variants from findScenicWaypoints
 * @param favorites - Nearby favorites to inject
 * @returns Route variants with favorites added as waypoints
 */
const injectFavoritesIntoVariants = (
  variants: RouteVariant[],
  favorites: FavoriteRoadForPlanning[]
): RouteVariant[] => {
  if (favorites.length === 0) {
    return variants
  }

  // Convert favorites to waypoints by extracting representative points
  // For now, use the center of the favorite's bounds as the waypoint location
  const favoriteWaypoints: Array<{ lat: number; lng: number; name: string; type: 'scenic_road'; score: number }> = []

  for (const fav of favorites) {
    if (!fav.bounds) {
      console.warn(`[injectFavoritesIntoVariants] Skipping favorite ${fav.id} - no bounds`)
      continue
    }

    // Use center of bounds as waypoint location
    const centerLat = (fav.bounds.north + fav.bounds.south) / 2
    const centerLng = (fav.bounds.east + fav.bounds.west) / 2

    favoriteWaypoints.push({
      lat: centerLat,
      lng: centerLng,
      name: fav.id, // Use favorite ID as waypoint name
      type: 'scenic_road',
      score: 4, // Higher score than scenic waypoints to prioritize favorites
    })
  }

  // Inject favorite waypoints into each variant
  // Insert them after the start waypoint but before the end
  return variants.map((variant) => ({
    ...variant,
    waypoints: [
      variant.waypoints[0], // Keep start waypoint
      ...favoriteWaypoints, // Add favorites
      ...variant.waypoints.slice(1), // Add remaining waypoints
    ],
  }))
}

/**
 * Build a RouteSketch from a RouteVariant's waypoints.
 * Deterministic — no LLM involved.
 * Exported for testing.
 */
export const buildSketchFromVariant = (variant: RouteVariant): any => ({
  label: variant.id.replace(/-/g, ' '),
  rationale: '',
  segments: [],
  anchorPoints: variant.waypoints.map((wp) => ({
    name: wp.name,
    kind: wp.type === 'pass' ? 'pass' : wp.type === 'peak' ? 'vista' : 'junction',
    lat: wp.lat,
    lng: wp.lng,
  })),
})
