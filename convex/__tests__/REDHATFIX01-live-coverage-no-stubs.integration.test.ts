/**
 * REDHAT-FIX-01 AC-1 / TC-1: Live coverageReport never hardcodes (isDone=true, totalCostUSD=0).
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
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-01/evidence')

const CLERK_USER = 's4t5-redhatfix01-live'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:redhatfix01-live'
const ROUTE_COUNT = 4

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

describe('REDHAT-FIX-01 AC-1: live coverageReport does not hardcode isDone/totalCostUSD stub', () => {
  let liveReport: any
  let unscopedReport: any
  let routeIds: string[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Seed unresolved residual pool (scan-not-batch fixture)
    const seed = runConvexFn(
      'curatedGeometry:seedS5T1CostStopPool',
      { count: ROUTE_COUNT, prefix: PREFIX, runId: 'redhatfix01-live-scan-without-run' },
      { identity: true },
    )
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    routeIds = JSON.parse(seed.stdout).routeIds as string[]
    expect(routeIds.length).toBe(ROUTE_COUNT)

    // Live path with routeIds scope (no bound full-batch runId)
    const scoped = runConvexFn('curatedGeometry:coverageReport', { routeIds }, { identity: true })
    expect(scoped.ok, `scoped coverageReport failed: ${scoped.stderr}\n${scoped.stdout}`).toBe(true)
    liveReport = JSON.parse(scoped.stdout)

    // Unscoped live path (catalog point-in-time scan)
    const unscoped = runConvexFn('curatedGeometry:coverageReport', {}, { identity: true })
    expect(
      unscoped.ok,
      `unscoped coverageReport failed: ${unscoped.stderr}\n${unscoped.stdout}`,
    ).toBe(true)
    unscopedReport = JSON.parse(unscoped.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-live-coverage-no-stubs.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          routeIds,
          liveReport,
          unscopedReport,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { prefixes: [PREFIX], runIds: ['redhatfix01-live-scan-without-run'] },
      { identity: true },
    )
  })

  it('TC-1: MUST_NOT_OBSERVE isDone==true && totalCostUSD==0 on live/unbound coverageReport', () => {
    expect(liveReport).toBeTruthy()
    expect(liveReport.source === 'live' || liveReport.source === 'persisted').toBe(true)
    expect(typeof liveReport.terminalStates?.unresolved === 'number').toBe(true)
    expect(liveReport.terminalStates.unresolved).toBeGreaterThanOrEqual(0)

    // Forbidden completed-batch stub pair
    expect(liveReport.isDone === true && liveReport.totalCostUSD === 0).toBe(false)

    // Unscoped catalog scan must not invent a zero-cost completed batch either
    expect(unscopedReport.source === 'live' || unscopedReport.source === 'persisted').toBe(true)
    expect(unscopedReport.isDone === true && unscopedReport.totalCostUSD === 0).toBe(false)

    // Live scan with residual unresolved must not claim batch completeness
    if (liveReport.source === 'live') {
      expect(liveReport.isDone).not.toBe(true)
    }
  })
})
