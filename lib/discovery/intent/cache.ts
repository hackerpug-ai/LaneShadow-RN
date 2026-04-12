import type { DiscoveryDB } from '../db';
import type { IntentParams } from './validate';

export interface IntentCacheEntry {
  normalized_intent: string;
  schema_version: number;
  params: string; // JSON stringified IntentParams
  hit_count: number;
  created_at: number;
}

/**
 * Look up an intent in the cache.
 * Returns null if not found or schema version mismatch.
 */
export async function lookupIntentCache(
  db: DiscoveryDB,
  normalizedIntent: string,
  schemaVersion: number
): Promise<IntentParams | null> {
  const result = await db.getFirstAsync<{ params: string }>(
    `SELECT params FROM intent_param_cache
     WHERE normalized_intent = ? AND schema_version = ?;`,
    [normalizedIntent, schemaVersion]
  );

  if (result) {
    return JSON.parse(result.params) as IntentParams;
  }

  return null;
}

/**
 * Write intent params to the cache.
 */
export async function writeIntentCache(
  db: DiscoveryDB,
  normalizedIntent: string,
  params: IntentParams,
  schemaVersion: number
): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO intent_param_cache
     (normalized_intent, schema_version, params, hit_count, created_at)
     VALUES (?, ?, ?, 1, ?);`,
    [normalizedIntent, schemaVersion, JSON.stringify(params), Date.now()]
  );
}

/**
 * Increment the hit count for a cached intent.
 */
export async function bumpHitCount(
  db: DiscoveryDB,
  normalizedIntent: string
): Promise<void> {
  await db.runAsync(
    `UPDATE intent_param_cache
     SET hit_count = hit_count + 1
     WHERE normalized_intent = ?;`,
    [normalizedIntent]
  );
}

/**
 * Get the top N most popular cached intents by hit count.
 * Returns the normalized intent strings.
 */
export async function topHitIntents(
  db: DiscoveryDB,
  limit: number
): Promise<string[]> {
  const results = await db.getAllAsync<{ normalized_intent: string }>(
    `SELECT normalized_intent FROM intent_param_cache
     ORDER BY hit_count DESC
     LIMIT ?;`,
    [limit]
  );

  return results.map(r => r.normalized_intent);
}
