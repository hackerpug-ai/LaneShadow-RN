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

import { describe, expect, it } from 'vitest'
import {
  geocodePlace,
  geocodePlaceInputSchema,
  searchCuratedRoutes,
  searchCuratedRoutesOutputSchema,
} from '../spikeTools'

// Real HTTP (Google Geocoding) + real CLI round-trip (npx convex run) to the
// real dev deployment — generous timeout, this is genuinely a live network call.
const REAL_SERVICE_TIMEOUT_MS = 45_000

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
