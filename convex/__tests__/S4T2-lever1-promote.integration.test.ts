/**
 * AC-1 [PRIMARY]: Lever 1 decodes and length-validates in-row polyline,
 * promoting gate-passing rows with provenance='scraped_promoted'
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Lever 1 promotion path)
 * FLOW_REF: UC-REC-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t2-lever1-promote-test',
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
      timeout: 180000,
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

describe('AC-1: Lever 1 promote scraped_promoted', () => {
  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const seed = runConvexFn(
      'curatedGeometryReconstruct:seedLever1Fixtures',
      {},
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
  }, 120_000)

  afterAll(() => {
    runConvexFn('curatedGeometryReconstruct:teardownLeverTestRoutes', {}, { identity: true })
  })

  // TC-1: Lever 1 promotes gate-passing in-row polylines with provenance scraped_promoted
  describe('TC-1: promote gate-passing in-row polyline', () => {
    let promoteResult: any
    let verificationData: any

    beforeAll(() => {
      const promote = runConvexFn(
        'curatedGeometryReconstruct:promoteForRoute',
        { routeId: 'test:lever1-pass' },
        { identity: true },
      )
      expect(promote.ok, `promote failed: ${promote.stderr}\n${promote.stdout}`).toBe(true)
      promoteResult = JSON.parse(promote.stdout)

      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:lever1-pass' },
        { identity: true },
      )
      expect(verify.ok, `verify failed: ${verify.stderr}`).toBe(true)
      verificationData = JSON.parse(verify.stdout)

      writeFileSync(
        resolve(EVIDENCE_DIR, 'ac1-lever1-promote-pass.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            promoteResult,
            verificationData,
          },
          null,
          2,
        ),
      )
    }, 120_000)

    it('MUST_OBSERVE: verification.verdict == "pass"', () => {
      expect(verificationData?.verdict).toBe('pass')
    })

    it('MUST_OBSERVE: verification.provenance == "scraped_promoted"', () => {
      expect(verificationData?.provenance).toBe('scraped_promoted')
    })

    it('MUST_OBSERVE: verification.routedMiles ≈ 41', () => {
      expect(verificationData?.routedMiles).toBeGreaterThan(35)
      expect(verificationData?.routedMiles).toBeLessThan(50)
    })

    it('MUST_NOT_OBSERVE: verification.verdict == "review"', () => {
      expect(verificationData?.verdict).not.toBe('review')
    })

    it('MUST_NOT_OBSERVE: verification.provenance == null', () => {
      expect(verificationData?.provenance).toBeTruthy()
    })

    it('promote disposition is generated with $0 (llmCallCount=0)', () => {
      expect(promoteResult?.disposition).toBe('generated')
      expect(promoteResult?.llmCallCount).toBe(0)
    })
  })

  // TC-2: Lever 1 rejects gate-failing in-row polylines
  describe('TC-2: reject gate-failing in-row polyline', () => {
    let promoteResult: any
    let verificationData: any

    beforeAll(() => {
      const promote = runConvexFn(
        'curatedGeometryReconstruct:promoteForRoute',
        { routeId: 'test:lever1-fail' },
        { identity: true },
      )
      expect(promote.ok, `promote failed: ${promote.stderr}\n${promote.stdout}`).toBe(true)
      promoteResult = JSON.parse(promote.stdout)

      const verify = runConvexFn(
        'curatedGeometryReconstruct:getVerificationForRoute',
        { routeId: 'test:lever1-fail' },
        { identity: true },
      )
      // Convex may print empty string or "null" when the side-table row is absent.
      verificationData =
        verify.ok && verify.stdout.trim() && verify.stdout.trim() !== 'null'
          ? JSON.parse(verify.stdout)
          : null

      writeFileSync(
        resolve(EVIDENCE_DIR, 'ac1-lever1-promote-fail.json'),
        JSON.stringify(
          {
            capturedAt: new Date().toISOString(),
            promoteResult,
            verificationData,
          },
          null,
          2,
        ),
      )
    }, 120_000)

    it('MUST_OBSERVE: not stored as pass / disposition next_lever', () => {
      expect(promoteResult?.disposition).toBe('next_lever')
      expect(promoteResult?.queuedForLever2).toBe(true)
    })

    it('MUST_NOT_OBSERVE: verification.verdict == "pass"', () => {
      expect(verificationData?.verdict).not.toBe('pass')
    })

    it('MUST_NOT_OBSERVE: verification.provenance == "scraped_promoted"', () => {
      expect(verificationData?.provenance).not.toBe('scraped_promoted')
    })
  })
})
