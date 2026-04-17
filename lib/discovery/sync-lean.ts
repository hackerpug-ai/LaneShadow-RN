import type { DiscoveryDB } from './db'

export interface ConvexRoute {
  id: string
  name: string
  centroid_lat: number
  centroid_lng: number
  state: string
  archetype: string
  composite_score: number
  content_version: number
}

/**
 * Clear all routes and insert the provided routes in a single transaction.
 * This is used for initial sync or full refresh.
 */
export async function bulkSyncLeanRoutes(db: DiscoveryDB, routes: ConvexRoute[]): Promise<void> {
  await db.execAsync('BEGIN TRANSACTION;')

  try {
    // Clear existing routes
    await db.execAsync('DELETE FROM routes;')

    // Insert all routes
    const stmt = await db.prepareAsync(
      'INSERT INTO routes (id, name, centroid_lat, centroid_lng, state, archetype, composite_score, content_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    )

    for (const route of routes) {
      await stmt.executeAsync(
        route.id,
        route.name,
        route.centroid_lat,
        route.centroid_lng,
        route.state,
        route.archetype,
        route.composite_score,
        route.content_version,
      )
    }

    await db.execAsync('COMMIT;')
  } catch (error) {
    await db.execAsync('ROLLBACK;')
    throw error
  }
}

/**
 * Get the maximum content_version from the local database.
 * Returns 0 if no routes exist.
 */
export async function getMaxContentVersion(db: DiscoveryDB): Promise<number> {
  const result = await db.getFirstAsync<{ max_version: number }>(
    'SELECT MAX(content_version) as max_version FROM routes;',
  )
  return result?.max_version ?? 0
}

/**
 * Sync only routes with content_version greater than the local max.
 * Returns the count of synced routes.
 */
export async function deltaSyncLeanRoutes(db: DiscoveryDB, routes: ConvexRoute[]): Promise<number> {
  const maxVersion = await getMaxContentVersion(db)
  const routesToSync = routes.filter((route) => route.content_version > maxVersion)

  if (routesToSync.length === 0) {
    return 0
  }

  await db.execAsync('BEGIN TRANSACTION;')

  try {
    const stmt = await db.prepareAsync(
      'INSERT OR REPLACE INTO routes (id, name, centroid_lat, centroid_lng, state, archetype, composite_score, content_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
    )

    for (const route of routesToSync) {
      await stmt.executeAsync(
        route.id,
        route.name,
        route.centroid_lat,
        route.centroid_lng,
        route.state,
        route.archetype,
        route.composite_score,
        route.content_version,
      )
    }

    await db.execAsync('COMMIT;')
  } catch (error) {
    await db.execAsync('ROLLBACK;')
    throw error
  }

  return routesToSync.length
}
