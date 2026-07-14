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
  // Double idempotency gate: marker + per-dimension value>1 guard.
  // If scoreScaleNormalizedAt is already set, this row was already processed.
  // If NO score field is > 1, the row is entirely in-scale.
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
 */
export type HygieneChangeSet = {
  scanned: number
  normalized: number
}

/**
 * Fetch candidate rows for score normalization.
 *
 * When `routeIdPrefix` is provided (test mode): performs a broad prefix-scoped
 * scan to catch ALL matching rows regardless of compositeScore value — this
 * catches mixed-scale rows where compositeScore ≤ 1 but some dimension is > 1.
 *
 * When no prefix (production): uses the by_composite_score index to only read
 * rows with compositeScore > 1 (avoids the 16MB read limit on the 5,757-row
 * catalog).
 */
async function fetchOutOfScaleRows(
  ctx: MutationCtx,
  routeIdPrefix?: string,
): Promise<Doc<'curated_routes'>[]> {
  if (routeIdPrefix) {
    // Prefix-scoped index scan — catches ALL prefix-matching rows regardless
    // of compositeScore (mixed-scale rows included). Uses by_routeId index
    // range to avoid the 16MB read limit from a full table scan.
    const upperBound = `${routeIdPrefix}\uffff`
    return await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.gte('routeId', routeIdPrefix).lt('routeId', upperBound))
      .collect()
  }

  // Production: use index for read efficiency on the full catalog
  return await ctx.db
    .query('curated_routes')
    .withIndex('by_composite_score', (q) => q.gt('compositeScore', 1))
    .collect()
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
