/**
 * REDHAT-FIX-06 AC-4 / TC-4: Happy-path unretire with valid OCC token.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05
 * start_ref: redhatfix06-retired-route
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhatfix06-happy',
  issuer: 'https://laneshadow.test',
})
const ROUTE_ID = 'test:redhatfix06-happy'

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

describe('REDHAT-FIX-06 AC-4: happy-path unretire with valid OCC token', () => {
  let unretireResult: any
  let after: any

  beforeAll(() => {
    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix06-happy', role: 'operator' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    const seed = runConvexFn(
      'curatedGeometry:seedS5T2RetirementFixtures',
      {
        scenario: 'retire-unretire-preserves-record',
        allFailedRouteId: ROUTE_ID,
      },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const retire = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: ROUTE_ID,
        confirmed: true,
        reason: 'all_levers_failed founder confirmed',
      },
      { identity: true },
    )
    expect(retire.ok, `retire failed: ${retire.stderr}\n${retire.stdout}`).toBe(true)

    const evidence = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    const ev = parseJson(evidence.stdout)
    const expectedRetiredAt = ev?.retiredAtMs
    expect(expectedRetiredAt).toBeTypeOf('number')

    const unretire = runConvexFn(
      'curatedGeometry:unretireRoute',
      { routeId: ROUTE_ID, expectedRetiredAt },
      { identity: true },
    )
    expect(unretire.ok, `unretire failed: ${unretire.stderr}\n${unretire.stdout}`).toBe(true)
    unretireResult = parseJson(unretire.stdout)

    const post = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    after = parseJson(post.stdout)
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      { prefixes: ['test:redhatfix06-happy'] },
      { identity: true },
    )
  })

  it('TC-4: unretire succeeds; retiredAt null; history retained; riderReady false', () => {
    expect(unretireResult?.disposition).toBe('unretire')
    expect(unretireResult?.retiredAt).toBeNull()
    expect(after?.retiredAt).toBeNull()
    expect(after?.routeDocExists).toBe(true)
    expect(after?.retirementReason?.length).toBeGreaterThanOrEqual(1)
    expect(after?.retirementReasonHistoryRetained).toBe(true)
    expect(after?.riderReady).toBe(false)
    // disposition unretire present in audit trail
    const dispositions = after?.dispositions ?? []
    const hasUnretire = dispositions.some((d: any) => d.disposition === 'unretire')
    expect(hasUnretire || after?.dispositionCount >= 2).toBe(true)
  })
})
