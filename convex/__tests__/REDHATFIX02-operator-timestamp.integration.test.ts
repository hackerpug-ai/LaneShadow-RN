/**
 * REDHAT-FIX-02 AC-2 / TC-2: operatorIdentity + decision.timestamp ISO required.
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

const CLERK_USER = 's4t5-redhatfix02-identity'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const RUN_ID = `redhatfix02-identity-${Date.now()}`

const ISO_WITH_T = /^\d{4}-\d{2}-\d{2}T/
const ISO_TZ = /Z$|[+-]\d{2}:\d{2}$/

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

/** Resolve decision.timestamp from payload (nested or decisionTimestamp field). */
function decisionTimestampOf(payload: any): string | null {
  if (!payload) return null
  if (typeof payload.decision === 'object' && payload.decision != null) {
    if (typeof payload.decision.timestamp === 'string') return payload.decision.timestamp
  }
  if (typeof payload.decisionTimestamp === 'string') return payload.decisionTimestamp
  if (typeof payload.timestamp === 'string') return payload.timestamp
  return null
}

describe('REDHAT-FIX-02 AC-2: operatorIdentity and decision.timestamp ISO', () => {
  let acceptResult: any
  let acceptance: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}\n${setup.stdout}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedProvenancedCoverageReport',
      {
        runId: RUN_ID,
        isDone: true,
        totalCostUSD: 1.5,
        levers: {
          scraped_promoted: { candidates: 5, passCount: 3 },
          ai_reconstructed: { candidates: 5, passCount: 3 },
          name_routed: { candidates: 5, passCount: 3 },
        },
      },
      { identity: true },
    )
    expect(seed.ok, `seedProvenancedCoverageReport failed: ${seed.stderr}\n${seed.stdout}`).toBe(
      true,
    )

    // Reject path still succeeds and must stamp identity + timestamp
    const accept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: RUN_ID, decision: 'reject' },
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
    acceptance = parseJson(q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-operator-timestamp.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          RUN_ID,
          CLERK_USER,
          acceptResult,
          acceptance,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-2: acceptance artifact includes non-null operatorIdentity and ISO decision.timestamp', () => {
    const identity = acceptance?.operatorIdentity ?? acceptResult?.operatorIdentity ?? null
    expect(identity).not.toBeNull()
    expect(identity).not.toBe('')
    expect(typeof identity).toBe('string')
    expect(String(identity).length).toBeGreaterThanOrEqual(1)

    const ts = decisionTimestampOf(acceptance) ?? decisionTimestampOf(acceptResult)
    expect(ts).not.toBeNull()
    expect(ts).not.toBe('')
    expect(ts).toMatch(ISO_WITH_T)
    expect(ISO_TZ.test(String(ts))).toBe(true)
    // Parseable
    expect(Number.isNaN(Date.parse(String(ts)))).toBe(false)

    const decision = acceptance?.decision ?? acceptResult?.decision
    const decisionValue =
      typeof decision === 'object' && decision != null
        ? (decision.value ?? decision.status)
        : decision
    expect(['accepted', 'rejected', 'escalation_required']).toContain(decisionValue)
  })
})
