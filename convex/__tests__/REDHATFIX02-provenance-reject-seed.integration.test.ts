/**
 * REDHAT-FIX-02 AC-3 / TC-3: Fixture/seed coverage_report cannot satisfy acceptance.
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

const CLERK_USER = 's4t5-redhatfix02-prov'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const RUN_ID = `redhatfix02-seeded-${Date.now()}`

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
  // ConvexError: {"code":"NOT_PROVENANCED",...}
  const m = blob.match(/"code"\s*:\s*"([A-Z_]+)"/)
  return m?.[1] ?? null
}

describe('REDHAT-FIX-02 AC-3: seed coverage_report rejected without provenance', () => {
  let acceptResult: RunResult
  let afterAccept: any
  let lock: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}\n${setup.stdout}`).toBe(true)

    // High-yield seed-only fixture (would clean-accept without provenance gate)
    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: RUN_ID,
        reconstruct: { candidates: 10, passCount: 8 },
      },
      { identity: true },
    )
    expect(seed.ok, `seedS5T1LowYieldReport failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    acceptResult = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: RUN_ID, decision: 'accept' },
      { identity: true },
    )

    const q = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: RUN_ID },
      { identity: true },
    )
    afterAccept = q.ok ? parseJson(q.stdout) : null

    const lockQ = runConvexFn(
      'curatedGeometry:retirementLockStatus',
      { runId: RUN_ID },
      { identity: true },
    )
    lock = lockQ.ok ? parseJson(lockQ.stdout) : null

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-provenance-reject-seed.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          RUN_ID,
          acceptOk: acceptResult.ok,
          acceptStdout: acceptResult.stdout,
          acceptStderr: acceptResult.stderr,
          errorCode: extractErrorCode(acceptResult),
          afterAccept,
          lock,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-3: requestBatchAcceptance rejects seed-only coverage_report lacking runFullBatch provenance', () => {
    // Must fail closed with provenance error (not silent accept)
    expect(acceptResult.ok).toBe(false)
    const code = extractErrorCode(acceptResult)
    expect(code === 'NOT_PROVENANCED' || code === 'VALIDATION_ERROR').toBe(true)

    const decision = afterAccept?.decision ?? null
    expect(decision).not.toBe('accepted')
    expect(afterAccept?.retirementUnlockedAt ?? null).toBeNull()
    expect(lock?.retirementUnlockedAt ?? null).toBeNull()
  })
})
