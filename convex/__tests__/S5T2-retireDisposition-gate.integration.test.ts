/**
 * FIX-S5-T2-01 AC-2: reviewQueue.retireDisposition requires confirmed+reason+eligibility
 * (same gate as curatedGeometry.retireRoute).
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05 / T-REC-014
 * start_ref: s5t2-retireDisposition-confirmation-gate
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T2/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t2-retire-disp',
  issuer: 'https://laneshadow.test',
})

const NO_CONFIRM_ID = 'test:s5t2-rd-noconfirm'
const EMPTY_REASON_ID = 'test:s5t2-rd-emptyreason'
const VALID_ID = 'test:s5t2-rd-valid'
const INELIGIBLE_ID = 'test:s5t2-rd-ineligible'

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

describe('FIX AC-2: retireDisposition requires confirmed + reason + eligibility', () => {
  let noConfirmCall: RunResult
  let emptyReasonCall: RunResult
  let afterNoConfirm: any
  let afterEmptyReason: any
  let validCall: RunResult
  let afterValid: any
  let ineligibleCall: RunResult
  let afterIneligible: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t2-retire-disp', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Eligible residual for gate tests
    for (const routeId of [NO_CONFIRM_ID, EMPTY_REASON_ID, VALID_ID]) {
      const seed = runConvexFn(
        'curatedGeometry:seedS5T2RetirementFixtures',
        {
          scenario: 'founder-confirmation-required',
          allFailedRouteId: routeId,
        },
        { identity: true },
      )
      expect(seed.ok, `seed ${routeId} failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    }

    // Ineligible residual (review only — no lever failures)
    const seedInelig = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'all-levers-failed-vs-pass',
        allFailedRouteId: 'test:s5t2-rd-unused-all',
        passRouteId: 'test:s5t2-rd-unused-pass',
        reviewOnlyRouteId: INELIGIBLE_ID,
      },
      { identity: true },
    )
    expect(seedInelig.ok, `seed ineligible failed: ${seedInelig.stderr}`).toBe(true)

    // NEGATIVE: routeId only (legacy bypass) — must not set retiredAt
    noConfirmCall = runConvexFn(
      'reviewQueue:retireDisposition',
      { routeId: NO_CONFIRM_ID },
      { identity: true },
    )
    afterNoConfirm = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: NO_CONFIRM_ID },
        { identity: true },
      ).stdout,
    )

    // NEGATIVE: confirmed=false
    const noConfirmFlag = runConvexFn(
      'reviewQueue:retireDisposition',
      {
        routeId: NO_CONFIRM_ID,
        confirmed: false,
        reason: 'should not commit',
      },
      { identity: true },
    )
    // Keep the stricter failure (either call may be the one that fails)
    if (noConfirmFlag.ok === false) noConfirmCall = noConfirmFlag
    afterNoConfirm = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: NO_CONFIRM_ID },
        { identity: true },
      ).stdout,
    )

    // NEGATIVE: empty reason
    emptyReasonCall = runConvexFn(
      'reviewQueue:retireDisposition',
      {
        routeId: EMPTY_REASON_ID,
        confirmed: true,
        reason: '',
      },
      { identity: true },
    )
    afterEmptyReason = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: EMPTY_REASON_ID },
        { identity: true },
      ).stdout,
    )

    // NEGATIVE: ineligible residual even with confirmed+reason
    ineligibleCall = runConvexFn(
      'reviewQueue:retireDisposition',
      {
        routeId: INELIGIBLE_ID,
        confirmed: true,
        reason: 'trying to retire without lever evidence',
      },
      { identity: true },
    )
    afterIneligible = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: INELIGIBLE_ID },
        { identity: true },
      ).stdout,
    )

    // POSITIVE: confirmed + reason + eligible
    validCall = runConvexFn(
      'reviewQueue:retireDisposition',
      {
        routeId: VALID_ID,
        confirmed: true,
        reason: 'all levers failed — founder confirmed retire via review queue',
      },
      { identity: true },
    )
    afterValid = parseJson(
      runConvexFn(
        'curatedGeometry:getRetirementEvidence',
        { routeId: VALID_ID },
        { identity: true },
      ).stdout,
    )

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-retireDisposition-gate.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          noConfirmCall: {
            ok: noConfirmCall.ok,
            stderr: noConfirmCall.stderr,
            stdout: noConfirmCall.stdout,
          },
          emptyReasonCall: {
            ok: emptyReasonCall.ok,
            stderr: emptyReasonCall.stderr,
          },
          ineligibleCall: {
            ok: ineligibleCall.ok,
            stderr: ineligibleCall.stderr,
          },
          validCall: {
            ok: validCall.ok,
            stdout: validCall.stdout,
            stderr: validCall.stderr,
          },
          afterNoConfirm,
          afterEmptyReason,
          afterIneligible,
          afterValid,
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
          'test:s5t2-rd-noconfirm',
          'test:s5t2-rd-emptyreason',
          'test:s5t2-rd-valid',
          'test:s5t2-rd-ineligible',
          'test:s5t2-rd-unused',
        ],
      },
      { identity: true },
    )
  })

  it('NEGATIVE_CONTROL: retireDisposition without confirmation does not set retiredAt', () => {
    expect(noConfirmCall.ok).toBe(false)
    expect(afterNoConfirm?.retiredAt).toBeNull()
  })

  it('NEGATIVE_CONTROL: empty reason does not set retiredAt', () => {
    expect(emptyReasonCall.ok).toBe(false)
    expect(afterEmptyReason?.retiredAt).toBeNull()
  })

  it('NEGATIVE_CONTROL: ineligible residual cannot be retired even with confirmed+reason', () => {
    expect(ineligibleCall.ok).toBe(false)
    expect(afterIneligible?.retiredAt).toBeNull()
  })

  it('MUST_OBSERVE: confirmed+reason+eligible sets geometryStatus=retired, retirementReason, disposition audit', () => {
    expect(
      validCall.ok,
      `valid retireDisposition failed: ${validCall.stderr}\n${validCall.stdout}`,
    ).toBe(true)
    const result = parseJson(validCall.stdout)
    expect(result?.retiredAt).toBeTruthy()
    expect(afterValid?.retiredAt).toBeTruthy()
    expect(afterValid?.geometryStatus).toBe('retired')
    expect((afterValid?.retirementReason ?? '').length).toBeGreaterThanOrEqual(1)
    expect(afterValid?.dispositionAuditCount).toBeGreaterThanOrEqual(1)
  })
})
