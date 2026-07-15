/**
 * Curated Geometry Hygiene — Sprint 03 Catalog Hygiene
 *
 * This module hosts the at-rest catalog hygiene passes:
 * - normalizeEditorialScores: ÷100 any 0–100 editorial score at rest,
 *   idempotent via scoreScaleNormalizedAt marker + value>1 guard.
 * - dedupeGroups: detect duplicate routes by name_lower + centroid proximity,
 *   reversible duplicateOf shadow flag with dry-run plan.
 * - fixLengthOutliers: quarantine rows with lengthMiles ≤ 0 or > 1000.
 * - quarantineTestRows: quarantine rows whose name matches test/seed patterns.
 * - normalizeStates: canonicalize dirty state strings, preserve multi-state.
 * - backfillNameLower: set name_lower = name.toLowerCase() for rows missing it.
 *
 * All handlers use .paginate({cursor, numItems}) so the real 5,757-row
 * catalog stays under Convex's per-transaction read limit.
 * dedupeGroups is an internalAction that paginates reads via fetchDedupePage
 * (internalQuery) and batches writes via applyDedupeShadows (internalMutation),
 * because cross-row grouping requires the full catalog in memory — too large
 * for a single mutation's 16MB read limit.
 *
 * CONVENTIONS (from backfill-curated-geometry.ts driver):
 *   --dryRun    Preview the change-set without writing
 *   npx convex run curatedGeometryHygiene:normalizeEditorialScores '{"dryRun":true}'
 *   npx convex run curatedGeometryHygiene:normalizeEditorialScores '{}'
 */

import { v } from 'convex/values'
import { internal } from './_generated/api'
import { internalAction, internalMutation, internalQuery } from './_generated/server'
import { normalizeState } from './util/dataNormalization'

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
        // Recompute riderReady so the stored flag is consistent with the
        // normalized score. The predicate is scale-aware (>= 0.5 on the 0–1
        // scale), so normalizing 85 → 0.85 preserves riderReady=true. Without
        // this, a subsequent normalizeStates pass would be the first to
        // recompute and could flip the flag if the predicate weren't fixed.
        await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
          id: row._id,
        })
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

// ---------------------------------------------------------------------------
// dedupeGroups: detect duplicate routes by name_lower + centroid proximity
// ---------------------------------------------------------------------------

/** Earth radius in miles for haversine. */
const EARTH_RADIUS_MI = 3959

/**
 * Haversine great-circle distance between two lat/lng points in miles.
 *
 * Pure function — zero I/O — exported for unit testing.
 */
export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number): number => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MI * Math.asin(Math.sqrt(a))
}

/** Maximum centroid distance (miles) for two same-name routes to be duplicates. */
const DUPE_PROXIMITY_MI = 100

/** Row shape needed for dedup planning. */
type DedupeRow = {
  _id: any
  routeId: string
  name?: string
  name_lower?: string
  centroidLat?: number
  centroidLng?: number
  compositeScore: number
  geometryStatus?: string | null
  duplicateOf?: string | null
}

/** Result shape for dedupeGroups. */
export type DedupeResult = {
  groups: number
  shadows: number
  plan: Array<{
    nameLower: string
    canonical: string
    shadows: string[]
  }>
}

/**
 * Select the canonical route from a group of same-name proximity-matched rows.
 *
 * Preference order:
 *   1. geometryStatus === 'generated' (gate-passing geometry), highest compositeScore among those
 *   2. Highest compositeScore overall
 *
 * Pure function — exported for unit testing.
 */
export function selectCanonical(rows: DedupeRow[]): DedupeRow {
  const generated = rows.filter((r) => r.geometryStatus === 'generated')
  const pool = generated.length > 0 ? generated : rows
  return pool.reduce((best, r) => (r.compositeScore > best.compositeScore ? r : best))
}

/**
 * Pure function: compute the dedupe plan from an array of candidate rows.
 *
 * Groups by name_lower (skipping rows with duplicateOf set),
 * clusters by centroid proximity via union-find (haversine ≤ 100mi),
 * selects canonical (prefer geometryStatus==='generated', then highest score),
 * and returns the plan + shadow patches.
 *
 * Exported for unit testing — zero I/O.
 */
export function computeDedupePlan(allRows: DedupeRow[]): {
  plan: DedupeResult['plan']
  totalShadows: number
  shadowPatches: Array<{ id: DedupeRow['_id']; canonicalRouteId: string }>
} {
  const groupsByName = new Map<string, DedupeRow[]>()
  for (const row of allRows) {
    const nameLower = row.name_lower ?? row.name?.toLowerCase() ?? row.routeId
    if (row.duplicateOf != null) continue
    const group = groupsByName.get(nameLower)
    if (group) {
      group.push(row)
    } else {
      groupsByName.set(nameLower, [row])
    }
  }

  const plan: DedupeResult['plan'] = []
  let totalShadows = 0
  const shadowPatches: Array<{ id: DedupeRow['_id']; canonicalRouteId: string }> = []

  for (const [nameLower, group] of groupsByName) {
    if (group.length <= 1) continue

    const clusterIds: number[] = group.map((_, i) => i)
    const find = (i: number): number => {
      while (clusterIds[i] !== i) {
        clusterIds[i] = clusterIds[clusterIds[i]]
        i = clusterIds[i]
      }
      return i
    }
    const union = (a: number, b: number): void => {
      const ra = find(a)
      const rb = find(b)
      if (ra !== rb) clusterIds[ra] = rb
    }

    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const ri = group[i]
        const rj = group[j]
        if (ri.centroidLat == null || ri.centroidLng == null) continue
        if (rj.centroidLat == null || rj.centroidLng == null) continue
        const dist = haversineMiles(ri.centroidLat, ri.centroidLng, rj.centroidLat, rj.centroidLng)
        if (dist <= DUPE_PROXIMITY_MI) {
          union(i, j)
        }
      }
    }

    const clusters = new Map<number, DedupeRow[]>()
    for (let i = 0; i < group.length; i++) {
      const root = find(i)
      const cluster = clusters.get(root)
      if (cluster) {
        cluster.push(group[i])
      } else {
        clusters.set(root, [group[i]])
      }
    }

    for (const cluster of clusters.values()) {
      if (cluster.length <= 1) continue

      const canonical = selectCanonical(cluster)
      const shadowRouteIds = cluster
        .filter((r) => r.routeId !== canonical.routeId)
        .map((r) => r.routeId)

      if (shadowRouteIds.length === 0) continue

      plan.push({
        nameLower,
        canonical: canonical.routeId,
        shadows: shadowRouteIds,
      })
      totalShadows += shadowRouteIds.length

      for (const row of cluster) {
        if (row.routeId !== canonical.routeId) {
          shadowPatches.push({ id: row._id, canonicalRouteId: canonical.routeId })
        }
      }
    }
  }

  return { plan, totalShadows, shadowPatches }
}

// ---------------------------------------------------------------------------
// fetchDedupePage: paginated read of dedup-relevant fields (internalQuery)
// ---------------------------------------------------------------------------

/**
 * Fetch one page of curated_routes rows with only the fields needed for dedup.
 * Used by dedupeGroups (internalAction) to paginate the full catalog without
 * exceeding the per-transaction 16MB read limit.
 *
 * Projects to {_id, routeId, name_lower, centroidLat, centroidLng,
 * compositeScore, geometryStatus, duplicateOf} to minimize bytes per page.
 */
export const fetchDedupePage = internalQuery({
  args: {
    routeIdPrefix: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    numItems: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const cursor = args.cursor ?? null
    const numItems = args.numItems ?? 500

    const page = args.routeIdPrefix
      ? await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) =>
            q.gte('routeId', args.routeIdPrefix!).lt('routeId', `${args.routeIdPrefix!}\uffff`),
          )
          .paginate({ cursor, numItems })
      : await ctx.db.query('curated_routes').paginate({ cursor, numItems })

    return {
      page: page.page.map((r) => ({
        _id: r._id,
        routeId: r.routeId,
        name: r.name,
        name_lower: r.name_lower,
        centroidLat: r.centroidLat,
        centroidLng: r.centroidLng,
        compositeScore: r.compositeScore,
        geometryStatus: r.geometryStatus,
        duplicateOf: r.duplicateOf,
      })),
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

// ---------------------------------------------------------------------------
// applyDedupeShadows: batch-write duplicateOf flags (internalMutation)
// ---------------------------------------------------------------------------

/**
 * Batch-apply duplicateOf shadow flags. Called by dedupeGroups (internalAction)
 * in batches of ≤50 to stay well under the per-transaction write limit.
 */
export const applyDedupeShadows = internalMutation({
  args: {
    shadows: v.array(
      v.object({
        id: v.id('curated_routes'),
        canonicalRouteId: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const s of args.shadows) {
      await ctx.db.patch(s.id, { duplicateOf: s.canonicalRouteId })
    }
    return { applied: args.shadows.length }
  },
})

// ---------------------------------------------------------------------------
// dedupeGroups: detect + shadow-flag duplicates (internalAction — paginated)
// ---------------------------------------------------------------------------

/**
 * S3-T2: Detect duplicate routes by name_lower + centroid proximity and
 * reversibly shadow-flag non-canonical rows via `duplicateOf`.
 *
 * Converted from internalMutation to internalAction to support the full
 * 5,757-row catalog. The action paginates reads via fetchDedupePage
 * (internalQuery, projected to dedup fields only) and batches writes via
 * applyDedupeShadows (internalMutation, ≤50 per batch).
 *
 * Algorithm (unchanged from the mutation version):
 *   1. Paginate through curated_routes collecting all rows (filtered by routeIdPrefix)
 *   2. Group by name_lower; skip rows with duplicateOf set (idempotent)
 *   3. Union-find cluster by haversine ≤ 100mi within each name group
 *   4. Select canonical: prefer geometryStatus==='generated', then highest compositeScore
 *   5. Set duplicateOf on shadow rows (dryRun returns the plan without writing)
 *
 * Idempotent: rows with duplicateOf already set are skipped; second run finds 0 new shadows.
 * Reversible: shadow rows are marked with duplicateOf string, not deleted.
 */
export const dedupeGroups = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
    routeIdPrefix: v.optional(v.string()),
    pageSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<DedupeResult> => {
    const dryRun = args.dryRun ?? false
    const pageSize = args.pageSize ?? 500

    // 1. Paginate through all rows collecting dedupe candidates
    let cursor: string | null = null
    let isDone = false
    const allRows: DedupeRow[] = []

    while (!isDone) {
      const page: {
        page: Array<Record<string, unknown>>
        continueCursor: string
        isDone: boolean
      } = await ctx.runQuery(internal.curatedGeometryHygiene.fetchDedupePage, {
        ...(args.routeIdPrefix ? { routeIdPrefix: args.routeIdPrefix } : {}),
        cursor,
        numItems: pageSize,
      })
      allRows.push(...(page.page as DedupeRow[]))
      cursor = page.continueCursor
      isDone = page.isDone
    }

    // 2-4. Pure computation: group, cluster, select canonical, build plan
    const { plan, totalShadows, shadowPatches } = computeDedupePlan(allRows)

    // 5. Apply shadow flags in batches (if not dryRun)
    if (!dryRun && shadowPatches.length > 0) {
      const BATCH_SIZE = 50
      for (let i = 0; i < shadowPatches.length; i += BATCH_SIZE) {
        await ctx.runMutation(internal.curatedGeometryHygiene.applyDedupeShadows, {
          shadows: shadowPatches.slice(i, i + BATCH_SIZE),
        })
      }
    }

    return {
      groups: plan.length,
      shadows: totalShadows,
      plan,
    }
  },
})

// ---------------------------------------------------------------------------
// fixLengthOutliers: quarantine rows with lengthMiles ≤ 0 or > 1000 (S3-T3)
// ---------------------------------------------------------------------------

/** Result shape for quarantine-style hygiene passes. */
export type QuarantineResult = {
  scanned: number
  flagged: number
  continueCursor: string
  isDone: boolean
}

/** Maximum reasonable length in miles; routes above this are flagged as outliers. */
const LENGTH_OUTLIER_CEILING = 1000

/**
 * S3-T3: Quarantine rows with degenerate length values.
 *
 * - lengthMiles ≤ 0  → quarantine.reason = 'zero_length'
 * - lengthMiles > 1000 → quarantine.reason = 'length_outlier'
 *
 * Uses Convex `.paginate({cursor, numItems})` to stay under the
 * per-transaction read limit on the real 5,757-row catalog.
 *
 * Idempotent: rows that already have a quarantine set are skipped.
 * dryRun returns preview counts without writing.
 * After patching, recomputeRiderReadyForRoute is called to hook quarantine → riderReady.
 */
export const fixLengthOutliers = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    routeIdPrefix: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<QuarantineResult> => {
    const dryRun = args.dryRun ?? false
    const cursor = args.cursor ?? null
    const numItems = args.batchSize ?? 100

    const page = args.routeIdPrefix
      ? await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) =>
            q.gte('routeId', args.routeIdPrefix!).lt('routeId', `${args.routeIdPrefix!}\uffff`),
          )
          .paginate({ cursor, numItems })
      : await ctx.db.query('curated_routes').paginate({ cursor, numItems })

    let scanned = 0
    let flagged = 0

    for (const row of page.page) {
      scanned++

      // Idempotent: skip rows already quarantined
      if (row.quarantine != null) continue

      let reason: 'zero_length' | 'length_outlier' | null = null
      if (row.lengthMiles <= 0) {
        reason = 'zero_length'
      } else if (row.lengthMiles > LENGTH_OUTLIER_CEILING) {
        reason = 'length_outlier'
      }

      if (reason === null) continue

      if (!dryRun) {
        await ctx.db.patch(row._id, {
          quarantine: { reason, flaggedAt: Date.now() },
        })
        await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
          id: row._id,
        })
      }
      flagged++
    }

    return {
      scanned,
      flagged,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

// ---------------------------------------------------------------------------
// quarantineTestRows: quarantine rows whose name matches test/seed patterns (S3-T3)
// ---------------------------------------------------------------------------

/**
 * S3-T3: Quarantine rows whose name matches test/seed patterns.
 *
 * Matches: name starts with "Test " OR name (case-insensitive) contains "test route".
 * Sets quarantine.reason = 'test_row'.
 *
 * Uses Convex `.paginate({cursor, numItems})` to stay under the
 * per-transaction read limit on the real 5,757-row catalog.
 *
 * Idempotent: rows that already have a quarantine set are skipped.
 * dryRun returns preview counts without writing.
 * After patching, recomputeRiderReadyForRoute is called to hook quarantine → riderReady.
 */
export const quarantineTestRows = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    routeIdPrefix: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<QuarantineResult> => {
    const dryRun = args.dryRun ?? false
    const cursor = args.cursor ?? null
    const numItems = args.batchSize ?? 100

    const page = args.routeIdPrefix
      ? await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) =>
            q.gte('routeId', args.routeIdPrefix!).lt('routeId', `${args.routeIdPrefix!}\uffff`),
          )
          .paginate({ cursor, numItems })
      : await ctx.db.query('curated_routes').paginate({ cursor, numItems })

    let scanned = 0
    let flagged = 0

    for (const row of page.page) {
      scanned++

      // Idempotent: skip rows already quarantined
      if (row.quarantine != null) continue

      // Match test/seed patterns
      const isTestRow =
        row.name.startsWith('Test ') || row.name.toLowerCase().includes('test route')

      if (!isTestRow) continue

      if (!dryRun) {
        await ctx.db.patch(row._id, {
          quarantine: { reason: 'test_row' as const, flaggedAt: Date.now() },
        })
        await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
          id: row._id,
        })
      }
      flagged++
    }

    return {
      scanned,
      flagged,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

// ---------------------------------------------------------------------------
// normalizeStates: canonicalize state strings (split multi-state, normalize) (S3-T3)
// ---------------------------------------------------------------------------

/** Result shape for normalizeStates. */
export type StateNormalizationResult = {
  scanned: number
  changed: number
  continueCursor: string
  isDone: boolean
}

/**
 * Pure helper: canonicalize a raw state string into its parts.
 * Splits multi-state strings by '/', applies normalizeState to each part.
 *
 * Returns { primary, statesAll } where statesAll is null for single-state strings.
 *
 * Pure function — zero I/O — exported for unit testing.
 *
 * Examples:
 *   'New-York' → { primary: 'New York', statesAll: null }
 *   'Alabama / Mississippi / Tennessee' → { primary: 'Alabama', statesAll: ['Alabama','Mississippi','Tennessee'] }
 */
export function canonicalizeStateString(raw: string): {
  primary: string
  statesAll: string[] | null
} {
  const parts = raw
    .split('/')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  const canonicalParts = parts.map(normalizeState)
  const primary = canonicalParts[0] ?? normalizeState(raw)
  const statesAll = canonicalParts.length > 1 ? canonicalParts : null

  return { primary, statesAll }
}

/**
 * S3-T3: Normalize state strings at rest.
 *
 * For each row:
 *   - Parse the state field: split multi-state strings by '/'
 *   - Apply normalizeState() to each part (handles dashes, underscores, whitespace, title-casing)
 *   - Set state = first canonical part (primary state)
 *   - If multi-part: set statesAll = ordered array of all canonical parts, stateRaw = original raw string
 *   - If single-part: set state = canonical, stateRaw = original if different
 *
 * Uses Convex `.paginate({cursor, numItems})` to stay under the
 * per-transaction read limit on the real 5,757-row catalog.
 *
 * Idempotency guard: if state already equals the canonical form AND is single-part, skip the row.
 * dryRun writes nothing.
 * After patching, recomputeRiderReadyForRoute is called.
 */
export const normalizeStates = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    routeIdPrefix: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<StateNormalizationResult> => {
    const dryRun = args.dryRun ?? false
    const cursor = args.cursor ?? null
    const numItems = args.batchSize ?? 100

    const page = args.routeIdPrefix
      ? await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) =>
            q.gte('routeId', args.routeIdPrefix!).lt('routeId', `${args.routeIdPrefix!}\uffff`),
          )
          .paginate({ cursor, numItems })
      : await ctx.db.query('curated_routes').paginate({ cursor, numItems })

    let scanned = 0
    let changed = 0

    for (const row of page.page) {
      scanned++

      const { primary, statesAll } = canonicalizeStateString(row.state)
      const isMulti = statesAll !== null

      // Idempotency guard: state is already canonical and single-part → skip
      if (row.state === primary && !isMulti) continue

      if (!dryRun) {
        const patch: Record<string, string | string[] | null> = { state: primary }
        if (statesAll !== null) {
          patch.statesAll = statesAll
        }
        // Preserve original raw whenever the state was changed
        if (row.state !== primary) {
          patch.stateRaw = row.state
        }
        await ctx.db.patch(row._id, patch)
        await ctx.runMutation(internal.curatedGeometry.recomputeRiderReadyForRoute, {
          id: row._id,
        })
      }
      changed++
    }

    return {
      scanned,
      changed,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})

// ---------------------------------------------------------------------------
// backfillNameLower: set name_lower = name.toLowerCase() for rows missing it
// ---------------------------------------------------------------------------

/**
 * Pure helper: compute the correct name_lower for a row.
 *
 * Returns the lowercase name, or null if the row already has the correct
 * name_lower (idempotency guard).
 *
 * Pure function — zero I/O — exported for unit testing.
 */
export function computeNameLower(row: { name: string; name_lower?: string }): string | null {
  const expected = row.name.toLowerCase()
  if (row.name_lower === expected) return null
  return expected
}

/** Result shape for backfillNameLower. */
export type NameLowerResult = {
  scanned: number
  backfilled: number
  continueCursor: string
  isDone: boolean
}

/**
 * Backfill name_lower = name.toLowerCase() for rows that are missing it
 * (or have an incorrect value).
 *
 * Legacy rows that pre-date the by_name_lower index lack the field entirely
 * and are absent from that index, making them invisible to exact-name search
 * via findRoutesByIdentifier.
 *
 * Uses Convex `.paginate({cursor, numItems})` to stay under the
 * per-transaction read limit on the real 5,757-row catalog.
 *
 * Idempotency guard: rows where name_lower already equals name.toLowerCase()
 * are skipped — the pass is safe to re-run.
 * dryRun writes nothing.
 */
export const backfillNameLower = internalMutation({
  args: {
    dryRun: v.optional(v.boolean()),
    routeIdPrefix: v.optional(v.string()),
    cursor: v.optional(v.union(v.string(), v.null())),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<NameLowerResult> => {
    const dryRun = args.dryRun ?? false
    const cursor = args.cursor ?? null
    const numItems = args.batchSize ?? 100

    const page = args.routeIdPrefix
      ? await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) =>
            q.gte('routeId', args.routeIdPrefix!).lt('routeId', `${args.routeIdPrefix!}\uffff`),
          )
          .paginate({ cursor, numItems })
      : await ctx.db.query('curated_routes').paginate({ cursor, numItems })

    let scanned = 0
    let backfilled = 0

    for (const row of page.page) {
      scanned++

      const expected = computeNameLower(row)
      if (expected === null) continue

      if (!dryRun) {
        await ctx.db.patch(row._id, { name_lower: expected })
      }
      backfilled++
    }

    return {
      scanned,
      backfilled,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    }
  },
})
