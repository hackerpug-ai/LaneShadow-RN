/**
 * REDHAT-FIX-02 remediation: resolveBatchEscalation must not unlock retirement
 * without runFullBatch provenance (SEED_SUBSTITUTION bypass).
 *
 * Attack: seed low-yield (no provenance) → requestBatchAcceptance →
 * resolve(accept) previously unlocked retirement on a fixture.
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

const CLERK_USER = 's4t5-redhatfix02-resolve-prov'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const RUN_ID = `redhatfix02-seed-resolve-${Date.now()}`

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

describe('REDHAT-FIX-02: resolveBatchEscalation requires runFullBatch provenance', () => {
  let escalateResult: any
  let resolveResult: RunResult
  let afterResolve: any
  let lock: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}\n${setup.stdout}`).toBe(true)

    // Seed-only low-yield coverage_report (intentionally NO reportProvenance)
    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: RUN_ID,
        reconstruct: { candidates: 10, passCount: 1 },
      },
      { identity: true },
    )
    expect(seed.ok, `seedS5T1LowYieldReport failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    // Low-yield path still opens escalation without unlocking
    const accept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: RUN_ID, decision: 'accept' },
      { identity: true },
    )
    expect(accept.ok, `requestBatchAcceptance failed: ${accept.stderr}\n${accept.stdout}`).toBe(
      true,
    )
    escalateResult = parseJson(accept.stdout)
    expect(escalateResult?.decision).toBe('escalation_required')
    expect(escalateResult?.retirementUnlockedAt ?? null).toBeNull()

    // SEED_SUBSTITUTION bypass: resolve(accept) MUST fail-closed
    resolveResult = runConvexFn(
      'curatedGeometry:resolveBatchEscalation',
      {
        runId: RUN_ID,
        decision: 'accept',
        rationale: 'Attempt to unlock retirement via unprovenanced seed fixture (must fail).',
      },
      { identity: true },
    )

    const q = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: RUN_ID },
      { identity: true },
    )
    afterResolve = q.ok ? parseJson(q.stdout) : null

    const lockQ = runConvexFn(
      'curatedGeometry:retirementLockStatus',
      { runId: RUN_ID },
      { identity: true },
    )
    lock = lockQ.ok ? parseJson(lockQ.stdout) : null

    writeFileSync(
      resolve(EVIDENCE_DIR, 'resolve-escalation-provenance-reject.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          RUN_ID,
          escalateResult,
          resolveOk: resolveResult.ok,
          resolveStdout: resolveResult.stdout,
          resolveStderr: resolveResult.stderr,
          errorCode: extractErrorCode(resolveResult),
          afterResolve,
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

  it('seed-only low-yield → escalate → resolve(accept) fails and leaves retirementUnlockedAt null', () => {
    expect(resolveResult.ok).toBe(false)
    const code = extractErrorCode(resolveResult)
    expect(code === 'NOT_PROVENANCED' || code === 'VALIDATION_ERROR').toBe(true)

    expect(afterResolve?.decision).not.toBe('accepted')
    // Escalation remains open (or at least unlock was not recorded)
    expect(afterResolve?.retirementUnlockedAt ?? null).toBeNull()
    expect(lock?.retirementUnlockedAt ?? null).toBeNull()
    expect(lock?.locked ?? true).toBe(true)
  })
})
