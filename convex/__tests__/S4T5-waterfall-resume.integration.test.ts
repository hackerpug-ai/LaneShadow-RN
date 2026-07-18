/**
 * AC-2: Waterfall is resumable — skips already-PASSed routes on restart.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real resumable waterfall)
 * FLOW_REF: UC-REC-04
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-waterfall-resume',
  issuer: 'https://laneshadow.test',
})

const PREFIX = 'test:s4t5-passed'
const COUNT = 100

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

describe('AC-2: Waterfall resume skips already-PASSed routes', () => {
  let resumeResult: any
  let routeIds: string[] = []

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn(
      'waterfallOrchestrator:seedPassedSampleRoutes',
      { count: COUNT, prefix: PREFIX },
      { identity: true },
    )
    expect(seed.ok, `seedPassedSampleRoutes failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)
    const seeded = JSON.parse(seed.stdout)
    routeIds = seeded.seeded as string[]
    expect(routeIds.length).toBe(COUNT)

    // "Restart" waterfall over the same sample — all should be skipped
    const run = runConvexFn(
      'waterfallOrchestrator:runSampleWaterfall',
      { routeIds, maxCost: 10 },
      { identity: true },
    )
    expect(run.ok, `runSampleWaterfall failed: ${run.stderr}\n${run.stdout}`).toBe(true)
    resumeResult = JSON.parse(run.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-2-resume-skip-passed.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          seededCount: COUNT,
          resumeResult,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn(
      'waterfallOrchestrator:teardownWaterfallFixtures',
      { prefixes: [PREFIX] },
      { identity: true },
    )
  })

  it('TC-2 MUST_OBSERVE: skipped count == 100, reprocessed count == 0', () => {
    expect(resumeResult.skipped).toBe(COUNT)
    expect(resumeResult.reprocessed).toBe(0)
    expect(resumeResult.processed).toBe(0)
  })

  it('MUST_NOT_OBSERVE: reprocessed count > 0', () => {
    expect(resumeResult.reprocessed).toBe(0)
    const anyReprocessed = (resumeResult.routes ?? []).some((r: any) => r.reprocessed === true)
    expect(anyReprocessed).toBe(false)
  })
})
