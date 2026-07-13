/**
 * ⚠️ CURRENTLY UNUSED / NOT DEPLOYED — kept only as a documented future
 * approach. DO NOT assume this file is wired into the AC-2 test.
 *
 * `npx convex dev --once` against this task's dev deployment
 * (dev:quirky-panther-164) currently fails on EVERY push attempt —
 * reproduced identically on the clean pre-remediation commit with zero
 * files from this task present — with:
 *
 *   ✖ Error fetching POST .../api/deploy2/start_push 400 Bad Request:
 *   ModulesTooLarge: Total module size exceeded the zipped maximum
 *   (61.82 MiB > maximum size 42.92 MiB)
 *
 * (verbose push output shows this happens while "Bundling modules for
 * Node.js runtime..." — the shared 'use node' bundle, not anything this
 * file touches.) This is a pre-existing, deployment-wide infra blocker —
 * almost certainly from S2-T1's large `externalPackages` additions
 * (@mastra/core, langchain, @langchain/core/openai/langgraph, ai,
 * @ai-sdk/anthropic — see convex.json) — unrelated to this AC-2 fix and
 * out of this remediation's scope to resolve. It blocks EVERY push to this
 * deployment right now, not just this file's.
 *
 * The AC-2 non-degenerate test therefore does NOT use these mutations. It
 * seeds/tears down via already-deployed real primitives instead — see
 * `convex/actions/agent/spike/__tests__/spikeTools.integration.test.ts`'s
 * "AC-2 non-degenerate" describe block (`npx convex import` for the 3 real
 * rows + the already-deployed `geospatialSeed:seedGeospatialAll` action to
 * index them + the already-deployed `curationAdmin:deleteCuratedRoutesByRouteIds`
 * for teardown). That path needs no new deploy and is fully real-service.
 *
 * This file is left in place (not deleted — flagged for human review) as a
 * cleaner, fully-computed-riderReady alternative to revisit once the
 * deployment's Node bundle is shrunk back under the cap.
 *
 * ---------------------------------------------------------------------
 * ORIGINAL DESIGN NOTES (still accurate for a FUTURE working deploy):
 *
 * WHY THIS FILE EXISTS: AC-2's only prior evidence
 * (`.tmp/S2-T2/AC-2-db-query-evidence.txt`) bypassed `searchCuratedRoutes.execute()`
 * entirely and proved nothing about the tool. The real dev catalog has exactly
 * one riderReady route nationally within any reasonable radius of a real US
 * city (~700mi from Ogden, outside `MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20mi`
 * — see convex/curatedRoutes.ts:130), so every honest
 * `searchCuratedRoutes.execute()` call against a real place returned
 * `no_results` and the `if (result.ok === true) {...}` assertion branch in the
 * integration test NEVER ran. A stub returning unconditional `no_results`
 * would have passed that "evidence" byte-identically.
 *
 * This helper seeds THREE real `curated_routes` rows (+ real geospatial index
 * entries via the same `geospatial` component curatedRoutes.ts uses + real
 * `curated_route_geometry` verification rows via the same
 * `internal.curatedGeometry.persistGeometryVerified` mutation the production
 * geometry-backfill pipeline uses, so `riderReady` is computed by the REAL
 * `computeRiderReadyFromDoc` gate — never hand-set) at known, differing
 * real-world distances from an isolated test center in the open Pacific
 * (~1,000+ miles from Hawaii and every mainland US curated route), so the
 * geospatial nearest-neighbor query can ONLY see these three seeded rows near
 * that coordinate — no contamination from the 5,654-row national catalog, and
 * no collision with unrelated leftover test rows like `test:ratio-*` at
 * 34.95,-120.42 (see AC-2-db-query-evidence.txt — those are pre-existing rows
 * from an earlier, unrelated test suite, left in the dev deployment; this file
 * does not touch them).
 *
 * `seedAc2NonDegenerateRoutes` / `teardownAc2NonDegenerateRoutes` are internal
 * mutations invoked via `npx convex run` from the integration test's
 * `beforeAll`/`afterAll` — the exact real-deployment CLI mechanism
 * `spikeTools.ts` itself uses for `queryNearestCuratedRoutesViaRealDeployment`.
 * This executes real production mutations against the real dev deployment —
 * not a mock, not a fixture, not an in-memory stub. Both mutations are
 * idempotent (they clear any same-routeId leftovers before re-seeding /
 * on teardown) so re-running after an interrupted prior run is safe.
 *
 * This file does NOT modify convex/curatedRoutes.ts or convex/geospatialIndex.ts
 * (both remain writeProhibited per the S2-T2 task contract) — it only calls
 * their already-exported real functions (`geospatial`) and the real
 * `internal.curatedGeometry.persistGeometryVerified` mutation.
 */

import { internal } from './_generated/api'
import type { Id } from './_generated/dataModel'
import { internalMutation } from './_generated/server'
import { geospatial } from './geospatialIndex'
import {
  AC2_SEED_CENTER,
  AC2_SEED_ROUTE_ID_FAR_EXCLUDED,
  AC2_SEED_ROUTE_ID_MID,
  AC2_SEED_ROUTE_ID_NEAR,
} from './spikeAc2SeedConstants'

type Ac2SeedRow = {
  routeId: string
  name: string
  // Due-north offset in degrees latitude from AC2_SEED_CENTER. The REAL
  // geodesic distanceMi is computed server-side by the geospatial index +
  // curatedRoutes.ts's buildRouteCard — these offsets are chosen with wide
  // margins either side of AC2_SEED_RADIUS_MI so no floating-point rounding
  // in the real geodesic calc could flip which side of the radius a row
  // lands on:
  //   near ~3.5mi, mid ~10.4mi  (both comfortably < 12mi radius)
  //   far-excluded ~17.3mi     (comfortably > 12mi radius, but still
  //                             < MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20mi
  //                             so the server's own nearest-mode query still
  //                             returns it — it's the TOOL's radiusMi filter,
  //                             not the server's hard cap, that must exclude it)
  latOffsetDeg: number
}

const AC2_SEED_ROWS: Ac2SeedRow[] = [
  { routeId: AC2_SEED_ROUTE_ID_NEAR, name: 'S2-T2 AC-2 Spike Near (~3.5mi)', latOffsetDeg: 0.05 },
  { routeId: AC2_SEED_ROUTE_ID_MID, name: 'S2-T2 AC-2 Spike Mid (~10.4mi)', latOffsetDeg: 0.15 },
  {
    routeId: AC2_SEED_ROUTE_ID_FAR_EXCLUDED,
    name: 'S2-T2 AC-2 Spike Far-Excluded (~17.3mi)',
    latOffsetDeg: 0.25,
  },
]

/** Deletes a previously-seeded row (curated_routes + geospatial + geometry) if present. Returns whether a row was deleted. */
async function removeSeedRow(ctx: any, routeId: string): Promise<boolean> {
  const existing = await ctx.db
    .query('curated_routes')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
    .first()
  if (!existing) return false

  await geospatial.remove(ctx, existing._id)

  const geomRow = await ctx.db
    .query('curated_route_geometry')
    .withIndex('by_routeId', (q: any) => q.eq('routeId', routeId))
    .first()
  if (geomRow) await ctx.db.delete(geomRow._id)

  await ctx.db.delete(existing._id)
  return true
}

export const seedAc2NonDegenerateRoutes = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Idempotent: clear any leftover rows from a prior interrupted run first,
    // so every run starts from the same deterministic clean state.
    for (const row of AC2_SEED_ROWS) {
      await removeSeedRow(ctx, row.routeId)
    }

    const created: { routeId: string; centroidLat: number; centroidLng: number }[] = []

    for (const row of AC2_SEED_ROWS) {
      const centroidLat = AC2_SEED_CENTER.lat + row.latOffsetDeg
      const centroidLng = AC2_SEED_CENTER.lng
      const nowMs = Date.now()

      const docId: Id<'curated_routes'> = await ctx.db.insert('curated_routes', {
        routeId: row.routeId,
        name: row.name,
        state: 'International Waters',
        source: 'editorial' as const,
        primaryArchetype: 'twisties' as const,
        secondaryTags: ['spike-test', 's2-t2-ac-2'],
        centroidLat,
        centroidLng,
        boundsNeLat: centroidLat + 0.01,
        boundsNeLng: centroidLng + 0.01,
        boundsSwLat: centroidLat - 0.01,
        boundsSwLng: centroidLng - 0.01,
        lengthMiles: 10,
        compositeScore: 85,
        curvatureScore: 80,
        scenicScore: 80,
        technicalScore: 80,
        trafficScore: 20,
        remotenessScore: 90,
        oneLiner: 'S2-T2 AC-2 remediation spike-test row',
        summary:
          'S2-T2 AC-2 remediation spike-test row — real seeded route for non-degenerate coverage.',
        badges: [],
        season: 'year_round' as const,
        contentVersion: 1,
        seededAt: nowMs,
        location: { type: 'Point' as const, coordinates: [centroidLng, centroidLat] },
      })

      await geospatial.insert(
        ctx,
        docId,
        { latitude: centroidLat, longitude: centroidLng },
        { state: 'International Waters', primaryArchetype: 'twisties' },
        85,
      )

      // Real riderReady gate — same mutation the production geometry-backfill
      // pipeline calls. riderReady is COMPUTED by computeRiderReadyFromDoc
      // (convex/curatedGeometry.ts), never hand-set here.
      await ctx.runMutation(internal.curatedGeometry.persistGeometryVerified, {
        id: docId,
        routeId: row.routeId,
        verification: {
          routeId: row.routeId,
          verdict: 'pass' as const,
          geometryStatus: 'generated' as const,
          anchorCount: 2,
          anchors: [
            {
              lat: centroidLat,
              lng: centroidLng,
              formatted: `${row.name} anchor A`,
              distanceFromCentroid: 0,
            },
            {
              lat: centroidLat + 0.001,
              lng: centroidLng,
              formatted: `${row.name} anchor B`,
              distanceFromCentroid: 0.07,
            },
          ],
          pointCount: 2,
          degenerate: false,
          ratio: 1,
          claimedMiles: 10,
          routedMiles: 10,
        },
      })

      created.push({ routeId: row.routeId, centroidLat, centroidLng })
    }

    return { seeded: created.length, routes: created }
  },
})

export const teardownAc2NonDegenerateRoutes = internalMutation({
  args: {},
  handler: async (ctx) => {
    let deleted = 0
    for (const row of AC2_SEED_ROWS) {
      const wasDeleted = await removeSeedRow(ctx, row.routeId)
      if (wasDeleted) deleted++
    }
    return { deleted }
  },
})
