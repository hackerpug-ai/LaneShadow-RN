/**
 * REDHAT-FIX-05 AC-4 / TC-4: Sprint 10 blocked without accepted catalog.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix05-rejected-batch-decision
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  deriveSprint05GoalState,
  deriveSprint10Blocked,
} from '../../tools/gate/deriveSprint05GoalState'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-05/evidence')

const CLERK_USER = 's4t5-redhatfix05-s10'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const REJECTED_RUN_ID = 'redhatfix05-s10-rejected'

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

describe('REDHAT-FIX-05 AC-4: Sprint 10 blocked without accepted catalog', () => {
  let rejectedAcceptance: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: REJECTED_RUN_ID,
        reconstruct: { candidates: 10, passCount: 0 },
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}`).toBe(true)

    const reject = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: REJECTED_RUN_ID, decision: 'reject' },
      { identity: true },
    )
    expect(reject.ok, `reject failed: ${reject.stderr}\n${reject.stdout}`).toBe(true)

    const q = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: REJECTED_RUN_ID },
      { identity: true },
    )
    expect(q.ok).toBe(true)
    rejectedAcceptance = parseJson(q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-sprint10-blocked.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          rejectedAcceptance,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { runIds: [REJECTED_RUN_ID] },
      { identity: true },
    )
  })

  it('TC-4: Sprint 10 blocked flag is true when no accepted catalog exists', () => {
    expect(rejectedAcceptance.decision).toBe('rejected')

    const sprint10 = deriveSprint10Blocked({
      decision: rejectedAcceptance.decision,
      retirementUnlockedAt: rejectedAcceptance.retirementUnlockedAt ?? null,
      runId: rejectedAcceptance.runId ?? REJECTED_RUN_ID,
    })

    expect(sprint10.blocked).toBe(true)
    const reason = String(sprint10.reason ?? '')
    expect(reason.length).toBeGreaterThan(0)
    expect(
      reason.includes('no accepted catalog') || reason.toLowerCase().includes('rejected'),
    ).toBe(true)

    // MUST_NOT: unblocked on rejected
    expect(rejectedAcceptance.decision === 'rejected' && sprint10.blocked === false).toBe(false)

    // Empty / missing acceptance also blocks
    const empty = deriveSprint10Blocked({ decision: null, retirementUnlockedAt: null })
    expect(empty.blocked).toBe(true)
    expect(String(empty.reason).length).toBeGreaterThan(0)

    // Goal state embeds sprint10 blocked
    const goal = deriveSprint05GoalState({
      decision: rejectedAcceptance.decision,
      retirementUnlockedAt: rejectedAcceptance.retirementUnlockedAt ?? null,
      runId: rejectedAcceptance.runId ?? REJECTED_RUN_ID,
    })
    expect(goal.sprint10.blocked).toBe(true)
    expect(goal.met).toBe(false)
  })
})
