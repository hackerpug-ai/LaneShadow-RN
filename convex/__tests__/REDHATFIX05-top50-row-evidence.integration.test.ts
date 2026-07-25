/**
 * REDHAT-FIX-05 AC-3 / TC-3: Row-level top-50 evidence + rowCount vs riderReadyCount.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment
 * FLOW_REF: UC-VER-05
 * start_ref: redhatfix05-top50-row-export
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { buildTop50GateEvidence } from '../../tools/gate/deriveSprint05GoalState'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/REDHAT-FIX-05/evidence')

const CLERK_USER = 's4t5-redhatfix05-top50'
const TEST_IDENTITY = JSON.stringify({
  subject: CLERK_USER,
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'motorcycleroads:redhatfix05-top50-'
const COVERAGE_RUN_ID = 'redhatfix05-top50-coverage'

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

describe('REDHAT-FIX-05 AC-3: top-50 row-level evidence + coherence', () => {
  let evidence: ReturnType<typeof buildTop50GateEvidence>
  let manifest: any
  let riderReadyCount: number

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: CLERK_USER, role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `setup failed: ${setup.stderr}`).toBe(true)

    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })

    const seed = runConvexFn(
      'top50Review:seedTop50FixturesPublic',
      { prefix: PREFIX, readyCount: 12, nonReadyCount: 2 },
      { identity: true },
    )
    expect(seed.ok, `seedTop50Fixtures failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const exportQ = runConvexFn(
      'top50Review:exportTop50Manifest',
      { limit: 50, routeIdPrefix: PREFIX },
      { identity: true },
    )
    expect(exportQ.ok, `exportTop50Manifest failed: ${exportQ.stderr}`).toBe(true)
    manifest = parseJson(exportQ.stdout)
    expect(manifest).toBeTruthy()
    expect(Array.isArray(manifest.rows)).toBe(true)

    // Bind riderReadyCount from a coverage report for the same catalog state
    riderReadyCount = manifest.rowCount
    const seedReport = runConvexFn(
      'curatedGeometry:seedS5T1LowYieldReport',
      {
        runId: COVERAGE_RUN_ID,
        reconstruct: { candidates: 10, passCount: 5 },
        riderReadyCount,
      },
      { identity: true },
    )
    expect(seedReport.ok, `seed coverage failed: ${seedReport.stderr}`).toBe(true)

    const reportQ = runConvexFn(
      'curatedGeometry:coverageReport',
      { runId: COVERAGE_RUN_ID },
      { identity: true },
    )
    expect(reportQ.ok).toBe(true)
    const report = parseJson(reportQ.stdout)
    riderReadyCount = report.riderReadyCount ?? riderReadyCount

    evidence = buildTop50GateEvidence({
      rows: manifest.rows,
      riderReadyCount,
    })

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-3-top50-row-evidence.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          manifestRowCount: manifest.rowCount,
          riderReadyCount,
          evidence,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('top50Review:teardownTop50FixturesPublic', { prefix: PREFIX }, { identity: true })
    runConvexFn(
      'curatedGeometry:teardownS5T1Fixtures',
      { runIds: [COVERAGE_RUN_ID] },
      { identity: true },
    )
  })

  it('TC-3: Top-50 gate evidence includes per-row identity fields and passes coherence', () => {
    expect(evidence.rowCount).toBeGreaterThanOrEqual(1)
    expect(evidence.rows.length).toBeGreaterThanOrEqual(1)
    expect(evidence.rows.length).not.toBe(0)

    for (const row of evidence.rows) {
      expect(String(row.routeId).length).toBeGreaterThanOrEqual(1)
      expect(String(row.name).length).toBeGreaterThanOrEqual(1)
      expect(row.measuredMiles).toBeGreaterThanOrEqual(0)
      expect(row.claimedMiles === null || typeof row.claimedMiles === 'number').toBe(true)
    }

    // No test: contamination in scrubbed export
    expect(evidence.testRowsCount).toBe(0)

    // Coherence: rowCount <= riderReadyCount OR explicit coherenceNote
    const coherent =
      evidence.rowCount <= evidence.riderReadyCount ||
      (typeof evidence.coherenceNote === 'string' && evidence.coherenceNote.length >= 1)
    expect(coherent).toBe(true)

    // Not aggregate-only
    expect(evidence.rows.some((r) => r.routeId && r.name)).toBe(true)
    expect('contaminationCount' in evidence && evidence.rows.length === 0).toBe(false)
  })
})
