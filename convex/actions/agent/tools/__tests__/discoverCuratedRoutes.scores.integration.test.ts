/**
 * REDHAT-FIX-001 / DATA-008b — Integration tests for discoverCuratedRoutes
 * score correctness AND distanceMi guarding.
 *
 * AC-1 (optionCarriesRealNonZeroScores): LIVE Convex discovery drives
 *   runDiscoverCuratedRoutes, loads the created route_plans option, and
 *   asserts option.scores.composite > 0 AND equals the route's real flat
 *   compositeScore, plus ≥1 dimension score > 0 matching the real flat
 *   *Score. This is the non-fakeable gate proving the score mapping reads
 *   the flat listCuratedRoutes fields (not route.score / route.scores.*).
 *
 * AC-2 (distanceGuardedToNearestSort):
 *   - best-sort (LIVE): options carry distanceMeters === undefined (the
 *     DATA-008b fix at discoverCuratedRoutes.ts:151 — no fabricated real 0).
 *   - nearest-sort (in-process mock ctx): options carry distanceMeters > 0
 *     derived from a real distanceMi.
 *
 * Live seam: runLiveDiscoverySmoke (internalAction) shells through
 * `npx convex run` to execute the real discovery against dev data, then we
 * read the created route_plans row + the underlying flat scores through the
 * real internal queries (getPlanByIdInternal, listCuratedRoutesInternal).
 *
 * Reference: .spec/prds/mvp/tasks/sprint-01-discovery-on-the-route-plan-view/REDHAT-FIX-001-data-008b-distance-meters-bug-and-scores-integration-test.md
 */

import { execSync } from 'node:child_process'
import type { ToolCall } from '@mariozechner/pi-ai'
import { afterAll, describe, expect, it, vi } from 'vitest'
import type { AgentContext } from '../../ridePlanningAgent'
import { executeDiscoverCuratedRoutes } from '../discoverCuratedRoutes'

// ---------------------------------------------------------------------------
// Live Convex invocation helper (shells through `npx convex run`).
// Copied from the DATA-008 sibling test — the determinism seam for engine
// outcome assertions against the real dev deployment.
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
// In-process mock ctx for the nearest-sort distance test (AC-2 case 2).
// Mirrors the buildMockCtx shape from the DATA-008 sibling test but trimmed
// to just what the nearest-sort distance assertion needs.
// ---------------------------------------------------------------------------

const MOCK_PLANNING_SESSION_ID = 'planning_sessions:redhat-001' as any
const MOCK_ROUTE_PLAN_ID = 'route_plans:redhatfix001mockplan' as any

type CapturedMutation = { name: string; args: any }

/**
 * A nearest-sort fixture: routes that carry a REAL distanceMi (the contract
 * listCuratedRoutes returns for sort='nearest'). distanceMi=50 → the builder
 * must compute distanceMeters = 50 * 1609.344 = 80467.2 (> 0).
 */
const FIXTURE_NEAREST_ROUTES = [
  {
    routeId: 'nc-nearest-001',
    name: 'Nearest Test Route',
    state: 'North Carolina',
    primaryArchetype: 'scenic',
    centroidLat: 35.5,
    centroidLng: -82.0,
    compositeScore: 0.6,
    curvatureScore: 0.5,
    scenicScore: 0.7,
    technicalScore: 0.4,
    trafficScore: 0.3,
    remotenessScore: 0.5,
    lengthMiles: 50,
    distanceMi: 50, // real nearest-sort distance
    summary: 'A real nearest-sort route with a distance.',
    geometryStatus: 'generated',
  },
]

function buildNearestMockCtx(): { ctx: AgentContext; mutations: CapturedMutation[] } {
  const mutations: CapturedMutation[] = []

  const identify = (args: any): string => {
    if (!args || typeof args !== 'object') return 'unknown'
    if ('routeIds' in args) return 'curatedGeometry.getGeometryForRoutes'
    if ('planInput' in args) return 'routePlans.createForAgentInternal'
    if ('status' in args && 'result' in args) return 'routePlans.updatePlanStatus'
    if ('sort' in args && 'limit' in args) return 'curatedRoutes.listCuratedRoutes'
    if ('clerkUserId' in args && !('planningSessionId' in args)) {
      return 'planUsage.checkUsageInternal'
    }
    return 'unknown'
  }

  const ctx: AgentContext = {
    planningSessionId: MOCK_PLANNING_SESSION_ID,
    clerkUserId: 'user_redhat_001',
    piMessages: [],
    runQuery: vi.fn(async (_ref: any, args: any) => {
      const name = identify(args)
      if (name === 'planUsage.checkUsageInternal') return { allowed: true, limit: 100 }
      if (name === 'curatedRoutes.listCuratedRoutes') return FIXTURE_NEAREST_ROUTES
      if (name === 'curatedGeometry.getGeometryForRoutes') return []
      return undefined
    }) as any,
    runMutation: vi.fn(async (_ref: any, args: any) => {
      const name = identify(args)
      mutations.push({ name, args })
      if (name === 'routePlans.createForAgentInternal') return { routePlanId: MOCK_ROUTE_PLAN_ID }
      if (name === 'routePlans.updatePlanStatus') {
        return { routePlanId: args?.routePlanId ?? MOCK_ROUTE_PLAN_ID }
      }
      return undefined
    }) as any,
    runAction: vi.fn(async () => undefined) as any,
  }

  return { ctx, mutations }
}

function buildDiscoveryToolCall(intent: Record<string, unknown>): ToolCall {
  return {
    type: 'toolCall',
    id: `redhat-001-${Date.now()}`,
    name: 'discoverCuratedRoutes',
    arguments: { intent },
  } as unknown as ToolCall
}

// ---------------------------------------------------------------------------
// REDHAT-FIX-005 AC-4 / M-2: route_plans test-row cleanup.
//
// Every test in this file creates real route_plans rows on the live Convex
// dev deployment (via runLiveDiscoverySmoke) using clerkUserId values that
// share one of the prefixes below. The previous test had NO afterEach/all
// cleanup — rows accumulated on dev across runs (M-2 finding). This afterAll
// hook deletes every row whose clerkUserId starts with a test prefix so dev
// does not accumulate red-hat test artifacts.
//
// The delete mutation is INTERNAL and scoped to the clerkUserId prefix — it
// can never touch production data (real Clerk user IDs never start with
// `redhat-001-` or `redhat-005-`).
// ---------------------------------------------------------------------------

const TEST_CLERK_USER_ID_PREFIXES = ['redhat-001-', 'redhat-005-']

afterAll(() => {
  // Best-effort cleanup. If a delete fails (e.g. transient Convex error), we
  // intentionally swallow it rather than mask a real test failure with
  // cleanup noise — the NEXT run's prefix-matched delete will reap any stale
  // rows left behind, so dev never accumulates unbounded red-hat artifacts.
  for (const prefix of TEST_CLERK_USER_ID_PREFIXES) {
    try {
      convexRun('db/routePlans:deleteByClerkUserIdPrefixInternal', {
        clerkUserIdPrefix: prefix,
      })
    } catch {
      // swallow — see comment above
    }
  }
})

// ---------------------------------------------------------------------------
// AC-1: discovery option carries the route's real non-zero composite + dimension scores (LIVE)
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-001 AC-1: optionCarriesRealNonZeroScores', () => {
  it('live discovery option[0].scores.composite > 0 and matches the route real flat compositeScore, with >=1 non-zero dimension', () => {
    const clerkUserId = `redhat-001-ac1-${Date.now()}`

    // 1. Drive the real discovery action (best-sort) → creates a route_plans row.
    const smoke = convexRun(
      'actions/agent/tools/discoverCuratedRoutesLiveTest:runLiveDiscoverySmoke',
      {
        clerkUserId,
        archetypes: ['scenic'],
        state: 'North Carolina',
        limit: 5,
      },
    ) as {
      type: string
      routePlanId?: string
      status?: string
      optionsCount: number
      optionIds: string[]
    }

    expect(smoke.type).toBe('routes')
    expect(smoke.optionsCount).toBeGreaterThan(0)
    expect(typeof smoke.routePlanId).toBe('string')

    // 2. Read the full route_plans row (options include scores + stats).
    const plan = convexRun('db/routePlans:getPlanByIdInternal', {
      routePlanId: smoke.routePlanId!,
    }) as {
      status: string
      result?: { options?: Array<Record<string, unknown>> }
    }
    expect(plan.status).toBe('completed')
    const options = (plan.result?.options as Array<Record<string, any>>) ?? []
    expect(options.length).toBeGreaterThan(0)
    const firstOption = options[0]
    const firstRouteOptionId = firstOption.routeOptionId as string

    // 3. Read the real flat scores the discovery queried (best-sort, same intent)
    //    and match the underlying route by routeId. This is the contract the
    //    option builder reads (flat compositeScore / *Score, never route.score).
    const routes = convexRun('curatedRoutes:listCuratedRoutesInternal', {
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'best',
      limit: 5,
    }) as Array<Record<string, any>>
    expect(routes.length).toBeGreaterThan(0)

    const matchedRoute = routes.find((r) => `curated-${r.routeId}` === firstRouteOptionId)
    expect(matchedRoute, `underlying route for ${firstRouteOptionId} must exist`).toBeDefined()

    const realComposite = matchedRoute!.compositeScore as number
    const optionComposite = (firstOption.scores as any).composite as number

    // THEN: composite is a real non-zero value (> 0), not the degenerate 0.
    expect(realComposite).toBeGreaterThan(0)
    expect(optionComposite).toBeGreaterThan(0)

    // THEN: the option's composite equals the route's real flat compositeScore
    //       (proves the builder reads compositeScore, not route.score → undefined → 0).
    expect(optionComposite).toBeCloseTo(realComposite, 5)

    // THEN: ≥1 dimension score > 0 and matches the route's real flat *Score.
    //       The option maps catalog flat fields onto dimension keys:
    //         scenery←scenicScore, curvature←curvatureScore, elevation←technicalScore,
    //         traffic←trafficScore, pavement←remotenessScore
    const dims = (firstOption.scores as any).dimensions as Record<string, number>
    const dimensionToFlatScore: Array<[string, keyof typeof matchedRoute]> = [
      ['scenery', 'scenicScore'],
      ['curvature', 'curvatureScore'],
      ['elevation', 'technicalScore'],
      ['traffic', 'trafficScore'],
      ['pavement', 'remotenessScore'],
    ]

    const matchedNonZeroDimensions = dimensionToFlatScore.filter(([dimKey, flatKey]) => {
      const realVal = matchedRoute![flatKey] as number | undefined
      const optionVal = dims[dimKey]
      return (
        typeof realVal === 'number' &&
        realVal > 0 &&
        typeof optionVal === 'number' &&
        Math.abs(optionVal - realVal) < 1e-9
      )
    })
    expect(
      matchedNonZeroDimensions.length,
      'at least one dimension must equal the route real flat *Score and be > 0',
    ).toBeGreaterThanOrEqual(1)

    // Negative control: composite is NOT the degenerate 0 (would happen if the
    // builder read route.score → undefined → ?? 0).
    expect(optionComposite).not.toBe(0)
  }, 180_000)
})

// ---------------------------------------------------------------------------
// AC-2: distanceMeters guarded — best-sort → undefined, nearest-sort → > 0
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-001 AC-2: distanceGuardedToNearestSort', () => {
  it('best-sort (LIVE): option[0].stats.distanceMeters === undefined (no fabricated 0)', () => {
    const clerkUserId = `redhat-001-ac2-best-${Date.now()}`

    // Drive the real best-sort discovery (distanceMi is unpopulated for best-sort).
    const smoke = convexRun(
      'actions/agent/tools/discoverCuratedRoutesLiveTest:runLiveDiscoverySmoke',
      {
        clerkUserId,
        archetypes: ['scenic'],
        state: 'North Carolina',
        limit: 5,
      },
    ) as {
      type: string
      routePlanId?: string
      optionsCount: number
    }
    expect(smoke.type).toBe('routes')
    expect(smoke.optionsCount).toBeGreaterThan(0)
    expect(typeof smoke.routePlanId).toBe('string')

    // Read the full option stats.
    const plan = convexRun('db/routePlans:getPlanByIdInternal', {
      routePlanId: smoke.routePlanId!,
    }) as {
      result?: { options?: Array<Record<string, any>> }
    }
    const options = plan.result?.options ?? []
    expect(options.length).toBeGreaterThan(0)
    const firstStats = options[0].stats as Record<string, unknown>

    // THEN: best-sort options carry distanceMeters === undefined (the fix at
    //       line 151). When distanceMi is absent, distanceMeters is set to
    //       undefined in the builder; Convex's JSON serialization drops the
    //       key entirely, so the persisted row has NO distanceMeters (access
    //       yields undefined) — never the fabricated real 0 from the pre-fix
    //       `(route.distanceMi || 0) * 1609.344` path.
    expect(firstStats.distanceMeters).toBeUndefined()

    // Negative control: must NOT be a fabricated real 0.
    expect(firstStats.distanceMeters).not.toBe(0)
  }, 180_000)

  it('nearest-sort (in-process mock): option[0].stats.distanceMeters > 0 derived from distanceMi', async () => {
    // GIVEN: a fixtured nearest-sort intent + a fixture route carrying a real
    //        distanceMi (the nearest-sort contract from listCuratedRoutes).
    const intent = {
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'nearest' as const,
      center: { lat: 35.5, lng: -82.0 },
      limit: 5,
    }
    const { ctx, mutations } = buildNearestMockCtx()

    // WHEN: the discovery tool runs against the mock ctx.
    const result = await executeDiscoverCuratedRoutes(ctx, buildDiscoveryToolCall(intent))
    expect(result.type).toBe('routes')

    // THEN: the persisted option's distanceMeters is a positive real number
    //       derived from distanceMi (50 mi → 50 * 1609.344 = 80467.2).
    const updateCall = mutations.find((m) => m.name === 'routePlans.updatePlanStatus')
    expect(updateCall, 'route_plans updatePlanStatus mutation must fire').toBeDefined()
    const options = updateCall!.args.result?.options
    expect(Array.isArray(options)).toBe(true)
    expect(options.length).toBeGreaterThan(0)
    const firstStats = options[0].stats
    expect(firstStats.distanceMeters).toBe(50 * 1609.344)
    expect(firstStats.distanceMeters).toBeGreaterThan(0)

    // Negative controls: must NOT be undefined (nearest-sort has a real distance),
    //                    must NOT be a fabricated 0.
    expect(firstStats.distanceMeters).not.toBeUndefined()
    expect(firstStats.distanceMeters).not.toBe(0)
  })
})

// ---------------------------------------------------------------------------
// REDHAT-FIX-005 AC-1 (PRIMARY): curated options omit durationSeconds and
// legsCount (undefined, never fabricated 0). Mirrors the REDHAT-FIX-001
// distanceMeters guard pattern — when curated routes carry no duration/legs
// data, the option must OMIT those stats rather than fabricate a real 0.
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-005 AC-1: omitCuratedStatsFabricatedZeros', () => {
  it('best-sort (LIVE): option[0].stats.durationSeconds === undefined and legsCount === undefined (no fabricated 0)', () => {
    const clerkUserId = `redhat-005-ac1-${Date.now()}`

    // Drive the real best-sort discovery → creates a route_plans row whose
    // options carry the stats block built at discoverCuratedRoutes.ts:150-157.
    const smoke = convexRun(
      'actions/agent/tools/discoverCuratedRoutesLiveTest:runLiveDiscoverySmoke',
      {
        clerkUserId,
        archetypes: ['scenic'],
        state: 'North Carolina',
        limit: 5,
      },
    ) as {
      type: string
      routePlanId?: string
      optionsCount: number
    }
    expect(smoke.type).toBe('routes')
    expect(smoke.optionsCount).toBeGreaterThan(0)
    expect(typeof smoke.routePlanId).toBe('string')

    // Read the full option stats from the persisted route_plans row.
    const plan = convexRun('db/routePlans:getPlanByIdInternal', {
      routePlanId: smoke.routePlanId!,
    }) as {
      result?: { options?: Array<Record<string, any>> }
    }
    const options = plan.result?.options ?? []
    expect(options.length).toBeGreaterThan(0)
    const firstStats = options[0].stats as Record<string, unknown>

    // THEN: curated options OMIT durationSeconds and legsCount (undefined).
    //       Curated routes carry no duration/legs data, so the option must
    //       not present a misleading real 0 (the same anti-pattern as the
    //       original CRITICAL distanceMeters: 0 bug from REDHAT-FIX-001).
    //       Convex JSON serialization drops undefined keys entirely, so
    //       accessing the absent key yields undefined.
    expect(firstStats.durationSeconds).toBeUndefined()
    expect(firstStats.legsCount).toBeUndefined()

    // Negative control: must NOT be a fabricated real 0 (the pre-fix signature).
    expect(firstStats.durationSeconds).not.toBe(0)
    expect(firstStats.legsCount).not.toBe(0)
  }, 180_000)
})

// ---------------------------------------------------------------------------
// REDHAT-FIX-005 AC-2: best-sort without a center uses the first route
// centroid, not {0,0}; nearest-sort with a center is unchanged.
// ---------------------------------------------------------------------------

describe('REDHAT-FIX-005 AC-2: centerPointFallsBackToRouteCentroid', () => {
  it('best-sort (LIVE, no center): planInput.start uses the first route centroid, NOT {0,0}', () => {
    const clerkUserId = `redhat-005-ac2-best-${Date.now()}`

    // Drive the real best-sort discovery with NO center → discoverCuratedRoutes
    // must fall back to the first returned route's centroid (a real coordinate)
    // instead of the Atlantic-Ocean sentinel {lat:0,lng:0} for planInput.start/end.
    const smoke = convexRun(
      'actions/agent/tools/discoverCuratedRoutesLiveTest:runLiveDiscoverySmoke',
      {
        clerkUserId,
        archetypes: ['scenic'],
        state: 'North Carolina',
        limit: 5,
      },
    ) as {
      type: string
      routePlanId?: string
      optionsCount: number
    }
    expect(smoke.type).toBe('routes')
    expect(smoke.optionsCount).toBeGreaterThan(0)
    expect(typeof smoke.routePlanId).toBe('string')

    // Read the persisted route_plans row to inspect planInput.
    const plan = convexRun('db/routePlans:getPlanByIdInternal', {
      routePlanId: smoke.routePlanId!,
    }) as {
      planInput?: {
        start: { lat: number; lng: number; label?: string }
        end: { lat: number; lng: number; label?: string }
      }
      result?: { options?: Array<Record<string, any>> }
    }

    // Look up the first returned route's real centroid (the value the fallback
    // should mirror) via the same internal query the discovery action used.
    const routes = convexRun('curatedRoutes:listCuratedRoutesInternal', {
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'best',
      limit: 5,
    }) as Array<Record<string, any>>
    expect(routes.length).toBeGreaterThan(0)
    const firstRoute = routes[0]
    const expectedLat = firstRoute.centroidLat as number
    const expectedLng = firstRoute.centroidLng as number

    // THEN: best-sort planInput.start/end equal the first route's centroid.
    expect(plan.planInput).toBeDefined()
    expect(plan.planInput!.start.lat).toBeCloseTo(expectedLat, 5)
    expect(plan.planInput!.start.lng).toBeCloseTo(expectedLng, 5)
    expect(plan.planInput!.end.lat).toBeCloseTo(expectedLat, 5)
    expect(plan.planInput!.end.lng).toBeCloseTo(expectedLng, 5)

    // Negative control: must NOT be the Atlantic-Ocean sentinel {0,0}.
    expect(plan.planInput!.start.lat).not.toBe(0)
    expect(plan.planInput!.start.lng).not.toBe(0)
    expect(plan.planInput!.end.lat).not.toBe(0)
    expect(plan.planInput!.end.lng).not.toBe(0)
  }, 180_000)

  it('nearest-sort (in-process mock, with center): planInput.start uses the supplied center, unchanged', async () => {
    // GIVEN: a nearest-sort intent that supplies a real center.
    const intent = {
      archetypes: ['scenic'],
      state: 'North Carolina',
      sort: 'nearest' as const,
      center: { lat: 35.5, lng: -82.0 },
      limit: 5,
    }
    const { ctx, mutations } = buildNearestMockCtx()

    // WHEN: the discovery tool runs against the mock ctx.
    const result = await executeDiscoverCuratedRoutes(ctx, buildDiscoveryToolCall(intent))
    expect(result.type).toBe('routes')

    // THEN: the persisted planInput.start/end equal the SUPPLIED center
    //       (the route-centroid fallback must NOT overwrite a real center).
    const createCall = mutations.find((m) => m.name === 'routePlans.createForAgentInternal')
    expect(createCall, 'route_plans createForAgentInternal mutation must fire').toBeDefined()
    const planInput = createCall!.args.planInput
    expect(planInput.start.lat).toBe(35.5)
    expect(planInput.start.lng).toBe(-82.0)
    expect(planInput.end.lat).toBe(35.5)
    expect(planInput.end.lng).toBe(-82.0)
  })
})
