/**
 * REDHAT-FIX-06 AC-3 / TC-3: unretireRoute OCC guard rejects stale concurrent ops.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-05
 * start_ref: redhatfix06-concurrent-retire
 */

import { execFileSync } from 'node:child_process'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-redhatfix06-occ',
  issuer: 'https://laneshadow.test',
})
const ROUTE_ID = 'test:redhatfix06-concurrent'

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

function extractErrorCode(result: RunResult): string | null {
  const blob = `${result.stderr}\n${result.stdout}`
  const m =
    blob.match(/"code"\s*:\s*"(CONCURRENCY_CONFLICT|OCC_MISMATCH)"/) ||
    blob.match(/\b(CONCURRENCY_CONFLICT|OCC_MISMATCH)\b/)
  return m ? m[1] : null
}

describe('REDHAT-FIX-06 AC-3: unretireRoute OCC guard', () => {
  let staleToken: number
  let currentRetiredAtMs: number | null
  let staleUnretire: RunResult
  let errorCode: string | null
  let afterEvidence: any

  beforeAll(() => {
    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-redhatfix06-occ', role: 'operator' },
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

    const retire1 = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: ROUTE_ID,
        confirmed: true,
        reason: 'first retire reason',
      },
      { identity: true },
    )
    expect(retire1.ok, `retire1 failed: ${retire1.stderr}\n${retire1.stdout}`).toBe(true)
    const r1 = parseJson(retire1.stdout)
    const mid = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    const midEv = parseJson(mid.stdout)
    staleToken = midEv?.retiredAtMs ?? r1?.retiredAtMs
    expect(staleToken, 'stale OCC token').toBeTypeOf('number')

    // Concurrent change: re-retire with a new reason (updates retiredAt)
    // Brief delay so Date.now() differs from first retire.
    execFileSync('sleep', ['0.05'])
    const retire2 = runConvexFn(
      'curatedGeometry:retireRoute',
      {
        routeId: ROUTE_ID,
        confirmed: true,
        reason: 'concurrent re-retire changes token',
      },
      { identity: true },
    )
    expect(retire2.ok, `retire2 failed: ${retire2.stderr}\n${retire2.stdout}`).toBe(true)
    const r2 = parseJson(retire2.stdout)
    const afterConcurrent = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    const afterEv = parseJson(afterConcurrent.stdout)
    currentRetiredAtMs = afterEv?.retiredAtMs ?? r2?.retiredAtMs ?? null
    expect(currentRetiredAtMs).not.toEqual(staleToken)

    staleUnretire = runConvexFn(
      'curatedGeometry:unretireRoute',
      { routeId: ROUTE_ID, expectedRetiredAt: staleToken },
      { identity: true },
    )
    errorCode = extractErrorCode(staleUnretire)

    const post = runConvexFn(
      'curatedGeometry:getRetirementEvidence',
      { routeId: ROUTE_ID },
      { identity: true },
    )
    afterEvidence = parseJson(post.stdout)
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T2Fixtures',
      { prefixes: ['test:redhatfix06-concurrent'] },
      { identity: true },
    )
  })

  it('TC-3: stale OCC token fails closed; patch not applied', () => {
    expect(staleUnretire.ok).toBe(false)
    expect(errorCode === 'CONCURRENCY_CONFLICT' || errorCode === 'OCC_MISMATCH').toBe(true)
    // staleUnretire.applied == false
    expect(staleUnretire.ok).toBe(false)
    // route still retired with the post-concurrent retiredAt
    expect(afterEvidence?.geometryStatus).toBe('retired')
    expect(afterEvidence?.retiredAtMs).toEqual(currentRetiredAtMs)
    expect(afterEvidence?.retiredAt).not.toBeNull()
  })
})
