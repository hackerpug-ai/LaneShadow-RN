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
import { decodePolylineGeometry, haversineMeters } from '../shared/lib/polyline'
import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { determineGateVerdict, type GateVerdict, isAnchorInRegion } from './curatedGeometryGate'
import { assertTestSubjectOrThrow, requireIdentity, requireOperator } from './guards'

/**
 * REDHAT-FIX-05: Derive pointCount + routedMiles by DECODING the real candidate
 * polyline, never trusting the stored verification record. A stale or
 * attacker-influenced stored record must not be able to promote a geometry whose
 * actual points/length fail the canonical gate.
 */
export function measureCandidateGeometry(
  geometry: string | { value: string; precision?: number },
): { pointCount: number; routedMiles: number } {
  let coords: ReturnType<typeof decodePolylineGeometry> = []
  try {
    coords = decodePolylineGeometry(geometry as never)
  } catch {
    coords = []
  }
  const pointCount = coords.length
  let totalMeters = 0
  for (let i = 1; i < coords.length; i += 1) {
    totalMeters += haversineMeters(coords[i - 1], coords[i])
  }
  return { pointCount, routedMiles: totalMeters / 1609.34 }
}

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

    // P0(b): When routeIdPrefix is a concrete routeId (contains ':' and no
    // wildcards), resolve it directly via the by_routeId index so the target
    // route cannot be missed when stale review rows push it outside the
    // generic take window. This is the fast path.
    const directLookupRow = routeIdPrefix?.includes(':')
      ? await ctx.db
          .query('curated_routes')
          .withIndex('by_routeId', (q) => q.eq('routeId', routeIdPrefix))
          .first()
      : null

    // Fallback: generic filtered scan (kept for no-prefix and partial-prefix cases)
    let rows = await ctx.db
      .query('curated_routes')
      .withIndex('by_geometry_status', (q) => q.eq('geometryStatus', 'review'))
      .take(take * 3)

    // Merge the direct-lookup row if it's in review status and not already
    // in the fallback set (dedup by routeId)
    if (
      directLookupRow &&
      directLookupRow.geometryStatus === 'review' &&
      !rows.some((r) => r.routeId === directLookupRow.routeId)
    ) {
      rows = [directLookupRow, ...rows]
    }

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
    await requireOperator(ctx)
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

/**
 * REDHAT-FIX-05: Evaluate a REVIEW candidate against the canonical geometry gate.
 * Pure function — no DB access. Returns the gate verdict + whether riderReady
 * should be set (only when the gate passes).
 */
export function evaluateApprovalCandidate(args: {
  anchorCount: number
  anchors: Array<{ lat: number; lng: number }>
  centroid: { lat: number; lng: number }
  routedMiles: number
  pointCount: number
  ratio: number | null
  quarantine: boolean
  claimedMiles: number
}): {
  verdict: 'pass' | 'review'
  failedCondition?: 'ratio' | 'anchors' | 'degenerate'
  riderReady: boolean
  gateResult: GateVerdict
} {
  const inRegionAnchorCount = args.anchors.filter((a) => isAnchorInRegion(a, args.centroid)).length

  const gateResult = determineGateVerdict({
    ratio: args.ratio,
    pointCount: args.pointCount,
    routedMiles: args.routedMiles,
    anchorCount: args.anchorCount,
    inRegionAnchorCount,
    quarantine: args.quarantine,
  })

  return {
    verdict: gateResult.verdict,
    failedCondition: gateResult.failedCondition,
    riderReady: gateResult.verdict === 'pass',
    gateResult,
  }
}

/** Approve: persist best candidate geometry as gate-pass (founder/operator). */
export const approveDisposition = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireOperator(ctx)
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

    // FIX-05: Run the canonical geometry gate on the stored verification data.
    // Approval must NOT forge a pass for gate-failing geometry.
    const storedAnchors =
      geom?.verification?.anchors?.map(
        (a: { lat: number; lng: number; formatted?: string; distanceFromCentroid?: number }) => ({
          lat: a.lat,
          lng: a.lng,
          formatted: a.formatted ?? '',
          distanceFromCentroid: a.distanceFromCentroid ?? 0,
        }),
      ) ?? []
    const anchorCount = storedAnchors.length
    const gateAnchors: Array<{ lat: number; lng: number }> = storedAnchors.map((a) => ({
      lat: a.lat,
      lng: a.lng,
    }))
    const centroid = {
      lat: route.centroidLat ?? 34.95,
      lng: route.centroidLng ?? -120.42,
    }
    // FIX-05: DECODE the real candidate geometry and derive pointCount +
    // routedMiles + ratio from it — never trust the stored verification record
    // (a stale/attacker-influenced record must not promote bad geometry).
    const claimedMiles = route.lengthMiles ?? geom?.verification?.claimedMiles ?? 0
    const quarantine = route.quarantine != null
    const measured = measureCandidateGeometry(geometry)
    const ratio = quarantine || claimedMiles <= 0 ? null : measured.routedMiles / claimedMiles

    const evaluation = evaluateApprovalCandidate({
      anchorCount,
      anchors: gateAnchors,
      centroid,
      routedMiles: measured.routedMiles,
      pointCount: measured.pointCount,
      ratio,
      quarantine,
      claimedMiles,
    })

    // FIX-05: Gate-failing candidates stay in REVIEW — do NOT forge pass/riderReady.
    // Founders who need to override must use a separate override pathway (not yet
    // implemented) that sets geometryStatus:'override' with audit rationale.
    if (evaluation.verdict !== 'pass') {
      const now = Date.now()
      await ctx.db.insert('curation_artifacts', {
        routeId,
        artifactType: 'disposition',
        disposition: 'approve',
        terminalState: 'queued',
        failedCondition: evaluation.failedCondition,
        bestCandidateGeometry: geometry,
        attemptedAt: now,
        createdAt: now,
      })

      return {
        routeId,
        disposition: 'approve' as const,
        geometryStatus: 'review' as const,
        verdict: 'review' as const,
        riderReady: false,
        gateBlocked: true,
        failedCondition: evaluation.failedCondition,
      }
    }

    // Gate passes — persist the canonical approval.
    const provenance: 'scraped_promoted' | 'ai_reconstructed' | 'name_routed' =
      (geom?.verification?.provenance as
        | 'scraped_promoted'
        | 'ai_reconstructed'
        | 'name_routed'
        | undefined) ??
      geom?.provenance ??
      'scraped_promoted'

    const verification = {
      routeId,
      verdict: 'pass' as const,
      provenance,
      geometry,
      geometryStatus: 'generated' as const,
      anchorCount,
      anchors: storedAnchors,
      pointCount: measured.pointCount,
      degenerate: false,
      ratio: evaluation.gateResult.ratio,
      claimedMiles,
      routedMiles: measured.routedMiles,
    }

    const geomDoc = {
      routeId,
      format: 'polyline' as const,
      encoding: 'utf-8',
      precision: 5,
      value: geometry,
      provenance,
      verification,
    }

    if (geom) {
      await ctx.db.replace(geom._id, geomDoc)
    } else {
      await ctx.db.insert('curated_route_geometry', geomDoc)
    }

    await ctx.db.patch(route._id, {
      geometryStatus: 'generated',
      geometryProvenance: provenance,
      riderReady: true,
      retiredAt: undefined,
    })

    const now = Date.now()
    await ctx.db.insert('curation_artifacts', {
      routeId,
      artifactType: 'disposition',
      disposition: 'approve',
      terminalState: 'recovered',
      provenance,
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

/** Retire: mark retiredAt, riderReady=false, leave REVIEW (operator only). */
export const retireDisposition = mutation({
  args: { routeId: v.string() },
  handler: async (ctx, { routeId }) => {
    await requireOperator(ctx)
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
    await requireOperator(ctx)
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
    const identity = await requireIdentity(ctx)

    // REDHAT-FIX-01: the deterministic Lever-2 test seam must be unreachable
    // from a production identity — a real REVIEW retry must call live
    // reconstruction, never the fixed-geometry bypass.
    if (args.lever2FixedGeometry) {
      assertTestSubjectOrThrow(identity.clerkUserId)
    }

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
