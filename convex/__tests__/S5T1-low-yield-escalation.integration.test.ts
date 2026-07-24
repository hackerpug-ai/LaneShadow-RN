/**
 * AC-3: Low-yield lever → escalation_required; retirement locked until founder resolution.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04 AC-7 / T-REC-017
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t1-escalation',
  issuer: 'https://laneshadow.test',
})

const RUN_ID = 's5t1-low-yield-reconstruct'

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

describe('AC-3: low-yield escalation locks acceptance/retirement', () => {
  let firstAccept: any
  let afterFirst: any
  let resolution: any
  let afterResolve: any
  let negControl: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t1-escalation', role: 'founder' },
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

    const q1 = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: RUN_ID },
      { identity: true },
    )
    expect(q1.ok).toBe(true)
    afterFirst = JSON.parse(q1.stdout)

    const resolveRun = runConvexFn(
      'curatedGeometry:resolveBatchEscalation',
      {
        runId: RUN_ID,
        decision: 'accept',
        rationale: 'Founder accepts low reconstruct yield after review of PoC sample size.',
      },
      { identity: true },
    )
    expect(resolveRun.ok, `resolve failed: ${resolveRun.stderr}\n${resolveRun.stdout}`).toBe(true)
    resolution = JSON.parse(resolveRun.stdout)

    const q2 = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: RUN_ID },
      { identity: true },
    )
    afterResolve = JSON.parse(q2.stdout)

    // Negative control: new low-yield run, mutate only riderReadyCount, lock remains
    const seed2 = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: `${RUN_ID}-neg`,
        reconstruct: { candidates: 10, passCount: 1 },
        riderReadyCount: 999,
      },
      { identity: true },
    )
    expect(seed2.ok).toBe(true)
    runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: `${RUN_ID}-neg`, decision: 'accept' },
      { identity: true },
    )
    // Patch only total riderReady while reconstruct stays low
    runConvexFn(
      'curatedGeometry:patchBatchReportRiderReadyOnly',
      { runId: `${RUN_ID}-neg`, riderReadyCount: 5000 },
      { identity: true },
    )
    const lock = runConvexFn(
      'curatedGeometry:retirementLockStatus',
      { runId: `${RUN_ID}-neg` },
      { identity: true },
    )
    negControl = JSON.parse(lock.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-low-yield-escalation.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          firstAccept,
          afterFirst,
          resolution,
          afterResolve,
          negControl,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { runIds: [RUN_ID, `${RUN_ID}-neg`] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: first accept returns escalation_required for reconstruct with observed 0.10', () => {
    expect(firstAccept.decision).toBe('escalation_required')
    expect(firstAccept.escalations?.length).toBeGreaterThanOrEqual(1)
    const recon = firstAccept.escalations.find(
      (e: any) => e.lever === 'reconstruct' || e.leverNumber === 2,
    )
    expect(recon).toBeTruthy()
    expect(recon.observedRate ?? recon.realizedRate).toBeCloseTo(0.1, 5)
    expect(recon.passCount).toBe(1)
    expect(recon.candidates ?? recon.candidateCount).toBe(10)
  })

  it('MUST_OBSERVE: acceptedAt and retirementUnlockedAt remain null until explicit resolution', () => {
    expect(afterFirst.acceptedAt).toBeNull()
    expect(afterFirst.retirementUnlockedAt).toBeNull()
    expect(afterFirst.decision).toBe('escalation_required')
  })

  it('MUST_OBSERVE: explicit resolution records decision, rationale, resolvedAt', () => {
    expect(resolution.resolvedAt || afterResolve.resolution?.resolvedAt).toBeTruthy()
    const resolvedAt = resolution.resolvedAt ?? afterResolve.resolution?.resolvedAt
    expect(String(resolvedAt).length).toBeGreaterThanOrEqual(1)
    expect(
      (resolution.rationale ?? afterResolve.resolution?.rationale ?? '').length,
    ).toBeGreaterThanOrEqual(1)
    expect(afterResolve.decision === 'accepted' || afterResolve.retirementUnlockedAt != null).toBe(
      true,
    )
  })

  it('MUST_NOT_OBSERVE: lock clears when only riderReadyCount is mutated', () => {
    expect(negControl.retirementUnlockedAt).toBeNull()
    expect(negControl.locked).toBe(true)
  })
})
