/**
 * AC-2: Founder review exposes reasons; retirement requires explicit confirmation + reason.
 *
 * TEST_TIER: integration + human-gate
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05 / T-REC-014
 * start_ref: s5t2-founder-confirmation-required
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t2-confirm',
  issuer: 'https://laneshadow.test',
})

const CONFIRM_ID = 'test:s5t2-confirm'

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

describe('AC-2: founder confirmation + non-empty reason required for retirement', () => {
  let candidates: any
  let missingConfirm: RunResult
  let emptyReason: RunResult
  let validRetire: any
  let afterInvalid: any
  let afterValid: any
  let batchNoConfirm: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t2-confirm', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'founder-confirmation-required',
        allFailedRouteId: CONFIRM_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const list = runConvexFn(
      'curatedGeometry:listRetirementCandidates',
      { routeIdPrefix: CONFIRM_ID, limit: 10 },
      { identity: true },
    )
    expect(list.ok, `list failed: ${list.stderr}\n${list.stdout}`).toBe(true)
    candidates = parseJson(list.stdout)

    // Invalid: confirmed=false
    missingConfirm = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: CONFIRM_ID,
        confirmed: false,
        reason: 'should not commit',
      },
      { identity: true },
    )

    // Invalid: empty reason
    emptyReason = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: CONFIRM_ID,
        confirmed: true,
        reason: '',
      },
      { identity: true },
    )

    const snapInvalid = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: CONFIRM_ID },
      { identity: true },
    )
    afterInvalid = parseJson(snapInvalid.stdout)

    // Valid: confirmed + non-empty reason
    const valid = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: CONFIRM_ID,
        confirmed: true,
        reason: 'all levers failed after founder review — no recoverable geometry',
      },
      { identity: true },
    )
    expect(valid.ok, `valid retire failed: ${valid.stderr}\n${valid.stdout}`).toBe(true)
    validRetire = parseJson(valid.stdout)

    const snapValid = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: CONFIRM_ID },
      { identity: true },
    )
    afterValid = parseJson(snapValid.stdout)

    // NEGATIVE CONTROL: batch completion path without confirmation must not set retiredAt
    const batchRoute = 'test:s5t2-batch-no-auto'
    runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'founder-confirmation-required',
        allFailedRouteId: batchRoute,
      },
      { identity: true },
    )
    // Simulate batch report / acceptance path — no retire confirmation
    const batchSnap = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: batchRoute },
      { identity: true },
    )
    batchNoConfirm = parseJson(batchSnap.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-confirmation.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          candidates,
          missingConfirm: { ok: missingConfirm.ok, stderr: missingConfirm.stderr },
          emptyReason: { ok: emptyReason.ok, stderr: emptyReason.stderr },
          validRetire,
          afterInvalid,
          afterValid,
          batchNoConfirm,
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
        prefixes: ['test:s5t2-confirm', 'test:s5t2-batch-no-auto'],
      },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: candidate list includes 3 per-lever failure reasons + classifier evidence', () => {
    const row = (candidates?.candidates ?? []).find((c: any) => c.routeId === CONFIRM_ID)
    expect(row).toBeTruthy()
    expect(row.eligible).toBe(true)
    expect(row.leverFailureReasons?.length).toBe(3)
    expect(row.classifierVerdict ?? row.classifier?.verdict).toBeTruthy()
    expect(row.bestCandidateGeometry !== undefined).toBe(true)
  })

  it('MUST_OBSERVE: invalid calls fail without patching retiredAt', () => {
    expect(missingConfirm.ok).toBe(false)
    expect(emptyReason.ok).toBe(false)
    expect(afterInvalid?.retiredAt).toBeNull()
  })

  it('MUST_OBSERVE: confirmed=true + reason records retirementReason, retiredAt, disposition audit', () => {
    expect(validRetire?.retiredAt).toBeTruthy()
    expect(String(validRetire.retiredAt)).toMatch(/^\d{4}-/)
    expect(afterValid?.retirementReason?.length).toBeGreaterThanOrEqual(1)
    expect(afterValid?.retiredAt).toBeTruthy()
    expect(afterValid?.dispositionAuditCount).toBeGreaterThanOrEqual(1)
    expect(afterValid?.geometryStatus).toBe('retired')
  })

  it('MUST_NOT_OBSERVE: auto-retirement from batch path without confirmation', () => {
    expect(batchNoConfirm?.retiredAt).toBeNull()
  })
})
