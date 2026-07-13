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
 * AC-2 NON-DEGENERATE STRATEGY: The real dev catalog has only ONE riderReady
 * route (the Tepusquet Loop). A one-route result is degenerate — the
 * nearest-first ordering assertion (routes[0].distanceMi <= routes[1].distanceMi)
 * never triggers. To exercise the real `result.ok === true` path with >= 2
 * routes at differing distances, this suite temporarily flips `riderReady: true`
 * on TWO existing geospatially-indexed routes near the Tepusquet Loop (Palmer Rd
 * : Sisquoc ~10.7mi away, and Tepusquet Road : Santa Maria ~11.7mi away) via
 * `curationAdmin:upsertCuratedRoutes` (a public mutation) in `beforeAll`, then
 * restores them to `riderReady: false` in `afterAll` — even if the test
 * assertions fail (flipSucceeded guard + try/catch). The full route documents
 * (all schema-required fields) are embedded as constants below, fetched from
 * the real dev deployment via a one-off Convex query.
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

import { execSync } from 'node:child_process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  geocodePlace,
  geocodePlaceInputSchema,
  searchCuratedRoutes,
  searchCuratedRoutesOutputSchema,
} from '../spikeTools'

// Real HTTP (Google Geocoding) + real CLI round-trip (npx convex run) to the
// real dev deployment — generous timeout, this is genuinely a live network call.
const REAL_SERVICE_TIMEOUT_MS = 45_000

// The Tepusquet Loop — the sole riderReady route in the real dev catalog
// (centroidLat 34.95, centroidLng -120.42). Already geospatially indexed.
const TEPUSQUET_LOOP_ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'

// ---------------------------------------------------------------------------
// convexRun helper — shells to `npx convex run` to call a Convex function on
// the real dev deployment. Same pattern as discoverCuratedRoutes.integration.test.ts.
// ---------------------------------------------------------------------------

function convexRun(fnPath: string, args: Record<string, unknown>): unknown {
  const argsJson = JSON.stringify(args).replace(/'/g, "'\"'\"'")
  const cmd = `npx convex run ${fnPath} '${argsJson}'`
  const result = execSync(cmd, {
    encoding: 'utf-8',
    timeout: 120_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const lines = result
    .split('\n')
    .filter((line) => !line.startsWith('npm warn'))
    .join('\n')
    .trim()
  if (!lines) return null
  return JSON.parse(lines)
}

// ---------------------------------------------------------------------------
// AC-2 route fixtures — full required-field documents for two routes near the
// Tepusquet Loop, fetched from the real dev deployment via a one-off Convex
// query. These routes are already geospatially indexed (location field present)
// but have riderReady absent (not false — just not set). The AC-2 test
// temporarily flips riderReady to true via curationAdmin:upsertCuratedRoutes,
// then restores to false in afterAll.
//
// Distances from center (34.96, -120.42) — verified via live deployment query:
//   - Twist of Tepusquet Loop (already riderReady)  →  0.69mi
//   - Palmer Rd : Sisquoc                           → 10.71mi
//   - Tepusquet Road : Santa Maria                  → 11.68mi
//
// All three are within the server's MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20mi
// filter, so a 20mi search from (34.96, -120.42) returns all three — giving
// the >= 2 routes at differing distances AC-2 requires.
//
// Only schema-REQUIRED fields (CURATED_ROUTE_FIELDS in shared/models/curated-routes.ts)
// plus `location` (for geospatial index), `geometryStatus`, and `riderReady`
// (the field we flip) are included. Optional fields not present here are left
// unchanged by ctx.db.patch (the upsert handler patches only provided fields).
// ---------------------------------------------------------------------------

const PALMER_RD_ROUTE = {
  routeId: 'bestbikingroads:palmer-rd-sisquoc',
  name: 'Palmer Rd : Sisquoc',
  state: 'California',
  source: 'bestbikingroads' as const,
  primaryArchetype: 'scenic_byway' as const,
  secondaryTags: [] as string[],
  centroidLat: 34.830658,
  centroidLng: -120.31590179999999,
  boundsNeLat: 34.86215,
  boundsNeLng: -120.29502,
  boundsSwLat: 34.79529,
  boundsSwLng: -120.33264,
  lengthMiles: 6.21,
  compositeScore: 0.6714,
  curvatureScore: 0.6,
  scenicScore: 0.7,
  technicalScore: 0.6,
  trafficScore: 0.7,
  remotenessScore: 0.5,
  oneLiner: '',
  summary:
    'Sweeping turns, rolling hills, great pavement, vineyards and oak woodlands: a short but very nice ride. North end meets Foxen Canyon Rd, another great ride.',
  badges: [] as string[],
  season: 'year_round' as const,
  contentVersion: 1,
  seededAt: 1776372596,
  location: { type: 'Point' as const, coordinates: [-120.31590179999999, 34.830658] },
  geometryStatus: 'generated' as const,
}

const TEPUSQUET_RD_ROUTE = {
  routeId: 'bestbikingroads:tepusquet-road-santa-maria',
  name: 'Tepusquet Road : Santa Maria',
  state: 'California',
  source: 'bestbikingroads' as const,
  primaryArchetype: 'mountain' as const,
  secondaryTags: [] as string[],
  centroidLat: 34.9568264,
  centroidLng: -120.2137104,
  boundsNeLat: 35.01668,
  boundsNeLng: -120.1931,
  boundsSwLat: 34.86298,
  boundsSwLng: -120.25659,
  lengthMiles: 14.91,
  compositeScore: 0.7929,
  curvatureScore: 0.7,
  scenicScore: 0.8,
  technicalScore: 0.7,
  trafficScore: 0.9,
  remotenessScore: 0.5,
  oneLiner: '',
  summary:
    "Notarian nailed it in his description.  My very favorite road in this part of California.  The pavement is remarkably good, and the road snakes up and over and down a low but steep mountain pass.  Great views at the top.  Hit it early in the morning if you have a chance, while it's still quiet.  I'll post a some video taken by a friend on ride we did together.",
  badges: [] as string[],
  season: 'year_round' as const,
  contentVersion: 1,
  seededAt: 1776372596,
  location: { type: 'Point' as const, coordinates: [-120.2137104, 34.9568264] },
  geometryStatus: 'generated' as const,
}

// Routes to flip for AC-2 (riderReady: true) and restore (riderReady: false).
// riderReady: false is functionally equivalent to the original absent state —
// the riderReady === true filter and the by_riderReady_and_composite_score
// index both exclude false the same as absent.
const FLIP_ROUTES = [PALMER_RD_ROUTE, TEPUSQUET_RD_ROUTE]

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
  // AC-2 — searchCuratedRoutes returns >= 2 routes at differing distances,
  // nearest-first, against the real dev deployment.
  //
  // NON-DEGENERATE: temporarily flips riderReady on 2 existing indexed routes
  // (Palmer Rd + Tepusquet Road) near the Tepusquet Loop so the nearest-first
  // ordering assertion exercises >= 2 routes at differing distances. Restores
  // originals in afterAll — even if assertions fail.
  // ---------------------------------------------------------------------
  describe('AC-2: >= 2 routes nearest-first at differing distances', () => {
    // Guard: only restore if the flip actually succeeded. If beforeAll throws
    // before convexRun returns, the routes were never flipped — afterAll skips.
    let flipSucceeded = false

    beforeAll(() => {
      // Flip riderReady → true on both routes so the geospatial nearest query
      // (which filters riderReady === true server-side in curatedRoutes.ts:257)
      // returns them alongside the already-riderReady Tepusquet Loop.
      const result: any = convexRun('curationAdmin:upsertCuratedRoutes', {
        routes: FLIP_ROUTES.map((r) => ({ ...r, riderReady: true })),
      })

      // Mark succeeded BEFORE assertions — afterAll must restore even if
      // these expectations fail (the upsert already wrote to the DB).
      flipSucceeded = true

      expect(result).not.toBeNull()
      expect(result.errors).toHaveLength(0)
      expect(result.updated).toBeGreaterThanOrEqual(2)
    })

    afterAll(() => {
      if (!flipSucceeded) return

      // Restore: set riderReady → false (functionally equivalent to the
      // original absent state — the riderReady === true filter excludes both).
      // Wrapped in try/catch so afterAll never throws and masks test failures.
      // If restore fails, the routes stay riderReady:true (arguably correct
      // — they ARE real motorcycle roads) and the next run will re-flip.
      try {
        convexRun('curationAdmin:upsertCuratedRoutes', {
          routes: FLIP_ROUTES.map((r) => ({ ...r, riderReady: false })),
        })
      } catch {
        // Swallow — see comment above.
      }
    })

    it(
      'returns >= 2 routes with server-computed distanceMi, nearest-first, within radius',
      async () => {
        // Center slightly offset from the Tepusquet Loop centroid (34.95, -120.42)
        // so ALL distances are > 0 (server-computed, not hardcoded zero).
        // 0.01 degrees latitude ≈ 0.69mi north.
        const result: any = await searchCuratedRoutes.execute({
          center: { lat: 34.96, lng: -120.42 },
          radiusMi: 20,
        })

        // MUST_OBSERVE: real success with >= 2 routes — NOT the degenerate
        // one-route or no_results escape. A stub returning {ok:false} or a
        // single fabricated route CANNOT pass this.
        expect(result.ok).toBe(true)
        expect(Array.isArray(result.routes)).toBe(true)
        expect(result.routes.length).toBeGreaterThanOrEqual(2)

        // Server-computed distanceMi — real number, > 0 (center is offset
        // from all route centroids, so no route is at distance 0).
        expect(typeof result.routes[0].distanceMi).toBe('number')
        expect(result.routes[0].distanceMi).toBeGreaterThan(0)

        // Nearest-first ordering — STRICT less-than proves differing distances
        // (not a tie, not a stub returning identical values).
        expect(result.routes[0].distanceMi).toBeLessThan(result.routes[1].distanceMi)

        // Full non-decreasing check across all returned routes
        for (let i = 1; i < result.routes.length; i++) {
          expect(result.routes[i - 1].distanceMi).toBeLessThanOrEqual(result.routes[i].distanceMi)
        }

        // All within radius
        for (const route of result.routes) {
          expect(route.distanceMi).toBeLessThanOrEqual(20)
        }

        // The Tepusquet Loop (nearest to center) MUST be in the results —
        // proves the query hit the real geospatial index, not a stub.
        const routeIds = result.routes.map((r: any) => r.routeId)
        expect(routeIds).toContain(TEPUSQUET_LOOP_ROUTE_ID)

        // MUST_NOT_OBSERVE (negative controls)
        expect(result.ok).not.toBe(false)
        expect(result.routes.some((r: any) => r.distanceMi > 20)).toBe(false)
        expect(result.routes.some((r: any) => r.distanceMi === undefined)).toBe(false)
      },
      REAL_SERVICE_TIMEOUT_MS,
    )

    it(
      'returns no_results for a far center (no fabrication)',
      async () => {
        // Center far from ANY route (>20mi server filter) — the server's
        // MAX_NEAREST_CURATED_ROUTE_DISTANCE_MI=20mi filter
        // (convex/curatedRoutes.ts:130,265) removes every route, so the tool
        // returns no_results — proving it does NOT fabricate results.
        const result: any = await searchCuratedRoutes.execute({
          center: { lat: 5.0, lng: -155.0 },
          radiusMi: 20,
        })

        expect(result.ok).toBe(false)
        expect(result.errorCode).toBe('no_results')
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
