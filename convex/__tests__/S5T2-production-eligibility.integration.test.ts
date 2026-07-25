/**
 * FIX-S5-T2-01 AC-1: Eligibility accepts production waterfall summary evidence
 * (terminalState + leversRun, no per-lever rows).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05 / T-REC-013
 * start_ref: s5t2-production-summary-eligibility
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t2-prod-elig',
  issuer: 'https://laneshadow.test',
})

const PROD_SUMMARY_ID = 'test:s5t2-prod-summary'
const PROD_QUEUED_ID = 'test:s5t2-prod-queued-summary'
const PROD_PARTIAL_ID = 'test:s5t2-prod-partial-summary'

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
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '' }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
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

describe('FIX AC-1: production waterfall summary eligibility (no per-lever rows)', () => {
  let candidates: any
  let prodSnap: any
  let queuedSnap: any
  let partialSnap: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t2-prod-elig', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Seed production-shaped summary only (no lever field on waterfall_result)
    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'production-summary-all-failed',
        allFailedRouteId: PROD_SUMMARY_ID,
        passRouteId: PROD_QUEUED_ID,
        reviewOnlyRouteId: PROD_PARTIAL_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const list = runConvexFn(
      'curatedGeometry:listRetirementCandidates',
      { routeIdPrefix: 'test:s5t2-prod-', limit: 50 },
      { identity: true },
    )
    expect(list.ok, `listRetirementCandidates failed: ${list.stderr}\n${list.stdout}`).toBe(true)
    candidates = parseJson(list.stdout)

    prodSnap = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: PROD_SUMMARY_ID },
        { identity: true },
      ).stdout,
    )
    queuedSnap = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: PROD_QUEUED_ID },
        { identity: true },
      ).stdout,
    )
    partialSnap = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: PROD_PARTIAL_ID },
        { identity: true },
      ).stdout,
    )

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-production-summary-eligibility.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          candidates,
          prodSnap,
          queuedSnap,
          partialSnap,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      {
        prefixes: [
          'test:s5t2-prod-summary',
          'test:s5t2-prod-queued-summary',
          'test:s5t2-prod-partial-summary',
        ],
      },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: production summary (leversRun 1/2/3, retirement_eligible, no lever field) is eligible', () => {
    const rows = candidates?.candidates ?? []
    const row = rows.find((c: any) => c.routeId === PROD_SUMMARY_ID)
    expect(row, 'production-summary route missing from candidates').toBeTruthy()
    expect(row.eligible).toBe(true)
    expect(prodSnap?.eligible).toBe(true)
    // Synthesized lever failure evidence covers all three levers
    const reasons = row.leverFailureReasons ?? prodSnap?.leverFailureReasons ?? []
    expect(reasons.length).toBe(3)
    expect(reasons.map((r: any) => r.lever).sort()).toEqual([1, 2, 3])
  })

  it('MUST_OBSERVE: production summary terminalState=queued after all levers run is eligible', () => {
    const rows = candidates?.candidates ?? []
    const row = rows.find((c: any) => c.routeId === PROD_QUEUED_ID)
    expect(row, 'queued production-summary route missing').toBeTruthy()
    expect(row.eligible).toBe(true)
    expect(queuedSnap?.eligible).toBe(true)
  })

  it('MUST_NOT_OBSERVE: partial leversRun (missing lever 3) is eligible', () => {
    const rows = candidates?.candidates ?? []
    const row = rows.find((c: any) => c.routeId === PROD_PARTIAL_ID)
    expect(row?.eligible ?? false).toBe(false)
    expect(partialSnap?.eligible ?? false).toBe(false)
  })
})
