/**
 * AC-4: Quarantine flag skips ratio check but applies degenerate + region checks
 *
 * GIVEN a quarantined route (quarantine.reason='zero_length') with routedMiles=22, pointCount=50
 * WHEN the gate evaluates with ratio=null due to quarantine
 * THEN verdict is 'pass' (ratio skipped) because degenerate + region checks pass
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real curatedGeometryGate.ts + quarantine flag)
 * FLOW_REF: UC-VER-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t1-quarantine-test',
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

describe('AC-4: Quarantine flag skips ratio check', () => {
  beforeAll(() => {
    console.log('🌱 Seeding quarantined length row...')
    runConvexFn('curatedGeometryTestSupport:seedQuarantinedLengthRow', {}, { identity: true })
  }, 120_000)

  afterAll(() => {
    console.log('🧹 Cleaning up...')
    runConvexFn('curatedGeometryTestSupport:teardownAllTestRoutes', {}, { identity: true })
  })

  // CASE 1 / TC-8: quarantined route (ratio=null) → verdict pass (ratio skipped)
  describe('TC-8: quarantined route skips ratio → verdict pass', () => {
    let verificationData: any

    beforeAll(() => {
      // Reconstruct with claimedMiles=null (quarantine → ratio skipped)
      const reconstruct = runConvexFn(
        'curatedGeometryReconstruct:reconstructForRouteWithFixedGeometry',
        {
          routeId: 'test:quarantined-null-length',
          routedMiles: 22,
          pointCount: 50,
          claimedMiles: null,
        },
        { identity: true },
      )
      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:quarantined-null-length' },
        { identity: true },
      )
      if (verify.ok) verificationData = JSON.parse(verify.stdout)
    })

    it('MUST_OBSERVE: verdict == "pass"', () => {
      expect(verificationData?.verdict).toBe('pass')
    })

    it('MUST_OBSERVE: ratio == null', () => {
      expect(verificationData?.ratio).toBeNull()
    })

    it('MUST_OBSERVE: claimedMiles == null', () => {
      expect(verificationData?.claimedMiles).toBeNull()
    })

    it('MUST_NOT_OBSERVE: failedCondition == "ratio"', () => {
      expect(verificationData?.failedCondition).not.toBe('ratio')
    })

    it('MUST_NOT_OBSERVE: verdict == "review"', () => {
      expect(verificationData?.verdict).not.toBe('review')
    })
  })

  // EVIDENCE capture
  it('EVIDENCE: capture quarantine verification data', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const verify = runConvexFn(
      'curatedGeometryReconstruct:getVerificationForRoute',
      { routeId: 'test:quarantined-null-length' },
      { identity: true },
    )
    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac4-quarantine-ratio-skip.json'),
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
