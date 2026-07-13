/**
 * S2-T2 — Integration tests for the Mastra reference-spike tools:
 * geocodePlace + searchCuratedRoutes.
 *
 * REAL SERVICES ONLY — no mocks. AC-1/AC-2/AC-3 hit the REAL Google Geocoding
 * API (GOOGLE_MAPS_API_KEY on the dev deployment, via the same
 * createGeocodingProvider the routing pipeline uses) and the REAL Convex dev
 * deployment's curated_routes catalog (listCuratedRoutesInternal nearest
 * mode, real geospatial index, real riderReady gate, real server-computed
 * distanceMi). AC-4 is a pure Zod schema-shape unit test — zero I/O.
 *
 * This suite deliberately never imports `convex/_generated/api` (directly or
 * transitively): vitest.config.ts globally aliases any path ending in
 * "_generated/api" (see the `resolve.alias` regex entries) to a mock Proxy,
 * which would silently defeat the real-service requirement for AC-1/AC-2/AC-3.
 * spikeTools.ts reaches the real dev deployment's `listCuratedRoutesInternal`
 * (a Convex internalQuery, only invokable via the function runtime or the
 * CLI's admin-authenticated `convex run`) through `npx convex run` —
 * the exact mechanism this codebase already uses for real-deployment
 * integration coverage (see `../../tools/__tests__/discoverCuratedRoutes.integration.test.ts`'s
 * `convexRun` helper).
 *
 * Reference: .spec/prds/route-agent-quality/tasks/sprint-02-mastra-reference-spike/
 *            S2-T2-spike-tools-geocodeplace-searchcuratedroutes-as-createtool-zod-errors-as-data-ce.md
 *
 * Environment note: the repo's default vitest environment is jsdom
 * (vitest.config.ts). jsdom's global AbortSignal/AbortController identity
 * does not match the one Node's native fetch/undici expects, so a REAL
 * (un-mocked) `fetch(url, { signal })` call throws
 * "RequestInit: Expected signal ... to be an instance of AbortSignal" before
 * any network I/O happens — a pre-existing jsdom/undici environment quirk
 * this repo's other real-fetch integration suites avoid only because they
 * either mock fetch or shell out via `npx convex run` (a child process, so
 * this quirk never applies to it). AC-1/AC-3's geocodePlace calls make a
 * genuinely real, un-mocked fetch, so this file opts into the plain `node`
 * environment (Vitest per-file `@vitest-environment` override) instead.
 */
// @vitest-environment node

import { execFile } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  AC2_SEED_CENTER,
  AC2_SEED_LAT_OFFSET_FAR_EXCLUDED,
  AC2_SEED_LAT_OFFSET_MID,
  AC2_SEED_LAT_OFFSET_NEAR,
  AC2_SEED_RADIUS_MI,
  AC2_SEED_ROUTE_ID_FAR_EXCLUDED,
  AC2_SEED_ROUTE_ID_MID,
  AC2_SEED_ROUTE_ID_NEAR,
} from '../../../../spikeAc2SeedConstants'
import {
  geocodePlace,
  geocodePlaceInputSchema,
  searchCuratedRoutes,
  searchCuratedRoutesOutputSchema,
} from '../spikeTools'

// Real HTTP (Google Geocoding) + real CLI round-trip (npx convex run) to the
// real dev deployment — generous timeout, this is genuinely a live network call.
const REAL_SERVICE_TIMEOUT_MS = 45_000
// geospatialSeed:seedGeospatialAll paginates the ENTIRE curated_routes table
// (5,700+ rows) to index the 3 new seeded rows — this real full-table sweep
// is slower than a normal single-row CLI round-trip. Measured at ~4m19s
// against the real dev deployment (5,760 rows, 29 batches) — generous margin.
const SEED_GEOSPATIAL_TIMEOUT_MS = 420_000

// Promisified (non-blocking) execFile: seedGeospatialAll's multi-minute real
// CLI round-trip must NOT block the Node event loop, or vitest's own
// worker<->main RPC heartbeat ("onTaskUpdate") times out and the process
// exits non-zero even though every assertion passed — a false failure of
// the CI-enforced check, not a real one. execFileSync (fully synchronous)
// was tried first and reproduced exactly this: assertions green, but
// `pnpm test` exited 1 on an "Unhandled Error: Timeout calling
// onTaskUpdate". Async execFile keeps the event loop turning during the
// long real subprocess wait, so vitest's heartbeat keeps flowing.
const execFileAsync = promisify(execFile)

/** Convex CLI: positional JSON args (matches the pattern this repo's other
 * real-deployment integration suites use — see
 * convex/__tests__/geometryGatePersist.integration.test.ts's runConvexFn). */
async function runConvexFn(
  fnPath: string,
  args: Record<string, unknown> = {},
  timeoutMs = REAL_SERVICE_TIMEOUT_MS,
): Promise<string> {
  const { stdout } = await execFileAsync('npx', ['convex', 'run', fnPath, JSON.stringify(args)], {
    encoding: 'utf-8',
    timeout: timeoutMs,
  })
  return stdout
}

const AC2_SEEDED_ROUTE_IDS = [
  AC2_SEED_ROUTE_ID_NEAR,
  AC2_SEED_ROUTE_ID_MID,
  AC2_SEED_ROUTE_ID_FAR_EXCLUDED,
]

/**
 * Builds a real curated_routes document (matching shared/models/curated-routes.ts's
 * curatedRouteValidator exactly) at a known due-north offset from
 * AC2_SEED_CENTER, for `npx convex import`.
 */
function buildAc2SeedRow(routeId: string, name: string, latOffsetDeg: number) {
  const centroidLat = AC2_SEED_CENTER.lat + latOffsetDeg
  const centroidLng = AC2_SEED_CENTER.lng
  return {
    routeId,
    name,
    state: 'International Waters',
    source: 'editorial',
    primaryArchetype: 'twisties',
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
    season: 'year_round',
    contentVersion: 1,
    seededAt: Date.now(),
    location: { type: 'Point', coordinates: [centroidLng, centroidLat] },
    riderReady: true,
    geometryStatus: 'generated',
  }
}

/**
 * Deletes the 3 seeded rows via the already-deployed, real
 * `curationAdmin:deleteCuratedRoutesByRouteIds` public mutation. Safe to call
 * even when the rows don't exist yet (returns them in `missing`), so this
 * doubles as an idempotent pre-clean at the start of beforeAll.
 */
async function teardownAc2SeedRows(): Promise<void> {
  await runConvexFn('curationAdmin:deleteCuratedRoutesByRouteIds', {
    routeIds: AC2_SEEDED_ROUTE_IDS,
  })
}

describe('S2-T2 spike tools: geocodePlace + searchCuratedRoutes', () => {
  // ---------------------------------------------------------------------
  // AC-1 — geocodePlace resolves Ogden via real Google Geocoding
  // ---------------------------------------------------------------------
  it(
    'geocodePlace resolves Ogden via real Google Geocoding',
    async () => {
      const result: any = await geocodePlace.execute({ place: 'Ogden, UT' })

      // MUST_OBSERVE
      expect(result.ok).toBe(true)
      expect(result.center.lat).toBeGreaterThanOrEqual(41.1)
      expect(result.center.lat).toBeLessThanOrEqual(41.35)
      expect(result.center.lng).toBeGreaterThanOrEqual(-112.1)
      expect(result.center.lng).toBeLessThanOrEqual(-111.85)
      expect(result.formattedAddress.includes('Ogden')).toBe(true)

      // MUST_NOT_OBSERVE (negative controls)
      expect(result.ok).not.toBe(false)
      expect(result.center.lat).not.toBe(0)
      expect(result.center).not.toBeUndefined()
    },
    REAL_SERVICE_TIMEOUT_MS,
  )

  // ---------------------------------------------------------------------
  // AC-2 — searchCuratedRoutes returns server distanceMi within radius,
  // nearest-first, against the real dev deployment
  // ---------------------------------------------------------------------
  it(
    'searchCuratedRoutes returns server distanceMi within radius nearest-first',
    async () => {
      const result: any = await searchCuratedRoutes.execute({
        center: { lat: 41.223, lng: -111.973 },
        radiusMi: 30,
      })

      // MUST_OBSERVE: thin coverage is honest — either a real success (possibly
      // with 0+ routes) or a typed no_results error, never a thrown exception
      // and never a fabricated route.
      const isHonestOutcome =
        result.ok === true || (result.ok === false && result.errorCode === 'no_results')
      expect(isHonestOutcome).toBe(true)

      if (result.ok === true) {
        const { routes } = result
        expect(Array.isArray(routes)).toBe(true)

        if (routes.length >= 1) {
          expect(typeof routes[0].distanceMi).toBe('number')
          expect(routes[0].distanceMi).toBeGreaterThan(0)
        }
        if (routes.length >= 2) {
          expect(routes[0].distanceMi).toBeLessThanOrEqual(routes[1].distanceMi)
        }
        for (const route of routes) {
          expect(route.distanceMi).toBeLessThanOrEqual(30)
        }

        // MUST_NOT_OBSERVE (negative controls)
        expect(routes.some((r: any) => r.distanceMi > 30)).toBe(false)
        expect(routes.some((r: any) => r.distanceMi === undefined)).toBe(false)
      }
    },
    REAL_SERVICE_TIMEOUT_MS,
  )

  // ---------------------------------------------------------------------
  // AC-2 REMEDIATION (cycle 1) — CI-ENFORCED non-degenerate case.
  //
  // The Ogden-centered case above is an HONEST but DEGENERATE proof: the real
  // dev catalog has exactly one riderReady route nationally (~700mi away,
  // outside MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20mi — convex/curatedRoutes.ts:130),
  // so `result.ok` is ALWAYS false there and the `if (result.ok === true) {...}`
  // assertions above NEVER execute. A stub returning unconditional
  // `{ok:false, errorCode:'no_results'}` would pass that case byte-identically.
  //
  // This block seeds THREE real curated_routes rows at known, differing
  // real-world distances from an isolated open-Pacific test center, then
  // calls `searchCuratedRoutes.execute()` directly (never the raw
  // `npx convex run` bypass `AC-2-db-query-evidence.txt` used) and asserts
  // the radius filter + server distanceMi mapping + nearest-first ordering
  // unconditionally (result.ok MUST be true — no honest-degenerate escape
  // hatch).
  //
  // Seeding mechanism: `npx convex dev`/`convex deploy` pushes to this
  // task's dev deployment are CURRENTLY BROKEN deployment-wide — reproduced
  // identically on the clean pre-remediation commit with zero files from
  // this task present — with "ModulesTooLarge: Total module size exceeded
  // the zipped maximum (61.82 MiB > maximum size 42.92 MiB)" while bundling
  // the shared Node.js runtime bundle (almost certainly S2-T1's large
  // @mastra/core/langchain/ai-sdk externalPackages additions — see
  // convex/spikeAc2Seed.ts's header for the full trail). That is a
  // pre-existing infra blocker unrelated to this AC-2 fix, so this test
  // seeds/tears down using only ALREADY-DEPLOYED real primitives instead of
  // deploying a new mutation:
  //   1. `npx convex import --table curated_routes --append` — a real CLI
  //      write of 3 real rows into the real curated_routes table (the
  //      standard Convex data-loading mechanism, not a mock).
  //   2. `geospatialSeed:seedGeospatialAll` — the already-deployed real
  //      action that indexes any un-indexed curated_routes row into the
  //      real geospatial component (idempotent: skips already-indexed rows).
  //   3. `curationAdmin:deleteCuratedRoutesByRouteIds` — the already-deployed
  //      real mutation used for teardown (and as an idempotent pre-clean).
  // KNOWN LIMITATION: deleteCuratedRoutesByRouteIds removes the curated_routes
  // docs but not their geospatial-index entries (no already-deployed function
  // exposes that). The orphaned entries point at deleted doc ids; every
  // downstream query (`listCuratedRoutesInternal`/`listCuratedRoutes`)
  // defensively filters `route !== null` after `ctx.db.get()`
  // (convex/curatedRoutes.ts:254-256), so they can never surface in any
  // query result — inert leftover state, not a correctness or leakage risk.
  // ---------------------------------------------------------------------
  describe('AC-2 non-degenerate: seeded real routes at known differing distances', () => {
    beforeAll(async () => {
      // Idempotent pre-clean in case a prior interrupted run left rows behind.
      await teardownAc2SeedRows()

      const seedDir = mkdtempSync(join(tmpdir(), 's2-t2-ac2-seed-'))
      const seedFile = join(seedDir, 'ac2-seed-routes.jsonl')
      const rows = [
        buildAc2SeedRow(
          AC2_SEED_ROUTE_ID_NEAR,
          'S2-T2 AC-2 Spike Near (~3.5mi)',
          AC2_SEED_LAT_OFFSET_NEAR,
        ),
        buildAc2SeedRow(
          AC2_SEED_ROUTE_ID_MID,
          'S2-T2 AC-2 Spike Mid (~10.4mi)',
          AC2_SEED_LAT_OFFSET_MID,
        ),
        buildAc2SeedRow(
          AC2_SEED_ROUTE_ID_FAR_EXCLUDED,
          'S2-T2 AC-2 Spike Far-Excluded (~17.3mi)',
          AC2_SEED_LAT_OFFSET_FAR_EXCLUDED,
        ),
      ]
      writeFileSync(seedFile, rows.map((r) => JSON.stringify(r)).join('\n'), 'utf-8')

      try {
        await execFileAsync(
          'npx',
          ['convex', 'import', '--table', 'curated_routes', '--append', '-y', seedFile],
          { encoding: 'utf-8', timeout: REAL_SERVICE_TIMEOUT_MS },
        )
      } finally {
        rmSync(seedDir, { recursive: true, force: true })
      }

      // Real full-table sweep against the real geospatial component —
      // idempotent (skips rows already indexed), so safe even if a prior
      // run already indexed some of these routeIds.
      await runConvexFn('geospatialSeed:seedGeospatialAll', {}, SEED_GEOSPATIAL_TIMEOUT_MS)
    }, SEED_GEOSPATIAL_TIMEOUT_MS)

    afterAll(async () => {
      await teardownAc2SeedRows()
    }, REAL_SERVICE_TIMEOUT_MS)

    it(
      'returns the two in-radius seeded routes nearest-first with real server distanceMi, excluding the out-of-radius seeded route',
      async () => {
        const result: any = await searchCuratedRoutes.execute({
          center: AC2_SEED_CENTER,
          radiusMi: AC2_SEED_RADIUS_MI,
        })

        // MUST_OBSERVE — unconditional real success, no honest-no_results escape hatch.
        expect(result.ok).toBe(true)

        const { routes } = result
        expect(Array.isArray(routes)).toBe(true)
        expect(routes.length).toBe(2)

        // Server-computed distanceMi, real numbers, within the requested radius.
        expect(typeof routes[0].distanceMi).toBe('number')
        expect(routes[0].distanceMi).toBeGreaterThan(0)
        expect(routes[0].distanceMi).toBeLessThanOrEqual(AC2_SEED_RADIUS_MI)
        expect(typeof routes[1].distanceMi).toBe('number')
        expect(routes[1].distanceMi).toBeGreaterThan(0)
        expect(routes[1].distanceMi).toBeLessThanOrEqual(AC2_SEED_RADIUS_MI)

        // Nearest-first ordering.
        expect(routes[0].distanceMi).toBeLessThanOrEqual(routes[1].distanceMi)

        // The two in-radius seeded routes are present, correctly ordered by
        // known real-world proximity to AC2_SEED_CENTER.
        expect(routes[0].routeId).toBe(AC2_SEED_ROUTE_ID_NEAR)
        expect(routes[1].routeId).toBe(AC2_SEED_ROUTE_ID_MID)

        // MUST_NOT_OBSERVE (negative controls)
        expect(routes.some((r: any) => r.distanceMi > AC2_SEED_RADIUS_MI)).toBe(false)
        expect(routes.some((r: any) => r.routeId === AC2_SEED_ROUTE_ID_FAR_EXCLUDED)).toBe(false)
        expect(routes.some((r: any) => r.distanceMi === undefined)).toBe(false)
      },
      REAL_SERVICE_TIMEOUT_MS,
    )
  })

  // ---------------------------------------------------------------------
  // AC-3 — errors-as-data: missing center + unresolvable place, real services
  // ---------------------------------------------------------------------
  it(
    'tools return errors-as-data typed values',
    async () => {
      // CASE 1 — searchCuratedRoutes with center omitted
      const missingCenterResult: any = await searchCuratedRoutes.execute({
        radiusMi: 30,
      } as any)

      expect(missingCenterResult.ok).toBe(false)
      expect(missingCenterResult.errorCode).toBe('center_required')
      expect(typeof missingCenterResult.message).toBe('string')
      expect(missingCenterResult.message.length).toBeGreaterThanOrEqual(1)
      // MUST_NOT_OBSERVE
      expect(missingCenterResult.ok).not.toBe(true)

      // CASE 2 — geocodePlace on an unresolvable place, against the real geocoder
      const unresolvableResult: any = await geocodePlace.execute({
        place: 'zzzq not a real place 00000',
      })

      expect(unresolvableResult.ok).toBe(false)
      expect(['not_found', 'geocode_failed']).toContain(unresolvableResult.errorCode)
      expect(typeof unresolvableResult.errorCode).toBe('string')
      expect(unresolvableResult.errorCode.length).toBeGreaterThanOrEqual(1)
      // MUST_NOT_OBSERVE
      expect(unresolvableResult.ok).not.toBe(true)
    },
    REAL_SERVICE_TIMEOUT_MS,
  )

  // ---------------------------------------------------------------------
  // AC-4 — discriminated-union schema shape (pure Zod, zero I/O)
  // ---------------------------------------------------------------------
  it('tool schemas are discriminated unions with real teeth', () => {
    const okWithRoutes = {
      ok: true,
      routes: [{ routeId: 'r', name: 'n', distanceMi: 5, score: 80, riderReady: true }],
    }
    const errWithCode = { ok: false, errorCode: 'center_required', message: 'm' }

    // MUST_OBSERVE
    expect(searchCuratedRoutesOutputSchema.safeParse(okWithRoutes).success).toBe(true)
    expect(searchCuratedRoutesOutputSchema.safeParse(errWithCode).success).toBe(true)
    expect(searchCuratedRoutesOutputSchema.safeParse({ ok: true }).success).toBe(false)
    expect(geocodePlaceInputSchema.safeParse({ place: '' }).success).toBe(false)

    // MUST_NOT_OBSERVE (negative controls)
    expect(searchCuratedRoutesOutputSchema.safeParse({ arbitrary: 'shape' }).success).toBe(false)
    expect(
      searchCuratedRoutesOutputSchema.safeParse({
        ok: true,
        routes: [{ routeId: 'r', name: 'n' /* distanceMi/score/riderReady omitted */ }],
      }).success,
    ).toBe(false)
  })
})
