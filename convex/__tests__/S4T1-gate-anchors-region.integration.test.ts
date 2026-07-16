/**
 * AC-2: Gate requires ≥2 anchors within 150mi of centroid
 *
 * GIVEN a reconstruction with 1 geocoded anchor within 150mi and 2 off-region
 * WHEN the gate evaluates anchor count and region compliance
 * THEN verdict is 'review' with failedCondition='anchors' because anchorCount < 2
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + isAnchorInRegion)
 * FLOW_REF: UC-VER-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t1-anchors-test',
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

describe('AC-2: Gate requires ≥2 anchors within 150mi', () => {
  beforeAll(() => {
    console.log('🌱 Seeding anchor test routes...')
    runConvexFn('curatedGeometryTestSupport:seedAnchorTestRoutes', {}, { identity: true })
  }, 120_000)

  afterAll(() => {
    console.log('🧹 Cleaning up...')
    runConvexFn('curatedGeometryTestSupport:teardownAllTestRoutes', {}, { identity: true })
  })

  // CASE 1: sufficient anchors (2 in region) → verdict pass
  describe('CASE 1: 2 in-region anchors → pass', () => {
    let verificationData: any

    beforeAll(() => {
      runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:mixed-anchors',
          routedMiles: 41,
          anchorCount: 2,
          pointCount: 50,
        },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:mixed-anchors' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).toBe('pass')
    })

    it('MUST_NOT_OBSERVE: failedCondition == "anchors"', () => {
      expect(verificationData?.failedCondition).not.toBe('anchors')
    })
  })

  // CASE 2 / TC-4: insufficient anchors (1 anchor) → verdict review
  describe('TC-4: 1 anchor → review with failedCondition "anchors"', () => {
    let actionResult: any
    let verificationData: any

    beforeAll(() => {
      const reconstruct = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedAnchors',
        { routeId: 'test:single-anchor', anchorCount: 1, claimedMiles: 41 },
        { identity: true },
      )
      if (reconstruct.ok) actionResult = JSON.parse(reconstruct.stdout)
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:single-anchor' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: routingCallCount == 0 (no routing when anchors < 2)', () => {
      expect(actionResult?.routingCallCount).toBe(0)
    })

    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(verificationData?.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "anchors"', () => {
      expect(verificationData?.failedCondition).toBe('anchors')
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).not.toBe('pass')
    })
  })

  // CASE 3 / TC-5: off-region anchor (300mi) rejected by isAnchorInRegion
  describe('TC-5: off-region anchor (300mi) excluded', () => {
    let verificationData: any

    beforeAll(() => {
      runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithMixedAnchors',
        { routeId: 'test:mixed-anchors', inRegionCount: 2, offRegionCount: 2 },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:mixed-anchors' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    }, 120_000)

    it('MUST_OBSERVE: all stored anchors have distanceFromCentroid <= 150', () => {
      for (const anchor of verificationData?.anchors ?? []) {
        expect(anchor.distanceFromCentroid).toBeLessThanOrEqual(150)
      }
    })

    it('MUST_OBSERVE: anchorCount >= 2 (only in-region survive)', () => {
      expect(verificationData?.anchorCount).toBeGreaterThanOrEqual(2)
    })
  })

  // EVIDENCE capture
  it('EVIDENCE: capture anchor verification data', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const verify = runConvexFn(
      'curatedGeometryReconstruct:getVerificationForRoute',
      { routeId: 'test:single-anchor' },
      { identity: true },
    )
    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac2-anchors-region.json'),
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
