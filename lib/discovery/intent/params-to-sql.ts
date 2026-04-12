import type { DiscoveryDB } from '../db';
import type { IntentParams, Spot } from './types';

/**
 * Convert validated intent params to a SQL WHERE clause and parameters.
 * Returns routes matching the criteria, ordered by composite_score DESC.
 */
export async function runParamsQuery(
  db: DiscoveryDB,
  params: IntentParams,
  center: { lat: number; lng: number }
): Promise<Spot[]> {
  const conditions: string[] = [];
  const sqlParams: (string | number)[] = [];

  // Build WHERE clause from params
  if (params.archetypes && params.archetypes.length > 0) {
    const placeholders = params.archetypes.map(() => '?').join(',');
    conditions.push(`archetype IN (${placeholders})`);
    sqlParams.push(...params.archetypes);
  }

  if (params.states && params.states.length > 0) {
    const placeholders = params.states.map(() => '?').join(',');
    conditions.push(`state IN (${placeholders})`);
    sqlParams.push(...params.states);
  }

  // Distance filtering (using bounding box as approximation)
  if (params.minDistance !== undefined || params.maxDistance !== undefined) {
    // Approximate: 1 degree ≈ 69 miles
    // For simplicity, we use a fixed radius around center
    const maxDist = params.maxDistance ?? 100; // Default 100 miles
    const radiusDeg = maxDist / 69;

    conditions.push(
      `centroid_lat >= ? AND centroid_lat <= ? AND centroid_lng >= ? AND centroid_lng <= ?`
    );
    sqlParams.push(
      center.lat - radiusDeg,
      center.lat + radiusDeg,
      center.lng - radiusDeg,
      center.lng + radiusDeg
    );
  }

  // Build final query
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const limit = params.minDistance !== undefined || params.maxDistance !== undefined ? 50 : 10;

  const query = `
    SELECT id, name, centroid_lat as latitude, centroid_lng as longitude, state, archetype, composite_score
    FROM routes
    ${whereClause}
    ORDER BY composite_score DESC
    LIMIT ${limit}
  `;

  const result = await db.getAllAsync<Spot>(query, sqlParams);
  return result ?? [];
}
