/**
 * REDHAT-FIX-02 AC-1 / TC-1: Acceptance binds to the same coverage_report runId.
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
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-02/evidence')

const CLERK_USER = 's4t5-redhatfix02-bind'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

/** Unique non-10 lever counts so binding cannot be a hardcoded 10/10/10 fixture. */
const RUN_ID = `redhatfix02-real-batch-${Date.now()}`
const LEVER_COUNTS = {
  scraped_promoted: { candidates: 7, passCount: 4 },
  ai_reconstructed: { candidates: 17, passCount: 12 },
  name_routed: { candidates: 11, passCount: 6 },
}

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
      env: {
        ...process.env,
        CONVEX_DEPLOYMENT: process.env.CONVEX_DEPLOYMENT ?? 'dev:quirky-panther-164',
      },
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

describe('REDHAT-FIX-02 AC-1: acceptance binds to coverage_report runId', () => {
  let report: any
  let acceptResult: any
  let acceptance: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}\n${setup.stdout}`).toBe(true)

    // Provenanced full-batch-shaped report (public_api seed for fixture redhatfix02-real-batch-report)
    const seed = runConvexFn(
      'curatedGeometry:seedProvenancedCoverageReport',
      {
        runId: RUN_ID,
        isDone: true,
        totalCostUSD: 2.5,
        levers: LEVER_COUNTS,
      },
      { identity: true },
    )
    expect(seed.ok, `seedProvenancedCoverageReport failed: ${seed.stderr}\n${seed.stdout}`).toBe(
      true,
    )

    const rep = runConvexFn('curatedGeometry:coverageReport', { runId: RUN_ID }, { identity: true })
    expect(rep.ok, `coverageReport failed: ${rep.stderr}\n${rep.stdout}`).toBe(true)
    report = parseJson(rep.stdout)

    const accept = runConvexFn(
      'curatedGeometry:requestBatchAcceptance',
      { runId: RUN_ID, decision: 'accept' },
      { identity: true },
    )
    expect(accept.ok, `requestBatchAcceptance failed: ${accept.stderr}\n${accept.stdout}`).toBe(
      true,
    )
    acceptResult = parseJson(accept.stdout)

    const q = runConvexFn(
      'curatedGeometry:getBatchAcceptance',
      { runId: RUN_ID },
      { identity: true },
    )
    expect(q.ok, `getBatchAcceptance failed: ${q.stderr}\n${q.stdout}`).toBe(true)
    acceptance = parseJson(q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-1-runId-binding.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          RUN_ID,
          LEVER_COUNTS,
          report,
          acceptResult,
          acceptance,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('curatedGeometry:teardownS5T1Fixtures', { runIds: [RUN_ID] }, { identity: true })
  })

  it('TC-1: acceptance.runId and observedRates match the bound coverage_report', () => {
    expect(report).toBeTruthy()
    expect(report.runId).toBe(RUN_ID)
    expect(report.isDone).toBe(true)
    // Provenance must be present on the founder-read report path
    expect(
      report.reportProvenance?.producedBy ?? report.reportProvenance?.sourceRunKind,
    ).toBeTruthy()
    const produced = String(
      report.reportProvenance?.producedBy ?? report.reportProvenance?.sourceRunKind ?? '',
    )
    expect(produced.includes('runFullBatch') || produced.includes('persistCoverageReport')).toBe(
      true,
    )

    expect(acceptance).toBeTruthy()
    expect(acceptance.runId).toBe(RUN_ID)
    expect(acceptResult.runId).toBe(RUN_ID)

    const decision = acceptance.decision ?? acceptResult.decision
    expect(['accepted', 'rejected', 'escalation_required']).toContain(decision)
    expect(decision).not.toBeNull()

    const observed = acceptance.observedRates ?? acceptResult.observedRates
    expect(Array.isArray(observed)).toBe(true)
    expect(observed.length).toBeGreaterThanOrEqual(1)

    const reportLevers: any[] = report.levers ?? []
    expect(reportLevers.length).toBeGreaterThanOrEqual(1)

    for (let i = 0; i < reportLevers.length; i++) {
      const reportCount = reportLevers[i].candidateCount
      const obs = observed.find((o: any) => o.lever === reportLevers[i].lever) ?? observed[i]
      expect(obs?.candidateCount).toBe(reportCount)
      // Negative control: not the hardcoded 10/10/10 seed shape when report differs
      if (reportCount !== 10) {
        expect(obs?.candidateCount).not.toBe(10)
      }
    }

    // Explicit unique counts from fixture
    const recon =
      observed.find((o: any) => o.lever === 'reconstruct' || o.provenance === 'ai_reconstructed') ??
      null
    expect(recon?.candidateCount).toBe(17)
  })
})
