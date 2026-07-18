/**
 * AC-4: Lever 3 sends gate-failing routes to REVIEW queue (terminal state)
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real Lever 3 + REVIEW queue)
 * FLOW_REF: UC-REC-03
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t2-lever3-review-test',
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
      timeout: 300000,
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

describe('AC-4: Lever 3 failure routes to REVIEW (terminal)', () => {
  let rerouteResult: any
  let reviewQueue: any
  let verificationData: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    const seed = runConvexFn(
      'curatedGeometryReconstruct:seedLever3Fixtures',
      {},
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}`).toBe(true)

    const reroute = runConvexFn(
      'curatedGeometryReconstruct:rerouteForRoute',
      { routeId: 'test:lever3-fail' },
      { identity: true },
    )
    expect(reroute.ok, `reroute failed: ${reroute.stderr}\n${reroute.stdout}`).toBe(true)
    rerouteResult = JSON.parse(reroute.stdout)

    const verify = runConvexFn(
      'curatedGeometryReconstruct:getVerificationForRoute',
      { routeId: 'test:lever3-fail' },
      { identity: true },
    )
    verificationData = verify.ok ? JSON.parse(verify.stdout) : null

    const queue = runConvexFn(
      'curatedGeometryReconstruct:listGeometryReviewQueue',
      { routeIdPrefix: 'test:lever3-fail', limit: 20 },
      { identity: true },
    )
    reviewQueue = queue.ok ? JSON.parse(queue.stdout) : null

    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac4-lever3-failure-to-review.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          rerouteResult,
          verificationData,
          reviewQueue,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('curatedGeometryReconstruct:teardownLeverTestRoutes', {}, { identity: true })
  })

  // TC-6
  it('TC-6 MUST_OBSERVE: reviewQueue.length == 1 AND failedCondition != null', () => {
    expect(reviewQueue?.length).toBeGreaterThanOrEqual(1)
    const entry = (reviewQueue?.reviewQueue ?? []).find(
      (r: any) => r.routeId === 'test:lever3-fail',
    )
    expect(entry).toBeTruthy()
    expect(entry.failedCondition).not.toBeNull()
    expect(entry.failedCondition).toBeTruthy()
  })

  it('MUST_OBSERVE: disposition is review (terminal)', () => {
    expect(rerouteResult?.disposition).toBe('review')
    expect(rerouteResult?.queuedForReview).toBe(true)
  })

  it('MUST_NOT_OBSERVE: route queued for next lever', () => {
    expect(rerouteResult?.queuedForLever2).toBe(false)
    expect(rerouteResult?.nextLever).toBeUndefined()
  })

  it('MUST_NOT_OBSERVE: geometry stored with verdict=pass', () => {
    expect(verificationData?.verdict).not.toBe('pass')
    expect(rerouteResult?.verdict).not.toBe('pass')
  })
})
