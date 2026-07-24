/**
 * AC-1: --all is couch-gated and produces a real coverageReport.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-REC-04 / T-REC-017 / T-REC-019
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S5-T1/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-s5t1-all-batch',
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:s5t1-gate'
const RUN_ID = 's5t1-real-batch-gate-fixture'

interface RunResult {
  ok: boolean
  stdout: string
  stderr: string
  exitCode: number
}

function execNpx(cmd: string[]): RunResult {
  try {
    const stdout = execFileSync('npx', cmd, {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
      timeout: 300000,
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    return { ok: true, stdout, stderr: '', exitCode: 0 }
  } catch (err: any) {
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    const exitCode = typeof err.status === 'number' ? err.status : 1
    return { ok: false, stdout, stderr, exitCode }
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

describe('AC-1: --all couch-gated + coverageReport contract', () => {
  let unrecordedRun: RunResult
  let failRun: RunResult
  let passRun: RunResult
  let passResult: any
  let preRoute: any
  let postUnrecordedRoute: any
  let postFailRoute: any
  let routeIds: string[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t5-s5t1-all-batch', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Seed gate pool (unresolved routes for full-batch)
    const seed = runConvexFn(
      'curatedGeometry:seedS5T1GateBatch',
      { prefix: PREFIX, count: 4, runId: RUN_ID },
      { identity: true },
    )
    expect(seed.ok, `seedS5T1GateBatch failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    const seeded = parseJson(seed.stdout)
    routeIds = seeded?.routeIds ?? []
    expect(routeIds.length).toBeGreaterThanOrEqual(2)

    const pre = runConvexFn(
      'curatedGeometry:getS5T1RouteSnapshot',
      { routeIds },
      { identity: true },
    )
    preRoute = parseJson(pre.stdout)

    // --- unrecorded: clear gate ---
    runConvexFn('couchVerdict:clearCouchVerdictsPublic', {}, { identity: true })
    runConvexFn('couchVerdict:clearCouchManifestActivations', {}, { identity: true })

    unrecordedRun = runConvexFn(
      'waterfallOrchestrator:runFullBatchWithSeams',
      {
        routeIds,
        maxCost: 0.5,
        runId: `${RUN_ID}-unrecorded`,
        costPerReconstruct: 0.07,
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

    const postU = runConvexFn(
      'curatedGeometry:getS5T1RouteSnapshot',
      { routeIds },
      { identity: true },
    )
    postUnrecordedRoute = parseJson(postU.stdout)

    // --- fail: assemble + activate + fail verdict ---
    let assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    // Seed fixtures if assemble needs them
    if (!assemble.ok) {
      runConvexFn('couchSampleAssembler:seedCouchFixturesPublic', {}, { identity: true })
      assemble = runConvexFn(
        'couchSampleAssembler:assembleCouchSample',
        { targetSize: 25 },
        { identity: true },
      )
      expect(assemble.ok, `assemble failed: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
    }
    const sample = parseJson(assemble.stdout)

    runConvexFn(
      'couchVerdict:activateCouchManifest',
      { sampleId: sample.sampleId, reason: 's5t1-gate-fail' },
      { identity: true },
    )
    const failVerdict = runConvexFn(
      'couchVerdict:recordCouchVerdict',
      {
        sampleId: sample.sampleId,
        overallVerdict: 'fail',
        routeVerdicts: (sample.routes ?? []).map((r: any) => ({
          routeId: r.routeId,
          verdict: 'wrong',
        })),
      },
      { identity: true },
    )
    expect(failVerdict.ok, `fail verdict: ${failVerdict.stderr}`).toBe(true)

    failRun = runConvexFn(
      'waterfallOrchestrator:runFullBatchWithSeams',
      {
        routeIds,
        maxCost: 0.5,
        runId: `${RUN_ID}-fail`,
        costPerReconstruct: 0.07,
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

    const postF = runConvexFn(
      'curatedGeometry:getS5T1RouteSnapshot',
      { routeIds },
      { identity: true },
    )
    postFailRoute = parseJson(postF.stdout)

    // --- pass: record pass and run bounded batch ---
    const passVerdict = runConvexFn(
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
    expect(passVerdict.ok, `pass verdict: ${passVerdict.stderr}`).toBe(true)

    passRun = runConvexFn(
      'waterfallOrchestrator:runFullBatchWithSeams',
      {
        routeIds,
        maxCost: 0.15,
        runId: RUN_ID,
        costPerReconstruct: 0.07,
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
    expect(passRun.ok, `pass run failed: ${passRun.stderr}\n${passRun.stdout}`).toBe(true)
    passResult = parseJson(passRun.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-all-batch-gate-report.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          routeIds,
          unrecorded: {
            ok: unrecordedRun.ok,
            exitCode: unrecordedRun.exitCode,
            blob: `${unrecordedRun.stdout}\n${unrecordedRun.stderr}`.slice(0, 2000),
          },
          fail: {
            ok: failRun.ok,
            exitCode: failRun.exitCode,
            blob: `${failRun.stdout}\n${failRun.stderr}`.slice(0, 2000),
          },
          pass: passResult,
          preRoute,
          postUnrecordedRoute,
          postFailRoute,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { prefixes: [PREFIX], runIds: [RUN_ID, `${RUN_ID}-unrecorded`, `${RUN_ID}-fail`] },
      { identity: true },
    )
  })

  it('MUST_OBSERVE: unrecorded couch gate refuses with routesMutated==0', () => {
    expect(unrecordedRun.ok).toBe(false)
    const blob = `${unrecordedRun.stdout}\n${unrecordedRun.stderr}`.toLowerCase()
    expect(blob).toMatch(/couch|gate|blocked|verdict/)
    for (const r of postUnrecordedRoute?.routes ?? []) {
      expect(['generated', 'review', 'retired']).not.toContain(r.geometryStatus)
      expect(r.riderReady).not.toBe(true)
    }
  })

  it('MUST_OBSERVE: fail couch gate refuses with routesMutated==0', () => {
    expect(failRun.ok).toBe(false)
    const blob = `${failRun.stdout}\n${failRun.stderr}`.toLowerCase()
    expect(blob).toMatch(/couch|gate|blocked|verdict|fail/)
    for (const r of postFailRoute?.routes ?? []) {
      expect(['generated', 'review', 'retired']).not.toContain(r.geometryStatus)
    }
  })

  it('MUST_OBSERVE: pass run returns coverageReport with cost, cursor, levers, terminals, provenance, riderReady', () => {
    expect(passResult).toBeTruthy()
    expect(passResult.coverageReport).toBeTruthy()
    const report = passResult.coverageReport
    expect(typeof passResult.totalCostUSD).toBe('number')
    expect(passResult.totalCostUSD).toBeGreaterThan(0)
    expect(typeof passResult.continueCursor).toBe('string')
    expect(passResult.continueCursor.length).toBeGreaterThanOrEqual(1)
    expect(Array.isArray(report.levers)).toBe(true)
    expect(report.levers.length).toBeGreaterThanOrEqual(1)
    for (const lever of report.levers) {
      expect(typeof lever.passRate === 'number' || typeof lever.realizedRate === 'number').toBe(
        true,
      )
    }
    expect(report.terminalStates).toBeTruthy()
    expect(report.provenanceCounts).toBeTruthy()
    expect(typeof report.riderReadyCount).toBe('number')
    expect(report.riderReadyCount).toBeGreaterThanOrEqual(0)
  })

  it('MUST_NOT_OBSERVE: empty/hard-coded report without cursor or cost after PASS', () => {
    expect(passResult.totalCostUSD).not.toBeNull()
    expect(passResult.continueCursor).not.toBe('')
    expect(passResult.coverageReport).not.toEqual({})
    expect(passResult.coverageReport.levers?.length ?? 0).toBeGreaterThan(0)
  })
})
