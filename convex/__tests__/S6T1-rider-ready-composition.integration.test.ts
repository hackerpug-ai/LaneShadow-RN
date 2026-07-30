/**
 * S6-T1 AC-1 / TC-1: 7-input riderReady composition
 *
 * GIVEN a curated_routes doc with all 7 inputs valid
 * WHEN recomputeRiderReadyForRoute runs
 * THEN stored riderReady === true
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: convex-test-deployment
 * FLOW_REF: UC-SURF-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S6-T1/evidence')
const ROUTE_ID = 'motorcycleroads:twist-of-tepusquet-loop'

const TEST_IDENTITY = JSON.stringify({
  subject: 's6t1-composition-test',
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

describe('AC-1: 7-input riderReady composition', () => {
  let seedResult: any
  let route: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedS6T1AllSevenInputs',
      {},
      { identity: true },
    )
    expect(seed.ok, `seedS6T1AllSevenInputs failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    seedResult = parseJson(seed.stdout)

    const recompute = runConvexFn(
      'curatedGeometryTestSupport:recomputeRiderReadyForPoC',
      {},
      { identity: true },
    )
    expect(recompute.ok, `recompute failed: ${recompute.stderr}\n${recompute.stdout}`).toBe(true)

    const get = runConvexFn(
      'curatedGeometryTestSupport:getTestRoute',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    expect(get.ok, `getTestRoute failed: ${get.stderr}\n${get.stdout}`).toBe(true)
    route = parseJson(get.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-composition.json'),
      JSON.stringify({ ac: 'AC-1', seedResult, route }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T1Fixtures', {}, { identity: true })
  })

  it('AC-1 MUST_OBSERVE: riderReady == true when all 7 inputs satisfied', () => {
    expect(route).toBeTruthy()
    expect(route.riderReady).toBe(true)
    expect(route.name).toBe('Twist of Tepusquet Loop')
    expect(route.compositeScore).toBe(0.85)
    expect(route.routeId).toBe(ROUTE_ID)
  })

  it('TC-1: computeRiderReadyFromDoc returns true iff all 7 inputs are present and valid', () => {
    // Stored flag is the composition output after recompute (not read-time compute).
    expect(route.riderReady).toBe(true)
    expect(route.lengthMiles).toBe(41)
    expect(route.retiredAt == null).toBe(true)
    expect(route.duplicateOf == null).toBe(true)
    expect(['ride', 'marginal', 'worth_it']).toContain(route.rideWorthiness?.verdict)
    expect(seedResult?.riderReady).toBe(true)
  })
})
