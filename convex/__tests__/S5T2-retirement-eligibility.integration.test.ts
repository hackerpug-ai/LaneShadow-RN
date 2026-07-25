/**
 * AC-1: Eligibility requires all three lever failures.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real retirement candidate query)
 * FLOW_REF: UC-REC-05 / T-REC-013
 * start_ref: s5t2-all-levers-failed-vs-pass
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t2-eligibility',
  issuer: 'https://laneshadow.test',
})

const ALL_FAILED_ID = 'test:s5t2-all-failed'
const LEVER2_PASS_ID = 'test:s5t2-lever2-pass'
const REVIEW_ONLY_ID = 'test:s5t2-review-only'

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

function parseJson(stdout: string): any {
  try {
    return JSON.parse(stdout)
  } catch {
    return null
  }
}

describe('AC-1: retirement eligibility requires all three lever failures', () => {
  let candidates: any
  let afterRemove: any
  let allFailedSnap: any
  let passSnap: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t2-eligibility', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'all-levers-failed-vs-pass',
        allFailedRouteId: ALL_FAILED_ID,
        passRouteId: LEVER2_PASS_ID,
        reviewOnlyRouteId: REVIEW_ONLY_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const list = runConvexFn(
      'curatedGeometry:listRetirementCandidates',
      { routeIdPrefix: 'test:s5t2-', limit: 50 },
      { identity: true },
    )
    expect(list.ok, `listRetirementCandidates failed: ${list.stderr}\n${list.stdout}`).toBe(true)
    candidates = parseJson(list.stdout)

    const snapAll = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ALL_FAILED_ID },
      { identity: true },
    )
    allFailedSnap = parseJson(snapAll.stdout)

    const snapPass = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: LEVER2_PASS_ID },
      { identity: true },
    )
    passSnap = parseJson(snapPass.stdout)

    // NEGATIVE CONTROL: remove one lever terminal artifact → becomes ineligible
    const remove = runConvexFn(
      'curatedGeometry:removeLeverTerminalArtifact',
      { routeId: ALL_FAILED_ID, lever: 3 },
      { identity: true },
    )
    expect(remove.ok, `removeLeverTerminalArtifact failed: ${remove.stderr}`).toBe(true)

    const list2 = runConvexFn(
      'curatedGeometry:listRetirementCandidates',
      { routeIdPrefix: 'test:s5t2-', limit: 50 },
      { identity: true },
    )
    afterRemove = parseJson(list2.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-eligibility.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          candidates,
          afterRemove,
          allFailedSnap,
          passSnap,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    // Scoped teardown — only this suite's route IDs (avoid cross-suite races)
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      {
        prefixes: ['test:s5t2-all-failed', 'test:s5t2-lever2-pass', 'test:s5t2-review-only'],
      },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: all-failed route is eligible with lever 1/2/3 failure evidence', () => {
    const rows = candidates?.candidates ?? []
    const allFailed = rows.find((c: any) => c.routeId === ALL_FAILED_ID)
    expect(allFailed, 'all-failed route missing from candidates').toBeTruthy()
    expect(allFailed.eligible).toBe(true)
    const reasons = allFailed.leverFailureReasons ?? []
    expect(reasons.length).toBe(3)
    const levers = reasons.map((r: any) => r.lever).sort()
    expect(levers).toEqual([1, 2, 3])
    expect(candidates.eligibleCandidateCount).toBeGreaterThanOrEqual(1)
  })

  it('MUST_OBSERVE: lever-2 PASS route is absent from candidates and remains pass/rider-ready', () => {
    const rows = candidates?.candidates ?? []
    const passRow = rows.find((c: any) => c.routeId === LEVER2_PASS_ID)
    expect(passRow).toBeUndefined()
    expect(passSnap?.verification?.verdict).toBe('pass')
    expect(passSnap?.riderReady).toBe(true)
    expect(passSnap?.candidateAbsent).toBe(true)
  })

  it('MUST_NOT_OBSERVE: eligibility from geometryStatus=review alone', () => {
    const rows = candidates?.candidates ?? []
    const reviewOnly = rows.find((c: any) => c.routeId === REVIEW_ONLY_ID)
    expect(reviewOnly?.eligible ?? false).toBe(false)
    // Not in eligible list at all
    const eligibleIds = rows.filter((c: any) => c.eligible).map((c: any) => c.routeId)
    expect(eligibleIds).not.toContain(REVIEW_ONLY_ID)
  })

  it('NEGATIVE_CONTROL: remove one lever terminal artifact → all-failed becomes ineligible', () => {
    const rows = afterRemove?.candidates ?? []
    const allFailed = rows.find((c: any) => c.routeId === ALL_FAILED_ID)
    expect(allFailed?.eligible ?? false).toBe(false)
  })
})
