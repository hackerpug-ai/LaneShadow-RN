/**
 * AC-5 [PRIMARY]: Marginal verdict never auto-retires a route
 *
 * GIVEN a route with rideWorthiness.verdict=marginal and compositeScore=0.45
 * WHEN any pipeline handler evaluates the route (recompute riderReady, etc.)
 * THEN retiredAt remains null — marginal never triggers retirement
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real marginal verdict + retirement checks)
 * FLOW_REF: UC-VER-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T4/evidence')
const ROUTE_ID = 'test:ver-marginal-no-retire'

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t4-marginal-no-autoretire-test',
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

function getRoute(routeId: string): any {
  const result = runConvexFn(
    'curatedGeometryTestSupport:getTestRoute',
    { routeId },
    { identity: true },
  )
  expect(result.ok, `getTestRoute failed: ${result.stderr}`).toBe(true)
  return JSON.parse(result.stdout)
}

describe('AC-5: Marginal verdict never auto-retires a route', () => {
  let routeBefore: any
  let routeAfter: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    console.log('🌱 Seeding marginal-verdict route...')
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedMarginalVerdictRoute',
      {},
      { identity: true },
    )
    expect(seed.ok, `seedMarginalVerdictRoute failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    routeBefore = getRoute(ROUTE_ID)

    // Run handlers that touch rider-ready / score paths — none may set retiredAt from marginal
    const recompute = runConvexFn(
      'curatedGeometryTestSupport:recomputeRiderReadyForRoutePublic',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    expect(
      recompute.ok,
      `recomputeRiderReadyForRoutePublic failed: ${recompute.stderr}\n${recompute.stdout}`,
    ).toBe(true)

    routeAfter = getRoute(ROUTE_ID)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-5-marginal-no-autoretire.json'),
      JSON.stringify({ ac: 'AC-5', routeBefore, routeAfter }, null, 2),
    )
  }, 120_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownS4T4TestRoutes',
      { routeIds: [ROUTE_ID] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: retiredAt == null (no auto-retirement)', () => {
    expect(routeAfter.retiredAt == null).toBe(true)
    expect(routeBefore.retiredAt == null).toBe(true)
  })

  it("MUST_OBSERVE: rideWorthiness.verdict == 'marginal' (unchanged)", () => {
    expect(routeAfter.rideWorthiness?.verdict).toBe('marginal')
  })

  it('MUST_OBSERVE: compositeScore == 0.45 (score unchanged by retirement logic)', () => {
    expect(routeAfter.compositeScore).toBe(0.45)
  })

  it('MUST_NOT_OBSERVE: retiredAt set due to marginal verdict', () => {
    expect(routeAfter.retiredAt).toBeFalsy()
  })

  it('static guard: curatedGeometry does not auto-retire on marginal', () => {
    // Source-level guardrail: no retirement logic conditional on marginal verdict
    const source = execFileSync('rg', ['-n', 'retiredAt|marginal', 'convex/curatedGeometry.ts'], {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    })
    // retiredAt is only checked as a gate input (doc.retiredAt == null), never set from marginal
    expect(source).toMatch(/retiredAt/)
    expect(source).toMatch(/marginal/)
    // Must not contain patterns that SET retiredAt based on marginal
    expect(source).not.toMatch(/retiredAt\s*[:=].*marginal/)
    expect(source).not.toMatch(/marginal.*retiredAt\s*[:=]/)
  })
})
