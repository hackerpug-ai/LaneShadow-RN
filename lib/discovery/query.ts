import type { DiscoveryDB } from './db'

export interface Spot {
  id: string
  name: string
  latitude: number
  longitude: number
  state: string
  archetype: string
  composite_score: number
}

/**
 * Query routes within a bounding box.
 * Results are ordered by composite_score DESC.
 */
export async function queryByBoundingBox(
  db: DiscoveryDB,
  minLat: number,
  maxLat: number,
  minLon: number,
  maxLon: number,
): Promise<Spot[]> {
  const result = await db.getAllAsync<Spot>(
    `SELECT id, name, centroid_lat as latitude, centroid_lng as longitude, state, archetype, composite_score
     FROM routes
     WHERE centroid_lat >= ? AND centroid_lat <= ?
       AND centroid_lng >= ? AND centroid_lng <= ?
     ORDER BY composite_score DESC`,
    [minLat, maxLat, minLon, maxLon],
  )
  return result ?? []
}

/**
 * Query all routes in a given state.
 * Results are ordered by composite_score DESC.
 */
export async function queryByState(db: DiscoveryDB, state: string): Promise<Spot[]> {
  const result = await db.getAllAsync<Spot>(
    `SELECT id, name, centroid_lat as latitude, centroid_lng as longitude, state, archetype, composite_score
     FROM routes
     WHERE state = ?
     ORDER BY composite_score DESC`,
    [state],
  )
  return result ?? []
}

/**
 * Query all routes matching an archetype.
 * Results are ordered by composite_score DESC.
 */
export async function queryByArchetype(db: DiscoveryDB, archetype: string): Promise<Spot[]> {
  const result = await db.getAllAsync<Spot>(
    `SELECT id, name, centroid_lat as latitude, centroid_lng as longitude, state, archetype, composite_score
     FROM routes
     WHERE archetype = ?
     ORDER BY composite_score DESC`,
    [archetype],
  )
  return result ?? []
}

/**
 * Query top N routes by composite score globally.
 * Default limit is 10.
 */
export async function queryTopRoutes(db: DiscoveryDB, limit: number = 10): Promise<Spot[]> {
  const result = await db.getAllAsync<Spot>(
    `SELECT id, name, centroid_lat as latitude, centroid_lng as longitude, state, archetype, composite_score
     FROM routes
     ORDER BY composite_score DESC
     LIMIT ?`,
    [limit],
  )
  return result ?? []
}
