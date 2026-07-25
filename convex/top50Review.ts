/**
 * S5-T3: Top-50-by-composite-rank founder review harness (server side).
 *
 * - exportTop50Manifest: real indexed riderReady + compositeScore desc surface
 * - seed/teardown fixtures for integration tests
 * - recordTop50Review / getTop50ReviewStatus: independent fail-closed review
 *
 * Image bytes never enter Convex — local script renders PNGs from geometry.
 */

import { ConvexError, v } from 'convex/values'
import { internal } from './_generated/api'
import { internalMutation, mutation, query } from './_generated/server'
import { buildFixturePolyline } from './couchRouteMapPng'
import { geospatial } from './geospatialIndex'
import { requireFounder, requireIdentity, requireOperator } from './guards'

export const TOP50_DEFAULT_LIMIT = 50
export const TOP50_ROUTE_PREFIX = 'test:s5t3-'

export type Provenance = 'scraped_promoted' | 'ai_reconstructed' | 'name_routed'

export type Top50ManifestRow = {
  routeId: string
  name: string
  compositeScore: number
  provenance: string
  measuredMiles: number
  claimedMiles: number | null
  geometryRef: string
  riderReady: boolean
  rank: number
}

export type Top50RouteVerdict = {
  routeId: string
  verdict: 'correct' | 'plausible' | 'wrong'
  isDuplicate?: boolean
  isTestSeed?: boolean
  reason?: string
}

export type Top50ReviewResolution = {
  status: 'pass' | 'fail'
  offendingRouteIds: string[]
  offendingReasons: string[]
  reviewedRowCount: number
  expectedRowCount: number
  contaminationCount: number
}

/**
 * Pure rule: one wrong / duplicate / test-seed forces fail.
 * Partial review (missing expected IDs) forces fail.
 * All clean + complete → pass.
 */
export function resolveTop50Review(
  routeVerdicts: Top50RouteVerdict[],
  expectedRouteIds: string[],
): Top50ReviewResolution {
  const expected = [...new Set(expectedRouteIds)]
  const byId = new Map(routeVerdicts.map((r) => [r.routeId, r]))
  const offendingRouteIds: string[] = []
  const offendingReasons: string[] = []
  let contaminationCount = 0

  for (const id of expected) {
    const vrow = byId.get(id)
    if (!vrow) {
      offendingRouteIds.push(id)
      offendingReasons.push('missing_verdict')
      continue
    }
    if (vrow.verdict === 'wrong') {
      offendingRouteIds.push(id)
      offendingReasons.push(vrow.reason ?? 'wrong')
    }
    if (vrow.isDuplicate) {
      contaminationCount += 1
      offendingRouteIds.push(id)
      offendingReasons.push(vrow.reason ?? 'duplicate_headliner')
    }
    if (vrow.isTestSeed) {
      contaminationCount += 1
      offendingRouteIds.push(id)
      offendingReasons.push(vrow.reason ?? 'test_seed')
    }
  }

  // Extra verdicts not in expected set are ignored for completeness but flagged
  const status: 'pass' | 'fail' = offendingRouteIds.length === 0 ? 'pass' : 'fail'

  return {
    status,
    offendingRouteIds: [...new Set(offendingRouteIds)],
    offendingReasons,
    reviewedRowCount: routeVerdicts.length,
    expectedRowCount: expected.length,
    contaminationCount,
  }
}

function isEligibleReady(row: {
  riderReady?: boolean | null
  retiredAt?: number | null
  duplicateOf?: string | null
  quarantine?: unknown
}): boolean {
  return (
    row.riderReady === true &&
    row.retiredAt == null &&
    row.duplicateOf == null &&
    row.quarantine == null
  )
}

/**
 * Deterministic tie-break: higher compositeScore first; equal → routeId asc.
 * Does NOT re-rank across the index — only stabilizes equal-score ties.
 */
export function sortManifestRows<T extends { compositeScore: number; routeId: string }>(
  rows: T[],
): T[] {
  return [...rows].sort((a, b) => {
    if (b.compositeScore !== a.compositeScore) return b.compositeScore - a.compositeScore
    return a.routeId.localeCompare(b.routeId)
  })
}

// ---------------------------------------------------------------------------
// exportTop50Manifest — canonical indexed ready surface
// ---------------------------------------------------------------------------

export const exportTop50Manifest = query({
  args: {
    limit: v.optional(v.number()),
    /** Test isolation only — still uses by_riderReady_and_composite_score order. */
    routeIdPrefix: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const limit = Math.min(Math.max(args.limit ?? TOP50_DEFAULT_LIMIT, 1), 100)
    const prefix = args.routeIdPrefix

    // Oversample then filter eligibility so take(N) post-filter still fills limit.
    const takeN = prefix ? Math.min(limit * 20, 800) : Math.min(limit * 5, 400)
    const indexed = await ctx.db
      .query('curated_routes')
      .withIndex('by_riderReady_and_composite_score', (q: any) => q.eq('riderReady', true))
      .order('desc')
      .take(takeN)

    const eligible = indexed.filter((r: any) => {
      if (!isEligibleReady(r)) return false
      if (prefix && !r.routeId.startsWith(prefix)) return false
      return true
    })

    // When prefix isolation is used and oversample missed rows (large catalog),
    // supplement by scanning prefix routeIds via by_routeId for known seed pattern.
    // Ranking among them still uses stored compositeScore (same index field).
    let pool = eligible
    if (prefix && pool.length < limit) {
      // Cannot range-query by prefix on by_routeId; seed paths use known counts.
      // Re-scan a larger page of the ready index for the prefix.
      const larger = await ctx.db
        .query('curated_routes')
        .withIndex('by_riderReady_and_composite_score', (q: any) => q.eq('riderReady', true))
        .order('desc')
        .take(2000)
      pool = larger.filter(
        (r: any) => isEligibleReady(r) && (!prefix || r.routeId.startsWith(prefix)),
      )
    }

    const ordered = sortManifestRows(
      pool.map((r: any) => ({
        routeId: r.routeId as string,
        name: r.name as string,
        compositeScore: r.compositeScore as number,
        route: r,
      })),
    ).slice(0, limit)

    const rows: Top50ManifestRow[] = []
    for (let i = 0; i < ordered.length; i++) {
      const r = ordered[i].route as any
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q: any) => q.eq('routeId', r.routeId))
        .first()

      const provenance =
        (geom?.provenance as string | undefined) ??
        (r.geometryProvenance as string | undefined) ??
        (geom?.verification?.provenance as string | undefined) ??
        'unknown'

      const measuredMiles =
        (geom?.verification?.routedMiles as number | undefined) ?? (r.lengthMiles as number) ?? 0
      const claimedMiles =
        (geom?.verification?.claimedMiles as number | null | undefined) ??
        (r.lengthMiles as number | null) ??
        null

      // geometryRef is an evidence pointer — never the raw image.
      // Prefer geometry table id; fall back to routeId:polyline marker.
      let geometryRef = ''
      if (geom?._id) {
        geometryRef = `curated_route_geometry:${geom._id}`
      } else if (geom?.value && typeof geom.value === 'string' && geom.value.length > 0) {
        geometryRef = `polyline:${r.routeId}`
      } else if (r.routePolyline && typeof r.routePolyline === 'string') {
        geometryRef = `routePolyline:${r.routeId}`
      }

      rows.push({
        routeId: r.routeId,
        name: r.name,
        compositeScore: r.compositeScore,
        provenance,
        measuredMiles,
        claimedMiles,
        geometryRef,
        riderReady: true,
        rank: i + 1,
      })
    }

    return {
      rowCount: rows.length,
      limit,
      query: {
        index: 'by_riderReady_and_composite_score',
        riderReady: true,
        order: 'desc',
        routeIdPrefix: prefix ?? null,
      },
      rows,
    }
  },
})

/**
 * Fetch encoded polylines for local PNG render (IDs/geometry text only — no images).
 */
export const getTop50Geometries = query({
  args: {
    routeIds: v.array(v.string()),
  },
  handler: async (ctx, { routeIds }) => {
    await requireIdentity(ctx)
    const out: Record<
      string,
      {
        polyline: string | null
        provenance: string | null
        measuredMiles: number | null
        claimedMiles: number | null
        name: string | null
      }
    > = {}

    for (const routeId of routeIds) {
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()
      const route = await ctx.db
        .query('curated_routes')
        .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
        .first()

      const polyline =
        (geom?.value && typeof geom.value === 'string' && geom.value.length > 0
          ? geom.value
          : null) ??
        (route?.routePolyline && typeof route.routePolyline === 'string'
          ? route.routePolyline
          : null)

      out[routeId] = {
        polyline,
        provenance:
          (geom?.provenance as string | undefined) ??
          (route?.geometryProvenance as string | undefined) ??
          null,
        measuredMiles:
          (geom?.verification?.routedMiles as number | undefined) ??
          (route?.lengthMiles as number | undefined) ??
          null,
        claimedMiles:
          (geom?.verification?.claimedMiles as number | null | undefined) ??
          (route?.lengthMiles as number | null | undefined) ??
          null,
        name: (route?.name as string | undefined) ?? null,
      }
    }
    return out
  },
})

// ---------------------------------------------------------------------------
// Review mutations/queries (independent of couch gate)
// ---------------------------------------------------------------------------

const routeVerdictValidator = v.object({
  routeId: v.string(),
  verdict: v.union(v.literal('correct'), v.literal('plausible'), v.literal('wrong')),
  isDuplicate: v.optional(v.boolean()),
  isTestSeed: v.optional(v.boolean()),
  reason: v.optional(v.string()),
})

export const recordTop50Review = mutation({
  args: {
    reviewId: v.string(),
    routeVerdicts: v.array(routeVerdictValidator),
    expectedRouteIds: v.array(v.string()),
  },
  handler: async (ctx, { reviewId, routeVerdicts, expectedRouteIds }) => {
    const identity = await requireOperator(ctx)

    if (expectedRouteIds.length === 0) {
      throw new ConvexError({
        code: 'EMPTY_EXPECTED_ROUTES',
        message: 'expectedRouteIds must not be empty',
      })
    }

    const resolved = resolveTop50Review(routeVerdicts, expectedRouteIds)

    // APPEND-ONLY insert — never patch prior reviews
    await ctx.db.insert('top50_reviews', {
      reviewId,
      status: resolved.status,
      routeVerdicts,
      offendingRouteIds: resolved.offendingRouteIds,
      offendingReasons: resolved.offendingReasons,
      reviewedRowCount: resolved.reviewedRowCount,
      expectedRowCount: resolved.expectedRowCount,
      contaminationCount: resolved.contaminationCount,
      recordedAt: Date.now(),
      recordedBy: identity.clerkUserId,
    })

    return {
      reviewId,
      status: resolved.status,
      offendingRouteIds: resolved.offendingRouteIds,
      offendingReasons: resolved.offendingReasons,
      reviewedRowCount: resolved.reviewedRowCount,
      expectedRowCount: resolved.expectedRowCount,
      contaminationCount: resolved.contaminationCount,
      // Explicitly never touch couch / retirement
      couchGateMutated: false,
    }
  },
})

export const getTop50ReviewStatus = query({
  args: {
    reviewId: v.string(),
  },
  handler: async (ctx, { reviewId }) => {
    await requireIdentity(ctx)
    const rows = await ctx.db
      .query('top50_reviews')
      .withIndex('by_reviewId', (q) => q.eq('reviewId', reviewId))
      .take(50)
    if (rows.length === 0) return null
    // Latest by recordedAt (append-only)
    const latest = rows.sort((a, b) => b.recordedAt - a.recordedAt)[0]
    return {
      reviewId: latest.reviewId,
      status: latest.status,
      offendingRouteIds: latest.offendingRouteIds,
      offendingReasons: latest.offendingReasons,
      reviewedRowCount: latest.reviewedRowCount,
      expectedRowCount: latest.expectedRowCount,
      contaminationCount: latest.contaminationCount,
      recordedAt: latest.recordedAt,
      recordedBy: latest.recordedBy,
      routeVerdicts: latest.routeVerdicts,
      couchGateMutated: false as const,
    }
  },
})

// ---------------------------------------------------------------------------
// Test fixtures (founder-gated public wrappers)
// ---------------------------------------------------------------------------

type SeedSpec = {
  routeId: string
  name: string
  compositeScore: number
  riderReady: boolean
  provenance: Provenance
  claimedMiles: number
  routedMiles: number
}

function buildSeedSpecs(prefix: string, readyCount: number, nonReadyCount: number): SeedSpec[] {
  const provenances: Provenance[] = ['scraped_promoted', 'ai_reconstructed', 'name_routed']
  const specs: SeedSpec[] = []

  // Ready rows: scores 0.99, 0.98, ... descending (0–1 scale so they don't
  // collide with 0–100 catalog rows for isolation when prefix-filtered).
  for (let i = 0; i < readyCount; i++) {
    const score = Math.round((0.99 - i * 0.01) * 1000) / 1000
    specs.push({
      routeId: `${prefix}ready-${String(i).padStart(3, '0')}`,
      name: `S5T3 Ready ${i}`,
      compositeScore: score,
      riderReady: true,
      provenance: provenances[i % 3],
      claimedMiles: 30 + i,
      routedMiles: 30 + i + (i % 3 === 0 ? 0.1 : 0),
    })
  }

  // Non-ready: first has higher score than any ready (0.995) — must NOT enter manifest
  for (let i = 0; i < nonReadyCount; i++) {
    const score = i === 0 ? 0.995 : Math.round((0.4 - i * 0.01) * 1000) / 1000
    specs.push({
      routeId: `${prefix}nonready-${String(i).padStart(3, '0')}`,
      name: `S5T3 NonReady ${i}`,
      compositeScore: score,
      riderReady: false,
      provenance: provenances[i % 3],
      claimedMiles: 20 + i,
      routedMiles: 20 + i,
    })
  }

  return specs
}

async function upsertTop50Route(
  ctx: any,
  spec: SeedSpec,
): Promise<{ routeId: string; created: boolean }> {
  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', spec.routeId))
    .first()

  const centroidLat = 35.0 + (spec.compositeScore % 1) * 0.5 + (spec.routeId.length % 7) * 0.01
  const centroidLng = -120.0 - (spec.routeId.charCodeAt(spec.routeId.length - 1) % 9) * 0.02
  const nowMs = Date.now()
  const routePolyline = buildFixturePolyline(spec.routeId, centroidLat, centroidLng)

  const base = {
    name: spec.name,
    lengthMiles: spec.claimedMiles,
    centroidLat,
    centroidLng,
    boundsNeLat: centroidLat + 0.3,
    boundsNeLng: centroidLng + 0.3,
    boundsSwLat: centroidLat - 0.3,
    boundsSwLng: centroidLng - 0.3,
    location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
    compositeScore: spec.compositeScore,
    curvatureScore: spec.compositeScore,
    scenicScore: spec.compositeScore,
    technicalScore: spec.compositeScore,
    trafficScore: spec.compositeScore,
    remotenessScore: spec.compositeScore,
    routePolyline,
    geometryStatus: 'generated' as const,
    geometryProvenance: spec.provenance,
    riderReady: spec.riderReady,
    state: 'California',
    summary: `S5-T3 top-50 fixture ${spec.routeId}`,
    name_lower: spec.name.toLowerCase(),
    retiredAt: undefined,
    duplicateOf: undefined,
    quarantine: undefined,
  }

  let docId = existing?._id
  if (existing) {
    await ctx.db.patch(existing._id, base)
  } else {
    docId = await ctx.db.insert('curated_routes', {
      routeId: spec.routeId,
      source: 'editorial',
      primaryArchetype: 'twisties',
      secondaryTags: ['test', 's5t3', 'top50'],
      oneLiner: `Top50 ${spec.provenance}`,
      badges: [],
      season: 'year_round',
      contentVersion: 1,
      seededAt: nowMs,
      rideWorthiness: {
        verdict: 'ride' as const,
        reason: 's5t3 top50 seed',
        model: 'test',
        classifiedAt: nowMs,
      },
      ...base,
    })
  }

  const geomDoc = {
    routeId: spec.routeId,
    format: 'polyline' as const,
    encoding: 'utf-8',
    precision: 5,
    value: routePolyline,
    provenance: spec.provenance,
    verification: {
      routeId: spec.routeId,
      verdict: 'pass' as const,
      provenance: spec.provenance,
      geometry: routePolyline,
      geometryStatus: 'generated' as const,
      anchorCount: 4,
      anchors: [
        {
          lat: centroidLat,
          lng: centroidLng,
          formatted: 'Start',
          distanceFromCentroid: 0,
        },
        {
          lat: centroidLat + 0.05,
          lng: centroidLng + 0.05,
          formatted: 'End',
          distanceFromCentroid: 5,
        },
      ],
      pointCount: 40,
      degenerate: false,
      ratio: spec.claimedMiles > 0 ? spec.routedMiles / spec.claimedMiles : null,
      claimedMiles: spec.claimedMiles,
      routedMiles: spec.routedMiles,
    },
  }

  const geom = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', spec.routeId))
    .first()
  if (geom) {
    await ctx.db.replace(geom._id, geomDoc)
  } else {
    await ctx.db.insert('curated_route_geometry', geomDoc)
  }

  if (docId) {
    try {
      await geospatial.insert(
        ctx,
        docId,
        { latitude: centroidLat, longitude: centroidLng },
        { state: 'California', primaryArchetype: 'twisties' },
        spec.compositeScore,
      )
    } catch {
      /* may already be indexed */
    }
  }

  return { routeId: spec.routeId, created: !existing }
}

export const seedTop50Fixtures = internalMutation({
  args: {
    prefix: v.string(),
    readyCount: v.number(),
    nonReadyCount: v.number(),
  },
  handler: async (ctx, { prefix, readyCount, nonReadyCount }) => {
    const specs = buildSeedSpecs(prefix, readyCount, nonReadyCount)
    const readyRouteIds: string[] = []
    const nonReadyRouteIds: string[] = []
    for (const spec of specs) {
      await upsertTop50Route(ctx, spec)
      if (spec.riderReady) readyRouteIds.push(spec.routeId)
      else nonReadyRouteIds.push(spec.routeId)
    }
    return {
      prefix,
      readyRouteIds,
      nonReadyRouteIds,
      readyCount: readyRouteIds.length,
      nonReadyCount: nonReadyRouteIds.length,
    }
  },
})

export const seedTop50FixturesPublic = mutation({
  args: {
    prefix: v.string(),
    readyCount: v.optional(v.number()),
    nonReadyCount: v.optional(v.number()),
  },
  handler: async (ctx, args): Promise<any> => {
    await requireFounder(ctx)
    return await ctx.runMutation(internal.top50Review.seedTop50Fixtures, {
      prefix: args.prefix,
      readyCount: args.readyCount ?? 50,
      nonReadyCount: args.nonReadyCount ?? 5,
    })
  },
})

export const teardownTop50Fixtures = internalMutation({
  args: { prefix: v.string() },
  handler: async (ctx, { prefix }) => {
    const removed: string[] = []

    // Scan by geometry status for fixture rows (prefix match)
    for (const status of ['generated', 'unresolved', 'review', 'failed'] as const) {
      const rows = await ctx.db
        .query('curated_routes')
        .withIndex('by_geometry_status', (q: any) => q.eq('geometryStatus', status))
        .take(800)
      for (const row of rows) {
        if (!row.routeId.startsWith(prefix)) continue
        const geom = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q: any) => q.eq('routeId', row.routeId))
          .first()
        if (geom) await ctx.db.delete(geom._id)
        try {
          await geospatial.remove(ctx, row._id)
        } catch {
          /* not indexed */
        }
        await ctx.db.delete(row._id)
        removed.push(row.routeId)
      }
    }

    // Also try known ready/nonready ids by index (covers any status miss)
    for (let i = 0; i < 60; i++) {
      for (const kind of ['ready', 'nonready'] as const) {
        const routeId = `${prefix}${kind}-${String(i).padStart(3, '0')}`
        const row = await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
          .first()
        if (!row) continue
        const geom = await ctx.db
          .query('curated_route_geometry')
          .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
          .first()
        if (geom) await ctx.db.delete(geom._id)
        try {
          await geospatial.remove(ctx, row._id)
        } catch {
          /* */
        }
        await ctx.db.delete(row._id)
        if (!removed.includes(routeId)) removed.push(routeId)
      }
    }

    return { removed, count: removed.length }
  },
})

export const teardownTop50FixturesPublic = mutation({
  args: { prefix: v.string() },
  handler: async (ctx, { prefix }): Promise<any> => {
    await requireFounder(ctx)
    return await ctx.runMutation(internal.top50Review.teardownTop50Fixtures, { prefix })
  },
})

/** Negative-control helper: strip geometry for one route (local render must fail). */
export const deleteGeometryForRoute = internalMutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (geom) await ctx.db.delete(geom._id)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (route) {
      await ctx.db.patch(route._id, {
        routePolyline: undefined,
        geometryStatus: 'unresolved',
      })
    }
    return { routeId, deleted: !!geom }
  },
})

export const deleteGeometryForRoutePublic = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }): Promise<any> => {
    await requireFounder(ctx)
    return await ctx.runMutation(internal.top50Review.deleteGeometryForRoute, { routeId })
  },
})

export const clearTop50Reviews = internalMutation({
  args: { prefix: v.optional(v.string()) },
  handler: async (ctx) => {
    // Clear recent top50 reviews (test cleanup). Table may be small in tests.
    const rows = await ctx.db.query('top50_reviews').take(200)
    let deleted = 0
    for (const row of rows) {
      await ctx.db.delete(row._id)
      deleted += 1
    }
    return { deleted }
  },
})

export const clearTop50ReviewsPublic = mutation({
  args: { prefix: v.optional(v.string()) },
  handler: async (ctx, args): Promise<any> => {
    await requireFounder(ctx)
    return await ctx.runMutation(internal.top50Review.clearTop50Reviews, {
      prefix: args.prefix,
    })
  },
})
