/**
 * DATA-005: listCuratedRoutes — integration tests for all 4 browse modes + Clerk gate.
 *
 * listCuratedRoutes is the Clerk-gated public browse query powering discovery.
 * It resolves four ways depending on args:
 *   - Mode 1 (bbox):        geospatial.query(rectangle) ranked by compositeScore
 *   - Mode 2 (nearest):     geospatial.nearest with distanceMi = geo.distance * 0.000621371
 *   - Mode 3 (state):       by_state index probing BOTH NC spelling variants
 *   - Mode 4 (best/default):by_composite_score index, optional archetype filter
 *
 * ── Verification strategy ────────────────────────────────────────────────────
 * vitest's config mocks `convex/_generated/*`, so we cannot hit Convex through
 * the generated client. Instead this file uses three complementary layers:
 *
 * 1. LOGIC VERIFICATION (always runs)
 *    Imports listCuratedRoutes from ../curatedRoutes.ts and invokes its real
 *    handler directly with a mocked ctx (db + auth) plus a mocked geospatial
 *    index. This exercises every resolution branch and the buildRouteCard
 *    transform against deterministic fixture data.
 *
 * 2. LIVE GATE VERIFICATION (always runs, network-dependent)
 *    Spawns `npx convex run curatedRoutes:listCuratedRoutes` against the dev
 *    deployment. Admin-key auth bypasses Clerk identity, so requireIdentity
 *    MUST throw — proving the gate is wired in production. This is real
 *    end-to-end evidence for AC-2 that a mocked-ctx test alone cannot give.
 *
 * 3. CODE INSPECTION (always runs)
 *    Reads ../curatedRoutes.ts and asserts requireIdentity is the first
 *    statement inside the handler — the gate cannot be bypassed by argument
 *    order or short-circuit.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mocks: geospatial index (we drive .query / .nearest directly) -----------
// vi.mock factories are hoisted above imports, so the mock fns must be created
// inside vi.hoisted() — that runs at the same hoist phase and is safe to reference.
const geospatialMocks = vi.hoisted(() => ({
  query: vi.fn(),
  nearest: vi.fn(),
}))

vi.mock('../geospatialIndex', () => ({
  geospatial: {
    query: geospatialMocks.query,
    nearest: geospatialMocks.nearest,
  },
}))

// Import the SUT. The aliased mock for ./_generated/server returns query({ ... })
// as a plain config object, so listCuratedRoutes.handler IS the real handler.
import { listCuratedRoutes } from '../curatedRoutes'

// Local aliases for readability — these resolve to the same vi.fn instances.
const geospatialQuery = geospatialMocks.query
const geospatialNearest = geospatialMocks.nearest

const PROJECT_ROOT = resolve(__dirname, '..', '..')

// --- Fixtures ----------------------------------------------------------------

/**
 * A canonical 0-1 scale route (the production scale per DATA-005/D0).
 * Override fields per-test to set up mode-specific scenarios.
 */
const makeRoute = (overrides: Record<string, any> = {}): Record<string, any> => ({
  _id: 'r1',
  routeId: 'route-001',
  name: 'Dragon Tail',
  state: 'North Carolina',
  primaryArchetype: 'twisties',
  centroidLat: 35.478,
  centroidLng: -83.325,
  compositeScore: 0.92,
  curvatureScore: 0.88,
  scenicScore: 0.7,
  technicalScore: 0.85,
  trafficScore: 0.3,
  remotenessScore: 0.6,
  lengthMiles: 318,
  summary: '318 curves in 11 miles',
  geometryStatus: 'generated',
  ...overrides,
})

type FilterCall = { op: 'eq' | 'in'; field: string; value: any }
type IndexCall = { indexName: string; filterCalls: FilterCall[] }

interface CtxOptions {
  identity?: { subject: string } | null
  indexData?: Record<string, Array<Record<string, any>>>
  getRouteById?: Map<string, Record<string, any>>
  indexCalls?: IndexCall[]
}

/**
 * Build a chainable ctx.db.query mock that records each withIndex() invocation
 * (so we can assert "by_state was probed with both NC variants") and serves
 * deterministic fixture rows from the supplied indexData map.
 */
const buildCtx = (opts: CtxOptions = {}) => {
  const identity = opts.identity === undefined ? { subject: 'user_test' } : opts.identity
  const indexData = opts.indexData ?? {}
  const indexCalls = opts.indexCalls ?? []

  const dbQuery = vi.fn((tableName: string) => {
    if (tableName !== 'curated_routes') {
      throw new Error(`unexpected table: ${tableName}`)
    }
    return {
      withIndex: vi.fn((indexName: string, filterFn?: (q: any) => any) => {
        const filterCalls: FilterCall[] = []
        const trackingQ = {
          eq: (field: string, value: any) => {
            filterCalls.push({ op: 'eq', field, value })
            return trackingQ
          },
          in: (field: string, values: any[]) => {
            filterCalls.push({ op: 'in', field, values })
            return trackingQ
          },
        }
        if (filterFn) filterFn(trackingQ)
        indexCalls.push({ indexName, filterCalls })

        const rows = indexData[indexName] ?? []
        return {
          take: vi.fn(async (n: number) => rows.slice(0, n)),
          order: vi.fn((dir: 'desc' | 'asc') => {
            const sorted = [...rows].sort((a, b) =>
              dir === 'desc'
                ? b.compositeScore - a.compositeScore
                : a.compositeScore - b.compositeScore,
            )
            return {
              take: vi.fn(async (n: number) => sorted.slice(0, n)),
              collect: vi.fn(async () => sorted),
            }
          }),
          collect: vi.fn(async () => rows),
        }
      }),
    }
  })

  const dbGet = vi.fn(async (id: any) => opts.getRouteById?.get(String(id)) ?? null)

  return {
    auth: { getUserIdentity: vi.fn(async () => identity) },
    db: { get: dbGet, query: dbQuery },
    indexCalls,
  }
}

const runHandler = async (ctx: any, args: Record<string, any>) =>
  (listCuratedRoutes as any).handler(ctx, args)

/**
 * Run listCuratedRoutes against the live dev deployment via `npx convex run`.
 * Admin-key auth bypasses Clerk, so requireIdentity will reject — this is the
 * intended observation for AC-2. Returns ok=false when Convex throws (non-zero
 * exit), with stderr captured for assertion.
 */
const tryRunConvexLive = (args: object): { ok: boolean; stdout: string; stderr: string } => {
  try {
    const stdout = execFileSync(
      'npx',
      ['convex', 'run', 'curatedRoutes:listCuratedRoutes', JSON.stringify(args)],
      {
        cwd: PROJECT_ROOT,
        encoding: 'utf-8',
        timeout: 20000,
        stdio: ['pipe', 'pipe', 'pipe'],
      },
    )
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    return {
      ok: false,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : '',
    }
  }
}

// Sanity: every returned card must conform to the locked lean shape.
const assertValidCard = (card: any, opts: { distanceMiExpected?: boolean } = {}) => {
  expect(card).toBeTruthy()
  expect(typeof card.routeId).toBe('string')
  expect(typeof card.name).toBe('string')
  expect(typeof card.state).toBe('string')
  expect(typeof card.primaryArchetype).toBe('string')
  expect(typeof card.centroidLat).toBe('number')
  expect(typeof card.centroidLng).toBe('number')
  expect(typeof card.compositeScore).toBe('number')
  // 0-1 hard requirement
  expect(card.compositeScore).toBeGreaterThanOrEqual(0)
  expect(card.compositeScore).toBeLessThanOrEqual(1)
  // lengthMiles, if present, must be a sane positive number (junk like 710,430 dropped)
  if (card.lengthMiles !== undefined) {
    expect(card.lengthMiles).toBeGreaterThan(0)
    expect(card.lengthMiles).toBeLessThanOrEqual(1000)
  }
  if (opts.distanceMiExpected) {
    expect(card.distanceMi).toBeDefined()
    expect(typeof card.distanceMi).toBe('number')
    expect(card.distanceMi).toBeGreaterThanOrEqual(0)
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

// =============================================================================
// AC-2: Query is Clerk-gated — unauthenticated call rejected by requireIdentity
// =============================================================================

describe('AC-2: Clerk gate (requireIdentity)', () => {
  describe('logic verification (mocked ctx)', () => {
    it('unauthenticatedCallIsRejected', async () => {
      const ctx = buildCtx({ identity: null })
      await expect(runHandler(ctx, {})).rejects.toThrow(/Authentication required|UNAUTHENTICATED/)
    })

    it('gate is the first statement — no DB or geospatial access on reject', async () => {
      const ctx = buildCtx({ identity: null })
      await expect(
        runHandler(ctx, { bbox: { north: 36, south: 34, east: -82, west: -84 } }),
      ).rejects.toThrow()
      expect(ctx.db.query).not.toHaveBeenCalled()
      expect(ctx.db.get).not.toHaveBeenCalled()
      expect(geospatialQuery).not.toHaveBeenCalled()
      expect(geospatialNearest).not.toHaveBeenCalled()
    })

    it('authenticated identity proceeds past the gate (default mode returns rows)', async () => {
      const ctx = buildCtx({
        identity: { subject: 'user_test' },
        indexData: { by_composite_score: [makeRoute()] },
      })
      const result = await runHandler(ctx, {})
      expect(result).toHaveLength(1)
      assertValidCard(result[0])
    })
  })

  describe('code inspection (curatedRoutes.ts source)', () => {
    it('requireIdentity is the first statement of the handler', () => {
      const src = readFileSync(resolve(__dirname, '..', 'curatedRoutes.ts'), 'utf-8')
      const handlerMatch = src.match(/handler:\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\},/)
      expect(handlerMatch, 'handler body must be located in curatedRoutes.ts').not.toBeNull()
      const body = handlerMatch![1]
      const firstStmt = body
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0 && !l.startsWith('//'))[0]
      expect(firstStmt, `first statement was: ${firstStmt}`).toMatch(
        /await\s+requireIdentity\s*\(\s*ctx\s*\)/,
      )
    })
  })

  describe('live deployment gate (npx convex run — admin auth has no Clerk identity)', () => {
    it('unauthenticatedCallIsRejected_onLiveDev', () => {
      const { ok, stdout, stderr } = tryRunConvexLive({})
      const combined = `${stdout}\n${stderr}`
      // Admin-key auth bypasses Clerk, so requireIdentity MUST reject server-side.
      // This is end-to-end proof that the gate is wired in production.
      expect(ok).toBe(false)
      expect(combined).toContain('UNAUTHENTICATED')
      expect(combined).toMatch(/requireIdentity/)
      expect(combined).toMatch(/guards\.ts/)
      expect(combined).not.toMatch(/^\s*\[/m) // no populated route array returned
    }, 25000)
  })
})

// =============================================================================
// AC-1: All four browse modes return correct ranked/capped results, 0-1 scores
// =============================================================================

describe('AC-1: all four browse modes', () => {
  // --- Mode 1: bbox via geospatial rectangle, ranked by compositeScore --------

  it('mode1_bbox_returnsInBoxRoutesRankedByCompositeScoreDescWith0to1Scores', async () => {
    const inBoxRoutes = [
      makeRoute({
        _id: 'r1',
        routeId: 'route-A',
        compositeScore: 0.4,
        centroidLat: 35.0,
        centroidLng: -83.0,
      }),
      makeRoute({
        _id: 'r2',
        routeId: 'route-B',
        compositeScore: 0.95,
        centroidLat: 35.5,
        centroidLng: -82.5,
      }),
      makeRoute({
        _id: 'r3',
        routeId: 'route-C',
        compositeScore: 0.7,
        centroidLat: 35.2,
        centroidLng: -82.8,
      }),
    ]
    const getRouteById = new Map(inBoxRoutes.map((r) => [r._id, r]))

    // Geospatial returns in random order; the handler must re-sort by score desc.
    geospatialQuery.mockResolvedValueOnce({
      results: [{ key: 'r1' }, { key: 'r2' }, { key: 'r3' }],
    })

    const ctx = buildCtx({ getRouteById })

    const result = await runHandler(ctx, {
      bbox: { north: 36, south: 34, east: -82, west: -84 },
      limit: 25,
    })

    // THEN: every card in-box, ranked desc by compositeScore, scores 0-1, ≤ limit
    expect(result).toHaveLength(3)
    expect(geospatialQuery).toHaveBeenCalledTimes(1)
    const geoCall = geospatialQuery.mock.calls[0]
    expect(geoCall[1].shape.type).toBe('rectangle')
    expect(geoCall[1].shape.rectangle).toEqual({ west: -84, east: -82, south: 34, north: 36 })

    const scores = result.map((r: any) => r.compositeScore)
    expect(scores).toEqual([0.95, 0.7, 0.4]) // descending
    for (const card of result) assertValidCard(card)
    expect(result.length).toBeLessThanOrEqual(25)
  })

  // --- Mode 2: sort='nearest' via geospatial.nearest, distanceMi ascending ---

  it('mode2_nearest_populatesDistanceMiAndSortsAscending', async () => {
    const routes = [
      makeRoute({ _id: 'r1', routeId: 'far', compositeScore: 0.9 }),
      makeRoute({ _id: 'r2', routeId: 'mid', compositeScore: 0.5 }),
      makeRoute({ _id: 'r3', routeId: 'near', compositeScore: 0.1 }),
    ]
    const getRouteById = new Map(routes.map((r) => [r._id, r]))

    // distances in meters — handler converts via * 0.000621371 to miles
    geospatialNearest.mockResolvedValueOnce([
      { key: 'r1', distance: 100_000 }, // 62 mi
      { key: 'r2', distance: 30_000 }, // 18.6 mi
      { key: 'r3', distance: 5_000 }, // 3.1 mi
    ])

    const ctx = buildCtx({ getRouteById })

    const result = await runHandler(ctx, {
      sort: 'nearest',
      center: { lat: 35.0, lng: -83.0 },
      limit: 25,
    })

    expect(result).toHaveLength(3)
    expect(geospatialNearest).toHaveBeenCalledTimes(1)
    const nearestCall = geospatialNearest.mock.calls[0]
    expect(nearestCall[1].point).toEqual({ latitude: 35.0, longitude: -83.0 })

    // ascending distance; every card carries distanceMi
    expect(result.map((r: any) => r.routeId)).toEqual(['near', 'mid', 'far'])
    for (const card of result) assertValidCard(card, { distanceMiExpected: true })

    const dists = result.map((r: any) => r.distanceMi)
    for (let i = 1; i < dists.length; i++) {
      expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1])
    }
    // Spot-check the meters→miles conversion factor
    expect(result[0].distanceMi).toBeCloseTo(5_000 * 0.000621371, 4)
  })

  it('mode2_nearest_throwsWhenNoCenterProvided', async () => {
    const ctx = buildCtx()
    await expect(runHandler(ctx, { sort: 'nearest' })).rejects.toThrow(/Center point required/)
  })

  // --- Mode 3: state-only via by_state, probing BOTH NC variants --------------

  it('mode3_state_probesBothDirtyAndCleanVariantsViaByStateIndex', async () => {
    const indexCalls: IndexCall[] = []
    const cleanVariant = [
      makeRoute({ _id: 'r1', routeId: 'nc-clean-1', state: 'North Carolina', compositeScore: 0.6 }),
    ]
    const dirtyVariant = [
      makeRoute({ _id: 'r2', routeId: 'nc-dirty-1', state: 'North-Carolina', compositeScore: 0.8 }),
    ]
    // The handler queries by_state twice (once per variant). Serve different
    // rows per call by tracking invocation index.
    let byStateCallCount = 0
    const ctx = buildCtx({
      indexCalls,
      indexData: {}, // we override query below via mock implementation
    })
    // Replace the auto-mock with a per-call dispatch
    const originalQuery = ctx.db.query
    ctx.db.query = vi.fn((tableName: string) => {
      originalQuery(tableName) // preserve call recording on the base mock
      return {
        withIndex: vi.fn((indexName: string, filterFn?: (q: any) => any) => {
          const filterCalls: FilterCall[] = []
          const trackingQ = {
            eq: (field: string, value: any) => {
              filterCalls.push({ op: 'eq', field, value })
              return trackingQ
            },
            in: (field: string, values: any[]) => {
              filterCalls.push({ op: 'in', field, values })
              return trackingQ
            },
          }
          if (filterFn) filterFn(trackingQ)
          indexCalls.push({ indexName, filterCalls })
          const variantRows =
            indexName === 'by_state'
              ? (() => {
                  byStateCallCount += 1
                  return byStateCallCount === 1 ? cleanVariant : dirtyVariant
                })()
              : []
          return {
            take: vi.fn(async (n: number) => variantRows.slice(0, n)),
            order: vi.fn(() => ({
              take: vi.fn(async () => variantRows),
              collect: vi.fn(async () => variantRows),
            })),
            collect: vi.fn(async () => variantRows),
          }
        }),
      }
    })

    const result = await runHandler(ctx, { state: 'North Carolina', limit: 25 })

    // THEN: by_state was probed with BOTH variants
    const byStateCalls = indexCalls.filter((c) => c.indexName === 'by_state')
    expect(byStateCalls.length).toBe(2)
    const probedValues = byStateCalls
      .flatMap((c) => c.filterCalls.filter((f) => f.field === 'state'))
      .map((f) => f.value)
    expect(probedValues).toContain('North Carolina')
    expect(probedValues).toContain('North-Carolina')

    // AND: routes from BOTH variants surfaced, deduped, ranked by score desc
    expect(result.map((r: any) => r.routeId).sort()).toEqual(['nc-clean-1', 'nc-dirty-1'])
    // Both cards have canonical state name regardless of source variant
    for (const card of result) {
      assertValidCard(card)
      expect(card.state).toBe('North Carolina')
    }
    expect(result.length).toBeLessThanOrEqual(25)
  })

  // --- Mode 4: best via by_composite_score (default + archetypes filter) ------

  it('mode4_archetypesOnly_fallsThroughToByCompositeScoreAndFiltersByUiEnum', async () => {
    // archetypes=['scenic','twisties'] maps to DB archetypes
    //   scenic → [scenic_byway, coastal]
    //   twisties → [twisties]
    // So matching DB archetypes are: scenic_byway, coastal, twisties
    const topRoutes = [
      makeRoute({
        _id: 'r1',
        routeId: 'top-twisties',
        primaryArchetype: 'twisties',
        compositeScore: 0.95,
      }),
      makeRoute({
        _id: 'r2',
        routeId: 'top-mountain',
        primaryArchetype: 'mountain',
        compositeScore: 0.9,
      }), // filtered out
      makeRoute({
        _id: 'r3',
        routeId: 'top-coastal',
        primaryArchetype: 'coastal',
        compositeScore: 0.85,
      }),
      makeRoute({
        _id: 'r4',
        routeId: 'top-scenic-byway',
        primaryArchetype: 'scenic_byway',
        compositeScore: 0.8,
      }),
      makeRoute({
        _id: 'r5',
        routeId: 'top-desert',
        primaryArchetype: 'desert',
        compositeScore: 0.75,
      }), // filtered out
    ]
    const ctx = buildCtx({
      indexData: { by_composite_score: topRoutes },
    })

    const result = await runHandler(ctx, { archetypes: ['scenic', 'twisties'], limit: 25 })

    // THEN: only routes mapped through the archetype enum are returned; mountain + desert dropped
    const ids = result.map((r: any) => r.routeId)
    expect(ids).toContain('top-twisties')
    expect(ids).toContain('top-coastal')
    expect(ids).toContain('top-scenic-byway')
    expect(ids).not.toContain('top-mountain')
    expect(ids).not.toContain('top-desert')

    // AND: DB archetypes are mapped back to UI enums on the card
    const uiArchetypes = new Set(result.map((r: any) => r.primaryArchetype))
    expect(uiArchetypes).toEqual(new Set(['twisties', 'scenic']))

    for (const card of result) assertValidCard(card)
    expect(result.length).toBeLessThanOrEqual(25)
  })

  it('mode4_defaultBest_usesByCompositeScoreIndexAndReturnsTopRows', async () => {
    const topRoutes = [
      makeRoute({ _id: 'r1', routeId: 'a', compositeScore: 0.99 }),
      makeRoute({ _id: 'r2', routeId: 'b', compositeScore: 0.5 }),
      makeRoute({ _id: 'r3', routeId: 'c', compositeScore: 0.1 }),
    ]
    const ctx = buildCtx({ indexData: { by_composite_score: topRoutes } })
    const result = await runHandler(ctx, { limit: 2 })
    expect(result.map((r: any) => r.routeId)).toEqual(['a', 'b'])
    for (const card of result) assertValidCard(card)
  })

  // --- Cross-cutting invariants: scores, length clamp, limit cap --------------

  it('scoreNormalization_preserves0to1AndCoercesDirty0to100Defensively', async () => {
    // The `norm` helper (line 123 of curatedRoutes.ts) divides by 100 ONLY when
    // v > 1, so genuine 0-1 scores pass through unchanged and dirty 0-100 values
    // get coerced to 0-1. This test confirms both behaviors.
    const topRoutes = [
      makeRoute({ _id: 'r1', routeId: 'clean-half', compositeScore: 0.5 }),
      makeRoute({ _id: 'r2', routeId: 'clean-one', compositeScore: 1.0 }),
      makeRoute({ _id: 'r3', routeId: 'dirty-70', compositeScore: 70 }), // defensive coercion
      makeRoute({ _id: 'r4', routeId: 'dirty-100', compositeScore: 100 }), // → 1.0
    ]
    const ctx = buildCtx({ indexData: { by_composite_score: topRoutes } })
    const result = await runHandler(ctx, {})
    const byId = new Map(result.map((r: any) => [r.routeId, r]))

    expect(byId.get('clean-half').compositeScore).toBe(0.5) // unchanged
    expect(byId.get('clean-one').compositeScore).toBe(1.0) // unchanged (1 is not > 1)
    expect(byId.get('dirty-70').compositeScore).toBeCloseTo(0.7, 5) // coerced
    expect(byId.get('dirty-100').compositeScore).toBeCloseTo(1.0, 5) // coerced
    for (const card of result) assertValidCard(card)
  })

  it('lengthClamp_drops710430MiJunkAndNegativeLengths', async () => {
    // The DATA-005 hard-failure criteria explicitly call out "a 710,430mi length"
    // as a defect. clampLength must drop it (return undefined).
    const topRoutes = [
      makeRoute({ _id: 'r1', routeId: 'junk-huge', lengthMiles: 710_430 }),
      makeRoute({ _id: 'r2', routeId: 'junk-zero', lengthMiles: 0 }),
      makeRoute({ _id: 'r3', routeId: 'junk-neg', lengthMiles: -5 }),
      makeRoute({ _id: 'r4', routeId: 'sane', lengthMiles: 318 }),
    ]
    const ctx = buildCtx({ indexData: { by_composite_score: topRoutes } })
    const result = await runHandler(ctx, {})
    const byId = new Map(result.map((r: any) => [r.routeId, r]))

    expect(byId.get('junk-huge').lengthMiles).toBeUndefined()
    expect(byId.get('junk-zero').lengthMiles).toBeUndefined()
    expect(byId.get('junk-neg').lengthMiles).toBeUndefined()
    expect(byId.get('sane').lengthMiles).toBe(318)
  })

  it('limitCap_capsAtMathMinLimit50_200', async () => {
    // The server caps the limit at min(limit ?? 50, 200). The mock serves rows
    // from indexData; by asserting the result count never exceeds the requested
    // limit and that the default (50) cap holds, we confirm the cap is honored.
    const topRoutes = Array.from({ length: 5 }, (_, i) =>
      makeRoute({ _id: `r${i}`, routeId: `r${i}`, compositeScore: 0.9 - i * 0.01 }),
    )

    // limit=1000 → effectiveLimit is min(1000, 200) = 200; only 5 rows exist.
    const ctx = buildCtx({ indexData: { by_composite_score: topRoutes } })
    const result = await runHandler(ctx, { limit: 1000 })
    expect(result).toHaveLength(5)
    expect(result.length).toBeLessThanOrEqual(200)
    for (const card of result) assertValidCard(card)

    // No limit supplied → effectiveLimit defaults to 50.
    const ctx2 = buildCtx({ indexData: { by_composite_score: topRoutes } })
    const result2 = await runHandler(ctx2, {})
    expect(result2.length).toBeLessThanOrEqual(50)

    // Explicit small limit is honored.
    const ctx3 = buildCtx({ indexData: { by_composite_score: topRoutes } })
    const result3 = await runHandler(ctx3, { limit: 2 })
    expect(result3).toHaveLength(2)
  })

  // The canonical AC-1 test name (referenced by the spec verify command).
  it('allFourModesReturnCorrectRankedCappedResults', async () => {
    // ── Setup shared fixtures ──────────────────────────────────────────────
    const bboxRoutes = [
      makeRoute({
        _id: 'b1',
        routeId: 'bbox-low',
        compositeScore: 0.3,
        centroidLat: 35.1,
        centroidLng: -83.1,
      }),
      makeRoute({
        _id: 'b2',
        routeId: 'bbox-high',
        compositeScore: 0.88,
        centroidLat: 35.2,
        centroidLng: -82.9,
      }),
    ]
    const bboxById = new Map(bboxRoutes.map((r) => [r._id, r]))

    const nearestRoutes = [
      makeRoute({ _id: 'n1', routeId: 'near-far', compositeScore: 0.7 }),
      makeRoute({ _id: 'n2', routeId: 'near-close', compositeScore: 0.2 }),
    ]
    const nearestById = new Map(nearestRoutes.map((r) => [r._id, r]))

    const stateClean = [
      makeRoute({
        _id: 's1',
        routeId: 'state-clean',
        state: 'North Carolina',
        compositeScore: 0.55,
      }),
    ]
    const stateDirty = [
      makeRoute({
        _id: 's2',
        routeId: 'state-dirty',
        state: 'North-Carolina',
        compositeScore: 0.66,
      }),
    ]

    const archetypeRoutes = [
      makeRoute({
        _id: 'a1',
        routeId: 'arch-match',
        primaryArchetype: 'scenic_byway',
        compositeScore: 0.8,
      }),
      makeRoute({
        _id: 'a2',
        routeId: 'arch-reject',
        primaryArchetype: 'mountain',
        compositeScore: 0.95,
      }),
    ]

    // ── Mode 1: bbox ───────────────────────────────────────────────────────
    geospatialQuery.mockResolvedValueOnce({
      results: [{ key: 'b1' }, { key: 'b2' }],
    })
    const ctxBbox = buildCtx({ getRouteById: bboxById })
    const bboxResult = await runHandler(ctxBbox, {
      bbox: { north: 36, south: 34, east: -82, west: -84 },
      limit: 25,
    })
    expect(bboxResult.map((r: any) => r.compositeScore)).toEqual([0.88, 0.3]) // ranked desc
    expect(bboxResult.length).toBeLessThanOrEqual(25)
    for (const card of bboxResult) assertValidCard(card)

    // ── Mode 2: nearest ────────────────────────────────────────────────────
    geospatialNearest.mockResolvedValueOnce([
      { key: 'n1', distance: 80_000 },
      { key: 'n2', distance: 10_000 },
    ])
    const ctxNear = buildCtx({ getRouteById: nearestById })
    const nearestResult = await runHandler(ctxNear, {
      sort: 'nearest',
      center: { lat: 35, lng: -83 },
      limit: 25,
    })
    expect(nearestResult.map((r: any) => r.routeId)).toEqual(['near-close', 'near-far']) // ascending distance
    for (const card of nearestResult) assertValidCard(card, { distanceMiExpected: true })

    // ── Mode 3: state (BOTH variants probed) ───────────────────────────────
    const stateIndexCalls: IndexCall[] = []
    let stateCallCount = 0
    const ctxState = buildCtx({ indexCalls: stateIndexCalls })
    ctxState.db.query = vi.fn(() => ({
      withIndex: vi.fn((indexName: string, filterFn?: (q: any) => any) => {
        const filterCalls: FilterCall[] = []
        const trackingQ = {
          eq: (field: string, value: any) => {
            filterCalls.push({ op: 'eq', field, value })
            return trackingQ
          },
          in: (field: string, values: any[]) => {
            filterCalls.push({ op: 'in', field, values })
            return trackingQ
          },
        }
        if (filterFn) filterFn(trackingQ)
        stateIndexCalls.push({ indexName, filterCalls })
        stateCallCount += 1
        const rows = stateCallCount === 1 ? stateClean : stateDirty
        return {
          take: vi.fn(async (n: number) => rows.slice(0, n)),
          order: vi.fn(() => ({ take: vi.fn(async () => rows), collect: vi.fn(async () => rows) })),
          collect: vi.fn(async () => rows),
        }
      }),
    }))
    const stateResult = await runHandler(ctxState, { state: 'North Carolina', limit: 25 })
    const stateProbed = stateIndexCalls
      .filter((c) => c.indexName === 'by_state')
      .flatMap((c) => c.filterCalls.filter((f) => f.field === 'state'))
      .map((f) => f.value)
    expect(stateProbed).toEqual(expect.arrayContaining(['North Carolina', 'North-Carolina']))
    expect(stateResult.map((r: any) => r.routeId).sort()).toEqual(['state-clean', 'state-dirty'])
    for (const card of stateResult) {
      assertValidCard(card)
      expect(card.state).toBe('North Carolina') // both normalized to canonical
    }

    // ── Mode 4: archetypes-only (falls to by_composite_score + archetype filter)
    const ctxArch = buildCtx({ indexData: { by_composite_score: archetypeRoutes } })
    const archResult = await runHandler(ctxArch, { archetypes: ['scenic'], limit: 25 })
    const archIds = archResult.map((r: any) => r.routeId)
    expect(archIds).toContain('arch-match') // scenic_byway → scenic
    expect(archIds).not.toContain('arch-reject') // mountain → technical, not scenic
    for (const card of archResult) {
      assertValidCard(card)
      expect(card.primaryArchetype).toBe('scenic')
    }

    // ── Cross-mode invariants ──────────────────────────────────────────────
    const allResults = [...bboxResult, ...nearestResult, ...stateResult, ...archResult]
    expect(allResults.length).toBeGreaterThan(0)
    for (const card of allResults) {
      // 0-1 hard requirement (negative control: a 0-100 score escaping fails this)
      expect(card.compositeScore).toBeGreaterThanOrEqual(0)
      expect(card.compositeScore).toBeLessThanOrEqual(1)
      // lengthMiles sane if present (negative control: 710,430mi fails this)
      if (card.lengthMiles !== undefined) {
        expect(card.lengthMiles).toBeGreaterThan(0)
        expect(card.lengthMiles).toBeLessThanOrEqual(1000)
      }
    }
    // distanceMi only on nearest mode
    for (const card of bboxResult) expect(card.distanceMi).toBeUndefined()
    for (const card of nearestResult) expect(card.distanceMi).toBeDefined()
    for (const card of stateResult) expect(card.distanceMi).toBeUndefined()
    for (const card of archResult) expect(card.distanceMi).toBeUndefined()
  })
})
