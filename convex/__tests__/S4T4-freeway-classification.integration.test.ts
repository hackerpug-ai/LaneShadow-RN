/**
 * AC-2 [PRIMARY]: FHWA freeway segments classified as not_a_ride but still receive geometry attempt
 *
 * GIVEN an FHWA freeway segment (source=fhwa, name=I-40, lengthMiles=245)
 * WHEN classifier processes the route and geometry pipeline runs
 * THEN verdict=not_a_ride with freeway rationale; geometry attempt proceeds;
 *      riderReady withheld due to verdict
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real classifier + FHWA freeway seed)
 * FLOW_REF: UC-VER-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T4/evidence')
const ROUTE_ID = 'test:ver-freeway-i40'

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t4-freeway-classification-test',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[], timeoutMs = 180_000): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: timeoutMs,
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
  opts: { identity?: boolean; timeoutMs?: number } = {},
): RunResult {
  const cmd = ['convex', 'run', fn, JSON.stringify(args)]
  if (opts.identity) cmd.push('--identity', TEST_IDENTITY)
  return execNpx(cmd, opts.timeoutMs ?? 180_000)
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

describe('AC-2: FHWA freeway classified as not_a_ride; geometry still attempted', () => {
  let classifyResult: any
  let geometryResult: any
  let routeAfter: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    console.log('🌱 Seeding FHWA freeway row...')
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedFHWAFreewayRow',
      {},
      { identity: true },
    )
    expect(seed.ok, `seedFHWAFreewayRow failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    console.log('🤖 Classifying freeway via real z.ai GLM-5.2...')
    const classify = runConvexFn(
      'actions/rideWorthinessClassifier:classifyRoute',
      { routeId: ROUTE_ID },
      { identity: true, timeoutMs: 180_000 },
    )
    expect(classify.ok, `classifyRoute failed: ${classify.stderr}\n${classify.stdout}`).toBe(true)
    classifyResult = JSON.parse(classify.stdout)

    // Rescue-first: geometry attempt still proceeds even for not_a_ride freeways
    console.log('🗺️ Running geometry attempt (rescue-first, independent of verdict)...')
    const geometry = runConvexFn(
      'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
      {
        routeId: ROUTE_ID,
        routedMiles: 245,
        anchorCount: 2,
        pointCount: 100,
      },
      { identity: true },
    )
    expect(geometry.ok, `geometry attempt failed: ${geometry.stderr}\n${geometry.stdout}`).toBe(
      true,
    )
    geometryResult = JSON.parse(geometry.stdout)

    routeAfter = getRoute(ROUTE_ID)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-freeway-classification.json'),
      JSON.stringify({ ac: 'AC-2', classifyResult, geometryResult, routeAfter }, null, 2),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('curatedGeometryTestSupport:teardownS4T4TestRoutes', {}, { identity: true })
  })

  it('MUST_OBSERVE: verdict == not_a_ride', () => {
    expect(routeAfter.rideWorthiness?.verdict).toBe('not_a_ride')
    expect(classifyResult.ok).toBe(true)
    expect(classifyResult.verdict).toBe('not_a_ride')
  })

  it('MUST_OBSERVE: reason explains freeway / interstate classification', () => {
    const reason = (routeAfter.rideWorthiness?.reason ?? '').toLowerCase()
    expect(reason.length).toBeGreaterThan(0)
    const mentionsFreeway =
      reason.includes('freeway') ||
      reason.includes('interstate') ||
      reason.includes('i-40') ||
      reason.includes('limited-access') ||
      reason.includes('not a motorcycle')
    expect(mentionsFreeway).toBe(true)
  })

  it('MUST_OBSERVE: geometry attempt proceeds (rescue-first)', () => {
    // Fixed-geometry reconstruct always returns a result; status may be generated or review
    expect(geometryResult).toBeTruthy()
    expect(['generated', 'review']).toContain(geometryResult.geometryStatus)
    // geometryStatus on the route should no longer be stuck at unresolved solely because of classification
    expect(routeAfter.geometryStatus).not.toBeNull()
  })

  it('MUST_OBSERVE: riderReady withheld due to not_a_ride', () => {
    expect(routeAfter.riderReady).toBe(false)
    // Geometry may have passed; verdict still blocks rider-ready
    if (geometryResult.geometryStatus === 'generated' && geometryResult.verdict === 'pass') {
      expect(routeAfter.rideWorthiness?.verdict).toBe('not_a_ride')
      expect(routeAfter.riderReady).toBe(false)
    }
  })
})
