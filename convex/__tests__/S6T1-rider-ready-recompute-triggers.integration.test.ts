/**
 * S6-T1 AC-4 / TC-4: recompute triggers on every upstream change
 *
 * GIVEN a route currently riderReady=true
 * WHEN any of geometry/score/lengthMiles/classifier/retiredAt/duplicateOf changes
 * THEN recomputeRiderReady runs in the same transaction and stored flag updates
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
  subject: 's6t1-recompute-triggers-test',
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

describe('AC-4: recompute triggers on every upstream change', () => {
  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedS6T1AllSevenInputs',
      {},
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    const seeded = parseJson(seed.stdout)
    expect(seeded?.riderReady).toBe(true)
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS6T1Fixtures', {}, { identity: true })
  })

  it('AC-4: classifier flip to not_a_ride triggers recompute → riderReady false same transaction', () => {
    // Restore all-good first so this AC is independent of other case order.
    const restore = runConvexFn(
      'curatedGeometryTestSupport:seedS6T1AllSevenInputs',
      {},
      { identity: true },
    )
    expect(restore.ok).toBe(true)
    expect(parseJson(restore.stdout)?.riderReady).toBe(true)

    const flip = runConvexFn(
      'curatedGeometry:patchRideWorthinessPublic',
      {
        routeId: ROUTE_ID,
        rideWorthiness: {
          verdict: 'not_a_ride',
          reason: 'S6-T1 AC-4 trigger test',
          model: 'test',
          classifiedAt: Date.now(),
          evidenceComplete: true,
        },
      },
      { identity: true },
    )
    expect(flip.ok, `patchRideWorthinessPublic failed: ${flip.stderr}\n${flip.stdout}`).toBe(true)
    const flipped = parseJson(flip.stdout)
    expect(flipped.riderReady).toBe(false)
    expect(flipped.rideWorthiness?.verdict).toBe('not_a_ride')

    const get = runConvexFn(
      'curatedGeometryTestSupport:getTestRoute',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    const route = parseJson(get.stdout)
    expect(route.riderReady).toBe(false)
    expect(route.rideWorthiness?.verdict).toBe('not_a_ride')

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-recompute-triggers.json'),
      JSON.stringify({ ac: 'AC-4', flipped, route }, null, 2),
    )
  }, 180_000)

  it('TC-4: each of the 6 change sources triggers recomputeRiderReady in the same transaction', () => {
    const cases: Array<{ source: string; fn: string; args: Record<string, unknown> }> = [
      {
        source: 'classifier',
        fn: 'curatedGeometry:patchRideWorthinessPublic',
        args: {
          routeId: ROUTE_ID,
          rideWorthiness: {
            verdict: 'not_a_ride',
            reason: 'tc4',
            model: 'test',
            classifiedAt: Date.now(),
            evidenceComplete: true,
          },
        },
      },
      {
        source: 'score',
        fn: 'curatedGeometry:patchCompositeScorePublic',
        args: { routeId: ROUTE_ID, compositeScore: 0.1 },
      },
      {
        source: 'lengthMiles',
        fn: 'curatedGeometry:patchLengthMilesPublic',
        args: { routeId: ROUTE_ID, lengthMiles: 0 },
      },
      {
        source: 'duplicateOf',
        fn: 'curatedGeometry:patchDuplicateOfPublic',
        args: { routeId: ROUTE_ID, duplicateOf: 'test:canonical' },
      },
      {
        source: 'retiredAt',
        fn: 'curatedGeometry:patchRetiredAtPublic',
        args: { routeId: ROUTE_ID, retiredAt: Date.now() },
      },
      {
        source: 'geometry',
        fn: 'curatedGeometry:patchGeometryStatusPublic',
        args: { routeId: ROUTE_ID, geometryStatus: 'review', verdict: 'review' },
      },
    ]

    const results: Array<{ source: string; riderReady: boolean }> = []

    for (const c of cases) {
      const restore = runConvexFn(
        'curatedGeometryTestSupport:seedS6T1AllSevenInputs',
        {},
        { identity: true },
      )
      expect(restore.ok, `restore before ${c.source} failed`).toBe(true)
      expect(parseJson(restore.stdout)?.riderReady).toBe(true)

      const mut = runConvexFn(c.fn, c.args, { identity: true })
      expect(mut.ok, `${c.source} mutation failed: ${mut.stderr}\n${mut.stdout}`).toBe(true)
      const body = parseJson(mut.stdout)
      expect(body?.riderReady, `${c.source} should flip riderReady false`).toBe(false)
      results.push({ source: c.source, riderReady: body.riderReady })
    }

    expect(results).toHaveLength(6)
    expect(results.every((r) => r.riderReady === false)).toBe(true)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'TC-4-six-triggers.json'),
      JSON.stringify({ tc: 'TC-4', results }, null, 2),
    )
  }, 300_000)
})
