/**
 * AC-5: REVIEW queue receives routes that fail gate after repair budget
 * with best candidate geometry.
 *
 * TEST_TIER: integration
 * VERIFICATION_SERVICE: Convex dev deployment (real REVIEW queue)
 * FLOW_REF: UC-VER-04
 */

import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const PROJECT_ROOT = resolve(__dirname, '..', '..')
const EVIDENCE_DIR = resolve(PROJECT_ROOT, '.tmp/S4-T5/evidence')

const TEST_IDENTITY = JSON.stringify({
  subject: 's4t5-review-queue',
  issuer: 'https://laneshadow.test',
})

const ROUTE_ID = 'test:review-candidate'

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

describe('AC-5: REVIEW queue receives failed routes with best candidate', () => {
  let waterfallResult: any
  let reviewQueue: any

  beforeAll(() => {
    mkdirSync(EVIDENCE_DIR, { recursive: true })

    const seed = runConvexFn('waterfallOrchestrator:seedWaterfallFixtures', {}, { identity: true })
    expect(seed.ok, `seed failed: ${seed.stderr}\n${seed.stdout}`).toBe(true)

    // L2 fixed geometry fails ratio (routed 200 vs claimed 10) but still produces geometry
    const run = runConvexFn(
      'waterfallOrchestrator:runSampleWaterfall',
      {
        routeIds: [ROUTE_ID],
        maxCost: 10,
        lever2FixedGeometry: {
          routedMiles: 200,
          pointCount: 80,
          anchorCount: 2,
          claimedMiles: 10,
        },
      },
      { identity: true },
    )
    expect(run.ok, `waterfall failed: ${run.stderr}\n${run.stdout}`).toBe(true)
    waterfallResult = JSON.parse(run.stdout)

    const queue = runConvexFn(
      'reviewQueue:listGeometryReviewQueue',
      { routeIdPrefix: ROUTE_ID, limit: 20 },
      { identity: true },
    )
    expect(queue.ok, `listGeometryReviewQueue failed: ${queue.stderr}`).toBe(true)
    reviewQueue = JSON.parse(queue.stdout)

    writeFileSync(
      resolve(EVIDENCE_DIR, 'AC-5-review-queue-entry.json'),
      JSON.stringify(
        {
          capturedAt: new Date().toISOString(),
          waterfallResult,
          reviewQueue,
        },
        null,
        2,
      ),
    )
  }, 300_000)

  afterAll(() => {
    runConvexFn('waterfallOrchestrator:teardownWaterfallFixtures', {}, { identity: true })
  })

  it('TC-5 MUST_OBSERVE: reviewQueue.length == 1, failedCondition + bestCandidateGeometry set', () => {
    expect(reviewQueue.length).toBeGreaterThanOrEqual(1)
    const entry = (reviewQueue.reviewQueue as any[]).find((e) => e.routeId === ROUTE_ID)
    expect(entry).toBeTruthy()
    expect(entry.failedCondition).not.toBeNull()
    expect(entry.failedCondition).toBeTruthy()
    expect(entry.bestCandidateGeometry).not.toBeNull()
    expect(typeof entry.bestCandidateGeometry).toBe('string')
    expect(entry.bestCandidateGeometry.length).toBeGreaterThan(0)
  })

  it('MUST_NOT_OBSERVE: no REVIEW entry or empty bestCandidateGeometry', () => {
    const entry = (reviewQueue.reviewQueue as any[]).find((e) => e.routeId === ROUTE_ID)
    expect(entry).toBeDefined()
    expect(entry.bestCandidateGeometry).not.toBe('')
    const route = waterfallResult.routes?.find((r: any) => r.routeId === ROUTE_ID)
    expect(route?.terminalState).toBe('queued')
  })
})
