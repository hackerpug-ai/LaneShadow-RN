/**
 * Curated Geometry Hygiene — Sprint 03 Catalog Hygiene
 *
 * This module hosts the at-rest catalog hygiene passes (UC-HYG-01):
 * - normalizeEditorialScores: ÷100 any 0–100 editorial score at rest,
 *   idempotent via scoreScaleNormalizedAt marker + value>1 guard.
 *
 * S3-T2/S3-T3 will reuse the shared {dryRun?} preview/change-set helper
 * pattern established here.
 *
 * CONVENTIONS (from backfill-curated-geometry.ts driver):
 *   --dryRun    Preview the change-set without writing
 *   npx convex run curatedGeometryHygiene:normalizeEditorialScores '{"dryRun":true}'
 *   npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}'
 */

import { v } from 'convex/values'
import type { Doc } from './_generated/dataModel'
import { internalMutation, type MutationCtx } from './_generated/server'

// ---------------------------------------------------------------------------
// Pure helpers (exported for unit testing)
// ---------------------------------------------------------------------------

/**
 * Scale predicate: divide a value > 1 by 100; leave 0–1 values untouched.
 *
 * This is the at-rest equivalent of the read-path `norm` helper
 * (curatedRoutes.ts:129). It is a pure function with zero I/O.
 *
 * Out-of-scale iff value > 1 (0–100 stored scale).
 * In-scale (≤1) rows are left byte-for-byte unchanged.
 */
export const normalizeScore = (value: number): number => (value > 1 ? value / 100 : value)

/**
 * Type for the dimension score fields on a curated_routes doc.
 */
type DimensionScores = {
  compositeScore: number
  curvatureScore?: number
  scenicScore?: number
  technicalScore?: number
  trafficScore?: number
  remotenessScore?: number
}

/**
 * Compute the normalized scores for a single row.
 * Returns null if the row does not need normalization
 * (scoreScaleNormalizedAt present OR compositeScore ≤ 1).
 */
type NormalizeResult = {
  compositeScore: number
  curvatureScore?: number
  scenicScore?: number
  technicalScore?: number
  trafficScore?: number
  remotenessScore?: number
  scoreScaleNormalizedAt: number
} | null

export function computeNormalizedScores(
  row: DimensionScores & { scoreScaleNormalizedAt?: number },
): NormalizeResult {
  // Double idempotency gate: marker + value>1 guard
  // If scoreScaleNormalizedAt is already set, this row was already processed.
  // If compositeScore ≤ 1, the row is already in-scale.
  const needsNormalize = row.scoreScaleNormalizedAt == null && row.compositeScore > 1
  if (!needsNormalize) return null

  return {
    compositeScore: normalizeScore(row.compositeScore),
    curvatureScore: row.curvatureScore != null ? normalizeScore(row.curvatureScore) : undefined,
    scenicScore: row.scenicScore != null ? normalizeScore(row.scenicScore) : undefined,
    technicalScore: row.technicalScore != null ? normalizeScore(row.technicalScore) : undefined,
    trafficScore: row.trafficScore != null ? normalizeScore(row.trafficScore) : undefined,
    remotenessScore: row.remotenessScore != null ? normalizeScore(row.remotenessScore) : undefined,
    scoreScaleNormalizedAt: Date.now(),
  }
}

// ---------------------------------------------------------------------------
// Shared {dryRun?} change-set helper (reused by S3-T2/S3-T3)
// ---------------------------------------------------------------------------

/**
 * Hygiene change-set result — identical shape for dry-run preview and commit.
 */
export type HygieneChangeSet = {
  scanned: number
  normalized: number
}

/**
 * Fetch candidate rows for score normalization.
 *
 * Uses the by_composite_score index to only read rows with compositeScore > 1
 * (avoids the 16MB read limit from scanning the full 5,654+ row catalog).
 * If `routeIdPrefix` is provided, further filters by routeId prefix.
 */
async function fetchOutOfScaleRows(
  ctx: MutationCtx,
  routeIdPrefix?: string,
): Promise<Doc<'curated_routes'>[]> {
  // Use the by_composite_score index to only fetch out-of-scale rows (> 1).
  // This dramatically reduces read volume vs. scanning the full catalog.
  const rows = await ctx.db
    .query('curated_routes')
    .withIndex('by_composite_score', (q) => q.gt('compositeScore', 1))
    .collect()

  if (!routeIdPrefix) return rows

  // In-memory filter by routeId prefix (for test isolation or scoped runs)
  return rows.filter((row) => row.routeId.startsWith(routeIdPrefix))
}

// ---------------------------------------------------------------------------
// normalizeEditorialScores: ÷100 editorial scores at rest
// ---------------------------------------------------------------------------

/**
 * S3-T1: Normalize editorial scores ÷100 at rest.
 *
 * Scans curated_routes for rows where compositeScore > 1 and
 * scoreScaleNormalizedAt is absent (out-of-scale, unprocessed).
 * Divides compositeScore + all dimension scores by 100 at rest,
 * stamps scoreScaleNormalizedAt for idempotency.
 *
 * {dryRun:true} returns the preview change-set {scanned,normalized}
 * WITHOUT writing anything. The committed run returns the same shape
 * and applies the change-set.
 *
 * Optional {routeIdPrefix} scopes the pass to only routes whose routeId
 * starts with the given prefix (used for test isolation; production runs
 * omit it to process the full catalog).
 *
 * Idempotent: the marker + value>1 guard ensure no score is ever divided twice.
 */
export const normalizeEditorialScores = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    routeIdPrefix: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<HygieneChangeSet> => {
    const dryRun = args.dryRun ?? false

    // Fetch only out-of-scale rows via index (avoids 16MB read limit)
    const rows = await fetchOutOfScaleRows(ctx, args.routeIdPrefix)

    let scanned = 0
    let normalized = 0

    for (const row of rows) {
      scanned++

      const normalizedScores = computeNormalizedScores(row)
      if (normalizedScores === null) continue

      if (!dryRun) {
        await ctx.db.patch(row._id, normalizedScores)
      }
      normalized++
    }

    return { scanned, normalized }
  },
})
