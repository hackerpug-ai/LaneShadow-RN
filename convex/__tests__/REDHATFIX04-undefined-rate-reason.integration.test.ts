/**
 * REDHAT-FIX-04 AC-2 / TC-2: 0/0 is not reported as a defined 0.0% rate below floor.
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
  subject: 's4t5-redhatfix04-undef-rate',
  issuer: 'https://laneshadow.test',
})

const RUN_ID = 's4t5-redhatfix04-undefined-rate'

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

describe('REDHAT-FIX-04 AC-2: zero-candidate reason labels undefined rate', () => {
  let firstAccept: any
  let reconEscalation: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix04-undef-rate', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: RUN_ID,
        reconstruct: { candidates: 0, passCount: 0 },
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const accept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: RUN_ID, decision: 'accept' },
      { identity: true },
    )
    expect(accept.ok, `accept failed: ${accept.stderr}\n${accept.stdout}`).toBe(true)
    firstAccept = JSON.parse(accept.stdout)

    reconEscalation = (firstAccept.escalations ?? []).find(
      (e: any) => e.lever === 'reconstruct' || e.leverNumber === 2,
    )

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-undefined-rate-reason.json'),
      JSON.stringify(
        { capturedAt: new Date().toISOString(), firstAccept, reconEscalation },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-2: Zero-candidate escalation reason labels undefined rate or zero candidates rather than only 0.0% below floor', () => {
    expect(reconEscalation).toBeTruthy()
    const reason = String(reconEscalation.reason ?? '')
    expect(reason.length).toBeGreaterThan(0)

    expect(
      reason.includes('zero_candidates') ||
        reason.includes('undefined_rate') ||
        reason.includes('inspection'),
    ).toBe(true)

    const candidates = reconEscalation.candidates ?? reconEscalation.candidateCount
    expect(candidates).toBe(0)
    expect(reconEscalation.candidateCount ?? reconEscalation.candidates).toBe(0)

    // MUST_NOT: sole mathematical basis is "realized rate 0.0% is below floor"
    const bareZeroPctOnly =
      /^reconstruct realized rate 0\.0% is below escalation floor 40%/.test(reason) &&
      !reason.includes('zero_candidates') &&
      !reason.includes('undefined_rate') &&
      !reason.includes('inspection')
    expect(bareZeroPctOnly).toBe(false)
  })
})
