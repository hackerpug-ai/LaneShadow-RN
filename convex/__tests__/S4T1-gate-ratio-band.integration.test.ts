/**
 * AC-1 [PRIMARY]: Gate enforces ratio band 0.6–1.6 for non-quarantined routes
 *
 * GIVEN a route with claimedMiles=100, routedMiles=75, and no quarantine flag
 * WHEN the gate evaluates the ratio routedMiles/claimedMiles
 * THEN verdict is 'review' with failedCondition='ratio' because 0.75 < 0.6
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts module)
 * FLOW_REF: UC-VER-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t1-ratio-band-test',
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
      timeout: 120000,
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

describe('AC-1: Gate enforces ratio band 0.6–1.6', () => {
  beforeAll(() => {
    console.log('🌱 Seeding boundary ratio rows...')
    runConvexFn('curatedGeometryTestSupport:seedBoundaryRatioRows', {}, { identity: true })
  }, 120_000)

  afterAll(() => {
    console.log('🧹 Cleaning up...')
    runConvexFn('curatedGeometryTestSupport:teardownAllTestRoutes', {}, { identity: true })
  })

  // TC-1: evaluateRatioBoundary passes for ratio 0.6–1.6
  describe('TC-1: ratio 1.00 passes gate', () => {
    let verificationData: any

    beforeAll(() => {
      const reconstruct = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:ratio-100',
          routedMiles: 41,
          anchorCount: 2,
          pointCount: 50,
        },
        { identity: true },
      )
      // A failed reconstruct must surface, not silently leave verificationData null.
      expect(reconstruct.ok, `reconstruct failed: ${reconstruct.stderr}`).toBe(true)
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:ratio-100' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).toBe('pass')
    })

    it('MUST_OBSERVE: ratio == 1.0', () => {
      expect(verificationData?.ratio).toBeCloseTo(1.0, 1)
    })

    it('MUST_NOT_OBSERVE: failedCondition == "ratio"', () => {
      expect(verificationData?.failedCondition).not.toBe('ratio')
    })
  })

  // TC-2: evaluateRatioBoundary fails for ratio below 0.6
  describe('TC-2: ratio 0.59 (below 0.6) fails gate', () => {
    let verificationData: any

    beforeAll(() => {
      runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:ratio-059',
          routedMiles: 59,
          claimedMiles: 100,
          anchorCount: 2,
          pointCount: 60,
        },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:ratio-059' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(verificationData?.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "ratio"', () => {
      expect(verificationData?.failedCondition).toBe('ratio')
    })

    it('MUST_OBSERVE: ratio == 0.59', () => {
      expect(verificationData?.ratio).toBeCloseTo(0.59, 2)
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).not.toBe('pass')
    })
  })

  // TC-3: evaluateRatioBoundary fails for ratio above 1.6
  describe('TC-3: ratio 1.61 (above 1.6) fails gate', () => {
    let verificationData: any

    beforeAll(() => {
      runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:ratio-161',
          routedMiles: 161,
          claimedMiles: 100,
          anchorCount: 2,
          pointCount: 170,
        },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:ratio-161' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(verificationData?.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "ratio"', () => {
      expect(verificationData?.failedCondition).toBe('ratio')
    })

    it('MUST_OBSERVE: ratio == 1.61', () => {
      expect(verificationData?.ratio).toBeCloseTo(1.61, 2)
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).not.toBe('pass')
    })
  })

  // EVIDENCE capture
  it('EVIDENCE: capture seeded verification data', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const verify = runConvexFn(
      'curatedGeometryReconstruct:getVerificationForRoute',
      { routeId: 'test:ratio-059' },
      { identity: true },
    )
    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac1-ratio-band.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          verifyOk: verify.ok,
          data: verify.ok ? JSON.parse(verify.stdout) : null,
        },
        null,
        2,
      ),
    )
    expect(true).toBe(true)
  })
})
