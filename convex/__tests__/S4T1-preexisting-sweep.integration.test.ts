/**
 * AC-6: Pre-existing geometry rows are re-evaluated against the full gate
 *
 * GIVEN a curated_route_geometry row with verification from before gate hardening
 *      (verdict='pass' but off-region anchors)
 * WHEN a re-evaluation sweep runs over pre-existing geometry
 * THEN rows failing the enhanced gate are flipped to verdict='review'
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real pre-existing sweep over curated_route_geometry)
 * FLOW_REF: UC-VER-01
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t1-sweep-test',
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

describe('AC-6: Pre-existing geometry re-evaluated against full gate', () => {
  let preSweepData: any
  let postSweepData: any
  let sweepReport: any

  beforeAll(() => {
    console.log('🌱 Seeding pre-existing off-region geometry...')
    runConvexFn(
      'curatedGeometryTestSupport:seedPreexistingOffRegionGeometry',
      {},
      { identity: true },
    )

    // Verify the seed has verdict='pass' before sweep
    const preVerify = runConvexFn(
      'curatedGeometryTestSupport:getGeometryVerification',
      { routeId: 'test:preexisting-offregion' },
      { identity: true },
    )
    if (preVerify.ok) preSweepData = JSON.parse(preVerify.stdout)

    // Run the sweep
    console.log('🔍 Running pre-existing sweep...')
    const sweepResult = runConvexFn('curatedGeometry:reevaluatePreexistingGeometry', {})
    if (sweepResult.ok) sweepReport = JSON.parse(sweepResult.stdout)

    // Query post-sweep verification
    const postVerify = runConvexFn(
      'curatedGeometryTestSupport:getGeometryVerification',
      { routeId: 'test:preexisting-offregion' },
      { identity: true },
    )
    if (postVerify.ok) postSweepData = JSON.parse(postVerify.stdout)
  }, 180_000)

  afterAll(() => {
    console.log('🧹 Cleaning up...')
    runConvexFn('curatedGeometryTestSupport:teardownS4T1TestRoutes', {}, { identity: true })
  })

  // Pre-condition: the seed row should have verdict='pass' before sweep
  it('PRE-CONDITION: seed row has verdict == "pass" before sweep', () => {
    expect(preSweepData?.verdict).toBe('pass')
  })

  it('PRE-CONDITION: seed row has off-region anchors (distanceFromCentroid > 150)', () => {
    for (const anchor of preSweepData?.anchors ?? []) {
      expect(anchor.distanceFromCentroid).toBeGreaterThan(150)
    }
  })

  // CASE 1: sweep flips off-region rows to review
  it('MUST_OBSERVE: verification.verdict == "review" after sweep', () => {
    expect(postSweepData?.verdict).toBe('review')
  })

  it('MUST_OBSERVE: verification.failedCondition == "anchors"', () => {
    expect(postSweepData?.failedCondition).toBe('anchors')
  })

  it('MUST_OBSERVE: sweep report scanned >= 1 rows', () => {
    expect(sweepReport?.scanned).toBeGreaterThanOrEqual(1)
  })

  it('MUST_OBSERVE: sweep report flipped >= 1 rows', () => {
    expect(sweepReport?.flipped).toBeGreaterThanOrEqual(1)
  })

  it('MUST_NOT_OBSERVE: verification.verdict == "pass" after sweep', () => {
    expect(postSweepData?.verdict).not.toBe('pass')
  })

  // EVIDENCE capture
  it('EVIDENCE: capture pre and post sweep data', () => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })
    writeFileSync(
      resolve(EVIDENCE_DIR, 'ac6-preexisting-sweep.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          preSweep: preSweepData,
          postSweep: postSweepData,
          sweepReport,
        },
        null,
        2,
      ),
    )
    expect(true).toBe(true)
  })
})
