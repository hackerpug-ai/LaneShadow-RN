/**
 * AC-1 [PRIMARY]: Classifier runs on all catalog routes and stores verdict as evidence
 *
 * GIVEN a catalog of mixed routes (twisties, FHWA freeways, recovered rows)
 * WHEN the ride-worthiness classifier action executes over those routes
 * THEN every route receives a stored rideWorthiness verdict (ride/marginal/not_a_ride)
 *      with reason, model/provider=z.ai-glm-5.2, and timestamp
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real classifier + z.ai GLM-5.2)
 * FLOW_REF: UC-VER-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T4/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t4-classify-catalog-test',
  issuer: 'https://laneshadow.test',
})

const MIXED_ROUTE_IDS = [
  'test:ver-twisty-1',
  'test:ver-twisty-2',
  'test:ver-freeway-fhwa',
  'test:ver-recovered-row',
] as const

const TWISTY_ROUTE_IDS = ['test:ver-twisty-1', 'test:ver-twisty-2'] as const
const FREEWAY_ROUTE_ID = 'test:ver-freeway-fhwa'

const VERDICTS = ['ride', 'marginal', 'not_a_ride'] as const
const PROVIDER_STAMP = 'z.ai-glm-5.2'

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
  expect(result.ok, `getTestRoute failed for ${routeId}: ${result.stderr}`).toBe(true)
  return JSON.parse(result.stdout)
}

describe('AC-1: Classifier runs on catalog routes and stores verdict as evidence', () => {
  let classifyResult: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    console.log('🌱 Seeding mixed catalog rows for classifier...')
    const seed = runConvexFn(
      'curatedGeometryTestSupport:seedCatalogWithMixedRows',
      {},
      { identity: true },
    )
    expect(seed.ok, `seedCatalogWithMixedRows failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    console.log('🤖 Running classifyCatalog over mixed routes (real z.ai GLM-5.2)...')
    const classify = runConvexFn(
      'actions/rideWorthinessClassifier:classifyCatalog',
      { routeIds: [...MIXED_ROUTE_IDS] },
      { identity: true, timeoutMs: 300_000 },
    )
    expect(classify.ok, `classifyCatalog failed: ${classify.stderr}\n${classify.stdout}`).toBe(true)
    classifyResult = JSON.parse(classify.stdout)
  }, 360_000)

  afterAll(() => {
    console.log('🧹 Cleaning up S4-T4 classifier test rows...')
    runConvexFn(
      'curatedGeometryTestSupport:teardownS4T4TestRoutes',
      { routeIds: [...MIXED_ROUTE_IDS] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: all 4 routes have rideWorthiness.verdict in ride|marginal|not_a_ride', () => {
    const rows = MIXED_ROUTE_IDS.map((routeId) => {
      const doc = getRoute(routeId)
      expect(doc, `missing route ${routeId}`).toBeTruthy()
      expect(doc.rideWorthiness, `missing rideWorthiness on ${routeId}`).toBeTruthy()
      expect(VERDICTS).toContain(doc.rideWorthiness.verdict)
      return {
        routeId,
        verdict: doc.rideWorthiness.verdict,
        reason: doc.rideWorthiness.reason,
        model: doc.rideWorthiness.model,
        classifiedAt: doc.rideWorthiness.classifiedAt,
      }
    })

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-catalog-verdicts.json'),
      JSON.stringify({ ac: 'AC-1', classifyResult, rows }, null, 2),
    )
  }, 60_000)

  it('MUST_OBSERVE: all rideWorthiness.model == z.ai-glm-5.2 (decorrelated provider stamp)', () => {
    for (const routeId of MIXED_ROUTE_IDS) {
      const doc = getRoute(routeId)
      expect(doc.rideWorthiness?.model).toBe(PROVIDER_STAMP)
      // Provider stamp must NOT be the anchor extraction model
      expect(doc.rideWorthiness?.model).not.toBe('gpt-4.1')
    }
  }, 60_000)

  it('MUST_OBSERVE: all rideWorthiness.classifiedAt > 0 (stored timestamp evidence)', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    for (const routeId of MIXED_ROUTE_IDS) {
      const doc = getRoute(routeId)
      expect(doc.rideWorthiness?.classifiedAt).toBeGreaterThan(0)
      expect(doc.rideWorthiness?.classifiedAt).toBeGreaterThan(oneHourAgo)
      expect(typeof doc.rideWorthiness?.reason).toBe('string')
      expect(doc.rideWorthiness.reason.length).toBeGreaterThan(0)
    }
  }, 60_000)

  it('MUST_OBSERVE: FHWA freeway segment has a verdict (classification not skipped)', () => {
    const freeway = getRoute(FREEWAY_ROUTE_ID)
    expect(freeway?.rideWorthiness).toBeTruthy()
    expect(VERDICTS).toContain(freeway.rideWorthiness.verdict)
  }, 30_000)

  it("MUST_OBSERVE: twisty motorcycle routes have verdict='ride'", () => {
    for (const routeId of TWISTY_ROUTE_IDS) {
      const doc = getRoute(routeId)
      expect(doc.rideWorthiness?.verdict).toBe('ride')
    }
  }, 30_000)

  it('MUST_NOT_OBSERVE: any route with rideWorthiness == null', () => {
    for (const routeId of MIXED_ROUTE_IDS) {
      const doc = getRoute(routeId)
      expect(doc.rideWorthiness).not.toBeNull()
      expect(doc.rideWorthiness).not.toBeUndefined()
    }
  }, 60_000)
})
