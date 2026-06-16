import type { DiscoveryDB } from './db'

export const EVICTION_THRESHOLD = 500

export interface EnrichmentData {
  // The enrichment data structure from Convex
  [key: string]: any
}

/**
 * Cache enrichment data with LRU eviction.
 * If the cache exceeds EVICTION_THRESHOLD (500), evicts the least recently used entry.
 */
export async function cacheEnrichment(
  db: DiscoveryDB,
  routeId: string,
  data: EnrichmentData,
  version: number,
): Promise<void> {
  // Check current count
  const countResult = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM route_enrichment;',
  )
  const count = countResult?.count ?? 0

  // Evict LRU entry if exceeding threshold
  if (count >= EVICTION_THRESHOLD) {
    await db.execAsync(`
      DELETE FROM route_enrichment
      WHERE route_id = (
        SELECT route_id FROM route_enrichment
        ORDER BY last_accessed ASC
        LIMIT 1
      );
    `)
  }

  // Insert or replace the enrichment
  await db.runAsync(
    'INSERT OR REPLACE INTO route_enrichment (route_id, enrichment_version, data, last_accessed) VALUES (?, ?, ?, ?);',
    [routeId, version, JSON.stringify(data), Date.now()],
  )
}

/**
 * Fetch enrichment data from cache.
 * Updates last_accessed timestamp to promote in LRU order.
 * Returns null if not found.
 */
export async function fetchEnrichment(
  db: DiscoveryDB,
  routeId: string,
): Promise<EnrichmentData | null> {
  const result = await db.getFirstAsync<{ data: string }>(
    'SELECT data FROM route_enrichment WHERE route_id = ?;',
    [routeId],
  )

  if (result) {
    // Update last_accessed timestamp
    await db.runAsync('UPDATE route_enrichment SET last_accessed = ? WHERE route_id = ?;', [
      Date.now(),
      routeId,
    ])

    return JSON.parse(result.data)
  }

  return null
}
