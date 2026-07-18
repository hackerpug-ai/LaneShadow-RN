/**
 * AC-3 [PRIMARY]: Valid geometry routes with not_a_ride verdict have rider-ready withheld
 *
 * GIVEN a route with gate-passing geometry but rideWorthiness.verdict=not_a_ride
 * WHEN computeRiderReadyFromDoc / recomputeRiderReady evaluates the route
 * THEN riderReady=false despite valid geometry
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real rider-ready computation)
 * FLOW_REF: UC-VER-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T4/evidence')
const ROUTE_ID = 'test:ver-geom-good-not-ride'

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t4-rideready-withheld-test',
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
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
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

describe('AC-3: not_a_ride withholds riderReady despite valid geometry', () => {
  let seedResult: any
  let route: any
  let verification: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    console.log('🌱 Seeding valid-geometry + not_a_ride route...')
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedValidGeometryNotARide',
      {},
      { identity: true },
    )
    expect(seed.ok, `seedValidGeometryNotARide failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    seedResult = JSON.parse(seed.stdout)

    const routeResult = runConvexFn(
      'curatedGeometryTestSupport:getTestRoute',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    expect(routeResult.ok).toBe(true)
    route = JSON.parse(routeResult.stdout)

    const verifyResult = runConvexFn(
      'curatedGeometryTestSupport:getGeometryVerification',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    expect(verifyResult.ok).toBe(true)
    verification = JSON.parse(verifyResult.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-rideready-withheld.json'),
      JSON.stringify({ ac: 'AC-3', seedResult, route, verification }, null, 2),
    )
  }, 120_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS4T4TestRoutes', {}, { identity: true })
  })

  it('MUST_OBSERVE: geometry gate is pass / generated', () => {
    expect(verification?.verdict).toBe('pass')
    expect(verification?.geometryStatus).toBe('generated')
    expect(route.geometryStatus).toBe('generated')
  })

  it('MUST_OBSERVE: rideWorthiness.verdict == not_a_ride (stored evidence)', () => {
    expect(route.rideWorthiness?.verdict).toBe('not_a_ride')
    expect(route.rideWorthiness?.model).toBe('z.ai-glm-5.2')
  })

  it('MUST_OBSERVE: riderReady == false (verdict withholds despite valid geometry)', () => {
    expect(route.riderReady).toBe(false)
    expect(seedResult.riderReady).toBe(false)
  })

  it('MUST_NOT_OBSERVE: riderReady true from geometry alone', () => {
    // All geometry inputs pass; only not_a_ride blocks rider-ready
    expect(route.name.length).toBeGreaterThan(0)
    expect(route.lengthMiles).toBeGreaterThan(0)
    expect(route.compositeScore).toBeGreaterThanOrEqual(50)
    expect(route.riderReady).not.toBe(true)
  })
})
