/**
 * S4-T5 / VER-04: REVIEW queue listing + founder dispositions.
 *
 * Queue itself lives on curated_routes (geometryStatus='review') — status-field
 * pattern from S4-T2. This module adds:
 *   - list with bestCandidateGeometry
 *   - approve (persist best geometry as pass)
 *   - retry (re-run a lever)
 *   - retire (retiredAt + riderReady=false)
 *   - disposition audit rows in curation_artifacts
 */

import { v } from 'convex/values'
import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { requireIdentity } from './guards'

// ---------------------------------------------------------------------------
// List REVIEW queue with best candidate geometry
// ---------------------------------------------------------------------------

export const listGeometryReviewQueue = query({
  args: {
    limit: v.optional(v.number()),
    routeIdPrefix: v.optional(v.string()),
  },
  handler: async (ctx, { limit, routeIdPrefix }) => {
    await requireIdentity(ctx)
    const take = Math.min(limit ?? 50, 200)

    let rows = await ctx.db
      .query('curated_routes')
      .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', 'review'))
      .take(take * 3)

    if (routeIdPrefix) {
      rows = rows.filter((r) => r.routeId.startsWith(routeIdPrefix))
    }

    const reviewQueue = []
    for (const row of rows.slice(0, take)) {
      const geom = await ctx.db
        .query('curated_route_geometry')
        .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
        .first()

      // Prefer side-table geometry; fall back to curation_artifacts review_candidate
      let bestCandidateGeometry: string | null = geom?.value ?? geom?.verification?.geometry ?? null
      if (!bestCandidateGeometry) {
        const art = await ctx.db
          .query('curation_artifacts')
          .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
          .collect()
        const candidate = art
          .filter((a) => a.artifactType === 'review_candidate')
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]
        bestCandidateGeometry = candidate?.bestCandidateGeometry ?? null
      }

      const dispositionArts = await ctx.db
        .query('curation_artifacts')
        .withIndex('by_routeId', (q) => q.eq('routeId', row.routeId))
        .collect()
      const lastDisposition = dispositionArts
        .filter((a) => a.artifactType === 'disposition')
        .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))[0]

      reviewQueue.push({
        routeId: row.routeId,
        name: row.name,
        geometryStatus: row.geometryStatus,
        failedCondition: geom?.verification?.failedCondition ?? null,
        verdict: geom?.verification?.verdict ?? null,
        ratio: geom?.verification?.ratio ?? null,
        routedMiles: geom?.verification?.routedMiles ?? null,
        claimedMiles: geom?.verification?.claimedMiles ?? null,
        bestCandidateGeometry,
        attemptedAt: lastDisposition?.attemptedAt
          ? new Date(lastDisposition.attemptedAt).toISOString()
          : geom
            ? new Date().toISOString()
            : null,
        retiredAt: row.retiredAt ?? null,
        riderReady: row.riderReady ?? false,
      })
    }

    return { reviewQueue, length: reviewQueue.length }
  },
})

// ---------------------------------------------------------------------------
// Seed a route already in REVIEW with best candidate geometry (for AC-6)
// ---------------------------------------------------------------------------

export const seedReviewQueueEntry = mutation({
  args: {
    routeId: v.string(),
    name: v.optional(v.string()),
    bestCandidateGeometry: v.string(),
    failedCondition: v.optional(
      v.union(v.literal('ratio'), v.literal('anchors'), v.literal('degenerate')),
    ),
    lengthMiles: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireIdentity(ctx)
    const failedCondition = args.failedCondition ?? 'ratio'
    const lengthMiles = args.lengthMiles ?? 41
    const nowMs = Date.now()
    const centroidLat = 34.95
    const centroidLng = -120.42

    const existing = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', args.routeId))
      .first()

    let routeDocId = existing?._id
    if (existing) {
      await ctx.db.patch(existing._id, {
        geometryStatus: 'review',
        geometryProvenance: undefined,
        riderReady: false,
        retiredAt: undefined,
        name: args.name ?? existing.name,
        lengthMiles,
      })
    } else {
      routeDocId = await ctx.db.insert('curated_routes', {
        routeId: args.routeId,
        source: 'editorial',
        name: args.name ?? `Review ${args.routeId}`,
        primaryArchetype: 'twisties',
        secondaryTags: ['test', 's4t5-review'],
        oneLiner: 'S4-T5 review seed',
        summary: 'S4-T5 review seed summary',
        badges: [],
        season: 'year_round',
        contentVersion: 1,
        seededAt: nowMs,
        lengthMiles,
        centroidLat,
        centroidLng,
        boundsNeLat: centroidLat + 0.3,
        boundsNeLng: centroidLng + 0.3,
        boundsSwLat: centroidLat - 0.3,
        boundsSwLng: centroidLng - 0.3,
        location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
        compositeScore: 85,
        curvatureScore: 90,
        scenicScore: 80,
        technicalScore: 85,
        trafficScore: 75,
        remotenessScore: 70,
        state: 'California',
        geometryStatus: 'review',
        riderReady: false,
        rideWorthiness: {
          verdict: 'ride' as const,
          reason: 's4t5 review seed',
          model: 'test',
          classifiedAt: nowMs,
        },
      })
    }

    const verification = {
      routeId: args.routeId,
      verdict: 'review' as const,
      failedCondition,
      geometry: args.bestCandidateGeometry,
      geometryStatus: 'review' as const,
      anchorCount: 2,
      anchors: [
        {
          lat: centroidLat,
          lng: centroidLng,
          formatted: 'Seed A',
          distanceFromCentroid: 0,
        },
        {
          lat: centroidLat + 0.1,
          lng: centroidLng + 0.1,
          formatted: 'Seed B',
          distanceFromCentroid: 10,
        },
      ],
      pointCount: 50,
      degenerate: false,
      ratio: 2.0,
      claimedMiles: lengthMiles,
      routedMiles: lengthMiles * 2,
    }

    const existingGeom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', args.routeId))
      .first()

    const geomDoc = {
      routeId: args.routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: args.bestCandidateGeometry,
      provenance: undefined,
      verification,
    }

    if (existingGeom) {
      await ctx.db.replace(existingGeom._id, geomDoc)
    } else {
      await ctx.db.insert('curated_route_geometry', geomDoc)
    }

    await ctx.db.insert('curation_artifacts', {
      routeId: args.routeId,
      artifactType: 'review_candidate',
      terminalState: 'queued',
      failedCondition,
      bestCandidateGeometry: args.bestCandidateGeometry,
      createdAt: nowMs,
      attemptedAt: nowMs,
    })

    return { routeId: args.routeId, id: routeDocId, geometryStatus: 'review' as const }
  },
})

// ---------------------------------------------------------------------------
// Dispositions
// ---------------------------------------------------------------------------

/** Approve: persist best candidate geometry as gate-pass (founder override). */
export const approveDisposition = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const geometry = geom?.value ?? geom?.verification?.geometry ?? route.routePolyline ?? undefined
    if (!geometry) {
      throw new Error(`No best candidate geometry to approve for ${routeId}`)
    }

    const verification = {
      routeId,
      verdict: 'pass' as const,
      provenance: 'scraped_promoted' as const,
      geometry,
      geometryStatus: 'generated' as const,
      anchorCount: geom?.verification?.anchorCount ?? 2,
      anchors: geom?.verification?.anchors ?? [],
      pointCount: geom?.verification?.pointCount ?? 50,
      degenerate: false,
      ratio: geom?.verification?.ratio ?? 1.0,
      claimedMiles: geom?.verification?.claimedMiles ?? route.lengthMiles,
      routedMiles: geom?.verification?.routedMiles ?? route.lengthMiles,
    }

    const geomDoc = {
      routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: geometry,
      provenance: 'scraped_promoted' as const,
      verification,
    }

    if (geom) {
      await ctx.db.replace(geom._id, geomDoc)
    } else {
      await ctx.db.insert('curated_route_geometry', geomDoc)
    }

    await ctx.db.patch(route._id, {
      geometryStatus: 'generated',
      geometryProvenance: 'scraped_promoted',
      riderReady: true,
      retiredAt: undefined,
    })

    const now = Date.now()
    await ctx.db.insert('curation_artifacts', {
      routeId,
      artifactType: 'disposition',
      disposition: 'approve',
      terminalState: 'recovered',
      provenance: 'scraped_promoted',
      bestCandidateGeometry: geometry,
      attemptedAt: now,
      createdAt: now,
    })

    return {
      routeId,
      disposition: 'approve' as const,
      geometryStatus: 'generated' as const,
      verdict: 'pass' as const,
      riderReady: true,
    }
  },
})

/** Retire: mark retiredAt, riderReady=false, leave REVIEW. */
export const retireDisposition = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) throw new Error(`Route not found: ${routeId}`)

    const retiredAt = Date.now()
    await ctx.db.patch(route._id, {
      retiredAt,
      riderReady: false,
    })

    await ctx.db.insert('curation_artifacts', {
      routeId,
      artifactType: 'disposition',
      disposition: 'retire',
      terminalState: 'retirement_eligible',
      attemptedAt: retiredAt,
      createdAt: retiredAt,
    })

    return {
      routeId,
      disposition: 'retire' as const,
      retiredAt: new Date(retiredAt).toISOString(),
      riderReady: false,
    }
  },
})

/**
 * Retry: clear terminal review status, re-run the specified lever.
 * Lever re-run is an action — this mutation prepares state; `retryDisposition`
 * action orchestrates the lever call.
 */
export const prepareRetryDisposition = mutation({
  args: {
    routeId: v.string(),
    lever: v.union(v.literal(1), v.literal(2), v.literal(3)),
  },
  handler: async (ctx, { routeId, lever }) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) throw new Error(`Route not found: ${routeId}`)

    // Return to eligible pool with fresh attempt budget
    await ctx.db.patch(route._id, {
      geometryStatus: 'unresolved',
      geometryProvenance: undefined,
      riderReady: false,
      retiredAt: undefined,
    })

    // Drop pass geometry if any; keep review geometry as candidate until lever writes
    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (geom?.verification?.verdict === 'pass') {
      await ctx.db.delete(geom._id)
    }

    const now = Date.now()
    await ctx.db.insert('curation_artifacts', {
      routeId,
      artifactType: 'disposition',
      disposition: 'retry',
      lever,
      attemptedAt: now,
      createdAt: now,
    })

    return { routeId, lever, prepared: true, attemptedAt: now }
  },
})

type RetryDispositionResult = {
  routeId: string
  disposition: 'retry'
  retryCount: number
  lever: 1 | 2 | 3
  prepared: { routeId: string; lever: 1 | 2 | 3; prepared: boolean; attemptedAt: number }
  leverResult: unknown
  attemptedAt: string
}

/** Action: prepare retry + re-run the lever. */
export const retryDisposition = action({
  args: {
    routeId: v.string(),
    lever: v.union(v.literal(1), v.literal(2), v.literal(3)),
    lever2FixedGeometry: v.optional(
      v.object({
        routedMiles: v.number(),
        pointCount: v.optional(v.number()),
        anchorCount: v.optional(v.number()),
        claimedMiles: v.optional(v.union(v.number(), v.null())),
      }),
    ),
  },
  handler: async (ctx, args): Promise<RetryDispositionResult> => {
    await requireIdentity(ctx)

    const prepared: RetryDispositionResult['prepared'] = await ctx.runMutation(
      api.reviewQueue.prepareRetryDisposition,
      {
        routeId: args.routeId,
        lever: args.lever,
      },
    )

    let leverResult: unknown
    if (args.lever === 1) {
      leverResult = await ctx.runAction(api.curatedGeometryReconstruct.promoteForRoute, {
        routeId: args.routeId,
      })
    } else if (args.lever === 2) {
      if (args.lever2FixedGeometry) {
        leverResult = await ctx.runAction(
          api.curatedGeometryReconstruct.reconstructForRouteWithFixedGeometry,
          {
            routeId: args.routeId,
            routedMiles: args.lever2FixedGeometry.routedMiles,
            pointCount: args.lever2FixedGeometry.pointCount,
            anchorCount: args.lever2FixedGeometry.anchorCount,
            claimedMiles: args.lever2FixedGeometry.claimedMiles,
          },
        )
      } else {
        leverResult = await ctx.runAction(api.curatedGeometryReconstruct.reconstructForRoute, {
          routeId: args.routeId,
        })
      }
    } else {
      leverResult = await ctx.runAction(api.curatedGeometryReconstruct.rerouteForRoute, {
        routeId: args.routeId,
      })
    }

    return {
      routeId: args.routeId,
      disposition: 'retry' as const,
      retryCount: 1,
      lever: args.lever,
      prepared,
      leverResult,
      attemptedAt: new Date(prepared.attemptedAt).toISOString(),
    }
  },
})

/** Read route disposition state for tests. */
export const getRouteDispositionState = query({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireIdentity(ctx)
    const route = await ctx.db
      .query('curated_routes')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()
    if (!route) return null

    const geom = await ctx.db
      .query('curated_route_geometry')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .first()

    const arts = await ctx.db
      .query('curation_artifacts')
      .withIndex('by_routeId', (q) => q.eq('routeId', routeId))
      .collect()

    const dispositions = arts
      .filter((a) => a.artifactType === 'disposition')
      .sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0))

    return {
      routeId,
      geometryStatus: route.geometryStatus ?? null,
      geometryProvenance: route.geometryProvenance ?? null,
      riderReady: route.riderReady ?? false,
      retiredAt: route.retiredAt != null ? new Date(route.retiredAt).toISOString() : null,
      verdict: geom?.verification?.verdict ?? null,
      provenance: geom?.provenance ?? geom?.verification?.provenance ?? null,
      dispositions,
      dispositionCount: dispositions.length,
    }
  },
})
