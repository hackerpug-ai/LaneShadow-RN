/**
 * S6-T5 — Canonical redirect for shadow-merged saved routes (AC-3)
 *
 * GIVEN a saved_routes bookmark whose curatedRouteRef points at a shadow row
 *       (duplicateOf = canonical routeId)
 * WHEN getCuratedRouteDetail is called with the shadow's routeId
 * THEN the query returns the CANONICAL row's detail (single-hop only)
 * AND saved_routes.curatedRouteRef is NOT mutated (read-path immutability)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: convex-test-deployment
 * FLOW_REF: UC-SURF-06
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t5-canonical-redirect',
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

const REDIRECT_ROUTE_IDS = [
  'test:s6t5-canonical',
  'test:s6t5-shadow',
  'test:s6t5-chain-A',
  'test:s6t5-chain-B',
]

describe('S6-T5 saved-route canonical redirect (AC-3)', () => {
  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    // Scope teardown to this suite only — do not wipe AC-1/AC-2/AC-4 fixtures.
    runConvexFn(
      'curatedGeometryTestSupport:teardownS6T5Fixtures',
      { routeIds: REDIRECT_ROUTE_IDS },
      { identity: true },
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownS6T5Fixtures',
      { routeIds: REDIRECT_ROUTE_IDS },
      { identity: true },
    )
  })

  // ===========================================================================
  // AC-3 CASE 1 / TC-4 / TC-5: shadow → canonical redirect + immutability
  // ===========================================================================
  it('AC-3 / TC-4 / TC-5: shadow-merged saved route resolves to canonical; saved_routes immutable', () => {
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T5ShadowOfCanonical',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    const seed = parseJson(seedRes.stdout)
    expect(seed.shadowRouteId).toBe('test:s6t5-shadow')
    expect(seed.canonicalRouteId).toBe('test:s6t5-canonical')
    expect(seed.shadowDuplicateOf).toBe('test:s6t5-canonical')
    expect(seed.curatedRouteRef).toBe(seed.shadowDocId)

    // Snapshot saved_routes BEFORE detail call
    const beforeRes = runConvexFn(
      'curatedGeometryTestSupport:getS6T5SavedRouteSnapshot',
      { savedRouteId: seed.savedRouteId },
      { identity: true },
    )
    expect(beforeRes.ok, `snapshot before failed: ${beforeRes.stderr}`).toBe(true)
    const before = parseJson(beforeRes.stdout)
    expect(before.curatedRouteRef).toBe(seed.shadowDocId)

    const detailRes = runConvexFn(
      'curatedRoutes:getCuratedRouteDetail',
      { routeId: seed.shadowRouteId },
      { identity: true },
    )
    expect(detailRes.ok, `detail failed: ${detailRes.stderr}\n${detailRes.stdout}`).toBe(true)
    const detail = parseJson(detailRes.stdout)

    // TC-4: must resolve to canonical routeId (not the shadow)
    expect(detail, 'result must not be null').not.toBeNull()
    expect(detail.routeId).toBe('test:s6t5-canonical')
    expect(detail.routeId).not.toBe('test:s6t5-shadow')
    expect(detail.geometryStatus).toBe(seed.canonicalGeometryStatus)

    // TC-5: saved_routes.curatedRouteRef MUST remain the shadow doc id
    const afterRes = runConvexFn(
      'curatedGeometryTestSupport:getS6T5SavedRouteSnapshot',
      { savedRouteId: seed.savedRouteId },
      { identity: true },
    )
    expect(afterRes.ok, `snapshot after failed: ${afterRes.stderr}`).toBe(true)
    const after = parseJson(afterRes.stdout)
    expect(after.curatedRouteRef).toBe(seed.shadowDocId)
    expect(after.curatedRouteRef).toBe(before.curatedRouteRef)
    expect(after.updatedAt).toBe(before.updatedAt)
    expect(after.name).toBe(before.name)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-saved-route-shadow-of-canonical.json'),
      JSON.stringify({ seed, before, detail, after }, null, 2),
    )
  }, 180_000)

  // ===========================================================================
  // AC-3 CASE 2 / TC-6: chain guard — corrupted A↔B returns null (no loop)
  // ===========================================================================
  it('AC-3 / TC-6: corrupted canonical chain returns null (single-hop max, no loop)', () => {
    const seedRes = runConvexFn(
      'curatedGeometryTestSupport:seedS6T5CanonicalChainGuard',
      {},
      { identity: true },
    )
    expect(seedRes.ok, `seed failed: ${seedRes.stderr}\n${seedRes.stdout}`).toBe(true)
    const seed = parseJson(seedRes.stdout)
    expect(seed.chainA).toBe('test:s6t5-chain-A')
    expect(seed.aDuplicateOf).toBe('test:s6t5-chain-B')
    expect(seed.bDuplicateOf).toBe('test:s6t5-chain-A')

    const detailRes = runConvexFn(
      'curatedRoutes:getCuratedRouteDetail',
      { routeId: seed.chainA },
      { identity: true },
    )
    // Must complete without stack overflow / timeout (exec already enforces timeout)
    expect(detailRes.ok, `detail call crashed: ${detailRes.stderr}\n${detailRes.stdout}`).toBe(true)
    const detail = parseJson(detailRes.stdout)
    // Data-integrity fault: single-hop max refuses a second hop → null
    expect(detail).toBeNull()

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-saved-route-canonical-chain-guard.json'),
      JSON.stringify({ seed, detail }, null, 2),
    )
  }, 180_000)
})
