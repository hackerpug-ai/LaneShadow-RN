/**
 * REDHAT-FIX-04 AC-4 / TC-4: Promote with null floor does not zero-candidate-escalate.
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
  subject: 's4t5-redhatfix04-promote-null',
  issuer: 'https://laneshadow.test',
})

const RUN_ID = 's4t5-redhatfix04-promote-only-floor-null'

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

describe('REDHAT-FIX-04 AC-4: promote null floor does not zero-candidate-escalate', () => {
  let firstAccept: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix04-promote-null', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    // promote has candidates (seed default 10) with escalationFloor null;
    // reconstruct candidateCount=0 with floor 0.4 → must escalate reconstruct only
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

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-promote-floor-null.json'),
      JSON.stringify({ capturedAt: new Date().toISOString(), firstAccept }, null, 2),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-4: Promote lever with null escalationFloor is not escalated for zero candidates', () => {
    const escalations = firstAccept.escalations ?? []
    const promoteEscalations = escalations.filter((e: any) => e.lever === 'promote')
    expect(promoteEscalations.length).toBe(0)
    expect(escalations.some((e: any) => e.lever === 'promote')).toBe(false)

    const reconstructCount = escalations.filter((e: any) => e.lever === 'reconstruct').length
    const rerouteCount = escalations.filter((e: any) => e.lever === 'reroute').length
    expect(reconstructCount >= 1 || rerouteCount >= 1).toBe(true)
    expect(escalations.length).toBeGreaterThanOrEqual(1)
  })
})
