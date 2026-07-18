/**
 * AC-3: Gate rejects degenerate geometry (≤4 points OR <1 pt/mi)
 *
 * GIVEN a routed polyline with 3 points and routedMiles=10
 * WHEN the gate evaluates point count and density
 * THEN verdict is 'review' with failedCondition='degenerate' because pointCount ≤ 4
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real isDegenerate + determineGateVerdict)
 * FLOW_REF: UC-VER-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t1-degenerate-test',
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

describe('AC-3: Gate rejects degenerate geometry', () => {
  beforeAll(() => {
    console.log('🌱 Seeding degenerate rows...')
    runConvexFn('curatedGeometryTestSupport:seedDegenerateRows', {}, { identity: true })
  }, 120_000)

  afterAll(() => {
    console.log('🧹 Cleaning up...')
    runConvexFn('curatedGeometryTestSupport:teardownAllTestRoutes', {}, { identity: true })
  })

  // CASE 1 / TC-6: isDegenerate returns true for pointCount <= 4
  describe('TC-6: 3-point line is degenerate → review', () => {
    let verificationData: any

    beforeAll(() => {
      runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:degenerate-2pt',
          pointCount: 3,
          routedMiles: 10,
        },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:degenerate-2pt' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: degenerate == true', () => {
      expect(verificationData?.degenerate).toBe(true)
    })

    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(verificationData?.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "degenerate"', () => {
      expect(verificationData?.failedCondition).toBe('degenerate')
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).not.toBe('pass')
    })
  })

  // CASE 2 / TC-7: isDegenerate returns true for pointCount < routedMiles (<1 pt/mi)
  describe('TC-7: 5 points over 10 miles (<1 pt/mi) is degenerate → review', () => {
    let verificationData: any

    beforeAll(() => {
      runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:degenerate-10pt-50mi',
          pointCount: 5,
          routedMiles: 10,
        },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:degenerate-10pt-50mi' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: degenerate == true', () => {
      expect(verificationData?.degenerate).toBe(true)
    })

    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(verificationData?.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "degenerate"', () => {
      expect(verificationData?.failedCondition).toBe('degenerate')
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).not.toBe('pass')
    })
  })

  // CASE 3: non-degenerate valid geometry → pass
  describe('CASE 3: 50 points over 41 miles is NOT degenerate', () => {
    let verificationData: any

    beforeAll(() => {
      runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:degenerate-2pt',
          pointCount: 50,
          routedMiles: 41,
        },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:degenerate-2pt' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: degenerate == false', () => {
      expect(verificationData?.degenerate).toBe(false)
    })

    it('MUST_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).toBe('pass')
    })

    it('MUST_NOT_OBSERVE: failedCondition == "degenerate"', () => {
      expect(verificationData?.failedCondition).not.toBe('degenerate')
    })
  })

  // EVIDENCE capture
  it('EVIDENCE: capture degenerate verification data', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const verify = runConvexFn(
      'curatedGeometryReconstruct:getVerificationForRoute',
      { routeId: 'test:degenerate-2pt' },
      { identity: true },
    )
    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac3-degenerate.json'),
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
