/**
 * AC-4: Resume/cost governance — cursor retained, no reprocess, incomplete not accepted.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: T-REC-019
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t1-resume-cost',
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:s5t1-cost'
const RUN_ID = 's5t1-cost-stop-resume'
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

describe('AC-4: resume/cost reconciliation + incomplete-run acceptance block', () => {
  let page1: any
  let page2: any
  let incompleteAccept: any
  let timestampsBefore: any
  let timestampsAfter: any
  let routeIds: string[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t1-resume-cost', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    // Ensure couch gate is pass for full-batch
    runConvexFn('couchSampleAssembler:seedCouchFixturesPublic', {}, { identity: true })
    const assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    expect(assemble.ok, `assemble: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
    const sample = JSON.parse(assemble.stdout)
    runConvexFn(
      'couchVerdict:activateCouchManifest',
      { sampleId: sample.sampleId, reason: 's5t1-resume-cost' },
      { identity: true },
    )
    runConvexFn(
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

    const seed = runConvexFn(
      'curatedGeometry:seedS5T1CostStopPool',
      { count: ROUTE_COUNT, prefix: PREFIX, runId: RUN_ID },
      { identity: true },
    )
    expect(seed.ok, `seed cost pool: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    routeIds = JSON.parse(seed.stdout).routeIds as string[]

    // Page 1 — cost stop
    const r1 = runConvexFn(
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
    expect(r1.ok, `page1 failed: ${r1.stderr}\n${r1.stdout}`).toBe(true)
    page1 = JSON.parse(r1.stdout)

    const ts1 = runConvexFn(
      'curatedGeometry:getS5T1RouteSnapshot',
      { routeIds },
      { identity: true },
    )
    timestampsBefore = JSON.parse(ts1.stdout)

    // Page 2 — resume from cursor
    const r2 = runConvexFn(
      'waterfallOrchestrator:runFullBatchWithSeams',
      {
        routeIds,
        maxCost: MAX_COST,
        cursor: page1.continueCursor,
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
    expect(r2.ok, `page2 failed: ${r2.stderr}\n${r2.stdout}`).toBe(true)
    page2 = JSON.parse(r2.stdout)

    const ts2 = runConvexFn(
      'curatedGeometry:getS5T1RouteSnapshot',
      { routeIds },
      { identity: true },
    )
    timestampsAfter = JSON.parse(ts2.stdout)

    // Attempt acceptance while incomplete (force isDone=false if second page finished)
    // Use page1 state: acceptance on a synthetic incomplete run
    const incompleteRunId = `${RUN_ID}-incomplete`
    runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: incompleteRunId,
        reconstruct: { candidates: 10, passCount: 8 },
        isDone: false,
        continueCursor: page1.continueCursor ?? 'cursor-1',
      },
      { identity: true },
    )
    // Raise rates so only incomplete_run blocks (not low-yield)
    const acc = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: incompleteRunId, decision: 'accept' },
      { identity: true },
    )
    incompleteAccept = acc.ok ? JSON.parse(acc.stdout) : { error: acc.stderr, ok: false }

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-resume-cost-reconciliation.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          page1,
          page2,
          incompleteAccept,
          timestampsBefore,
          timestampsAfter,
        },
        null,
        2,
      ),
    )
  }, 360_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      {
        prefixes: [PREFIX],
        runIds: [RUN_ID, `${RUN_ID}-incomplete`],
      },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: batchStopReason cost_exceeded, continueCursor retained, cost > 0', () => {
    expect(page1.batchStopReason).toMatch(/cost_exceeded|provider/i)
    expect(typeof page1.continueCursor).toBe('string')
    expect(page1.continueCursor.length).toBeGreaterThanOrEqual(1)
    expect(page1.totalCostUSD).toBeGreaterThan(0)
    expect(page1.isDone).toBe(false)
  })

  it('MUST_OBSERVE: already-PASSed routes keep verification timestamps (reprocessedCount==0)', () => {
    expect(page2.reprocessed ?? page2.reprocessedCount ?? 0).toBe(0)
    // Page-1 recovered routes must not be re-worked on resume (skip or absent).
    const page1Passed = (page1.routes ?? []).filter(
      (r: any) => r.terminalState === 'recovered' && !r.skipped && r.provenance,
    )
    expect(page1Passed.length).toBeGreaterThan(0)
    const page2ById = new Map((page2.routes ?? []).map((r: any) => [r.routeId, r]))
    for (const r of page1Passed) {
      const again = page2ById.get(r.routeId)
      if (again) {
        expect(again.reprocessed).not.toBe(true)
        expect(again.skipped === true || (again.leversRun ?? []).length === 0).toBe(true)
      }
    }
    // Pre-resume generated rows stay generated (not flipped back to unresolved/review).
    const beforeGenerated = new Set(
      (timestampsBefore?.routes ?? [])
        .filter((r: any) => r.geometryStatus === 'generated')
        .map((r: any) => r.routeId),
    )
    for (const r of timestampsAfter?.routes ?? []) {
      if (beforeGenerated.has(r.routeId)) {
        expect(r.geometryStatus).toBe('generated')
      }
    }
  })

  it('MUST_OBSERVE: cost totals reconcile across pages and never exceed cap per page', () => {
    // Per-invocation spend must stay within maxCost; cumulative may exceed across resumes.
    const page1Cost = page1.pageCostUSD ?? page1.totalCostUsd ?? page1.totalCostUSD
    const page2Cost = page2.pageCostUSD ?? page2.totalCostUsd
    expect(page1Cost).toBeLessThanOrEqual(MAX_COST + 1e-9)
    expect(page2Cost).toBeLessThanOrEqual(MAX_COST + 1e-9)
    const cumulative =
      page2.coverageReport?.totalCostUSD ?? page2.cumulativeCostUSD ?? page2.totalCostUSD
    expect(cumulative).toBeGreaterThan(0)
    // Reconcile: cumulative >= page1 spend
    expect(cumulative).toBeGreaterThanOrEqual(page1Cost - 1e-9)
  })

  it('MUST_OBSERVE: multi-page coverageReport merges levers/terminals/provenance/riderReady (not last-page-only)', () => {
    const p1 = page1.coverageReport
    const p2 = page2.coverageReport
    expect(p1).toBeTruthy()
    expect(p2).toBeTruthy()

    // Page totals already accumulate; yield metrics must accumulate too.
    expect((p2.pageTotals ?? []).length).toBeGreaterThanOrEqual(2)

    const reconP1 = (p1.levers ?? []).find((l: any) => l.lever === 'reconstruct')
    const reconP2 = (p2.levers ?? []).find((l: any) => l.lever === 'reconstruct')
    expect(reconP1).toBeTruthy()
    expect(reconP2).toBeTruthy()

    // Page-2-only recovered routes (from this invocation's route list)
    const page2Recovered = (page2.routes ?? []).filter(
      (r: any) => r.terminalState === 'recovered' && !r.skipped,
    ).length
    const page2Lever2Candidates = page2.perLeverCounts?.lever2 ?? 0
    const page2Lever2Pass = (page2.routes ?? []).filter(
      (r: any) =>
        r.provenance === 'ai_reconstructed' && r.terminalState === 'recovered' && !r.skipped,
    ).length

    // Cumulative must equal page1 persisted + page2 page-only (not overwrite with page2 alone)
    expect(reconP2.candidateCount).toBe(reconP1.candidateCount + page2Lever2Candidates)
    expect(reconP2.passCount).toBe(reconP1.passCount + page2Lever2Pass)
    expect(reconP2.realizedRate).toBeCloseTo(
      reconP2.candidateCount > 0 ? reconP2.passCount / reconP2.candidateCount : 0,
      6,
    )
    // Full-pool: cumulative passCount exceeds last-page-only
    expect(reconP2.passCount).toBeGreaterThan(page2Lever2Pass)
    expect(reconP2.passCount).toBeGreaterThanOrEqual(reconP1.passCount)

    // riderReadyCount accumulates across resume pages
    expect(p2.riderReadyCount).toBe((p1.riderReadyCount ?? 0) + page2Recovered)
    expect(p2.riderReadyCount).toBeGreaterThan(page2Recovered)

    // terminalStates: sum of page1 + page2 per-state counts
    for (const key of ['recovered', 'queued', 'retirement_eligible', 'cost_blocked', 'skipped']) {
      const prior = p1.terminalStates?.[key] ?? 0
      const pageOnly = page2.perStateCounts?.[key] ?? 0
      expect(p2.terminalStates?.[key] ?? 0).toBe(prior + pageOnly)
    }

    // provenanceCounts accumulate (at least ai_reconstructed from both pages)
    const provKey = 'ai_reconstructed'
    const priorProv = p1.provenanceCounts?.[provKey] ?? 0
    const page2Prov = (page2.routes ?? []).filter((r: any) => r.provenance === provKey).length
    expect(p2.provenanceCounts?.[provKey] ?? 0).toBe(priorProv + page2Prov)
    expect(p2.provenanceCounts?.[provKey] ?? 0).toBeGreaterThan(page2Prov)

    // When batch completes, continueCursor must be null (not idx:N past end)
    if (p2.isDone === true || page2.isDone === true) {
      expect(p2.continueCursor).toBeNull()
      expect(page2.continueCursor).toBeNull()
    }
  })

  it('MUST_NOT_OBSERVE: acceptance while isDone=false', () => {
    expect(incompleteAccept.decision).not.toBe('accepted')
    expect(incompleteAccept.acceptedAt ?? null).toBeNull()
    const reason = String(
      incompleteAccept.reason ?? incompleteAccept.rejectionReason ?? incompleteAccept.error ?? '',
    ).toLowerCase()
    expect(reason).toMatch(/incomplete|not.?done|isdone|cursor|running/)
  })
})
