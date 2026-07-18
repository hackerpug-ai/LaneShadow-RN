/**
 * AC-5: couchGateStatus blocks --all batch until couch verdict = pass.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real couchGateStatus block)
 * FLOW_REF: UC-VER-05
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T6/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t6-couch-gate-block',
  issuer: 'https://laneshadow.test',
})

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

describe('AC-5: couchGateStatus blocks --all until couch pass', () => {
  let sample: any
  let blocked: RunResult
  let unblocked: RunResult
  let gateBefore: any
  let gateAfter: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    // Ensure clean gate state
    runConvexFn('couchVerdict:clearCouchVerdicts', {}, { identity: true })

    const seed = runConvexFn('couchSampleAssembler:seedCouchFixtures', {}, { identity: true })
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    // Seed a tiny all-batch fixture route set for waterfall --all
    const allSeed = runConvexFn('couchVerdict:seedAllBatchFixtures', {}, { identity: true })
    expect(allSeed.ok, `seedAllBatchFixtures failed: ${allSeed.stderr}\n${allSeed.stdout}`).toBe(
      true,
    )

    // --all BEFORE couch pass → blocked
    blocked = runConvexFn(
      'couchVerdict:runAllWaterfall',
      { routeIds: ['test:couch-all-001'] },
      { identity: true },
    )

    const gateB = runConvexFn('couchVerdict:couchGateStatus', {}, { identity: true })
    gateBefore = gateB.ok ? JSON.parse(gateB.stdout) : null

    // Assemble + record pass
    const assemble = runConvexFn(
      'couchSampleAssembler:assembleCouchSample',
      { targetSize: 25 },
      { identity: true },
    )
    expect(assemble.ok, `assemble failed: ${assemble.stderr}\n${assemble.stdout}`).toBe(true)
    sample = JSON.parse(assemble.stdout)

    const routeVerdicts = (sample.routes ?? []).map((r: any) => ({
      routeId: r.routeId,
      verdict: 'true' as const,
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

    const gateA = runConvexFn('couchVerdict:couchGateStatus', {}, { identity: true })
    gateAfter = gateA.ok ? JSON.parse(gateA.stdout) : null

    // --all AFTER couch pass → allowed
    unblocked = runConvexFn(
      'couchVerdict:runAllWaterfall',
      { routeIds: ['test:couch-all-001'] },
      { identity: true },
    )

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-5-couch-gate-block-all.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          blocked: {
            ok: blocked.ok,
            exitCode: blocked.exitCode,
            stdout: blocked.stdout.slice(0, 2000),
            stderr: blocked.stderr.slice(0, 2000),
          },
          unblocked: {
            ok: unblocked.ok,
            exitCode: unblocked.exitCode,
            stdout: unblocked.stdout.slice(0, 2000),
            stderr: unblocked.stderr.slice(0, 2000),
          },
          gateBefore,
          gateAfter,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('couchVerdict:clearCouchVerdicts', {}, { identity: true })
    runConvexFn('couchVerdict:teardownAllBatchFixtures', {}, { identity: true })
    runConvexFn('couchSampleAssembler:teardownCouchFixtures', {}, { identity: true })
  })

  // TC-5 CASE 1 — couch-gate-block-all
  it('MUST_OBSERVE: --all exitCode != 0 before couch pass (blocked)', () => {
    expect(blocked.ok).toBe(false)
    expect(blocked.exitCode).not.toBe(0)
    const blob = `${blocked.stdout}\n${blocked.stderr}`
    expect(blob.toLowerCase()).toMatch(/couch|gate|blocked|verdict/)
  })

  it('MUST_OBSERVE: --all exitCode == 0 after couch pass (unblocked)', () => {
    expect(unblocked.ok, `unblocked run failed: ${unblocked.stderr}\n${unblocked.stdout}`).toBe(
      true,
    )
    expect(unblocked.exitCode).toBe(0)
  })

  it('MUST_NOT_OBSERVE: --all runs before pass', () => {
    expect(gateBefore?.allowed).toBe(false)
    expect(gateAfter?.allowed).toBe(true)
    expect(gateAfter?.overallVerdict).toBe('pass')
  })
})
