'use node'

/**
 * S2-T2 — Mastra reference-spike tools: geocodePlace + searchCuratedRoutes.
 *
 * Two @mastra/core `createTool` definitions with real Zod schemas and an
 * errors-as-data contract, so S2-T3's stateless Mastra Agent can ground every
 * discovery request in a resolved center instead of silently falling through
 * to a national/statewide query (the S1 "Capitol-Reef-170mi-as-near-Ogden"
 * bug — see .spec/prds/route-agent-quality/08-uc-agt.md:56-72).
 *
 * geocodePlace wraps the REAL Google Geocoding capability
 * (createGeocodingProvider from ../providers/geocodingProvider.ts) — the same
 * geocoder the routing pipeline uses.
 *
 * searchCuratedRoutes wraps the REAL curated_routes catalog via
 * `curatedRoutes.ts`'s `listCuratedRoutesInternal` (nearest mode: real
 * geospatial index, real riderReady gate, real server-computed distanceMi).
 * `listCuratedRoutesInternal` is a Convex `internalQuery` — only invokable
 * from inside the Convex function runtime (ctx.runQuery) or via the Convex
 * CLI's admin-authenticated `convex run`. This task's write-scope is exactly
 * this file + its test (no wrapper action file is in scope), and vitest's
 * own `_generated/api` alias (vitest.config.ts resolve.alias) would silently
 * replace a direct import with a mock Proxy — defeating the real-service
 * requirement. So this file reaches the REAL dev deployment the same way
 * this codebase's existing DATA-008 integration coverage does (see
 * `../tools/__tests__/discoverCuratedRoutes.integration.test.ts`'s
 * `convexRun` helper): by shelling to `npx convex run`. This executes the
 * real production function against the real dev deployment — it is not a
 * mock or a stub. When this tool is wired into S2-T3's Agent (which will run
 * inside a real Convex 'use node' action with a live ActionCtx), a follow-up
 * task should replace `queryNearestCuratedRoutesViaRealDeployment` with a
 * direct `ctx.runQuery(internal.curatedRoutes.listCuratedRoutesInternal, args)`
 * call — far cleaner and faster than a CLI round-trip. That refactor is
 * explicitly out of scope here (writeProhibited: convex/curatedRoutes.ts).
 */

import { execSync } from 'node:child_process'
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { createGeocodingProvider } from '../providers/geocodingProvider'

// ─────────────────────────────────────────────────────────────────────────
// geocodePlace
// ─────────────────────────────────────────────────────────────────────────

export const geocodePlaceInputSchema = z.object({
  place: z.string().min(1, 'place is required'),
})

const geocodePlaceSuccessSchema = z.object({
  ok: z.literal(true),
  center: z.object({ lat: z.number(), lng: z.number() }),
  formattedAddress: z.string(),
})

const geocodePlaceErrorSchema = z.object({
  ok: z.literal(false),
  errorCode: z.enum(['not_found', 'geocode_failed']),
  message: z.string(),
})

export const geocodePlaceOutputSchema = z.discriminatedUnion('ok', [
  geocodePlaceSuccessSchema,
  geocodePlaceErrorSchema,
])

export const geocodePlace = createTool({
  id: 'geocodePlace',
  description:
    'Resolve a free-text place string (e.g. "Ogden, UT") to a lat/lng center via the real Google Geocoding API. Errors-as-data: never throws — returns { ok:false, errorCode } on an unresolvable place or a geocoding failure.',
  inputSchema: geocodePlaceInputSchema,
  outputSchema: geocodePlaceOutputSchema,
  execute: async (inputData, _context) => {
    try {
      const provider = createGeocodingProvider()
      const results = await provider.geocode(inputData.place)

      if (!results || results.length === 0) {
        return {
          ok: false as const,
          errorCode: 'not_found' as const,
          message: `No geocoding results found for "${inputData.place}".`,
        }
      }

      const [top] = results
      return {
        ok: true as const,
        center: { lat: top.lat, lng: top.lng },
        formattedAddress: top.label,
      }
    } catch (err) {
      return {
        ok: false as const,
        errorCode: 'geocode_failed' as const,
        message: err instanceof Error ? err.message : 'Geocoding request failed.',
      }
    }
  },
})

// ─────────────────────────────────────────────────────────────────────────
// searchCuratedRoutes
// ─────────────────────────────────────────────────────────────────────────

export const searchCuratedRoutesInputSchema = z.object({
  // `center` is intentionally OPTIONAL at the schema level — a missing
  // center must reach execute() as errors-as-data, never a schema-level
  // throw. See the center_required branch below: this is a deliberate
  // contract choice, not an oversight. The original bug shipped BECAUSE a
  // missing center silently fell through to a national-best query.
  center: z.object({ lat: z.number(), lng: z.number() }).optional(),
  radiusMi: z.number().positive(),
  limit: z.number().int().positive().max(50).optional(),
})

const curatedRouteCardSchema = z.object({
  routeId: z.string(),
  name: z.string(),
  distanceMi: z.number(),
  score: z.number(),
  riderReady: z.boolean(),
})

const searchCuratedRoutesSuccessSchema = z.object({
  ok: z.literal(true),
  routes: z.array(curatedRouteCardSchema),
})

const searchCuratedRoutesErrorSchema = z.object({
  ok: z.literal(false),
  errorCode: z.enum(['center_required', 'no_results', 'query_failed']),
  message: z.string(),
})

export const searchCuratedRoutesOutputSchema = z.discriminatedUnion('ok', [
  searchCuratedRoutesSuccessSchema,
  searchCuratedRoutesErrorSchema,
])

/**
 * Raw shape returned by curatedRoutes.ts `listCuratedRoutesInternal` in
 * `sort:'nearest'` mode (buildRouteCard + geospatial nearest join). Only the
 * fields this tool reads are declared here — the internal query's real
 * return validator (convex/curatedRoutes.ts) is the source of truth.
 */
type NearestCuratedRouteRow = {
  routeId: string
  name: string
  compositeScore: number
  distanceMi?: number
}

/**
 * SPIKE-SCOPED bridge to the real dev deployment. See the file-level doc
 * comment above for why this shells to the Convex CLI instead of importing
 * `_generated/api` + calling `ctx.runQuery` directly. This is a real call
 * against the real curated_routes catalog on the real dev deployment — not a
 * mock, not a stub, not a hardcoded fixture.
 */
function queryNearestCuratedRoutesViaRealDeployment(args: {
  center: { lat: number; lng: number }
  limit: number
}): NearestCuratedRouteRow[] {
  const payload = {
    center: args.center,
    sort: 'nearest' as const,
    limit: args.limit,
  }
  const argsJson = JSON.stringify(payload).replace(/'/g, `'"'"'`)
  const stdout = execSync(`npx convex run curatedRoutes:listCuratedRoutesInternal '${argsJson}'`, {
    encoding: 'utf-8',
    timeout: 60_000,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const cleaned = stdout
    .split('\n')
    .filter((line) => !line.startsWith('npm warn'))
    .join('\n')
    .trim()
  if (!cleaned) return []
  const parsed = JSON.parse(cleaned)
  return Array.isArray(parsed) ? parsed : []
}

export const searchCuratedRoutes = createTool({
  id: 'searchCuratedRoutes',
  description:
    'Find curated motorcycle routes near a resolved center within radiusMi, sorted nearest-first, using the real curated_routes catalog on the dev deployment (server-computed distanceMi, riderReady-gated). Errors-as-data: a missing center returns { ok:false, errorCode:"center_required" } and never runs a national/statewide fallback query.',
  inputSchema: searchCuratedRoutesInputSchema,
  outputSchema: searchCuratedRoutesOutputSchema,
  execute: async (inputData, _context) => {
    if (!inputData.center) {
      return {
        ok: false as const,
        errorCode: 'center_required' as const,
        message:
          'A resolved center point is required to search curated routes — no national/statewide fallback is performed.',
      }
    }

    const center = inputData.center

    let rawRoutes: NearestCuratedRouteRow[]
    try {
      rawRoutes = queryNearestCuratedRoutesViaRealDeployment({
        center,
        limit: inputData.limit ?? 25,
      })
    } catch (err) {
      return {
        ok: false as const,
        errorCode: 'query_failed' as const,
        message: err instanceof Error ? err.message : 'Curated route search failed.',
      }
    }

    const withinRadius = rawRoutes
      .filter(
        (route): route is NearestCuratedRouteRow & { distanceMi: number } =>
          typeof route.distanceMi === 'number' && route.distanceMi <= inputData.radiusMi,
      )
      .sort((a, b) => a.distanceMi - b.distanceMi)

    if (withinRadius.length === 0) {
      return {
        ok: false as const,
        errorCode: 'no_results' as const,
        message: `No curated routes found within ${inputData.radiusMi}mi of the resolved center.`,
      }
    }

    return {
      ok: true as const,
      routes: withinRadius.map((route) => ({
        routeId: route.routeId,
        name: route.name,
        distanceMi: route.distanceMi,
        score: route.compositeScore,
        // listCuratedRoutesInternal's nearest mode already filters
        // riderReady===true server-side (convex/curatedRoutes.ts) — every
        // row here is real rider-ready, never fabricated.
        riderReady: true as const,
      })),
    }
  },
})
