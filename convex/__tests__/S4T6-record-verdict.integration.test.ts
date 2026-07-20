/**
 * AC-4: recordCouchVerdict accepts per-route verdicts (true/off/wrong)
 * + overall pass/fail and persists them.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real recordCouchVerdict mutation)
 * FLOW_REF: UC-VER-05
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t6-record-verdict',
  issuer: 'https://laneshadow.test',
})

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
    const stdout = typeof err.stdout === 'string' ? err.stdout : ''
    const stderr = typeof err.stderr === 'string' ? err.stderr : ''
    return { ok: false, stdout, stderr }
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

describe('AC-4: recordCouchVerdict persists per-route + overall verdicts', () => {
  let sample: any
  let recorded: any
  let queried: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    // FIX-08: Set up founder user for test identity
    const setup = runConvexFn(
      'testSupport:devSetupFounderUser',
      { clerkUserId: 's4t6-record-verdict', role: 'founder' },
      { identity: true },
    )
    expect(setup.ok, `devSetupFounderUser failed: ${setup.stderr}`).toBe(true)

    // Clear any prior pass so gate tests stay independent
    runConvexFn('couchVerdict:clearCouchVerdictsPublic', {}, { identity: true })

    const seed = runConvexFn('couchSampleAssembler:seedCouchFixturesPublic', {}, { identity: true })
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    const assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    expect(assemble.ok, `assemble failed: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
    sample = JSON.parse(assemble.stdout)

    const routeVerdicts = (sample.routes ?? []).map((r: any, i: number) => ({
      routeId: r.routeId,
      // mix of true/off; no wrong so overall pass is allowed
      verdict: i % 7 === 0 ? 'off' : 'true',
    }))

    const record = runConvexFn(
      'couchVerdict:recordCouchVerdict',
      {
        sampleId: sample.sampleId,
        overallVerdict: 'pass',
        routeVerdicts,
      },
      { identity: true },
    )
    expect(record.ok, `recordCouchVerdict failed: ${record.stderr}\n${record.stdout}`).toBe(true)
    recorded = JSON.parse(record.stdout)

    const q = runConvexFn(
      'couchVerdict:getCouchVerdict',
      { sampleId: sample.sampleId },
      { identity: true },
    )
    expect(q.ok, `getCouchVerdict failed: ${q.stderr}\n${q.stdout}`).toBe(true)
    queried = JSON.parse(q.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-4-record-verdict-pass.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          sampleId: sample.sampleId,
          sampleSize: sample.routes?.length,
          recorded,
          queried,
        },
        null,
        2,
      ),
    )
  }, 180_000)

  afterAll(() => {
    runConvexFn('couchVerdict:clearCouchVerdictsPublic', {}, { identity: true })
    runConvexFn('couchSampleAssembler:teardownCouchFixturesPublic', {}, { identity: true })
  })

  // TC-4 CASE 1 — record-verdict-pass
  it("MUST_OBSERVE: overallVerdict == 'pass'", () => {
    expect(queried.overallVerdict).toBe('pass')
    expect(recorded.overallVerdict).toBe('pass')
  })

  it('MUST_OBSERVE: routeVerdicts count == sample size', () => {
    expect(queried.routeVerdicts?.length).toBe(sample.routes.length)
    expect(recorded.routeVerdicts?.length).toBe(sample.routes.length)
  })

  it('MUST_NOT_OBSERVE: verdict not persisted', () => {
    expect(queried).toBeTruthy()
    expect(queried.sampleId).toBe(sample.sampleId)
    expect(queried.recordedAt).toBeGreaterThan(0)
  })

  it("STRICTLY: single 'wrong' forces overall fail (rejects pass)", () => {
    const withWrong = (sample.routes ?? []).map((r: any, i: number) => ({
      routeId: r.routeId,
      verdict: i === 0 ? 'wrong' : 'true',
    }))

    // FIX-03/04: Create a frozen manifest first for the wrong-test
    const wrongSampleId = `couch-wrong-${Date.now()}`
    const storeWrongSample = runConvexFn(
      'couchSampleAssembler:storeCouchSample',
      { sampleId: wrongSampleId, routes: sample.routes },
      { identity: true },
    )
    expect(
      storeWrongSample.ok,
      `storeCouchSample for wrong test failed: ${storeWrongSample.stderr}`,
    ).toBe(true)

    // Pass + wrong → rejected
    const bad = runConvexFn(
      'couchVerdict:recordCouchVerdict',
      {
        sampleId: wrongSampleId,
        overallVerdict: 'pass',
        routeVerdicts: withWrong,
      },
      { identity: true },
    )
    // Must fail closed: cannot pass with a wrong route
    expect(bad.ok).toBe(false)

    // Explicit fail with wrong is accepted on a DIFFERENT frozen sample
    const failSampleId = `couch-wrong-fail-${Date.now()}`
    const storeFailSample = runConvexFn(
      'couchSampleAssembler:storeCouchSample',
      { sampleId: failSampleId, routes: sample.routes },
      { identity: true },
    )
    expect(
      storeFailSample.ok,
      `storeCouchSample for fail test failed: ${storeFailSample.stderr}`,
    ).toBe(true)

    const forced = runConvexFn(
      'couchVerdict:recordCouchVerdict',
      {
        sampleId: failSampleId,
        overallVerdict: 'fail',
        routeVerdicts: withWrong,
      },
      { identity: true },
    )
    expect(forced.ok, `fail-with-wrong should succeed: ${forced.stderr}`).toBe(true)
    const forcedBody = JSON.parse(forced.stdout)
    expect(forcedBody.overallVerdict).toBe('fail')
  }, 20000)
})
