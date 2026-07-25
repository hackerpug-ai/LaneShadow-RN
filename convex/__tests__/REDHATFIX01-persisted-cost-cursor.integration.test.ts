/**
 * REDHAT-FIX-01 AC-2 / TC-2: Persisted runId coverageReport returns real cost + cursor.
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

const CLERK_USER = 's4t5-redhatfix01-cost'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:redhatfix01-cost'
const RUN_ID = `redhatfix01-cost-stop-${Date.now()}`
const ROUTE_COUNT = 12
const MAX_COST = 0.5
const COST_PER = 0.07

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

function ensureCouchPass(): void {
  runConvexFn('couchSampleAssembler:seedCouchFixturesPublic', {}, { identity: true })
  let assemble = runConvexFn(
    'couchSampleAssembler:assembleCouchSample',
    { targetSize: 25 },
    { identity: true },
  )
  if (!assemble.ok) {
    runConvexFn('couchSampleAssembler:seedCouchFixturesPublic', {}, { identity: true })
    assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
  }
  expect(assemble.ok, `assemble: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
  const sample = JSON.parse(assemble.stdout)
  runConvexFn(
    'couchVerdict:activateCouchManifest',
    { sampleId: sample.sampleId, reason: 'redhatfix01-cost-stop' },
    { identity: true },
  )
  const verdict = runConvexFn(
    'couchVerdict:recordCouchVerdict',
    {
      sampleId: sample.sampleId,
      overallVerdict: 'pass',
      routeVerdicts: (sample.routes ?? []).map((r: any) => ({
        routeId: r.routeId,
        verdict: 'true',
      })),
    },
    { identity: true },
  )
  expect(verdict.ok, `pass verdict: ${verdict.stderr}`).toBe(true)
}

describe('REDHAT-FIX-01 AC-2: persisted runId report returns real cost and cursor', () => {
  let batchResult: any
  let report: any
  let routeIds: string[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    ensureCouchPass()

    const seed = runConvexFn(
      'curatedGeometry:seedS5T1CostStopPool',
      { count: ROUTE_COUNT, prefix: PREFIX, runId: RUN_ID },
      { identity: true },
    )
    expect(seed.ok, `seed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    routeIds = JSON.parse(seed.stdout).routeIds as string[]

    const batch = runConvexFn(
      'waterfallOrchestrator:runFullBatchWithSeams',
      {
        routeIds,
        maxCost: MAX_COST,
        runId: RUN_ID,
        costPerReconstruct: COST_PER,
        lever2FixedGeometry: {
          routedMiles: 41,
          pointCount: 80,
          anchorCount: 2,
          claimedMiles: 41,
        },
        skipSleep: true,
      },
      { identity: true },
    )
    expect(batch.ok, `runFullBatchWithSeams failed: ${batch.stderr}\n${batch.stdout}`).toBe(true)
    batchResult = JSON.parse(batch.stdout)

    const rep = runConvexFn('curatedGeometry:coverageReport', { runId: RUN_ID }, { identity: true })
    expect(rep.ok, `coverageReport: ${rep.stderr}\n${rep.stdout}`).toBe(true)
    report = JSON.parse(rep.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-persisted-cost-cursor.json'),
      JSON.stringify(
        { capturedAt: new Date().toISOString(), RUN_ID, batchResult, report },
        null,
        2,
      ),
    )
  }, 360_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { prefixes: [PREFIX], runIds: [RUN_ID] },
      { identity: true },
    )
  })

  it('TC-2: coverageReport(runId) has totalCostUSD>0, source=persisted, isDone=false, continueCursor', () => {
    expect(report.source).toBe('persisted')
    expect(report.totalCostUSD).toBeGreaterThan(0)
    expect(report.isDone).toBe(false)
    expect(typeof report.continueCursor).toBe('string')
    expect(report.continueCursor.length).toBeGreaterThanOrEqual(1)

    const pageOrCumulative =
      (typeof batchResult.pageCostUSD === 'number' && batchResult.pageCostUSD > 0) ||
      (typeof batchResult.cumulativeCostUSD === 'number' && batchResult.cumulativeCostUSD > 0) ||
      (typeof batchResult.totalCostUSD === 'number' && batchResult.totalCostUSD > 0)
    expect(pageOrCumulative).toBe(true)

    // Consistency: partial page must not claim done while cursor remains
    expect(report.isDone === true && report.continueCursor?.length >= 1).toBe(false)
    expect(report.continueCursor == null && report.isDone === false).toBe(false)
  })
})
