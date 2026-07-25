/**
 * REDHAT-FIX-01 AC-4 / TC-4: Operator full-batch path leaves cost/cursor/runId transcript.
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

const CLERK_USER = 's4t5-redhatfix01-op'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:redhatfix01-op'
const RUN_ID = `redhatfix01-op-all-${Date.now()}`
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
    { sampleId: sample.sampleId, reason: 'redhatfix01-operator' },
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

describe('REDHAT-FIX-01 AC-4: operator full-batch transcript has runId + positive cost + cursor', () => {
  let transcript: any
  let rawStdout = ''
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

    // Real Convex full-batch driver (same path as --all --waterfall with max-cost)
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
    expect(batch.ok, `full-batch failed: ${batch.stderr}\n${batch.stdout}`).toBe(true)
    rawStdout = batch.stdout
    transcript = JSON.parse(batch.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-operator-all-transcript.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          RUN_ID,
          routeIds,
          transcript,
          rawStdoutLength: rawStdout.length,
        },
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

  it('TC-4: transcript includes runId, positive cost field, isDone=false, non-null continueCursor', () => {
    expect(rawStdout.length).toBeGreaterThan(0)
    expect(typeof transcript.runId).toBe('string')
    expect(transcript.runId.length).toBeGreaterThanOrEqual(1)

    const positiveCost =
      (typeof transcript.totalCostUSD === 'number' && transcript.totalCostUSD > 0) ||
      (typeof transcript.cumulativeCostUSD === 'number' && transcript.cumulativeCostUSD > 0) ||
      (typeof transcript.pageCostUSD === 'number' && transcript.pageCostUSD > 0) ||
      (typeof transcript.totalCostUsd === 'number' && transcript.totalCostUsd > 0)
    expect(positiveCost).toBe(true)

    expect(transcript.isDone).toBe(false)
    expect(typeof transcript.continueCursor).toBe('string')
    expect(transcript.continueCursor.length).toBeGreaterThanOrEqual(1)

    // Forbidden stub pair
    expect(transcript.totalCostUSD === 0 && transcript.isDone === true).toBe(false)
    expect(transcript.continueCursor == null && transcript.isDone === false).toBe(false)
  })
})
