/**
 * AC-4 [PRIMARY]: Classifier failures are handled gracefully without blocking pipeline
 *
 * GIVEN 5 routes where route 3 is forced to fail classification
 * WHEN classifyCatalog runs
 * THEN routes 1,2,4,5 have verdicts; route 3 has null verdict + error log;
 *      action completes without throwing
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real classifier + forced failure seam)
 * FLOW_REF: UC-VER-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T4/evidence')

const SUCCESS_IDS = [
  'test:ver-error-1',
  'test:ver-error-2',
  'test:ver-error-4',
  'test:ver-error-5',
] as const
const FAIL_ID = 'test:ver-error-3'
const ALL_IDS = [
  'test:ver-error-1',
  'test:ver-error-2',
  'test:ver-error-3',
  'test:ver-error-4',
  'test:ver-error-5',
] as const

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t4-classifier-error-handling-test',
  issuer: 'https://laneshadow.test',
})

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
}

function execNpx(cmd: string[], timeoutMs = 300_000): RunResult {
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
  return execNpx(cmd, opts.timeoutMs ?? 300_000)
}

function getRoute(routeId: string): any {
  const result = runConvexFn(
    'curatedGeometryTestSupport:getTestRoute',
    { routeId },
    { identity: true },
  )
  expect(result.ok, `getTestRoute failed for ${routeId}: ${result.stderr}`).toBe(true)
  return JSON.parse(result.stdout)
}

describe('AC-4: Classifier failures isolated; pipeline continues', () => {
  let classifyResult: any
  let errorLogs: any[]

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    console.log('🌱 Seeding 5 routes for error isolation...')
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedRoutesForErrorTesting',
      {},
      { identity: true },
    )
    expect(seed.ok, `seedRoutesForErrorTesting failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    console.log('🤖 Running classifyCatalog with failRouteIds for route 3...')
    const classify = runConvexFn(
      'actions/rideWorthinessClassifier:classifyCatalog',
      {
        routeIds: [...ALL_IDS],
        failRouteIds: [FAIL_ID],
      },
      { identity: true, timeoutMs: 360_000 },
    )
    // Action must complete without crash even when one route fails
    expect(classify.ok, `classifyCatalog crashed: ${classify.stderr}\n${classify.stdout}`).toBe(
      true,
    )
    classifyResult = JSON.parse(classify.stdout)

    const logs = runConvexFn(
      'curatedGeometryTestSupport:listClassifierPerformanceLogs',
      { routeId: FAIL_ID, limit: 10 },
      { identity: true },
    )
    expect(logs.ok, `listClassifierPerformanceLogs failed: ${logs.stderr}`).toBe(true)
    errorLogs = JSON.parse(logs.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-classifier-error-handling.json'),
      JSON.stringify({ ac: 'AC-4', classifyResult, errorLogs }, null, 2),
    )
  }, 420_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometryTestSupport:teardownS4T4TestRoutes',
      { routeIds: [...ALL_IDS] },
      { identity: true },
    )
  })

  it(
    'MUST_OBSERVE: action completes without throwing (graceful handling)',
    () => {
      expect(classifyResult).toBeTruthy()
      expect(classifyResult.failed).toBeGreaterThanOrEqual(1)
      expect(classifyResult.classified).toBe(4)
    },
    30_000,
  )

  it(
    'MUST_OBSERVE: routes 1,2,4,5 have rideWorthiness verdicts',
    () => {
      for (const routeId of SUCCESS_IDS) {
        const doc = getRoute(routeId)
        expect(doc.rideWorthiness, `missing verdict on ${routeId}`).toBeTruthy()
        expect(['ride', 'marginal', 'not_a_ride']).toContain(doc.rideWorthiness.verdict)
      }
    },
    60_000,
  )

  it(
    'MUST_OBSERVE: route 3 has rideWorthiness == null (no verdict due to error)',
    () => {
      const doc = getRoute(FAIL_ID)
      expect(doc.rideWorthiness == null).toBe(true)
    },
    30_000,
  )

  it(
    'MUST_OBSERVE: performance table contains error log for route 3 failure',
    () => {
      const failLogs = errorLogs.filter((l) => l.success === false && l.input === FAIL_ID)
      expect(failLogs.length).toBeGreaterThanOrEqual(1)
      expect(failLogs[0].error).toBeTruthy()
      expect(String(failLogs[0].error)).toMatch(/fail|error|Simulated/i)
    },
    30_000,
  )

  it(
    'MUST_NOT_OBSERVE: entire catalog aborted at route 3',
    () => {
      // Routes after the failure still classified
      const route4 = getRoute('test:ver-error-4')
      const route5 = getRoute('test:ver-error-5')
      expect(route4.rideWorthiness).toBeTruthy()
      expect(route5.rideWorthiness).toBeTruthy()
    },
    30_000,
  )
})
