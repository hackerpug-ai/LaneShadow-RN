/**
 * REDHAT-FIX-01 AC-3 / TC-3: isDone reconciles with batchStopReason + continueCursor.
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

const CLERK_USER = 's4t5-redhatfix01-isdone'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX_PARTIAL = 'test:redhatfix01-part'
const PREFIX_DONE = 'test:redhatfix01-done'
const PARTIAL_RUN = `redhatfix01-partial-${Date.now()}`
const COMPLETED_RUN = `redhatfix01-completed-batch-${Date.now()}`
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
    { sampleId: sample.sampleId, reason: 'redhatfix01-isdone' },
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

describe('REDHAT-FIX-01 AC-3: isDone reconciles with batchStopReason and continueCursor', () => {
  let partial: any
  let completed: any
  let incompleteAccept: any
  let partialIds: string[] = []
  let doneIds: string[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    ensureCouchPass()

    // --- Partial cost-stopped batch via real executeFullBatch ---
    const seedPartial = runConvexFn(
      'curatedGeometry:seedS5T1CostStopPool',
      { count: 12, prefix: PREFIX_PARTIAL, runId: PARTIAL_RUN },
      { identity: true },
    )
    expect(seedPartial.ok, `seed partial: ${seedPartial.stderr}`).toBe(true)
    partialIds = JSON.parse(seedPartial.stdout).routeIds as string[]

    const partialBatch = runConvexFn(
      'waterfallOrchestrator:runFullBatchWithSeams',
      {
        routeIds: partialIds,
        maxCost: 0.5,
        runId: PARTIAL_RUN,
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
    expect(partialBatch.ok, `partial batch: ${partialBatch.stderr}\n${partialBatch.stdout}`).toBe(
      true,
    )

    const partialRep = runConvexFn(
      'curatedGeometry:coverageReport',
      { runId: PARTIAL_RUN },
      { identity: true },
    )
    expect(partialRep.ok).toBe(true)
    partial = JSON.parse(partialRep.stdout)

    // incomplete_run rejection
    const acc = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: PARTIAL_RUN, decision: 'accept' },
      { identity: true },
    )
    incompleteAccept = acc.ok
      ? JSON.parse(acc.stdout)
      : { error: acc.stderr, ok: false, rejectionReason: null }

    // --- Completed batch: small list + high maxCost via real executeFullBatch ---
    const seedDone = runConvexFn(
      'curatedGeometry:seedS5T1CostStopPool',
      { count: 2, prefix: PREFIX_DONE, runId: COMPLETED_RUN },
      { identity: true },
    )
    expect(seedDone.ok, `seed done: ${seedDone.stderr}`).toBe(true)
    doneIds = JSON.parse(seedDone.stdout).routeIds as string[]

    const doneBatch = runConvexFn(
      'waterfallOrchestrator:runFullBatchWithSeams',
      {
        routeIds: doneIds,
        maxCost: 50,
        runId: COMPLETED_RUN,
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
    expect(doneBatch.ok, `done batch: ${doneBatch.stderr}\n${doneBatch.stdout}`).toBe(true)

    const doneRep = runConvexFn(
      'curatedGeometry:coverageReport',
      { runId: COMPLETED_RUN },
      { identity: true },
    )
    expect(doneRep.ok).toBe(true)
    completed = JSON.parse(doneRep.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-isDone-reconcile.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          partial,
          completed,
          incompleteAccept,
          partialIds,
          doneIds,
        },
        null,
        2,
      ),
    )
  }, 420_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      {
        prefixes: [PREFIX_PARTIAL, PREFIX_DONE],
        runIds: [PARTIAL_RUN, COMPLETED_RUN],
      },
      { identity: true },
    )
  })

  it('TC-3: partial isDone=false+cursor; completed isDone=true+null cursor+completed stop; incomplete_run rejects', () => {
    // Partial
    expect(partial.source).toBe('persisted')
    expect(partial.isDone).toBe(false)
    expect(typeof partial.continueCursor).toBe('string')
    expect(partial.continueCursor.length).toBeGreaterThanOrEqual(1)
    expect(partial.batchStopReason).toMatch(/cost_exceeded|provider/i)
    expect(partial.isDone === true && partial.continueCursor?.length >= 1).toBe(false)

    // Completed
    expect(completed.source).toBe('persisted')
    expect(completed.isDone).toBe(true)
    expect(completed.continueCursor).toBeNull()
    expect(completed.batchStopReason).toBe('completed')
    expect(completed.batchStopReason == null && completed.isDone === true).toBe(false)
    // Cost not forced to zero on completed multi-route batch (2 routes, lever2 burns cost)
    expect(completed.totalCostUSD).toBeGreaterThan(0)

    // Incomplete run cannot be accepted
    expect(incompleteAccept.rejectionReason ?? incompleteAccept.reason).toMatch(/incomplete_run/)
  })
})
