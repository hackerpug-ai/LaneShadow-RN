/**
 * REDHAT-FIX-05 AC-2 / TC-2: Real step-4 negative control distinct from step-3.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04
 * start_ref: redhatfix05-escalation-open-report
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import {
  buildStep3ComparisonArtifact,
  buildStep4NegativeControlEvidence,
} from '../../tools/gate/deriveSprint05GoalState'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-05/evidence')

const CLERK_USER = 's4t5-redhatfix05-step4'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const RUN_ID = 'redhatfix05-neg-control'

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

describe('REDHAT-FIX-05 AC-2: step-4 negative control distinct from step-3', () => {
  let step3Artifact: ReturnType<typeof buildStep3ComparisonArtifact>
  let step4Evidence: ReturnType<typeof buildStep4NegativeControlEvidence>
  let acceptResult: any
  let afterAccept: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    // Zero-candidate reconstruct forces escalation on accept attempt
    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: RUN_ID,
        reconstruct: { candidates: 0, passCount: 0 },
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const reportQ = runConvexFn(
      'curatedGeometry:coverageReport',
      { runId: RUN_ID },
      { identity: true },
    )
    expect(reportQ.ok, `coverageReport failed: ${reportQ.stderr}`).toBe(true)
    const report = parseJson(reportQ.stdout)

    // Step-3: comparison artifact (yields vs assumptions) BEFORE accept mutation
    step3Artifact = buildStep3ComparisonArtifact({
      runId: RUN_ID,
      report,
      phase: 'step-3-yield-comparison',
    })

    // Step-4 mutation: attempt accept on open low/zero yield
    const accept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: RUN_ID, decision: 'accept' },
      { identity: true },
    )
    expect(accept.ok, `requestBatchAcceptance failed: ${accept.stderr}\n${accept.stdout}`).toBe(
      true,
    )
    acceptResult = parseJson(accept.stdout)

    const q = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: RUN_ID },
      { identity: true },
    )
    expect(q.ok).toBe(true)
    afterAccept = parseJson(q.stdout)

    step4Evidence = buildStep4NegativeControlEvidence({
      step3: step3Artifact,
      acceptResult,
      acceptance: afterAccept,
    })

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-step4-negative-control.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          step3Artifact,
          acceptResult,
          afterAccept,
          step4Evidence,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-2: Step-4 accept attempt produces non-identical artifact with escalation_required or rejected', () => {
    expect(step4Evidence.step4_bytes).not.toBe(step4Evidence.step3_bytes)
    expect(step4Evidence.step4_bytes.length).toBeGreaterThan(0)
    expect(step4Evidence.step3_bytes.length).toBeGreaterThan(0)

    const decision = step4Evidence.decision
    expect(decision === 'escalation_required' || decision === 'rejected').toBe(true)
    expect(decision).not.toBe('accepted')

    expect(step4Evidence.retirementUnlockedAt).toBeNull()
    expect(afterAccept.retirementUnlockedAt).toBeNull()

    // Real mutation: decision path changed from pre-accept null to escalation/reject
    expect(step4Evidence.mutated).toBe(true)
    expect(step4Evidence.decision).not.toBeNull()
  })
})
