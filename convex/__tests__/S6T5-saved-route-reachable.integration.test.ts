/**
 * S6-T5 — Saved-routes reachability (AC-1, AC-2, AC-4)
 *
 * GIVEN a rider has previously saved curated routes
 * WHEN those routes flip non-ready / unrecovered / progress status
 * THEN getCuratedRouteDetail still returns honest detail (never gate-hidden)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: convex-test-deployment
 * FLOW_REF: UC-SURF-06
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t5-saved-route-reachable',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 180_000,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    return {
      ok: false,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : '',
    }
  }
}

function runConvexFn(
  fn: string,
  args: Record<string, unknown> = {},
  opts: { identity?: boolean } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd)
}

function parseJson(stdout: string): any {
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

function getDetail(routeId: string): { ok: boolean; detail: any; raw: RunResult } {
  const res = runConvexFn('curatedRoutes:getCuratedRouteDetail', { routeId }, { identity: true })
  return { ok: res.ok, detail: parseJson(res.stdout), raw: res }
}

const REACHABLE_ROUTE_IDS = [
  'test:s6t5-saved-flip',
  'test:s6t5-saved-unrecovered',
  'test:s6t5-progression',
  'test:s6t5-progression-canonical',
]

describe('S6-T5 saved-route reachability (AC-1 / AC-2 / AC-4)', () => {
  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    // Scope teardown to this suite's routeIds so parallel AC-3 file cannot race-delete us.
    runConvexFn(
      'curatedGeometryTestSupport:teardownS6T5Fixtures',
      { routeIds: REACHABLE_ROUTE_IDS },
      { identity: true },
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownS6T5Fixtures',
      { routeIds: REACHABLE_ROUTE_IDS },
      { identity: true },
    )
  })

  // ===========================================================================
  // AC-1 / TC-1: non-ready saved route remains detail-reachable (no gate)
  // ===========================================================================
  it('AC-1 / TC-1: saved route flipped non-ready still returns detail (not gated)', () => {
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T5SavedFlipNonReady',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    const seed = parseJson(seedRes.stdout)
    expect(seed?.riderReady, 'fixture must be non-ready after flip').toBe(false)
    expect(seed?.routeId).toBe('test:s6t5-saved-flip')

    const { ok, detail, raw } = getDetail(seed.routeId)
    expect(ok, `getCuratedRouteDetail threw/failed: ${raw.stderr}\n${raw.stdout}`).toBe(true)
    expect(detail, 'result must not be null (gate hid the row)').not.toBeNull()
    expect(detail.routeId).toBe(seed.routeId)
    expect(detail.riderReady).toBe(false)
    expect(detail.geometryStatus).toBe(seed.geometryStatus ?? 'generated')

    // TC-2: source must not filter riderReady inside getCuratedRouteDetail handler
    const source = readFileSync(resolve(PROJECT_ROOT, 'convex/curatedRoutes.ts'), 'utf-8')
    const handlerMatch = source.match(
      /export const getCuratedRouteDetail = query\(\{[\s\S]*?handler:\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\},\n\s*\}\)/,
    )
    expect(handlerMatch, 'getCuratedRouteDetail handler must be findable').toBeTruthy()
    const handlerBody = handlerMatch![1]
    expect(handlerBody).not.toMatch(/riderReady\s*===?\s*true/)
    expect(handlerBody).not.toMatch(/\.filter\([^)]*riderReady/)
    expect(handlerBody).not.toMatch(/if\s*\([^)]*riderReady/)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-saved-route-flipped-non-ready.json'),
      JSON.stringify({ seed, detail }, null, 2),
    )
  }, 180_000)

  // ===========================================================================
  // AC-2 / TC-3: unrecovered → routePolyline null + geometryStatus unresolved
  // ===========================================================================
  it("AC-2 / TC-3: unrecovered saved route returns routePolyline null + geometryStatus 'unresolved'", () => {
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T5SavedUnrecovered',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    const seed = parseJson(seedRes.stdout)
    expect(seed?.hasGeometryRow).toBe(false)
    expect(seed?.hasInRowPolyline).toBe(false)

    const { ok, detail, raw } = getDetail(seed.routeId)
    expect(ok, `detail failed: ${raw.stderr}\n${raw.stdout}`).toBe(true)
    expect(detail, 'must not be null').not.toBeNull()
    expect(detail.routePolyline, 'must be honest null — no fabricated line').toBeNull()
    expect(detail.geometryStatus).toBe('unresolved')
    // Bounds come from stored centroids — must not be an empty / missing object.
    expect(detail.bounds).toBeTruthy()
    expect(typeof detail.bounds.north).toBe('number')
    expect(typeof detail.bounds.south).toBe('number')

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-saved-route-unrecovered.json'),
      JSON.stringify({ seed, detail }, null, 2),
    )
  }, 180_000)

  // ===========================================================================
  // AC-4 / TC-7 / TC-8: status progression never loses access
  // ===========================================================================
  it('AC-4 / TC-7 / TC-8: quarantine → retire → shadow remain reachable with honest status', () => {
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T5StatusProgression',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    const seed = parseJson(seedRes.stdout)
    const routeId = seed.routeId as string
    const canonicalRouteId = seed.canonicalRouteId as string

    // Stage 0 baseline — ready
    const base = getDetail(routeId)
    expect(base.ok && base.detail != null).toBe(true)

    // Stage 1: quarantine
    const qRes = runConvexFn(
      'curatedGeometryTestSupport:advanceS6T5ProgressionQuarantine',
      {},
      { identity: true },
    )
    expect(qRes.ok, `quarantine advance failed: ${qRes.stderr}\n${qRes.stdout}`).toBe(true)
    const qStage = parseJson(qRes.stdout)
    expect(qStage.riderReady).toBe(false)

    const afterQ = getDetail(routeId)
    expect(afterQ.ok, `detail after quarantine failed: ${afterQ.raw.stderr}`).toBe(true)
    expect(afterQ.detail, 'quarantine stage must remain reachable').not.toBeNull()
    expect(afterQ.detail.riderReady).toBe(false)

    // Stage 2: retire
    const rRes = runConvexFn(
      'curatedGeometryTestSupport:advanceS6T5ProgressionRetire',
      {},
      { identity: true },
    )
    expect(rRes.ok, `retire advance failed: ${rRes.stderr}\n${rRes.stdout}`).toBe(true)
    const rStage = parseJson(rRes.stdout)
    expect(rStage.geometryStatus).toBe('retired')
    expect(rStage.retiredAt).toBeTruthy()

    const afterR = getDetail(routeId)
    expect(afterR.ok, `detail after retire failed: ${afterR.raw.stderr}`).toBe(true)
    expect(afterR.detail, 'retire stage must remain reachable').not.toBeNull()
    expect(afterR.detail.geometryStatus).toBe('retired')
    expect(afterR.detail.retiredAt).toBeTruthy()
    // TC-8: honest retirement fields on the detail response
    expect(
      afterR.detail.retirementReason,
      'retirementReason must surface for RN honest state',
    ).toBeTruthy()
    expect(typeof afterR.detail.retirementReason).toBe('string')

    // Stage 3: shadow merge → must resolve to canonical
    const sRes = runConvexFn(
      'curatedGeometryTestSupport:advanceS6T5ProgressionShadow',
      {},
      { identity: true },
    )
    expect(sRes.ok, `shadow advance failed: ${sRes.stderr}\n${sRes.stdout}`).toBe(true)
    const sStage = parseJson(sRes.stdout)
    expect(sStage.duplicateOf).toBe(canonicalRouteId)

    const afterS = getDetail(routeId)
    expect(afterS.ok, `detail after shadow failed: ${afterS.raw.stderr}`).toBe(true)
    expect(afterS.detail, 'shadow stage must remain reachable via redirect').not.toBeNull()
    expect(afterS.detail.routeId).toBe(canonicalRouteId)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-saved-route-status-progression.json'),
      JSON.stringify(
        {
          seed,
          stages: {
            quarantine: { advance: qStage, detail: afterQ.detail },
            retire: { advance: rStage, detail: afterR.detail },
            shadow: { advance: sStage, detail: afterS.detail },
          },
        },
        null,
        2,
      ),
    )
  }, 180_000)
})
