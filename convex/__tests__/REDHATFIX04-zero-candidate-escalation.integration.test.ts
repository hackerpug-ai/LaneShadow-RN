/**
 * REDHAT-FIX-04 AC-1 / TC-1: Zero-candidate floored lever produces escalation.
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
  subject: 's4t5-redhatfix04-zero-cand',
  issuer: 'https://laneshadow.test',
})

const RUN_ID = 's4t5-redhatfix04-zero-cand'

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

describe('REDHAT-FIX-04 AC-1: zero-candidate floored lever produces escalation', () => {
  let firstAccept: any
  let afterAccept: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix04-zero-cand', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    // Live-shaped: promote has candidates; reconstruct candidateCount=0 (floor 0.4)
    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: RUN_ID,
        reconstruct: { candidates: 0, passCount: 0 },
      },
      { identity: true },
    )
    expect(seed.ok, `seed zero-candidate failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

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
      resolve(EVIDENCE_DIR, 'AC-1-zero-candidate-escalation.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), firstAccept, afterAccept }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-1: requestBatchAcceptance returns escalation_required when reconstruct candidateCount is 0 with non-null escalationFloor', () => {
    expect(firstAccept.decision).toBe('escalation_required')
    expect(firstAccept.decision).not.toBe('accepted')
    expect(firstAccept.escalations?.length).toBeGreaterThanOrEqual(1)

    const flooredZero = firstAccept.escalations.find(
      (e: any) => e.lever === 'reconstruct' || e.lever === 'reroute',
    )
    expect(flooredZero).toBeTruthy()

    const reason = String(flooredZero.reason ?? '')
    expect(reason.includes('zero_candidates') || reason.includes('undefined_rate')).toBe(true)

    expect(firstAccept.retirementUnlockedAt ?? afterAccept.retirementUnlockedAt).toBeNull()
    expect(afterAccept.retirementUnlockedAt).toBeNull()
  })
})
