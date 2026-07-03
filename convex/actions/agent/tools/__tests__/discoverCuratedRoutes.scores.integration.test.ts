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
import { describe, expect, it, vi } from 'vitest'
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
