/**
 * REDHAT-FIX-04 AC-3 / TC-3: Non-zero low yield still escalates (regression).
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
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-04/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhatfix04-low-yield',
  issuer: 'https://laneshadow.test',
})

const RUN_ID = 's4t5-redhatfix04-low-yield-nonzero'

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

describe('REDHAT-FIX-04 AC-3: non-zero low yield still escalates (regression)', () => {
  let firstAccept: any
  let afterAccept: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix04-low-yield', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: RUN_ID,
        reconstruct: { candidates: 10, passCount: 1 },
      },
      { identity: true },
    )
    expect(seed.ok, `seed low-yield failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const accept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: RUN_ID, decision: 'accept' },
      { identity: true },
    )
    expect(accept.ok, `requestBatchAcceptance failed: ${accept.stderr}\n${accept.stdout}`).toBe(
      true,
    )
    firstAccept = JSON.parse(accept.stdout)

    const q = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: RUN_ID },
      { identity: true },
    )
    expect(q.ok).toBe(true)
    afterAccept = JSON.parse(q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-nonzero-low-yield-regression.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), firstAccept, afterAccept }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-3: Low non-zero reconstruct rate still escalates', () => {
    expect(firstAccept.decision).toBe('escalation_required')
    expect(firstAccept.decision).not.toBe('accepted')
    expect(firstAccept.escalations?.length).toBeGreaterThanOrEqual(1)

    const recon = firstAccept.escalations.find(
      (e: any) => e.lever === 'reconstruct' || e.leverNumber === 2,
    )
    expect(recon).toBeTruthy()
    expect(recon.lever).toBe('reconstruct')
    expect(recon.passCount).toBe(1)
    expect(recon.candidates ?? recon.candidateCount).toBe(10)
    expect(recon.observedRate ?? recon.realizedRate).toBeCloseTo(0.1, 5)

    expect(firstAccept.retirementUnlockedAt ?? afterAccept.retirementUnlockedAt).toBeNull()
    expect(afterAccept.retirementUnlockedAt).toBeNull()
  })
})
