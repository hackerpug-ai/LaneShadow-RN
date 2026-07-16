/**
 * AC-5: Bounded repair round limits attempts to 2 and keeps better attempt by ratio distance
 *
 * GIVEN a reconstruction with first attempt ratio=0.5 (fails gate), second attempt ratio=0.9
 * WHEN repair round runs with geocode log feedback and selects better attempt
 * THEN second attempt is stored (ratio distance |log(0.9)|=0.11 is closer to 0 than |log(0.5)|=0.69)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real reconstructForRouteWithSimulatedRepair)
 * FLOW_REF: UC-VER-02
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t1-repair-test',
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

describe('AC-5: Bounded repair round (2 attempts max, keep better by ratio distance)', () => {
  beforeAll(() => {
    console.log('🌱 Seeding repair round routes...')
    runConvexFn('curatedGeometryTestSupport:seedRepairRoundRoute', {}, { identity: true })
    runConvexFn('curatedGeometryTestSupport:seedRepairExhaustedRoute', {}, { identity: true })
  }, 120_000)

  afterAll(() => {
    console.log('🧹 Cleaning up...')
    runConvexFn('curatedGeometryTestSupport:teardownS4T1TestRoutes', {}, { identity: true })
  })

  // CASE 1 / TC-9 + TC-10: first fails (0.5), second passes (0.9) → keep second
  describe('CASE 1: first attempt ratio=0.5 fails, second ratio=0.9 better', () => {
    let actionResult: any

    beforeAll(() => {
      const result = runConvexFn(
        'curatedGeometryTestSupport:runSimulatedRepair',
        {
          routeId: 'test:repair-round',
          firstAttemptRoutedMiles: 50, // ratio=50/100=0.5 → fails (below 0.6)
          secondAttemptRoutedMiles: 90, // ratio=90/100=0.9 → passes
          claimedMiles: 100,
          pointCount: 100, // >= max(50, 90) to avoid degenerate on either attempt
        },
        { identity: true },
      )
      if (result.ok) actionResult = JSON.parse(result.stdout)
    })

    // TC-9: routingCallCount is bounded to exactly 2
    it('TC-9: MUST_OBSERVE: routingCallCount == 2', () => {
      expect(actionResult?.routingCallCount).toBe(2)
    })

    it('MUST_NOT_OBSERVE: routingCallCount > 2', () => {
      expect(actionResult?.routingCallCount).not.toBeGreaterThan(2)
    })

    // TC-10: better attempt stored by ratio distance
    it('TC-10: MUST_OBSERVE: storedRatio == 0.9 (better attempt)', () => {
      expect(actionResult?.storedRatio).toBeCloseTo(0.9, 1)
    })

    it('MUST_OBSERVE: firstAttemptRatio == 0.5', () => {
      expect(actionResult?.firstAttemptRatio).toBeCloseTo(0.5, 1)
    })

    it('MUST_OBSERVE: secondAttemptRatio == 0.9', () => {
      expect(actionResult?.secondAttemptRatio).toBeCloseTo(0.9, 1)
    })

    it('MUST_OBSERVE: storedRatio == secondAttemptRatio (better kept)', () => {
      expect(actionResult?.storedRatio).toBe(actionResult?.secondAttemptRatio)
    })

    it('MUST_OBSERVE: verdict == "pass" (second attempt passed gate)', () => {
      expect(actionResult?.verdict).toBe('pass')
    })
  })

  // CASE 2: both attempts fail gate → verdict='review', routingCallCount=2
  describe('CASE 2: both attempts fail gate → verdict review', () => {
    let actionResult: any

    beforeAll(() => {
      const result = runConvexFn(
        'curatedGeometryTestSupport:runSimulatedRepair',
        {
          routeId: 'test:repair-exhausted',
          firstAttemptRoutedMiles: 30, // ratio=0.3 → fails
          secondAttemptRoutedMiles: 40, // ratio=0.4 → still fails (<0.6)
          claimedMiles: 100,
          pointCount: 100,
        },
        { identity: true },
      )
      if (result.ok) actionResult = JSON.parse(result.stdout)
    })

    it('TC-9: MUST_OBSERVE: routingCallCount == 2 (exactly 2 attempts)', () => {
      expect(actionResult?.routingCallCount).toBe(2)
    })

    it('MUST_OBSERVE: verdict == "review"', () => {
      expect(actionResult?.verdict).toBe('review')
    })

    it('MUST_OBSERVE: failedCondition == "ratio"', () => {
      expect(actionResult?.failedCondition).toBe('ratio')
    })

    it('MUST_OBSERVE: storedRatio == better attempt (0.4, closer to 0.6 than 0.3)', () => {
      expect(actionResult?.storedRatio).toBeCloseTo(0.4, 1)
    })

    it('MUST_NOT_OBSERVE: routingCallCount > 2', () => {
      expect(actionResult?.routingCallCount).not.toBeGreaterThan(2)
    })

    it('MUST_NOT_OBSERVE: verdict == "pass"', () => {
      expect(actionResult?.verdict).not.toBe('pass')
    })
  })

  // EVIDENCE capture
  it('EVIDENCE: capture repair round result', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const verify = runConvexFn(
      'curatedGeometryReconstruct:getVerificationForRoute',
      { routeId: 'test:repair-round' },
      { identity: true },
    )
    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac5-repair-round-bounded.json'),
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
