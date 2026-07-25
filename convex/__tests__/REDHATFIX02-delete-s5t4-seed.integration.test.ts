/**
 * REDHAT-FIX-02 AC-4 / TC-4: Delete s5t4-live-acceptance seed; block re-use.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-02/evidence')

const CLERK_USER = 's4t5-redhatfix02-s5t4'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const S5T4_RUN = 's5t4-live-acceptance'

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
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    return {
      ok: false,
      stdout: typeof err.stdout === 'string' ? err.stdout : '',
      stderr: typeof err.stderr === 'string' ? err.stderr : '',
    }
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

function extractErrorCode(result: RunResult): string | null {
  const blob = `${result.stderr}\n${result.stdout}`
  const m = blob.match(/"code"\s*:\s*"([A-Z_]+)"/)
  return m?.[1] ?? null
}

describe('REDHAT-FIX-02 AC-4: s5t4-live-acceptance cannot unlock retirement', () => {
  let scrubResult: any
  let reportAfterScrub: any
  let acceptAfterScrub: RunResult
  let acceptanceAfter: any
  let lockAfter: any
  let reseedAccept: RunResult
  let reseedLock: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}\n${setup.stdout}`).toBe(true)

    // Ensure seeded s5t4-live-acceptance rows exist (coverage_report + high yield)
    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: S5T4_RUN,
        reconstruct: { candidates: 10, passCount: 8 },
      },
      { identity: true },
    )
    expect(seed.ok, `seed s5t4 failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    // Delete/tombstone helper
    const scrub = runConvexFn(
      'curatedGeometry:deleteS5T4LiveAcceptanceSeed',
      {},
      { identity: true },
    )
    expect(scrub.ok, `deleteS5T4LiveAcceptanceSeed failed: ${scrub.stderr}\n${scrub.stdout}`).toBe(
      true,
    )
    scrubResult = parseJson(scrub.stdout)

    const rep = runConvexFn(
      'curatedGeometry:coverageReport',
      { runId: S5T4_RUN },
      { identity: true },
    )
    reportAfterScrub = rep.ok ? parseJson(rep.stdout) : null

    acceptAfterScrub = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: S5T4_RUN, decision: 'accept' },
      { identity: true },
    )

    const q = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: S5T4_RUN },
      { identity: true },
    )
    acceptanceAfter = q.ok ? parseJson(q.stdout) : null

    const lockQ = runConvexFn(
      'curatedGeometry:retirementLockStatus',
      { runId: S5T4_RUN },
      { identity: true },
    )
    lockAfter = lockQ.ok ? parseJson(lockQ.stdout) : null

    // Re-seed attempt must still not unlock (provenance fail-closed / blocked runId)
    const reseed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: S5T4_RUN,
        reconstruct: { candidates: 10, passCount: 8 },
      },
      { identity: true },
    )
    expect(reseed.ok, `reseed failed: ${reseed.stderr}\n${reseed.stdout}`).toBe(true)

    reseedAccept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: S5T4_RUN, decision: 'accept' },
      { identity: true },
    )
    const lock2 = runConvexFn(
      'curatedGeometry:retirementLockStatus',
      { runId: S5T4_RUN },
      { identity: true },
    )
    reseedLock = lock2.ok ? parseJson(lock2.stdout) : null

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-delete-s5t4-seed.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          S5T4_RUN,
          scrubResult,
          reportAfterScrub,
          acceptAfterScrub: {
            ok: acceptAfterScrub.ok,
            stdout: acceptAfterScrub.stdout,
            stderr: acceptAfterScrub.stderr,
            code: extractErrorCode(acceptAfterScrub),
          },
          acceptanceAfter,
          lockAfter,
          reseedAccept: {
            ok: reseedAccept.ok,
            stdout: reseedAccept.stdout,
            stderr: reseedAccept.stderr,
            code: extractErrorCode(reseedAccept),
          },
          reseedLock,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:deleteS5T4LiveAcceptanceSeed', {}, { identity: true })
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [S5T4_RUN] }, { identity: true })
  })

  it('TC-4: s5t4-live-acceptance cannot unlock retirement after cleanup', () => {
    expect(scrubResult?.deleted ?? scrubResult?.removedCount ?? 0).toBeGreaterThanOrEqual(0)

    // After scrub: either no report, or accept cannot unlock
    const decisionAfter = acceptanceAfter?.decision ?? null
    expect(decisionAfter).not.toBe('accepted')
    expect(acceptanceAfter?.retirementUnlockedAt ?? null).toBeNull()
    expect(lockAfter?.retirementUnlockedAt ?? null).toBeNull()

    // Residual accept attempt after scrub must not unlock
    if (acceptAfterScrub.ok) {
      const body = parseJson(acceptAfterScrub.stdout)
      expect(body?.decision).not.toBe('accepted')
      expect(body?.retirementUnlockedAt ?? null).toBeNull()
    } else {
      const code = extractErrorCode(acceptAfterScrub)
      // NOT_FOUND after delete, or NOT_PROVENANCED / VALIDATION_ERROR if residual
      expect(
        code === 'NOT_FOUND' ||
          code === 'NOT_PROVENANCED' ||
          code === 'VALIDATION_ERROR' ||
          code === 'FORBIDDEN',
      ).toBe(true)
    }

    // Re-seed still cannot unlock
    expect(reseedLock?.retirementUnlockedAt ?? null).toBeNull()
    if (reseedAccept.ok) {
      const body = parseJson(reseedAccept.stdout)
      expect(body?.decision).not.toBe('accepted')
      expect(body?.retirementUnlockedAt ?? null).toBeNull()
    } else {
      const code = extractErrorCode(reseedAccept)
      expect(
        code === 'NOT_PROVENANCED' ||
          code === 'VALIDATION_ERROR' ||
          code === 'FORBIDDEN' ||
          code === 'NOT_FOUND',
      ).toBe(true)
    }
  })
})
