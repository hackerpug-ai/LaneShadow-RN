import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

/**
 * Daily cleanup of old empty planning sessions.
 *
 * Runs every day at midnight UTC (5:00 PM PDT / 4:00 PM PST).
 * Deletes planning sessions that:
 * - Were created more than 1 hour ago
 * - Have no messages (empty sessions)
 * - Are not already soft-deleted
 *
 * This helps keep the database clean by removing abandoned sessions
 * that users created but never interacted with.
 */
crons.daily(
  'cleanup-empty-sessions',
  { hourUTC: 0, minuteUTC: 0 },
  internal.db.planningSessions.cleanupOldEmptySessions,
);

/**
 * Weekly map data freshness check.
 *
 * Runs every Monday at 9:00 AM UTC (2:00 AM PDT / 1:00 AM PST).
 * Checks if the PMTiles file on R2 is older than 30 days and logs a warning.
 *
 * If the cron reports "stale" or "missing", refresh the data manually:
 *
 *   # 1. Extract US West from latest Protomaps daily build
 *   pmtiles extract "https://build.protomaps.com/$(date +%Y%m%d).pmtiles" \
 *     /tmp/us-canada.pmtiles --bbox="-170,24,-52,72" --maxzoom=14
 *
 *   # 2. Upload to R2 (set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY first)
 *   pmtiles upload /tmp/us-canada.pmtiles map-data/us-canada.pmtiles \
 *     --bucket='s3://laneshadow?endpoint=https://d5110b1895ee190e145c0c8756f49879.r2.cloudflarestorage.com&region=auto'
 *
 * Or run the helper script: npx tsx scripts/sync-protomaps-r2.ts
 *
 * See convex/actions/agent/providers/protomapsProvider.ts for full docs.
 */
crons.weekly(
  'map-data-freshness-check',
  { dayOfWeek: 'monday', hourUTC: 9, minuteUTC: 0 },
  internal.actions.mapData.checkFreshnessWithAlert,
);

export default crons;
