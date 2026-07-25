/**
 * REDHAT-FIX-05 AC-1 / TC-1: Do not mark goal complete on rejected batch.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix05-rejected-batch-decision / redhatfix05-accepted-batch-decision
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { deriveSprint05GoalState } from '../../tools/gate/deriveSprint05GoalState'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-05/evidence')

const CLERK_USER = 's4t5-redhatfix05-goal'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const REJECTED_RUN_ID = 'redhatfix05-rejected'
const ACCEPTED_RUN_ID = 'redhatfix05-accepted'

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

describe('REDHAT-FIX-05 AC-1: honest goal semantics on batch decision', () => {
  let rejectedAcceptance: any
  let acceptedAcceptance: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}\n${setup.stdout}`).toBe(true)

    // Rejected path: seed low-yield report then reject
    const seedReject = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: REJECTED_RUN_ID,
        reconstruct: { candidates: 10, passCount: 0 },
      },
      { identity: true },
    )
    expect(seedReject.ok, `seed rejected report failed: ${seedReject.stderr}`).toBe(true)

    const reject = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: REJECTED_RUN_ID, decision: 'reject' },
      { identity: true },
    )
    expect(reject.ok, `reject failed: ${reject.stderr}\n${reject.stdout}`).toBe(true)

    const qReject = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: REJECTED_RUN_ID },
      { identity: true },
    )
    expect(qReject.ok).toBe(true)
    rejectedAcceptance = parseJson(qReject.stdout)

    // Accepted path: provenanced clean report + accept
    const seedAccept = runConvexFn(
      'curatedGeometry:seedProvenancedCoverageReport',
      {
        runId: ACCEPTED_RUN_ID,
        isDone: true,
        totalCostUSD: 2.0,
        levers: {
          scraped_promoted: { candidates: 10, passCount: 8 },
          ai_reconstructed: { candidates: 10, passCount: 8 },
          name_routed: { candidates: 10, passCount: 8 },
        },
      },
      { identity: true },
    )
    expect(seedAccept.ok, `seed accepted report failed: ${seedAccept.stderr}`).toBe(true)

    const accept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: ACCEPTED_RUN_ID, decision: 'accept' },
      { identity: true },
    )
    expect(accept.ok, `accept failed: ${accept.stderr}\n${accept.stdout}`).toBe(true)

    const qAccept = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: ACCEPTED_RUN_ID },
      { identity: true },
    )
    expect(qAccept.ok).toBe(true)
    acceptedAcceptance = parseJson(qAccept.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-goal-semantics.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          rejectedAcceptance,
          acceptedAcceptance,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { runIds: [REJECTED_RUN_ID, ACCEPTED_RUN_ID] },
      { identity: true },
    )
  })

  it('TC-1: Goal derivation sets met false when acceptance decision is rejected', () => {
    expect(rejectedAcceptance).toBeTruthy()
    expect(rejectedAcceptance.decision).toBe('rejected')

    const derived = deriveSprint05GoalState({
      decision: rejectedAcceptance.decision,
      retirementUnlockedAt: rejectedAcceptance.retirementUnlockedAt ?? null,
      runId: rejectedAcceptance.runId ?? REJECTED_RUN_ID,
    })

    expect(derived.met).toBe(false)
    expect(derived.goal).not.toBe('complete')
    expect(derived.decision).toBe('rejected')
    // MUST_NOT: complete/met on rejected
    expect(derived.goal === 'complete' && derived.decision === 'rejected').toBe(false)
    expect(derived.met === true && derived.decision === 'rejected').toBe(false)

    // Empty decision must never complete
    const empty = deriveSprint05GoalState({ decision: null, retirementUnlockedAt: null })
    expect(empty.met).toBe(false)
    expect(empty.goal).not.toBe('complete')
  })

  it('AC-1 CASE 2: accepted decision can complete only with gate oracles', () => {
    expect(acceptedAcceptance).toBeTruthy()
    expect(acceptedAcceptance.decision).toBe('accepted')

    const withoutOracles = deriveSprint05GoalState({
      decision: acceptedAcceptance.decision,
      retirementUnlockedAt: acceptedAcceptance.retirementUnlockedAt ?? null,
      runId: acceptedAcceptance.runId ?? ACCEPTED_RUN_ID,
    })
    // Without explicit oracle pass, fail-closed remains incomplete
    expect(withoutOracles.decision).toBe('accepted')
    expect(withoutOracles.met).toBe(false)

    const withOracles = deriveSprint05GoalState(
      {
        decision: acceptedAcceptance.decision,
        retirementUnlockedAt: acceptedAcceptance.retirementUnlockedAt ?? null,
        runId: acceptedAcceptance.runId ?? ACCEPTED_RUN_ID,
      },
      {
        step4NegativeControlDistinct: true,
        top50RowEvidenceOk: true,
        zeroTestContamination: true,
      },
    )
    expect(withOracles.decision).toBe('accepted')
    expect(withOracles.met).toBe(true)
    expect(withOracles.goal).toBe('complete')

    // MUST_NOT: met true with null decision
    const nullDecision = deriveSprint05GoalState(
      { decision: null, retirementUnlockedAt: null },
      {
        step4NegativeControlDistinct: true,
        top50RowEvidenceOk: true,
        zeroTestContamination: true,
      },
    )
    expect(nullDecision.met).toBe(false)
    expect(nullDecision.goal).not.toBe('complete')
  })
})
