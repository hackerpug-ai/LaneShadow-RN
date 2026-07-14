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
 * REDHAT-FIX-004: All handlers use .paginate({cursor, numItems}) so the
 * real 5,757-row catalog stays under Convex's per-transaction read limit.
 *
 * CONVENTIONS (from backfill-curated-geometry.ts driver):
 *   --dryRun    Preview the change-set without writing
 *   npx convex run curatedGeometryHygiene:normalizeEditorialScores '{"dryRun":true}'
 *   npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}'
 */

import { v } from 'convex/values'
import { internalMutation } from './_generated/server'

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
 * (scoreScaleNormalizedAt present OR ALL score fields ≤ 1).
 *
 * Per-dimension gate: ANY score field > 1 triggers normalization,
 * not just compositeScore. This catches mixed-scale rows where
 * compositeScore is already in-scale (≤1) but individual dimensions
 * are on the 0–100 scale.
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

/** Score fields checked for out-of-scale values (> 1). */
const SCORE_FIELDS = [
  'compositeScore',
  'curvatureScore',
  'scenicScore',
  'technicalScore',
  'trafficScore',
  'remotenessScore',
] as const

export function computeNormalizedScores(
  row: DimensionScores & { scoreScaleNormalizedAt?: number },
): NormalizeResult {
  const hasAnyOutOfScale = SCORE_FIELDS.some(
    (k) => typeof row[k] === 'number' && (row[k] as number) > 1,
  )
  const needsNormalize = row.scoreScaleNormalizedAt == null && hasAnyOutOfScale
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
 *
 * REDHAT-FIX-004: now includes {continueCursor, isDone} for paginated
 * multi-batch processing. The additive fields are backward-compatible —
 * callers destructuring {scanned, normalized} are unaffected.
 */
export type HygieneChangeSet = {
  scanned: number
  normalized: number
  continueCursor: string
  isDone: boolean
}

// ---------------------------------------------------------------------------
// normalizeEditorialScores: ÷100 editorial scores at rest (paginated)
// ---------------------------------------------------------------------------

/**
 * S3-T1: Normalize editorial scores ÷100 at rest.
 *
 * Uses Convex `.paginate({cursor, numItems})` to stay under the
 * per-transaction read limit on the real 5,757-row catalog.
 *
 * Args (all optional — bare {} works for backward compat):
 *   - dryRun: true previews without writing
 *   - routeIdPrefix: scope to test rows only
 *   - cursor: opaque continuation cursor from a prior response
 *   - batchSize: rows per batch (default 100)
 *
 * Returns {scanned, normalized, continueCursor, isDone} on every call.
 * Loop until isDone===true to process the full catalog.
 *
 * Idempotent: the marker + value>1 guard ensure no score is ever divided twice.
 */
export const normalizeEditorialScores = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    routeIdPrefix: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<HygieneChangeSet> => {
    const dryRun = args.dryRun ?? false
    const cursor = args.cursor ?? null
    const numItems = args.batchSize ?? 100

    // Build the paginated query based on prefix mode
    const page = args.routeIdPrefix
      ? await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) =>
            q.gte('routeId', args.routeIdPrefix!).lt('routeId', `${args.routeIdPrefix!}\uffff`),
          )
          .paginate({ cursor, numItems })
      : await ctx.db
          .query('curated_routes')
          .withIndex('by_composite_score', (q) => q.gt('compositeScore', 1))
          .paginate({ cursor, numItems })

    let scanned = 0
    let normalized = 0

    for (const row of page.page) {
      scanned++

      const normalizedScores = computeNormalizedScores(row)
      if (normalizedScores === null) continue

      if (!dryRun) {
        await ctx.db.patch(row._id, normalizedScores)
      }
      normalized++
    }

    return {
      scanned,
      normalized,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})
